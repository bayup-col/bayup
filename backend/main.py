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

# --- REPARACION DE EMERGENCIA INMEDIATA ---
# Ejecutamos esto antes de que FastAPI arranque
def force_fix_db():
    print("🛠️ Ejecutando ALTER TABLE de emergencia...")
    columns = [
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
        # Aseguramos que las tablas base existan
        models.Base.metadata.create_all(bind=conn)
        for col_name, col_type in columns:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};"))
                print(f"✅ Columna inyectada: {col_name}")
            except Exception:
                pass # Ya existe

# Ejecutar reparacion
force_fix_db()

app = FastAPI(title="Bayup Survival API")

# --- CORS ---
origins = ["https://www.bayup.com.co", "https://bayup.com.co", "https://bayup-interactive.vercel.app", "http://localhost:3000"]
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
        try: data = await request.json()
        except: 
            form = await request.form()
            data = {"username": form.get("username"), "password": form.get("password")}
        
        u, p = data.get("username"), data.get("password")
        if not u or not p: raise HTTPException(status_code=400, detail="Faltan datos")
        
        user = crud.get_user_by_email(db, email=u.lower().strip())
        
        # Si el usuario no existe despues de la reparacion, lo creamos
        if not user and u.lower().strip() == "basicobayup@yopmail.com":
            plan = db.query(models.Plan).first()
            if not plan:
                plan = models.Plan(id=uuid.uuid4(), name="Básico", modules=["inicio", "productos", "pedidos", "settings"], is_default=True)
                db.add(plan); db.commit(); db.refresh(plan)
            user = models.User(id=uuid.uuid4(), email=u.lower().strip(), full_name="Admin", hashed_password=security.get_password_hash(p), role="admin_tienda", status="Activo", plan_id=plan.id, shop_slug="tienda")
            db.add(user); db.commit(); db.refresh(user)

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
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
