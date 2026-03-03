from fastapi import Depends, FastAPI, HTTPException, status, Request, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
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

def init_db_emergency():
    db = SessionLocal()
    try:
        print("🛠️ Iniciando REPARACIÓN PROFUNDA de DB...")
        # 1. Crear tablas si no existen
        models.Base.metadata.create_all(bind=engine)
        
        # 2. Forzar adición de columnas faltantes (SQLite ALTER TABLE)
        with engine.begin() as conn:
            columns = [
                ("logo_url", "VARCHAR"), ("nickname", "VARCHAR"), ("phone", "VARCHAR"),
                ("is_global_staff", "BOOLEAN DEFAULT FALSE"), ("shop_slug", "VARCHAR"),
                ("custom_domain", "VARCHAR"), ("onboarding_completed", "BOOLEAN DEFAULT FALSE"),
                ("bank_accounts", "JSON"), ("social_links", "JSON"), ("whatsapp_lines", "JSON"),
                ("last_month_revenue", "FLOAT DEFAULT 0"), ("custom_commission_rate", "FLOAT"),
                ("commission_fixed_until", "DATETIME"), ("commission_is_fixed", "BOOLEAN DEFAULT FALSE"),
                ("referred_by_id", "VARCHAR"), ("customer_type", "VARCHAR"),
                ("acquisition_channel", "VARCHAR"), ("total_spent", "FLOAT DEFAULT 0"),
                ("last_purchase_date", "DATETIME")
            ]
            for col_name, col_type in columns:
                try:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};"))
                    print(f"✅ Columna añadida: {col_name}")
                except Exception:
                    pass # La columna ya existe

        # 3. Asegurar Plan y Usuario
        plan = db.query(models.Plan).first()
        if not plan:
            plan = models.Plan(id=uuid.uuid4(), name="Básico", modules=["inicio", "productos", "pedidos", "settings"], is_default=True)
            db.add(plan); db.commit(); db.refresh(plan)

        email = "basicobayup@yopmail.com"
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            user = models.User(
                id=uuid.uuid4(), email=email, full_name="Usuario Básico",
                hashed_password=security.get_password_hash("123456"),
                role="admin_tienda", status="Activo", plan_id=plan.id, shop_slug="tienda-basica"
            )
            db.add(user); db.commit()
            print(f"✅ Usuario {email} listo.")
    except Exception as e:
        print(f"❌ Error en reparacion: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db_emergency()
    yield

app = FastAPI(title="Bayup API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permitir todo temporalmente para asegurar el login
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username.lower().strip())
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    access_token = security.create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "email": user.email, "full_name": user.full_name, "role": user.role, "shop_slug": user.shop_slug,
            "plan": {"name": user.plan.name if user.plan else "Básico", "modules": user.plan.modules if user.plan else []}
        }
    }

@app.get("/health")
def health(): return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
