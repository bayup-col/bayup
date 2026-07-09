import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import models
from database import get_db
from deps import current_user, tenant_id_from

router = APIRouter(prefix="/taxes", tags=["taxes"])


class TaxRateRequest(BaseModel):
    name: str = Field(min_length=1)
    rate: float = Field(ge=0)
    is_default: bool = False


def _ser(t) -> dict:
    return {
        "id": str(t.id),
        "name": t.name,
        "rate": t.rate,
        "is_default": bool(t.is_default),
        "owner_id": str(t.owner_id) if t.owner_id else None,
    }


def _get_rate(db: Session, tax_id: str, tenant_id):
    try:
        uid = _uuid.UUID(tax_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="id inválido")
    rate = db.query(models.TaxRate).filter(
        models.TaxRate.id == uid,
        models.TaxRate.owner_id == tenant_id,
    ).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Tasa de impuesto no encontrada")
    return rate


@router.get("")
async def get_rates(request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    return [_ser(t) for t in db.query(models.TaxRate).filter(models.TaxRate.owner_id == tenant_id_from(user)).all()]


@router.post("")
async def create_rate(payload: TaxRateRequest, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    tid = tenant_id_from(user)
    if payload.is_default:
        db.query(models.TaxRate).filter(models.TaxRate.owner_id == tid).update({models.TaxRate.is_default: False})
    rate = models.TaxRate(name=payload.name, rate=payload.rate, is_default=payload.is_default, owner_id=tid)
    db.add(rate)
    db.commit()
    return _ser(rate)


@router.get("/{tax_id}")
async def get_rate(tax_id: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    return _ser(_get_rate(db, tax_id, tenant_id_from(user)))


@router.put("/{tax_id}")
async def update_rate(tax_id: str, payload: TaxRateRequest, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    tid = tenant_id_from(user)
    rate = _get_rate(db, tax_id, tid)
    if payload.is_default:
        db.query(models.TaxRate).filter(
            models.TaxRate.owner_id == tid,
            models.TaxRate.id != rate.id,
        ).update({models.TaxRate.is_default: False})
    rate.name = payload.name
    rate.rate = payload.rate
    rate.is_default = payload.is_default
    db.commit()
    return _ser(rate)


@router.delete("/{tax_id}")
async def delete_rate(tax_id: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    rate = _get_rate(db, tax_id, tenant_id_from(user))
    db.delete(rate)
    db.commit()
    return {"ok": True}
