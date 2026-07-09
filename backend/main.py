from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from slowapi.errors import RateLimitExceeded
import logging
import os
import sys
import threading

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
def _sync_postgres_schema() -> None:
    """Añade columnas faltantes en PostgreSQL usando IF NOT EXISTS.
    Corre al arranque como mecanismo de seguridad independiente de Alembic.
    Si Alembic ya aplicó las migraciones este bloque es un no-op (todas las
    sentencias usan IF NOT EXISTS y no fallan si la columna ya existe)."""
    try:
        from database import engine
        from sqlalchemy import text as _text
        stmts = [
            # users: columnas añadidas después del create_all inicial
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS reviewer_notes VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR DEFAULT 'Colombia'",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_regime VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS legal_rep VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_is_fixed BOOLEAN DEFAULT FALSE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_fixed_until TIMESTAMP",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_month_revenue DOUBLE PRECISION DEFAULT 0.0",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent DOUBLE PRECISION DEFAULT 0.0",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_purchase_summary VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_type VARCHAR DEFAULT 'final'",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS acquisition_channel VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_confirmation_token VARCHAR(255)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_confirmation_expires TIMESTAMP",
            # payments
            "ALTER TABLE payments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128)",
            # liquidations — tabla añadida post-lanzamiento, creada si no existe
            """CREATE TABLE IF NOT EXISTS liquidations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES users(id),
                gross_amount DOUBLE PRECISION DEFAULT 0.0,
                bayup_commission DOUBLE PRECISION DEFAULT 0.0,
                prix_fee DOUBLE PRECISION DEFAULT 0.0,
                net_amount DOUBLE PRECISION DEFAULT 0.0,
                order_count INTEGER DEFAULT 0,
                period_start TIMESTAMP,
                period_end TIMESTAMP,
                status VARCHAR DEFAULT 'pending',
                scheduled_date TIMESTAMP,
                paid_date TIMESTAMP,
                transfer_reference VARCHAR,
                notes VARCHAR,
                created_at TIMESTAMP DEFAULT NOW()
            )""",
            "ALTER TABLE liquidations ADD COLUMN IF NOT EXISTS liq_type VARCHAR(20) DEFAULT 'web'",
            "CREATE INDEX IF NOT EXISTS ix_liquidations_tenant_id ON liquidations (tenant_id)",
            "CREATE INDEX IF NOT EXISTS ix_liquidations_status ON liquidations (status)",
            "CREATE INDEX IF NOT EXISTS ix_liquidations_created_at ON liquidations (created_at)",
            # email_jobs — cola persistente de emails (reemplaza threading.Thread)
            """CREATE TABLE IF NOT EXISTS email_jobs (
                id          BIGSERIAL PRIMARY KEY,
                func        VARCHAR(120) NOT NULL,
                kwargs_json TEXT         NOT NULL,
                status      VARCHAR(20)  DEFAULT 'pending',
                attempts    INTEGER      DEFAULT 0,
                error       TEXT,
                created_at  TIMESTAMP    DEFAULT NOW(),
                updated_at  TIMESTAMP    DEFAULT NOW()
            )""",
            "CREATE INDEX IF NOT EXISTS ix_email_jobs_status ON email_jobs (status)",
        ]
        with engine.begin() as conn:
            for stmt in stmts:
                conn.execute(_text(stmt))
        # Garantizar que la cuenta raíz de Bayup siempre sea super admin,
        # por si el registro inicial vía Google OAuth la creó sin ese rol.
        BAYUP_ROOT_EMAILS = ["bayupcol@gmail.com", "admin@bayup.com"]
        with engine.begin() as conn:
            for root_email in BAYUP_ROOT_EMAILS:
                conn.execute(_text(
                    "UPDATE users SET is_global_staff = TRUE, role = 'SUPER_ADMIN', status = 'Activo' "
                    "WHERE LOWER(email) = :email AND (is_global_staff IS NOT TRUE OR role != 'SUPER_ADMIN')"
                ), {"email": root_email.lower()})
        logger.info("Bayup: sincronización de esquema PostgreSQL completada")
    except Exception as e:
        logger.warning("Bayup: aviso sincronización esquema: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    import email_queue as _eq
    db_url = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")
    if db_url.startswith("sqlite"):
        def init_sqlite():
            try:
                from database import engine
                import models
                models.Base.metadata.create_all(bind=engine)
                logger.info("Motor Bayup: tablas SQLite sincronizadas")
            except Exception as e:
                logger.warning("Motor Bayup: Aviso SQLite: %s", e)
        threading.Thread(target=init_sqlite, daemon=True).start()
    else:
        # PostgreSQL: garantiza columnas faltantes al arranque independientemente de Alembic
        threading.Thread(target=_sync_postgres_schema, daemon=True).start()
    # Arranca el worker de emails persistente (procesa email_jobs cada 5s)
    _eq.start_worker()
    yield

app = FastAPI(title="Bayup OS Platinum", lifespan=lifespan)

# Servir archivos subidos localmente (fallback cuando S3 no está configurado)
import pathlib as _pathlib
_uploads_dir = _pathlib.Path(__file__).parent / "uploads"
_uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_uploads_dir)), name="uploads")

