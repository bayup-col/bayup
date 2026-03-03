import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

# --- CONFIGURACIÓN ---
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = os.getenv("EMAIL_SENDER", "bayupcol@gmail.com")
SENDER_PASSWORD = os.getenv("EMAIL_PASSWORD", "idye rzpj hqay jbue") # App Password
BASE_URL = os.getenv("FRONTEND_URL", "https://www.bayup.com.co")

# --- ESTILOS COMPARTIDOS (INLINE CSS PARA EMAIL) ---
S_BODY = "padding: 30px; font-family: 'Inter', sans-serif; color: #333; line-height: 1.6;"
S_BTN = "display: inline-block; padding: 12px 30px; background: #004d4d; color: white; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 20px;"

def send_email(to_email: str, subject: str, html_content: str):
    """
    Función base para enviar correos usando Gmail SMTP.
    """
    try:
        msg = MIMEMultipart()
        msg['From'] = f"Bayup Interactive <{SENDER_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(html_content, 'html'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"📧 Correo enviado a {to_email}: {subject}")
        return True
    except Exception as e:
        print(f"❌ Error enviando correo: {e}")
        return False

# --- PLANTILLAS ESPECÍFICAS ---

def send_welcome_email(user_email: str, user_name: str):
    html = f"""
    <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px; overflow: hidden;">
        <div style="background-color: #004d4d; padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">¡BIENVENIDO A BAYUP!</h1>
        </div>
        <div style="{S_BODY}">
            <h2 style="color: #004d4d;">Hola {user_name},</h2>
            <p>Estamos emocionados de tenerte en la familia. Bayup es el sistema operativo que llevará tu negocio al siguiente nivel.</p>
            <p>Desde ahora puedes:</p>
            <ul>
                <li>Gestionar tu inventario de forma inteligente.</li>
                <li>Automatizar tus ventas por WhatsApp y Web.</li>
                <li>Obtener reportes financieros en tiempo real.</li>
            </ul>
            <div style="text-align: center;">
                <a href="{BASE_URL}/login" style="{S_BTN}">Acceder a mi Panel</a>
            </div>
            <p style="margin-top: 30px; font-size: 12px; color: #999;">Si no creaste esta cuenta, ignora este mensaje.</p>
        </div>
    </div>
    """
    return send_email(user_email, "Tu aventura en Bayup comienza hoy 🚀", html)

def send_staff_invitation(user_email: str, user_name: str, temp_pass: str, inviter_name: str, perms: dict = None):
    html = f"""
    <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px; overflow: hidden;">
        <div style="background-color: #004d4d; padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">INVITACIÓN DE EQUIPO</h1>
        </div>
        <div style="{S_BODY}">
            <h2 style="color: #004d4d;">Hola {user_name},</h2>
            <p><strong>{inviter_name}</strong> te ha invitado a formar parte del equipo en Bayup.</p>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Tus credenciales de acceso:</strong></p>
                <p>Usuario: {user_email}</p>
                <p>Contraseña: <strong>{temp_pass}</strong></p>
            </div>
            <p>Se te han asignado permisos específicos para colaborar en la tienda.</p>
            <div style="text-align: center;">
                <a href="{BASE_URL}/login" style="{S_BTN}">Aceptar Invitación</a>
            </div>
        </div>
    </div>
    """
    return send_email(user_email, f"Fuiste invitado al equipo de {inviter_name}", html)

def send_affiliate_welcome(user_email: str, user_name: str, temp_pass: str):
    html = f"""
    <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px; overflow: hidden;">
        <div style="background-color: #004d4d; padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">PARTNERS BAYUP</h1>
        </div>
        <div style="{S_BODY}">
            <h2 style="color: #004d4d;">¡Hola Partner!</h2>
            <p>Tu cuenta como afiliado ha sido creada. Ahora puedes empezar a referir empresas y ganar comisiones recurrentes.</p>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 12px;">
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
    <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px; overflow: hidden;">
        <div style="background-color: #f43f5e; padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">SEGURIDAD</h1>
        </div>
        <div style="{S_BODY}">
            <h2 style="color: #004d4d;">Nueva Clave.</h2>
            <p>Tu clave temporal es: <strong>{new_pass}</strong></p>
            <p>Te recomendamos cambiarla una vez ingreses a tu panel de configuración.</p>
            <div style="text-align: center;">
                <a href="{BASE_URL}/login" style="{S_BTN}">Iniciar Sesión</a>
            </div>
        </div>
    </div>
    """
    return send_email(user_email, "Restablecer Clave - Bayup", html)

def send_order_confirmation(customer_email: str, customer_name: str, order_id: str, total_price: float, store_name: str):
    html = f"""
    <div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px; font-family: Arial, sans-serif;">
        <div style="background-color: #004d4d; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">PEDIDO CONFIRMADO</h1>
        </div>
        <div style="padding: 30px;">
            <h2>¡Gracias por tu compra, {customer_name}!</h2>
            <p>Tu pedido en <strong>{store_name}</strong> ha sido recibido y está siendo procesado.</p>
            <div style="background: #f4f4f4; padding: 20px; border-radius: 10px;">
                <p><strong>ID de Pedido:</strong> #{order_id[:8]}</p>
                <p><strong>Total:</strong> ${total_price:,.0f} COP</p>
            </div>
            <p>Te enviaremos otro correo cuando tu paquete esté en camino.</p>
        </div>
    </div>
    """
    return send_email(customer_email, f"Confirmación de Pedido #{order_id[:8]} - {store_name}", html)
