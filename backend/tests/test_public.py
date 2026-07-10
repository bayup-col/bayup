"""Tests de endpoints públicos — storefront, pedidos web, checkout."""
import pytest
import uuid
import models


# ── Fixtures ──────────────────────────────────────────────────────────────

@pytest.fixture
def tienda(db_session):
    import security
    user = models.User(
        email="tienda@public.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Tienda Pública",
        shop_slug="mi-tienda",
        role="admin_tienda",
        status="Activo",
        email_confirmed=True,
        phone="573001234567",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def producto(db_session, tienda):
    p = models.Product(
        owner_id=tienda.id,
        name="Camiseta",
        description="Algodón",
        price=45000,
        status="active",
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    v = models.ProductVariant(
        product_id=p.id,
        name="Talla M",
        price=45000,
        stock=20,
    )
    db_session.add(v)
    db_session.commit()
    db_session.refresh(v)
    return p, v


# ── GET /public/shop/{slug} ───────────────────────────────────────────────

def test_get_public_shop_ok(client, tienda):
    r = client.get("/public/shop/mi-tienda")
    assert r.status_code == 200
    data = r.json()
    assert data["shop_slug"] == "mi-tienda"
    assert data["full_name"] == "Tienda Pública"


def test_get_public_shop_expone_textos_legales(client, db_session, tienda):
    tienda.terms_conditions = "Términos de prueba"
    tienda.privacy_policy = "Privacidad de prueba"
    db_session.commit()

    r = client.get("/public/shop/mi-tienda")
    assert r.status_code == 200
    data = r.json()
    assert data["terms_conditions"] == "Términos de prueba"
    assert data["privacy_policy"] == "Privacidad de prueba"
    assert data["return_policy"] is None
    assert data["shipping_policy"] is None


def test_get_public_shop_no_existe(client):
    r = client.get("/public/shop/no-existe-xyz")
    assert r.status_code == 404


def test_get_public_shop_suspendida(client, db_session):
    import security
    user = models.User(
        email="suspendida@public.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Suspendida",
        shop_slug="tienda-suspendida",
        role="admin_tienda",
        status="Suspendido",
        email_confirmed=True,
    )
    db_session.add(user)
    db_session.commit()
    r = client.get("/public/shop/tienda-suspendida")
    assert r.status_code == 404


# ── GET /public/shop/{slug}/products ─────────────────────────────────────

def test_get_public_products(client, tienda, producto):
    r = client.get("/public/shop/mi-tienda/products")
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 1
    assert data[0]["name"] == "Camiseta"
    assert data[0]["price"] == 45000


def test_get_public_products_tienda_inexistente(client):
    r = client.get("/public/shop/no-existe/products")
    assert r.status_code == 404


# ── GET /public/shop-info/{slug} ──────────────────────────────────────────

def test_get_shop_info(client, tienda):
    r = client.get("/public/shop-info/mi-tienda")
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Tienda Pública"
    assert data["slug"] == "mi-tienda"


# ── GET /public/stores/{store_id}/products ───────────────────────────────

def test_get_store_products_por_id(client, tienda, producto):
    r = client.get(f"/public/stores/{tienda.id}/products")
    assert r.status_code == 200
    assert len(r.json()) >= 1


def test_get_store_products_id_invalido(client):
    r = client.get("/public/stores/no-es-uuid/products")
    assert r.status_code == 400


# ── POST /public/orders ───────────────────────────────────────────────────

def test_crear_pedido_publico_ok(client, tienda, producto):
    p, v = producto
    r = client.post("/public/orders", json={
        "tenant_id": str(tienda.id),
        "total_price": 45000,
        "customer_name": "Ana García",
        "customer_email": "ana@test.com",
        "customer_phone": "3001234567",
        "customer_city": "Medellín",
        "payment_method": "transferencia",
        "source": "web",
        "items": [{"product_variant_id": str(v.id), "quantity": 1, "price_at_purchase": 45000}],
    })
    assert r.status_code == 200
    data = r.json()
    assert data["customer_name"] == "Ana García"
    # CRIT-002: precio viene de la DB, no del cliente
    assert data["total_price"] == 45000


def test_crear_pedido_precio_ignorado_del_cliente(client, tienda, producto):
    """El precio enviado por el cliente no debe usarse — debe venir de la DB."""
    p, v = producto
    r = client.post("/public/orders", json={
        "tenant_id": str(tienda.id),
        "total_price": 1,  # precio manipulado
        "customer_name": "Hacker",
        "customer_email": None,
        "customer_phone": "3001234567",
        "payment_method": "transferencia",
        "source": "web",
        "items": [{"product_variant_id": str(v.id), "quantity": 1, "price_at_purchase": 1}],
    })
    assert r.status_code == 200
    # El total debe ser 45000 (precio real de DB), no 1
    assert r.json()["total_price"] == 45000


def test_crear_pedido_tenant_invalido(client, producto):
    p, v = producto
    r = client.post("/public/orders", json={
        "tenant_id": "no-es-uuid",
        "total_price": 45000,
        "customer_name": "Test",
        "items": [{"product_variant_id": str(v.id), "quantity": 1, "price_at_purchase": 45000}],
    })
    assert r.status_code == 400


def test_crear_pedido_variante_inexistente(client, tienda):
    r = client.post("/public/orders", json={
        "tenant_id": str(tienda.id),
        "total_price": 45000,
        "customer_name": "Test",
        "items": [{"product_variant_id": str(uuid.uuid4()), "quantity": 1, "price_at_purchase": 45000}],
    })
    assert r.status_code == 400


# ── POST /public/checkout (pasarela Wompi) ────────────────────────────────

def test_checkout_ok(client, tienda, producto):
    p, v = producto
    r = client.post("/public/checkout", json={
        "tenant_id": str(tienda.id),
        "customer_name": "Carlos López",
        "customer_email": "carlos@test.com",
        "customer_phone": "3009876543",
        "items": [{"product_variant_id": str(v.id), "quantity": 2}],
        "currency": "COP",
    })
    assert r.status_code == 200
    data = r.json()
    assert "payment_id" in data
    assert data["status"] == "pending"
    # CRIT-002: precio real de DB (45000 * 2 = 90000)
    assert data["amount"] == 90000


def test_checkout_tienda_inexistente(client, producto):
    p, v = producto
    r = client.post("/public/checkout", json={
        "tenant_id": str(uuid.uuid4()),
        "customer_name": "Test",
        "customer_email": "t@t.com",
        "customer_phone": "3001234567",
        "items": [{"product_variant_id": str(v.id), "quantity": 1}],
        "currency": "COP",
    })
    assert r.status_code == 404


def test_checkout_idempotencia(client, tienda, producto):
    """Mismo idempotency_key devuelve el mismo pago sin duplicar."""
    p, v = producto
    payload = {
        "tenant_id": str(tienda.id),
        "customer_name": "Idempotente",
        "customer_email": "idem@test.com",
        "customer_phone": "3001234567",
        "items": [{"product_variant_id": str(v.id), "quantity": 1}],
        "currency": "COP",
        "idempotency_key": "key-unico-123",
    }
    r1 = client.post("/public/checkout", json=payload)
    r2 = client.post("/public/checkout", json=payload)
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json()["payment_id"] == r2.json()["payment_id"]


# ── GET /public/payment/{payment_id} ─────────────────────────────────────

def test_get_payment_status(client, tienda, producto, db_session):
    p, v = producto
    payment = models.Payment(
        tenant_id=tienda.id,
        amount=45000,
        currency="COP",
        status="pending",
        customer_name="Test",
        customer_email="t@t.com",
        customer_phone="300",
        items=[],
    )
    db_session.add(payment)
    db_session.commit()
    db_session.refresh(payment)

    r = client.get(f"/public/payment/{payment.id}")
    assert r.status_code == 200
    assert r.json()["status"] == "pending"


def test_get_payment_id_invalido(client):
    r = client.get("/public/payment/no-es-uuid")
    assert r.status_code == 400


def test_get_payment_inexistente(client):
    r = client.get(f"/public/payment/{uuid.uuid4()}")
    assert r.status_code == 404


# ── POST /public/payments/webhook (Wompi) ─────────────────────────────────

def _wompi_signed_event(monkeypatch, secret: str, transaction: dict, timestamp: int = 1700000000) -> dict:
    """Construye un evento de Wompi firmado correctamente, para pruebas."""
    import hashlib
    import payment_service
    monkeypatch.setattr(payment_service, "WOMPI_EVENTS_SECRET", secret)
    properties = ["transaction.id", "transaction.status"]
    concatenated = "".join(str(transaction.get(p.split(".")[1], "")) for p in properties)
    concatenated += f"{timestamp}{secret}"
    checksum = hashlib.sha256(concatenated.encode()).hexdigest()
    return {
        "event": "transaction.updated",
        "data": {"transaction": transaction},
        "timestamp": timestamp,
        "signature": {"checksum": checksum, "properties": properties},
    }


def test_webhook_firma_invalida_rechaza(client):
    r = client.post("/public/payments/webhook", json={"event": "payment.confirmed", "data": {}})
    assert r.status_code == 401


def test_webhook_referencia_desconocida_no_falla(client, monkeypatch):
    event = _wompi_signed_event(monkeypatch, "test-secret", {
        "id": "tx-1", "status": "APPROVED", "reference": "NO-EXISTE",
    })
    r = client.post("/public/payments/webhook", json=event)
    assert r.status_code == 200
    assert r.json()["received"] is True


def test_webhook_aprueba_pago_y_crea_orden(client, tienda, producto, db_session, monkeypatch):
    p, v = producto
    checkout = client.post("/public/checkout", json={
        "tenant_id": str(tienda.id),
        "customer_name": "Cliente Wompi",
        "customer_email": "wompi@test.com",
        "customer_phone": "3001234567",
        "items": [{"product_variant_id": str(v.id), "quantity": 1}],
        "currency": "COP",
    })
    payment_id = checkout.json()["payment_id"]

    import payment_service
    monkeypatch.setattr(payment_service, "WOMPI_CONFIGURED", True)
    db_payment = db_session.query(models.Payment).filter(models.Payment.id == payment_id).first()
    db_payment.gateway = "wompi"
    db_payment.gateway_payment_id = "REF-TEST-001"
    db_session.commit()

    event = _wompi_signed_event(monkeypatch, "test-secret", {
        "id": "tx-approved-1", "status": "APPROVED", "reference": "REF-TEST-001",
    })
    r = client.post("/public/payments/webhook", json=event)
    assert r.status_code == 200

    db_session.refresh(db_payment)
    assert db_payment.status == "approved"

    orders = db_session.query(models.Order).filter(models.Order.tenant_id == tienda.id).all()
    assert len(orders) == 1
    assert orders[0].payment_method == "wompi"
