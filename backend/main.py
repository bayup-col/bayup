from fastapi import Depends, FastAPI, HTTPException, status, Request, Response, UploadFile, File, Query
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import logging
import os
import sys
import time
import requests as _requests
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field, EmailStr
import html as _html
import threading
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Evita UnicodeEncodeError al imprimir emojis en consolas Windows (cp1252)
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# --- LOGGING ESTRUCTURADO (BAJA-002) ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("bayup")

load_dotenv()

# --- MONITOREO: SENTRY ---
# Inerte si SENTRY_DSN no esta definido. Para activar: anadir SENTRY_DSN en el
# panel de Render (Environment > Add Variable). No se requiere redeploy de codigo.
import sentry_sdk as _sentry_sdk
_sentry_dsn = os.getenv("SENTRY_DSN")
if _sentry_dsn:
    _sentry_sdk.init(
        dsn=_sentry_dsn,
        traces_sample_rate=0.2,      # 20%% de requests trazados - ajustable
        profiles_sample_rate=0.1,
        environment=os.getenv("APP_ENV", "production"),
        send_default_pii=False,      # nunca enviar datos personales a Sentry
    )

# --- ARRANQUE SEGURO (SIN IMPORTACIONES CRÍTICAS ARRIBA) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialización diferida para evitar Error 502 en Railway
    def init_task():
        try:
            from database import engine
            import models
            models.Base.metadata.create_all(bind=engine)
            logger.info("Motor Bayup: Infraestructura Sincronizada")
        except Exception as e:
            logger.warning("Motor Bayup: Aviso en arranque: %s", e)
            
    threading.Thread(target=init_task, daemon=True).start()
    yield

app = FastAPI(title="Bayup OS Platinum", lifespan=lifespan)

