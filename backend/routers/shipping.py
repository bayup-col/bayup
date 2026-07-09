import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import models
from database import get_db
from deps import current_user, tenant_id_from

router = APIRouter(prefix="/shipping", tags=["shipping"])


class ShippingOptionRequest(BaseModel):
    name: str = Field(min_length=1)
    cost: float = Field(ge=0)
    min_order_total: float | None = Field(default=0.0, ge=0)


def _ser(o) -> dict:
    return {
        "id": str(o.id),
        "name": o.name,
        "cost": float(o.cost),
        "min_order_total": float(o.min_order_total or 0),
        "owner_id": str(o.owner_id) if o.owner_id else None,
    }


def _get_option(db: Session, option_id: str, tenant_id):
    try:
        uid = _uuid.UUID(option_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="id inválido")
    opt = db.query(models.ShippingOption).filter(
        models.ShippingOption.id == uid,
        models.ShippingOption.owner_id == tenant_id,
    ).first()
    if not opt:
        raise HTTPException(status_code=404, detail="Opción de envío no encontrada")
    return opt


@router.get("")
async def get_options(request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    return [_ser(o) for o in db.query(models.ShippingOption).filter(
        models.ShippingOption.owner_id == tenant_id_from(user)
    ).all()]


@router.post("")
async def create_option(payload: ShippingOptionRequest, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    opt = models.ShippingOption(name=payload.name, cost=payload.cost, min_order_total=payload.min_order_total, owner_id=tenant_id_from(user))
    db.add(opt)
    db.commit()
    return _ser(opt)


@router.get("/{option_id}")
async def get_option(option_id: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    return _ser(_get_option(db, option_id, tenant_id_from(user)))


@router.put("/{option_id}")
async def update_option(option_id: str, payload: ShippingOptionRequest, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    opt = _get_option(db, option_id, tenant_id_from(user))
    opt.name = payload.name
    opt.cost = payload.cost
    opt.min_order_total = payload.min_order_total
    db.commit()
    return _ser(opt)


@router.delete("/{option_id}")
async def delete_option(option_id: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    opt = _get_option(db, option_id, tenant_id_from(user))
    db.delete(opt)
    db.commit()
    return {"ok": True}
