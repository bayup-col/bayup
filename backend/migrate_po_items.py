
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Actualizando tabla purchase_orders para soportar múltiples productos...")
        conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS items JSON;"))
        conn.commit()
        print("Columna items añadida exitosamente.")
except Exception as e:
    print(f"Error: {e}")
