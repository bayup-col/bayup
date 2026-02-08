FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiamos los requerimientos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos todo el contenido de la carpeta backend
COPY . .

# Exponemos el puerto que usa Railway
EXPOSE 8000

# Comando de inicio delegando el manejo del puerto al script Python
CMD python main.py
