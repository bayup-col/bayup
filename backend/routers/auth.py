import secrets as _secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

import models
from database import get_db
from deps import current_user, trigger_email_confirmation
from rate_limit import limiter

router = APIRouter(tags=["auth"])


# ── Schemas ───────────────────────────────────────────────────────────────

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=1)
    plan_id: str | None = None


class ResendConfirmationRequest(BaseModel):
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=6)


class GoogleAuthRequest(BaseModel):
    access_token: str



def _set_auth_cookies(response: JSONResponse, access_token: str, refresh_token: str) -> None:
    for key, value, max_age in [
        ("bayup_access_token", access_token, 3600),
        ("bayup_refresh_token", refresh_token, 30 * 24 * 3600),
    ]:
        response.set_cookie(
            key=key, value=value,
            httponly=True, secure=True, samesite="none",
            max_age=max_age, path="/",
        )


# ── Endpoints ─────────────────────────────────────────────────────────────

@router.post("/auth/login")
@limiter.limit("5/minute")
def login(request: Request, form_data: UserLoginRequest, db: Session = Depends(get_db)):
    import crud, security
    user = crud.get_user_by_email(db, email=form_data.email)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Credenciales inválidas")

    is_root_admin = user.role == "admin_tienda" and not user.owner_id and not getattr(user, "is_global_staff", False)
    if is_root_admin and not getattr(user, "email_confirmed", True):
        raise HTTPException(
            status_code=403,
            detail="Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada y haz clic en el enlace de confirmación."
        )

    if not user.is_global_staff:
        root = db.query(models.User).filter(models.User.id == user.owner_id).first() if user.owner_id else user
        if root and root.status == "Suspendido":
            raise HTTPException(status_code=403, detail="Esta tienda ha sido suspendida. Contacta a soporte Bayup.")

    access_token = security.create_access_token(data={"sub": user.email})
    from security import create_refresh_token
    payload = {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "full_name": getattr(user, "full_name", ""),
            "role": getattr(user, "role", "admin_tienda"),
            "is_global_staff": getattr(user, "is_global_staff", False),
            "permissions": getattr(user, "permissions", {}) or {},
            "plan": {
                "id": str(user.plan.id) if getattr(user, "plan", None) else None,
                "name": user.plan.name if getattr(user, "plan", None) else "Básico",
            } if getattr(user, "plan", None) else None,
            "shop_slug": getattr(user, "shop_slug", ""),
            "logo_url": getattr(user, "logo_url", ""),
            "onboarding_completed": bool(getattr(user, "onboarding_completed", False)),
            "status": getattr(user, "status", "Activo"),
            "reviewer_notes": getattr(user, "reviewer_notes", None),
        },
    }
    response = JSONResponse(content=payload)
    _set_auth_cookies(response, access_token, create_refresh_token(user.email))
    return response


