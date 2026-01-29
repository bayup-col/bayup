# backend/schemas.py
from pydantic import BaseModel, EmailStr
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any

# --- User Schemas ---

# Shared properties
class UserBase(BaseModel):
    email: str
    full_name: str | None = None
    nickname: str | None = None
    status: str | None = "Activo" # New: Active, Invited, Suspended

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str
    role: str | None = "admin_tienda" # New: allow setting role during creation

# Properties to return to client
class User(UserBase):
    id: uuid.UUID
    role: str = "admin_tienda" # e.g., "admin_tienda", "super_admin"
    bank_accounts: List[dict] | None = []
    social_links: dict | None = {}
    whatsapp_lines: List[dict] | None = []
    permissions: Optional[Dict[str, bool]] = {} # Permisos de módulos

    class Config:
        orm_mode = True

class BankAccountsUpdate(BaseModel):
    bank_accounts: List[dict]

class SocialLinksUpdate(BaseModel):
    social_links: dict

class WhatsAppLinesUpdate(BaseModel):
    whatsapp_lines: List[dict]

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
    attributes: dict | None = None # Dynamic attributes based on product type

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
    product_type_id: uuid.UUID | None = None # Product type determines available attributes
    collection_id: uuid.UUID | None = None # Vínculo con la colección

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
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    seller_name: Optional[str] = None

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class Order(OrderBase):
    id: uuid.UUID
    customer_id: uuid.UUID # Added customer_id
    status: str
    created_at: datetime
    total_price: float # Asegurar que total_price se devuelva
    items: List[OrderItem] = []

    class Config:
        orm_mode = True

class ShipmentBase(BaseModel):
    order_id: uuid.UUID
    status: str
    recipient_name: str
    destination_address: str
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None

class ShipmentCreate(ShipmentBase):
    pass

class Shipment(ShipmentBase):
    id: uuid.UUID
    updated_at: datetime
    tenant_id: uuid.UUID

    class Config:
        orm_mode = True

class DashboardSummary(BaseModel):
    pass

# --- Finance Schemas ---
class ExpenseBase(BaseModel):
    description: str
    amount: float
    due_date: datetime
    status: str = "pending"
    category: str = "diario"
    invoice_num: str | None = None
    items: List[Dict] | None = None
    description_detail: str | None = None

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    class Config:
        orm_mode = True

class ReceivableBase(BaseModel):
    client_name: str
    amount: float
    due_date: datetime
    status: str = "pending"
    invoice_num: str | None = None
    items: List[Dict] | None = None
    description_detail: str | None = None

class ReceivableCreate(ReceivableBase):
    pass

class Receivable(ReceivableBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    class Config:
        orm_mode = True

class PayrollEmployeeBase(BaseModel):
    name: str
    role: str
    base_salary: float

class PayrollEmployeeCreate(PayrollEmployeeBase):
    pass

class PayrollEmployee(PayrollEmployeeBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    class Config:
        orm_mode = True

class IncomeBase(BaseModel):
    description: str
    amount: float
    category: str | None = None

class IncomeCreate(IncomeBase):
    pass

class Income(IncomeBase):
    id: uuid.UUID
    created_at: datetime
    tenant_id: uuid.UUID
    class Config:
        orm_mode = True

# --- Collection Schemas ---
class CollectionBase(BaseModel):
    title: str
    description: str | None = None
    image_url: str | None = None
    status: str = "active"

class CollectionCreate(CollectionBase):
    pass

class Collection(CollectionBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    product_count: int = 0
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

class PageUpdate(PageBase): # PageUpdate might not need slug or title, just content or partial update
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

# --- ProductType Schemas ---
class ProductAttributeBase(BaseModel):
    name: str # e.g., "Size", "Color"
    attribute_type: str # e.g., "select", "text"
    options: list[str] | None = None # e.g., ["S", "M", "L"]

class ProductAttributeCreate(ProductAttributeBase):
    pass

class ProductAttribute(ProductAttributeBase):
    id: uuid.UUID
    product_type_id: uuid.UUID

    class Config:
        orm_mode = True

class ProductTypeBase(BaseModel):
    name: str
    description: str | None = None

class ProductTypeCreate(ProductTypeBase):
    pass

class ProductType(ProductTypeBase):
    id: uuid.UUID
    attributes: List[ProductAttribute] = []

    class Config:
        orm_mode = True

# --- AIAssistant Schemas ---
class AIAssistantBase(BaseModel):
    name: str
    description: str | None = None
    assistant_type: str
    status: str = "active"
    n8n_webhook_url: str | None = None
    system_prompt: str | None = None
    config: Dict[str, Any] | None = {}

class AIAssistantCreate(AIAssistantBase):
    pass

class AIAssistant(AIAssistantBase):

    id: uuid.UUID

    owner_id: uuid.UUID

    total_actions: int

    success_rate: float

    last_run: datetime | None = None

    class Config:

        orm_mode = True

# --- Custom Role Schemas ---
class CustomRoleBase(BaseModel):
    name: str
    permissions: Dict[str, bool]

class CustomRoleCreate(CustomRoleBase):
    pass

class CustomRole(CustomRoleBase):
    id: uuid.UUID
    owner_id: uuid.UUID

    class Config:
        orm_mode = True

# --- Purchase Order Schemas ---
class PurchaseOrderBase(BaseModel):
    product_name: str
    quantity: int
    items: Optional[List[Dict[str, Any]]] = None
    total_amount: float
    provider_name: Optional[str] = None
    status: str = "sent"
    sending_method: Optional[str] = None
    scheduled_at: Optional[datetime] = None

class PurchaseOrderCreate(PurchaseOrderBase):
    pass

class PurchaseOrder(PurchaseOrderBase):
    id: uuid.UUID
    created_at: datetime
    tenant_id: uuid.UUID

    class Config:
        orm_mode = True

# --- Provider Schemas ---
class ProviderBase(BaseModel):
    name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    category: str = "General"

class ProviderCreate(ProviderBase):
    pass

class Provider(ProviderBase):
    id: uuid.UUID
    tenant_id: uuid.UUID

    class Config:
        orm_mode = True

# --- Super Admin Schemas ---

class SuperAdminStats(BaseModel):
    total_revenue: float
    total_commission: float
    active_companies: int
    active_affiliates: int
    top_companies: List[Dict[str, Any]]
    recent_alerts: List[Dict[str, Any]]
