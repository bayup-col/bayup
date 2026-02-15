
import uuid
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import User, Plan, Product
from security import get_password_hash

def init_db():
    print("Creando tablas en SQLite...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Crear Plan Enterprise si no existe
        enterprise_plan = db.query(Plan).filter(Plan.name == "Enterprise").first()
        if not enterprise_plan:
            print("Creando Plan Enterprise...")
            enterprise_plan = Plan(
                id=uuid.uuid4(),
                name="Enterprise",
                description="Acceso total a todos los módulos",
                commission_rate=0.0,
                monthly_fee=0.0,
                modules=['inicio', 'productos', 'pedidos', 'settings', 'studio', 'invoicing', 'customers', 'marketing', 'inventory'],
                is_default=True
            )
            db.add(enterprise_plan)
            db.commit()
            db.refresh(enterprise_plan)

        # 2. Crear Usuario Admin si no existe
        admin_email = "admin@bayup.com"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            print(f"Creando usuario administrador: {admin_email}...")
            admin_user = User(
                id=uuid.uuid4(),
                email=admin_email,
                full_name="Administrador Local",
                nickname="Admin",
                hashed_password=get_password_hash("admin123"),
                role="admin_tienda",
                status="Activo",
                is_global_staff=True,
                plan_id=enterprise_plan.id,
                onboarding_completed=True,
                permissions={"all": True}
            )
            db.add(admin_user)
            db.commit()
            print("¡Usuario administrador creado exitosamente!")
        else:
            print("El usuario administrador ya existe.")
            
    except Exception as e:
        print(f"Error inicializando base de datos: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
