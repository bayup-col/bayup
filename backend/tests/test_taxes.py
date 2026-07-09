"""Tests de tasas de impuesto — CRUD con regla de default único."""
import pytest
import uuid


@pytest.fixture
def tasa(client, tenant_token, tenant_user):
    r = client.post("/taxes", json={
        "name": "IVA 19%",
        "rate": 19.0,
        "is_default": False,
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    return r.json()


# ── GET /taxes ────────────────────────────────────────────────────────────

def test_listar_tasas_vacio(client, tenant_token, tenant_user):
    r = client.get("/taxes", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_listar_tasas_sin_auth(client):
    r = client.get("/taxes")
    assert r.status_code == 401


# ── POST /taxes ───────────────────────────────────────────────────────────

def test_crear_tasa_ok(client, tenant_token, tenant_user):
    r = client.post("/taxes", json={
        "name": "IVA 5%",
        "rate": 5.0,
        "is_default": False,
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "IVA 5%"
    assert data["rate"] == 5.0
    assert data["is_default"] is False


def test_crear_tasa_default_desactiva_anteriores(client, tenant_token, tenant_user):
    r1 = client.post("/taxes", json={"name": "Tasa A", "rate": 10.0, "is_default": True},
                     headers={"Authorization": f"Bearer {tenant_token}"})
    assert r1.status_code == 200

    r2 = client.post("/taxes", json={"name": "Tasa B", "rate": 5.0, "is_default": True},
                     headers={"Authorization": f"Bearer {tenant_token}"})
    assert r2.status_code == 200

    r = client.get("/taxes", headers={"Authorization": f"Bearer {tenant_token}"})
    defaults = [t for t in r.json() if t["is_default"]]
    assert len(defaults) == 1
    assert defaults[0]["name"] == "Tasa B"


def test_crear_tasa_sin_auth(client):
    r = client.post("/taxes", json={"name": "x", "rate": 5})
    assert r.status_code == 401


# ── GET /taxes/{id} ───────────────────────────────────────────────────────

def test_obtener_tasa_por_id(client, tenant_token, tasa):
    tid = tasa["id"]
    r = client.get(f"/taxes/{tid}", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert r.json()["id"] == tid


def test_obtener_tasa_inexistente(client, tenant_token, tenant_user):
    r = client.get(f"/taxes/{uuid.uuid4()}", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 404


# ── PUT /taxes/{id} ───────────────────────────────────────────────────────

def test_actualizar_tasa(client, tenant_token, tasa):
    tid = tasa["id"]
    r = client.put(f"/taxes/{tid}", json={
        "name": "IVA Actualizado",
        "rate": 8.0,
        "is_default": True,
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "IVA Actualizado"
    assert data["rate"] == 8.0
    assert data["is_default"] is True


# ── DELETE /taxes/{id} ───────────────────────────────────────────────────

def test_eliminar_tasa(client, tenant_token, tasa):
    tid = tasa["id"]
    r = client.delete(f"/taxes/{tid}", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert r.json()["ok"] is True

    r2 = client.get(f"/taxes/{tid}", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r2.status_code == 404
