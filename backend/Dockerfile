FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install uvicorn psycopg2-binary python-dotenv python-jose[cryptography] passlib[bcrypt]

COPY . .

# Railway inyecta la variable PORT, uvicorn debe escuchar en 0.0.0.0 y ese puerto
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
