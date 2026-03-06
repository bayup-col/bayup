from fastapi import Depends, FastAPI, HTTPException, status, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import uuid
import os
import shutil
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

load_dotenv()

# --- REPARACIÓN DE EMERGENCIA: ASEGURAR DIRECTORIO ---
# Usamos una ruta absoluta para evitar confusiones en contenedores Docker
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

if not os.path.exists(UPLOAD_DIR):
    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        print(f"✅ Directorio creado exitosamente en: {UPLOAD_DIR}")
    except Exception as e:
        print(f"⚠️ No se pudo crear el directorio: {e}")

# --- CONEXIÓN A DB REAL ---
from database import SessionLocal, engine, get_db
import models, crud, security, schemas

def safe_db_init():
    try:
        models.Base.metadata.create_all(bind=engine)
        required_cols = [("logo_url", "TEXT"), ("phone", "TEXT"), ("shop_slug", "TEXT")]
        with engine.connect() as conn:
            for c_n, c_t in required_cols:
                try: conn.execute(text(f"ALTER TABLE users ADD COLUMN {c_n} {c_t};")); conn.commit()
                except: pass
    except Exception as e: print(f"❌ Error DB Init: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    safe_db_init()
    yield

app = FastAPI(title="Bayup Core Production v3", lifespan=lifespan)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTH ---
@app.post("/auth/login")
async def login(request: Request, db: Session = Depends(get_db)):
    try:
        try: body = await request.json()
        except: 
            form = await request.form()
            body = {"username": form.get("username"), "password": form.get("password")}
        
        user = crud.get_user_by_email(db, email=body.get("username", "").lower().strip())
        if not user or not security.verify_password(body.get("password", ""), user.hashed_password):
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
        token = security.create_access_token(data={"sub": user.email})
        p = user.plan
        return {
            "access_token": token, "token_type": "bearer",
            "user": {
                "email": user.email, "full_name": user.full_name, "role": user.role, "shop_slug": user.shop_slug,
                "plan": {"name": p.name if p else "Básico", "modules": p.modules if p else ["inicio", "settings"]}
            }
        }
    except HTTPException as he: raise he
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

# --- MODULOS ---
@app.get("/products")
def read_products(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Product).filter(models.Product.owner_id == tid).all()

@app.get("/orders")
def get_orders(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tid = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Order).filter(models.Order.tenant_id == tid).all()

@app.post("/admin/upload-image")
async def upload_image(file: UploadFile = File(...), current_user: models.User = Depends(security.get_current_user)):
    fname = f"{uuid.uuid4()}.{file.filename.split('.')[-1]}"
    fpath = os.path.join(UPLOAD_DIR, fname)
    with open(fpath, "wb") as buf: shutil.copyfileobj(file.file, buf)
    dom = os.getenv("RAILWAY_PUBLIC_DOMAIN", "localhost:8080")
    return {"url": f"https://{dom}/uploads/{fname}" if "railway" in dom else f"http://{dom}/uploads/{fname}"}

@app.get("/health")
def health(): return {"status": "ok"}

# MONTAJE SEGURO (Try/Except para evitar crash de Railway)
try:
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
except Exception as e:
    print(f"⚠️ Aviso: No se pudo montar /uploads: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
