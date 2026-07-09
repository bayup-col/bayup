"""Tests del flujo de autenticación — login, register, logout, reset-password, /auth/me."""
import pytest
import models
from datetime import datetime, timezone, timedelta


# ── Login ─────────────────────────────────────────────────────────────────

def test_login_correcto(client, tenant_user):
    r = client.post("/auth/login", json={"email": "tenant@test.com", "password": "test1234"})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == "tenant@test.com"
    assert data["user"]["role"] == "admin_tienda"


def test_login_password_incorrecto(client, tenant_user):
    r = client.post("/auth/login", json={"email": "tenant@test.com", "password": "mala"})
    assert r.status_code == 400


def test_login_email_inexistente(client):
    r = client.post("/auth/login", json={"email": "noexiste@test.com", "password": "algo"})
    assert r.status_code == 400


def test_login_cuenta_suspendida(client, db_session):
    import security
    user = models.User(
        email="suspendido@auth.com",
        hashed_password=security.get_password_hash("pass1234"),
        full_name="Suspendido",
        role="admin_tienda",
        status="Suspendido",
        email_confirmed=True,
    )
    db_session.add(user)
    db_session.commit()
    r = client.post("/auth/login", json={"email": "suspendido@auth.com", "password": "pass1234"})
    assert r.status_code == 403


def test_login_email_no_confirmado(client, db_session):
    import security
    user = models.User(
        email="sinconfirmar@auth.com",
        hashed_password=security.get_password_hash("pass1234"),
        full_name="Sin Confirmar",
        role="admin_tienda",
        status="Activo",
        email_confirmed=False,
    )
    db_session.add(user)
    db_session.commit()
    r = client.post("/auth/login", json={"email": "sinconfirmar@auth.com", "password": "pass1234"})
    assert r.status_code == 403
    assert "confirmar" in r.json()["detail"].lower()


# ── /auth/me ──────────────────────────────────────────────────────────────

def test_auth_me(client, tenant_token):
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == "tenant@test.com"
    assert "role" in data
    assert "shop_slug" in data


def test_auth_me_sin_token(client):
    r = client.get("/auth/me")
    assert r.status_code == 401


def test_auth_me_token_invalido(client):
    r = client.get("/auth/me", headers={"Authorization": "Bearer token_falso"})
    assert r.status_code == 401


# ── Register ──────────────────────────────────────────────────────────────

def test_register_nuevo_usuario(client):
    r = client.post("/auth/register", json={
        "email": "nuevo@authtest.com",
        "password": "pass1234",
        "full_name": "Nuevo Usuario",
    })
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == "nuevo@authtest.com"
    assert "id" in data


def test_register_email_duplicado(client, tenant_user):
    r = client.post("/auth/register", json={
        "email": "tenant@test.com",
        "password": "pass1234",
        "full_name": "Duplicado",
    })
    assert r.status_code == 400


def test_register_password_muy_corta(client):
    r = client.post("/auth/register", json={
        "email": "short@authtest.com",
        "password": "12345",
        "full_name": "Short",
    })
    assert r.status_code == 422


# ── Logout ────────────────────────────────────────────────────────────────

def test_logout(client, tenant_token):
    r = client.post("/auth/logout", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert r.json()["ok"] is True


# ── Forgot / Reset password ───────────────────────────────────────────────

def test_forgot_password_siempre_200(client):
    r = client.post("/auth/forgot-password", json={"email": "noexiste@x.com"})
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_reset_password_token_invalido(client):
    r = client.post("/auth/reset-password", json={
        "token": "token-falso-xyz",
        "new_password": "nuevapass123",
    })
    assert r.status_code == 400


def test_reset_password_token_valido(client, db_session):
    import security
    user = models.User(
        email="reset@authtest.com",
        hashed_password=security.get_password_hash("vieja123"),
        full_name="Reset User",
        role="admin_tienda",
        status="Activo",
        email_confirmed=True,
        password_reset_token="token-valido-reset",
        password_reset_expires=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    db_session.add(user)
    db_session.commit()

    r = client.post("/auth/reset-password", json={
        "token": "token-valido-reset",
        "new_password": "nueva1234",
    })
    assert r.status_code == 200
    assert r.json()["ok"] is True
    db_session.refresh(user)
    assert security.verify_password("nueva1234", user.hashed_password)


def test_reset_password_token_expirado(client, db_session):
    import security
    user = models.User(
        email="expirado@authtest.com",
        hashed_password=security.get_password_hash("vieja123"),
        full_name="Expirado",
        role="admin_tienda",
        status="Activo",
        email_confirmed=True,
        password_reset_token="token-expirado",
        password_reset_expires=datetime.now(timezone.utc) - timedelta(hours=2),
    )
    db_session.add(user)
    db_session.commit()

    r = client.post("/auth/reset-password", json={
        "token": "token-expirado",
        "new_password": "nueva1234",
    })
    assert r.status_code == 400
