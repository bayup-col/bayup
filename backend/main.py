from fastapi import Depends, FastAPI, HTTPException, status, Request, BackgroundTasks, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func, text
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

# --- REPARACIÓN Y SEMBRADO ---
def init_db_emergency():
    db = SessionLocal()
    try:
        models.Base.metadata.create_all(bind=engine)
        with engine.begin() as conn:
            cols = [
                ("logo_url", "VARCHAR"), ("phone", "VARCHAR"), ("shop_slug", "VARCHAR"),
                ("custom_domain", "VARCHAR"), ("onboarding_completed", "BOOLEAN DEFAULT FALSE"),
                ("is_global_staff", "BOOLEAN DEFAULT FALSE"), ("permissions", "JSON")
            ]
            for c_n, c_t in cols:
                try: conn.execute(text(f"ALTER TABLE users ADD COLUMN {c_n} {c_t};"))
                except: pass
        
        plan = db.query(models.Plan).first()
        if not plan:
            plan = models.Plan(id=uuid.uuid4(), name="Básico", modules=["inicio", "productos", "pedidos", "settings"], is_default=True)
            db.add(plan); db.commit(); db.refresh(plan)
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db_emergency()
    yield

app = FastAPI(title="Bayup API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTH ---
@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username.lower().strip())
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    access_token = security.create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token, "token_type": "bearer",
        "user": {
            "email": user.email, "full_name": user.full_name, "role": user.role, "shop_slug": user.shop_slug,
            "is_global_staff": bool(user.is_global_staff),
            "plan": {"name": user.plan.name if user.plan else "Básico", "modules": user.plan.modules if user.plan else []}
        }
    }

@app.get("/auth/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(security.get_current_user)):
    return current_user

# --- PRODUCTOS ---
@app.get("/products", response_model=List[schemas.Product])
def read_products(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    t_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Product).filter(models.Product.owner_id == t_id).all()

# --- PEDIDOS ---
@app.get("/orders", response_model=List[schemas.Order])
def get_orders(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    t_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Order).filter(models.Order.tenant_id == t_id).all()

# --- NOTIFICACIONES ---
@app.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    t_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Notification).filter(models.Notification.tenant_id == t_id).limit(10).all()

# --- LOGS ---
@app.get("/admin/logs")
def get_logs(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    t_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.ActivityLog).filter(models.ActivityLog.tenant_id == t_id).limit(20).all()

@app.get("/health")
def health(): return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
