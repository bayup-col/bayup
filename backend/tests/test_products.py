"""Tests del catálogo de productos — CRUD completo."""
import pytest
import uuid
import models


@pytest.fixture
def producto_base(client, tenant_token):
    r = client.post("/products", json={
        "name": "Camiseta Básica",
        "price": 50000,
        "description": "Algodón 100%",
        "status": "active",
        "variants": [],
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    return r.json()


# ── GET /products ─────────────────────────────────────────────────────────

def test_listar_productos_vacio(client, tenant_token, tenant_user):
    r = client.get("/products", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_listar_productos_sin_auth(client):
    r = client.get("/products")
    assert r.status_code == 401


# ── POST /products ────────────────────────────────────────────────────────

def test_crear_producto_ok(client, tenant_token, tenant_user):
    r = client.post("/products", json={
        "name": "Pantalón Cargo",
        "price": 120000,
        "description": "Tela resistente",
        "category": "Ropa",
        "status": "active",
        "variants": [],
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Pantalón Cargo"
    assert data["price"] == 120000
    assert "id" in data


def test_crear_producto_precio_cero_da_error(client, tenant_token, tenant_user):
    r = client.post("/products", json={
        "name": "Gratis",
        "price": 0,
        "variants": [],
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 422


def test_crear_producto_sin_auth(client):
    r = client.post("/products", json={"name": "x", "price": 1000})
    assert r.status_code == 401


# ── GET /products/{id} ────────────────────────────────────────────────────

def test_obtener_producto_por_id(client, tenant_token, producto_base):
    pid = producto_base["id"]
    r = client.get(f"/products/{pid}", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert r.json()["id"] == pid


def test_obtener_producto_inexistente(client, tenant_token, tenant_user):
    r = client.get(f"/products/{uuid.uuid4()}", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 404


def test_obtener_producto_id_invalido(client, tenant_token, tenant_user):
    r = client.get("/products/no-es-uuid", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 400


# ── PUT /products/{id} ────────────────────────────────────────────────────

def test_actualizar_producto(client, tenant_token, producto_base):
    pid = producto_base["id"]
    r = client.put(f"/products/{pid}", json={
        "name": "Camiseta Actualizada",
        "price": 55000,
        "status": "active",
        "variants": [],
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Camiseta Actualizada"
    assert data["price"] == 55000


def test_actualizar_producto_ajeno_da_404(client, tenant_token, db_session):
    import security
    otro = models.User(
        email="otro@productos.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Otro",
        role="admin_tienda",
        status="Activo",
        email_confirmed=True,
    )
    db_session.add(otro)
    db_session.commit()
    db_session.refresh(otro)

    producto_ajeno = models.Product(
        owner_id=otro.id,
        name="Producto Ajeno",
        price=10000,
        status="active",
    )
    db_session.add(producto_ajeno)
    db_session.commit()
    db_session.refresh(producto_ajeno)

    r = client.put(f"/products/{producto_ajeno.id}", json={
        "name": "Hackeado",
        "price": 1,
        "status": "active",
        "variants": [],
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 404


# ── DELETE /products/{id} ─────────────────────────────────────────────────

def test_eliminar_producto(client, tenant_token, producto_base):
    pid = producto_base["id"]
    r = client.delete(f"/products/{pid}", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert r.json()["ok"] is True

    r2 = client.get(f"/products/{pid}", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r2.status_code == 404


def test_eliminar_producto_inexistente(client, tenant_token, tenant_user):
    r = client.delete(f"/products/{uuid.uuid4()}", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 404


# ── Aislamiento entre tenants ─────────────────────────────────────────────

def test_tenant_no_ve_productos_ajenos(client, tenant_token, db_session):
    import security
    otro = models.User(
        email="otro2@productos.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Otro2",
        role="admin_tienda",
        status="Activo",
        email_confirmed=True,
    )
    db_session.add(otro)
    db_session.commit()
    db_session.refresh(otro)

    db_session.add(models.Product(owner_id=otro.id, name="Solo del Otro", price=999, status="active"))
    db_session.commit()

    r = client.get("/products", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert not any(p["name"] == "Solo del Otro" for p in r.json())
