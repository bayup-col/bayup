import mercadopago
import os
import uuid
from sqlalchemy.orm import Session
import crud, models, schemas

sdk = mercadopago.SDK(os.getenv("MP_ACCESS_TOKEN", "TEST-TOKEN"))

def create_mp_preference(db: Session, order_id: uuid.UUID, customer_email: str, tenant_id: uuid.UUID) -> dict:
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise ValueError("Order not found")

    # Use the tenant_id provided or the owner_id from the order
    effective_tenant_id = tenant_id or order.tenant_id
    tenant = db.query(models.User).filter(models.User.id == effective_tenant_id).first()
    
    items = []
    if order.items:
        for item in order.items:
            # Resolve product name through relationship
            product_name = "Producto"
            try:
                if item.product_variant and item.product_variant.product:
                    product_name = item.product_variant.product.name
            except:
                pass
            
            items.append({
                "title": product_name,
                "quantity": item.quantity,
                "unit_price": float(item.price_at_purchase),
                "currency_id": "CLP",
            })
    
    if not items:
        # Fallback for orders without explicit items in DB (if any)
        items.append({
            "title": "Orden de Compra",
            "quantity": 1,
            "unit_price": float(order.total_price),
            "currency_id": "CLP",
        })

    # Get commission rate safely
    commission_rate = 0.10
    try:
        tenant_obj = db.query(models.User).filter(models.User.id == tenant_id).first()
        if tenant_obj and tenant_obj.plan:
            commission_rate = tenant_obj.plan.commission_rate
    except:
        pass

    preference_data = {
        "items": items,
        "payer": {"email": customer_email},
        "external_reference": str(order.id),
        "notification_url": "http://localhost:8000/payments/webhook",
        "metadata": {
            "tenant_id": str(tenant_id),
            "commission_rate": commission_rate
        }
    }

    result = sdk.preference().create(preference_data)
    if "response" not in result:
        raise Exception("SDK Error")
    return result["response"]
