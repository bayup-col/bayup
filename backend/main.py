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
import requests

# Cargar variables de entorno
load_dotenv()

from database import SessionLocal, engine, get_db
import models
import crud
import schemas
import security
import email_service

# --- MIGRACIÓN Y SEMBRADO DE EMERGENCIA ---
def init_db_emergency():
    db = SessionLocal()
    try:
        print("🛠️ Ejecutando reparaciones de DB...")
        models.Base.metadata.create_all(bind=engine)
        
        # 1. Asegurar Plan Básico
        plan = db.query(models.Plan).filter(models.Plan.name == "Básico").first()
        if not plan:
            plan = models.Plan(
                id=uuid.uuid4(),
                name="Básico",
                description="Plan esencial",
                modules=["inicio", "productos", "pedidos", "settings"],
                is_default=True
            )
            db.add(plan)
            db.commit()
            db.refresh(plan)

        # 2. Asegurar Usuario de Prueba (el que usas en la imagen)
        email = "basicobayup@yopmail.com"
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            user = models.User(
                id=uuid.uuid4(),
                email=email,
                full_name="Usuario Básico",
                hashed_password=security.get_password_hash("123456"), # Password por defecto
                role="admin_tienda",
                status="Activo",
                plan_id=plan.id,
                shop_slug="tienda-basica"
            )
            db.add(user)
            db.commit()
            print(f"✅ Usuario {email} creado con clave 123456")
    except Exception as e:
        print(f"❌ Error en reparacion: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db_emergency()
    yield

app = FastAPI(title="Bayup API", lifespan=lifespan)

# --- CORS Master ---
origins = [
    "https://www.bayup.com.co",
    "https://bayup.com.co",
    "https://bayup-interactive.vercel.app",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex="https://.*\\.bayup\\.com\\.co",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"CRITICAL ERROR: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Error interno", "error": str(exc)})

@app.get("/health")
def health(): return {"status": "ok"}

@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        user = crud.get_user_by_email(db, email=form_data.username.lower().strip())
        if not user or not security.verify_password(form_data.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
        access_token = security.create_access_token(data={"sub": user.email})
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user": {
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "shop_slug": user.shop_slug,
                "plan": {"name": user.plan.name if user.plan else "Básico", "modules": user.plan.modules if user.plan else []}
            }
        }
    except Exception as e:
        print(f"LOGIN ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Error en DB: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
