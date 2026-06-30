import logging
import os
import requests as _requests

logger = logging.getLogger("bayup.email")

_RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
_FROM = os.getenv("RESEND_FROM_EMAIL", "Bayup <noreply@bayup.com.co>")
_SITE = os.getenv("SITE_URL", "https://bayup.com.co")

_BASE_STYLE = """
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee">
  <div style="background:#004d4d;padding:24px 32px">
    <span style="font-size:22px;font-weight:900;color:#00f2ff;letter-spacing:-1px">BAYUP</span>
  </div>
  <div style="padding:32px">
    {content}
    <hr style="border:none;border-top:1px solid #eee;margin:28px 0"/>
    <p style="color:#aaa;font-size:11px;text-align:center">© Bayup — La plataforma de ventas inteligente</p>
  </div>
</div>
"""

def _btn(text: str, url: str) -> str:
    return f'<a href="{url}" style="display:inline-block;margin-top:20px;padding:14px 28px;background:#004d4d;color:#00f2ff;text-decoration:none;border-radius:10px;font-weight:900;font-size:13px;letter-spacing:1px">{text}</a>'

def _send(to: str, subject: str, content: str) -> bool:
    html = _BASE_STYLE.format(content=content)
    if not _RESEND_API_KEY:
        logger.warning("Email MOCK (sin RESEND_API_KEY) — To: %s | %s", to, subject)
        return False
    try:
        r = _requests.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {_RESEND_API_KEY}", "Content-Type": "application/json"},
            json={"from": _FROM, "to": [to], "subject": subject, "html": html},
            timeout=10,
        )
        if not r.ok:
            logger.error("Email ERROR %s: %s", r.status_code, r.text)
        return r.ok
    except Exception as e:
        logger.error("Email ERROR: %s", e)
        return False

def send_welcome_email(email: str, name: str, confirmed: bool = False) -> bool:
    if confirmed:
        body = f"""
            <h2 style="color:#004d4d;margin:0 0 8px">¡Bienvenido, {name}!</h2>
            <p style="color:#555">Tu cuenta en Bayup está activa. Entra al dashboard, configura tu tienda y empieza a vender.</p>
            {_btn("Ir a mi Dashboard", f"{_SITE}/dashboard")}
        """
    else:
        body = f"""
            <h2 style="color:#004d4d;margin:0 0 8px">¡Hola, {name}!</h2>
            <p style="color:#555">Tu cuenta fue registrada en Bayup. <strong>Confirma tu correo electrónico</strong> usando el enlace que te acabamos de enviar para activar tu acceso al dashboard.</p>
            <p style="color:#888;font-size:12px;margin-top:12px">Una vez confirmado, podrás configurar tu tienda y empezar a vender.</p>
            {_btn("Ir al inicio de sesión", f"{_SITE}/login")}
        """
    return _send(email, "¡Bienvenido a Bayup!", body)

def send_password_reset(email: str, token: str) -> bool:
    link = f"{_SITE}/reset-password?token={token}"
    return _send(email, "Restablece tu contraseña — Bayup", f"""
        <h2 style="color:#004d4d;margin:0 0 8px">Restablecer contraseña</h2>
        <p style="color:#555">Recibimos una solicitud para restablecer la contraseña de tu cuenta. El enlace es válido por <strong>1 hora</strong>.</p>
        {_btn("Crear nueva contraseña", link)}
        <p style="color:#aaa;font-size:12px;margin-top:20px">Si no solicitaste esto, ignora este correo. Tu contraseña no cambiará.</p>
    """)

def send_order_confirmation(email: str, name: str, order_id: str) -> bool:
    short_id = str(order_id)[:8].upper()
    return _send(email, f"Pedido #{short_id} recibido — Bayup", f"""
        <h2 style="color:#004d4d;margin:0 0 8px">¡Pedido recibido!</h2>
        <p style="color:#555">Hola <strong>{name}</strong>, tu pedido <strong>#{short_id}</strong> fue registrado exitosamente y está siendo procesado.</p>
        {_btn("Ver mis pedidos", f"{_SITE}/dashboard")}
    """)

