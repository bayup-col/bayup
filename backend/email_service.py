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

def _simple_email_html(
    icon: str,
    title: str,
    body_html: str,
    cta_text: str,
    cta_url: str,
    footer_note: str = "",
    validity_text: str = "",
) -> str:
    """Genera HTML completo para correos simples con el diseño negro/cyan de Bayup."""
    validity_badge = ""
    if validity_text:
        validity_badge = f"""
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px">
      <tr><td align="center">
        <span style="display:inline-block;background:#eafafa;border:1px solid #99dede;border-radius:100px;padding:5px 16px;font-size:12px;color:#007878;font-weight:700;font-family:Arial,Helvetica,sans-serif">
          &#x25cf;&nbsp;&nbsp;{validity_text}
        </span>
      </td></tr>
    </table>"""

    disclaimer_html = ""
    if footer_note:
        disclaimer_html = f"""
    <tr><td style="padding:0 40px 28px;background:#f6fdfd">
      <div style="height:1px;background:#c8e8e8;margin-bottom:20px"></div>
      <p style="margin:0;font-size:12px;color:#7a9a9a;line-height:1.6;text-align:center;font-family:Arial,Helvetica,sans-serif">{footer_note}</p>
    </td></tr>"""

    return f"""<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 16px;background:#e8e8e8;font-family:Arial,Helvetica,sans-serif">

<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;width:100%;border-radius:4px;overflow:hidden">

  <!-- FRANJA DEGRADADA SUPERIOR -->
  <tr><td height="3" style="background:linear-gradient(90deg,#007878 0%,#00f2ff 100%);font-size:0;line-height:0">&nbsp;</td></tr>

  <!-- HERO NEGRO -->
  <tr><td style="background:#0f0f0f;padding:36px 40px 44px;text-align:center">

    <div style="font-size:19px;font-weight:900;font-style:italic;letter-spacing:-0.5px;color:#ffffff;margin-bottom:32px;font-family:Arial,Helvetica,sans-serif">
      Bay<span style="color:#00f2ff">UP.</span>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td align="center" style="padding-bottom:26px">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr><td width="94" height="94" align="center" valign="middle"
              style="width:94px;height:94px;border-radius:50%;border:2px solid #007878;text-align:center;vertical-align:middle;font-size:34px;color:#00f2ff;background:#0a1a1a;font-family:Arial,Helvetica,sans-serif">
            {icon}
          </td></tr>
        </table>
      </td></tr>
    </table>

    <div style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;font-family:Arial,Helvetica,sans-serif">
      {title}
    </div>

  </td></tr>

  <!-- DIVISOR CON DEGRADADO -->
  <tr><td height="1" style="background:linear-gradient(90deg,#007878,#00f2ff,#007878);font-size:0;line-height:0">&nbsp;</td></tr>

  <!-- CUERPO BLANCO-CYAN -->
  <tr><td style="background:#f6fdfd;padding:32px 40px 28px">
    <div style="font-size:15px;color:#3a4a4a;line-height:1.75;margin-bottom:24px;font-family:Arial,Helvetica,sans-serif">
      {body_html}
    </div>
    {validity_badge}
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td align="center">
        <a href="{cta_url}"
           style="display:inline-block;background:linear-gradient(90deg,#007878 0%,#00f2ff 100%);color:#0a1414;text-decoration:none;font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;padding:17px 44px;border-radius:6px;font-family:Arial,Helvetica,sans-serif">
          {cta_text}
        </a>
      </td></tr>
    </table>
  </td></tr>

  {disclaimer_html}

  <!-- PIE DE PÁGINA OSCURO -->
  <tr><td style="background:#0a0a0a;padding:18px 40px;text-align:center;border-top:1px solid #111111">
    <p style="margin:0;font-size:11px;letter-spacing:0.06em;color:#333333;font-family:Arial,Helvetica,sans-serif">
      &#169; 2026 <span style="color:#007878">Bayup</span> &#8212; La plataforma de ventas inteligente
    </p>
  </td></tr>

</table>
</td></tr>
</table>

</body>
</html>"""


