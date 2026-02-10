import sys
import os
import uuid
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, SessionLocal
from sqlalchemy import text
import models

def fix_database():
    print("--- INICIANDO MANTENIMIENTO GLOBAL DE BASE DE DATOS ---")
    db = SessionLocal()
    try:
        # 1. Crear tablas si no existen
        models.Base.metadata.create_all(bind=engine)
        print("[OK] Tablas verificadas/creadas.")

        # 2. Agregar columnas faltantes a la tabla 'users' (Manejo de errores por si ya existen)
        columns_to_add = [
            ("city", "VARCHAR"),
            ("customer_type", "VARCHAR DEFAULT 'final'"),
            ("acquisition_channel", "VARCHAR"),
            ("is_global_staff", "BOOLEAN DEFAULT FALSE")
        ]

        for col_name, col_type in columns_to_add:
            try:
                db.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                db.commit()
                print(f"[NUEVO] Columna '{col_name}' añadida con éxito.")
            except Exception as e:
                db.rollback()
                if "already exists" in str(e) or "duplicate column" in str(e):
                    print(f"[OK] Columna '{col_name}' ya existe.")
                else:
                    print(f"[ERROR] No se pudo añadir '{col_name}': {e}")

        # 3. Crear Plan por defecto si no existe
        free_plan = db.query(models.Plan).filter(models.Plan.name == "Free").first()
        if not free_plan:
            new_plan = models.Plan(
                id=uuid.uuid4(),
                name="Free",
                description="Plan Básico Gratuito",
                commission_rate=0.1,
                monthly_fee=0,
                is_default=True,
                modules=["inicio", "facturacion", "pedidos", "envios", "productos", "clientes", "reports", "settings"]
            )
            db.add(new_plan)
            db.commit()
            print("[OK] Plan 'Free' creado.")
        else:
            print("[OK] Plan 'Free' ya existe.")

        print("--- MANTENIMIENTO COMPLETADO CON ÉXITO ---")

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_database()