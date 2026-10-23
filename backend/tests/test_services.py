from sqlalchemy import create_engine, select, func
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from app.database import Base
from app.models import Persona, Transaction
from app.seed import seed_if_empty
from app.services import build_dashboard


def test_lean_week_changes_forecast_without_mutating_ledger():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    try:
        with Session(engine, expire_on_commit=False) as db:
            seed_if_empty(db)
            persona = db.get(Persona, "kea-trader")
            assert persona is not None
            ledger_before = db.scalar(select(func.count()).select_from(Transaction).where(Transaction.persona_id == persona.id))
            baseline = build_dashboard(db, persona)
            persona.scenario_active = True
            stressed = build_dashboard(db, persona)
            ledger_after = db.scalar(select(func.count()).select_from(Transaction).where(Transaction.persona_id == persona.id))
            assert stressed["forecast"]["scenario_active"] is True
            assert stressed["forecast"]["projected_income_7d"] < baseline["forecast"]["projected_income_7d"]
            assert ledger_before == ledger_after
            persona.scenario_active = False
            reset = build_dashboard(db, persona)
            assert reset["forecast"]["projected_end_balance"] == baseline["forecast"]["projected_end_balance"]
    finally:
        Base.metadata.drop_all(engine)
        engine.dispose()

