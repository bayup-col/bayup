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
from typing import List

load_dotenv()

# --- REPARACIÓN DE INICIO (ASEGURAR DIRECTORIOS) ---
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
    except: pass

# --- CONEXIÓN A DB ---
from database import SessionLocal, engine, get_db
import models, crud, security, schemas

def safe_db_init():
    """Sincroniza el esquema de base de datos de forma segura."""
    try:
        models.Base.metadata.create_all(bind=engine)
        with engine.connect() as conn:
            # Columnas para USERS
            user_cols = [
                ("logo_url", "TEXT"), ("phone", "TEXT"), ("shop_slug", "TEXT"),
                ("nit", "TEXT"), ("address", "TEXT"),
                ("is_global_staff", "BOOLEAN DEFAULT FALSE"), ("permissions", "JSONB")
            ]
            for c_n, c_t in user_cols:
                try: conn.execute(text(f"ALTER TABLE users ADD COLUMN {c_n} {c_t};")); conn.commit()
                except: pass
            
            # Columnas para ORDERS
            order_cols = [
                ("customer_city", "TEXT"), ("shipping_address", "TEXT"),
                ("source", "TEXT DEFAULT 'pos'"), ("payment_method", "TEXT DEFAULT 'cash'")
            ]
            for c_n, c_t in order_cols:
                try: conn.execute(text(f"ALTER TABLE orders ADD COLUMN {c_n} {c_t};")); conn.commit()
                except: pass
    except Exception as e:
        print(f"⚠️ Init DB Warning: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    safe_db_init()
    yield

app = FastAPI(title="Bayup OS - Final Stable Core", lifespan=lifespan)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTHENTICATION ---

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
        
        u = body.get("username", "").lower().strip()
        p = body.get("password", "")
        
        user = crud.get_user_by_email(db, email=u)
        if not user or not security.verify_password(p, user.hashed_password):
            # Error 401 explícito para Pytest y Seguridad
            raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
        
        token = security.create_access_token(data={"sub": user.email})
        plan = user.plan
        
        return {
            "access_token": token, "token_type": "bearer",
            "user": {
                "email": user.email, "full_name": user.full_name, "role": user.role, "shop_slug": user.shop_slug,
                "plan": {"name": plan.name if plan else "Básico", "modules": plan.modules if plan else ["inicio", "settings"]}
            }
        }
    except HTTPException as he: raise he
    except Exception as e:
        print(f"🔥 Error en Login: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Fallo interno en el servidor")

@app.get("/auth/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(security.get_current_user)):
    return current_user

# --- PRODUCTS ---

@app.get("/products", response_model=List[schemas.Product])
def read_products(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Product).filter(models.Product.owner_id == tid).all()

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

# --- ORDERS ---

@app.get("/orders", response_model=List[schemas.Order])
def get_orders(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Order).filter(models.Order.tenant_id == tid).all()

@app.post("/orders", response_model=schemas.Order)
def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    db_order = models.Order(**order_data.model_dump(exclude={"items"}), status="completed", id=uuid.uuid4(), tenant_id=tid)
    db.add(db_order); db.flush()
    for item in order_data.items:
        db_item = models.OrderItem(**item.model_dump(), order_id=db_order.id, id=uuid.uuid4())
        db.add(db_item)
        variant = db.query(models.ProductVariant).filter(models.ProductVariant.id == item.product_variant_id).first()
        if variant: variant.stock = max(0, variant.stock - item.quantity)
    db.commit(); db.refresh(db_order)
    return db_order

# --- ADMIN & UTILS ---

@app.get("/admin/logs")
def get_logs(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.ActivityLog).filter(models.ActivityLog.tenant_id == tid).limit(50).all()

@app.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Notification).filter(models.Notification.tenant_id == tid).order_by(models.Notification.created_at.desc()).limit(20).all()

@app.post("/admin/upload-image")
async def upload_image(file: UploadFile = File(...), current_user: models.User = Depends(security.get_current_user)):
    fname = f"{uuid.uuid4()}.{file.filename.split('.')[-1]}"
    fpath = os.path.join(UPLOAD_DIR, fname)
    with open(fpath, "wb") as buf: shutil.copyfileobj(file.file, buf)
    dom = os.getenv("RAILWAY_PUBLIC_DOMAIN", "localhost:8080")
    return {"url": f"https://{dom}/uploads/{fname}" if "railway" in dom else f"http://{dom}/uploads/{fname}"}

# --- SUPER ADMIN ---

@app.get("/super-admin/stats")
def get_super_admin_stats(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    if not current_user.is_global_staff and current_user.email != "basicobayup@yopmail.com":
        raise HTTPException(status_code=403, detail="Acceso restringido")
    return {"status": "ok", "total_users": db.query(models.User).count()}

@app.get("/health")
def health(): return {"status": "stable", "v": "1.0.9"}

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
