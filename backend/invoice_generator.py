"""
Generador de facturas PDF para pedidos web.
Usa fpdf2 para generar el PDF en el servidor sin depender del navegador.
"""
import base64
import datetime
from fpdf import FPDF


def _cop(amount: float) -> str:
    return f"$ {int(amount):,}".replace(",", ".")


_UNICODE_REPLACEMENTS = {
    "—": "-",    # em dash —
    "–": "-",    # en dash –
    "‘": "'",    # comilla simple izquierda '
    "’": "'",    # comilla simple derecha '
    "“": '"',    # comilla doble izquierda "
    "”": '"',    # comilla doble derecha "
    "…": "...",  # puntos suspensivos …
}


def _safe_text(value) -> str:
    """
    Sanea texto para el font core Helvetica de fpdf2, que solo soporta latin-1.
    Sin esto, cualquier nombre de producto/tienda/cliente con un guion largo
    (ej. "Producto — Variante", generado automáticamente por el propio backend)
    hace fallar la generación completa de la factura.
    """
    text = str(value) if value is not None else ""
    for src, dst in _UNICODE_REPLACEMENTS.items():
        text = text.replace(src, dst)
    return text.encode("latin-1", errors="replace").decode("latin-1")


def generate_invoice_base64(
    order_id: str,
    shop_name: str,
    shop_email: str,
    shop_phone: str,
    shop_city: str,
    customer_name: str,
    customer_email: str,
    customer_phone: str,
    customer_city: str,
    items: list,          # [{"name": str, "qty": int, "price": float}]
    total: float,
    payment_method: str,
    created_at: datetime.datetime | None = None,
) -> str:
    """Genera la factura como PDF y devuelve el contenido en base64."""

    short_id  = str(order_id)[:8].upper()
    date_str  = (created_at or datetime.datetime.utcnow()).strftime("%d/%m/%Y")

    shop_name      = _safe_text(shop_name)
    shop_email     = _safe_text(shop_email)
    shop_phone     = _safe_text(shop_phone)
    shop_city      = _safe_text(shop_city)
    customer_name  = _safe_text(customer_name)
    customer_email = _safe_text(customer_email)
    customer_phone = _safe_text(customer_phone)
    customer_city  = _safe_text(customer_city)
    payment_method = _safe_text(payment_method)
    items = [{**item, "name": _safe_text(item.get("name"))} for item in items]

    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    # ── Colores ──────────────────────────────────────────────────────────────
    PRIMARY   = (0, 77, 77)
    WHITE     = (255, 255, 255)
    GRAY_BG   = (245, 245, 245)
    GRAY_TEXT = (100, 100, 100)
    BLACK     = (17, 24, 39)

    # ── Cabecera ─────────────────────────────────────────────────────────────
    pdf.set_fill_color(*PRIMARY)
    pdf.rect(0, 0, 210, 38, "F")

    pdf.set_xy(14, 8)
    pdf.set_text_color(*WHITE)
    pdf.set_font("Helvetica", "B", 22)
    pdf.cell(0, 10, shop_name.upper(), ln=True)

    pdf.set_xy(14, 20)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(0, 220, 220)
    pdf.cell(0, 6, "COMPROBANTE OFICIAL DE VENTA", ln=True)

    # Número de factura (derecha)
    pdf.set_xy(130, 8)
    pdf.set_text_color(*WHITE)
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(66, 8, f"FACTURA #{short_id}", align="R", ln=True)

    pdf.set_xy(130, 18)
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(66, 6, f"Fecha: {date_str}", align="R", ln=True)

    # ── Datos vendedor / cliente ──────────────────────────────────────────────
    y = 48
    pdf.set_y(y)
    pdf.set_text_color(*BLACK)

    col_w = 88
    gap   = 14

    def info_block(x: float, title: str, lines: list[str]):
        pdf.set_xy(x, y)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*GRAY_TEXT)
        pdf.cell(col_w, 6, title, ln=True)
        pdf.set_x(x)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(*BLACK)
        for line in lines:
            pdf.set_x(x)
            pdf.cell(col_w, 5, line, ln=True)

    info_block(14, "DATOS DEL VENDEDOR", [
        shop_name,
        f"Email: {shop_email or '-'}",
        f"WhatsApp: {shop_phone or '-'}",
        f"Ciudad: {shop_city or 'Sede Principal'}",
    ])
    info_block(14 + col_w + gap, "DATOS DEL CLIENTE", [
        customer_name,
        f"Email: {customer_email or '-'}",
        f"WhatsApp: {customer_phone or '-'}",
        f"Ciudad: {customer_city or '-'}",
    ])

    # ── Tabla de productos ────────────────────────────────────────────────────
    y2 = y + 36
    pdf.set_xy(14, y2)

    # Encabezado tabla
    pdf.set_fill_color(*PRIMARY)
    pdf.set_text_color(*WHITE)
    pdf.set_font("Helvetica", "B", 9)
    col_widths = [72, 30, 34, 36]
    headers    = ["Producto", "Referencia", "Cant", "V. Unitario", "Subtotal"]
    col_widths = [70, 28, 18, 32, 34]

    for i, (h, w) in enumerate(zip(headers, col_widths)):
        pdf.cell(w, 8, h, border=0, fill=True, align="C" if i > 1 else "L")
    pdf.ln()

    # Filas
    pdf.set_text_color(*BLACK)
    pdf.set_font("Helvetica", "", 9)
    fill = False
    for item in items:
        subtotal = item["qty"] * item["price"]
        pdf.set_fill_color(*GRAY_BG) if fill else pdf.set_fill_color(*WHITE)
        pdf.set_x(14)
        pdf.cell(col_widths[0], 8, item["name"][:38], border="B", fill=True)
        pdf.cell(col_widths[1], 8, "N/A",            border="B", fill=True, align="C")
        pdf.cell(col_widths[2], 8, str(item["qty"]), border="B", fill=True, align="C")
        pdf.cell(col_widths[3], 8, _cop(item["price"]),    border="B", fill=True, align="R")
        pdf.cell(col_widths[4], 8, _cop(subtotal),         border="B", fill=True, align="R")
        pdf.ln()
        fill = not fill

    # ── Resumen final ─────────────────────────────────────────────────────────
    fy = pdf.get_y() + 8
    box_x, box_w = 120, 76

    pdf.set_fill_color(*GRAY_BG)
    pdf.rect(box_x, fy, box_w, 28, "F")

    pdf.set_text_color(*GRAY_TEXT)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_xy(box_x + 4, fy + 4)
    pdf.cell(40, 6, "SUBTOTAL BRUTO:")
    pdf.cell(box_w - 48, 6, _cop(total), align="R")
    pdf.ln()

    pdf.set_x(box_x + 4)
    pdf.cell(40, 6, "IMPUESTOS (0%):")
    pdf.cell(box_w - 48, 6, "$ 0", align="R")
    pdf.ln()

    pdf.set_draw_color(200, 200, 200)
    pdf.line(box_x + 4, pdf.get_y() + 1, box_x + box_w - 4, pdf.get_y() + 1)
    pdf.ln(4)

    pdf.set_text_color(*PRIMARY)
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_x(box_x + 4)
    pdf.cell(40, 8, "TOTAL NETO:")
    pdf.cell(box_w - 48, 8, _cop(total), align="R")

    # Método de pago
    pdf.set_xy(14, fy + 4)
    pdf.set_text_color(*GRAY_TEXT)
    pdf.set_font("Helvetica", "", 8)
    pdf.cell(0, 5, f"Método de pago: {payment_method or '-'}")

    # ── Pie de página ─────────────────────────────────────────────────────────
    pdf.set_y(-20)
    pdf.set_text_color(*GRAY_TEXT)
    pdf.set_font("Helvetica", "I", 7)
    pdf.cell(0, 5, f"Factura emitida por {shop_name} - Powered by Bayup", align="C")

    return base64.b64encode(pdf.output()).decode("utf-8")
