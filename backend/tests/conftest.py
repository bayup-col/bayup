"""
Fixtures compartidas para todos los tests de Bayup.
Usa SQLite en memoria — sin conexión a PostgreSQL, sin datos reales.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from database import Base, get_db
import models  # noqa — registra todos los modelos en Base.metadata

TEST_DATABASE_URL = "sqlite:///:memory:"

# StaticPool: reutiliza la misma conexión en memoria para todos los tests
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    from sqlalchemy import text
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS email_jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                func VARCHAR(120) NOT NULL,
                kwargs_json TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                attempts INTEGER DEFAULT 0,
                error TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def clean_db_after_test():
    """Elimina todas las filas de todas las tablas y limpia cachés después de cada test."""
    yield
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())
        from sqlalchemy import text as _text
        conn.execute(_text("DELETE FROM email_jobs"))
    # Limpiar cachés en memoria para que no contaminen el siguiente test
    import cache as _cache_mod
    _cache_mod.shop_cache.clear()
    _cache_mod.templates_cache.clear()


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    yield db
    db.close()


@pytest.fixture
def client(db_session):
    import database as _db_module
    _db_module.engine = engine
    _db_module.SessionLocal = TestingSessionLocal

    from main import app
    import email_queue as _eq
    _eq._worker_started = True
    _eq.enqueue = lambda *a, **kw: None

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    # Sin "with": evita disparar el lifespan de FastAPI en cada test. El lifespan
    # arranca un hilo en segundo plano que corre create_all/schema-sync contra la
    # misma conexión SQLite en memoria (StaticPool), compitiendo con el DROP TABLE
    # del teardown de sesión y causando "database table is locked" intermitente.
    # Ningún test depende de efectos del lifespan (routers ya están registrados
    # al importar main; el worker de email_queue está no-op vía _worker_started).
    c = TestClient(app, raise_server_exceptions=False)
    yield c
    app.dependency_overrides.clear()


@pytest.fixture
def tenant_user(db_session):
    """Crea un tenant de prueba en la DB."""
    import security
    user = models.User(
        email="tenant@test.com",
        hashed_password=security.get_password_hash("test1234"),
        full_name="Tienda Test",
        shop_slug="tienda-test",
        role="admin_tienda",
        is_global_staff=False,
        status="Activo",
        email_confirmed=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def tenant_token(tenant_user):
    """JWT válido para el tenant de prueba."""
    import security
    return security.create_access_token(data={"sub": tenant_user.email})


@pytest.fixture
def super_admin_user(db_session):
    """Crea un super admin de prueba."""
    import security
    user = models.User(
        email="admin@bayup.com",
        hashed_password=security.get_password_hash("admin1234"),
        full_name="Super Admin",
        role="SUPER_ADMIN",
        is_global_staff=True,
        status="Activo",
        email_confirmed=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_token(super_admin_user):
    import security
    return security.create_access_token(data={"sub": super_admin_user.email})
