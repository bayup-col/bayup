import os
import uuid as _uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import crud, models, security
from database import get_db
from deps import current_user, tenant_id_from, require_super_admin

router = APIRouter(prefix="/admin", tags=["admin"])

_BASE_ROLE_DEFS = [
    ("admin_tienda", "Administrador"),
    ("editor", "Editor"),
    ("logistica", "Logística"),
    ("vendedor", "Vendedor"),
]

PROFILE_EDITABLE_FIELDS = {
    "full_name", "logo_url", "category", "story", "shop_slug",
    "email", "phone", "address", "customer_city", "country", "hours",
    "website", "nit", "tax_regime", "legal_rep", "social_links",
}


def _require_admin_role(user) -> None:
    allowed = {"admin_tienda", "ADMIN", "SUPER_ADMIN"}
    if user.role not in allowed and not getattr(user, "is_global_staff", False):
        raise HTTPException(status_code=403, detail="Se requiere rol administrador")


def _serialize_customer(c) -> dict:
    return {
        "id": str(c.id),
        "email": c.email,
        "full_name": c.full_name or "Sin nombre",
        "nickname": getattr(c, "nickname", None) or "",
        "phone": getattr(c, "phone", None) or "",
        "customer_city": getattr(c, "customer_city", None) or "",
        "status": getattr(c, "status", None) or "Activo",
        "role": c.role,
        "owner_id": str(c.owner_id) if c.owner_id else None,
        "customer_type": getattr(c, "customer_type", None) or "final",
        "acquisition_channel": getattr(c, "acquisition_channel", None) or "web",
        "created_at": c.created_at.isoformat() if getattr(c, "created_at", None) else None,
    }


def _serialize_staff(u) -> dict:
    return {
        "id": str(u.id),
        "full_name": u.full_name or "Usuario",
        "email": u.email,
        "role": u.role,
        "status": getattr(u, "status", None) or "Activo",
        "created_at": u.created_at.isoformat() if getattr(u, "created_at", None) else None,
    }


def _serialize_custom_role(r) -> dict:
    return {
        "id": r.name,
        "name": r.name,
        "permissions": r.permissions or {},
        "owner_id": str(r.owner_id) if r.owner_id else None,
    }


def _log_activity(db: Session, tenant_id, actor, action: str, detail: str, target_id=None):
    try:
        log = models.ActivityLog(
            user_id=actor.id, action=action, target_id=target_id, detail=detail, tenant_id=tenant_id
        )
        db.add(log)
        db.commit()
    except Exception:
        pass


def _resolve_target(db: Session, caller, target_user_id: str | None):
    if not target_user_id:
        return caller
    require_super_admin(caller)
    try:
        tid = _uuid.UUID(target_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="target_user_id inválido")
    target = db.query(models.User).filter(models.User.id == tid).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return target


# ── Clientes ──────────────────────────────────────────────────────────────

@router.get("/users")
async def get_customers(
    request: Request,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=200, ge=1),
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    tid = tenant_id_from(user)
    rows = db.query(models.User).filter(
        models.User.owner_id == tid,
        models.User.role == "cliente",
    ).offset(skip).limit(min(limit, 500)).all()
    return [_serialize_customer(c) for c in rows]


@router.delete("/users/{user_id}")
async def delete_customer(user_id: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    _require_admin_role(user)
    tid = tenant_id_from(user)
    try:
        uid = _uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="user_id inválido")
    target = db.query(models.User).filter(models.User.id == uid, models.User.owner_id == tid).first()
    if not target:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    db.delete(target)
    db.commit()
    return {"ok": True}


