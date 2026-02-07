import sys, os
os.chdir('backend')
sys.path.append(os.getcwd())
from database import engine
from sqlalchemy import text

with engine.begin() as conn:
    conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_global_staff BOOLEAN DEFAULT FALSE'))
    conn.execute(text("UPDATE users SET is_global_staff = TRUE WHERE email = 'bayupcol@gmail.com'"))
    print('Base de datos sincronizada con sello Global. 💎')
