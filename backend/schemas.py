# backend/schemas.py
from pydantic import BaseModel, EmailStr
import uuid

# --- User Schemas ---

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str

# Properties to return to client
class User(UserBase):
    id: uuid.UUID

    class Config:
        orm_mode = True

# Properties stored in DB
class UserInDB(UserBase):
    hashed_password: str

# --- Product Schemas ---

class ProductBase(BaseModel):
    name: str
    description: str | None = None
    price: float
    stock: int

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    image_url: str | None = None

    class Config:
        orm_mode = True
