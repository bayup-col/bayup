import uuid as _uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

import cache as _cache
import models
from database import get_db
from deps import current_user, require_super_admin

router = APIRouter(prefix="/super-admin", tags=["super_admin"])

_MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
_SECTOR_COLORS = ["#00f2ff", "#7c3aed", "#10b981", "#f59e0b", "#6b7280", "#ec4899", "#3b82f6"]


def _last_n_months(n: int = 12):
    now = datetime.now(timezone.utc)
    year, month = now.year, now.month
    out = []
    for _ in range(n):
        out.append((year, month))
        month -= 1
        if month == 0:
            month, year = 12, year - 1
    return list(reversed(out))


def _get_uuid(value: str, label: str):
    try:
        return _uuid.UUID(value)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"{label} inválido")


def _get_company(db: Session, company_id: str):
    uid = _get_uuid(company_id, "company_id")
    c = db.query(models.User).filter(
        models.User.id == uid,
        models.User.role == "admin_tienda",
        models.User.owner_id.is_(None),
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return c


def _pop_shop_cache(slug: str | None):
    if slug:
        _cache.shop_cache.pop(slug, None)


def _clear_templates_cache():
    _cache.templates_cache.clear()


def _cache_get(key: str):
    return _cache.cache_get(_cache.templates_cache, key)


def _cache_set(key: str, value, ttl: int):
    _cache.cache_set(_cache.templates_cache, key, value, ttl)


def _serialize_template(t, include_html: bool = False) -> dict:
    d = {
        "id": str(t.id),
        "name": t.name,
        "category": t.category or "General",
        "description": t.description or "",
        "tags": t.tags or [],
        "uses": t.uses or 0,
        "rating": t.rating or 0.0,
        "isPremium": bool(t.is_premium),
        "isActive": bool(t.is_active),
        "color": t.color or "#0f1a1a",
        "preview_url": t.preview_url,
        "schema_data": t.schema_data,
        "template_type": getattr(t, "template_type", "schema") or "schema",
        "html_pages": list((getattr(t, "html_pages", None) or {}).keys()) if not include_html else (getattr(t, "html_pages", None) or {}),
    }
    return d


def _serialize_plan(p) -> dict:
    return {
        "id": str(p.id),
        "name": p.name,
        "description": p.description,
        "commission_rate": p.commission_rate,
        "monthly_fee": p.monthly_fee,
        "modules": p.modules or [],
        "is_default": bool(p.is_default),
    }


# ── Stats ─────────────────────────────────────────────────────────────────

@router.get("/stats")
async def get_stats(request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    companies_q = db.query(models.User).filter(
        models.User.role == "admin_tienda",
        models.User.owner_id.is_(None),
    )
    total_companies = companies_q.count()
    active_companies = companies_q.filter(models.User.status.in_(["Activo", "active"])).count()
    total_users = db.query(models.User).count()
    total_orders = db.query(models.Order).count()
    total_revenue = db.query(func.coalesce(func.sum(models.Order.total_price), 0.0)).scalar() or 0.0
    total_commission = db.query(func.coalesce(func.sum(models.Order.commission_amount), 0.0)).scalar() or 0.0

    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)

    commission_today = db.query(func.coalesce(func.sum(models.Order.commission_amount), 0.0)).filter(models.Order.created_at >= today_start).scalar() or 0.0
    commission_month = db.query(func.coalesce(func.sum(models.Order.commission_amount), 0.0)).filter(models.Order.created_at >= month_start).scalar() or 0.0
    revenue_today = db.query(func.coalesce(func.sum(models.Order.total_price), 0.0)).filter(models.Order.created_at >= today_start).scalar() or 0.0
    revenue_month = db.query(func.coalesce(func.sum(models.Order.total_price), 0.0)).filter(models.Order.created_at >= month_start).scalar() or 0.0

    return {
        "total_companies": total_companies, "active_companies": active_companies,
        "total_users": total_users, "total_orders": total_orders,
        "total_revenue": total_revenue, "total_commission": total_commission,
        "commission_today": commission_today, "commission_month": commission_month,
        "revenue_today": revenue_today, "revenue_month": revenue_month,
    }


# ── Companies ─────────────────────────────────────────────────────────────

@router.get("/companies")
async def get_companies(request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    order_stats = (
        db.query(
            models.Order.tenant_id,
            func.coalesce(func.sum(models.Order.total_price), 0.0).label("total_sales"),
            func.coalesce(func.sum(models.Order.commission_amount), 0.0).label("total_commission"),
            func.count(models.Order.id).label("total_orders"),
        ).group_by(models.Order.tenant_id).subquery()
    )
    product_stats = (
        db.query(
            models.Product.owner_id,
            func.count(models.Product.id).label("total_products"),
        ).group_by(models.Product.owner_id).subquery()
    )
    rows = (
        db.query(
            models.User,
            func.coalesce(order_stats.c.total_sales, 0.0).label("total_sales"),
            func.coalesce(order_stats.c.total_commission, 0.0).label("total_commission"),
            func.coalesce(order_stats.c.total_orders, 0).label("total_orders"),
            func.coalesce(product_stats.c.total_products, 0).label("total_products"),
        )
        .outerjoin(order_stats, models.User.id == order_stats.c.tenant_id)
        .outerjoin(product_stats, models.User.id == product_stats.c.owner_id)
        .filter(
            models.User.role == "admin_tienda",
            models.User.owner_id.is_(None),
            models.User.status != "Pendiente",
        ).all()
    )
    return [{
        "id": str(c.id), "full_name": c.full_name, "email": c.email,
        "status": c.status, "created_at": c.created_at.isoformat() if c.created_at else None,
        "phone": c.phone, "city": c.customer_city, "shop_slug": c.shop_slug,
        "plan": {"name": c.plan.name, "price": c.plan.monthly_fee} if c.plan else None,
        "stats": {
            "total_sales": float(total_sales), "total_products": int(total_products),
            "total_orders": int(total_orders), "total_commission": float(total_commission),
        },
    } for c, total_sales, total_commission, total_orders, total_products in rows]


@router.post("/impersonate/{company_id}")
async def impersonate_company(company_id: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    """Genera un token de acceso para una empresa específica (solo super admin)."""
    require_super_admin(user)
    import security as sec_mod
    try:
        target_uuid = _uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="company_id inválido")
    company = db.query(models.User).filter(
        models.User.id == target_uuid,
        models.User.role == "admin_tienda",
        models.User.owner_id.is_(None),
    ).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    access_token = sec_mod.create_access_token(data={"sub": company.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": company.email,
            "full_name": getattr(company, "full_name", ""),
            "role": getattr(company, "role", "admin_tienda"),
            "is_global_staff": False,
            "permissions": getattr(company, "permissions", {}) or {},
            "plan": {
                "id": str(company.plan.id) if getattr(company, "plan", None) else None,
                "name": company.plan.name if getattr(company, "plan", None) else "Básico",
            } if getattr(company, "plan", None) else None,
            "shop_slug": getattr(company, "shop_slug", ""),
            "logo_url": getattr(company, "logo_url", ""),
            "onboarding_completed": bool(getattr(company, "onboarding_completed", False)),
            "status": getattr(company, "status", "Activo"),
            "nit": getattr(company, "nit", "") or "",
            "address": getattr(company, "address", "") or "",
        },
    }


@router.put("/companies/{company_id}/suspend")
async def toggle_suspend_company(company_id: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    company = _get_company(db, company_id)
    company.status = "Activo" if company.status == "Suspendido" else "Suspendido"
    db.commit()
    _pop_shop_cache(company.shop_slug)
    return {"id": str(company.id), "status": company.status}


@router.delete("/companies/{company_id}/pages")
async def delete_company_pages(company_id: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    company = _get_company(db, company_id)
    uid = company.id
    deleted = db.query(models.ShopPage).filter(models.ShopPage.tenant_id == uid).delete(synchronize_session=False)
    company.onboarding_completed = False
    db.commit()
    _pop_shop_cache(company.shop_slug)
    return {"deleted_pages": deleted, "message": "Página web eliminada y onboarding reiniciado"}


@router.delete("/companies/{company_id}")
async def delete_company_permanently(company_id: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    company = _get_company(db, company_id)
    target_uuid = company.id
    try:
        sub_users = db.query(models.User.id, models.User.email).filter(models.User.owner_id == target_uuid).all()
        sub_user_ids = [u.id for u in sub_users]
        all_user_ids = [target_uuid] + sub_user_ids
        root_email = db.query(models.User.email).filter(models.User.id == target_uuid).scalar()
        emails_to_purge = [e for e in ([root_email] + [u.email for u in sub_users]) if e]

        order_ids = [o.id for o in db.query(models.Order.id).filter(models.Order.tenant_id == target_uuid).all()]
        product_ids = [p.id for p in db.query(models.Product.id).filter(models.Product.owner_id == target_uuid).all()]
        assistant_ids = [a.id for a in db.query(models.AIAssistant.id).filter(models.AIAssistant.owner_id == target_uuid).all()]
        seller_ids = [s.id for s in db.query(models.Seller.id).filter(models.Seller.tenant_id == target_uuid).all()]

        if order_ids:
            db.query(models.OrderItem).filter(models.OrderItem.order_id.in_(order_ids)).delete(synchronize_session=False)
        if product_ids:
            db.query(models.ProductVariant).filter(models.ProductVariant.product_id.in_(product_ids)).delete(synchronize_session=False)
        if assistant_ids:
            db.query(models.AIAssistantLog).filter(models.AIAssistantLog.assistant_id.in_(assistant_ids)).delete(synchronize_session=False)

        db.query(models.User).filter(models.User.referred_by_id.in_(all_user_ids)).update(
            {models.User.referred_by_id: None}, synchronize_session=False
        )
        db.query(models.PayrollEmployee).filter(models.PayrollEmployee.tenant_id == target_uuid).delete(synchronize_session=False)
        db.query(models.Order).filter(models.Order.tenant_id == target_uuid).delete(synchronize_session=False)
        db.query(models.Product).filter(models.Product.owner_id == target_uuid).delete(synchronize_session=False)
        db.query(models.AIAssistant).filter(models.AIAssistant.owner_id == target_uuid).delete(synchronize_session=False)
        db.query(models.Shipment).filter(models.Shipment.tenant_id == target_uuid).delete(synchronize_session=False)
        db.query(models.PurchaseOrder).filter(models.PurchaseOrder.tenant_id == target_uuid).delete(synchronize_session=False)
        db.query(models.Provider).filter(models.Provider.tenant_id == target_uuid).delete(synchronize_session=False)
        db.query(models.Expense).filter(models.Expense.tenant_id == target_uuid).delete(synchronize_session=False)
        db.query(models.Receivable).filter(models.Receivable.tenant_id == target_uuid).delete(synchronize_session=False)
        db.query(models.Income).filter(models.Income.tenant_id == target_uuid).delete(synchronize_session=False)
        if seller_ids:
            db.query(models.Seller).filter(models.Seller.id.in_(seller_ids)).delete(synchronize_session=False)
        db.query(models.Page).filter(models.Page.owner_id == target_uuid).delete(synchronize_session=False)
        db.query(models.TaxRate).filter(models.TaxRate.owner_id == target_uuid).delete(synchronize_session=False)
        db.query(models.ShippingOption).filter(models.ShippingOption.owner_id == target_uuid).delete(synchronize_session=False)
        db.query(models.Collection).filter(models.Collection.owner_id == target_uuid).delete(synchronize_session=False)
        db.query(models.CustomRole).filter(models.CustomRole.owner_id == target_uuid).delete(synchronize_session=False)
        db.query(models.ActivityLog).filter(models.ActivityLog.tenant_id == target_uuid).delete(synchronize_session=False)
        db.query(models.Notification).filter(models.Notification.tenant_id == target_uuid).delete(synchronize_session=False)
        db.query(models.ShopPage).filter(models.ShopPage.tenant_id == target_uuid).delete(synchronize_session=False)
        db.query(models.SupportTicket).filter(models.SupportTicket.tenant_id == target_uuid).delete(synchronize_session=False)
        db.query(models.StoreMessage).filter(models.StoreMessage.tenant_id == target_uuid).delete(synchronize_session=False)
        db.query(models.ChannelConnection).filter(models.ChannelConnection.user_id.in_(all_user_ids)).delete(synchronize_session=False)
        db.query(models.User).filter(models.User.owner_id == target_uuid).delete(synchronize_session=False)
        db.query(models.User).filter(models.User.id == target_uuid).delete(synchronize_session=False)
        db.commit()

        if emails_to_purge:
            from sqlalchemy import text as _text
            try:
                for _email in emails_to_purge:
                    db.execute(_text("DELETE FROM auth.users WHERE email = :email"), {"email": _email})
                db.commit()
            except Exception:
                pass
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="No se pudo eliminar la empresa por completo")
    return {"ok": True}


# ── Registrations ─────────────────────────────────────────────────────────

@router.get("/registrations")
async def get_registrations(request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    rows = db.query(models.User).filter(
        models.User.role == "admin_tienda",
        models.User.owner_id.is_(None),
        models.User.status == "Pendiente",
    ).order_by(models.User.created_at.desc()).all()
    return [{
        "id": str(r.id), "full_name": r.full_name, "email": r.email,
        "phone": r.phone, "category": r.category,
        "email_confirmed": bool(getattr(r, "email_confirmed", False)),
        "reviewer_notes": r.reviewer_notes,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    } for r in rows]


class RegistrationNotesRequest(BaseModel):
    reviewer_notes: str | None = None


@router.put("/registrations/{user_id}/notes")
async def update_registration_notes(user_id: str, payload: RegistrationNotesRequest, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    uid = _get_uuid(user_id, "user_id")
    target = db.query(models.User).filter(models.User.id == uid).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    target.reviewer_notes = payload.reviewer_notes
    db.commit()
    return {"ok": True}


@router.put("/registrations/{user_id}/approve")
async def approve_registration(user_id: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    uid = _get_uuid(user_id, "user_id")
    target = db.query(models.User).filter(models.User.id == uid).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    target.status = "Activo"
    db.commit()
    return {"id": str(target.id), "status": target.status}


# ── Treasury ──────────────────────────────────────────────────────────────

@router.get("/treasury")
async def get_treasury(request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    cutoff = datetime.now(timezone.utc) - timedelta(days=365)
    orders = db.query(models.Order).filter(models.Order.created_at >= cutoff).order_by(models.Order.created_at.desc()).all()
    tenants = {t.id: t for t in db.query(models.User).filter(models.User.role == "admin_tienda", models.User.owner_id.is_(None)).all()}

    months = _last_n_months(12)
    buckets = {ym: {"rev": 0.0, "com": 0.0, "orders": 0} for ym in months}
    for o in orders:
        if not o.created_at:
            continue
        ym = (o.created_at.year, o.created_at.month)
        if ym in buckets:
            buckets[ym]["rev"] += o.total_price or 0.0
            buckets[ym]["com"] += o.commission_amount or 0.0
            buckets[ym]["orders"] += 1
    monthly = [
        {"month": _MONTH_LABELS[m - 1], "rev": buckets[(y, m)]["rev"], "com": buckets[(y, m)]["com"], "orders": buckets[(y, m)]["orders"]}
        for (y, m) in months
    ]

    per_tenant: dict = {}
    for o in orders:
        if not o.tenant_id:
            continue
        entry = per_tenant.setdefault(o.tenant_id, {"rev": 0.0, "orders": 0})
        entry["rev"] += o.total_price or 0.0
        entry["orders"] += 1
    total_rev_all = sum(e["rev"] for e in per_tenant.values()) or 1.0
    companies_ranking = []
    for tid, e in per_tenant.items():
        t = tenants.get(tid)
        companies_ranking.append({
            "name": t.full_name if t else "Tienda eliminada",
            "rev": e["rev"], "orders": e["orders"],
            "plan": t.plan.name if (t and t.plan) else "Básico",
            "pct": round((e["rev"] / total_rev_all) * 100),
        })
    companies_ranking.sort(key=lambda c: c["rev"], reverse=True)

    transactions = []
    for o in orders[:10]:
        t = tenants.get(o.tenant_id)
        transactions.append({
            "id": f"TXN-{str(o.id)[:8].upper()}",
            "company": t.full_name if t else "Tienda eliminada",
            "amount": o.total_price or 0.0,
            "date": o.created_at.isoformat() if o.created_at else None,
        })

    return {"monthly": monthly, "companies": companies_ranking[:10], "transactions": transactions}


# ── Reports ───────────────────────────────────────────────────────────────

@router.get("/reports")
async def get_reports(request: Request, period: str = "mes", db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    now = datetime.now(timezone.utc)
    span_days = {"dia": 1, "semana": 7, "mes": 30, "año": 365}.get(period, 30)
    start = now - timedelta(days=span_days)
    prev_start = now - timedelta(days=span_days * 2)

    orders = db.query(models.Order).filter(models.Order.created_at >= start).all()
    prev_orders = db.query(models.Order).filter(models.Order.created_at >= prev_start, models.Order.created_at < start).all()
    tenants = {t.id: t for t in db.query(models.User).filter(models.User.role == "admin_tienda", models.User.owner_id.is_(None)).all()}

    rev = sum(o.total_price or 0.0 for o in orders)
    com = sum(o.commission_amount or 0.0 for o in orders)
    prev_rev = sum(o.total_price or 0.0 for o in prev_orders)
    delta = round(((rev - prev_rev) / prev_rev) * 100) if prev_rev else 0

    new_companies = db.query(models.User).filter(
        models.User.role == "admin_tienda", models.User.owner_id.is_(None), models.User.created_at >= start,
    ).count()
    new_users = len({o.customer_email for o in orders if o.customer_email})

    per_tenant: dict = {}
    for o in orders:
        if not o.tenant_id:
            continue
        per_tenant[o.tenant_id] = per_tenant.get(o.tenant_id, 0.0) + (o.total_price or 0.0)
    total_rev = sum(per_tenant.values()) or 1.0
    top = []
    for tid, tenant_rev in per_tenant.items():
        t = tenants.get(tid)
        top.append({"name": t.full_name if t else "Tienda eliminada", "rev": tenant_rev, "pct": round((tenant_rev / total_rev) * 100), "plan": t.plan.name if (t and t.plan) else "Básico"})
    top.sort(key=lambda c: c["rev"], reverse=True)
    top = top[:6]

    per_sector: dict = {}
    for o in orders:
        t = tenants.get(o.tenant_id)
        sector = t.category if t and t.category else "Otros"
        per_sector[sector] = per_sector.get(sector, 0.0) + (o.total_price or 0.0)
    sectors = [
        {"label": label, "pct": round((sector_rev / total_rev) * 100), "color": _SECTOR_COLORS[i % len(_SECTOR_COLORS)]}
        for i, (label, sector_rev) in enumerate(sorted(per_sector.items(), key=lambda x: x[1], reverse=True))
    ]

    hour_counts = [0] * 24
    for o in orders:
        if o.created_at:
            hour_counts[o.created_at.hour] += 1
    max_hour = max(hour_counts) or 1
    activity = [{"h": h, "v": round(c / max_hour, 3)} for h, c in enumerate(hour_counts)]

    return {"kpis": {"rev": rev, "com": com, "orders": len(orders), "users": new_users, "companies": new_companies, "delta": delta}, "top": top, "sectors": sectors, "activity": activity}


# ── Users ─────────────────────────────────────────────────────────────────

@router.get("/users")
async def get_users(
    request: Request,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    require_super_admin(user)
    tenants_all = db.query(models.User).filter(models.User.role == "admin_tienda", models.User.owner_id.is_(None)).all()
    tenants_by_id = {u.id: u for u in tenants_all}
    all_users = db.query(models.User).filter(models.User.role != "cliente").offset(skip).limit(limit).all()

    result = []
    for u in all_users:
        is_staff = bool(u.is_global_staff) or u.role == "super_admin"
        if is_staff:
            role_label, company = "SUPER_ADMIN", "Bayup"
        elif u.role == "admin_tienda" and u.owner_id is None:
            role_label, company = "admin_tienda", u.full_name
        elif u.role == "cliente":
            role_label = "cliente"
            owner = tenants_by_id.get(u.owner_id)
            company = owner.full_name if owner else None
        else:
            continue
        result.append({"id": str(u.id), "full_name": u.full_name, "email": u.email, "role": role_label, "status": u.status or "Activo", "created_at": u.created_at.isoformat() if u.created_at else None, "company": company})

    sellers = db.query(models.Seller).all()
    for s in sellers:
        owner = tenants_by_id.get(s.tenant_id)
        result.append({"id": str(s.id), "full_name": s.name, "email": None, "role": "vendedor", "status": "Activo", "created_at": None, "company": owner.full_name if owner else None})
    return result


# ── Web Templates ─────────────────────────────────────────────────────────

@router.get("/web-templates")
async def get_web_templates_admin(request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    templates = db.query(models.WebTemplate).order_by(models.WebTemplate.created_at.desc()).all()
    return [_serialize_template(t) for t in templates]


@router.post("/web-templates")
async def create_web_template(payload: dict, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="El nombre es obligatorio")
    tags = payload.get("tags")
    if isinstance(tags, str):
        tags = [s.strip() for s in tags.split(",") if s.strip()]
    template_type = payload.get("template_type") or "schema"
    if template_type not in ("schema", "html"):
        raise HTTPException(status_code=400, detail="template_type debe ser 'schema' o 'html'")
    html_pages = payload.get("html_pages") or None
    if template_type == "html" and not html_pages:
        raise HTTPException(status_code=400, detail="Se requiere al menos la página 'home' para plantillas HTML")
    template = models.WebTemplate(
        name=name, category=payload.get("category") or "General",
        description=payload.get("description") or "", tags=tags or [],
        is_active=False, is_premium=False, color=payload.get("color") or "#0f1a1a",
        template_type=template_type, html_pages=html_pages,
    )
    db.add(template)
    db.commit()
    _clear_templates_cache()
    return _serialize_template(template)


@router.get("/web-templates/{template_id}")
async def get_web_template(template_id: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    uid = _get_uuid(template_id, "template_id")
    template = db.query(models.WebTemplate).filter(models.WebTemplate.id == uid).first()
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return _serialize_template(template, include_html=True)


@router.post("/web-templates/{template_id}/preview-token")
async def generate_preview_token(template_id: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    uid = _get_uuid(template_id, "template_id")
    template = db.query(models.WebTemplate).filter(models.WebTemplate.id == uid).first()
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    preview_tok = _cache.create_preview_token(user.email)
    return {"preview_token": preview_tok, "expires_in": 300}


@router.get("/web-templates/{template_id}/live-preview/{page_key}", response_class=HTMLResponse)
async def live_preview_template(
    template_id: str,
    page_key: str,
    request: Request,
    preview_token: str = Query(None),
    db: Session = Depends(get_db),
):
    if preview_token:
        email = _cache.validate_preview_token(preview_token)
        if not email:
            raise HTTPException(status_code=401, detail="Preview token inválido o expirado")
        user = db.query(models.User).filter(models.User.email == email).first()
        require_super_admin(user)
    else:
        from deps import current_user as _cu
        user = await _cu(request=request, db=db)
        require_super_admin(user)

    uid = _get_uuid(template_id, "template_id")
    template = db.query(models.WebTemplate).filter(models.WebTemplate.id == uid).first()
    if not template or getattr(template, "template_type", "schema") != "html":
        raise HTTPException(status_code=404, detail="Plantilla HTML no encontrada")
    html_pages = getattr(template, "html_pages", None) or {}
    html = html_pages.get(page_key) or html_pages.get("home")
    if not html:
        raise HTTPException(status_code=404, detail=f"Página '{page_key}' no encontrada")
    base_url = str(request.base_url).rstrip("/")
    tok = preview_token or ""
    preview_sdk = _cache.BAYUP_PREVIEW_SDK \
        .replace("__TPLID__", template_id) \
        .replace("__TOK__", tok) \
        .replace("__BASE__", base_url)
    if "</head>" in html:
        html = html.replace("</head>", preview_sdk + "</head>", 1)
    else:
        html = preview_sdk + html
    return HTMLResponse(content=html)


@router.put("/web-templates/{template_id}/toggle")
async def toggle_web_template(template_id: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    uid = _get_uuid(template_id, "template_id")
    template = db.query(models.WebTemplate).filter(models.WebTemplate.id == uid).first()
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    template.is_active = not template.is_active
    db.commit()
    _clear_templates_cache()
    return _serialize_template(template)


@router.delete("/web-templates/{template_id}")
async def delete_web_template(template_id: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    uid = _get_uuid(template_id, "template_id")
    template = db.query(models.WebTemplate).filter(models.WebTemplate.id == uid).first()
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    db.delete(template)
    db.commit()
    _clear_templates_cache()
    return {"ok": True}


@router.get("/web-templates/{template_id}/preview/{page_key}", response_class=HTMLResponse)
async def preview_template_html(template_id: str, page_key: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    uid = _get_uuid(template_id, "template_id")
    template = db.query(models.WebTemplate).filter(models.WebTemplate.id == uid).first()
    if not template or getattr(template, "template_type", "schema") != "html":
        raise HTTPException(status_code=404, detail="Plantilla HTML no encontrada")
    html_pages = getattr(template, "html_pages", None) or {}
    html = html_pages.get(page_key) or html_pages.get("home")
    if not html:
        raise HTTPException(status_code=404, detail=f"Página '{page_key}' no encontrada")
    return HTMLResponse(content=html)


# ── Plans ─────────────────────────────────────────────────────────────────

@router.get("/plans")
async def get_plans(request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    plans = db.query(models.Plan).order_by(models.Plan.monthly_fee.asc()).all()
    return [_serialize_plan(p) for p in plans]


class PlanUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    commission_rate: float | None = Field(default=None, ge=0, le=1)
    monthly_fee: float | None = Field(default=None, ge=0)
    modules: list[str] | None = None
    is_default: bool | None = None


@router.put("/plans/{plan_id}")
async def update_plan(plan_id: str, payload: PlanUpdateRequest, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    require_super_admin(user)
    uid = _get_uuid(plan_id, "plan_id")
    plan = db.query(models.Plan).filter(models.Plan.id == uid).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    update_data = payload.model_dump(exclude_unset=True)
    if update_data.get("is_default"):
        db.query(models.Plan).filter(models.Plan.id != uid).update({models.Plan.is_default: False})
    for key, value in update_data.items():
        setattr(plan, key, value)
    db.commit()
    return _serialize_plan(plan)
