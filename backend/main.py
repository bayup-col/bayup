from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, text
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
    # Startup: Initialize tables and default plan
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not crud.get_default_plan(db):
            crud.create_plan(db=db, plan=schemas.PlanCreate(name="Free", description="Default", commission_rate=0.1, monthly_fee=0, is_default=True))
            db.commit()
    except Exception as e:
        print(f"Error during startup: {e}")
        db.rollback()
    finally:
        db.close()
    yield
    # Shutdown logic (if any) can go here

app = FastAPI(title="BaseCommerce API", lifespan=lifespan)

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
