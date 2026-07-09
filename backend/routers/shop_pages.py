import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
from database import get_db
from deps import current_user, tenant_id_from, require_super_admin, resolve_target

router = APIRouter(tags=["shop_pages"])


def _serialize(p) -> dict:
    return {
        "id": str(p.id),
        "page_key": p.page_key,
        "schema_data": p.schema_data,
        "template_id": p.template_id,
        "is_published": bool(p.is_published),
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }



class ShopPageSaveRequest(BaseModel):
    page_key: str
    schema_data: dict = {}
    template_id: str | None = None
    target_user_id: str | None = None


class ShopPagePublishRequest(BaseModel):
    page_key: str
    schema_data: dict = {}
    target_user_id: str | None = None


@router.get("/shop-pages/{page_key}")
async def get_shop_page(page_key: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    tid = tenant_id_from(user)
    page = db.query(models.ShopPage).filter(
        models.ShopPage.tenant_id == tid,
        models.ShopPage.page_key == page_key,
    ).first()
    if not page:
        return {"page_key": page_key, "schema_data": None, "template_id": None, "is_published": False}
    return _serialize(page)


@router.post("/shop-pages")
async def save_shop_page(payload: ShopPageSaveRequest, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    effective = resolve_target(db, user, payload.target_user_id)
    tid = tenant_id_from(effective)
    page = db.query(models.ShopPage).filter(
        models.ShopPage.tenant_id == tid,
        models.ShopPage.page_key == payload.page_key,
    ).first()
    is_new = page is None
    if page:
        page.schema_data = payload.schema_data
        if payload.template_id:
            page.template_id = payload.template_id
    else:
        page = models.ShopPage(
            tenant_id=tid,
            page_key=payload.page_key,
            schema_data=payload.schema_data,
            template_id=payload.template_id,
        )
        db.add(page)

    if is_new and payload.page_key == "home" and payload.template_id:
        try:
            template_uuid = _uuid.UUID(payload.template_id)
            template = db.query(models.WebTemplate).filter(models.WebTemplate.id == template_uuid).first()
            if template:
                template.uses = (template.uses or 0) + 1
        except ValueError:
            pass

    db.commit()
    db.refresh(page)
    return _serialize(page)


@router.post("/shop-pages/publish")
async def publish_shop_page(payload: ShopPagePublishRequest, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    effective = resolve_target(db, user, payload.target_user_id)
    tid = tenant_id_from(effective)
    page = db.query(models.ShopPage).filter(
        models.ShopPage.tenant_id == tid,
        models.ShopPage.page_key == payload.page_key,
    ).first()
    if page:
        page.schema_data = payload.schema_data
        page.is_published = True
    else:
        page = models.ShopPage(
            tenant_id=tid,
            page_key=payload.page_key,
            schema_data=payload.schema_data,
            is_published=True,
        )
        db.add(page)
    db.commit()
    db.refresh(page)
    return _serialize(page)


@router.get("/public/stores/{store_id}/pages/{page_key}")
async def get_public_shop_page(request: Request, response: Response, store_id: str, page_key: str, db: Session = Depends(get_db)):
    try:
        store_uuid = _uuid.UUID(store_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="store_id inválido")
    page = db.query(models.ShopPage).filter(
        models.ShopPage.tenant_id == store_uuid,
        models.ShopPage.page_key == page_key,
        models.ShopPage.is_published == True,
    ).first()
    if not page:
        raise HTTPException(status_code=404, detail="Página no publicada")
    response.headers["Cache-Control"] = "public, max-age=120, stale-while-revalidate=600"
    result = {"page_key": page.page_key, "schema_data": page.schema_data}
    if not page.schema_data and page.template_id:
        try:
            template_uuid = _uuid.UUID(page.template_id)
        except ValueError:
            template_uuid = None
        template = db.query(models.WebTemplate).filter(models.WebTemplate.id == template_uuid).first() if template_uuid else None
        if template and getattr(template, "template_type", None) == "html":
            html_pages = getattr(template, "html_pages", None) or {}
            if page.page_key in html_pages:
                result["html"] = html_pages[page.page_key]
    return result
