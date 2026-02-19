import os
import requests
from jose import jwt
from fastapi import HTTPException, status
from typing import Dict
from dotenv import load_dotenv

load_dotenv()

# Clerk Configuration
CLERK_API_URL = os.getenv("CLERK_API_URL") # e.g., https://api.clerk.dev/v1
CLERK_ISSUER = os.getenv("CLERK_ISSUER") # e.g., https://clerk.yourdomain.com
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL") # e.g., https://clerk.yourdomain.com/.well-known/jwks.json

_jwks_cache = None

def get_jwks():
    global _jwks_cache
    if _jwks_cache is None:
        if not CLERK_JWKS_URL:
            # Fallback a un error informativo si no hay URL configurada
            return None
        try:
            response = requests.get(CLERK_JWKS_URL)
            response.raise_for_status()
            _jwks_cache = response.json()
        except Exception as e:
            print(f"Error fetching Clerk JWKS: {e}")
            return None
    return _jwks_cache

async def verify_clerk_token(clerk_token: str) -> Dict:
    """
    Verifica un token JWT emitido por Clerk contra sus claves públicas (JWKS).
    """
    jwks = get_jwks()
    if not jwks:
        # Si no hay JWKS (desarrollo local sin Clerk configurado), lanzamos error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Clerk authentication is not configured on the server."
        )

    try:
        # Decodificar el token usando las claves de Clerk
        payload = jwt.decode(
            clerk_token,
            jwks,
            algorithms=["RS256"],
            issuer=CLERK_ISSUER,
            options={"verify_aud": False} # Clerk usa diferentes audiencias según el cliente
        )
        
        # El sub en Clerk es el ID único del usuario (user_...)
        return {
            "id": payload.get("sub"),
            "email": payload.get("email"),
            "full_name": payload.get("name")
        }
    except Exception as e:
        print(f"Clerk JWT Verification Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Clerk token",
            headers={"WWW-Authenticate": "Bearer"},
        )
