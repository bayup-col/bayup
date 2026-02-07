from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, text, inspect
import datetime
from datetime import timedelta
from typing import List, Optional
import uuid
from contextlib import asynccontextmanager

from database import SessionLocal, engine, get_db
import crud
import models
import schemas
import security
import s3_service
import payment_service
import clerk_auth_service
import ai_service

# --- Tenant Isolation Helper ---
def get_tenant_id(current_user: models.User):
    # Si el usuario tiene un owner_id, significa que es Staff y su "tienda" es la del dueño.
    # Si no tiene owner_id, él es el dueño de la tienda.
    return current_user.owner_id if current_user.owner_id else current_user.id

# --- Admin / Staff Logs Helper ---
def log_activity(db: Session, user_id: uuid.UUID, tenant_id: uuid.UUID, action: str, detail: str, target_id: str = None):
    try:
        log = models.ActivityLog(
            id=uuid.uuid4(),
            user_id=user_id,
            tenant_id=tenant_id,
            action=action,
            detail=detail,
            target_id=target_id
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Error logging activity: {e}")
        db.rollback()

# Lifespan manager for startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting Bayup API...")
    # Startup: Initialize tables and default plan
    try:
        models.Base.metadata.create_all(bind=engine)
        print("Database tables synchronized.")
    except Exception as e:
        print(f"Metadata creation error: {e}")

    db = SessionLocal()
    try:
        # Automigrate: Check for missing columns in 'users' table
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if 'users' in tables:
            columns = [c['name'] for c in inspector.get_columns('users')]
            with engine.begin() as conn:
                if 'owner_id' not in columns:
                    try: 
                        print("Migrating: Adding owner_id to users table...")
                        # Usamos un tipo genérico que funcione en SQLite y Postgres
                        conn.execute(text("ALTER TABLE users ADD COLUMN owner_id VARCHAR(36)"))
                        print("owner_id added successfully.")
                    except Exception as e: 
                        print(f"Migration Error (owner_id): {e}")
                
                if 'loyalty_points' not in columns:
                    try: conn.execute(text("ALTER TABLE users ADD COLUMN loyalty_points INTEGER DEFAULT 0"))
                    except: pass
                if 'total_spent' not in columns:
                    try: conn.execute(text("ALTER TABLE users ADD COLUMN total_spent FLOAT DEFAULT 0.0"))
                    except: pass
            print("User table migration check completed.")

        if not crud.get_default_plan(db):
            crud.create_plan(db=db, plan=schemas.PlanCreate(name="Free", description="Default", commission_rate=0.1, monthly_fee=0, is_default=True))
            db.commit()

    except Exception as e:
        print(f"General Startup Error: {e}")
    finally:
        db.close()
    yield

app = FastAPI(title="Bayup API", lifespan=lifespan)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"CRITICAL ERROR: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "message": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Auth ---

@app.post("/auth/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user: raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"access_token": security.create_access_token(data={"sub": user.email}), "token_type": "bearer"}

@app.get("/auth/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(security.get_current_user)):
    return current_user

# --- Products ---

@app.get("/products", response_model=List[schemas.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    return crud.get_products_by_owner(db, owner_id=tenant_id, skip=skip, limit=limit)

@app.get("/products/{product_id}", response_model=schemas.Product)
def read_product(product_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    p = crud.get_product(db, product_id=product_id, tenant_id=tenant_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p

@app.post("/products", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    return crud.create_product(db=db, product=product, owner_id=tenant_id)

# --- Orders ---

@app.post("/orders", response_model=schemas.Order)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    return crud.create_order(db=db, order=order, customer_id=current_user.id, tenant_id=tenant_id)

@app.get("/orders", response_model=List[schemas.Order])
def read_orders(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    return db.query(models.Order).filter(models.Order.tenant_id == tenant_id).all()

# --- Admin / Staff ---

@app.get("/admin/users")
def get_all_users(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    try:
        # 1. Identificar al dueño de la cuenta (Tenant) de forma segura
        tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
        t_id_str = str(tenant_id)
        
        print(f"DEBUG: Consultando staff para tenant_id: {t_id_str}")
        
        # 2. Si es super admin, ve todo
        if current_user.role == 'super_admin':
            users = db.query(models.User).filter(models.User.role != 'cliente').all()
        else:
            # 3. Intentar consulta filtrada. Si falla la columna owner_id, capturamos el error.
            try:
                users = db.query(models.User).filter(
                    models.User.role != 'cliente',
                    ((models.User.owner_id == t_id_str) | (models.User.id == t_id_str))
                ).all()
            except Exception as e:
                print(f"ALERTA: Fallo en consulta filtrada (posible columna faltante): {e}")
                # Fallback: Al menos devolver el usuario actual
                users = [current_user]
        
        # 4. Mapeo manual ultra-seguro
        staff_list = []
        for u in users:
            try:
                staff_list.append({
                    "id": str(u.id),
                    "full_name": str(u.full_name) if u.full_name else "Usuario",
                    "email": str(u.email),
                    "role": str(u.role),
                    "status": str(u.status) if u.status else "Activo",
                    "owner_id": str(u.owner_id) if u.owner_id else None
                })
            except:
                continue
        
        return staff_list
    except Exception as e:
        print(f"ERROR CRITICO EN /admin/users: {e}")
        return JSONResponse(status_code=500, content={"detail": "Error en el servidor de staff", "error": str(e)})

@app.post("/admin/users", response_model=schemas.User)
def create_staff_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    hashed_password = security.get_password_hash(user.password)
    tenant_id = get_tenant_id(current_user)
    
    new_user = models.User(
        id=uuid.uuid4(),
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role,
        status=user.status,
        owner_id=tenant_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    log_activity(db, current_user.id, tenant_id, "CREATE_USER", f"Invitó a {new_user.full_name}", str(new_user.id))
    return new_user

@app.post("/admin/update-user")
def update_staff_details(data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    user = db.query(models.User).filter(models.User.email == data.get("email"), models.User.owner_id == tenant_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user.full_name = data.get("full_name", user.full_name)
    user.role = data.get("new_role", user.role)
    user.status = data.get("status", user.status)
    db.commit()
    
    log_activity(db, current_user.id, tenant_id, "UPDATE_USER", f"Actualizó a {user.full_name}", str(user.id))
    return {"status": "success"}

@app.delete("/admin/users/{user_id}")
def delete_user(user_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # PROTECCIÓN BAYUP: No se puede eliminar al Super Admin principal
    if db_user.role == 'super_admin':
        raise HTTPException(status_code=403, detail="Acceso denegado: El Super Administrador principal es intocable.")
    
    name = db_user.full_name
    db.delete(db_user)
    db.commit()
    
    log_activity(db, current_user.id, tenant_id, "DELETE_USER", f"Eliminó a {name}", str(user_id))
    return {"status": "success"}

@app.get("/admin/logs")
def get_admin_logs(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    try:
        tenant_id = get_tenant_id(current_user)
        logs = db.query(models.ActivityLog).filter(models.ActivityLog.tenant_id == tenant_id).order_by(models.ActivityLog.created_at.desc()).limit(50).all()
        
        result = []
        for log in logs:
            actor = db.query(models.User).filter(models.User.id == log.user_id).first()
            result.append({
                "id": str(log.id),
                "action": log.action,
                "detail": log.detail,
                "created_at": log.created_at.isoformat(),
                "user_name": actor.full_name if actor else "Sistema",
                "target_id": log.target_id
            })
        return result
    except Exception as e:
        print(f"Error in get_admin_logs: {e}")
        return []

@app.get("/admin/roles", response_model=List[schemas.CustomRole])
def get_roles(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    return db.query(models.CustomRole).filter(models.CustomRole.owner_id == tenant_id).all()

@app.post("/admin/roles", response_model=schemas.CustomRole)
def create_role(role: schemas.CustomRoleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    return crud.create_custom_role(db=db, role_in=role, owner_id=tenant_id)

@app.put("/admin/roles/{role_id}", response_model=schemas.CustomRole)
def update_role(role_id: uuid.UUID, role: schemas.CustomRoleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    db_role = crud.update_custom_role(db=db, role_id=role_id, role_in=role, owner_id=tenant_id)
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    return db_role

@app.delete("/admin/roles/{role_id}")
def delete_role(role_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    success = crud.delete_custom_role(db=db, role_id=role_id, owner_id=tenant_id)
    if not success:
        raise HTTPException(status_code=404, detail="Role not found")
    return {"status": "success"}

# --- Others ---

@app.get("/collections", response_model=List[schemas.Collection])
def get_collections(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    return crud.get_collections_by_owner(db, owner_id=tenant_id)

@app.get("/expenses", response_model=List[schemas.Expense])
def get_expenses(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    return db.query(models.Expense).filter(models.Expense.tenant_id == tenant_id).all()

@app.get("/receivables", response_model=List[schemas.Receivable])
def get_receivables(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    return db.query(models.Receivable).filter(models.Receivable.tenant_id == tenant_id).all()

@app.get("/ai-assistants", response_model=List[schemas.AIAssistant])
def get_assistants(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    return db.query(models.AIAssistant).filter(models.AIAssistant.owner_id == tenant_id).all()

@app.get("/pages", response_model=List[schemas.Page])
def get_pages(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    return db.query(models.Page).filter(models.Page.owner_id == tenant_id).all()

@app.get("/")
def read_root(): return {"message": "Welcome to Bayup API"}