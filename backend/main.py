from fastapi import Depends, FastAPI, HTTPException, status, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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

app = FastAPI(title="Bayup OS - Emergency Mode v2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https://.*",
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# --- LOGIN DE EMERGENCIA (SQL PURO) ---
@app.post("/auth/login")
async def login(request: Request, db: Session = Depends(get_db)):
    try:
        # 1. Obtener credenciales
        try: body = await request.json()
        except: 
            form = await request.form()
            body = {"username": form.get("username"), "password": form.get("password")}
        
        u = body.get("username", "").lower().strip()
        p = body.get("password", "")

        # 2. Consulta SQL Directa (Evita error de columnas faltantes en ORM)
        # Solo pedimos lo esencial para entrar
        stmt = text("SELECT id, email, hashed_password, full_name, role FROM users WHERE email = :u")
        result = db.execute(stmt, {"u": u}).mappings().first()
        
        if not result:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
            
        # 3. Validación de Password
        if not security.verify_password(p, result['hashed_password']):
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")
        
        # 4. Generar Token
        token = security.create_access_token(data={"sub": result['email']})
        
        # 5. Construir respuesta segura (Fallbacks para campos nuevos)
        # Intentamos leer los otros campos, si fallan ponemos vacíos
        extra_data = {}
        try:
            extra_query = text("SELECT shop_slug, logo_url, phone, nit, address, customer_city, hours, category FROM users WHERE id = :uid")
            extra = db.execute(extra_query, {"uid": result['id']}).mappings().first()
            if extra:
                extra_data = dict(extra)
        except: 
            pass # Si falla por columna inexistente, extra_data queda vacío

        return {
            "access_token": token, 
            "token_type": "bearer",
            "user": {
                "id": str(result['id']), 
                "email": result['email'], 
                "full_name": result['full_name'] or "Usuario Bayup",
                "role": result['role'] or "admin_tienda",
                "shop_slug": extra_data.get('shop_slug') or "",
                "logo_url": extra_data.get('logo_url') or "",
                "phone": extra_data.get('phone') or "",
                "nit": extra_data.get('nit') or "",
                "address": extra_data.get('address') or "",
                "customer_city": extra_data.get('customer_city') or "",
                "hours": extra_data.get('hours') or "",
                "category": extra_data.get('category') or "",
                "country": "Colombia",
                "plan": {"name": "Básico", "modules": ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"]}
            }
        }
    except HTTPException as he: raise he
    except Exception as e: 
        print(f"❌ LOGIN CRITICAL ERROR: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error de sistema en login. Ver logs.")

@app.get("/auth/me")
def read_me(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(get_db)):
    # Fallback ultra-seguro para el perfil usando SQL
    try:
        uid = current_user.id
        extra_data = {}
        try:
            extra_query = text("SELECT shop_slug, logo_url, phone, nit, address, customer_city, hours, category FROM users WHERE id = :uid")
            extra = db.execute(extra_query, {"uid": uid}).mappings().first()
            if extra: extra_data = dict(extra)
        except: pass

        return {
            "id": str(uid),
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role,
            "shop_slug": extra_data.get('shop_slug') or "",
            "logo_url": extra_data.get('logo_url') or "",
            "phone": extra_data.get('phone') or "",
            "nit": extra_data.get('nit') or "",
            "address": extra_data.get('address') or "",
            "customer_city": extra_data.get('customer_city') or "",
            "hours": extra_data.get('hours') or "",
            "category": extra_data.get('category') or "",
            "country": "Colombia",
            "plan": {"name": "Básico", "modules": ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"]},
            "social_links": getattr(current_user, 'social_links', {}) or {},
            "whatsapp_lines": getattr(current_user, 'whatsapp_lines', []) or [],
            "bank_accounts": getattr(current_user, 'bank_accounts', []) or []
        }
    except: return {}

# --- GUARDADO CON AUTO-REPARACIÓN (JIT) ---
@app.put("/admin/update-profile")
def update_profile(profile_data: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    try:
        # Intentamos actualizar. Si falla por columna, reparamos y reintentamos.
        uid = str(current_user.id)
        
        # Mapa de datos a actualizar
        params = {
            "n": profile_data.full_name, 
            "p": profile_data.phone, 
            "nit": profile_data.nit,
            "a": profile_data.address, 
            "c": profile_data.customer_city, 
            "s": profile_data.shop_slug,
            "h": profile_data.hours, 
            "cat": profile_data.category,
            "uid": uid
        }
        
        sql = text("""
            UPDATE users SET 
                full_name = :n, 
                phone = :p, 
                nit = :nit, 
                address = :a, 
                customer_city = :c, 
                shop_slug = :s, 
                hours = :h, 
                category = :cat 
            WHERE id = :uid
        """)
        
        if profile_data.logo_url:
            sql = text("""
                UPDATE users SET 
                    full_name = :n, phone = :p, nit = :nit, address = :a, 
                    customer_city = :c, shop_slug = :s, hours = :h, category = :cat, 
                    logo_url = :logo 
                WHERE id = :uid
            """)
            params["logo"] = profile_data.logo_url

        try:
            db.execute(sql, params)
            db.commit()
        except Exception as db_err:
            # Si falla, asumimos que faltan columnas y ejecutamos reparación
            print(f"⚠️ Fallo update ({db_err}), intentando reparación JIT...")
            db.rollback()
            with engine.connect() as conn:
                for col in ["hours", "category", "nit", "address", "customer_city", "shop_slug", "phone", "logo_url"]:
                    try: 
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col} TEXT"))
                        conn.commit()
                    except: pass
            
            # Reintento final
            db.execute(sql, params)
            db.commit()
        
        # Actualizar campos JSON vía ORM (estos suelen ser seguros)
        try:
            db_user = db.query(models.User).filter(models.User.id == uid).first()
            if profile_data.social_links: db_user.social_links = profile_data.social_links
            if profile_data.bank_accounts: db_user.bank_accounts = profile_data.bank_accounts
            if profile_data.whatsapp_lines: db_user.whatsapp_lines = profile_data.whatsapp_lines
            db.commit()
        except: pass

        return {"status": "success"}
    except Exception as e:
        db.rollback()
        print(f"❌ CRITICAL UPDATE ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
def health(): return {"status": "ok", "version": "emergency-2.0"}

try: app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
except: pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
