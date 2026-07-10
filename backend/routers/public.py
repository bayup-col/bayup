import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import cache as _cache
import crud, models, schemas
from database import get_db
from deps import create_shipment, push_notification
from rate_limit import limiter

router = APIRouter(tags=["public"])


# ── Schemas ───────────────────────────────────────────────────────────────

class PublicOrderItemRequest(BaseModel):
    product_variant_id: str
    quantity: int = Field(gt=0)
    price_at_purchase: float = Field(ge=0)


class PublicOrderCreateRequest(BaseModel):
    tenant_id: str
    total_price: float = Field(ge=0)
    customer_name: str = Field(min_length=1)
    customer_email: str | None = None
    customer_phone: str | None = None
    customer_city: str | None = None
    shipping_address: str | None = None
    payment_method: str = "cash"
    source: str = "web"
    items: list[PublicOrderItemRequest] = Field(min_length=1)




# ── Endpoints ─────────────────────────────────────────────────────────────

@router.get("/public/shop/{slug}")
@limiter.limit("30/minute")
async def get_public_shop(request: Request, response: Response, slug: str, db: Session = Depends(get_db)):
    cached = _cache.cache_get(_cache.shop_cache, slug)
    if cached is not None:
        response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
        return cached
    store = crud.get_user_by_slug(db, slug=slug)
    if not store or store.status == "Suspendido":
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
    collections = crud.get_collections_by_owner(db, owner_id=store.id)
    data = {
        "id": str(store.id),
        "owner_id": str(store.id),
        "full_name": store.full_name,
        "shop_slug": store.shop_slug,
        "phone": getattr(store, "phone", None),
        "logo_url": store.logo_url,
        "category": getattr(store, "category", None),
        "hours": getattr(store, "hours", None),
        "social_links": getattr(store, "social_links", None) or {},
        "whatsapp_lines": getattr(store, "whatsapp_lines", None) or [],
        "categories": [schemas.Collection.model_validate(c).model_dump(mode="json") for c in collections],
        "terms_conditions": getattr(store, "terms_conditions", None),
        "privacy_policy": getattr(store, "privacy_policy", None),
        "return_policy": getattr(store, "return_policy", None),
        "shipping_policy": getattr(store, "shipping_policy", None),
    }
    _cache.cache_set(_cache.shop_cache, slug, data, 60)
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    return data


@router.get("/public/stores/{store_id}/products")
@limiter.limit("30/minute")
async def get_public_store_products(request: Request, response: Response, store_id: str, db: Session = Depends(get_db)):
    try:
        store_uuid = _uuid.UUID(store_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="store_id inválido")
    products = crud.get_all_products(db, tenant_id=store_uuid, limit=500)
    response.headers["Cache-Control"] = "public, max-age=30, stale-while-revalidate=120"
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "price": p.price,
            "description": p.description,
            "image_url": p.image_url or [],
            "category": p.category,
            "sku": p.sku,
            "status": p.status,
        }
        for p in products if p.status == "active"
    ]


