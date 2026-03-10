from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from pydantic import BaseModel
import threading

load_dotenv()

# --- ARRANQUE SEGURO (SIN IMPORTACIONES CRÍTICAS ARRIBA) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialización diferida para evitar Error 502 en Railway
    def init_task():
        try:
            from database import engine
            import models
            models.Base.metadata.create_all(bind=engine)
            print("✅ Motor Bayup: Infraestructura Sincronizada")
        except Exception as e:
            print(f"⚠️ Motor Bayup: Aviso en arranque: {e}")
            
    threading.Thread(target=init_task, daemon=True).start()
    yield

app = FastAPI(title="Bayup OS Platinum", lifespan=lifespan)

# --- CONFIGURACIÓN CORS SUPREMA ---
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
    return {"status": "Active", "version": "2.1 Platinum Production"}

@app.post("/auth/login")
def login(form_data: UserLoginRequest):
    # Importaciones internas para evitar bloqueos en el arranque
    from database import SessionLocal
    import crud, security
    
    db = SessionLocal()
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
    finally:
        db.close()

@app.get("/auth/me")
def read_users_me(request: Request):
    import security
    from database import SessionLocal
    
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="No token")
        
    token = auth_header.split(" ")[1]
    db = SessionLocal()
    try:
        current_user = security.get_current_user(db, token)
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
    finally:
        db.close()

@app.get("/products")
def get_products(): return []

@app.get("/orders")
def get_orders(): return []

@app.get("/notifications")
def get_notifications(): return []

@app.get("/collections")
def get_collections(): return []
