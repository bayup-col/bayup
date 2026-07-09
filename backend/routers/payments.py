import html as _html
import logging
import os
import re
import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import models
import payment_service
import schemas
from database import get_db
from rate_limit import limiter
from routers.public import resolve_variant_items, finalize_web_order

router = APIRouter(tags=["payments"])
logger = logging.getLogger("bayup")


# ── Schemas ───────────────────────────────────────────────────────────────

class CheckoutItemSchema(BaseModel):
    product_variant_id: str
    quantity: int = Field(gt=0)


class CheckoutRequest(BaseModel):
    tenant_id: str
    customer_name:  str = Field(min_length=2)
    customer_email: str = Field(min_length=5)
    customer_phone: str = Field(min_length=7)
    customer_city:  str | None = None
    shipping_address: str | None = None
    items: list[CheckoutItemSchema] = Field(min_length=1)
    currency: str = Field(default="COP", max_length=3)
    idempotency_key: str | None = Field(default=None, max_length=128)


# ── Helpers ───────────────────────────────────────────────────────────────

def _build_whatsapp_url(phone: str, store_name: str, items: list, total: float, currency: str) -> str:
    lines = [f"*Nuevo pedido — {store_name}*", ""]
    for item in items:
        lines.append(f"• {item['name']} × {item['qty']}  → ${item['unit_price'] * item['qty']:,.0f}")
    lines += ["", f"*Total: ${total:,.0f} {currency}*"]
    text = "%0A".join(lines)
    clean_phone = phone.replace("+", "").replace(" ", "").replace("-", "")
    return f"https://wa.me/{clean_phone}?text={text}"


def _payment_response(payment: models.Payment) -> dict:
    return {
        "payment_id":           str(payment.id),
        "status":               payment.status,
        "amount":               payment.amount,
        "currency":             payment.currency,
        "whatsapp_url":         payment.whatsapp_url,
        "gateway_redirect_url": payment.gateway_redirect_url,
    }


def _order_item_from_payment(item: dict) -> schemas.OrderItemBase:
    return schemas.OrderItemBase(
        product_variant_id=item["product_variant_id"],
        quantity=item["qty"],
        price_at_purchase=item["unit_price"],
    )


def _inject_sdk(html_content: str, slug: str, page_key: str, phone: str, api_url: str, sdk: str) -> str:
    """Inyecta bayup.js y data-attributes en el HTML. ALTA-006: escapa parámetros contra XSS."""
    sdk_attrs = (
        f' data-bayup-slug="{_html.escape(slug)}"'
        f' data-bayup-page="{_html.escape(page_key)}"'
        f' data-bayup-api="{_html.escape(api_url)}"'
        f' data-bayup-phone="{_html.escape(phone)}"'
    )
    html_content = re.sub(r'<html([^>]*?)>', f'<html\\1{sdk_attrs}>', html_content, count=1, flags=re.IGNORECASE)
    no_translate = '<meta name="google" content="notranslate"><meta name="translate" content="no">'
    html_content = re.sub(r'</head>', no_translate + '\n</head>', html_content, count=1, flags=re.IGNORECASE)
    html_content = re.sub(r'</body>', sdk + '\n</body>', html_content, count=1, flags=re.IGNORECASE)
    return html_content


# ── Endpoints ─────────────────────────────────────────────────────────────

@router.get("/public/payments/wompi-status")
async def wompi_status():
    """Diagnóstico temporal: confirma si el proceso ve las 3 variables de
    Wompi, sin exponer los valores reales. Quitar una vez resuelto el
    despliegue inicial."""
    return {
        "configured": payment_service.WOMPI_CONFIGURED,
        "has_public_key": bool(payment_service.WOMPI_PUBLIC_KEY),
        "has_integrity_secret": bool(payment_service.WOMPI_INTEGRITY_SECRET),
        "has_events_secret": bool(payment_service.WOMPI_EVENTS_SECRET),
        "public_key_prefix": (payment_service.WOMPI_PUBLIC_KEY or "")[:9] or None,
        "is_production": payment_service.IS_PRODUCTION,
    }


