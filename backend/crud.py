# backend/crud.py
from sqlalchemy.orm import Session, joinedload
import uuid
from typing import Optional, List
import models, schemas, security
from fastapi import HTTPException, status

# --- Plan CRUD ---
def get_default_plan(db: Session) -> models.Plan | None:
    return db.query(models.Plan).filter(models.Plan.is_default == True).first()

def create_plan(db: Session, plan: schemas.PlanCreate) -> models.Plan:
    db_plan = models.Plan(**plan.dict())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

# --- User CRUD ---
def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = security.get_password_hash(user.password)
    default_plan = get_default_plan(db)
    if not default_plan:
        raise HTTPException(status_code=500, detail="No default plan configured.")
    db_user = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role or "admin_tienda",
        status=user.status or "Activo",
        plan_id=default_plan.id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Product CRUD ---
def get_product(db: Session, product_id: uuid.UUID, tenant_id: Optional[uuid.UUID] = None) -> models.Product | None:
    query = db.query(models.Product).filter(models.Product.id == product_id).options(joinedload(models.Product.variants))
    if tenant_id: query = query.filter(models.Product.owner_id == tenant_id)
    return query.first()

def get_product_variant(db: Session, variant_id: uuid.UUID) -> models.ProductVariant | None:
    return db.query(models.ProductVariant).filter(models.ProductVariant.id == variant_id).first()

def get_all_products(db: Session, tenant_id: Optional[uuid.UUID] = None) -> list[models.Product]:
    query = db.query(models.Product).options(joinedload(models.Product.variants))
    if tenant_id: query = query.filter(models.Product.owner_id == tenant_id)
    return query.all()

def get_products_by_owner(db: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100) -> list[models.Product]:
    return db.query(models.Product).filter(models.Product.owner_id == owner_id).options(joinedload(models.Product.variants)).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate, owner_id: uuid.UUID) -> models.Product:
    db_product = models.Product(**product.dict(exclude={"variants"}), owner_id=owner_id)
    db.add(db_product)
    db.flush()
    for v in product.variants:
        db.add(models.ProductVariant(**v.dict(), product_id=db_product.id))
    db.commit()
    db.refresh(db_product)
    return db_product

# --- Order CRUD ---
def create_order(db: Session, order: schemas.OrderCreate, customer_id: uuid.UUID) -> models.Order:
    subtotal = 0
    items_to_create = []
    tenant_id = None
    for item in order.items:
        v = get_product_variant(db, item.product_variant_id)
        if not v: raise HTTPException(status_code=404, detail=f"Product variant with id {item.product_variant_id} not found")
        if v.stock < item.quantity: raise HTTPException(status_code=400, detail=f"Not enough stock for variant {v.name}")
        if tenant_id is None: tenant_id = v.product.owner_id
        price = v.product.price + v.price_adjustment
        subtotal += price * item.quantity
        items_to_create.append({"variant": v, "qty": item.quantity, "price": price})
    
    db_order = models.Order(total_price=subtotal, customer_id=customer_id, tenant_id=tenant_id, customer_name=order.customer_name, customer_email=order.customer_email, seller_name=order.seller_name)
    db.add(db_order)
    db.flush()
    for it in items_to_create:
        db.add(models.OrderItem(order_id=db_order.id, product_variant_id=it["variant"].id, quantity=it["qty"], price_at_purchase=it["price"]))
        it["variant"].stock -= it["qty"]
    db.commit()
    db.refresh(db_order)
    return db_order

def get_orders_by_customer(db: Session, customer_id: uuid.UUID) -> list[models.Order]:
    return db.query(models.Order).filter(models.Order.customer_id == customer_id).all()
