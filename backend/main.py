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

# --- INFRAESTRUCTURA ---
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    try: os.makedirs(UPLOAD_DIR, exist_ok=True)
    except: pass

from database import SessionLocal, engine, get_db
import models, crud, security, schemas

def safe_db_init():
    try:
        models.Base.metadata.create_all(bind=engine)
        with engine.connect() as conn:
            cols = [
                ("users", "hours", "TEXT"), ("users", "category", "TEXT"), 
                ("users", "nit", "TEXT"), ("users", "address", "TEXT"), 
                ("users", "customer_city", "TEXT"), ("users", "shop_slug", "TEXT"),
                ("users", "story", "TEXT"), # <--- NUEVA COLUMNA BIOGRAFÍA
                ("users", "social_links", "JSONB"), ("users", "whatsapp_lines", "JSONB"),
                ("users", "bank_accounts", "JSONB")
            ]
            for table, col, dtype in cols:
                try: 
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {dtype}"))
                    conn.commit()
                except: pass
    except: pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    safe_db_init()
    yield

app = FastAPI(title="Bayup OS - Platinum Core v2.1", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https://.*",
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# --- [MODULO] AUTENTICACIÓN (SQL BLINDADO) ---

@app.post("/auth/login")
async def login(request: Request, db: Session = Depends(get_db)):
    try:
        try: body = await request.json()
        except: 
            form = await request.form()
            body = {"username": form.get("username"), "password": form.get("password")}
        
        u = body.get("username", "").lower().strip()
        p = body.get("password", "")

        # Consulta SQL pura para evitar bloqueos de schema ORM
        sql = text("SELECT id, email, hashed_password, full_name, role FROM users WHERE email = :u")
        result = db.execute(sql, {"u": u}).mappings().first()
        
        if not result or not security.verify_password(p, result['hashed_password']):
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")
        
        token = security.create_access_token(data={"sub": result['email']})
        
        # Lectura de campos extra con fallback
        extra = {}
        try:
            ex_sql = text("SELECT shop_slug, logo_url, phone, nit, address, customer_city, hours, category, story FROM users WHERE id = :uid")
            ex_res = db.execute(ex_sql, {"uid": result['id']}).mappings().first()
            if ex_res: extra = dict(ex_res)
        except: pass

        return {
            "access_token": token, 
            "token_type": "bearer",
            "user": {
                "id": str(result['id']), 
                "email": result['email'], 
                "full_name": result['full_name'] or "Usuario Bayup",
                "role": result['role'] or "admin_tienda",
                "shop_slug": extra.get('shop_slug') or "",
                "logo_url": extra.get('logo_url') or "",
                "phone": extra.get('phone') or "",
                "nit": extra.get('nit') or "",
                "address": extra.get('address') or "",
                "customer_city": extra.get('customer_city') or "",
                "hours": extra.get('hours') or "",
                "category": extra.get('category') or "",
                "story": extra.get('story') or "",
                "plan": {"name": "Básico", "modules": ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"]}
            }
        }
    except Exception as e: 
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@app.get("/auth/me")
def read_me(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(get_db)):
    try:
        # Refrescamos datos manualmente para evitar caché
        uid = current_user.id
        ex_sql = text("SELECT shop_slug, logo_url, phone, nit, address, customer_city, hours, category FROM users WHERE id = :uid")
        extra = db.execute(ex_sql, {"uid": uid}).mappings().first()
        ed = dict(extra) if extra else {}

        return {
            "id": str(uid),
            "email": current_user.email,
            "full_name": current_user.full_name or "Usuario",
            "role": current_user.role,
            "shop_slug": ed.get('shop_slug') or "",
            "logo_url": ed.get('logo_url') or "",
            "phone": ed.get('phone') or "",
            "nit": ed.get('nit') or "",
            "address": ed.get('address') or "",
            "customer_city": ed.get('customer_city') or "",
            "hours": ed.get('hours') or "",
            "category": ed.get('category') or "",
            "plan": {"name": "Básico", "modules": ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"]},
            "social_links": getattr(current_user, 'social_links', {}) or {},
            "whatsapp_lines": getattr(current_user, 'whatsapp_lines', []) or [],
            "bank_accounts": getattr(current_user, 'bank_accounts', []) or []
        }
    except: return {}

# --- [MODULO] COLECCIONES ---

@app.get("/collections", response_model=List[schemas.Collection])
def get_collections(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    try:
        return db.query(models.Collection).filter(models.Collection.owner_id == tid).all()
    except Exception:
        db.rollback()
        return []

# --- [MODULO] PRODUCTOS ---

@app.get("/products", response_model=List[schemas.Product])
def get_products(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    try:
        prods = db.query(models.Product).filter(models.Product.owner_id == tid).all()
        output = []
        for p in prods:
            try:
                vars = db.query(models.ProductVariant).filter(models.ProductVariant.product_id == p.id).all()
                vlist = [{"id": v.id, "name": v.name, "sku": v.sku, "stock": v.stock, "price": v.price, "product_id": p.id} for v in vars]
            except: vlist = []
            img = []
            try:
                if p.image_url:
                    if isinstance(p.image_url, list): img = p.image_url
                    elif isinstance(p.image_url, str) and p.image_url.startswith('['): img = json.loads(p.image_url)
                    elif isinstance(p.image_url, str): img = [p.image_url]
            except: pass
            output.append({"id": p.id, "name": p.name, "price": p.price or 0, "status": p.status or "active", "owner_id": p.owner_id, "description": p.description or "", "category": p.category or "General", "variants": vlist, "image_url": img})
        return output
    except: return []

@app.post("/products", response_model=schemas.Product)
def create_product(product_in: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    db_p = models.Product(**product_in.model_dump(exclude={"variants"}), owner_id=tid, id=uuid.uuid4())
    db.add(db_p); db.flush()
    for v in product_in.variants:
        db.add(models.ProductVariant(**v.model_dump(), product_id=db_p.id, id=uuid.uuid4()))
    db.commit(); db.refresh(db_p)
    return db_p

# --- [MODULO] ÓRDENES & DASHBOARD ---

@app.get("/orders", response_model=List[schemas.Order])
def read_orders(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Order).filter(models.Order.tenant_id == tid).all()

@app.get("/notifications")
def get_notifs(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Notification).filter(models.Notification.tenant_id == tid).order_by(models.Notification.created_at.desc()).limit(20).all()

@app.get("/admin/logs")
def get_logs(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.ActivityLog).filter(models.ActivityLog.tenant_id == tid).order_by(models.ActivityLog.created_at.desc()).limit(50).all()

@app.get("/admin/messages")
def get_msgs(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.StoreMessage).filter(models.StoreMessage.tenant_id == tid).order_by(models.StoreMessage.created_at.desc()).all()

# --- [MODULO] PERFIL & GUARDADO (REFORZADO) ---

@app.put("/admin/update-profile")
def update_profile(profile_data: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    try:
        # 1. SQL Directo para campos de texto (Inmune a fallos de ORM)
        sql = text("""
            UPDATE users SET 
                full_name = :n, phone = :p, nit = :nit, address = :a, 
                customer_city = :c, shop_slug = :s, hours = :h, 
                category = :cat, story = :story
            WHERE id = :uid
        """)
        db.execute(sql, {
            "n": profile_data.full_name, "p": profile_data.phone, "nit": profile_data.nit,
            "a": profile_data.address, "c": profile_data.customer_city, 
            "s": profile_data.shop_slug, "h": profile_data.hours, 
            "cat": profile_data.category, "story": profile_data.story,
            "uid": str(current_user.id)
        })
        
        # 2. ORM para campos JSON y logo
        db_user = db.query(models.User).filter(models.User.id == current_user.id).first()
        if profile_data.logo_url: db_user.logo_url = profile_data.logo_url
        if profile_data.social_links: db_user.social_links = profile_data.social_links
        db.commit()
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
    db.execute(text("UPDATE users SET logo_url = :url WHERE id = :uid"), {"url": final_url, "uid": str(current_user.id)})
    db.commit()
    return {"url": final_url}

@app.get("/health")
def health(): return {"status": "ok", "version": "platinum-final"}

try: app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
except: pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
