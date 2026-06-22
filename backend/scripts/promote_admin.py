"""
Promueve admin@bayup.com a super admin (is_global_staff=True, role=SUPER_ADMIN).
Si no existe, lo crea con una contraseña aleatoria generada en el momento (se imprime
una sola vez en consola, no queda hardcodeada en este archivo).

Ejecutar desde la carpeta backend/:
  python scripts/promote_admin.py
"""
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from sqlalchemy import text
import models, security

TARGET_EMAIL    = "admin@bayup.com"
TARGET_PASSWORD = security.generate_random_password()

def promote():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == TARGET_EMAIL).first()

        if user:
            user.role            = "SUPER_ADMIN"
            user.is_global_staff = True
            db.commit()
            print(f"[OK] Usuario '{TARGET_EMAIL}' actualizado a SUPER_ADMIN")
        else:
            # Crear desde cero
            hashed = security.get_password_hash(TARGET_PASSWORD)
            new_user = models.User(
                email            = TARGET_EMAIL,
                full_name        = "Admin Bayup",
                hashed_password  = hashed,
                role             = "SUPER_ADMIN",
                is_global_staff  = True,
                status           = "Activo",
            )
            db.add(new_user)
            db.commit()
            print(f"[OK] Usuario '{TARGET_EMAIL}' creado con role=SUPER_ADMIN y contraseña '{TARGET_PASSWORD}'")
    except Exception as e:
        print(f"[ERROR] {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    promote()
