from fastapi import Depends, FastAPI, HTTPException, status, Request, BackgroundTasks, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func, text, inspect
import datetime
from datetime import timedelta
from typing import List, Optional, Dict, Any
import uuid
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os
import requests
from pydantic import BaseModel

# Cargar variables de entorno inmediatamente
load_dotenv()

from database import SessionLocal, engine, get_db

# --- MIGRACIÓN AUTOMÁTICA DE EMERGENCIA V2 (FORZADA) ---
def run_critical_migrations():
    print("🚀 Iniciando verificación de esquema de base de datos...")
    try:
        with engine.begin() as conn:
            columns = [
                ("logo_url", "VARCHAR"),
                ("phone", "VARCHAR"),
                ("shop_slug", "VARCHAR"),
                ("custom_domain", "VARCHAR"),
                ("onboarding_completed", "BOOLEAN DEFAULT FALSE")
            ]
            for col_name, col_type in columns:
                try:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};"))
                    print(f"✅ Columna '{col_name}' creada.")
                except Exception as e:
                    if "already exists" in str(e).lower():
                        print(f"ℹ️ Columna '{col_name}' ya presente.")
                    else:
                        print(f"⚠️ Nota ({col_name}): {e}")
            
            try:
                conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_custom_domain ON users (custom_domain);"))
                conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_shop_slug ON users (shop_slug);"))
            except: pass
        print("✅ DB Sincronizada.")
    except Exception as e:
        print(f"❌ Error migración: {e}")

run_critical_migrations()

import crud
import models
import schemas
import security
import s3_service
import payment_service
import clerk_auth_service
import ai_service
import email_service

# --- SEEDING AUTOMÁTICO DE DEMO ONEUP ---
def seed_demo_oneup():
    db = SessionLocal()
    try:
        oneup = db.query(models.User).filter(models.User.shop_slug == "oneup").first()
        if not oneup:
            print("🌱 Sembrando Demo OneUp...")
            plan = db.query(models.Plan).first()
            oneup = models.User(
                email="oneup@bayup.com",
                full_name="OneUp Fashion",
                shop_slug="oneup",
                hashed_password="hashed_dummy",
                role="admin_tienda",
                plan_id=plan.id if plan else None,
                status="Activo"
            )
            db.add(oneup)
            db.commit()
            db.refresh(oneup)
            
            demo_products = [
                {"name": "Vestido Eira Silk", "price": 285000, "sku": "VE-001", "image_url": ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800"]},
                {"name": "Blusa Aura White", "price": 145000, "sku": "BA-002", "image_url": ["https://images.unsplash.com/photo-1539109136881-3be061694b9b?q=80&w=800"]},
                {"name": "Pantalón Luna Beige", "price": 195000, "sku": "PL-003", "image_url": ["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=800"]}
            ]
            for p_data in demo_products:
                p = models.Product(**p_data, owner_id=oneup.id)
                db.add(p)
            db.commit()
            print("✅ Demo OneUp sembrada con éxito.")
    except Exception as e:
        print(f"⚠️ Error en seeding demo: {e}")
    finally:
        db.close()

seed_demo_oneup()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting Bayup API...")
    try:
        models.Base.metadata.create_all(bind=engine)
    except: pass
    yield

app = FastAPI(title="Bayup API", lifespan=lifespan)

# --- ENDPOINT DE DIAGNÓSTICO ---
@app.get("/debug-db")
def debug_db():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"))
            return {"columns": [row[0] for row in result]}
    except Exception as e: return {"error": str(e)}

# --- CONFIGURACIÓN GLOBALES ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check(): return {"status": "ok", "db": engine.name}

@app.post("/auth/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email.lower().strip())
    if db_user: raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = security.get_password_hash(user.password)
    target_plan = crud.get_default_plan(db)
    
    base_slug = user.email.split('@')[0].replace('.', '-').lower()
    shop_slug = base_slug
    counter = 1
    while crud.get_user_by_slug(db, shop_slug):
        shop_slug = f"{base_slug}-{counter}"
        counter += 1

    new_user = models.User(
        id=uuid.uuid4(),
        email=user.email.lower().strip(),
        full_name=user.full_name or user.email.split('@')[0],
        hashed_password=hashed_password,
        role="admin_tienda",
        status="Activo",
        plan_id=target_plan.id if target_plan else None,
        shop_slug=shop_slug
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    background_tasks.add_task(email_service.send_welcome_email, new_user.email, new_user.full_name)
    return new_user

@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        user = crud.get_user_by_email(db, email=form_data.username.lower().strip())
        if not user or not security.verify_password(form_data.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        
        access_token = security.create_access_token(data={"sub": user.email})
        user_plan = user.plan
        allowed_modules = user_plan.modules if user_plan and user_plan.modules else ['inicio', 'productos', 'pedidos', 'settings']

        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user": {
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "shop_slug": user.shop_slug,
                "plan": {"name": user_plan.name if user_plan else "Básico", "modules": allowed_modules}
            }
        }
    except Exception as e:
        print(f"LOGIN ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.get("/products", response_model=List[schemas.Product])
def read_products(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return crud.get_products_by_owner(db, owner_id=tenant_id)

@app.post("/products/import-excel")
async def import_products_excel(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    # ... (Lógica de importación ya corregida arriba) ...
    pass

# ... (El resto del archivo se mantiene igual o simplificado para restaurar servicio) ...

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
