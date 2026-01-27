
const { jsPDF } = require("jspdf");
const fs = require("fs");

const doc = new jsPDF();

// Estilos
const primaryColor = "#9333EA"; // Púrpura Bayup
const darkColor = "#111827"; // Gray-900

// --- PÁGINA 1: PORTADA ---
doc.setFillColor(darkColor);
doc.rect(0, 0, 210, 297, 'F');

doc.setTextColor(255, 255, 255);
doc.setFontSize(40);
doc.setFont("helvetica", "bold");
doc.text("BAYUP", 20, 60);

doc.setFontSize(20);
doc.setTextColor(primaryColor);
doc.text("Guía Maestra de Estructura", 20, 80);
doc.text("y Diseño de Plantillas Pro", 20, 95);

doc.setFontSize(12);
doc.setTextColor(150, 150, 150);
doc.text("Visión: Futurista, Elegante y Data-Driven", 20, 120);
doc.text("Versión 1.0 - 2026", 20, 130);

// --- PÁGINA 2: FILOSOFÍA VISUAL ---
doc.addPage();
doc.setTextColor(darkColor);
doc.setFontSize(18);
doc.text("1. Filosofía Visual (The Glass Look)", 20, 30);

doc.setFontSize(11);
doc.setTextColor(80, 80, 80);
doc.text("Todas las plantillas deben seguir el concepto de 'Glassmorphism' que define a Bayup:", 20, 45);

const principles = [
    "- Fondos translúcidos con desenfoque (backdrop-blur).",
    "- Bordes ultra-redondeados (3.5rem o 40px) para paneles principales.",
    "- Sombras suaves y profundas (shadow-2xl) para generar jerarquía.",
    "- Tipografía: Títulos en 'Black' (900) y cuerpos en 'Medium' (500).",
    "- Colores: Base Gray-900 con acentos Púrpura (600) y Esmeralda (500)."
];

let y = 60;
principles.forEach(p => {
    doc.text(p, 25, y);
    y += 10;
});

// --- PÁGINA 3: ESTRUCTURA QUIRÚRGICA DE PÁGINA ---
doc.addPage();
doc.text("2. Estructura Quirúrgica de la Página Web", 20, 30);
doc.setFontSize(10);
doc.text("El orden de las secciones no es estético, es estratégico para el Funnel de Ventas:", 20, 45);

const sections = [
    "1. Header Glass: Navegación flotante con acceso directo a Carrito y Perfil.",
    "2. Hero Impact: Propuesta de valor clara + Call to Action (CTA) gigante.",
    "3. Social Proof: Logos de marcas o testimonios en scroll infinito suave.",
    "4. Grid de Productos (Dinámico): Conectado a la DB de Bayup con filtros pro.",
    "5. Bloque de Beneficios: Iconografía lineal (Envío gratis, Garantía, Puntos).",
    "6. Newsletter de Rescate: Captura de leads con incentivo (Bono 10%).",
    "7. Footer Minimal: Información legal, redes y métodos de pago."
];

y = 60;
sections.forEach(s => {
    doc.text(s, 25, y);
    y += 12;
});

// --- PÁGINA 4: PLANTILLAS DE CORREO ---
doc.addPage();
doc.text("3. Plantillas de Correo (Email Marketing Pro)", 20, 30);
doc.text("Los correos deben ser una extensión de la web, no algo separado:", 20, 45);

const emailRules = [
    "- Cabecera centrada con el logo de la tienda en alta resolución.",
    "- Botones redondeados (CTA) que imiten el diseño de la plataforma.",
    "- Uso de tarjetas blancas sobre fondo gris muy claro (F9FAFB).",
    "- Pie de página con link de 'Unsubscribe' y redes sociales visibles.",
    "- Personalización: Siempre incluir el nombre del cliente y sus puntos actuales."
];

y = 60;
emailRules.forEach(r => {
    doc.text(r, 25, y);
    y += 10;
});

// --- PIE DE PÁGINA EN TODAS ---
const pageCount = doc.internal.getNumberOfPages();
for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text("Confidencial - Propiedad de Bayup E-commerce Ecosystem", 130, 285);
}

const buffer = doc.output();
fs.writeFileSync("Guia_Estructura_Plantillas_Bayup.pdf", buffer, "binary");
console.log("PDF Generado exitosamente: Guia_Estructura_Plantillas_Bayup.pdf");
