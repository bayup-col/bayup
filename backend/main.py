from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import sys
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from pydantic import BaseModel
import threading

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

# --- CONFIGURACIÓN CORS SUPREMA ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

class UserLoginRequest(BaseModel):
    email: str
    password: str

@app.get("/")
def read_root():
    return {"status": "Active", "version": "2.1 Platinum Production"}

@app.post("/auth/login")
def login(form_data: UserLoginRequest):
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
                "logo_url": getattr(user, 'logo_url', "")
            }
        }
    finally:
        db.close()

def _get_bearer_token(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="No token")
    return auth_header.split(" ")[1]

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
            "permissions": getattr(current_user, 'permissions', {}) or {}
        }
    finally:
        db.close()

class ProductCreateRequest(BaseModel):
    name: str
    description: str | None = None
    price: float
    wholesale_price: float | None = 0.0
    cost: float | None = 0.0
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
        db_product = crud.get_product(db, product_id=uuid_lib.UUID(product_id), tenant_id=tenant_id)
        if not db_product:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        product_in = schemas.ProductCreate(**payload.model_dump())
        updated = crud.update_product(db, db_product, product_in)
        return schemas.Product.model_validate(updated).model_dump(mode="json")
    finally:
        db.close()

class OrderItemRequest(BaseModel):
    product_variant_id: str
    quantity: int
    price_at_purchase: float

class OrderCreateRequest(BaseModel):
    total_price: float
    commission_amount: float | None = 0.0
    commission_rate_snapshot: float | None = 0.0
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
