from sqlalchemy import text
from database import engine

def reset_laboratory():
    print("🚀 Iniciando Protocolo: Reseteo de Laboratorio (Factory Reset)...")
    
    tables_to_wipe = [
        'order_items',
        'orders',
        'product_variants',
        'products',
        'collections',
        'expenses',
        'incomes',
        'receivables',
        'payroll_employees',
        'purchase_orders',
        'shipments',
        'ai_assistant_logs'
    ]
    
    with engine.connect() as conn:
        try:
            for table in tables_to_wipe:
                # RESTART IDENTITY asegura que los contadores de ID vuelvan a 1
                conn.execute(text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE;"))
            conn.commit()
            print("✅ Laboratorio reseteado. Todas las tablas de negocio están vacías.")
        except Exception as e:
            print(f"❌ Error durante el reseteo: {e}")

if __name__ == "__main__":
    reset_laboratory()
