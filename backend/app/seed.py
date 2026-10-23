from __future__ import annotations
from datetime import datetime, timedelta
import random
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from .models import Persona, Transaction

PERSONA_CONFIG = [
    {
        "id": "kea-trader", "name": "Kea", "occupation": "Street trader",
        "description": "Frequent takings, stock purchases and stall costs.", "opening_balance": 2000.0,
        "profile": "trader",
    },
    {
        "id": "thabo-driver", "name": "Thabo", "occupation": "Ride-hailing driver",
        "description": "Regular trips, variable demand, fuel and vehicle costs.", "opening_balance": 1150.0,
        "profile": "driver",
    },
    {
        "id": "mpho-hairdresser", "name": "Mpho", "occupation": "Freelance hairdresser",
        "description": "Appointment-led income, supplies and chair-rental costs.", "opening_balance": 980.0,
        "profile": "hairdresser",
    },
]


def _add_tx(db: Session, persona_id: str, at: datetime, kind: str, amount: float, category: str, description: str) -> None:
    db.add(Transaction(
        persona_id=persona_id, occurred_at=at, kind=kind, amount=round(max(0.0, amount), 2),
        category=category, description=description, source="synthetic_feed",
    ))


def seed_if_empty(db: Session) -> None:
    count = db.scalar(select(func.count()).select_from(Persona)) or 0
    if count:
        return

    today = datetime.now().date()
    for idx, config in enumerate(PERSONA_CONFIG):
        persona = Persona(
            id=config["id"], name=config["name"], occupation=config["occupation"],
            description=config["description"], opening_balance=config["opening_balance"], scenario_active=False,
        )
        db.add(persona)
        rng = random.Random(8100 + idx)
        for day_offset in range(89, -1, -1):
            current_day = today - timedelta(days=day_offset)
            at = datetime.combine(current_day, datetime.min.time()).replace(hour=8)
            weekday = current_day.weekday()
            profile = config["profile"]

            if profile == "trader":
                probability = 0.70 if weekday < 5 else 0.86
                if rng.random() < probability:
                    amount = rng.uniform(160, 340) * (1.22 if weekday in (4, 5) else 1.0)
                    _add_tx(db, persona.id, at + timedelta(hours=6), "income", amount, "Sales", rng.choice(["Morning takings", "Card / mobile payments", "Market sales"]))
                if rng.random() < 0.66:
                    _add_tx(db, persona.id, at + timedelta(hours=10), "expense", rng.uniform(75, 180), "Stock", rng.choice(["Stock top-up", "Supplier payment", "Packaging and supplies"]))
                if weekday == 0:
                    _add_tx(db, persona.id, at + timedelta(hours=1), "expense", rng.uniform(150, 260), "Stall costs", "Stall fee / market costs")
            elif profile == "driver":
                probability = 0.82 if weekday < 5 else 0.92
                if rng.random() < probability:
                    amount = rng.uniform(210, 440) * (1.15 if weekday in (4, 5) else 1.0)
                    _add_tx(db, persona.id, at + timedelta(hours=9), "income", amount, "Driving income", rng.choice(["Trip payouts", "Daily trip earnings", "Platform payouts"]))
                if rng.random() < 0.79:
                    _add_tx(db, persona.id, at + timedelta(hours=11), "expense", rng.uniform(100, 220), "Fuel", "Fuel purchase")
                if rng.random() < 0.30:
                    _add_tx(db, persona.id, at + timedelta(hours=13), "expense", rng.uniform(55, 150), "Living costs", rng.choice(["Groceries", "Mobile data", "Food on shift"]))
                if weekday == 6:
                    _add_tx(db, persona.id, at + timedelta(hours=2), "expense", rng.uniform(180, 300), "Vehicle costs", "Vehicle maintenance reserve")
            else:
                probability = 0.34 if weekday < 4 else 0.72 if weekday in (4, 5) else 0.42
                if rng.random() < probability:
                    amount = rng.uniform(280, 620) * (1.15 if weekday in (4, 5) else 1.0)
                    _add_tx(db, persona.id, at + timedelta(hours=7), "income", amount, "Appointments", rng.choice(["Client appointment", "Braiding service", "Styling appointment"]))
                if rng.random() < 0.39:
                    _add_tx(db, persona.id, at + timedelta(hours=12), "expense", rng.uniform(65, 165), "Supplies", "Hair products and consumables")
                if weekday == 0:
                    _add_tx(db, persona.id, at + timedelta(hours=1), "expense", rng.uniform(200, 340), "Chair rental", "Weekly chair / space rental")

            # Personal costs matter too: the demo models the person's cash position,
            # not only business turnover. Kea is deliberately the lean-week case.
            if profile == "trader" and rng.random() < 0.82:
                _add_tx(db, persona.id, at + timedelta(hours=15), "expense", rng.uniform(80, 120), "Household", "Groceries / household contribution")
            elif profile == "driver" and rng.random() < 0.58:
                _add_tx(db, persona.id, at + timedelta(hours=15), "expense", rng.uniform(70, 120), "Household", "Groceries / household contribution")
            elif profile == "hairdresser" and rng.random() < 0.70:
                _add_tx(db, persona.id, at + timedelta(hours=15), "expense", rng.uniform(120, 190), "Household", "Groceries / household contribution")

    db.commit()
