"""
Instancia única del rate limiter compartida entre main.py y los routers.
Usar con @limiter.limit("N/minute") en los endpoints.
"""
from fastapi import Request
from slowapi import Limiter


def _get_real_ip(request: Request) -> str:
    """Lee la IP real desde X-Forwarded-For (Render inyecta este header).
    Se usa la ÚLTIMA IP porque es la añadida por el proxy confiable, no la del cliente (ALTA-001)."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return [ip.strip() for ip in forwarded.split(",")][-1]
    return request.client.host or "127.0.0.1"


limiter = Limiter(key_func=_get_real_ip)
