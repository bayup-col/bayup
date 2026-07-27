"""Analítica de storefront (tráfico / audiencia).

Dos endpoints públicos sin auth para que la tienda pública registre visitas
(nunca deben romper ni frenar la carga del storefront), y uno autenticado
para que el dashboard consulte los datos agregados.
"""
import datetime as _dt
import uuid as _uuid
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
from database import get_db
from deps import current_user, tenant_id_from
from rate_limit import limiter

router = APIRouter(tags=["analytics"])


# ── Categorización de fuente / dispositivo ──────────────────────────────────

_SOCIAL_DOMAINS = ("facebook.com", "instagram.com", "tiktok.com", "twitter.com", "x.com", "youtube.com", "pinterest.com", "linkedin.com", "fb.com")
_SEARCH_DOMAINS = ("google.", "bing.com", "yahoo.com", "duckduckgo.com")


def _classify_source(referrer: str | None) -> tuple[str, str | None]:
    if not referrer:
        return "direct", None
    try:
        domain = urlparse(referrer).netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]
    except Exception:
        return "direct", None
    if not domain:
        return "direct", None
    if "wa.me" in domain or "whatsapp" in domain:
        return "whatsapp", domain
    if any(d in domain for d in _SOCIAL_DOMAINS):
        return "social", domain
    if any(d in domain for d in _SEARCH_DOMAINS):
        return "search", domain
    return "referral", domain


def _classify_device(user_agent: str | None) -> str:
    if not user_agent:
        return "desktop"
    ua = user_agent.lower()
    if "tablet" in ua or "ipad" in ua:
        return "tablet"
    if "mobi" in ua or "android" in ua or "iphone" in ua:
        return "mobile"
    return "desktop"


# ── Schemas ──────────────────────────────────────────────────────────────

class PageviewPayload(BaseModel):
    slug: str
    visitor_id: str
    session_id: str
    path: str
    is_new_session: bool = False
    referrer: str | None = None


class SessionEndPayload(BaseModel):
    session_id: str
    duration_seconds: int


class SearchPayload(BaseModel):
    slug: str
    session_id: str | None = None
    term: str
    results_count: int = 0


# ── Endpoints públicos (sin auth, nunca deben fallar visiblemente) ────────

@router.post("/public/track/pageview")
@limiter.limit("60/minute")
async def track_pageview(payload: PageviewPayload, request: Request, db: Session = Depends(get_db)):
    try:
        visitor_uuid = _uuid.UUID(payload.visitor_id)
        session_uuid = _uuid.UUID(payload.session_id)
    except ValueError:
        return {"ok": False}

    tenant = db.query(models.User).filter(
        models.User.shop_slug == payload.slug, models.User.status == "Activo",
    ).first()
    if not tenant:
        return {"ok": False}

    try:
        if payload.is_new_session:
            is_new_visitor = db.query(models.AnalyticsVisitor).filter(
                models.AnalyticsVisitor.tenant_id == tenant.id,
                models.AnalyticsVisitor.visitor_id == visitor_uuid,
            ).first() is None
            if is_new_visitor:
                db.add(models.AnalyticsVisitor(tenant_id=tenant.id, visitor_id=visitor_uuid))

            source, domain = _classify_source(payload.referrer)
            device = _classify_device(request.headers.get("user-agent"))

            # Idempotente ante doble disparo (ej. StrictMode, doble navegación rápida)
            if not db.query(models.AnalyticsSession).filter(models.AnalyticsSession.id == session_uuid).first():
                db.add(models.AnalyticsSession(
                    id=session_uuid, tenant_id=tenant.id, visitor_id=visitor_uuid,
                    is_new_visitor=is_new_visitor, source=source, referrer_domain=domain,
                    device_type=device, entry_path=payload.path, pageview_count=0,
                ))
                db.flush()

        db.add(models.AnalyticsPageview(tenant_id=tenant.id, session_id=session_uuid, path=payload.path))
        db.query(models.AnalyticsSession).filter(models.AnalyticsSession.id == session_uuid).update(
            {
                models.AnalyticsSession.pageview_count: models.AnalyticsSession.pageview_count + 1,
                models.AnalyticsSession.updated_at: _dt.datetime.utcnow(),
            },
            synchronize_session=False,
        )
        db.commit()
    except Exception:
        db.rollback()
    return {"ok": True}


@router.post("/public/track/session-end")
@limiter.limit("60/minute")
async def track_session_end(payload: SessionEndPayload, request: Request, db: Session = Depends(get_db)):
    try:
        session_uuid = _uuid.UUID(payload.session_id)
    except ValueError:
        return {"ok": False}
    duration = max(0, min(payload.duration_seconds, 6 * 3600))  # tope defensivo: 6h
    try:
        db.query(models.AnalyticsSession).filter(models.AnalyticsSession.id == session_uuid).update(
            {
                models.AnalyticsSession.duration_seconds: duration,
                models.AnalyticsSession.updated_at: _dt.datetime.utcnow(),
            },
            synchronize_session=False,
        )
        db.commit()
    except Exception:
        db.rollback()
    return {"ok": True}


