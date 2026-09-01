"""
Gate mínimo para funciones exclusivas de un tenant específico.

Bayup no tiene (todavía) un sistema de módulos por plan realmente aplicado
(Plan.modules existe pero no se valida en ningún endpoint). Para las
funciones nuevas construidas exclusivamente para el tenant Orzen (blog,
wishlist, cuenta de cliente, direcciones) se usa este guard explícito en
vez de exponerlas a todos los tenants.
"""
from fastapi import HTTPException

ORZEN_SLUG = "orzen"


def require_orzen_tenant(tenant) -> None:
    """Lanza 404 si el tenant resuelto no es Orzen."""
    if not tenant or (tenant.shop_slug or "").lower() != ORZEN_SLUG:
        raise HTTPException(status_code=404, detail="No disponible")
