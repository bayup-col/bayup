# backend/database.py
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool, QueuePool
import os
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Priorizar DATABASE_URL de entorno (para producción en Railway/Supabase)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")

# Configuración de Engine optimizada
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    # Configuración para PostgreSQL (Supabase con Pooler)
    engine = create_engine(
        DATABASE_URL,
        pool_size=20,
        max_overflow=0,
        pool_timeout=30,
        pool_recycle=1800,
        pool_pre_ping=True,
        connect_args={
            "prepare_threshold": 0 # Desactiva prepared statements para compatibilidad con Pooler
        }
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