from pydantic import BaseModel, ConfigDict, EmailStr
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any

# --- Plan Schemas ---
class PlanBase(BaseModel):
    name: str
    description: str
    commission_rate: float
    monthly_fee: float
    modules: List[str] = []
    is_default: bool = False

class PlanCreate(PlanBase):
    pass

class Plan(PlanBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- User Schemas ---
class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    logo_url: Optional[str] = None
    phone: Optional[str] = None
    shop_slug: Optional[str] = None
    role: Optional[str] = "admin_tienda"
    status: Optional[str] = "Activo"
    is_global_staff: bool = False
    permissions: Dict[str, bool] = {}

class UserCreate(UserBase):
    password: str
    plan_id: Optional[uuid.UUID] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    logo_url: Optional[str] = None
    phone: Optional[str] = None
    shop_slug: Optional[str] = None
    bank_accounts: Optional[List[dict]] = None
    social_links: Optional[dict] = None
    whatsapp_lines: Optional[List[dict]] = None

class User(UserBase):
    id: uuid.UUID
    plan: Optional[Plan] = None
    model_config = ConfigDict(from_attributes=True)

# --- Product Schemas ---
class ProductVariantBase(BaseModel):
    name: str
    sku: Optional[str] = None
    stock: int = 0
    price: Optional[float] = None

class ProductVariantCreate(ProductVariantBase):
    pass

class ProductVariant(ProductVariantBase):
    id: uuid.UUID
    product_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    status: str = "active"
    category: Optional[str] = None

class ProductCreate(ProductBase):
    variants: List[ProductVariantCreate] = []

class Product(ProductBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    variants: List[ProductVariant] = []
    model_config = ConfigDict(from_attributes=True)

# --- Order Schemas ---
class OrderItemBase(BaseModel):
    product_variant_id: uuid.UUID
    quantity: int
    price_at_purchase: float

class OrderItem(OrderItemBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

class OrderBase(BaseModel):
    tenant_id: uuid.UUID
    total_price: float
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_city: Optional[str] = None
    shipping_address: Optional[str] = None
    payment_method: str = "cash"
    source: str = "pos"

class OrderCreate(OrderBase):
    items: List[OrderItemBase]

class Order(OrderBase):
    id: uuid.UUID
    status: str
    created_at: datetime
    items: List[OrderItem] = []
    model_config = ConfigDict(from_attributes=True)

# --- Otros ---
class ActivityLogBase(BaseModel):
    action: str
    detail: str
    created_at: datetime

class ActivityLog(ActivityLogBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)
