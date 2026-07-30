"""Añade índices faltantes en FKs de order_items/orders/product_variants

Estas columnas se usan en el WHERE ... IN (...) que genera selectinload()
al cargar pedidos con sus items y variantes (crud.get_orders_by_tenant).
Sin índice, ese JOIN es un seq scan que crece con cada pedido.

Revision ID: 0013
Revises: 0012
Create Date: 2026-07-28
"""
from typing import Sequence, Union
from alembic import op

revision: str = "0013"
down_revision: Union[str, None] = "0012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE INDEX IF NOT EXISTS ix_order_items_order_id ON order_items (order_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_order_items_product_variant_id ON order_items (product_variant_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_orders_customer_id ON orders (customer_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_product_variants_product_id ON product_variants (product_id)")


def downgrade() -> None:
    op.drop_index("ix_product_variants_product_id", "product_variants")
    op.drop_index("ix_orders_customer_id", "orders")
    op.drop_index("ix_order_items_product_variant_id", "order_items")
    op.drop_index("ix_order_items_order_id", "order_items")