@router.post("/users")
async def create_customer(request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    _require_admin_role(user)
    tid = tenant_id_from(user)
    body = await request.json()
    email = (body.get("email") or "").strip().lower()
    full_name = (body.get("full_name") or "").strip()
    if not email or not full_name:
        raise HTTPException(status_code=422, detail="email y full_name son obligatorios")
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="Ya existe un usuario con ese correo electrónico")
    raw_pw = body.get("password") or str(_uuid.uuid4()).replace("-", "")[:14]
    c = models.User(
        id=_uuid.uuid4(),
        email=email,
        full_name=full_name,
        nickname=body.get("nickname") or full_name.split()[0],
        phone=body.get("phone") or None,
        customer_city=body.get("city") or None,
        status=body.get("status") or "Activo",
        role="cliente",
        owner_id=tid,
        customer_type=body.get("customer_type") or "final",
        acquisition_channel=body.get("acquisition_channel") or "web",
        email_confirmed=True,
        hashed_password=security.get_password_hash(raw_pw),
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return _serialize_customer(c)


@router.put("/users/{user_id}")
async def update_customer(user_id: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    _require_admin_role(user)
    tid = tenant_id_from(user)
    try:
        uid = _uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="user_id inválido")
    c = db.query(models.User).filter(models.User.id == uid, models.User.owner_id == tid).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    body = await request.json()
    if "full_name" in body and body["full_name"]:
        c.full_name = body["full_name"].strip()
    if "email" in body and body["email"]:
        c.email = body["email"].strip().lower()
    if "phone" in body:
        c.phone = body["phone"] or None
    if "city" in body:
        c.customer_city = body["city"] or None
    if "status" in body:
        c.status = body["status"]
    if "customer_type" in body:
        c.customer_type = body["customer_type"]
    if "acquisition_channel" in body:
        c.acquisition_channel = body["acquisition_channel"]
    db.commit()
    db.refresh(c)
    return _serialize_customer(c)


# ── Staff ─────────────────────────────────────────────────────────────────

class StaffCreateRequest(BaseModel):
    email: str
    full_name: str
    password: str
    role: str = "vendedor"
    status: str = "Invitado"


class StaffUpdateRequest(BaseModel):
    email: str
    new_role: str | None = None
    full_name: str | None = None
    status: str | None = None


@router.get("/staff")
async def get_staff(request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    tid = tenant_id_from(user)
    owner = db.query(models.User).filter(models.User.id == tid).first()
    staff = db.query(models.User).filter(models.User.owner_id == tid, models.User.role != "cliente").all()
    result = []
    if owner:
        result.append(_serialize_staff(owner))
    result.extend(_serialize_staff(s) for s in staff)
    return result


@router.post("/staff")
async def create_staff(payload: StaffCreateRequest, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    _require_admin_role(user)
    tid = tenant_id_from(user)
    allowed = {r for r, _ in _BASE_ROLE_DEFS}
    if payload.role not in allowed:
        raise HTTPException(status_code=400, detail=f"Rol no válido. Opciones: {sorted(allowed)}")
    if crud.get_user_by_email(db, email=payload.email):
        raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese correo")
    s = models.User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=security.get_password_hash(payload.password),
        role=payload.role,
        status=payload.status,
        owner_id=tid,
    )
    db.add(s)
    db.commit()
    _log_activity(db, tid, user, "CREATE_USER", f"Invitó a {payload.full_name} ({payload.email}) como {payload.role}", target_id=str(s.id))
    try:
        import email_service as _es
        _es.send_staff_invitation(payload.email, payload.full_name, user.full_name or user.email)
    except Exception:
        pass
    return _serialize_staff(s)


@router.post("/update-user")
async def update_staff(payload: StaffUpdateRequest, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    _require_admin_role(user)
    tid = tenant_id_from(user)
    target = db.query(models.User).filter(models.User.email == payload.email, models.User.owner_id == tid).first()
    if not target:
        raise HTTPException(status_code=404, detail="Miembro del staff no encontrado")
    allowed = {r for r, _ in _BASE_ROLE_DEFS}
    if payload.new_role:
        if payload.new_role not in allowed:
            raise HTTPException(status_code=400, detail=f"Rol no válido. Opciones: {sorted(allowed)}")
        target.role = payload.new_role
    if payload.full_name:
        target.full_name = payload.full_name
    if payload.status:
        target.status = payload.status
    db.commit()
    _log_activity(db, tid, user, "UPDATE_USER", f"Actualizó a {target.full_name} ({target.email})", target_id=str(target.id))
    return _serialize_staff(target)


@router.delete("/staff/{staff_id}")
async def delete_staff(staff_id: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    _require_admin_role(user)
    tid = tenant_id_from(user)
    try:
        uid = _uuid.UUID(staff_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="id inválido")
    target = db.query(models.User).filter(models.User.id == uid, models.User.owner_id == tid).first()
    if not target:
        raise HTTPException(status_code=404, detail="Miembro del staff no encontrado")
    name, email = target.full_name, target.email
    db.delete(target)
    db.commit()
    _log_activity(db, tid, user, "DELETE_USER", f"Eliminó a {name} ({email})", target_id=staff_id)
    return {"ok": True}


@router.get("/logs")
async def get_logs(request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    _require_admin_role(user)
    tid = tenant_id_from(user)
    logs = db.query(models.ActivityLog).filter(
        models.ActivityLog.tenant_id == tid
    ).order_by(models.ActivityLog.created_at.desc()).limit(100).all()
    actor_ids = {l.user_id for l in logs if l.user_id}
    actors = {u.id: u for u in db.query(models.User).filter(models.User.id.in_(actor_ids)).all()} if actor_ids else {}
    return [{
        "id": str(l.id),
        "action": l.action,
        "detail": l.detail,
        "target_id": l.target_id,
        "user_name": actors[l.user_id].full_name if l.user_id in actors else "Sistema",
        "created_at": l.created_at.isoformat() if l.created_at else None,
    } for l in logs]


# ── Roles ─────────────────────────────────────────────────────────────────

class RoleUpdateRequest(BaseModel):
    name: str
    permissions: dict = {}


@router.get("/roles")
async def get_roles(request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    tid = tenant_id_from(user)
    roles = db.query(models.CustomRole).filter(models.CustomRole.owner_id == tid).all()
    if not roles:
        for role_id, _ in _BASE_ROLE_DEFS:
            db.add(models.CustomRole(name=role_id, permissions={}, owner_id=tid))
        db.commit()
        roles = db.query(models.CustomRole).filter(models.CustomRole.owner_id == tid).all()
    return [_serialize_custom_role(r) for r in roles]


@router.put("/roles/{role_name}")
async def update_role(role_name: str, payload: RoleUpdateRequest, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    _require_admin_role(user)
    tid = tenant_id_from(user)
    role = db.query(models.CustomRole).filter(models.CustomRole.owner_id == tid, models.CustomRole.name == role_name).first()
    if not role:
        role = models.CustomRole(name=role_name, permissions=payload.permissions, owner_id=tid)
        db.add(role)
    else:
        role.permissions = payload.permissions
    db.commit()
    return _serialize_custom_role(role)


# ── Perfil y otros ────────────────────────────────────────────────────────

class UpdateProfileRequest(BaseModel):
    full_name: str | None = None
    logo_url: str | None = None
    category: str | None = None
    story: str | None = None
    shop_slug: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    customer_city: str | None = None
    country: str | None = None
    hours: str | None = None
    website: str | None = None
    nit: str | None = None
    tax_regime: str | None = None
    legal_rep: str | None = None
    social_links: dict | None = None
    target_user_id: str | None = None


@router.put("/update-profile")
async def update_profile(payload: UpdateProfileRequest, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    caller = user
    target = _resolve_target(db, caller, payload.target_user_id)
    update_data = payload.model_dump(exclude_unset=True, exclude={"target_user_id"})
    if update_data.get("shop_slug") and update_data["shop_slug"] != target.shop_slug:
        existing = crud.get_user_by_slug(db, slug=update_data["shop_slug"])
        if existing and existing.id != target.id:
            raise HTTPException(status_code=400, detail="Esa URL de tienda ya está en uso, elige otra")
    email_changed = update_data.get("email") and update_data["email"] != target.email
    if email_changed:
        existing_email = crud.get_user_by_email(db, email=update_data["email"])
        if existing_email and existing_email.id != target.id:
            raise HTTPException(status_code=400, detail="Ese correo ya está en uso por otra cuenta")
    for key, value in update_data.items():
        if key in PROFILE_EDITABLE_FIELDS:
            setattr(target, key, value)
    db.commit()

    # Limpiar caché de shop si existe en el módulo principal
    try:
        import main as _main_mod
        if hasattr(_main_mod, "_shop_cache") and target.shop_slug:
            _main_mod._shop_cache.pop(target.shop_slug, None)
    except Exception:
        pass

    result: dict = {"ok": True}
    if email_changed and target.id == caller.id:
        result["access_token"] = security.create_access_token(data={"sub": target.email})
        new_refresh = security.create_refresh_token(target.email)
        is_prod = os.getenv("APP_ENV", "production") == "production"
        response = JSONResponse(content=result)
        response.set_cookie(
            key="bayup_refresh_token",
            value=new_refresh,
            httponly=True,
            secure=is_prod,
            samesite="lax",
            max_age=30 * 24 * 3600,
            path="/",
        )
        return response
    return result


class OnboardingCompleteRequest(BaseModel):
    target_user_id: str | None = None


@router.post("/onboarding-complete")
async def complete_onboarding(request: Request, payload: OnboardingCompleteRequest | None = None, db: Session = Depends(get_db), user=Depends(current_user)):
    target = _resolve_target(db, user, payload.target_user_id if payload else None)
    target.onboarding_completed = True
    db.commit()
    return {"ok": True}


@router.post("/upload-image")
async def upload_image(request: Request, file: UploadFile = File(...), db: Session = Depends(get_db), user=Depends(current_user)):
    import s3_service
    allowed_types = ("image/", "video/")
    if not file.content_type or not any(file.content_type.startswith(t) for t in allowed_types):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen o video")
    contents = await file.read()
    is_video = file.content_type.startswith("video/")
    max_size = 50 * 1024 * 1024 if is_video else 5 * 1024 * 1024
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail=f"El archivo supera el límite de {'50MB' if is_video else '5MB'}")
    if not is_video:
        _IMG_MAGIC = [b'\xff\xd8\xff', b'\x89PNG\r\n\x1a\n', b'GIF87a', b'GIF89a', b'RIFF', b'WEBP']
        if not any(contents[:8].startswith(sig) for sig in _IMG_MAGIC):
            raise HTTPException(status_code=400, detail="El archivo no es una imagen válida")
    url = s3_service.upload_file_and_get_public_url(contents, file.content_type, file.filename or "file")
    if not url:
        raise HTTPException(status_code=503, detail="Error al guardar el archivo")
    return {"url": url}


@router.get("/payments")
async def get_payments(request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    tid = tenant_id_from(user)
    payments = db.query(models.Payment).filter(models.Payment.tenant_id == tid).order_by(models.Payment.created_at.desc()).all()
    return [_ser_payment(p) for p in payments]


@router.get("/payments/{payment_id}")
async def get_payment(payment_id: str, request: Request, db: Session = Depends(get_db), user=Depends(current_user)):
    tid = tenant_id_from(user)
    try:
        pid = _uuid.UUID(payment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="payment_id inválido")
    p = db.query(models.Payment).filter(models.Payment.id == pid, models.Payment.tenant_id == tid).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    return _ser_payment(p)


def _ser_payment(p) -> dict:
    return {
        "id": str(p.id),
        "amount": p.amount,
        "currency": p.currency,
        "status": p.status,
        "customer_name": p.customer_name,
        "customer_email": p.customer_email,
        "customer_phone": p.customer_phone,
        "items": p.items or [],
        "gateway": p.gateway,
        "gateway_payment_id": p.gateway_payment_id,
        "gateway_redirect_url": p.gateway_redirect_url,
        "whatsapp_url": p.whatsapp_url,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }
