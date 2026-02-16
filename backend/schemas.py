# backend/schemas.py
from pydantic import BaseModel
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any

# --- Plan Schemas ---
class PlanBase(BaseModel):
    name: str
    description: str | None = None
    commission_rate: float
    monthly_fee: float
    modules: List[str] | None = []
    is_default: bool = False

class PlanCreate(PlanBase):
    pass

class Plan(PlanBase):
    id: uuid.UUID
    class Config:
        from_attributes = True
        orm_mode = True

# --- User Schemas ---
class UserBase(BaseModel):
    email: str
    full_name: str | None = None
    nickname: str | None = None
    phone: str | None = None
    city: str | None = None
    shop_slug: str | None = None
    status: str | None = "Activo"

class UserCreate(UserBase):
    password: str
    role: str | None = "admin_tienda"
    permissions: Optional[Dict[str, bool]] = {}

class User(UserBase):
    id: uuid.UUID
    role: str = "admin_tienda"
    owner_id: Optional[uuid.UUID] = None
    is_global_staff: bool = False 
    bank_accounts: List[dict] | None = []
    social_links: dict | None = {}
    whatsapp_lines: List[dict] | None = []
    permissions: Optional[Dict[str, bool]] = {}
    plan: Optional[Plan] = None
    
    # Loyalty and Customer Stats
    loyalty_points: int = 0
    total_spent: float = 0.0
    last_purchase_date: Optional[datetime] = None
    last_purchase_summary: Optional[str] = None

    class Config:
        from_attributes = True
        orm_mode = True
        populate_by_name = True

class CustomerSync(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    last_purchase_date: datetime
    last_purchase_summary: str
    last_purchase_amount: float
    points_to_add: int

class BankAccountsUpdate(BaseModel):
    bank_accounts: List[dict]

class SocialLinksUpdate(BaseModel):
    social_links: dict

class WhatsAppLinesUpdate(BaseModel):
    whatsapp_lines: List[dict]

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
        from_attributes = True
        orm_mode = True

# --- Product Schemas ---
class ProductVariantBase(BaseModel):
    name: str
    sku: str | None = None
    price_adjustment: float = 0.0
    stock: int
    image_url: str | None = None
    attributes: dict | None = None

class ProductVariantCreate(ProductVariantBase):
    pass

class ProductVariant(ProductVariantBase):
    id: uuid.UUID
    product_id: uuid.UUID
    class Config:
        from_attributes = True
        orm_mode = True

class ProductBase(BaseModel):
    name: str
    description: str | None = None
    price: float
    wholesale_price: float | None = 0.0
    cost: float | None = 0.0
    sku: str | None = None
    status: str | None = "active"
    add_gateway_fee: bool | None = False
    image_url: List[str] | None = [] 
    product_type_id: uuid.UUID | None = None
    collection_id: uuid.UUID | None = None

class ProductCreate(ProductBase):
    variants: List[ProductVariantCreate]

class Product(ProductBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    variants: List[ProductVariant] = []
    collection: Optional[Collection] = None
    class Config:
        from_attributes = True
        orm_mode = True

# --- Order Schemas ---
class OrderItemBase(BaseModel):
    product_variant_id: uuid.UUID
    quantity: int

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: uuid.UUID
    price_at_purchase: float
    product_variant: Optional[ProductVariant] = None
    class Config:
        from_attributes = True
        orm_mode = True

class OrderBase(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_type: Optional[str] = "final"
    source: Optional[str] = "pos"
    payment_method: Optional[str] = "cash"
    seller_name: Optional[str] = None

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class Order(OrderBase):
    id: uuid.UUID
    customer_id: uuid.UUID 
    status: str
    created_at: datetime
    total_price: float
    items: List[OrderItem] = []
    class Config:
        from_attributes = True
        orm_mode = True

# --- Shipment Schemas ---
class ShipmentBase(BaseModel):
    order_id: uuid.UUID
    status: str = "pending_packing"
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
        from_attributes = True
        orm_mode = True

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
        from_attributes = True
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
        from_attributes = True
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
        from_attributes = True
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
        from_attributes = True
        orm_mode = True

class ClerkLoginRequest(BaseModel):
    clerk_token: str

class PageBase(BaseModel):
    slug: str
    title: str | None = None
    content: Dict[str, Any] | None = None

class PageCreate(PageBase):
    pass

class PageUpdate(PageBase):
    slug: str | None = None
    title: str | None = None
    content: Dict[str, Any] | None = None

class Page(PageBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    class Config:
        from_attributes = True
        orm_mode = True

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
        from_attributes = True
        orm_mode = True

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
        from_attributes = True
        orm_mode = True

# --- ProductType Schemas ---
class ProductAttributeBase(BaseModel):
    name: str
    attribute_type: str
    options: List[str] | None = None

class ProductAttributeCreate(ProductAttributeBase):
    pass

class ProductAttribute(ProductAttributeBase):
    id: uuid.UUID
    product_type_id: uuid.UUID
    class Config:
        from_attributes = True
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
        from_attributes = True
        orm_mode = True

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
        from_attributes = True
        orm_mode = True

class CustomRoleCreate(BaseModel):
    name: str
    permissions: Dict[str, bool]

class CustomRole(CustomRoleCreate):
    id: uuid.UUID
    owner_id: uuid.UUID
    class Config:
        from_attributes = True
        orm_mode = True

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
        from_attributes = True
        orm_mode = True

class ProviderCreate(BaseModel):
    name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    category: str = "General"

class Provider(ProviderCreate):
    id: uuid.UUID
    tenant_id: uuid.UUID
    class Config:
        from_attributes = True
        orm_mode = True

class ActivityLogBase(BaseModel):
    action: str
    detail: str
    target_id: Optional[str] = None

class ActivityLog(ActivityLogBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    tenant_id: uuid.UUID
    user_name: Optional[str] = None # Helper for frontend

    class Config:
        from_attributes = True
        orm_mode = True

class SuperAdminStats(BaseModel):
    total_revenue: float
    total_commission: float
    active_companies: int
    active_affiliates: int
    top_companies: List[Dict[str, Any]]
    recent_alerts: List[Dict[str, Any]]

# --- Shop Page Schemas ---
class ShopPageBase(BaseModel):
    page_key: str
    schema_data: Dict[str, Any]

class ShopPageCreate(ShopPageBase):
    pass

class ShopPage(ShopPageBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    updated_at: datetime
    class Config:
        from_attributes = True
        orm_mode = True

# --- Web Template Schemas ---
class WebTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    preview_url: Optional[str] = None
    schema_data: Dict[str, Any]
    active_plans: List[str] = []
    is_active: bool = True

class WebTemplateCreate(WebTemplateBase):
    pass

class WebTemplate(WebTemplateBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
        orm_mode = True