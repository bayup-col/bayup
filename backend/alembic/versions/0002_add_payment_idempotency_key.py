"""Añade idempotency_key a payments

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-27
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "payments",
        sa.Column("idempotency_key", sa.String(length=128), nullable=True),
    )
    op.create_index(
        "ix_payments_idempotency_key",
        "payments",
        ["idempotency_key"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_payments_idempotency_key", table_name="payments")
    op.drop_column("payments", "idempotency_key")
