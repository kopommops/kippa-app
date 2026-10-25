from contextlib import asynccontextmanager
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
import logging

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .account_service import account_transactions, build_account_dashboard, normalise_datetime
from .ai_service import answer_question
from .config import settings
from .database import Base, SessionLocal, engine, get_db
from .models import BusinessProfile, LedgerTransaction, Persona, Transaction, User
from .schemas import (
    AccountDashboardOut, AccountTransactionOut, AuthResponse, BusinessOut,
    DashboardOut, LoginIn, PeloyameRequest, PeloyameResponse, PersonaOut,
    RegisterIn, TransactionCreate, TransactionOut, UserOut,
)
from .security import create_access_token, get_current_user, hash_password, verify_password
from .seed import seed_if_empty
from .services import build_dashboard, get_persona_or_none

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.validate_deployment_secrets()
    # create_all creates new MVP tables for this hackathon branch. It does not replace versioned
    # migrations for production; existing tables are intentionally not dropped or renamed here.
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_if_empty(db)
    yield


app = FastAPI(
    title=settings.app_name,
    description="Pelo Finance: an illustrative cash-flow demo plus an authenticated, manually entered MVP account.",
    version="0.3.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


def _auth_response(user: User) -> AuthResponse:
    if user.business is None:
        raise HTTPException(status_code=500, detail="Your account setup is incomplete. Please contact support.")
    return AuthResponse(
        access_token=create_access_token(user.id),
        user=UserOut(id=user.id, owner_name=user.owner_name, email=user.email),
        business=BusinessOut(business_name=user.business.business_name, business_type=user.business.business_type),
    )


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "app": "pelo-finance"}


# --- Public synthetic demo endpoints. These are deliberately separate from account data. ---
@app.get("/api/personas", response_model=list[PersonaOut])
def list_personas(db: Session = Depends(get_db)):
    return list(db.scalars(select(Persona).order_by(Persona.name.asc())))


@app.get("/api/personas/{persona_id}/dashboard", response_model=DashboardOut)
def persona_dashboard(persona_id: str, db: Session = Depends(get_db)):
    persona = get_persona_or_none(db, persona_id)
    if persona is None:
        raise HTTPException(status_code=404, detail="Demo persona not found")
    return build_dashboard(db, persona)


@app.get("/api/personas/{persona_id}/transactions", response_model=list[TransactionOut])
def list_demo_transactions(
    persona_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    if get_persona_or_none(db, persona_id) is None:
        raise HTTPException(status_code=404, detail="Demo persona not found")
    return list(db.scalars(
        select(Transaction).where(Transaction.persona_id == persona_id)
        .order_by(Transaction.occurred_at.desc(), Transaction.id.desc()).limit(limit)
    ))


@app.post("/api/personas/{persona_id}/simulate-lean-week", response_model=DashboardOut)
def simulate_demo_lean_week(persona_id: str, db: Session = Depends(get_db)):
    persona = get_persona_or_none(db, persona_id)
    if persona is None:
        raise HTTPException(status_code=404, detail="Demo persona not found")
    persona.scenario_active = True
    db.commit()
    db.refresh(persona)
    return build_dashboard(db, persona)


@app.post("/api/personas/{persona_id}/reset-scenario", response_model=DashboardOut)
def reset_demo_scenario(persona_id: str, db: Session = Depends(get_db)):
    persona = get_persona_or_none(db, persona_id)
    if persona is None:
        raise HTTPException(status_code=404, detail="Demo persona not found")
    persona.scenario_active = False
    db.commit()
    db.refresh(persona)
    return build_dashboard(db, persona)


# --- Registration and login for real, manually entered MVP accounts. ---
@app.post("/api/auth/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists. Sign in instead.")

    user = User(
        owner_name=payload.owner_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    user.business = BusinessProfile(
        business_name=payload.business_name,
        business_type=payload.business_type,
        opening_balance_minor=int((payload.opening_balance * Decimal(100)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)),
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists. Sign in instead.")
    return _auth_response(user)


@app.post("/api/auth/login", response_model=AuthResponse)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email))
    # Keep the response the same for an unknown email and a wrong password.
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.", headers={"WWW-Authenticate": "Bearer"})
    return _auth_response(user)


@app.get("/api/auth/me", response_model=AuthResponse)
def who_am_i(user: User = Depends(get_current_user)):
    return _auth_response(user)


@app.get("/api/account/dashboard", response_model=AccountDashboardOut)
def account_dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return build_account_dashboard(db, user)
    except RuntimeError:
        raise HTTPException(status_code=409, detail="Complete your business setup before viewing the dashboard.")


@app.get("/api/account/transactions", response_model=list[AccountTransactionOut])
def list_account_transactions(
    limit: int = Query(default=100, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entries = account_transactions(db, user.id)[:limit]
    return [
        AccountTransactionOut(
            id=e.id, occurred_at=e.occurred_at, kind=e.kind, amount=float(Decimal(e.amount_minor) / Decimal(100)),
            category=e.category, description=e.description,
        )
        for e in entries
    ]


@app.post("/api/account/transactions", response_model=AccountTransactionOut, status_code=status.HTTP_201_CREATED)
def create_account_transaction(
    payload: TransactionCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    amount_minor = int((payload.amount * Decimal(100)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    entry = LedgerTransaction(
        user_id=user.id,
        occurred_at=normalise_datetime(payload.occurred_at),
        kind=payload.kind,
        amount_minor=amount_minor,
        category=payload.category,
        description=payload.description,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return AccountTransactionOut(
        id=entry.id, occurred_at=entry.occurred_at, kind=entry.kind, amount=float(Decimal(entry.amount_minor) / Decimal(100)),
        category=entry.category, description=entry.description,
    )


@app.delete("/api/account/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account_transaction(
    transaction_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = db.scalar(select(LedgerTransaction).where(
        LedgerTransaction.id == transaction_id,
        LedgerTransaction.user_id == user.id,
    ))
    if entry is None:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    db.delete(entry)
    db.commit()
    return None


@app.post("/api/account/scenarios/lean-week", response_model=AccountDashboardOut)
def account_lean_week_scenario(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Scenario values are calculated from a summary and never written back to ledger records.
    return build_account_dashboard(db, user)


@app.post("/api/peloyame/chat", response_model=PeloyameResponse)
def peloyame_chat(
    payload: PeloyameRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return answer_question(db, user, payload.question, str(payload.session_id))
