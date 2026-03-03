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
    html = f"<html><body><h2>Hola {user_name}</h2><p>Bienvenido a Bayup.</p></body></html>"
    return send_email(user_email, "Bienvenido a Bayup", html)

def send_staff_invitation(user_email: str, user_name: str, temp_pass: str, inviter_name: str, perms: dict = None):
    html = f"<html><body><h2>Invitacion</h2><p>Usuario: {user_email}</p><p>Pass: {temp_pass}</p></body></html>"
    return send_email(user_email, "Invitacion de equipo", html)

def send_affiliate_welcome(user_email: str, user_name: str, temp_pass: str):
    html = f"<html><body><h2>Partner</h2><p>Pass: {temp_pass}</p></body></html>"
    return send_email(user_email, "Bienvenido Partner", html)

def send_password_reset(user_email: str, new_pass: str):
    html = f"<html><body><h2>Nueva Clave</h2><p>Tu clave es: {new_pass}</p></body></html>"
    return send_email(user_email, "Restablecer Clave - Bayup", html)

def send_order_confirmation(customer_email: str, customer_name: str, order_id: str, total_price: float, store_name: str):
    html = f"<html><body><h2>Orden #{order_id}</h2></body></html>"
    return send_email(customer_email, f"Pedido {order_id}", html)
