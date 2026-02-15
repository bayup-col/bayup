
import socket
import os
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL", "")
print(f"Probando URL: {db_url}")

if "@" in db_url:
    host = db_url.split("@")[1].split(":")[0]
    print(f"Intentando resolver host: {host}")
    try:
        ip = socket.gethostbyname(host)
        print(f"Host resuelto exitosamente: {ip}")
    except socket.gaierror:
        print("ERROR: No se pudo resolver el host. Verifica que la URL en el .env sea correcta.")
else:
    print("La URL no parece ser una conexión remota válida o es SQLite.")
