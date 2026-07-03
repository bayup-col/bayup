"""Crea tablas roadmap_items y roadmap_votes

Revision ID: 0006
Revises: 0005
Create Date: 2026-07-03

Las tablas fueron añadidas al modelo pero nunca se creó la migración,
causando ProgrammingError en /public/roadmap en producción.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS roadmap_items (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title       VARCHAR NOT NULL,
            tagline     VARCHAR,
            description VARCHAR,
            phase       VARCHAR NOT NULL DEFAULT 'proximamente',
            tags        JSONB DEFAULT '[]',
            gradient    VARCHAR,
            accent_color VARCHAR,
            image_url   VARCHAR,
            votes       INTEGER DEFAULT 0,
            sort_order  INTEGER DEFAULT 0,
            is_active   BOOLEAN DEFAULT TRUE,
            created_at  TIMESTAMP DEFAULT NOW(),
            updated_at  TIMESTAMP DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS roadmap_votes (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            item_id     UUID NOT NULL,
            user_id     UUID,
            session_key VARCHAR,
            voted_at    TIMESTAMP DEFAULT NOW()
        )
    """)

    op.execute("CREATE INDEX IF NOT EXISTS ix_roadmap_items_is_active ON roadmap_items (is_active)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_roadmap_items_sort_order ON roadmap_items (sort_order)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_roadmap_votes_item_id ON roadmap_votes (item_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_roadmap_votes_user_id ON roadmap_votes (user_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS roadmap_votes")
    op.execute("DROP TABLE IF EXISTS roadmap_items")
