from fastapi import Depends, FastAPI, HTTPException, status, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import sys
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field
import threading
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Evita UnicodeEncodeError al imprimir emojis en consolas Windows (cp1252)
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

load_dotenv()

# --- ARRANQUE SEGURO (SIN IMPORTACIONES CRÍTICAS ARRIBA) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialización diferida para evitar Error 502 en Railway
    def init_task():
        try:
            from database import engine
            import models
            models.Base.metadata.create_all(bind=engine)
            print("✅ Motor Bayup: Infraestructura Sincronizada")
        except Exception as e:
            print(f"⚠️ Motor Bayup: Aviso en arranque: {e}")
            
    threading.Thread(target=init_task, daemon=True).start()
    yield

app = FastAPI(title="Bayup OS Platinum", lifespan=lifespan)

# --- RATE LIMITING ---
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- CORS ---
# NOTA: si en el futuro las tiendas activan dominio propio (custom_domain en el modelo User),
# esta whitelist estática no los cubrirá — habrá que validar el origen dinámicamente contra la DB.
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://bayup.com",
    "https://www.bayup.com",
    "https://bayup.com.co",
    "https://www.bayup.com.co",
    "https://bayup.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://bayup.*\.vercel\.app",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# --- HEADERS DE SEGURIDAD HTTP ---
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    return response

class UserLoginRequest(BaseModel):
    email: str
    password: str

@app.get("/")
def read_root():
    # Liveness simple: Render usa esta ruta como healthcheck por defecto.
    # No verifica la DB a proposito, para no reiniciar el servicio por un hiccup pasajero.
    return {"status": "Active", "version": "2.1 Platinum Production"}

@app.get("/health")
def health_check():
    """Readiness real: confirma que la conexion a la base de datos funciona."""
    from sqlalchemy import text
    from database import SessionLocal
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Base de datos no disponible: {e}")
    finally:
        db.close()

@app.post("/auth/login")
@limiter.limit("5/minute")
def login(request: Request, form_data: UserLoginRequest):
    # Importaciones internas para evitar bloqueos en el arranque
    from database import SessionLocal
    import crud, security
    
    db = SessionLocal()
    try:
        user = crud.get_user_by_email(db, email=form_data.email)
        if not user or not security.verify_password(form_data.password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Credenciales inválidas")
        
        access_token = security.create_access_token(data={"sub": user.email})
        
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user": {
                "email": user.email,
                "full_name": getattr(user, 'full_name', ""),
                "role": getattr(user, 'role', "admin_tienda"),
                "is_global_staff": getattr(user, 'is_global_staff', False),
                "permissions": getattr(user, 'permissions', {}) or {},
                "plan": {
                    "id": str(user.plan.id) if getattr(user, 'plan', None) else None,
                    "name": user.plan.name if getattr(user, 'plan', None) else "Básico"
                } if getattr(user, 'plan', None) else None,
                "shop_slug": getattr(user, 'shop_slug', ""),
                "logo_url": getattr(user, 'logo_url', ""),
                "onboarding_completed": bool(getattr(user, 'onboarding_completed', False)),
            }
        }
    finally:
        db.close()

class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=1)
    # El frontend manda un id de plan ficticio (no es un UUID real); el plan
    # efectivo se asigna automaticamente al plan marcado is_default=True.
    plan_id: str | None = None

@app.post("/auth/register")
@limiter.limit("5/minute")
def register(request: Request, payload: RegisterRequest):
    from database import SessionLocal
    import crud, schemas

    db = SessionLocal()
    try:
        existing = crud.get_user_by_email(db, email=payload.email)
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese correo")

        user_in = schemas.UserCreate(
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
        )
        user = crud.create_user(db, user=user_in)
        return {"id": str(user.id), "email": user.email}
    finally:
        db.close()

def _get_bearer_token(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="No token")
    parts = auth_header.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1]:
        raise HTTPException(status_code=401, detail="Header Authorization inválido, se espera 'Bearer <token>'")
    return parts[1]

async def _authenticate(request: Request, db):
    """Reutiliza security.get_current_user pasando los valores explícitamente
    (evita la resolución vía Depends, ya que estas rutas manejan su propia sesión)."""
    import security
    token = _get_bearer_token(request)
    return await security.get_current_user(token=token, db=db)

def _tenant_id(user):
    return user.owner_id or user.id

@app.get("/auth/me")
async def read_users_me(request: Request):
    from database import SessionLocal

    db = SessionLocal()
    try:
        current_user = await _authenticate(request, db)
        return {
            "id": str(current_user.id),
            "email": current_user.email,
            "full_name": getattr(current_user, 'full_name', ""),
            "role": getattr(current_user, 'role', "admin_tienda"),
            "is_global_staff": getattr(current_user, 'is_global_staff', False),
            "shop_slug": getattr(current_user, 'shop_slug', ""),
            "logo_url": getattr(current_user, 'logo_url', ""),
            "permissions": getattr(current_user, 'permissions', {}) or {},
            "onboarding_completed": bool(getattr(current_user, 'onboarding_completed', False)),
        }
    finally:
        db.close()

class ProductCreateRequest(BaseModel):
    name: str = Field(min_length=1)
    description: str | None = None
    price: float = Field(gt=0)
    wholesale_price: float | None = Field(default=0.0, ge=0)
    cost: float | None = Field(default=0.0, ge=0)
    sku: str | None = None
    status: str = "active"
    category: str | None = None
    add_gateway_fee: bool | None = False
    image_url: object | None = None
    collection_id: str | None = None
    variants: list = []

@app.get("/products")
async def get_products(request: Request, skip: int = 0, limit: int = 200):
    import crud, schemas
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        products = crud.get_products_by_owner(db, owner_id=_tenant_id(user), skip=skip, limit=min(limit, 500))
        return [schemas.Product.model_validate(p).model_dump(mode="json") for p in products]
    finally:
        db.close()

@app.post("/products")
async def create_product_route(payload: ProductCreateRequest, request: Request):
    import crud, schemas
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        product_in = schemas.ProductCreate(**payload.model_dump())
        db_product = crud.create_product(db, product=product_in, owner_id=_tenant_id(user))
        return schemas.Product.model_validate(db_product).model_dump(mode="json")
    finally:
        db.close()

