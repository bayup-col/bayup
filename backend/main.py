from fastapi import Depends, FastAPI, HTTPException, status, Request, BackgroundTasks, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func, text, inspect
import datetime
from datetime import timedelta
from typing import List, Optional, Dict, Any
import uuid
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os
import requests
from pydantic import BaseModel

# Cargar variables de entorno inmediatamente
load_dotenv()

from database import SessionLocal, engine, get_db

# --- MIGRACIÓN AUTOMÁTICA DE EMERGENCIA ---
# Forzamos la creación de columnas si no existen en producción
try:
    with engine.connect() as conn:
        columns = [
            ("logo_url", "VARCHAR"),
            ("phone", "VARCHAR"),
            ("shop_slug", "VARCHAR"),
            ("custom_domain", "VARCHAR"),
            ("onboarding_completed", "BOOLEAN DEFAULT FALSE")
        ]
        for col_name, col_type in columns:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                print(f"✅ Columna {col_name} verificada/creada.")
            except Exception as e:
                print(f"ℹ️ Nota de migración ({col_name}): {e}")
        
        # Índices necesarios
        try:
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_custom_domain ON users (custom_domain);"))
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_shop_slug ON users (shop_slug);"))
        except: pass
        
        conn.commit()
        print("✅ Base de datos sincronizada con el modelo actual.")
except Exception as e:
    print(f"❌ Error crítico en auto-migración: {e}")

import crud
import models
import schemas
import security
import s3_service
import payment_service
import clerk_auth_service
import ai_service
import email_service

