from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from datetime import timedelta
from typing import List, Optional
import uuid
from starlette.responses import RedirectResponse

from database import SessionLocal, engine, get_db
import crud
import models
import schemas
import security
import s3_service
import payment_service
import clerk_auth_service
import ai_service

# Create all tables in the database.
# This is simple for now. For production, you would use Alembic migrations.
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="BaseCommerce API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        
        # Create default product types
        product_types = [
            {
                "name": "Tecnología",
                "description": "Productos electrónicos y de tecnología",
                "attributes": [
                    {"name": "Marca", "attribute_type": "select", "options": ["Apple", "Samsung", "LG", "Sony", "Otro"]},
                    {"name": "Capacidad", "attribute_type": "select", "options": ["64GB", "128GB", "256GB", "512GB", "1TB"]},
                    {"name": "Color", "attribute_type": "select", "options": ["Negro", "Blanco", "Plata", "Oro", "Azul", "Rojo"]},
                ]
            },
            {
                "name": "Ropa",
                "description": "Prendas de vestir y accesorios",
                "attributes": [
                    {"name": "Talla", "attribute_type": "select", "options": ["XS", "S", "M", "L", "XL", "2XL", "3XL"]},
                    {"name": "Color", "attribute_type": "select", "options": ["Negro", "Blanco", "Azul", "Rojo", "Verde", "Amarillo", "Rosa"]},
                    {"name": "Material", "attribute_type": "select", "options": ["Algodón", "Poliéster", "Lana", "Seda", "Mezcla"]},
                ]
            },
            {
                "name": "Otro",
                "description": "Otros tipos de productos",
                "attributes": [
                    {"name": "Variante", "attribute_type": "text", "options": None},
                ]
            }
        ]
        
        for product_type_data in product_types:
            if not crud.get_product_type_by_name(db, product_type_data["name"]):
                print(f"Creating product type: {product_type_data['name']}")
                db_product_type = models.ProductType(
                    name=product_type_data["name"],
                    description=product_type_data["description"]
                )
                db.add(db_product_type)
                db.flush()
                
                for attr_data in product_type_data["attributes"]:
                    db_attribute = models.ProductAttribute(
                        product_type_id=db_product_type.id,
                        name=attr_data["name"],
                        attribute_type=attr_data["attribute_type"],
                        options=attr_data["options"]
                    )
                    db.add(db_attribute)
                
                db.commit()
                print(f"Product type {product_type_data['name']} created with attributes.")
        
    except Exception as e:
        print(f"Error during startup: {e}")
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


@app.get("/auth/me", response_model=schemas.User)
def get_current_user_info(
    current_user: models.User = Depends(security.get_current_user)
):
    """Get current user information including role"""
    return current_user


