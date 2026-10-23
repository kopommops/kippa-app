from __future__ import annotations
from collections import defaultdict
from datetime import date, datetime, timedelta
from statistics import median
from sqlalchemy import select
from sqlalchemy.orm import Session
from .config import settings
from .forecasting import forecast_daily, signal_quality
from .models import Persona, Transaction


def get_persona_or_none(db: Session, persona_id: str) -> Persona | None:
    return db.get(Persona, persona_id)


def _get_transactions(db: Session, persona_id: str) -> list[Transaction]:
    return list(db.scalars(
        select(Transaction).where(Transaction.persona_id == persona_id).order_by(Transaction.occurred_at.asc(), Transaction.id.asc())
    ))


def _daily_ledger(transactions: list[Transaction]) -> tuple[list[date], list[float], list[float]]:
    if not transactions:
        today = datetime.now().date()
        return [today], [0.0], [0.0]
    grouped_income: dict[date, float] = defaultdict(float)
    grouped_expenses: dict[date, float] = defaultdict(float)
    for transaction in transactions:
        day = transaction.occurred_at.date()
        if transaction.kind == "income":
            grouped_income[day] += transaction.amount
        else:
            grouped_expenses[day] += transaction.amount
    first = min(grouped_income.keys() | grouped_expenses.keys())
    last = max(grouped_income.keys() | grouped_expenses.keys())
    dates: list[date] = []
    income: list[float] = []
    expenses: list[float] = []
    current = first
    while current <= last:
        dates.append(current)
        income.append(grouped_income[current])
        expenses.append(grouped_expenses[current])
        current += timedelta(days=1)
    return dates, income, expenses


def _weekly_history(dates: list[date], incomes: list[float], expenses: list[float]) -> list[dict]:
    buckets: dict[tuple[int, int], dict] = {}
    for day, income, expense in zip(dates, incomes, expenses):
        iso = day.isocalendar()
        key = (iso.year, iso.week)
        if key not in buckets:
            buckets[key] = {"start": day - timedelta(days=day.weekday()), "income": 0.0, "expenses": 0.0}
        buckets[key]["income"] += income
        buckets[key]["expenses"] += expense
    ordered = sorted(buckets.values(), key=lambda item: item["start"])[-8:]
    return [
        {"week_label": item["start"].strftime("%d %b"), "income": round(item["income"], 2), "expenses": round(item["expenses"], 2)}
        for item in ordered
    ]


def build_dashboard(db: Session, persona: Persona) -> dict:
    transactions = _get_transactions(db, persona.id)
    dates, daily_income, daily_expenses = _daily_ledger(transactions)
    today = datetime.now().date()
    # Forecast from the end of the stored ledger. Demo data is seeded up to today.
    last_date = max(dates[-1], today)
    # Pad no-transaction days through today so the forecast anchor is correct.
    if dates[-1] < last_date:
        cursor = dates[-1] + timedelta(days=1)
        while cursor <= last_date:
            dates.append(cursor); daily_income.append(0.0); daily_expenses.append(0.0)
            cursor += timedelta(days=1)

    balance = persona.opening_balance + sum(daily_income) - sum(daily_expenses)
    base_income_daily = forecast_daily(daily_income, last_date, 7)
    expense_daily = forecast_daily(daily_expenses, last_date, 7)
    baseline_income = sum(base_income_daily)
    projected_expenses = sum(expense_daily)
    stress_factor = 0.55 if persona.scenario_active else 1.0
    projected_income = baseline_income * stress_factor
    base_end = balance + baseline_income - projected_expenses
    stress_end = balance + baseline_income * 0.55 - projected_expenses
    projected_end = stress_end if persona.scenario_active else base_end

    # Conservative heuristic: observed weekly inflow variability sets a cautious lower bound.
    history = _weekly_history(dates, daily_income, daily_expenses)
    week_income = [float(item["income"]) for item in history]
    recent_income = week_income[-6:]
    weekly_median = median(recent_income) if recent_income else 0.0
    income_floor_base = min(baseline_income, max(0.0, weekly_median * 0.60))
    income_floor = income_floor_base * stress_factor
    reserve_floor = max(
        (median([float(item["expenses"]) for item in history[-4:]]) if history else 0.0) * 0.75,
        max(0.0, balance) * 0.12,
    )
    lower_bound_end = balance + income_floor - projected_expenses
    buffer_estimate = max(0.0, min(max(0.0, balance) * 0.20, lower_bound_end - reserve_floor))
    current_signal = signal_quality(daily_income, len(daily_income))
    shortfall_risk = lower_bound_end < reserve_floor

    forecast_days = []
    running_balance = balance
    for offset in range(7):
        income_value = base_income_daily[offset] * stress_factor
        expense_value = expense_daily[offset]
        running_balance += income_value - expense_value
        target = last_date + timedelta(days=offset + 1)
        forecast_days.append({
            "date": target.isoformat(), "label": target.strftime("%a"),
            "income": round(income_value, 2), "expenses": round(expense_value, 2),
            "closing_balance": round(running_balance, 2),
        })

    last_7_income = sum(v for d, v in zip(dates, daily_income) if d >= today - timedelta(days=6))
    last_7_expenses = sum(v for d, v in zip(dates, daily_expenses) if d >= today - timedelta(days=6))
    if persona.scenario_active:
        insights = [{
            "title": "Your lean-week scenario is active",
            "body": f"With incoming payments reduced by 45%, the projected balance at week-end is {projected_end:,.0f}. The historic transaction feed has not been changed.",
            "tone": "warning" if shortfall_risk else "neutral",
        }]
    elif shortfall_risk:
        insights = [{
            "title": "Protect your essentials first",
            "body": f"The cautious projection falls below your illustrative reserve of {reserve_floor:,.0f}. Consider delaying non-essential spending until the next confirmed payment arrives.",
            "tone": "warning",
        }]
    else:
        insights = [{
            "title": "Keep a little room for a quiet week",
            "body": f"Your current projection stays above the illustrative reserve. A cushion of up to {buffer_estimate:,.0f} is a planning estimate—not available credit.",
            "tone": "positive",
        }]
    if current_signal in ("Limited", "Volatile"):
        insights.append({
            "title": "Income is hard to predict",
            "body": "Recent income varies a lot, so treat the forecast as a rough signal and avoid committing money you have not received.",
            "tone": "neutral",
        })

    recent = sorted(transactions, key=lambda item: (item.occurred_at, item.id), reverse=True)[:8]
    return {
        "persona": persona,
        "currency": settings.currency.upper(),
        "balance": round(balance, 2),
        "income_last_7d": round(last_7_income, 2),
        "expenses_last_7d": round(last_7_expenses, 2),
        "forecast": {
            "model": "Random Forest baseline trained on synthetic daily transactions",
            "signal_quality": current_signal,
            "scenario_active": persona.scenario_active,
            "scenario_assumption": "Income reduced by 45% for the next 7 days" if persona.scenario_active else "Baseline estimate; no stress applied",
            "projected_income_7d": round(projected_income, 2),
            "projected_expenses_7d": round(projected_expenses, 2),
            "projected_end_balance": round(projected_end, 2),
            "baseline_end_balance": round(base_end, 2),
            "stress_end_balance": round(stress_end, 2),
            "lower_bound_end_balance": round(lower_bound_end, 2),
            "reserve_floor": round(reserve_floor, 2),
            "buffer_estimate": round(buffer_estimate, 2),
            "shortfall_risk": shortfall_risk,
            "days": forecast_days,
        },
        "weekly_history": history,
        "insights": insights,
        "recent_transactions": recent,
    }
