import sqlite3

def add_logo_column():
    try:
        conn = sqlite3.connect('backend/sql_app.db')
        cursor = conn.cursor()
        
        # Verificar si la columna existe
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'logo_url' not in columns:
            print("Agregando columna 'logo_url' a la tabla 'users'...")
            cursor.execute("ALTER TABLE users ADD COLUMN logo_url TEXT")
            conn.commit()
            print("Columna agregada exitosamente.")
        else:
            print("La columna 'logo_url' ya existe.")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_logo_column()