# --- RATE LIMITING ---
def _get_real_ip(request: Request) -> str:
    """Lee la IP real del cliente desde X-Forwarded-For (Render inyecta este header).
    Se usa la ÚLTIMA IP de la cadena porque es la añadida por el proxy confiable de Render,
    no la primera que puede ser manipulada por el cliente (ALTA-001)."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ips = [ip.strip() for ip in forwarded.split(",")]
        return ips[-1]
    return request.client.host or "127.0.0.1"

limiter = Limiter(key_func=_get_real_ip)
app.state.limiter = limiter

def _json_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Demasiados intentos. Espera un momento e intenta de nuevo."})

app.add_exception_handler(RateLimitExceeded, _json_rate_limit_handler)

# --- CACHE EN MEMORIA (TTL simple, sin Redis ni dependencias nuevas) ---
# Cada entrada es una tupla (valor, expires_at_timestamp).
_shop_cache: dict = {}       # {slug: (data_dict, expires_at)}
_templates_cache: dict = {}  # {"list": (data_list, expires_at)}

def _cache_get(store: dict, key: str):
    """Devuelve el valor cacheado si todavía no expiró, o None si falta/expiró."""
    entry = store.get(key)
    if entry and entry[1] > time.time():
        return entry[0]
    return None

def _cache_set(store: dict, key: str, value, ttl: int, max_size: int = 500) -> None:
    """Almacena value en store[key] con un TTL en segundos.
    MED-007: evita crecimiento ilimitado eliminando las 100 entradas más antiguas
    cuando se supera max_size."""
    store[key] = (value, time.time() + ttl)
    if len(store) > max_size:
        keys_to_delete = list(store.keys())[:100]
        for k in keys_to_delete:
            del store[k]

# --- PREVIEW TOKENS DE CORTA VIDA (ALTA-004) ---
# Evita exponer el JWT completo en la URL de preview (queda en logs de servidor).
# {preview_token: (user_email, expires_at_timestamp)}
import time as _time
import secrets as _secrets
_preview_tokens: dict[str, tuple[str, float]] = {}

def _create_preview_token(user_email: str) -> str:
    """Genera un token opaco de 5 minutos para acceso al preview sin JWT en URL."""
    tok = _secrets.token_urlsafe(32)
    _preview_tokens[tok] = (user_email, _time.time() + 300)
    # Limpieza lazy de tokens expirados para evitar crecimiento ilimitado
    now = _time.time()
    expired = [k for k, (_, exp) in _preview_tokens.items() if exp < now]
    for k in expired:
        del _preview_tokens[k]
    return tok

def _validate_preview_token(token: str) -> str | None:
    """Retorna el email del usuario si el preview token es válido, None si no."""
    entry = _preview_tokens.get(token)
    if not entry:
        return None
    email, expires_at = entry
    if _time.time() > expires_at:
        del _preview_tokens[token]
        return None
    return email

# --- CORS ---
# NOTA: si en el futuro las tiendas activan dominio propio (custom_domain en el modelo User),
# esta whitelist estática no los cubrirá — habrá que validar el origen dinámicamente contra la DB.
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://bayup.com",
    "https://www.bayup.com",
    "https://bayup.com.co",
    "https://www.bayup.com.co",
    "https://bayup.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    # ALTA-002: regex más específica para evitar que cualquier subdominio de vercel.app sea aceptado
    allow_origin_regex=r"https://bayup-[a-z0-9]+-bayup-col\.vercel\.app",
    allow_credentials=True,  # CRIT-004: requerido para enviar/recibir cookies httpOnly
    # BAJA-001: métodos explícitos en lugar de wildcard
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Length"],
)

# --- HEADERS DE SEGURIDAD HTTP ---
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    # ALTA-003: Content-Security-Policy para mitigar XSS e inyección de contenido
    response.headers.setdefault(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; "
        "connect-src 'self' https:; frame-ancestors 'none';"
    )
    return response

def _trigger_email_confirmation(email: str, password: str) -> None:  # noqa: ARG001
    """Llama a Supabase Auth para que envíe el email de confirmación al nuevo usuario.
    MED-006: Se usa una contraseña aleatoria (nunca la real del usuario) para que
    Supabase Auth no tenga acceso a las credenciales reales del sistema.
    Falla silenciosamente si las variables de entorno no están configuradas."""
    import secrets as _sec_auth
    supabase_url = os.getenv("SUPABASE_URL")
    anon_key = os.getenv("SUPABASE_ANON_KEY")
    if not supabase_url or not anon_key:
        return
    site_url = os.getenv("SITE_URL", "https://bayup.com.co")
    # MED-006: contraseña aleatoria — Supabase Auth no necesita la contraseña real
    random_password = _sec_auth.token_urlsafe(32)
    try:
        import requests as _requests
        _requests.post(
            f"{supabase_url}/auth/v1/signup",
            headers={"apikey": anon_key, "Content-Type": "application/json"},
            json={
                "email": email,
                "password": random_password,
                "options": {"emailRedirectTo": f"{site_url}/login?confirmed=1"},
            },
            timeout=8,
        )
    except Exception:
        pass  # No bloquear el registro si Supabase Auth no responde

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

@app.get("/")
def read_root():
    # Liveness simple: Render usa esta ruta como healthcheck por defecto.
    # No verifica la DB a proposito, para no reiniciar el servicio por un hiccup pasajero.
    return {"status": "Active", "version": "2.1 Platinum Production"}

@app.get("/health")
@limiter.limit("30/minute")
def health_check(request: Request):
    """Readiness real: confirma que la conexion a la base de datos funciona."""
    from sqlalchemy import text
    from database import SessionLocal
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        logger.error("Health check DB failed: %s", e)
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    finally:
        db.close()

@app.post("/auth/login")
@limiter.limit("5/minute")
def login(request: Request, form_data: UserLoginRequest):
    # Importaciones internas para evitar bloqueos en el arranque
    from database import SessionLocal
    import crud, security, models

    db = SessionLocal()
    try:
        user = crud.get_user_by_email(db, email=form_data.email)
        if not user or not security.verify_password(form_data.password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Credenciales inválidas")

        # Bloquear login si el email no fue confirmado (solo cuentas raíz admin_tienda)
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

        payload = {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "email": user.email,
                "full_name": getattr(user, 'full_name', ""),
                "role": getattr(user, 'role', "admin_tienda"),
                "is_global_staff": getattr(user, 'is_global_staff', False),
                "permissions": getattr(user, 'permissions', {}) or {},
                "plan": {
                    "id": str(user.plan.id) if getattr(user, 'plan', None) else None,
                    "name": user.plan.name if getattr(user, 'plan', None) else "Básico"
                } if getattr(user, 'plan', None) else None,
                "shop_slug": getattr(user, 'shop_slug', ""),
                "logo_url": getattr(user, 'logo_url', ""),
                "onboarding_completed": bool(getattr(user, 'onboarding_completed', False)),
            }
        }
        # CRIT-004: emitir cookies httpOnly además del JSON para mayor seguridad
        from security import create_refresh_token as _create_refresh_token
        is_prod = os.getenv("APP_ENV", "production") == "production"
        response = JSONResponse(content=payload)
        response.set_cookie(
            key="bayup_access_token",
            value=access_token,
            httponly=True,
            secure=is_prod,
            samesite="lax",
            max_age=3600,  # 1 hora
            path="/",
        )
        response.set_cookie(
            key="bayup_refresh_token",
            value=_create_refresh_token(user.email),
            httponly=True,
            secure=is_prod,
            samesite="lax",
            max_age=30 * 24 * 3600,  # 30 días
            path="/auth/refresh",
        )
        return response
    finally:
        db.close()

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=1)
    # El frontend manda un id de plan ficticio (no es un UUID real); el plan
    # efectivo se asigna automaticamente al plan marcado is_default=True.
    plan_id: str | None = None

@app.post("/auth/register")
@limiter.limit("5/minute")
def register(request: Request, payload: RegisterRequest):
    from database import SessionLocal
    import crud, schemas

    db = SessionLocal()
    try:
        existing = crud.get_user_by_email(db, email=payload.email)
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese correo")

        user_in = schemas.UserCreate(
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
        )
        user = crud.create_user(db, user=user_in)
        _trigger_email_confirmation(payload.email, payload.password)
        try:
            import email_service as _es
            _es.send_welcome_email(user.email, user.full_name or payload.email.split("@")[0], confirmed=False)
        except Exception:
            pass
        return {"id": str(user.id), "email": user.email, "email_confirmation_sent": True}
    finally:
        db.close()

@app.post("/auth/refresh")
@limiter.limit("10/minute")
async def refresh_token_endpoint(request: Request):
    """Renueva el access token usando el refresh token de la cookie httpOnly (CRIT-004)."""
    import security as sec_mod
    from database import SessionLocal
    import models
    refresh_tok = request.cookies.get("bayup_refresh_token")
    if not refresh_tok:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(refresh_tok, sec_mod.SECRET_KEY, algorithms=[sec_mod.ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token inválido")
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Refresh token expirado o inválido")
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user or user.status != "Activo":
            raise HTTPException(status_code=401, detail="Usuario no encontrado o inactivo")
        new_access_token = sec_mod.create_access_token({"sub": email})
        is_prod = os.getenv("APP_ENV", "production") == "production"
        response = JSONResponse(content={"access_token": new_access_token, "token_type": "bearer"})
        response.set_cookie(
            key="bayup_access_token",
            value=new_access_token,
            httponly=True,
            secure=is_prod,
            samesite="lax",
            max_age=3600,
            path="/",
        )
        return response
    finally:
        db.close()

@app.post("/auth/logout")
async def logout_endpoint(request: Request):
    """Invalida las cookies de sesión. CRIT-004."""
    response = JSONResponse(content={"ok": True})
    response.delete_cookie("bayup_access_token", path="/")
    response.delete_cookie("bayup_refresh_token", path="/auth/refresh")
    return response

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=6)

@app.post("/auth/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest):
    import models, email_service, secrets as _secrets
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == payload.email).first()
        # Siempre devuelve 200 para no filtrar si el email existe
        if user:
            token = _secrets.token_urlsafe(32)
            user.password_reset_token = token
            user.password_reset_expires = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=1)
            db.commit()
            email_service.send_password_reset(user.email, token)
        return {"ok": True, "message": "Si el correo existe, recibirás un enlace en los próximos minutos."}
    finally:
        db.close()

@app.post("/auth/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, payload: ResetPasswordRequest):
    import models, security as sec_mod
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(
            models.User.password_reset_token == payload.token
        ).first()
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
    finally:
        db.close()

class GoogleAuthRequest(BaseModel):
    access_token: str

@app.post("/auth/google")
@limiter.limit("10/minute")
async def auth_google(request: Request, payload: GoogleAuthRequest):
    import models, crud, security as sec_mod, secrets as _secrets
    from database import SessionLocal
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
    db = SessionLocal()
    try:
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
        # Google ya verificó el email — marcar como confirmado si no lo estaba
        if not getattr(user, "email_confirmed", False):
            user.email_confirmed = True
            db.commit()
        if getattr(user, "status", "Activo") != "Activo":
            raise HTTPException(status_code=403, detail="Cuenta suspendida")
        jwt_token = sec_mod.create_access_token(data={"sub": user.email})
        plan = None
        if user.plan_id:
            plan_obj = db.query(models.Plan).filter(models.Plan.id == user.plan_id).first()
            if plan_obj:
                plan = {"name": plan_obj.name}
        from security import create_refresh_token as _create_refresh_token
        is_prod = os.getenv("APP_ENV", "production") == "production"
        payload = {
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
            },
        }
        response = JSONResponse(content=payload)
        response.set_cookie(
            key="bayup_access_token",
            value=jwt_token,
            httponly=True,
            secure=is_prod,
            samesite="lax",
            max_age=3600,
            path="/",
        )
        response.set_cookie(
            key="bayup_refresh_token",
            value=_create_refresh_token(user.email),
            httponly=True,
            secure=is_prod,
            samesite="lax",
            max_age=30 * 24 * 3600,
            path="/auth/refresh",
        )
        return response
    finally:
        db.close()

def _get_bearer_token(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="No token")
    parts = auth_header.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1]:
        raise HTTPException(status_code=401, detail="Header Authorization inválido, se espera 'Bearer <token>'")
    return parts[1]

async def _authenticate(request: Request, db):
    """Reutiliza security.get_current_user pasando los valores explícitamente
    (evita la resolución vía Depends, ya que estas rutas manejan su propia sesión).
    CRIT-004: extrae el Bearer token de forma no-fatal; get_current_user evaluará
    también la cookie httpOnly como alternativa."""
    import security
    auth_header = request.headers.get("Authorization", "")
    token: str | None = None
    if auth_header.lower().startswith("bearer ") and len(auth_header) > 7:
        token = auth_header[7:].strip() or None
    return await security.get_current_user(request=request, token=token, db=db)

def _tenant_id(user):
    return user.owner_id or user.id

@app.get("/auth/me")
async def read_users_me(request: Request):
    from database import SessionLocal

    db = SessionLocal()
    try:
        current_user = await _authenticate(request, db)
        return {
            "id": str(current_user.id),
            "email": current_user.email,
            "full_name": getattr(current_user, 'full_name', ""),
            "role": getattr(current_user, 'role', "admin_tienda"),
            "is_global_staff": getattr(current_user, 'is_global_staff', False),
            "shop_slug": getattr(current_user, 'shop_slug', ""),
            "logo_url": getattr(current_user, 'logo_url', ""),
            "permissions": getattr(current_user, 'permissions', {}) or {},
            "onboarding_completed": bool(getattr(current_user, 'onboarding_completed', False)),
        }
    finally:
        db.close()

class ProductCreateRequest(BaseModel):
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

@app.get("/products")
async def get_products(request: Request, skip: int = Query(default=0, ge=0), limit: int = Query(default=200, ge=1)):
    import crud, schemas
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        products = crud.get_products_by_owner(db, owner_id=_tenant_id(user), skip=skip, limit=min(limit, 500))
        return [schemas.Product.model_validate(p).model_dump(mode="json") for p in products]
    finally:
        db.close()

@app.post("/products")
async def create_product_route(payload: ProductCreateRequest, request: Request):
    import crud, schemas
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        product_in = schemas.ProductCreate(**payload.model_dump())
        db_product = crud.create_product(db, product=product_in, owner_id=_tenant_id(user))
        return schemas.Product.model_validate(db_product).model_dump(mode="json")
    finally:
        db.close()

@app.put("/products/{product_id}")
async def update_product_route(product_id: str, payload: ProductCreateRequest, request: Request):
    import crud, schemas, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        try:
            product_uuid = uuid_lib.UUID(product_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="product_id inválido")
        db_product = crud.get_product(db, product_id=product_uuid, tenant_id=tenant_id)
        if not db_product:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        product_in = schemas.ProductCreate(**payload.model_dump())
        updated = crud.update_product(db, db_product, product_in)
        return schemas.Product.model_validate(updated).model_dump(mode="json")
    finally:
        db.close()

@app.delete("/products/{product_id}")
async def delete_product_route(product_id: str, request: Request):
    import crud, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        try:
            product_uuid = uuid_lib.UUID(product_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="product_id inválido")
        deleted = crud.delete_product(db, product_id=product_uuid, owner_id=tenant_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        return {"ok": True}
    finally:
        db.close()

class OrderItemRequest(BaseModel):
    product_variant_id: str
    quantity: int = Field(gt=0)
    price_at_purchase: float = Field(ge=0)

class OrderCreateRequest(BaseModel):
    total_price: float = Field(ge=0)
    commission_amount: float | None = Field(default=0.0, ge=0)
    commission_rate_snapshot: float | None = Field(default=0.0, ge=0)
    customer_type: str | None = "final"
    customer_name: str
    customer_email: str | None = None
    customer_phone: str | None = None
    customer_city: str | None = None
    shipping_address: str | None = None
    payment_method: str = "cash"
    source: str = "pos"
    seller_name: str | None = None
    items: list[OrderItemRequest] = []

@app.get("/orders")
async def get_orders(request: Request, skip: int = Query(default=0, ge=0), limit: int = Query(default=200, ge=1)):
    import crud, schemas
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        orders = crud.get_orders_by_tenant(db, tenant_id=_tenant_id(user), skip=skip, limit=min(limit, 500))
        return [schemas.Order.model_validate(o).model_dump(mode="json") for o in orders]
    finally:
        db.close()

@app.post("/orders")
async def create_order_route(payload: OrderCreateRequest, request: Request):
    import crud, schemas
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        order_in = schemas.OrderCreate(tenant_id=tenant_id, **payload.model_dump())
        db_order = crud.create_order(db, order=order_in, customer_id=user.id, tenant_id=tenant_id)
        return schemas.Order.model_validate(db_order).model_dump(mode="json")
    finally:
        db.close()

VALID_ORDER_STATUSES = {"pending", "processing", "completed", "cancelled"}

class OrderUpdateRequest(BaseModel):
    status: str

@app.put("/orders/{order_id}")
async def update_order_route(order_id: str, payload: OrderUpdateRequest, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        if payload.status not in VALID_ORDER_STATUSES:
            raise HTTPException(status_code=400, detail=f"status inválido, debe ser uno de: {sorted(VALID_ORDER_STATUSES)}")
        try:
            order_uuid = uuid_lib.UUID(order_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="order_id inválido")
        db_order = db.query(models.Order).filter(
            models.Order.id == order_uuid,
            models.Order.tenant_id == tenant_id,
        ).first()
        if not db_order:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        db_order.status = payload.status
        db.commit()
        return {"id": str(db_order.id), "status": db_order.status}
    finally:
        db.close()

@app.get("/notifications")
async def get_notifications(request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        notifications = db.query(models.Notification).filter(
            models.Notification.tenant_id == _tenant_id(user)
        ).order_by(models.Notification.created_at.desc()).limit(50).all()
        return [
            {
                "id": str(n.id), "title": n.title, "message": n.message,
                "type": n.type, "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            } for n in notifications
        ]
    finally:
        db.close()

class CollectionCreateRequest(BaseModel):
    title: str
    description: str | None = None
    image_url: str | None = None
    status: str = "active"

@app.get("/collections")
async def get_collections(request: Request, skip: int = Query(default=0, ge=0), limit: int = Query(default=200, ge=1)):
    import crud, schemas
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        collections = crud.get_collections_by_owner(db, owner_id=_tenant_id(user), skip=skip, limit=min(limit, 500))
        return [schemas.Collection.model_validate(c).model_dump(mode="json") for c in collections]
    finally:
        db.close()

@app.post("/collections")
async def create_collection_route(payload: CollectionCreateRequest, request: Request):
    import crud, schemas
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        collection_in = schemas.CollectionCreate(**payload.model_dump())
        db_collection = crud.create_collection(db, collection=collection_in, owner_id=_tenant_id(user))
        return schemas.Collection.model_validate(db_collection).model_dump(mode="json")
    finally:
        db.close()

# --- ENDPOINTS PÚBLICOS DE TIENDA (sin auth, para el storefront /shop/[slug]) ---
@app.get("/public/shop/{slug}")
@limiter.limit("30/minute")
async def get_public_shop(request: Request, response: Response, slug: str):
    # Caché en memoria: TTL 60 s (el perfil de tienda cambia poco una vez publicado)
    cached = _cache_get(_shop_cache, slug)
    if cached is not None:
        response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
        return cached
    import crud, schemas
    from database import SessionLocal
    db = SessionLocal()
    try:
        store = crud.get_user_by_slug(db, slug=slug)
        if not store or store.status == "Suspendido":
            raise HTTPException(status_code=404, detail="Tienda no encontrada")
        collections = crud.get_collections_by_owner(db, owner_id=store.id)
        data = {
            "id": str(store.id),
            "owner_id": str(store.id),
            "full_name": store.full_name,
            "shop_slug": store.shop_slug,
            "phone": getattr(store, "phone", None),
            "logo_url": store.logo_url,
            "category": getattr(store, "category", None),
            "hours": getattr(store, "hours", None),
            "social_links": getattr(store, "social_links", None) or {},
            "whatsapp_lines": getattr(store, "whatsapp_lines", None) or [],
            "categories": [schemas.Collection.model_validate(c).model_dump(mode="json") for c in collections],
        }
        _cache_set(_shop_cache, slug, data, 60)
        response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
        return data
    finally:
        db.close()

@app.get("/public/stores/{store_id}/products")
@limiter.limit("30/minute")
async def get_public_store_products(request: Request, response: Response, store_id: str):
    import crud, schemas, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        try:
            store_uuid = uuid_lib.UUID(store_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="store_id inválido")
        products = crud.get_all_products(db, tenant_id=store_uuid, limit=500)
        response.headers["Cache-Control"] = "public, max-age=30, stale-while-revalidate=120"
        return [
            schemas.Product.model_validate(p).model_dump(mode="json")
            for p in products if p.status == "active"
        ]
    finally:
        db.close()

class PublicOrderItemRequest(BaseModel):
    product_variant_id: str
    quantity: int = Field(gt=0)
    price_at_purchase: float = Field(ge=0)

class PublicOrderCreateRequest(BaseModel):
    tenant_id: str
    total_price: float = Field(ge=0)
    customer_name: str = Field(min_length=1)
    customer_email: str | None = None
    customer_phone: str | None = None
    customer_city: str | None = None
    shipping_address: str | None = None
    payment_method: str = "cash"
    source: str = "web"
    items: list[PublicOrderItemRequest] = Field(min_length=1)

@app.post("/public/orders")
@limiter.limit("10/minute")
def create_public_order(request: Request, payload: PublicOrderCreateRequest):
    """Checkout publico del storefront (/shop/[slug]), sin autenticacion."""
    import crud, schemas, models as _m, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        try:
            tenant_uuid = uuid_lib.UUID(payload.tenant_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="tenant_id inválido")

        # CRIT-002: calcular precio desde la DB; ignorar price_at_purchase del cliente
        validated_items: list = []
        for item in payload.items:
            try:
                var_uuid = uuid_lib.UUID(item.product_variant_id)
            except ValueError:
                raise HTTPException(status_code=400, detail="product_variant_id inválido")
            variant = db.query(_m.ProductVariant).filter(
                _m.ProductVariant.id == var_uuid,
            ).first()
            if not variant:
                raise HTTPException(status_code=400, detail="Variante de producto no encontrada")
            product = db.query(_m.Product).filter(
                _m.Product.id == variant.product_id,
                _m.Product.owner_id == tenant_uuid,
            ).first()
            if not product:
                raise HTTPException(status_code=400, detail="Variante no pertenece a esta tienda")
            db_price = variant.price if variant.price and variant.price > 0 else product.price
            validated_items.append(schemas.OrderItemBase(
                product_variant_id=var_uuid,
                quantity=item.quantity,
                price_at_purchase=db_price,  # precio de DB, no del cliente
            ))

        order_in = schemas.OrderCreate(
            tenant_id=tenant_uuid,
            total_price=0,  # crud recalcula el total desde DB en subtotal
            customer_name=payload.customer_name,
            customer_email=payload.customer_email,
            customer_phone=payload.customer_phone,
            customer_city=payload.customer_city,
            shipping_address=payload.shipping_address,
            payment_method=payload.payment_method,
            source=payload.source,
            items=validated_items,
        )
        db_order = crud.create_order(db, order=order_in, customer_id=None, tenant_id=tenant_uuid)
        if payload.customer_email:
            try:
                import email_service as _es, threading
                threading.Thread(
                    target=_es.send_order_confirmation,
                    args=(payload.customer_email, payload.customer_name, str(db_order.id)),
                    daemon=True,
                ).start()
            except Exception:
                pass
        return schemas.Order.model_validate(db_order).model_dump(mode="json")
    except ValueError:
        raise HTTPException(status_code=400, detail="product_variant_id inválido")
    finally:
        db.close()

def _serialize_customer(u) -> dict:
    """Serializacion segura de un cliente: nunca incluye hashed_password ni datos bancarios."""
    return {
        "id": str(u.id),
        "full_name": u.full_name,
        "email": u.email,
        "phone": u.phone,
        "city": u.customer_city,
        "status": u.status,
        "customer_type": u.customer_type,
        "acquisition_channel": u.acquisition_channel,
        "total_spent": u.total_spent or 0.0,
        "loyalty_points": u.loyalty_points or 0,
        "last_purchase_date": u.last_purchase_date.isoformat() if u.last_purchase_date else None,
        "last_purchase_summary": u.last_purchase_summary,
    }

@app.get("/admin/users")
async def get_admin_users(request: Request, skip: int = Query(default=0, ge=0), limit: int = Query(default=200, ge=1)):
    """Lista los clientes (role='cliente') de la tienda del usuario autenticado."""
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        customers = db.query(models.User).filter(
            models.User.owner_id == tenant_id,
            models.User.role == "cliente",
        ).offset(skip).limit(min(limit, 500)).all()
        return [_serialize_customer(c) for c in customers]
    finally:
        db.close()

@app.delete("/admin/users/{user_id}")
@limiter.limit("30/minute")
async def delete_admin_user(user_id: str, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_admin_role(user)  # ALTA-008: solo admin puede eliminar clientes
        tenant_id = _tenant_id(user)
        try:
            target_uuid = uuid_lib.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="user_id inválido")
        target = db.query(models.User).filter(
            models.User.id == target_uuid,
            models.User.owner_id == tenant_id,
        ).first()
        if not target:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        db.delete(target)
        db.commit()
        return {"ok": True}
    finally:
        db.close()

# ── ENVÍOS (tarifas) ──────────────────────────────────────────────────────
class ShippingOptionRequest(BaseModel):
    name: str = Field(min_length=1)
    cost: float = Field(ge=0)
    min_order_total: float | None = None

def _serialize_shipping_option(s):
    return {
        "id": str(s.id),
        "name": s.name,
        "cost": s.cost,
        "min_order_total": s.min_order_total,
        "owner_id": str(s.owner_id) if s.owner_id else None,
    }

@app.get("/shipping")
async def get_shipping_options(request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        options = db.query(models.ShippingOption).filter(models.ShippingOption.owner_id == tenant_id).all()
        return [_serialize_shipping_option(o) for o in options]
    finally:
        db.close()

@app.post("/shipping")
async def create_shipping_option(payload: ShippingOptionRequest, request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        option = models.ShippingOption(name=payload.name, cost=payload.cost, min_order_total=payload.min_order_total, owner_id=tenant_id)
        db.add(option)
        db.commit()
        return _serialize_shipping_option(option)
    finally:
        db.close()

@app.get("/shipping/{shipping_id}")
async def get_shipping_option(shipping_id: str, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        try:
            target_uuid = uuid_lib.UUID(shipping_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="id inválido")
        option = db.query(models.ShippingOption).filter(models.ShippingOption.id == target_uuid, models.ShippingOption.owner_id == tenant_id).first()
        if not option:
            raise HTTPException(status_code=404, detail="Opción de envío no encontrada")
        return _serialize_shipping_option(option)
    finally:
        db.close()

@app.put("/shipping/{shipping_id}")
async def update_shipping_option(shipping_id: str, payload: ShippingOptionRequest, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        try:
            target_uuid = uuid_lib.UUID(shipping_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="id inválido")
        option = db.query(models.ShippingOption).filter(models.ShippingOption.id == target_uuid, models.ShippingOption.owner_id == tenant_id).first()
        if not option:
            raise HTTPException(status_code=404, detail="Opción de envío no encontrada")
        option.name = payload.name
        option.cost = payload.cost
        option.min_order_total = payload.min_order_total
        db.commit()
        return _serialize_shipping_option(option)
    finally:
        db.close()

@app.delete("/shipping/{shipping_id}")
async def delete_shipping_option(shipping_id: str, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        try:
            target_uuid = uuid_lib.UUID(shipping_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="id inválido")
        option = db.query(models.ShippingOption).filter(models.ShippingOption.id == target_uuid, models.ShippingOption.owner_id == tenant_id).first()
        if not option:
            raise HTTPException(status_code=404, detail="Opción de envío no encontrada")
        db.delete(option)
        db.commit()
        return {"ok": True}
    finally:
        db.close()

# ── IMPUESTOS ─────────────────────────────────────────────────────────────
class TaxRateRequest(BaseModel):
    name: str = Field(min_length=1)
    rate: float = Field(ge=0)
    is_default: bool = False

def _serialize_tax_rate(t):
    return {
        "id": str(t.id),
        "name": t.name,
        "rate": t.rate,
        "is_default": bool(t.is_default),
        "owner_id": str(t.owner_id) if t.owner_id else None,
    }

@app.get("/taxes")
async def get_tax_rates(request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        rates = db.query(models.TaxRate).filter(models.TaxRate.owner_id == tenant_id).all()
        return [_serialize_tax_rate(t) for t in rates]
    finally:
        db.close()

@app.post("/taxes")
async def create_tax_rate(payload: TaxRateRequest, request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        if payload.is_default:
            db.query(models.TaxRate).filter(models.TaxRate.owner_id == tenant_id).update({models.TaxRate.is_default: False})
        rate = models.TaxRate(name=payload.name, rate=payload.rate, is_default=payload.is_default, owner_id=tenant_id)
        db.add(rate)
        db.commit()
        return _serialize_tax_rate(rate)
    finally:
        db.close()

@app.get("/taxes/{tax_id}")
async def get_tax_rate(tax_id: str, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        try:
            target_uuid = uuid_lib.UUID(tax_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="id inválido")
        rate = db.query(models.TaxRate).filter(models.TaxRate.id == target_uuid, models.TaxRate.owner_id == tenant_id).first()
        if not rate:
            raise HTTPException(status_code=404, detail="Tasa de impuesto no encontrada")
        return _serialize_tax_rate(rate)
    finally:
        db.close()

@app.put("/taxes/{tax_id}")
async def update_tax_rate(tax_id: str, payload: TaxRateRequest, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        try:
            target_uuid = uuid_lib.UUID(tax_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="id inválido")
        rate = db.query(models.TaxRate).filter(models.TaxRate.id == target_uuid, models.TaxRate.owner_id == tenant_id).first()
        if not rate:
            raise HTTPException(status_code=404, detail="Tasa de impuesto no encontrada")
        if payload.is_default:
            db.query(models.TaxRate).filter(models.TaxRate.owner_id == tenant_id, models.TaxRate.id != target_uuid).update({models.TaxRate.is_default: False})
        rate.name = payload.name
        rate.rate = payload.rate
        rate.is_default = payload.is_default
        db.commit()
        return _serialize_tax_rate(rate)
    finally:
        db.close()

@app.delete("/taxes/{tax_id}")
async def delete_tax_rate(tax_id: str, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        try:
            target_uuid = uuid_lib.UUID(tax_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="id inválido")
        rate = db.query(models.TaxRate).filter(models.TaxRate.id == target_uuid, models.TaxRate.owner_id == tenant_id).first()
        if not rate:
            raise HTTPException(status_code=404, detail="Tasa de impuesto no encontrada")
        db.delete(rate)
        db.commit()
        return {"ok": True}
    finally:
        db.close()

# ── EQUIPO / STAFF (distinto de /admin/users, que lista CLIENTES) ────────
_BASE_ROLE_DEFS = [
    ("admin_tienda", "Administrador"),
    ("editor", "Editor"),
    ("logistica", "Logística"),
    ("vendedor", "Vendedor"),
]

def _log_staff_activity(db, models, tenant_id, actor, action, detail, target_id=None):
    log = models.ActivityLog(
        user_id=actor.id,
        action=action,
        target_id=target_id,
        detail=detail,
        tenant_id=tenant_id,
    )
    db.add(log)
    db.commit()

def _serialize_staff_member(u):
    return {
        "id": str(u.id),
        "full_name": u.full_name or "Usuario",
        "email": u.email,
        "role": u.role,
        "status": getattr(u, "status", None) or "Activo",
        "created_at": u.created_at.isoformat() if getattr(u, "created_at", None) else None,
    }

@app.get("/admin/staff")
async def get_admin_staff(request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        owner = db.query(models.User).filter(models.User.id == tenant_id).first()
        staff = db.query(models.User).filter(
            models.User.owner_id == tenant_id,
            models.User.role != "cliente",
        ).all()
        result = []
        if owner:
            result.append(_serialize_staff_member(owner))
        result.extend(_serialize_staff_member(s) for s in staff)
        return result
    finally:
        db.close()

class StaffCreateRequest(BaseModel):
    email: str
    full_name: str
    password: str
    role: str = "vendedor"
    status: str = "Invitado"

@app.post("/admin/staff")
@limiter.limit("30/minute")
async def create_admin_staff(payload: StaffCreateRequest, request: Request):
    import models, crud, schemas, security
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_admin_role(user)  # ALTA-008: solo admin puede crear miembros de staff
        tenant_id = _tenant_id(user)
        _ALLOWED_STAFF_ROLES = {role_id for role_id, _ in _BASE_ROLE_DEFS}
        if payload.role not in _ALLOWED_STAFF_ROLES:
            raise HTTPException(status_code=400, detail=f"Rol no válido. Opciones: {sorted(_ALLOWED_STAFF_ROLES)}")
        if crud.get_user_by_email(db, email=payload.email):
            raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese correo")
        new_staff = models.User(
            email=payload.email,
            full_name=payload.full_name,
            hashed_password=security.get_password_hash(payload.password),
            role=payload.role,
            status=payload.status,
            owner_id=tenant_id,
        )
        db.add(new_staff)
        db.commit()
        _log_staff_activity(db, models, tenant_id, user, "CREATE_USER", f"Invitó a {payload.full_name} ({payload.email}) como {payload.role}", target_id=str(new_staff.id))
        try:
            import email_service as _es
            inviter_name = getattr(user, "full_name", None) or user.email
            _es.send_staff_invitation(payload.email, payload.full_name, inviter_name)
        except Exception:
            pass
        return _serialize_staff_member(new_staff)
    finally:
        db.close()

class StaffUpdateRequest(BaseModel):
    email: str
    new_role: str | None = None
    full_name: str | None = None
    status: str | None = None

@app.post("/admin/update-user")
async def update_admin_staff(payload: StaffUpdateRequest, request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_admin_role(user)
        tenant_id = _tenant_id(user)
        target = db.query(models.User).filter(
            models.User.email == payload.email,
            models.User.owner_id == tenant_id,
        ).first()
        if not target:
            raise HTTPException(status_code=404, detail="Miembro del staff no encontrado")
        if payload.new_role:
            _ALLOWED_STAFF_ROLES = {role_id for role_id, _ in _BASE_ROLE_DEFS}
            if payload.new_role not in _ALLOWED_STAFF_ROLES:
                raise HTTPException(status_code=400, detail=f"Rol no válido. Opciones: {sorted(_ALLOWED_STAFF_ROLES)}")
            target.role = payload.new_role
        if payload.full_name:
            target.full_name = payload.full_name
        if payload.status:
            target.status = payload.status
        db.commit()
        _log_staff_activity(db, models, tenant_id, user, "UPDATE_USER", f"Actualizó a {target.full_name} ({target.email})", target_id=str(target.id))
        return _serialize_staff_member(target)
    finally:
        db.close()

@app.delete("/admin/staff/{staff_id}")
async def delete_admin_staff(staff_id: str, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_admin_role(user)
        tenant_id = _tenant_id(user)
        try:
            target_uuid = uuid_lib.UUID(staff_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="id inválido")
        target = db.query(models.User).filter(
            models.User.id == target_uuid,
            models.User.owner_id == tenant_id,
        ).first()
        if not target:
            raise HTTPException(status_code=404, detail="Miembro del staff no encontrado")
        name, email = target.full_name, target.email
        db.delete(target)
        db.commit()
        _log_staff_activity(db, models, tenant_id, user, "DELETE_USER", f"Eliminó a {name} ({email})", target_id=staff_id)
        return {"ok": True}
    finally:
        db.close()

@app.get("/admin/logs")
async def get_admin_logs(request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_admin_role(user)  # ALTA-008: solo admin puede ver logs de actividad
        tenant_id = _tenant_id(user)
        logs = db.query(models.ActivityLog).filter(models.ActivityLog.tenant_id == tenant_id).order_by(models.ActivityLog.created_at.desc()).limit(100).all()
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
    finally:
        db.close()

# ── ROLES Y PERMISOS ──────────────────────────────────────────────────────
def _serialize_custom_role(r):
    return {"id": r.name, "name": r.name, "permissions": r.permissions or {}, "owner_id": str(r.owner_id) if r.owner_id else None}

@app.get("/admin/roles")
async def get_admin_roles(request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        roles = db.query(models.CustomRole).filter(models.CustomRole.owner_id == tenant_id).all()
        if not roles:
            for role_id, _label in _BASE_ROLE_DEFS:
                role = models.CustomRole(name=role_id, permissions={}, owner_id=tenant_id)
                db.add(role)
            db.commit()
            roles = db.query(models.CustomRole).filter(models.CustomRole.owner_id == tenant_id).all()
        return [_serialize_custom_role(r) for r in roles]
    finally:
        db.close()

class RoleUpdateRequest(BaseModel):
    name: str
    permissions: dict = {}

@app.put("/admin/roles/{role_name}")
async def update_admin_role(role_name: str, payload: RoleUpdateRequest, request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_admin_role(user)  # ALTA-008: solo admin puede modificar permisos de roles
        tenant_id = _tenant_id(user)
        role = db.query(models.CustomRole).filter(models.CustomRole.owner_id == tenant_id, models.CustomRole.name == role_name).first()
        if not role:
            role = models.CustomRole(name=role_name, permissions=payload.permissions, owner_id=tenant_id)
            db.add(role)
        else:
            role.permissions = payload.permissions
        db.commit()
        return _serialize_custom_role(role)
    finally:
        db.close()

class ExpenseCreateRequest(BaseModel):
    description: str = Field(min_length=1)
    amount: float = Field(gt=0)
    due_date: str | None = None
    status: str = "pending"
    category: str = "diario"
    invoice_num: str | None = None
    items: list | None = None
    description_detail: str | None = None

def _serialize_expense(e) -> dict:
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

async def _get_expenses(request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        expenses = db.query(models.Expense).filter(models.Expense.tenant_id == tenant_id).all()
        return [_serialize_expense(e) for e in expenses]
    finally:
        db.close()

@app.get("/expenses")
async def get_expenses(request: Request):
    return await _get_expenses(request)

@app.get("/finances/expenses")
async def get_finances_expenses(request: Request):
    return await _get_expenses(request)

@app.post("/expenses")
async def create_expense(payload: ExpenseCreateRequest, request: Request):
    import models, uuid as uuid_lib
    from datetime import datetime
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        due_date = datetime.fromisoformat(payload.due_date) if payload.due_date else None
        db_expense = models.Expense(
            id=uuid_lib.uuid4(),
            description=payload.description,
            amount=payload.amount,
            due_date=due_date,
            status=payload.status,
            category=payload.category,
            tenant_id=tenant_id,
            invoice_num=payload.invoice_num,
            items=payload.items,
            description_detail=payload.description_detail,
        )
        db.add(db_expense)
        db.commit()
        return _serialize_expense(db_expense)
    finally:
        db.close()

# Campos del perfil de tienda que el usuario puede editar desde Settings General
PROFILE_EDITABLE_FIELDS = {
    "full_name", "logo_url", "category", "story", "shop_slug",
    "email", "phone", "address", "customer_city", "country", "hours",
    "website", "nit", "tax_regime", "legal_rep", "social_links",
}

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

@app.put("/admin/update-profile")
async def update_profile(payload: UpdateProfileRequest, request: Request):
    import crud
    import security
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        update_data = payload.model_dump(exclude_unset=True)
        if update_data.get("shop_slug") and update_data["shop_slug"] != user.shop_slug:
            existing = crud.get_user_by_slug(db, slug=update_data["shop_slug"])
            if existing and existing.id != user.id:
                raise HTTPException(status_code=400, detail="Esa URL de tienda ya está en uso, elige otra")
        email_changed = update_data.get("email") and update_data["email"] != user.email
        if email_changed:
            existing_email = crud.get_user_by_email(db, email=update_data["email"])
            if existing_email and existing_email.id != user.id:
                raise HTTPException(status_code=400, detail="Ese correo ya está en uso por otra cuenta")
        for key, value in update_data.items():
            if key in PROFILE_EDITABLE_FIELDS:
                setattr(user, key, value)
        db.commit()
        if user.shop_slug:
            _shop_cache.pop(user.shop_slug, None)
        result: dict = {"ok": True}
        if email_changed:
            # El token de sesion usa el email como identificador (sub); si cambia,
            # el token viejo deja de resolver a ningun usuario y la app fuerza un
            # logout automatico. Emitimos uno nuevo para que la sesion siga viva.
            result["access_token"] = security.create_access_token(data={"sub": user.email})
        return result
    finally:
        db.close()

@app.post("/onboarding/complete")
async def complete_onboarding(request: Request):
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        user.onboarding_completed = True
        db.commit()
        return {"ok": True}
    finally:
        db.close()

@app.post("/admin/upload-image")
async def upload_image(request: Request, file: UploadFile = File(...)):
    import s3_service
    from database import SessionLocal
    db = SessionLocal()
    try:
        await _authenticate(request, db)
    finally:
        db.close()

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

    contents = await file.read()

    _IMG_MAGIC = [b'\xff\xd8\xff', b'\x89PNG\r\n\x1a\n', b'GIF87a', b'GIF89a', b'RIFF', b'WEBP']
    if not any(contents[:8].startswith(sig) for sig in _IMG_MAGIC):
        raise HTTPException(status_code=400, detail="El archivo no es una imagen válida")

    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen no puede superar 5MB")

    url = s3_service.upload_file_and_get_public_url(contents, file.content_type, file.filename or "image")
    if not url:
        raise HTTPException(
            status_code=503,
            detail="El almacenamiento de imágenes no está configurado (faltan SUPABASE_S3_ENDPOINT / S3_BUCKET_NAME).",
        )
    return {"url": url}

def _require_super_admin(user) -> None:
    if not (getattr(user, "is_global_staff", False) or user.role == "super_admin"):
        raise HTTPException(status_code=403, detail="No autorizado")

def _require_admin_role(user) -> None:
    """ALTA-008: Verifica que el usuario autenticado tenga rol administrativo en su tienda.
    Endpoints destructivos de /admin/* deben llamar esta función tras _authenticate."""
    allowed_roles = {"admin_tienda", "ADMIN", "SUPER_ADMIN"}
    if user.role not in allowed_roles and not getattr(user, "is_global_staff", False):
        raise HTTPException(status_code=403, detail="Se requiere rol administrador")

@app.get("/super-admin/stats")
async def get_super_admin_stats(request: Request):
    import models
    from sqlalchemy import func
    from datetime import datetime
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)

        # Tiendas raiz: admin_tienda sin owner_id (no son sub-cuentas ni clientes)
        companies_q = db.query(models.User).filter(
            models.User.role == "admin_tienda",
            models.User.owner_id.is_(None),
        )
        total_companies = companies_q.count()
        active_companies = companies_q.filter(models.User.status.in_(["Activo", "active"])).count()

        total_users = db.query(models.User).count()
        total_orders = db.query(models.Order).count()
        total_revenue = db.query(func.coalesce(func.sum(models.Order.total_price), 0.0)).scalar() or 0.0
        total_commission = db.query(func.coalesce(func.sum(models.Order.commission_amount), 0.0)).scalar() or 0.0

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        today_start = datetime(now.year, now.month, now.day)
        month_start = datetime(now.year, now.month, 1)

        commission_today = db.query(func.coalesce(func.sum(models.Order.commission_amount), 0.0)).filter(
            models.Order.created_at >= today_start
        ).scalar() or 0.0
        commission_month = db.query(func.coalesce(func.sum(models.Order.commission_amount), 0.0)).filter(
            models.Order.created_at >= month_start
        ).scalar() or 0.0
        revenue_today = db.query(func.coalesce(func.sum(models.Order.total_price), 0.0)).filter(
            models.Order.created_at >= today_start
        ).scalar() or 0.0
        revenue_month = db.query(func.coalesce(func.sum(models.Order.total_price), 0.0)).filter(
            models.Order.created_at >= month_start
        ).scalar() or 0.0

        return {
            "total_companies": total_companies,
            "active_companies": active_companies,
            "total_users": total_users,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "total_commission": total_commission,
            "commission_today": commission_today,
            "commission_month": commission_month,
            "revenue_today": revenue_today,
            "revenue_month": revenue_month,
        }
    finally:
        db.close()

@app.get("/super-admin/companies")
async def get_super_admin_companies(request: Request):
    import models
    from sqlalchemy import func
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)

        companies = db.query(models.User).filter(
            models.User.role == "admin_tienda",
            models.User.owner_id.is_(None),
        ).all()

        result = []
        for c in companies:
            total_sales = db.query(func.coalesce(func.sum(models.Order.total_price), 0.0)).filter(
                models.Order.tenant_id == c.id
            ).scalar() or 0.0
            total_commission = db.query(func.coalesce(func.sum(models.Order.commission_amount), 0.0)).filter(
                models.Order.tenant_id == c.id
            ).scalar() or 0.0
            total_orders = db.query(models.Order).filter(models.Order.tenant_id == c.id).count()
            total_products = db.query(models.Product).filter(models.Product.owner_id == c.id).count()

            result.append({
                "id": str(c.id),
                "full_name": c.full_name,
                "email": c.email,
                "status": c.status,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "phone": c.phone,
                "city": c.customer_city,
                "shop_slug": c.shop_slug,
                "plan": {"name": c.plan.name, "price": c.plan.monthly_fee} if c.plan else None,
                "stats": {
                    "total_sales": total_sales,
                    "total_products": total_products,
                    "total_orders": total_orders,
                    "total_commission": total_commission,
                },
            })
        return result
    finally:
        db.close()

@app.put("/super-admin/companies/{company_id}/suspend")
async def toggle_suspend_company(company_id: str, request: Request):
    """Suspende o reactiva una tienda. Reversible: no borra ningun dato."""
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)
        try:
            target_uuid = uuid_lib.UUID(company_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="company_id inválido")
        company = db.query(models.User).filter(
            models.User.id == target_uuid,
            models.User.role == "admin_tienda",
            models.User.owner_id.is_(None),
        ).first()
        if not company:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        company.status = "Activo" if company.status == "Suspendido" else "Suspendido"
        db.commit()
        if company.shop_slug:
            _shop_cache.pop(company.shop_slug, None)
        return {"id": str(company.id), "status": company.status}
    finally:
        db.close()

@app.delete("/super-admin/companies/{company_id}")
@limiter.limit("30/minute")
async def delete_company_permanently(company_id: str, request: Request):
    """Elimina una tienda y TODOS sus datos asociados. No reversible."""
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)
        try:
            target_uuid = uuid_lib.UUID(company_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="company_id inválido")
        company = db.query(models.User).filter(
            models.User.id == target_uuid,
            models.User.role == "admin_tienda",
            models.User.owner_id.is_(None),
        ).first()
        if not company:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")

        try:
            # IDs y emails de cuentas dependientes (staff + clientes de esta tienda)
            sub_users = db.query(models.User.id, models.User.email).filter(models.User.owner_id == target_uuid).all()
            sub_user_ids = [u.id for u in sub_users]
            all_user_ids = [target_uuid] + sub_user_ids

            # Recolectar emails ANTES de borrar para limpiar auth.users después
            root_email = db.query(models.User.email).filter(models.User.id == target_uuid).scalar()
            emails_to_purge = [e for e in ([root_email] + [u.email for u in sub_users]) if e]

            order_ids = [o.id for o in db.query(models.Order.id).filter(models.Order.tenant_id == target_uuid).all()]
            product_ids = [p.id for p in db.query(models.Product.id).filter(models.Product.owner_id == target_uuid).all()]
            assistant_ids = [a.id for a in db.query(models.AIAssistant.id).filter(models.AIAssistant.owner_id == target_uuid).all()]
            seller_ids = [s.id for s in db.query(models.Seller.id).filter(models.Seller.tenant_id == target_uuid).all()]

            if order_ids:
                db.query(models.OrderItem).filter(models.OrderItem.order_id.in_(order_ids)).delete(synchronize_session=False)
            if product_ids:
                db.query(models.ProductVariant).filter(models.ProductVariant.product_id.in_(product_ids)).delete(synchronize_session=False)
            if assistant_ids:
                db.query(models.AIAssistantLog).filter(models.AIAssistantLog.assistant_id.in_(assistant_ids)).delete(synchronize_session=False)

            # Evitar violar la FK auto-referenciada referred_by_id
            db.query(models.User).filter(models.User.referred_by_id.in_(all_user_ids)).update(
                {models.User.referred_by_id: None}, synchronize_session=False
            )

            db.query(models.PayrollEmployee).filter(models.PayrollEmployee.tenant_id == target_uuid).delete(synchronize_session=False)
            db.query(models.Order).filter(models.Order.tenant_id == target_uuid).delete(synchronize_session=False)
            db.query(models.Product).filter(models.Product.owner_id == target_uuid).delete(synchronize_session=False)
            db.query(models.AIAssistant).filter(models.AIAssistant.owner_id == target_uuid).delete(synchronize_session=False)
            db.query(models.Shipment).filter(models.Shipment.tenant_id == target_uuid).delete(synchronize_session=False)
            db.query(models.PurchaseOrder).filter(models.PurchaseOrder.tenant_id == target_uuid).delete(synchronize_session=False)
            db.query(models.Provider).filter(models.Provider.tenant_id == target_uuid).delete(synchronize_session=False)
            db.query(models.Expense).filter(models.Expense.tenant_id == target_uuid).delete(synchronize_session=False)
            db.query(models.Receivable).filter(models.Receivable.tenant_id == target_uuid).delete(synchronize_session=False)
            db.query(models.Income).filter(models.Income.tenant_id == target_uuid).delete(synchronize_session=False)
            if seller_ids:
                db.query(models.Seller).filter(models.Seller.id.in_(seller_ids)).delete(synchronize_session=False)
            db.query(models.Page).filter(models.Page.owner_id == target_uuid).delete(synchronize_session=False)
            db.query(models.TaxRate).filter(models.TaxRate.owner_id == target_uuid).delete(synchronize_session=False)
            db.query(models.ShippingOption).filter(models.ShippingOption.owner_id == target_uuid).delete(synchronize_session=False)
            db.query(models.Collection).filter(models.Collection.owner_id == target_uuid).delete(synchronize_session=False)
            db.query(models.CustomRole).filter(models.CustomRole.owner_id == target_uuid).delete(synchronize_session=False)
            db.query(models.ActivityLog).filter(models.ActivityLog.tenant_id == target_uuid).delete(synchronize_session=False)
            db.query(models.Notification).filter(models.Notification.tenant_id == target_uuid).delete(synchronize_session=False)
            db.query(models.ShopPage).filter(models.ShopPage.tenant_id == target_uuid).delete(synchronize_session=False)
            db.query(models.SupportTicket).filter(models.SupportTicket.tenant_id == target_uuid).delete(synchronize_session=False)
            db.query(models.StoreMessage).filter(models.StoreMessage.tenant_id == target_uuid).delete(synchronize_session=False)
            db.query(models.ChannelConnection).filter(models.ChannelConnection.user_id.in_(all_user_ids)).delete(synchronize_session=False)

            # Staff y clientes de esta tienda (cuentas hijas), y por ultimo la tienda misma
            db.query(models.User).filter(models.User.owner_id == target_uuid).delete(synchronize_session=False)
            db.query(models.User).filter(models.User.id == target_uuid).delete(synchronize_session=False)

            db.commit()

            # Limpiar auth.users para que el email quede libre para re-registro
            if emails_to_purge:
                from sqlalchemy import text as _text
                try:
                    for _email in emails_to_purge:
                        db.execute(_text("DELETE FROM auth.users WHERE email = :email"), {"email": _email})
                    db.commit()
                except Exception:
                    pass  # best-effort: si falla permisos, no bloquea la respuesta

        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="No se pudo eliminar la empresa por completo")

        return {"ok": True}
    finally:
        db.close()

def _last_n_months(n: int = 12):
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    year, month = now.year, now.month
    out = []
    for _ in range(n):
        out.append((year, month))
        month -= 1
        if month == 0:
            month, year = 12, year - 1
    return list(reversed(out))

_MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

@app.get("/super-admin/treasury")
@limiter.limit("30/minute")
async def get_super_admin_treasury(request: Request):
    """Tesoreria global: ingresos/comision por mes, ranking de tiendas, ultimas transacciones."""
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)

        orders = db.query(models.Order).order_by(models.Order.created_at.desc()).all()
        tenants = {
            t.id: t for t in db.query(models.User).filter(
                models.User.role == "admin_tienda", models.User.owner_id.is_(None)
            ).all()
        }

        # --- Serie mensual (ultimos 12 meses) ---
        months = _last_n_months(12)
        buckets = {ym: {"rev": 0.0, "com": 0.0, "orders": 0} for ym in months}
        for o in orders:
            if not o.created_at:
                continue
            ym = (o.created_at.year, o.created_at.month)
            if ym in buckets:
                buckets[ym]["rev"] += o.total_price or 0.0
                buckets[ym]["com"] += o.commission_amount or 0.0
                buckets[ym]["orders"] += 1
        monthly = [
            {"month": _MONTH_LABELS[m - 1], "rev": buckets[(y, m)]["rev"], "com": buckets[(y, m)]["com"], "orders": buckets[(y, m)]["orders"]}
            for (y, m) in months
        ]

        # --- Ranking de tiendas por ingresos ---
        per_tenant: dict = {}
        for o in orders:
            if not o.tenant_id:
                continue
            entry = per_tenant.setdefault(o.tenant_id, {"rev": 0.0, "orders": 0})
            entry["rev"] += o.total_price or 0.0
            entry["orders"] += 1
        total_rev_all = sum(e["rev"] for e in per_tenant.values()) or 1.0
        companies_ranking = []
        for tenant_id, e in per_tenant.items():
            t = tenants.get(tenant_id)
            companies_ranking.append({
                "name": t.full_name if t else "Tienda eliminada",
                "rev": e["rev"],
                "orders": e["orders"],
                "plan": t.plan.name if (t and t.plan) else "Básico",
                "pct": round((e["rev"] / total_rev_all) * 100),
            })
        companies_ranking.sort(key=lambda c: c["rev"], reverse=True)

        # --- Ultimas transacciones ---
        transactions = []
        for o in orders[:10]:
            t = tenants.get(o.tenant_id)
            transactions.append({
                "id": f"TXN-{str(o.id)[:8].upper()}",
                "company": t.full_name if t else "Tienda eliminada",
                "amount": o.total_price or 0.0,
                "date": o.created_at.isoformat() if o.created_at else None,
            })

        return {"monthly": monthly, "companies": companies_ranking[:10], "transactions": transactions}
    finally:
        db.close()

_SECTOR_COLORS = ["#00f2ff", "#7c3aed", "#10b981", "#f59e0b", "#6b7280", "#ec4899", "#3b82f6"]

@app.get("/super-admin/reports")
async def get_super_admin_reports(request: Request, period: str = "mes"):
    """Analitica global: KPIs por periodo, top empresas, sectores, actividad por hora."""
    import models
    from datetime import datetime, timedelta
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        span_days = {"dia": 1, "semana": 7, "mes": 30, "año": 365}.get(period, 30)
        start = now - timedelta(days=span_days)
        prev_start = now - timedelta(days=span_days * 2)

        orders = db.query(models.Order).filter(models.Order.created_at >= start).all()
        prev_orders = db.query(models.Order).filter(
            models.Order.created_at >= prev_start, models.Order.created_at < start
        ).all()
        tenants = {
            t.id: t for t in db.query(models.User).filter(
                models.User.role == "admin_tienda", models.User.owner_id.is_(None)
            ).all()
        }

        rev = sum(o.total_price or 0.0 for o in orders)
        com = sum(o.commission_amount or 0.0 for o in orders)
        prev_rev = sum(o.total_price or 0.0 for o in prev_orders)
        delta = round(((rev - prev_rev) / prev_rev) * 100) if prev_rev else 0

        new_companies = db.query(models.User).filter(
            models.User.role == "admin_tienda", models.User.owner_id.is_(None),
            models.User.created_at >= start,
        ).count()
        new_users = len({o.customer_email for o in orders if o.customer_email})

        # --- Top empresas por ingresos en el periodo ---
        per_tenant: dict = {}
        for o in orders:
            if not o.tenant_id:
                continue
            entry = per_tenant.setdefault(o.tenant_id, 0.0)
            per_tenant[o.tenant_id] = entry + (o.total_price or 0.0)
        total_rev = sum(per_tenant.values()) or 1.0
        top = []
        for tenant_id, tenant_rev in per_tenant.items():
            t = tenants.get(tenant_id)
            top.append({
                "name": t.full_name if t else "Tienda eliminada",
                "rev": tenant_rev,
                "pct": round((tenant_rev / total_rev) * 100),
                "plan": t.plan.name if (t and t.plan) else "Básico",
            })
        top.sort(key=lambda c: c["rev"], reverse=True)
        top = top[:6]

        # --- Sectores (categoria de tienda) ponderado por ingresos ---
        per_sector: dict = {}
        for o in orders:
            t = tenants.get(o.tenant_id)
            sector = (t.category if t and t.category else "Otros")
            per_sector[sector] = per_sector.get(sector, 0.0) + (o.total_price or 0.0)
        sectors = []
        for i, (label, sector_rev) in enumerate(sorted(per_sector.items(), key=lambda x: x[1], reverse=True)):
            sectors.append({
                "label": label,
                "pct": round((sector_rev / total_rev) * 100),
                "color": _SECTOR_COLORS[i % len(_SECTOR_COLORS)],
            })

        # --- Actividad por hora (24h, normalizada 0-1) ---
        hour_counts = [0] * 24
        for o in orders:
            if o.created_at:
                hour_counts[o.created_at.hour] += 1
        max_hour = max(hour_counts) or 1
        activity = [{"h": h, "v": round(c / max_hour, 3)} for h, c in enumerate(hour_counts)]

        return {
            "kpis": {"rev": rev, "com": com, "orders": len(orders), "users": new_users, "companies": new_companies, "delta": delta},
            "top": top,
            "sectors": sectors,
            "activity": activity,
        }
    finally:
        db.close()

@app.get("/super-admin/users")
@limiter.limit("30/minute")
async def get_super_admin_users(
    request: Request,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
):
    """Lista global de personas en el ecosistema: staff, dueños de tienda, vendedores y clientes."""
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)

        # MED-001: cargar tenants por separado (dataset pequeño, necesario para lookups)
        tenants_all = db.query(models.User).filter(
            models.User.role == "admin_tienda",
            models.User.owner_id.is_(None),
        ).all()
        tenants_by_id = {u.id: u for u in tenants_all}
        # MED-001: paginar la consulta principal
        all_users = db.query(models.User).offset(skip).limit(limit).all()

        result = []
        for u in all_users:
            is_staff = bool(u.is_global_staff) or u.role == "super_admin"
            if is_staff:
                role_label, company = "SUPER_ADMIN", "Bayup"
            elif u.role == "admin_tienda" and u.owner_id is None:
                role_label, company = "admin_tienda", u.full_name
            elif u.role == "cliente":
                role_label = "cliente"
                owner = tenants_by_id.get(u.owner_id)
                company = owner.full_name if owner else None
            else:
                continue
            result.append({
                "id": str(u.id),
                "full_name": u.full_name,
                "email": u.email,
                "role": role_label,
                "status": u.status or "Activo",
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "company": company,
            })

        sellers = db.query(models.Seller).all()
        for s in sellers:
            owner = tenants_by_id.get(s.tenant_id)
            result.append({
                "id": str(s.id),
                "full_name": s.name,
                "email": None,
                "role": "vendedor",
                "status": "Activo",
                "created_at": None,
                "company": owner.full_name if owner else None,
            })

        return result
    finally:
        db.close()

def _serialize_ticket(t, tenant=None):
    return {
        "id": f"TKT-{str(t.id)[:8].upper()}",
        "title": t.title,
        "company": tenant.full_name if tenant else "Tienda eliminada",
        "userEmail": tenant.email if tenant else None,
        "priority": t.priority,
        "status": t.status,
        "category": t.category,
        "createdAt": t.created_at.isoformat() if t.created_at else None,
        "messages": t.messages or [],
    }

def _find_ticket_by_short_id(db, models, short_id: str):
    """MED-002: usa CAST en lugar de cargar toda la tabla en memoria."""
    from sqlalchemy import cast, String
    target = short_id.replace("TKT-", "").lower()
    return db.query(models.SupportTicket).filter(
        cast(models.SupportTicket.id, String).like(f"{target}%")
    ).first()

@app.get("/super-admin/support/tickets")
async def get_super_admin_tickets(request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)
        tickets = db.query(models.SupportTicket).order_by(models.SupportTicket.created_at.desc()).all()
        tenants = {t.id: t for t in db.query(models.User).all()}
        return [_serialize_ticket(t, tenants.get(t.tenant_id)) for t in tickets]
    finally:
        db.close()

@app.post("/super-admin/support/tickets/{ticket_id}/reply")
async def reply_super_admin_ticket(ticket_id: str, payload: dict, request: Request):
    import models
    from datetime import datetime
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)
        ticket = _find_ticket_by_short_id(db, models, ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket no encontrado")
        text = (payload.get("text") or "").strip()
        if not text:
            raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")
        msgs = list(ticket.messages or [])
        msgs.append({"sender": "soporte", "text": text, "time": datetime.now(timezone.utc).strftime("%H:%M")})
        ticket.messages = msgs
        if ticket.status == "Abierto":
            ticket.status = "En proceso"
        db.commit()
        tenant = db.query(models.User).filter(models.User.id == ticket.tenant_id).first()
        return _serialize_ticket(ticket, tenant)
    finally:
        db.close()

@app.post("/super-admin/support/tickets/{ticket_id}/resolve")
async def resolve_super_admin_ticket(ticket_id: str, request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)
        ticket = _find_ticket_by_short_id(db, models, ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket no encontrado")
        ticket.status = "Resuelto"
        db.commit()
        tenant = db.query(models.User).filter(models.User.id == ticket.tenant_id).first()
        return _serialize_ticket(ticket, tenant)
    finally:
        db.close()

@app.post("/support/tickets")
async def create_support_ticket(payload: dict, request: Request):
    """Crea un ticket de soporte para la tienda autenticada."""
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        title = (payload.get("title") or "").strip()
        if not title:
            raise HTTPException(status_code=400, detail="El título es obligatorio")
        text = (payload.get("text") or "").strip()
        from datetime import datetime
        ticket = models.SupportTicket(
            tenant_id=tenant_id,
            title=title,
            category=payload.get("category") or "General",
            priority=payload.get("priority") or "Media",
            status="Abierto",
            messages=[{"sender": "usuario", "text": text, "time": datetime.now(timezone.utc).strftime("%H:%M")}] if text else [],
        )
        db.add(ticket)
        db.commit()
        return _serialize_ticket(ticket, db.query(models.User).filter(models.User.id == tenant_id).first())
    finally:
        db.close()

@app.get("/support/tickets")
async def get_my_support_tickets(request: Request):
    """Lista los tickets de soporte de la tienda autenticada."""
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        tickets = db.query(models.SupportTicket).filter(
            models.SupportTicket.tenant_id == tenant_id
        ).order_by(models.SupportTicket.created_at.desc()).all()
        tenant = db.query(models.User).filter(models.User.id == tenant_id).first()
        return [_serialize_ticket(t, tenant) for t in tickets]
    finally:
        db.close()

@app.post("/support/tickets/{ticket_id}/reply")
async def reply_my_support_ticket(ticket_id: str, payload: dict, request: Request):
    """Permite a la tienda autenticada responder en su propio ticket."""
    import models
    from datetime import datetime
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        ticket = _find_ticket_by_short_id(db, models, ticket_id)
        if not ticket or ticket.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="Ticket no encontrado")
        text = (payload.get("text") or "").strip()
        if not text:
            raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")
        msgs = list(ticket.messages or [])
        msgs.append({"sender": "usuario", "text": text, "time": datetime.now(timezone.utc).strftime("%H:%M")})
        ticket.messages = msgs
        if ticket.status == "Resuelto":
            ticket.status = "Abierto"
        db.commit()
        tenant = db.query(models.User).filter(models.User.id == tenant_id).first()
        return _serialize_ticket(ticket, tenant)
    finally:
        db.close()

def _serialize_template(t, include_html: bool = False):
    d = {
        "id": str(t.id),
        "name": t.name,
        "category": t.category or "General",
        "description": t.description or "",
        "tags": t.tags or [],
        "uses": t.uses or 0,
        "rating": t.rating or 0.0,
        "isPremium": bool(t.is_premium),
        "isActive": bool(t.is_active),
        "color": t.color or "#0f1a1a",
        "preview_url": t.preview_url,
        "schema_data": t.schema_data,
        "template_type": getattr(t, "template_type", "schema") or "schema",
        "html_pages": list((getattr(t, "html_pages", None) or {}).keys()) if not include_html else (getattr(t, "html_pages", None) or {}),
    }
    return d

@app.get("/super-admin/web-templates")
async def get_super_admin_web_templates(request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)
        templates = db.query(models.WebTemplate).order_by(models.WebTemplate.created_at.desc()).all()
        return [_serialize_template(t) for t in templates]
    finally:
        db.close()

@app.post("/super-admin/web-templates")
async def create_super_admin_web_template(payload: dict, request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)
        name = (payload.get("name") or "").strip()
        if not name:
            raise HTTPException(status_code=400, detail="El nombre es obligatorio")
        tags = payload.get("tags")
        if isinstance(tags, str):
            tags = [s.strip() for s in tags.split(",") if s.strip()]
        template_type = payload.get("template_type") or "schema"
        if template_type not in ("schema", "html"):
            raise HTTPException(status_code=400, detail="template_type debe ser 'schema' o 'html'")
        html_pages = payload.get("html_pages") or None
        if template_type == "html" and not html_pages:
            raise HTTPException(status_code=400, detail="Se requiere al menos la página 'home' para plantillas HTML")
        template = models.WebTemplate(
            name=name,
            category=payload.get("category") or "General",
            description=payload.get("description") or "",
            tags=tags or [],
            is_active=False,
            is_premium=False,
            color=payload.get("color") or "#0f1a1a",
            template_type=template_type,
            html_pages=html_pages,
        )
        db.add(template)
        db.commit()
        _templates_cache.clear()
        return _serialize_template(template)
    finally:
        db.close()

@app.get("/super-admin/web-templates/{template_id}")
async def get_super_admin_web_template(template_id: str, request: Request):
    """Devuelve una plantilla completa con html_pages para previsualización."""
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)
        try:
            target_uuid = uuid_lib.UUID(template_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="template_id inválido")
        template = db.query(models.WebTemplate).filter(models.WebTemplate.id == target_uuid).first()
        if not template:
            raise HTTPException(status_code=404, detail="Plantilla no encontrada")
        return _serialize_template(template, include_html=True)
    finally:
        db.close()

@app.post("/super-admin/web-templates/{template_id}/preview-token")
async def generate_preview_token(template_id: str, request: Request):
    """Genera un token opaco de corta vida (5 min) para acceder al live-preview
    sin exponer el JWT completo en la URL (ALTA-004)."""
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)
        # Verificar que la plantilla exista antes de emitir el token
        try:
            target_uuid = uuid_lib.UUID(template_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="template_id inválido")
        template = db.query(models.WebTemplate).filter(models.WebTemplate.id == target_uuid).first()
        if not template:
            raise HTTPException(status_code=404, detail="Plantilla no encontrada")
        preview_tok = _create_preview_token(user.email)
        return {"preview_token": preview_tok, "expires_in": 300}
    finally:
        db.close()

@app.get("/super-admin/web-templates/{template_id}/live-preview/{page_key}", response_class=HTMLResponse)
async def live_preview_template_page(
    template_id: str,
    page_key: str,
    request: Request,
    token: str = Query(None),           # legacy: JWT en query param (deprecado, ALTA-004)
    preview_token: str = Query(None),   # nuevo: token opaco de corta vida
):
    """Preview navegable de plantilla HTML con SDK de demostración y datos mock."""
    import models, uuid as uuid_lib, security as sec_mod
    from database import SessionLocal
    db = SessionLocal()
    try:
        if preview_token:
            # ALTA-004: token opaco de corta vida — no expone JWT en URL ni en logs
            email = _validate_preview_token(preview_token)
            if not email:
                raise HTTPException(status_code=401, detail="Preview token inválido o expirado")
            user = db.query(models.User).filter(models.User.email == email).first()
            _require_super_admin(user)
        elif token:
            # Soporte legacy: JWT en URL (deprecado — migrar a /preview-token)
            logger.warning("JWT expuesto en URL de preview para template %s — migrar a preview_token", template_id)
            try:
                user = await sec_mod.get_current_user(request=request, token=token, db=db)
            except Exception:
                raise HTTPException(status_code=401, detail="Token inválido o expirado")
            _require_super_admin(user)
        else:
            # Sin token en URL: autenticar vía cookie httpOnly o Authorization header
            user = await _authenticate(request, db)
            _require_super_admin(user)
        try:
            target_uuid = uuid_lib.UUID(template_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="template_id inválido")
        template = db.query(models.WebTemplate).filter(models.WebTemplate.id == target_uuid).first()
        if not template or getattr(template, "template_type", "schema") != "html":
            raise HTTPException(status_code=404, detail="Plantilla HTML no encontrada")
        html_pages = getattr(template, "html_pages", None) or {}
        html = html_pages.get(page_key) or html_pages.get("home")
        if not html:
            raise HTTPException(status_code=404, detail=f"Página '{page_key}' no encontrada")
        base_url = str(request.base_url).rstrip("/")
        tok = token or ""
        preview_sdk = _BAYUP_PREVIEW_SDK \
            .replace("__TPLID__", template_id) \
            .replace("__TOK__", tok) \
            .replace("__BASE__", base_url)
        if "</head>" in html:
            html = html.replace("</head>", preview_sdk + "</head>", 1)
        else:
            html = preview_sdk + html
        return HTMLResponse(content=html)
    finally:
        db.close()

@app.put("/super-admin/web-templates/{template_id}/toggle")
async def toggle_super_admin_web_template(template_id: str, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)
        try:
            target_uuid = uuid_lib.UUID(template_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="template_id inválido")
        template = db.query(models.WebTemplate).filter(models.WebTemplate.id == target_uuid).first()
        if not template:
            raise HTTPException(status_code=404, detail="Plantilla no encontrada")
        template.is_active = not template.is_active
        db.commit()
        _templates_cache.clear()  # invalidar caché de /web-templates
        return _serialize_template(template)
    finally:
        db.close()

@app.delete("/super-admin/web-templates/{template_id}")
async def delete_super_admin_web_template(template_id: str, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)
        try:
            target_uuid = uuid_lib.UUID(template_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="template_id inválido")
        template = db.query(models.WebTemplate).filter(models.WebTemplate.id == target_uuid).first()
        if not template:
            raise HTTPException(status_code=404, detail="Plantilla no encontrada")
        db.delete(template)
        db.commit()
        _templates_cache.clear()  # invalidar caché de /web-templates
        return {"ok": True}
    finally:
        db.close()


@app.get("/super-admin/web-templates/{template_id}/preview/{page_key}", response_class=HTMLResponse)
async def preview_template_html_page(template_id: str, page_key: str, request: Request):
    """Devuelve el HTML crudo de una página de plantilla para previsualización."""
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)
        try:
            target_uuid = uuid_lib.UUID(template_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="template_id inválido")
        template = db.query(models.WebTemplate).filter(models.WebTemplate.id == target_uuid).first()
        if not template or getattr(template, "template_type", "schema") != "html":
            raise HTTPException(status_code=404, detail="Plantilla HTML no encontrada")
        html_pages = getattr(template, "html_pages", None) or {}
        html = html_pages.get(page_key) or html_pages.get("home")
        if not html:
            raise HTTPException(status_code=404, detail=f"Página '{page_key}' no encontrada")
        return HTMLResponse(content=html)
    finally:
        db.close()


# ── PLANES ────────────────────────────────────────────────────────────────
def _serialize_plan(p):
    return {
        "id": str(p.id),
        "name": p.name,
        "description": p.description,
        "commission_rate": p.commission_rate,
        "monthly_fee": p.monthly_fee,
        "modules": p.modules or [],
        "is_default": bool(p.is_default),
    }

@app.get("/super-admin/plans")
async def get_super_admin_plans(request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)
        plans = db.query(models.Plan).order_by(models.Plan.monthly_fee.asc()).all()
        return [_serialize_plan(p) for p in plans]
    finally:
        db.close()

class PlanUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    commission_rate: float | None = Field(default=None, ge=0, le=1)
    monthly_fee: float | None = Field(default=None, ge=0)
    modules: list[str] | None = None
    is_default: bool | None = None

@app.put("/super-admin/plans/{plan_id}")
async def update_super_admin_plan(plan_id: str, payload: PlanUpdateRequest, request: Request):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        _require_super_admin(user)
        try:
            target_uuid = uuid_lib.UUID(plan_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="plan_id inválido")
        plan = db.query(models.Plan).filter(models.Plan.id == target_uuid).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Plan no encontrado")

        update_data = payload.model_dump(exclude_unset=True)
        if update_data.get("is_default"):
            db.query(models.Plan).filter(models.Plan.id != target_uuid).update({models.Plan.is_default: False})
        for key, value in update_data.items():
            setattr(plan, key, value)
        db.commit()
        return _serialize_plan(plan)
    finally:
        db.close()

@app.get("/web-templates")
async def get_web_templates(request: Request, response: Response):
    """Galeria de plantillas visible para cualquier tenant autenticado."""
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        await _authenticate(request, db)
        # Caché en memoria: TTL 5 min (solo cambia cuando super-admin añade/edita)
        cached = _cache_get(_templates_cache, "list")
        if cached is not None:
            response.headers["Cache-Control"] = "private, max-age=300"
            return cached
        templates = db.query(models.WebTemplate).filter(models.WebTemplate.is_active == True).order_by(models.WebTemplate.created_at.desc()).all()
        data = [_serialize_template(t) for t in templates]
        _cache_set(_templates_cache, "list", data, 300)
        response.headers["Cache-Control"] = "private, max-age=300"
        return data
    finally:
        db.close()

@app.get("/web-templates/{template_id}/preview/{page_key}", response_class=HTMLResponse)
async def public_preview_template_page(template_id: str, page_key: str, request: Request, token: str = Query(None)):
    """Preview navegable de plantilla HTML para cualquier usuario autenticado."""
    import models, uuid as uuid_lib, security as sec_mod
    from database import SessionLocal
    db = SessionLocal()
    try:
        if token:
            try:
                user = await sec_mod.get_current_user(request=request, token=token, db=db)
            except Exception:
                raise HTTPException(status_code=401, detail="Token inválido o expirado")
        else:
            user = await _authenticate(request, db)
        try:
            target_uuid = uuid_lib.UUID(template_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="template_id inválido")
        template = db.query(models.WebTemplate).filter(
            models.WebTemplate.id == target_uuid,
            models.WebTemplate.is_active == True,
        ).first()
        if not template or getattr(template, "template_type", "schema") != "html":
            raise HTTPException(status_code=404, detail="Plantilla HTML no encontrada")
        html_pages = getattr(template, "html_pages", None) or {}
        html = html_pages.get(page_key) or html_pages.get("home")
        if not html:
            raise HTTPException(status_code=404, detail=f"Página '{page_key}' no encontrada")
        base_url = str(request.base_url).rstrip("/")
        tok = token or ""
        preview_sdk = _BAYUP_PREVIEW_SDK \
            .replace("__TPLID__", template_id) \
            .replace("__TOK__", tok) \
            .replace("__BASE__", base_url) \
            .replace("/super-admin/web-templates/", "/web-templates/") \
            .replace("/live-preview/", "/preview/")
        if "</head>" in html:
            html = html.replace("</head>", preview_sdk + "</head>", 1)
        else:
            html = preview_sdk + html
        return HTMLResponse(content=html)
    finally:
        db.close()

def _serialize_shop_page(p):
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
    schema_data: dict
    template_id: str | None = None

class ShopPagePublishRequest(BaseModel):
    page_key: str
    schema_data: dict

@app.get("/shop-pages/{page_key}")
async def get_shop_page(page_key: str, request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        page = db.query(models.ShopPage).filter(
            models.ShopPage.tenant_id == tenant_id,
            models.ShopPage.page_key == page_key,
        ).first()
        if not page:
            return {"page_key": page_key, "schema_data": None, "template_id": None, "is_published": False}
        return _serialize_shop_page(page)
    finally:
        db.close()

@app.post("/shop-pages")
async def save_shop_page(payload: ShopPageSaveRequest, request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        page = db.query(models.ShopPage).filter(
            models.ShopPage.tenant_id == tenant_id,
            models.ShopPage.page_key == payload.page_key,
        ).first()
        is_new = page is None
        if page:
            page.schema_data = payload.schema_data
            if payload.template_id:
                page.template_id = payload.template_id
        else:
            page = models.ShopPage(
                tenant_id=tenant_id,
                page_key=payload.page_key,
                schema_data=payload.schema_data,
                template_id=payload.template_id,
            )
            db.add(page)

        # Contabiliza el uso real de la plantilla (solo al instalar Home por primera vez)
        if is_new and payload.page_key == "home" and payload.template_id:
            import uuid as uuid_lib
            try:
                template_uuid = uuid_lib.UUID(payload.template_id)
                template = db.query(models.WebTemplate).filter(models.WebTemplate.id == template_uuid).first()
                if template:
                    template.uses = (template.uses or 0) + 1
            except ValueError:
                pass

        db.commit()
        db.refresh(page)
        return _serialize_shop_page(page)
    finally:
        db.close()

@app.post("/shop-pages/publish")
async def publish_shop_page(payload: ShopPagePublishRequest, request: Request):
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = _tenant_id(user)
        page = db.query(models.ShopPage).filter(
            models.ShopPage.tenant_id == tenant_id,
            models.ShopPage.page_key == payload.page_key,
        ).first()
        if page:
            page.schema_data = payload.schema_data
            page.is_published = True
        else:
            page = models.ShopPage(
                tenant_id=tenant_id,
                page_key=payload.page_key,
                schema_data=payload.schema_data,
                is_published=True,
            )
            db.add(page)
        db.commit()
        db.refresh(page)
        return _serialize_shop_page(page)
    finally:
        db.close()

@app.get("/public/stores/{store_id}/pages/{page_key}")
@limiter.limit("30/minute")
async def get_public_shop_page(request: Request, response: Response, store_id: str, page_key: str):
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        try:
            store_uuid = uuid_lib.UUID(store_id)
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
        return {"page_key": page.page_key, "schema_data": page.schema_data}
    finally:
        db.close()


# ---------------------------------------------------------------------------
# PAGOS — capa de abstracción agnóstica al proveedor
#
# Estos endpoints definen el contrato de la API de pagos. La lógica
# específica del gateway (Wompi, PayU, Stripe, etc.) se implementa dentro
# de cada función marcada con TODO cuando se elija el proveedor.
# ---------------------------------------------------------------------------

class CheckoutItemSchema(BaseModel):
    product_id: str
    name: str
    qty: int = Field(ge=1)
    unit_price: float = Field(ge=0)

class CheckoutRequest(BaseModel):
    customer_name:  str = Field(min_length=2)
    customer_email: str = Field(min_length=5)
    customer_phone: str = Field(min_length=7)
    items: list[CheckoutItemSchema] = Field(min_length=1)
    currency: str = Field(default="COP", max_length=3)

def _build_whatsapp_url(phone: str, store_name: str, items: list, total: float) -> str:
    """Genera enlace de WhatsApp con resumen del pedido como fallback de pago."""
    lines = [f"*Nuevo pedido — {store_name}*", ""]
    for item in items:
        lines.append(f"• {item['name']} × {item['qty']}  → ${item['unit_price'] * item['qty']:,.0f}")
    lines += ["", f"*Total: ${total:,.0f} {items[0].get('currency', 'COP') if items else 'COP'}*"]
    text = "%0A".join(lines)
    clean_phone = phone.replace("+", "").replace(" ", "").replace("-", "")
    return f"https://wa.me/{clean_phone}?text={text}"

def _serialize_payment(p) -> dict:
    return {
        "id":                  str(p.id),
        "amount":              p.amount,
        "currency":            p.currency,
        "status":              p.status,
        "customer_name":       p.customer_name,
        "customer_email":      p.customer_email,
        "customer_phone":      p.customer_phone,
        "items":               p.items or [],
        "gateway":             p.gateway,
        "gateway_payment_id":  p.gateway_payment_id,
        "gateway_redirect_url": p.gateway_redirect_url,
        "whatsapp_url":        p.whatsapp_url,
        "created_at":          p.created_at.isoformat() if p.created_at else None,
        "updated_at":          p.updated_at.isoformat() if p.updated_at else None,
    }

@app.post("/public/shop/{slug}/checkout")
@limiter.limit("10/minute")
async def public_checkout(slug: str, payload: CheckoutRequest, request: Request):
    """
    Inicia un pago desde la tienda pública. No requiere autenticación.
    Responde con:
      - whatsapp_url: enlace de WhatsApp como fallback (siempre presente)
      - gateway_redirect_url: URL de redirección al gateway (null hasta configurar uno)
      - payment_id: para consultar el estado después
    """
    import models, uuid as _uuid_co
    from database import SessionLocal
    db = SessionLocal()
    try:
        tenant = db.query(models.User).filter(
            models.User.shop_slug == slug,
            models.User.status == "Activo",
        ).first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tienda no encontrada")

        # CRIT-002: calcular unit_price desde DB; ignorar el precio enviado por el cliente
        items_dict = []
        total = 0.0
        for item in payload.items:
            try:
                product_uuid = _uuid_co.UUID(item.product_id)
            except (ValueError, AttributeError):
                raise HTTPException(status_code=400, detail=f"product_id inválido: {item.product_id}")
            db_product = db.query(models.Product).filter(
                models.Product.id == product_uuid,
                models.Product.owner_id == tenant.id,
                models.Product.status == "active",
            ).first()
            if not db_product:
                raise HTTPException(status_code=400, detail=f"Producto no encontrado en esta tienda: {item.product_id}")
            db_price = db_product.price  # precio real de DB, nunca del cliente
            item_dict = {
                "product_id": item.product_id,
                "name": db_product.name,
                "qty": item.qty,
                "unit_price": db_price,
                "currency": payload.currency,
            }
            items_dict.append(item_dict)
            total += db_price * item.qty

        whatsapp_url = None
        if tenant.phone:
            whatsapp_url = _build_whatsapp_url(
                tenant.phone, tenant.full_name or slug, items_dict, total
            )

        payment = models.Payment(
            tenant_id=tenant.id,
            amount=total,
            currency=payload.currency,
            status="pending",
            customer_name=payload.customer_name,
            customer_email=payload.customer_email,
            customer_phone=payload.customer_phone,
            items=items_dict,
            gateway=None,           # TODO: asignar cuando se configure el gateway
            gateway_redirect_url=None,  # TODO: generar URL del gateway aquí
            whatsapp_url=whatsapp_url,
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)

        # TODO: cuando se configure un gateway, reemplazar esta sección:
        #   1. Llamar a la API del gateway con amount, currency, items, customer
        #   2. Guardar gateway_payment_id y gateway_redirect_url en el registro
        #   3. Retornar gateway_redirect_url para redirigir al usuario

        return {
            "payment_id":          str(payment.id),
            "status":              payment.status,
            "amount":              payment.amount,
            "currency":            payment.currency,
            "whatsapp_url":        payment.whatsapp_url,
            "gateway_redirect_url": payment.gateway_redirect_url,  # null por ahora
        }
    finally:
        db.close()

@app.get("/public/payment/{payment_id}")
@limiter.limit("30/minute")
async def get_payment_status(payment_id: str, request: Request):
    """Consulta el estado de un pago. Usado por la tienda después del redirect del gateway."""
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        try:
            pid = uuid_lib.UUID(payment_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="payment_id inválido")
        payment = db.query(models.Payment).filter(models.Payment.id == pid).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Pago no encontrado")
        return {"payment_id": str(payment.id), "status": payment.status, "amount": payment.amount}
    finally:
        db.close()

@app.post("/public/payments/webhook")
async def payment_webhook(request: Request):
    # CRIT-003: Placeholder seguro hasta implementar gateway real.
    # La verificación de firma HMAC se añadirá al integrar MercadoPago/PayU.
    # NO loguear el payload — puede contener datos bancarios sensibles.
    return {"received": True}

@app.get("/admin/payments")
async def list_admin_payments(
    request: Request,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1),
):
    """Lista los pagos recibidos por la tienda del tenant autenticado."""
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = user.owner_id or user.id
        payments = (
            db.query(models.Payment)
            .filter(models.Payment.tenant_id == tenant_id)
            .order_by(models.Payment.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return [_serialize_payment(p) for p in payments]
    finally:
        db.close()

@app.get("/admin/payments/{payment_id}")
async def get_admin_payment(payment_id: str, request: Request):
    """Detalle de un pago específico."""
    import models, uuid as uuid_lib
    from database import SessionLocal
    db = SessionLocal()
    try:
        user = await _authenticate(request, db)
        tenant_id = user.owner_id or user.id
        try:
            pid = uuid_lib.UUID(payment_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="payment_id inválido")
        payment = db.query(models.Payment).filter(
            models.Payment.id == pid,
            models.Payment.tenant_id == tenant_id,
        ).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Pago no encontrado")
        return _serialize_payment(payment)
    finally:
        db.close()


# ---------------------------------------------------------------------------
# TIENDAS HTML — sirve plantillas HTML nativas con bayup.js inyectado
# ---------------------------------------------------------------------------

_BAYUP_PREVIEW_SDK = """
<meta name="google" content="notranslate">
<meta name="translate" content="no">
<script id="bayup-preview-sdk">
(function(){
  var TPLID='__TPLID__',TOK='__TOK__',BASE='__BASE__';
  var params=new URLSearchParams(window.location.search);
  var PID=params.get('product_id');
  var STORE={name:'Mi Tienda Demo',phone:'573000000000'};
  var PRODUCTS=[
    {id:'1',name:'Vestido Elegante',price:189900,img:'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop&auto=format'},
    {id:'2',name:'Blusa Premium',price:89900,img:'https://images.unsplash.com/photo-1551803091-e20673f15770?w=400&h=500&fit=crop&auto=format'},
    {id:'3',name:'Falda Minimalista',price:129900,img:'https://images.unsplash.com/photo-1594938298603-c8148c4b4a35?w=400&h=500&fit=crop&auto=format'},
    {id:'4',name:'Blazer Moderno',price:249900,img:'https://images.unsplash.com/photo-1594226801341-41427b4e5c22?w=400&h=500&fit=crop&auto=format'},
    {id:'5',name:'Pantalon Formal',price:149900,img:'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&h=500&fit=crop&auto=format'},
    {id:'6',name:'Conjunto Casual',price:199900,img:'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=400&h=500&fit=crop&auto=format'}
  ];
  var CKEY='bayup_preview_cart';
  function go(page,extra){
    var u=BASE+'/super-admin/web-templates/'+TPLID+'/live-preview/'+page+'?token='+encodeURIComponent(TOK);
    if(extra)u+='&'+extra;
    window.location.href=u;
  }
  function fmt(n){return '$'+n.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g,'.');}
  function getCart(){try{return JSON.parse(localStorage.getItem(CKEY)||'[]');}catch(e){return[];}}
  function saveCart(c){localStorage.setItem(CKEY,JSON.stringify(c));}
  function badge(){
    var n=getCart().reduce(function(s,i){return s+i.qty;},0);
    document.querySelectorAll('[data-bayup="cart-count"]').forEach(function(el){
      el.textContent=n;el.style.display=n?'':'none';
    });
  }
  function fillStore(){
    document.querySelectorAll('[data-bayup="store-name"]').forEach(function(el){el.textContent=STORE.name;});
    document.querySelectorAll('[data-bayup="store-phone"]').forEach(function(el){el.textContent='+57 300 000 0000';});
  }
  function fillGrid(){
    var grid=document.querySelector('[data-bayup="product-grid"]');
    var tmpl=document.querySelector('template[data-bayup="product-card-template"]');
    if(!grid||!tmpl)return;
    grid.innerHTML='';
    PRODUCTS.forEach(function(p){
      var c=tmpl.content.cloneNode(true);
      var img=c.querySelector('[data-bayup-card="image"]');
      var nm=c.querySelector('[data-bayup-card="name"]');
      var pr=c.querySelector('[data-bayup-card="price"]');
      var ab=c.querySelector('[data-bayup-action="add-to-cart"]');
      var nb=c.querySelector('[data-bayup-action="nav-product"]');
      if(img){img.src=p.img;img.alt=p.name;}
      if(nm)nm.textContent=p.name;
      if(pr)pr.textContent=fmt(p.price);
      if(ab)ab.dataset.bayupProductId=p.id;
      if(nb)nb.dataset.bayupProductId=p.id;
      grid.appendChild(c);
    });
  }
  function fillProduct(){
    if(!PID)return;
    var p=PRODUCTS.find(function(x){return x.id===PID;})||PRODUCTS[0];
    document.querySelectorAll('[data-bayup="product-name"]').forEach(function(el){el.textContent=p.name;});
    document.querySelectorAll('[data-bayup="product-price"]').forEach(function(el){el.textContent=fmt(p.price);});
    document.querySelectorAll('[data-bayup="product-description"]').forEach(function(el){el.textContent='Descripcion de muestra para '+p.name+'.';});
    document.querySelectorAll('img[data-bayup="product-image"]').forEach(function(el){el.src=p.img;el.alt=p.name;});
    var ab=document.querySelector('[data-bayup-action="add-to-cart"]');
    if(ab)ab.dataset.bayupProductId=p.id;
  }
  function fillCart(){
    var tbody=document.querySelector('[data-bayup="cart-items"]');
    var tmpl=document.querySelector('template[data-bayup="cart-row-template"]');
    if(!tbody)return;
    var cart=getCart();
    tbody.innerHTML='';
    if(!cart.length){
      var r=document.createElement('tr');
      r.innerHTML='<td colspan="4" style="text-align:center;padding:2rem;color:#9ca3af;">El carrito esta vacio</td>';
      tbody.appendChild(r);
    }else{
      cart.forEach(function(item){
        if(!tmpl)return;
        var c=tmpl.content.cloneNode(true);
        var fn=function(s,v){var e=c.querySelector('[data-bayup-row="'+s+'"]');if(e)e.textContent=v;};
        fn('name',item.name);fn('price',fmt(item.price));fn('qty',item.qty);fn('subtotal',fmt(item.price*item.qty));
        tbody.appendChild(c);
      });
    }
    var total=cart.reduce(function(s,i){return s+i.price*i.qty;},0);
    document.querySelectorAll('[data-bayup="cart-subtotal"],[data-bayup="cart-total"]').forEach(function(el){el.textContent=fmt(total);});
  }
  function bindActions(){
    document.addEventListener('click',function(e){
      var el=e.target.closest('[data-bayup-action]');
      if(!el)return;
      var a=el.dataset.bayupAction;
      var MAP={
        'nav-home':'home','nav-catalog':'catalog','nav-contact':'contact',
        'nav-privacy':'privacy','nav-cart':'cart'
      };
      if(MAP[a]){e.preventDefault();go(MAP[a]);return;}
      if(a==='nav-product'){
        e.preventDefault();go('product','product_id='+(el.dataset.bayupProductId||'1'));return;
      }
      if(a==='add-to-cart'){
        var pid=el.dataset.bayupProductId;
        var p=PRODUCTS.find(function(x){return x.id===pid;})||PRODUCTS[0];
        var cart=getCart();
        var ex=cart.find(function(i){return i.id===p.id;});
        if(ex)ex.qty++;else cart.push({id:p.id,name:p.name,price:p.price,qty:1});
        saveCart(cart);badge();fillCart();
        var orig=el.textContent;el.textContent='\\u2713 Agregado';
        setTimeout(function(){el.textContent=orig;},1200);
        return;
      }
      if(a==='checkout'){
        e.preventDefault();
        var cart=getCart();
        if(!cart.length){alert('El carrito esta vacio (DEMO)');return;}
        var msg='*Pedido Demo*\\n'+cart.map(function(i){return '- '+i.name+' x'+i.qty+' = '+fmt(i.price*i.qty);}).join('\\n');
        window.open('https://wa.me/'+STORE.phone+'?text='+encodeURIComponent(msg),'_blank');
      }
    });
  }
  function init(){fillStore();fillGrid();fillProduct();fillCart();badge();bindActions();}
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}
  // Banner de modo demo
  var bar=document.createElement('div');
  bar.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;background:#7c3aed;color:#fff;text-align:center;padding:6px 12px;font-size:11px;font-weight:700;letter-spacing:.05em;';
  bar.textContent='\\u25B6 MODO PREVIEW — datos de demostración';
  document.body.prepend(bar);
})();
</script>
"""

_BAYUP_SDK = """
<script id="bayup-sdk">
(function(){
  const SLUG = document.documentElement.dataset.bayupSlug || '';
  const API  = document.documentElement.dataset.bayupApi  || '';
  const PAGE = document.documentElement.dataset.bayupPage || 'home';

  // --- Estado del carrito en localStorage ---
  const CART_KEY = 'bayup_cart_' + SLUG;
  function getCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY)||'[]'); }catch(e){ return []; } }
  function saveCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); }

  function cartTotal(cart){ return cart.reduce(function(s,i){ return s + i.unit_price * i.qty; }, 0); }
  function cartCount(cart){ return cart.reduce(function(s,i){ return s + i.qty; }, 0); }

  function formatCOP(n){ return '$' + Math.round(n).toLocaleString('es-CO'); }

  // --- Actualiza todos los elementos del DOM ---
  function render(store, products){
    // Nombre e info de tienda
    document.querySelectorAll('[data-bayup="store-name"]').forEach(function(el){ el.textContent = store.full_name || store.name || SLUG; });
    document.querySelectorAll('[data-bayup="store-phone"]').forEach(function(el){ el.textContent = store.phone || ''; });
    document.querySelectorAll('img[data-bayup="store-logo"]').forEach(function(el){ if(store.logo_url) el.src = store.logo_url; });

    // Página de detalle de producto
    if(PAGE === 'product'){
      var params = new URLSearchParams(window.location.search);
      var productId = params.get('product_id');
      if(productId && products.length){
        var p = products.find(function(x){ return String(x.id) === String(productId); });
        if(p){
          document.querySelectorAll('[data-bayup="product-name"]').forEach(function(el){ el.textContent = p.name; });
          document.querySelectorAll('[data-bayup="product-price"]').forEach(function(el){ el.textContent = formatCOP(p.price); });
          document.querySelectorAll('[data-bayup="product-description"]').forEach(function(el){ el.textContent = p.description || ''; });
          document.querySelectorAll('img[data-bayup="product-image"]').forEach(function(el){ if(p.image_url&&p.image_url[0]) el.src=p.image_url[0]; });
          document.querySelectorAll('[data-bayup-action="add-to-cart"]').forEach(function(el){
            el.dataset.bayupProductId=String(p.id);
            el.dataset.bayupProductName=p.name;
            el.dataset.bayupProductPrice=String(p.price);
          });
        }
      }
    }

    // Grilla de productos
    var grid = document.querySelector('[data-bayup="product-grid"]');
    var cardTpl = document.querySelector('template[data-bayup="product-card-template"]');
    if(grid && cardTpl && products.length){
      grid.innerHTML = '';
      products.forEach(function(p){
        var clone = cardTpl.content.cloneNode(true);
        clone.querySelectorAll('[data-bayup-card="name"]').forEach(function(el){ el.textContent = p.name; });
        clone.querySelectorAll('[data-bayup-card="price"]').forEach(function(el){ el.textContent = formatCOP(p.price); });
        clone.querySelectorAll('img[data-bayup-card="image"]').forEach(function(el){ if(p.image_url&&p.image_url[0]) el.src=p.image_url[0]; });
        clone.querySelectorAll('[data-bayup-action="add-to-cart"]').forEach(function(el){ el.dataset.bayupProductId=String(p.id); el.dataset.bayupProductName=p.name; el.dataset.bayupProductPrice=String(p.price); });
        clone.querySelectorAll('[data-bayup-action="nav-product"]').forEach(function(el){ el.dataset.bayupProductId=String(p.id); });
        grid.appendChild(clone);
      });
    }

    renderCart();
  }

  function renderCart(){
    var cart = getCart();
    var count = cartCount(cart);
    document.querySelectorAll('[data-bayup="cart-count"]').forEach(function(el){
      el.textContent = count || '';
      el.style.display = count ? '' : 'none';
    });
    document.querySelectorAll('[data-bayup="cart-total"]').forEach(function(el){ el.textContent = formatCOP(cartTotal(cart)); });
    document.querySelectorAll('[data-bayup="cart-subtotal"]').forEach(function(el){ el.textContent = formatCOP(cartTotal(cart)); });
    var cartList = document.querySelector('[data-bayup="cart-items"]');
    var cartRowTpl = document.querySelector('template[data-bayup="cart-row-template"]');
    if(cartList){
      cartList.innerHTML = '';
      if(!cart.length){
        var empty = document.createElement('tr');
        empty.innerHTML = '<td colspan="5" class="py-12 text-center text-slate-400">Tu carrito está vacío</td>';
        cartList.appendChild(empty);
      } else {
        cart.forEach(function(item){
          if(cartRowTpl){
            var clone = cartRowTpl.content.cloneNode(true);
            clone.querySelectorAll('[data-bayup-row="name"]').forEach(function(el){ el.textContent = item.name; });
            clone.querySelectorAll('[data-bayup-row="price"]').forEach(function(el){ el.textContent = formatCOP(item.unit_price); });
            clone.querySelectorAll('[data-bayup-row="subtotal"]').forEach(function(el){ el.textContent = formatCOP(item.unit_price * item.qty); });
            clone.querySelectorAll('[data-bayup-row="qty"]').forEach(function(el){ el.textContent = String(item.qty); });
            cartList.appendChild(clone);
          } else {
            var li = document.createElement('div');
            li.className = 'bayup-cart-item';
            li.innerHTML = '<span>' + item.name + ' x' + item.qty + '</span><span>' + formatCOP(item.unit_price * item.qty) + '</span>';
            cartList.appendChild(li);
          }
        });
      }
    }
  }

  // --- Acciones globales (delegación de eventos) ---
  document.addEventListener('click', function(e){
    var el = e.target.closest('[data-bayup-action]');
    if(!el) return;
    var action = el.dataset.bayupAction;

    if(action === 'add-to-cart'){
      var cart = getCart();
      var id = el.dataset.bayupProductId;
      var existing = cart.find(function(i){ return i.product_id === id; });
      if(existing){ existing.qty += 1; }
      else{ cart.push({ product_id:id, name:el.dataset.bayupProductName, unit_price:Number(el.dataset.bayupProductPrice), qty:1 }); }
      saveCart(cart);
      renderCart();
      el.textContent = '✓ Añadido';
      setTimeout(function(){ el.textContent = 'Agregar'; }, 1200);
    }

    if(action === 'checkout'){
      var cart = getCart();
      if(!cart.length){ alert('Tu carrito está vacío'); return; }
      var phone = document.documentElement.dataset.bayupPhone || '';
      var lines  = ['*Nuevo pedido*',''];
      cart.forEach(function(i){ lines.push('• ' + i.name + ' ×' + i.qty + '  → ' + formatCOP(i.unit_price * i.qty)); });
      lines.push('','*Total: ' + formatCOP(cartTotal(cart)) + ' COP*');
      var text  = encodeURIComponent(lines.join('\\n'));
      var clean = phone.replace(/[^0-9]/g,'');
      window.open('https://wa.me/' + clean + '?text=' + text, '_blank');
    }

    if(action === 'nav-home')    window.location.href = '/html-shop/' + SLUG + '/home';
    if(action === 'nav-catalog') window.location.href = '/html-shop/' + SLUG + '/catalog';
    if(action === 'nav-cart')    window.location.href = '/html-shop/' + SLUG + '/cart';
    if(action === 'nav-contact') window.location.href = '/html-shop/' + SLUG + '/contact';
    if(action === 'nav-privacy') window.location.href = '/html-shop/' + SLUG + '/privacy';
    if(action === 'nav-product') window.location.href = '/html-shop/' + SLUG + '/product?product_id=' + (el.dataset.bayupProductId||'');
  });

  // --- Bootstrap: carga datos de la tienda y productos ---
  async function init(){
    try{
      var [storeRes, productsRes] = await Promise.all([
        fetch(API + '/public/shop-info/' + SLUG),
        fetch(API + '/public/shop/' + SLUG + '/products?limit=100'),
      ]);
      var store    = storeRes.ok    ? await storeRes.json()    : {};
      var products = productsRes.ok ? await productsRes.json() : [];
      render(store, Array.isArray(products) ? products : []);
    } catch(err){
      console.warn('[Bayup SDK] Error cargando datos:', err);
    }
  }

  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
</script>
"""

def _inject_sdk(html: str, slug: str, page_key: str, phone: str, api_url: str) -> str:
    """Inyecta bayup.js y los data attributes necesarios en el <html> y <head>.
    ALTA-006: los parámetros se escapan con html.escape para prevenir XSS."""
    sdk_attrs = (
        f' data-bayup-slug="{_html.escape(slug)}"'
        f' data-bayup-page="{_html.escape(page_key)}"'
        f' data-bayup-api="{_html.escape(api_url)}"'
        f' data-bayup-phone="{_html.escape(phone)}"'
    )
    import re
    html = re.sub(r'<html([^>]*?)>', f'<html\\1{sdk_attrs}>', html, count=1, flags=re.IGNORECASE)
    # Bloquea auto-traducción del navegador (Chrome/Edge rompen el layout al traducir)
    no_translate = '<meta name="google" content="notranslate"><meta name="translate" content="no">'
    html = re.sub(r'</head>', no_translate + '\n</head>', html, count=1, flags=re.IGNORECASE)
    html = re.sub(r'</body>', _BAYUP_SDK + '\n</body>', html, count=1, flags=re.IGNORECASE)
    return html


@app.get("/html-shop/{slug}", response_class=HTMLResponse)
@app.get("/html-shop/{slug}/{page_key}", response_class=HTMLResponse)
@limiter.limit("30/minute")
async def serve_html_shop(request: Request, slug: str, page_key: str = "home"):
    """Sirve la tienda HTML con bayup.js inyectado."""
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        tenant = db.query(models.User).filter(
            models.User.shop_slug == slug,
            models.User.status == "Activo",
        ).first()
        if not tenant:
            return HTMLResponse("<h1>Tienda no encontrada</h1>", status_code=404)

        # Busca la plantilla HTML activa instalada en la tienda
        shop_page = db.query(models.ShopPage).filter(
            models.ShopPage.tenant_id == tenant.id,
            models.ShopPage.is_published == True,
        ).first()
        template_id = shop_page.template_id if shop_page else None

        html_template = None
        if template_id:
            import uuid as _uuid
            try:
                tid = _uuid.UUID(template_id)
                html_template = db.query(models.WebTemplate).filter(
                    models.WebTemplate.id == tid,
                    models.WebTemplate.template_type == "html",
                ).first()
            except (ValueError, Exception):
                pass

        if not html_template or not html_template.html_pages:
            return HTMLResponse("<h1>Esta tienda no tiene una plantilla HTML configurada.</h1>", status_code=404)

        pages = html_template.html_pages or {}
        # Fallback: home si la página pedida no existe
        html_content = pages.get(page_key) or pages.get("home") or ""
        if not html_content:
            return HTMLResponse("<h1>Página no encontrada</h1>", status_code=404)

        api_url = os.getenv("SITE_URL", "https://bayup.com.co").rstrip("/")
        api_url = os.getenv("NEXT_PUBLIC_API_URL", api_url)
        backend_url = os.getenv("BACKEND_URL", "https://api-bayup.onrender.com")

        html_out = _inject_sdk(
            html_content,
            slug=slug,
            page_key=page_key,
            phone=tenant.phone or "",
            api_url=backend_url,
        )
        return HTMLResponse(content=html_out, status_code=200)
    finally:
        db.close()


@app.get("/public/shop-info/{slug}")
@limiter.limit("60/minute")
async def get_public_shop_info(request: Request, slug: str):
    """Info pública de una tienda (nombre, logo, teléfono, categoría)."""
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        tenant = db.query(models.User).filter(
            models.User.shop_slug == slug,
            models.User.status == "Activo",
        ).first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tienda no encontrada")
        return {
            "name": tenant.full_name,
            "slug": tenant.shop_slug,
            "logo_url": tenant.logo_url,
            "phone": tenant.phone,
            "category": tenant.category,
            "story": tenant.story,
            "social_links": tenant.social_links or {},
        }
    finally:
        db.close()


@app.get("/public/shop/{slug}/products")
@limiter.limit("60/minute")
async def get_public_shop_products(
    request: Request,
    slug: str,
    limit: int = Query(default=100, ge=1, le=500),  # MED-003: límite máximo de 500
    skip: int = Query(default=0, ge=0),
):
    """Catálogo público de productos de una tienda."""
    import models
    from database import SessionLocal
    db = SessionLocal()
    try:
        tenant = db.query(models.User).filter(
            models.User.shop_slug == slug,
            models.User.status == "Activo",
        ).first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tienda no encontrada")
        products = (
            db.query(models.Product)
            .filter(models.Product.owner_id == tenant.id, models.Product.status == "active")
            .offset(skip).limit(limit).all()
        )
        return [
            {
                "id": str(p.id),
                "name": p.name,
                "price": p.price,
                "description": p.description,
                "image_url": p.image_url or [],
                "category": p.category,
                "sku": p.sku,
            }
            for p in products
        ]
    finally:
        db.close()
