from fastapi import Depends, FastAPI, HTTPException, status, Request, BackgroundTasks, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
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
                # Mapeo de columnas necesarias
                required_columns = [
                    ('owner_id', "VARCHAR(36)"),
                    ('loyalty_points', "INTEGER DEFAULT 0"),
                    ('total_spent', "FLOAT DEFAULT 0.0"),
                    ('city', "VARCHAR"),
                    ('customer_type', "VARCHAR DEFAULT 'final'"),
                ]
                for col_name, col_type in required_columns:
                    if col_name not in columns:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                        print(f"Migrated: Column '{col_name}' added to 'users'.")

        # --- AUTO-INITIALIZATION FOR PRODUCTION (Railway Fix) ---
        # 1. Asegurar Plan por Defecto
        default_plan = db.query(models.Plan).filter(models.Plan.is_default == True).first()
        if not default_plan:
            print("AUTO-INIT: Creating default 'Básico' plan...")
            new_plan = models.Plan(
                id=uuid.uuid4(),
                name="Básico",
                description="Gestión esencial para emprendedores.",
                commission_rate=0.0,
                monthly_fee=0.0,
                modules=["inventory", "orders", "customers", "invoicing"],
                is_default=True
            )
            db.add(new_plan)
            db.commit()
            db.refresh(new_plan)
            default_plan = new_plan

        # 2. Asegurar Usuario de Emergencia (Evita 401 en Railway)
        sebas_email = "sebas@sebas.com"
        existing_sebas = db.query(models.User).filter(models.User.email == sebas_email).first()
        if not existing_sebas:
            print(f"AUTO-INIT: Creating emergency user '{sebas_email}'...")
            hashed_pw = security.get_password_hash("123")
            new_user = models.User(
                id=uuid.uuid4(),
                email=sebas_email,
                full_name="Sebastián Bayup",
                hashed_password=hashed_pw,
                role="admin_tienda",
                status="Activo",
                is_global_staff=False,
                plan_id=default_plan.id,
                shop_slug="sebas-store",
                permissions={}
            )
            db.add(new_user)
            db.commit()
            print(f"AUTO-INIT: User '{sebas_email}' created successfully.")

    except Exception as e:
        print(f"Startup Logic Error: {e}")
        db.rollback()
    finally:
        db.close()
    
    yield
    print("Shutting down Bayup API...")
                    ('acquisition_channel', "VARCHAR"),
                    ('is_global_staff', "BOOLEAN DEFAULT FALSE"),
                    ('shop_slug', "VARCHAR")
                ]

                for col_name, col_type in required_columns:
                    if col_name not in columns:
                        try:
                            print(f"Migrating: Adding {col_name} to users table...")
                            conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                            print(f"[OK] {col_name} added.")
                        except Exception as e:
                            print(f"Migration Error ({col_name}): {e}")
            
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

# Servir archivos estáticos (imágenes de productos)
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- CONFIGURACIÓN DE CONEXIÓN GLOBAL (CORS) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://bayup.com.co",
        "https://www.bayup.com.co",
        "https://bayup.com",
        "https://www.bayup.com",
        "https://gallant-education-production-8b4a.up.railway.app",
        "https://bayup-interactive-production.up.railway.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Manejador de Errores Global
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"CRITICAL ERROR: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "message": str(exc)},
    )

# --- Health Check (Diagnóstico de Conexión) ---
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Intentar una consulta simple para verificar la DB
        db.execute(text("SELECT 1"))
        db_engine = engine.name # 'postgresql' o 'sqlite'
        return {
            "status": "ok",
            "message": "Backend is running",
            "database": "Connected",
            "engine": db_engine,
            "environment": os.getenv("RAILWAY_ENVIRONMENT", "production")
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "database": "Disconnected"
        }

# --- Auth ---

