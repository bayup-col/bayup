from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

# --- CONEXIÓN A DB REAL ---
from database import SessionLocal, engine, get_db
import models
import crud
import security
import schemas

def safe_db_init():
    """Repara el esquema sin tocar los datos existentes."""
    print("🛠️ Verificando base de datos persistente...")
    # Crea las tablas solo si NO existen
    models.Base.metadata.create_all(bind=engine)
    
    # Inyección segura de columnas (ALTER TABLE)
    required_cols = [
        ("logo_url", "VARCHAR"), ("phone", "VARCHAR"), ("shop_slug", "VARCHAR"),
        ("custom_domain", "VARCHAR"), ("onboarding_completed", "BOOLEAN DEFAULT FALSE"),
        ("is_global_staff", "BOOLEAN DEFAULT FALSE"), ("permissions", "JSON")
    ]
    
    with engine.begin() as conn:
        inspector = inspect(engine)
        existing = [c['name'] for c in inspector.get_columns('users')]
        for c_n, c_t in required_cols:
            if c_n not in existing:
                try:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {c_n} {c_t};"))
                    print(f"✅ Columna recuperada: {c_n}")
                except: pass

    # Asegurar Plan Básico y Usuario Sebastián
    db = SessionLocal()
    try:
        # 1. Asegurar Plan
        plan = db.query(models.Plan).filter(models.Plan.name == "Básico").first()
        if not plan:
            plan = models.Plan(
                id=uuid.uuid4(), name="Básico", 
                modules=["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"],
                is_default=True
            )
            db.add(plan); db.commit(); db.refresh(plan)

        # 2. Asegurar Usuario (Si no existe, se crea; si existe, NO SE TOCA)
        email = "basicobayup@yopmail.com"
        if not db.query(models.User).filter(models.User.email == email).first():
            user = models.User(
                id=uuid.uuid4(), email=email, full_name="Sebastián Bayup",
                hashed_password=security.get_password_hash("123456"),
                role="admin_tienda", status="Activo", plan_id=plan.id, shop_slug="mi-tienda"
            )
            db.add(user); db.commit()
            print("✨ Usuario maestro creado.")
    finally:
        db.close()

from contextlib import asynccontextmanager
@asynccontextmanager
async def lifespan(app: FastAPI):
    safe_db_init()
    yield

app = FastAPI(title="Bayup OS - Persistent", lifespan=lifespan)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://www.bayup.com.co", "https://bayup.com.co", "https://bayup-interactive.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ENDPOINTS CONECTADOS A DB REAL ---

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

from fastapi import Depends, FastAPI, HTTPException, status, Request, File, UploadFile
import shutil

# ... (mantener imports existentes)

@app.put("/admin/update-profile")
def update_profile(
    profile_data: schemas.UserUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    """Actualiza la información corporativa de la tienda."""
    try:
        update_dict = profile_data.dict(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(current_user, key, value)
        
        db.commit()
        db.refresh(current_user)
        return {"status": "success", "message": "Perfil actualizado correctamente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar perfil: {str(e)}")

@app.post("/admin/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: models.User = Depends(security.get_current_user)
):
    """Sube una imagen (logo/producto) al servidor."""
    try:
        # Crear carpeta de uploads si no existe
        upload_dir = "uploads"
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
            
        file_extension = file.filename.split(".")[-1]
        file_name = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(upload_dir, file_name)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # En producción real esto sería una URL de S3 o Cloudfront
        # Por ahora devolvemos una URL relativa o absoluta según el host
        base_url = os.getenv("API_URL", "http://localhost:8000")
        return {"url": f"{base_url}/uploads/{file_name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir imagen: {str(e)}")

from fastapi.staticfiles import StaticFiles
# Montar carpeta de uploads para servir imágenes estáticas
if not os.path.exists("uploads"): os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/auth/me", response_model=schemas.User)
def me(current_user: models.User = Depends(security.get_current_user)):
    return current_user

@app.get("/products")
def read_products(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Product).filter(models.Product.owner_id == tenant_id).all()

@app.get("/orders")
def get_orders(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Order).filter(models.Order.tenant_id == tenant_id).all()

@app.get("/health")
def health(): return {"status": "connected_and_persistent"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
