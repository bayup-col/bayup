from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uuid
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

load_dotenv()

# Ya no borramos la DB en cada inicio, solo aseguramos que el esquema sea correcto
from database import SessionLocal, engine, get_db
import models
import crud
import security

def init_db_emergency():
    db = SessionLocal()
    try:
        print("🛠️ Verificando integridad de tablas...")
        models.Base.metadata.create_all(bind=engine)
        
        # Asegurar Plan Básico
        plan = db.query(models.Plan).filter(models.Plan.name == "Básico").first()
        if not plan:
            plan = models.Plan(id=uuid.uuid4(), name="Básico", modules=["inicio", "productos", "pedidos", "settings"], is_default=True)
            db.add(plan); db.commit(); db.refresh(plan)

        # Asegurar Usuario Maestro de Emergencia
        email = "basicobayup@yopmail.com"
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            print(f"✨ Creando usuario de acceso: {email}")
            user = models.User(
                id=uuid.uuid4(), email=email, full_name="Administrador Bayup",
                hashed_password=security.get_password_hash("123456"),
                role="admin_tienda", status="Activo", plan_id=plan.id, shop_slug="tienda-maestra"
            )
            db.add(user); db.commit()
    except Exception as e:
        print(f"❌ Error init: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db_emergency()
    yield

app = FastAPI(title="Bayup API", lifespan=lifespan)

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
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/auth/login")
async def login(request: Request, db: Session = Depends(get_db)):
    try:
        data = await request.json()
        u, p = data.get("username"), data.get("password")
    except:
        form = await request.form()
        u, p = form.get("username"), form.get("password")

    if not u or not p:
        raise HTTPException(status_code=400, detail="Faltan credenciales")

    user = crud.get_user_by_email(db, email=u.lower().strip())
    
    # Debug en logs de Railway para verificar intento
    print(f"Login attempt: {u}")

    if not user or not security.verify_password(p, user.hashed_password):
        # El 401 ocurre aqui si la clave o el usuario no coinciden
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    
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

# Rutas de Dashboard (Retornan vacio para evitar errores 404)
@app.get("/auth/me")
def me(curr: models.User = Depends(security.get_current_user)): return curr
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
