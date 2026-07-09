"""Tests de plantillas web — listado y preview HTML."""
import pytest
import uuid
import models


@pytest.fixture
def template_activo(db_session):
    t = models.WebTemplate(
        id=uuid.uuid4(),
        name="Plantilla Moderna",
        category="Moda",
        description="Diseño limpio",
        is_active=True,
        is_premium=False,
        uses=0,
    )
    db_session.add(t)
    db_session.commit()
    db_session.refresh(t)
    return t


@pytest.fixture
def template_html(db_session):
    t = models.WebTemplate(
        id=uuid.uuid4(),
        name="Plantilla HTML",
        category="General",
        is_active=True,
        is_premium=False,
        uses=0,
        template_type="html",
        html_pages={"home": "<html><head></head><body>Inicio</body></html>"},
    )
    db_session.add(t)
    db_session.commit()
    db_session.refresh(t)
    return t


# ── GET /web-templates ────────────────────────────────────────────────────

def test_listar_templates_vacio(client, tenant_token, tenant_user):
    r = client.get("/web-templates", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_listar_templates_con_activos(client, tenant_token, template_activo):
    r = client.get("/web-templates", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert any(t["name"] == "Plantilla Moderna" for t in data)


def test_listar_templates_no_incluye_inactivos(client, tenant_token, db_session):
    t = models.WebTemplate(
        id=uuid.uuid4(),
        name="Plantilla Inactiva",
        category="General",
        is_active=False,
        is_premium=False,
        uses=0,
    )
    db_session.add(t)
    db_session.commit()

    r = client.get("/web-templates", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert not any(t["name"] == "Plantilla Inactiva" for t in r.json())


def test_listar_templates_sin_auth(client):
    r = client.get("/web-templates")
    assert r.status_code == 401


def test_template_tiene_campos_esperados(client, tenant_token, template_activo):
    r = client.get("/web-templates", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 1
    t = next(x for x in data if x["name"] == "Plantilla Moderna")
    assert "id" in t
    assert "name" in t
    assert "category" in t
    assert "isPremium" in t
    assert "isActive" in t
    assert "uses" in t


# ── GET /web-templates/{id}/preview/{page_key} ───────────────────────────

def test_preview_template_html_ok(client, tenant_token, template_html):
    tid = str(template_html.id)
    r = client.get(f"/web-templates/{tid}/preview/home",
                   headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert "text/html" in r.headers.get("content-type", "")
    assert "Inicio" in r.text


def test_preview_template_no_html_da_404(client, tenant_token, template_activo):
    tid = str(template_activo.id)
    r = client.get(f"/web-templates/{tid}/preview/home",
                   headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 404


def test_preview_template_id_invalido(client, tenant_token, tenant_user):
    r = client.get("/web-templates/no-es-uuid/preview/home",
                   headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 400


def test_preview_pagina_inexistente_usa_home_como_fallback(client, tenant_token, template_html):
    """Si la página pedida no existe, el endpoint devuelve 'home' como fallback."""
    tid = str(template_html.id)
    r = client.get(f"/web-templates/{tid}/preview/pagina-que-no-existe",
                   headers={"Authorization": f"Bearer {tenant_token}"})
    # El endpoint hace fallback a "home" → 200, no 404
    assert r.status_code == 200
    assert "Inicio" in r.text


def test_preview_template_sin_paginas_da_404(client, tenant_token, db_session):
    """Un template HTML sin ninguna página sí devuelve 404."""
    t = models.WebTemplate(
        id=uuid.uuid4(),
        name="Sin Páginas",
        category="General",
        is_active=True,
        is_premium=False,
        uses=0,
        template_type="html",
        html_pages={},
    )
    db_session.add(t)
    db_session.commit()
    db_session.refresh(t)

    r = client.get(f"/web-templates/{t.id}/preview/home",
                   headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 404


def test_preview_sin_auth(client, template_html):
    tid = str(template_html.id)
    r = client.get(f"/web-templates/{tid}/preview/home")
    assert r.status_code == 401
