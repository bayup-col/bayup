# backend/test_main.py
import os
import boto3
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from moto import mock_s3
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

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "BaseCommerce API is running"}

# ... (existing auth tests)

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

# ... (existing product tests)

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
    # ... (rest of the test)
    del os.environ["S3_BUCKET_NAME"]


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
