from pydantic import BaseModel, ConfigDict
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
    nit: Optional[str] = None
    address: Optional[str] = None
    customer_city: Optional[str] = None
    shop_slug: Optional[str] = None
    category: Optional[str] = "Moda & Accesorios" # Campo de Nicho de Mercado
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
    nit: Optional[str] = None
    address: Optional[str] = None
    customer_city: Optional[str] = None
    shop_slug: Optional[str] = None
    category: Optional[str] = None # Permitir actualización de Nicho
    bank_accounts: Optional[List[dict]] = None
    social_links: Optional[dict] = None
    whatsapp_lines: Optional[List[dict]] = None
    custom_commission_rate: Optional[float] = None

class User(UserBase):
    id: uuid.UUID
    plan: Optional[Plan] = None
    nit: Optional[str] = None
    address: Optional[str] = None
    customer_city: Optional[str] = None
    shop_slug: Optional[str] = None
    hours: Optional[str] = None
    bank_accounts: List[dict] = []
    social_links: dict = {}
    whatsapp_lines: List[dict] = []
    custom_commission_rate: Optional[float] = None
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
    commission_amount: Optional[float] = 0.0
    commission_rate_snapshot: Optional[float] = 0.0
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

# --- Finance Schemas ---
class IncomeBase(BaseModel):
    amount: float
    description: str
    category: Optional[str] = "Ventas"

class IncomeCreate(IncomeBase):
    pass

class Income(IncomeBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Collection Schemas ---
class CollectionBase(BaseModel):
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    status: str = "active"

class CollectionCreate(CollectionBase):
    pass

class Collection(CollectionBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- Shipment Schemas ---
class ShipmentBase(BaseModel):
    order_id: uuid.UUID
    recipient_name: str
    recipient_phone: Optional[str] = None
    destination_address: str
    status: str = "pending_packing"
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None

class ShipmentCreate(ShipmentBase):
    pass

class Shipment(ShipmentBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Role Schemas ---
class CustomRoleBase(BaseModel):
    name: str
    permissions: Dict[str, bool] = {}

class CustomRoleCreate(CustomRoleBase):
    pass

class CustomRole(CustomRoleBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- Log Schemas ---
class ActivityLogBase(BaseModel):
    action: str
    detail: str
    created_at: datetime

class ActivityLog(ActivityLogBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

# --- Message & Notification Schemas ---
class StoreMessageBase(BaseModel):
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    message: str
    status: str = "unread"

class StoreMessage(StoreMessageBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str = "info"
    is_read: bool = False

class Notification(NotificationBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
