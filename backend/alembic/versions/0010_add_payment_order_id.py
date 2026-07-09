"""Añade payments.order_id — vincula el pago con el pedido creado tras confirmarse

Revision ID: 0010
Revises: 0009
Create Date: 2026-07-09

El pedido real de una compra con pasarela (Wompi) solo se crea cuando el
webhook confirma el pago aprobado. Este campo permite al frontend consultar
el pedido resultante a partir del payment_id. Idempotente con IF NOT EXISTS.
"""
from typing import Sequence, Union
from alembic import op

revision: str = "0010"
down_revision: Union[str, None] = "0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_id UUID")


def downgrade() -> None:
    op.execute("ALTER TABLE payments DROP COLUMN IF EXISTS order_id")
