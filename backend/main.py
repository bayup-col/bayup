from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

# --- REINICIO NUCLEAR DE BASE DE DATOS ---
# Borramos la DB antigua para asegurar que el esquema sea PERFECTO
if os.path.exists("sql_app.db"):
    try:
        os.remove("sql_app.db")
        print("🗑️ Base de datos antigua eliminada satisfactoriamente.")
    except Exception as e:
        print(f"Error borrando DB: {e}")

from database import SessionLocal, engine, get_db
import models
import crud
import security

def init_system_full():
    print("🚀 Iniciando Reconstruccion Total del Sistema...")
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Crear Plan Maestro con TODOS los modulos
        modules = ["inicio", "productos", "pedidos", "invoicing", "shipping", "marketing", "loyalty", "discounts", "ai_assistants", "automations", "settings", "staff", "customers", "analytics"]
        plan = models.Plan(
            id=uuid.uuid4(),
            name="Básico",
            description="Plan Full Restaurado",
            modules=modules,
            is_default=True
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)

        # 2. Crear Usuario Maestro con acceso garantizado
        email = "basicobayup@yopmail.com"
        user = models.User(
            id=uuid.uuid4(),
            email=email,
            full_name="Administrador Bayup",
            hashed_password=security.get_password_hash("123456"),
            role="admin_tienda",
            status="Activo",
            plan_id=plan.id,
            shop_slug="tienda-principal"
        )
        db.add(user)
        db.commit()
        print(f"✨ SISTEMA RECONSTRUIDO: {email} / 123456")
    finally:
        db.close()

from contextlib import asynccontextmanager
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_system_full()
    yield

app = FastAPI(title="Bayup OS Ultimate", lifespan=lifespan)

# --- CORS OFICIAL ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://www.bayup.com.co", "https://bayup.com.co", "https://bayup-interactive.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/auth/login")
async def login(request: Request, db: Session = Depends(get_db)):
    try:
        try: data = await request.json()
        except: 
            form = await request.form()
            data = {"username": form.get("username"), "password": form.get("password")}
        
        u, p = data.get("username"), data.get("password")
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

@app.get("/auth/me")
def me(db: Session = Depends(get_db), token: str = Depends(security.oauth2_scheme)):
    email = security.decode_token(token)
    user = crud.get_user_by_email(db, email=email)
    return {
        "email": user.email, "full_name": user.full_name, "role": user.role, "shop_slug": user.shop_slug,
        "plan": {"name": user.plan.name if user.plan else "Básico", "modules": user.plan.modules if user.plan else []}
    }

# Rutas Dashboard (Vacias para evitar errores 404)
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
