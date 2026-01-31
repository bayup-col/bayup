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

# Lifespan manager for startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting BaseCommerce API...")
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
        print(f"Available tables: {tables}")
        
        if 'users' in tables:
            columns = [c['name'] for c in inspector.get_columns('users')]
            
            with engine.begin() as conn:
                if 'loyalty_points' not in columns:
                    try: conn.execute(text("ALTER TABLE users ADD COLUMN loyalty_points INTEGER DEFAULT 0"))
                    except: pass
                
                if 'total_spent' not in columns:
                    try: conn.execute(text("ALTER TABLE users ADD COLUMN total_spent FLOAT DEFAULT 0.0"))
                    except: pass
                
                if 'last_purchase_date' not in columns:
                    try:
                        col_type = "TIMESTAMP" if engine.name == 'postgresql' else "DATETIME"
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN last_purchase_date {col_type}"))
                    except: pass
                
                if 'last_purchase_summary' not in columns:
                    try: conn.execute(text("ALTER TABLE users ADD COLUMN last_purchase_summary VARCHAR"))
                    except: pass
            print("User table migration check completed.")

        # Automigrate 'orders' table
        if 'orders' in tables:
            order_columns = [c['name'] for c in inspector.get_columns('orders')]
            with engine.begin() as conn:
                if 'customer_phone' not in order_columns:
                    try: conn.execute(text("ALTER TABLE orders ADD COLUMN customer_phone VARCHAR"))
                    except: pass
                if 'customer_type' not in order_columns:
                    try: conn.execute(text("ALTER TABLE orders ADD COLUMN customer_type VARCHAR DEFAULT 'final'"))
                    except: pass
                if 'source' not in order_columns:
                    try: conn.execute(text("ALTER TABLE orders ADD COLUMN source VARCHAR DEFAULT 'pos'"))
                    except: pass
                if 'payment_method' not in order_columns:
                    try: conn.execute(text("ALTER TABLE orders ADD COLUMN payment_method VARCHAR DEFAULT 'cash'"))
                    except: pass
            print("Orders table migration check completed.")

        if not crud.get_default_plan(db):
            print("Creating default 'Free' plan...")
            crud.create_plan(db=db, plan=schemas.PlanCreate(name="Free", description="Default", commission_rate=0.1, monthly_fee=0, is_default=True))
            db.commit()

        # Asegurar que existan productos mock para pruebas de POS
        existing_products = db.query(models.Product).count()
        if existing_products == 0:
            print("Injecting initial mock products for testing...")
            # Buscamos un usuario admin para asignar los productos
            admin = db.query(models.User).filter(models.User.role == 'admin_tienda').first()
            if admin:
                mock_data = [
                    { "id": "00000000-0000-4000-a000-000000000001", "name": "Zapatillas Nitro Pro Max", "price": 250000, "variants": [{ "id": "00000000-0000-4000-b000-000000000001", "name": "Estándar", "stock": 100, "attributes": {"Talla": ["38", "40", "42"], "Color": ["Negro", "Azul"]} }] },
                    { "id": "00000000-0000-4000-a000-000000000002", "name": "Camiseta Oversize Cyber", "price": 85000, "variants": [{ "id": "00000000-0000-4000-b000-000000000002", "name": "Estándar", "stock": 100, "attributes": {"Talla": ["S", "M", "L"], "Color": ["Blanco", "Gris"]} }] },
                    { "id": "00000000-0000-4000-a000-000000000003", "name": "Smartwatch Bayup v2", "price": 450000, "variants": [{ "id": "00000000-0000-4000-b000-000000000003", "name": "Estándar", "stock": 100 }] },
                    { "id": "00000000-0000-4000-a000-000000000004", "name": "Set de Pesas 20kg", "price": 180000, "variants": [{ "id": "00000000-0000-4000-b000-000000000004", "name": "Estándar", "stock": 100 }] }
                ]
                for p_info in mock_data:
                    p = models.Product(id=uuid.UUID(p_info["id"]), name=p_info["name"], price=p_info["price"], owner_id=admin.id, description="Demo product")
                    db.add(p)
                    for v_info in p_info["variants"]:
                        v = models.ProductVariant(id=uuid.UUID(v_info["id"]), product_id=p.id, name=v_info["name"], stock=v_info["stock"], attributes=v_info.get("attributes"))
                        db.add(v)
                db.commit()
                print("Mock products injected successfully.")

    except Exception as e:
        print(f"General Startup Error: {e}")
    finally:
        db.close()
    yield

