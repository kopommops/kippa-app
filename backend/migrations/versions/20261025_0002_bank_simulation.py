"""Add source attribution, demo bank connections and in-app notifications.

Revision ID: 20261025_0002
Revises: 20261025_0001
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20261025_0002"
down_revision: Union[str, None] = "20261025_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("ledger_transactions", sa.Column("source", sa.String(length=32), server_default="manual", nullable=False))
    op.create_table(
        "bank_connections",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("provider_code", sa.String(length=32), nullable=False),
        sa.Column("provider_name", sa.String(length=100), nullable=False),
        sa.Column("account_label", sa.String(length=80), nullable=False),
        sa.Column("masked_account", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("is_simulated", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("last_event_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "provider_code", name="uq_bank_connection_user_provider"),
    )
    op.create_index("ix_bank_connections_user_id", "bank_connections", ["user_id"], unique=False)
    op.create_table(
        "account_notifications",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("bank_connection_id", sa.Integer(), nullable=True),
        sa.Column("transaction_id", sa.Integer(), nullable=True),
        sa.Column("notification_type", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("body", sa.String(length=300), nullable=False),
        sa.Column("amount_minor", sa.Integer(), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["bank_connection_id"], ["bank_connections.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["transaction_id"], ["ledger_transactions.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_account_notifications_user_id", "account_notifications", ["user_id"], unique=False)
    op.create_index("ix_account_notifications_bank_connection_id", "account_notifications", ["bank_connection_id"], unique=False)
    op.create_index("ix_account_notifications_user_created", "account_notifications", ["user_id", "created_at"], unique=False)

    connection = op.get_bind()
    if connection.dialect.name == "postgresql":
        # This app uses FastAPI's own JWTs and talks to Postgres server-side.
        # Do not expose app tables directly to Supabase's anon/authenticated Data API roles.
        op.execute("""
        DO $$
        DECLARE table_name text;
        BEGIN
          FOREACH table_name IN ARRAY ARRAY[
            'personas','transactions','users','business_profiles','ledger_transactions',
            'peloyame_usage','bank_connections','account_notifications'
          ] LOOP
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
              EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', table_name);
            END IF;
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
              EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated', table_name);
            END IF;
          END LOOP;
        END $$;
        """)


def downgrade() -> None:
    connection = op.get_bind()
    if connection.dialect.name == "sqlite":
        with op.batch_alter_table("ledger_transactions") as batch:
            batch.drop_column("source")
    else:
        op.drop_column("ledger_transactions", "source")
    op.drop_index("ix_account_notifications_user_created", table_name="account_notifications")
    op.drop_index("ix_account_notifications_bank_connection_id", table_name="account_notifications")
    op.drop_index("ix_account_notifications_user_id", table_name="account_notifications")
    op.drop_table("account_notifications")
    op.drop_index("ix_bank_connections_user_id", table_name="bank_connections")
    op.drop_table("bank_connections")
