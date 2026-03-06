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
    """Repara el esquema sin tocar los datos existentes. Blindado contra colapsos."""
    print("🛠️ Verificando base de datos persistente...")
    try:
        # Crea las tablas solo si NO existen
        models.Base.metadata.create_all(bind=engine)
        
        # Inyección segura de columnas (ALTER TABLE)
        # Sincronizado exactamente con models.py y optimizado para Postgres
        required_cols = [
            ("logo_url", "TEXT"), ("phone", "TEXT"), ("shop_slug", "TEXT"),
            ("custom_domain", "TEXT"), ("onboarding_completed", "BOOLEAN DEFAULT FALSE"),
            ("is_global_staff", "BOOLEAN DEFAULT FALSE"), ("permissions", "JSONB"),
            ("bank_accounts", "JSONB"), ("social_links", "JSONB"), ("whatsapp_lines", "JSONB"),
            ("custom_commission_rate", "NUMERIC"), ("commission_is_fixed", "BOOLEAN DEFAULT FALSE"),
            ("commission_fixed_until", "TIMESTAMP"), ("last_month_revenue", "NUMERIC DEFAULT 0.0"),
            ("referred_by_id", "UUID"), ("owner_id", "UUID"), ("loyalty_points", "INTEGER DEFAULT 0"),
            ("total_spent", "NUMERIC DEFAULT 0.0"), ("last_purchase_date", "TIMESTAMP"),
            ("last_purchase_summary", "TEXT"), ("customer_type", "TEXT DEFAULT 'final'"),
            ("acquisition_channel", "TEXT"), ("city", "TEXT"), ("plan_id", "UUID")
        ]
        
        # Usamos una conexión directa para las alteraciones
        with engine.connect() as conn:
            for c_n, c_t in required_cols:
                try:
                    # En Postgres es más seguro intentar el ADD y fallar si existe
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {c_n} {c_t};"))
                    conn.commit()
                    print(f"✅ Columna inyectada: {c_n}")
                except Exception:
                    # Si falla es porque usualmente ya existe, lo ignoramos silenciosamente
                    pass

    except Exception as global_e:
        print(f"❌ Error crítico en safe_db_init: {global_e}. Continuando arranque...")

    # Asegurar Plan Básico y Usuario Sebastián
    db = SessionLocal()
    try:
        # 1. Asegurar Plan
        plan = db.query(models.Plan).filter(models.Plan.name == "Básico").first()
        if not plan:
            plan = models.Plan(
                id=uuid.uuid4(), name="Básico", 
                commission_rate=3.5, monthly_fee=0.0,
                modules=["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"],
                is_default=True
            )
            db.add(plan); db.commit(); db.refresh(plan)

        # 2. Asegurar Usuario (Si no existe, se crea; si existe, NO SE TOCA)
        email = "basicobayup@yopmail.co"
        if not db.query(models.User).filter(models.User.email == email).first():
            user = models.User(
                id=uuid.uuid4(), email=email, full_name="Sebastián Bayup",
                hashed_password=security.get_password_hash("123456"),
                role="admin_tienda", status="Activo", plan_id=plan.id, shop_slug="mi-tienda"
            )
            db.add(user); db.commit()
            print(f"✨ Usuario maestro {email} creado.")
    except Exception as e:
        print(f"⚠️ Aviso en post-init: {e}")
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
    allow_origins=[
        "https://www.bayup.com.co", 
        "https://bayup.com.co", 
        "https://bayup-interactive.vercel.app", 
        "http://localhost:3000",
        "https://exciting-optimism-production-4624.up.railway.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- LOGÍSTICA (ENVÍOS) ---

@app.get("/admin/shipments")
def get_shipments(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    """Lista todos los envíos vinculados a la tienda."""
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    try:
        return db.query(models.Shipment).filter(models.Shipment.tenant_id == tenant_id).all()
    except Exception as e:
        print(f"Error en /admin/shipments: {e}")
        return []

# --- ENDPOINTS CONECTADOS A DB REAL ---

@app.post("/auth/login")
async def login(request: Request, db: Session = Depends(get_db)):
    try:
        try: body = await request.json()
        except: 
            form = await request.form()
            body = {"username": form.get("username"), "password": form.get("password")}
        
        u, p = body.get("username"), body.get("password")
        if not u or not p:
            raise HTTPException(status_code=400, detail="Faltan credenciales")

        user = crud.get_user_by_email(db, email=u.lower().strip())
        
        if not user or not security.verify_password(p, user.hashed_password):
            raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
        
        token = security.create_access_token(data={"sub": user.email})
        
        # Plan seguro
        plan_name = "Básico"
        modules = ["inicio", "facturacion", "pedidos", "productos", "envios", "mensajes", "settings"]
        if user.plan:
            plan_name = user.plan.name
            modules = user.plan.modules

        return {
            "access_token": token, "token_type": "bearer",
            "user": {
                "email": user.email, "full_name": user.full_name, "role": user.role, "shop_slug": user.shop_slug,
                "plan": {"name": plan_name, "modules": modules}
            }
        }
    except HTTPException as he: raise he
    except Exception as e: 
        print(f"🔥 Error interno en Login: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor")

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
    """Sube una imagen al servidor y devuelve la URL real de producción."""
    try:
        upload_dir = "uploads"
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
            
        file_extension = file.filename.split(".")[-1]
        file_name = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(upload_dir, file_name)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # URL DINÁMICA: Detecta si estamos en Railway o Local
        base_url = os.getenv("RAILWAY_PUBLIC_DOMAIN", "localhost:8080")
        protocol = "https" if "railway" in base_url else "http"
        
        # Si base_url no tiene el protocolo, se lo añadimos
        if not base_url.startswith("http"):
            base_url = f"{protocol}://{base_url}"
            
        return {"url": f"{base_url}/uploads/{file_name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir imagen: {str(e)}")

from fastapi.staticfiles import StaticFiles
# Montar carpeta de uploads para servir imágenes estáticas
if not os.path.exists("uploads"): os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- ENDPOINTS DE ADMINISTRACIÓN Y STAFF ---

@app.get("/admin/users", response_model=list[schemas.User])
def get_staff(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    """Lista todos los miembros del staff de la tienda."""
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.User).filter(models.User.owner_id == tenant_id).all()

@app.post("/admin/users")
def create_staff_member(
    user_in: schemas.UserCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    """Crea un nuevo miembro del staff vinculado a la tienda actual."""
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    if crud.get_user_by_email(db, email=user_in.email):
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    hashed_password = security.get_password_hash(user_in.password)
    db_user = models.User(
        id=uuid.uuid4(),
        email=user_in.email.lower().strip(),
        full_name=user_in.full_name,
        hashed_password=hashed_password,
        role=user_in.role or "vendedor",
        status=user_in.status or "Invitado",
        owner_id=tenant_id,
        plan_id=current_user.plan_id
    )
    db.add(db_user)
    
    # Registrar en auditoría
    log = models.ActivityLog(
        id=uuid.uuid4(),
        user_id=current_user.id,
        tenant_id=tenant_id,
        action="CREATE_USER",
        detail=f"Invitación enviada a {user_in.email}"
    )
    db.add(log)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/admin/update-user")
def update_staff_details(
    data: dict, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    """Endpoint flexible para actualizar detalles de staff desde el dashboard."""
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    target_user = db.query(models.User).filter(models.User.email == data.get("email"), models.User.owner_id == tenant_id).first()
    
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado en tu tienda")
    
    if "new_role" in data: target_user.role = data["new_role"]
    if "full_name" in data: target_user.full_name = data["full_name"]
    if "status" in data: target_user.status = data["status"]
    
    db.commit()
    return {"status": "success"}

@app.delete("/admin/users/{user_id}")
def delete_staff_member(
    user_id: uuid.UUID, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    db_user = db.query(models.User).filter(models.User.id == user_id, models.User.owner_id == tenant_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    db.delete(db_user)
    db.commit()
    return {"status": "success"}

# --- ENDPOINTS DE ROLES Y PERMISOS ---

@app.get("/admin/roles")
def get_roles(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.CustomRole).filter(models.CustomRole.owner_id == tenant_id).all()

@app.post("/admin/roles")
def create_role(role_in: schemas.CustomRoleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return crud.create_custom_role(db, role_in, owner_id=tenant_id)

@app.put("/admin/roles/{role_id}")
def update_role(role_id: uuid.UUID, role_in: schemas.CustomRoleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return crud.update_custom_role(db, role_id, role_in, owner_id=tenant_id)

# --- ENDPOINTS DE COLECCIONES ---

@app.get("/collections")
def get_collections(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return crud.get_collections_by_owner(db, owner_id=tenant_id)

@app.post("/collections")
def create_collection(col_in: schemas.CollectionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return crud.create_collection(db, col_in, owner_id=tenant_id)

# --- AUDITORÍA Y LOGS ---

@app.get("/admin/logs")
def get_logs(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.ActivityLog).filter(models.ActivityLog.tenant_id == tenant_id).order_by(models.ActivityLog.created_at.desc()).limit(50).all()

@app.get("/auth/me", response_model=schemas.User)
def me(current_user: models.User = Depends(security.get_current_user)):
    return current_user

@app.get("/products")
def read_products(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    """Lista productos calculando stock total y categoría en tiempo real."""
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    try:
        products = db.query(models.Product).filter(models.Product.owner_id == tenant_id).all()
        
        # Inyectar stock total dinámico para el frontend
        for p in products:
            p.total_stock = sum(v.stock for v in p.variants) if p.variants else 0
            # Asegurar que el nombre de la categoría esté disponible
            if p.collection:
                p.category = p.collection.title
            elif not p.category:
                p.category = "General"
                
        return products
    except Exception as e:
        print(f"Error en /products: {e}")
        return []

@app.post("/products", response_model=schemas.Product)
def create_product(
    product_in: schemas.ProductCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    """Crea un nuevo producto con sus variantes en la tienda actual."""
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    try:
        # 1. Crear el registro maestro del producto
        db_product = models.Product(
            id=uuid.uuid4(),
            name=product_in.name,
            description=product_in.description,
            price=product_in.price,
            wholesale_price=product_in.wholesale_price,
            cost=product_in.cost,
            sku=product_in.sku,
            status=product_in.status or "active",
            add_gateway_fee=product_in.add_gateway_fee,
            image_url=product_in.image_url,
            collection_id=product_in.collection_id,
            owner_id=tenant_id
        )
        
        # Sincronizar nombre de categoría
        if product_in.collection_id:
            col = db.query(models.Collection).filter(models.Collection.id == product_in.collection_id).first()
            if col: 
                db_product.category = col.title
                print(f"✅ Categoría asignada: {col.title}")

        db.add(db_product)
        db.flush() # Genera el ID del producto antes del commit para las variantes
        
        # 2. Crear las variantes (tallas/colores) de forma explícita
        if product_in.variants:
            for v_in in product_in.variants:
                db_variant = models.ProductVariant(
                    id=uuid.uuid4(),
                    product_id=db_product.id,
                    name=v_in.name,
                    sku=v_in.sku,
                    stock=v_in.stock,
                    price_adjustment=v_in.price_adjustment,
                    image_url=v_in.image_url,
                    attributes=v_in.attributes
                )
                db.add(db_variant)
            print(f"✅ {len(product_in.variants)} variantes creadas.")
            
        db.commit()
        db.refresh(db_product)
        print(f"✨ Producto '{db_product.name}' creado con éxito.")
        return db_product
    except Exception as e:
        db.rollback()
        print(f"❌ Error creando producto: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/products/{product_id}")
def read_product(product_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    """Obtiene el detalle de un producto normalizado para el editor."""
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    product = db.query(models.Product).filter(
        models.Product.id == product_id, 
        models.Product.owner_id == tenant_id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Normalización para el editor del frontend
    product.total_stock = sum(v.stock for v in product.variants) if product.variants else 0
    if product.collection:
        product.category = product.collection.title
    
    return product

@app.put("/products/{product_id}")
def update_product(
    product_id: uuid.UUID, 
    product_in: schemas.ProductUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    """Actualiza los datos de un producto y sus variantes de forma atómica y forzada."""
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    db_product = db.query(models.Product).filter(
        models.Product.id == product_id, 
        models.Product.owner_id == tenant_id
    ).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    try:
        print(f"🚀 RECIBIENDO ACTUALIZACIÓN PARA: {db_product.name}")
        
        # 1. Actualizar campos básicos
        update_dict = product_in.dict(exclude_unset=True, exclude={"variants"})
        for key, value in update_dict.items():
            setattr(db_product, key, value)
            print(f"✅ Campo '{key}' actualizado a: {value}")

        # 2. Sincronizar Categoría (Texto y ID)
        if product_in.collection_id:
            col = db.query(models.Collection).filter(models.Collection.id == product_in.collection_id).first()
            if col:
                db_product.category = col.title
                print(f"✅ Categoría sincronizada a: {col.title}")

        # 3. Refrescar Variantes (Borrado y Creación Limpia)
        if product_in.variants is not None:
            print(f"📦 Procesando {len(product_in.variants)} variantes...")
            # Borrado físico manual para asegurar limpieza en Supabase
            db.query(models.ProductVariant).filter(models.ProductVariant.product_id == product_id).delete()
            
            for v_in in product_in.variants:
                new_v = models.ProductVariant(
                    id=uuid.uuid4(),
                    product_id=product_id,
                    name=v_in.name,
                    sku=v_in.sku,
                    stock=v_in.stock,
                    price_adjustment=v_in.price_adjustment,
                    image_url=v_in.image_url,
                    attributes=v_in.attributes
                )
                db.add(new_v)
            print(f"✅ Variantes recreadas con éxito.")

        db.commit()
        db.refresh(db_product)
        return db_product
    except Exception as e:
        db.rollback()
        print(f"❌ ERROR CRÍTICO EN UPDATE: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al sincronizar con Supabase: {str(e)}")

@app.delete("/products/{product_id}")
def delete_product(product_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    """Elimina un producto del catálogo."""
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    db_product = db.query(models.Product).filter(
        models.Product.id == product_id, 
        models.Product.owner_id == tenant_id
    ).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    try:
        db.delete(db_product)
        db.commit()
        return {"status": "success", "message": "Producto eliminado correctamente"}
    except Exception as e:
        db.rollback()
        print(f"Error eliminando producto: {e}")
        raise HTTPException(status_code=500, detail="Error interno al eliminar")

@app.get("/orders")
def get_orders(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    try:
        return db.query(models.Order).filter(models.Order.tenant_id == tenant_id).all()
    except Exception as e:
        print(f"Error en /orders: {e}")
        return []

# --- NOTIFICACIONES ---

@app.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    """Lista las notificaciones pendientes de la tienda."""
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    return db.query(models.Notification).filter(
        models.Notification.tenant_id == tenant_id
    ).order_by(models.Notification.created_at.desc()).limit(20).all()

# --- ENDPOINTS PÚBLICOS (PARA LA TIENDA ONLINE) ---

@app.get("/public/shop/{shop_slug}")
def get_public_shop_data(shop_slug: str, db: Session = Depends(get_db)):
    """Obtiene la información pública de una tienda por su slug."""
    user = db.query(models.User).filter(models.User.shop_slug == shop_slug).first()
    if not user:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")

    return {
        "id": user.id,
        "full_name": user.full_name,
        "logo_url": user.logo_url,
        "phone": user.phone,
        "social_links": user.social_links,
        "whatsapp_lines": user.whatsapp_lines
    }

@app.get("/public/stores/{tenant_id}/products")
def get_public_products(tenant_id: uuid.UUID, db: Session = Depends(get_db)):
    """Lista productos públicos de una tienda específica."""
    return db.query(models.Product).filter(
        models.Product.owner_id == tenant_id,
        models.Product.status == "active"
    ).all()

@app.post("/public/orders")
def create_public_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    """Crea un pedido real desde la tienda pública."""
    try:
        # 1. Crear el pedido
        db_order = models.Order(
            **order_data.dict(),
            status="pending",
            id=uuid.uuid4()
        )
        db.add(db_order)
        
        # 2. Notificar al dueño de la tienda (tenant_id)
        notification = models.Notification(
            id=uuid.uuid4(),
            tenant_id=order_data.tenant_id,
            title="¡Nueva Venta Web! 🚀",
            message=f"Has recibido un pedido de {order_data.customer_name} por {order_data.total_price} COP.",
            type="success",
            is_read=False
        )
        db.add(notification)
        
        db.commit()
        db.refresh(db_order)
        return db_order
    except Exception as e:
        db.rollback()
        print(f"Error creando pedido público: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/orders/{order_id}")
def update_order_status(
    order_id: uuid.UUID,
    status_data: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Actualiza el estado de un pedido (ej: de 'pending' a 'completed')."""
    db_order = db.query(models.Order).filter(
        models.Order.id == order_id,
        models.Order.tenant_id == current_user.id
    ).first()

    if not db_order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    db_order.status = status_data.status

    # Notificación interna del cambio de estado
    notification = models.Notification(
        id=uuid.uuid4(),
        tenant_id=current_user.id,
        title="Pedido Actualizado 📦",
        message=f"El pedido de {db_order.customer_name} ha cambiado a {status_data.status.upper()}.",
        type="info",
        is_read=False
    )
    db.add(notification)

    db.commit()
    db.refresh(db_order)
    return db_order

@app.get("/public/stores/{tenant_id}/pages/{slug}")
def get_public_page(tenant_id: uuid.UUID, slug: str, db: Session = Depends(get_db)):
    """Obtiene una página personalizada pública (ej: Inicio, Sobre Nosotros)."""
    page = db.query(models.Page).filter(
        models.Page.owner_id == tenant_id,
        models.Page.slug == slug
    ).first()
    if not page:
        raise HTTPException(status_code=404, detail="Página no encontrada")
    return page

# --- MENSAJERÍA (WEB MESSAGES) ---

@app.get("/admin/messages")
def get_store_messages(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    """Lista los mensajes enviados por clientes a través de la tienda web."""
    tenant_id = current_user.owner_id if current_user.owner_id else current_user.id
    try:
        return db.query(models.StoreMessage).filter(models.StoreMessage.tenant_id == tenant_id).order_by(models.StoreMessage.created_at.desc()).all()
    except Exception as e:
        print(f"Error en /admin/messages: {e}")
        return []

@app.get("/health")
def health(): return {"status": "connected_and_persistent"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
