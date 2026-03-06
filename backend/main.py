from fastapi import Depends, FastAPI, HTTPException, status, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
import uuid
import os
import shutil
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles

load_dotenv()

# --- CONEXIÓN A DB REAL ---
from database import SessionLocal, engine, get_db
import models
import crud
import security
import schemas

def safe_db_init():
    """Repara el esquema sin tocar los datos existentes. Blindado contra colapsos."""
    print("🛠️ Verificando base de datos persistente...")
    try:
        # Crea las tablas solo si NO existen
        models.Base.metadata.create_all(bind=engine)
        
        # Inyección segura de columnas (ALTER TABLE)
        required_cols = [
            ("logo_url", "TEXT"), ("phone", "TEXT"), ("shop_slug", "TEXT"),
            ("nit", "TEXT"), ("address", "TEXT"),
            ("custom_domain", "TEXT"), ("onboarding_completed", "BOOLEAN DEFAULT FALSE"),
            ("is_global_staff", "BOOLEAN DEFAULT FALSE"), ("permissions", "JSONB")
        ]
        
        with engine.connect() as conn:
            for c_n, c_t in required_cols:
                try:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {c_n} {c_t};"))
                    conn.commit()
                    print(f"✅ Columna inyectada: {c_n}")
                except Exception:
                    pass # Ya existe o error de permisos

    except Exception as global_e:
        print(f"❌ Error en safe_db_init: {global_e}")

    # Asegurar Datos Maestros
    db = SessionLocal()
    try:
        plan = db.query(models.Plan).filter(models.Plan.name == "Básico").first()
        if not plan:
            plan = models.Plan(
                id=uuid.uuid4(), name="Básico", 
                commission_rate=3.5, monthly_fee=0.0,
                modules=["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"],
                is_default=True
            )
            db.add(plan); db.commit(); db.refresh(plan)

        for email in ["basicobayup@yopmail.com", "basicobayup@yopmail.co"]:
            if not db.query(models.User).filter(models.User.email == email).first():
                user = models.User(
                    id=uuid.uuid4(), email=email, full_name="Sebastián Bayup",
                    hashed_password=security.get_password_hash("123456"),
                    role="admin_tienda", status="Activo", plan_id=plan.id, shop_slug="mi-tienda"
                )
                db.add(user); db.commit()
                print(f"✨ Usuario maestro {email} creado.")
    except Exception as e:
        print(f"⚠️ Aviso en post-init: {e}")
    finally:
        db.close()

from contextlib import asynccontextmanager
@asynccontextmanager
async def lifespan(app: FastAPI):
    safe_db_init()
    yield

app = FastAPI(title="Bayup OS - Production - Force Rebuild v2", lifespan=lifespan)

# --- CORS DEFINITIVO (PARA PRODUCCIÓN) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.bayup.com.co",
        "https://bayup.com.co",
        "https://bayup-interactive.vercel.app",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health(): return {"status": "connected_and_persistent"}

@app.get("/admin/fix-db-force")
def fix_db_force():
    results = []
    with engine.connect() as conn:
        for col in ["nit", "address"]:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} TEXT;"))
                conn.commit()
                results.append(f"✅ {col} creada.")
            except Exception as e:
                results.append(f"❌ {col} falló: {str(e)}")
    return {"status": "completed", "details": results}

@app.post("/auth/login")
async def login(request: Request, db: Session = Depends(get_db)):
    try:
        try: body = await request.json()
        except: 
            form = await request.form()
            body = {"username": form.get("username"), "password": form.get("password")}
        
        u, p = body.get("username"), body.get("password")
        if not u or not p: raise HTTPException(status_code=400, detail="Credenciales requeridas")

        user = crud.get_user_by_email(db, email=u.lower().strip())
        if not user or not security.verify_password(p, user.hashed_password):
            raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
        
        token = security.create_access_token(data={"sub": user.email})
        
        # Fallback de plan seguro
        plan_name = user.plan.name if user.plan else "Básico"
        modules = user.plan.modules if user.plan else ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"]

        return {
            "access_token": token, "token_type": "bearer",
            "user": {
                "email": user.email, "full_name": user.full_name, "role": user.role, "shop_slug": user.shop_slug,
                "plan": {"name": plan_name, "modules": modules}
            }
        }
    except HTTPException as he: raise he
    except Exception as e: 
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

# ... (resto de endpoints administrativos omitidos por brevedad pero preservados localmente)

@app.get("/auth/me", response_model=schemas.User)
def me(current_user: models.User = Depends(security.get_current_user)):
    return current_user

@app.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Notification).filter(models.Notification.tenant_id == tenant_id).order_by(models.Notification.created_at.desc()).limit(20).all()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
