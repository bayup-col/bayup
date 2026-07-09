import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import crud, schemas, models
import email_queue as _eq
from database import get_db
from deps import current_user, tenant_id_from, push_notification, create_shipment

router = APIRouter(prefix="/orders", tags=["orders"])

VALID_STATUSES = {"pending", "processing", "completed", "cancelled"}


class OrderItemRequest(BaseModel):
    product_variant_id: str
    quantity: int = Field(gt=0)
    price_at_purchase: float = Field(ge=0)


class OrderCreateRequest(BaseModel):
    total_price: float = Field(ge=0)
    commission_amount: float | None = Field(default=0.0, ge=0)
    commission_rate_snapshot: float | None = Field(default=0.0, ge=0)
    customer_type: str | None = "final"
    customer_name: str
    customer_email: str | None = None
    customer_phone: str | None = None
    customer_city: str | None = None
    shipping_address: str | None = None
    payment_method: str = "cash"
    source: str = "pos"
    seller_name: str | None = None
    items: list[OrderItemRequest] = []


class OrderUpdateRequest(BaseModel):
    status: str


def _items_info(db: Session, db_order) -> list:
    result = []
    for item in db_order.items:
        variant = db.query(models.ProductVariant).filter(models.ProductVariant.id == item.product_variant_id).first()
        product = db.query(models.Product).filter(models.Product.id == variant.product_id).first() if variant else None
        name = (product.name if product else "Producto") + (f" — {variant.name}" if variant and variant.name else "")
        result.append({"name": name, "qty": item.quantity, "price": float(item.price_at_purchase)})
    return result




@router.get("")
async def get_orders(
    request: Request,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=200, ge=1),
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    rows = crud.get_orders_by_tenant(db, tenant_id=tenant_id_from(user), skip=skip, limit=min(limit, 500))
    return [schemas.Order.model_validate(o).model_dump(mode="json") for o in rows]


@router.post("")
async def create_order(
    payload: OrderCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    tenant_id = tenant_id_from(user)
    order_in  = schemas.OrderCreate(tenant_id=tenant_id, **payload.model_dump())
    db_order  = crud.create_order(db, order=order_in, customer_id=user.id, tenant_id=tenant_id)
    total_fmt = f"${db_order.total_price:,.0f}".replace(",", ".")

    if (payload.source or "pos") != "pos":
        create_shipment(db, db_order, tenant_id)

    tenant_user = db.query(models.User).filter(models.User.id == tenant_id).first()
    shop_name   = (tenant_user.full_name or tenant_user.shop_slug or "Tu tienda") if tenant_user else "Tu tienda"
    info        = _items_info(db, db_order)

    if payload.customer_email:
        _eq.enqueue("send_order_confirmation",
            email=payload.customer_email,
            name=payload.customer_name or "Cliente",
            order_id=str(db_order.id),
            items=info,
            total=float(db_order.total_price),
            payment_method=payload.payment_method or "Efectivo",
            customer_city=payload.customer_city or "",
            customer_phone=payload.customer_phone or "",
            shop_name=shop_name,
            source=payload.source or "pos",
        )

    if tenant_user and tenant_user.email:
        _eq.enqueue("send_new_sale_notification",
            owner_email=tenant_user.email,
            shop_name=shop_name,
            order_id=str(db_order.id),
            customer_name=payload.customer_name or "Cliente",
            customer_email=payload.customer_email or "",
            customer_phone=payload.customer_phone or "",
            customer_city=payload.customer_city or "",
            items=info,
            total=float(db_order.total_price),
            payment_method=payload.payment_method or "Efectivo",
        )

    push_notification(db, tenant_id,
        "💰 Nuevo pedido creado",
        f"Pedido #{str(db_order.id)[:8].upper()} por {total_fmt}",
        "success",
    )
    return schemas.Order.model_validate(db_order).model_dump(mode="json")


@router.put("/{order_id}")
async def update_order(
    order_id: str,
    payload: OrderUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"status inválido, debe ser: {sorted(VALID_STATUSES)}")
    try:
        oid = _uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="order_id inválido")

    tenant_id = tenant_id_from(user)
    db_order  = db.query(models.Order).filter(
        models.Order.id == oid,
        models.Order.tenant_id == tenant_id,
    ).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    prev = db_order.status
    db_order.status = payload.status
    db.commit()

    if payload.status != prev:
        if payload.status == "completed":
            push_notification(db, tenant_id, "✅ Pedido completado",
                f"Pedido #{order_id[:8].upper()} marcado como completado", "success")
        elif payload.status == "cancelled":
            push_notification(db, tenant_id, "❌ Pedido cancelado",
                f"Pedido #{order_id[:8].upper()} fue cancelado", "alert")

        is_web = (db_order.source or "pos") != "pos"
        if is_web and db_order.customer_email and payload.status in ("processing", "completed", "cancelled"):
            tenant_u = db.query(models.User).filter(models.User.id == tenant_id).first()
            shop = (tenant_u.full_name or tenant_u.shop_slug or "Tu tienda") if tenant_u else "Tu tienda"
            _eq.enqueue("send_order_status_update",
                email=db_order.customer_email,
                name=db_order.customer_name or "Cliente",
                order_id=str(db_order.id),
                new_status=payload.status,
                shop_name=shop,
            )

    return {"id": str(db_order.id), "status": db_order.status}


@router.post("/{order_id}/attach-invoice")
async def attach_invoice(
    order_id: str,
    payload: dict,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    try:
        oid = _uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="order_id inválido")

    tenant_id = tenant_id_from(user)
    order = db.query(models.Order).filter(
        models.Order.id == oid,
        models.Order.tenant_id == tenant_id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    customer_email = payload.get("customer_email") or order.customer_email
    pdf_base64     = payload.get("pdf_base64", "")
    if not customer_email or not pdf_base64:
        raise HTTPException(status_code=400, detail="customer_email y pdf_base64 requeridos")

    tenant_user = db.query(models.User).filter(models.User.id == tenant_id).first()
    shop_name   = (tenant_user.full_name or tenant_user.shop_slug or "Tu tienda") if tenant_user else "Tu tienda"

    _eq.enqueue("send_invoice_attachment",
        email=customer_email,
        name=order.customer_name or "Cliente",
        order_id=str(order.id),
        shop_name=shop_name,
        pdf_base64=pdf_base64,
    )
    return {"ok": True}
