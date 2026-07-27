"""Crea tablas de analítica de storefront (tráfico / audiencia)

Revision ID: 0011
Revises: 0010
Create Date: 2026-07-26

analytics_visitors: primer visto de un visitor_id (localStorage) por tenant,
  para distinguir visitantes nuevos de recurrentes sin escanear sesiones.
analytics_sessions: una fila por sesión de navegación (sessionStorage).
analytics_pageviews: una fila por vista de página dentro de una sesión.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0011"
down_revision: Union[str, None] = "0010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS analytics_visitors (
            tenant_id     UUID NOT NULL,
            visitor_id    UUID NOT NULL,
            first_seen_at TIMESTAMP DEFAULT NOW(),
            PRIMARY KEY (tenant_id, visitor_id)
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS analytics_sessions (
            id                UUID PRIMARY KEY,
            tenant_id         UUID NOT NULL,
            visitor_id        UUID,
            is_new_visitor    BOOLEAN DEFAULT TRUE,
            source            VARCHAR DEFAULT 'direct',
            referrer_domain   VARCHAR,
            device_type       VARCHAR DEFAULT 'desktop',
            entry_path        VARCHAR,
            pageview_count    INTEGER DEFAULT 0,
            duration_seconds  INTEGER,
            started_at        TIMESTAMP DEFAULT NOW(),
            updated_at        TIMESTAMP DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS analytics_pageviews (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id   UUID NOT NULL,
            session_id  UUID NOT NULL,
            path        VARCHAR,
            created_at  TIMESTAMP DEFAULT NOW()
        )
    """)

    op.execute("CREATE INDEX IF NOT EXISTS ix_analytics_sessions_tenant_id ON analytics_sessions (tenant_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_analytics_sessions_visitor_id ON analytics_sessions (visitor_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_analytics_sessions_started_at ON analytics_sessions (started_at)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_analytics_pageviews_tenant_id ON analytics_pageviews (tenant_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_analytics_pageviews_session_id ON analytics_pageviews (session_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_analytics_pageviews_created_at ON analytics_pageviews (created_at)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS analytics_pageviews")
    op.execute("DROP TABLE IF EXISTS analytics_sessions")
    op.execute("DROP TABLE IF EXISTS analytics_visitors")
