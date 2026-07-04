"""Agrega índices en password_reset_token y email_confirmation_token

Revision ID: 0008
Revises: 0007
Create Date: 2026-07-04

Sin índices, cada solicitud de reset/confirmación hace full scan de users.
Idempotente con IF NOT EXISTS.
"""
from typing import Sequence, Union
from alembic import op

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_users_password_reset_token "
        "ON users (password_reset_token) WHERE password_reset_token IS NOT NULL"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_users_email_confirmation_token "
        "ON users (email_confirmation_token) WHERE email_confirmation_token IS NOT NULL"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_users_password_reset_token")
    op.execute("DROP INDEX IF EXISTS ix_users_email_confirmation_token")
