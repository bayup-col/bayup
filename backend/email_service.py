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
SENDER_PASSWORD = os.getenv("EMAIL_PASSWORD", "idye rzpj hqay jbue")
BASE_URL = os.getenv("FRONTEND_URL", "https://www.bayup.com.co")

# --- ESTILOS COMPARTIDOS ---
S_BODY = "padding: 30px; font-family: sans-serif; color: #333; line-height: 1.6;"
S_BTN = "display: inline-block; padding: 12px 30px; background: #004d4d; color: white; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 20px;"

def send_email(to_email: str, subject: str, html_content: str):
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
        return True
    except Exception as e:
        print(f"Error mail: {e}")
        return False

def send_welcome_email(user_email: str, user_name: str):
    html = f"""<div style="{S_BODY}"><h2>Hola {user_name}</h2><p>Bienvenido a Bayup.</p></div>"""
    return send_email(user_email, "Bienvenido a Bayup", html)

def send_staff_invitation(user_email: str, user_name: str, temp_pass: str, inviter_name: str, perms: dict = None):
    html = f"""<div style="{S_BODY}"><h2>Invitación</h2><p>Usuario: {user_email}</p><p>Pass: {temp_pass}</p></div>"""
    return send_email(user_email, "Invitación de equipo", html)

def send_affiliate_welcome(user_email: str, user_name: str, temp_pass: str):
    html = f"""<div style="{S_BODY}"><h2>Partner</h2><p>Usuario: {user_email}</p><p>Pass: {temp_pass}</p></div>"""
    return send_email(user_email, "Bienvenido Partner", html)

def send_password_reset(user_email: str, new_pass: str):
    html = f"""
<div style="max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px;">
<div style="background-color: #f43f5e; padding: 40px; text-align: center;"><h1 style="color: white; margin: 0;">SEGURIDAD</h1></div>
<div style="{S_BODY}">
<h2 style="color: #004d4d;">Nueva Clave.</h2>
<p>Tu clave temporal es: <strong>{new_pass}</strong></p>
<div style="text-align: center;"><a href="{BASE_URL}/login" style="{S_BTN}">Iniciar Sesión</a></div>
</div>
</div>
"""
    return send_email(user_email, "Restablecer Clave - Bayup", html)

def send_order_confirmation(customer_email: str, customer_name: str, order_id: str, total_price: float, store_name: str):
    html = f"""<div style="{S_BODY}"><h2>Orden #{order_id[:8]}</h2><p>Total: {total_price}</p></div>"""
    return send_email(customer_email, f"Pedido {order_id[:8]}", html)
