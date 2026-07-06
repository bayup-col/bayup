"""Tests del router de notificaciones (routers/notifications.py)."""
import pytest
import models


def _add_notif(db, tenant_id, title="Test", message="msg", is_read=False):
    n = models.Notification(tenant_id=tenant_id, title=title, message=message, type="info", is_read=is_read)
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


def test_get_notifications_vacio(client, tenant_token):
    r = client.get("/notifications", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert r.json() == []


def test_get_notifications_con_datos(client, db_session, tenant_user, tenant_token):
    _add_notif(db_session, tenant_user.id, title="Alerta")
    r = client.get("/notifications", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 1
    assert data[0]["title"] == "Alerta"


def test_mark_all_read(client, db_session, tenant_user, tenant_token):
    _add_notif(db_session, tenant_user.id, is_read=False)
    _add_notif(db_session, tenant_user.id, is_read=False)
    r = client.put("/notifications/read-all", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert r.json()["success"] is True


def test_mark_one_read(client, db_session, tenant_user, tenant_token):
    notif = _add_notif(db_session, tenant_user.id, is_read=False)
    r = client.put(
        f"/notifications/{notif.id}/read",
        headers={"Authorization": f"Bearer {tenant_token}"},
    )
    assert r.status_code == 200
    db_session.refresh(notif)
    assert notif.is_read is True


def test_mark_one_read_id_invalido(client, tenant_token):
    r = client.put("/notifications/no-un-uuid/read", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 400


def test_notificaciones_sin_auth(client):
    r = client.get("/notifications")
    assert r.status_code == 401
