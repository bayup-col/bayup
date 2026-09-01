"""
Blog/journal editorial de una tienda — hoy exclusivo del tenant Orzen
(`feature_gating.require_orzen_tenant`). CRUD de administración para el
comerciante + lectura pública para el storefront.
"""
import re
import uuid as _uuid
import unicodedata

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import crud, models
from database import get_db
from deps import current_user, tenant_id_from
from feature_gating import require_orzen_tenant
from rate_limit import limiter

router = APIRouter(tags=["blog"])


class PostPayload(BaseModel):
    title: str = Field(min_length=1)
    category: str | None = None
    excerpt: str | None = None
    body: list[str] = []
    image_url: str | None = None
    is_published: bool = True
    slug: str | None = None


def _slugify(title: str) -> str:
    normalized = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", normalized).strip("-").lower()
    return slug or "post"


def _post_payload(p: models.Post) -> dict:
    return {
        "id": str(p.id),
        "slug": p.slug,
        "title": p.title,
        "category": p.category,
        "excerpt": p.excerpt,
        "body": p.body or [],
        "image_url": p.image_url,
        "published_at": p.published_at.isoformat() if p.published_at else None,
        "is_published": p.is_published,
    }


# ── Admin (dashboard del tenant) ─────────────────────────────────────────

@router.get("/posts")
def list_posts_admin(db: Session = Depends(get_db), user=Depends(current_user)):
    tenant_id = tenant_id_from(user)
    tenant = db.query(models.User).filter(models.User.id == tenant_id).first()
    require_orzen_tenant(tenant)
    posts = db.query(models.Post).filter(models.Post.tenant_id == tenant_id).order_by(models.Post.published_at.desc()).all()
    return [_post_payload(p) for p in posts]


@router.post("/posts")
def create_post(payload: PostPayload, db: Session = Depends(get_db), user=Depends(current_user)):
    tenant_id = tenant_id_from(user)
    tenant = db.query(models.User).filter(models.User.id == tenant_id).first()
    require_orzen_tenant(tenant)
    slug = payload.slug or _slugify(payload.title)
    if db.query(models.Post).filter(models.Post.tenant_id == tenant_id, models.Post.slug == slug).first():
        slug = f"{slug}-{_uuid.uuid4().hex[:6]}"
    post = models.Post(
        tenant_id=tenant_id, slug=slug, title=payload.title, category=payload.category,
        excerpt=payload.excerpt, body=payload.body, image_url=payload.image_url,
        is_published=payload.is_published,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return _post_payload(post)


@router.put("/posts/{post_id}")
def update_post(post_id: str, payload: PostPayload, db: Session = Depends(get_db), user=Depends(current_user)):
    tenant_id = tenant_id_from(user)
    tenant = db.query(models.User).filter(models.User.id == tenant_id).first()
    require_orzen_tenant(tenant)
    post = db.query(models.Post).filter(models.Post.id == post_id, models.Post.tenant_id == tenant_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")
    post.title = payload.title
    post.category = payload.category
    post.excerpt = payload.excerpt
    post.body = payload.body
    post.image_url = payload.image_url
    post.is_published = payload.is_published
    db.commit()
    return _post_payload(post)


@router.delete("/posts/{post_id}")
def delete_post(post_id: str, db: Session = Depends(get_db), user=Depends(current_user)):
    tenant_id = tenant_id_from(user)
    tenant = db.query(models.User).filter(models.User.id == tenant_id).first()
    require_orzen_tenant(tenant)
    post = db.query(models.Post).filter(models.Post.id == post_id, models.Post.tenant_id == tenant_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")
    db.delete(post)
    db.commit()
    return {"ok": True}


# ── Público (storefront) ─────────────────────────────────────────────────

@router.get("/public/stores/{store_id}/posts")
@limiter.limit("60/minute")
async def list_posts_public(request: Request, store_id: str, db: Session = Depends(get_db)):
    try:
        store_uuid = _uuid.UUID(store_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="store_id inválido")
    posts = (
        db.query(models.Post)
        .filter(models.Post.tenant_id == store_uuid, models.Post.is_published == True)  # noqa: E712
        .order_by(models.Post.published_at.desc())
        .all()
    )
    return [_post_payload(p) for p in posts]


@router.get("/public/stores/{store_id}/posts/{slug}")
@limiter.limit("60/minute")
async def get_post_public(request: Request, store_id: str, slug: str, db: Session = Depends(get_db)):
    try:
        store_uuid = _uuid.UUID(store_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="store_id inválido")
    post = db.query(models.Post).filter(
        models.Post.tenant_id == store_uuid, models.Post.slug == slug, models.Post.is_published == True,  # noqa: E712
    ).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")
    related = (
        db.query(models.Post)
        .filter(models.Post.tenant_id == store_uuid, models.Post.id != post.id, models.Post.is_published == True)  # noqa: E712
        .order_by(models.Post.published_at.desc())
        .limit(3)
        .all()
    )
    return {**_post_payload(post), "related": [_post_payload(p) for p in related]}
