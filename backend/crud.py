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

def get_user_by_slug(db: Session, slug: str) -> models.User | None:
    return db.query(models.User).filter(models.User.shop_slug == slug).first()

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
    query = db.query(models.Product).filter(models.Product.id == product_id).options(
        joinedload(models.Product.variants),
        joinedload(models.Product.collection)
    )
    if tenant_id:
        query = query.filter(models.Product.owner_id == tenant_id)
    return query.first()

def get_product_variant(db: Session, variant_id: uuid.UUID) -> models.ProductVariant | None:
    return db.query(models.ProductVariant).filter(models.ProductVariant.id == variant_id).first()

def get_all_products(db: Session, tenant_id: Optional[uuid.UUID] = None, skip: int = 0, limit: int = 100) -> list[models.Product]:
    query = db.query(models.Product).options(
        joinedload(models.Product.variants),
        joinedload(models.Product.collection)
    )
    if tenant_id:
        query = query.filter(models.Product.owner_id == tenant_id)
    return query.offset(skip).limit(limit).all()

def get_products_by_owner(db: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100) -> list[models.Product]:
    return db.query(models.Product).filter(models.Product.owner_id == owner_id).options(
        joinedload(models.Product.variants),
        joinedload(models.Product.collection)
    ).order_by(models.Product.id.desc()).offset(skip).limit(limit).all()

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

def delete_product(db: Session, product_id: uuid.UUID, owner_id: uuid.UUID) -> bool:
    db_product = db.query(models.Product).filter(models.Product.id == product_id, models.Product.owner_id == owner_id).first()
    if db_product:
        db.delete(db_product)
        db.commit()
        return True
    return False

# --- Order CRUD ---
def create_order(db: Session, order: schemas.OrderCreate, customer_id: uuid.UUID, tenant_id: Optional[uuid.UUID] = None) -> models.Order:
    subtotal = 0
    items_to_create = []
    actual_tenant_id = tenant_id if tenant_id else customer_id

    # 1. Validar Variantes e Inventario
    for item in order.items:
        v = get_product_variant(db, item.product_variant_id)
        if not v:
            raise HTTPException(status_code=404, detail="Variante no encontrada")
        
        price = v.product.price + v.price_adjustment
        if order.customer_type == 'mayorista' and v.product.wholesale_price > 0:
            price = v.product.wholesale_price + v.price_adjustment
            
        subtotal += price * item.quantity
        items_to_create.append({"variant": v, "qty": item.quantity, "price": price})
    
    # 2. Crear la Orden Maestra
    db_order = models.Order(
        id=uuid.uuid4(),
        total_price=subtotal,
        customer_id=customer_id,
        tenant_id=actual_tenant_id,
        customer_name=order.customer_name,
        customer_email=order.customer_email,
        customer_phone=order.customer_phone,
        customer_type=order.customer_type,
        source=order.source,
        payment_method=order.payment_method,
        seller_name=order.seller_name,
        status="completed"
    )
    db.add(db_order)
    db.flush()
    
    # 3. Registrar Items y Descontar Stock
    for it in items_to_create:
        db_item = models.OrderItem(
            id=uuid.uuid4(),
            order_id=db_order.id,
            product_variant_id=it["variant"].id,
            quantity=it["qty"],
            price_at_purchase=it["price"]
        )
        db.add(db_item)
        it["variant"].stock -= it["qty"]

    # 4. INTEGRACIÓN CRM: Sincronizar Cliente
    if order.customer_email:
        # Buscar si el cliente ya existe bajo este dueño de tienda
        client_record = db.query(models.User).filter(
            models.User.email == order.customer_email.lower().strip(),
            models.User.owner_id == actual_tenant_id
        ).first()

        if client_record:
            # Actualizar cliente existente
            client_record.total_spent += subtotal
            client_record.loyalty_points += int(subtotal / 1000) # 1 punto por cada 1000 pesos
            client_record.last_purchase_date = db_order.created_at
            client_record.last_purchase_summary = f"Compra #{str(db_order.id)[:4].upper()} - {len(items_to_create)} items"
        else:
            # Crear nuevo cliente automático en la base de datos
            new_client = models.User(
                id=uuid.uuid4(),
                email=order.customer_email.lower().strip(),
                full_name=order.customer_name,
                phone=order.customer_phone,
                owner_id=actual_tenant_id,
                total_spent=subtotal,
                loyalty_points=int(subtotal / 1000),
                last_purchase_date=db_order.created_at,
                last_purchase_summary=f"Primer pedido registrado",
                role="cliente"
            )
            db.add(new_client)

    # 5. INTEGRACIÓN LOGÍSTICA: Crear Envío Automático
    db_shipment = models.Shipment(
        id=uuid.uuid4(),
        order_id=db_order.id,
        tenant_id=actual_tenant_id,
        recipient_name=order.customer_name or "Cliente",
        destination_address="Pendiente por confirmar",
        status="pending_packing"
    )
    db.add(db_shipment)

    # 6. INTEGRACIÓN DASHBOARD: Log de Actividad
    db_log = models.ActivityLog(
        id=uuid.uuid4(),
        user_id=customer_id,
        tenant_id=actual_tenant_id,
        action="Venta Realizada",
        detail=f"Factura #{str(db_order.id)[:4].upper()} por ${subtotal:,.0f} ({order.source})",
        target_id=str(db_order.id)
    )
    db.add(db_log)

    # 7. INTEGRACIÓN FINANCIERA: Registrar Ingreso
    db_income = models.Income(
        id=uuid.uuid4(),
        tenant_id=actual_tenant_id,
        amount=subtotal,
        description=f"Venta {order.source} - Factura {str(db_order.id)[:4].upper()}",
        category="Ventas"
    )
    db.add(db_income)
    
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