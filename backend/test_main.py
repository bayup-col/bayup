# backend/test_main.py
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from database import Base, get_db
from main import app
import models, crud, schemas

# --- Test Database Setup ---
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

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Crear plan por defecto
    if not crud.get_default_plan(db):
        crud.create_plan(db=db, plan=schemas.PlanCreate(
            name="Free", description="Default", commission_rate=0.1, monthly_fee=0, is_default=True
        ))
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

# --- Pruebas de Autenticación (El Corazón) ---

def test_register_user_success():
    response = client.post(
        "/auth/register",
        json={"email": "nuevo@bayup.com", "password": "password123", "full_name": "Usuario Nuevo"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "nuevo@bayup.com"

def test_login_success():
    # 1. Registrar
    client.post("/auth/register", json={"email": "login@bayup.com", "password": "password123", "full_name": "User"})
    # 2. Login
    response = client.post("/auth/login", data={"username": "login@bayup.com", "password": "password123"})
    assert response.status_code == 200
    assert "access_token" in response.json()

# --- Pruebas de Productos ---

def test_create_product():
    # 1. Auth
    client.post("/auth/register", json={"email": "tienda@bayup.com", "password": "pass", "full_name": "Tienda"})
    login_res = client.post("/auth/login", data={"username": "tienda@bayup.com", "password": "pass"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Crear Producto
    response = client.post(
        "/products",
        headers=headers,
        json={
            "name": "Producto Test",
            "price": 10000,
            "variants": [{"name": "Unica", "stock": 10}]
        }
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Producto Test"

# --- Pruebas de Super Admin ---

def test_super_admin_access_denied_for_normal_user():
    client.post("/auth/register", json={"email": "normal@bayup.com", "password": "pass", "full_name": "Normal"})
    login_res = client.post("/auth/login", data={"username": "normal@bayup.com", "password": "pass"})
    token = login_res.json()["access_token"]
    
    response = client.get("/super-admin/stats", headers={"Authorization": f"Bearer {token}"})
    # Debe ser 403 porque no es Dani ni Staff Global
    assert response.status_code == 403