@router.post("/auth/register")
@limiter.limit("5/minute")
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)):
    import crud, schemas
    existing = crud.get_user_by_email(db, email=payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese correo")
    user_in = schemas.UserCreate(
        email=payload.email,
        password=payload.password,
        full_name=payload.full_name,
        status="Pendiente",
    )
    try:
        user = crud.create_user(db, user=user_in)
    except Exception as e:
        db.rollback()
        import logging
        logging.getLogger("bayup").error("register create_user failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Error al crear cuenta: {e}")
    name = user.full_name or payload.email.split("@")[0]
    trigger_email_confirmation(user.email, name, db)
    return {"id": str(user.id), "email": user.email, "email_confirmation_sent": True}


@router.post("/auth/refresh")
@limiter.limit("10/minute")
async def refresh_token_endpoint(request: Request, db: Session = Depends(get_db)):
    import security as sec_mod
    refresh_tok = request.cookies.get("bayup_refresh_token")
    if not refresh_tok:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        data = jwt.decode(refresh_tok, sec_mod.SECRET_KEY, algorithms=[sec_mod.ALGORITHM])
        if data.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token inválido")
        email = data.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Refresh token expirado o inválido")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or user.status != "Activo":
        raise HTTPException(status_code=401, detail="Usuario no encontrado o inactivo")
    new_access_token = sec_mod.create_access_token({"sub": email})
    response = JSONResponse(content={"access_token": new_access_token, "token_type": "bearer"})
    response.set_cookie(
        key="bayup_access_token", value=new_access_token,
        httponly=True, secure=True, samesite="none",
        max_age=3600, path="/",
    )
    return response


@router.post("/auth/logout")
async def logout_endpoint(request: Request):
    response = JSONResponse(content={"ok": True})
    response.delete_cookie("bayup_access_token", path="/")
    response.delete_cookie("bayup_refresh_token", path="/")
    return response


@router.get("/auth/confirm-email")
@limiter.limit("10/minute")
async def confirm_email_endpoint(token: str = Query(...), request: Request = None, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email_confirmation_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Enlace de confirmación inválido.")
    expires = user.email_confirmation_expires
    if expires:
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="El enlace expiró. Regístrate de nuevo o solicita reenvío.")
    user.email_confirmed = True
    user.email_confirmation_token = None
    user.email_confirmation_expires = None
    db.commit()
    return {"message": "Correo confirmado. Ya puedes iniciar sesión."}


@router.post("/auth/resend-confirmation")
@limiter.limit("3/minute")
async def resend_email_confirmation(payload: ResendConfirmationRequest, request: Request, db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.email == payload.email).first()
        if user and not user.email_confirmed:
            name = user.full_name or payload.email.split("@")[0]
            trigger_email_confirmation(user.email, name, db)
    except Exception:
        pass
    return {"message": "Si el correo existe y no está confirmado, recibirás un nuevo enlace."}


@router.post("/auth/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    import email_service
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if user:
        token = _secrets.token_urlsafe(32)
        user.password_reset_token = token
        user.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()
        email_service.send_password_reset(user.email, token)
    return {"ok": True, "message": "Si el correo existe, recibirás un enlace en los próximos minutos."}


@router.post("/auth/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    import security as sec_mod
    user = db.query(models.User).filter(models.User.password_reset_token == payload.token).first()
    if not user or not user.password_reset_expires:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
    expires = user.password_reset_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="El enlace expiró. Solicita uno nuevo.")
    user.hashed_password = sec_mod.get_password_hash(payload.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    user.email_confirmed = True
    db.commit()
    return {"ok": True}


@router.post("/auth/google")
@limiter.limit("10/minute")
async def auth_google(request: Request, payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    import os, crud, security as sec_mod
    import requests as _requests
    supabase_url = os.getenv("SUPABASE_URL")
    anon_key = os.getenv("SUPABASE_ANON_KEY")
    if not supabase_url or not anon_key:
        raise HTTPException(status_code=503, detail="OAuth no configurado en el servidor")
    try:
        resp = _requests.get(
            f"{supabase_url}/auth/v1/user",
            headers={"apikey": anon_key, "Authorization": f"Bearer {payload.access_token}"},
            timeout=8,
        )
    except Exception:
        raise HTTPException(status_code=503, detail="No se pudo contactar Supabase")
    if not resp.ok:
        raise HTTPException(status_code=401, detail="Token de Google inválido o expirado")
    sb_user = resp.json()
    email = sb_user.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="No se pudo obtener el email de Google")

    user = crud.get_user_by_email(db, email)
    if not user:
        from schemas import UserCreate
        meta = sb_user.get("user_metadata") or {}
        full_name = meta.get("full_name") or meta.get("name") or email.split("@")[0]
        user_in = UserCreate(email=email, password=_secrets.token_hex(32), full_name=full_name)
        user = crud.create_user(db, user=user_in)
        db.commit()
        db.refresh(user)
        try:
            import email_service as _es
            _es.send_welcome_email(user.email, full_name, confirmed=True)
        except Exception:
            pass
    if not getattr(user, "email_confirmed", False):
        user.email_confirmed = True
        db.commit()
    if getattr(user, "status", "Activo") == "Suspendido":
        raise HTTPException(status_code=403, detail="Esta tienda ha sido suspendida. Contacta a soporte Bayup.")

    jwt_token = sec_mod.create_access_token(data={"sub": user.email})
    plan = None
    if user.plan_id:
        plan_obj = db.query(models.Plan).filter(models.Plan.id == user.plan_id).first()
        if plan_obj:
            plan = {"name": plan_obj.name}
    from security import create_refresh_token
    response_data = {
        "access_token": jwt_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name or "",
            "role": user.role or "admin_tienda",
            "is_global_staff": bool(getattr(user, "is_global_staff", False)),
            "shop_slug": user.shop_slug or "",
            "logo_url": getattr(user, "logo_url", "") or "",
            "permissions": getattr(user, "permissions", {}) or {},
            "plan": plan,
            "onboarding_completed": bool(getattr(user, "onboarding_completed", False)),
            "status": getattr(user, "status", "Activo"),
        },
    }
    response = JSONResponse(content=response_data)
    _set_auth_cookies(response, jwt_token, create_refresh_token(user.email))
    return response


@router.get("/auth/me")
async def read_users_me(user=Depends(current_user)):
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": getattr(user, "full_name", ""),
        "role": getattr(user, "role", "admin_tienda"),
        "is_global_staff": getattr(user, "is_global_staff", False),
        "shop_slug": getattr(user, "shop_slug", ""),
        "logo_url": getattr(user, "logo_url", ""),
        "permissions": getattr(user, "permissions", {}) or {},
        "onboarding_completed": bool(getattr(user, "onboarding_completed", False)),
        "status": getattr(user, "status", "Activo"),
        "reviewer_notes": getattr(user, "reviewer_notes", None),
        "category":      getattr(user, "category", "Moda & Accesorios") or "Moda & Accesorios",
        "story":         getattr(user, "story", "") or "",
        "phone":         getattr(user, "phone", "") or "",
        "address":       getattr(user, "address", "") or "",
        "customer_city": getattr(user, "customer_city", "") or "",
        "country":       getattr(user, "country", "Colombia") or "Colombia",
        "hours":         getattr(user, "hours", "") or "",
        "website":       getattr(user, "website", "") or "",
        "nit":           getattr(user, "nit", "") or "",
        "tax_regime":    getattr(user, "tax_regime", "Simplificado") or "Simplificado",
        "legal_rep":     getattr(user, "legal_rep", "") or "",
        "social_links":  getattr(user, "social_links", {}) or {},
        "bank_accounts": getattr(user, "bank_accounts", []) or [],
        "terms_conditions": getattr(user, "terms_conditions", "") or "",
        "privacy_policy":   getattr(user, "privacy_policy", "") or "",
        "return_policy":    getattr(user, "return_policy", "") or "",
        "shipping_policy":  getattr(user, "shipping_policy", "") or "",
    }
