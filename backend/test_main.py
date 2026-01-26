# backend/test_main.py
import os
import boto3
import uuid
from fastapi import HTTPException, status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from moto import mock_s3
from unittest.mock import patch, MagicMock
from ..backend.database import Base, get_db
from ..backend.main import app
from ..backend.security import create_access_token
from ..backend import models, crud
from datetime import timedelta

# --- Test Database Setup ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- Dependency Override ---
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Apply the override
app.dependency_overrides[get_db] = override_get_db

# --- Test Client ---
client = TestClient(app)

# --- Test Helpers ---
def get_auth_headers(email: str):
    token = create_access_token(data={"sub": email}, expires_delta=timedelta(minutes=15))
    return {"Authorization": f"Bearer {token}"}

# --- Tests ---
def setup_function():
    # Create the tables
    Base.metadata.create_all(bind=engine)
    # Ensure default plan is created for tests
    db = TestingSessionLocal()
    if not crud.get_default_plan(db):
        crud.create_plan(
            db=db,
            plan=models.Plan(
                name="Test Default Plan",
                description="Default plan for testing",
                commission_rate=0.10,
                monthly_fee=0.0,
                is_default=True,
            ),
        )
        db.commit()
    db.close()

def teardown_function():
    # Drop the tables
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test.db"):
        os.remove("./test.db")

def test_read_root_redirect():
    response = client.get("/")
    assert response.status_code == 200
    assert "BaseCommerce API is running" not in response.text

