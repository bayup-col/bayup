from sqlalchemy import Column, String, Float, Boolean, ForeignKey, DateTime, JSON, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
import datetime
from database import Base

class Plan(Base):
    __tablename__ = "plans"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True)
    description = Column(String)
    commission_rate = Column(Float)
    monthly_fee = Column(Float)
    is_default = Column(Boolean, default=False)
    users = relationship("User", back_populates="plan")

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    nickname = Column(String)
    hashed_password = Column(String)
    role = Column(String, default="admin_tienda")
    status = Column(String, default="Activo")
    bank_accounts = Column(JSON, default=[])
    social_links = Column(JSON, default={})
    whatsapp_lines = Column(JSON, default=[])
    plan_id = Column(UUID(as_uuid=True), ForeignKey("plans.id"))
    plan = relationship("Plan", back_populates="users")
    products = relationship("Product", back_populates="owner")
    orders = relationship("Order", back_populates="customer", foreign_keys="[Order.customer_id]")

class Product(Base):
    __tablename__ = "products"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True)
    description = Column(String)
    price = Column(Float)
    image_url = Column(String)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    product_type_id = Column(UUID(as_uuid=True), ForeignKey("product_types.id"), nullable=True)
    collection_id = Column(UUID(as_uuid=True), ForeignKey("collections.id"), nullable=True)
    owner = relationship("User", back_populates="products")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")

class ProductVariant(Base):
    __tablename__ = "product_variants"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"))
    name = Column(String)
    sku = Column(String, index=True)
    price_adjustment = Column(Float, default=0.0)
    stock = Column(Integer, default=0)
    image_url = Column(String)
    attributes = Column(JSON)
    product = relationship("Product", back_populates="variants")

class Order(Base):
    __tablename__ = "orders"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    total_price = Column(Float)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    tax_rate_id = Column(UUID(as_uuid=True), nullable=True)
    tax_rate_snapshot = Column(Float, nullable=True)
    shipping_option_id = Column(UUID(as_uuid=True), nullable=True)
    shipping_cost_snapshot = Column(Float, nullable=True)
    customer_name = Column(String)
    customer_email = Column(String)
    seller_name = Column(String)
    customer = relationship("User", back_populates="orders", foreign_keys=[customer_id])
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"))
    product_variant_id = Column(UUID(as_uuid=True), ForeignKey("product_variants.id"))
    quantity = Column(Integer)
    price_at_purchase = Column(Float)
    order = relationship("Order", back_populates="items")
    product_variant = relationship("ProductVariant")

class ProductType(Base):
    __tablename__ = "product_types"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True)
    description = Column(String)
    attributes = relationship("ProductAttribute", back_populates="product_type")

class ProductAttribute(Base):
    __tablename__ = "product_attributes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_type_id = Column(UUID(as_uuid=True), ForeignKey("product_types.id"))
    name = Column(String)
    attribute_type = Column(String)
    options = Column(JSON)
    product_type = relationship("ProductType", back_populates="attributes")

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    description = Column(String)
    amount = Column(Float)
    due_date = Column(DateTime)
    status = Column(String, default="pending")
    category = Column(String, default="diario")
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    invoice_num = Column(String)
    items = Column(JSON)
    description_detail = Column(String)

class Receivable(Base):
    __tablename__ = "receivables"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_name = Column(String)
    amount = Column(Float)
    due_date = Column(DateTime)
    status = Column(String, default="pending")
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    invoice_num = Column(String)
    items = Column(JSON)
    description_detail = Column(String)

class Income(Base):
    __tablename__ = "incomes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    description = Column(String)
    amount = Column(Float)
    category = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

class PayrollEmployee(Base):
    __tablename__ = "payroll_employees"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    role = Column(String)
    base_salary = Column(Float)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("sellers.id"), nullable=True)

class Seller(Base):
    __tablename__ = "sellers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    role = Column(String)
    branch = Column(String)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

class Page(Base):
    __tablename__ = "pages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String, index=True)
    title = Column(String)
    content = Column(JSON)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

class TaxRate(Base):
    __tablename__ = "tax_rates"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    rate = Column(Float)
    is_default = Column(Boolean, default=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

class ShippingOption(Base):
    __tablename__ = "shipping_options"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    cost = Column(Float)
    min_order_total = Column(Float, nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

class AIAssistant(Base):
    __tablename__ = "ai_assistants"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    description = Column(String)
    assistant_type = Column(String)
    status = Column(String, default="active")
    n8n_webhook_url = Column(String)
    system_prompt = Column(String)
    config = Column(JSON)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    total_actions = Column(Integer, default=0)
    success_rate = Column(Float, default=100.0)
    last_run = Column(DateTime, nullable=True)

class AIAssistantLog(Base):
    __tablename__ = "ai_assistant_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assistant_id = Column(UUID(as_uuid=True), ForeignKey("ai_assistants.id"))
    action_type = Column(String)
    detail = Column(String)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Collection(Base):
    __tablename__ = "collections"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String)
    description = Column(String)
    image_url = Column(String)
    status = Column(String, default="active")
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    products = relationship("Product", backref="collection")

class CustomRole(Base):
    __tablename__ = "custom_roles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    permissions = Column(JSON)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_name = Column(String)
    quantity = Column(Integer)
    items = Column(JSON)
    total_amount = Column(Float)
    provider_name = Column(String)
    status = Column(String, default="sent")
    sending_method = Column(String)
    scheduled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

class Provider(Base):
    __tablename__ = "providers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    contact_name = Column(String)
    email = Column(String)
    phone = Column(String)
    category = Column(String, default="General")
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

class Shipment(Base):
    __tablename__ = "shipments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"))
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    status = Column(String, default="pending_packing")
    recipient_name = Column(String)
    destination_address = Column(String)
    carrier = Column(String, nullable=True)
    tracking_number = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    