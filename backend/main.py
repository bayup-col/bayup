from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

# MANTENEMOS EL REINICIO PARA LIMPIAR EL DESORDEN DE MODULOS ANTERIOR
if os.path.exists("sql_app.db"):
    try: os.remove("sql_app.db")
    except: pass

from database import SessionLocal, engine, get_db
import models
import crud
import security

def init_approved_basic_plan():
    print("🛠️ Restaurando Plan Basico Original...")
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # DEFINICION REAL DEL PLAN BASICO (Solo lo aprobado)
        basic_modules = ["inicio", "productos", "pedidos", "invoicing", "settings"]
        
        plan = models.Plan(
            id=uuid.uuid4(),
            name="Básico",
            description="Plan Esencial Bayup",
            modules=basic_modules,
            is_default=True
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)

        # Crear Usuario con Nombre Real
        email = "basicobayup@yopmail.com"
        user = models.User(
            id=uuid.uuid4(),
            email=email,
            full_name="Sebastián Bayup", # Nombre real para el saludo
            hashed_password=security.get_password_hash("123456"),
            role="admin_tienda",
            status="Activo",
            plan_id=plan.id,
            shop_slug="mi-tienda"
        )
        db.add(user)
        db.commit()
        print(f"✅ Plan y Usuario restaurados correctamente.")
    finally:
        db.close()

from contextlib import asynccontextmanager
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_approved_basic_plan()
    yield

app = FastAPI(title="Bayup OS", lifespan=lifespan)

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
    if not user: raise HTTPException(status_code=404)
    return {
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "shop_slug": user.shop_slug,
        "plan": {"name": user.plan.name if user.plan else "Básico", "modules": user.plan.modules if user.plan else []}
    }

# Rutas Dashboard (Vacias para evitar 404)
@app.get("/products")
def p(): return []
@app.get("/orders")
def o(): return []
@app.get("/notifications")
def n(): return []
@app.get("/admin/logs")
def l(): return []

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
