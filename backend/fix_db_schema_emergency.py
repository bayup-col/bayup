import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Obtener URL de Railway o Local
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ No se encontró DATABASE_URL")
    exit(1)

# Fix para SQLAlchemy con Postgres
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

print(f"🔧 Conectando a: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'DB Local'}")

engine = create_engine(DATABASE_URL)

def run_fix():
    with engine.connect() as conn:
        print("🚀 Iniciando reparación de esquema...")
        
        # Lista de columnas críticas que suelen faltar
        columns_to_add = [
            ("users", "customer_city", "TEXT"),
            ("users", "address", "TEXT"),
            ("users", "nit", "TEXT"),
            ("users", "shop_slug", "TEXT"),
            ("users", "logo_url", "TEXT"),
            ("users", "phone", "TEXT"),
            ("users", "social_links", "JSONB"),
            ("users", "whatsapp_lines", "JSONB"),
            ("users", "bank_accounts", "JSONB")
        ]

        for table, col, dtype in columns_to_add:
            try:
                print(f"   👉 Intentando agregar {col} a {table}...")
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {dtype};"))
                conn.commit()
                print(f"   ✅ {col} verificado/agregado.")
            except Exception as e:
                print(f"   ⚠️ Alerta con {col}: {e}")
                conn.rollback()

        print("✨ Reparación finalizada. La DB ahora tiene todas las columnas.")

if __name__ == "__main__":
    run_fix()
