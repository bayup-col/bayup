from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

from database import SessionLocal, engine, get_db
import models
import crud
import security

# --- BLINDAJE Y ASEGURAMIENTO DE ACCESO ---
def startup_repair():
    print("🛠️ Ejecutando mantenimiento de arranque...")
    models.Base.metadata.create_all(bind=engine)
    
    # Columnas necesarias
    cols = [("logo_url", "VARCHAR"), ("phone", "VARCHAR"), ("shop_slug", "VARCHAR"),
            ("custom_domain", "VARCHAR"), ("onboarding_completed", "BOOLEAN DEFAULT FALSE"),
            ("is_global_staff", "BOOLEAN DEFAULT FALSE"), ("permissions", "JSON"),
            ("last_month_revenue", "FLOAT DEFAULT 0"), ("custom_commission_rate", "FLOAT")]
    
    with engine.begin() as conn:
        res = conn.execute(text("PRAGMA table_info(users)"))
        existing = [row[1] for row in res]
        for c_n, c_t in cols:
            if c_n not in existing:
                try: conn.execute(text(f"ALTER TABLE users ADD COLUMN {c_n} {c_t};"))
                except: pass

    # ASEGURAR USUARIO Y CLAVE (Garantiza acceso 100%)
    db = SessionLocal()
    try:
        # 1. Asegurar Plan Full
        modulos = '["inicio", "productos", "pedidos", "invoicing", "shipping", "marketing", "loyalty", "discounts", "ai_assistants", "automations", "settings", "staff", "customers", "analytics"]'
        db.execute(text("INSERT OR IGNORE INTO plans (id, name, modules, is_default) VALUES (:id, :n, :m, :d)"),
                  {"id": str(uuid.uuid4()), "n": "Básico", "m": modulos, "d": True})
        db.commit()
        
        plan = db.query(models.Plan).first()
        
        # 2. Resetear Usuario Maestro (Si existe, actualizamos clave; si no, creamos)
        email = "basicobayup@yopmail.com"
        pass_hash = security.get_password_hash("123456")
        
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            user.hashed_password = pass_hash # Forzamos reset de clave a 123456
            user.full_name = "Administrador Bayup"
            user.plan_id = plan.id
        else:
            user = models.User(
                id=uuid.uuid4(), email=email, full_name="Administrador Bayup",
                hashed_password=pass_hash, role="admin_tienda", status="Activo",
                plan_id=plan.id, shop_slug="tienda-maestra"
            )
            db.add(user)
        db.commit()
        print(f"✨ ACCESO RESTAURADO: {email} / 123456")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    startup_repair()
    yield

from contextlib import asynccontextmanager
app = FastAPI(title="Bayup OS Final", lifespan=lifespan)

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

@app.get("/health")
def h(): return {"status": "ok"}

# Rutas Dashboard minimas
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