def send_welcome_email(email: str, name: str, confirmed: bool = False) -> bool:
    if confirmed:
        html = _simple_email_html(
            icon="&#127881;",
            title=f"&#161;Bienvenido, {name}!",
            body_html=(
                "Tu cuenta en Bayup est&#225; activa. "
                "Entra al dashboard, personaliza tu tienda y empieza a vender hoy mismo."
            ),
            cta_text="Ir a mi Dashboard",
            cta_url=f"{_SITE}/dashboard",
        )
        return _send_raw(email, "¡Bienvenido a Bayup!", html)
    else:
        html = _simple_email_html(
            icon="&#9993;",
            title=f"&#161;Hola, {name}!",
            body_html=(
                "Tu cuenta fue registrada en Bayup. "
                "<strong style='color:#0f1f1f'>Confirma tu correo electr&#243;nico</strong> "
                "usando el enlace que te acabamos de enviar para activar tu acceso al dashboard."
            ),
            cta_text="Ir al inicio de sesi&#243;n",
            cta_url=f"{_SITE}/login",
            footer_note="Una vez confirmado podr&#225;s configurar tu tienda y empezar a vender.",
        )
        return _send_raw(email, "¡Bienvenido a Bayup! Confirma tu correo", html)


def send_password_reset(email: str, token: str) -> bool:
    link = f"{_SITE}/reset-password?token={token}"
    html = _simple_email_html(
        icon="&#128274;",
        title="Restablecer contrase&#241;a",
        body_html=(
            "Recibimos una solicitud para restablecer la contrase&#241;a de tu cuenta. "
            "Haz clic en el bot&#243;n para crear una nueva contrase&#241;a y recuperar el acceso a tu tienda de forma segura."
        ),
        cta_text="Crear nueva contrase&#241;a",
        cta_url=link,
        validity_text="V&#225;lido por 1 hora",
        footer_note="Si no solicitaste esto, ignora este correo. Tu contrase&#241;a no cambiar&#225;.",
    )
    return _send_raw(email, "Restablece tu contraseña — Bayup", html)

def _order_header(shop_name: str) -> str:
    return (
        f'<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f0f0f">'
        f'<tr>'
        f'<td style="padding:16px 32px"><span style="font-size:20px;font-weight:900;font-style:italic;letter-spacing:-0.5px;color:#ffffff">Bay<span style="color:#00f2ff">UP.</span></span></td>'
        f'<td align="right" style="padding:16px 32px"><span style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#444444">{shop_name}</span></td>'
        f'</tr></table>'
    )

def _order_items_table(items: list, total: float) -> str:
    rows = "".join(
        f'<tr>'
        f'<td style="padding:12px 14px;font-size:13px;color:#111827;font-weight:600;border-top:1px solid #f3f4f6">{it["name"]}</td>'
        f'<td align="center" style="padding:12px 14px;border-top:1px solid #f3f4f6">'
        f'<span style="display:inline-block;width:26px;height:26px;border:1.5px solid #b3ecec;border-radius:5px;font-size:12px;font-weight:700;color:#007878;text-align:center;line-height:23px">{it["qty"]}</span>'
        f'</td>'
        f'<td align="right" style="padding:12px 14px;font-family:\'Courier New\',monospace;font-size:13px;font-weight:600;color:#111827;border-top:1px solid #f3f4f6">{_cop(it["qty"] * it["price"])}</td>'
        f'</tr>'
        for it in items
    )
    return (
        f'<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:20px">'
        f'<thead><tr style="background:#f9fafb">'
        f'<th align="left" style="padding:8px 14px;font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af">Producto</th>'
        f'<th align="center" style="padding:8px 14px;font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af">Cant.</th>'
        f'<th align="right" style="padding:8px 14px;font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af">Subtotal</th>'
        f'</tr></thead>'
        f'<tbody>{rows}</tbody>'
        f'<tfoot><tr style="background:#0f0f0f">'
        f'<td colspan="2" style="padding:12px 14px;font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.5)">Total pagado</td>'
        f'<td align="right" style="padding:12px 14px;font-family:\'Courier New\',monospace;font-size:21px;font-weight:900;color:#00f2ff;letter-spacing:-0.5px">{_cop(total)}</td>'
        f'</tr></tfoot></table>'
    )

