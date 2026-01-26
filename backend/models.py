# backend/models.py
import uuid
import datetime
from sqlalchemy import Column, String, Float, Integer, ForeignKey, DateTime, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import JSON # For storing JSON content
from database import Base

class Plan(Base):
    __tablename__ = "plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    commission_rate = Column(Float, nullable=False, default=0.0) # e.g., 0.05 for 5%
    monthly_fee = Column(Float, nullable=False, default=0.0)
    is_default = Column(Boolean, default=False) # A default plan for new users

    users = relationship("User", back_populates="plan")

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    nickname = Column(String, nullable=True) # Nombre tierno que Bayt recordará
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="admin_tienda") # e.g., "admin_tienda", "super_admin"
    api_key = Column(String, unique=True, default=lambda: uuid.uuid4().hex) # Llave para n8n
    bank_accounts = Column(JSON, nullable=True, default=[]) # New: store wallet info
    social_links = Column(JSON, nullable=True, default={}) # New: store social media links
    whatsapp_lines = Column(JSON, nullable=True, default=[]) # New: store multiple WhatsApp lines
    
    plan_id = Column(UUID(as_uuid=True), ForeignKey("plans.id"), nullable=True)
    plan = relationship("Plan", back_populates="users")

    products = relationship("Product", back_populates="owner")
    orders = relationship("Order", back_populates="customer", foreign_keys="[Order.customer_id]")
    pages = relationship("Page", back_populates="owner")

class Collection(Base):
    __tablename__ = "collections"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    status = Column(String, default="active") # active, hidden
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    owner = relationship("User")
    products = relationship("Product", back_populates="collection")

class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False) # Base price, variants can adjust
    image_url = Column(String, nullable=True) # Main product image
    
    product_type_id = Column(UUID(as_uuid=True), ForeignKey("product_types.id"), nullable=True)
    product_type = relationship("ProductType")
    
    collection_id = Column(UUID(as_uuid=True), ForeignKey("collections.id"), nullable=True)
    collection = relationship("Collection", back_populates="products")

    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    owner = relationship("User", back_populates="products")
    
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")

class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    name = Column(String, nullable=False) # e.g., "Red, Large"
    sku = Column(String, unique=True, index=True, nullable=True) # Stock Keeping Unit
    price_adjustment = Column(Float, nullable=False, default=0.0) # Adjustment to base product price
    stock = Column(Integer, nullable=False)
    image_url = Column(String, nullable=True) # Variant specific image
    attributes = Column(JSON, nullable=True, default={}) # Dynamic attributes based on product type

    product = relationship("Product", back_populates="variants")
    order_items = relationship("OrderItem", back_populates="product_variant")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    total_price = Column(Float, nullable=False)
    status = Column(String, nullable=False, default="pending")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    customer = relationship("User", foreign_keys=[customer_id], back_populates="orders")

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tenant = relationship("User", foreign_keys=[tenant_id]) # The owner of the store

    tax_rate_id = Column(UUID(as_uuid=True), ForeignKey("tax_rates.id"), nullable=True) # Tax applied to this order
    tax_rate_snapshot = Column(Float, nullable=True) # Snapshot of tax rate at time of order

    shipping_option_id = Column(UUID(as_uuid=True), ForeignKey("shipping_options.id"), nullable=True)
    shipping_cost_snapshot = Column(Float, nullable=True) # Snapshot of shipping cost at time of order

    items = relationship("OrderItem", back_populates="order")
    shipment = relationship("Shipment", back_populates="order", uselist=False)

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), unique=True)
    status = Column(String, default="pending_packing") # pending_packing, ready_to_ship, in_transit, delivered, exception
    recipient_name = Column(String)
    destination_address = Column(String)
    carrier = Column(String, nullable=True)
    tracking_number = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    order = relationship("Order", back_populates="shipment")
    owner = relationship("User")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quantity = Column(Integer, nullable=False)
    price_at_purchase = Column(Float, nullable=False)

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"))
    product_variant_id = Column(UUID(as_uuid=True), ForeignKey("product_variants.id"), nullable=False)

    order = relationship("Order", back_populates="items")
    product_variant = relationship("ProductVariant", back_populates="order_items")

class Page(Base):
    __tablename__ = "pages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String, nullable=False, index=True) # e.g., "home", "about-us"
    title = Column(String, nullable=True)
    content = Column(JSON, nullable=True) # Stores the JSON structure of the page
    
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    owner = relationship("User", back_populates="pages")

    __table_args__ = (UniqueConstraint("slug", "owner_id", name="_owner_id_slug_uc"),)

class AIAssistant(Base):
    __tablename__ = "ai_assistants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    assistant_type = Column(String, nullable=False) # e.g., "appointment_setter", "cart_recovery", "custom"
    status = Column(String, default="active")
    is_byoa = Column(Boolean, default=False) # True si usa el n8n del cliente
    
    # n8n & Logic Configuration
    n8n_webhook_url = Column(String, nullable=True)
    system_prompt = Column(String, nullable=True)
    config = Column(JSON, nullable=True, default={}) # Extra parameters
    
    # Metrics
    total_actions = Column(Integer, default=0)
    success_rate = Column(Float, default=0.0)
    last_run = Column(DateTime, nullable=True)

    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    owner = relationship("User")


class TaxRate(Base):
    __tablename__ = "tax_rates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False) # e.g., "IVA 19%"
    rate = Column(Float, nullable=False) # e.g., 0.19 for 19%
    is_default = Column(Boolean, default=False)
    
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    owner = relationship("User")

    __table_args__ = (UniqueConstraint("name", "owner_id", name="_owner_id_tax_name_uc"),)


class ShippingOption(Base):
    __tablename__ = "shipping_options"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False) # e.g., "Standard Shipping"
    cost = Column(Float, nullable=False)
    min_order_total = Column(Float, nullable=True) # Minimum order total for this option to apply

    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    owner = relationship("User")

    __table_args__ = (UniqueConstraint("name", "owner_id", name="_owner_id_shipping_name_uc"),)


class ProductType(Base):
    __tablename__ = "product_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True) # e.g., "Clothing", "Electronics", "Other"
    description = Column(String, nullable=True)

    attributes = relationship("ProductAttribute", back_populates="product_type", cascade="all, delete-orphan")


class ProductAttribute(Base):
    __tablename__ = "product_attributes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_type_id = Column(UUID(as_uuid=True), ForeignKey("product_types.id"), nullable=False)
    name = Column(String, nullable=False) # e.g., "Size", "Color", "Memory"
    attribute_type = Column(String, nullable=False) # e.g., "select", "text", "number"
    # Values are stored as JSON array for select types: ["S", "M", "L", "XL"]
    options = Column(JSON, nullable=True)

    product_type = relationship("ProductType", back_populates="attributes")

    __table_args__ = (UniqueConstraint("product_type_id", "name", name="_product_type_id_name_uc"),)

class AIAssistantLog(Base):
    __tablename__ = "ai_assistant_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assistant_id = Column(UUID(as_uuid=True), ForeignKey("ai_assistants.id"))
    action_type = Column(String) 
    detail = Column(String)
    status = Column(String) 
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    due_date = Column(DateTime, nullable=False)
    status = Column(String, default="pending") # pending, paid
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

class Receivable(Base):
    __tablename__ = "receivables"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    due_date = Column(DateTime, nullable=False)
    status = Column(String, default="pending") # pending, collected
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

class Income(Base):
    __tablename__ = "incomes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    category = Column(String, nullable=True) # e.g., "Venta Directa", "Inversión"
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