def send_staff_invitation(email: str, name: str, inviter: str) -> bool:
    return _send(email, f"{inviter} te invitó a Bayup", f"""
        <h2 style="color:#004d4d;margin:0 0 8px">¡Te invitaron a Bayup!</h2>
        <p style="color:#555">Hola <strong>{name}</strong>, <strong>{inviter}</strong> te ha invitado a unirte como miembro del equipo en Bayup.</p>
        {_btn("Iniciar sesión", f"{_SITE}/login")}
    """)

def send_affiliate_welcome(email: str, name: str) -> bool:
    return _send(email, "¡Ya eres afiliado Bayup!", f"""
        <h2 style="color:#004d4d;margin:0 0 8px">¡Bienvenido al programa de afiliados!</h2>
        <p style="color:#555">Hola <strong>{name}</strong>, tu cuenta de afiliado está activa. Comparte tu enlace único y empieza a ganar comisiones.</p>
        {_btn("Ver mi panel de afiliado", f"{_SITE}/afiliado/dashboard")}
    """)

def send_email_confirmation(email: str, name: str, token: str) -> bool:
    link = f"{_SITE}/confirm-email?token={token}"
    return _send(email, "Confirma tu correo — Bayup", f"""
        <h2 style="color:#004d4d;margin:0 0 8px">Confirma tu correo</h2>
        <p style="color:#555">Hola <strong>{name}</strong>, haz clic en el botón para activar tu cuenta Bayup. El enlace es válido por <strong>24 horas</strong>.</p>
        {_btn("Confirmar mi correo", link)}
        <p style="color:#aaa;font-size:12px;margin-top:20px">Si no creaste esta cuenta, ignora este mensaje.</p>
    """)

def send_new_sale_notification(
    owner_email: str,
    shop_name: str,
    order_id: str,
    customer_name: str,
    customer_email: str,
    customer_phone: str,
    customer_city: str,
    items: list,          # [{"name": str, "qty": int, "price": float}]
    total: float,
    payment_method: str,
) -> bool:
    short_id = str(order_id)[:8].upper()
    rows = "".join(
        f'<tr>'
        f'<td style="padding:8px 12px;border-bottom:1px solid #eee">{it["name"]}</td>'
        f'<td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">{it["qty"]}</td>'
        f'<td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${it["price"]:,.0f}</td>'
        f'</tr>'
        for it in items
    )
    phone_display = customer_phone or "—"
    city_display  = customer_city  or "—"
    email_display = customer_email or "—"
    content = f"""
        <h2 style="color:#004d4d;margin:0 0 4px">🛒 ¡Nueva venta en {shop_name}!</h2>
        <p style="color:#888;font-size:13px;margin:0 0 24px">Pedido <strong>#{short_id}</strong> · Pago: {payment_method}</p>

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <thead>
            <tr style="background:#f5fafa">
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;font-weight:600;text-transform:uppercase">Producto</th>
              <th style="padding:8px 12px;text-align:center;font-size:11px;color:#888;font-weight:600;text-transform:uppercase">Cant.</th>
              <th style="padding:8px 12px;text-align:right;font-size:11px;color:#888;font-weight:600;text-transform:uppercase">Precio</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:10px 12px;font-weight:700;color:#004d4d">Total</td>
              <td style="padding:10px 12px;text-align:right;font-weight:900;font-size:16px;color:#004d4d">${total:,.0f}</td>
            </tr>
          </tfoot>
        </table>

        <div style="background:#f5fafa;border-radius:10px;padding:16px 20px;margin-bottom:24px">
          <p style="margin:0 0 4px;font-size:13px;color:#555"><strong>Cliente:</strong> {customer_name}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#555"><strong>Correo:</strong> {email_display}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#555"><strong>Teléfono:</strong> {phone_display}</p>
          <p style="margin:0;font-size:13px;color:#555"><strong>Ciudad:</strong> {city_display}</p>
        </div>

        {_btn("Ver pedido en mi dashboard", f"{_SITE}/dashboard/pedidos-web")}
    """
    return _send(owner_email, f"🛒 Nueva venta #{short_id} — {shop_name}", content)

def send_email(to: str, subject: str, html: str) -> bool:
    return _send(to, subject, html)
