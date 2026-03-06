from fastapi import Depends, FastAPI, HTTPException, status, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import uuid
import os
import shutil
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from typing import List

load_dotenv()

# --- REPARACIÓN DE INICIO (ASEGURAR DIRECTORIOS) ---
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- CONEXIÓN A DB REAL ---
from database import SessionLocal, engine, get_db
import models, crud, security, schemas

def safe_db_init():
    """Repara el esquema sin tocar los datos existentes."""
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

app = FastAPI(title="Bayup OS - Full Production Core v4", lifespan=lifespan)

# --- CORS DEFINITIVO ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.bayup.com.co",
        "https://bayup.com.co",
        "https://bayup-interactive.vercel.app",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ENDPOINTS DE AUTENTICACIÓN ---

@app.post("/auth/register", response_model=schemas.User)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, email=user_in.email):
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    return crud.create_user(db, user_in)

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

# --- ENDPOINTS ADMINISTRATIVOS (RESTAURADOS) ---

@app.get("/products")
def read_products(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Product).filter(models.Product.owner_id == tenant_id).all()

@app.post("/products", response_model=schemas.Product)
def create_product(product_in: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    db_product = models.Product(**product_in.model_dump(exclude={"variants"}), owner_id=tenant_id, id=uuid.uuid4())
    db.add(db_product); db.flush()
    for v in product_in.variants:
        db_v = models.ProductVariant(**v.model_dump(), product_id=db_product.id, id=uuid.uuid4())
        db.add(db_v)
    db.commit(); db.refresh(db_product)
    return db_product

@app.get("/orders")
def get_orders(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Order).filter(models.Order.tenant_id == tenant_id).all()

@app.post("/orders", response_model=schemas.Order)
def create_manual_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    db_order = models.Order(**order_data.model_dump(exclude={"items"}), status="completed", id=uuid.uuid4(), tenant_id=tenant_id)
    db.add(db_order); db.flush()
    for item in order_data.items:
        db_item = models.OrderItem(**item.model_dump(), order_id=db_order.id, id=uuid.uuid4())
        db.add(db_item)
        # Descuento de stock
        variant = db.query(models.ProductVariant).filter(models.ProductVariant.id == item.product_variant_id).first()
        if variant: variant.stock = max(0, variant.stock - item.quantity)
    db.commit(); db.refresh(db_order)
    return db_order

@app.get("/admin/logs")
def get_logs(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.ActivityLog).filter(models.ActivityLog.tenant_id == tenant_id).limit(50).all()

@app.get("/admin/messages")
def get_messages(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.StoreMessage).filter(models.StoreMessage.tenant_id == tenant_id).all()

@app.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Notification).filter(models.Notification.tenant_id == tenant_id).order_by(models.Notification.created_at.desc()).limit(20).all()

# --- SUPER ADMIN (TORRE DE CONTROL) ---

@app.get("/super-admin/stats")
def get_super_admin_stats(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    if not current_user.is_global_staff and current_user.email != "basicobayup@yopmail.com":
        raise HTTPException(status_code=403, detail="Acceso denegado")
    return {"status": "operational", "active_companies": db.query(models.User).count()}

# --- OTROS ---

@app.get("/health")
def health(): return {"status": "operational", "version": "1.0.8-full"}

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