def _status_bar(active_step: int) -> str:
    steps = ["Confirmado", "Preparando", "Enviado", "Entregado"]
    cells = ""
    for i, step in enumerate(steps):
        done = i <= active_step
        dot = (
            f'<div style="width:22px;height:22px;background:#0f0f0f;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:900;color:#00f2ff;margin:0 auto 6px">&#10003;</div>'
            if done else
            f'<div style="width:22px;height:22px;background:#ffffff;border:1.5px solid #e5e7eb;border-radius:50%;margin:0 auto 6px">&nbsp;</div>'
        )
        color = "#007878" if done else "#d1d5db"
        cells += f'<td align="center" width="25%">{dot}<div style="font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:{color}">{step}</div></td>'
    return f'<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px"><tr>{cells}</tr></table>'

_STATUS_STEP = {"pending": 0, "processing": 1, "shipped": 2, "completed": 3}

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
    source: str = "web",
) -> bool:
    short_id   = str(order_id)[:8].upper()
    items      = items or []
    first_name = name.split()[0] if name else name
    is_pos     = source == "pos"

    if is_pos:
        headline  = f"&#128522; Comprobante de compra, {first_name}"
        subline   = f"Gracias por tu compra en <strong style=\"color:#111827\">{shop_name}</strong>. Guarda este correo como respaldo."
        footer_note = f"Gracias por comprar en <strong style=\"color:#007878\">{shop_name}</strong>. Este es tu comprobante de venta."
        status_block = ""
        cta_block = ""
        info_label = "Informaci&#243;n de la compra"
        subject   = f"🧾 Comprobante de compra — {shop_name}"
    else:
        headline  = f"&#161;Tu pedido est&#225; confirmado, {first_name}!"
        subline   = f"Ya recibimos tu compra en <strong style=\"color:#111827\">{shop_name}</strong> y est&#225; siendo preparada con cuidado."
        footer_note = f"Gracias por tu compra en <strong style=\"color:#007878\">{shop_name}</strong>. En cuanto tu pedido sea despachado recibir&#225;s una actualizaci&#243;n."
        status_block = _status_bar(0)
        cta_block = (
            f'<div style="text-align:center;margin-top:8px">'
            f'<a href="{_SITE}/pedido/{order_id}" style="display:inline-block;background:#0f0f0f;color:#00f2ff;text-decoration:none;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;padding:14px 36px;border-radius:6px">Ver estado de mi pedido &#8594;</a>'
            f'</div>'
        )
        info_label = "Informaci&#243;n de entrega"
        subject   = f"✓ Tu pedido #{short_id} está confirmado — {shop_name}"

    info_block = (
        f'<div style="font-size:9.5px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#9ca3af;margin-bottom:10px">{info_label}</div>'
        f'<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:20px">'
        f'<tr>'
        f'<td width="50%" style="padding:14px 18px 8px"><div style="font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin-bottom:3px">Nombre</div><div style="font-size:13px;font-weight:500;color:#111827">{name}</div></td>'
        f'<td width="50%" style="padding:14px 18px 8px"><div style="font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin-bottom:3px">Ciudad</div><div style="font-size:13px;font-weight:500;color:#111827">{customer_city or "—"}</div></td>'
        f'</tr><tr>'
        f'<td style="padding:8px 18px 14px"><div style="font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin-bottom:3px">Tel&#233;fono</div><div style="font-size:13px;font-weight:500;color:#111827">{customer_phone or "—"}</div></td>'
        f'<td style="padding:8px 18px 14px"><div style="font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin-bottom:3px">M&#233;todo de pago</div><div style="font-size:13px;font-weight:500;color:#111827">{payment_method or "—"}</div></td>'
        f'</tr></table>'
    )

    html = (
        f'<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
        f'<body style="margin:0;padding:24px 16px;background:#f0f0f0;font-family:Arial,Helvetica,sans-serif">'
        f'<div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">'
        f'{_order_header(shop_name)}'
        f'<div style="padding:28px 32px">'
        f'<table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px"><tr>'
        f'<td valign="top" style="padding-right:16px"><div style="width:44px;height:44px;background:#0f0f0f;border-radius:10px;text-align:center;line-height:44px;font-size:18px;font-weight:900;color:#00f2ff">&#10003;</div></td>'
        f'<td valign="top"><div style="font-size:18px;font-weight:800;color:#111827;letter-spacing:-0.3px;line-height:1.2">{headline}</div>'
        f'<div style="font-size:13px;color:#4b5563;margin-top:4px">{subline}</div></td>'
        f'</tr></table>'
        f'{status_block}'
        f'<div style="font-size:9.5px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#9ca3af;margin-bottom:10px">Resumen de tu pedido &nbsp;<span style="font-family:\'Courier New\',monospace;font-size:10px;background:#f0fefe;border:1px solid #b3ecec;padding:2px 8px;border-radius:4px;color:#007878">#{short_id}</span></div>'
        f'{_order_items_table(items, total)}'
        f'{info_block}'
        f'<div style="background:#f0fefe;border:1px solid #b3ecec;border-radius:8px;padding:14px 18px;margin-bottom:24px;font-size:13px;color:#4b5563;line-height:1.6">{footer_note}</div>'
        f'{cta_block}'
        f'</div>'
        f'<div style="border-top:1px solid #f3f4f6;padding:16px 32px;text-align:center;font-size:11px;color:#9ca3af;line-height:1.7">Este correo fue enviado por <strong>{shop_name}</strong> a trav&#233;s de Bayup.<br>&#169; 2026 Bayup &#8212; La plataforma de ventas inteligente</div>'
        f'</div></body></html>'
    )
    return _send_raw(email, subject, html)


