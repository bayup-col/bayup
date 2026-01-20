from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
import uuid

from . import crud, models, schemas, security, s3_service, payment_service
from .database import SessionLocal, engine, get_db

# Create all tables in the database.
# This is simple for now. For production, you would use Alembic migrations.
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="BaseCommerce API")


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


# --- Product Endpoints ---

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
        preference = payment_service.create_mp_preference(db, order_id, current_user.email)
        return {"preference_id": preference["id"], "init_point": preference["init_point"]}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating payment preference: {e}")

@app.post("/payments/webhook")
async def mercadopago_webhook(request: Request, db: Session = Depends(get_db)):
    # Mercado Pago sends notifications as query parameters and/or POST body
    # For now, we'll focus on the 'topic' and 'id' in query params as per MP docs
    topic = request.query_params.get("topic")
    payment_id = request.query_params.get("id")

    if not topic or not payment_id:
        # Also check for body for different notification types if needed
        # For 'payment' topic, usually 'id' is enough to fetch details
        return {"status": "error", "message": "Invalid notification format"}, 400

    if topic == "payment":
        # Fetch payment details from Mercado Pago API
        # This requires the MP SDK to fetch payment details using the payment_id
        # For simplicity, we are not implementing the full MP SDK fetch here.
        # In a real app, you would fetch the payment and update your order status.
        print(f"Received payment notification for ID: {payment_id}")
        # Example: Update order status in DB based on payment_id/external_reference
        # db_order = db.query(models.Order).filter(models.Order.mercadopago_id == payment_id).first()
        # if db_order:
        #    db_order.status = "paid" if payment_status == "approved" else "failed"
        #    db.commit()

        # For now, we'll just log and return success
        return {"status": "success", "message": f"Payment notification for ID {payment_id} received and processed (dummy)"}
    
    return {"status": "success", "message": f"Webhook received for topic {topic}, ID {payment_id} (ignored)"}


# --- Root Endpoint ---

@app.get("/")
def read_root():
    return {"message": "BaseCommerce API is running"}
