"""
Cuenta de cliente final (comprador) de una tienda — login propio, pedidos,
direcciones y wishlist. Completamente separado del login de comerciante
(`routers/auth.py`): JWT distinto (claim `cust`+`tenant_id`), cookie distinta
(`bayup_customer_token`), dependencia distinta (`deps.current_customer`).

Reutiliza como identidad la misma fila `User(role='cliente', owner_id=tenant_id)`
que el checkout público ya crea de forma pasiva — aquí se le añade una
contraseña real para que pueda autenticarse.

Exclusivo hoy del tenant Orzen (`feature_gating.require_orzen_tenant`) — ver
plan `ethereal-wobbling-kazoo.md`. El resto de tenants recibe 404.
"""
import secrets as _secrets
import uuid as _uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

import crud, models, security
from database import get_db
from deps import current_customer, push_notification
from feature_gating import require_orzen_tenant
from rate_limit import limiter

router = APIRouter(tags=["customer-account"])

CUSTOMER_TOKEN_DAYS = 14


# ── Schemas ───────────────────────────────────────────────────────────────

class CustomerRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=1)
    phone: str | None = None


class CustomerLoginRequest(BaseModel):
    email: EmailStr
    password: str


class CustomerForgotPasswordRequest(BaseModel):
    email: EmailStr


class CustomerUpdateMeRequest(BaseModel):
    full_name: str | None = None
    phone: str | None = None


class AddressRequest(BaseModel):
    label: str | None = None
    full_name: str | None = None
    phone: str | None = None
    address_line: str = Field(min_length=1)
    city: str | None = None
    postal_code: str | None = None
    country: str = "Colombia"
    is_default: bool = False


class WishlistAddRequest(BaseModel):
    product_id: str


# ── Helpers ───────────────────────────────────────────────────────────────

def _resolve_orzen_tenant(slug: str, db: Session) -> models.User:
    tenant = crud.get_user_by_slug(db, slug=slug)
    require_orzen_tenant(tenant)
    return tenant


def _customer_payload(customer: models.User) -> dict:
    return {
        "id": str(customer.id),
        "email": customer.email,
        "full_name": customer.full_name or "",
        "phone": customer.phone or "",
    }


def _issue_customer_session(customer: models.User, tenant: models.User) -> JSONResponse:
    token = security.create_access_token(
        data={"sub": customer.email, "tenant_id": str(tenant.id), "cust": True},
        expires_delta=timedelta(days=CUSTOMER_TOKEN_DAYS),
    )
    response = JSONResponse(content={"access_token": token, "customer": _customer_payload(customer)})
    response.set_cookie(
        key="bayup_customer_token", value=token,
        httponly=True, secure=True, samesite="none",
        max_age=CUSTOMER_TOKEN_DAYS * 24 * 3600, path="/",
    )
    return response


# ── Auth ──────────────────────────────────────────────────────────────────

