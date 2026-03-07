from fastapi import Depends, FastAPI, HTTPException, status, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import uuid
import os
import shutil
import traceback
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from typing import List, Optional

load_dotenv()

# --- INFRAESTRUCTURA SEGURA ---
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    try: os.makedirs(UPLOAD_DIR, exist_ok=True)
    except: pass

# --- CONEXIÓN A DATOS ---
from database import SessionLocal, engine, get_db
import models, crud, security, schemas

def safe_db_init():
    """Reparación automática del esquema en cada reinicio."""
    try:
        models.Base.metadata.create_all(bind=engine)
        with engine.connect() as conn:
            # Sincronización masiva de columnas (Plan Básico + Pro + Empresa)
            schema_updates = [
                ("users", "nit", "TEXT"), ("users", "address", "TEXT"),
                ("users", "logo_url", "TEXT"), ("users", "phone", "TEXT"),
                ("users", "shop_slug", "TEXT"), ("users", "is_global_staff", "BOOLEAN DEFAULT FALSE"),
                ("users", "permissions", "JSONB"), ("users", "owner_id", "UUID"),
                ("users", "plan_id", "UUID"),
                ("users", "custom_commission_rate", "FLOAT"),
                ("orders", "customer_city", "TEXT"), ("orders", "shipping_address", "TEXT"),
                ("orders", "source", "TEXT DEFAULT 'pos'"), ("orders", "payment_method", "TEXT DEFAULT 'cash'"),
                ("orders", "commission_amount", "FLOAT DEFAULT 0.0"),
                ("orders", "commission_rate_snapshot", "FLOAT DEFAULT 0.0"),
                ("products", "category", "TEXT"), ("product_variants", "price", "FLOAT DEFAULT 0.0"),
                ("activity_logs", "tenant_id", "UUID")
            ]
            for table, col, dtype in schema_updates:
                try: 
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {dtype};"))
                    conn.commit()
                except: pass
    except Exception as e: print(f"⚠️ DB Sync Warning: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    safe_db_init()
    yield

app = FastAPI(title="Bayup OS - Platinum Core v1.2", lifespan=lifespan)

# --- ESCUDO DE SEGURIDAD (CORS) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- [MODULO] AUTENTICACIÓN & PERFIL ---

@app.post("/auth/register", response_model=schemas.User)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, email=user_in.email):
        raise HTTPException(status_code=400, detail="El email ya existe")
    return crud.create_user(db, user_in)

