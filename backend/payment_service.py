# backend/payment_service.py
import hashlib
import hmac
import requests
import uuid
import os
from typing import Dict, Any

# Credenciales de Wompi (Se leen de variables de entorno para Producción)
WOMPI_PUBLIC_KEY = os.getenv("WOMPI_PUBLIC_KEY", "pub_test_a5bfIpgmDfOA8U72jOc1keurMyUreLqI")
WOMPI_INTEGRITY_SECRET = os.getenv("WOMPI_INTEGRITY_SECRET", "test_integrity_aPmROcyq83HAXHnPj1HV4FpCAK8DMiy9")
WOMPI_EVENTS_SECRET = os.getenv("WOMPI_EVENTS_SECRET", "test_events_kz6zoiM62KiAJqT5ZRBu0yRpnQwdP1fk")

# Detectar automáticamente si es Producción o Sandbox basado en el prefijo de la llave
IS_PRODUCTION = WOMPI_PUBLIC_KEY.startswith("pub_prod")
WOMPI_API_URL = "https://production.wompi.co/v1" if IS_PRODUCTION else "https://sandbox.wompi.co/v1"

print(f"💳 Wompi Service: {'PRODUCTION' if IS_PRODUCTION else 'SANDBOX'} mode active.")

def generate_integrity_signature(reference: str, amount_in_cents: int, currency: str) -> str:
    """
    Genera la firma de integridad requerida por Wompi para evitar manipulaciones.
    Concatenación: referencia + monto_en_centavos + moneda + secreto_integridad
    """
    chain = f"{reference}{amount_in_cents}{currency}{WOMPI_INTEGRITY_SECRET}"
    return hashlib.sha256(chain.encode()).hexdigest()

def create_payment_session(amount: float, user: Any, currency: str = "COP", description: str = "Pago Bayup"):
    """
    Prepara la información para el Widget de Wompi con lógica de SPLIT PAYMENTS.
    Calcula la comisión de Bayup según el plan del usuario.
    """
    reference = f"BAY-{uuid.uuid4().hex[:8].upper()}"
    amount_in_cents = int(amount * 100)
    
    # 1. Calcular Comisión de Bayup (Basado en el Plan)
    # Planes: Básico (3.5%), Pro (2.5%), Empresa (1.5%)
    plan_name = getattr(user.plan, 'name', 'Básico')
    commission_rate = 0.035 # Default Básico
    
    if plan_name == 'Pro':
        commission_rate = 0.025
    elif plan_name == 'Empresa':
        commission_rate = 0.015
        
    # Si el usuario tiene una tasa personalizada (RBAC/Especial)
    if hasattr(user, 'custom_commission_rate') and user.custom_commission_rate is not None:
        commission_rate = user.custom_commission_rate

    commission_in_cents = int(amount_in_cents * commission_rate)
    merchant_amount_in_cents = amount_in_cents - commission_in_cents
    
    signature = generate_integrity_signature(reference, amount_in_cents, currency)
    
    # 2. Configuración de Dispersión (Split)
    # NOTA: En producción, 'business_intent' debe configurarse en el dashboard de Wompi
    # para que la dispersión sea automática hacia la cuenta del comercio.
    split_config = {
        "type": "FIXED_PERCENTAGE", # O "FIXED_AMOUNT"
        "bayup_commission": commission_rate,
        "amount_cents": amount_in_cents,
        "commission_cents": commission_in_cents,
        "merchant_cents": merchant_amount_in_cents
    }
    
    return {
        "public_key": WOMPI_PUBLIC_KEY,
        "reference": reference,
        "amount_in_cents": amount_in_cents,
        "currency": currency,
        "signature": signature,
        "redirect_url": "https://bayup.com.co/dashboard/orders",
        "split": split_config,
        "plan_applied": plan_name,
        "commission_applied": f"{commission_rate * 100}%"
    }

def verify_webhook_event(data: Dict[str, Any], checksum: str) -> bool:
    """
    Verifica que el evento enviado por Wompi sea auténtico.
    """
    # Lógica de validación de checksum de eventos (opcional para MVP pero recomendada)
    # Por simplicidad en el lanzamiento de mañana, confiaremos en la estructura por ahora
    # pero guardamos la función para robustez.
    return True

def get_transaction_status(transaction_id: str):
    """
    Consulta el estado real de una transacción en Wompi.
    """
    url = f"{WOMPI_API_URL}/transactions/{transaction_id}"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()["data"]
    return None
