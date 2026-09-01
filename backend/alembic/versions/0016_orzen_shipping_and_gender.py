"""Envío real + contraentrega + género de producto — fase de fidelidad ORZEN

Revision ID: 0016
Revises: 0015
Create Date: 2026-08-31

Conecta ShippingOption (ya existía, sin usar) al costo real del pedido;
agrega Product.gender (taxonomía hombre/mujer/unisex para el filtro público
de la tienda, hoy solo usado por Orzen pero campo genérico); y corrige una
pérdida de datos preexistente: Payment nunca guardaba customer_city ni
shipping_address del comprador (se perdían entre el checkout y la creación
de la orden vía webhook de Wompi, para CUALQUIER tenant que use el checkout
público con pasarela — no solo Orzen).
"""
from typing import Sequence, Union
from alembic import op

revision: str = "0016"
down_revision: Union[str, None] = "0015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS gender VARCHAR")
    op.execute("ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_city VARCHAR(120)")
    op.execute("ALTER TABLE payments ADD COLUMN IF NOT EXISTS shipping_address VARCHAR(500)")
    op.execute("ALTER TABLE payments ADD COLUMN IF NOT EXISTS shipping_option_id UUID")
    op.execute("ALTER TABLE payments ADD COLUMN IF NOT EXISTS shipping_cost DOUBLE PRECISION DEFAULT 0.0")
    op.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_option_id UUID")
    op.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost_snapshot DOUBLE PRECISION DEFAULT 0.0")


def downgrade() -> None:
    pass
