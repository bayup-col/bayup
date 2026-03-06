from fastapi import Depends, FastAPI, HTTPException, status, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
import uuid
import os
import shutil
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

load_dotenv()

# --- ASEGURAR DIRECTORIO DE CARGAS (REPARACIÓN CRÍTICA RAILWAY) ---
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
    print(f"✅ Directorio '{UPLOAD_DIR}' creado para persistencia.")

# --- CONEXIÓN A DB REAL ---
from database import SessionLocal, engine, get_db
import models
import crud
import security
import schemas

def safe_db_init():
    """Repara el esquema sin tocar los datos existentes."""
    print("🛠️ Verificando base de datos persistente...")
    try:
        models.Base.metadata.create_all(bind=engine)
        required_cols = [
            ("logo_url", "TEXT"), ("phone", "TEXT"), ("shop_slug", "TEXT"),
            ("custom_domain", "TEXT"), ("onboarding_completed", "BOOLEAN DEFAULT FALSE"),
            ("is_global_staff", "BOOLEAN DEFAULT FALSE"), ("permissions", "JSONB")
        ]
        with engine.connect() as conn:
            for c_n, c_t in required_cols:
                try:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {c_n} {c_t};"))
                    conn.commit()
                except Exception: pass
    except Exception as e: print(f"❌ Error init: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    safe_db_init()
    yield

app = FastAPI(title="Bayup OS - Full Core", lifespan=lifespan)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTH & LOGIN ---

@app.post("/auth/login")
async def login(request: Request, db: Session = Depends(get_db)):
    try:
        try: body = await request.json()
        except: 
            form = await request.form()
            body = {"username": form.get("username"), "password": form.get("password")}
        
        u, p = body.get("username"), body.get("password")
        user = crud.get_user_by_email(db, email=u.lower().strip() if u else "")
        if not user or not security.verify_password(p, user.hashed_password):
            raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
        
        token = security.create_access_token(data={"sub": user.email})
        plan = user.plan if user.plan else None
        return {
            "access_token": token, "token_type": "bearer",
            "user": {
                "email": user.email, "full_name": user.full_name, "role": user.role, "shop_slug": user.shop_slug,
                "plan": {"name": plan.name if plan else "Básico", "modules": plan.modules if plan else ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"]}
            }
        }
    except HTTPException as he: raise he
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/auth/me", response_model=schemas.User)
def me(current_user: models.User = Depends(security.get_current_user)):
    return current_user

# --- PRODUCTOS ---

@app.get("/products")
def read_products(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Product).filter(models.Product.owner_id == tenant_id).all()

@app.post("/products")
def create_product(product_in: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    db_product = models.Product(**product_in.dict(exclude={"variants"}), owner_id=tenant_id, id=uuid.uuid4())
    db.add(db_product); db.flush()
    for v in product_in.variants:
        db_v = models.ProductVariant(**v.dict(), product_id=db_product.id, id=uuid.uuid4())
        db.add(db_v)
    db.commit(); db.refresh(db_product)
    return db_product

# --- ÓRDENES & VENTAS ---

@app.get("/orders")
def get_orders(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Order).filter(models.Order.tenant_id == tenant_id).all()

@app.post("/orders")
def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    db_order = models.Order(**order_data.dict(exclude={"items"}), status="completed", id=uuid.uuid4(), tenant_id=tenant_id)
    db.add(db_order); db.flush()
    for item in order_data.items:
        db_item = models.OrderItem(**item.dict(), order_id=db_order.id, id=uuid.uuid4())
        db.add(db_item)
        variant = db.query(models.ProductVariant).filter(models.ProductVariant.id == item.product_variant_id).first()
        if variant: variant.stock = max(0, variant.stock - item.quantity)
    db.commit(); db.refresh(db_order)
    return db_order

# --- ADMINISTRACIÓN & CONFIG ---

@app.put("/admin/update-profile")
def update_profile(profile_data: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    for k, v in profile_data.dict(exclude_unset=True).items(): setattr(current_user, k, v)
    db.commit(); return {"status": "success"}

@app.post("/admin/upload-image")
async def upload_image(file: UploadFile = File(...), current_user: models.User = Depends(security.get_current_user)):
    file_extension = file.filename.split('.')[-1]
    file_name = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    domain = os.getenv("RAILWAY_PUBLIC_DOMAIN", "localhost:8080")
    url = f"https://{domain}/uploads/{file_name}" if "railway" in domain else f"http://{domain}/uploads/{file_name}"
    return {"url": url}

@app.get("/admin/logs")
def get_logs(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.ActivityLog).filter(models.ActivityLog.tenant_id == tenant_id).limit(50).all()

@app.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Notification).filter(models.Notification.tenant_id == tenant_id).order_by(models.Notification.created_at.desc()).limit(20).all()

# --- PÚBLICO ---

@app.get("/public/shop/{shop_slug}")
def get_public_shop(shop_slug: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.shop_slug == shop_slug).first()
    if not user: raise HTTPException(status_code=404)
    return {"id": user.id, "full_name": user.full_name, "logo_url": user.logo_url}

@app.post("/public/orders")
def create_public_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    db_order = models.Order(**order_data.dict(exclude={"items"}), status="pending", id=uuid.uuid4())
    db_order.customer_id = order_data.tenant_id # Fallback
    db.add(db_order); db.flush()
    for item in order_data.items:
        db_item = models.OrderItem(**item.dict(), order_id=db_order.id, id=uuid.uuid4())
        db.add(db_item)
        variant = db.query(models.ProductVariant).filter(models.ProductVariant.id == item.product_variant_id).first()
        if variant: variant.stock = max(0, variant.stock - item.quantity)
    db.commit(); return db_order

@app.get("/health")
def health(): return {"status": "connected"}

# Montaje de estáticos (Asegurando que el directorio existe)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
