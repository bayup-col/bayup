"""Tests de envíos — listado y actualización de estado."""
import pytest
import uuid
import models


@pytest.fixture
def envio_con_pedido(db_session, tenant_user):
    pedido = models.Order(
        tenant_id=tenant_user.id,
        customer_name="Cliente Envío",
        customer_email="c@c.com",
        customer_phone="300",
        customer_city="Medellín",
        total_price=80000,
        status="processing",
        items=[],
        source="web",
    )
    db_session.add(pedido)
    db_session.commit()
    db_session.refresh(pedido)

    envio = models.Shipment(
        order_id=pedido.id,
        tenant_id=tenant_user.id,
        status="pendiente",
        carrier="",
        tracking_number="",
    )
    db_session.add(envio)
    db_session.commit()
    db_session.refresh(envio)
    return envio, pedido


# ── GET /shipments ────────────────────────────────────────────────────────

def test_listar_envios_vacio(client, tenant_token, tenant_user):
    r = client.get("/shipments", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_listar_envios_con_datos(client, tenant_token, envio_con_pedido):
    envio, pedido = envio_con_pedido
    r = client.get("/shipments", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 1
    assert any(s["order_id"] == str(pedido.id) for s in data)


def test_listar_envios_sin_auth(client):
    r = client.get("/shipments")
    assert r.status_code == 401


# ── PUT /shipments/{id} ───────────────────────────────────────────────────

def test_actualizar_estado_envio(client, tenant_token, envio_con_pedido, db_session):
    envio, _ = envio_con_pedido
    r = client.put(f"/shipments/{envio.id}", json={
        "status": "en_transito",
        "carrier": "Coordinadora",
        "tracking_number": "TRK123456",
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    assert data["status"] == "en_transito"

    db_session.refresh(envio)
    assert envio.carrier == "Coordinadora"
    assert envio.tracking_number == "TRK123456"


def test_entregado_marca_pedido_completed(client, tenant_token, envio_con_pedido, db_session):
    envio, pedido = envio_con_pedido
    r = client.put(f"/shipments/{envio.id}", json={
        "status": "entregado",
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200

    db_session.refresh(pedido)
    assert pedido.status == "completed"


def test_estado_invalido_da_400(client, tenant_token, envio_con_pedido):
    envio, _ = envio_con_pedido
    r = client.put(f"/shipments/{envio.id}", json={
        "status": "estado_inventado",
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 400


def test_actualizar_envio_ajeno_da_404(client, tenant_token):
    r = client.put(f"/shipments/{uuid.uuid4()}", json={"status": "en_transito"},
                   headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 404


def test_actualizar_envio_id_invalido(client, tenant_token, tenant_user):
    r = client.put("/shipments/no-es-uuid", json={"status": "en_transito"},
                   headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 400
