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
    return db.query(models.User).filter(models.User.email == email).first()

def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    """Get all users in the system"""
    return db.query(models.User).offset(skip).limit(limit).all()

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
        role="admin_tienda",  # Asignar automáticamente el rol de administrador de tienda
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

def create_order(
    db: Session,
    order: schemas.OrderCreate,
    customer_id: uuid.UUID,
    tax_rate_id: Optional[uuid.UUID] = None,
    shipping_option_id: Optional[uuid.UUID] = None,
) -> models.Order:
    subtotal_price = 0
    order_items = []
    tenant_id_for_order = None
    
    # Start a transaction
    try:
        # Validate product variants and calculate subtotal price
        for item_in in order.items:
            product_variant = get_product_variant(db, item_in.product_variant_id)
            if not product_variant:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product variant with id {item_in.product_variant_id} not found")
            if product_variant.stock < item_in.quantity:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Not enough stock for variant {product_variant.name} of product {product_variant.product.name}")
            
            product_base_price = product_variant.product.price
            variant_price = product_base_price + product_variant.price_adjustment
            
            # Ensure all products in the order belong to the same tenant
            if tenant_id_for_order is None:
                tenant_id_for_order = product_variant.product.owner_id
            elif tenant_id_for_order != product_variant.product.owner_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="All products in an order must belong to the same store.")
            
            subtotal_price += variant_price * item_in.quantity
            order_items.append({"product_variant": product_variant, "quantity": item_in.quantity, "price_at_purchase": variant_price})

        if not tenant_id_for_order:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No products in order to determine tenant.")

        final_total_price = subtotal_price
        tax_rate_snapshot = None
        shipping_cost_snapshot = None
        
        # Apply shipping cost
        if shipping_option_id:
            shipping_option = get_shipping_option(db, shipping_option_id, tenant_id_for_order)
            if not shipping_option:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipping option not found for this store.")
            
            # Check minimum order total if applicable
            if shipping_option.min_order_total is not None and subtotal_price < shipping_option.min_order_total:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Minimum order total for {shipping_option.name} is {shipping_option.min_order_total}.")
            
            final_total_price += shipping_option.cost
            shipping_cost_snapshot = shipping_option.cost
        
        # Apply tax
        if tax_rate_id:
            tax_rate = get_tax_rate(db, tax_rate_id, tenant_id_for_order)
            if not tax_rate:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tax rate not found for this store.")
            
            final_total_price *= (1 + tax_rate.rate)
            tax_rate_snapshot = tax_rate.rate
        else: # If no specific tax_rate_id is provided, try to apply the default tax rate
            default_tax_rate = get_default_tax_rate_by_owner(db, tenant_id_for_order)
            if default_tax_rate:
                final_total_price *= (1 + default_tax_rate.rate)
                tax_rate_snapshot = default_tax_rate.rate
                tax_rate_id = default_tax_rate.id # Assign default tax rate ID to order
        
        # Create the order
        db_order = models.Order(
            total_price=final_total_price,
            customer_id=customer_id,
            tenant_id=tenant_id_for_order,
            tax_rate_id=tax_rate_id,
            tax_rate_snapshot=tax_rate_snapshot,
            shipping_option_id=shipping_option_id,
            shipping_cost_snapshot=shipping_cost_snapshot,
        )
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

# --- TaxRate CRUD ---

def get_tax_rate(db: Session, tax_rate_id: uuid.UUID, owner_id: uuid.UUID) -> models.TaxRate | None:
    return db.query(models.TaxRate).filter(models.TaxRate.id == tax_rate_id, models.TaxRate.owner_id == owner_id).first()

def get_default_tax_rate_by_owner(db: Session, owner_id: uuid.UUID) -> models.TaxRate | None:
    return db.query(models.TaxRate).filter(models.TaxRate.owner_id == owner_id, models.TaxRate.is_default == True).first()

def get_all_tax_rates_by_owner(db: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100) -> list[models.TaxRate]:
    return db.query(models.TaxRate).filter(models.TaxRate.owner_id == owner_id).offset(skip).limit(limit).all()

def create_tax_rate(db: Session, tax_rate: schemas.TaxRateCreate, owner_id: uuid.UUID) -> models.TaxRate:
    if tax_rate.is_default:
        # Ensure only one default tax rate per owner
        existing_default = get_default_tax_rate_by_owner(db, owner_id)
        if existing_default:
            existing_default.is_default = False
            db.add(existing_default)
            db.flush()

    db_tax_rate = models.TaxRate(**tax_rate.dict(), owner_id=owner_id)
    db.add(db_tax_rate)
    db.commit()
    db.refresh(db_tax_rate)
    return db_tax_rate

def update_tax_rate(db: Session, db_tax_rate: models.TaxRate, tax_rate_update: schemas.TaxRateUpdate) -> models.TaxRate:
    update_data = tax_rate_update.dict(exclude_unset=True)
    if "is_default" in update_data and update_data["is_default"]:
        # Ensure only one default tax rate per owner
        existing_default = get_default_tax_rate_by_owner(db, db_tax_rate.owner_id)
        if existing_default and existing_default.id != db_tax_rate.id:
            existing_default.is_default = False
            db.add(existing_default)
            db.flush() # Flush to apply change before commiting

    for key, value in update_data.items():
        setattr(db_tax_rate, key, value)
    db.add(db_tax_rate)
    db.commit()
    db.refresh(db_tax_rate)
    return db_tax_rate

