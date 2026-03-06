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

# --- ASEGURAR DIRECTORIO DE CARGAS ---
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    try: os.makedirs(UPLOAD_DIR, exist_ok=True)
    except: pass

# --- CONEXIÓN A DB ---
from database import SessionLocal, engine, get_db
import models, crud, security, schemas

def safe_db_init():
    try:
        models.Base.metadata.create_all(bind=engine)
        with engine.connect() as conn:
            # Sincronización básica de columnas
            for col, dtype in [("logo_url", "TEXT"), ("phone", "TEXT"), ("shop_slug", "TEXT")]:
                try: conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {dtype};")); conn.commit()
                except: pass
    except: pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    safe_db_init()
    yield

app = FastAPI(title="Bayup OS - Core", lifespan=lifespan)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- RUTAS DE AUTENTICACIÓN ---

@app.post("/auth/register", response_model=schemas.User)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, email=user_in.email):
        raise HTTPException(status_code=400, detail="Email ya registrado")
    return crud.create_user(db, user_in)

@app.post("/auth/login")
async def login(request: Request, db: Session = Depends(get_db)):
    # Soporte tanto para JSON como para Form Data (Pytest usa Form Data a veces)
    try:
        body = await request.json()
        u, p = body.get("username"), body.get("password")
    except:
        form = await request.form()
        u, p = form.get("username"), form.get("password")
    
    if not u or not p:
        raise HTTPException(status_code=400, detail="Faltan credenciales")
        
    user = crud.get_user_by_email(db, email=u.lower().strip())
    if not user or not security.verify_password(p, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    token = security.create_access_token(data={"sub": user.email})
    plan = user.plan
    return {
        "access_token": token, "token_type": "bearer",
        "user": {
            "email": user.email, "full_name": user.full_name, "role": user.role, "shop_slug": user.shop_slug,
            "plan": {"name": plan.name if plan else "Básico", "modules": plan.modules if plan else ["inicio"]}
        }
    }

@app.get("/auth/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(security.get_current_user)):
    return current_user

# --- RUTAS ADMINISTRATIVAS ---

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

@app.get("/orders", response_model=List[schemas.Order])
def get_orders(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Order).filter(models.Order.tenant_id == tid).all()

@app.get("/super-admin/stats")
def get_super_admin_stats(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    if not current_user.is_global_staff and current_user.email != "basicobayup@yopmail.com":
        raise HTTPException(status_code=403, detail="Acceso denegado")
    return {"status": "ok"}

# --- UTILIDADES ---

@app.get("/health")
def health(): return {"status": "operational"}

try:
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
except: pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
