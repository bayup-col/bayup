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

load_dotenv()

from database import SessionLocal, engine, get_db
import models
import crud
import schemas
import security
import email_service

# --- REPARACIÓN DE ESQUEMA (ASEGURAR COLUMNAS) ---
def ensure_schema():
    models.Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    existing_columns = [c['name'] for c in inspector.get_columns('users')]
    required = [("logo_url", "VARCHAR"), ("phone", "VARCHAR"), ("shop_slug", "VARCHAR"),
                ("custom_domain", "VARCHAR"), ("onboarding_completed", "BOOLEAN DEFAULT FALSE")]
    with engine.begin() as conn:
        for c_n, c_t in required:
            if c_n not in existing_columns:
                try: conn.execute(text(f"ALTER TABLE users ADD COLUMN {c_n} {c_t};"))
                except: pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_schema()
    yield

app = FastAPI(title="Bayup OS - Connected", lifespan=lifespan)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://www.bayup.com.co", "https://bayup.com.co", "https://bayup-interactive.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTH ---
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
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")
        
        token = security.create_access_token(data={"sub": user.email})
        return {
            "access_token": token, "token_type": "bearer",
            "user": {
                "email": user.email, "full_name": user.full_name, "role": user.role, "shop_slug": user.shop_slug,
                "plan": {"name": user.plan.name if user.plan else "Básico", "modules": user.plan.modules if user.plan else []}
            }
        }
    except HTTPException as he: raise he
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/auth/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(security.get_current_user)):
    return current_user

# --- PRODUCTOS (CONECTADO A DB) ---
@app.get("/products", response_model=List[schemas.Product])
def read_products(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    # Filtrar por owner_id para que solo vea SUS productos
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Product).filter(models.Product.owner_id == tenant_id).all()

# --- PEDIDOS (CONECTADO A DB) ---
@app.get("/orders", response_model=List[schemas.Order])
def get_orders(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Order).filter(models.Order.tenant_id == tenant_id).all()

# --- FACTURACIÓN / VENTAS POS (CONECTADO A DB) ---
@app.get("/invoices")
def get_invoices(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Sale).filter(models.Sale.tenant_id == tenant_id).all()

# --- MENSAJES / CHATS (CONECTADO A DB) ---
@app.get("/chats")
def get_chats(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.ChatMessage).filter(models.ChatMessage.tenant_id == tenant_id).all()

@app.get("/health")
def health(): return {"status": "fully_connected"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
