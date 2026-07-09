from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from deps import current_user, tenant_id_from
import crud, schemas, models

router = APIRouter(prefix="/collections", tags=["collections"])


class CollectionPayload(BaseModel):
    title: str
    description: str | None = None
    image_url: str | None = None
    status: str = "active"


@router.get("")
async def get_collections(
    request: Request,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=200, ge=1),
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    rows = crud.get_collections_by_owner(
        db, owner_id=tenant_id_from(user), skip=skip, limit=min(limit, 500)
    )
    return [schemas.Collection.model_validate(c).model_dump(mode="json") for c in rows]


@router.post("")
async def create_collection(
    payload: CollectionPayload,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    collection_in = schemas.CollectionCreate(**payload.model_dump())
    db_col = crud.create_collection(db, collection=collection_in, owner_id=tenant_id_from(user))
    return schemas.Collection.model_validate(db_col).model_dump(mode="json")


@router.put("/{collection_id}")
async def update_collection(
    collection_id: str,
    payload: CollectionPayload,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    col = db.query(models.Collection).filter(
        models.Collection.id == collection_id,
        models.Collection.owner_id == tenant_id_from(user),
    ).first()
    if not col:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    col.title = payload.title
    if payload.description is not None:
        col.description = payload.description
    if payload.image_url is not None:
        col.image_url = payload.image_url
    col.status = payload.status
    db.commit()
    db.refresh(col)
    return schemas.Collection.model_validate(col).model_dump(mode="json")
