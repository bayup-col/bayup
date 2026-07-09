"""Tests de gastos del negocio."""
import pytest
import models


# ── GET /expenses ─────────────────────────────────────────────────────────

def test_listar_gastos_vacio(client, tenant_token, tenant_user):
    r = client.get("/expenses", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_listar_gastos_alias_finances(client, tenant_token, tenant_user):
    r = client.get("/finances/expenses", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_listar_gastos_sin_auth(client):
    r = client.get("/expenses")
    assert r.status_code == 401


# ── POST /expenses ────────────────────────────────────────────────────────

def test_crear_gasto_ok(client, tenant_token, tenant_user):
    r = client.post("/expenses", json={
        "description": "Arriendo bodega",
        "amount": 500000,
        "category": "operativo",
        "status": "pending",
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["description"] == "Arriendo bodega"
    assert data["amount"] == 500000
    assert "id" in data


def test_crear_gasto_con_fecha(client, tenant_token, tenant_user):
    r = client.post("/expenses", json={
        "description": "Nómina julio",
        "amount": 2000000,
        "due_date": "2026-07-31",
        "category": "nomina",
        "status": "pending",
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["due_date"] is not None


def test_crear_gasto_monto_cero_da_error(client, tenant_token, tenant_user):
    r = client.post("/expenses", json={
        "description": "Sin monto",
        "amount": 0,
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 422


def test_crear_gasto_sin_auth(client):
    r = client.post("/expenses", json={"description": "x", "amount": 1000})
    assert r.status_code == 401


# ── Aislamiento entre tenants ─────────────────────────────────────────────

def test_tenant_no_ve_gastos_ajenos(client, tenant_token, db_session):
    import security, uuid as _uuid
    otro = models.User(
        email="otro@expenses.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Otro",
        role="admin_tienda",
        status="Activo",
        email_confirmed=True,
    )
    db_session.add(otro)
    db_session.commit()
    db_session.refresh(otro)

    gasto_ajeno = models.Expense(
        id=_uuid.uuid4(),
        description="Gasto secreto",
        amount=999999,
        category="diario",
        status="pending",
        tenant_id=otro.id,
    )
    db_session.add(gasto_ajeno)
    db_session.commit()

    r = client.get("/expenses", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert not any(e["description"] == "Gasto secreto" for e in r.json())
