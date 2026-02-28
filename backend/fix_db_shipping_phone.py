import sqlite3

def add_shipping_phone_column():
    try:
        conn = sqlite3.connect('backend/sql_app.db')
        cursor = conn.cursor()
        
        # Verificar si la columna existe en la tabla shipments
        cursor.execute("PRAGMA table_info(shipments)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'recipient_phone' not in columns:
            print("Agregando columna 'recipient_phone' a la tabla 'shipments'...")
            cursor.execute("ALTER TABLE shipments ADD COLUMN recipient_phone TEXT")
            conn.commit()
            print("Columna agregada exitosamente.")
        else:
            print("La columna 'recipient_phone' ya existe.")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_shipping_phone_column()
