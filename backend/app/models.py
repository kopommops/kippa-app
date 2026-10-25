from __future__ import annotations
from datetime import date, datetime, timezone
from decimal import Decimal
from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, Float, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


def utcnow_naive() -> datetime:
    """UTC timestamp for existing timezone-naive database columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


# Existing synthetic-demo models are preserved for backwards compatibility.
class Persona(Base):
    __tablename__ = "personas"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    occupation: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(300), nullable=False)
    opening_balance: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    scenario_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow_naive)
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="persona", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (Index("ix_transactions_persona_occurred", "persona_id", "occurred_at"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    persona_id: Mapped[str] = mapped_column(ForeignKey("personas.id", ondelete="CASCADE"), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String(16), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str] = mapped_column(String(160), nullable=False)
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="synthetic_feed")
    persona: Mapped[Persona] = relationship(back_populates="transactions")


# Real MVP accounts live in separate tables; they never share data with synthetic personas.
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    owner_name: Mapped[str] = mapped_column(String(80), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(512), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow_naive)
    business: Mapped["BusinessProfile"] = relationship(back_populates="owner", uselist=False, cascade="all, delete-orphan")
    ledger_entries: Mapped[list["LedgerTransaction"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    ai_usage: Mapped[list["AIUsage"]] = relationship(back_populates="owner", cascade="all, delete-orphan")


class BusinessProfile(Base):
    __tablename__ = "business_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    business_name: Mapped[str] = mapped_column(String(100), nullable=False)
    business_type: Mapped[str] = mapped_column(String(64), nullable=False)
    opening_balance_minor: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow_naive)
    owner: Mapped[User] = relationship(back_populates="business")


class LedgerTransaction(Base):
    __tablename__ = "ledger_transactions"
    __table_args__ = (
        Index("ix_ledger_user_occurred", "user_id", "occurred_at"),
        CheckConstraint("amount_minor > 0", name="ck_ledger_amount_positive"),
        CheckConstraint("kind IN ('income', 'expense')", name="ck_ledger_kind_valid"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow_naive, index=True)
    kind: Mapped[str] = mapped_column(String(16), nullable=False)  # income | expense
    amount_minor: Mapped[int] = mapped_column(Integer, nullable=False)  # integer minor units (thebe)
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str] = mapped_column(String(160), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow_naive)
    owner: Mapped[User] = relationship(back_populates="ledger_entries")

    @property
    def amount(self) -> float:
        return float(Decimal(self.amount_minor) / Decimal(100))


class AIUsage(Base):
    __tablename__ = "peloyame_usage"
    __table_args__ = (UniqueConstraint("user_id", "session_id", "usage_date", name="uq_peloyame_user_session_day"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id: Mapped[str] = mapped_column(String(36), nullable=False)
    usage_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    question_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow_naive, onupdate=utcnow_naive)
    owner: Mapped[User] = relationship(back_populates="ai_usage")
