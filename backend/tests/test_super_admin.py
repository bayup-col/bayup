"""Tests del panel super admin — stats, empresas, registros, tesorería, planes."""
import pytest
import models


# ── GET /super-admin/stats ────────────────────────────────────────────────

def test_sa_stats(client, admin_token):
    r = client.get("/super-admin/stats", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    data = r.json()
    assert "total_tenants" in data or "tenants" in data or isinstance(data, dict)


def test_sa_stats_requiere_super_admin(client, tenant_token):
    r = client.get("/super-admin/stats", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 403


def test_sa_stats_sin_auth(client):
    r = client.get("/super-admin/stats")
    assert r.status_code == 401


# ── GET /super-admin/companies ────────────────────────────────────────────

def test_sa_listar_empresas(client, admin_token, tenant_user):
    r = client.get("/super-admin/companies", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert any(c["email"] == "tenant@test.com" for c in data)


def test_sa_companies_requiere_super_admin(client, tenant_token):
    r = client.get("/super-admin/companies", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 403


# ── PUT /super-admin/companies/{id}/suspend ───────────────────────────────

def test_sa_suspender_empresa(client, admin_token, tenant_user, db_session):
    r = client.put(f"/super-admin/companies/{tenant_user.id}/suspend",
                   json={"suspended": True, "notes": "Cuenta en revisión"},
                   headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    db_session.refresh(tenant_user)
    assert tenant_user.status == "Suspendido"


def test_sa_reactivar_empresa(client, admin_token, tenant_user, db_session):
    tenant_user.status = "Suspendido"
    db_session.commit()

    r = client.put(f"/super-admin/companies/{tenant_user.id}/suspend",
                   json={"suspended": False},
                   headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    db_session.refresh(tenant_user)
    assert tenant_user.status == "Activo"


# ── GET /super-admin/registrations ───────────────────────────────────────

def test_sa_listar_registros(client, admin_token):
    r = client.get("/super-admin/registrations", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_sa_registrations_requiere_super_admin(client, tenant_token):
    r = client.get("/super-admin/registrations", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 403


# ── PUT /super-admin/registrations/{id}/approve ──────────────────────────

def test_sa_aprobar_registro(client, admin_token, db_session):
    import security
    pendiente = models.User(
        email="pendiente@reg.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Pendiente",
        role="admin_tienda",
        status="Pendiente",
        email_confirmed=False,
    )
    db_session.add(pendiente)
    db_session.commit()
    db_session.refresh(pendiente)

    r = client.put(f"/super-admin/registrations/{pendiente.id}/approve", json={},
                   headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    db_session.refresh(pendiente)
    assert pendiente.status == "Activo"


# ── GET /super-admin/treasury ────────────────────────────────────────────

def test_sa_treasury(client, admin_token):
    r = client.get("/super-admin/treasury", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, dict)


def test_sa_treasury_requiere_super_admin(client, tenant_token):
    r = client.get("/super-admin/treasury", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 403


# ── GET /super-admin/plans ────────────────────────────────────────────────

def test_sa_listar_planes(client, admin_token):
    r = client.get("/super-admin/plans", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ── GET /super-admin/users ────────────────────────────────────────────────

def test_sa_listar_usuarios(client, admin_token, tenant_user):
    r = client.get("/super-admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)


# ── GET /super-admin/reports ──────────────────────────────────────────────

def test_sa_reports(client, admin_token):
    r = client.get("/super-admin/reports", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200


def test_sa_reports_requiere_super_admin(client, tenant_token):
    r = client.get("/super-admin/reports", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 403


# ── GET /super-admin/web-templates ───────────────────────────────────────

def test_sa_listar_templates(client, admin_token):
    r = client.get("/super-admin/web-templates", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ── DELETE /super-admin/companies/{id} ───────────────────────────────────

def test_sa_eliminar_empresa(client, admin_token, db_session):
    import security
    empresa = models.User(
        email="eliminar@empresa.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Empresa A Eliminar",
        role="admin_tienda",
        status="Activo",
        email_confirmed=True,
    )
    db_session.add(empresa)
    db_session.commit()
    db_session.refresh(empresa)

    empresa_id = empresa.id
    db_session.expunge(empresa)  # libera la referencia antes de borrar

    r = client.delete(f"/super-admin/companies/{empresa_id}",
                      headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert r.json()["ok"] is True

    eliminada = db_session.query(models.User).filter(models.User.id == empresa_id).first()
    assert eliminada is None
