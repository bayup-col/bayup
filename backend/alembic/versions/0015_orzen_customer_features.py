"""Blog/journal, direcciones y wishlist — cuenta de cliente final

Revision ID: 0015
Revises: 0014
Create Date: 2026-08-31

Funciones nuevas exclusivas del tenant Orzen (ver feature_gating.py):
blog/journal editorial (posts), libreta de direcciones del cliente final
(customer_addresses) y wishlist (wishlist_items). La identidad del cliente
reutiliza la fila users(role='cliente') que ya crea el checkout público —
no se crea una tabla de clientes nueva.
"""
from typing import Sequence, Union
from alembic import op

revision: str = "0015"
down_revision: Union[str, None] = "0014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS posts (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id     UUID NOT NULL REFERENCES users(id),
            slug          VARCHAR NOT NULL,
            title         VARCHAR NOT NULL,
            category      VARCHAR,
            excerpt       VARCHAR,
            body          JSON DEFAULT '[]',
            image_url     VARCHAR,
            published_at  TIMESTAMP DEFAULT NOW(),
            is_published  BOOLEAN DEFAULT TRUE,
            created_at    TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_posts_tenant_id ON posts (tenant_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_posts_slug ON posts (slug)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS customer_addresses (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id   UUID NOT NULL REFERENCES users(id),
            tenant_id     UUID NOT NULL REFERENCES users(id),
            label         VARCHAR,
            full_name     VARCHAR,
            phone         VARCHAR,
            address_line  VARCHAR NOT NULL,
            city          VARCHAR,
            postal_code   VARCHAR,
            country       VARCHAR DEFAULT 'Colombia',
            is_default    BOOLEAN DEFAULT FALSE,
            created_at    TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_customer_addresses_customer_id ON customer_addresses (customer_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_customer_addresses_tenant_id ON customer_addresses (tenant_id)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS wishlist_items (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id   UUID NOT NULL REFERENCES users(id),
            tenant_id     UUID NOT NULL REFERENCES users(id),
            product_id    UUID NOT NULL REFERENCES products(id),
            created_at    TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_wishlist_items_customer_id ON wishlist_items (customer_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_wishlist_items_tenant_id ON wishlist_items (tenant_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_wishlist_items_product_id ON wishlist_items (product_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS wishlist_items")
    op.execute("DROP TABLE IF EXISTS customer_addresses")
    op.execute("DROP TABLE IF EXISTS posts")
