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

# --- Tenant Isolation Helper ---
def get_tenant_id(current_user):
    return current_user.owner_id if current_user.owner_id else current_user.id

# --- Lifespan (Startup/Shutdown) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting Bayup API (Production Mode)...")
    # Asegurar que las tablas existen
    import models
    models.Base.metadata.create_all(bind=engine)
    yield
    print("Shutting down Bayup API...")

app = FastAPI(title="Bayup API", lifespan=lifespan)

# --- CONFIGURACIÓN DE SEGURIDAD (CORS) MASTER ---
# IMPORTANTE: Esto debe ir ANTES de cualquier ruta.
origins = [
    "https://www.bayup.com.co",
    "https://bayup.com.co",
    "https://bayup-interactive.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex="https://.*\\.bayup\\.com\\.co", # Soporte para subdominios de tiendas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Manejador de Errores con CORS (Para evitar que errores 500 bloqueen el login)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"CRITICAL ERROR: {exc}")
    response = JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "message": str(exc)},
    )
    # Forzamos cabeceras CORS en el error
    origin = request.headers.get("origin")
    if origin in origins or (origin and "bayup.com.co" in origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

# --- IMPORTACIÓN DE MÓDULOS ---
import crud
import models
import schemas
import security
import s3_service
import payment_service
import ai_service
import email_service

# Servir archivos estáticos
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- ENDPOINTS DE SALUD ---
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected", "port": os.getenv("PORT", "8080")}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/")
def read_root():
    return {"message": "Bayup API is Online", "version": "2.7"}

# --- AUTENTICACIÓN NATIVA ---

@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        normalized_email = form_data.username.lower().strip()
        user = crud.get_user_by_email(db, email=normalized_email)
        
        if not user or not security.verify_password(form_data.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
        
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
                "is_global_staff": bool(user.is_global_staff),
                "permissions": user.permissions or {},
                "plan": {
                    "name": user_plan.name if user_plan else "Básico",
                    "modules": allowed_modules
                }
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"LOGIN ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno en el inicio de sesión")

@app.post("/auth/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email.lower().strip())
    if db_user:
        raise HTTPException(status_code=400, detail="Este correo ya está registrado")
    
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
        full_name=user.full_name.strip(),
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

@app.get("/auth/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(security.get_current_user)):
    return current_user

# --- PRODUCTOS ---

@app.get("/products", response_model=List[schemas.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    return crud.get_products_by_owner(db, owner_id=tenant_id, skip=skip, limit=limit)

@app.post("/products", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    return crud.create_product(db=db, product=product, owner_id=tenant_id)

@app.delete("/products/{product_id}")
def delete_product(product_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    success = crud.delete_product(db=db, product_id=product_id, owner_id=tenant_id)
    if not success:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"status": "success"}

# --- TIENDA PÚBLICA ---

@app.get("/public/shop/{slug}")
def get_public_shop(slug: str, db: Session = Depends(get_db)):
    store_owner = db.query(models.User).filter(models.User.shop_slug == slug).first()
    if not store_owner:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
    
    products = db.query(models.Product).filter(models.Product.owner_id == store_owner.id, models.Product.status == "active").all()
    
    return {
        "store_name": store_owner.full_name,
        "logo_url": store_owner.logo_url,
        "products": products
    }

# --- ARRANQUE ---
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
