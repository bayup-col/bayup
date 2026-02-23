import sys
import os
from sqlalchemy import text

# Añadir el directorio actual al path para importar database
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from backend.database import engine
except ImportError:
    from database import engine

def migrate():
    print("Iniciando migración: Añadiendo columna custom_domain a la tabla users...")
    with engine.connect() as conn:
        try:
            # Comando SQL para añadir la columna si no existe
            conn.execute(text("ALTER TABLE users ADD COLUMN custom_domain VARCHAR UNIQUE;"))
            conn.commit()
            print("✅ Columna 'custom_domain' añadida con éxito.")
        except Exception as e:
            if "already exists" in str(e) or "ya existe" in str(e).lower():
                print("ℹ️ La columna ya existía, no se realizaron cambios.")
            else:
                print(f"❌ Error durante la migración: {e}")

if __name__ == "__main__":
    migrate()
