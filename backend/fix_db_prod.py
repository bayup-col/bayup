import os
import psycopg2
from dotenv import load_dotenv

# Cargar variables de entorno del backend
load_dotenv('backend/.env')

DATABASE_URL = os.getenv("DATABASE_URL")

def fix_prod_db():
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL no configurada.")
        return

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("Verificando columnas en tabla 'users'...")
        
        # Lista de columnas que deben existir según el modelo actual
        required_columns = [
            ('logo_url', 'VARCHAR'),
            ('phone', 'VARCHAR'),
            ('shop_slug', 'VARCHAR'),
            ('custom_domain', 'VARCHAR'),
            ('onboarding_completed', 'BOOLEAN DEFAULT FALSE')
        ]
        
        for col_name, col_type in required_columns:
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};")
                print(f"✅ Columna '{col_name}' agregada.")
            except Exception as e:
                conn.rollback()
                if "already exists" in str(e).lower() or "duplicate_column" in str(e).lower():
                    print(f"ℹ️ La columna '{col_name}' ya existe.")
                else:
                    print(f"❌ Error al agregar '{col_name}': {e}")
            else:
                conn.commit()

        conn.close()
        print("\n🚀 Proceso finalizado. El login debería funcionar ahora.")
        
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    fix_prod_db()
