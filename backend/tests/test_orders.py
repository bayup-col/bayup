"""Tests de flujo de órdenes — creación, actualización de estado."""
import pytest
import models
import uuid


def _create_product(db, tenant_id, stock=10):
    product = models.Product(
        owner_id=tenant_id,
        name="Producto Test",
        description="desc",
        price=50000,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    variant = models.ProductVariant(
        product_id=product.id,
        name="Única",
        price=50000,
        stock=stock,
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return product, variant


def test_crear_orden_pos(client, db_session, tenant_user, tenant_token):
    product, variant = _create_product(db_session, tenant_user.id)
    payload = {
        "total_price": 100000,
        "customer_name": "Juan Pérez",
        "customer_email": "",
        "customer_phone": "3001234567",
        "customer_city": "Bogotá",
        "shipping_address": "Calle 1",
        "payment_method": "Efectivo",
        "source": "pos",
        "items": [{"product_variant_id": str(variant.id), "quantity": 2, "price_at_purchase": 50000}],
    }
    r = client.post("/orders", json=payload, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["customer_name"] == "Juan Pérez"
    assert data["total_price"] == 100000


def test_crear_orden_sin_stock(client, db_session, tenant_user, tenant_token):
    product, variant = _create_product(db_session, tenant_user.id, stock=0)

    payload = {
        "total_price": 10000,
        "customer_name": "Ana",
        "items": [{"product_variant_id": str(variant.id), "quantity": 1, "price_at_purchase": 10000}],
    }
    r = client.post("/orders", json=payload, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 400


def test_actualizar_estado_orden(client, db_session, tenant_user, tenant_token):
    product, variant = _create_product(db_session, tenant_user.id)
    order = models.Order(
        tenant_id=tenant_user.id,
        customer_name="Test",
        total_price=50000,
        status="pending",
        source="pos",
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)
    item = models.OrderItem(
        order_id=order.id,
        product_variant_id=variant.id,
        quantity=1,
        price_at_purchase=50000,
    )
    db_session.add(item)
    db_session.commit()

    r = client.put(
        f"/orders/{order.id}",
        json={"status": "processing"},
        headers={"Authorization": f"Bearer {tenant_token}"},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "processing"


def test_orden_ajena_no_accesible(client, db_session, tenant_user, tenant_token):
    otro_tenant = models.User(
        email="otro@test.com",
        hashed_password="x",
        role="admin_tienda",
        status="Activo",
    )
    db_session.add(otro_tenant)
    db_session.commit()
    db_session.refresh(otro_tenant)

    orden_ajena = models.Order(
        tenant_id=otro_tenant.id,
        customer_name="Extraño",
        total_price=10000,
        status="pending",
        source="pos",
    )
    db_session.add(orden_ajena)
    db_session.commit()
    db_session.refresh(orden_ajena)

    r = client.put(
        f"/orders/{orden_ajena.id}",
        json={"status": "cancelled"},
        headers={"Authorization": f"Bearer {tenant_token}"},
    )
    assert r.status_code == 404
