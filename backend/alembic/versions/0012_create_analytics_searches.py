"""Crea tabla analytics_searches (top búsquedas del storefront)

Revision ID: 0012
Revises: 0011
Create Date: 2026-07-26
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0012"
down_revision: Union[str, None] = "0011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS analytics_searches (
            id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id      UUID NOT NULL,
            session_id     UUID,
            term           VARCHAR,
            results_count  INTEGER DEFAULT 0,
            created_at     TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_analytics_searches_tenant_id ON analytics_searches (tenant_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_analytics_searches_created_at ON analytics_searches (created_at)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS analytics_searches")
