"""Añade orders.gateway_fee_amount — costo real de Wompi por pedido

Revision ID: 0014
Revises: 0013
Create Date: 2026-08-30

Bayup opera con una sola cuenta de Wompi para toda la plataforma: el costo
real de la pasarela (2.65% + $700 + IVA por transacción aprobada) lo asume
Bayup, no cada tenant. Hasta ahora ese costo no se registraba en ningún
lado y quedaba absorbido silenciosamente por la comisión de Bayup (2.5%),
que en la práctica es menor al costo de Wompi en cualquier tamaño de venta
— Bayup perdía dinero en cada transacción web. Este campo guarda el costo
real calculado en el momento en que se crea el pedido, para poder
descontarlo del neto que se le liquida al tenant (separado de la comisión
de Bayup, que así queda como margen real). Queda en 0 para pedidos que no
pasan por la pasarela (POS, contraentrega, WhatsApp).
"""
from typing import Sequence, Union
from alembic import op

revision: str = "0014"
down_revision: Union[str, None] = "0013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS gateway_fee_amount DOUBLE PRECISION DEFAULT 0.0")
    op.execute("ALTER TABLE liquidations ADD COLUMN IF NOT EXISTS gateway_fee DOUBLE PRECISION DEFAULT 0.0")


def downgrade() -> None:
    op.execute("ALTER TABLE orders DROP COLUMN IF EXISTS gateway_fee_amount")
    op.execute("ALTER TABLE liquidations DROP COLUMN IF EXISTS gateway_fee")
