from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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

app = FastAPI(title="Bayup Survival API")

# --- CORS BLINDADO ---
origins = ["https://www.bayup.com.co", "https://bayup.com.co", "https://bayup-interactive.vercel.app", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex="https://.*\\.bayup\\.com\\.co|https://.*\\.vercel\\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health(): return {"status": "ok", "mode": "survival"}

# --- RUTA DE REPARACION MANUAL (Si algo falla, entras aqui) ---
@app.get("/reparar-db-secreta")
def repair():
    try:
        models.Base.metadata.create_all(bind=engine)
        with engine.begin() as conn:
            for col in [("custom_commission_rate", "FLOAT"), ("commission_fixed_until", "DATETIME"), ("last_month_revenue", "FLOAT")]:
                try: conn.execute(text(f"ALTER TABLE users ADD COLUMN {col[0]} {col[1]};"))
                except: pass
        
        db = SessionLocal()
        plan = db.query(models.Plan).first()
        if not plan:
            plan = models.Plan(id=uuid.uuid4(), name="Básico", modules=["inicio", "productos", "pedidos", "settings"], is_default=True)
            db.add(plan); db.commit(); db.refresh(plan)
        
        email = "basicobayup@yopmail.com"
        if not db.query(models.User).filter(models.User.email == email).first():
            u = models.User(id=uuid.uuid4(), email=email, full_name="Admin", hashed_password=security.get_password_hash("123456"), role="admin_tienda", status="Activo", plan_id=plan.id, shop_slug="tienda")
            db.add(u); db.commit()
        db.close()
        return {"status": "Base de datos reparada con exito"}
    except Exception as e:
        return {"status": "Error", "detail": str(e)}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
