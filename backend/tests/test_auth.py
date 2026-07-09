"""Tests del flujo de autenticación — login, token, /auth/me."""
import pytest


def test_login_correcto(client, tenant_user):
    r = client.post("/auth/login", json={"email": "tenant@test.com", "password": "test1234"})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == "tenant@test.com"


def test_login_password_incorrecto(client, tenant_user):
    r = client.post("/auth/login", json={"email": "tenant@test.com", "password": "mala"})
    assert r.status_code == 400


def test_login_email_inexistente(client):
    r = client.post("/auth/login", json={"email": "noexiste@test.com", "password": "algo"})
    assert r.status_code == 400


def test_auth_me(client, tenant_token):
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert r.json()["email"] == "tenant@test.com"


def test_auth_me_sin_token(client):
    r = client.get("/auth/me")
    assert r.status_code == 401


def test_auth_me_token_invalido(client):
    r = client.get("/auth/me", headers={"Authorization": "Bearer token_falso"})
    assert r.status_code == 401
