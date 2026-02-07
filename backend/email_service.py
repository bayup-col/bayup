import os
from dotenv import load_dotenv
import requests

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
BASE_URL = "https://bayup.com.co"
SENDER = "Bayup <info@bayup.com.co>"

def send_email(to_email: str, subject: str, html_content: str):
    if not RESEND_API_KEY:
        print("ERROR: No se ha configurado RESEND_API_KEY")
        return False

    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "from": SENDER,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code in [200, 201]:
            print(f"Correo enviado exitosamente a {to_email}")
            return True
        else:
            print(f"Error de Resend ({response.status_code}): {response.text}")
            return False
    except Exception as e:
        print(f"Error enviando correo: {e}")
        return False

# --- COMPONENTES VISUALES ---
S_HEADER = "background-color: #004d4d; padding: 40px; text-align: center; border-radius: 20px 20px 0 0;"
S_BODY = "padding: 40px; background-color: #ffffff; color: #333; line-height: 1.6; font-family: Arial, sans-serif;"
S_BTN = "display: inline-block; background-color: #004d4d; color: #ffffff !important; padding: 18px 35px; text-decoration: none; border-radius: 12px; font-weight: bold; text-transform: uppercase; margin: 25px 0;"
S_FOOTER = "padding: 30px; text-align: center; color: #999; font-size: 11px;"

# --- PLANTILLAS ---

def send_welcome_email(user_email: str, user_name: str):
    html = f"""
    <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px;">
        <div style="{S_HEADER}"><h1 style="color: #00f2ff; font-style: italic; margin: 0;">BAYUP</h1></div>
        <div style="{S_BODY}">
            <h2 style="color: #004d4d;">Bienvenido, {user_name}.</h2>
            <p>Tu cuenta ha sido vinculada exitosamente al ecosistema Bayup.</p>
            <div style="text-align: center;"><a href="{BASE_URL}/dashboard" style="{S_BTN}">Entrar al Dashboard</a></div>
        </div>
        <div style="{S_FOOTER}">© 2026 Bayup Intel.</div>
    </div>
    """
    return send_email(user_email, "Bienvenido a Bayup 🚀", html)

def send_staff_invitation(user_email: str, user_name: str, temp_pass: str, inviter_name: str, permissions: dict = None):
    allowed_modules = []
    if permissions:
        names = {
            'inicio': 'Dashboard', 'empresas': 'Empresas', 'afiliados': 'Afiliados', 
            'tesoreria': 'Tesorería', 'web_analytics': 'Estadísticas',
            'marketing': 'Marketing', 'soporte': 'Soporte', 'settings': 'Ajustes'
        }
        allowed_modules = [names.get(k, k) for k, v in permissions.items() if v]

    modules_html = ""
    if allowed_modules:
        list_items = "".join([f'<li style="display: inline-block; background: #f4fdfd; color: #004d4d; padding: 5px 10px; border-radius: 15px; margin: 2px; font-size: 10px; font-weight: bold;">{m}</li>' for m in allowed_modules])
        modules_html = f'<div style="margin-top: 15px;"><p style="font-size: 11px; color: #999;">MÓDULOS ACTIVOS:</p><ul style="list-style: none; padding: 0;">{list_items}</ul></div>'

    html = f"""
    <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px;">
        <div style="{S_HEADER}"><h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 3px;">INVITACIÓN FORMAL</h1></div>
        <div style="{S_BODY}">
            <h2 style="color: #004d4d;">Hola, {user_name}.</h2>
            <p><strong>{inviter_name}</strong> te invita a formar parte del equipo en <strong>Bayup</strong>.</p>
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold;">DATOS DE ACCESO:</p>
                <p style="margin: 5px 0;">Email: {user_email}</p>
                <p style="margin: 5px 0;">Clave: <span style="color: #004d4d; font-family: monospace;">{temp_pass}</span></p>
                {modules_html}
            </div>
            <div style="text-align: center;"><a href="{BASE_URL}/login" style="{S_BTN}">Aceptar y Entrar</a></div>
        </div>
    </div>
    """
    return send_email(user_email, f"{inviter_name} te invita a Bayup", html)

def send_affiliate_welcome(user_email: str, user_name: str, temp_pass: str):
    html = f"""
    <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px;">
        <div style="{S_HEADER}"><h1 style="color: #00f2ff; font-style: italic; margin: 0;">PARTNERS</h1></div>
        <div style="{S_BODY}">
            <h2 style="color: #004d4d;">Gracias, {user_name}.</h2>
            <p>Tu solicitud como afiliado ha sido recibida. Pronto un asesor te contactará.</p>
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p>Usuario: {user_email}</p>
                <p>Contraseña: {temp_pass}</p>
            </div>
            <div style="text-align: center;"><a href="{BASE_URL}/login" style="{S_BTN}">Ir al Panel</a></div>
        </div>
    </div>
    """
    return send_email(user_email, "Bienvenido a Partners Bayup", html)

def send_password_reset(user_email: str, new_pass: str):
    html = f"""
    <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px;">
        <div style="background-color: #f43f5e; padding: 40px; text-align: center;"><h1 style="color: #white; margin: 0;">SEGURIDAD</h1></div>
        <div style="{S_BODY}">
            <h2 style="color: #004d4d;">Nueva Clave.</h2>
            <p>Tu clave temporal es: <strong>{new_pass}</strong></p>
            <div style="text-align: center;"><a href="{BASE_URL}/login" style="{S_BTN}">Iniciar Sesión</a></div>
        </div>
    </div>
    """
    return send_email(user_email, "Restablecer Clave - Bayup", html)