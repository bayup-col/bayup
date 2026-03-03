from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import uuid
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

load_dotenv()

from database import SessionLocal, engine, get_db
import models
import crud
import security

# --- MANTENIMIENTO DE EMERGENCIA ---
def repair_db():
    db = SessionLocal()
    try:
        models.Base.metadata.create_all(bind=engine)
        # Aseguramos el usuario por si acaso se borró
        plan = db.query(models.Plan).first()
        if not plan:
            plan = models.Plan(id=uuid.uuid4(), name="Básico", modules=["inicio", "productos", "pedidos", "settings"], is_default=True)
            db.add(plan); db.commit(); db.refresh(plan)
        
        email = "basicobayup@yopmail.com"
        if not db.query(models.User).filter(models.User.email == email).first():
            user = models.User(
                id=uuid.uuid4(), email=email, full_name="Admin",
                hashed_password=security.get_password_hash("123456"),
                role="admin_tienda", status="Activo", plan_id=plan.id, shop_slug="tienda"
            )
            db.add(user); db.commit()
    except Exception as e: print(f"DB Error: {e}")
    finally: db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    repair_db()
    yield

app = FastAPI(title="Bayup Rescue Mode", lifespan=lifespan)

# --- CORS TOTAL (SIN RESTRICCIONES PARA RESCATE) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MANEJADOR DE ERRORES GLOBAL (FUERZA CORS EN ERRORES) ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"FALLO CRITICO: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Error Interno", "message": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"}
    )

@app.post("/auth/login")
async def login(request: Request, db: Session = Depends(get_db)):
    try:
        data = await request.json()
        u, p = data.get("username"), data.get("password")
    except:
        form = await request.form()
        u, p = form.get("username"), form.get("password")

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

@app.get("/auth/me")
def me(db: Session = Depends(get_db), token: str = Depends(security.oauth2_scheme)):
    # Version ultra-simple de /me para evitar caidas
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
