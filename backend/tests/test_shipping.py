"""Tests de opciones de envío — CRUD con aislamiento por tenant."""
import pytest
import uuid


@pytest.fixture
def opcion_envio(client, tenant_token, tenant_user):
    r = client.post("/shipping", json={
        "name": "Envío estándar",
        "cost": 8000,
        "min_order_total": 0,
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    return r.json()


# ── GET /shipping ─────────────────────────────────────────────────────────

def test_listar_opciones_vacio(client, tenant_token, tenant_user):
    r = client.get("/shipping", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_listar_opciones_sin_auth(client):
    r = client.get("/shipping")
    assert r.status_code == 401


# ── POST /shipping ────────────────────────────────────────────────────────

def test_crear_opcion_ok(client, tenant_token, tenant_user):
    r = client.post("/shipping", json={
        "name": "Envío express",
        "cost": 15000,
        "min_order_total": 50000,
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Envío express"
    assert data["cost"] == 15000
    assert data["min_order_total"] == 50000


def test_crear_opcion_costo_negativo_da_error(client, tenant_token, tenant_user):
    r = client.post("/shipping", json={"name": "Gratis", "cost": -1})
    assert r.status_code in (401, 422)


def test_crear_opcion_sin_auth(client):
    r = client.post("/shipping", json={"name": "x", "cost": 0})
    assert r.status_code == 401


# ── GET /shipping/{id} ────────────────────────────────────────────────────

def test_obtener_opcion_por_id(client, tenant_token, opcion_envio):
    oid = opcion_envio["id"]
    r = client.get(f"/shipping/{oid}", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert r.json()["id"] == oid


def test_obtener_opcion_ajena_da_404(client, tenant_token):
    r = client.get(f"/shipping/{uuid.uuid4()}", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 404


def test_obtener_opcion_id_invalido(client, tenant_token, tenant_user):
    r = client.get("/shipping/no-es-uuid", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 400


# ── PUT /shipping/{id} ────────────────────────────────────────────────────

def test_actualizar_opcion(client, tenant_token, opcion_envio):
    oid = opcion_envio["id"]
    r = client.put(f"/shipping/{oid}", json={
        "name": "Envío actualizado",
        "cost": 9000,
        "min_order_total": 20000,
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Envío actualizado"
    assert data["cost"] == 9000


# ── DELETE /shipping/{id} ─────────────────────────────────────────────────

def test_eliminar_opcion(client, tenant_token, opcion_envio):
    oid = opcion_envio["id"]
    r = client.delete(f"/shipping/{oid}", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert r.json()["ok"] is True

    r2 = client.get(f"/shipping/{oid}", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r2.status_code == 404
