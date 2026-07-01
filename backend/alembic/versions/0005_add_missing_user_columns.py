"""Añade columnas faltantes en users y payments usando IF NOT EXISTS (idempotente)

Revision ID: 0005
Revises: 0004
Create Date: 2026-06-30

La DB de producción fue creada con create_all() y le faltan columnas añadidas
posteriormente al modelo. Todas las sentencias usan IF NOT EXISTS para que la
migración sea segura de re-ejecutar y no falle si alguna columna ya existe.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- users: columnas potencialmente faltantes ---
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS reviewer_notes VARCHAR")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR DEFAULT 'Colombia'")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_regime VARCHAR")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS legal_rep VARCHAR")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_is_fixed BOOLEAN DEFAULT FALSE")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_fixed_until TIMESTAMP")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_month_revenue DOUBLE PRECISION DEFAULT 0.0")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent DOUBLE PRECISION DEFAULT 0.0")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_purchase_summary VARCHAR")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_type VARCHAR DEFAULT 'final'")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS acquisition_channel VARCHAR")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP")
    # Estas dos también están en 0003, pero pueden no haberse aplicado
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_confirmation_token VARCHAR(255)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_confirmation_expires TIMESTAMP")

    # --- payments: columna de 0002 (puede no haberse aplicado) ---
    op.execute("ALTER TABLE payments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128)")

    # --- Índices de 0003 y 0004 (IF NOT EXISTS para idempotencia) ---
    op.execute("CREATE INDEX IF NOT EXISTS ix_payments_idempotency_key ON payments (idempotency_key)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_email_confirmation_token ON users (email_confirmation_token)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_password_reset_token ON users (password_reset_token)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_owner_id ON users (owner_id)")
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
    pass  # No se hace downgrade de columnas críticas en producción