@router.post("/public/track/search")
@limiter.limit("30/minute")
async def track_search(payload: SearchPayload, request: Request, db: Session = Depends(get_db)):
    term = (payload.term or "").strip().lower()
    if not term or len(term) < 2:
        return {"ok": False}

    tenant = db.query(models.User).filter(
        models.User.shop_slug == payload.slug, models.User.status == "Activo",
    ).first()
    if not tenant:
        return {"ok": False}

    session_uuid = None
    if payload.session_id:
        try:
            session_uuid = _uuid.UUID(payload.session_id)
        except ValueError:
            session_uuid = None

    try:
        db.add(models.AnalyticsSearch(
            tenant_id=tenant.id, session_id=session_uuid,
            term=term[:120], results_count=max(0, payload.results_count),
        ))
        db.commit()
    except Exception:
        db.rollback()
    return {"ok": True}


# ── Endpoint autenticado (dashboard) ──────────────────────────────────────

_PERIOD_DAYS = {"7d": 7, "30d": 30, "90d": 90}


@router.get("/web-analytics/summary")
async def get_analytics_summary(
    request: Request,
    period: str = Query(default="30d"),
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    tenant_id = tenant_id_from(user)
    days = _PERIOD_DAYS.get(period, 30)
    since = _dt.datetime.utcnow() - _dt.timedelta(days=days)

    sessions = db.query(models.AnalyticsSession).filter(
        models.AnalyticsSession.tenant_id == tenant_id,
        models.AnalyticsSession.started_at >= since,
    ).all()

    total_sessions = len(sessions)
    unique_visitors = len({s.visitor_id for s in sessions if s.visitor_id})
    new_sessions = sum(1 for s in sessions if s.is_new_visitor)
    returning_sessions = total_sessions - new_sessions
    bounced = sum(1 for s in sessions if (s.pageview_count or 0) <= 1)
    bounce_rate = round((bounced / total_sessions) * 100, 1) if total_sessions else 0.0

    durations = [s.duration_seconds for s in sessions if s.duration_seconds is not None]
    avg_duration = round(sum(durations) / len(durations)) if durations else 0

    pageview_counts = [s.pageview_count or 0 for s in sessions]
    avg_pages_per_session = round(sum(pageview_counts) / total_sessions, 1) if total_sessions else 0.0

    sources: dict[str, int] = {}
    devices: dict[str, int] = {}
    by_day: dict[str, int] = {}
    for s in sessions:
        sources[s.source or "direct"] = sources.get(s.source or "direct", 0) + 1
        devices[s.device_type or "desktop"] = devices.get(s.device_type or "desktop", 0) + 1
        day_key = (s.started_at or _dt.datetime.utcnow()).strftime("%Y-%m-%d")
        by_day[day_key] = by_day.get(day_key, 0) + 1

    pageviews = db.query(models.AnalyticsPageview).filter(
        models.AnalyticsPageview.tenant_id == tenant_id,
        models.AnalyticsPageview.created_at >= since,
    ).all()
    page_counts: dict[str, int] = {}
    for pv in pageviews:
        page_counts[pv.path or "/"] = page_counts.get(pv.path or "/", 0) + 1
    top_pages = sorted(
        [{"path": p, "views": c} for p, c in page_counts.items()],
        key=lambda x: x["views"], reverse=True,
    )[:10]

    searches = db.query(models.AnalyticsSearch).filter(
        models.AnalyticsSearch.tenant_id == tenant_id,
        models.AnalyticsSearch.created_at >= since,
    ).all()
    search_counts: dict[str, int] = {}
    for sr in searches:
        if sr.term:
            search_counts[sr.term] = search_counts.get(sr.term, 0) + 1
    top_searches = sorted(
        [{"term": t, "count": c} for t, c in search_counts.items()],
        key=lambda x: x["count"], reverse=True,
    )[:10]

    def _pct(n: int) -> float:
        return round((n / total_sessions) * 100, 1) if total_sessions else 0.0

    return {
        "period": period,
        "total_sessions": total_sessions,
        "total_pageviews": len(pageviews),
        "unique_visitors": unique_visitors,
        "new_visitors": new_sessions,
        "returning_visitors": returning_sessions,
        "new_visitors_pct": _pct(new_sessions),
        "returning_visitors_pct": _pct(returning_sessions),
        "bounce_rate_pct": bounce_rate,
        "avg_duration_seconds": avg_duration,
        "avg_pages_per_session": avg_pages_per_session,
        "sources": [{"source": k, "count": v, "pct": _pct(v)} for k, v in sorted(sources.items(), key=lambda x: -x[1])],
        "devices": [{"device": k, "count": v, "pct": _pct(v)} for k, v in sorted(devices.items(), key=lambda x: -x[1])],
        "sessions_by_day": [{"date": k, "sessions": v} for k, v in sorted(by_day.items())],
        "top_pages": top_pages,
        "top_searches": top_searches,
    }
