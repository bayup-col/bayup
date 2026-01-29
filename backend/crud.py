# backend/crud.py
from sqlalchemy.orm import Session, joinedload
import uuid
from typing import Optional, List
import models, schemas, security
from fastapi import HTTPException, status

# --- Plan CRUD ---

def get_plan(db: Session, plan_id: uuid.UUID) -> models.Plan | None:
    return db.query(models.Plan).filter(models.Plan.id == plan_id).first()

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
    # Búsqueda exacta del email (incluyendo espacios si el test los envía)
    return db.query(models.User).filter(models.User.email == email).first()

def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = security.get_password_hash(user.password)
    default_plan = get_default_plan(db)
    
    if not default_plan:
        raise HTTPException(status_code=500, detail="No default plan configured.")

    db_user = models.User(
        email=user.email, # Guardar exactamente como viene
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

def update_user_nickname(db: Session, user_id: uuid.UUID, nickname: str) -> models.User:
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.nickname = nickname
        db.commit()
        db.refresh(db_user)
    return db_user

# --- Product CRUD ---

def get_product(db: Session, product_id: uuid.UUID, tenant_id: Optional[uuid.UUID] = None) -> models.Product | None:
    query = db.query(models.Product).filter(models.Product.id == product_id).options(joinedload(models.Product.variants))
    if tenant_id:
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
    return db.query(models.Product).filter(models.Product.owner_id == owner_id).options(joinedload(models.Product.variants)).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate, owner_id: uuid.UUID) -> models.Product:
    product_data = product.dict(exclude={"variants"})
    variants_data = product.variants
    db_product = models.Product(**product_data, owner_id=owner_id)
    db.add(db_product)
    db.flush()
    for variant_in in variants_data:
        db_variant = models.ProductVariant(**variant_in.dict(), product_id=db_product.id)
        db.add(db_variant)
    db.commit()
    db.refresh(db_product)
    return db_product

# --- Order CRUD ---

def create_order(db: Session, order: schemas.OrderCreate, customer_id: uuid.UUID) -> models.Order:
    subtotal_price = 0
    order_items = []
    tenant_id_for_order = None
    
    for item_in in order.items:
        product_variant = get_product_variant(db, item_in.product_variant_id)
        if not product_variant:
            raise HTTPException(status_code=404, detail=f"Product variant with id {item_in.product_variant_id} not found")
        
        if product_variant.stock < item_in.quantity:
            raise HTTPException(status_code=400, detail=f"Not enough stock for variant {product_variant.name}")

        variant_price = product_variant.product.price + product_variant.price_adjustment
        
        if tenant_id_for_order is None:
            tenant_id_for_order = product_variant.product.owner_id
        
        subtotal_price += variant_price * item_in.quantity
        order_items.append({"product_variant": product_variant, "quantity": item_in.quantity, "price_at_purchase": variant_price})

    db_order = models.Order(
        total_price=subtotal_price,
        customer_id=customer_id,
        tenant_id=tenant_id_for_order,
        customer_name=order.customer_name,
        customer_email=order.customer_email,
        seller_name=order.seller_name
    )
    db.add(db_order)
    db.flush()

    for item_data in order_items:
        db_order_item = models.OrderItem(
            order_id=db_order.id,
            product_variant_id=item_data["product_variant"].id,
            quantity=item_data["quantity"],
            price_at_purchase=item_data["price_at_purchase"]
        )
        db.add(db_order_item)
        item_data["product_variant"].stock -= item_data["quantity"]

    db.commit()
    db.refresh(db_order)
    return db_order

def get_orders_by_customer(db: Session, customer_id: uuid.UUID) -> list[models.Order]:
    return db.query(models.Order).filter(models.Order.customer_id == customer_id).all()

# --- Finance CRUD ---

def create_income(db: Session, income: schemas.IncomeCreate, tenant_id: uuid.UUID) -> models.Income:
    db_income = models.Income(**income.dict(), tenant_id=tenant_id)
    db.add(db_income)
    db.commit()
    db.refresh(db_income)
    return db_income

# --- Collection CRUD ---

def get_collections_by_owner(db: Session, owner_id: uuid.UUID) -> list[models.Collection]:
    return db.query(models.Collection).filter(models.Collection.owner_id == owner_id).all()

def create_collection(db: Session, collection: schemas.CollectionCreate, owner_id: uuid.UUID) -> models.Collection:
    db_collection = models.Collection(**collection.dict(), owner_id=owner_id)
    db.add(db_collection)
    db.commit()
    db.refresh(db_collection)
    return db_collection

# --- Custom Role CRUD ---

def get_custom_roles(db: Session, owner_id: uuid.UUID):
    return db.query(models.CustomRole).filter(models.CustomRole.owner_id == owner_id).all()

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