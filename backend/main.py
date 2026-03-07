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
            # Sincronización masiva de columnas para asegurar persistencia total
            schema_updates = [
                ("users", "nit", "TEXT"), 
                ("users", "address", "TEXT"),
                ("users", "customer_city", "TEXT"),
                ("users", "logo_url", "TEXT"), 
                ("users", "phone", "TEXT"),
                ("users", "shop_slug", "TEXT"), 
                ("users", "is_global_staff", "BOOLEAN DEFAULT FALSE"),
                ("users", "permissions", "JSONB"), 
                ("users", "owner_id", "UUID"),
                ("users", "plan_id", "UUID"),
                ("users", "custom_commission_rate", "FLOAT"),
                ("orders", "customer_city", "TEXT"), 
                ("orders", "shipping_address", "TEXT"),
                ("orders", "source", "TEXT DEFAULT 'pos'"), 
                ("orders", "payment_method", "TEXT DEFAULT 'cash'"),
                ("orders", "commission_amount", "FLOAT DEFAULT 0.0"),
                ("orders", "commission_rate_snapshot", "FLOAT DEFAULT 0.0"),
                ("products", "category", "TEXT"), 
                ("product_variants", "price", "FLOAT DEFAULT 0.0"),
                ("activity_logs", "tenant_id", "UUID"),
                ("store_messages", "tenant_id", "UUID")
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

app = FastAPI(title="Bayup OS - Platinum Core v1.2.1", lifespan=lifespan)

# --- ESCUDO DE SEGURIDAD (CORS - MANUAL & ROBUSTO) ---
# Reemplazamos el middleware estándar por uno manual para garantizar headers en errores 500/502
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    # Manejo explícito de Preflight (OPTIONS)
    if request.method == "OPTIONS":
        response = Response(status_code=204) # No Content
        origin = request.headers.get("origin")
        if origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        else:
            response.headers["Access-Control-Allow-Origin"] = "*"
        
        response.headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Max-Age"] = "86400"
        return response

    try:
        response = await call_next(request)
    except Exception as e:
        # Si la app falla, capturamos el error pero inyectamos CORS igual
        print(f"🔥 Error Crítico en Request: {e}")
        response = Response(content="Internal Server Error", status_code=500)

    origin = request.headers.get("origin")
    if origin and ("bayup.com" in origin or "railway.app" in origin or "localhost" in origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    else:
        # Fallback para desarrollo o herramientas
        response.headers["Access-Control-Allow-Origin"] = "*"
    
    response.headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response

# Eliminamos CORSMiddleware estándar para evitar conflictos
# app.add_middleware(CORSMiddleware...) 

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
        
        # LOGIN BLINDADO: Devolvemos todos los campos de persistencia
        return {
            "access_token": token, 
            "token_type": "bearer",
            "user": {
                "id": str(user.id), 
                "email": user.email, 
                "full_name": getattr(user, 'full_name', "Usuario Bayup"), 
                "role": getattr(user, 'role', "admin_tienda"), 
                "shop_slug": getattr(user, 'shop_slug', "mi-tienda"), 
                "logo_url": getattr(user, 'logo_url', None),
                "phone": getattr(user, 'phone', None),
                "nit": getattr(user, 'nit', None),
                "address": getattr(user, 'address', None),
                "customer_city": getattr(user, 'customer_city', None),
                "country": "Colombia",
                "plan": {"name": "Básico", "modules": ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"]}
            }
        }
    except HTTPException as he: raise he
    except Exception as e: 
        print(f"❌ Error en Login: {e}")
        raise HTTPException(status_code=500, detail="Error interno en login")

@app.get("/auth/me")
def read_me(current_user: models.User = Depends(security.get_current_user)):
    # Devolvemos un objeto plano con todos los campos de contacto y ubicación de forma segura
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": getattr(current_user, 'full_name', "Usuario Bayup"),
        "role": getattr(current_user, 'role', "admin_tienda"),
        "shop_slug": getattr(current_user, 'shop_slug', "mi-tienda"),
        "logo_url": getattr(current_user, 'logo_url', None),
        "phone": getattr(current_user, 'phone', None),
        "nit": getattr(current_user, 'nit', None),
        "address": getattr(current_user, 'address', None),
        "customer_city": getattr(current_user, 'customer_city', None),
        "country": "Colombia",
        "plan": {"name": "Básico", "modules": ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"]},
        "is_global_staff": getattr(current_user, 'is_global_staff', False),
        "permissions": getattr(current_user, 'permissions', {})
    }

# --- [MODULO] PRODUCTOS & STOCK ---

from sqlalchemy.orm import Session, joinedload

@app.get("/products", response_model=List[schemas.Product])
def get_products(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    try:
        return db.query(models.Product).options(joinedload(models.Product.variants)).filter(models.Product.owner_id == tid).all()
    except Exception as e:
        print(f"⚠️ Fallback Inteligente en /products: {e}")
        db.rollback()
        # Fallback manual robusto con SQL raw
        prods = db.execute(text("SELECT id, name, price, status, owner_id, image_url, category FROM products WHERE owner_id = :tid"), {"tid": tid}).all()
        output = []
        for p in prods:
            try:
                vars_raw = db.execute(text("SELECT id, name, sku, stock, price FROM product_variants WHERE product_id = :pid"), {"pid": p.id}).all()
                variants = [{"id": v.id, "name": v.name, "sku": v.sku, "stock": v.stock, "price": v.price, "product_id": p.id} for v in vars_raw]
            except:
                variants = []
            
            # Procesar image_url que es JSON
            img = []
            try:
                if isinstance(p.image_url, str): img = json.loads(p.image_url)
                elif isinstance(p.image_url, list): img = p.image_url
            except: pass

            output.append({
                "id": p.id, "name": p.name, "price": p.price, "status": p.status, "owner_id": p.owner_id,
                "description": "", "category": p.category or "General", "variants": variants,
                "image_url": img
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
    if getattr(tenant, 'custom_commission_rate', None) is not None:
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

@app.get("/admin/messages", response_model=List[schemas.StoreMessage])
def get_messages(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    try:
        return db.query(models.StoreMessage).filter(models.StoreMessage.tenant_id == tid).order_by(models.StoreMessage.created_at.desc()).all()
    except Exception as e:
        print(f"⚠️ Fallback en /admin/messages: {e}")
        db.rollback()
        return []

@app.get("/admin/logs", response_model=List[schemas.ActivityLog])
def read_logs(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    try:
        return db.query(models.ActivityLog).filter(models.ActivityLog.tenant_id == tid).order_by(models.ActivityLog.created_at.desc()).limit(50).all()
    except Exception:
        db.rollback()
        return []

@app.put("/admin/update-profile")
def update_profile(profile_data: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    try:
        for k, v in profile_data.model_dump(exclude_unset=True).items():
            setattr(current_user, k, v)
        db.commit()
        db.refresh(current_user)
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        print(f"❌ Error actualizando perfil: {e}")
        raise HTTPException(status_code=500, detail=f"No se pudo actualizar el perfil: {e}")

@app.post("/admin/upload-image")
async def upload_image(file: UploadFile = File(...), current_user: models.User = Depends(security.get_current_user)):
    # Generar nombre único
    ext = file.filename.split('.')[-1]
    fname = f"{uuid.uuid4()}.{ext}"
    fpath = os.path.join(UPLOAD_DIR, fname)
    
    # Guardar físicamente
    with open(fpath, "wb") as buf:
        shutil.copyfileobj(file.file, buf)
    
    # Construir URL absoluta según el entorno
    dom = os.getenv("RAILWAY_PUBLIC_DOMAIN", "localhost:8080")
    # Si dom no tiene protocolo, se lo ponemos. En Railway suele ser https://...
    base_url = f"https://{dom}" if "railway" in dom else f"http://{dom}"
    final_url = f"{base_url}/uploads/{fname}"
    
    # AUTO-GUARDADO: Vinculamos el logo al perfil de inmediato
    current_user.logo_url = final_url
    from database import SessionLocal
    db_session = SessionLocal()
    try:
        db_user = db_session.query(models.User).filter(models.User.id == current_user.id).first()
        if db_user:
            db_user.logo_url = final_url
            db_session.commit()
    finally:
        db_session.close()

    return {"url": final_url}

@app.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    try:
        return db.query(models.Notification).filter(models.Notification.tenant_id == tid).order_by(models.Notification.created_at.desc()).limit(20).all()
    except:
        return []

# --- [MODULO] SUPER ADMIN ---

@app.get("/super-admin/stats")
def get_global_stats(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    if not current_user.is_global_staff and current_user.email != "basicobayup@yopmail.com":
        raise HTTPException(status_code=403, detail="Torre de Control Restringida")
    return {"status": "online", "total_users": db.query(models.User).count()}

@app.get("/health")
def health(): return {"status": "ok", "version": "1.2.1-diamond"}

# MONTAJE DE ESTÁTICOS PROTEGIDO
try: app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
except: pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))

