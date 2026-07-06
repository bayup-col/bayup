from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from deps import current_user, tenant_id_from
import models
import uuid as _uuid

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def get_notifications(
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    rows = (
        db.query(models.Notification)
        .filter(models.Notification.tenant_id == tenant_id_from(user))
        .order_by(models.Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": str(n.id), "title": n.title, "message": n.message,
            "type": n.type, "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in rows
    ]


@router.put("/read-all")
async def mark_all_read(
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    db.query(models.Notification).filter(
        models.Notification.tenant_id == tenant_id_from(user),
        models.Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"success": True}


@router.put("/{notification_id}/read")
async def mark_one_read(
    notification_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    try:
        nid = _uuid.UUID(notification_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de notificación inválido")

    notif = db.query(models.Notification).filter(
        models.Notification.id == nid,
        models.Notification.tenant_id == tenant_id_from(user),
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")

    notif.is_read = True
    db.commit()
    return {"success": True}