@app.post("/auth/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email.lower().strip())
    if db_user: raise HTTPException(status_code=400, detail="Email already registered")
    
    # FORZADO DE INDEPENDENCIA: Un registro público SIEMPRE crea un nuevo dueño de tienda independiente
    hashed_password = security.get_password_hash(user.password)
    default_plan = crud.get_default_plan(db)
    
    # Generar shop_slug automático
    base_slug = user.email.split('@')[0].replace('.', '-').lower()
    shop_slug = base_slug
    counter = 1
    while crud.get_user_by_slug(db, shop_slug):
        shop_slug = f"{base_slug}-{counter}"
        counter += 1

    new_user = models.User(
        id=uuid.uuid4(),
        email=user.email.lower().strip(),
        full_name=user.full_name.strip() if user.full_name else user.email.split('@')[0],
        hashed_password=hashed_password,
        role="admin_tienda", # Rol base de cliente
        status="Activo",
        is_global_staff=False, # PROHIBIDO ser global para clientes
        plan_id=default_plan.id if default_plan else None,
        permissions={}, # Tienda vacía sin permisos heredados
        shop_slug=shop_slug # Slug automático
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Enviar correo de bienvenida en segundo plano
    background_tasks.add_task(email_service.send_welcome_email, new_user.email, new_user.full_name)
        
    return new_user

@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        # Normalizar email
        normalized_email = form_data.username.lower().strip()
        
        # --- PUENTE MAESTRO DE EMERGENCIA (Bypass de DB) ---
        # Si la base de datos falla o el usuario no existe, esto permite entrada directa
        if normalized_email == "sebas@sebas.com" and form_data.password == "123":
            print("EMERGENCY: Super-Admin bridge activated for sebas@sebas.com")
            # Generamos el token directamente para saltar errores de conexión a DB
            access_token = security.create_access_token(data={"sub": "sebas@sebas.com"})
            return {
                "access_token": access_token, 
                "token_type": "bearer",
                "user": {
                    "email": "sebas@sebas.com",
                    "full_name": "Sebastián Bayup (Admin)",
                    "role": "admin_tienda",
                    "is_global_staff": False,
                    "permissions": {}
                }
            }

        user = crud.get_user_by_email(db, email=normalized_email)
        
        if not user:
            raise HTTPException(status_code=401, detail="Incorrect email or password")
            
        if not security.verify_password(form_data.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        
        access_token = security.create_access_token(data={"sub": user.email})
        
        # Devolvemos todo el perfil con proteccion TOTAL contra nulos
        user_plan = user.plan
        
        # Sanitización de permisos
        user_perms = user.permissions if user.permissions is not None else {}
        
        # Sanitización de módulos del plan
        allowed_modules = []
        if user_plan and hasattr(user_plan, 'modules') and user_plan.modules:
            allowed_modules = user_plan.modules
        else:
            allowed_modules = ['inicio', 'productos', 'pedidos', 'settings', 'studio'] # 'studio' añadido por defecto

        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user": {
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "is_global_staff": bool(user.is_global_staff),
                "permissions": user_perms,
                "plan": {
                    "name": user_plan.name if user_plan else "Free",
                    "modules": allowed_modules
                }
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"CRITICAL LOGIN ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

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

    # 2. Actualizar datos básicos
    current_user.full_name = data.get("full_name", current_user.full_name)
    current_user.phone = data.get("phone", current_user.phone)
    
    # 3. Actualizar estructuras JSON (Configuración avanzada)
    if "bank_accounts" in data:
        current_user.bank_accounts = data.get("bank_accounts")
    if "social_links" in data:
        current_user.social_links = data.get("social_links")
    if "whatsapp_lines" in data:
        current_user.whatsapp_lines = data.get("whatsapp_lines")
    
    db.commit()
    return {"status": "success", "shop_slug": current_user.shop_slug}

# --- CRM / Omnichannel Connections ---

@app.post("/admin/channels/link")
def link_channel(data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    channel_type = data.get("channel_type")
    
    # 1. Verificar si ya existe la conexión
    existing = db.query(models.ChannelConnection).filter(
        models.ChannelConnection.user_id == current_user.id,
        models.ChannelConnection.channel_type == channel_type
    ).first()
    
    if existing:
        existing.status = "linked"
        existing.created_at = datetime.datetime.utcnow()
    else:
        new_conn = models.ChannelConnection(
            id=uuid.uuid4(),
            user_id=current_user.id,
            channel_type=channel_type,
            status="linked"
        )
        db.add(new_conn)
    
    db.commit()
    return {"status": "success", "channel": channel_type}

@app.get("/admin/channels/list")
def get_linked_channels(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    conns = db.query(models.ChannelConnection).filter(models.ChannelConnection.user_id == current_user.id).all()
    return conns

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

@app.delete("/products/{product_id}")
def delete_product(product_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    success = crud.delete_product(db=db, product_id=product_id, owner_id=tenant_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found or access denied")
    return {"status": "success", "message": "Product deleted successfully"}

@app.put("/products/{product_id}", response_model=schemas.Product)
def update_product(product_id: uuid.UUID, product: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    db_product = crud.get_product(db, product_id=product_id, tenant_id=tenant_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return crud.update_product(db=db, db_product=db_product, product=product)

# --- Orders ---

@app.get("/orders", response_model=List[schemas.Order])
def get_orders(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    try:
        # Consulta simplificada para evitar errores de relación profunda (joinedload)
        orders = db.query(models.Order).filter(models.Order.tenant_id == tenant_id).order_by(models.Order.created_at.desc()).all()
        return orders
    except Exception as e:
        print(f"CRITICAL DATABASE ERROR IN GET_ORDERS: {e}")
        raise HTTPException(status_code=500, detail="Error de base de datos al recuperar historial")

@app.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    return db.query(models.Notification).filter(models.Notification.tenant_id == tenant_id).order_by(models.Notification.created_at.desc()).limit(20).all()

@app.post("/orders", response_model=schemas.Order)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    # Crucial: Identificar al Dueño de la tienda (Tenant) real
    tenant_id = get_tenant_id(current_user)
    print(f"DEBUG: Creando orden para tenant_id: {tenant_id}")
    return crud.create_order(db=db, order=order, customer_id=current_user.id, tenant_id=tenant_id)

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
    # ... (lógica existente)
    return {
        "total_revenue": total_revenue,
        "total_commission": total_commission,
        "active_companies": active_companies,
        "active_affiliates": active_affiliates,
        "top_companies": top_companies,
        "recent_alerts": recent_alerts
    }

@app.post("/super-admin/impersonate/{user_id}")
def impersonate_user(user_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_super_admin_user)):
    # 1. Buscar al usuario objetivo
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # 2. Generar token para el usuario objetivo
    access_token = security.create_access_token(data={"sub": target_user.email})
    
    # 3. Registrar la acción en los logs por seguridad
    log_activity(db, current_user.id, current_user.id, "IMPERSONATION", f"Super Admin entró a la cuenta de {target_user.email}", str(target_user.id))
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "email": target_user.email,
            "full_name": target_user.full_name,
            "role": target_user.role,
            "is_global_staff": target_user.is_global_staff,
            "permissions": target_user.permissions,
            "plan": {
                "name": target_user.plan.name if target_user.plan else "Básico",
                "modules": target_user.plan.modules if target_user.plan and target_user.plan.modules else []
            }
        }
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
    products_db = db.query(models.Product).filter(
        models.Product.owner_id == store_owner.id,
        models.Product.status == "active"
    ).all()

    # 3. Obtener sus categorías
    collections_db = db.query(models.Collection).filter(models.Collection.owner_id == store_owner.id).all()
    
    # Convertir a formato JSON simple para evitar error 500
    products = []
    for p in products_db:
        products.append({
            "id": str(p.id),
            "name": p.name,
            "price": p.price,
            "image_url": p.image_url,
            "collection_id": str(p.collection_id) if p.collection_id else None,
            "sku": p.sku
        })

    categories = []
    for c in collections_db:
        categories.append({
            "id": str(c.id),
            "title": c.title
        })

    return {
        "owner_id": str(store_owner.id),
        "store_name": store_owner.full_name,
        "store_email": store_owner.email,
        "store_phone": store_owner.phone,
        "products": products,
        "categories": categories
    }

@app.post("/public/orders")
async def create_public_order(data: dict, db: Session = Depends(get_db)):
    # 1. Validar que vengan items
    items = data.get("items", [])
    if not items:
        raise HTTPException(status_code=400, detail="El carrito está vacío")
    
    tenant_id = uuid.UUID(data.get("tenant_id"))
    
    # 2. Crear el objeto de pedido
    new_order = models.Order(
        id=uuid.uuid4(),
        total_price=sum(i["price"] * i["quantity"] for i in items),
        customer_name=data.get("customer_name"),
        customer_email=data.get("customer_email", ""),
        customer_phone=data.get("customer_phone"),
        shipping_address=data.get("shipping_address"),
        notes=data.get("notes", ""),
        status="pending",
        source="web", # Marcamos que viene de la tienda pública
        tenant_id=tenant_id
    )
    
    db.add(new_order)
    
    # 3. Guardar los items del pedido
    for item in items:
        # En una versión más pro, validaríamos el stock aquí
        db_item = models.OrderItem(
            id=uuid.uuid4(),
            order_id=new_order.id,
            product_variant_id=uuid.UUID(item["product_id"]), # Por simplicidad usamos el id directo
            quantity=item["quantity"],
            price_at_purchase=item["price"]
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(new_order)

    # 4. Crear Notificación para el dueño de la tienda
    try:
        notif = models.Notification(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            title="¡Nueva Venta! 💰",
            message=f"Has recibido un nuevo pedido de {data.get('customer_name')} por {sum(i['price'] * i['quantity'] for i in items):,.0f} COP.",
            type="success"
        )
        db.add(notif)
        db.commit()
    except Exception as e:
        print(f"Error creando notificación: {e}")
    
    return {"id": str(new_order.id), "status": "success"}

# --- SHOP PAGES (STUDIO) ---

@app.post("/shop-pages", response_model=schemas.ShopPage)
def save_shop_page(
    page_data: schemas.ShopPageCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    target_tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    db_page = db.query(models.ShopPage).filter(
        models.ShopPage.tenant_id == target_tenant_id,
        models.ShopPage.page_key == page_data.page_key
    ).first()
    
    if db_page:
        db_page.schema_data = page_data.schema_data
    else:
        db_page = models.ShopPage(
            id=uuid.uuid4(),
            tenant_id=target_tenant_id,
            page_key=page_data.page_key,
            schema_data=page_data.schema_data
        )
        db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page

@app.get("/shop-pages/{page_key}", response_model=schemas.ShopPage)
def get_shop_page(
    page_key: str, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    target_tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    db_page = db.query(models.ShopPage).filter(
        models.ShopPage.tenant_id == target_tenant_id,
        models.ShopPage.page_key == page_key
    ).first()
    if not db_page:
        raise HTTPException(status_code=404, detail="Página no encontrada")
    return db_page

# --- WEB TEMPLATES (SUPER ADMIN) ---

@app.post("/super-admin/web-templates", response_model=schemas.WebTemplate)
def create_web_template(
    template: schemas.WebTemplateCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    if not current_user.is_global_staff:
        raise HTTPException(status_code=403, detail="Acceso restringido a Familia Bayup")
    db_template = models.WebTemplate(id=uuid.uuid4(), **template.model_dump())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@app.get("/super-admin/web-templates", response_model=List[schemas.WebTemplate])
def list_web_templates(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    print(f"DEBUG TEMPLATES: Petición de {current_user.email}, Staff: {current_user.is_global_staff}")
    if not current_user.is_global_staff:
        raise HTTPException(status_code=403, detail="Acceso restringido a Familia Bayup")
    return db.query(models.WebTemplate).all()

@app.delete("/super-admin/web-templates/{template_id}")
def delete_web_template(template_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    if not current_user.is_global_staff:
        raise HTTPException(status_code=403, detail="Acceso restringido a Familia Bayup")
    db_template = db.query(models.WebTemplate).filter(models.WebTemplate.id == template_id).first()
    if not db_template: raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    db.delete(db_template)
    db.commit()
    return {"message": "Plantilla eliminada"}

@app.get("/public/products")
def get_public_products(db: Session = Depends(get_db)):
    # Retorna todos los productos disponibles en la plataforma para previsualización
    return db.query(models.Product).all()

@app.get("/public/shop/products")
def get_public_shop_products(db: Session = Depends(get_db)):
    # Alias para compatibilidad con rutas de tienda
    return db.query(models.Product).all()

if __name__ == "__main__":
    import uvicorn
    # Leemos el puerto de la variable de entorno PORT que asigna Railway, por defecto 8000
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)