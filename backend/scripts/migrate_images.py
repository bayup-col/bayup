import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, SessionLocal
from sqlalchemy import text

def migrate_images():
    print("--- MIGRANDO COLUMNA DE IMÁGENES A GALERÍA (JSON) ---")
    with engine.begin() as conn:
        try:
            # SQLite no soporta ALTER COLUMN directa de String a JSON fácilmente.
            # Usaremos una estrategia de "Dropping and recreating" o simplemente intentaremos
            # resetear la tabla si no hay datos valiosos, o agregar una nueva columna.
            
            # Estrategia segura: Renombrar la vieja y crear la nueva.
            print("Paso 1: Renombrando columna antigua...")
            conn.execute(text("ALTER TABLE products RENAME COLUMN image_url TO image_url_old"))
            
            print("Paso 2: Creando nueva columna image_url tipo JSON...")
            # En SQLite JSON se guarda como TEXT
            conn.execute(text("ALTER TABLE products ADD COLUMN image_url JSON DEFAULT '[]'"))
            
            print("[EXITO] Columna migrada a Galería JSON.")
        except Exception as e:
            print(f"[INFO] Posiblemente ya migrada o error: {e}")

if __name__ == "__main__":
    migrate_images()
