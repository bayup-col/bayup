"""Tests de analítica de storefront (tráfico / audiencia)."""
import uuid
import models


# ── POST /public/track/pageview ─────────────────────────────────────────────

def test_track_pageview_nueva_sesion_crea_visitante_y_sesion(client, db_session, tenant_user):
    visitor_id = str(uuid.uuid4())
    session_id = str(uuid.uuid4())
    r = client.post("/public/track/pageview", json={
        "slug": tenant_user.shop_slug,
        "visitor_id": visitor_id,
        "session_id": session_id,
        "path": "/shop/" + tenant_user.shop_slug,
        "is_new_session": True,
        "referrer": "https://www.instagram.com/",
    })
    assert r.status_code == 200
    assert r.json()["ok"] is True

    visitor = db_session.query(models.AnalyticsVisitor).filter(
        models.AnalyticsVisitor.visitor_id == uuid.UUID(visitor_id)
    ).first()
    assert visitor is not None

    session = db_session.query(models.AnalyticsSession).filter(
        models.AnalyticsSession.id == uuid.UUID(session_id)
    ).first()
    assert session is not None
    assert session.is_new_visitor is True
    assert session.source == "social"
    assert session.pageview_count == 1

    pageviews = db_session.query(models.AnalyticsPageview).filter(
        models.AnalyticsPageview.session_id == uuid.UUID(session_id)
    ).all()
    assert len(pageviews) == 1


def test_track_pageview_misma_sesion_incrementa_contador(client, db_session, tenant_user):
    visitor_id = str(uuid.uuid4())
    session_id = str(uuid.uuid4())
    client.post("/public/track/pageview", json={
        "slug": tenant_user.shop_slug, "visitor_id": visitor_id, "session_id": session_id,
        "path": "/shop/" + tenant_user.shop_slug, "is_new_session": True,
    })
    r = client.post("/public/track/pageview", json={
        "slug": tenant_user.shop_slug, "visitor_id": visitor_id, "session_id": session_id,
        "path": "/shop/" + tenant_user.shop_slug + "?view=product&id=1", "is_new_session": False,
    })
    assert r.status_code == 200

    session = db_session.query(models.AnalyticsSession).filter(
        models.AnalyticsSession.id == uuid.UUID(session_id)
    ).first()
    assert session.pageview_count == 2

    visitors = db_session.query(models.AnalyticsVisitor).filter(
        models.AnalyticsVisitor.visitor_id == uuid.UUID(visitor_id)
    ).all()
    assert len(visitors) == 1  # no se duplica


def test_track_pageview_visitante_recurrente_no_es_nuevo(client, db_session, tenant_user):
    visitor_id = str(uuid.uuid4())
    client.post("/public/track/pageview", json={
        "slug": tenant_user.shop_slug, "visitor_id": visitor_id, "session_id": str(uuid.uuid4()),
        "path": "/shop/x", "is_new_session": True,
    })
    session_id_2 = str(uuid.uuid4())
    client.post("/public/track/pageview", json={
        "slug": tenant_user.shop_slug, "visitor_id": visitor_id, "session_id": session_id_2,
        "path": "/shop/x", "is_new_session": True,
    })
    session2 = db_session.query(models.AnalyticsSession).filter(
        models.AnalyticsSession.id == uuid.UUID(session_id_2)
    ).first()
    assert session2.is_new_visitor is False


def test_track_pageview_slug_inexistente_no_falla(client):
    r = client.post("/public/track/pageview", json={
        "slug": "tienda-que-no-existe", "visitor_id": str(uuid.uuid4()),
        "session_id": str(uuid.uuid4()), "path": "/shop/x", "is_new_session": True,
    })
    assert r.status_code == 200
    assert r.json()["ok"] is False


