"""Tests de páginas personalizadas de tienda."""
import pytest
import uuid
import models


# ── GET /shop-pages/{page_key} ────────────────────────────────────────────

def test_get_pagina_inexistente_devuelve_vacio(client, tenant_token, tenant_user):
    r = client.get("/shop-pages/home", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["page_key"] == "home"
    assert data["schema_data"] is None
    assert data["is_published"] is False


def test_get_pagina_existente(client, tenant_token, tenant_user, db_session):
    page = models.ShopPage(
        tenant_id=tenant_user.id,
        page_key="about",
        schema_data={"title": "Sobre nosotros"},
        is_published=False,
    )
    db_session.add(page)
    db_session.commit()

    r = client.get("/shop-pages/about", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["page_key"] == "about"
    assert data["schema_data"]["title"] == "Sobre nosotros"


def test_get_pagina_sin_auth(client):
    r = client.get("/shop-pages/home")
    assert r.status_code == 401


# ── POST /shop-pages (guardar) ────────────────────────────────────────────

def test_guardar_pagina_nueva(client, tenant_token, tenant_user):
    r = client.post("/shop-pages", json={
        "page_key": "home",
        "schema_data": {"blocks": [{"type": "hero", "title": "Bienvenido"}]},
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["page_key"] == "home"
    assert data["is_published"] is False


def test_guardar_pagina_actualiza_existente(client, tenant_token, tenant_user):
    client.post("/shop-pages", json={
        "page_key": "home",
        "schema_data": {"version": 1},
    }, headers={"Authorization": f"Bearer {tenant_token}"})

    r = client.post("/shop-pages", json={
        "page_key": "home",
        "schema_data": {"version": 2},
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert r.json()["schema_data"]["version"] == 2


def test_guardar_pagina_sin_auth(client):
    r = client.post("/shop-pages", json={"page_key": "home", "schema_data": {}})
    assert r.status_code == 401


# ── POST /shop-pages/publish ──────────────────────────────────────────────

def test_publicar_pagina_nueva(client, tenant_token, tenant_user):
    r = client.post("/shop-pages/publish", json={
        "page_key": "home",
        "schema_data": {"blocks": [{"type": "products"}]},
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["is_published"] is True
    assert data["page_key"] == "home"


def test_publicar_pagina_existente_la_marca(client, tenant_token, tenant_user, db_session):
    page = models.ShopPage(
        tenant_id=tenant_user.id,
        page_key="catalog",
        schema_data={},
        is_published=False,
    )
    db_session.add(page)
    db_session.commit()

    r = client.post("/shop-pages/publish", json={
        "page_key": "catalog",
        "schema_data": {"items": 10},
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert r.json()["is_published"] is True


def test_publicar_pagina_sin_auth(client):
    r = client.post("/shop-pages/publish", json={"page_key": "home", "schema_data": {}})
    assert r.status_code == 401


# ── GET /public/stores/{store_id}/pages/{page_key} ────────────────────────

def test_pagina_publica_publicada(client, tenant_user, db_session):
    page = models.ShopPage(
        tenant_id=tenant_user.id,
        page_key="home",
        schema_data={"title": "Mi tienda"},
        is_published=True,
    )
    db_session.add(page)
    db_session.commit()

    r = client.get(f"/public/stores/{tenant_user.id}/pages/home")
    assert r.status_code == 200
    data = r.json()
    assert data["page_key"] == "home"
    assert data["schema_data"]["title"] == "Mi tienda"


def test_pagina_publica_no_publicada_da_404(client, tenant_user, db_session):
    page = models.ShopPage(
        tenant_id=tenant_user.id,
        page_key="draft",
        schema_data={},
        is_published=False,
    )
    db_session.add(page)
    db_session.commit()

    r = client.get(f"/public/stores/{tenant_user.id}/pages/draft")
    assert r.status_code == 404


def test_pagina_publica_store_invalido(client):
    r = client.get("/public/stores/no-es-uuid/pages/home")
    assert r.status_code == 400


def test_pagina_publica_inexistente_da_404(client, tenant_user):
    r = client.get(f"/public/stores/{tenant_user.id}/pages/no-existe")
    assert r.status_code == 404


# ── Aislamiento entre tenants ─────────────────────────────────────────────

def test_tenant_no_ve_paginas_ajenas(client, tenant_token, db_session):
    import security
    otro = models.User(
        email="otro@pages.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Otro",
        role="admin_tienda",
        status="Activo",
        email_confirmed=True,
    )
    db_session.add(otro)
    db_session.commit()
    db_session.refresh(otro)

    page_ajena = models.ShopPage(
        tenant_id=otro.id,
        page_key="home",
        schema_data={"secreto": True},
        is_published=False,
    )
    db_session.add(page_ajena)
    db_session.commit()

    r = client.get("/shop-pages/home", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    # Debe devolver vacío, no los datos del otro tenant
    assert r.json()["schema_data"] is None