app = FastAPI(title="BaseCommerce API", lifespan=lifespan)

# Global Exception Handler to fix CORS on 500 errors
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

@app.post("/auth/clerk-login")
async def clerk_login(request: schemas.ClerkLoginRequest, db: Session = Depends(get_db)):
    try:
        clerk_user_info = await clerk_auth_service.verify_clerk_token(request.clerk_token)
        email = clerk_user_info.get("email")
        if not email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Clerk token does not contain email")
        
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if not user:
            # Create user explicitly and commit to local DB
            hashed_password = security.get_password_hash(str(uuid.uuid4()))
            default_plan = crud.get_default_plan(db)
            user = models.User(
                id=uuid.uuid4(),
                email=email,
                full_name=clerk_user_info.get("full_name", "Clerk User"),
                hashed_password=hashed_password,
                plan_id=default_plan.id if default_plan else None,
                role="admin_tienda",
                status="Activo"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        access_token = security.create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        db.rollback()
        # Return 401 instead of 500 for validation errors as requested
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Clerk login error: {str(e)}")

@app.get("/auth/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(security.get_current_user)):
    return current_user

# --- Products ---

@app.get("/products", response_model=List[schemas.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    return crud.get_products_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)

@app.post("/products", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    return crud.create_product(db=db, product=product, owner_id=current_user.id)

# --- Public Store ---

@app.get("/public/stores/{tenant_id}/products", response_model=List[schemas.Product])
def read_public_products(tenant_id: uuid.UUID, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_all_products(db, tenant_id=tenant_id, skip=skip, limit=limit)

@app.get("/public/stores/{tenant_id}/products/{product_id}", response_model=schemas.Product)
def read_public_product(tenant_id: uuid.UUID, product_id: uuid.UUID, db: Session = Depends(get_db)):
    p = crud.get_product(db, product_id=product_id, tenant_id=tenant_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found or does not belong to this store")
    return p

# --- Orders ---

@app.post("/orders", response_model=schemas.Order)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    return crud.create_order(db=db, order=order, customer_id=current_user.id)

@app.get("/orders", response_model=List[schemas.Order])
def read_orders(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    return crud.get_orders_by_customer(db, customer_id=current_user.id)

# --- Admin / Customers / Sync ---

@app.post("/admin/customers/sync")
def sync_customer(data: schemas.CustomerSync, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    # Look for existing customer by phone or email
    customer = None
    if data.email:
        customer = db.query(models.User).filter(models.User.email == data.email).first()
    if not customer and data.phone:
        customer = db.query(models.User).filter(models.User.nickname == data.phone).first() # Using nickname for phone storage consistency in this context

    if not customer:
        # Create new customer user
        customer = models.User(
            id=uuid.uuid4(),
            email=data.email or f"anon_{uuid.uuid4().hex[:8]}@bayup.com",
            full_name=data.name,
            nickname=data.phone,
            hashed_password="pos_generated_user", # Placeholder
            role="cliente",
            status="Activo",
            loyalty_points=data.points_to_add,
            total_spent=data.last_purchase_amount,
            last_purchase_date=data.last_purchase_date,
            last_purchase_summary=data.last_purchase_summary
        )
        db.add(customer)
    else:
        # Update existing
        customer.loyalty_points = (customer.loyalty_points or 0) + data.points_to_add
        customer.total_spent = (customer.total_spent or 0.0) + data.last_purchase_amount
        customer.last_purchase_date = data.last_purchase_date
        customer.last_purchase_summary = data.last_purchase_summary
        if data.name: customer.full_name = data.name
        if data.phone: customer.nickname = data.phone

    db.commit()
    return {"status": "success", "customer_id": customer.id}

@app.get("/admin/users", response_model=List[schemas.User])
def get_all_users(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    # Solo devolvemos personal de staff/admin, excluyendo a los clientes
    return db.query(models.User).filter(models.User.role != 'cliente').all()

@app.get("/admin/roles", response_model=List[schemas.CustomRole])
def get_roles(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    return db.query(models.CustomRole).filter(models.CustomRole.owner_id == current_user.id).all()

@app.get("/collections", response_model=List[schemas.Collection])
def get_collections(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    return crud.get_collections_by_owner(db, owner_id=current_user.id)

@app.post("/collections", response_model=schemas.Collection)
def create_collection(collection: schemas.CollectionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    return crud.create_collection(db=db, collection=collection, owner_id=current_user.id)

@app.get("/expenses", response_model=List[schemas.Expense])
def get_expenses(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    return db.query(models.Expense).filter(models.Expense.tenant_id == current_user.id).all()

@app.get("/receivables", response_model=List[schemas.Receivable])
def get_receivables(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    return db.query(models.Receivable).filter(models.Receivable.tenant_id == current_user.id).all()

@app.get("/ai-assistants", response_model=List[schemas.AIAssistant])
def get_assistants(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    return db.query(models.AIAssistant).filter(models.AIAssistant.owner_id == current_user.id).all()

@app.get("/pages", response_model=List[schemas.Page])
def get_pages(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    return db.query(models.Page).filter(models.Page.owner_id == current_user.id).all()

# --- Payments ---

@app.post("/payments/create-preference/{order_id}")
def create_payment_preference(order_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    try:
        order = db.query(models.Order).filter(models.Order.id == order_id).first()
        if not order: 
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Recover seller (tenant) access_token validation
        tenant = db.query(models.User).filter(models.User.id == order.tenant_id).first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Seller (tenant) not found")
            
        pref = payment_service.create_mp_preference(db, order.id, current_user.email, order.tenant_id)
        
        if not pref or "id" not in pref:
            raise HTTPException(status_code=500, detail="Failed to create Mercado Pago preference")

        return {
            "preference_id": pref.get("id"),
            "init_point": pref.get("init_point")
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Payment Error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Payment Error: {str(e)}")

@app.post("/payments/webhook")
async def mercadopago_webhook(request: Request, db: Session = Depends(get_db)):
    topic = request.query_params.get("topic")
    payment_id = request.query_params.get("id")
    if not topic or not payment_id:
        return JSONResponse(status_code=400, content={"status": "error", "message": "Invalid notification format"})
    
    if topic == "payment":
        try:
            # Payment_id represents the order_id in our simplified webhook logic
            order_uuid = uuid.UUID(payment_id)
            order = db.query(models.Order).filter(models.Order.id == order_uuid).first()
            if order:
                # Update status to completed
                order.status = "completed"
                
                # Logic for commission calculation
                tenant = db.query(models.User).filter(models.User.id == order.tenant_id).first()
                if tenant and tenant.plan:
                    commission_amount = order.total_price * tenant.plan.commission_rate
                    print(f"Commission calculated: {commission_amount}")
                
                db.add(order)
                db.commit() # FINAL COMMIT for persistence
                db.refresh(order)
                
                msg = f"Payment notification for Order ID: {order.id} received. Status updated to 'completed'."
                return {"status": "success", "message": msg}
        except Exception as e:
            db.rollback()
            print(f"Webhook Error: {e}")
            
    return {"status": "success", "message": "Webhook received"}

# --- Plans ---

@app.post("/plans", response_model=schemas.Plan)
def create_plan(plan: schemas.PlanCreate, db: Session = Depends(get_db)):
    return crud.create_plan(db=db, plan=plan)

@app.get("/plans", response_model=List[schemas.Plan])
def read_plans(db: Session = Depends(get_db)):
    return db.query(models.Plan).all()

# --- S3 ---

@app.post("/products/upload-url")
def create_upload_url(file_type: str, current_user: models.User = Depends(security.get_current_user)):
    return s3_service.create_presigned_upload_url(file_type)

@app.get("/analytics/opportunities")
def get_opportunities(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    """
    Analiza 'tendencias de mercado' vs 'inventario actual' para detectar oportunidades.
    Simula una detección de demanda no cubierta.
    """
    products = crud.get_products_by_owner(db, owner_id=current_user.id)
    product_text = " ".join([p.name.lower() + " " + (p.description or "").lower() for p in products])
    
    market_trends = [
        {"term": "zapatillas urbanas", "volume": 1450, "potential": 3200000, "action": "Importar Zapatillas"},
        {"term": "audifonos inalambricos", "volume": 980, "potential": 1500000, "action": "Crear Oferta Tech"},
        {"term": "skincare coreano", "volume": 2100, "potential": 4800000, "action": "Buscar Proveedor Belleza"},
        {"term": "termos motivacionales", "volume": 350, "potential": 450000, "action": "Agregar a Catálogo Hogar"}
    ]
    
    opportunities = []
    for trend in market_trends:
        if trend["term"] not in product_text:
            opportunities.append(trend)
            
    return opportunities[:4]

@app.get("/")
def read_root(): return {"message": "Welcome to BaseCommerce API"}
