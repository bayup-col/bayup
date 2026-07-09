import uuid as _uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import models
from database import get_db
from deps import current_user, tenant_id_from

router = APIRouter(tags=["expenses"])


class ExpenseCreateRequest(BaseModel):
    description: str = Field(min_length=1)
    amount: float = Field(gt=0)
    due_date: str | None = None
    status: str = "pending"
    category: str = "diario"
    invoice_num: str | None = None
    items: list | None = None
    description_detail: str | None = None


def _ser(e) -> dict:
    return {
        "id": str(e.id),
        "description": e.description,
        "amount": e.amount,
        "due_date": e.due_date.isoformat() if e.due_date else None,
        "status": e.status,
        "category": e.category,
        "invoice_num": e.invoice_num,
        "items": e.items,
        "description_detail": e.description_detail,
    }


@router.get("/expenses")
@router.get("/finances/expenses")
async def get_expenses(request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    tid = tenant_id_from(user)
    return [_ser(e) for e in db.query(models.Expense).filter(models.Expense.tenant_id == tid).all()]


@router.post("/expenses")
async def create_expense(payload: ExpenseCreateRequest, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    due_date = datetime.fromisoformat(payload.due_date) if payload.due_date else None
    exp = models.Expense(
        id=_uuid.uuid4(),
        description=payload.description,
        amount=payload.amount,
        due_date=due_date,
        status=payload.status,
        category=payload.category,
        tenant_id=tenant_id_from(user),
        invoice_num=payload.invoice_num,
        items=payload.items,
        description_detail=payload.description_detail,
    )
    db.add(exp)
    db.commit()
    return _ser(exp)
