from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import cast, String
from sqlalchemy.orm import Session

import models
from database import get_db
from deps import current_user, tenant_id_from, require_super_admin, push_notification

router = APIRouter(tags=["support"])


def _serialize_ticket(t, tenant=None) -> dict:
    return {
        "id": f"TKT-{str(t.id)[:8].upper()}",
        "title": t.title,
        "company": tenant.full_name if tenant else "Tienda eliminada",
        "userEmail": tenant.email if tenant else None,
        "priority": t.priority,
        "status": t.status,
        "category": t.category,
        "createdAt": t.created_at.isoformat() if t.created_at else None,
        "messages": t.messages or [],
    }


def _find_ticket(db: Session, short_id: str):
    target = short_id.replace("TKT-", "").lower()
    return db.query(models.SupportTicket).filter(
        cast(models.SupportTicket.id, String).like(f"{target}%")
    ).first()


# ── Super-admin ───────────────────────────────────────────────────────────

@router.get("/super-admin/support/tickets")
async def get_super_admin_tickets(request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    tickets = db.query(models.SupportTicket).order_by(models.SupportTicket.created_at.desc()).all()
    tenants = {t.id: t for t in db.query(models.User).all()}
    return [_serialize_ticket(t, tenants.get(t.tenant_id)) for t in tickets]


@router.post("/super-admin/support/tickets/{ticket_id}/reply")
async def reply_super_admin_ticket(ticket_id: str, payload: dict, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    ticket = _find_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")
    msgs = list(ticket.messages or [])
    msgs.append({"sender": "soporte", "text": text, "time": datetime.now(timezone.utc).strftime("%H:%M")})
    ticket.messages = msgs
    if ticket.status == "Abierto":
        ticket.status = "En proceso"
    db.commit()
    tenant = db.query(models.User).filter(models.User.id == ticket.tenant_id).first()
    push_notification(db, ticket.tenant_id, "💬 Soporte Bayup respondió", f"Ticket: {ticket.title}")
    return _serialize_ticket(ticket, tenant)


@router.post("/super-admin/support/tickets/{ticket_id}/resolve")
async def resolve_super_admin_ticket(ticket_id: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    ticket = _find_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    ticket.status = "Resuelto"
    db.commit()
    tenant = db.query(models.User).filter(models.User.id == ticket.tenant_id).first()
    return _serialize_ticket(ticket, tenant)


# ── Tenant ────────────────────────────────────────────────────────────────

@router.post("/support/tickets")
async def create_ticket(payload: dict, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    tid = tenant_id_from(user)
    title = (payload.get("title") or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="El título es obligatorio")
    text = (payload.get("text") or "").strip()
    ticket = models.SupportTicket(
        tenant_id=tid,
        title=title,
        category=payload.get("category") or "General",
        priority=payload.get("priority") or "Media",
        status="Abierto",
        messages=[{"sender": "usuario", "text": text, "time": datetime.now(timezone.utc).strftime("%H:%M")}] if text else [],
    )
    db.add(ticket)
    db.commit()
    super_admins = db.query(models.User).filter(models.User.is_global_staff == True).all()
    tenant_user = db.query(models.User).filter(models.User.id == tid).first()
    tenant_name = (tenant_user.full_name or tenant_user.email) if tenant_user else "Un tenant"
    for sa in super_admins:
        push_notification(db, sa.id, "🎫 Nuevo ticket de soporte", f"{tenant_name}: {title}")
    return _serialize_ticket(ticket, tenant_user)


@router.get("/support/tickets")
async def get_my_tickets(request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    tid = tenant_id_from(user)
    tickets = db.query(models.SupportTicket).filter(
        models.SupportTicket.tenant_id == tid
    ).order_by(models.SupportTicket.created_at.desc()).all()
    tenant = db.query(models.User).filter(models.User.id == tid).first()
    return [_serialize_ticket(t, tenant) for t in tickets]


@router.post("/support/tickets/{ticket_id}/reply")
async def reply_my_ticket(ticket_id: str, payload: dict, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    tid = tenant_id_from(user)
    ticket = _find_ticket(db, ticket_id)
    if not ticket or ticket.tenant_id != tid:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")
    msgs = list(ticket.messages or [])
    msgs.append({"sender": "usuario", "text": text, "time": datetime.now(timezone.utc).strftime("%H:%M")})
    ticket.messages = msgs
    if ticket.status == "Resuelto":
        ticket.status = "Abierto"
    db.commit()
    tenant = db.query(models.User).filter(models.User.id == tid).first()
    tenant_name = (tenant.full_name or tenant.email) if tenant else "Un tenant"
    super_admins = db.query(models.User).filter(models.User.is_global_staff == True).all()
    for sa in super_admins:
        push_notification(db, sa.id, "💬 Respuesta en ticket de soporte", f"{tenant_name}: {text[:80]}")
    return _serialize_ticket(ticket, tenant)