# --- SEEDING AUTOMÁTICO DE DEMO ONEUP ---
def seed_demo_oneup():
    db = SessionLocal()
    try:
        oneup = db.query(models.User).filter(models.User.shop_slug == "oneup").first()
        if not oneup:
            print("🌱 Sembrando Demo OneUp...")
            plan = db.query(models.Plan).first()
            oneup = models.User(
                email="oneup@bayup.com",
                full_name="OneUp Fashion",
                shop_slug="oneup",
                hashed_password="hashed_dummy",
                role="admin_tienda",
                plan_id=plan.id if plan else None,
                status="Activo"
            )
            db.add(oneup)
            db.commit()
            db.refresh(oneup)
            
            # Productos de ejemplo
            demo_products = [
                {"name": "Vestido Eira Silk", "price": 285000, "sku": "VE-001", "image_url": ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800"]},
                {"name": "Blusa Aura White", "price": 145000, "sku": "BA-002", "image_url": ["https://images.unsplash.com/photo-1539109136881-3be061694b9b?q=80&w=800"]},
                {"name": "Pantalón Luna Beige", "price": 195000, "sku": "PL-003", "image_url": ["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=800"]}
            ]
            for p_data in demo_products:
                p = models.Product(**p_data, owner_id=oneup.id)
                db.add(p)
            db.commit()
            print("✅ Demo OneUp sembrada con éxito.")
    except Exception as e:
        print(f"⚠️ Error en seeding demo: {e}")
    finally:
        db.close()

seed_demo_oneup()

# --- Tenant Isolation Helper ---
def get_tenant_id(current_user: models.User):
    """
    Retorna el ID del dueño de la tienda (Tenant). 
    Si el usuario es Staff (tiene owner_id), retornamos el owner_id para que vea los datos de la tienda.
    Si el usuario es el Dueño, retornamos su propio ID.
    """
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting Bayup API...")
    try:
        models.Base.metadata.create_all(bind=engine)
        print("Database tables synchronized.")
    except Exception as e:
        print(f"Metadata creation error: {e}")

    # Sembrar datos demo de forma segura
    seed_demo_oneup()

    db = SessionLocal()
    try:
        # 1. Asegurar Plan por Defecto
        default_plan = db.query(models.Plan).filter(models.Plan.is_default == True).first()
        if not default_plan:
            print("AUTO-INIT: Creating default 'Básico' plan...")
            default_plan = models.Plan(
                id=uuid.uuid4(),
                name="Básico",
                description="Gestión esencial para emprendedores.",
                commission_rate=0.0,
                monthly_fee=0.0,
                modules=["inventory", "orders", "customers", "invoicing"],
                is_default=True
            )
            db.add(default_plan)
            db.commit()
            db.refresh(default_plan)

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

app = FastAPI(title="Bayup API", lifespan=lifespan)

# Servir archivos estáticos (imágenes de productos)
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- CONFIGURACIÓN DE CONEXIÓN GLOBAL (CORS LIBRE) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    
    # Priorizar plan_id del input, si no, usar el por defecto
    if user.plan_id:
        target_plan = db.query(models.Plan).filter(models.Plan.id == user.plan_id).first()
        if not target_plan:
            target_plan = crud.get_default_plan(db)
    else:
        target_plan = crud.get_default_plan(db)
    
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
        plan_id=target_plan.id if target_plan else None,
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
                "shop_slug": user.shop_slug,
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

@app.post("/auth/clerk-login")
async def clerk_login(request: schemas.ClerkLoginRequest, db: Session = Depends(get_db)):
    """
    Endpoint para que el frontend envíe el token de Clerk.
    Si el usuario no existe, se crea con el plan por defecto.
    """
    try:
        # Verificar el token con Clerk
        clerk_data = await clerk_auth_service.verify_clerk_token(request.clerk_token)
        email = clerk_data.get("email").lower().strip()
        full_name = clerk_data.get("full_name") or email.split('@')[0]
        
        # Buscar usuario en nuestra DB
        user = crud.get_user_by_email(db, email=email)
        
        if not user:
            # Autocreación de usuario si es la primera vez que entra con Clerk
            default_plan = crud.get_default_plan(db)
            
            # Generar shop_slug automático
            base_slug = email.split('@')[0].replace('.', '-').lower()
            shop_slug = base_slug
            counter = 1
            while crud.get_user_by_slug(db, shop_slug):
                shop_slug = f"{base_slug}-{counter}"
                counter += 1

            user = models.User(
                id=uuid.uuid4(),
                email=email,
                full_name=full_name,
                hashed_password="CLERK_AUTH_EXTERNAL", # No se usa para Clerk
                role="admin_tienda",
                status="Activo",
                plan_id=default_plan.id if default_plan else None,
                shop_slug=shop_slug,
                permissions={}
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Generar un token local de sesión de Bayup basado en la identidad de Clerk
        access_token = security.create_access_token(data={"sub": user.email})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "shop_slug": user.shop_slug,
                "plan": {
                    "name": user.plan.name if user.plan else "Básico"
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Clerk authentication failed: {str(e)}")

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
    current_user.logo_url = data.get("logo_url", current_user.logo_url)
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

@app.put("/admin/change-password")
def change_password(data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    print(f"DEBUG: Intento de cambio de contraseña para {current_user.email}")
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    confirm_password = data.get("confirm_password")

    if not all([current_password, new_password, confirm_password]):
        raise HTTPException(status_code=400, detail="Todos los campos son obligatorios")

    if not security.verify_password(current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

    if new_password != confirm_password:
        raise HTTPException(status_code=400, detail="Las nuevas contraseñas no coinciden")

    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 6 caracteres")

    current_user.hashed_password = security.get_password_hash(new_password)
    db.commit()
    print(f"DEBUG: Contraseña actualizada con éxito para {current_user.email}")

    return {"status": "success", "message": "Contraseña actualizada correctamente"}

@app.get("/super-admin/stats")
def get_super_admin_stats(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    if not current_user.is_global_staff and current_user.role != 'super_admin':
        raise HTTPException(status_code=403, detail="Acceso restringido a Torre de Control")

    # 1. KPIs Financieros Reales
    all_orders = db.query(models.Order).all()
    total_revenue = sum(o.total_price for o in all_orders)
    
    # Comisión escalonada: Básico 3.5%, Pro 2.5% (Simulado basado en lógica de negocio)
    total_commission = 0
    for o in all_orders:
        owner = db.query(models.User).filter(models.User.id == o.tenant_id).first()
        rate = 0.035 if not owner or (owner.plan and owner.plan.name == "Básico") else 0.025
        total_commission += (o.total_price * rate)

    # 2. Control de Suscripciones
    all_users = db.query(models.User).filter(models.User.role == 'admin_tienda').all()
    expiring_soon = []
    for user in all_users:
        # Simulación de vencimiento (30 días después del registro)
        vencimiento = user.created_at + timedelta(days=30)
        dias_restantes = (vencimiento - datetime.utcnow()).days
        if dias_restantes <= 5:
            expiring_soon.append({
                "name": user.full_name,
                "email": user.email,
                "days_left": max(0, dias_restantes),
                "plan": user.plan.name if user.plan else "Básico"
            })

    # 3. Datos Geográficos (Ciudades más activas)
    # Como no tenemos campo ciudad en Order aún, simulamos basado en los logs de registro
    geo_data = [
        {"city": "Cali", "sales": len([o for o in all_orders if str(o.id).startswith('a')]), "revenue": total_revenue * 0.4},
        {"city": "Medellín", "sales": len([o for o in all_orders if str(o.id).startswith('b')]), "revenue": total_revenue * 0.3},
        {"city": "Bogotá", "sales": len([o for o in all_orders if str(o.id).startswith('c')]), "revenue": total_revenue * 0.2},
        {"city": "Barranquilla", "sales": 0, "revenue": 0}
    ]

    # 4. Alertas de Red
    recent_alerts = [
        {"title": f"Registro: {u.full_name}", "time": "Hace 5 min", "type": "info"} for u in all_users[:3]
    ]
    if not recent_alerts:
        recent_alerts = [{"title": "Sistema en espera", "time": "Ahora", "type": "status"}]

    return {
        "total_revenue": total_revenue,
        "total_commission": total_commission,
        "active_companies": len(all_users),
        "active_affiliates": db.query(models.User).filter(models.User.role == 'afiliado').count(),
        "expiring_soon": expiring_soon,
        "geo_data": geo_data,
        "recent_alerts": recent_alerts,
        "top_companies": [
            {"name": u.full_name, "revenue": sum(o.total_price for o in all_orders if o.tenant_id == u.id)} 
            for u in all_users[:5]
        ]
    }

@app.post("/super-admin/inject-template")
def inject_master_template(data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    """
    Inyecta una configuración de tienda maestra a un cliente nuevo.
    """
    if not current_user.is_global_staff:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    
    target_user_id = uuid.UUID(data.get("user_id"))
    template_type = data.get("template", "fashion") # fashion, tech, food
    
    # Lógica de inyección (Simulada para el MVP)
    # Aquí crearíamos productos y categorías por defecto para el usuario
    
    return {"status": "success", "message": f"Plantilla {template_type} inyectada con éxito"}

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
    
    # --- RESTRICCIÓN DE PLAN BÁSICO ---
    # Obtenemos el dueño real para ver su plan
    tenant_owner = db.query(models.User).filter(models.User.id == tenant_id).first()
    
    if tenant_owner and tenant_owner.plan and tenant_owner.plan.name == "Básico":
        product_count = db.query(models.Product).filter(models.Product.owner_id == tenant_id).count()
        if product_count >= 30:
            raise HTTPException(
                status_code=403, 
                detail="LÍMITE ALCANZADO: Tu plan Básico solo permite 30 productos. ¡Actualiza a PRO para vender sin límites! 🚀"
            )
            
    return crud.create_product(db=db, product=product, owner_id=tenant_id)

import pandas as pd
import io

@app.post("/products/import-excel")
async def import_products_excel(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    tenant_id = get_tenant_id(current_user)
    
    # 1. Verificar plan y límite
    tenant_owner = db.query(models.User).filter(models.User.id == tenant_id).first()
    is_basic = tenant_owner and tenant_owner.plan and tenant_owner.plan.name == "Básico"
    current_count = db.query(models.Product).filter(models.Product.owner_id == tenant_id).count()
    
    # 2. Leer el archivo
    contents = await file.read()
    try:
        if file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al leer el archivo: {str(e)}")

    # Normalizar columnas
    df.columns = [c.lower().strip() for c in df.columns]

    # Mapeo flexible de columnas
    column_mapping = {
        'nombre': ['nombre', 'name', 'producto', 'articulo', 'artículo', 'item'],
        'descripcion': ['descripcion', 'descripción', 'description', 'detalle'],
        'precio': ['precio', 'price', 'valor', 'costo'],
        'categoria': ['categoria', 'categoría', 'category', 'tipo'],
        'talla': ['talla', 'size', 'medida', 'dimension'],
        'color': ['color', 'tono', 'estilo'],
        'stock': ['stock', 'cantidad', 'inventario', 'existencias']
    }

    def get_col_val(row, key, default=''):
        for possible_name in column_mapping.get(key, [key]):
            if possible_name in row:
                return row[possible_name]
        return default

    # Verificar si al menos existe la columna de nombre
    has_name_col = any(name in df.columns for name in column_mapping['nombre'])
    if not has_name_col:
        raise HTTPException(
            status_code=400, 
            detail=f"No se encontró la columna de 'Nombre'. Columnas detectadas: {list(df.columns)}"
        )

    limit = 30
    imported_count = 0
    updated_count = 0
    skipped_count = 0
    errors = []

    # 3. Procesar filas
    for index, row in df.iterrows():
        # Check limit if basic
        if is_basic and (current_count + imported_count) >= limit:
            skipped_count = len(df) - index
            break

        try:
            name = str(get_col_val(row, 'nombre', '')).strip()
            if not name or name.lower() == 'nan': 
                continue

            # Buscar si el producto ya existe (por nombre)
            db_product = db.query(models.Product).filter(
                models.Product.owner_id == tenant_id,
                models.Product.name == name
            ).first()

            if not db_product:
                # 1. Buscar si la colección existe, si no, usar None por ahora
                # (Mejorado: podrías crear la colección automáticamente aquí si quisieras)
                
                db_product = models.Product(
                    id=uuid.uuid4(),
                    owner_id=tenant_id,
                    name=name,
                    description=str(get_col_val(row, 'descripcion', '')),
                    price=float(get_col_val(row, 'precio', 0)),
                    sku=str(get_col_val(row, 'sku', f"SKU-{str(uuid.uuid4())[:8].upper()}")),
                    status="active",
                    image_url=[] 
                )
                db.add(db_product)
                db.flush()
                imported_count += 1
            else:
                updated_count += 1

            # Crear variante vinculada
            # Nota: En el modelo ProductVariant, los campos son: stock, name (para talla/color combinado)
            variant_name = f"{get_col_val(row, 'talla', 'Única')} / {get_col_val(row, 'color', 'Único')}"
            variant = models.ProductVariant(
                id=uuid.uuid4(),
                product_id=db_product.id,
                name=variant_name,
                sku=f"{db_product.sku}-{str(uuid.uuid4())[:4].upper()}",
                stock=int(get_col_val(row, 'stock', 0)),
                attributes={
                    "talla": str(get_col_val(row, 'talla', 'Única')),
                    "color": str(get_col_val(row, 'color', 'Único'))
                }
            )
            db.add(variant)

        except Exception as e:
            errors.append(f"Fila {index+2}: {str(e)}")

    db.commit()

    msg = f"¡Listo! Se crearon {imported_count} productos nuevos."
    if updated_count > 0:
        msg += f" Se agregaron variantes a {updated_count} productos existentes."
    if skipped_count > 0:
        msg += f" Se omitieron {skipped_count} por límite de plan."
    if not imported_count and not updated_count and not errors:
        msg = "No se procesaron productos. Verifica que el archivo tenga datos válidos."

    return {
        "status": "success",
        "imported": imported_count,
        "updated": updated_count,
        "skipped": skipped_count,
        "errors": errors,
        "message": msg
    }

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

@app.post("/public/orders")
def create_public_order(order_data: dict, db: Session = Depends(get_db)):
    """
    Endpoint público para que clientes externos realicen compras sin estar logueados.
    """
    try:
        # 1. Extraer datos básicos
        tenant_id_str = order_data.get("tenant_id")
        if not tenant_id_str:
            raise HTTPException(status_code=400, detail="tenant_id es obligatorio")
        
        tenant_id = uuid.UUID(tenant_id_str)
        items = order_data.get("items", [])
        
        if not items:
            raise HTTPException(status_code=400, detail="La orden no tiene productos")

        # 2. Crear la Orden en DB
        new_order = models.Order(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            customer_name=order_data.get("customer_name", "Cliente Web"),
            customer_email=order_data.get("customer_email"),
            customer_phone=order_data.get("customer_phone"),
            total_price=0, # Se calculará abajo
            status="pendiente",
            payment_status=order_data.get("payment_status", "pending"),
            payment_method=order_data.get("payment_method", "wompi")
        )
        
        db.add(new_order)
        total_price = 0

        # 3. Procesar Items e Inventario
        for item in items:
            product_id = uuid.UUID(item["product_id"])
            qty = item.get("quantity", 1)
            
            product = db.query(models.Product).filter(models.Product.id == product_id).first()
            if not product: continue

            # Calcular precio
            item_total = product.price * qty
            total_price += item_total

            # Crear OrderItem
            order_item = models.OrderItem(
                id=uuid.uuid4(),
                order_id=new_order.id,
                product_id=product_id,
                quantity=qty,
                price=product.price,
                variant_info=item.get("variant_info", "")
            )
            db.add(order_item)

            # --- DESCUENTO DE INVENTARIO ---
            # Intentar descontar de la primera variante disponible o base
            if product.variants:
                variant = product.variants[0]
                if variant.stock >= qty:
                    variant.stock -= qty
                else:
                    variant.stock = 0 # No bloqueamos la venta pero agotamos stock

        new_order.total_price = total_price
        db.commit()
        db.refresh(new_order)

        # 4. NOTIFICACIONES WHATSAPP (Línea Oficial Bayup)
        tenant_owner = db.query(models.User).filter(models.User.id == tenant_id).first()
        store_name = tenant_owner.full_name if tenant_owner else "Tienda Bayup"
        
        bridge_url = os.getenv("WHATSAPP_BRIDGE_URL", "http://localhost:8001")
        if not bridge_url.endswith("/send"):
            bridge_url = f"{bridge_url.rstrip('/')}/send"

        # Notificación al Dueño
        if tenant_owner and tenant_owner.phone:
            try:
                owner_msg = (
                    f"💰 *¡NUEVA VENTA WEB!* 💰\n\n"
                    f"Hola *{store_name}*, has recibido un pedido.\n\n"
                    f"*Cliente:* {new_order.customer_name}\n"
                    f"*Total:* ${total_price:,.0f} COP\n"
                    f"*ID:* #{str(new_order.id)[:8]}\n\n"
                    f"Revisa tu panel para preparar el envío. 🚀"
                )
                owner_phone = str(tenant_owner.phone).replace(" ", "").replace("+", "")
                if len(owner_phone) == 10: owner_phone = "57" + owner_phone
                if not owner_phone.endswith("@c.us"): owner_phone += "@c.us"
                requests.post(bridge_url, json={"to": owner_phone, "body": owner_msg}, timeout=5)
            except: pass

        # Notificación al Cliente
        if new_order.customer_phone:
            try:
                customer_msg = (
                    f"🛍️ *¡PEDIDO RECIBIDO!* 🛍️\n\n"
                    f"Hola *{new_order.customer_name}*, gracias por tu compra en *{store_name}*.\n\n"
                    f"Tu pedido *#{str(new_order.id)[:8]}* por valor de *${total_price:,.0f} COP* está siendo procesado.\n\n"
                    f"Te avisaremos cuando el envío esté en camino. ✨"
                )
                cust_phone = str(new_order.customer_phone).replace(" ", "").replace("+", "")
                if len(cust_phone) == 10: cust_phone = "57" + cust_phone
                if not cust_phone.endswith("@c.us"): cust_phone += "@c.us"
                requests.post(bridge_url, json={"to": cust_phone, "body": customer_msg}, timeout=5)
            except: pass

        return {"status": "success", "order_id": str(new_order.id)}

    except Exception as e:
        db.rollback()
        print(f"ERROR CREATING PUBLIC ORDER: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/orders", response_model=schemas.Order)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    # Crucial: Identificar al Dueño de la tienda (Tenant) real
    tenant_id = get_tenant_id(current_user)
    print(f"DEBUG: Creando orden para tenant_id: {tenant_id}")
    return crud.create_order(db=db, order=order, customer_id=current_user.id, tenant_id=tenant_id)

# --- Shipments ---

@app.get("/admin/shipments", response_model=List[schemas.Shipment])
def read_shipments(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    return crud.get_shipments_by_owner(db, owner_id=tenant_id)

@app.patch("/admin/shipments/{shipment_id}/status", response_model=schemas.Shipment)
def update_shipment_status(shipment_id: uuid.UUID, data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    db_shipment = crud.get_shipment(db, shipment_id=shipment_id, tenant_id=tenant_id)
    if not db_shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    new_status = data.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")
        
    return crud.update_shipment_status(db, db_shipment=db_shipment, status=new_status)

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

# --- Month-End Accounting Logic ---

def perform_month_end_closing(db: Session):
    """
    Calcula las ventas totales de cada tienda del mes calendario anterior
    y actualiza el campo last_month_revenue para definir la comisión del mes actual.
    """
    today = datetime.date.today()
    # 1. Calcular el rango del mes anterior
    first_day_this_month = today.replace(day=1)
    last_day_last_month = first_day_this_month - datetime.timedelta(days=1)
    first_day_last_month = last_day_last_month.replace(day=1)
    
    start_date = datetime.datetime.combine(first_day_last_month, datetime.time.min)
    end_date = datetime.datetime.combine(first_day_this_month, datetime.time.min)
    
    print(f"🔄 INICIANDO CIERRE CONTABLE: {start_date} -> {end_date}")
    
    # 2. Obtener todos los dueños de tiendas
    stores = db.query(models.User).filter(models.User.role == 'admin_tienda', models.User.owner_id == None).all()
    
    results = []
    for store in stores:
        # Sumar ventas web y pos del mes anterior
        monthly_revenue = db.query(func.sum(models.Order.total_price)).filter(
            models.Order.tenant_id == store.id,
            models.Order.created_at >= start_date,
            models.Order.created_at < end_date,
            models.Order.status != 'cancelled' # No sumamos pedidos cancelados
        ).scalar() or 0.0
        
        # 3. Actualizar la tienda
        store.last_month_revenue = monthly_revenue
        results.append({"store": store.full_name, "revenue": monthly_revenue})
    
    db.commit()
    print(f"✅ CIERRE COMPLETADO: {len(results)} tiendas actualizadas.")
    return results

@app.post("/super-admin/close-month")
def trigger_month_closing(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_super_admin_user)):
    """
    Ejecución manual del cierre de mes desde el panel de Super Admin.
    """
    try:
        report = perform_month_end_closing(db)
        log_activity(db, current_user.id, current_user.id, "MONTH_CLOSING_MANUAL", f"Ejecutó cierre contable para {len(report)} tiendas.")
        return {"status": "success", "updated_stores": len(report), "details": report}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    """
    Calcula la comisión exacta de Bayup y del Afiliado.
    Regla: POS = 0%. Web = Escala por volumen mes anterior o Manual.
    """
    if source.lower() == "pos":
        return {"total": 0.0, "bayup": 0.0, "affiliate": 0.0}

    now = datetime.datetime.utcnow()
    
    # 1. Verificar Sobre-mando Manual (Super Admin)
    if store.custom_commission_rate is not None:
        is_active = True
        # Si tiene fecha límite, verificar si ya caducó
        if store.commission_fixed_until and now > store.commission_fixed_until:
            is_active = False
            
        if is_active or store.commission_is_fixed:
            total_rate = store.custom_commission_rate / 100
            affiliate_rate = 0.005 if store.referred_by_id else 0.0
            bayup_rate = max(0.01, total_rate - affiliate_rate) # Bayup mínimo 1%
            return {"total": total_rate, "bayup": bayup_rate, "affiliate": affiliate_rate}

    # 2. Lógica Variable por Volumen (Mes Anterior)
    revenue = store.last_month_revenue or 0.0
    
    if revenue <= 15000000: # 0 - 15 Millones
        total_rate = 0.035
    elif revenue <= 50000000: # 15 - 50 Millones
        total_rate = 0.025
    else: # > 50 Millones
        total_rate = 0.015

    affiliate_rate = 0.005 if store.referred_by_id else 0.0
    bayup_rate = total_rate - affiliate_rate # Aquí siempre es >= 1% (1.5% - 0.5% = 1.0%)
    
    return {
        "total": total_rate,
        "bayup": bayup_rate,
        "affiliate": affiliate_rate
    }

@app.get("/super-admin/stats", response_model=schemas.SuperAdminStats)
def get_super_admin_stats(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_super_admin_user)):
    total_revenue = db.query(func.sum(models.Order.total_price)).scalar() or 0.0
    
    all_orders = db.query(models.Order).all()
    total_commission = 0.0
    store_cache = {}
    
    for order in all_orders:
        if order.tenant_id not in store_cache:
            store_cache[order.tenant_id] = db.query(models.User).filter(models.User.id == order.tenant_id).first()
        
        store = store_cache[order.tenant_id]
        if store:
            comm = calculate_dynamic_commission(store, order.source)
            total_commission += (order.total_price * comm["bayup"]) # Solo lo que gana Bayup
            
    active_companies = db.query(models.User).filter(models.User.role == 'admin_tienda', models.User.status == 'Activo').count()
    active_affiliates = db.query(models.User).filter(models.User.role == 'afiliado', models.User.status == 'Activo').count()
    
    top_stores = db.query(
        models.User.full_name,
        func.sum(models.Order.total_price).label('revenue')
    ).join(models.Order, models.Order.tenant_id == models.User.id)\
     .group_by(models.User.id)\
     .order_by(text('revenue DESC'))\
     .limit(5).all()
    
    top_companies = [{"name": s.full_name or "Tienda", "revenue": s.revenue} for s in top_stores]
    
    return {
        "total_revenue": total_revenue,
        "total_commission": total_commission,
        "active_companies": active_companies,
        "active_affiliates": active_affiliates,
        "top_companies": top_companies,
        "recent_alerts": []
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

@app.get("/super-admin/stores")
def get_all_stores(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_super_admin_user)):
    # Obtener dueños de tienda (rol admin_tienda y sin dueño superior)
    stores = db.query(models.User).filter(
        models.User.role == 'admin_tienda',
        models.User.owner_id == None
    ).all()
    
    result = []
    for store in stores:
        # 1. Facturación Total por Origen
        # Separamos para aplicar comisión real (0% POS, X% Web)
        orders = db.query(models.Order).filter(models.Order.tenant_id == store.id).all()
        
        total_invoiced = 0.0
        profit = 0.0
        order_count = len(orders)
        
        plan_name = store.plan.name if store.plan else "Básico"
        
        for order in orders:
            total_invoiced += order.total_price
            rate = get_commission_rate(plan_name, order.source)
            profit += (order.total_price * rate)
        
        # 2. Conteo de Productos
        product_count = db.query(models.Product).filter(models.Product.owner_id == store.id).count()
        
        # 3. Ticket Promedio
        avg_ticket = total_invoiced / order_count if order_count > 0 else 0.0
        
        result.append({
            "id": str(store.id),
            "owner_name": store.full_name or store.email,
            "company_name": store.nickname or store.full_name or "Tienda Bayup",
            "email": store.email,
            "phone": store.phone or "No registrado",
            "plan": plan_name,
            "status": store.status or "Activo",
            "total_invoiced": total_invoiced,
            "our_profit": profit,
            "product_count": product_count,
            "order_count": order_count,
            "avg_ticket": avg_ticket,
            "registration_date": "2026-02-16", 
            "avatar": (store.nickname or store.full_name or "U")[:2].upper()
        })
    
    return result

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
def get_public_shop(slug: str, page: str = "home", db: Session = Depends(get_db)):
    # 1. Buscar al dueño de la tienda por su slug
    store_owner = db.query(models.User).filter(models.User.shop_slug == slug).first()
    
    # FALLBACK PREVIEW: Si no existe la tienda 'preview', mostrar la primera tienda disponible (para que no de 404)
    if not store_owner and slug == "preview":
        store_owner = db.query(models.User).filter(models.User.role == 'admin_tienda').first()

    if not store_owner:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
    
    # 2. Obtener sus productos activos
    products_db = db.query(models.Product).filter(
        models.Product.owner_id == store_owner.id,
        models.Product.status == "active"
    ).all()

    # 3. Obtener sus categorías
    collections_db = db.query(models.Collection).filter(models.Collection.owner_id == store_owner.id).all()
    
    # 4. Obtener diseño personalizado (Studio) para la página específica
    custom_schema = db.query(models.ShopPage).filter(
        models.ShopPage.tenant_id == store_owner.id,
        models.ShopPage.page_key == page
    ).first()

    # Si no hay diseño para esa página específica, intentamos cargar el home como fallback o el esquema por defecto
    if not custom_schema and page != "home":
        # Podríamos decidir si mostrar un diseño genérico o el home
        pass

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
        "categories": categories,
        "custom_schema": custom_schema.schema_data if custom_schema else None
    }

@app.post("/public/orders")
async def create_public_order(data: dict, db: Session = Depends(get_db)):
    try:
        # 1. Validar datos básicos
        tenant_id_str = data.get("tenant_id")
        if not tenant_id_str:
            raise HTTPException(status_code=400, detail="Falta identificación del comercio")
            
        tenant_id = uuid.UUID(tenant_id_str)
        items_data = data.get("items", [])
        
        # 2. Obtener Dueño y Calcular Comisión Dinámica
        store_owner = db.query(models.User).filter(models.User.id == tenant_id).first()
        if not store_owner:
            raise HTTPException(status_code=404, detail="Comercio no encontrado")
            
        comm = calculate_dynamic_commission(store_owner, source="web")

        # 3. Calcular Totales y Reparto
        total_price = sum(item.get("price", 0) * item.get("quantity", 1) for item in items_data)
        bayup_fee = total_price * comm["bayup"]
        affiliate_fee = total_price * comm["affiliate"]
        merchant_net = total_price - bayup_fee - affiliate_fee
        
        print(f"💰 WOMPI SPLIT: Total {total_price} | Bayup: {bayup_fee} | Afiliado: {affiliate_fee} | Neto: {merchant_net}")

        # 4. Crear la orden
        new_order = models.Order(
            id=uuid.uuid4(),
            tenant_id=tenant_id,
            customer_name=data.get("customer_name"),
            customer_phone=data.get("customer_phone"),
            total_price=total_price,
            status="pending",
            source="web",
            payment_method="wompi_pending"
        )
        db.add(new_order)
        
        # 3. Crear los items de la orden y DESCONTAR INVENTARIO
        for item in items_data:
            # Buscar variante para validar stock
            variant_id = uuid.UUID(item["product_id"]) if "product_id" in item else None
            if not variant_id: continue

            variant = db.query(models.ProductVariant).filter(models.ProductVariant.id == variant_id).first()
            
            # Validación de Stock
            qty = item.get("quantity", 1)
            if variant:
                if variant.stock < qty:
                    raise HTTPException(status_code=400, detail=f"Stock insuficiente para {variant.name or 'producto'}")
                # Descuento de Inventario
                variant.stock -= qty
            
            order_item = models.OrderItem(
                id=uuid.uuid4(),
                order_id=new_order.id,
                product_variant_id=variant_id,
                quantity=qty,
                price_at_purchase=item.get("price", 0)
            )
            db.add(order_item)

        # 4. CRM: Crear o Vincular Cliente Automáticamente
        client_phone = data.get("customer_phone", "").replace(" ", "")
        client_email = data.get("customer_email", f"{client_phone}@cliente.bayup.com")
        
        existing_client = db.query(models.User).filter(
            (models.User.email == client_email) | (models.User.phone == client_phone),
            models.User.role == 'cliente'
        ).first()

        if not existing_client:
            # Crear nuevo cliente
            existing_client = models.User(
                id=uuid.uuid4(),
                email=client_email,
                phone=client_phone,
                full_name=data.get("customer_name", "Cliente Web"),
                role="cliente",
                status="Activo",
                owner_id=new_order.tenant_id, # Vinculado a esta tienda
                customer_type="final",
                acquisition_channel="web",
                total_spent=0,
                hashed_password=security.get_password_hash("123456") # Password temporal
            )
            db.add(existing_client)
            db.flush() # Para obtener ID
        
        # Actualizar métricas del cliente
        existing_client.total_spent += total_price
        existing_client.last_purchase_date = datetime.datetime.utcnow()
        new_order.customer_id = existing_client.id

        # 5. Finanzas: Registrar Ingreso (Pendiente)
        new_income = models.Income(
            id=uuid.uuid4(),
            description=f"Venta Web #{str(new_order.id)[:8]}",
            amount=total_price,
            category="ventas_web",
            tenant_id=new_order.tenant_id,
            created_at=datetime.datetime.utcnow()
        )
        db.add(new_income)
            
        db.commit()
        db.refresh(new_order)
        
        # 4. Registrar actividad para el dueño
        log_activity(db, new_order.tenant_id, new_order.tenant_id, "NEW_PUBLIC_ORDER", f"Nuevo pedido online de {new_order.customer_name}", str(new_order.id))
        
        # Obtener información del dueño para notificaciones
        tenant_owner = db.query(models.User).filter(models.User.id == new_order.tenant_id).first()
        store_name = tenant_owner.full_name if tenant_owner else "Tu Tienda Bayup"

        # --- AUTOMATIZACIÓN DE NOTIFICACIONES (WhatsApp al Dueño y al Cliente) ---
        
        bridge_url = os.getenv("WHATSAPP_BRIDGE_URL", "http://localhost:8001")
        if not bridge_url.endswith("/send"):
            bridge_url = f"{bridge_url.rstrip('/')}/send"

        # 1. WhatsApp al Dueño de la Tienda (Tu Cliente)
        if tenant_owner and tenant_owner.phone:
            try:
                owner_msg = (
                    f"💰 *¡NUEVA VENTA EN BAYUP!* 💰\n\n"
                    f"Hola *{tenant_owner.full_name}*, has recibido un nuevo pedido en tu tienda.\n\n"
                    f"*Cliente:* {new_order.customer_name}\n"
                    f"*Total:* ${total_price:,.0f} COP\n"
                    f"*ID Pedido:* #{str(new_order.id)[:8]}\n\n"
                    f"Accede a tu dashboard para gestionar el envío. ¡Sigue vendiendo con Bayup! 🚀"
                )
                
                owner_phone = str(tenant_owner.phone).replace(" ", "").replace("+", "")
                if len(owner_phone) == 10: owner_phone = "57" + owner_phone
                if not owner_phone.endswith("@c.us"): owner_phone += "@c.us"

                requests.post(bridge_url, json={"to": owner_phone, "body": owner_msg}, timeout=5)
                print(f"✅ Notificación enviada al dueño: {owner_phone}")
            except Exception as wa_err:
                print(f"❌ Error enviando WhatsApp al Dueño: {wa_err}")

        # 2. WhatsApp al Comprador Final (Confirmación de Pedido)
        if new_order.customer_phone:
            try:
                customer_msg = (
                    f"🛍️ *¡PEDIDO CONFIRMADO!* 🛍️\n\n"
                    f"Hola *{new_order.customer_name}*, gracias por comprar en *{store_name}*.\n\n"
                    f"Hemos recibido tu pedido con éxito:\n"
                    f"📦 *ID:* #{str(new_order.id)[:8]}\n"
                    f"💰 *Total:* ${total_price:,.0f} COP\n\n"
                    f"Pronto nos pondremos en contacto contigo para el envío. ✨\n\n"
                    f"_Impulsado por Bayup Interactive_"
                )
                
                customer_phone = str(new_order.customer_phone).replace(" ", "").replace("+", "")
                if len(customer_phone) == 10: customer_phone = "57" + customer_phone
                if not customer_phone.endswith("@c.us"): customer_phone += "@c.us"

                requests.post(bridge_url, json={"to": customer_phone, "body": customer_msg}, timeout=5)
                print(f"✅ Confirmación enviada al comprador final: {customer_phone}")
            except Exception as wa_err:
                print(f"❌ Error enviando WhatsApp al Cliente: {wa_err}")

        return {"status": "success", "id": str(new_order.id), "total": total_price}
        
    except Exception as e:
        db.rollback()
        print(f"Error creando pedido público: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
        if page_data.template_id: db_page.template_id = page_data.template_id
    else:
        db_page = models.ShopPage(
            id=uuid.uuid4(),
            tenant_id=target_tenant_id,
            page_key=page_data.page_key,
            schema_data=page_data.schema_data,
            template_id=page_data.template_id
        )
        db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page

@app.post("/shop-pages/publish", response_model=schemas.ShopPage)
def publish_shop_page(
    page_data: schemas.ShopPageCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    target_tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    db_page = db.query(models.ShopPage).filter(
        models.ShopPage.tenant_id == target_tenant_id,
        models.ShopPage.page_key == page_data.page_key
    ).first()
    
    if not db_page:
        db_page = models.ShopPage(
            id=uuid.uuid4(),
            tenant_id=target_tenant_id,
            page_key=page_data.page_key,
            schema_data=page_data.schema_data,
            template_id=page_data.template_id
        )
        db.add(db_page)
    
    db_page.schema_data = page_data.schema_data
    db_page.is_published = True
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

@app.get("/public/shop-pages/{tenant_id}/{page_key}", response_model=schemas.ShopPage)
def get_public_shop_page(tenant_id: uuid.UUID, page_key: str, db: Session = Depends(get_db)):
    db_page = db.query(models.ShopPage).filter(
        models.ShopPage.tenant_id == tenant_id, 
        models.ShopPage.page_key == page_key,
        models.ShopPage.is_published == True
    ).first()
    if not db_page:
        raise HTTPException(status_code=404, detail="Diseño no publicado")
    return db_page

# --- SUPER ADMIN DESIGN INJECTION ---

class DesignInjectionRequest(BaseModel):
    tenant_id: uuid.UUID
    page_key: str
    schema_data: Dict[str, Any]

@app.post("/super-admin/inject-design")
def inject_design(
    request: DesignInjectionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    if not current_user.is_global_staff:
        raise HTTPException(status_code=403, detail="Acceso denegado: Solo Super Admins")

    db_page = db.query(models.ShopPage).filter(
        models.ShopPage.tenant_id == request.tenant_id,
        models.ShopPage.page_key == request.page_key
    ).first()

    if db_page:
        db_page.schema_data = request.schema_data
        db_page.is_published = True # Auto-publicamos al inyectar para agilidad
    else:
        db_page = models.ShopPage(
            id=uuid.uuid4(),
            tenant_id=request.tenant_id,
            page_key=request.page_key,
            schema_data=request.schema_data,
            is_published=True
        )
        db.add(db_page)
    
    db.commit()
    return {"status": "success", "message": f"Diseño inyectado en {request.page_key} para la tienda {request.tenant_id}"}

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
    return db.query(models.WebTemplate).all()

@app.get("/web-templates", response_model=List[schemas.WebTemplate])
def list_web_templates_public(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    # Versión para clientes (Plan Básico/Pro/Empresa)
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

# --- Store Messages Endpoints ---
@app.post("/public/messages", response_model=schemas.StoreMessage)
def create_store_message(request: schemas.StoreMessageCreate, db: Session = Depends(get_db)):
    db_message = models.StoreMessage(**request.model_dump())
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

@app.get("/admin/messages", response_model=List[schemas.StoreMessage])
def list_store_messages(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    return db.query(models.StoreMessage).filter(models.StoreMessage.tenant_id == tenant_id).order_by(models.StoreMessage.created_at.desc()).all()

@app.patch("/admin/messages/{message_id}")
def update_message_status(message_id: uuid.UUID, status: str, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = get_tenant_id(current_user)
    db_message = db.query(models.StoreMessage).filter(models.StoreMessage.id == message_id, models.StoreMessage.tenant_id == tenant_id).first()
    if not db_message: raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    db_message.status = status
    db.commit()
    return {"status": "success"}

@app.get("/admin/payments/wompi-config")
def get_wompi_config(amount: float, currency: str = "COP"):
    """
    Retorna la configuración necesaria para abrir el widget de Wompi.
    """
    return payment_service.create_payment_session(amount, currency)

if __name__ == "__main__":
    import uvicorn
    # Leemos el puerto de la variable de entorno PORT que asigna Railway, por defecto 8000
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)