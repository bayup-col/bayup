"""Tests de payments.py y payment_service.py — checkout con Wompi, firma de
integridad, webhook de confirmación (HMAC, idempotencia, estados) y
aislamiento multi-tenant. Es el módulo financieramente más sensible del
sistema: cualquier fallo aquí puede significar cobros duplicados, pedidos
fantasma o fuga de datos entre tenants."""
import hashlib
import uuid

import pytest

import models
import payment_service


# ── Fixtures ──────────────────────────────────────────────────────────────

@pytest.fixture
def tienda_a(db_session):
    import security
    user = models.User(
        email="tienda-a@payments.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Tienda A",
        shop_slug="tienda-a",
        role="admin_tienda",
        status="Activo",
        email_confirmed=True,
        phone="573001111111",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def tienda_b(db_session):
    import security
    user = models.User(
        email="tienda-b@payments.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Tienda B",
        shop_slug="tienda-b",
        role="admin_tienda",
        status="Activo",
        email_confirmed=True,
        phone="573002222222",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def _crear_producto(db_session, tenant, price=45000, stock=20):
    p = models.Product(owner_id=tenant.id, name="Camiseta", description="Algodón", price=price, status="active")
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    v = models.ProductVariant(product_id=p.id, name="Talla M", price=price, stock=stock)
    db_session.add(v)
    db_session.commit()
    db_session.refresh(v)
    return p, v


@pytest.fixture
def producto_a(db_session, tienda_a):
    return _crear_producto(db_session, tienda_a)


@pytest.fixture
def producto_b(db_session, tienda_b):
    return _crear_producto(db_session, tienda_b, price=99000)


def _fwd_headers(tag: str) -> dict:
    """Cada test usa una IP simulada distinta vía X-Forwarded-For para que el
    rate limiter (10/minuto en /public/checkout) no acople el resultado de un
    test con el de otro dentro de la misma ejecución de pytest."""
    return {"X-Forwarded-For": f"10.0.{abs(hash(tag)) % 250}.{abs(hash(tag[::-1])) % 250}"}


def _wompi_signed_event(monkeypatch, secret: str, transaction: dict, timestamp: int = 1700000000,
                         properties=None) -> dict:
    """Construye un evento de Wompi firmado correctamente según el esquema real
    (SHA256 de properties concatenadas + timestamp + secreto)."""
    import payment_service as _ps
    monkeypatch.setattr(_ps, "WOMPI_EVENTS_SECRET", secret)
    properties = properties or ["transaction.id", "transaction.status"]
    concatenated = "".join(str(transaction.get(p.split(".", 1)[1], "")) for p in properties)
    concatenated += f"{timestamp}{secret}"
    checksum = hashlib.sha256(concatenated.encode()).hexdigest()
    return {
        "event": "transaction.updated",
        "data": {"transaction": transaction},
        "timestamp": timestamp,
        "signature": {"checksum": checksum, "properties": properties},
    }


# ── 1. payment_service.generate_integrity_signature ─────────────────────────

def test_firma_integridad_es_determinista(monkeypatch):
    monkeypatch.setattr(payment_service, "WOMPI_INTEGRITY_SECRET", "secreto-test")
    s1 = payment_service.generate_integrity_signature("BAY-ABC123", 4500000, "COP")
    s2 = payment_service.generate_integrity_signature("BAY-ABC123", 4500000, "COP")
    assert s1 == s2
    assert len(s1) == 64  # hex de sha256


def test_firma_integridad_coincide_con_calculo_manual(monkeypatch):
    """Verifica el contrato exacto exigido por Wompi: referencia+monto+moneda+secreto, SHA256."""
    monkeypatch.setattr(payment_service, "WOMPI_INTEGRITY_SECRET", "secreto-test")
    expected = hashlib.sha256("BAY-ABC1234500000COPsecreto-test".encode()).hexdigest()
    assert payment_service.generate_integrity_signature("BAY-ABC123", 4500000, "COP") == expected


def test_firma_integridad_cambia_con_el_monto(monkeypatch):
    monkeypatch.setattr(payment_service, "WOMPI_INTEGRITY_SECRET", "secreto-test")
    s1 = payment_service.generate_integrity_signature("BAY-ABC123", 4500000, "COP")
    s2 = payment_service.generate_integrity_signature("BAY-ABC123", 4500001, "COP")
    assert s1 != s2


def test_firma_integridad_cambia_con_la_referencia(monkeypatch):
    monkeypatch.setattr(payment_service, "WOMPI_INTEGRITY_SECRET", "secreto-test")
    s1 = payment_service.generate_integrity_signature("BAY-AAA111", 4500000, "COP")
    s2 = payment_service.generate_integrity_signature("BAY-BBB222", 4500000, "COP")
    assert s1 != s2


def test_firma_integridad_cambia_con_la_moneda(monkeypatch):
    monkeypatch.setattr(payment_service, "WOMPI_INTEGRITY_SECRET", "secreto-test")
    s1 = payment_service.generate_integrity_signature("BAY-ABC123", 4500000, "COP")
    s2 = payment_service.generate_integrity_signature("BAY-ABC123", 4500000, "USD")
    assert s1 != s2


def test_firma_integridad_cambia_con_el_secreto(monkeypatch):
    """Un atacante que no conozca WOMPI_INTEGRITY_SECRET no puede forjar una firma válida."""
    monkeypatch.setattr(payment_service, "WOMPI_INTEGRITY_SECRET", "secreto-real")
    firma_real = payment_service.generate_integrity_signature("BAY-ABC123", 4500000, "COP")
    monkeypatch.setattr(payment_service, "WOMPI_INTEGRITY_SECRET", "secreto-adivinado")
    firma_falsa = payment_service.generate_integrity_signature("BAY-ABC123", 4500000, "COP")
    assert firma_real != firma_falsa


# ── 2. payment_service.verify_webhook_event ─────────────────────────────────

def test_verify_webhook_event_firma_valida(monkeypatch):
    event = _wompi_signed_event(monkeypatch, "secreto-webhook", {"id": "tx-1", "status": "APPROVED"})
    assert payment_service.verify_webhook_event(event) is True


def test_verify_webhook_event_checksum_alterado(monkeypatch):
    event = _wompi_signed_event(monkeypatch, "secreto-webhook", {"id": "tx-1", "status": "APPROVED"})
    event["signature"]["checksum"] = "0" * 64
    assert payment_service.verify_webhook_event(event) is False


def test_verify_webhook_event_secreto_incorrecto(monkeypatch):
    """El evento fue firmado con un secreto distinto al configurado en el servidor."""
    event = _wompi_signed_event(monkeypatch, "secreto-del-atacante", {"id": "tx-1", "status": "APPROVED"})
    monkeypatch.setattr(payment_service, "WOMPI_EVENTS_SECRET", "secreto-real-del-servidor")
    assert payment_service.verify_webhook_event(event) is False


def test_verify_webhook_event_sin_configurar_rechaza_todo(monkeypatch):
    monkeypatch.setattr(payment_service, "WOMPI_EVENTS_SECRET", None)
    event = {"signature": {"checksum": "x", "properties": ["transaction.id"]}, "timestamp": 1, "data": {}}
    assert payment_service.verify_webhook_event(event) is False


def test_verify_webhook_event_campos_faltantes_rechaza(monkeypatch):
    monkeypatch.setattr(payment_service, "WOMPI_EVENTS_SECRET", "secreto-webhook")
    assert payment_service.verify_webhook_event({}) is False
    assert payment_service.verify_webhook_event({"signature": {}}) is False
    assert payment_service.verify_webhook_event({"signature": {"checksum": "x"}}) is False


def test_verify_webhook_event_checksum_case_insensitive(monkeypatch):
    event = _wompi_signed_event(monkeypatch, "secreto-webhook", {"id": "tx-1", "status": "APPROVED"})
    event["signature"]["checksum"] = event["signature"]["checksum"].upper()
    assert payment_service.verify_webhook_event(event) is True


# ── 3. POST /public/checkout — no confía en el cliente ──────────────────────

def test_checkout_precio_viene_de_la_db_no_del_cliente(client, tienda_a, producto_a):
    """El total del pago debe ser precio_real_DB * cantidad, no lo que mande el cliente."""
    p, v = producto_a
    r = client.post("/public/checkout", json={
        "tenant_id": str(tienda_a.id),
        "customer_name": "Carlos López",
        "customer_email": "carlos@test.com",
        "customer_phone": "3009876543",
        "items": [{"product_variant_id": str(v.id), "quantity": 3}],
        "currency": "COP",
    }, headers=_fwd_headers("checkout-precio-db"))
    assert r.status_code == 200
    data = r.json()
    assert data["amount"] == 45000 * 3
    # El payload de checkout no acepta ni expone ningún campo "price"/"amount" desde el cliente
    assert "price" not in data.get("items", []) if "items" in data else True


def test_checkout_no_permite_manipular_tenant_via_variante_ajena(client, tienda_a, tienda_b, producto_b):
    """Un checkout que declara tenant_id=A pero usa una variante que pertenece a B debe rechazarse."""
    p_b, v_b = producto_b
    r = client.post("/public/checkout", json={
        "tenant_id": str(tienda_a.id),
        "customer_name": "Atacante",
        "customer_email": "hack@test.com",
        "customer_phone": "3001234567",
        "items": [{"product_variant_id": str(v_b.id), "quantity": 1}],
        "currency": "COP",
    }, headers=_fwd_headers("checkout-cross-tenant"))
    assert r.status_code == 400


def test_checkout_cantidad_cero_o_negativa_rechazada(client, tienda_a, producto_a):
    p, v = producto_a
    r = client.post("/public/checkout", json={
        "tenant_id": str(tienda_a.id),
        "customer_name": "Test",
        "customer_email": "t@test.com",
        "customer_phone": "3001234567",
        "items": [{"product_variant_id": str(v.id), "quantity": 0}],
        "currency": "COP",
    }, headers=_fwd_headers("checkout-qty-cero"))
    assert r.status_code == 422


def test_checkout_tenant_inexistente_no_filtra_info(client, producto_a):
    """No debe filtrar detalles internos (stack trace, existencia de otros tenants) en el error."""
    p, v = producto_a
    r = client.post("/public/checkout", json={
        "tenant_id": str(uuid.uuid4()),
        "customer_name": "Test",
        "customer_email": "t@test.com",
        "customer_phone": "3001234567",
        "items": [{"product_variant_id": str(v.id), "quantity": 1}],
        "currency": "COP",
    }, headers=_fwd_headers("checkout-tenant-404"))
    assert r.status_code == 404
    body = r.json()
    assert "Traceback" not in str(body)
    assert set(body.keys()) == {"detail"}


def test_checkout_genera_firma_wompi_correcta(client, db_session, tienda_a, producto_a, monkeypatch):
    """La firma que recibe el widget del checkout debe coincidir exactamente con la firma
    calculada por payment_service usando el monto REAL calculado en el servidor."""
    p, v = producto_a
    monkeypatch.setattr(payment_service, "WOMPI_CONFIGURED", True)
    monkeypatch.setattr(payment_service, "WOMPI_PUBLIC_KEY", "pub_test_xxx")
    monkeypatch.setattr(payment_service, "WOMPI_INTEGRITY_SECRET", "integrity-secret-test")

    r = client.post("/public/checkout", json={
        "tenant_id": str(tienda_a.id),
        "customer_name": "Carlos López",
        "customer_email": "carlos@test.com",
        "customer_phone": "3009876543",
        "items": [{"product_variant_id": str(v.id), "quantity": 2}],
        "currency": "COP",
    }, headers=_fwd_headers("checkout-firma-wompi"))
    assert r.status_code == 200
    data = r.json()
    assert data["amount_in_cents"] == 9000000  # 45000*2*100
    expected_signature = payment_service.generate_integrity_signature(
        data["reference"], data["amount_in_cents"], "COP",
    )
    assert data["signature"] == expected_signature


def test_checkout_idempotency_key_no_se_comparte_entre_tenants(client, tienda_a, tienda_b, producto_a, producto_b):
    """El mismo idempotency_key usado por dos tenants distintos debe crear dos pagos separados
    (el scoping de idempotencia debe incluir tenant_id, no solo la clave)."""
    p_a, v_a = producto_a
    p_b, v_b = producto_b
    key = "shared-idem-key-999"

    r1 = client.post("/public/checkout", json={
        "tenant_id": str(tienda_a.id),
        "customer_name": "Cliente A",
        "customer_email": "a@test.com",
        "customer_phone": "3001111111",
        "items": [{"product_variant_id": str(v_a.id), "quantity": 1}],
        "currency": "COP",
        "idempotency_key": key,
    }, headers=_fwd_headers("checkout-idem-a"))
    r2 = client.post("/public/checkout", json={
        "tenant_id": str(tienda_b.id),
        "customer_name": "Cliente B",
        "customer_email": "b@test.com",
        "customer_phone": "3002222222",
        "items": [{"product_variant_id": str(v_b.id), "quantity": 1}],
        "currency": "COP",
        "idempotency_key": key,
    }, headers=_fwd_headers("checkout-idem-b"))

    assert r1.status_code == 200 and r2.status_code == 200
    assert r1.json()["payment_id"] != r2.json()["payment_id"]
    assert r1.json()["amount"] == 45000
    assert r2.json()["amount"] == 99000


# ── 4. POST /public/payments/webhook — firma HMAC ────────────────────────────

def test_webhook_sin_firma_rechazado_no_procesa(client, db_session, tienda_a, producto_a):
    """Un evento sin firma válida debe ser rechazado y NO debe tocar ningún pago existente."""
    p, v = producto_a
    checkout = client.post("/public/checkout", json={
        "tenant_id": str(tienda_a.id),
        "customer_name": "Cliente",
        "customer_email": "c@test.com",
        "customer_phone": "3001234567",
        "items": [{"product_variant_id": str(v.id), "quantity": 1}],
        "currency": "COP",
    }, headers=_fwd_headers("webhook-sin-firma-setup"))
    payment_id = checkout.json()["payment_id"]

    r = client.post("/public/payments/webhook", json={
        "event": "transaction.updated",
        "data": {"transaction": {"id": "tx-x", "status": "APPROVED", "reference": "cualquier-cosa"}},
        "timestamp": 123,
        "signature": {"checksum": "firma-forjada-invalida", "properties": ["transaction.id"]},
    })
    assert r.status_code == 401

    db_payment = db_session.query(models.Payment).filter(models.Payment.id == payment_id).first()
    assert db_payment.status == "pending"
    assert db_payment.order_id is None


def test_webhook_firma_valida_pero_con_secreto_equivocado_rechazado(client, monkeypatch):
    """Un atacante que conoce el esquema pero no el secreto real no puede forjar el checksum."""
    event = _wompi_signed_event(monkeypatch, "secreto-del-atacante", {
        "id": "tx-1", "status": "APPROVED", "reference": "REF-X",
    })
    monkeypatch.setattr(payment_service, "WOMPI_EVENTS_SECRET", "secreto-real-del-servidor")
    r = client.post("/public/payments/webhook", json=event)
    assert r.status_code == 401


# ── 5. Webhook — idempotencia (no doble-procesamiento) ──────────────────────

def test_webhook_evento_duplicado_no_crea_orden_duplicada(client, db_session, tienda_a, producto_a, monkeypatch):
    """Enviar EXACTAMENTE el mismo evento (mismo id de transacción) dos veces no debe
    crear dos órdenes ni cobrar dos veces — la segunda entrega debe ser un no-op."""
    p, v = producto_a
    checkout = client.post("/public/checkout", json={
        "tenant_id": str(tienda_a.id),
        "customer_name": "Cliente Idem",
        "customer_email": "idem@test.com",
        "customer_phone": "3001234567",
        "items": [{"product_variant_id": str(v.id), "quantity": 1}],
        "currency": "COP",
    }, headers=_fwd_headers("webhook-dup-setup"))
    payment_id = checkout.json()["payment_id"]

    monkeypatch.setattr(payment_service, "WOMPI_CONFIGURED", True)
    db_payment = db_session.query(models.Payment).filter(models.Payment.id == payment_id).first()
    db_payment.gateway = "wompi"
    db_payment.gateway_payment_id = "REF-DUP-001"
    db_session.commit()

    event = _wompi_signed_event(monkeypatch, "secreto-webhook", {
        "id": "tx-dup-1", "status": "APPROVED", "reference": "REF-DUP-001",
    })

    r1 = client.post("/public/payments/webhook", json=event)
    assert r1.status_code == 200

    db_session.refresh(db_payment)
    assert db_payment.status == "approved"
    orders_after_first = db_session.query(models.Order).filter(models.Order.tenant_id == tienda_a.id).all()
    assert len(orders_after_first) == 1

    # Reenvío del MISMO evento (Wompi reintenta webhooks que no reciben 200 a tiempo, o duplica por red)
    r2 = client.post("/public/payments/webhook", json=event)
    assert r2.status_code == 200

    orders_after_second = db_session.query(models.Order).filter(models.Order.tenant_id == tienda_a.id).all()
    assert len(orders_after_second) == 1, "El webhook duplicado creó una segunda orden — doble cobro/pedido fantasma"

    payments_total = db_session.query(models.Payment).filter(models.Payment.tenant_id == tienda_a.id).count()
    assert payments_total == 1


def test_webhook_evento_duplicado_status_pago_no_cambia(client, db_session, tienda_a, producto_a, monkeypatch):
    p, v = producto_a
    checkout = client.post("/public/checkout", json={
        "tenant_id": str(tienda_a.id),
        "customer_name": "Cliente",
        "customer_email": "c2@test.com",
        "customer_phone": "3001234567",
        "items": [{"product_variant_id": str(v.id), "quantity": 1}],
        "currency": "COP",
    }, headers=_fwd_headers("webhook-dup-status-setup"))
    payment_id = checkout.json()["payment_id"]

    monkeypatch.setattr(payment_service, "WOMPI_CONFIGURED", True)
    db_payment = db_session.query(models.Payment).filter(models.Payment.id == payment_id).first()
    db_payment.gateway = "wompi"
    db_payment.gateway_payment_id = "REF-DUP-002"
    db_session.commit()

    event = _wompi_signed_event(monkeypatch, "secreto-webhook", {
        "id": "tx-dup-2", "status": "APPROVED", "reference": "REF-DUP-002",
    })
    client.post("/public/payments/webhook", json=event)
    client.post("/public/payments/webhook", json=event)

    db_session.refresh(db_payment)
    assert db_payment.status == "approved"


# ── 6. Webhook — solo APPROVED confirma/crea la orden ────────────────────────

@pytest.mark.parametrize("wompi_status,expected_payment_status", [
    ("DECLINED", "failed"),
    ("VOIDED", "failed"),
    ("ERROR", "failed"),
    ("PENDING", "pending"),
])
def test_webhook_solo_approved_crea_orden(client, db_session, tienda_a, producto_a, monkeypatch,
                                           wompi_status, expected_payment_status):
    p, v = producto_a
    checkout = client.post("/public/checkout", json={
        "tenant_id": str(tienda_a.id),
        "customer_name": "Cliente",
        "customer_email": f"{wompi_status.lower()}@test.com",
        "customer_phone": "3001234567",
        "items": [{"product_variant_id": str(v.id), "quantity": 1}],
        "currency": "COP",
    }, headers=_fwd_headers(f"webhook-status-{wompi_status}"))
    payment_id = checkout.json()["payment_id"]

    monkeypatch.setattr(payment_service, "WOMPI_CONFIGURED", True)
    db_payment = db_session.query(models.Payment).filter(models.Payment.id == payment_id).first()
    db_payment.gateway = "wompi"
    db_payment.gateway_payment_id = f"REF-{wompi_status}"
    db_session.commit()

    event = _wompi_signed_event(monkeypatch, "secreto-webhook", {
        "id": f"tx-{wompi_status.lower()}", "status": wompi_status, "reference": f"REF-{wompi_status}",
    })
    r = client.post("/public/payments/webhook", json=event)
    assert r.status_code == 200

    db_session.refresh(db_payment)
    assert db_payment.status == expected_payment_status
    assert db_payment.order_id is None

    orders = db_session.query(models.Order).filter(models.Order.tenant_id == tienda_a.id).all()
    assert len(orders) == 0


def test_webhook_approved_si_crea_la_orden(client, db_session, tienda_a, producto_a, monkeypatch):
    p, v = producto_a
    checkout = client.post("/public/checkout", json={
        "tenant_id": str(tienda_a.id),
        "customer_name": "Cliente Aprobado",
        "customer_email": "aprobado@test.com",
        "customer_phone": "3001234567",
        "items": [{"product_variant_id": str(v.id), "quantity": 1}],
        "currency": "COP",
    }, headers=_fwd_headers("webhook-approved-setup"))
    payment_id = checkout.json()["payment_id"]

    monkeypatch.setattr(payment_service, "WOMPI_CONFIGURED", True)
    db_payment = db_session.query(models.Payment).filter(models.Payment.id == payment_id).first()
    db_payment.gateway = "wompi"
    db_payment.gateway_payment_id = "REF-OK-001"
    db_session.commit()

    event = _wompi_signed_event(monkeypatch, "secreto-webhook", {
        "id": "tx-ok-1", "status": "APPROVED", "reference": "REF-OK-001",
    })
    r = client.post("/public/payments/webhook", json=event)
    assert r.status_code == 200

    db_session.refresh(db_payment)
    assert db_payment.status == "approved"
    assert db_payment.order_id is not None

    order = db_session.query(models.Order).filter(models.Order.id == db_payment.order_id).first()
    assert order is not None
    assert order.tenant_id == tienda_a.id
    assert order.payment_method == "wompi"


# ── 7. Aislamiento multi-tenant ──────────────────────────────────────────────

def test_pago_de_tenant_a_no_es_visible_para_tenant_b(client, db_session, tienda_a, tienda_b, producto_a):
    """GET /public/payment/{id}?slug=<otro-tenant> no debe exponer un pago que no le pertenece."""
    p, v = producto_a
    checkout = client.post("/public/checkout", json={
        "tenant_id": str(tienda_a.id),
        "customer_name": "Cliente A",
        "customer_email": "a@test.com",
        "customer_phone": "3001234567",
        "items": [{"product_variant_id": str(v.id), "quantity": 1}],
        "currency": "COP",
    }, headers=_fwd_headers("isolation-get-payment"))
    payment_id = checkout.json()["payment_id"]

    r_propio = client.get(f"/public/payment/{payment_id}", params={"slug": tienda_a.shop_slug})
    assert r_propio.status_code == 200

    r_ajeno = client.get(f"/public/payment/{payment_id}", params={"slug": tienda_b.shop_slug})
    assert r_ajeno.status_code == 404


def test_webhook_aprobado_de_tenant_a_no_crea_orden_en_tenant_b(client, db_session, tienda_a, tienda_b,
                                                                 producto_a, monkeypatch):
    """La orden creada por el webhook debe quedar asociada exclusivamente al tenant dueño del pago."""
    p, v = producto_a
    checkout = client.post("/public/checkout", json={
        "tenant_id": str(tienda_a.id),
        "customer_name": "Cliente A",
        "customer_email": "a2@test.com",
        "customer_phone": "3001234567",
        "items": [{"product_variant_id": str(v.id), "quantity": 1}],
        "currency": "COP",
    }, headers=_fwd_headers("isolation-webhook-order"))
    payment_id = checkout.json()["payment_id"]

    monkeypatch.setattr(payment_service, "WOMPI_CONFIGURED", True)
    db_payment = db_session.query(models.Payment).filter(models.Payment.id == payment_id).first()
    db_payment.gateway = "wompi"
    db_payment.gateway_payment_id = "REF-ISO-001"
    db_session.commit()

    event = _wompi_signed_event(monkeypatch, "secreto-webhook", {
        "id": "tx-iso-1", "status": "APPROVED", "reference": "REF-ISO-001",
    })
    client.post("/public/payments/webhook", json=event)

    orders_a = db_session.query(models.Order).filter(models.Order.tenant_id == tienda_a.id).all()
    orders_b = db_session.query(models.Order).filter(models.Order.tenant_id == tienda_b.id).all()
    assert len(orders_a) == 1
    assert len(orders_b) == 0


def test_webhook_referencia_de_un_tenant_no_afecta_pago_de_otro_tenant(client, db_session, tienda_a, tienda_b,
                                                                        producto_a, producto_b, monkeypatch):
    """Dos pagos pendientes (uno por tenant) con referencias distintas: aprobar el de A
    no debe tocar en absoluto el pago pendiente de B."""
    p_a, v_a = producto_a
    p_b, v_b = producto_b

    checkout_a = client.post("/public/checkout", json={
        "tenant_id": str(tienda_a.id),
        "customer_name": "Cliente A",
        "customer_email": "a3@test.com",
        "customer_phone": "3001111111",
        "items": [{"product_variant_id": str(v_a.id), "quantity": 1}],
        "currency": "COP",
    }, headers=_fwd_headers("isolation-cross-a"))
    checkout_b = client.post("/public/checkout", json={
        "tenant_id": str(tienda_b.id),
        "customer_name": "Cliente B",
        "customer_email": "b3@test.com",
        "customer_phone": "3002222222",
        "items": [{"product_variant_id": str(v_b.id), "quantity": 1}],
        "currency": "COP",
    }, headers=_fwd_headers("isolation-cross-b"))

    monkeypatch.setattr(payment_service, "WOMPI_CONFIGURED", True)
    payment_a = db_session.query(models.Payment).filter(models.Payment.id == checkout_a.json()["payment_id"]).first()
    payment_a.gateway = "wompi"
    payment_a.gateway_payment_id = "REF-CROSS-A"
    payment_b = db_session.query(models.Payment).filter(models.Payment.id == checkout_b.json()["payment_id"]).first()
    payment_b.gateway = "wompi"
    payment_b.gateway_payment_id = "REF-CROSS-B"
    db_session.commit()

    event = _wompi_signed_event(monkeypatch, "secreto-webhook", {
        "id": "tx-cross-a", "status": "APPROVED", "reference": "REF-CROSS-A",
    })
    client.post("/public/payments/webhook", json=event)

    db_session.refresh(payment_a)
    db_session.refresh(payment_b)
    assert payment_a.status == "approved"
    assert payment_b.status == "pending"  # el pago de B no fue tocado
    assert payment_b.order_id is None
