import os, sys, uuid
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import security
from sqlalchemy import create_engine, text

hashed = security.get_password_hash("123456")
print(f"Hash generado: {hashed[:20]}...")

engine = create_engine("sqlite:///sql_app.db")
with engine.connect() as conn:
    row = conn.execute(text('SELECT id, email, status FROM users WHERE email="davidaraque20@gmail.com"')).fetchone()
    if row:
        print(f"Usuario encontrado: {row}")
        conn.execute(text('UPDATE users SET hashed_password=:pw, status="Activo", email_confirmed=1 WHERE email="davidaraque20@gmail.com"'), {"pw": hashed})
        conn.commit()
        print("Listo: contraseña actualizada, status=Activo, email confirmado")
    else:
        print("No existe, creando...")
        uid = str(uuid.uuid4())
        conn.execute(text('''INSERT INTO users (id, email, hashed_password, full_name, role, status, email_confirmed, is_global_staff)
            VALUES (:id, :email, :pw, "David Araque", "admin", "Activo", 1, 0)'''),
            {"id": uid, "email": "davidaraque20@gmail.com", "pw": hashed})
        conn.commit()
        print(f"Creado con id={uid}")

# Verificar que el hash funciona
row2 = conn.execute(text('SELECT hashed_password FROM users WHERE email="davidaraque20@gmail.com"')).fetchone()
ok = security.verify_password("123456", row2[0])
print(f"Verificación de contraseña: {'OK' if ok else 'FALLO'}")
