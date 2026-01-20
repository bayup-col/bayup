from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
import uuid
from starlette.responses import RedirectResponse

from . import crud, models, schemas, security, s3_service, payment_service, clerk_auth_service
from .database import SessionLocal, engine, get_db

# Create all tables in the database.
# This is simple for now. For production, you would use Alembic migrations.
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="BaseCommerce API")

# Startup event to ensure a default plan exists
@app.on_event("startup")
def create_default_plan():
    db = SessionLocal()
    try:
        if not crud.get_default_plan(db):
            print("Creating default plan...")
            crud.create_plan(
                db=db,
                plan=schemas.PlanCreate(
                    name="Free Tier",
                    description="Default free plan with basic features.",
                    commission_rate=0.10, # 10% commission
                    monthly_fee=0.0,
                    is_default=True,
                ),
            )
            db.commit()
            print("Default plan created.")
    except Exception as e:
        print(f"Error creating default plan: {e}")
        db.rollback()
    finally:
        db.close()


# --- Authentication Endpoints ---

@app.post("/auth/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)


@app.post("/auth/login")
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/auth/clerk-login")
async def clerk_login_for_access_token(
    request: schemas.ClerkLoginRequest, db: Session = Depends(get_db)
):
    clerk_user_info = await clerk_auth_service.verify_clerk_token(request.clerk_token)
    
    # Try to find user in our DB by email
    user = crud.get_user_by_email(db, email=clerk_user_info["email"])

    if not user:
        # If user doesn't exist, create a new one (without password, as Clerk handles it)
        # Note: A real implementation might require a more robust user linking strategy.
        user = crud.create_user(
            db=db,
            user=schemas.UserCreate(
                email=clerk_user_info["email"],
                full_name=clerk_user_info.get("full_name"),
                password=str(uuid.uuid4()) # Dummy password, not used for login directly
            )
        )
    
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# --- Protected Product Endpoints ---

@app.post("/products", response_model=schemas.Product)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    return crud.create_product(db=db, product=product, owner_id=current_user.id)


@app.get("/products", response_model=List[schemas.Product])
def read_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    products = crud.get_products_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return products


# --- Public Store Endpoints (for customers) ---

@app.get("/public/stores/{tenant_id}/products", response_model=List[schemas.Product])
def read_all_tenant_products(
    tenant_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    products = crud.get_all_products(db, tenant_id=tenant_id, skip=skip, limit=limit)
    return products

@app.get("/public/stores/{tenant_id}/products/{product_id}", response_model=schemas.Product)
def read_tenant_product(
    tenant_id: uuid.UUID,
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    product = crud.get_product(db, product_id=product_id, tenant_id=tenant_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found or does not belong to this store")
    return product


# --- S3 Upload Endpoint ---
@app.post("/products/upload-url")
def create_upload_url(
    file_type: str, current_user: models.User = Depends(security.get_current_user)
):
    presigned_url_data = s3_service.create_presigned_upload_url(file_type)
    if not presigned_url_data:
        raise HTTPException(status_code=500, detail="Could not generate upload URL")
    return presigned_url_data


# --- Order Endpoints ---

@app.post("/orders", response_model=schemas.Order)
def create_order(
    order: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    return crud.create_order(db=db, order=order, customer_id=current_user.id)

@app.get("/orders", response_model=List[schemas.Order])
def read_orders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    orders = crud.get_orders_by_customer(db, customer_id=current_user.id, skip=skip, limit=limit)
    return orders


# --- Payment Endpoints (Mercado Pago) ---

@app.post("/payments/create-preference/{order_id}")
def create_payment_preference(
    order_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    try:
        # Fetch the order to get its tenant_id
        order = db.query(models.Order).filter(models.Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        preference = payment_service.create_mp_preference(db, order_id, current_user.email, order.tenant_id)
        return {"preference_id": preference["id"], "init_point": preference["init_point"]}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating payment preference: {e}")

@app.post("/payments/webhook")
async def mercadopago_webhook(request: Request, db: Session = Depends(get_db)):
    topic = request.query_params.get("topic")
    payment_id = request.query_params.get("id")

    if not topic or not payment_id:
        return {"status": "error", "message": "Invalid notification format"}, 400

    if topic == "payment":
        # In a real scenario, you'd fetch payment details from MP API using payment_id
        # For this MVP, we will simulate fetching the order and applying commission.
        # We need the external_reference (our order ID) from the payment details.
        # Let's assume we can get this from the notification or from an MP API call.

        # For MVP, simulate fetching the order based on a hypothetical external_reference from MP
        # In a full implementation, you'd parse MP's full notification body or call their API
        
        # --- Simulate fetching payment details and metadata from Mercado Pago ---
        # If we had the actual preference object or full notification, we'd get metadata.
        # For now, let's just use the order.id from external_reference for lookup
        
        # In a real scenario, you would fetch payment data from MP
        # payment_info = payment_service.sdk.payment().get(payment_id)
        # external_reference = payment_info["response"]["external_reference"]
        # tenant_id_from_mp = payment_info["response"]["metadata"]["tenant_id"] if "metadata" in payment_info["response"] else None
        
        # For simplicity, let's assume external_reference is available and tenant_id
        # is also somehow recoverable or tied to the order.
        
        # Find the order by payment_id as external_reference (this needs to be adjusted in a real scenario)
        order = db.query(models.Order).filter(models.Order.id == uuid.UUID(payment_id)).first() # Simplification
        if not order:
            print(f"Order not found for payment ID: {payment_id}")
            raise HTTPException(status_code=404, detail="Order not found for this payment")

        # Get the tenant's plan
        tenant = db.query(models.User).filter(models.User.id == order.tenant_id).options(joinedload(models.User.plan)).first()
        if not tenant or not tenant.plan:
            print(f"Tenant or tenant's plan not found for order {order.id}")
            raise HTTPException(status_code=500, detail="Tenant or tenant's plan not found")

        commission_rate = tenant.plan.commission_rate
        platform_commission = order.total_price * commission_rate
        net_to_tenant = order.total_price - platform_commission

        # Update order status (simulated as "completed" for approved payments)
        order.status = "completed" # Assuming payment was approved
        db.add(order)
        db.commit()
        db.refresh(order)

        print(f"Payment notification for Order ID: {order.id} received. Status updated to 'completed'.")
        print(f"Order Total: {order.total_price:.2f}, Commission Rate: {commission_rate:.2%}, Platform Commission: {platform_commission:.2f}, Net to Tenant: {net_to_tenant:.2f}")

        return {"status": "success", "message": f"Payment notification for ID {payment_id} processed for order {order.id}"}
    
    return {"status": "success", "message": f"Webhook received for topic {topic}, ID {payment_id} (ignored)"}


# --- Root Endpoint ---

@app.get("/")
def read_root():
    return {"message": "Welcome to BaseCommerce API. Please use /public/stores/{tenant_id}/products or /dashboard."}


# --- Plan Endpoints ---
@app.post("/plans", response_model=schemas.Plan)
def create_plan(
    plan: schemas.PlanCreate,
    db: Session = Depends(get_db),
    # For MVP, no admin check yet. In future: Depends(security.get_super_admin_user)
):
    db_plan = crud.create_plan(db=db, plan=plan)
    return db_plan

@app.get("/plans", response_model=List[schemas.Plan])
def read_plans(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    # For MVP, no admin check yet. In future: Depends(security.get_super_admin_user)
):
    plans = db.query(models.Plan).offset(skip).limit(limit).all()
    return plans