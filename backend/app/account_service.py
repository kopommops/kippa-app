from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .models import BusinessProfile, LedgerTransaction, User, utcnow_naive


def money_from_minor(value: int) -> float:
    return float(Decimal(value) / Decimal(100))


def normalise_datetime(value: datetime | None) -> datetime:
    if value is None:
        return utcnow_naive()
    if value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


def account_transactions(db: Session, user_id: int) -> list[LedgerTransaction]:
    return list(db.scalars(
        select(LedgerTransaction)
        .where(LedgerTransaction.user_id == user_id)
        .order_by(LedgerTransaction.occurred_at.desc(), LedgerTransaction.id.desc())
    ))


def build_account_dashboard(db: Session, user: User) -> dict:
    business: BusinessProfile | None = user.business
    if business is None:
        raise RuntimeError("Account has no business profile.")

    entries = list(db.scalars(
        select(LedgerTransaction).where(LedgerTransaction.user_id == user.id)
        .order_by(LedgerTransaction.occurred_at.asc(), LedgerTransaction.id.asc())
    ))
    now = utcnow_naive()
    cutoff = now - timedelta(days=29)
    recent = [entry for entry in entries if entry.occurred_at >= cutoff]
    income_all = sum(entry.amount_minor for entry in entries if entry.kind == "income")
    expense_all = sum(entry.amount_minor for entry in entries if entry.kind == "expense")
    income_30 = sum(entry.amount_minor for entry in recent if entry.kind == "income")
    expense_30 = sum(entry.amount_minor for entry in recent if entry.kind == "expense")
    current_minor = business.opening_balance_minor + income_all - expense_all

    # Forecast is a transparent average baseline, not a trained or validated model.
    if recent:
        first_recorded_date = min(e.occurred_at.date() for e in recent)
        # Distinguish active record dates from the calendar window used for an average.
        observed_days = len({entry.occurred_at.date() for entry in recent})
        history_span_days = max(1, min(30, (now.date() - first_recorded_date).days + 1))
    else:
        observed_days = 0
        history_span_days = 1
    daily_income = income_30 / 100 / history_span_days
    daily_expenses = expense_30 / 100 / history_span_days
    baseline_end = current_minor / 100 + 7 * (daily_income - daily_expenses)
    lean_end = current_minor / 100 + 7 * ((daily_income * 0.55) - daily_expenses)
    reserve_floor = daily_expenses * 3
    runway_days = (current_minor / 100 / daily_expenses) if daily_expenses > 0 and current_minor > 0 else (0.0 if current_minor <= 0 else None)
    signal_quality = "Limited" if observed_days < 7 else "Early signal" if observed_days < 21 else "More history available"

    # PeloScore is a transparent, illustrative indicator—not a credit score or lending model.
    # Require both record volume and dates with activity to avoid presenting a false sense of precision.
    recent_dates = {entry.occurred_at.date() for entry in recent}
    enough_score_data = len(recent) >= 3 and len(recent_dates) >= 2
    peloscore: int | None = None
    peloscore_status = (
        f"Add at least three records across at least two dates in the last 30 days. "
        f"You currently have {len(recent)} record(s) across {len(recent_dates)} date(s)."
        if not enough_score_data else
        f"Based on {len(recent)} record(s) across {len(recent_dates)} date(s) in the last 30 days. "
        "This is an illustrative indicator, not a credit score or lending decision."
    )
    peloscore_factors: list[dict[str, str]] = []
    if enough_score_data:
        current_balance = current_minor / 100
        if reserve_floor > 0:
            if current_balance >= reserve_floor * 2:
                buffer_points, buffer_explanation, buffer_tone = 35, "Recorded cash is at least twice the illustrative three-day expense reserve.", "positive"
            elif current_balance >= reserve_floor:
                buffer_points, buffer_explanation, buffer_tone = 25, "Recorded cash meets the illustrative three-day expense reserve.", "positive"
            elif current_balance >= 0:
                buffer_points, buffer_explanation, buffer_tone = 12, "Recorded cash is positive but below the illustrative reserve.", "warning"
            else:
                buffer_points, buffer_explanation, buffer_tone = 0, "Recorded cash is below zero based on the entries supplied.", "warning"
        else:
            buffer_points = 15 if current_balance > 0 else 8
            buffer_explanation = "Recent expense records are insufficient to estimate a reserve; this factor uses recorded cash only."
            buffer_tone = "neutral"

        net_30_minor = income_30 - expense_30
        if net_30_minor > 0:
            flow_points, flow_explanation, flow_tone = 25, "Recorded income exceeded recorded expenses over the recent 30-day window.", "positive"
        elif net_30_minor == 0:
            flow_points, flow_explanation, flow_tone = 15, "Recorded income and expenses were equal, or no net flow was recorded in the recent window.", "neutral"
        else:
            flow_points, flow_explanation, flow_tone = 5, "Recorded expenses exceeded recorded income over the recent 30-day window.", "warning"

        record_points = min(20, len(recent_dates) * 2)
        record_explanation = f"Your records show activity on {len(recent_dates)} distinct date(s) in the last 30 days. More consistent recording gives this indicator more context."
        if baseline_end >= reserve_floor:
            outlook_points, outlook_explanation, outlook_tone = 20, "The baseline estimate remains at or above the illustrative reserve.", "positive"
        elif lean_end >= 0:
            outlook_points, outlook_explanation, outlook_tone = 10, "The baseline falls below the reserve, but the lean-week estimate remains non-negative.", "warning"
        else:
            outlook_points, outlook_explanation, outlook_tone = 0, "The lean-week estimate falls below zero; check recorded and upcoming payments carefully.", "warning"

        peloscore = max(0, min(100, buffer_points + flow_points + record_points + outlook_points))
        peloscore_factors = [
            {"label": "Cash buffer", "value": f"{buffer_points}/35", "explanation": buffer_explanation, "tone": buffer_tone},
            {"label": "Recent net flow", "value": f"{flow_points}/25", "explanation": flow_explanation, "tone": flow_tone},
            {"label": "Record activity", "value": f"{record_points}/20", "explanation": record_explanation, "tone": "positive" if record_points >= 12 else "neutral"},
            {"label": "Outlook resilience", "value": f"{outlook_points}/20", "explanation": outlook_explanation, "tone": outlook_tone},
        ]

    return {
        "business_name": business.business_name,
        "business_type": business.business_type,
        "currency": settings.currency.upper(),
        "opening_balance": money_from_minor(business.opening_balance_minor),
        "current_balance": money_from_minor(current_minor),
        "income_last_30d": money_from_minor(income_30),
        "expenses_last_30d": money_from_minor(expense_30),
        "projected_end_balance_7d": round(baseline_end, 2),
        "lean_week_end_balance_7d": round(lean_end, 2),
        "reserve_floor": round(reserve_floor, 2),
        "runway_days": round(runway_days, 1) if runway_days is not None else None,
        "observed_days": observed_days,
        "signal_quality": signal_quality,
        "shortfall_risk": baseline_end < reserve_floor,
        "peloscore": peloscore,
        "peloscore_status": peloscore_status,
        "peloscore_factors": peloscore_factors,
        "recent_transactions": [
            {
                "id": entry.id,
                "occurred_at": entry.occurred_at,
                "kind": entry.kind,
                "amount": money_from_minor(entry.amount_minor),
                "category": entry.category,
                "description": entry.description,
            }
            for entry in list(reversed(account_transactions(db, user.id)[:20]))
        ],
    }


