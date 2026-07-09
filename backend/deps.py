"""
Dependencias FastAPI compartidas entre todos los routers.
Usar con Depends() para inyección limpia en lugar de SessionLocal() manual.
"""
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db          # ya definido en database.py
from typing import Generator
import logging

logger = logging.getLogger("bayup")

# Re-exportar get_db para que los routers importen desde aquí
__all__ = ["get_db", "current_user", "tenant_id_dep", "require_super_admin_dep", "push_notification"]


async def current_user(request: Request, db: Session = Depends(get_db)):
    """Autenticación via Bearer token o cookie httpOnly."""
    import security
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.lower().startswith("bearer ") and len(auth_header) > 7:
        token = auth_header[7:].strip() or None
    return await security.get_current_user(request=request, token=token, db=db)


def tenant_id_from(user) -> str:
    """Extrae el tenant_id del usuario (owner si es staff de tienda, su propio id si es root)."""
    return user.owner_id or user.id


def require_super_admin(user) -> None:
    """Lanza 403 si el usuario no es super admin global."""
    if not getattr(user, "is_global_staff", False):
        raise HTTPException(status_code=403, detail="Acceso restringido a administradores Bayup")


def push_notification(db: Session, tenant_id, title: str, message: str, type_: str = "info") -> None:
    """Inserta una notificación en BD para el tenant. Silencioso ante errores."""
    import models as _m
    try:
        notif = _m.Notification(tenant_id=tenant_id, title=title, message=message, type=type_)
        db.add(notif)
        db.commit()
    except Exception as e:
        logger.warning("No se pudo crear notificación: %s", e)