def send_order_status_update(
    email: str,
    name: str,
    order_id: str,
    new_status: str,
    shop_name: str = "Bayup",
) -> bool:
    short_id   = str(order_id)[:8].upper()
    first_name = name.split()[0] if name else name
    step       = _STATUS_STEP.get(new_status, 0)

    status_labels = {
        "processing": ("📦 Tu pedido está siendo preparado",  "Estamos alistando tu pedido con cuidado. Te avisaremos cuando sea enviado."),
        "completed":  ("✅ Tu pedido fue entregado",           "Tu pedido llegó a su destino. ¡Gracias por comprar en " + shop_name + "!"),
        "cancelled":  ("❌ Tu pedido fue cancelado",           "Lamentamos informarte que tu pedido fue cancelado. Si tienes dudas, responde este correo."),
    }
    headline, subline = status_labels.get(new_status, ("Actualización de tu pedido", "El estado de tu pedido ha cambiado."))

    bg_color = {"processing": "#f0fefe", "completed": "#f0fef4", "cancelled": "#fff5f5"}.get(new_status, "#f0fefe")
    border   = {"processing": "#b3ecec", "completed": "#86efac", "cancelled": "#fecaca"}.get(new_status, "#b3ecec")

    cta = (
        f'<div style="text-align:center;margin-top:24px">'
        f'<a href="{_SITE}/pedido/{order_id}" style="display:inline-block;background:#0f0f0f;color:#00f2ff;text-decoration:none;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;padding:14px 36px;border-radius:6px">Ver estado de mi pedido &#8594;</a>'
        f'</div>'
    ) if new_status != "cancelled" else ""

    html = (
        f'<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
        f'<body style="margin:0;padding:24px 16px;background:#f0f0f0;font-family:Arial,Helvetica,sans-serif">'
        f'<div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">'
        f'{_order_header(shop_name)}'
        f'<div style="padding:28px 32px">'
        f'<div style="font-size:18px;font-weight:800;color:#111827;letter-spacing:-0.3px;margin-bottom:6px">{headline}</div>'
        f'<div style="font-size:13px;color:#4b5563;margin-bottom:24px">Hola {first_name}, {subline}</div>'
        f'{_status_bar(step) if new_status != "cancelled" else ""}'
        f'<div style="font-size:9.5px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#9ca3af;margin-bottom:8px">Pedido &nbsp;<span style="font-family:\'Courier New\',monospace;font-size:10px;background:#f0fefe;border:1px solid #b3ecec;padding:2px 8px;border-radius:4px;color:#007878">#{short_id}</span></div>'
        f'<div style="background:{bg_color};border:1px solid {border};border-radius:8px;padding:14px 18px;font-size:13px;color:#4b5563;line-height:1.6">{subline}</div>'
        f'{cta}'
        f'</div>'
        f'<div style="border-top:1px solid #f3f4f6;padding:16px 32px;text-align:center;font-size:11px;color:#9ca3af;line-height:1.7">Este correo fue enviado por <strong>{shop_name}</strong> a trav&#233;s de Bayup.<br>&#169; 2026 Bayup &#8212; La plataforma de ventas inteligente</div>'
        f'</div></body></html>'
    )
    subject = f"{headline} — {shop_name}"
    return _send_raw(email, subject, html)

