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


# ── POST /public/shop/{slug}/checkout ────────────────────────────────────

def test_checkout_ok(client, tienda, producto):
    p, v = producto
    r = client.post("/public/shop/mi-tienda/checkout", json={
        "customer_name": "Carlos López",
        "customer_email": "carlos@test.com",
        "customer_phone": "3009876543",
        "items": [{"product_id": str(p.id), "name": p.name, "qty": 2, "unit_price": 999}],
        "currency": "COP",
    })
    assert r.status_code == 200
    data = r.json()
    assert "payment_id" in data
    assert data["status"] == "pending"
    # CRIT-002: precio real de DB (45000 * 2 = 90000), no el manipulado (999)
    assert data["amount"] == 90000


def test_checkout_tienda_inexistente(client, producto):
    p, v = producto
    r = client.post("/public/shop/no-existe/checkout", json={
        "customer_name": "Test",
        "customer_email": "t@t.com",
        "customer_phone": "3001234567",
        "items": [{"product_id": str(p.id), "name": "x", "qty": 1, "unit_price": 0}],
        "currency": "COP",
    })
    assert r.status_code == 404


def test_checkout_idempotencia(client, tienda, producto):
    """Mismo idempotency_key devuelve el mismo pago sin duplicar."""
    p, v = producto
    payload = {
        "customer_name": "Idempotente",
        "customer_email": "idem@test.com",
        "customer_phone": "3001234567",
        "items": [{"product_id": str(p.id), "name": p.name, "qty": 1, "unit_price": 45000}],
        "currency": "COP",
        "idempotency_key": "key-unico-123",
    }
    r1 = client.post("/public/shop/mi-tienda/checkout", json=payload)
    r2 = client.post("/public/shop/mi-tienda/checkout", json=payload)
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


# ── POST /public/payments/webhook ────────────────────────────────────────

def test_webhook_acepta_cualquier_payload(client):
    r = client.post("/public/payments/webhook", json={"event": "payment.confirmed", "data": {}})
    assert r.status_code == 200
    assert r.json()["received"] is True
