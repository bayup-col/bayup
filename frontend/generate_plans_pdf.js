
const { jsPDF } = require("jspdf");
const fs = require("fs");

const doc = new jsPDF();

// Estilos
const petroleumColor = "#004d4d"; 
const cyanColor = "#00f2ff";
const darkColor = "#050505";

// --- PÁGINA 1: PORTADA ---
doc.setFillColor(darkColor);
doc.rect(0, 0, 210, 297, 'F');

doc.setTextColor(255, 255, 255);
doc.setFontSize(40);
doc.setFont("helvetica", "bold");
doc.text("BAYUP", 20, 60);

doc.setFontSize(24);
doc.setTextColor(cyanColor);
doc.text("Estructura de Planes & Módulos", 20, 80);
doc.text("Platinum Plus Edition", 20, 95);

doc.setFontSize(12);
doc.setTextColor(150, 150, 150);
doc.text("Documento Oficial de Arquitectura Comercial", 20, 120);
doc.text("Febrero 2026", 20, 130);

// Función Helper para Títulos
const addTitle = (text, y) => {
    doc.setFontSize(18);
    doc.setTextColor(petroleumColor);
    doc.text(text, 20, y);
    doc.setDrawColor(0, 242, 255); // Cyan Line
    doc.line(20, y + 2, 80, y + 2);
};

// Función Helper para Listas
const addList = (items, startY) => {
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    let y = startY;
    items.forEach(item => {
        doc.text(`• ${item}`, 25, y);
        y += 8;
    });
    return y;
};

// --- PÁGINA 2: PLAN BÁSICO ---
doc.addPage();
addTitle("1. Plan Básico (Start)", 30);

doc.setFontSize(10);
doc.setTextColor(100, 100, 100);
doc.text("Para emprendedores que inician su operación digital.", 20, 45);

const basicModules = [
    "Módulo de Inicio: Estadísticas generales de la plataforma.",
    "Facturación: Sistema POS estándar (Sin facturación electrónica).",
    "Pedidos: Gestión completa de órdenes.",
    "Envíos: Configuración logística básica.",
    "Productos: Catálogo ilimitado + Inventario en tiempo real.",
    "Mensajes: Web + WhatsApp (1 Línea) + Redes Sociales.",
    "Clientes: CRM básico para gestión de compradores.",
    "Descuentos: Creación de cupones y ofertas simples.",
    "Informes: Análisis General de ventas.",
    "Configuración: Info General + Mi Plan."
];

addList(basicModules, 60);

// --- PÁGINA 3: PLAN PRO ELITE ---
doc.addPage();
addTitle("2. Plan Pro Elite (Growth)", 30);

doc.setFontSize(10);
doc.setTextColor(100, 100, 100);
doc.text("Todo lo del Plan Básico, potenciado con IA y Marketing.", 20, 45);

const proModules = [
    "INCLUYE: Todos los módulos del Plan Básico.",
    "Mensajes Automáticos con IA: Respuestas inteligentes.",
    "Catálogo de WhatsApp: Sincronización automática.",
    "Separados IA: Sistema de reservas inteligente.",
    "Web Exclusiva Mayoristas: Portal B2B privado.",
    "Marketing Avanzado: Herramientas de re-targeting y campañas.",
    "Club de Puntos: Sistema de fidelización (Loyalty).",
    "Informes Pro: + Cuentas y Cartera + Control de Gastos.",
    "Staff: Gestión de equipo (Hasta 3 miembros)."
];

addList(proModules, 60);

// --- PÁGINA 4: PLAN EMPRESA ---
doc.addPage();
addTitle("3. Plan Empresa (Scale)", 30);

doc.setFontSize(10);
doc.setTextColor(100, 100, 100);
doc.text("Arquitectura ilimitada para corporaciones.", 20, 45);

const enterpriseModules = [
    "INCLUYE: Todos los módulos de Básico + Pro Elite.",
    "Facturación Electrónica: Integración legal completa.",
    "Staff Ilimitado: Sin restricciones de usuarios.",
    "API Access: Conexión con sistemas externos (ERPs).",
    "Soporte VIP: Account Manager dedicado.",
    "Infraestructura Dedicada: Servidores de alta disponibilidad."
];

addList(enterpriseModules, 60);

// --- PIE DE PÁGINA ---
const pageCount = doc.internal.getNumberOfPages();
for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Confidencial - Bayup E-commerce Ecosystem", 140, 285);
}

const buffer = doc.output();
// Guardar en la carpeta public del frontend para acceso web
fs.writeFileSync("frontend/public/Dossier_Planes_Bayup.pdf", buffer, "binary");
console.log("PDF Generado exitosamente: frontend/public/Dossier_Planes_Bayup.pdf");
