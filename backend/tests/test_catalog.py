"""Tests del módulo Catálogo (banner + link público que redirige a la tienda real)."""
import pytest
import models


# ── Fixtures ──────────────────────────────────────────────────────────────

@pytest.fixture
def tienda_cat(db_session):
    import security
    user = models.User(
        email="tienda@catalogo.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Tienda Catálogo",
        shop_slug="tienda-catalogo",
        role="admin_tienda",
        status="Activo",
        email_confirmed=True,
        onboarding_completed=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def tienda_cat_sin_slug(db_session):
    import security
    user = models.User(
        email="sinslug@catalogo.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Tienda Sin Slug",
        shop_slug=None,
        role="admin_tienda",
        status="Activo",
        email_confirmed=True,
        onboarding_completed=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def cat_token(tienda_cat):
    import security
    return security.create_access_token(data={"sub": tienda_cat.email})


@pytest.fixture
def sin_slug_token(tienda_cat_sin_slug):
    import security
    return security.create_access_token(data={"sub": tienda_cat_sin_slug.email})


# ── GET /catalog ──────────────────────────────────────────────────────────

def test_get_catalog_vacio(client, tienda_cat, cat_token):
    r = client.get("/catalog", headers={"Authorization": f"Bearer {cat_token}"})
    assert r.status_code == 200
    assert r.json() is None


def test_get_catalog_sin_auth(client):
    r = client.get("/catalog")
    assert r.status_code == 401


# ── PUT /catalog (upsert, un solo catálogo por tenant) ─────────────────────

def test_upsert_catalog_no_duplica(client, tienda_cat, cat_token, db_session):
    r1 = client.put("/catalog", json={"banner_url": "https://x.test/banner1.jpg"},
                     headers={"Authorization": f"Bearer {cat_token}"})
    assert r1.status_code == 200
    assert r1.json()["banner_url"] == "https://x.test/banner1.jpg"
    assert r1.json()["status"] == "draft"

    r2 = client.put("/catalog", json={"banner_url": "https://x.test/banner2.jpg"},
                     headers={"Authorization": f"Bearer {cat_token}"})
    assert r2.status_code == 200
    assert r2.json()["banner_url"] == "https://x.test/banner2.jpg"

    rows = db_session.query(models.Catalog).filter(models.Catalog.tenant_id == tienda_cat.id).all()
    assert len(rows) == 1


# ── POST /catalog/publish ───────────────────────────────────────────────────

def test_publish_sin_banner_falla(client, tienda_cat, cat_token):
    r = client.post("/catalog/publish", headers={"Authorization": f"Bearer {cat_token}"})
    assert r.status_code == 400


def test_publish_sin_shop_slug_falla(client, tienda_cat_sin_slug, sin_slug_token):
    client.put("/catalog", json={"banner_url": "https://x.test/banner.jpg"},
               headers={"Authorization": f"Bearer {sin_slug_token}"})
    r = client.post("/catalog/publish", headers={"Authorization": f"Bearer {sin_slug_token}"})
    assert r.status_code == 400


def test_publish_ok(client, tienda_cat, cat_token):
    client.put("/catalog", json={"banner_url": "https://x.test/banner.jpg"},
               headers={"Authorization": f"Bearer {cat_token}"})
    r = client.post("/catalog/publish", headers={"Authorization": f"Bearer {cat_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "published"
    assert data["public_url"].endswith("/catalogo/tienda-catalogo")


# ── GET /public/catalog/{slug} ──────────────────────────────────────────────

def test_public_catalog_no_publicado_404(client, tienda_cat, cat_token):
    client.put("/catalog", json={"banner_url": "https://x.test/banner.jpg"},
               headers={"Authorization": f"Bearer {cat_token}"})
    r = client.get("/public/catalog/tienda-catalogo")
    assert r.status_code == 404


def test_public_catalog_publicado_ok(client, tienda_cat, cat_token):
    client.put("/catalog", json={"banner_url": "https://x.test/banner.jpg"},
               headers={"Authorization": f"Bearer {cat_token}"})
    client.post("/catalog/publish", headers={"Authorization": f"Bearer {cat_token}"})
    r = client.get("/public/catalog/tienda-catalogo")
    assert r.status_code == 200
    assert r.json()["shop_slug"] == "tienda-catalogo"


def test_public_catalog_slug_inexistente_404(client):
    r = client.get("/public/catalog/no-existe-esta-tienda")
    assert r.status_code == 404
