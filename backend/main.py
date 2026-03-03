from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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

def fix_db_structure():
    """Fuerza la creacion de la columna faltante para evitar el Error 500."""
    try:
        with engine.begin() as conn:
            # Lista de columnas criticas que han causado el 500
            columns = [
                ("custom_commission_rate", "FLOAT"),
                ("commission_fixed_until", "DATETIME"),
                ("commission_is_fixed", "BOOLEAN DEFAULT FALSE"),
                ("last_month_revenue", "FLOAT DEFAULT 0")
            ]
            for col_name, col_type in columns:
                try:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};"))
                    print(f"✅ Reparada columna: {col_name}")
                except Exception:
                    pass # La columna ya existe
    except Exception as e:
        print(f"Nota reparacion: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Iniciando Bayup en Modo Estable...")
    models.Base.metadata.create_all(bind=engine)
    fix_db_structure()
    
    # Asegurar usuario maestro
    db = SessionLocal()
    try:
        email = "basicobayup@yopmail.com"
        if not db.query(models.User).filter(models.User.email == email).first():
            plan = db.query(models.Plan).first()
            if not plan:
                plan = models.Plan(id=uuid.uuid4(), name="Básico", modules=["inicio", "productos", "pedidos", "settings"], is_default=True)
                db.add(plan); db.commit(); db.refresh(plan)
            
            user = models.User(
                id=uuid.uuid4(), email=email, full_name="Admin",
                hashed_password=security.get_password_hash("123456"),
                role="admin_tienda", status="Activo", plan_id=plan.id, shop_slug="tienda"
            )
            db.add(user); db.commit()
            print(f"✨ Usuario maestro verificado: {email}")
    finally:
        db.close()
    yield

app = FastAPI(title="Bayup Stable API", lifespan=lifespan)

# --- CORS BLINDADO ---
origins = [
    "https://www.bayup.com.co",
    "https://bayup.com.co",
    "https://bayup-interactive.vercel.app",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex="https://.*\\.bayup\\.com\\.co|https://.*\\.vercel\\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"🔥 FALLO INTERNO: {exc}")
    # Si falla la DB, intentamos devolver un error que no rompa el CORS
    return JSONResponse(
        status_code=500,
        content={"detail": "Error en el servidor", "message": str(exc)}
    )

@app.post("/auth/login")
async def login(request: Request, db: Session = Depends(get_db)):
    try:
        # Extraer credenciales de forma ultra-segura
        body = await request.json()
        u = body.get("username", "").lower().strip()
        p = body.get("password", "")
    except:
        try:
            form = await request.form()
            u = form.get("username", "").lower().strip()
            p = form.get("password", "")
        except:
            raise HTTPException(status_code=400, detail="Formato de datos no valido")

    if not u or not p:
        raise HTTPException(status_code=400, detail="Usuario y clave requeridos")

    user = crud.get_user_by_email(db, email=u)
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
