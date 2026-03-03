from fastapi import Depends, FastAPI, HTTPException, status, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
import uuid
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

load_dotenv()

from database import SessionLocal, engine, get_db
import models
import crud
import security

# --- REPARACIÓN DE ESQUEMA Y PERMISOS ---
def ensure_full_access():
    print("🛠️ Restaurando acceso total de módulos...")
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Definición oficial de módulos del Plan Básico (Versión Full)
        full_modules = [
            "inicio", "productos", "pedidos", "invoicing", "shipping", 
            "marketing", "loyalty", "discounts", "ai_assistants", 
            "automations", "settings", "staff", "customers", "analytics"
        ]
        
        plan = db.query(models.Plan).filter(models.Plan.name == "Básico").first()
        if not plan:
            plan = models.Plan(
                id=uuid.uuid4(), 
                name="Básico", 
                modules=full_modules,
                is_default=True
            )
            db.add(plan)
        else:
            plan.modules = full_modules # Forzamos la actualización de módulos
        
        db.commit()

        # Asegurar que el usuario de prueba tenga su nombre y plan correcto
        email = "basicobayup@yopmail.com"
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            user.full_name = "Administrador Bayup"
            user.plan_id = plan.id
            db.commit()
            
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_full_access()
    yield

app = FastAPI(title="Bayup OS Full", lifespan=lifespan)

# --- CORS DINÁMICO ---
@app.middleware("http")
async def add_cors_header(request: Request, call_next):
    origin = request.headers.get("origin")
    response = await call_next(request)
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept"
    return response

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
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/auth/me")
def me(db: Session = Depends(get_db), token: str = Depends(security.oauth2_scheme)):
    email = security.decode_token(token)
    user = crud.get_user_by_email(db, email=email)
    return {
        "email": user.email, 
        "full_name": user.full_name, # ESTO ARREGLA EL "¡Hola, ...!"
        "role": user.role, 
        "shop_slug": user.shop_slug,
        "plan": {"name": user.plan.name if user.plan else "Básico", "modules": user.plan.modules if user.plan else []}
    }

# --- RUTAS DE MÓDULOS (RESPUESTAS VACÍAS PARA EVITAR ERRORES) ---
@app.get("/products")
def p(): return []
@app.get("/orders")
def o(): return []
@app.get("/notifications")
def n(): return []
@app.get("/admin/logs")
def l(): return []
@app.get("/health")
def h(): return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
