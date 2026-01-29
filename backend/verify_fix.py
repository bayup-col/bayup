import os
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from database import Base, get_db
from main import app
import models, crud, schemas

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

def test_debug():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    print("\n--- DEBUG START ---")
    
    # 1. Test Register
    email = "debug@example.com"
    resp = client.post("/auth/register", json={"email": email, "password": "password123", "full_name": "Debug User"})
    print(f"Register status: {resp.status_code}")
    
    # 2. Test get user
    user = db.query(models.User).filter(models.User.email == email).first()
    print(f"User in DB: {user.email if user else 'None'}")
    
    # 3. Test Create Product
    token = resp.json() # Wait, register returns user model, not token
    # Actually need login
    resp = client.post("/auth/login", data={"username": email, "password": "password123"})
    print(f"Login status: {resp.status_code}")
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    prod_resp = client.post("/products", headers=headers, json={
        "name": "Debug Product",
        "price": 10.0,
        "variants": [{"name": "V1", "stock": 10}]
    })
    print(f"Create Product status: {prod_resp.status_code}")
    product_id = prod_resp.json()["id"]
    
    # 4. Test Public Product
    tenant_id = user.id
    public_resp = client.get(f"/public/stores/{tenant_id}/products/{product_id}")
    print(f"Public Product status: {public_resp.status_code}")
    if public_resp.status_code != 200:
        print(f"Error detail: {public_resp.json()}")
        
    print("--- DEBUG END ---\\n")

if __name__ == "__main__":
    try:
        test_debug()
    except Exception as e:
        print(f"Test failed with error: {e}")
