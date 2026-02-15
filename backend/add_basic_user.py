
import uuid
from database import SessionLocal
from models import User, Plan
from security import get_password_hash

def add_basic_user():
    db = SessionLocal()
    try:
        # 1. Crear Plan Básico si no existe
        basic_plan = db.query(Plan).filter(Plan.name == "Basic").first()
        if not basic_plan:
            print("Creando Plan Básico...")
            basic_plan = Plan(
                id=uuid.uuid4(),
                name="Basic",
                description="Plan esencial para nuevas tiendas",
                commission_rate=0.05,
                monthly_fee=29.0,
                modules=['inicio', 'productos', 'pedidos', 'settings', 'studio'], # Módulos limitados
                is_default=False
            )
            db.add(basic_plan)
            db.commit()
            db.refresh(basic_plan)

        # 2. Crear Usuario Admin de Tienda (Plan Básico)
        user_email = "tienda@bayup.com"
        existing_user = db.query(User).filter(User.email == user_email).first()
        if not existing_user:
            print(f"Creando usuario admin de tienda: {user_email}...")
            new_user = User(
                id=uuid.uuid4(),
                email=user_email,
                full_name="Mi Tienda Local",
                nickname="Tienda Pro",
                hashed_password=get_password_hash("tienda123"),
                role="admin_tienda",
                status="Activo",
                is_global_staff=False, # No es super admin
                plan_id=basic_plan.id,
                onboarding_completed=True,
                permissions={} # Sin permisos globales de staff
            )
            db.add(new_user)
            db.commit()
            print(f"¡Usuario '{user_email}' creado exitosamente!")
        else:
            print(f"El usuario '{user_email}' ya existe.")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_basic_user()
