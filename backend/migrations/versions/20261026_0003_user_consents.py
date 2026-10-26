"""Add versioned consent records for account terms, privacy and Peloyame AI.

Revision ID: 20261026_0003
Revises: 20261025_0002
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
revision: str = "20261026_0003"
down_revision: Union[str, None] = "20261025_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        "user_consent_records",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("consent_type", sa.String(length=32), nullable=False),
        sa.Column("policy_version", sa.String(length=32), nullable=False),
        sa.Column("accepted", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_consent_records_user_id", "user_consent_records", ["user_id"], unique=False)
    op.create_index("ix_user_consent_user_type_created", "user_consent_records", ["user_id", "consent_type", "created_at"], unique=False)
    connection = op.get_bind()
    if connection.dialect.name == "postgresql":
        op.execute("ALTER TABLE public.user_consent_records ENABLE ROW LEVEL SECURITY")
        op.execute("REVOKE ALL ON TABLE public.user_consent_records FROM anon")
        op.execute("REVOKE ALL ON TABLE public.user_consent_records FROM authenticated")

def downgrade() -> None:
    op.drop_index("ix_user_consent_user_type_created", table_name="user_consent_records")
    op.drop_index("ix_user_consent_records_user_id", table_name="user_consent_records")
    op.drop_table("user_consent_records")
