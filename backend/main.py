from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import uuid
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

load_dotenv()

# IMPORTANTE: Borrar DB antigua para forzar esquema limpio si hay errores de columnas
DB_FILE = "sql_app.db"
if os.path.exists(DB_FILE):
    print("🗑️ Borrando base de datos antigua para reconstruccion completa...")
    try:
        os.remove(DB_FILE)
    except Exception as e:
        print(f"No se pudo borrar: {e}")

from database import SessionLocal, engine, get_db
import models
import crud
import security

def init_db_emergency():
    db = SessionLocal()
    try:
        print("🛠️ Creando tablas con esquema maestro...")
        models.Base.metadata.create_all(bind=engine)
        
        # Crear Plan y Usuario
        plan = models.Plan(id=uuid.uuid4(), name="Básico", modules=["inicio", "productos", "pedidos", "settings"], is_default=True)
        db.add(plan)
        db.commit()
        db.refresh(plan)

        email = "basicobayup@yopmail.com"
        user = models.User(
            id=uuid.uuid4(), email=email, full_name="Usuario Básico",
            hashed_password=security.get_password_hash("123456"),
            role="admin_tienda", status="Activo", plan_id=plan.id, shop_slug="tienda-basica"
        )
        db.add(user)
        db.commit()
        print(f"✅ Sistema listo. Usuario: {email} / Clave: 123456")
    except Exception as e:
        print(f"❌ Error en inicializacion: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db_emergency()
    yield

app = FastAPI(title="Bayup API", lifespan=lifespan)

# --- CORS BLINDADO (Dominios Vercel + Bayup) ---
origins = [
    "https://www.bayup.com.co",
    "https://bayup.com.co",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex="https://.*\\.bayup\\.com\\.co|https://.*\\.vercel\\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/auth/login")
async def login(request: Request, db: Session = Depends(get_db)):
    try:
        data = await request.json()
        u = data.get("username")
        p = data.get("password")
    except:
        form = await request.form()
        u = form.get("username")
        p = form.get("password")

    user = crud.get_user_by_email(db, email=u.lower().strip() if u else "")
    if not user or not security.verify_password(p, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    token = security.create_access_token(data={"sub": user.email})
    return {
        "access_token": token, "token_type": "bearer",
        "user": {
            "email": user.email, "full_name": user.full_name, "role": user.role, "shop_slug": user.shop_slug,
            "plan": {"name": user.plan.name if user.plan else "Básico", "modules": user.plan.modules if user.plan else []}
        }
    }

@app.get("/health")
def health(): return {"status": "ok"}

# Rutas minimas para evitar 404
@app.get("/auth/me")
def me(curr: models.User = Depends(security.get_current_user)): return curr
@app.get("/products")
def p(db: Session = Depends(get_db)): return []
@app.get("/orders")
def o(db: Session = Depends(get_db)): return []
@app.get("/notifications")
def n(db: Session = Depends(get_db)): return []
@app.get("/admin/logs")
def l(db: Session = Depends(get_db)): return []

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