def build_ai_context(db: Session, user: User) -> dict:
    """Return a minimal summary; never send owner email, identity, or raw descriptions to the model."""
    dashboard = build_account_dashboard(db, user)
    from datetime import datetime, timedelta
    from sqlalchemy import select
    entries = list(db.scalars(
        select(LedgerTransaction).where(
            LedgerTransaction.user_id == user.id,
            LedgerTransaction.occurred_at >= utcnow_naive() - timedelta(days=29),
        )
    ))
    expense_by_category: dict[str, int] = {}
    income_by_category: dict[str, int] = {}
    for entry in entries:
        target = income_by_category if entry.kind == "income" else expense_by_category
        target[entry.category] = target.get(entry.category, 0) + entry.amount_minor
    top_expenses = sorted(expense_by_category.items(), key=lambda item: item[1], reverse=True)[:5]
    top_income = sorted(income_by_category.items(), key=lambda item: item[1], reverse=True)[:5]
    return {
        "business_type": dashboard["business_type"],
        "currency": dashboard["currency"],
        "opening_balance": dashboard["opening_balance"],
        "current_balance": dashboard["current_balance"],
        "income_last_30d": dashboard["income_last_30d"],
        "expenses_last_30d": dashboard["expenses_last_30d"],
        "projected_end_balance_7d": dashboard["projected_end_balance_7d"],
        "lean_week_end_balance_7d": dashboard["lean_week_end_balance_7d"],
        "reserve_floor": dashboard["reserve_floor"],
        "runway_days_estimate": dashboard["runway_days"],
        "observed_days": dashboard["observed_days"],
        "signal_quality": dashboard["signal_quality"],
        "peloscore": dashboard["peloscore"],
        "peloscore_status": dashboard["peloscore_status"],
        "peloscore_factors": dashboard["peloscore_factors"],
        "expense_categories_last_30d": [{"category": key, "amount": money_from_minor(value)} for key, value in top_expenses],
        "income_categories_last_30d": [{"category": key, "amount": money_from_minor(value)} for key, value in top_income],
        "limitations": [
            "Based only on records entered by the user; unrecorded cash activity is unknown.",
            "Seven-day outlook uses recent average daily totals and is not a validated predictive model.",
            "PeloScore is illustrative and is not a credit score or lending recommendation.",
        ],
    }
