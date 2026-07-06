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
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    connection = engine.connect()
    trans = connection.begin()
    db = TestingSessionLocal(bind=connection)
    yield db
    db.close()
    trans.rollback()    # deshace TODO lo hecho en este test — BD limpia para el siguiente
    connection.close()


@pytest.fixture
def client(db_session):
    import database as _db_module
    # Parcha el engine y SessionLocal del módulo database para que toda la app
    # use el mismo SQLite en memoria durante los tests
    _db_module.engine = engine
    _db_module.SessionLocal = TestingSessionLocal

    from main import app
    import email_queue as _eq
    _eq._worker_started = True  # evita que el worker corra durante tests

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=False) as c:
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
