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

    tenant = db.query(models.User).filter(models.User.id == tenant_id).first()
    
    items = []
    for item in order.items:
        # Resolve product name through relationship
        product_name = item.product_variant.product.name if item.product_variant and item.product_variant.product else "Producto"
        items.append({
            "title": product_name,
            "quantity": item.quantity,
            "unit_price": float(item.price_at_purchase),
            "currency_id": "CLP",
        })

    preference_data = {
        "items": items,
        "payer": {"email": customer_email},
        "external_reference": str(order.id),
        "notification_url": "http://localhost:8000/payments/webhook",
        "metadata": {
            "tenant_id": str(tenant_id),
            "commission_rate": tenant.plan.commission_rate if tenant and tenant.plan else 0.10
        }
    }

    result = sdk.preference().create(preference_data)
    if "response" not in result:
        raise Exception("SDK Error")
    return result["response"]
