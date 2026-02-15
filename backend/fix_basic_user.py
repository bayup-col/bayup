
import uuid
from database import SessionLocal
from models import User, Plan
from security import get_password_hash

def fix_basic_user():
    db = SessionLocal()
    try:
        # 1. Asegurar Plan Básico (Nombre exacto para el frontend)
        basic_plan = db.query(Plan).filter(Plan.name == "Básico").first()
        if not basic_plan:
            print("Creando Plan Básico (Unificado)...")
            basic_plan = Plan(
                id=uuid.uuid4(),
                name="Básico",
                description="Plan esencial unificado para producción",
                commission_rate=0.05,
                monthly_fee=29.0,
                # Usamos los IDs que el frontend espera en lib/plan-configs.ts
                modules=[
                    'inicio', 
                    'facturacion', 
                    'pedidos', 
                    'envios', 
                    'productos', # Unificado
                    'mensajes', 
                    'clientes', 
                    'settings', 
                    'settings_general', 
                    'settings_plan', 
                    'reports', 
                    'reports_gen' # Unificado (Analisis General)
                ],
                is_default=False
            )
            db.add(basic_plan)
            db.commit()
            db.refresh(basic_plan)
        else:
            # Actualizar módulos si ya existe
            basic_plan.modules = [
                'inicio', 'facturacion', 'pedidos', 'envios', 'productos', 
                'mensajes', 'clientes', 'settings', 'settings_general', 
                'settings_plan', 'reports', 'reports_gen'
            ]
            db.commit()

        # 2. Actualizar Usuario
        user_email = "tienda@bayup.com"
        user = db.query(User).filter(User.email == user_email).first()
        if user:
            print(f"Actualizando usuario '{user_email}' al Plan Básico unificado...")
            user.plan_id = basic_plan.id
            user.full_name = "Bayup Store (Básico)"
            user.role = "admin_tienda"
            db.commit()
            print("¡Usuario actualizado!")
        else:
            print(f"Usuario {user_email} no encontrado.")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_basic_user()
