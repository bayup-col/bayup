from sqlalchemy import text
from database import engine

def wipe_catalog():
    print("Iniciando limpieza total de productos y variantes...")
    with engine.connect() as conn:
        try:
            # Usamos TRUNCATE CASCADE para limpiar productos y sus variantes/referencias de forma atómica
            conn.execute(text("TRUNCATE TABLE products RESTART IDENTITY CASCADE;"))
            conn.commit()
            print("¡Éxito! El catálogo ha sido vaciado por completo.")
        except Exception as e:
            print(f"Error durante la limpieza: {e}")

if __name__ == "__main__":
    wipe_catalog()
