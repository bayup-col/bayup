"""Añade email_confirmation_token y email_confirmation_expires a users

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-27
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("email_confirmation_token", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("email_confirmation_expires", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "email_confirmation_expires")
    op.drop_column("users", "email_confirmation_token")
