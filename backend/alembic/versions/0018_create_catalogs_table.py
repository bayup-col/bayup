"""Crea la tabla catalogs — un catálogo digital por tenant

Revision ID: 0018
Revises: 0017
Create Date: 2026-09-15

Soporta el módulo "Catálogo": cada tenant puede armar un banner y publicar
un link (/catalogo/{shop_slug}) que redirige a su tienda real ya
funcional (carrito y checkout reales, sin duplicar esa lógica). La
constraint UNIQUE en tenant_id garantiza un solo catálogo por tenant.
"""
from typing import Sequence, Union
from alembic import op

revision: str = "0018"
down_revision: Union[str, None] = "0017"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS catalogs (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id     UUID NOT NULL UNIQUE REFERENCES users(id),
            banner_url    VARCHAR,
            status        VARCHAR NOT NULL DEFAULT 'draft',
            published_at  TIMESTAMP,
            created_at    TIMESTAMP DEFAULT NOW(),
            updated_at    TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_catalogs_tenant_id ON catalogs (tenant_id)")


def downgrade() -> None:
    pass
