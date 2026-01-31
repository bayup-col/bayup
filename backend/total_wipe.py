from sqlalchemy import text
from database import engine

def total_wipe():
    print("Iniciando saneamiento total del catálogo...")
    with engine.connect() as conn:
        try:
            # Limpiamos todas las tablas relacionadas con el inventario
            tables = ['product_variants', 'products', 'collections']
            for table in tables:
                conn.execute(text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE;"))
            conn.commit()
            print("¡Éxito! Productos, Variantes y Categorías eliminados por completo.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    total_wipe()
