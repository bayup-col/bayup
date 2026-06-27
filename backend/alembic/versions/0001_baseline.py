"""baseline — tablas existentes marcadas como aplicadas

Revision ID: 0001
Revises:
Create Date: 2026-06-27

Esta migración está vacía a propósito: representa el estado actual de la DB
en producción (tablas creadas via create_all). Ejecuta `alembic stamp 0001`
en producción para que Alembic reconozca el estado base sin tocar nada.
"""
from typing import Sequence, Union

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
