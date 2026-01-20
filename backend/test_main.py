# backend/test_main.py
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ..backend.database import Base, get_db
from ..backend.main import app

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
