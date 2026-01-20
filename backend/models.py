# backend/models.py
import uuid
import datetime
from sqlalchemy import Column, String, Float, Integer, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
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

class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    stock = Column(Integer, nullable=False)
    image_url = Column(String, nullable=True)
    
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    owner = relationship("User", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")

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

    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quantity = Column(Integer, nullable=False)
    price_at_purchase = Column(Float, nullable=False)

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"))
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"))

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
