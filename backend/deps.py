"""
Dependencias FastAPI compartidas entre todos los routers.
Usar con Depends() para inyección limpia en lugar de SessionLocal() manual.
"""
import uuid as _uuid

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
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


def resolve_target(db: Session, caller, target_user_id: str | None):
    """Super-admin puede actuar en nombre de otro tenant. Lanza 403 si un no-admin lo intenta."""
    if not target_user_id:
        return caller
    require_super_admin(caller)
    try:
        tid = _uuid.UUID(target_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="target_user_id inválido")
    import models as _m
    target = db.query(_m.User).filter(_m.User.id == tid).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return target


def create_shipment(db: Session, order, tenant_id) -> None:
    """Crea un envío vacío ligado al pedido. No lanza excepciones."""
    import models as _m
    try:
        if db.query(_m.Shipment).filter(_m.Shipment.order_id == order.id).first():
            return
        db.add(_m.Shipment(
            order_id=order.id,
            tenant_id=tenant_id,
            status="pendiente",
            recipient_name=order.customer_name or "Cliente",
            recipient_phone=order.customer_phone or "",
            destination_address=order.shipping_address or order.customer_city or "",
            history=[],
        ))
        db.commit()
    except Exception:
        db.rollback()


def trigger_email_confirmation(email: str, name: str, db: Session) -> None:
    """Guarda token de confirmación en DB y encola el email. Falla silenciosamente."""
    import secrets as _s, email_queue as _eq, models as _m
    try:
        user = db.query(_m.User).filter(_m.User.email == email).first()
        if not user:
            return
        from datetime import datetime, timezone, timedelta
        token = _s.token_urlsafe(32)
        user.email_confirmation_token = token
        user.email_confirmation_expires = datetime.now(timezone.utc) + timedelta(hours=24)
        db.commit()
        _eq.enqueue("send_email_confirmation", email=email, name=name, token=token)
    except Exception as e:
        logger.warning("Email confirmation error: %s", e)


def push_notification(db: Session, tenant_id, title: str, message: str, type_: str = "info") -> None:
    """Inserta una notificación en BD para el tenant. Silencioso ante errores."""
    import models as _m
    try:
        notif = _m.Notification(tenant_id=tenant_id, title=title, message=message, type=type_)
        db.add(notif)
        db.commit()
    except Exception as e:
        logger.warning("No se pudo crear notificación: %s", e)
