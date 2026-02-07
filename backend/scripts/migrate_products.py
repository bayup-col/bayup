from sqlalchemy import text
from database import engine
import models

def migrate():
    print("Iniciando migración forzada de la tabla 'products'...")
    
    # Comandos para Postgres
    commands = [
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_price FLOAT DEFAULT 0.0",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS cost FLOAT DEFAULT 0.0",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active'",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS add_gateway_fee BOOLEAN DEFAULT FALSE"
    ]
    
    with engine.connect() as conn:
        for cmd in commands:
            try:
                conn.execute(text(cmd))
                # En SQLAlchemy 2.0+ necesitamos commit explícito en conexiones
                conn.commit()
                print(f"Ejecutado con éxito: {cmd}")
            except Exception as e:
                print(f"Error al ejecutar {cmd}: {e}")
    
    print("Proceso de migración finalizado.")

if __name__ == "__main__":
    migrate()