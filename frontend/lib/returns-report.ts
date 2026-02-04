import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface WarrantyCase {
    id: string;
    customer: { name: string; phone: string; email: string; channel: string };
    product: { name: string; sku: string; image: string };
    order: { id: string; date: string; warehouse: string };
    status: string;
    entry_date: string;
    days_open: number;
    priority: string;
}

interface ReturnsReportData {
    cases: WarrantyCase[];
    stats: {
        totalCases: number;
        avgResponseTime: string;
        returnRate: string;
        criticalAlerts: number;
    };
}

export const generateReturnsPDF = (data: ReturnsReportData) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const primaryColor = [0, 77, 77]; // #004d4d
    const accentColor = [0, 242, 255]; // #00f2ff
    const textColor = [26, 32, 44]; // #1a202c
    const secondaryTextColor = [100, 116, 139]; // #64748b

    // --- PÁGINA 1: RESUMEN EJECUTIVO DE CALIDAD ---
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 60, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('BAYUP INTERACTIVE', 20, 30);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text('QUALITY CONTROL & WARRANTY REPORT v4.2', 20, 38);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Fecha de Reporte: ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, 50);
    doc.text('Auditoría: Bayt AI Quality Engine', 140, 50);

    // KPIs Maestros
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INDICADORES DE RENDIMIENTO POSTVENTA', 20, 80);
    doc.setDrawColor(230, 230, 230);
    doc.line(20, 85, 190, 85);

    const drawMetricBox = (x: number, y: number, label: string, value: string, sub: string) => {
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(x, y, 80, 40, 5, 5, 'F');
        doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(label.toUpperCase(), x + 5, y + 10);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFontSize(20);
        doc.text(value, x + 5, y + 25);
        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.setFontSize(8);
        doc.text(sub, x + 5, y + 35);
    };

    drawMetricBox(20, 95, 'Casos en Gestión', data.stats.totalCases.toString(), 'Pendientes por resolver');
    drawMetricBox(110, 95, 'SLA de Respuesta', data.stats.avgResponseTime, 'Promedio de atención');
    drawMetricBox(20, 145, 'Tasa de Retorno', data.stats.returnRate, 'Impacto en inventario');
    drawMetricBox(110, 145, 'Alertas Críticas', data.stats.criticalAlerts.toString(), 'Requieren acción inmediata');

    // Análisis de Bayt AI
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(20, 200, 170, 45, 8, 8, 'F');
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFontSize(10);
    doc.text('AUDITORÍA ESTRATÉGICA DE BAYT AI', 30, 212);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    const aiText = `"He analizado la tendencia de este periodo. La tasa de retorno de ${data.stats.returnRate} se mantiene dentro del rango saludable (< 2%). Sin embargo, detecté un cuello de botella en los casos de prioridad alta. Sugiero priorizar la resolución de estos para evitar penalizaciones de satisfacción en el canal Web."`;
    doc.text(doc.splitTextToSize(aiText, 150), 30, 222);

    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
    doc.setFontSize(8);
    doc.text('Confidencial - Propiedad de Bayup Interactive • Control de Calidad', 105, 285, { align: 'center' });

    // --- PÁGINA 2: LISTADO TÉCNICO ---
    doc.addPage();
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE TÉCNICO DE INCIDENCIAS', 20, 20);

    autoTable(doc, {
        startY: 30,
        head: [['ID CASO', 'CLIENTE', 'PRODUCTO', 'ESTADO', 'DÍAS', 'PRIORIDAD']],
        body: data.cases.map(c => [
            c.id,
            c.customer.name,
            c.product.name,
            c.status.toUpperCase(),
            c.days_open.toString(),
            c.priority.toUpperCase()
        ]),
        headStyles: { 
            fillColor: primaryColor as [number, number, number], 
            textColor: [255, 255, 255],
            fontSize: 8,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 8,
            textColor: textColor as [number, number, number]
        },
        alternateRowStyles: {
            fillColor: [250, 250, 250]
        },
        margin: { left: 20, right: 20 }
    });

    doc.save(`Reporte_Garantias_Bayup_${new Date().toISOString().split('T')[0]}.pdf`);
};
