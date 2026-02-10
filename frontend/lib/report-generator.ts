import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportData {
    userName: string;
    products: any[];
    orders: any[];
    expenses: any[];
}

export const generateDailyReport = async (data: ReportData) => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    const { userName, products, orders, expenses } = data;
    const date = new Date().toLocaleDateString('es-CO', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    // Colores Corporativos Bayup
    const primaryColor: [number, number, number] = [0, 77, 77]; // #004D4D
    const secondaryColor: [number, number, number] = [0, 242, 255]; // #00F2FF
    const accentColor: [number, number, number] = [0, 26, 26]; // #001A1A

    // --- PÁGINA 1: PORTADA Y RESUMEN EJECUTIVO ---
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(0, 0, 210, 297, 'F');

    // Logo / Texto
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(40);
    doc.text("BAYUP", 20, 40);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(12);
    doc.text("INTERACTIVE UP", 75, 40);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("REPORTE MAESTRO DE OPERACIONES", 20, 80);
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(`Empresa: ${userName.toUpperCase()}`, 20, 95);
    doc.text(`Fecha de Emisión: ${date}`, 20, 105);

    // KPIs en Portada
    const totalSales = orders.reduce((acc, o) => acc + (o.total_price || 0), 0);
    const totalOrders = orders.length;
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
    const stockCritical = products.filter(p => (p.variants?.reduce((a:any,v:any)=>a+(v.stock||0),0) || 0) <= 5).length;

    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, 120, 190, 120);

    const kpis = [
        { label: "VENTAS TOTALES", val: `$ ${totalSales.toLocaleString()}` },
        { label: "ÓRDENES PROCESADAS", val: totalOrders.toString() },
        { label: "TICKET PROMEDIO", val: `$ ${avgTicket.toLocaleString()}` },
        { label: "ALERTAS DE STOCK", val: stockCritical.toString() }
    ];

    kpis.forEach((kpi, i) => {
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(kpi.label, 20, 140 + (i * 25));
        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.text(kpi.val, 20, 150 + (i * 25));
    });

    // --- PÁGINA 2: RADAR DE INVENTARIO ---
    doc.addPage();
    doc.setFillColor(250, 250, 250);
    doc.rect(0, 0, 210, 297, 'F');
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("RADAR DE INVENTARIO", 20, 30);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Estado actual de los activos y niveles de existencias críticas.", 20, 40);

    const inventoryData = products.map(p => [
        p.name,
        p.sku || 'N/A',
        p.variants?.reduce((a:any, v:any) => a + (v.stock || 0), 0) || 0,
        `$ ${p.price.toLocaleString()}`
    ]).slice(0, 25);

    autoTable(doc, {
        startY: 50,
        head: [['Producto', 'SKU', 'Stock', 'Precio']],
        body: inventoryData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 9 }
    });

    // --- PÁGINA 3: DINÁMICA DE VENTAS ---
    doc.addPage();
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("DINÁMICA DE VENTAS Y CANALES", 20, 30);
    
    const salesBySource = orders.reduce((acc: any, o) => {
        const src = o.source || 'Tienda';
        acc[src] = (acc[src] || 0) + (o.total_price || 0);
        return acc;
    }, {});

    const salesTable = Object.entries(salesBySource).map(([src, val]: [string, any]) => [
        src.toUpperCase(),
        `$ ${val.toLocaleString()}`,
        `${((val / (totalSales || 1)) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
        startY: 50,
        head: [['Canal de Venta', 'Ingresos Brutos', 'Participación']],
        body: salesTable,
        theme: 'grid',
        headStyles: { fillColor: [0, 120, 120] }
    });

    // --- PÁGINA 4: SALUD FINANCIERA ---
    doc.addPage();
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("AUDITORÍA FINANCIERA", 20, 30);
    
    const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const netProfit = totalSales - totalExpenses;

    const financeData = [
        ['Total Ingresos (Ventas)', `$ ${totalSales.toLocaleString()}`],
        ['Total Egresos (Gastos)', `$ ${totalExpenses.toLocaleString()}`],
        ['Margen de Operación', `$ ${netProfit.toLocaleString()}`],
        ['Rentabilidad Proyectada', `${totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : 0}%`]
    ];

    autoTable(doc, {
        startY: 50,
        body: financeData,
        theme: 'plain',
        styles: { fontSize: 12, cellPadding: 5 },
        columnStyles: { 1: { fontStyle: 'bold', halign: 'right' } }
    });

    // --- PÁGINA 5: HOJA DE RUTA BAYT AI ---
    doc.addPage();
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 297, 'F');

    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(22);
    doc.text("VERDICTO BAYT AI", 20, 40);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "italic");
    const advice = [
        `1. ALERTA DE STOCK: Tienes ${stockCritical} productos en niveles críticos. Sugiero reabastecer inmediatamente para no perder ventas.`,
        `2. OPTIMIZACIÓN DE PRECIOS: Tu ticket promedio es de $ ${avgTicket.toLocaleString()}. Considera crear "Bundles" para subirlo a $ ${(avgTicket * 1.2).toLocaleString()}.`,
        `3. FOCO DE CANAL: El canal "${Object.keys(salesBySource)[0] || 'Web'}" lidera tus ventas. Refuerza la publicidad allí durante las próximas 48 horas.`,
        `4. CONTROL DE GASTOS: Tus gastos representan el ${totalSales > 0 ? ((totalExpenses / totalSales) * 100).toFixed(1) : 0}% de tus ingresos. Mantén el ratio debajo del 30% para escalar.`
    ];

    advice.forEach((line, i) => {
        const splitText = doc.splitTextToSize(line, 170);
        doc.text(splitText, 20, 70 + (i * 40));
    });

    doc.setFontSize(10);
    doc.text("Reporte generado por el cerebro estratégico de Bayup v2.0", 20, 280);

    doc.save(`Reporte_Elite_Bayup_${userName}_${new Date().getTime()}.pdf`);
};

export const generateInvoicesAuditPDF = async (data: { userName: string, invoices: any[], range: { start: string, end: string } }) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const { userName, invoices, range } = data;

    const primaryColor: [number, number, number] = [0, 77, 77];
    const secondaryColor: [number, number, number] = [0, 242, 255];

    // --- ENCABEZADO DE AUDITORÍA ---
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("AUDITORÍA DE VENTAS", 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`BAYUP INTERACTIVE UP - REPORTE OFICIAL`, 20, 28);

    // Info Empresa y Rango
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(11);
    doc.text(`Empresa: ${userName.toUpperCase()}`, 20, 50);
    doc.text(`Periodo: ${range.start || 'Inicio'} hasta ${range.end || 'Hoy'}`, 20, 57);
    doc.text(`Fecha de Reporte: ${new Date().toLocaleString()}`, 20, 64);

    // --- TABLA DE OPERACIONES ---
    const tableData = invoices.map(inv => [
        inv.invoice_num,
        new Date(inv.date).toLocaleDateString(),
        inv.customer,
        inv.source.toUpperCase(),
        inv.payment_method.toUpperCase(),
        `$ ${inv.total.toLocaleString()}`
    ]);

    autoTable(doc, {
        startY: 75,
        head: [['Factura', 'Fecha', 'Cliente', 'Canal', 'Método', 'Monto']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 4 },
        columnStyles: { 5: { halign: 'right', fontStyle: 'bold' } }
    });

    // --- RESUMEN FINAL ---
    const totalAmount = invoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
    const finalY = (doc as any).lastAutoTable.finalY + 15;

    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(120, finalY, 190, finalY);

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("TOTAL LIQUIDADO EN PERIODO:", 120, finalY + 10);
    
    doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`$ ${totalAmount.toLocaleString()}`, 190, finalY + 10, { align: 'right' });

    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    doc.text("Este documento es un extracto fidedigno de las operaciones registradas en el Terminal POS de Bayup.", 20, 285);

    doc.save(`Auditoria_Ventas_${userName}_${new Date().getTime()}.pdf`);
};