@app.put("/products/{product_id}")
async def update_product_route(product_id: str, payload: ProductCreateRequest, request: Request):
    import crud, schemas, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        try:
            product_uuid = uuid_lib.UUID(product_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="product_id inválido")
        db_product = crud.get_product(db, product_id=product_uuid, tenant_id=tenant_id)
        if not db_product:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        product_in = schemas.ProductCreate(**payload.model_dump())
        updated = crud.update_product(db, db_product, product_in)
        return schemas.Product.model_validate(updated).model_dump(mode="json")
    finally:
        db.close()

@app.delete("/products/{product_id}")
async def delete_product_route(product_id: str, request: Request):
    import crud, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        try:
            product_uuid = uuid_lib.UUID(product_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="product_id inválido")
        deleted = crud.delete_product(db, product_id=product_uuid, owner_id=tenant_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        return {"ok": True}
    finally:
        db.close()

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

@app.get("/orders")
async def get_orders(request: Request, skip: int = 0, limit: int = 200):
    import crud, schemas
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        orders = crud.get_orders_by_tenant(db, tenant_id=_tenant_id(user), skip=skip, limit=min(limit, 500))
        return [schemas.Order.model_validate(o).model_dump(mode="json") for o in orders]
    finally:
        db.close()

@app.post("/orders")
async def create_order_route(payload: OrderCreateRequest, request: Request):
    import crud, schemas
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        order_in = schemas.OrderCreate(tenant_id=tenant_id, **payload.model_dump())
        db_order = crud.create_order(db, order=order_in, customer_id=user.id, tenant_id=tenant_id)
        return schemas.Order.model_validate(db_order).model_dump(mode="json")
    finally:
        db.close()

VALID_ORDER_STATUSES = {"pending", "processing", "completed", "cancelled"}

class OrderUpdateRequest(BaseModel):
    status: str

@app.put("/orders/{order_id}")
async def update_order_route(order_id: str, payload: OrderUpdateRequest, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        if payload.status not in VALID_ORDER_STATUSES:
            raise HTTPException(status_code=400, detail=f"status inválido, debe ser uno de: {sorted(VALID_ORDER_STATUSES)}")
        try:
            order_uuid = uuid_lib.UUID(order_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="order_id inválido")
        db_order = db.query(models.Order).filter(
            models.Order.id == order_uuid,
            models.Order.tenant_id == tenant_id,
        ).first()
        if not db_order:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        db_order.status = payload.status
        db.commit()
        return {"id": str(db_order.id), "status": db_order.status}
    finally:
        db.close()

@app.get("/notifications")
async def get_notifications(request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        notifications = db.query(models.Notification).filter(
            models.Notification.tenant_id == _tenant_id(user)
        ).order_by(models.Notification.created_at.desc()).limit(50).all()
        return [
            {
                "id": str(n.id), "title": n.title, "message": n.message,
                "type": n.type, "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            } for n in notifications
        ]
    finally:
        db.close()

class CollectionCreateRequest(BaseModel):
    title: str
    description: str | None = None
    image_url: str | None = None
    status: str = "active"

@app.get("/collections")
async def get_collections(request: Request):
    import crud, schemas
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        collections = crud.get_collections_by_owner(db, owner_id=_tenant_id(user))
        return [schemas.Collection.model_validate(c).model_dump(mode="json") for c in collections]
    finally:
        db.close()

@app.post("/collections")
async def create_collection_route(payload: CollectionCreateRequest, request: Request):
    import crud, schemas
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        collection_in = schemas.CollectionCreate(**payload.model_dump())
        db_collection = crud.create_collection(db, collection=collection_in, owner_id=_tenant_id(user))
        return schemas.Collection.model_validate(db_collection).model_dump(mode="json")
    finally:
        db.close()

# --- ENDPOINTS PÚBLICOS DE TIENDA (sin auth, para el storefront /shop/[slug]) ---
@app.get("/public/shop/{slug}")
async def get_public_shop(slug: str):
    import crud, schemas
    from database import SessionLocal
    db = SessionLocal()
    try:
        store = crud.get_user_by_slug(db, slug=slug)
        if not store:
            raise HTTPException(status_code=404, detail="Tienda no encontrada")
        collections = crud.get_collections_by_owner(db, owner_id=store.id)
        return {
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
        }
    finally:
        db.close()

@app.get("/public/stores/{store_id}/products")
async def get_public_store_products(store_id: str):
    import crud, schemas, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        try:
            store_uuid = uuid_lib.UUID(store_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="store_id inválido")
        products = crud.get_all_products(db, tenant_id=store_uuid, limit=500)
        return [
            schemas.Product.model_validate(p).model_dump(mode="json")
            for p in products if p.status == "active"
        ]
    finally:
        db.close()

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

@app.post("/public/orders")
@limiter.limit("10/minute")
def create_public_order(request: Request, payload: PublicOrderCreateRequest):
    """Checkout publico del storefront (/shop/[slug]), sin autenticacion."""
    import crud, schemas, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        try:
            tenant_uuid = uuid_lib.UUID(payload.tenant_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="tenant_id inválido")

        order_in = schemas.OrderCreate(
            tenant_id=tenant_uuid,
            total_price=payload.total_price,
            customer_name=payload.customer_name,
            customer_email=payload.customer_email,
            customer_phone=payload.customer_phone,
            customer_city=payload.customer_city,
            shipping_address=payload.shipping_address,
            payment_method=payload.payment_method,
            source=payload.source,
            items=[
                schemas.OrderItemBase(
                    product_variant_id=uuid_lib.UUID(item.product_variant_id),
                    quantity=item.quantity,
                    price_at_purchase=item.price_at_purchase,
                ) for item in payload.items
            ],
        )
        db_order = crud.create_order(db, order=order_in, customer_id=None, tenant_id=tenant_uuid)
        return schemas.Order.model_validate(db_order).model_dump(mode="json")
    except ValueError:
        raise HTTPException(status_code=400, detail="product_variant_id inválido")
    finally:
        db.close()

def _serialize_customer(u) -> dict:
    """Serializacion segura de un cliente: nunca incluye hashed_password ni datos bancarios."""
    return {
        "id": str(u.id),
        "full_name": u.full_name,
        "email": u.email,
        "phone": u.phone,
        "city": u.customer_city,
        "status": u.status,
        "customer_type": u.customer_type,
        "acquisition_channel": u.acquisition_channel,
        "total_spent": u.total_spent or 0.0,
        "loyalty_points": u.loyalty_points or 0,
        "last_purchase_date": u.last_purchase_date.isoformat() if u.last_purchase_date else None,
        "last_purchase_summary": u.last_purchase_summary,
    }

@app.get("/admin/users")
async def get_admin_users(request: Request):
    """Lista los clientes (role='cliente') de la tienda del usuario autenticado."""
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        customers = db.query(models.User).filter(
            models.User.owner_id == tenant_id,
            models.User.role == "cliente",
        ).all()
        return [_serialize_customer(c) for c in customers]
    finally:
        db.close()

@app.delete("/admin/users/{user_id}")
async def delete_admin_user(user_id: str, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        try:
            target_uuid = uuid_lib.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="user_id inválido")
        target = db.query(models.User).filter(
            models.User.id == target_uuid,
            models.User.owner_id == tenant_id,
        ).first()
        if not target:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        db.delete(target)
        db.commit()
        return {"ok": True}
    finally:
        db.close()

# ── ENVÍOS (tarifas) ──────────────────────────────────────────────────────
class ShippingOptionRequest(BaseModel):
    name: str = Field(min_length=1)
    cost: float = Field(ge=0)
    min_order_total: float | None = None

def _serialize_shipping_option(s):
    return {
        "id": str(s.id),
        "name": s.name,
        "cost": s.cost,
        "min_order_total": s.min_order_total,
        "owner_id": str(s.owner_id) if s.owner_id else None,
    }

@app.get("/shipping")
async def get_shipping_options(request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        options = db.query(models.ShippingOption).filter(models.ShippingOption.owner_id == tenant_id).all()
        return [_serialize_shipping_option(o) for o in options]
    finally:
        db.close()

@app.post("/shipping")
async def create_shipping_option(payload: ShippingOptionRequest, request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        option = models.ShippingOption(name=payload.name, cost=payload.cost, min_order_total=payload.min_order_total, owner_id=tenant_id)
        db.add(option)
        db.commit()
        return _serialize_shipping_option(option)
    finally:
        db.close()

@app.get("/shipping/{shipping_id}")
async def get_shipping_option(shipping_id: str, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        try:
            target_uuid = uuid_lib.UUID(shipping_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="id inválido")
        option = db.query(models.ShippingOption).filter(models.ShippingOption.id == target_uuid, models.ShippingOption.owner_id == tenant_id).first()
        if not option:
            raise HTTPException(status_code=404, detail="Opción de envío no encontrada")
        return _serialize_shipping_option(option)
    finally:
        db.close()

@app.put("/shipping/{shipping_id}")
async def update_shipping_option(shipping_id: str, payload: ShippingOptionRequest, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        try:
            target_uuid = uuid_lib.UUID(shipping_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="id inválido")
        option = db.query(models.ShippingOption).filter(models.ShippingOption.id == target_uuid, models.ShippingOption.owner_id == tenant_id).first()
        if not option:
            raise HTTPException(status_code=404, detail="Opción de envío no encontrada")
        option.name = payload.name
        option.cost = payload.cost
        option.min_order_total = payload.min_order_total
        db.commit()
        return _serialize_shipping_option(option)
    finally:
        db.close()

@app.delete("/shipping/{shipping_id}")
async def delete_shipping_option(shipping_id: str, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        try:
            target_uuid = uuid_lib.UUID(shipping_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="id inválido")
        option = db.query(models.ShippingOption).filter(models.ShippingOption.id == target_uuid, models.ShippingOption.owner_id == tenant_id).first()
        if not option:
            raise HTTPException(status_code=404, detail="Opción de envío no encontrada")
        db.delete(option)
        db.commit()
        return {"ok": True}
    finally:
        db.close()

# ── IMPUESTOS ─────────────────────────────────────────────────────────────
class TaxRateRequest(BaseModel):
    name: str = Field(min_length=1)
    rate: float = Field(ge=0)
    is_default: bool = False

def _serialize_tax_rate(t):
    return {
        "id": str(t.id),
        "name": t.name,
        "rate": t.rate,
        "is_default": bool(t.is_default),
        "owner_id": str(t.owner_id) if t.owner_id else None,
    }

@app.get("/taxes")
async def get_tax_rates(request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        rates = db.query(models.TaxRate).filter(models.TaxRate.owner_id == tenant_id).all()
        return [_serialize_tax_rate(t) for t in rates]
    finally:
        db.close()

@app.post("/taxes")
async def create_tax_rate(payload: TaxRateRequest, request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        if payload.is_default:
            db.query(models.TaxRate).filter(models.TaxRate.owner_id == tenant_id).update({models.TaxRate.is_default: False})
        rate = models.TaxRate(name=payload.name, rate=payload.rate, is_default=payload.is_default, owner_id=tenant_id)
        db.add(rate)
        db.commit()
        return _serialize_tax_rate(rate)
    finally:
        db.close()

@app.get("/taxes/{tax_id}")
async def get_tax_rate(tax_id: str, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        try:
            target_uuid = uuid_lib.UUID(tax_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="id inválido")
        rate = db.query(models.TaxRate).filter(models.TaxRate.id == target_uuid, models.TaxRate.owner_id == tenant_id).first()
        if not rate:
            raise HTTPException(status_code=404, detail="Tasa de impuesto no encontrada")
        return _serialize_tax_rate(rate)
    finally:
        db.close()

@app.put("/taxes/{tax_id}")
async def update_tax_rate(tax_id: str, payload: TaxRateRequest, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        try:
            target_uuid = uuid_lib.UUID(tax_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="id inválido")
        rate = db.query(models.TaxRate).filter(models.TaxRate.id == target_uuid, models.TaxRate.owner_id == tenant_id).first()
        if not rate:
            raise HTTPException(status_code=404, detail="Tasa de impuesto no encontrada")
        if payload.is_default:
            db.query(models.TaxRate).filter(models.TaxRate.owner_id == tenant_id, models.TaxRate.id != target_uuid).update({models.TaxRate.is_default: False})
        rate.name = payload.name
        rate.rate = payload.rate
        rate.is_default = payload.is_default
        db.commit()
        return _serialize_tax_rate(rate)
    finally:
        db.close()

@app.delete("/taxes/{tax_id}")
async def delete_tax_rate(tax_id: str, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        try:
            target_uuid = uuid_lib.UUID(tax_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="id inválido")
        rate = db.query(models.TaxRate).filter(models.TaxRate.id == target_uuid, models.TaxRate.owner_id == tenant_id).first()
        if not rate:
            raise HTTPException(status_code=404, detail="Tasa de impuesto no encontrada")
        db.delete(rate)
        db.commit()
        return {"ok": True}
    finally:
        db.close()

# ── EQUIPO / STAFF (distinto de /admin/users, que lista CLIENTES) ────────
_BASE_ROLE_DEFS = [
    ("admin_tienda", "Administrador"),
    ("editor", "Editor"),
    ("logistica", "Logística"),
    ("vendedor", "Vendedor"),
]

def _log_staff_activity(db, models, tenant_id, actor, action, detail, target_id=None):
    log = models.ActivityLog(
        user_id=actor.id,
        action=action,
        target_id=target_id,
        detail=detail,
        tenant_id=tenant_id,
    )
    db.add(log)
    db.commit()

def _serialize_staff_member(u):
    return {
        "id": str(u.id),
        "full_name": u.full_name or "Usuario",
        "email": u.email,
        "role": u.role,
        "status": getattr(u, "status", None) or "Activo",
        "created_at": u.created_at.isoformat() if getattr(u, "created_at", None) else None,
    }

@app.get("/admin/staff")
async def get_admin_staff(request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        owner = db.query(models.User).filter(models.User.id == tenant_id).first()
        staff = db.query(models.User).filter(
            models.User.owner_id == tenant_id,
            models.User.role != "cliente",
        ).all()
        result = []
        if owner:
            result.append(_serialize_staff_member(owner))
        result.extend(_serialize_staff_member(s) for s in staff)
        return result
    finally:
        db.close()

class StaffCreateRequest(BaseModel):
    email: str
    full_name: str
    password: str
    role: str = "vendedor"
    status: str = "Invitado"

@app.post("/admin/staff")
async def create_admin_staff(payload: StaffCreateRequest, request: Request):
    import models, crud, schemas, security
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        if crud.get_user_by_email(db, email=payload.email):
            raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese correo")
        new_staff = models.User(
            email=payload.email,
            full_name=payload.full_name,
            hashed_password=security.get_password_hash(payload.password),
            role=payload.role,
            status=payload.status,
            owner_id=tenant_id,
        )
        db.add(new_staff)
        db.commit()
        _log_staff_activity(db, models, tenant_id, user, "CREATE_USER", f"Invitó a {payload.full_name} ({payload.email}) como {payload.role}", target_id=str(new_staff.id))
        return _serialize_staff_member(new_staff)
    finally:
        db.close()

class StaffUpdateRequest(BaseModel):
    email: str
    new_role: str | None = None
    full_name: str | None = None
    status: str | None = None

@app.post("/admin/update-user")
async def update_admin_staff(payload: StaffUpdateRequest, request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        target = db.query(models.User).filter(
            models.User.email == payload.email,
            models.User.owner_id == tenant_id,
        ).first()
        if not target:
            raise HTTPException(status_code=404, detail="Miembro del staff no encontrado")
        if payload.new_role:
            target.role = payload.new_role
        if payload.full_name:
            target.full_name = payload.full_name
        if payload.status:
            target.status = payload.status
        db.commit()
        _log_staff_activity(db, models, tenant_id, user, "UPDATE_USER", f"Actualizó a {target.full_name} ({target.email})", target_id=str(target.id))
        return _serialize_staff_member(target)
    finally:
        db.close()

@app.delete("/admin/staff/{staff_id}")
async def delete_admin_staff(staff_id: str, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        try:
            target_uuid = uuid_lib.UUID(staff_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="id inválido")
        target = db.query(models.User).filter(
            models.User.id == target_uuid,
            models.User.owner_id == tenant_id,
        ).first()
        if not target:
            raise HTTPException(status_code=404, detail="Miembro del staff no encontrado")
        name, email = target.full_name, target.email
        db.delete(target)
        db.commit()
        _log_staff_activity(db, models, tenant_id, user, "DELETE_USER", f"Eliminó a {name} ({email})", target_id=staff_id)
        return {"ok": True}
    finally:
        db.close()

@app.get("/admin/logs")
async def get_admin_logs(request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        logs = db.query(models.ActivityLog).filter(models.ActivityLog.tenant_id == tenant_id).order_by(models.ActivityLog.created_at.desc()).limit(100).all()
        actor_ids = {l.user_id for l in logs if l.user_id}
        actors = {u.id: u for u in db.query(models.User).filter(models.User.id.in_(actor_ids)).all()} if actor_ids else {}
        return [{
            "id": str(l.id),
            "action": l.action,
            "detail": l.detail,
            "target_id": l.target_id,
            "user_name": actors[l.user_id].full_name if l.user_id in actors else "Sistema",
            "created_at": l.created_at.isoformat() if l.created_at else None,
        } for l in logs]
    finally:
        db.close()

# ── ROLES Y PERMISOS ──────────────────────────────────────────────────────
def _serialize_custom_role(r):
    return {"id": r.name, "name": r.name, "permissions": r.permissions or {}, "owner_id": str(r.owner_id) if r.owner_id else None}

@app.get("/admin/roles")
async def get_admin_roles(request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        roles = db.query(models.CustomRole).filter(models.CustomRole.owner_id == tenant_id).all()
        if not roles:
            for role_id, _label in _BASE_ROLE_DEFS:
                role = models.CustomRole(name=role_id, permissions={}, owner_id=tenant_id)
                db.add(role)
            db.commit()
            roles = db.query(models.CustomRole).filter(models.CustomRole.owner_id == tenant_id).all()
        return [_serialize_custom_role(r) for r in roles]
    finally:
        db.close()

class RoleUpdateRequest(BaseModel):
    name: str
    permissions: dict = {}

@app.put("/admin/roles/{role_name}")
async def update_admin_role(role_name: str, payload: RoleUpdateRequest, request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        role = db.query(models.CustomRole).filter(models.CustomRole.owner_id == tenant_id, models.CustomRole.name == role_name).first()
        if not role:
            role = models.CustomRole(name=role_name, permissions=payload.permissions, owner_id=tenant_id)
            db.add(role)
        else:
            role.permissions = payload.permissions
        db.commit()
        return _serialize_custom_role(role)
    finally:
        db.close()

class ExpenseCreateRequest(BaseModel):
    description: str = Field(min_length=1)
    amount: float = Field(gt=0)
    due_date: str | None = None
    status: str = "pending"
    category: str = "diario"
    invoice_num: str | None = None
    items: list | None = None
    description_detail: str | None = None

def _serialize_expense(e) -> dict:
    return {
        "id": str(e.id),
        "description": e.description,
        "amount": e.amount,
        "due_date": e.due_date.isoformat() if e.due_date else None,
        "status": e.status,
        "category": e.category,
        "invoice_num": e.invoice_num,
        "items": e.items,
        "description_detail": e.description_detail,
    }

async def _get_expenses(request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        expenses = db.query(models.Expense).filter(models.Expense.tenant_id == tenant_id).all()
        return [_serialize_expense(e) for e in expenses]
    finally:
        db.close()

@app.get("/expenses")
async def get_expenses(request: Request):
    return await _get_expenses(request)

@app.get("/finances/expenses")
async def get_finances_expenses(request: Request):
    return await _get_expenses(request)

@app.post("/expenses")
async def create_expense(payload: ExpenseCreateRequest, request: Request):
    import models, uuid as uuid_lib
    from datetime import datetime
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        due_date = datetime.fromisoformat(payload.due_date) if payload.due_date else None
        db_expense = models.Expense(
            id=uuid_lib.uuid4(),
            description=payload.description,
            amount=payload.amount,
            due_date=due_date,
            status=payload.status,
            category=payload.category,
            tenant_id=tenant_id,
            invoice_num=payload.invoice_num,
            items=payload.items,
            description_detail=payload.description_detail,
        )
        db.add(db_expense)
        db.commit()
        return _serialize_expense(db_expense)
    finally:
        db.close()

# Campos del perfil de tienda que el usuario puede editar desde Settings General
PROFILE_EDITABLE_FIELDS = {
    "full_name", "logo_url", "category", "story", "shop_slug",
    "email", "phone", "address", "customer_city", "country", "hours",
    "website", "nit", "tax_regime", "legal_rep", "social_links",
}

class UpdateProfileRequest(BaseModel):
    full_name: str | None = None
    logo_url: str | None = None
    category: str | None = None
    story: str | None = None
    shop_slug: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    customer_city: str | None = None
    country: str | None = None
    hours: str | None = None
    website: str | None = None
    nit: str | None = None
    tax_regime: str | None = None
    legal_rep: str | None = None
    social_links: dict | None = None

@app.put("/admin/update-profile")
async def update_profile(payload: UpdateProfileRequest, request: Request):
    import crud
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        update_data = payload.model_dump(exclude_unset=True)
        if update_data.get("shop_slug") and update_data["shop_slug"] != user.shop_slug:
            existing = crud.get_user_by_slug(db, slug=update_data["shop_slug"])
            if existing and existing.id != user.id:
                raise HTTPException(status_code=400, detail="Esa URL de tienda ya está en uso, elige otra")
        for key, value in update_data.items():
            if key in PROFILE_EDITABLE_FIELDS:
                setattr(user, key, value)
        db.commit()
        return {"ok": True}
    finally:
        db.close()

@app.post("/onboarding/complete")
async def complete_onboarding(request: Request):
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        user.onboarding_completed = True
        db.commit()
        return {"ok": True}
    finally:
        db.close()

@app.post("/admin/upload-image")
async def upload_image(request: Request, file: UploadFile = File(...)):
    import s3_service
    from database import SessionLocal
    db = SessionLocal()
    try:
        await _authenticate(request, db)
    finally:
        db.close()

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen no puede superar 5MB")

    url = s3_service.upload_file_and_get_public_url(contents, file.content_type, file.filename or "image")
    if not url:
        raise HTTPException(
            status_code=503,
            detail="El almacenamiento de imágenes no está configurado (faltan SUPABASE_S3_ENDPOINT / S3_BUCKET_NAME).",
        )
    return {"url": url}

def _require_super_admin(user) -> None:
    if not (getattr(user, "is_global_staff", False) or user.role == "super_admin"):
        raise HTTPException(status_code=403, detail="No autorizado")

@app.get("/super-admin/stats")
async def get_super_admin_stats(request: Request):
    import models
    from sqlalchemy import func
    from datetime import datetime
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)

        # Tiendas raiz: admin_tienda sin owner_id (no son sub-cuentas ni clientes)
        companies_q = db.query(models.User).filter(
            models.User.role == "admin_tienda",
            models.User.owner_id.is_(None),
        )
        total_companies = companies_q.count()
        active_companies = companies_q.filter(models.User.status.in_(["Activo", "active"])).count()

        total_users = db.query(models.User).count()
        total_orders = db.query(models.Order).count()
        total_revenue = db.query(func.coalesce(func.sum(models.Order.total_price), 0.0)).scalar() or 0.0
        total_commission = db.query(func.coalesce(func.sum(models.Order.commission_amount), 0.0)).scalar() or 0.0

        now = datetime.utcnow()
        today_start = datetime(now.year, now.month, now.day)
        month_start = datetime(now.year, now.month, 1)

        commission_today = db.query(func.coalesce(func.sum(models.Order.commission_amount), 0.0)).filter(
            models.Order.created_at >= today_start
        ).scalar() or 0.0
        commission_month = db.query(func.coalesce(func.sum(models.Order.commission_amount), 0.0)).filter(
            models.Order.created_at >= month_start
        ).scalar() or 0.0
        revenue_today = db.query(func.coalesce(func.sum(models.Order.total_price), 0.0)).filter(
            models.Order.created_at >= today_start
        ).scalar() or 0.0
        revenue_month = db.query(func.coalesce(func.sum(models.Order.total_price), 0.0)).filter(
            models.Order.created_at >= month_start
        ).scalar() or 0.0

        return {
            "total_companies": total_companies,
            "active_companies": active_companies,
            "total_users": total_users,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "total_commission": total_commission,
            "commission_today": commission_today,
            "commission_month": commission_month,
            "revenue_today": revenue_today,
            "revenue_month": revenue_month,
        }
    finally:
        db.close()

@app.get("/super-admin/companies")
async def get_super_admin_companies(request: Request):
    import models
    from sqlalchemy import func
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)

        companies = db.query(models.User).filter(
            models.User.role == "admin_tienda",
            models.User.owner_id.is_(None),
        ).all()

        result = []
        for c in companies:
            total_sales = db.query(func.coalesce(func.sum(models.Order.total_price), 0.0)).filter(
                models.Order.tenant_id == c.id
            ).scalar() or 0.0
            total_commission = db.query(func.coalesce(func.sum(models.Order.commission_amount), 0.0)).filter(
                models.Order.tenant_id == c.id
            ).scalar() or 0.0
            total_orders = db.query(models.Order).filter(models.Order.tenant_id == c.id).count()
            total_products = db.query(models.Product).filter(models.Product.owner_id == c.id).count()

            result.append({
                "id": str(c.id),
                "full_name": c.full_name,
                "email": c.email,
                "status": c.status,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "phone": c.phone,
                "city": c.customer_city,
                "shop_slug": c.shop_slug,
                "plan": {"name": c.plan.name, "price": c.plan.monthly_fee} if c.plan else None,
                "stats": {
                    "total_sales": total_sales,
                    "total_products": total_products,
                    "total_orders": total_orders,
                    "total_commission": total_commission,
                },
            })
        return result
    finally:
        db.close()

def _last_n_months(n: int = 12):
    from datetime import datetime
    now = datetime.utcnow()
    year, month = now.year, now.month
    out = []
    for _ in range(n):
        out.append((year, month))
        month -= 1
        if month == 0:
            month, year = 12, year - 1
    return list(reversed(out))

_MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

@app.get("/super-admin/treasury")
async def get_super_admin_treasury(request: Request):
    """Tesoreria global: ingresos/comision por mes, ranking de tiendas, ultimas transacciones."""
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)

        orders = db.query(models.Order).order_by(models.Order.created_at.desc()).all()
        tenants = {
            t.id: t for t in db.query(models.User).filter(
                models.User.role == "admin_tienda", models.User.owner_id.is_(None)
            ).all()
        }

        # --- Serie mensual (ultimos 12 meses) ---
        months = _last_n_months(12)
        buckets = {ym: {"rev": 0.0, "com": 0.0, "orders": 0} for ym in months}
        for o in orders:
            if not o.created_at:
                continue
            ym = (o.created_at.year, o.created_at.month)
            if ym in buckets:
                buckets[ym]["rev"] += o.total_price or 0.0
                buckets[ym]["com"] += o.commission_amount or 0.0
                buckets[ym]["orders"] += 1
        monthly = [
            {"month": _MONTH_LABELS[m - 1], "rev": buckets[(y, m)]["rev"], "com": buckets[(y, m)]["com"], "orders": buckets[(y, m)]["orders"]}
            for (y, m) in months
        ]

        # --- Ranking de tiendas por ingresos ---
        per_tenant: dict = {}
        for o in orders:
            if not o.tenant_id:
                continue
            entry = per_tenant.setdefault(o.tenant_id, {"rev": 0.0, "orders": 0})
            entry["rev"] += o.total_price or 0.0
            entry["orders"] += 1
        total_rev_all = sum(e["rev"] for e in per_tenant.values()) or 1.0
        companies_ranking = []
        for tenant_id, e in per_tenant.items():
            t = tenants.get(tenant_id)
            companies_ranking.append({
                "name": t.full_name if t else "Tienda eliminada",
                "rev": e["rev"],
                "orders": e["orders"],
                "plan": t.plan.name if (t and t.plan) else "Básico",
                "pct": round((e["rev"] / total_rev_all) * 100),
            })
        companies_ranking.sort(key=lambda c: c["rev"], reverse=True)

        # --- Ultimas transacciones ---
        transactions = []
        for o in orders[:10]:
            t = tenants.get(o.tenant_id)
            transactions.append({
                "id": f"TXN-{str(o.id)[:8].upper()}",
                "company": t.full_name if t else "Tienda eliminada",
                "amount": o.total_price or 0.0,
                "date": o.created_at.isoformat() if o.created_at else None,
            })

        return {"monthly": monthly, "companies": companies_ranking[:10], "transactions": transactions}
    finally:
        db.close()

_SECTOR_COLORS = ["#00f2ff", "#7c3aed", "#10b981", "#f59e0b", "#6b7280", "#ec4899", "#3b82f6"]

@app.get("/super-admin/reports")
async def get_super_admin_reports(request: Request, period: str = "mes"):
    """Analitica global: KPIs por periodo, top empresas, sectores, actividad por hora."""
    import models
    from datetime import datetime, timedelta
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)

        now = datetime.utcnow()
        span_days = {"dia": 1, "semana": 7, "mes": 30, "año": 365}.get(period, 30)
        start = now - timedelta(days=span_days)
        prev_start = now - timedelta(days=span_days * 2)

        orders = db.query(models.Order).filter(models.Order.created_at >= start).all()
        prev_orders = db.query(models.Order).filter(
            models.Order.created_at >= prev_start, models.Order.created_at < start
        ).all()
        tenants = {
            t.id: t for t in db.query(models.User).filter(
                models.User.role == "admin_tienda", models.User.owner_id.is_(None)
            ).all()
        }

        rev = sum(o.total_price or 0.0 for o in orders)
        com = sum(o.commission_amount or 0.0 for o in orders)
        prev_rev = sum(o.total_price or 0.0 for o in prev_orders)
        delta = round(((rev - prev_rev) / prev_rev) * 100) if prev_rev else 0

        new_companies = db.query(models.User).filter(
            models.User.role == "admin_tienda", models.User.owner_id.is_(None),
            models.User.created_at >= start,
        ).count()
        new_users = len({o.customer_email for o in orders if o.customer_email})

        # --- Top empresas por ingresos en el periodo ---
        per_tenant: dict = {}
        for o in orders:
            if not o.tenant_id:
                continue
            entry = per_tenant.setdefault(o.tenant_id, 0.0)
            per_tenant[o.tenant_id] = entry + (o.total_price or 0.0)
        total_rev = sum(per_tenant.values()) or 1.0
        top = []
        for tenant_id, tenant_rev in per_tenant.items():
            t = tenants.get(tenant_id)
            top.append({
                "name": t.full_name if t else "Tienda eliminada",
                "rev": tenant_rev,
                "pct": round((tenant_rev / total_rev) * 100),
                "plan": t.plan.name if (t and t.plan) else "Básico",
            })
        top.sort(key=lambda c: c["rev"], reverse=True)
        top = top[:6]

        # --- Sectores (categoria de tienda) ponderado por ingresos ---
        per_sector: dict = {}
        for o in orders:
            t = tenants.get(o.tenant_id)
            sector = (t.category if t and t.category else "Otros")
            per_sector[sector] = per_sector.get(sector, 0.0) + (o.total_price or 0.0)
        sectors = []
        for i, (label, sector_rev) in enumerate(sorted(per_sector.items(), key=lambda x: x[1], reverse=True)):
            sectors.append({
                "label": label,
                "pct": round((sector_rev / total_rev) * 100),
                "color": _SECTOR_COLORS[i % len(_SECTOR_COLORS)],
            })

        # --- Actividad por hora (24h, normalizada 0-1) ---
        hour_counts = [0] * 24
        for o in orders:
            if o.created_at:
                hour_counts[o.created_at.hour] += 1
        max_hour = max(hour_counts) or 1
        activity = [{"h": h, "v": round(c / max_hour, 3)} for h, c in enumerate(hour_counts)]

        return {
            "kpis": {"rev": rev, "com": com, "orders": len(orders), "users": new_users, "companies": new_companies, "delta": delta},
            "top": top,
            "sectors": sectors,
            "activity": activity,
        }
    finally:
        db.close()

@app.get("/super-admin/users")
async def get_super_admin_users(request: Request):
    """Lista global de personas en el ecosistema: staff, dueños de tienda, vendedores y clientes."""
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)

        all_users = db.query(models.User).all()
        tenants_by_id = {u.id: u for u in all_users if u.role == "admin_tienda" and u.owner_id is None}

        result = []
        for u in all_users:
            is_staff = bool(u.is_global_staff) or u.role == "super_admin"
            if is_staff:
                role_label, company = "SUPER_ADMIN", "Bayup"
            elif u.role == "admin_tienda" and u.owner_id is None:
                role_label, company = "admin_tienda", u.full_name
            elif u.role == "cliente":
                role_label = "cliente"
                owner = tenants_by_id.get(u.owner_id)
                company = owner.full_name if owner else None
            else:
                continue
            result.append({
                "id": str(u.id),
                "full_name": u.full_name,
                "email": u.email,
                "role": role_label,
                "status": u.status or "Activo",
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "company": company,
            })

        sellers = db.query(models.Seller).all()
        for s in sellers:
            owner = tenants_by_id.get(s.tenant_id)
            result.append({
                "id": str(s.id),
                "full_name": s.name,
                "email": None,
                "role": "vendedor",
                "status": "Activo",
                "created_at": None,
                "company": owner.full_name if owner else None,
            })

        return result
    finally:
        db.close()

def _serialize_ticket(t, tenant=None):
    return {
        "id": f"TKT-{str(t.id)[:8].upper()}",
        "title": t.title,
        "company": tenant.full_name if tenant else "Tienda eliminada",
        "userEmail": tenant.email if tenant else None,
        "priority": t.priority,
        "status": t.status,
        "category": t.category,
        "createdAt": t.created_at.isoformat() if t.created_at else None,
        "messages": t.messages or [],
    }

def _find_ticket_by_short_id(db, models, short_id: str):
    target = short_id.replace("TKT-", "").upper()
    for t in db.query(models.SupportTicket).all():
        if str(t.id)[:8].upper() == target:
            return t
    return None

@app.get("/super-admin/support/tickets")
async def get_super_admin_tickets(request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)
        tickets = db.query(models.SupportTicket).order_by(models.SupportTicket.created_at.desc()).all()
        tenants = {t.id: t for t in db.query(models.User).all()}
        return [_serialize_ticket(t, tenants.get(t.tenant_id)) for t in tickets]
    finally:
        db.close()

@app.post("/super-admin/support/tickets/{ticket_id}/reply")
async def reply_super_admin_ticket(ticket_id: str, payload: dict, request: Request):
    import models
    from datetime import datetime
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)
        ticket = _find_ticket_by_short_id(db, models, ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket no encontrado")
        text = (payload.get("text") or "").strip()
        if not text:
            raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")
        msgs = list(ticket.messages or [])
        msgs.append({"sender": "soporte", "text": text, "time": datetime.utcnow().strftime("%H:%M")})
        ticket.messages = msgs
        if ticket.status == "Abierto":
            ticket.status = "En proceso"
        db.commit()
        tenant = db.query(models.User).filter(models.User.id == ticket.tenant_id).first()
        return _serialize_ticket(ticket, tenant)
    finally:
        db.close()

@app.post("/super-admin/support/tickets/{ticket_id}/resolve")
async def resolve_super_admin_ticket(ticket_id: str, request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)
        ticket = _find_ticket_by_short_id(db, models, ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket no encontrado")
        ticket.status = "Resuelto"
        db.commit()
        tenant = db.query(models.User).filter(models.User.id == ticket.tenant_id).first()
        return _serialize_ticket(ticket, tenant)
    finally:
        db.close()

@app.post("/support/tickets")
async def create_support_ticket(payload: dict, request: Request):
    """Crea un ticket de soporte para la tienda autenticada."""
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        title = (payload.get("title") or "").strip()
        if not title:
            raise HTTPException(status_code=400, detail="El título es obligatorio")
        text = (payload.get("text") or "").strip()
        from datetime import datetime
        ticket = models.SupportTicket(
            tenant_id=tenant_id,
            title=title,
            category=payload.get("category") or "General",
            priority=payload.get("priority") or "Media",
            status="Abierto",
            messages=[{"sender": "usuario", "text": text, "time": datetime.utcnow().strftime("%H:%M")}] if text else [],
        )
        db.add(ticket)
        db.commit()
        return _serialize_ticket(ticket, db.query(models.User).filter(models.User.id == tenant_id).first())
    finally:
        db.close()

def _serialize_template(t):
    return {
        "id": str(t.id),
        "name": t.name,
        "category": t.category or "General",
        "description": t.description or "",
        "tags": t.tags or [],
        "uses": t.uses or 0,
        "rating": t.rating or 0.0,
        "isPremium": bool(t.is_premium),
        "isActive": bool(t.is_active),
        "color": t.color or "#0f1a1a",
        "preview_url": t.preview_url,
        "schema_data": t.schema_data,
    }

@app.get("/super-admin/web-templates")
async def get_super_admin_web_templates(request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)
        templates = db.query(models.WebTemplate).order_by(models.WebTemplate.created_at.desc()).all()
        return [_serialize_template(t) for t in templates]
    finally:
        db.close()

@app.post("/super-admin/web-templates")
async def create_super_admin_web_template(payload: dict, request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)
        name = (payload.get("name") or "").strip()
        if not name:
            raise HTTPException(status_code=400, detail="El nombre es obligatorio")
        tags = payload.get("tags")
        if isinstance(tags, str):
            tags = [s.strip() for s in tags.split(",") if s.strip()]
        template = models.WebTemplate(
            name=name,
            category=payload.get("category") or "General",
            description=payload.get("description") or "",
            tags=tags or [],
            is_active=True,
            is_premium=False,
            color=payload.get("color") or "#0f1a1a",
        )
        db.add(template)
        db.commit()
        return _serialize_template(template)
    finally:
        db.close()

@app.put("/super-admin/web-templates/{template_id}/toggle")
async def toggle_super_admin_web_template(template_id: str, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)
        try:
            target_uuid = uuid_lib.UUID(template_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="template_id inválido")
        template = db.query(models.WebTemplate).filter(models.WebTemplate.id == target_uuid).first()
        if not template:
            raise HTTPException(status_code=404, detail="Plantilla no encontrada")
        template.is_active = not template.is_active
        db.commit()
        return _serialize_template(template)
    finally:
        db.close()

@app.delete("/super-admin/web-templates/{template_id}")
async def delete_super_admin_web_template(template_id: str, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)
        try:
            target_uuid = uuid_lib.UUID(template_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="template_id inválido")
        template = db.query(models.WebTemplate).filter(models.WebTemplate.id == target_uuid).first()
        if not template:
            raise HTTPException(status_code=404, detail="Plantilla no encontrada")
        db.delete(template)
        db.commit()
        return {"ok": True}
    finally:
        db.close()

@app.get("/web-templates")
async def get_web_templates(request: Request):
    """Galeria de plantillas visible para cualquier tenant autenticado."""
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        await _authenticate(request, db)
        templates = db.query(models.WebTemplate).filter(models.WebTemplate.is_active == True).order_by(models.WebTemplate.created_at.desc()).all()
        return [_serialize_template(t) for t in templates]
    finally:
        db.close()

def _serialize_shop_page(p):
    return {
        "id": str(p.id),
        "page_key": p.page_key,
        "schema_data": p.schema_data,
        "template_id": p.template_id,
        "is_published": bool(p.is_published),
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }

class ShopPageSaveRequest(BaseModel):
    page_key: str
    schema_data: dict
    template_id: str | None = None

class ShopPagePublishRequest(BaseModel):
    page_key: str
    schema_data: dict

@app.get("/shop-pages/{page_key}")
async def get_shop_page(page_key: str, request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        page = db.query(models.ShopPage).filter(
            models.ShopPage.tenant_id == tenant_id,
            models.ShopPage.page_key == page_key,
        ).first()
        if not page:
            return {"page_key": page_key, "schema_data": None, "template_id": None, "is_published": False}
        return _serialize_shop_page(page)
    finally:
        db.close()

@app.post("/shop-pages")
async def save_shop_page(payload: ShopPageSaveRequest, request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        page = db.query(models.ShopPage).filter(
            models.ShopPage.tenant_id == tenant_id,
            models.ShopPage.page_key == payload.page_key,
        ).first()
        is_new = page is None
        if page:
            page.schema_data = payload.schema_data
            if payload.template_id:
                page.template_id = payload.template_id
        else:
            page = models.ShopPage(
                tenant_id=tenant_id,
                page_key=payload.page_key,
                schema_data=payload.schema_data,
                template_id=payload.template_id,
            )
            db.add(page)

        # Contabiliza el uso real de la plantilla (solo al instalar Home por primera vez)
        if is_new and payload.page_key == "home" and payload.template_id:
            import uuid as uuid_lib
            try:
                template_uuid = uuid_lib.UUID(payload.template_id)
                template = db.query(models.WebTemplate).filter(models.WebTemplate.id == template_uuid).first()
                if template:
                    template.uses = (template.uses or 0) + 1
            except ValueError:
                pass

        db.commit()
        db.refresh(page)
        return _serialize_shop_page(page)
    finally:
        db.close()

@app.post("/shop-pages/publish")
async def publish_shop_page(payload: ShopPagePublishRequest, request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        page = db.query(models.ShopPage).filter(
            models.ShopPage.tenant_id == tenant_id,
            models.ShopPage.page_key == payload.page_key,
        ).first()
        if page:
            page.schema_data = payload.schema_data
            page.is_published = True
        else:
            page = models.ShopPage(
                tenant_id=tenant_id,
                page_key=payload.page_key,
                schema_data=payload.schema_data,
                is_published=True,
            )
            db.add(page)
        db.commit()
        db.refresh(page)
        return _serialize_shop_page(page)
    finally:
        db.close()

@app.get("/public/stores/{store_id}/pages/{page_key}")
async def get_public_shop_page(store_id: str, page_key: str):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        try:
            store_uuid = uuid_lib.UUID(store_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="store_id inválido")
        page = db.query(models.ShopPage).filter(
            models.ShopPage.tenant_id == store_uuid,
            models.ShopPage.page_key == page_key,
            models.ShopPage.is_published == True,
        ).first()
        if not page:
            raise HTTPException(status_code=404, detail="Página no publicada")
        return {"page_key": page.page_key, "schema_data": page.schema_data}
    finally:
        db.close()
