from database import SessionLocal, engine
from sqlalchemy import text, inspect

def check_db():
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('users')]
    print(f"Users columns: {columns}")
    
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, email, role, owner_id FROM users LIMIT 5"))
        for row in result:
            print(row)

if __name__ == "__main__":
    check_db()