@router.post("/shop/{slug}/customer-auth/register")
@limiter.limit("5/minute")
def customer_register(request: Request, slug: str, payload: CustomerRegisterRequest, db: Session = Depends(get_db)):
    tenant = _resolve_orzen_tenant(slug, db)

    existing = crud.get_user_by_email(db, email=payload.email)
    if existing:
        if existing.owner_id != tenant.id or existing.role != "cliente":
            raise HTTPException(status_code=400, detail="Ese correo ya está en uso")
        if existing.hashed_password:
            raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese correo. Inicia sesión.")
        existing.hashed_password = security.get_password_hash(payload.password)
        existing.full_name = payload.full_name or existing.full_name
        existing.phone = payload.phone or existing.phone
        existing.status = "Activo"
        existing.email_confirmed = True
        db.commit()
        db.refresh(existing)
        customer = existing
    else:
        customer = models.User(
            id=_uuid.uuid4(),
            email=payload.email,
            full_name=payload.full_name,
            phone=payload.phone,
            hashed_password=security.get_password_hash(payload.password),
            role="cliente",
            status="Activo",
            owner_id=tenant.id,
            customer_type="final",
            email_confirmed=True,
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

    return _issue_customer_session(customer, tenant)


@router.post("/shop/{slug}/customer-auth/login")
@limiter.limit("10/minute")
def customer_login(request: Request, slug: str, payload: CustomerLoginRequest, db: Session = Depends(get_db)):
    tenant = _resolve_orzen_tenant(slug, db)
    customer = (
        db.query(models.User)
        .filter(models.User.email == payload.email, models.User.owner_id == tenant.id, models.User.role == "cliente")
        .first()
    )
    if not customer or not customer.hashed_password or not security.verify_password(payload.password, customer.hashed_password):
        raise HTTPException(status_code=400, detail="Credenciales inválidas")
    if customer.status not in ("Activo", "active"):
        raise HTTPException(status_code=403, detail="Cuenta suspendida")
    return _issue_customer_session(customer, tenant)


@router.post("/shop/{slug}/customer-auth/logout")
def customer_logout(slug: str):
    response = JSONResponse(content={"ok": True})
    response.delete_cookie("bayup_customer_token", path="/")
    return response


@router.get("/shop/{slug}/customer-auth/me")
def customer_me(slug: str, db: Session = Depends(get_db), customer: models.User = Depends(current_customer)):
    _resolve_orzen_tenant(slug, db)
    return _customer_payload(customer)


@router.put("/shop/{slug}/customer-auth/me")
def customer_update_me(
    slug: str, payload: CustomerUpdateMeRequest,
    db: Session = Depends(get_db), customer: models.User = Depends(current_customer),
):
    _resolve_orzen_tenant(slug, db)
    if payload.full_name is not None:
        customer.full_name = payload.full_name
    if payload.phone is not None:
        customer.phone = payload.phone
    db.commit()
    return _customer_payload(customer)


@router.post("/shop/{slug}/customer-auth/forgot-password")
@limiter.limit("3/minute")
def customer_forgot_password(request: Request, slug: str, payload: CustomerForgotPasswordRequest, db: Session = Depends(get_db)):
    tenant = _resolve_orzen_tenant(slug, db)
    import email_queue as _eq
    customer = (
        db.query(models.User)
        .filter(models.User.email == payload.email, models.User.owner_id == tenant.id, models.User.role == "cliente")
        .first()
    )
    if customer and customer.hashed_password:
        token = _secrets.token_urlsafe(32)
        customer.password_reset_token = token
        customer.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()
        _eq.enqueue("send_customer_password_reset", email=customer.email, token=token, shop_slug=tenant.shop_slug)
    return {"ok": True, "message": "Si el correo existe, recibirás un enlace en los próximos minutos."}


# La verificación del token y el cambio de contraseña reutilizan
# POST /auth/reset-password (routers/auth.py) — busca por password_reset_token
# sin importar el rol de la fila, así que funciona igual para clientes.


# ── Pedidos del cliente ──────────────────────────────────────────────────

@router.get("/shop/{slug}/customer-auth/orders")
def customer_orders(slug: str, db: Session = Depends(get_db), customer: models.User = Depends(current_customer)):
    tenant = _resolve_orzen_tenant(slug, db)
    orders = (
        db.query(models.Order)
        .filter(models.Order.tenant_id == tenant.id, models.Order.customer_email == customer.email)
        .order_by(models.Order.created_at.desc())
        .all()
    )
    return [
        {
            "id": str(o.id),
            "short_id": str(o.id)[:8].upper(),
            "status": o.status,
            "total_price": float(o.total_price or 0),
            "payment_method": o.payment_method,
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "item_count": len(o.items),
        }
        for o in orders
    ]


@router.get("/shop/{slug}/customer-auth/orders/{order_id}")
def customer_order_detail(slug: str, order_id: str, db: Session = Depends(get_db), customer: models.User = Depends(current_customer)):
    tenant = _resolve_orzen_tenant(slug, db)
    try:
        oid = _uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    order = (
        db.query(models.Order)
        .filter(models.Order.id == oid, models.Order.tenant_id == tenant.id, models.Order.customer_email == customer.email)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    items = []
    for item in order.items:
        variant = db.query(models.ProductVariant).filter(models.ProductVariant.id == item.product_variant_id).first()
        product = db.query(models.Product).filter(models.Product.id == variant.product_id).first() if variant else None
        items.append({
            "name": (product.name if product else "Producto") + (f" — {variant.name}" if variant and variant.name and variant.name.lower() != "base" else ""),
            "image_url": (product.image_url[0] if product and product.image_url else None),
            "qty": item.quantity,
            "price": float(item.price_at_purchase),
        })
    shipment = db.query(models.Shipment).filter(models.Shipment.order_id == order.id).first()
    return {
        "id": str(order.id),
        "short_id": str(order.id)[:8].upper(),
        "status": order.status,
        "total_price": float(order.total_price or 0),
        "payment_method": order.payment_method,
        "shipping_address": order.shipping_address,
        "customer_city": order.customer_city,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "items": items,
        "shipment_status": shipment.status if shipment else None,
        "tracking_number": shipment.tracking_number if shipment else None,
    }


# ── Direcciones ───────────────────────────────────────────────────────────

@router.get("/shop/{slug}/customer-auth/addresses")
def list_addresses(slug: str, db: Session = Depends(get_db), customer: models.User = Depends(current_customer)):
    tenant = _resolve_orzen_tenant(slug, db)
    addresses = (
        db.query(models.Address)
        .filter(models.Address.customer_id == customer.id, models.Address.tenant_id == tenant.id)
        .order_by(models.Address.is_default.desc(), models.Address.created_at.desc())
        .all()
    )
    return [_address_payload(a) for a in addresses]


def _address_payload(a: models.Address) -> dict:
    return {
        "id": str(a.id), "label": a.label, "full_name": a.full_name, "phone": a.phone,
        "address_line": a.address_line, "city": a.city, "postal_code": a.postal_code,
        "country": a.country, "is_default": a.is_default,
    }


@router.post("/shop/{slug}/customer-auth/addresses")
def create_address(slug: str, payload: AddressRequest, db: Session = Depends(get_db), customer: models.User = Depends(current_customer)):
    tenant = _resolve_orzen_tenant(slug, db)
    is_first = db.query(models.Address).filter(models.Address.customer_id == customer.id, models.Address.tenant_id == tenant.id).count() == 0
    if payload.is_default or is_first:
        db.query(models.Address).filter(models.Address.customer_id == customer.id, models.Address.tenant_id == tenant.id).update({"is_default": False})
    address = models.Address(
        customer_id=customer.id, tenant_id=tenant.id,
        label=payload.label, full_name=payload.full_name, phone=payload.phone,
        address_line=payload.address_line, city=payload.city, postal_code=payload.postal_code,
        country=payload.country, is_default=payload.is_default or is_first,
    )
    db.add(address)
    db.commit()
    db.refresh(address)
    return _address_payload(address)


@router.put("/shop/{slug}/customer-auth/addresses/{address_id}")
def update_address(slug: str, address_id: str, payload: AddressRequest, db: Session = Depends(get_db), customer: models.User = Depends(current_customer)):
    tenant = _resolve_orzen_tenant(slug, db)
    address = _get_own_address(db, address_id, customer, tenant)
    if payload.is_default:
        db.query(models.Address).filter(models.Address.customer_id == customer.id, models.Address.tenant_id == tenant.id).update({"is_default": False})
    address.label = payload.label
    address.full_name = payload.full_name
    address.phone = payload.phone
    address.address_line = payload.address_line
    address.city = payload.city
    address.postal_code = payload.postal_code
    address.country = payload.country
    address.is_default = payload.is_default
    db.commit()
    return _address_payload(address)


@router.delete("/shop/{slug}/customer-auth/addresses/{address_id}")
def delete_address(slug: str, address_id: str, db: Session = Depends(get_db), customer: models.User = Depends(current_customer)):
    tenant = _resolve_orzen_tenant(slug, db)
    address = _get_own_address(db, address_id, customer, tenant)
    db.delete(address)
    db.commit()
    return {"ok": True}


def _get_own_address(db: Session, address_id: str, customer: models.User, tenant: models.User) -> models.Address:
    try:
        aid = _uuid.UUID(address_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Dirección no encontrada")
    address = db.query(models.Address).filter(
        models.Address.id == aid, models.Address.customer_id == customer.id, models.Address.tenant_id == tenant.id,
    ).first()
    if not address:
        raise HTTPException(status_code=404, detail="Dirección no encontrada")
    return address


# ── Wishlist ──────────────────────────────────────────────────────────────

@router.get("/shop/{slug}/customer-auth/wishlist")
def list_wishlist(slug: str, db: Session = Depends(get_db), customer: models.User = Depends(current_customer)):
    tenant = _resolve_orzen_tenant(slug, db)
    items = (
        db.query(models.WishlistItem)
        .filter(models.WishlistItem.customer_id == customer.id, models.WishlistItem.tenant_id == tenant.id)
        .order_by(models.WishlistItem.created_at.desc())
        .all()
    )
    product_ids = [i.product_id for i in items]
    products = {p.id: p for p in db.query(models.Product).filter(models.Product.id.in_(product_ids)).all()} if product_ids else {}
    return [
        {
            "product_id": str(i.product_id),
            "name": products[i.product_id].name if i.product_id in products else None,
            "price": products[i.product_id].price if i.product_id in products else None,
            "image_url": (products[i.product_id].image_url[0] if i.product_id in products and products[i.product_id].image_url else None),
            "status": products[i.product_id].status if i.product_id in products else None,
        }
        for i in items
    ]


@router.post("/shop/{slug}/customer-auth/wishlist")
def add_wishlist(slug: str, payload: WishlistAddRequest, db: Session = Depends(get_db), customer: models.User = Depends(current_customer)):
    tenant = _resolve_orzen_tenant(slug, db)
    try:
        pid = _uuid.UUID(payload.product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="product_id inválido")
    product = db.query(models.Product).filter(models.Product.id == pid, models.Product.owner_id == tenant.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    existing = db.query(models.WishlistItem).filter(
        models.WishlistItem.customer_id == customer.id, models.WishlistItem.product_id == pid,
    ).first()
    if not existing:
        db.add(models.WishlistItem(customer_id=customer.id, tenant_id=tenant.id, product_id=pid))
        db.commit()
    return {"ok": True}


@router.delete("/shop/{slug}/customer-auth/wishlist/{product_id}")
def remove_wishlist(slug: str, product_id: str, db: Session = Depends(get_db), customer: models.User = Depends(current_customer)):
    tenant = _resolve_orzen_tenant(slug, db)
    try:
        pid = _uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="product_id inválido")
    db.query(models.WishlistItem).filter(
        models.WishlistItem.customer_id == customer.id, models.WishlistItem.tenant_id == tenant.id, models.WishlistItem.product_id == pid,
    ).delete()
    db.commit()
    return {"ok": True}
