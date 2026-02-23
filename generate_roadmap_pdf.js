const { jsPDF } = require("jspdf");
const fs = require("fs");
const path = require("path");

const doc = new jsPDF();
const filePath = path.join(__dirname, "PLAN_MAESTRO_BAYUP_2026_DETALLADO.md");
const outputPath = path.join(__dirname, "PLAN_MAESTRO_BAYUP_2026_DETALLADO.pdf");

if (!fs.existsSync(filePath)) {
    console.error("No se encontró el archivo de origen.");
    process.exit(1);
}

const content = fs.readFileSync(filePath, "utf-8");
const lines = content.split(/\r?\n/);

let y = 20;
doc.setFont("helvetica", "bold");
doc.setFontSize(22);
doc.text("BAYUP: EL MANIFIESTO DEL PARTNER DIGITAL (2026)", 10, y);
y += 20;

lines.forEach((line) => {
    if (y > 270) {
        doc.addPage();
        y = 20;
    }
    
    if (line.startsWith("# ")) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text(line.replace("# ", ""), 10, y);
        y += 12;
    } else if (line.startsWith("## ")) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(line.replace("## ", ""), 10, y);
        y += 10;
    } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const splitText = doc.splitTextToSize(line, 180);
        if (splitText.length > 0) {
            doc.text(splitText, 10, y);
            y += (splitText.length * 6);
        } else {
            y += 5; // Salto de línea vacío
        }
    }
});

doc.save(outputPath);
console.log("PDF generado con éxito.");
