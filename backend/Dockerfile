FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema necesarias para PostgreSQL
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install uvicorn psycopg2-binary python-dotenv

# Forzar reconstrucción tras limpieza de Clerk y arreglos de sintaxis
ENV REBUILD_VERSION=2.6

# Copiar el código del backend
COPY . .

# Exponer el puerto 8080 (Requerido por Railway)
EXPOSE 8080

# Comando de inicio: Usamos el puerto 8080 para producción
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
