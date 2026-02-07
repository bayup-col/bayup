import os
from dotenv import load_dotenv
import requests

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
BASE_URL = "https://bayup.com.co"
SENDER = "Bayup <hola@info.bayup.com.co>"

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
        return response.status_code in [200, 201]
    except Exception as e:
        print(f"Error enviando correo: {e}")
        return False

# --- COMPONENTES VISUALES ---
STYLE_HEADER = "background-color: #004d4d; padding: 40px; text-align: center; border-radius: 20px 20px 0 0;"
STYLE_BODY = "padding: 40px; background-color: #ffffff; color: #333; line-height: 1.6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;"
STYLE_BUTTON = "display: inline-block; background-color: #004d4d; color: #ffffff; padding: 18px 35px; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin: 25px 0;"
STYLE_FOOTER = "padding: 30px; text-align: center; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;"

# --- PLANTILLAS ---

def send_welcome_email(user_email: str, user_name: str):
    html = f"""
    <div style="max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
        <div style="{STYLE_HEADER}">
            <h1 style="color: #00f2ff; font-style: italic; margin: 0; font-size: 32px;">BAYUP</h1>
        </div>
        <div style="{STYLE_BODY}">
            <h2 style="color: #004d4d; font-size: 24px; margin-top: 0;">Bienvenido al Ecosistema, {user_name}.</h2>
            <p>Es un honor para nosotros darte la bienvenida a la plataforma que redifinirá el futuro de tu comercio.</p>
            <p>Tu cuenta ha sido vinculada exitosamente. Desde este momento, tienes acceso a una infraestructura diseñada para escalar sin límites.</p>
            <div style="text-align: center;">
                <a href="{BASE_URL}/dashboard" style="{STYLE_BUTTON}">Acceder a mi Terminal</a>
            </div>
            <p style="font-style: italic; color: #666;">"Vender inteligente es vender con Bayup."</p>
        </div>
        <div style="{STYLE_FOOTER}">
            © 2026 Bayup Interactive Intel. <br> Bogotá, Colombia.
        </div>
    </div>
    """
    return send_email(user_email, "Tu aventura en Bayup comienza hoy 🚀", html)

def send_staff_invitation(user_email: str, user_name: str, temp_pass: str, inviter_name: str):
    html = f"""
    <div style="max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 20px;">
        <div style="{STYLE_HEADER}">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 5px;">INVITACIÓN FORMAL</h1>
        </div>
        <div style="{STYLE_BODY}">
            <h2 style="color: #004d4d;">Hola, {user_name}.</h2>
            <p><strong>{inviter_name}</strong> te ha extendido una invitación para unirte al equipo de gestión en <strong>Bayup</strong>.</p>
            <p>Tu rol es fundamental para potenciar la operatividad y el crecimiento de esta visión.</p>
            <div style="background-color: #f4fdfd; padding: 30px; border-radius: 15px; border-left: 4px solid #00f2ff; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #004d4d; font-weight: bold;">CREDENCIALES DE ACCESO:</p>
                <p style="margin: 10px 0 0 0;"><strong>Email:</strong> {user_email}</p>
                <p style="margin: 5px 0 0 0;"><strong>Clave Temporal:</strong> <span style="background-color: #004d4d; color: #00f2ff; padding: 2px 8px; border-radius: 4px;">{temp_pass}</span></p>
            </div>
            <div style="text-align: center;">
                <a href="{BASE_URL}/login" style="{STYLE_BUTTON}">Aceptar y Entrar</a>
            </div>
            <p style="font-size: 12px; color: #999;">Por motivos de seguridad, se te solicitará actualizar esta contraseña en tu primer ingreso.</p>
        </div>
        <div style="{STYLE_FOOTER}">
            Este es un correo automático de seguridad. <br> Bayup Intel System.
        </div>
    </div>
    """
    return send_email(user_email, f"{inviter_name} te invita a colaborar en Bayup", html)

def send_affiliate_welcome(user_email: str, user_name: str, temp_pass: str):
    html = f"""
    <div style="max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 20px;">
        <div style="{STYLE_HEADER}">
            <h1 style="color: #00f2ff; font-style: italic; margin: 0;">PARTNERS</h1>
        </div>
        <div style="{STYLE_BODY}">
            <h2 style="color: #004d4d;">Gracias por tu interés, {user_name}.</h2>
            <p>Hemos recibido tu solicitud para unirte a nuestra red de afiliados. En Bayup, creemos que el éxito se multiplica cuando se comparte.</p>
            <p><strong>¿Qué sigue ahora?</strong></p>
            <p>Uno de nuestros asesores estratégicos revisará tu perfil y se pondrá en contacto contigo en las próximas horas para darte la bienvenida oficial y explicarte cómo maximizar tus ganancias.</p>
            <p>Mientras tanto, puedes explorar tu panel de Partner con estos datos:</p>
            <div style="background-color: #f9f9f9; padding: 25px; border-radius: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Usuario:</strong> {user_email}</p>
                <p style="margin: 5px 0 0 0;"><strong>Contraseña:</strong> {temp_pass}</p>
            </div>
            <div style="text-align: center;">
                <a href="{BASE_URL}/afiliado/login" style="{STYLE_BUTTON}">Explorar Panel Partner</a>
            </div>
        </div>
        <div style="{STYLE_FOOTER}">
            Crezcamos juntos. <br> Bayup Affiliate Network.
        </div>
    </div>
    """
    return send_email(user_email, "Bienvenido a la red de aliados de Bayup", html)

def send_password_reset(user_email: str, new_pass: str):
    html = f"""
    <div style="max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 20px;">
        <div style="background-color: #f43f5e; padding: 40px; text-align: center; border-radius: 20px 20px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">SEGURIDAD</h1>
        </div>
        <div style="{STYLE_BODY}">
            <h2 style="color: #004d4d;">Restablecimiento de Clave.</h2>
            <p>Has solicitado una nueva contraseña para tu cuenta en Bayup. La seguridad de tu información es nuestra prioridad.</p>
            <p>Tu nueva clave de acceso temporal es:</p>
            <div style="text-align: center; background-color: #f9f9f9; padding: 30px; border-radius: 15px; margin: 20px 0; font-size: 24px; font-weight: bold; color: #004d4d; letter-spacing: 5px;">
                {new_pass}
            </div>
            <div style="text-align: center;">
                <a href="{BASE_URL}/login" style="{STYLE_BUTTON}">Iniciar Sesión</a>
            </div>
            <p style="font-size: 12px; color: #999;">Si no has solicitado este cambio, por favor contáctanos de inmediato.</p>
        </div>
    </div>
    """
    return send_email(user_email, "Tu nueva clave de acceso - Bayup Security", html)

def send_password_change_alert(user_email: str):
    html = f"""
    <div style="max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 20px;">
        <div style="{STYLE_BODY}">
            <h2 style="color: #004d4d;">Seguridad de Cuenta.</h2>
            <p>Te informamos que la contraseña de tu cuenta en <strong>Bayup</strong> ha sido actualizada recientemente.</p>
            <p>Si fuiste tú, puedes ignorar este mensaje. Si no realizaste este cambio, protege tu cuenta restableciendo tu clave ahora mismo.</p>
            <div style="text-align: center;">
                <a href="{BASE_URL}/login" style="{STYLE_BUTTON}">Ir a mi cuenta</a>
            </div>
        </div>
    </div>
    """
    return send_email(user_email, "Notificación: Cambio de contraseña en Bayup", html)