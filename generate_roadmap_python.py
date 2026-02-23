from fpdf import FPDF
import re

class PDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, 'PLAN MAESTRO BAYUP 2026 - CONFIDENCIAL', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Pagina {self.page_no()}', 0, 0, 'C')

def clean_text(text):
    # Eliminar emojis y caracteres no latinos para evitar errores de codificación
    return re.sub(r'[^\x00-\x7F]+', '', text)

def generate_pdf():
    pdf = PDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    try:
        with open("PLAN_MAESTRO_BAYUP_2026_DETALLADO.md", "r", encoding="utf-8") as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Error: {e}")
        return

    for line in lines:
        line = clean_text(line.strip())
        
        if line.startswith("# "):
            pdf.ln(10)
            pdf.set_font('Arial', 'B', 18)
            pdf.multi_cell(0, 10, line.replace("# ", "").upper())
            pdf.ln(5)
        elif line.startswith("## "):
            pdf.ln(8)
            pdf.set_font('Arial', 'B', 14)
            pdf.multi_cell(0, 10, line.replace("## ", ""))
            pdf.ln(4)
        elif line.startswith("### "):
            pdf.ln(5)
            pdf.set_font('Arial', 'B', 12)
            pdf.multi_cell(0, 10, line.replace("### ", ""))
            pdf.ln(2)
        else:
            pdf.set_font('Arial', size=11)
            if line:
                pdf.multi_cell(0, 7, line)
            else:
                pdf.ln(4)

    pdf.output("PLAN_MAESTRO_BAYUP_2026_DETALLADO.pdf")
    print("PDF GENERADO EXITOSAMENTE.")

if __name__ == "__main__":
    generate_pdf()
