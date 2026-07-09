"""Tests de tickets de soporte — tenant y super admin."""
import pytest
import models


# ── POST /support/tickets ─────────────────────────────────────────────────

def test_crear_ticket_ok(client, tenant_token, tenant_user):
    r = client.post("/support/tickets", json={
        "title": "Problema con mi tienda",
        "text": "No puedo subir imágenes",
        "category": "Técnico",
        "priority": "Alta",
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["title"] == "Problema con mi tienda"
    assert data["status"] == "Abierto"
    assert data["priority"] == "Alta"
    assert data["category"] == "Técnico"
    assert len(data["messages"]) == 1


def test_crear_ticket_sin_titulo(client, tenant_token):
    r = client.post("/support/tickets", json={
        "title": "  ",
        "text": "Sin título",
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 400


def test_crear_ticket_sin_auth(client):
    r = client.post("/support/tickets", json={"title": "x"})
    assert r.status_code == 401


# ── GET /support/tickets ──────────────────────────────────────────────────

def test_listar_mis_tickets(client, tenant_token, tenant_user, db_session):
    ticket = models.SupportTicket(
        tenant_id=tenant_user.id,
        title="Ticket de lista",
        category="General",
        priority="Media",
        status="Abierto",
        messages=[],
    )
    db_session.add(ticket)
    db_session.commit()

    r = client.get("/support/tickets", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    data = r.json()
    assert any(t["title"] == "Ticket de lista" for t in data)


def test_listar_tickets_sin_auth(client):
    r = client.get("/support/tickets")
    assert r.status_code == 401


def test_tickets_aislados_por_tenant(client, tenant_token, db_session):
    """Un tenant no ve los tickets de otro tenant."""
    import security
    otro = models.User(
        email="otro@support.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Otro",
        role="admin_tienda",
        status="Activo",
        email_confirmed=True,
    )
    db_session.add(otro)
    db_session.commit()
    db_session.refresh(otro)

    ticket_ajeno = models.SupportTicket(
        tenant_id=otro.id,
        title="Ticket ajeno secreto",
        category="General",
        priority="Baja",
        status="Abierto",
        messages=[],
    )
    db_session.add(ticket_ajeno)
    db_session.commit()

    r = client.get("/support/tickets", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    assert not any(t["title"] == "Ticket ajeno secreto" for t in r.json())


# ── POST /support/tickets/{ticket_id}/reply ───────────────────────────────

def test_responder_ticket_propio(client, tenant_token, tenant_user, db_session):
    ticket = models.SupportTicket(
        tenant_id=tenant_user.id,
        title="Ticket con respuesta",
        category="General",
        priority="Baja",
        status="Abierto",
        messages=[],
    )
    db_session.add(ticket)
    db_session.commit()
    db_session.refresh(ticket)

    short_id = f"TKT-{str(ticket.id)[:8].upper()}"
    r = client.post(f"/support/tickets/{short_id}/reply", json={
        "text": "Hola, aquí mi consulta detallada",
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 200
    db_session.refresh(ticket)
    assert len(ticket.messages) == 1
    assert ticket.messages[0]["text"] == "Hola, aquí mi consulta detallada"


def test_responder_ticket_ajeno_da_404(client, tenant_token, db_session):
    import security
    otro = models.User(
        email="owner2@support.com",
        hashed_password=security.get_password_hash("x"),
        full_name="Otro Owner",
        role="admin_tienda",
        status="Activo",
        email_confirmed=True,
    )
    db_session.add(otro)
    db_session.commit()
    db_session.refresh(otro)

    ticket_ajeno = models.SupportTicket(
        tenant_id=otro.id,
        title="Ticket ajeno",
        category="General",
        priority="Baja",
        status="Abierto",
        messages=[],
    )
    db_session.add(ticket_ajeno)
    db_session.commit()
    db_session.refresh(ticket_ajeno)

    short_id = f"TKT-{str(ticket_ajeno.id)[:8].upper()}"
    r = client.post(f"/support/tickets/{short_id}/reply", json={
        "text": "intento acceder a ticket ajeno",
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 404


def test_responder_mensaje_vacio_da_400(client, tenant_token, tenant_user, db_session):
    ticket = models.SupportTicket(
        tenant_id=tenant_user.id,
        title="Mensaje vacío",
        category="General",
        priority="Baja",
        status="Abierto",
        messages=[],
    )
    db_session.add(ticket)
    db_session.commit()
    db_session.refresh(ticket)

    short_id = f"TKT-{str(ticket.id)[:8].upper()}"
    r = client.post(f"/support/tickets/{short_id}/reply", json={
        "text": "   ",
    }, headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 400


# ── Super admin ───────────────────────────────────────────────────────────

def test_sa_listar_todos_tickets(client, admin_token, tenant_user, db_session):
    ticket = models.SupportTicket(
        tenant_id=tenant_user.id,
        title="Ticket para superadmin",
        category="General",
        priority="Alta",
        status="Abierto",
        messages=[],
    )
    db_session.add(ticket)
    db_session.commit()

    r = client.get("/super-admin/support/tickets", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    data = r.json()
    assert any(t["title"] == "Ticket para superadmin" for t in data)


def test_sa_tickets_requiere_super_admin(client, tenant_token):
    r = client.get("/super-admin/support/tickets", headers={"Authorization": f"Bearer {tenant_token}"})
    assert r.status_code == 403


def test_sa_resolver_ticket(client, admin_token, tenant_user, db_session):
    ticket = models.SupportTicket(
        tenant_id=tenant_user.id,
        title="Ticket a resolver",
        category="General",
        priority="Media",
        status="Abierto",
        messages=[],
    )
    db_session.add(ticket)
    db_session.commit()
    db_session.refresh(ticket)

    short_id = f"TKT-{str(ticket.id)[:8].upper()}"
    r = client.post(f"/super-admin/support/tickets/{short_id}/resolve", json={},
                    headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    db_session.refresh(ticket)
    assert ticket.status == "Resuelto"


def test_sa_responder_ticket(client, admin_token, tenant_user, db_session):
    ticket = models.SupportTicket(
        tenant_id=tenant_user.id,
        title="Ticket SA responde",
        category="General",
        priority="Baja",
        status="Abierto",
        messages=[],
    )
    db_session.add(ticket)
    db_session.commit()
    db_session.refresh(ticket)

    short_id = f"TKT-{str(ticket.id)[:8].upper()}"
    r = client.post(f"/super-admin/support/tickets/{short_id}/reply", json={
        "text": "Respuesta del equipo Bayup",
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    db_session.refresh(ticket)
    assert any(m["sender"] == "soporte" for m in ticket.messages)
