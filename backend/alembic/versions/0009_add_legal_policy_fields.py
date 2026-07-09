"""Añade campos de textos legales configurables por tienda (users)

Revision ID: 0009
Revises: 0008
Create Date: 2026-07-09

Cada tenant puede redactar sus propios Términos y condiciones, Política de
privacidad, Política de devoluciones/cambios y Política de envíos desde
Config Tienda. Se muestran públicamente en el footer de su tienda online.
Idempotente con IF NOT EXISTS.
"""
from typing import Sequence, Union
from alembic import op

revision: str = "0009"
down_revision: Union[str, None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_conditions VARCHAR")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_policy VARCHAR")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS return_policy VARCHAR")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS shipping_policy VARCHAR")


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS terms_conditions")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS privacy_policy")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS return_policy")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS shipping_policy")
