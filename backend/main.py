from fastapi import Depends, FastAPI, HTTPException, status, Request
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

# --- AUTO-REPARACION DE DB (Basada en inspeccion) ---
def ensure_db_schema():
    print("🛠️ Verificando esquema de base de datos...")
    try:
        # Crear tablas faltantes
        models.Base.metadata.create_all(bind=engine)
        
        # Inspeccionar columnas existentes
        inspector = inspect(engine)
        existing_columns = [c['name'] for c in inspector.get_columns('users')]
        
        # Lista de columnas que DEBEN existir
        required_columns = [
            ("logo_url", "VARCHAR"), ("phone", "VARCHAR"), ("shop_slug", "VARCHAR"),
            ("custom_domain", "VARCHAR"), ("onboarding_completed", "BOOLEAN DEFAULT FALSE"),
            ("nickname", "VARCHAR"), ("is_global_staff", "BOOLEAN DEFAULT FALSE"),
            ("bank_accounts", "JSON"), ("social_links", "JSON"), ("whatsapp_lines", "JSON"),
            ("last_month_revenue", "FLOAT DEFAULT 0"), ("custom_commission_rate", "FLOAT"),
            ("commission_fixed_until", "DATETIME"), ("commission_is_fixed", "BOOLEAN DEFAULT FALSE"),
            ("referred_by_id", "VARCHAR"), ("customer_type", "VARCHAR"),
            ("acquisition_channel", "VARCHAR"), ("total_spent", "FLOAT DEFAULT 0"),
            ("last_purchase_date", "DATETIME"), ("permissions", "JSON")
        ]
        
        with engine.begin() as conn:
            for col_name, col_type in required_columns:
                if col_name not in existing_columns:
                    try:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};"))
                        print(f"✅ Inyectada columna faltante: {col_name}")
                    except Exception as e:
                        print(f"⚠️ No se pudo inyectar {col_name}: {e}")
        
        # Asegurar datos minimos
        db = SessionLocal()
        try:
            plan = db.query(models.Plan).first()
            if not plan:
                plan = models.Plan(id=uuid.uuid4(), name="Básico", modules=["inicio", "productos", "pedidos", "settings"], is_default=True)
                db.add(plan); db.commit(); db.refresh(plan)
            
            email = "basicobayup@yopmail.com"
            if not db.query(models.User).filter(models.User.email == email).first():
                user = models.User(id=uuid.uuid4(), email=email, full_name="Admin", hashed_password=security.get_password_hash("123456"), role="admin_tienda", status="Activo", plan_id=plan.id, shop_slug="tienda")
                db.add(user); db.commit()
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Error critico en esquema: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_db_schema()
    yield

app = FastAPI(title="Bayup Final API", lifespan=lifespan)

# --- CORS DINAMICO (Acepta cualquier origen de Bayup/Vercel) ---
@app.middleware("http")
async def add_cors_header(request: Request, call_next):
    origin = request.headers.get("origin")
    response = await call_next(request)
    if origin:
        # Permitir dominios oficiales y subdominios
        if "bayup.com.co" in origin or "vercel.app" in origin or "localhost" in origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept"
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"🔥 FALLO INTERNO: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Error en el servidor", "message": str(exc)})

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
    if not user: raise HTTPException(status_code=404)
    return {
        "email": user.email, "full_name": user.full_name, "role": user.role, "shop_slug": user.shop_slug,
        "plan": {"name": user.plan.name if user.plan else "Básico", "modules": user.plan.modules if user.plan else []}
    }

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
