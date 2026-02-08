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
    db_user = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role or "admin_tienda",
        status=user.status or "Activo",
        plan_id=default_plan.id if default_plan else None
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Product CRUD ---
def get_product(db: Session, product_id: uuid.UUID, tenant_id: Optional[uuid.UUID] = None) -> models.Product | None:
    query = db.query(models.Product).filter(models.Product.id == product_id).options(joinedload(models.Product.variants))
    if tenant_id:
        # Compatibility check for UUID vs string in SQLite
        query = query.filter(models.Product.owner_id == tenant_id)
    return query.first()

def get_product_variant(db: Session, variant_id: uuid.UUID) -> models.ProductVariant | None:
    return db.query(models.ProductVariant).filter(models.ProductVariant.id == variant_id).first()

def get_all_products(db: Session, tenant_id: Optional[uuid.UUID] = None, skip: int = 0, limit: int = 100) -> list[models.Product]:
    query = db.query(models.Product).options(joinedload(models.Product.variants))
    if tenant_id:
        query = query.filter(models.Product.owner_id == tenant_id)
    return query.offset(skip).limit(limit).all()

def get_products_by_owner(db: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100) -> list[models.Product]:
    return db.query(models.Product).filter(models.Product.owner_id == owner_id).options(joinedload(models.Product.variants)).order_by(models.Product.id.desc()).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate, owner_id: uuid.UUID) -> models.Product:
    db_product = models.Product(**product.dict(exclude={"variants"}), owner_id=owner_id)
    db.add(db_product)
    db.flush()
    for v in product.variants:
        db_variant = models.ProductVariant(**v.dict(), product_id=db_product.id)
        db.add(db_variant)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, db_product: models.Product, product: schemas.ProductCreate) -> models.Product:
    # 1. Actualizar campos básicos
    update_data = product.dict(exclude={"variants"})
    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    # 2. Actualizar variantes (Borramos las anteriores y creamos las nuevas para simplicidad)
    db.query(models.ProductVariant).filter(models.ProductVariant.product_id == db_product.id).delete()
    for v in product.variants:
        db_variant = models.ProductVariant(**v.dict(), product_id=db_product.id)
        db.add(db_variant)
    
    db.commit()
    db.refresh(db_product)
    return db_product

# --- Order CRUD ---
def create_order(db: Session, order: schemas.OrderCreate, customer_id: uuid.UUID, tenant_id: Optional[uuid.UUID] = None) -> models.Order:
    subtotal = 0
    items_to_create = []
    
    # Si no nos pasan el tenant_id, lo buscamos del primer producto
    actual_tenant_id = tenant_id

    for item in order.items:
        v = get_product_variant(db, item.product_variant_id)
        if not v:
            raise HTTPException(status_code=404, detail=f"Product variant with id {item.product_variant_id} not found")
        if v.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Not enough stock for variant {v.name}")
        
        if actual_tenant_id is None:
            actual_tenant_id = v.product.owner_id
        
        price = v.product.price + v.price_adjustment
        subtotal += price * item.quantity
        items_to_create.append({"variant": v, "qty": item.quantity, "price": price})
    
    db_order = models.Order(
        total_price=subtotal,
        customer_id=customer_id,
        tenant_id=actual_tenant_id,
        customer_name=order.customer_name,
        customer_email=order.customer_email,
        customer_phone=order.customer_phone,
        customer_type=order.customer_type,
        source=order.source,
        payment_method=order.payment_method,
        seller_name=order.seller_name
    )
    db.add(db_order)
    db.flush()
    for it in items_to_create:
        db_item = models.OrderItem(
            order_id=db_order.id,
            product_variant_id=it["variant"].id,
            quantity=it["qty"],
            price_at_purchase=it["price"]
        )
        db.add(db_item)
        it["variant"].stock -= it["qty"]
    db.commit()
    db.refresh(db_order)
    return db_order

def get_orders_by_customer(db: Session, customer_id: uuid.UUID) -> list[models.Order]:
    return db.query(models.Order).filter(models.Order.customer_id == customer_id).order_by(models.Order.created_at.desc()).all()

# --- Finance CRUD ---
def create_income(db: Session, income: schemas.IncomeCreate, tenant_id: uuid.UUID) -> models.Income:
    db_income = models.Income(**income.dict(), tenant_id=tenant_id)
    db.add(db_income)
    db.commit()
    db.refresh(db_income)
    return db_income

# --- Collection CRUD ---
def create_collection(db: Session, collection: schemas.CollectionCreate, owner_id: uuid.UUID) -> models.Collection:
    db_col = models.Collection(**collection.dict(), owner_id=owner_id)
    db.add(db_col)
    db.commit()
    db.refresh(db_col)
    return db_col

def get_collections_by_owner(db: Session, owner_id: uuid.UUID) -> list[models.Collection]:
    return db.query(models.Collection).filter(models.Collection.owner_id == owner_id).order_by(models.Collection.id.desc()).all()

def delete_collection(db: Session, collection_id: uuid.UUID, owner_id: uuid.UUID):
    db_col = db.query(models.Collection).filter(models.Collection.id == collection_id, models.Collection.owner_id == owner_id).first()
    if db_col:
        db.delete(db_col)
        db.commit()
        return True
    return False

# --- Custom Role CRUD ---
def create_custom_role(db: Session, role_in: schemas.CustomRoleCreate, owner_id: uuid.UUID):
    db_role = models.CustomRole(id=uuid.uuid4(), name=role_in.name, permissions=role_in.permissions, owner_id=owner_id)
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

def update_custom_role(db: Session, role_id: uuid.UUID, role_in: schemas.CustomRoleCreate, owner_id: uuid.UUID):
    db_role = db.query(models.CustomRole).filter(models.CustomRole.id == role_id, models.CustomRole.owner_id == owner_id).first()
    if db_role:
        db_role.name = role_in.name
        db_role.permissions = role_in.permissions
        db.commit()
        db.refresh(db_role)
    return db_role

def delete_custom_role(db: Session, role_id: uuid.UUID, owner_id: uuid.UUID):
    db_role = db.query(models.CustomRole).filter(models.CustomRole.id == role_id, models.CustomRole.owner_id == owner_id).first()
    if db_role:
        db.delete(db_role)
        db.commit()
        return True
    return False

# --- Shipment CRUD ---
def get_shipment(db: Session, shipment_id: uuid.UUID, tenant_id: uuid.UUID):
    return db.query(models.Shipment).filter(models.Shipment.id == shipment_id, models.Shipment.tenant_id == tenant_id).first()

def get_shipments_by_owner(db: Session, owner_id: uuid.UUID):
    return db.query(models.Shipment).filter(models.Shipment.tenant_id == owner_id).all()

def create_shipment(db: Session, shipment: schemas.ShipmentCreate, tenant_id: uuid.UUID):
    db_shipment = models.Shipment(**shipment.dict(), tenant_id=tenant_id)
    db.add(db_shipment)
    db.commit()
    db.refresh(db_shipment)
    return db_shipment

def update_shipment_status(db: Session, db_shipment: models.Shipment, status: str):
    db_shipment.status = status
    db.commit()
    db.refresh(db_shipment)
    return db_shipment