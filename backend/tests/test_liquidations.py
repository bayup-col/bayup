"""Tests de liquidaciones web y comisiones POS."""
import pytest
import uuid
import models


# ── Fixtures ──────────────────────────────────────────────────────────────

@pytest.fixture
def tienda_liq(db_session):
    import security
    user = models.User(
        email="tienda@liq.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Tienda Liq",
        shop_slug="tienda-liq",
        role="admin_tienda",
        status="Activo",
        email_confirmed=True,
        onboarding_completed=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def tenant_liq_token(tienda_liq):
    import security
    return security.create_access_token(data={"sub": tienda_liq.email})


# ── Tenant: GET /admin/liquidations ──────────────────────────────────────

def test_list_liquidations_vacio(client, tienda_liq, tenant_liq_token):
    r = client.get("/admin/liquidations", headers={"Authorization": f"Bearer {tenant_liq_token}"})
    assert r.status_code == 200
    assert r.json() == []


def test_list_liquidations_con_datos(client, tienda_liq, tenant_liq_token, db_session):
    import datetime as dt
    liq = models.Liquidation(
        tenant_id=tienda_liq.id,
        liq_type="web",
        gross_amount=100000,
        bayup_commission=2500,
        prix_fee=0,
        net_amount=97500,
        order_count=3,
        status="paid",
        paid_date=dt.datetime.now(dt.timezone.utc),
    )
    db_session.add(liq)
    db_session.commit()

    r = client.get("/admin/liquidations", headers={"Authorization": f"Bearer {tenant_liq_token}"})
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert data[0]["gross_amount"] == 100000
    assert data[0]["status"] == "paid"


def test_list_liquidations_sin_auth(client):
    r = client.get("/admin/liquidations")
    assert r.status_code == 401


# ── Tenant: GET /admin/liquidations/summary ───────────────────────────────

def test_liquidation_summary(client, tienda_liq, tenant_liq_token):
    r = client.get("/admin/liquidations/summary", headers={"Authorization": f"Bearer {tenant_liq_token}"})
    assert r.status_code == 200
    data = r.json()
    assert "pending" in data
    assert "next_payment_dates" in data
    assert "history" in data
    assert "pending_orders" in data


# ── Tenant: GET /admin/pos-commissions ───────────────────────────────────

def test_list_pos_commissions(client, tienda_liq, tenant_liq_token):
    r = client.get("/admin/pos-commissions", headers={"Authorization": f"Bearer {tenant_liq_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ── Super admin: GET /super-admin/liquidations ────────────────────────────

def test_sa_list_liquidations(client, admin_token, tienda_liq, db_session):
    import datetime as dt
    liq = models.Liquidation(
        tenant_id=tienda_liq.id,
        liq_type="web",
        gross_amount=200000,
        bayup_commission=5000,
        prix_fee=0,
        net_amount=195000,
        order_count=5,
        status="scheduled",
    )
    db_session.add(liq)
    db_session.commit()

    r = client.get("/super-admin/liquidations", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    data = r.json()
    assert any(d["gross_amount"] == 200000 for d in data)


def test_sa_list_liquidations_sin_permiso(client, tenant_liq_token):
    r = client.get("/super-admin/liquidations", headers={"Authorization": f"Bearer {tenant_liq_token}"})
    assert r.status_code == 403


# ── Super admin: POST /super-admin/liquidations ───────────────────────────

def test_sa_crear_liquidacion(client, admin_token, tienda_liq):
    r = client.post("/super-admin/liquidations", json={
        "tenant_id": str(tienda_liq.id),
        "gross_amount": 300000,
        "order_count": 7,
        "status": "scheduled",
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    data = r.json()
    assert "id" in data
    assert data["net_amount"] == pytest.approx(300000 * (1 - 0.025), rel=1e-3)


def test_sa_crear_liquidacion_sin_tenant_id(client, admin_token):
    r = client.post("/super-admin/liquidations", json={
        "gross_amount": 100000,
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 400


# ── Super admin: PUT /super-admin/liquidations/{id}/pay ──────────────────

def test_sa_marcar_pagada(client, admin_token, tienda_liq, db_session):
    liq = models.Liquidation(
        tenant_id=tienda_liq.id,
        liq_type="web",
        gross_amount=50000,
        bayup_commission=1250,
        prix_fee=0,
        net_amount=48750,
        order_count=1,
        status="scheduled",
    )
    db_session.add(liq)
    db_session.commit()
    db_session.refresh(liq)

    r = client.put(f"/super-admin/liquidations/{liq.id}/pay", json={
        "transfer_reference": "REF-001",
        "notes": "Pago test",
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert r.json()["ok"] is True
    db_session.refresh(liq)
    assert liq.status == "paid"
    assert liq.transfer_reference == "REF-001"


# ── Super admin: DELETE /super-admin/liquidations/{id} ───────────────────

def test_sa_eliminar_liquidacion_scheduled(client, admin_token, tienda_liq, db_session):
    liq = models.Liquidation(
        tenant_id=tienda_liq.id,
        liq_type="web",
        gross_amount=10000,
        bayup_commission=250,
        prix_fee=0,
        net_amount=9750,
        order_count=1,
        status="scheduled",
    )
    db_session.add(liq)
    db_session.commit()
    db_session.refresh(liq)

    r = client.delete(f"/super-admin/liquidations/{liq.id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_sa_no_eliminar_liquidacion_pagada(client, admin_token, tienda_liq, db_session):
    import datetime as dt
    liq = models.Liquidation(
        tenant_id=tienda_liq.id,
        liq_type="web",
        gross_amount=10000,
        bayup_commission=250,
        prix_fee=0,
        net_amount=9750,
        order_count=1,
        status="paid",
        paid_date=dt.datetime.now(dt.timezone.utc),
    )
    db_session.add(liq)
    db_session.commit()
    db_session.refresh(liq)

    r = client.delete(f"/super-admin/liquidations/{liq.id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 400


# ── Super admin: GET /super-admin/liquidations/pending-balances ───────────

def test_sa_pending_balances(client, admin_token):
    r = client.get("/super-admin/liquidations/pending-balances", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ── Super admin: comisiones POS ───────────────────────────────────────────

def test_sa_pos_commissions_pending(client, admin_token):
    r = client.get("/super-admin/pos-commissions/pending", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_sa_collect_pos_commission(client, admin_token, tienda_liq):
    r = client.post("/super-admin/pos-commissions/collect", json={
        "tenant_id": str(tienda_liq.id),
        "pos_gross": 200000,
        "pos_count": 4,
        "reference": "REF-POS-001",
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["commission"] == pytest.approx(200000 * 0.025, rel=1e-3)
    assert data["status"] == "paid"


def test_sa_collect_pos_sin_tenant_id(client, admin_token):
    r = client.post("/super-admin/pos-commissions/collect", json={
        "pos_gross": 100000,
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 400
