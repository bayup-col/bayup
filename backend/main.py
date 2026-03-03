from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

from database import SessionLocal, engine, get_db
import models
import crud
import security

# --- REPARACIÓN DE ESQUEMA (SIN BORRAR NADA) ---
def final_repair():
    print("🛠️ Asegurando esquema y modulos aprobados...")
    models.Base.metadata.create_all(bind=engine)
    
    # Inyectar columnas si faltan (para evitar Error 500)
    required_cols = [("logo_url", "VARCHAR"), ("phone", "VARCHAR"), ("shop_slug", "VARCHAR"),
                    ("custom_domain", "VARCHAR"), ("onboarding_completed", "BOOLEAN DEFAULT FALSE"),
                    ("is_global_staff", "BOOLEAN DEFAULT FALSE"), ("permissions", "JSON")]
    
    with engine.begin() as conn:
        inspector = inspect(engine)
        existing = [c['name'] for c in inspector.get_columns('users')]
        for c_n, c_t in required_cols:
            if c_n not in existing:
                try: conn.execute(text(f"ALTER TABLE users ADD COLUMN {c_n} {c_t};"))
                except: pass

    db = SessionLocal()
    try:
        # Restaurar Módulos Oficiales del Plan Básico
        # 1. Inicio, 2. Facturacion, 3. Pedidos Web, 4. Productos, 5. Envios, 6. Mensajes Web, 7. Config Tienda
        basic_modules = ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"]
        
        plan = db.query(models.Plan).filter(models.Plan.name == "Básico").first()
        if not plan:
            plan = models.Plan(id=uuid.uuid4(), name="Básico", modules=basic_modules, is_default=True)
            db.add(plan)
        else:
            plan.modules = basic_modules
        db.commit()

        # Asegurar que el usuario Sebastián Bayup tenga su nombre y plan
        user = db.query(models.User).filter(models.User.email == "basicobayup@yopmail.com").first()
        if user:
            user.full_name = "Sebastián Bayup"
            user.plan_id = plan.id
            db.commit()
    finally:
        db.close()

from contextlib import asynccontextmanager
@asynccontextmanager
async def lifespan(app: FastAPI):
    final_repair()
    yield

app = FastAPI(title="Bayup OS Final", lifespan=lifespan)

# --- CORS ---
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