def resolve_variant_items(db: Session, tenant_uuid, raw_items: list) -> list:
    """Valida ítems de checkout público contra la DB (CRIT-002: nunca confiar en
    el precio del cliente). Acepta objetos con .product_variant_id/.quantity o
    dicts equivalentes. Crea una variante "Base" si el id recibido es en
    realidad un product_id (producto sin variantes)."""
    validated_items: list = []
    for item in raw_items:
        raw_id = item.product_variant_id if hasattr(item, "product_variant_id") else item["product_variant_id"]
        quantity = item.quantity if hasattr(item, "quantity") else item["quantity"]
        try:
            var_uuid = _uuid.UUID(str(raw_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="product_variant_id inválido")
        variant = db.query(models.ProductVariant).filter(models.ProductVariant.id == var_uuid).first()
        if not variant:
            product = db.query(models.Product).filter(
                models.Product.id == var_uuid,
                models.Product.owner_id == tenant_uuid,
            ).first()
            if not product:
                raise HTTPException(status_code=400, detail="Variante de producto no encontrada")
            variant = models.ProductVariant(
                id=_uuid.uuid4(),
                product_id=product.id,
                name="Base",
                sku=product.sku or "",
                stock=9999,
                price=product.price or 0,
            )
            db.add(variant)
            db.flush()
        product = db.query(models.Product).filter(
            models.Product.id == variant.product_id,
            models.Product.owner_id == tenant_uuid,
        ).first()
        if not product:
            raise HTTPException(status_code=400, detail="Variante no pertenece a esta tienda")
        db_price = variant.price if variant.price and variant.price > 0 else product.price
        validated_items.append(schemas.OrderItemBase(
            product_variant_id=variant.id,
            quantity=quantity,
            price_at_purchase=db_price,
        ))
    return validated_items


def finalize_web_order(
    db: Session, tenant_uuid, validated_items: list,
    customer_name: str, customer_email: str | None, customer_phone: str | None,
    customer_city: str | None, shipping_address: str | None,
    payment_method: str, source: str,
) -> models.Order:
    """Crea la orden ya validada, encola emails, genera envío y notifica al
    tenant. Compartido entre el checkout directo (/public/orders) y la
    confirmación de pago vía webhook de la pasarela (Wompi)."""
    import email_queue as _eq

    order_in = schemas.OrderCreate(
        tenant_id=tenant_uuid,
        total_price=0,
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        customer_city=customer_city,
        shipping_address=shipping_address,
        payment_method=payment_method,
        source=source,
        items=validated_items,
    )
    db_order = crud.create_order(db, order=order_in, customer_id=None, tenant_id=tenant_uuid)

    items_info = []
    for _item in db_order.items:
        _variant = db.query(models.ProductVariant).filter(models.ProductVariant.id == _item.product_variant_id).first()
        _product = db.query(models.Product).filter(models.Product.id == _variant.product_id).first() if _variant else None
        _iname = (_product.name if _product else "Producto") + (f" — {_variant.name}" if _variant and _variant.name else "")
        items_info.append({"name": _iname, "qty": _item.quantity, "price": float(_item.price_at_purchase)})

    tenant_user = db.query(models.User).filter(models.User.id == tenant_uuid).first()
    shop_name = (tenant_user.full_name or tenant_user.shop_slug or "Tu tienda") if tenant_user else "Tu tienda"

    shop_logo = (tenant_user.logo_url if tenant_user else None)

    if customer_email:
        _eq.enqueue("send_order_confirmation",
            email=customer_email, name=customer_name or "Cliente",
            order_id=str(db_order.id), items=items_info, total=float(db_order.total_price),
            payment_method=payment_method or "Online",
            customer_city=customer_city or "", customer_phone=customer_phone or "",
            shop_name=shop_name, shop_logo=shop_logo,
        )
        _eq.enqueue("send_web_order_invoice",
            email=customer_email, name=customer_name or "Cliente",
            order_id=str(db_order.id), shop_name=shop_name,
            shop_email=(tenant_user.email or "") if tenant_user else "",
            shop_phone=(tenant_user.phone or "") if tenant_user else "",
            customer_phone=customer_phone or "", customer_city=customer_city or "",
            items=items_info, total=float(db_order.total_price),
            payment_method=payment_method or "Online",
            created_at_iso=db_order.created_at.isoformat() if db_order.created_at else None,
            shop_logo=shop_logo,
        )

    if tenant_user and tenant_user.email:
        _eq.enqueue("send_new_sale_notification",
            owner_email=tenant_user.email, shop_name=shop_name, order_id=str(db_order.id),
            customer_name=customer_name or "Cliente",
            customer_email=customer_email or "", customer_phone=customer_phone or "",
            customer_city=customer_city or "", items=items_info,
            total=float(db_order.total_price), payment_method=payment_method or "Online",
        )

    total_fmt = f"${db_order.total_price:,.0f}".replace(",", ".")
    create_shipment(db, db_order, tenant_uuid)
    push_notification(db, tenant_uuid, "🛒 Nueva venta en tienda",
                      f"{customer_name or 'Cliente'} compró por {total_fmt}", "success")

    return db_order


@router.post("/public/orders")
@limiter.limit("10/minute")
def create_public_order(request: Request, payload: PublicOrderCreateRequest, db: Session = Depends(get_db)):
    """Checkout público del storefront (/shop/[slug]), sin autenticación."""
    try:
        tenant_uuid = _uuid.UUID(payload.tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="tenant_id inválido")

    validated_items = resolve_variant_items(db, tenant_uuid, payload.items)
    db_order = finalize_web_order(
        db, tenant_uuid, validated_items,
        customer_name=payload.customer_name, customer_email=payload.customer_email,
        customer_phone=payload.customer_phone, customer_city=payload.customer_city,
        shipping_address=payload.shipping_address, payment_method=payload.payment_method,
        source=payload.source,
    )
    return schemas.Order.model_validate(db_order).model_dump(mode="json")


@router.get("/public/orders/{order_id}")
async def public_order_tracking(order_id: str, db: Session = Depends(get_db)):
    """Tracking público de un pedido web, sin autenticación (usado por /pedido/[id])."""
    try:
        oid = _uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    order = db.query(models.Order).filter(models.Order.id == oid).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    tenant = db.query(models.User).filter(models.User.id == order.tenant_id).first()
    shop_name = (tenant.full_name or tenant.shop_slug or "Tienda") if tenant else "Tienda"
    items = []
    for item in order.items:
        variant = db.query(models.ProductVariant).filter(models.ProductVariant.id == item.product_variant_id).first()
        product = db.query(models.Product).filter(models.Product.id == variant.product_id).first() if variant else None
        iname = (product.name if product else "Producto") + (f" — {variant.name}" if variant and variant.name else "")
        items.append({"name": iname, "qty": item.quantity, "price": float(item.price_at_purchase)})
    return {
        "id":              str(order.id),
        "short_id":        str(order.id)[:8].upper(),
        "status":          order.status,
        "source":          order.source or "web",
        "customer_name":   order.customer_name,
        "customer_city":   order.customer_city,
        "total":           float(order.total_price),
        "payment_method":  order.payment_method,
        "created_at":      order.created_at.isoformat() if order.created_at else None,
        "shop_name":       shop_name,
        "shop_slug":       tenant.shop_slug if tenant else None,
        "items":           items,
    }


@router.get("/public/shop-info/{slug}")
@limiter.limit("60/minute")
async def get_public_shop_info(request: Request, slug: str, db: Session = Depends(get_db)):
    tenant = db.query(models.User).filter(
        models.User.shop_slug == slug, models.User.status == "Activo",
    ).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
    return {
        "name": tenant.full_name,
        "slug": tenant.shop_slug,
        "logo_url": tenant.logo_url,
        "phone": tenant.phone,
        "category": tenant.category,
        "story": tenant.story,
        "social_links": tenant.social_links or {},
    }


@router.get("/public/shop/{slug}/products")
@limiter.limit("60/minute")
async def get_public_shop_products(
    request: Request,
    slug: str,
    limit: int = Query(default=100, ge=1, le=500),
    skip: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    tenant = db.query(models.User).filter(
        models.User.shop_slug == slug, models.User.status == "Activo",
    ).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
    products = (
        db.query(models.Product)
        .filter(models.Product.owner_id == tenant.id, models.Product.status == "active")
        .offset(skip).limit(limit).all()
    )
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "price": p.price,
            "description": p.description,
            "image_url": p.image_url or [],
            "category": p.category,
            "sku": p.sku,
        }
        for p in products
    ]
