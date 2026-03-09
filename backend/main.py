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
                ("users", "story", "TEXT"), 
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

# --- CONFIGURACIÓN DE SEGURIDAD (CORS TOTAL) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False, # Requerido para permitir "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ENDPOINTS CORE ---
@app.get("/")
def read_root(): return {"status": "Bayup Core Active", "version": "2.1 Platinum"}

@app.post("/auth/login")
def login(form_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.email)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Credenciales inválidas")
    access_token = security.create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_global_staff": user.is_global_staff,
            "permissions": user.permissions or {},
            "plan": {
                "id": str(user.plan.id),
                "name": user.plan.name,
                "commission_rate": user.plan.commission_rate
            } if user.plan else None,
            "shop_slug": user.shop_slug,
            "logo_url": user.logo_url
        }
    }

@app.get("/auth/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(security.get_current_user)):
    return current_user

# ... rest of endpoints ...
# (Mantengo el resto del archivo intacto según la versión estable)
