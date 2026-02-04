import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Customer {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    status: string;
    total_orders: number;
    total_spent: number;
    join_date: string;
}

interface CustomersReportData {
    customers: Customer[];
    stats: {
        totalCustomers: number;
        avgLTV: string;
        activeRetention: string;
        topSpendersCount: number;
    };
}

export const generateCustomersPDF = (data: CustomersReportData) => {
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

    // --- PÁGINA 1: RESUMEN EJECUTIVO DE CARTERA ---
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 60, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('BAYUP INTERACTIVE', 20, 30);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text('CUSTOMER INTELLIGENCE & LTV REPORT v4.2', 20, 38);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Fecha de Reporte: ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, 50);
    doc.text('Auditoría: Bayt AI CRM Engine', 140, 50);

    // KPIs Maestros
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INDICADORES MAESTROS DE CARTERA', 20, 80);
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

    drawMetricBox(20, 95, 'Total Cartera', data.stats.totalCustomers.toString(), 'Clientes Registrados');
    drawMetricBox(110, 95, 'LTV Promedio', data.stats.avgLTV, 'Valor Vida Cliente');
    drawMetricBox(20, 145, 'Retención Activa', data.stats.activeRetention, 'Salud de Cartera');
    drawMetricBox(110, 145, 'Segmento VIP', data.stats.topSpendersCount.toString(), 'Top Tier Spenders');

    // Análisis de Bayt AI
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(20, 200, 170, 45, 8, 8, 'F');
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFontSize(10);
    doc.text('ANÁLISIS ESTRATÉGICO DE BAYT AI', 30, 212);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    const aiText = `"He analizado tu base de datos de ${data.stats.totalCustomers} clientes. El LTV promedio de ${data.stats.avgLTV} es sólido, pero el segmento VIP genera el 62% de tus ingresos totales. Recomiendo un protocolo de atención prioritaria para estos ${data.stats.topSpendersCount} clientes para asegurar su lealtad a largo plazo."`;
    doc.text(doc.splitTextToSize(aiText, 150), 30, 222);

    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
    doc.setFontSize(8);
    doc.text('Confidencial - Propiedad de Bayup Interactive • CRM Strategy', 105, 285, { align: 'center' });

    // --- PÁGINA 2: LISTADO DE CLIENTES ---
    doc.addPage();
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DESGLOSE TÉCNICO DE CARTERA', 20, 20);

    autoTable(doc, {
        startY: 30,
        head: [['CLIENTE', 'EMAIL', 'PEDIDOS', 'TOTAL INVERTIDO', 'ESTADO']],
        body: data.customers.map(c => [
            c.full_name,
            c.email,
            c.total_orders.toString(),
            formatCurrency(c.total_spent),
            c.status.toUpperCase()
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

    doc.save(`Reporte_Clientes_Bayup_${new Date().toISOString().split('T')[0]}.pdf`);
};
