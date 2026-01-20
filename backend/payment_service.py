# backend/payment_service.py
import mercadopago
import os
import uuid

from sqlalchemy.orm import Session
from . import crud, models, schemas

# Initialize Mercado Pago SDK
# TODO: Move MP_ACCESS_TOKEN to environment variable and retrieve securely
sdk = mercadopago.SDK(os.getenv("MP_ACCESS_TOKEN", "YOUR_ACCESS_TOKEN"))

def create_mp_preference(db: Session, order_id: uuid.UUID, customer_email: str, tenant_id: uuid.UUID) -> dict:
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise ValueError("Order not found")

    # For MVP, we use fixed back_urls and notification_url
    # In a real app, these would be dynamic and properly configured
    BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000") # TODO: use actual backend URL

    items = []
    for item in order.items:
        product = crud.get_product(db, item.product_id) # Assuming get_product is available in crud
        if product:
            items.append({
                "title": product.name,
                "quantity": item.quantity,
                "unit_price": float(item.price_at_purchase),
                "currency_id": "CLP", # Assuming Chilean Peso for now, should be dynamic
            })

    preference_data = {
        "items": items,
        "payer": {
            "email": customer_email, # This email is from the authenticated user creating the order
        },
        "back_urls": {
            "success": f"{BACKEND_URL}/payments/success", # Placeholder
            "failure": f"{BACKEND_URL}/payments/failure", # Placeholder
            "pending": f"{BACKEND_URL}/payments/pending", # Placeholder
        },
        "auto_return": "approved",
        "external_reference": str(order.id), # Link payment to our order ID
        "notification_url": f"{BACKEND_URL}/payments/webhook",
        "metadata": {
            "tenant_id": str(tenant_id)
        }
    }

    preference_response = sdk.preference().create(preference_data)
    preference = preference_response["response"]
    return preference
