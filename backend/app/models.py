from datetime import datetime
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


class Persona(Base):
    __tablename__ = "personas"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    occupation: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(300), nullable=False)
    opening_balance: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    scenario_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.now)
    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="persona", cascade="all, delete-orphan"
    )


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (Index("ix_transactions_persona_occurred", "persona_id", "occurred_at"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    persona_id: Mapped[str] = mapped_column(ForeignKey("personas.id", ondelete="CASCADE"), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String(16), nullable=False)  # income | expense
    amount: Mapped[float] = mapped_column(Float, nullable=False)  # always positive
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str] = mapped_column(String(160), nullable=False)
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="synthetic_feed")
    persona: Mapped[Persona] = relationship(back_populates="transactions")
