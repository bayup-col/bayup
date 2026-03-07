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
            # Intentamos crear columnas críticas una a una de forma segura
            cols = [("hours", "TEXT"), ("category", "TEXT"), ("nit", "TEXT"), ("address", "TEXT"), ("customer_city", "TEXT"), ("shop_slug", "TEXT")]
            for col, dtype in cols:
                try: 
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col} {dtype}"))
                    conn.commit()
                except: pass
    except: pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    safe_db_init()
    yield

app = FastAPI(title="Bayup OS - Survivor Core", lifespan=lifespan)

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
        # 1. PARSEO SEGURO
        try: body = await request.json()
        except: 
            form = await request.form()
            body = {"username": form.get("username"), "password": form.get("password")}
        
        u = body.get("username", "").lower().strip()
        p = body.get("password", "")

        # 2. SQL PURO (INMUNE A ERRORES DE SCHEMA)
        # Solo pedimos lo que sabemos que existe en la DB original
        sql = text("SELECT id, email, hashed_password, full_name, role FROM users WHERE email = :u")
        result = db.execute(sql, {"u": u}).first()
        
        if not result or not security.verify_password(p, result.hashed_password):
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")
        
        token = security.create_access_token(data={"sub": result.email})
        
        # 3. RESPUESTA BLINDADA
        return {
            "access_token": token, 
            "token_type": "bearer",
            "user": {
                "id": str(result.id), 
                "email": result.email, 
                "full_name": result.full_name or "Usuario Bayup",
                "role": result.role or "admin_tienda",
                "plan": {"name": "Básico", "modules": ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"]}
            }
        }
    except HTTPException as he: raise he
    except Exception as e: 
        print(f"❌ Error Crítico Login: {e}")
        raise HTTPException(status_code=500, detail="Error interno de acceso")

@app.get("/auth/me")
def read_me(current_user: models.User = Depends(security.get_current_user)):
    # Fallback ultra-seguro para el perfil
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": getattr(current_user, 'full_name', "Usuario"),
        "role": getattr(current_user, 'role', "admin_tienda"),
        "plan": {"name": "Básico", "modules": ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"]}
    }

@app.get("/products", response_model=List[schemas.Product])
def get_products(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    try:
        products = db.query(models.Product).filter(models.Product.owner_id == tid).all()
        output = []
        for p in products:
            output.append({
                "id": p.id, "name": p.name, "price": p.price or 0, "status": p.status or "active",
                "owner_id": p.owner_id, "description": p.description or "", "category": p.category or "General",
                "variants": [], "image_url": []
            })
        return output
    except: return []

@app.put("/admin/update-profile")
def update_profile(profile_data: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    try:
        # REPARACIÓN JIT SILENCIOSA (SQL PURO)
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS hours TEXT"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS category TEXT"))
            conn.commit()
        
        # ACTUALIZACIÓN MANUAL (SQL PURO PARA EVITAR CACHÉ)
        sql = text("UPDATE users SET full_name = :n, phone = :p, nit = :nit, address = :a, customer_city = :c, shop_slug = :s, hours = :h, category = :cat WHERE id = :id")
        db.execute(sql, {
            "n": profile_data.full_name, "p": profile_data.phone, "nit": profile_data.nit,
            "a": profile_data.address, "c": profile_data.customer_city, "s": profile_data.shop_slug,
            "h": profile_data.hours, "cat": profile_data.category, "id": current_user.id
        })
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health(): return {"status": "ok", "version": "survivor-1.0"}

try: app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
except: pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
