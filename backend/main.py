from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import uuid
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

load_dotenv()

from database import SessionLocal, engine, get_db
import models
import crud
import security

# --- REPARACIÓN MAESTRA POR SQL PURO ---
def crash_proof_init():
    print("🛠️ Iniciando reparación blindada de base de datos...")
    # 1. Crear tablas si no existen
    models.Base.metadata.create_all(bind=engine)
    
    # 2. Inyectar columnas faltantes usando SQL Directo (evita fallos de ORM)
    required_cols = [
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
        # Obtenemos columnas actuales mediante PRAGMA (SQLite)
        res = conn.execute(text("PRAGMA table_info(users)"))
        existing = [row[1] for row in res]
        
        for col_name, col_type in required_cols:
            if col_name not in existing:
                try:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};"))
                    print(f"✅ SQL: Columna {col_name} inyectada.")
                except Exception as e:
                    print(f"⚠️ SQL Skip {col_name}: {e}")

    # 3. Asegurar datos base
    db = SessionLocal()
    try:
        # Usamos sentencias SQL para evitar fallos de mapeo de modelos en el primer arranque
        db.execute(text("INSERT OR IGNORE INTO plans (id, name, modules, is_default) VALUES (:id, :name, :mod, :def)"), {
            "id": str(uuid.uuid4()), "name": "Básico", 
            "mod": '["inicio", "productos", "pedidos", "invoicing", "shipping", "marketing", "loyalty", "discounts", "ai_assistants", "automations", "settings", "staff", "customers", "analytics"]',
            "def": True
        })
        db.commit()
        print("✅ SQL: Plan Maestro verificado.")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    crash_proof_init()
    yield

app = FastAPI(title="Bayup OS CrashProof", lifespan=lifespan)

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
