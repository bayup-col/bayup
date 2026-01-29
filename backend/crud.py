# backend/crud.py
from sqlalchemy.orm import Session, joinedload
import uuid
from typing import Optional, List
import models, schemas, security
from fastapi import HTTPException, status

# --- CRUD ---
def get_default_plan(db: Session): return db.query(models.Plan).filter(models.Plan.is_default == True).first()

def create_plan(db: Session, plan: schemas.PlanCreate):
    db_plan = models.Plan(**plan.dict())
    db.add(db_plan)
    db.commit(); db.refresh(db_plan)
    return db_plan

def get_user_by_email(db: Session, email: str): return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed = security.get_password_hash(user.password)
    dp = get_default_plan(db)
    db_user = models.User(email=user.email, full_name=user.full_name, hashed_password=hashed, role=user.role or "admin_tienda", status=user.status or "Activo", plan_id=dp.id if dp else None)
    db.add(db_user); db.commit(); db.refresh(db_user)
    return db_user

def get_product(db: Session, product_id: uuid.UUID, tenant_id: Optional[uuid.UUID] = None):
    q = db.query(models.Product).filter(models.Product.id == product_id).options(joinedload(models.Product.variants))
    if tenant_id: q = q.filter(models.Product.owner_id == tenant_id)
    return q.first()

def get_product_variant(db: Session, variant_id: uuid.UUID): return db.query(models.ProductVariant).filter(models.ProductVariant.id == variant_id).first()

def get_all_products(db: Session, tenant_id: Optional[uuid.UUID] = None, skip: int = 0, limit: int = 100):
    q = db.query(models.Product).options(joinedload(models.Product.variants))
    if tenant_id: q = q.filter(models.Product.owner_id == tenant_id)
    return q.offset(skip).limit(limit).all()

def get_products_by_owner(db: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100):
    return db.query(models.Product).filter(models.Product.owner_id == owner_id).options(joinedload(models.Product.variants)).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate, owner_id: uuid.UUID):
    db_p = models.Product(**product.dict(exclude={"variants"}), owner_id=owner_id)
    db.add(db_p); db.flush()
    for v in product.variants: db.add(models.ProductVariant(**v.dict(), product_id=db_p.id))
    db.commit(); db.refresh(db_p)
    return db_p

def create_order(db: Session, order: schemas.OrderCreate, customer_id: uuid.UUID):
    st = 0; items = []; tid = None
    for item in order.items:
        v = get_product_variant(db, item.product_variant_id)
        if not v: raise HTTPException(404, f"Product variant with id {item.product_variant_id} not found")
        if v.stock < item.quantity: raise HTTPException(400, f"Not enough stock for variant {v.name}")
        if tid is None: tid = v.product.owner_id
        p = v.product.price + v.price_adjustment
        st += p * item.quantity
        items.append({"v": v, "q": item.quantity, "p": p})
    db_o = models.Order(total_price=st, customer_id=customer_id, tenant_id=tid, customer_name=order.customer_name, customer_email=order.customer_email, seller_name=order.seller_name)
    db.add(db_o); db.flush()
    for i in items:
        db.add(models.OrderItem(order_id=db_o.id, product_variant_id=i["v"].id, quantity=i["q"], price_at_purchase=i["p"]))
        i["v"].stock -= i["q"]
    db.commit(); db.refresh(db_o)
    return db_o

def get_orders_by_customer(db: Session, customer_id: uuid.UUID): return db.query(models.Order).filter(models.Order.customer_id == customer_id).all()

def create_income(db: Session, income: schemas.IncomeCreate, tenant_id: uuid.UUID):
    db_i = models.Income(**income.dict(), tenant_id=tenant_id)
    db.add(db_i); db.commit(); db.refresh(db_i)
    return db_i

def create_collection(db: Session, collection: schemas.CollectionCreate, owner_id: uuid.UUID):
    db_c = models.Collection(**collection.dict(), owner_id=owner_id)
    db.add(db_c); db.commit(); db.refresh(db_c)
    return db_c

def get_collections_by_owner(db: Session, owner_id: uuid.UUID): return db.query(models.Collection).filter(models.Collection.owner_id == owner_id).all()

def create_custom_role(db: Session, role_in: schemas.CustomRoleCreate, owner_id: uuid.UUID):
    db_r = models.CustomRole(id=uuid.uuid4(), name=role_in.name, permissions=role_in.permissions, owner_id=owner_id)
    db.add(db_r); db.commit(); db.refresh(db_r)
    return db_r

def get_shipment(db: Session, sid: uuid.UUID, tid: uuid.UUID): return db.query(models.Shipment).filter(models.Shipment.id == sid, models.Shipment.tenant_id == tid).first()

def get_shipments_by_owner(db: Session, tid: uuid.UUID): return db.query(models.Shipment).filter(models.Shipment.tenant_id == tid).all()

def create_shipment(db: Session, shipment: schemas.ShipmentCreate, tid: uuid.UUID):
    db_s = models.Shipment(**shipment.dict(), tenant_id=tid)
    db.add(db_s); db.commit(); db.refresh(db_s)
    return db_s

def update_shipment_status(db: Session, db_s: models.Shipment, status: str):
    db_s.status = status; db.commit(); db.refresh(db_s)
    return db_s