@app.put("/auth/update-bank-accounts")
def update_bank_accounts(
    data: schemas.BankAccountsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Update current user's bank accounts"""
    current_user.bank_accounts = data.bank_accounts
    db.commit()
    return {"message": "Bank accounts updated successfully", "bank_accounts": current_user.bank_accounts}


@app.put("/auth/update-social-links")
def update_social_links(
    data: schemas.SocialLinksUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Update current user's social media links"""
    current_user.social_links = data.social_links
    db.commit()
    return {"message": "Social links updated successfully", "social_links": current_user.social_links}


@app.put("/auth/update-whatsapp-lines")
def update_whatsapp_lines(
    data: schemas.WhatsAppLinesUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Update current user's WhatsApp lines"""
    current_user.whatsapp_lines = data.whatsapp_lines
    db.commit()
    return {"message": "WhatsApp lines updated successfully", "whatsapp_lines": current_user.whatsapp_lines}


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
    tax_rate_id: uuid.UUID | None = None,
    shipping_option_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    return crud.create_order(
        db=db,
        order=order,
        customer_id=current_user.id,
        tax_rate_id=tax_rate_id,
        shipping_option_id=shipping_option_id,
    )

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
    current_user: models.User = Depends(security.get_super_admin_user), # Protected
):
    db_plan = crud.create_plan(db=db, plan=plan)
    return db_plan

@app.get("/plans", response_model=List[schemas.Plan])
def read_plans(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_super_admin_user), # Protected
):
    plans = db.query(models.Plan).offset(skip).limit(limit).all()
    return plans


# --- Page Endpoints (Protected for owners) ---

@app.post("/pages", response_model=schemas.Page)
def create_page(
    page: schemas.PageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    # Check for duplicate slug for this owner
    existing_page = crud.get_page_by_slug(db, slug=page.slug, owner_id=current_user.id)
    if existing_page:
        raise HTTPException(status_code=400, detail="Page with this slug already exists for your store.")
    return crud.create_page(db=db, page=page, owner_id=current_user.id)

@app.get("/pages", response_model=List[schemas.Page])
def read_pages(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    pages = crud.get_pages_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return pages

@app.get("/pages/{page_id}", response_model=schemas.Page)
def read_page(
    page_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    page = crud.get_page(db, page_id=page_id, owner_id=current_user.id)
    if page is None:
        raise HTTPException(status_code=404, detail="Page not found or does not belong to your store.")
    return page

@app.put("/pages/{page_id}", response_model=schemas.Page)
def update_page(
    page_id: uuid.UUID,
    page_update: schemas.PageUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    db_page = crud.get_page(db, page_id=page_id, owner_id=current_user.id)
    if db_page is None:
        raise HTTPException(status_code=404, detail="Page not found or does not belong to your store.")
    return crud.update_page(db=db, db_page=db_page, page_update=page_update)

@app.delete("/pages/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_page(
    page_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    db_page = crud.get_page(db, page_id=page_id, owner_id=current_user.id)
    if db_page is None:
        raise HTTPException(status_code=404, detail="Page not found or does not belong to your store.")
    crud.delete_page(db=db, db_page=db_page)
    return {"ok": True}


# --- Public Page Endpoints (for customers) ---

@app.get("/public/stores/{tenant_id}/pages/{page_slug}", response_model=schemas.Page)
def read_public_page_by_slug(
    tenant_id: uuid.UUID,
    page_slug: str,
    db: Session = Depends(get_db),
):
    page = crud.get_page_by_slug(db, slug=page_slug, owner_id=tenant_id)
    if page is None:
        raise HTTPException(status_code=404, detail="Page not found for this store.")
    return page


# --- Tax Rate Endpoints (Protected for owners) ---

@app.post("/taxes", response_model=schemas.TaxRate)
def create_tax_rate(
    tax_rate: schemas.TaxRateCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    return crud.create_tax_rate(db=db, tax_rate=tax_rate, owner_id=current_user.id)

@app.get("/taxes", response_model=List[schemas.TaxRate])
def read_tax_rates(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    tax_rates = crud.get_all_tax_rates_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return tax_rates

@app.get("/taxes/{tax_rate_id}", response_model=schemas.TaxRate)
def read_tax_rate(
    tax_rate_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    tax_rate = crud.get_tax_rate(db, tax_rate_id=tax_rate_id, owner_id=current_user.id)
    if tax_rate is None:
        raise HTTPException(status_code=404, detail="Tax rate not found or does not belong to your store.")
    return tax_rate

@app.put("/taxes/{tax_rate_id}", response_model=schemas.TaxRate)
def update_tax_rate(
    tax_rate_id: uuid.UUID,
    tax_rate_update: schemas.TaxRateUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    db_tax_rate = crud.get_tax_rate(db, tax_rate_id=tax_rate_id, owner_id=current_user.id)
    if db_tax_rate is None:
        raise HTTPException(status_code=404, detail="Tax rate not found or does not belong to your store.")
    return crud.update_tax_rate(db=db, db_tax_rate=db_tax_rate, tax_rate_update=tax_rate_update)

@app.delete("/taxes/{tax_rate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tax_rate(
    tax_rate_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    db_tax_rate = crud.get_tax_rate(db, tax_rate_id=tax_rate_id, owner_id=current_user.id)
    if db_tax_rate is None:
        raise HTTPException(status_code=404, detail="Tax rate not found or does not belong to your store.")
    crud.delete_tax_rate(db=db, db_tax_rate=db_tax_rate)
    return {"ok": True}


# --- Public Tax Rate Endpoints (for customers) ---

@app.get("/public/stores/{tenant_id}/taxes", response_model=List[schemas.TaxRate])
def read_public_tax_rates(
    tenant_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    tax_rates = crud.get_all_tax_rates_by_owner(db, owner_id=tenant_id, skip=skip, limit=limit)
    return tax_rates

@app.get("/public/stores/{tenant_id}/taxes/default", response_model=schemas.TaxRate)
def read_public_default_tax_rate(
    tenant_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    tax_rate = crud.get_default_tax_rate_by_owner(db, owner_id=tenant_id)
    if tax_rate is None:
        raise HTTPException(status_code=404, detail="Default tax rate not found for this store.")
    return tax_rate


# --- Shipping Option Endpoints (Protected for owners) ---

@app.post("/shipping", response_model=schemas.ShippingOption)
def create_shipping_option(
    shipping_option: schemas.ShippingOptionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    return crud.create_shipping_option(db=db, shipping_option=shipping_option, owner_id=current_user.id)

@app.get("/shipping", response_model=List[schemas.ShippingOption])
def read_shipping_options(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    shipping_options = crud.get_all_shipping_options_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return shipping_options

@app.get("/shipping/{shipping_option_id}", response_model=schemas.ShippingOption)
def read_shipping_option(
    shipping_option_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    shipping_option = crud.get_shipping_option(db, shipping_option_id=shipping_option_id, owner_id=current_user.id)
    if shipping_option is None:
        raise HTTPException(status_code=404, detail="Shipping option not found or does not belong to your store.")
    return shipping_option

@app.put("/shipping/{shipping_option_id}", response_model=schemas.ShippingOption)
def update_shipping_option(
    shipping_option_id: uuid.UUID,
    shipping_option_update: schemas.ShippingOptionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    db_shipping_option = crud.get_shipping_option(db, shipping_option_id=shipping_option_id, owner_id=current_user.id)
    if db_shipping_option is None:
        raise HTTPException(status_code=404, detail="Shipping option not found or does not belong to your store.")
    return crud.update_shipping_option(db=db, db_shipping_option=db_shipping_option, shipping_option_update=shipping_option_update)

@app.delete("/shipping/{shipping_option_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shipping_option(
    shipping_option_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    db_shipping_option = crud.get_shipping_option(db, shipping_option_id=shipping_option_id, owner_id=current_user.id)
    if db_shipping_option is None:
        raise HTTPException(status_code=404, detail="Shipping option not found or does not belong to your store.")
    crud.delete_shipping_option(db=db, db_shipping_option=db_shipping_option)
    return {"ok": True}


# --- ProductType Endpoints ---

@app.get("/product-types", response_model=List[schemas.ProductType])
def get_product_types(db: Session = Depends(get_db)):
    """Get all product types with their attributes"""
    return crud.get_all_product_types(db)

@app.get("/product-types/{product_type_id}", response_model=schemas.ProductType)
def get_product_type(product_type_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a specific product type with its attributes"""
    db_product_type = crud.get_product_type(db, product_type_id=product_type_id)
    if db_product_type is None:
        raise HTTPException(status_code=404, detail="Product type not found")
    return db_product_type


# --- Admin Endpoints ---

@app.post("/admin/update-role")
def update_user_role(
    email: str = None,
    new_role: str = None,
    db: Session = Depends(get_db)
):
    """Update user role - for development/admin purposes"""
    if not email or not new_role:
        raise HTTPException(status_code=400, detail="email and new_role are required")
    
    user = crud.get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate role
    valid_roles = ["admin_tienda", "super_admin"]
    if new_role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")
    
    user.role = new_role
    db.commit()
    db.refresh(user)
    return {"message": f"User role updated to {new_role}", "user": {"email": user.email, "id": str(user.id), "role": user.role}}


@app.get("/admin/users", response_model=List[schemas.User])
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    current_user: schemas.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all users - only accessible by super_admin"""
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admins can access this endpoint")
    
    users = crud.get_all_users(db, skip=skip, limit=limit)
    return users


# --- Public Shipping Option Endpoints (for customers) ---

@app.get("/public/stores/{tenant_id}/shipping", response_model=List[schemas.ShippingOption])
def read_public_shipping_options(
    tenant_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    shipping_options = crud.get_all_shipping_options_by_owner(db, owner_id=tenant_id, skip=skip, limit=limit)
    return shipping_options

# --- AIAssistant Endpoints ---

@app.post("/ai-assistants", response_model=schemas.AIAssistant)
def create_assistant(
    assistant: schemas.AIAssistantCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    db_assistant = crud.create_assistant(db=db, assistant=assistant, owner_id=current_user.id)
    return db_assistant

@app.get("/ai-assistants", response_model=List[schemas.AIAssistant])
def read_assistants(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    assistants = crud.get_assistants_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return assistants

@app.put("/ai-assistants/{assistant_id}/status", response_model=schemas.AIAssistant)
def update_assistant_status(
    assistant_id: uuid.UUID,
    status: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    db_assistant = crud.get_assistant(db, assistant_id=assistant_id, owner_id=current_user.id)
    if not db_assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    return crud.update_assistant_status(db, db_assistant=db_assistant, status=status)

# --- Shipment Endpoints ---

@app.get("/shipments", response_model=List[schemas.Shipment])
def read_shipments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    return crud.get_shipments_by_owner(db, current_user.id)

@app.put("/shipments/{shipment_id}/status", response_model=schemas.Shipment)
def update_shipment_status(
    shipment_id: uuid.UUID,
    status: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    db_shipment = crud.get_shipment(db, shipment_id, current_user.id)
    if not db_shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return crud.update_shipment_status(db, db_shipment, status)

@app.put("/orders/{order_id}/status", response_model=schemas.Order)
def update_order_status(
    order_id: uuid.UUID,
    status: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    db_order = db.query(models.Order).filter(models.Order.id == order_id, models.Order.tenant_id == current_user.id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    db_order.status = status
    
    # Automatización: Si el pedido se marca como pagado, crear el envío automáticamente
    if status == "paid":
        # Verificar si ya existe un envío para este pedido
        existing_shipment = db.query(models.Shipment).filter(models.Shipment.order_id == order_id).first()
        if not existing_shipment:
            # En un caso real, obtendríamos los datos de envío de la orden o el cliente
            new_shipment = models.Shipment(
                order_id=order_id,
                status="pending_packing",
                recipient_name=current_user.full_name or "Cliente",
                destination_address="Dirección de prueba", # Esto debería venir de la orden
                tenant_id=current_user.id
            )
            db.add(new_shipment)
            
    db.commit()
    db.refresh(db_order)
    return db_order

@app.delete("/ai-assistants/{assistant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assistant(
    assistant_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    db_assistant = crud.get_assistant(db, assistant_id=assistant_id, owner_id=current_user.id)
    if not db_assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    crud.delete_assistant(db, db_assistant=db_assistant)
    return {"ok": True}

@app.post("/ai/chat")
async def chat_with_bayt(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    messages = payload.get("messages", [])
    return ai_service.process_bayt_chat(db, messages, current_user.id)

@app.get("/ai-assistants/{assistant_id}/logs")
def read_assistant_logs(
    assistant_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    # Verificar que el asistente pertenezca al usuario
    assistant = crud.get_assistant(db, assistant_id=assistant_id, owner_id=current_user.id)
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    
    return crud.get_assistant_logs(db, assistant_id=assistant_id)

# --- Collection Endpoints ---

@app.post("/collections", response_model=schemas.Collection)
def create_collection(
    collection: schemas.CollectionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    return crud.create_collection(db=db, collection=collection, owner_id=current_user.id)

@app.get("/collections", response_model=List[schemas.Collection])
def read_collections(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    collections = crud.get_collections_by_owner(db, owner_id=current_user.id)
    # Enrich with product count
    for col in collections:
        col.product_count = len(col.products)
    return collections

@app.delete("/collections/{collection_id}")
def delete_collection(
    collection_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    db_collection = crud.get_collection(db, collection_id=collection_id, owner_id=current_user.id)
    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    crud.delete_collection(db, db_collection=db_collection)
    return {"ok": True}
    