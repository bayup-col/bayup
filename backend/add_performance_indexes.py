import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("No se encontró DATABASE_URL, usando sql_app.db local")
    DATABASE_URL = "sqlite:///./sql_app.db"

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

INDEXES = [
    ("ix_orders_tenant_id", "orders", "tenant_id"),
    ("ix_orders_status", "orders", "status"),
    ("ix_orders_created_at", "orders", "created_at"),
    ("ix_expenses_tenant_id", "expenses", "tenant_id"),
    ("ix_expenses_status", "expenses", "status"),
    ("ix_activity_logs_tenant_id", "activity_logs", "tenant_id"),
    ("ix_activity_logs_created_at", "activity_logs", "created_at"),
    ("ix_shipments_tenant_id", "shipments", "tenant_id"),
    ("ix_shipments_status", "shipments", "status"),
    ("ix_notifications_tenant_id", "notifications", "tenant_id"),
    ("ix_notifications_created_at", "notifications", "created_at"),
]

def run():
    with engine.connect() as conn:
        for name, table, col in INDEXES:
            try:
                conn.execute(text(f"CREATE INDEX IF NOT EXISTS {name} ON {table}({col})"))
                conn.commit()
                print(f"OK {name}")
            except Exception as e:
                print(f"FAIL {name}: {e}")
                conn.rollback()

if __name__ == "__main__":
    run()
