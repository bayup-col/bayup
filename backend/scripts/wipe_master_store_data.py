"""
Elimina todos los datos operativos de prueba del store del usuario maestro
(productos, variantes, pedidos, clientes, etc.) sin tocar la cuenta ni la configuración.

Uso: python backend/scripts/wipe_master_store_data.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import SessionLocal
import models

MASTER_EMAIL = "dntonline13@gmail.com"

def wipe():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == MASTER_EMAIL).first()
        if not user:
            print(f"ERROR: No se encontró el usuario {MASTER_EMAIL}. Abortando.")
            return

        tid = str(user.id)
        print(f"Usuario: {MASTER_EMAIL}  |  ID: {tid}")
        print("Iniciando limpieza de datos de prueba...\n")

        steps = [
            ("Items de pedidos",   f"DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE tenant_id = '{tid}')"),
            ("Variantes de productos", f"DELETE FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE owner_id = '{tid}')"),
            ("Pedidos",            f"DELETE FROM orders WHERE tenant_id = '{tid}'"),
            ("Productos",          f"DELETE FROM products WHERE owner_id = '{tid}'"),
            ("Colecciones",        f"DELETE FROM collections WHERE owner_id = '{tid}'"),
            ("Clientes",           f"DELETE FROM customers WHERE tenant_id = '{tid}'"),
            ("Envíos",             f"DELETE FROM shipments WHERE tenant_id = '{tid}'"),
        ]

        for label, sql in steps:
            result = db.execute(text(sql))
            print(f"  OK {label}: {result.rowcount} registros eliminados")

        db.commit()
        print("\nLIMPIEZA COMPLETADA. El store queda en cero, la cuenta intacta.")

    except Exception as e:
        db.rollback()
        print(f"\n❌ ERROR: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    confirm = input(f"\nATENCION: Esto borrara TODOS los datos de prueba de {MASTER_EMAIL}.\nEscribe CONFIRMAR para continuar: ")
    if confirm.strip() == "CONFIRMAR":
        wipe()
    else:
        print("Operacion cancelada.")
