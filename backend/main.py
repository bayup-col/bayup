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
            schema_updates = [
                ("users", "nit", "TEXT"), 
                ("users", "address", "TEXT"),
                ("users", "customer_city", "TEXT"),
                ("users", "logo_url", "TEXT"), 
                ("users", "phone", "TEXT"),
                ("users", "shop_slug", "TEXT"), 
                ("users", "category", "TEXT"),
                ("users", "hours", "TEXT"),
                ("users", "social_links", "JSONB"),
                ("users", "whatsapp_lines", "JSONB"),
                ("users", "bank_accounts", "JSONB")
            ]
            for table, col, dtype in schema_updates:
                try: 
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {dtype};"))
                    conn.commit()
                except: 
                    conn.rollback()
    except: pass

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

@app.post("/auth/login")
async def login(request: Request, db: Session = Depends(get_db)):
    try:
        # JIT MIGRATION: Reparación de emergencia antes de leer usuario
        try:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS hours TEXT"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS category TEXT"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS nit TEXT"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_city TEXT"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS shop_slug TEXT"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS logo_url TEXT"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links JSONB"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_lines JSONB"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_accounts JSONB"))
                conn.commit()
        except: pass

        try: body = await request.json()
        except: 
            form = await request.form()
            body = {"username": form.get("username"), "password": form.get("password")}
        
        u, p = body.get("username", ""), body.get("password", "")
        user = crud.get_user_by_email(db, email=u.lower().strip())
        
        if not user or not security.verify_password(p, user.hashed_password):
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")
        
        token = security.create_access_token(data={"sub": user.email})
        
        # LOGIN ULTRA-SEGURO: Sin refresh y con capturadores de error para campos nuevos
        user_data = {
            "id": str(user.id), 
            "email": user.email, 
            "full_name": getattr(user, 'full_name', "Usuario") or "Usuario",
            "role": getattr(user, 'role', "admin_tienda")
        }
        
        # Campos de tienda con fallback seguro
        for field in ['shop_slug', 'logo_url', 'phone', 'nit', 'address', 'customer_city', 'hours', 'category']:
            try: user_data[field] = getattr(user, field, "") or ""
            except: user_data[field] = ""

        return {
            "access_token": token, 
            "token_type": "bearer",
            "user": {**user_data, "plan": {"name": "Básico", "modules": ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"]}}
        }
    except Exception as e: 
        raise HTTPException(status_code=500, detail=f"Error en login: {str(e)}")

@app.get("/auth/me")
def read_me(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(get_db)):
    try:
        user_data = {
            "id": str(current_user.id),
            "email": current_user.email,
            "full_name": getattr(current_user, 'full_name', "Usuario") or "Usuario",
            "role": getattr(current_user, 'role', "admin_tienda")
        }
        for field in ['shop_slug', 'logo_url', 'phone', 'nit', 'address', 'customer_city', 'hours', 'category']:
            try: user_data[field] = getattr(current_user, field, "") or ""
            except: user_data[field] = ""
            
        return {
            **user_data,
            "plan": {"name": "Básico", "modules": ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"]},
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
