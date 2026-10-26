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
    bank_connections: Mapped[list["BankConnection"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    notifications: Mapped[list["AccountNotification"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    consent_records: Mapped[list["UserConsentRecord"]] = relationship(back_populates="owner", cascade="all, delete-orphan")


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
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="manual")  # manual | bank_simulation
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


class BankConnection(Base):
    """A deliberately simulated bank/wallet link for the hackathon, not a provider integration."""
    __tablename__ = "bank_connections"
    __table_args__ = (UniqueConstraint("user_id", "provider_code", name="uq_bank_connection_user_provider"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_code: Mapped[str] = mapped_column(String(32), nullable=False)
    provider_name: Mapped[str] = mapped_column(String(100), nullable=False)
    account_label: Mapped[str] = mapped_column(String(80), nullable=False)
    masked_account: Mapped[str] = mapped_column(String(32), nullable=False, default="•••• 2048")
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="connected_demo")
    is_simulated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow_naive)
    last_event_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    owner: Mapped[User] = relationship(back_populates="bank_connections")
    notifications: Mapped[list["AccountNotification"]] = relationship(back_populates="connection", cascade="all, delete-orphan")


class AccountNotification(Base):
    __tablename__ = "account_notifications"
    __table_args__ = (Index("ix_account_notifications_user_created", "user_id", "created_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    bank_connection_id: Mapped[int | None] = mapped_column(ForeignKey("bank_connections.id", ondelete="CASCADE"), nullable=True, index=True)
    transaction_id: Mapped[int | None] = mapped_column(ForeignKey("ledger_transactions.id", ondelete="SET NULL"), nullable=True)
    notification_type: Mapped[str] = mapped_column(String(32), nullable=False, default="info")
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    body: Mapped[str] = mapped_column(String(300), nullable=False)
    amount_minor: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow_naive)
    owner: Mapped[User] = relationship(back_populates="notifications")
    connection: Mapped[BankConnection | None] = relationship(back_populates="notifications")


class UserConsentRecord(Base):
    """Append-only record of a user's acknowledgement or optional processing choice."""
    __tablename__ = "user_consent_records"
    __table_args__ = (Index("ix_user_consent_user_type_created", "user_id", "consent_type", "created_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    consent_type: Mapped[str] = mapped_column(String(32), nullable=False)  # terms | privacy | peloyame_ai
    policy_version: Mapped[str] = mapped_column(String(32), nullable=False)
    accepted: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow_naive)
    owner: Mapped[User] = relationship(back_populates="consent_records")
