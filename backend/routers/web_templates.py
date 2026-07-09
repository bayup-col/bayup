import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

import cache as _cache
import models
from database import get_db
from deps import current_user

router = APIRouter(tags=["web_templates"])


def _serialize_template(t, include_html: bool = False) -> dict:
    return {
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


@router.get("/web-templates")
async def get_web_templates(request: Request, response: Response, db: Session = Depends(get_db), user=Depends(current_user)):
    cached = _cache.cache_get(_cache.templates_cache, "list")
    if cached is not None:
        response.headers["Cache-Control"] = "private, max-age=300"
        return cached
    templates = db.query(models.WebTemplate).filter(models.WebTemplate.is_active == True).order_by(models.WebTemplate.created_at.desc()).all()
    data = [_serialize_template(t) for t in templates]
    _cache.cache_set(_cache.templates_cache, "list", data, 300)
    response.headers["Cache-Control"] = "private, max-age=300"
    return data


@router.get("/web-templates/{template_id}/preview/{page_key}", response_class=HTMLResponse)
async def public_preview_template(template_id: str, page_key: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    try:
        uid = _uuid.UUID(template_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="template_id inválido")
    template = db.query(models.WebTemplate).filter(
        models.WebTemplate.id == uid,
        models.WebTemplate.is_active == True,
    ).first()
    if not template or getattr(template, "template_type", "schema") != "html":
        raise HTTPException(status_code=404, detail="Plantilla HTML no encontrada")
    html_pages = getattr(template, "html_pages", None) or {}
    html = html_pages.get(page_key) or html_pages.get("home")
    if not html:
        raise HTTPException(status_code=404, detail=f"Página '{page_key}' no encontrada")
    base_url = str(request.base_url).rstrip("/")
    preview_sdk = _cache.BAYUP_PREVIEW_SDK \
        .replace("__TPLID__", template_id) \
        .replace("__TOK__", "") \
        .replace("__BASE__", base_url) \
        .replace("/super-admin/web-templates/", "/web-templates/") \
        .replace("/live-preview/", "/preview/") \
        .replace("+'?token='+encodeURIComponent(TOK)", "") \
        .replace("if(extra)u+='&'+extra", "if(extra)u+=(u.indexOf('?')>=0?'&':'?')+extra")
    if "</head>" in html:
        html = html.replace("</head>", preview_sdk + "</head>", 1)
    else:
        html = preview_sdk + html
    return HTMLResponse(content=html)
