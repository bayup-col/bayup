"""Tests de colecciones de productos."""
import pytest
import uuid
import models


@pytest.fixture
def coleccion(client, tenant_token, tenant_user):
    r = client.post("/collections", json={
        "title": "Colección Verano",
        "description": "Ropa de temporada",
        "status": "active",
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    return r.json()


# ── GET /collections ──────────────────────────────────────────────────────

def test_listar_colecciones_vacio(client, tenant_token, tenant_user):
    r = client.get("/collections", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_listar_colecciones_sin_auth(client):
    r = client.get("/collections")
    assert r.status_code == 401


# ── POST /collections ─────────────────────────────────────────────────────

def test_crear_coleccion_ok(client, tenant_token, tenant_user):
    r = client.post("/collections", json={
        "title": "Invierno 2025",
        "description": "Temporada frío",
        "status": "active",
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["title"] == "Invierno 2025"
    assert "id" in data


def test_crear_coleccion_sin_auth(client):
    r = client.post("/collections", json={"title": "x", "status": "active"})
    assert r.status_code == 401


# ── PUT /collections/{id} ─────────────────────────────────────────────────

def test_actualizar_coleccion(client, tenant_token, coleccion):
    cid = coleccion["id"]
    r = client.put(f"/collections/{cid}", json={
        "title": "Verano Actualizado",
        "status": "inactive",
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["title"] == "Verano Actualizado"
    assert data["status"] == "inactive"


def test_actualizar_coleccion_ajena_da_404(client, tenant_token, db_session):
    import security
    otro = models.User(
        email="otro@col.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Otro",
        role="admin_tienda",
        status="Activo",
        email_confirmed=True,
    )
    db_session.add(otro)
    db_session.commit()
    db_session.refresh(otro)

    import crud, schemas
    col_ajena = crud.create_collection(
        db_session,
        collection=schemas.CollectionCreate(title="Ajena", status="active"),
        owner_id=otro.id,
    )

    r = client.put(f"/collections/{col_ajena.id}", json={
        "title": "Hackeada",
        "status": "active",
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 404


# ── Aislamiento de tenant ─────────────────────────────────────────────────

def test_tenant_no_ve_colecciones_ajenas(client, tenant_token, db_session):
    import security, crud, schemas
    otro = models.User(
        email="otro2@col.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Otro2",
        role="admin_tienda",
        status="Activo",
        email_confirmed=True,
    )
    db_session.add(otro)
    db_session.commit()
    db_session.refresh(otro)

    crud.create_collection(
        db_session,
        collection=schemas.CollectionCreate(title="Colección Secreta", status="active"),
        owner_id=otro.id,
    )

    r = client.get("/collections", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert not any(c["title"] == "Colección Secreta" for c in r.json())