def delete_tax_rate(db: Session, db_tax_rate: models.TaxRate):
    db.delete(db_tax_rate)
    db.commit()

# --- ShippingOption CRUD ---

def get_shipping_option(db: Session, shipping_option_id: uuid.UUID, owner_id: uuid.UUID) -> models.ShippingOption | None:
    return db.query(models.ShippingOption).filter(models.ShippingOption.id == shipping_option_id, models.ShippingOption.owner_id == owner_id).first()

def get_all_shipping_options_by_owner(db: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100) -> list[models.ShippingOption]:
    return db.query(models.ShippingOption).filter(models.ShippingOption.owner_id == owner_id).offset(skip).limit(limit).all()

def create_shipping_option(db: Session, shipping_option: schemas.ShippingOptionCreate, owner_id: uuid.UUID) -> models.ShippingOption:
    db_shipping_option = models.ShippingOption(**shipping_option.dict(), owner_id=owner_id)
    db.add(db_shipping_option)
    db.commit()
    db.refresh(db_shipping_option)
    return db_shipping_option

# --- Shipment CRUD ---

def get_shipment(db: Session, shipment_id: uuid.UUID, owner_id: uuid.UUID) -> models.Shipment | None:
    return db.query(models.Shipment).filter(models.Shipment.id == shipment_id, models.Shipment.tenant_id == owner_id).first()

def get_shipments_by_owner(db: Session, owner_id: uuid.UUID) -> List[models.Shipment]:
    return db.query(models.Shipment).filter(models.Shipment.tenant_id == owner_id).all()

def create_shipment(db: Session, shipment: schemas.ShipmentCreate, owner_id: uuid.UUID) -> models.Shipment:
    db_shipment = models.Shipment(**shipment.dict(), tenant_id=owner_id)
    db.add(db_shipment)
    db.commit()
    db.refresh(db_shipment)
    return db_shipment

def update_shipment_status(db: Session, db_shipment: models.Shipment, status: str) -> models.Shipment:
    db_shipment.status = status
    db.add(db_shipment)
    db.commit()
    db.refresh(db_shipment)
    return db_shipment

def update_shipping_option(db: Session, db_shipping_option: models.ShippingOption, shipping_option_update: schemas.ShippingOptionUpdate) -> models.ShippingOption:
    for key, value in shipping_option_update.dict(exclude_unset=True).items():
        setattr(db_shipping_option, key, value)
    db.add(db_shipping_option)
    db.commit()
    db.refresh(db_shipping_option)
    return db_shipping_option

def delete_shipping_option(db: Session, db_shipping_option: models.ShippingOption):
    db.delete(db_shipping_option)
    db.commit()

# --- ProductType CRUD ---

def get_all_product_types(db: Session) -> List[models.ProductType]:
    """Get all product types"""
    return db.query(models.ProductType).all()

def get_product_type(db: Session, product_type_id: uuid.UUID) -> models.ProductType | None:
    return db.query(models.ProductType).filter(models.ProductType.id == product_type_id).first()

def get_product_type_by_name(db: Session, name: str) -> models.ProductType | None:
    return db.query(models.ProductType).filter(models.ProductType.name == name).first()

def create_product_type(db: Session, product_type: schemas.ProductTypeCreate) -> models.ProductType:
    db_product_type = models.ProductType(**product_type.dict())
    db.add(db_product_type)
    db.commit()
    db.refresh(db_product_type)
    return db_product_type

# --- AIAssistant CRUD ---

def get_assistant(db: Session, assistant_id: uuid.UUID, owner_id: uuid.UUID) -> models.AIAssistant | None:
    return db.query(models.AIAssistant).filter(models.AIAssistant.id == assistant_id, models.AIAssistant.owner_id == owner_id).first()

def get_assistants_by_owner(db: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[models.AIAssistant]:
    return db.query(models.AIAssistant).filter(models.AIAssistant.owner_id == owner_id).offset(skip).limit(limit).all()

def create_assistant(db: Session, assistant: schemas.AIAssistantCreate, owner_id: uuid.UUID) -> models.AIAssistant:
    db_assistant = models.AIAssistant(**assistant.dict(), owner_id=owner_id)
    db.add(db_assistant)
    db.commit()
    db.refresh(db_assistant)
    return db_assistant

def update_assistant_status(db: Session, db_assistant: models.AIAssistant, status: str) -> models.AIAssistant:
    db_assistant.status = status
    db.add(db_assistant)
    db.commit()
    db.refresh(db_assistant)
    return db_assistant

def delete_assistant(db: Session, db_assistant: models.AIAssistant):
    db.delete(db_assistant)
    db.commit()

# --- AIAssistantLog CRUD ---

def get_assistant_logs(db: Session, assistant_id: uuid.UUID, limit: int = 50) -> List[models.AIAssistantLog]:
    return db.query(models.AIAssistantLog)\
             .filter(models.AIAssistantLog.assistant_id == assistant_id)\
             .order_by(models.AIAssistantLog.created_at.desc())\
             .limit(limit)\
             .all()

def create_assistant_log(db: Session, assistant_id: uuid.UUID, action_type: str, detail: str, status: str = "success") -> models.AIAssistantLog:
    db_log = models.AIAssistantLog(
        assistant_id=assistant_id,
        action_type=action_type,
        detail=detail,
        status=status
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log
