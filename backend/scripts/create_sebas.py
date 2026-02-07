# backend/create_sebas.py
from database import SessionLocal
import crud, schemas, security

def create_user():
    db = SessionLocal()
    email = "sebas@sebas.com"
    password = "123" # O la contraseña que tú desees, usaré esta de ejemplo
    
    # Verificar si ya existe
    existing_user = crud.get_user_by_email(db, email=email)
    if existing_user:
        print(f"User {email} already exists.")
        db.close()
        return

    # Crear esquema de usuario
    user_in = schemas.UserCreate(
        email=email,
        password=password,
        full_name="Sebastián Bayup",
        nickname="Sebas"
    )
    
    # Crear en DB con rol admin_tienda para que tengas acceso como dueño de tienda
    user = crud.create_user(db=db, user=user_in)
    user.role = "admin_tienda"
    db.commit()
    
    print(f"User {email} created successfully with Store Admin role.")
    db.close()

if __name__ == "__main__":
    create_user()
