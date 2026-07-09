import html as _html
import os
import re
import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import models
from database import get_db
from rate_limit import limiter

router = APIRouter(tags=["payments"])


# ── Schemas ───────────────────────────────────────────────────────────────

class CheckoutItemSchema(BaseModel):
    product_id: str
    name: str
    qty: int = Field(ge=1)
    unit_price: float = Field(ge=0)


class CheckoutRequest(BaseModel):
    customer_name:  str = Field(min_length=2)
    customer_email: str = Field(min_length=5)
    customer_phone: str = Field(min_length=7)
    items: list[CheckoutItemSchema] = Field(min_length=1)
    currency: str = Field(default="COP", max_length=3)
    idempotency_key: str | None = Field(default=None, max_length=128)


# ── Helpers ───────────────────────────────────────────────────────────────

def _build_whatsapp_url(phone: str, store_name: str, items: list, total: float) -> str:
    lines = [f"*Nuevo pedido — {store_name}*", ""]
    for item in items:
        lines.append(f"• {item['name']} × {item['qty']}  → ${item['unit_price'] * item['qty']:,.0f}")
    lines += ["", f"*Total: ${total:,.0f} {items[0].get('currency', 'COP') if items else 'COP'}*"]
    text = "%0A".join(lines)
    clean_phone = phone.replace("+", "").replace(" ", "").replace("-", "")
    return f"https://wa.me/{clean_phone}?text={text}"


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

@router.post("/public/shop/{slug}/checkout")
@limiter.limit("10/minute")
async def public_checkout(slug: str, payload: CheckoutRequest, request: Request, db: Session = Depends(get_db)):
    tenant = db.query(models.User).filter(
        models.User.shop_slug == slug, models.User.status == "Activo",
    ).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")

    if payload.idempotency_key:
        existing = db.query(models.Payment).filter(
            models.Payment.tenant_id == tenant.id,
            models.Payment.idempotency_key == payload.idempotency_key,
        ).first()
        if existing:
            return {
                "payment_id":           str(existing.id),
                "status":               existing.status,
                "amount":               existing.amount,
                "currency":             existing.currency,
                "whatsapp_url":         existing.whatsapp_url,
                "gateway_redirect_url": existing.gateway_redirect_url,
            }

    # CRIT-002: calcular precios desde DB; ignorar unit_price del cliente
    items_dict = []
    total = 0.0
    for item in payload.items:
        try:
            product_uuid = _uuid.UUID(item.product_id)
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail=f"product_id inválido: {item.product_id}")
        db_product = db.query(models.Product).filter(
            models.Product.id == product_uuid,
            models.Product.owner_id == tenant.id,
            models.Product.status == "active",
        ).first()
        if not db_product:
            raise HTTPException(status_code=400, detail=f"Producto no encontrado en esta tienda: {item.product_id}")
        db_price = db_product.price
        items_dict.append({
            "product_id": item.product_id,
            "name": db_product.name,
            "qty": item.qty,
            "unit_price": db_price,
            "currency": payload.currency,
        })
        total += db_price * item.qty

    whatsapp_url = None
    if tenant.phone:
        whatsapp_url = _build_whatsapp_url(tenant.phone, tenant.full_name or slug, items_dict, total)

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

    return {
        "payment_id":           str(payment.id),
        "status":               payment.status,
        "amount":               payment.amount,
        "currency":             payment.currency,
        "whatsapp_url":         payment.whatsapp_url,
        "gateway_redirect_url": payment.gateway_redirect_url,
    }


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
        }
    return {"payment_id": str(payment.id), "status": payment.status}


@router.post("/public/payments/webhook")
async def payment_webhook(request: Request):
    # CRIT-003: placeholder seguro hasta implementar gateway real.
    # La verificación HMAC se añadirá al integrar MercadoPago/PayU.
    # NO loguear el payload — puede contener datos bancarios sensibles.
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
