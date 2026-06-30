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

def _cop(amount: float) -> str:
    """Formato peso colombiano: $189.900"""
    return "$" + f"{amount:,.0f}".replace(",", ".")

def _send_raw(to: str, subject: str, html: str) -> bool:
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

def send_order_confirmation(
    email: str,
    name: str,
    order_id: str,
    items: list = None,
    total: float = 0,
    payment_method: str = "",
    customer_city: str = "",
    customer_phone: str = "",
    shop_name: str = "Bayup",
) -> bool:
    short_id   = str(order_id)[:8].upper()
    total_fmt  = _cop(total)
    items      = items or []
    first_name = name.split()[0] if name else name
    phone_disp = customer_phone or "—"
    city_disp  = customer_city  or "—"
    pay_disp   = payment_method or "—"

    product_rows = "".join(
        f'<tr>'
        f'<td style="padding:12px 14px;font-size:13px;color:#111827;font-weight:600;border-top:1px solid #f3f4f6">{it["name"]}</td>'
        f'<td align="center" style="padding:12px 14px;border-top:1px solid #f3f4f6">'
        f'<span style="display:inline-block;width:26px;height:26px;border:1.5px solid #b3ecec;border-radius:5px;font-size:12px;font-weight:700;color:#007878;text-align:center;line-height:23px">{it["qty"]}</span>'
        f'</td>'
        f'<td align="right" style="padding:12px 14px;font-family:\'Courier New\',monospace;font-size:13px;font-weight:600;color:#111827;border-top:1px solid #f3f4f6">{_cop(it["qty"] * it["price"])}</td>'
        f'</tr>'
        for it in items
    )

    html = f"""<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 16px;background:#f0f0f0;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f0f0f">
    <tr>
      <td style="padding:16px 32px">
        <span style="font-size:20px;font-weight:900;font-style:italic;letter-spacing:-0.5px;color:#ffffff">Bay<span style="color:#00f2ff">UP.</span></span>
      </td>
      <td align="right" style="padding:16px 32px">
        <span style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#444444">{shop_name}</span>
      </td>
    </tr>
  </table>

  <div style="padding:28px 32px">

    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px">
      <tr>
        <td valign="top" style="padding-right:16px">
          <div style="width:44px;height:44px;background:#0f0f0f;border-radius:10px;text-align:center;line-height:44px;font-size:18px;font-weight:900;color:#00f2ff">&#10003;</div>
        </td>
        <td valign="top">
          <div style="font-size:18px;font-weight:800;color:#111827;letter-spacing:-0.3px;line-height:1.2">&#161;Tu pedido est&#225; confirmado, {first_name}!</div>
          <div style="font-size:13px;color:#4b5563;margin-top:4px">Ya recibimos tu compra en <strong style="color:#111827">{shop_name}</strong> y est&#225; siendo preparada con cuidado.</div>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px">
      <tr>
        <td align="center" width="25%">
          <div style="width:22px;height:22px;background:#0f0f0f;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:900;color:#00f2ff;margin:0 auto 6px">&#10003;</div>
          <div style="font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#007878">Confirmado</div>
        </td>
        <td align="center" width="25%">
          <div style="width:22px;height:22px;background:#ffffff;border:1.5px solid #e5e7eb;border-radius:50%;margin:0 auto 6px">&nbsp;</div>
          <div style="font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#d1d5db">Preparando</div>
        </td>
        <td align="center" width="25%">
          <div style="width:22px;height:22px;background:#ffffff;border:1.5px solid #e5e7eb;border-radius:50%;margin:0 auto 6px">&nbsp;</div>
          <div style="font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#d1d5db">Enviado</div>
        </td>
        <td align="center" width="25%">
          <div style="width:22px;height:22px;background:#ffffff;border:1.5px solid #e5e7eb;border-radius:50%;margin:0 auto 6px">&nbsp;</div>
          <div style="font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#d1d5db">Entregado</div>
        </td>
      </tr>
    </table>

    <div style="font-size:9.5px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#9ca3af;margin-bottom:10px">
      Resumen de tu pedido &nbsp;<span style="font-family:'Courier New',monospace;font-size:10px;background:#f0fefe;border:1px solid #b3ecec;padding:2px 8px;border-radius:4px;color:#007878">#{short_id}</span>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:20px">
      <thead>
        <tr style="background:#f9fafb">
          <th align="left" style="padding:8px 14px;font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af">Producto</th>
          <th align="center" style="padding:8px 14px;font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af">Cant.</th>
          <th align="right" style="padding:8px 14px;font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af">Subtotal</th>
        </tr>
      </thead>
      <tbody>{product_rows}</tbody>
      <tfoot>
        <tr style="background:#0f0f0f">
          <td colspan="2" style="padding:12px 14px;font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.5)">Total pagado</td>
          <td align="right" style="padding:12px 14px;font-family:'Courier New',monospace;font-size:21px;font-weight:900;color:#00f2ff;letter-spacing:-0.5px">{total_fmt}</td>
        </tr>
      </tfoot>
    </table>

    <div style="font-size:9.5px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#9ca3af;margin-bottom:10px">Informaci&#243;n de entrega</div>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:20px">
      <tr>
        <td width="50%" style="padding:14px 18px 8px">
          <div style="font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin-bottom:3px">Nombre</div>
          <div style="font-size:13px;font-weight:500;color:#111827">{name}</div>
        </td>
        <td width="50%" style="padding:14px 18px 8px">
          <div style="font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin-bottom:3px">Ciudad</div>
          <div style="font-size:13px;font-weight:500;color:#111827">{city_disp}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 18px 14px">
          <div style="font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin-bottom:3px">Tel&#233;fono</div>
          <div style="font-size:13px;font-weight:500;color:#111827">{phone_disp}</div>
        </td>
        <td style="padding:8px 18px 14px">
          <div style="font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin-bottom:3px">M&#233;todo de pago</div>
          <div style="font-size:13px;font-weight:500;color:#111827">{pay_disp}</div>
        </td>
      </tr>
    </table>

    <div style="background:#f0fefe;border:1px solid #b3ecec;border-radius:8px;padding:14px 18px;margin-bottom:24px;font-size:13px;color:#4b5563;line-height:1.6">
      Gracias por tu compra en <strong style="color:#007878">{shop_name}</strong>. En cuanto tu pedido sea despachado recibir&#225;s una actualizaci&#243;n. Si tienes alguna duda, responde este correo y con gusto te ayudamos.
    </div>

    <div style="text-align:center">
      <a href="{_SITE}/dashboard" style="display:inline-block;background:#0f0f0f;color:#00f2ff;text-decoration:none;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;padding:14px 36px;border-radius:6px">Ver estado de mi pedido &#8594;</a>
    </div>
  </div>

  <div style="border-top:1px solid #f3f4f6;padding:16px 32px;text-align:center;font-size:11px;color:#9ca3af;line-height:1.7">
    Este correo fue enviado por <strong>{shop_name}</strong> a trav&#233;s de Bayup.<br>
    &#169; 2026 Bayup &#8212; La plataforma de ventas inteligente
  </div>

</div>
</body>
</html>"""

    return _send_raw(email, f"✓ Tu pedido #{short_id} está confirmado — {shop_name}", html)

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
    short_id    = str(order_id)[:8].upper()
    total_fmt   = _cop(total)
    phone_disp  = customer_phone or "—"
    city_disp   = customer_city  or "—"
    email_disp  = customer_email or "—"

    product_rows = "".join(
        f'<tr>'
        f'<td style="padding:11px 14px;font-size:13px;color:#111827;font-weight:600;border-top:1px solid #f3f4f6">{it["name"]}</td>'
        f'<td align="center" style="padding:11px 14px;border-top:1px solid #f3f4f6">'
        f'<span style="display:inline-block;width:26px;height:26px;border:1.5px solid #b3ecec;border-radius:5px;font-size:12px;font-weight:700;color:#007878;text-align:center;line-height:23px">{it["qty"]}</span>'
        f'</td>'
        f'<td align="right" style="padding:11px 14px;font-family:\'Courier New\',monospace;font-size:13px;font-weight:600;color:#111827;border-top:1px solid #f3f4f6">{_cop(it["price"])}</td>'
        f'</tr>'
        for it in items
    )

    html = f"""<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 16px;background:#f0f0f0;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f0f0f">
    <tr>
      <td style="padding:16px 32px">
        <span style="font-size:20px;font-weight:900;font-style:italic;letter-spacing:-0.5px;color:#ffffff">Bay<span style="color:#00f2ff">UP.</span></span>
      </td>
      <td align="right" style="padding:16px 32px">
        <span style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#444444">{shop_name}</span>
      </td>
    </tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;border-top:2px solid #007878">
    <tr>
      <td style="padding:28px 32px">
        <div style="font-size:10px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#007878">Nueva venta</div>
        <div style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.65);margin-top:4px">{shop_name}</div>
        <div style="font-size:11px;font-family:'Courier New',monospace;color:rgba(255,255,255,0.38);margin-top:6px">#{short_id} &nbsp;&#183;&nbsp; {payment_method}</div>
      </td>
      <td align="right" style="padding:28px 32px">
        <span style="font-size:38px;font-weight:900;font-family:'Courier New',monospace;color:#00f2ff;letter-spacing:-1px">{total_fmt}</span>
      </td>
    </tr>
  </table>

  <div style="padding:24px 32px">

    <div style="display:inline-block;background:#f0fefe;border:1px solid #b3ecec;border-radius:20px;padding:5px 14px;font-size:11px;font-weight:700;color:#007878;letter-spacing:0.04em;margin-bottom:20px">
      &#9679; &nbsp;{payment_method}
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:20px">
      <thead>
        <tr style="background:#f9fafb">
          <th align="left" style="padding:9px 14px;font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af">Producto</th>
          <th align="center" style="padding:9px 14px;font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af">Cant.</th>
          <th align="right" style="padding:9px 14px;font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af">Precio</th>
        </tr>
      </thead>
      <tbody>{product_rows}</tbody>
      <tfoot>
        <tr style="background:#0f0f0f">
          <td colspan="2" style="padding:12px 14px;font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.5)">Total</td>
          <td align="right" style="padding:12px 14px;font-family:'Courier New',monospace;font-size:22px;font-weight:900;color:#00f2ff;letter-spacing:-0.5px">{total_fmt}</td>
        </tr>
      </tfoot>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px">
      <tr>
        <td width="50%" style="padding:14px 18px 8px">
          <div style="font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin-bottom:3px">Cliente</div>
          <div style="font-size:13px;font-weight:500;color:#111827">{customer_name}</div>
        </td>
        <td width="50%" style="padding:14px 18px 8px">
          <div style="font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin-bottom:3px">Tel&#233;fono</div>
          <div style="font-size:13px;font-weight:500;color:#111827">{phone_disp}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 18px 14px">
          <div style="font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin-bottom:3px">Correo</div>
          <div style="font-size:13px;font-weight:500;color:#111827">{email_disp}</div>
        </td>
        <td style="padding:8px 18px 14px">
          <div style="font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin-bottom:3px">Ciudad</div>
          <div style="font-size:13px;font-weight:500;color:#111827">{city_disp}</div>
        </td>
      </tr>
    </table>

    <div style="text-align:center">
      <a href="{_SITE}/dashboard/pedidos-web" style="display:inline-block;background:#0f0f0f;color:#00f2ff;text-decoration:none;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;padding:14px 36px;border-radius:6px">Ver pedido en el dashboard &#8594;</a>
    </div>
  </div>

  <div style="border-top:1px solid #f3f4f6;padding:16px 32px;text-align:center;font-size:11px;color:#9ca3af;line-height:1.7">
    Recibes este correo porque tienes una tienda activa en Bayup.<br>
    &#169; 2026 Bayup &#8212; La plataforma de ventas inteligente
  </div>

</div>
</body>
</html>"""

    return _send_raw(owner_email, f"🛒 Nueva venta {total_fmt} — {shop_name}", html)

def send_email(to: str, subject: str, html: str) -> bool:
    return _send(to, subject, html)
