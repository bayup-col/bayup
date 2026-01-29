import os
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from database import Base, get_db
from main import app
import models, crud, schemas
from unittest.mock import patch, Mock, MagicMock

# Setup test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_everything():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    print("\n--- FINAL VERIFICATION START ---")
    
    # 1. Test Clerk Login Provisioning
    email = "clerk_new @example.com"
    with patch("backend.clerk_auth_service.verify_clerk_token") as mock_verify:
        mock_verify.return_value = {
            "id": "user_clerk_new",
            "email": email,
            "full_name": "New Clerk User"
        }
        resp = client.post("/auth/clerk-login", json={"clerk_token": "mock_token"})
        print(f"Clerk login status: {resp.status_code}")
        
        # Verify user in DB
        db_user = db.query(models.User).filter(models.User.email == email).first()
        print(f"User created in DB: {db_user is not None}")
        if db_user:
            print(f"Email check: '{db_user.email}' == '{email}': {db_user.email == email}")

    # 2. Test MercadoPago Mock Call
    with patch("backend.payment_service.sdk.preference") as mock_pref:
        mock_pref.create.return_value = {"id": "mock_preference_id", "init_point": "http://mock.link"}
        
        # Need an order first
        user = db_user
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create product
        client.post("/products", headers=headers, json={"name": "P1", "price": 10, "variants": [{"name": "V1", "stock": 5}]}"})
        prod = db.query(models.Product).first()
        variant_id = prod.variants[0].id
        
        # Create order
        order_resp = client.post("/orders", headers=headers, json={"items": [{"product_variant_id": str(variant_id), "quantity": 1}]})
        order_id = order_resp.json()["id"]
        print(f"Order created: {order_id}")
        
        # Create preference
        pref_resp = client.post(f"/payments/create-preference/{order_id}", headers=headers)
        print(f"Create preference status: {pref_resp.status_code}")
        print(f"Preference ID: {pref_resp.json().get('preference_id')}")
        print(f"Mock called once: {mock_pref.create.call_count == 1}")

    # 3. Test Webhook Atomic Update
    webhook_resp = client.post(f"/payments/webhook?topic=payment&id={order_id}")
    print(f"Webhook status: {webhook_resp.status_code}")
    print(f"Webhook message: {webhook_resp.json().get('message')}")
    
    # Check status in DB
    db.expire_all()
    order_after = db.query(models.Order).filter(models.Order.id == order_id).first()
    print(f"Order status in DB: {order_after.status}")

    print("--- FINAL VERIFICATION END ---\n")

if __name__ == "__main__":
    test_everything()
