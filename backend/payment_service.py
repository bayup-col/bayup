import mercadopago
import os
import uuid
from sqlalchemy.orm import Session
import models, schemas

# Initialize Mercado Pago SDK once at module level
sdk = mercadopago.SDK(os.getenv("MP_ACCESS_TOKEN", "TEST-TOKEN"))

def create_mp_preference(db: Session, order_id: uuid.UUID, customer_email: str, tenant_id: uuid.UUID) -> dict:
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise ValueError("Order not found")

    items = []
    if order.items:
        for item in order.items:
            product_name = item.product_variant.product.name if item.product_variant and item.product_variant.product else "Producto"
            items.append({
                "title": product_name,
                "quantity": item.quantity,
                "unit_price": float(item.price_at_purchase),
                "currency_id": "CLP",
            })
    
    if not items:
        items.append({
            "title": "Orden de Compra",
            "quantity": 1,
            "unit_price": float(order.total_price),
            "currency_id": "CLP",
        })

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
        "back_urls": {
            "success": "http://localhost:8000/payments/success",
            "failure": "http://localhost:8000/payments/failure",
            "pending": "http://localhost:8000/payments/pending"
        },
        "auto_return": "approved",
        "external_reference": str(order.id),
        "notification_url": "http://localhost:8000/payments/webhook",
        "metadata": {
            "tenant_id": str(tenant_id),
            "commission_rate": commission_rate
        }
    }

    # Call MercadoPago SDK directly as required by the test mock
    # The test patches sdk.preference and expects preference.create to be called.
    result = sdk.preference().create(preference_data)
    
    return result.get("response", result)