def test_track_pageview_ids_invalidos_no_falla(client, tenant_user):
    r = client.post("/public/track/pageview", json={
        "slug": tenant_user.shop_slug, "visitor_id": "no-es-uuid",
        "session_id": "tampoco", "path": "/shop/x", "is_new_session": True,
    })
    assert r.status_code == 200
    assert r.json()["ok"] is False


# ── POST /public/track/session-end ──────────────────────────────────────────

def test_track_session_end_actualiza_duracion(client, db_session, tenant_user):
    session_id = str(uuid.uuid4())
    client.post("/public/track/pageview", json={
        "slug": tenant_user.shop_slug, "visitor_id": str(uuid.uuid4()), "session_id": session_id,
        "path": "/shop/x", "is_new_session": True,
    })
    r = client.post("/public/track/session-end", json={"session_id": session_id, "duration_seconds": 42})
    assert r.status_code == 200

    session = db_session.query(models.AnalyticsSession).filter(
        models.AnalyticsSession.id == uuid.UUID(session_id)
    ).first()
    assert session.duration_seconds == 42


def test_track_session_end_tope_defensivo(client, db_session, tenant_user):
    session_id = str(uuid.uuid4())
    client.post("/public/track/pageview", json={
        "slug": tenant_user.shop_slug, "visitor_id": str(uuid.uuid4()), "session_id": session_id,
        "path": "/shop/x", "is_new_session": True,
    })
    client.post("/public/track/session-end", json={"session_id": session_id, "duration_seconds": 999999})
    session = db_session.query(models.AnalyticsSession).filter(
        models.AnalyticsSession.id == uuid.UUID(session_id)
    ).first()
    assert session.duration_seconds == 6 * 3600


# ── GET /web-analytics/summary ──────────────────────────────────────────────

def test_summary_requiere_autenticacion(client):
    r = client.get("/web-analytics/summary")
    assert r.status_code == 401


def test_summary_agrega_datos_correctamente(client, db_session, tenant_user, tenant_token):
    # 2 sesiones: 1 nueva (rebote, 1 pageview), 1 recurrente (2 pageviews)
    v1, v2 = str(uuid.uuid4()), str(uuid.uuid4())
    s1, s2 = str(uuid.uuid4()), str(uuid.uuid4())

    client.post("/public/track/pageview", json={
        "slug": tenant_user.shop_slug, "visitor_id": v1, "session_id": s1,
        "path": "/shop/x", "is_new_session": True, "referrer": "https://www.google.com/search",
    })
    client.post("/public/track/session-end", json={"session_id": s1, "duration_seconds": 10})

    client.post("/public/track/pageview", json={
        "slug": tenant_user.shop_slug, "visitor_id": v2, "session_id": s2,
        "path": "/shop/x", "is_new_session": True,
    })
    client.post("/public/track/pageview", json={
        "slug": tenant_user.shop_slug, "visitor_id": v2, "session_id": s2,
        "path": "/shop/x?view=product&id=1", "is_new_session": False,
    })

    r = client.get("/web-analytics/summary?period=30d", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["total_sessions"] == 2
    assert data["unique_visitors"] == 2
    assert data["new_visitors"] == 2
    assert data["total_pageviews"] == 3
    assert data["bounce_rate_pct"] == 50.0
    assert any(s["source"] == "search" for s in data["sources"])
    assert len(data["top_pages"]) >= 1


def test_summary_no_mezcla_datos_de_otro_tenant(client, db_session, tenant_token, tenant_user):
    otro_tenant = models.User(
        email="otra-tienda@test.com", hashed_password="x", full_name="Otra Tienda",
        shop_slug="otra-tienda", role="admin_tienda", status="Activo",
    )
    db_session.add(otro_tenant)
    db_session.commit()

    client.post("/public/track/pageview", json={
        "slug": "otra-tienda", "visitor_id": str(uuid.uuid4()), "session_id": str(uuid.uuid4()),
        "path": "/shop/otra-tienda", "is_new_session": True,
    })

    r = client.get("/web-analytics/summary", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.json()["total_sessions"] == 0
