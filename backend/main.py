from fastapi import Depends, FastAPI, HTTPException, status, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import uuid
import os
import shutil
import json
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
            print("🔧 Ejecutando Auto-Migración de Emergencia...")
            schema_updates = [
                ("users", "nit", "TEXT"), 
                ("users", "address", "TEXT"),
                ("users", "customer_city", "TEXT"),
                ("users", "logo_url", "TEXT"), 
                ("users", "phone", "TEXT"),
                ("users", "shop_slug", "TEXT"), 
                ("users", "category", "TEXT"),
                ("users", "hours", "TEXT"),
                ("users", "is_global_staff", "BOOLEAN DEFAULT FALSE"),
                ("users", "permissions", "JSONB"), 
                ("users", "owner_id", "UUID"),
                ("users", "plan_id", "UUID"),
                ("users", "custom_commission_rate", "FLOAT"),
                ("users", "social_links", "JSONB"),
                ("users", "whatsapp_lines", "JSONB"),
                ("users", "bank_accounts", "JSONB"),
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
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {dtype};"))
                    conn.commit()
                except Exception as ex: 
                    print(f"⚠️ Warning migración {col}: {ex}")
                    conn.rollback()
            print("✅ Auto-Migración Completada.")
    except Exception as e: print(f"⚠️ DB Sync Warning: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    safe_db_init()
    yield

app = FastAPI(title="Bayup OS - Platinum Core v1.2.1", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https://.*",
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

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
        
        # LOGIN RESISTENTE: No refrescamos para evitar errores de columna inexistente
        # Devolvemos un objeto seguro con fallbacks
        return {
            "access_token": token, 
            "token_type": "bearer",
            "user": {
                "id": str(user.id), 
                "email": user.email, 
                "full_name": getattr(user, 'full_name', "Usuario Bayup") or "Usuario Bayup", 
                "role": getattr(user, 'role', "admin_tienda"), 
                "shop_slug": getattr(user, 'shop_slug', "") or "", 
                "logo_url": getattr(user, 'logo_url', "") or "",
                "phone": getattr(user, 'phone', "") or "",
                "nit": getattr(user, 'nit', "") or "",
                "address": getattr(user, 'address', "") or "",
                "customer_city": getattr(user, 'customer_city', "") or "",
                "hours": getattr(user, 'hours', "") or "",
                "category": getattr(user, 'category', "") or "",
                "country": "Colombia",
                "plan": {"name": "Básico", "modules": ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"]}
            }
        }
    except Exception as e: 
        print(f"❌ Error en Login: {e}")
        # DEBUG: Devolvemos el error real para identificar el fallo en Railway
        raise HTTPException(status_code=500, detail=f"Error técnico: {str(e)}")

@app.get("/auth/me")
def read_me(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(get_db)):
    try:
        db.refresh(current_user)
        return {
            "id": str(current_user.id),
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role,
            "shop_slug": getattr(current_user, 'shop_slug', ""),
            "logo_url": getattr(current_user, 'logo_url', ""),
            "phone": getattr(current_user, 'phone', ""),
            "nit": getattr(current_user, 'nit', ""),
            "address": getattr(current_user, 'address', ""),
            "customer_city": getattr(current_user, 'customer_city', ""),
            "hours": getattr(current_user, 'hours', ""),
            "category": getattr(current_user, 'category', ""),
            "country": "Colombia",
            "plan": {"name": "Básico", "modules": ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"]},
            "is_global_staff": getattr(current_user, 'is_global_staff', False),
            "permissions": getattr(current_user, 'permissions', {}),
            "social_links": getattr(current_user, 'social_links', {}),
            "whatsapp_lines": getattr(current_user, 'whatsapp_lines', []),
            "bank_accounts": getattr(current_user, 'bank_accounts', [])
        }
    except: return {}

@app.get("/products", response_model=List[schemas.Product])
def get_products(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    try:
        products = db.query(models.Product).filter(models.Product.owner_id == tid).all()
        output = []
        for p in products:
            try:
                variants = db.query(models.ProductVariant).filter(models.ProductVariant.product_id == p.id).all()
                variant_list = [{"id": v.id, "name": v.name, "sku": v.sku, "stock": v.stock, "price": v.price, "product_id": p.id} for v in variants]
            except: variant_list = []
            img = []
            try:
                if p.image_url:
                    if isinstance(p.image_url, list): img = p.image_url
                    elif isinstance(p.image_url, str) and p.image_url.startswith('['): img = json.loads(p.image_url)
                    elif isinstance(p.image_url, str): img = [p.image_url]
            except: pass
            output.append({
                "id": p.id, "name": p.name, "price": p.price or 0, "status": p.status or "active",
                "owner_id": p.owner_id, "description": p.description or "", "category": p.category or "General",
                "variants": variant_list, "image_url": img
            })
        return output
    except: return []

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

@app.get("/orders", response_model=List[schemas.Order])
def read_orders(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Order).filter(models.Order.tenant_id == tid).all()

@app.post("/orders", response_model=schemas.Order)
def process_sale(order_in: schemas.OrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    db_order = models.Order(**order_in.model_dump(exclude={"items"}), status="completed", id=uuid.uuid4(), tenant_id=tid, commission_amount=0.0, commission_rate_snapshot=0.0, source="pos")
    db.add(db_order); db.flush()
    for item in order_in.items:
        db_item = models.OrderItem(**item.model_dump(), order_id=db_order.id, id=uuid.uuid4())
        db.add(db_item)
        v = db.query(models.ProductVariant).filter(models.ProductVariant.id == item.product_variant_id).first()
        if v: v.stock = max(0, v.stock - item.quantity)
    db.commit(); db.refresh(db_order)
    return db_order

@app.put("/admin/update-profile")
def update_profile(profile_data: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    try:
        db_user = db.query(models.User).filter(models.User.id == current_user.id).first()
        if not db_user: raise HTTPException(status_code=404, detail="Usuario no encontrado")
        update_dict = profile_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            if hasattr(db_user, key): setattr(db_user, key, value)
        db.commit(); db.refresh(db_user)
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/upload-image")
async def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    ext = file.filename.split('.')[-1]
    fname = f"{uuid.uuid4()}.{ext}"
    fpath = os.path.join(UPLOAD_DIR, fname)
    with open(fpath, "wb") as buf: shutil.copyfileobj(file.file, buf)
    dom = os.getenv("RAILWAY_PUBLIC_DOMAIN", "localhost:8080")
    base_url = f"https://{dom}" if "railway" in dom else f"http://{dom}"
    final_url = f"{base_url}/uploads/{fname}"
    db_user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if db_user: 
        db_user.logo_url = final_url
        db.commit()
    return {"url": final_url}

@app.get("/health")
def health(): return {"status": "ok", "version": "1.2.1-diamond"}

try: app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
except: pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
