import io
import uuid as _uuid

import pandas as pd
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import crud, schemas
from database import get_db
from deps import current_user, tenant_id_from, require_super_admin

router = APIRouter(prefix="/products", tags=["products"])

ALLOWED_EXCEL_MIME = {
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
}


class ProductPayload(BaseModel):
    name: str = Field(min_length=1)
    description: str | None = None
    price: float = Field(gt=0)
    wholesale_price: float | None = Field(default=0.0, ge=0)
    cost: float | None = Field(default=0.0, ge=0)
    sku: str | None = None
    status: str = "active"
    category: str | None = None
    add_gateway_fee: bool | None = False
    image_url: object | None = None
    collection_id: str | None = None
    variants: list = []
    target_user_id: str | None = None
    tags: list | None = []
    warranty: str | None = None
    features: str | None = None
    important_info: str | None = None


def _resolve_target(db, caller, target_user_id):
    if not target_user_id:
        return caller
    require_super_admin(caller)
    import models
    try:
        tid = _uuid.UUID(target_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="target_user_id inválido")
    target = db.query(models.User).filter(models.User.id == tid).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario objetivo no encontrado")
    return target


@router.get("")
async def get_products(
    request: Request,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=200, ge=1),
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    rows = crud.get_products_by_owner(db, owner_id=tenant_id_from(user), skip=skip, limit=min(limit, 500))
    return [schemas.Product.model_validate(p).model_dump(mode="json") for p in rows]


@router.get("/{product_id}")
async def get_product(
    product_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    try:
        pid = _uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="product_id inválido")
    product = crud.get_product(db, product_id=pid, tenant_id=tenant_id_from(user))
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return schemas.Product.model_validate(product).model_dump(mode="json")


@router.post("")
async def create_product(
    payload: ProductPayload,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    data = payload.model_dump()
    target_user_id = data.pop("target_user_id", None)
    effective = _resolve_target(db, user, target_user_id)
    product_in = schemas.ProductCreate(**data)
    db_product = crud.create_product(db, product=product_in, owner_id=tenant_id_from(effective))
    return schemas.Product.model_validate(db_product).model_dump(mode="json")


@router.post("/bulk-upload")
async def bulk_upload(
    request: Request,
    file: UploadFile = File(...),
    target_user_id: str | None = Form(None),
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    if file.content_type not in ALLOWED_EXCEL_MIME:
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos .xlsx o .xls")
    raw = await file.read(5 * 1024 * 1024 + 1)
    if len(raw) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="El archivo supera el límite de 5 MB")

    effective = _resolve_target(db, user, target_user_id)
    tid = tenant_id_from(effective)

    def _norm(col: str) -> str:
        col = str(col).strip().lower()
        for a, b in [("á","a"),("é","e"),("í","i"),("ó","o"),("ú","u")]:
            col = col.replace(a, b)
        return col

    try:
        df = pd.read_excel(io.BytesIO(raw))
    except Exception:
        raise HTTPException(status_code=400, detail="No se pudo leer el archivo.")
    df.columns = [_norm(c) for c in df.columns]

    col = {
        "name":  next((c for c in df.columns if c in ("nombre","name","producto")), None),
        "price": next((c for c in df.columns if c in ("precio","price")), None),
        "desc":  next((c for c in df.columns if c in ("descripcion","description")), None),
        "cat":   next((c for c in df.columns if c in ("categoria","category")), None),
        "sku":   next((c for c in df.columns if c in ("sku","codigo","código")), None),
    }
    if not col["name"] or not col["price"]:
        raise HTTPException(status_code=400, detail="El Excel debe tener columnas 'nombre' y 'precio'.")

    created, errors = 0, []
    for idx, row in df.iterrows():
        row_num = int(idx) + 2
        try:
            name = str(row[col["name"]]).strip() if pd.notna(row[col["name"]]) else ""
            price_raw = row[col["price"]]
            if not name or pd.isna(price_raw):
                errors.append(f"Fila {row_num}: falta nombre o precio")
                continue
            price = float(price_raw)
            if price <= 0:
                errors.append(f"Fila {row_num}: el precio debe ser mayor a 0")
                continue
            product_in = schemas.ProductCreate(
                name=name, price=price,
                description=(str(row[col["desc"]]).strip() if col["desc"] and pd.notna(row[col["desc"]]) else None),
                category=(str(row[col["cat"]]).strip() if col["cat"] and pd.notna(row[col["cat"]]) else None),
                sku=(str(row[col["sku"]]).strip() if col["sku"] and pd.notna(row[col["sku"]]) else None),
            )
            crud.create_product(db, product=product_in, owner_id=tid)
            created += 1
        except Exception as e:
            errors.append(f"Fila {row_num}: {e}")

    return {"created": created, "errors": errors}


@router.put("/{product_id}")
async def update_product(
    product_id: str,
    payload: ProductPayload,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    try:
        pid = _uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="product_id inválido")
    db_product = crud.get_product(db, product_id=pid, tenant_id=tenant_id_from(user))
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    updated = crud.update_product(db, db_product, schemas.ProductCreate(**payload.model_dump()))
    return schemas.Product.model_validate(updated).model_dump(mode="json")


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    try:
        pid = _uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="product_id inválido")
    deleted = crud.delete_product(db, product_id=pid, owner_id=tenant_id_from(user))
    if not deleted:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"ok": True}
