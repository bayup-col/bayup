"""WebTemplate.live_shop_slug — vincula una plantilla HTML exclusiva a su tenant real

Revision ID: 0017
Revises: 0016
Create Date: 2026-09-12

Permite marcar una plantilla HTML como "exclusiva" de un tenant real ya en
producción (ej. Orzen). Cuando está seteado, el botón "Vista previa" del
super admin abre la tienda real en vez del preview genérico con datos de
muestra, que no conoce el contrato data-bayup propio de esa tienda.
"""
from typing import Sequence, Union
from alembic import op

revision: str = "0017"
down_revision: Union[str, None] = "0016"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE web_templates ADD COLUMN IF NOT EXISTS live_shop_slug VARCHAR")


def downgrade() -> None:
    pass
