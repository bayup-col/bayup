from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from pydantic import BaseModel
import threading

load_dotenv()

# --- IMPORTACIONES CORE ---
from database import engine, get_db
import models, crud, security

# Sincronización segura de DB
def safe_db_init():
    try:
        models.Base.metadata.create_all(bind=engine)
    except:
        pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialización en segundo plano para evitar Error 502 por timeout
    threading.Thread(target=safe_db_init, daemon=True).start()
    yield

app = FastAPI(title="Bayup OS Platinum", lifespan=lifespan)

# --- CONFIGURACIÓN CORS SUPREMA ---
# Permitimos absolutamente todo para restaurar el servicio de inmediato
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

class UserLoginRequest(BaseModel):
    email: str
    password: str

@app.get("/")
def read_root():
    return {"status": "Bayup Core Active", "version": "2.1 Platinum Production"}

@app.post("/auth/login")
def login(form_data: UserLoginRequest, db: Session = Depends(get_db)):
    try:
        user = crud.get_user_by_email(db, email=form_data.email)
        if not user or not security.verify_password(form_data.password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Credenciales inválidas")
        
        access_token = security.create_access_token(data={"sub": user.email})
        
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user": {
                "email": user.email,
                "full_name": getattr(user, 'full_name', ""),
                "role": getattr(user, 'role', "admin_tienda"),
                "is_global_staff": getattr(user, 'is_global_staff', False),
                "permissions": getattr(user, 'permissions', {}) or {},
                "plan": {
                    "id": str(user.plan.id) if getattr(user, 'plan', None) else None,
                    "name": user.plan.name if getattr(user, 'plan', None) else "Básico"
                } if getattr(user, 'plan', None) else None,
                "shop_slug": getattr(user, 'shop_slug', ""),
                "logo_url": getattr(user, 'logo_url', "")
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"DEBUG: Error en login: {e}")
        raise HTTPException(status_code=500, detail="Fallo interno en el motor de acceso")

@app.get("/auth/me")
def read_users_me(current_user: models.User = Depends(security.get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": getattr(current_user, 'full_name', ""),
        "role": getattr(current_user, 'role', "admin_tienda"),
        "is_global_staff": getattr(current_user, 'is_global_staff', False),
        "shop_slug": getattr(current_user, 'shop_slug', ""),
        "logo_url": getattr(current_user, 'logo_url', ""),
        "permissions": getattr(current_user, 'permissions', {}) or {}
    }

@app.get("/products")
def get_products(): return []

@app.get("/orders")
def get_orders(): return []

@app.get("/notifications")
def get_notifications(): return []

@app.get("/collections")
def get_collections(): return []
