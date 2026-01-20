# backend/crud.py
from sqlalchemy.orm import Session, joinedload
import uuid
from typing import Optional, List
from . import models, schemas, security
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
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = security.get_password_hash(user.password)
    
    # Assign default plan to new users
    default_plan = get_default_plan(db)
    if not default_plan:
        raise HTTPException(status_code=500, detail="No default plan configured. Please create a default plan.")

    db_user = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        plan_id=default_plan.id
    )
    db.add(db_user)
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
    # Separate product data from variants data
    product_data = product.dict(exclude={"variants"})
    variants_data = product.variants

    db_product = models.Product(**product_data, owner_id=owner_id)
    db.add(db_product)
    db.flush() # Flush to get product_id for variants

    for variant_in in variants_data:
        db_variant = models.ProductVariant(**variant_in.dict(), product_id=db_product.id)
        db.add(db_variant)
    
    db.commit()
    db.refresh(db_product)
    return db_product

# --- Order CRUD ---

def create_order(db: Session, order: schemas.OrderCreate, customer_id: uuid.UUID) -> models.Order:
    total_price = 0
    order_items = []
    tenant_id_for_order = None
    
    # Start a transaction
    try:
        # Validate product variants and calculate total price
        for item_in in order.items:
            product_variant = get_product_variant(db, item_in.product_variant_id)
            if not product_variant:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product variant with id {item_in.product_variant_id} not found")
            if product_variant.stock < item_in.quantity:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Not enough stock for variant {product_variant.name} of product {product_variant.product.name}")
            
            # Determine base price of the product
            product_base_price = product_variant.product.price
            variant_price = product_base_price + product_variant.price_adjustment
            
            # Ensure all products in the order belong to the same tenant
            if tenant_id_for_order is None:
                tenant_id_for_order = product_variant.product.owner_id
            elif tenant_id_for_order != product_variant.product.owner_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="All products in an order must belong to the same store.")
            
            total_price += variant_price * item_in.quantity
            order_items.append({"product_variant": product_variant, "quantity": item_in.quantity, "price_at_purchase": variant_price})

        if not tenant_id_for_order:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No products in order to determine tenant.")

        # Create the order
        db_order = models.Order(total_price=total_price, customer_id=customer_id, tenant_id=tenant_id_for_order)
        db.add(db_order)
        db.flush() # Use flush to get the order ID before creating items

        # Create order items and update stock
        for item_data in order_items:
            product_variant = item_data["product_variant"]
            quantity = item_data["quantity"]
            price_at_purchase = item_data["price_at_purchase"]
            
            db_order_item = models.OrderItem(
                order_id=db_order.id,
                product_variant_id=product_variant.id, # Link to variant
                quantity=quantity,
                price_at_purchase=price_at_purchase
            )
            db.add(db_order_item)
            
            # Decrease stock
            product_variant.stock -= quantity

        db.commit()
        db.refresh(db_order)
        return db_order
    except Exception as e:
        db.rollback()
        raise e

def get_orders_by_customer(db: Session, customer_id: uuid.UUID, skip: int = 0, limit: int = 100) -> list[models.Order]:
    return (
        db.query(models.Order)
        .filter(models.Order.customer_id == customer_id)
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product_variant)) # Eagerly load order items and their variants
        .offset(skip)
        .limit(limit)
        .all()
    )

# --- Page CRUD ---

def get_page(db: Session, page_id: uuid.UUID, owner_id: uuid.UUID) -> models.Page | None:
    return db.query(models.Page).filter(models.Page.id == page_id, models.Page.owner_id == owner_id).first()

def get_page_by_slug(db: Session, slug: str, owner_id: uuid.UUID) -> models.Page | None:
    return db.query(models.Page).filter(models.Page.slug == slug, models.Page.owner_id == owner_id).first()

def get_pages_by_owner(db: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100) -> list[models.Page]:
    return db.query(models.Page).filter(models.Page.owner_id == owner_id).offset(skip).limit(limit).all()

def create_page(db: Session, page: schemas.PageCreate, owner_id: uuid.UUID) -> models.Page:
    db_page = models.Page(**page.dict(), owner_id=owner_id)
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page

def update_page(db: Session, db_page: models.Page, page_update: schemas.PageUpdate) -> models.Page:
    for key, value in page_update.dict(exclude_unset=True).items():
        setattr(db_page, key, value)
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page

def delete_page(db: Session, db_page: models.Page):
    db.delete(db_page)
    db.commit()
