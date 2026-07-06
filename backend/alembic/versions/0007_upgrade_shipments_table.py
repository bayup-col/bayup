"""Actualiza tabla shipments: añade columnas faltantes y crea tabla si no existe

Revision ID: 0007
Revises: 0006
Create Date: 2026-07-03

La tabla shipments fue creada via create_all() con un esquema mínimo.
Esta migración añade las columnas necesarias para el módulo de envíos real
(notas, historial, entrega estimada, created_at) y corrige el status default.
Todas las sentencias usan IF NOT EXISTS / IF EXISTS para ser idempotentes.
"""
from typing import Sequence, Union
from alembic import op

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Crea la tabla si no existía (entornos nuevos)
    op.execute("""
        CREATE TABLE IF NOT EXISTS shipments (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id            UUID REFERENCES orders(id),
            tenant_id           UUID REFERENCES users(id),
            status              VARCHAR NOT NULL DEFAULT 'pendiente',
            recipient_name      VARCHAR,
            recipient_phone     VARCHAR,
            destination_address VARCHAR,
            carrier             VARCHAR,
            tracking_number     VARCHAR,
            notes               VARCHAR,
            history             JSONB DEFAULT '[]',
            estimated_delivery  TIMESTAMP,
            created_at          TIMESTAMP DEFAULT NOW(),
            updated_at          TIMESTAMP DEFAULT NOW()
        )
    """)

    # Columnas añadidas al modelo después del create_all() original
    op.execute("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS notes VARCHAR")
    op.execute("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]'")
    op.execute("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP")
    op.execute("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()")

    # Índices
    op.execute("CREATE INDEX IF NOT EXISTS ix_shipments_tenant_id ON shipments (tenant_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_shipments_status ON shipments (status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_shipments_order_id ON shipments (order_id)")

    # Rellena created_at en filas existentes que tengan NULL
    op.execute("UPDATE shipments SET created_at = updated_at WHERE created_at IS NULL")

    # Normaliza el status legacy "pending_packing" al nuevo valor "pendiente"
    op.execute("UPDATE shipments SET status = 'pendiente' WHERE status = 'pending_packing'")


def downgrade() -> None:
    pass  # No se hace downgrade de columnas críticas en producción
