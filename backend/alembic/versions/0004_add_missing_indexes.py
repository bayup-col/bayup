"""Añade índices faltantes en columnas owner_id / tenant_id usadas en filtros multi-tenant

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-27
"""
from typing import Sequence, Union
from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_owner_id ON users (owner_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_password_reset_token ON users (password_reset_token)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_email_confirmation_token ON users (email_confirmation_token)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_products_owner_id ON products (owner_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_collections_owner_id ON collections (owner_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_tax_rates_owner_id ON tax_rates (owner_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_shipping_options_owner_id ON shipping_options (owner_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_ai_assistants_owner_id ON ai_assistants (owner_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_custom_roles_owner_id ON custom_roles (owner_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_pages_owner_id ON pages (owner_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_receivables_tenant_id ON receivables (tenant_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_incomes_tenant_id ON incomes (tenant_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_payroll_employees_tenant_id ON payroll_employees (tenant_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_sellers_tenant_id ON sellers (tenant_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_purchase_orders_tenant_id ON purchase_orders (tenant_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_providers_tenant_id ON providers (tenant_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_channel_connections_user_id ON channel_connections (user_id)")


def downgrade() -> None:
    op.drop_index("ix_channel_connections_user_id", "channel_connections")
    op.drop_index("ix_providers_tenant_id", "providers")
    op.drop_index("ix_purchase_orders_tenant_id", "purchase_orders")
    op.drop_index("ix_sellers_tenant_id", "sellers")
    op.drop_index("ix_payroll_employees_tenant_id", "payroll_employees")
    op.drop_index("ix_incomes_tenant_id", "incomes")
    op.drop_index("ix_receivables_tenant_id", "receivables")
    op.drop_index("ix_pages_owner_id", "pages")
    op.drop_index("ix_custom_roles_owner_id", "custom_roles")
    op.drop_index("ix_ai_assistants_owner_id", "ai_assistants")
    op.drop_index("ix_shipping_options_owner_id", "shipping_options")
    op.drop_index("ix_tax_rates_owner_id", "tax_rates")
    op.drop_index("ix_collections_owner_id", "collections")
    op.drop_index("ix_products_owner_id", "products")
    op.drop_index("ix_users_email_confirmation_token", "users")
    op.drop_index("ix_users_password_reset_token", "users")
    op.drop_index("ix_users_owner_id", "users")
