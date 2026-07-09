"""Tests del roadmap público y de super admin."""
import pytest
import uuid
import models


@pytest.fixture
def item_roadmap(db_session):
    item = models.RoadmapItem(
        id=uuid.uuid4(),
        title="Módulo de pagos",
        tagline="Acepta pagos online",
        phase="proximamente",
        is_active=True,
        votes=0,
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)
    return item


# ── GET /public/roadmap ───────────────────────────────────────────────────

def test_roadmap_publico_vacio(client):
    r = client.get("/public/roadmap")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_roadmap_publico_con_items_activos(client, item_roadmap):
    r = client.get("/public/roadmap")
    assert r.status_code == 200
    assert any(i["title"] == "Módulo de pagos" for i in r.json())


def test_roadmap_publico_no_muestra_inactivos(client, db_session):
    item = models.RoadmapItem(
        id=uuid.uuid4(),
        title="Item Oculto",
        phase="proximamente",
        is_active=False,
        votes=0,
    )
    db_session.add(item)
    db_session.commit()

    r = client.get("/public/roadmap")
    assert r.status_code == 200
    assert not any(i["title"] == "Item Oculto" for i in r.json())


# ── POST /public/roadmap/{id}/vote ────────────────────────────────────────

def test_votar_item_anonimo(client, item_roadmap):
    iid = str(item_roadmap.id)
    r = client.post(f"/public/roadmap/{iid}/vote", json={"session_key": "sesion-anon-1"})
    assert r.status_code == 200
    data = r.json()
    assert data["voted"] is True
    assert data["votes"] == 1


def test_voto_toggle_anonimo(client, item_roadmap):
    iid = str(item_roadmap.id)
    client.post(f"/public/roadmap/{iid}/vote", json={"session_key": "sesion-toggle"})
    r = client.post(f"/public/roadmap/{iid}/vote", json={"session_key": "sesion-toggle"})
    assert r.status_code == 200
    assert r.json()["voted"] is False
    assert r.json()["votes"] == 0


def test_votar_item_inexistente(client):
    r = client.post(f"/public/roadmap/{uuid.uuid4()}/vote", json={})
    assert r.status_code == 404


# ── Super admin: GET /super-admin/roadmap ────────────────────────────────

def test_sa_listar_roadmap(client, admin_token, item_roadmap):
    r = client.get("/super-admin/roadmap", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    data = r.json()
    assert any(i["title"] == "Módulo de pagos" for i in data)
    assert "is_active" in data[0]


def test_sa_roadmap_requiere_super_admin(client, tenant_token):
    r = client.get("/super-admin/roadmap", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 403


# ── Super admin: POST /super-admin/roadmap ───────────────────────────────

def test_sa_crear_item_roadmap(client, admin_token):
    r = client.post("/super-admin/roadmap", json={
        "title": "Facturación electrónica",
        "tagline": "DIAN-ready",
        "phase": "en_desarrollo",
        "is_active": True,
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert "id" in r.json()


# ── Super admin: PUT /super-admin/roadmap/{id} ───────────────────────────

def test_sa_actualizar_item_roadmap(client, admin_token, item_roadmap):
    iid = str(item_roadmap.id)
    r = client.put(f"/super-admin/roadmap/{iid}", json={
        "title": "Módulo Actualizado",
        "phase": "lanzado",
        "is_active": True,
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_sa_actualizar_item_inexistente(client, admin_token):
    r = client.put(f"/super-admin/roadmap/{uuid.uuid4()}", json={
        "title": "x", "phase": "proximamente", "is_active": True,
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 404


# ── Super admin: DELETE /super-admin/roadmap/{id} ────────────────────────

def test_sa_eliminar_item_roadmap(client, admin_token, item_roadmap):
    iid = str(item_roadmap.id)
    r = client.delete(f"/super-admin/roadmap/{iid}", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert r.json()["ok"] is True


# ── Super admin: GET /super-admin/roadmap/{id}/voters ────────────────────

def test_sa_ver_votantes(client, admin_token, item_roadmap):
    iid = str(item_roadmap.id)
    r = client.get(f"/super-admin/roadmap/{iid}/voters", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)
