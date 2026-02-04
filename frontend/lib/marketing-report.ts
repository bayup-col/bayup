import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Campaign {
    id: string;
    name: string;
    status: string;
    objective: string;
    channels: string[];
    budget: number;
    sales: number;
    roas: number;
    performance: string;
    createdAt: string;
}

interface ReportData {
    campaigns: Campaign[];
    globalStats: {
        totalSales: number;
        totalBudget: number;
        avgRoas: number;
        activeCampaigns: number;
    };
}

export const generateMarketingPDF = (data: ReportData) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const primaryColor = [0, 77, 77]; // #004d4d
    const accentColor = [0, 242, 255]; // #00f2ff
    const textColor = [26, 32, 44]; // #1a202c
    const secondaryTextColor = [100, 116, 139]; // #64748b

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    // --- PÁGINA 1: PORTADA EJECUTIVA ---
    // Fondo de cabecera
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 60, 'F');

    // Logo / Nombre
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('BAYUP INTERACTIVE', 20, 30);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text('MARKETING STRATEGY & ROI REPORT v4.2', 20, 38);

    // Fecha y Autor
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, 50);
    doc.text('Generado por: Bayt AI Strategy Engine', 140, 50);

    // Resumen Ejecutivo (KPIs Globales)
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN EJECUTIVO GLOBAL', 20, 80);

    doc.setDrawColor(230, 230, 230);
    doc.line(20, 85, 190, 85);

    // Cuadros de métricas globales
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

    drawMetricBox(20, 95, 'Ventas Totales Atribuidas', formatCurrency(data.globalStats.totalSales), 'Impacto Directo Marketing');
    drawMetricBox(110, 95, 'Retorno (ROAS) Promedio', `${data.globalStats.avgRoas}x`, 'Objetivo: 5.0x');
    drawMetricBox(20, 145, 'Inversión Total', formatCurrency(data.globalStats.totalBudget), 'Costo Operativo Publicitario');
    drawMetricBox(110, 145, 'Campañas Activas', data.globalStats.activeCampaigns.toString(), 'En ejecución simultánea');

    // Análisis de Bayt AI
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(20, 200, 170, 45, 8, 8, 'F');
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFontSize(10);
    doc.text('ANALISIS ESTRATÉGICO DE BAYT AI', 30, 212);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    const aiText = `"El rendimiento global muestra una salud financiera excepcional con un ROAS de ${data.globalStats.avgRoas}x. Se recomienda reasignar el 15% del presupuesto de los canales de menor impacto hacia WhatsApp Business, donde la conversión es un 22% superior."`;
    const splitText = doc.splitTextToSize(aiText, 150);
    doc.text(splitText, 30, 222);

    // Footer
    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Confidencial - Propiedad de Bayup Interactive', 105, 285, { align: 'center' });

    // --- PÁGINAS INDIVIDUALES POR CAMPAÑA ---
    data.campaigns.forEach((camp, index) => {
        doc.addPage();
        
        // Cabecera de campaña
        doc.setFillColor(245, 245, 245);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`DETALLE DE CAMPAÑA #${index + 1}`, 20, 15);
        
        doc.setFontSize(22);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(camp.name.toUpperCase(), 20, 30);

        // Status Badge
        const statusColor = camp.status === 'active' ? [16, 185, 129] : [100, 116, 139];
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.roundedRect(150, 22, 40, 8, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(camp.status === 'active' ? 'EN CURSO' : 'PAUSADA', 170, 27.5, { align: 'center' });

        // Información General de la Campaña
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('MÉTRICAS DE RENDIMIENTO', 20, 60);
        doc.setDrawColor(240, 240, 240);
        doc.line(20, 65, 190, 65);

        // Grid de métricas de la campaña
        const drawMiniKPI = (x: number, y: number, label: string, value: string) => {
            doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(label.toUpperCase(), x, y);
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.setFontSize(14);
            doc.text(value, x, y + 8);
        };

        drawMiniKPI(20, 80, 'Objetivo', camp.objective);
        drawMiniKPI(70, 80, 'Presupuesto', formatCurrency(camp.budget));
        drawMiniKPI(120, 80, 'Ventas Reales', formatCurrency(camp.sales));
        drawMiniKPI(170, 80, 'ROAS', `${camp.roas}x`);

        // Tabla de Canales y Performance
        autoTable(doc, {
            startY: 100,
            head: [['Canal de Difusión', 'Performance', 'Fecha de Creación', 'Impacto']],
            body: [
                [
                    camp.channels.join(', ').toUpperCase(), 
                    camp.performance.toUpperCase(), 
                    new Date(camp.createdAt).toLocaleDateString(),
                    camp.roas > 4 ? 'Alto Rendimiento' : 'Optimizable'
                ]
            ],
            headStyles: { 
                fillColor: primaryColor as [number, number, number], 
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 9,
                textColor: textColor as [number, number, number]
            },
            alternateRowStyles: {
                fillColor: [250, 250, 250]
            },
            margin: { left: 20, right: 20 }
        });

        // Simulación de "Gráfico de Embudo" o Barras
        const finalY = (doc as any).lastAutoTable.finalY || 120;
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('ANÁLISIS DE CONVERSIÓN', 20, finalY + 20);

        const drawBar = (y: number, label: string, percent: number, color: number[]) => {
            doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
            doc.setFontSize(8);
            doc.text(label, 20, y);
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(20, y + 2, 170, 4, 2, 2, 'F');
            doc.setFillColor(color[0], color[1], color[2]);
            doc.roundedRect(20, y + 2, 170 * (percent / 100), 4, 2, 2, 'F');
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.text(`${percent}%`, 192, y + 5.5);
        };

        drawBar(finalY + 35, 'Alcance de Audiencia', 85, [0, 77, 77]);
        drawBar(finalY + 50, 'Tasa de Interacción (CTR)', 12, [0, 242, 255]);
        drawBar(finalY + 65, 'Tasa de Conversión (CR)', 4.2, [16, 185, 129]);

        // Recomendación específica de Bayt por campaña
        doc.setFillColor(255, 251, 235); // Amarillo muy claro
        doc.setDrawColor(245, 158, 11); // Naranja suave
        doc.roundedRect(20, 220, 170, 30, 4, 4, 'FD');
        doc.setTextColor(146, 64, 14);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('SUGERENCIA TÁCTICA BAYT AI:', 25, 228);
        doc.setFont('helvetica', 'normal');
        const campAdvice = camp.roas > 5 
            ? `Esta campaña es altamente rentable. Bayt sugiere duplicar el presupuesto diario para maximizar el alcance mientras el CPA siga bajo.`
            : `El rendimiento es estable pero el costo por clic ha subido. Intenta rotar los creativos o cambiar el copy del mensaje.`;
        doc.text(doc.splitTextToSize(campAdvice, 160), 25, 235);
    });

    doc.save(`Reporte_Marketing_Bayup_${new Date().toISOString().split('T')[0]}.pdf`);
};
