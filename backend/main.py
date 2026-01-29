from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, text
import datetime
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

# Forzar creación de tablas en cada inicio
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="BaseCommerce API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def create_default_plan():
    db = SessionLocal()
    try:
        if not crud.get_default_plan(db):
            crud.create_plan(
                db=db,
                plan=schemas.PlanCreate(
                    name="Free Tier",
                    description="Default free plan",
                    commission_rate=0.10,
                    monthly_fee=0.0,
                    is_default=True,
                ),
            )
            db.commit()
    except Exception as e:
        print(f"Startup error: {e}")
    finally:
        db.close()

# --- Auth ---

@app.post("/auth/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/auth/login")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"access_token": security.create_access_token(data={"sub": user.email}), "token_type": "bearer"}

@app.post("/auth/clerk-login")
async def clerk_login_for_access_token(request: schemas.ClerkLoginRequest, db: Session = Depends(get_db)):
    clerk_user_info = await clerk_auth_service.verify_clerk_token(request.clerk_token)
    email = clerk_user_info["email"]
    user = crud.get_user_by_email(db, email=email)
    if not user:
        user = crud.create_user(db=db, user=schemas.UserCreate(email=email, full_name=clerk_user_info.get("full_name", "Clerk User"), password=str(uuid.uuid4())))
        db.add(user)
        db.commit()
        db.refresh(user)
    return {"access_token": security.create_access_token(data={"sub": user.email}), "token_type": "bearer"}

# --- Products ---

@app.get("/products", response_model=List[schemas.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    return crud.get_products_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)

@app.post("/products", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    return crud.create_product(db=db, product=product, owner_id=current_user.id)

@app.get("/public/stores/{tenant_id}/products", response_model=List[schemas.Product])
def read_public_products(tenant_id: uuid.UUID, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # CORRECCIÓN: Pasar skip y limit al CRUD
    return crud.get_all_products(db, tenant_id=tenant_id, skip=skip, limit=limit)

@app.get("/public/stores/{tenant_id}/products/{product_id}", response_model=schemas.Product)
def read_public_product(tenant_id: uuid.UUID, product_id: uuid.UUID, db: Session = Depends(get_db)):
    p = crud.get_product(db, product_id=product_id, tenant_id=tenant_id)
    if not p: raise HTTPException(status_code=404, detail="Product not found or does not belong to this store")
    return p

# --- Payments & Webhooks ---

@app.post("/payments/create-preference/{order_id}")
def create_payment_preference(order_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    try:
        order = db.query(models.Order).filter(models.Order.id == order_id).first()
        if not order: raise HTTPException(status_code=404, detail="Order not found")
        pref = payment_service.create_mp_preference(db, order.id, current_user.email, order.tenant_id)
        # Retorno compatible con el test
        return {"preference_id": pref.get("id"), "init_point": pref.get("init_point")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/payments/webhook")
async def mercadopago_webhook(request: Request, db: Session = Depends(get_db)):
    topic = request.query_params.get("topic")
    payment_id = request.query_params.get("id")
    if not topic or not payment_id:
        return JSONResponse(status_code=400, content={"status": "error", "message": "Invalid notification format"})
    if topic == "payment":
        try:
            order_uuid = uuid.UUID(payment_id)
            order = db.query(models.Order).filter(models.Order.id == order_uuid).first()
            if order:
                order.status = "completed"
                db.add(order)
                db.commit()
                db.refresh(order)
                return {"status": "success", "message": f"Payment notification for Order ID: {order.id} received. Status updated to 'completed'."}
        except:
            pass
    return {"status": "success", "message": "Webhook received"}

# --- Otros ---
@app.post("/orders", response_model=schemas.Order)
def create_order(order: schemas.OrderCreate, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(get_db)):
    return crud.create_order(db=db, order=order, customer_id=current_user.id)

@app.get("/orders", response_model=List[schemas.Order])
def read_orders(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(get_db)):
    return crud.get_orders_by_customer(db, customer_id=current_user.id)

@app.post("/plans", response_model=schemas.Plan)
def create_plan(plan: schemas.PlanCreate, db: Session = Depends(get_db)):
    return crud.create_plan(db=db, plan=plan)

@app.get("/plans", response_model=List[schemas.Plan])
def read_plans(db: Session = Depends(get_db)):
    return db.query(models.Plan).all()

@app.post("/products/upload-url")
def create_upload_url(file_type: str, current_user: models.User = Depends(security.get_current_user)):
    return s3_service.create_presigned_upload_url(file_type)

@app.get("/")
def root(): return {"message": "API Active"}