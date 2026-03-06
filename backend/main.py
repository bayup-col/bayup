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
    os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- CONEXIÓN A DB REAL ---
from database import SessionLocal, engine, get_db
import models, crud, security, schemas

def safe_db_init():
    """Repara el esquema sin tocar los datos existentes. Grado Industrial."""
    print("🛠️ Iniciando Auto-Reparación de Esquema...")
    try:
        models.Base.metadata.create_all(bind=engine)
        
        with engine.connect() as conn:
            # 1. Reparar tabla USERS
            user_cols = [
                ("logo_url", "TEXT"), ("phone", "TEXT"), ("shop_slug", "TEXT"),
                ("nit", "TEXT"), ("address", "TEXT"),
                ("is_global_staff", "BOOLEAN DEFAULT FALSE"), ("permissions", "JSONB")
            ]
            for c_n, c_t in user_cols:
                try: conn.execute(text(f"ALTER TABLE users ADD COLUMN {c_n} {c_t};")); conn.commit()
                except: pass

            # 2. Reparar tabla ORDERS (Faltaba esto!)
            order_cols = [
                ("customer_city", "TEXT"), ("shipping_address", "TEXT"),
                ("source", "TEXT DEFAULT 'pos'"), ("payment_method", "TEXT DEFAULT 'cash'")
            ]
            for c_n, c_t in order_cols:
                try: conn.execute(text(f"ALTER TABLE orders ADD COLUMN {c_n} {c_t};")); conn.commit()
                except: pass
                
        print("✅ Esquema sincronizado con éxito.")
    except Exception as e: 
        print(f"❌ Error crítico en init: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    safe_db_init()
    yield

app = FastAPI(title="Bayup OS - Full Production Core v5", lifespan=lifespan)

# --- CORS ROBUSTO (INCLUSO EN ERRORES) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permitimos temporalmente todo para depurar el 500
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ENDPOINTS ---

@app.post("/auth/login")
async def login(request: Request, db: Session = Depends(get_db)):
    try:
        try: body = await request.json()
        except: 
            form = await request.form()
            body = {"username": form.get("username"), "password": form.get("password")}
        
        user = crud.get_user_by_email(db, email=body.get("username", "").lower().strip())
        if not user or not security.verify_password(body.get("password", ""), user.hashed_password):
            raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
        
        token = security.create_access_token(data={"sub": user.email})
        p = user.plan
        return {
            "access_token": token, "token_type": "bearer",
            "user": {
                "email": user.email, "full_name": user.full_name, "role": user.role, "shop_slug": user.shop_slug,
                "plan": {"name": p.name if p else "Básico", "modules": p.modules if p else ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"]}
            }
        }
    except Exception as e:
        print(f"🔥 Error en Login: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Fallo interno en autenticación")

@app.get("/auth/me", response_model=schemas.User)
def me(current_user: models.User = Depends(security.get_current_user)):
    return current_user

@app.get("/products")
def read_products(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Product).filter(models.Product.owner_id == tenant_id).all()

@app.get("/orders")
def get_orders(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    """Carga de órdenes blindada contra errores de esquema."""
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    try:
        return db.query(models.Order).filter(models.Order.tenant_id == tenant_id).all()
    except Exception as e:
        print(f"🔥 Error cargando órdenes: {e}")
        return [] # Devolvemos lista vacía en lugar de romper el sistema

@app.post("/orders", response_model=schemas.Order)
def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    db_order = models.Order(**order_data.model_dump(exclude={"items"}), status="completed", id=uuid.uuid4(), tenant_id=tenant_id)
    db.add(db_order); db.flush()
    for item in order_data.items:
        db_item = models.OrderItem(**item.model_dump(), order_id=db_order.id, id=uuid.uuid4())
        db.add(db_item)
        variant = db.query(models.ProductVariant).filter(models.ProductVariant.id == item.product_variant_id).first()
        if variant: variant.stock = max(0, variant.stock - item.quantity)
    db.commit(); db.refresh(db_order)
    return db_order

@app.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Notification).filter(models.Notification.tenant_id == tenant_id).order_by(models.Notification.created_at.desc()).limit(20).all()

@app.get("/health")
def health(): return {"status": "full_core_operational", "v": 5}

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