def send_staff_invitation(email: str, name: str, inviter: str) -> bool:
    html = _simple_email_html(
        icon="&#128101;",
        title="&#161;Te invitaron a Bayup!",
        body_html=(
            f"Hola <strong style='color:#0f1f1f'>{name}</strong>, "
            f"<strong style='color:#0f1f1f'>{inviter}</strong> te ha invitado a unirte "
            "como miembro del equipo en Bayup. Inicia sesi&#243;n para aceptar y empezar a colaborar."
        ),
        cta_text="Iniciar sesi&#243;n",
        cta_url=f"{_SITE}/login",
    )
    return _send_raw(email, f"{inviter} te invitó a Bayup", html)


def send_affiliate_welcome(email: str, name: str) -> bool:
    html = _simple_email_html(
        icon="&#128176;",
        title="&#161;Ya eres afiliado Bayup!",
        body_html=(
            f"Hola <strong style='color:#0f1f1f'>{name}</strong>, "
            "tu cuenta de afiliado est&#225; activa. "
            "Comparte tu enlace &#250;nico y empieza a ganar comisiones por cada tienda que refieras."
        ),
        cta_text="Ver mi panel de afiliado",
        cta_url=f"{_SITE}/afiliado/dashboard",
    )
    return _send_raw(email, "¡Ya eres afiliado Bayup!", html)


def send_email_confirmation(email: str, name: str, token: str) -> bool:
    link = f"{_SITE}/confirm-email?token={token}"
    html = _simple_email_html(
        icon="&#9993;",
        title="Confirma tu correo",
        body_html=(
            f"Hola <strong style='color:#0f1f1f'>{name}</strong>, "
            "un solo clic y tu cuenta quedar&#225; activa. "
            "Podr&#225;s empezar a configurar tu tienda Bayup de inmediato."
        ),
        cta_text="Confirmar mi correo",
        cta_url=link,
        validity_text="V&#225;lido por 24 horas",
        footer_note="Si no creaste esta cuenta, ignora este mensaje sin problema.",
    )
    return _send_raw(email, "Confirma tu correo — Bayup", html)

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