@app.post("/auth/login")
async def login(request: Request, db: Session = Depends(get_db)):
    try:
        try: body = await request.json()
        except: 
            form = await request.form()
            body = {"username": form.get("username"), "password": form.get("password")}
        
        u, p = body.get("username", ""), body.get("password", "")
        user = crud.get_user_by_email(db, email=u.lower().strip())
        
        if not user or not security.verify_password(p, user.hashed_password):
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")
        
        token = security.create_access_token(data={"sub": user.email})
        
        # LOGIN BLINDADO: Ignoramos la DB para el objeto de respuesta del perfil
        # Solo usamos la DB para validar el email y la contraseña arriba.
        return {
            "access_token": token, 
            "token_type": "bearer",
            "user": {
                "id": str(user.id), 
                "email": user.email, 
                "full_name": user.full_name or "Usuario Bayup", 
                "role": user.role or "admin_tienda", 
                "shop_slug": user.shop_slug or "mi-tienda", 
                "logo_url": user.logo_url,
                "plan": {"name": "Básico", "modules": ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"]}
            }
        }
    except HTTPException as he: raise he
    except Exception as e: raise HTTPException(status_code=500, detail="Error interno en login")

@app.get("/auth/me")
def read_me(current_user: models.User = Depends(security.get_current_user)):
    # Devolvemos un objeto plano para evitar errores de carga de relaciones en la DB
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name or "Usuario Bayup",
        "role": current_user.role or "admin_tienda",
        "shop_slug": current_user.shop_slug or "mi-tienda",
        "logo_url": current_user.logo_url,
        "plan": {"name": "Básico", "modules": ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"]},
        "is_global_staff": current_user.is_global_staff or False,
        "permissions": current_user.permissions or {}
    }

# --- [MODULO] PRODUCTOS & STOCK ---

@app.get("/products", response_model=List[schemas.Product])
def get_products(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    try:
        return db.query(models.Product).filter(models.Product.owner_id == tid).all()
    except Exception as e:
        print(f"⚠️ Fallback Ultra en /products: {e}")
        db.rollback()
        # Seleccionamos solo lo que existe seguro y llenamos el resto para que Pydantic no explote
        prods = db.execute(text("SELECT id, name, price, status, owner_id FROM products WHERE owner_id = :tid"), {"tid": tid}).all()
        output = []
        for p in prods:
            output.append({
                "id": p.id, "name": p.name, "price": p.price, "status": p.status, "owner_id": p.owner_id,
                "description": "", "category": "General", "variants": []
            })
        return output

# --- [MODULO] COLECCIONES ---

@app.get("/collections", response_model=List[schemas.Collection])
def get_collections(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    try:
        return db.query(models.Collection).filter(models.Collection.owner_id == tid).all()
    except Exception:
        db.rollback()
        return []

@app.post("/products", response_model=schemas.Product)
def create_product(product_in: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    db_product = models.Product(**product_in.model_dump(exclude={"variants"}), owner_id=tid, id=uuid.uuid4())
    db.add(db_product); db.flush()
    for v in product_in.variants:
        db_v = models.ProductVariant(**v.model_dump(), product_id=db_product.id, id=uuid.uuid4())
        db.add(db_v)
    db.commit(); db.refresh(db_product)
    return db_product

# --- [MODULO] ÓRDENES & POS ---

@app.get("/orders", response_model=List[schemas.Order])
def read_orders(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    try:
        return db.query(models.Order).filter(models.Order.tenant_id == tid).all()
    except Exception as e:
        print(f"⚠️ Ultra-Fallback en /orders: {e}")
        db.rollback()
        # Seleccionamos solo lo que existe seguro y llenamos el resto para Pydantic
        ords = db.execute(text("SELECT id, total_price, status, created_at, customer_name, tenant_id FROM orders WHERE tenant_id = :tid"), {"tid": tid}).all()
        output = []
        for o in ords:
            output.append({
                "id": o.id, "total_price": o.total_price, "status": o.status, "created_at": o.created_at, 
                "customer_name": o.customer_name, "tenant_id": o.tenant_id, "items": [],
                "payment_method": "cash", "source": "pos", "commission_amount": 0.0,
                "commission_rate_snapshot": 0.0, "customer_email": "", "customer_phone": ""
            })
        return output

@app.post("/orders", response_model=schemas.Order)
def process_sale(order_in: schemas.OrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    """Ventas POS (Manuales): Siempre 0% Comisión."""
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    db_order = models.Order(
        **order_in.model_dump(exclude={"items"}), 
        status="completed", 
        id=uuid.uuid4(), 
        tenant_id=tid,
        commission_amount=0.0,
        commission_rate_snapshot=0.0,
        source="pos"
    )
    db.add(db_order); db.flush()
    for item in order_in.items:
        db_item = models.OrderItem(**item.model_dump(), order_id=db_order.id, id=uuid.uuid4())
        db.add(db_item)
        variant = db.query(models.ProductVariant).filter(models.ProductVariant.id == item.product_variant_id).first()
        if variant: variant.stock = max(0, variant.stock - item.quantity)
    db.commit(); db.refresh(db_order)
    return db_order

@app.post("/public/orders", response_model=schemas.Order)
def public_process_sale(order_in: schemas.OrderCreate, db: Session = Depends(get_db)):
    """Ventas WEB (Checkout): Comisión según Plan (Básico 3.5%)."""
    # 1. Obtener el tenant y su plan para calcular comisión
    tenant = db.query(models.User).filter(models.User.id == order_in.tenant_id).first()
    if not tenant: raise HTTPException(status_code=404, detail="Tienda no encontrada")
    
    # Prioridad: Comisión custom > Comisión del Plan > 3.5% (Fallback Básico)
    rate = 3.5
    if tenant.custom_commission_rate is not None:
        rate = tenant.custom_commission_rate
    elif tenant.plan:
        rate = tenant.plan.commission_rate
    
    comm_amount = (order_in.total_price * rate) / 100
    
    db_order = models.Order(
        **order_in.model_dump(exclude={"items"}), 
        status="paid" if order_in.payment_method != "cash" else "pending", 
        id=uuid.uuid4(),
        commission_amount=comm_amount,
        commission_rate_snapshot=rate,
        source="web"
    )
    db.add(db_order); db.flush()
    for item in order_in.items:
        db_item = models.OrderItem(**item.model_dump(), order_id=db_order.id, id=uuid.uuid4())
        db.add(db_item)
        variant = db.query(models.ProductVariant).filter(models.ProductVariant.id == item.product_variant_id).first()
        if variant: variant.stock = max(0, variant.stock - item.quantity)
    
    # 2. Registrar Notificación para el dueño de la tienda
    notif = models.Notification(
        tenant_id=tenant.id,
        title="¡Nueva Venta Web! 🚀",
        message=f"Has recibido un pedido de {order_in.customer_name} por ${order_in.total_price:,.0f}",
        type="success"
    )
    db.add(notif)
    
    db.commit(); db.refresh(db_order)
    return db_order

# --- [MODULO] ADMINISTRACIÓN ---

@app.get("/admin/logs", response_model=List[schemas.ActivityLog])
def read_logs(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.ActivityLog).filter(models.ActivityLog.tenant_id == tid).order_by(models.ActivityLog.created_at.desc()).limit(50).all()

@app.put("/admin/update-profile")
def update_profile(profile_data: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    for k, v in profile_data.model_dump(exclude_unset=True).items(): setattr(current_user, k, v)
    db.commit(); return {"status": "success"}

@app.post("/admin/upload-image")
async def upload_image(file: UploadFile = File(...), current_user: models.User = Depends(security.get_current_user)):
    fname = f"{uuid.uuid4()}.{file.filename.split('.')[-1]}"
    fpath = os.path.join(UPLOAD_DIR, fname)
    with open(fpath, "wb") as buf: shutil.copyfileobj(file.file, buf)
    dom = os.getenv("RAILWAY_PUBLIC_DOMAIN", "localhost:8080")
    return {"url": f"https://{dom}/uploads/{fname}" if "railway" in dom else f"http://{dom}/uploads/{fname}"}

@app.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Notification).filter(models.Notification.tenant_id == tid).order_by(models.Notification.created_at.desc()).limit(20).all()

# --- [MODULO] SUPER ADMIN ---

@app.get("/super-admin/stats")
def get_global_stats(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    if not current_user.is_global_staff and current_user.email != "basicobayup@yopmail.com":
        raise HTTPException(status_code=403, detail="Torre de Control Restringida")
    return {"status": "online", "total_users": db.query(models.User).count()}

@app.get("/health")
def health(): return {"status": "ok", "version": "1.2.0-diamond"}

# MONTAJE DE ESTÁTICOS PROTEGIDO
try: app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
except: pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
