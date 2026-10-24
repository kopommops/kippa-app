from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session
from .config import settings
from .database import Base, SessionLocal, engine, get_db
from .models import Persona, Transaction
from .schemas import DashboardOut, PersonaOut, TransactionOut
from .seed import seed_if_empty
from .services import build_dashboard, get_persona_or_none


@asynccontextmanager
async def lifespan(app: FastAPI):
    # This is a synthetic-data hackathon prototype. Production database changes
    # should be managed by versioned migrations rather than create_all().
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_if_empty(db)
    yield


app = FastAPI(
    title=settings.app_name,
    description="Synthetic-data demo for forecasting irregular income and stress-testing a lean week.",
    version="0.2.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "app": "pelo-finance"}


@app.get("/api/personas", response_model=list[PersonaOut])
def list_personas(db: Session = Depends(get_db)):
    return list(db.scalars(select(Persona).order_by(Persona.name.asc())))


@app.get("/api/personas/{persona_id}/dashboard", response_model=DashboardOut)
def persona_dashboard(persona_id: str, db: Session = Depends(get_db)):
    persona = get_persona_or_none(db, persona_id)
    if persona is None:
        raise HTTPException(status_code=404, detail="Demo profile not found")
    return build_dashboard(db, persona)


@app.get("/api/personas/{persona_id}/transactions", response_model=list[TransactionOut])
def list_transactions(
    persona_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    if get_persona_or_none(db, persona_id) is None:
        raise HTTPException(status_code=404, detail="Demo profile not found")
    return list(db.scalars(
        select(Transaction).where(Transaction.persona_id == persona_id)
        .order_by(Transaction.occurred_at.desc(), Transaction.id.desc()).limit(limit)
    ))


@app.post("/api/personas/{persona_id}/simulate-lean-week", response_model=DashboardOut)
def simulate_lean_week(persona_id: str, db: Session = Depends(get_db)):
    persona = get_persona_or_none(db, persona_id)
    if persona is None:
        raise HTTPException(status_code=404, detail="Demo profile not found")
    persona.scenario_active = True
    db.commit()
    db.refresh(persona)
    return build_dashboard(db, persona)


@app.post("/api/personas/{persona_id}/reset-scenario", response_model=DashboardOut)
def reset_scenario(persona_id: str, db: Session = Depends(get_db)):
    persona = get_persona_or_none(db, persona_id)
    if persona is None:
        raise HTTPException(status_code=404, detail="Demo profile not found")
    persona.scenario_active = False
    db.commit()
    db.refresh(persona)
    return build_dashboard(db, persona)
