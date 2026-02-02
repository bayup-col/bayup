from database import engine, Base
import models  # Importa los modelos para que Base los reconozca

def init_db():
    print("Conectando a Supabase y creando tablas...")
    try:
        Base.metadata.create_all(bind=engine)
        print("¡Éxito! Las tablas han sido creadas en Supabase.")
    except Exception as e:
        print(f"Error al crear las tablas: {e}")

if __name__ == "__main__":
    init_db()