@router.post("/public/checkout")
@limiter.limit("10/minute")
async def public_checkout(payload: CheckoutRequest, request: Request, db: Session = Depends(get_db)):
    """Checkout público con pasarela Wompi. Crea un Payment "pending"; la orden
    real solo se crea cuando el webhook de Wompi confirma el pago (nunca se
    confía en el navegador para marcar un pago como aprobado)."""
    try:
        tenant_uuid = _uuid.UUID(payload.tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="tenant_id inválido")
    tenant = db.query(models.User).filter(models.User.id == tenant_uuid, models.User.status == "Activo").first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")

    if payload.idempotency_key:
        existing = db.query(models.Payment).filter(
            models.Payment.tenant_id == tenant.id,
            models.Payment.idempotency_key == payload.idempotency_key,
        ).first()
        if existing:
            return _payment_response(existing)

    # CRIT-002: resuelve variantes y precios reales desde la DB — nunca confía en el cliente
    validated_items = resolve_variant_items(db, tenant_uuid, payload.items)

    items_dict = []
    total = 0.0
    for v_item in validated_items:
        variant = db.query(models.ProductVariant).filter(models.ProductVariant.id == v_item.product_variant_id).first()
        product = db.query(models.Product).filter(models.Product.id == variant.product_id).first() if variant else None
        name = (product.name if product else "Producto") + (f" — {variant.name}" if variant and variant.name else "")
        items_dict.append({
            "product_variant_id": str(v_item.product_variant_id),
            "name": name,
            "qty": v_item.quantity,
            "unit_price": v_item.price_at_purchase,
        })
        total += v_item.price_at_purchase * v_item.quantity

    whatsapp_url = None
    if tenant.phone:
        whatsapp_url = _build_whatsapp_url(tenant.phone, tenant.full_name or "tu tienda", items_dict, total, payload.currency)

    payment = models.Payment(
        tenant_id=tenant.id,
        amount=total,
        currency=payload.currency,
        status="pending",
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        customer_phone=payload.customer_phone,
        items=items_dict,
        gateway=None,
        gateway_redirect_url=None,
        whatsapp_url=whatsapp_url,
        idempotency_key=payload.idempotency_key,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    # Wompi: si hay credenciales configuradas, genera la sesión firmada del widget
    if payment_service.WOMPI_CONFIGURED and total > 0:
        try:
            wompi_session = payment_service.create_payment_session(
                amount=total, user=tenant, currency=payload.currency,
                description=f"Pedido {tenant.full_name or tenant.shop_slug}",
            )
            payment.gateway = "wompi"
            payment.gateway_payment_id = wompi_session["reference"]  # se reemplaza por el id real al confirmar el webhook
            db.commit()
            db.refresh(payment)
            response = _payment_response(payment)
            response.update({
                "public_key":       wompi_session["public_key"],
                "reference":        wompi_session["reference"],
                "amount_in_cents":  wompi_session["amount_in_cents"],
                "signature":        wompi_session["signature"],
            })
            return response
        except Exception as e:
            logger.warning("Wompi: no se pudo crear la sesión de pago: %s", e)

    return _payment_response(payment)


@router.get("/public/payment/{payment_id}")
@limiter.limit("30/minute")
async def get_payment_status(
    payment_id: str,
    request: Request,
    slug: str = Query(None),
    db: Session = Depends(get_db),
):
    try:
        pid = _uuid.UUID(payment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="payment_id inválido")
    payment = db.query(models.Payment).filter(models.Payment.id == pid).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    if slug:
        tenant = db.query(models.User).filter(models.User.shop_slug == slug).first()
        if not tenant or payment.tenant_id != tenant.id:
            raise HTTPException(status_code=404, detail="Pago no encontrado")
        return {
            "payment_id": str(payment.id),
            "status":     payment.status,
            "amount":     payment.amount,
            "currency":   payment.currency,
            "order_id":   str(payment.order_id) if payment.order_id else None,
        }
    return {
        "payment_id": str(payment.id),
        "status":     payment.status,
        "order_id":   str(payment.order_id) if payment.order_id else None,
    }


_WOMPI_APPROVED_STATUSES = {"APPROVED"}
_WOMPI_FAILED_STATUSES = {"DECLINED", "VOIDED", "ERROR"}


@router.post("/public/payments/webhook")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    """Webhook de Wompi. Es la ÚNICA fuente de verdad para confirmar un pago —
    el navegador del comprador nunca puede marcar un pago como aprobado.
    NO se loguea el payload completo: puede contener datos bancarios."""
    event = await request.json()

    if not payment_service.verify_webhook_event(event):
        logger.warning("Wompi webhook: firma inválida, evento descartado")
        raise HTTPException(status_code=401, detail="Firma inválida")

    transaction = (event.get("data") or {}).get("transaction") or {}
    reference = transaction.get("reference")
    wompi_status = transaction.get("status")
    wompi_id = transaction.get("id")
    if not reference or not wompi_status:
        return {"received": True}

    payment = db.query(models.Payment).filter(
        models.Payment.gateway_payment_id == reference,
        models.Payment.gateway == "wompi",
    ).first()
    if not payment:
        logger.warning("Wompi webhook: referencia %s no corresponde a ningún pago", reference)
        return {"received": True}

    # Idempotencia: un pago ya procesado (aprobado o fallido) no se vuelve a tocar
    if payment.status != "pending":
        return {"received": True}

    payment.gateway_response = event
    payment.gateway_payment_id = str(wompi_id) if wompi_id else reference

    if wompi_status in _WOMPI_APPROVED_STATUSES:
        payment.status = "approved"
        db.commit()
        try:
            validated_items = [_order_item_from_payment(item) for item in (payment.items or [])]
            db_order = finalize_web_order(
                db, payment.tenant_id, validated_items,
                customer_name=payment.customer_name, customer_email=payment.customer_email,
                customer_phone=payment.customer_phone, customer_city=None, shipping_address=None,
                payment_method="wompi", source="web",
            )
            payment.order_id = db_order.id
            db.commit()
        except Exception as e:
            logger.error("Wompi webhook: pago %s aprobado pero falló crear la orden: %s", payment.id, e)
    elif wompi_status in _WOMPI_FAILED_STATUSES:
        payment.status = "failed"
        db.commit()
    else:
        db.commit()

    return {"received": True}


@router.get("/html-shop/{slug}", response_class=HTMLResponse)
@router.get("/html-shop/{slug}/{page_key}", response_class=HTMLResponse)
@limiter.limit("30/minute")
async def serve_html_shop(request: Request, slug: str, page_key: str = "home", db: Session = Depends(get_db)):
    tenant = db.query(models.User).filter(
        models.User.shop_slug == slug, models.User.status == "Activo",
    ).first()
    if not tenant:
        return HTMLResponse("<h1>Tienda no encontrada</h1>", status_code=404)

    shop_page = db.query(models.ShopPage).filter(
        models.ShopPage.tenant_id == tenant.id,
        models.ShopPage.is_published == True,
    ).first()
    template_id = shop_page.template_id if shop_page else None

    html_template = None
    if template_id:
        try:
            tid = _uuid.UUID(template_id)
            html_template = db.query(models.WebTemplate).filter(
                models.WebTemplate.id == tid,
                models.WebTemplate.template_type == "html",
            ).first()
        except (ValueError, Exception):
            pass

    if not html_template or not html_template.html_pages:
        return HTMLResponse("<h1>Esta tienda no tiene una plantilla HTML configurada.</h1>", status_code=404)

    pages = html_template.html_pages or {}
    html_content = pages.get(page_key) or pages.get("home") or ""
    if not html_content:
        return HTMLResponse("<h1>Página no encontrada</h1>", status_code=404)

    backend_url = os.getenv("BACKEND_URL", "https://api-bayup.onrender.com")
    import cache as _c
    html_out = _inject_sdk(html_content, slug=slug, page_key=page_key,
                           phone=tenant.phone or "", api_url=backend_url, sdk=_c.BAYUP_SDK)
    return HTMLResponse(content=html_out, status_code=200)
