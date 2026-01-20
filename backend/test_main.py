# backend/test_main.py
import os
import boto3
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from moto import mock_s3
from unittest.mock import patch, MagicMock
from ..backend.database import Base, get_db
from ..backend.main import app
from ..backend.security import create_access_token
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

def teardown_function():
    # Drop the tables
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test.db"):
        os.remove("./test.db")

def test_read_root_redirect():
    response = client.get("/")
    assert response.status_code == 200 # RedirectResponse returns 200
    # For a client that follows redirects, it would be 200
    # For a test client, it returns the actual response of the redirected path
    assert "BaseCommerce API is running" not in response.text
    # Check if it was redirected to /public/products - by checking content
    # This might require parsing HTML or just ensuring it's not the old root
    # For now, just check that it's not the old root message.

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
        json={"email": "test@example.com", "password": "password123", "full_name": "Test User"},
    )
    # Second user with same email
    response = client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "password456", "full_name": "Another User"},
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
        json={"email": "login@example.com", "password": "password123", "full_name": "Login User"},
    )
    response = client.post(
        "/auth/login",
        data={"username": "login@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "Incorrect email or password"}

def test_create_product_success():
    # Register and get auth headers
    client.post("/auth/register", json={"email": "productuser@example.com", "password": "password123"})
    headers = get_auth_headers("productuser@example.com")
    
    response = client.post(
        "/products",
        headers=headers,
        json={"name": "Test Product", "description": "A great product", "price": 9.99, "stock": 100},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Product"
    assert data["price"] == 9.99

def test_create_product_unauthenticated():
    response = client.post(
        "/products",
        json={"name": "Test Product", "description": "A great product", "price": 9.99, "stock": 100},
    )
    assert response.status_code == 401 # Unauthorized

def test_read_products_by_owner():
    # Register user and create products
    client.post("/auth/register", json={"email": "owner@example.com", "password": "password123"})
    headers = get_auth_headers("owner@example.com")
    client.post("/products", headers=headers, json={"name": "Product 1", "price": 10, "stock": 10})
    client.post("/products", headers=headers, json={"name": "Product 2", "price": 20, "stock": 20})

    # List products
    response = client.get("/products", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["name"] == "Product 1"
    assert data[1]["name"] == "Product 2"

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

# --- Public Product Tests ---

def test_read_all_products_public():
    # Create an owner and products
    owner_email = "publicowner@example.com"
    client.post("/auth/register", json={"email": owner_email, "password": "password123"})
    owner_headers = get_auth_headers(owner_email)
    client.post("/products", headers=owner_headers, json={"name": "Public Product 1", "price": 5.0, "stock": 50})
    client.post("/products", headers=owner_headers, json={"name": "Public Product 2", "price": 7.5, "stock": 70})

    response = client.get("/public/products")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2 # May contain products from other tests if DB not completely clean
    assert any(p["name"] == "Public Product 1" for p in data)
    assert any(p["name"] == "Public Product 2" for p in data)

def test_read_product_public():
    # Create an owner and a product
    owner_email = "singleproductowner@example.com"
    client.post("/auth/register", json={"email": owner_email, "password": "password123"})
    owner_headers = get_auth_headers(owner_email)
    product_res = client.post("/products", headers=owner_headers, json={"name": "Single Public Product", "price": 12.34, "stock": 25})
    product_id = product_res.json()["id"]

    response = client.get(f"/public/products/{product_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Single Public Product"
    assert data["price"] == 12.34

def test_read_product_public_not_found():
    non_existent_product_id = str(uuid.uuid4())
    response = client.get(f"/public/products/{non_existent_product_id}")
    assert response.status_code == 404
    assert response.json() == {"detail": "Product not found"}


# --- Order Tests ---

def test_create_order_success():
    # 1. Create a user (owner of product)
    client.post("/auth/register", json={"email": "owner@example.com", "password": "password123"})
    owner_headers = get_auth_headers("owner@example.com")
    
    # 2. Create a product
    product_res = client.post("/products", headers=owner_headers, json={"name": "Super Mug", "price": 15.50, "stock": 20})
    product_id = product_res.json()["id"]

    # 3. Create another user (customer)
    client.post("/auth/register", json={"email": "customer@example.com", "password": "password123"})
    customer_headers = get_auth_headers("customer@example.com")

    # 4. Create an order
    order_payload = {"items": [{"product_id": product_id, "quantity": 2}]}
    response = client.post("/orders", headers=customer_headers, json=order_payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["total_price"] == 31.0
    assert data["status"] == "pending"
    assert len(data["items"]) == 1
    assert data["items"][0]["product_id"] == product_id
    assert data["items"][0]["quantity"] == 2

def test_create_order_insufficient_stock():
    client.post("/auth/register", json={"email": "owner@example.com", "password": "password123"})
    owner_headers = get_auth_headers("owner@example.com")
    product_res = client.post("/products", headers=owner_headers, json={"name": "Limited Edition", "price": 100, "stock": 5})
    product_id = product_res.json()["id"]

    client.post("/auth/register", json={"email": "customer@example.com", "password": "password123"})
    customer_headers = get_auth_headers("customer@example.com")

    order_payload = {"items": [{"product_id": product_id, "quantity": 10}]} # Request 10, only 5 in stock
    response = client.post("/orders", headers=customer_headers, json=order_payload)

    assert response.status_code == 400
    assert "Not enough stock" in response.json()["detail"]

def test_create_order_product_not_found():
    client.post("/auth/register", json={"email": "customer@example.com", "password": "password123"})
    customer_headers = get_auth_headers("customer@example.com")

    non_existent_product_id = str(uuid.uuid4())
    order_payload = {"items": [{"product_id": non_existent_product_id, "quantity": 1}]}
    response = client.post("/orders", headers=customer_headers, json=order_payload)

    assert response.status_code == 404
    assert "not found" in response.json()["detail"]

def test_read_orders_by_customer_success():
    # 1. Create a user (owner of product)
    client.post("/auth/register", json={"email": "owner_orders@example.com", "password": "password123"})
    owner_headers = get_auth_headers("owner_orders@example.com")
    
    # 2. Create a product
    product_res = client.post("/products", headers=owner_headers, json={"name": "Orderable Product", "price": 10.0, "stock": 100})
    product_id = product_res.json()["id"]

    # 3. Create a customer
    customer_email = "customer_orders@example.com"
    client.post("/auth/register", json={"email": customer_email, "password": "password123"})
    customer_headers = get_auth_headers(customer_email)

    # 4. Create an order
    order_payload = {"items": [{"product_id": product_id, "quantity": 1}]}
    client.post("/orders", headers=customer_headers, json=order_payload)
    
    # 5. Fetch orders for the customer
    response = client.get("/orders", headers=customer_headers)
    assert response.status_code == 200
    orders = response.json()
    assert len(orders) > 0 # At least one order
    assert any(order["customer_id"] == str(client.get("/users/me", headers=customer_headers).json()["id"]) for order in orders)
    assert any(len(order["items"]) > 0 for order in orders)


# --- Payment Tests ---

@patch("backend.payment_service.sdk.preference")
def test_create_payment_preference_success(mock_preference_sdk):
    mock_preference_sdk.create.return_value = {
        "response": {"id": "mock_preference_id", "init_point": "http://mock.mercadopago.com/init"}
    }

    # Register user (owner of product)
    owner_email = "owner@example.com"
    client.post("/auth/register", json={"email": owner_email, "password": "password123"})
    owner_headers = get_auth_headers(owner_email)
    
    # Create product
    product_res = client.post("/products", headers=owner_headers, json={"name": "Test Product MP", "price": 10.0, "stock": 50})
    product_id = product_res.json()["id"]
    owner_id = product_res.json()["owner_id"] # Get the owner_id (tenant_id) from the created product

    # Register customer and create order
    customer_email = "customer_mp@example.com"
    client.post("/auth/register", json={"email": customer_email, "password": "password123"})
    customer_headers = get_auth_headers(customer_email)
    order_payload = {"items": [{"product_id": product_id, "quantity": 1}]}
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
        {'items': [{'title': 'Test Product MP', 'quantity': 1, 'unit_price': 10.0, 'currency_id': 'CLP'}], 
         'payer': {'email': customer_email}, 
         'back_urls': {'success': 'http://localhost:8000/payments/success', 'failure': 'http://localhost:8000/payments/failure', 'pending': 'http://localhost:8000/payments/pending'}, 
         'auto_return': 'approved', 
         'external_reference': str(order_id), 
         'notification_url': 'http://localhost:8000/payments/webhook', 
         'metadata': {'tenant_id': str(owner_id)}}
    )

def test_mercadopago_webhook_payment_received():
    response = client.post("/payments/webhook?topic=payment&id=123456789")
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert "Payment notification for ID 123456789 received and processed (dummy)" in response.json()["message"]

def test_mercadopago_webhook_invalid_notification():
    response = client.post("/payments/webhook")
    assert response.status_code == 400
    assert response.json()["status"] == "error"
    assert "Invalid notification format" in response.json()["message"]