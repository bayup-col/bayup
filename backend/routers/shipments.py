import datetime as _dt
import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from deps import current_user, tenant_id_from
import email_queue as _eq
import models

router = APIRouter(prefix="/shipments", tags=["shipments"])

VALID_STATUSES = {
    "pendiente", "guia_generada", "en_transito",
    "en_reparto", "entregado", "incidencia", "devuelto",
}

# Estados de envío que se notifican al cliente por correo. "entregado" no está
# aquí porque reutiliza el email de pedido "completed" (mismo diseño que usa
# el resto del ciclo de vida del pedido).
_NOTIFIABLE_SHIPMENT_STATUSES = {"guia_generada", "en_transito", "en_reparto", "incidencia", "devuelto"}


class ShipmentUpdatePayload(BaseModel):
    status: str | None = None
    carrier: str | None = None
    tracking_number: str | None = None
    notes: str | None = None
    estimated_delivery: str | None = None


@router.get("")
async def get_shipments(
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    tenant_id = tenant_id_from(user)
    rows = (
        db.query(models.Shipment, models.Order)
        .join(models.Order, models.Shipment.order_id == models.Order.id)
        .filter(models.Shipment.tenant_id == tenant_id)
        .order_by(models.Shipment.updated_at.desc())
        .all()
    )
    result = []
    for ship, order in rows:
        created = getattr(ship, "created_at", None) or order.created_at
        updated = getattr(ship, "updated_at", None) or order.created_at
        est_del = getattr(ship, "estimated_delivery", None)
        result.append({
            "id":               str(ship.id),
            "order_id":         str(ship.order_id),
            "order_number":     str(order.id)[:8].upper(),
            "tracking_number":  ship.tracking_number or "",
            "carrier":          ship.carrier or "",
            "status":           ship.status if ship.status in VALID_STATUSES else "pendiente",
            "customer_name":    order.customer_name or "Cliente",
            "customer_phone":   order.customer_phone or "",
            "customer_city":    order.customer_city or "",
            "customer_address": order.shipping_address or order.customer_city or "",
            "total_price":      order.total_price or 0,
            "items_count":      len(order.items) if order.items else 0,
            "created_at":       created.isoformat() if created else "",
            "updated_at":       updated.isoformat() if updated else "",
            "estimated_delivery": est_del.isoformat() if est_del else None,
            "notes":            getattr(ship, "notes", None),
            "history":          getattr(ship, "history", []) or [],
        })
    return result


@router.put("/{shipment_id}")
async def update_shipment(
    shipment_id: str,
    payload: ShipmentUpdatePayload,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    try:
        ship_uuid = _uuid.UUID(shipment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="shipment_id inválido")

    ship = db.query(models.Shipment).filter(
        models.Shipment.id == ship_uuid,
        models.Shipment.tenant_id == tenant_id_from(user),
    ).first()
    if not ship:
        raise HTTPException(status_code=404, detail="Envío no encontrado")

    if payload.status and payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"status inválido: {payload.status}")

    status_changed = bool(payload.status and payload.status != ship.status)

    if status_changed:
        ship.status = payload.status
        history = list(getattr(ship, "history", []) or [])
        history.append({
            "status": payload.status,
            "date": _dt.datetime.now(_dt.timezone.utc).isoformat(),
            "note": payload.notes or "",
        })
        ship.history = history

    if payload.carrier is not None:
        ship.carrier = payload.carrier
    if payload.tracking_number is not None:
        ship.tracking_number = payload.tracking_number
    if payload.notes is not None:
        ship.notes = payload.notes
    if payload.estimated_delivery is not None:
        try:
            ship.estimated_delivery = _dt.datetime.fromisoformat(payload.estimated_delivery)
        except ValueError:
            pass

    ship.updated_at = _dt.datetime.now(_dt.timezone.utc)

    if status_changed:
        order = db.query(models.Order).filter(models.Order.id == ship.order_id).first()
        if order and payload.status == "entregado":
            order.status = "completed"
        if order and order.customer_email and (order.source or "pos") != "pos":
            tenant_u = db.query(models.User).filter(models.User.id == ship.tenant_id).first()
            shop_name = (tenant_u.full_name or tenant_u.shop_slug or "Tu tienda") if tenant_u else "Tu tienda"
            shop_logo = tenant_u.logo_url if tenant_u else None
            if payload.status == "entregado":
                _eq.enqueue("send_order_status_update",
                    email=order.customer_email, name=order.customer_name or "Cliente",
                    order_id=str(order.id), new_status="completed",
                    shop_name=shop_name, shop_logo=shop_logo,
                )
            elif payload.status in _NOTIFIABLE_SHIPMENT_STATUSES:
                _eq.enqueue("send_shipment_status_update",
                    email=order.customer_email, name=order.customer_name or "Cliente",
                    order_id=str(order.id), new_status=payload.status,
                    shop_name=shop_name, shop_logo=shop_logo,
                    tracking_number=ship.tracking_number, carrier=ship.carrier,
                )

    db.commit()
    return {"ok": True, "id": str(ship.id), "status": ship.status}
