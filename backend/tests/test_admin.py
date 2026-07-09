"""Tests de rutas de administración de tienda — perfil, staff, roles, pagos."""
import pytest
import models


# ── GET /admin/users ──────────────────────────────────────────────────────

def test_listar_usuarios_tenant(client, tenant_token, tenant_user):
    r = client.get("/admin/users", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)


def test_listar_usuarios_sin_auth(client):
    r = client.get("/admin/users")
    assert r.status_code == 401


# ── PUT /admin/update-profile ─────────────────────────────────────────────

def test_actualizar_perfil(client, tenant_token, tenant_user):
    r = client.put("/admin/update-profile", json={
        "full_name": "Tienda Actualizada",
        "phone": "3009999999",
        "category": "Tecnología",
        "story": "Mi historia",
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_actualizar_perfil_sin_auth(client):
    r = client.put("/admin/update-profile", json={"full_name": "x"})
    assert r.status_code == 401


# ── POST /admin/staff ─────────────────────────────────────────────────────

def test_crear_staff(client, tenant_token, tenant_user, db_session):
    r = client.post("/admin/staff", json={
        "email": "staff@tienda.com",
        "password": "staffpass1",
        "full_name": "Vendedor Test",
        "role": "vendedor",
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == "staff@tienda.com"
    assert data["role"] == "vendedor"


def test_crear_staff_email_duplicado(client, tenant_token, tenant_user, db_session):
    import security
    staff = models.User(
        email="existente@tienda.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Existente",
        role="vendedor",
        owner_id=tenant_user.id,
        status="Activo",
        email_confirmed=True,
    )
    db_session.add(staff)
    db_session.commit()

    r = client.post("/admin/staff", json={
        "email": "existente@tienda.com",
        "password": "pass1234",
        "full_name": "Duplicado",
        "role": "vendedor",
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 400


def test_crear_staff_sin_auth(client):
    r = client.post("/admin/staff", json={
        "email": "x@x.com", "password": "x", "full_name": "x", "role": "vendedor",
    })
    assert r.status_code == 401


# ── GET /admin/staff ──────────────────────────────────────────────────────

def test_listar_staff(client, tenant_token, tenant_user, db_session):
    import security
    staff = models.User(
        email="staff2@tienda.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Staff Dos",
        role="vendedor",
        owner_id=tenant_user.id,
        status="Activo",
        email_confirmed=True,
    )
    db_session.add(staff)
    db_session.commit()

    r = client.get("/admin/staff", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert any(u["email"] == "staff2@tienda.com" for u in data)


# ── DELETE /admin/staff/{id} ──────────────────────────────────────────────

def test_eliminar_staff(client, tenant_token, tenant_user, db_session):
    import security
    staff = models.User(
        email="eliminar@tienda.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Para Eliminar",
        role="vendedor",
        owner_id=tenant_user.id,
        status="Activo",
        email_confirmed=True,
    )
    db_session.add(staff)
    db_session.commit()
    db_session.refresh(staff)

    r = client.delete(f"/admin/staff/{staff.id}", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_eliminar_staff_ajeno(client, tenant_token, db_session):
    """No se puede eliminar un staff que no pertenece al tenant."""
    import security
    otro_owner = models.User(
        email="otro@owner.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Otro Owner",
        role="admin_tienda",
        status="Activo",
        email_confirmed=True,
    )
    db_session.add(otro_owner)
    db_session.commit()
    db_session.refresh(otro_owner)

    staff_ajeno = models.User(
        email="ajeno@tienda.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Ajeno",
        role="vendedor",
        owner_id=otro_owner.id,
        status="Activo",
        email_confirmed=True,
    )
    db_session.add(staff_ajeno)
    db_session.commit()
    db_session.refresh(staff_ajeno)

    r = client.delete(f"/admin/staff/{staff_ajeno.id}", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 404


# ── GET /admin/roles ──────────────────────────────────────────────────────

def test_listar_roles(client, tenant_token):
    r = client.get("/admin/roles", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) > 0


# ── GET /admin/payments ───────────────────────────────────────────────────

def test_listar_pagos_tenant(client, tenant_token, tenant_user, db_session):
    payment = models.Payment(
        tenant_id=tenant_user.id,
        amount=80000,
        currency="COP",
        status="pending",
        customer_name="Cliente Admin",
        customer_email="c@c.com",
        customer_phone="300",
        items=[],
    )
    db_session.add(payment)
    db_session.commit()

    r = client.get("/admin/payments", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert any(p["amount"] == 80000 for p in data)


def test_listar_pagos_sin_auth(client):
    r = client.get("/admin/payments")
    assert r.status_code == 401


# ── GET /admin/logs ───────────────────────────────────────────────────────

def test_listar_logs(client, tenant_token):
    r = client.get("/admin/logs", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ── Super admin: GET /admin/users (vista global) ──────────────────────────

def test_sa_listar_todos_usuarios(client, admin_token):
    r = client.get("/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)
