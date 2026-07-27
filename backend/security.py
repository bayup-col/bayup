# backend/security.py
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt

import crud, models, schemas
from database import get_db

# --- Configuration ---
# Cargar variables de entorno
from dotenv import load_dotenv
import os
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY no está configurada. Genera una con: "
        "python -c \"import secrets; print(secrets.token_hex(32))\" "
        "y ponla en backend/.env (local) o en las env vars de Render (producción)."
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # CRIT-004: reducido a 60 min
REFRESH_TOKEN_EXPIRE_DAYS = 30

# --- Security Schemes ---
# auto_error=False: no lanza 401 automáticamente si falta el header Authorization,
# permitiendo que get_current_user evalúe la cookie httpOnly como alternativa (CRIT-004).
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

# --- Password Hashing ---
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

import secrets
import string

def generate_random_password(length: int = 10) -> str:
    """Genera una contraseña aleatoria elegante para Bayup."""
    # Usamos letras y números para que sea fácil de escribir pero segura
    characters = string.ascii_letters + string.digits
    # Aseguramos un prefijo para que el usuario sepa que es de Bayup
    password = "Byp-" + "".join(secrets.choice(characters) for _ in range(length - 4))
    return password

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# --- JWT Token Handling ---
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: str) -> str:
    """Genera un refresh token de larga duración (30 días). Almacenado en cookie httpOnly."""
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    data = {"sub": subject, "type": "refresh", "exp": expire}
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

# --- Current User Dependency ---
async def get_current_user(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    """Autentica desde cookie httpOnly OR header Authorization (CRIT-004, dual mode).
    Prioridad: Bearer token en Authorization header > cookie bayup_access_token.
    Esto permite la impersonación: el super admin envía el Bearer token de la empresa
    mientras su cookie sigue activa — el Bearer gana para que la sesión cambie."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Bearer header tiene prioridad; si no hay, caer al cookie httpOnly (p.ej. refresh flow)
    cookie_token = request.cookies.get("bayup_access_token")
    actual_token = token or cookie_token
    if not actual_token:
        raise credentials_exception

    try:
        payload = jwt.decode(actual_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") == "refresh":
            raise credentials_exception
        email = payload.get("sub")
    except JWTError:
        raise credentials_exception

    if email is None:
        raise credentials_exception

    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    if user.status not in ("Activo", "active"):
        raise HTTPException(status_code=403, detail="Cuenta suspendida")
    return user

