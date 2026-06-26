# backend/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool, NullPool
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL") or "sqlite:///./sql_app.db"

if DATABASE_URL.startswith("sqlite"):
    # SQLite para desarrollo local
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
elif ":6543" in DATABASE_URL or "pooler.supabase.com" in DATABASE_URL:
    # Supabase Transaction-mode pooler (PgBouncer).
    # PgBouncer ya gestiona el pool de conexiones del lado del servidor,
    # así que SQLAlchemy no debe mantener su propio pool encima.
    # NullPool: cada sesión abre/cierra la conexión a PgBouncer (~1ms),
    # PgBouncer la reutiliza internamente → cero conexiones ociosas en Supabase.
    engine = create_engine(
        DATABASE_URL,
        poolclass=NullPool,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 10},
    )
else:
    # Conexión directa a PostgreSQL (sin pooler).
    # Límite conservador: 5 conexiones base para no agotar el cupo de Supabase.
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=5,
        pool_timeout=30,
        pool_recycle=600,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 10},
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()