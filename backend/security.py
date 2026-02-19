# backend/security.py
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
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

SECRET_KEY = os.getenv("SECRET_KEY", "a_very_secret_key_that_should_be_in_env_var")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480 # 8 Horas

# --- Security Schemes ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

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

# --- Current User Dependency ---
async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    email: str | None = None
    
    # 1. Intentar como Token Local (HS256)
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        # 2. Si falla el local, intentar como Token de Clerk (RS256)
        from clerk_auth_service import verify_clerk_token
        try:
            clerk_user = await verify_clerk_token(token)
            email = clerk_user.get("email")
        except Exception:
            raise credentials_exception
    
    if email is None:
        raise credentials_exception
    
    user = crud.get_user_by_email(db, email=email)
    if user is None:
        print(f"DEBUG SECURITY: Usuario no encontrado en DB: {email}")
        raise credentials_exception
    return user

def get_super_admin_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted for this user role",
        )
    return current_user