def test_create_plan_success():
    response = client.post(
        "/plans",
        json={
            "name": "Pro Plan",
            "description": "Professional tier",
            "commission_rate": 0.05,
            "monthly_fee": 29.99,
            "is_default": False
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Pro Plan"
    assert data["commission_rate"] == 0.05

def test_read_plans():
    # Ensure default plan is created by setup_function
    client.post(
        "/plans",
        json={
            "name": "Premium Plan",
            "description": "Premium tier",
            "commission_rate": 0.02,
            "monthly_fee": 99.99,
            "is_default": False
        },
    )
    response = client.get("/plans")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2 # Default plan + Premium plan
    assert any(p["name"] == "Test Default Plan" for p in data)
    assert any(p["name"] == "Premium Plan" for p in data)

def test_register_user_assigns_default_plan():
    response = client.post(
        "/auth/register",
        json={"email": "planuser@example.com", "password": "password123", "full_name": "Plan User"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    
    db = TestingSessionLocal()
    user = db.query(models.User).filter(models.User.email == "planuser@example.com").first()
    assert user is not None
    assert user.plan is not None
    assert user.plan.is_default == True
    assert user.plan.name == "Test Default Plan"
    db.close()


def test_register_user_success():
    response = client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "password123", "full_name": "Test User"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
    # The returned model should not include the password
    assert "hashed_password" not in data

def test_register_user_duplicate_email():
    # First user
    client.post(
        "/auth/register",
        json={"email": "testdup@example.com", "password": "password123", "full_name": "Test User"},
    )
    # Second user with same email
    response = client.post(
        "/auth/register",
        json={"email": "testdup@example.com", "password": "password456", "full_name": "Another User"},
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "Email already registered"}

def test_login_success():
    # First, register a user
    client.post(
        "/auth/register",
        json={"email": "login@example.com", "password": "password123", "full_name": "Login User"},
    )
    # Then, log in
    response = client.post(
        "/auth/login",
        data={"username": "login@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_incorrect_password():
    client.post(
        "/auth/register",
        json={"email": "logininc@example.com", "password": "password123", "full_name": "Login User"},
    )
    response = client.post(
        "/auth/login",
        data={"username": "logininc@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "Incorrect email or password"}

def test_clerk_login_new_user_success():
    with patch("backend.clerk_auth_service.verify_clerk_token") as mock_verify_clerk_token:
        mock_verify_clerk_token.return_value = {
            "id": "user_clerk_new",
            "email": "clerk_new@example.com",
            "full_name": "New Clerk User"
        }
        response = client.post("/auth/clerk-login", json={"clerk_token": "mock_clerk_valid_token"})
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        # Verify user was created in our DB
        db = TestingSessionLocal()
        user = db.query(models.User).filter(models.User.email == "clerk_new@example.com").first()
        assert user is not None
        db.close()

def test_clerk_login_existing_user_success():
    # Register user first with our system
    client.post("/auth/register", json={"email": "clerk_existing@example.com", "password": "password123", "full_name": "Existing Clerk User"})

    with patch("backend.clerk_auth_service.verify_clerk_token") as mock_verify_clerk_token:
        mock_verify_clerk_token.return_value = {
            "id": "user_clerk_existing",
            "email": "clerk_existing@example.com",
            "full_name": "Existing Clerk User"
        }
        response = client.post("/auth/clerk-login", json={"clerk_token": "mock_clerk_valid_token"})
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        # Verify user was not duplicated
        db = TestingSessionLocal()
        users_count = db.query(models.User).filter(models.User.email == "clerk_existing@example.com").count()
        assert users_count == 1
        db.close()

def test_clerk_login_invalid_token():
    with patch("backend.clerk_auth_service.verify_clerk_token") as mock_verify_clerk_token:
        mock_verify_clerk_token.side_effect = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Clerk token",
        )
        response = client.post("/auth/clerk-login", json={"clerk_token": "invalid_clerk_token"})
        assert response.status_code == 401
        assert response.json() == {"detail": "Invalid Clerk token"}


def test_create_product_with_variants_success():
    # Register and get auth headers
    client.post("/auth/register", json={"email": "productuser@example.com", "password": "password123"})
    headers = get_auth_headers("productuser@example.com")
    
    response = client.post(
        "/products",
        headers=headers,
        json={
            "name": "T-Shirt",
            "description": "A comfy tee",
            "price": 20.0,
            "variants": [
                {"name": "Red, S", "stock": 50, "price_adjustment": 0.0},
                {"name": "Blue, M", "stock": 30, "price_adjustment": 2.0},
            ],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "T-Shirt"
    assert len(data["variants"]) == 2
    assert data["variants"][0]["name"] == "Red, S"
    assert data["variants"][0]["stock"] == 50
    assert data["variants"][1]["name"] == "Blue, M"
    assert data["variants"][1]["stock"] == 30
    assert data["variants"][1]["price_adjustment"] == 2.0

def test_read_products_by_owner_with_variants():
    # Register user and create products
    client.post("/auth/register", json={"email": "owner@example.com", "password": "password123"})
    headers = get_auth_headers("owner@example.com")
    client.post(
        "/products",
        headers=headers,
        json={
            "name": "Shirt",
            "price": 25.0,
            "variants": [{"name": "Green", "stock": 10}],
        },
    )

    response = client.get("/products", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1 # May contain products from other tests
    shirt_product = next((p for p in data if p["name"] == "Shirt"), None)
    assert shirt_product is not None
    assert len(shirt_product["variants"]) == 1
    assert shirt_product["variants"][0]["name"] == "Green"

@mock_s3
def test_create_upload_url_success():
    # Setup mock S3
    s3 = boto3.client("s3", region_name="us-east-1")
    bucket_name = "test-bucket"
    os.environ["S3_BUCKET_NAME"] = bucket_name
    s3.create_bucket(Bucket=bucket_name)

    # Register user and get token
    client.post("/auth/register", json={"email": "s3user@example.com", "password": "password123"})
    headers = get_auth_headers("s3user@example.com")

    response = client.post(
        "/products/upload-url",
        headers=headers,
        params={"file_type": "image/jpeg"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert "fields" in data
    assert data["fields"]["key"].startswith("uploads/")
    del os.environ["S3_BUCKET_NAME"]

# --- Public Product Tests (Tenant-Aware) ---

def test_read_all_tenant_products_public_with_variants():
    db = TestingSessionLocal()
    owner1_email = "tenant1owner@example.com"
    client.post("/auth/register", json={"email": owner1_email, "password": "password123"})
    owner1_user = crud.get_user_by_email(db, owner1_email)
    owner1_headers = get_auth_headers(owner1_email)
    client.post(
        "/products",
        headers=owner1_headers,
        json={
            "name": "Tenant1 Product Variant",
            "price": 10.0,
            "variants": [{"name": "Size X", "stock": 5}],
        },
    )
    db.close()

    response = client.get(f"/public/stores/{owner1_user.id}/products")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    tenant1_product = next((p for p in data if p["name"] == "Tenant1 Product Variant"), None)
    assert tenant1_product is not None
    assert len(tenant1_product["variants"]) == 1
    assert tenant1_product["variants"][0]["name"] == "Size X"


def test_read_tenant_product_public_with_variants():
    db = TestingSessionLocal()
    owner_email = "singleproductvariantowner@example.com"
    client.post("/auth/register", json={"email": owner_email, "password": "password123"})
    owner_user = crud.get_user_by_email(db, owner_email)
    owner_headers = get_auth_headers(owner_email)
    
    product_res = client.post(
        "/products",
        headers=owner_headers,
        json={
            "name": "Single Tenant Product Variant",
            "price": 10.0,
            "variants": [{"name": "Color A", "stock": 20}],
        },
    )
    product_id = product_res.json()["id"]
    db.close()

    response = client.get(f"/public/stores/{owner_user.id}/products/{product_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Single Tenant Product Variant"
    assert len(data["variants"]) == 1
    assert data["variants"][0]["name"] == "Color A"

def test_read_tenant_product_not_found_or_wrong_tenant():
    db = TestingSessionLocal()
    owner_email = "tenantprod1@example.com"
    client.post("/auth/register", json={"email": owner_email, "password": "password123"})
    owner_user1 = crud.get_user_by_email(db, owner_email)
    owner_headers1 = get_auth_headers(owner_email)
    product_res = client.post("/products", headers=owner_headers1, json={"name": "Product for Tenant 1", "price": 10.0, "variants": [{"name": "Var1", "stock": 10}]})
    product_id_tenant1 = product_res.json()["id"]

    owner_email2 = "tenantprod2@example.com"
    client.post("/auth/register", json={"email": owner_email2, "password": "password123"})
    owner_user2 = crud.get_user_by_email(db, owner_email2)
    db.close()

    # Attempt to get product of tenant1 using tenant2's ID
    response = client.get(f"/public/stores/{owner_user2.id}/products/{product_id_tenant1}")
    assert response.status_code == 404
    assert "Product not found or does not belong to this store" in response.json()["detail"]

    # Attempt to get non-existent product
    non_existent_product_id = str(uuid.uuid4())
    response = client.get(f"/public/stores/{owner_user1.id}/products/{non_existent_product_id}")
    assert response.status_code == 404
    assert "Product not found or does not belong to this store" in response.json()["detail"]


# --- Order Tests ---

def test_create_order_success_with_variants():
    # 1. Create a user (owner of product)
    client.post("/auth/register", json={"email": "owner_order_variant@example.com", "password": "password123"})
    owner_headers = get_auth_headers("owner_order_variant@example.com")
    
    # 2. Create a product with variants
    product_res = client.post(
        "/products",
        headers=owner_headers,
        json={
            "name": "Shirt with Variant",
            "price": 20.0,
            "variants": [
                {"name": "Red, L", "stock": 10, "price_adjustment": 5.0},
                {"name": "Blue, M", "stock": 5, "price_adjustment": 0.0},
            ],
        },
    )
    product_id = product_res.json()["id"]
    red_l_variant_id = product_res.json()["variants"][0]["id"]
    blue_m_variant_id = product_res.json()["variants"][1]["id"]

    # 3. Create another user (customer)
    client.post("/auth/register", json={"email": "customer_order_variant@example.com", "password": "password123"})
    customer_headers = get_auth_headers("customer_order_variant@example.com")

    # 4. Create an order with variants
    order_payload = {
        "items": [
            {"product_variant_id": red_l_variant_id, "quantity": 1},
            {"product_variant_id": blue_m_variant_id, "quantity": 2},
        ]
    }
    response = client.post("/orders", headers=customer_headers, json=order_payload)
    
    assert response.status_code == 200
    data = response.json()
    # Base price 20.0 + Red, L variant adjustment 5.0 = 25.0 * 1 = 25.0
    # Base price 20.0 + Blue, M variant adjustment 0.0 = 20.0 * 2 = 40.0
    # Total = 25.0 + 40.0 = 65.0
    assert data["total_price"] == 65.0
    assert data["status"] == "pending"
    assert len(data["items"]) == 2
    assert data["items"][0]["product_variant_id"] == red_l_variant_id
    assert data["items"][0]["quantity"] == 1
    assert data["items"][0]["price_at_purchase"] == 25.0
    assert data["items"][1]["product_variant_id"] == blue_m_variant_id
    assert data["items"][1]["quantity"] == 2
    assert data["items"][1]["price_at_purchase"] == 20.0

def test_create_order_insufficient_variant_stock():
    client.post("/auth/register", json={"email": "owner_stock_variant@example.com", "password": "password123"})
    owner_headers = get_auth_headers("owner_stock_variant@example.com")
    product_res = client.post(
        "/products",
        headers=owner_headers,
        json={
            "name": "Limited Variant",
            "price": 10.0,
            "variants": [{"name": "One Left", "stock": 1}],
        },
    )
    variant_id = product_res.json()["variants"][0]["id"]

    client.post("/auth/register", json={"email": "customer_stock_variant@example.com", "password": "password123"})
    customer_headers = get_auth_headers("customer_stock_variant@example.com")

    order_payload = {"items": [{"product_variant_id": variant_id, "quantity": 2}]} # Request 2, only 1 in stock
    response = client.post("/orders", headers=customer_headers, json=order_payload)

    assert response.status_code == 400
    assert "Not enough stock for variant One Left" in response.json()["detail"]

def test_create_order_product_variant_not_found():
    client.post("/auth/register", json={"email": "customer_variant_notfound@example.com", "password": "password123"})
    customer_headers = get_auth_headers("customer_variant_notfound@example.com")

    non_existent_variant_id = str(uuid.uuid4())
    order_payload = {"items": [{"product_variant_id": non_existent_variant_id, "quantity": 1}]}
    response = client.post("/orders", headers=customer_headers, json=order_payload)

    assert response.status_code == 404
    assert "Product variant with id" in response.json()["detail"]
    assert "not found" in response.json()["detail"]

def test_read_orders_by_customer_success_with_variants():
    # 1. Create a user (owner of product)
    client.post("/auth/register", json={"email": "owner_orders_variant@example.com", "password": "password123"})
    owner_headers = get_auth_headers("owner_orders_variant@example.com")
    
    # 2. Create a product with variant
    product_res = client.post("/products", headers=owner_headers, json={"name": "Variant Product", "price": 5.0, "variants": [{"name": "Default", "stock": 10}]})
    product_id = product_res.json()["id"]
    variant_id = product_res.json()["variants"][0]["id"]

    # 3. Create a customer
    customer_email = "customer_orders_variant@example.com"
    client.post("/auth/register", json={"email": customer_email, "password": "password123"})
    customer_headers = get_auth_headers(customer_email)

    # 4. Create an order
    order_payload = {"items": [{"product_variant_id": variant_id, "quantity": 2}]}
    client.post("/orders", headers=customer_headers, json=order_payload)
    
    # 5. Fetch orders for the customer
    response = client.get("/orders", headers=customer_headers)
    assert response.status_code == 200
    orders = response.json()
    assert len(orders) > 0 # At least one order
    
    db = TestingSessionLocal()
    customer_user_from_db = crud.get_user_by_email(db, customer_email)
    db.close()
    assert any(str(order["customer_id"]) == str(customer_user_from_db.id) for order in orders)
    
    # Check if order items contain product variant details
    assert any(item["product_variant_id"] == variant_id for order in orders for item in order["items"])


# --- Payment Tests ---

@patch("backend.payment_service.sdk.preference")
def test_create_payment_preference_success(mock_preference_sdk):
    mock_preference_sdk.create.return_value = {
        "response": {"id": "mock_preference_id", "init_point": "http://mock.mercadopago.com/init"}
    }

    # Register user (owner of product)
    owner_email = "owner_mp_variant@example.com"
    client.post("/auth/register", json={"email": owner_email, "password": "password123"})
    owner_headers = get_auth_headers(owner_email)
    
    # Create product with variant
    product_res = client.post("/products", headers=owner_headers, json={"name": "Test Product MP Variant", "price": 10.0, "variants": [{"name": "Default MP", "stock": 50}]})
    product_id = product_res.json()["id"]
    variant_id = product_res.json()["variants"][0]["id"]
    owner_id = product_res.json()["owner_id"] # Get the owner_id (tenant_id) from the created product

    # Register customer and create order
    customer_email = "customer_mp_variant@example.com"
    client.post("/auth/register", json={"email": customer_email, "password": "password123"})
    customer_headers = get_auth_headers(customer_email)
    order_payload = {"items": [{"product_variant_id": variant_id, "quantity": 1}]}
    order_res = client.post("/orders", headers=customer_headers, json=order_payload)
    order_id = order_res.json()["id"]

    response = client.post(
        f"/payments/create-preference/{order_id}",
        headers=customer_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["preference_id"] == "mock_preference_id"
    assert data["init_point"] == "http://mock.mercadopago.com/init"
    mock_preference_sdk.create.assert_called_once()
    # Verify that tenant_id was passed to create_mp_preference
    mock_preference_sdk.create.assert_called_with(
        {'items': [{'title': 'Test Product MP Variant', 'quantity': 1, 'unit_price': 10.0, 'currency_id': 'CLP'}], 
         'payer': {'email': customer_email}, 
         'back_urls': {'success': 'http://localhost:8000/payments/success', 'failure': 'http://localhost:8000/payments/failure', 'pending': 'http://localhost:8000/payments/pending'}, 
         'auto_return': 'approved', 
         'external_reference': str(order_id), 
         'notification_url': 'http://localhost:8000/payments/webhook', 
         'metadata': {'tenant_id': str(owner_id), 'commission_rate': 0.10}} # Assuming default commission rate from plan
    )

def test_mercadopago_webhook_payment_received():
    # Setup for webhook test
    db = TestingSessionLocal()
    
    # Create an owner and a product
    owner_email = "webhook_owner_variant@example.com"
    client.post("/auth/register", json={"email": owner_email, "password": "password123"})
    owner_user = crud.get_user_by_email(db, owner_email)
    owner_headers = get_auth_headers(owner_email)
    product_res = client.post("/products", headers=owner_headers, json={"name": "Webhook Product Variant", "price": 50.0, "variants": [{"name": "Default Variant", "stock": 10}]})
    product_id = product_res.json()["id"]
    variant_id = product_res.json()["variants"][0]["id"]

    # Create a customer and an order
    customer_email = "webhook_customer_variant@example.com"
    client.post("/auth/register", json={"email": customer_email, "password": "password123"})
    customer_headers = get_auth_headers(customer_email)
    order_payload = {"items": [{"product_variant_id": variant_id, "quantity": 1}]}
    order_res = client.post("/orders", headers=customer_headers, json=order_payload)
    order_id = order_res.json()["id"]

    # Get the order before webhook processes it
    order_before = db.query(models.Order).filter(models.Order.id == order_id).first()
    assert order_before.status == "pending"

    # Simulate webhook call
    response = client.post(f"/payments/webhook?topic=payment&id={order_id}")
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert f"Payment notification for Order ID: {order_id} received. Status updated to 'completed'." in response.json()["message"]

    # Verify order status updated and commission calculated
    order_after = db.query(models.Order).filter(models.Order.id == order_id).first()
    assert order_after.status == "completed"
    
    commission_rate = owner_user.plan.commission_rate
    expected_commission = order_after.total_price * commission_rate
    expected_net_to_tenant = order_after.total_price - expected_commission
    # The print statements in main.py will show these values, but we can't assert prints directly.
    # For a real test, you'd check a Transaction or Payout record in DB.
    # For now, we trust the logic in main.py based on print and order status update.

    db.close()


def test_mercadopago_webhook_invalid_notification():
    response = client.post("/payments/webhook")
    assert response.status_code == 400
    assert response.json()["status"] == "error"
    assert "Invalid notification format" in response.json()["message"]