# --- RATE LIMITING ---
from rate_limit import limiter
app.state.limiter = limiter

def _json_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Demasiados intentos. Espera un momento e intenta de nuevo."})

app.add_exception_handler(RateLimitExceeded, _json_rate_limit_handler)


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
    "https://bayup-git-development-bayups-projects-7400e74e.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    # ALTA-002: regex más específica para evitar que cualquier subdominio de vercel.app sea aceptado
    allow_origin_regex=r"https://bayup-[a-z0-9]+-bayup-col\.vercel\.app",
    allow_credentials=True,  # CRIT-004: requerido para enviar/recibir cookies httpOnly
    # BAJA-001: métodos explícitos en lugar de wildcard
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
    expose_headers=["Content-Length"],
)

# --- CORS EN ERRORES 500 ---
# Starlette no añade headers CORS a excepciones no controladas que se propagan
# hasta ServerErrorMiddleware. Este handler garantiza que el origen vea el error
# real en lugar de un CORS block genérico.
import re as _re

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "")
    cors_origin = origin if origin in ALLOWED_ORIGINS else ""
    if not cors_origin and origin and _re.match(r"https://bayup-[a-z0-9]+-bayup-col\.vercel\.app", origin):
        cors_origin = origin
    logger.exception("Unhandled exception in %s %s", request.method, request.url.path)
    resp = JSONResponse(status_code=500, content={"detail": "Error interno del servidor"})
    if cors_origin:
        resp.headers["Access-Control-Allow-Origin"] = cors_origin
        resp.headers["Access-Control-Allow-Credentials"] = "true"
    return resp

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

# ── Routers refactorizados (patrón Depends — sin SessionLocal manual) ─────
from routers import notifications as _r_notif, collections as _r_col, shipments as _r_ship
from routers import products as _r_prod, orders as _r_orders
from routers import shipping as _r_ship2, taxes as _r_taxes, expenses as _r_expenses
from routers import admin as _r_admin
from routers import support as _r_support
from routers import shop_pages as _r_shop_pages
from routers import roadmap as _r_roadmap
from routers import super_admin as _r_super_admin
from routers import web_templates as _r_web_templates
from routers import auth as _r_auth
from routers import public as _r_public
from routers import payments as _r_payments
from routers import liquidations as _r_liq
app.include_router(_r_notif.router)
app.include_router(_r_col.router)
app.include_router(_r_ship.router)
app.include_router(_r_prod.router)
app.include_router(_r_orders.router)
app.include_router(_r_ship2.router)
app.include_router(_r_taxes.router)
app.include_router(_r_expenses.router)
app.include_router(_r_admin.router)
app.include_router(_r_support.router)
app.include_router(_r_shop_pages.router)
app.include_router(_r_roadmap.router)
app.include_router(_r_super_admin.router)
app.include_router(_r_web_templates.router)
app.include_router(_r_auth.router)
app.include_router(_r_public.router)
app.include_router(_r_payments.router)
app.include_router(_r_liq.router)

# Compatibilidad: el frontend llama a /onboarding/complete (sin prefijo /admin)
from fastapi import Depends as _Depends
from sqlalchemy.orm import Session as _Session
from database import get_db as _get_db
from deps import current_user as _current_user

@app.post("/onboarding/complete")
async def complete_onboarding(request: Request, payload: _r_admin.OnboardingCompleteRequest | None = None, db: _Session = _Depends(_get_db), user=_Depends(_current_user)):
    target = _r_admin._resolve_target(db, user, payload.target_user_id if payload else None)
    target.onboarding_completed = True
    db.commit()
    return {"ok": True}
