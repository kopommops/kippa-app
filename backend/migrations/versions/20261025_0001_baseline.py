"""Baseline schema used by the original Pelo Finance MVP.

Revision ID: 20261025_0001
Revises:

This revision creates the tables that existed before the focused bank-simulation
update. For a database that already has this schema, stamp this revision only
after inspecting the tables/columns; do not run this migration against populated
legacy tables without checking first.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20261025_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "personas",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("occupation", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=300), nullable=False),
        sa.Column("opening_balance", sa.Float(), nullable=False),
        sa.Column("scenario_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("owner_name", sa.String(length=80), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("password_hash", sa.String(length=512), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_table(
        "business_profiles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("business_name", sa.String(length=100), nullable=False),
        sa.Column("business_type", sa.String(length=64), nullable=False),
        sa.Column("opening_balance_minor", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_business_profiles_user_id", "business_profiles", ["user_id"], unique=True)
    op.create_table(
        "transactions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("persona_id", sa.String(length=64), nullable=False),
        sa.Column("occurred_at", sa.DateTime(), nullable=False),
        sa.Column("kind", sa.String(length=16), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("category", sa.String(length=64), nullable=False),
        sa.Column("description", sa.String(length=160), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.ForeignKeyConstraint(["persona_id"], ["personas.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_transactions_occurred_at", "transactions", ["occurred_at"], unique=False)
    op.create_index("ix_transactions_persona_occurred", "transactions", ["persona_id", "occurred_at"], unique=False)
    op.create_table(
        "ledger_transactions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("occurred_at", sa.DateTime(), nullable=False),
        sa.Column("kind", sa.String(length=16), nullable=False),
        sa.Column("amount_minor", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=64), nullable=False),
        sa.Column("description", sa.String(length=160), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint("amount_minor > 0", name="ck_ledger_amount_positive"),
        sa.CheckConstraint("kind IN ('income', 'expense')", name="ck_ledger_kind_valid"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ledger_transactions_user_id", "ledger_transactions", ["user_id"], unique=False)
    op.create_index("ix_ledger_transactions_occurred_at", "ledger_transactions", ["occurred_at"], unique=False)
    op.create_index("ix_ledger_user_occurred", "ledger_transactions", ["user_id", "occurred_at"], unique=False)
    op.create_table(
        "peloyame_usage",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.String(length=36), nullable=False),
        sa.Column("usage_date", sa.Date(), nullable=False),
        sa.Column("question_count", sa.Integer(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "session_id", "usage_date", name="uq_peloyame_user_session_day"),
    )
    op.create_index("ix_peloyame_usage_user_id", "peloyame_usage", ["user_id"], unique=False)
    op.create_index("ix_peloyame_usage_usage_date", "peloyame_usage", ["usage_date"], unique=False)


def downgrade() -> None:
    # This is a baseline marker. Avoid dropping populated application tables as a rollback.
    raise RuntimeError("The initial schema baseline is not reversible; restore a verified database backup instead.")
