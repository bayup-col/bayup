from fastapi import Depends, FastAPI, HTTPException, status, Request, BackgroundTasks, File, UploadFile
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
from dotenv import load_dotenv
import os
import requests

# Cargar variables de entorno inmediatamente
load_dotenv()

from database import SessionLocal, engine, get_db
import crud
import models
import schemas
import security
import s3_service
import payment_service
import clerk_auth_service
import ai_service
import email_service

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

# 1. CORS - CONFIGURACIÓN UNIVERSAL (A PRUEBA DE BALAS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permitir TODO
    allow_credentials=False, # Obligatorio cuando se usa "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Inyector de cabeceras manual (Segunda capa de seguridad)
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# 3. Manejador de Errores Global (Blindado)
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

# --- Auth ---

@app.post("/auth/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email.lower().strip())
    if db_user: raise HTTPException(status_code=400, detail="Email already registered")
    
    # FORZADO DE INDEPENDENCIA: Un registro público SIEMPRE crea un nuevo dueño de tienda independiente
    hashed_password = security.get_password_hash(user.password)
    default_plan = crud.get_default_plan(db)
    
    new_user = models.User(
        id=uuid.uuid4(),
        email=user.email.lower().strip(),
        full_name=user.full_name.strip() if user.full_name else user.email.split('@')[0],
        hashed_password=hashed_password,
        role="admin_tienda", # Rol base de cliente
        status="Activo",
        is_global_staff=False, # PROHIBIDO ser global para clientes
        plan_id=default_plan.id if default_plan else None,
        permissions={} # Tienda vacía sin permisos heredados
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Enviar correo de bienvenida en segundo plano
    background_tasks.add_task(email_service.send_welcome_email, new_user.email, new_user.full_name)
        
    return new_user

@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"access_token": security.create_access_token(data={"sub": user.email}), "token_type": "bearer"}

@app.post("/auth/forgot-password")
def forgot_password(data: dict, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    user = crud.get_user_by_email(db, email=email)
    if not user:
        return {"status": "success", "message": "Si el correo existe, recibirá instrucciones en breve."}
    
    # Generar nueva clave temporal
    temp_pass = security.generate_random_password()
    user.hashed_password = security.get_password_hash(temp_pass)
    db.commit()
    
    # Enviar correo en segundo plano
    background_tasks.add_task(email_service.send_password_reset, user.email, temp_pass)
        
    return {"status": "success", "message": "Nueva clave enviada al correo."}

@app.post("/auth/register-affiliate")
def register_affiliate(data: dict, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    email = data.get("email")
    full_name = data.get("full_name")
    phone = data.get("phone")
    
    if not email or not full_name:
        raise HTTPException(status_code=400, detail="Email and name are required")
    
    existing = crud.get_user_by_email(db, email=email)
    if existing:
        raise HTTPException(status_code=400, detail="Este correo ya está registrado")
    
    # Generar clave aleatoria
    temp_pass = security.generate_random_password()
    hashed_pass = security.get_password_hash(temp_pass)
    
    # Crear el usuario afiliado
    new_user = models.User(
        id=uuid.uuid4(),
        email=email.lower().strip(),
        full_name=full_name.strip(),
        hashed_password=hashed_pass,
        role='afiliado',
        status='Invitado'
    )
    
    db.add(new_user)
    db.commit()
    
    # Enviar correo en segundo plano
    background_tasks.add_task(email_service.send_affiliate_welcome, new_user.email, new_user.full_name, temp_pass)
        
    return {"status": "success", "message": "Registro completado"}

@app.get("/auth/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(security.get_current_user)):
    return current_user

@app.put("/admin/update-profile")
def update_user_profile(data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    # 1. Verificar si el slug ya existe (si se está cambiando)
    new_slug = data.get("shop_slug")
    if new_slug:
        existing = db.query(models.User).filter(models.User.shop_slug == new_slug, models.User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Este nombre de tienda ya está en uso")
        current_user.shop_slug = new_slug

    # 2. Actualizar otros datos
    current_user.full_name = data.get("full_name", current_user.full_name)
    
    db.commit()
    return {"status": "success", "shop_slug": current_user.shop_slug}

# --- Image Management (Supabase Storage) ---

@app.post("/admin/upload-image")
async def upload_image(file: UploadFile = File(...), current_user: models.User = Depends(security.get_current_user)):
    print(f"--- SOLICITUD DE SUBIDA RECIBIDA ---")
    print(f"Archivo: {file.filename}")
    print(f"Tipo (Content-Type): {file.content_type}")

    # Aceptar tanto imágenes como videos
    is_image = file.content_type.startswith("image/")
    is_video = file.content_type.startswith("video/")

    if not is_image and not is_video:
        print(f"RECHAZADO: El tipo {file.content_type} no es soportado.")
        raise HTTPException(status_code=400, detail=f"El archivo {file.filename} no es un formato válido (Solo imágenes y videos)")

    project_id = "jtctgahddafohgskgxha"
    bucket_name = "products"
    
    # 1. Limpiar nombre de archivo (solo letras, numeros y extension)
    import re
    ext = file.filename.split(".")[-1]
    safe_name = f"{uuid.uuid4()}.{ext}"
    
    url = f"https://{project_id}.supabase.co/storage/v1/object/{bucket_name}/{safe_name}"
    
    # 2. Usar la llave desde env o fallback directo
    token = os.getenv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0Y3RnYWhkZGFmb2hnc2tneGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjU1MTgsImV4cCI6MjA4NTY0MTUxOH0.PZEdIjfr68o3GciOoI7U9huEpjDSktBPLUdkFXP5vDg')
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": file.content_type,
        "x-upsert": "true" # Permite sobreescribir si fuera necesario
    }

    try:
        content = await file.read()
        print(f"DEBUG: Intentando subir {safe_name} a Supabase...")
        # Aumentamos el timeout a 60 segundos para videos
        response = requests.post(url, data=content, headers=headers, timeout=60)
        
        if response.status_code == 200:
            public_url = f"https://{project_id}.supabase.co/storage/v1/object/public/{bucket_name}/{safe_name}"
            print(f"DEBUG: Subida exitosa! URL: {public_url}")
            return {"url": public_url}
        else:
            print(f"ERROR SUPABASE ({response.status_code}): {response.text}")
            raise HTTPException(status_code=response.status_code, detail=f"Error en Supabase: {response.text}")
            
    except Exception as e:
        print(f"ERROR EXCEPTION: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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
                    "owner_id": str(u.owner_id) if u.owner_id else None,
                    "permissions": u.permissions or {} # Incluimos los permisos reales
                })
            except:
                continue
        
        return staff_list
    except Exception as e:
        print(f"ERROR CRITICO EN /admin/users: {e}")
        return JSONResponse(status_code=500, content={"detail": "Error en el servidor de staff", "error": str(e)})

@app.post("/admin/users", response_model=schemas.User)
def create_staff_user(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    print(f"--- INICIANDO CREACIÓN DE STAFF: {user.email} ---")
    
    # 1. Verificar duplicados
    db_user = db.query(models.User).filter(models.User.email == user.email.lower().strip()).first()
    if db_user:
        print("ERROR: Email ya registrado.")
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    try:
        # 2. Preparar datos
        hashed_password = security.get_password_hash(user.password)
        tenant_id = get_tenant_id(current_user)
        
        # Asegurar que los permisos sean un diccionario válido
        perms = user.permissions if user.permissions else {}
        
        print(f"DEBUG: Registrando con permisos: {perms}")

        # 3. Crear el modelo
        new_user = models.User(
            id=uuid.uuid4(),
            email=user.email.lower().strip(),
            full_name=user.full_name.strip(),
            hashed_password=hashed_password,
            role=user.role,
            status=user.status or 'Invitado',
            owner_id=tenant_id,
            permissions=perms,
            is_global_staff=True # MARCA DE FAMILIA BAYUP
        )
        
        # 4. Guardar en DB
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print("ÉXITO: Usuario guardado en base de datos.")

        # 5. Enviar Correo en segundo plano (No bloquea la respuesta al cliente)
        inviter = current_user.full_name or "Dani"
        background_tasks.add_task(
            email_service.send_staff_invitation,
            user.email,
            user.full_name,
            user.password,
            inviter,
            perms
        )

        # 6. Log de actividad
        log_activity(db, current_user.id, tenant_id, "CREATE_USER", f"Invitó a {new_user.full_name}", str(new_user.id))
        
        return new_user

    except Exception as e:
        db.rollback()
        print(f"ERROR CRÍTICO EN BACKEND: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

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
    
    # PROTECCIÓN BAYUP: El Super Administrador principal (Dani) es intocable.
    if db_user.email == 'bayupcol@gmail.com':
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

@app.post("/collections", response_model=schemas.Collection)
def create_collection(collection: schemas.CollectionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    return crud.create_collection(db, collection, owner_id=tenant_id)

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

# --- Super Admin Stats ---

@app.get("/super-admin/stats", response_model=schemas.SuperAdminStats)
def get_super_admin_stats(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_super_admin_user)):
    # 1. Contar empresas reales
    active_companies = db.query(models.User).filter(models.User.role == 'admin_tienda').count()
    
    # 2. Contar afiliados reales
    active_affiliates = db.query(models.User).filter(models.User.role == 'afiliado').count()
    
    # 3. Ingresos totales reales (Suma de todos los pedidos pagados)
    total_revenue = db.query(func.sum(models.Order.total_price)).scalar() or 0.0
    
    # 4. Comisión proyectada (Bayup se queda con el 3% de la operación total)
    total_commission = total_revenue * 0.03
    
    # 5. Top Empresas (Las 5 que más venden)
    # Por ahora devolvemos las 5 más recientes, luego podemos filtrar por ventas
    top_companies_db = db.query(models.User).filter(models.User.role == 'admin_tienda').order_by(models.User.created_at.desc()).limit(5).all()
    top_companies = [{"name": c.full_name, "revenue": 0.0} for c in top_companies_db]

    # 6. Alertas recientes (Usuarios nuevos o errores)
    recent_logs = db.query(models.ActivityLog).order_by(models.ActivityLog.created_at.desc()).limit(5).all()
    recent_alerts = [{"title": l.action, "time": l.created_at.strftime("%H:%M")} for l in recent_logs]
    
    return {
        "total_revenue": total_revenue,
        "total_commission": total_commission,
        "active_companies": active_companies,
        "active_affiliates": active_affiliates,
        "top_companies": top_companies,
        "recent_alerts": recent_alerts
    }

@app.get("/analytics/opportunities")
def get_analytics_opportunities(current_user: models.User = Depends(security.get_current_user)):
    return [
        {"term": "Tenis Deportivos", "volume": 1250, "potential": 450000, "action": "Importar Stock"},
        {"term": "Relojes Inteligentes", "volume": 850, "potential": 320000, "action": "Ver Tendencia"},
        {"term": "Accesorios Tech", "volume": 2100, "potential": 850000, "action": "Lanzar Oferta"},
        {"term": "Moda Urbana", "volume": 1500, "potential": 600000, "action": "Crear Colección"}
    ]

@app.get("/")
def read_root(): return {"message": "Welcome to Bayup API"}

# --- Public Shop Endpoints ---

@app.get("/public/shop/{slug}")
def get_public_shop(slug: str, db: Session = Depends(get_db)):
    # 1. Buscar al dueño de la tienda por su slug
    store_owner = db.query(models.User).filter(models.User.shop_slug == slug).first()
    if not store_owner:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
    
    # 2. Obtener sus productos activos
    products = db.query(models.Product).filter(
        models.Product.owner_id == store_owner.id,
        models.Product.status == "active"
    ).all()

    # 3. Obtener sus categorías (colecciones)
    collections = db.query(models.Collection).filter(models.Collection.owner_id == store_owner.id).all()
    
    return {
        "store_name": store_owner.full_name,
        "store_email": store_owner.email,
        "logo_url": None,
        "products": products,
        "categories": collections
    }