import datetime
import os

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

import models, schemas
from database import get_db
from deps import current_user, tenant_id_from

router = APIRouter(prefix="/catalog", tags=["catalog"])


def _site_url() -> str:
    return os.getenv("SITE_URL", "https://bayup.com.co").rstrip("/")


def _to_schema(catalog: models.Catalog | None, shop_slug: str | None) -> schemas.Catalog | None:
    if not catalog:
        return None
    data = schemas.Catalog.model_validate(catalog).model_dump(mode="json")
    data["public_url"] = f"{_site_url()}/catalogo/{shop_slug}" if (shop_slug and catalog.status == "published") else None
    return data


@router.get("")
async def get_catalog(
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    tenant_id = tenant_id_from(user)
    catalog = db.query(models.Catalog).filter(models.Catalog.tenant_id == tenant_id).first()
    tenant = db.query(models.User).filter(models.User.id == tenant_id).first()
    return _to_schema(catalog, tenant.shop_slug if tenant else None)


@router.put("")
async def upsert_catalog(
    payload: schemas.CatalogUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    tenant_id = tenant_id_from(user)
    catalog = db.query(models.Catalog).filter(models.Catalog.tenant_id == tenant_id).first()
    if not catalog:
        catalog = models.Catalog(tenant_id=tenant_id, status="draft")
        db.add(catalog)
    if payload.banner_url is not None:
        catalog.banner_url = payload.banner_url
    catalog.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(catalog)
    tenant = db.query(models.User).filter(models.User.id == tenant_id).first()
    return _to_schema(catalog, tenant.shop_slug if tenant else None)


@router.post("/publish")
async def publish_catalog(
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    tenant_id = tenant_id_from(user)
    catalog = db.query(models.Catalog).filter(models.Catalog.tenant_id == tenant_id).first()
    if not catalog or not catalog.banner_url:
        raise HTTPException(status_code=400, detail="Sube un banner antes de publicar el catálogo")
    tenant = db.query(models.User).filter(models.User.id == tenant_id).first()
    if not tenant or not tenant.shop_slug:
        raise HTTPException(status_code=400, detail="Configura el link de tu tienda en Config Tienda antes de publicar el catálogo")
    catalog.status = "published"
    catalog.published_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(catalog)
    return _to_schema(catalog, tenant.shop_slug)


@router.post("/unpublish")
async def unpublish_catalog(
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    tenant_id = tenant_id_from(user)
    catalog = db.query(models.Catalog).filter(models.Catalog.tenant_id == tenant_id).first()
    if not catalog:
        raise HTTPException(status_code=404, detail="No tienes un catálogo creado")
    catalog.status = "draft"
    db.commit()
    db.refresh(catalog)
    tenant = db.query(models.User).filter(models.User.id == tenant_id).first()
    return _to_schema(catalog, tenant.shop_slug if tenant else None)
