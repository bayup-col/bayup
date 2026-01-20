# backend/schemas.py
from pydantic import BaseModel, EmailStr
import uuid
import datetime
from typing import List

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

class ProductVariantBase(BaseModel):
    name: str # e.g., "Red, Large"
    sku: str | None = None
    price_adjustment: float = 0.0 # Adjustment to base product price
    stock: int
    image_url: str | None = None

class ProductVariantCreate(ProductVariantBase):
    pass

class ProductVariant(ProductVariantBase):
    id: uuid.UUID
    product_id: uuid.UUID

    class Config:
        orm_mode = True

class ProductBase(BaseModel):
    name: str
    description: str | None = None
    price: float # Base price, variants can adjust
    image_url: str | None = None # Main product image

class ProductCreate(ProductBase):
    variants: List[ProductVariantCreate] # Variants are created along with the product

class Product(ProductBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    variants: List[ProductVariant] = [] # List of associated variants

    class Config:
        orm_mode = True

# --- Order Schemas ---

class OrderItemBase(BaseModel):
    product_variant_id: uuid.UUID # Reference variant instead of product
    quantity: int

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: uuid.UUID
    price_at_purchase: float # Price at the time of purchase
    # You might want to include product variant details here for historical data
    # product_variant: ProductVariant # Eager load for full details

    class Config:
        orm_mode = True

class OrderBase(BaseModel):
    pass

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class Order(OrderBase):
    id: uuid.UUID
    customer_id: uuid.UUID
    tenant_id: uuid.UUID
    tax_rate_id: uuid.UUID | None = None
    tax_rate_snapshot: float | None = None
    shipping_option_id: uuid.UUID | None = None
    shipping_cost_snapshot: float | None = None
    total_price: float
    status: str
    created_at: datetime.datetime
    items: List[OrderItem] = []

    class Config:
        orm_mode = True

# --- Clerk Integration Schemas ---
class ClerkLoginRequest(BaseModel):
    clerk_token: str

# --- Plan Schemas ---
class PlanBase(BaseModel):
    name: str
    description: str | None = None
    commission_rate: float
    monthly_fee: float
    is_default: bool = False

class PlanCreate(PlanBase):
    pass

class Plan(PlanBase):
    id: uuid.UUID

    class Config:
        orm_mode = True

# For updating a user's plan
class UserUpdatePlan(BaseModel):
    plan_id: uuid.UUID

# --- Page Schemas ---
from typing import Dict, Any

class PageBase(BaseModel):
    slug: str
    title: str | None = None
    content: Dict[str, Any] | None = None # Flexible JSON content

class PageCreate(PageBase):
    pass

class PageUpdate(BaseBase): # PageUpdate might not need slug or title, just content or partial update
    slug: str | None = None
    title: str | None = None
    content: Dict[str, Any] | None = None

class Page(PageBase):
    id: uuid.UUID
    owner_id: uuid.UUID

    class Config:
        orm_mode = True

# --- TaxRate Schemas ---
class TaxRateBase(BaseModel):
    name: str
    rate: float
    is_default: bool = False

class TaxRateCreate(TaxRateBase):
    pass

class TaxRateUpdate(TaxRateBase):
    name: str | None = None
    rate: float | None = None
    is_default: bool | None = None

class TaxRate(TaxRateBase):
    id: uuid.UUID
    owner_id: uuid.UUID

    class Config:
        orm_mode = True

# --- ShippingOption Schemas ---
class ShippingOptionBase(BaseModel):
    name: str
    cost: float
    min_order_total: float | None = None

class ShippingOptionCreate(ShippingOptionBase):
    pass

class ShippingOptionUpdate(ShippingOptionBase):
    name: str | None = None
    cost: float | None = None
    min_order_total: float | None = None

class ShippingOption(ShippingOptionBase):
    id: uuid.UUID
    owner_id: uuid.UUID

    class Config:
        orm_mode = True
