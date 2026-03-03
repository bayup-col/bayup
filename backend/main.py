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

load_dotenv()

from database import SessionLocal, engine, get_db
import models
import crud
import schemas
import security
import email_service

# --- REPARACIÓN TÉCNICA (SIN BORRAR DATOS) ---
def repair_schema():
    print("🛠️ Verificando esquema premium...")
    models.Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    existing_columns = [c['name'] for c in inspector.get_columns('users')]
    
    required = [
        ("logo_url", "VARCHAR"), ("phone", "VARCHAR"), ("shop_slug", "VARCHAR"),
        ("custom_domain", "VARCHAR"), ("onboarding_completed", "BOOLEAN DEFAULT FALSE"),
        ("is_global_staff", "BOOLEAN DEFAULT FALSE"), ("permissions", "JSON"),
        ("bank_accounts", "JSON"), ("social_links", "JSON"), ("whatsapp_lines", "JSON"),
        ("last_month_revenue", "FLOAT DEFAULT 0"), ("custom_commission_rate", "FLOAT"),
        ("commission_fixed_until", "DATETIME"), ("commission_is_fixed", "BOOLEAN DEFAULT FALSE"),
        ("referred_by_id", "VARCHAR"), ("customer_type", "VARCHAR"),
        ("acquisition_channel", "VARCHAR"), ("total_spent", "FLOAT DEFAULT 0"),
        ("last_purchase_date", "DATETIME"), ("nickname", "VARCHAR")
    ]
    
    with engine.begin() as conn:
        for col_name, col_type in required:
            if col_name not in existing_columns:
                try: conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};"))
                except: pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    repair_schema()
    yield

app = FastAPI(title="Bayup OS", lifespan=lifespan)

# --- CORS PREMIUM (DOMINIOS OFICIALES) ---
origins = ["https://www.bayup.com.co", "https://bayup.com.co", "https://bayup-interactive.vercel.app", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex="https://.*\\.bayup\\.com\\.co|https://.*\\.vercel\\.app",
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
        
        # Restauramos la devolucion completa de modulos segun el plan
        plan = user.plan
        modules = plan.modules if plan and plan.modules else ["inicio", "productos", "pedidos", "settings", "invoicing"]
        
        return {
            "access_token": token, "token_type": "bearer",
            "user": {
                "email": user.email, "full_name": user.full_name, "role": user.role, "shop_slug": user.shop_slug,
                "is_global_staff": bool(user.is_global_staff), "permissions": user.permissions or {},
                "plan": {"name": plan.name if plan else "Básico", "modules": modules}
            }
        }
    except HTTPException as he: raise he
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/auth/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(security.get_current_user)):
    return current_user

# --- RESTAURACIÓN DE TODAS LAS RUTAS ORIGINALES ---
@app.get("/products")
def read_products(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    t_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Product).filter(models.Product.owner_id == t_id).all()

@app.get("/orders")
def get_orders(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    t_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Order).filter(models.Order.tenant_id == t_id).all()

@app.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    t_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Notification).filter(models.Notification.tenant_id == t_id).limit(20).all()

@app.get("/admin/logs")
def get_logs(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    t_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.ActivityLog).filter(models.ActivityLog.tenant_id == t_id).limit(50).all()

# --- MODULOS ADICIONALES RESTAURADOS ---
@app.get("/expenses")
def get_expenses(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    t_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Expense).filter(models.Expense.tenant_id == t_id).all()

@app.get("/ai-assistants")
def get_assistants(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    t_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.AIAssistant).filter(models.AIAssistant.owner_id == t_id).all()

@app.get("/health")
def health(): return {"status": "online", "version": "Full Restore"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
