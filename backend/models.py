# backend/models.py
import uuid
import datetime
from sqlalchemy import Column, String, Float, Integer, ForeignKey, DateTime, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import JSON # For storing JSON content
from .database import Base

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
    hashed_password = Column(String, nullable=False)
    
    plan_id = Column(UUID(as_uuid=True), ForeignKey("plans.id"), nullable=True)
    plan = relationship("Plan", back_populates="users")

    products = relationship("Product", back_populates="owner")
    orders = relationship("Order", back_populates="customer", foreign_keys="[Order.customer_id]")
    pages = relationship("Page", back_populates="owner")

class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False) # Base price, variants can adjust
    image_url = Column(String, nullable=True) # Main product image
    
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
