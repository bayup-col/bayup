# backend/test_main.py
import os
import boto3
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
