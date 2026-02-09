import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import SessionLocal, engine
import models

def wipe_data():
    db = SessionLocal()
    try:
        # 1. Identificar al usuario maestro
        master_email = "dntonline13@gmail.com"
        master_user = db.query(models.User).filter(models.User.email == master_email).first()
        
        if not master_user:
            print(f"ALERTA: El usuario maestro {master_email} no existe. Abortando para seguridad.")
            return

        master_id = str(master_user.id)
        print(f"Usuario Maestro identificado: {master_email} (ID: {master_id})")

        # 2. Identificar usuarios a limpiar (todos menos el maestro)
        users_to_wipe = db.query(models.User).filter(models.User.id != master_user.id).all()
        
        if not users_to_wipe:
            print("No hay otros usuarios para limpiar.")
            return

        print(f"Se encontraron {len(users_to_wipe)} usuarios para limpiar datos.")
        
        target_ids = [u.id for u in users_to_wipe]
        
        # 3. Ejecutar limpieza en orden de dependencia (Hijos primero, luego Padres)
        
        # --- LEVEL 1: Deep Dependencies ---
        print("Eliminando items de pedidos...")
        # Borrar items de ordenes que pertenezcan a ordenes de estos tenants
        # Subquery compleja en SQL, lo haremos iterando o con delete masivo filtrado
        # Opción segura: Borrar items donde la orden.tenant_id esté en target_ids
        db.execute(text(f"DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE tenant_id != '{master_id}')"))
        
        print("Eliminando variantes de productos...")
        db.execute(text(f"DELETE FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE owner_id != '{master_id}')"))

        print("Eliminando logs de IA...")
        db.execute(text(f"DELETE FROM ai_assistant_logs WHERE assistant_id IN (SELECT id FROM ai_assistants WHERE owner_id != '{master_id}')"))

        # --- LEVEL 2: Operational Data ---
        print("Eliminando envíos...")
        db.execute(text(f"DELETE FROM shipments WHERE tenant_id != '{master_id}'"))
        
        print("Eliminando pedidos...")
        db.execute(text(f"DELETE FROM orders WHERE tenant_id != '{master_id}'"))
        
        print("Eliminando productos...")
        db.execute(text(f"DELETE FROM products WHERE owner_id != '{master_id}'"))
        
        print("Eliminando categorías (collections)...")
        db.execute(text(f"DELETE FROM collections WHERE owner_id != '{master_id}'"))

        # --- LEVEL 3: Business Data ---
        print("Eliminando finanzas (expenses, receivables, incomes)...")
        db.execute(text(f"DELETE FROM expenses WHERE tenant_id != '{master_id}'"))
        db.execute(text(f"DELETE FROM receivables WHERE tenant_id != '{master_id}'"))
        db.execute(text(f"DELETE FROM incomes WHERE tenant_id != '{master_id}'"))
        
        print("Eliminando nómina y proveedores...")
        db.execute(text(f"DELETE FROM payroll_employees WHERE tenant_id != '{master_id}'"))
        db.execute(text(f"DELETE FROM sellers WHERE tenant_id != '{master_id}'"))
        db.execute(text(f"DELETE FROM providers WHERE tenant_id != '{master_id}'"))
        db.execute(text(f"DELETE FROM purchase_orders WHERE tenant_id != '{master_id}'"))

        # --- LEVEL 4: Configuration & Logs ---
        print("Eliminando asistentes de IA...")
        db.execute(text(f"DELETE FROM ai_assistants WHERE owner_id != '{master_id}'"))
        
        print("Eliminando páginas web...")
        db.execute(text(f"DELETE FROM pages WHERE owner_id != '{master_id}'"))
        
        print("Eliminando configuraciones (tax, shipping options, roles)...")
        db.execute(text(f"DELETE FROM tax_rates WHERE owner_id != '{master_id}'"))
        db.execute(text(f"DELETE FROM shipping_options WHERE owner_id != '{master_id}'"))
        db.execute(text(f"DELETE FROM custom_roles WHERE owner_id != '{master_id}'"))
        
        print("Eliminando notificaciones y logs de actividad...")
        db.execute(text(f"DELETE FROM notifications WHERE tenant_id != '{master_id}'"))
        db.execute(text(f"DELETE FROM activity_logs WHERE tenant_id != '{master_id}'"))

        db.commit()
        print("¡LIMPIEZA COMPLETADA CON ÉXITO! Todos los usuarios (excepto dntonline13) están en cero.")

    except Exception as e:
        print(f"ERROR DURANTE LA LIMPIEZA: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    wipe_data()
