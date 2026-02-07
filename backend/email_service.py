import os
from dotenv import load_dotenv
import requests

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY")

def send_email(to_email: str, subject: str, html_content: str):
    """
    Función base para enviar correos usando Resend.
    """
    if not RESEND_API_KEY:
        print("ERROR: No se ha configurado RESEND_API_KEY")
        return False

    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "from": "Bayup <hola@bayup.com.co>",
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        return response.status_code == 200 or response.status_code == 201
    except Exception as e:
        print(f"Error enviando correo: {e}")
        return False

# --- PLANTILLAS ---

def send_welcome_email(user_email: str, user_name: str):
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #004d4d; text-align: center;">¡Bienvenido a la nueva era, {user_name}! 🚀</h2>
        <p>Estamos muy emocionados de tenerte en <strong>Bayup</strong>. Tu tienda online ya está lista para empezar a recibir ventas.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://bayup.com.co/dashboard" style="background-color: #004d4d; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Entrar a mi Dashboard</a>
        </div>
        <p style="font-size: 12px; color: #666;">Si tienes alguna duda, responde a este correo y nuestro equipo te ayudará de inmediato.</p>
        <hr>
        <p style="text-align: center; font-style: italic;">"Vender inteligente es vender con Bayup"</p>
    </div>
    """
    return send_email(user_email, "¡Bienvenido a Bayup!", html)

def send_staff_invitation(user_email: str, user_name: str, temp_pass: str, inviter_name: str):
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #004d4d;">Hola {user_name},</h2>
        <p><strong>{inviter_name}</strong> te ha invitado a formar parte del equipo de Bayup como administrador.</p>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p><strong>Tus credenciales de acceso:</strong></p>
            <p>Email: {user_email}</p>
            <p>Contraseña Temporal: <span style="background-color: #00f2ff; padding: 2px 5px; font-family: monospace;">{temp_pass}</span></p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://bayup.com.co/login" style="background-color: #004d4d; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Aceptar Invitación y Entrar</a>
        </div>
        <p style="font-size: 12px; color: #666;">Por seguridad, te recomendamos cambiar tu contraseña una vez que ingreses al sistema.</p>
    </div>
    """
    return send_email(user_email, f"Invitación a colaborar en Bayup", html)
