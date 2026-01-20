from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

from . import crud, models, schemas, security, s3_service
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


# --- Root Endpoint ---

@app.get("/")
def read_root():
    return {"message": "BaseCommerce API is running"}
