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

    // --- PÁGINA 1: PORTADA AMIGABLE ---
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(0, 0, 210, 297, 'F');

    // Logo / Texto
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(40);
    doc.text("BAYUP", 20, 40);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(12);
    doc.text("TU SOCIO DIGITAL", 75, 40);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("RESUMEN DE MI NEGOCIO", 20, 80);
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(`Hola, ${userName}! Así va tu tienda hoy.`, 20, 95);
    doc.text(`${date}`, 20, 105);

    // Cálculos amigables
    const totalSales = orders.reduce((acc, o) => acc + (o.total_price || 0), 0);
    const totalOrders = orders.length;
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
    const stockCritical = products.filter(p => (p.variants?.reduce((a:any,v:any)=>a+(v.stock||0),0) || 0) <= 5).length;

    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, 120, 190, 120);

    const kpis = [
        { label: "DINERO QUE ENTRÓ HOY (VENTAS)", val: `$ ${totalSales.toLocaleString()}`, desc: "Este es el valor total de las ventas que hiciste." },
        { label: "NÚMERO DE VENTAS", val: totalOrders.toString(), desc: "Es la cantidad de clientes que te compraron hoy." },
        { label: "LO QUE GASTA CADA CLIENTE", val: `$ ${avgTicket.toLocaleString()}`, desc: "En promedio, esto es lo que cada persona te paga." },
        { label: "PRODUCTOS POR AGOTARSE", val: stockCritical.toString(), desc: "¡Atención! Estos productos se están acabando." }
    ];

    kpis.forEach((kpi, i) => {
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(kpi.label, 20, 140 + (i * 30));
        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.text(kpi.val, 20, 150 + (i * 30));
        doc.setFontSize(8);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text(kpi.desc, 20, 156 + (i * 30));
    });

    // --- PÁGINA 2: MIS PRODUCTOS ---
    doc.addPage();
    doc.setFillColor(250, 250, 250);
    doc.rect(0, 0, 210, 297, 'F');
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("MIS PRODUCTOS Y CUÁNTO TENGO", 20, 30);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const invIntro = "Aquí puedes ver tu lista de productos, su código único (SKU), cuántas unidades te quedan y a qué precio los vendes. Recuerda que si el stock llega a cero, el producto no se verá en tu web.";
    const splitInvIntro = doc.splitTextToSize(invIntro, 170);
    doc.text(splitInvIntro, 20, 40);

    const inventoryData = products.map(p => [
        p.name,
        p.sku || 'Sin código',
        p.variants?.reduce((a:any, v:any) => a + (v.stock || 0), 0) || 0,
        `$ ${p.price.toLocaleString()}`
    ]).slice(0, 25);

    autoTable(doc, {
        startY: 55,
        head: [['Nombre del Producto', 'Código (SKU)', 'Unidades Libres', 'Precio de Venta']],
        body: inventoryData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 9 }
    });

    // --- PÁGINA 3: POR DÓNDE VENDO ---
    doc.addPage();
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("¿POR DÓNDE ME COMPRAN MÁS?", 20, 30);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const salesIntro = "Es importante saber si tus clientes te compran más por la página web o directamente en tu tienda física. Así sabrás dónde poner más esfuerzo.";
    const splitSalesIntro = doc.splitTextToSize(salesIntro, 170);
    doc.text(splitSalesIntro, 20, 40);
    
    const salesBySource = orders.reduce((acc: any, o) => {
        const src = o.source === 'pos' ? 'Tienda Física' : (o.source || 'Página Web');
        acc[src] = (acc[src] || 0) + (o.total_price || 0);
        return acc;
    }, {});

    const salesTable = Object.entries(salesBySource).map(([src, val]: [string, any]) => [
        src.toUpperCase(),
        `$ ${val.toLocaleString()}`,
        `${((val / (totalSales || 1)) * 100).toFixed(1)}% del total`
    ]);

    autoTable(doc, {
        startY: 55,
        head: [['Lugar de la Venta', 'Total Vendido', 'Qué tanto representa']],
        body: salesTable,
        theme: 'grid',
        headStyles: { fillColor: [0, 120, 120] }
    });

    // --- PÁGINA 4: CUENTAS CLARAS ---
    doc.addPage();
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("CUENTAS CLARAS: GANANCIAS Y GASTOS", 20, 30);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const financeIntro = "Para que tu negocio crezca, debes saber cuánto dinero te queda libre después de restar tus gastos. Esto es lo que llamamos rentabilidad.";
    const splitFinanceIntro = doc.splitTextToSize(financeIntro, 170);
    doc.text(splitFinanceIntro, 20, 40);
    
    const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const netProfit = totalSales - totalExpenses;

    const financeData = [
        ['(+) Dinero de Ventas', `$ ${totalSales.toLocaleString()}`],
        ['(-) Dinero que Gasté', `$ ${totalExpenses.toLocaleString()}`],
        ['(=) Dinero que me queda libre', `$ ${netProfit.toLocaleString()}`],
        ['Mi ganancia real es del:', `${totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : 0}% de lo vendido`]
    ];

    autoTable(doc, {
        startY: 60,
        body: financeData,
        theme: 'plain',
        styles: { fontSize: 12, cellPadding: 5 },
        columnStyles: { 1: { fontStyle: 'bold', halign: 'right' } }
    });

    // --- PÁGINA 5: CONSEJOS DE BAYT ---
    doc.addPage();
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 297, 'F');

    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(22);
    doc.text("LOS CONSEJOS DE TU ASISTENTE BAYT", 20, 40);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const advice = [
        `1. PILAS CON EL STOCK: Tienes ${stockCritical} productos que se van a acabar. Si no compras más pronto, vas a dejar de vender esos favoritos de tus clientes.`,
        `2. ¡VENDE MÁS A CADA UNO!: Cada cliente te compra en promedio $ ${avgTicket.toLocaleString()}. Si armas "combos" de productos, podrías subir esa cuenta a $ ${(avgTicket * 1.2).toLocaleString()}.`,
        `3. TU MEJOR CANAL: El canal "${Object.keys(salesBySource)[0] || 'Web'}" es el que más dinero te da. Sigue publicando allí tus mejores fotos hoy mismo.`,
        `4. CUIDA TU PLATA: Tus gastos son el ${totalSales > 0 ? ((totalExpenses / totalSales) * 100).toFixed(1) : 0}% de lo que vendes. Trata de no gastar más de lo necesario para que te quede más dinero libre.`
    ];

    advice.forEach((line, i) => {
        const splitText = doc.splitTextToSize(line, 170);
        doc.text(splitText, 20, 70 + (i * 40));
    });

    doc.setFontSize(10);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("Este reporte fue preparado por Bayup para ayudarte a crecer.", 20, 280);

    doc.save(`Resumen_De_Mi_Negocio_${userName}_${new Date().getTime()}.pdf`);
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

    // --- RESUMEN DE LIQUIDACIÓN DETALLADO ---
    const totalAmount = invoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
    const webTotal = invoices.filter(i => i.source?.toLowerCase().includes('web')).reduce((acc, inv) => acc + (inv.total || 0), 0);
    const cashTotal = invoices.filter(i => i.payment_method?.toLowerCase() === 'cash').reduce((acc, inv) => acc + (inv.total || 0), 0);
    const transferTotal = invoices.filter(i => i.payment_method?.toLowerCase() === 'transfer').reduce((acc, inv) => acc + (inv.total || 0), 0);

    const finalY = (doc as any).lastAutoTable.finalY + 20;

    // Caja de Resumen
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(110, finalY, 85, 45, 5, 5, 'F');

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "bold");
    doc.text("DESGLOSE POR CANAL Y PAGO:", 115, finalY + 10);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("Total Página Web:", 115, finalY + 18);
    doc.text(`$ ${webTotal.toLocaleString()}`, 190, finalY + 18, { align: 'right' });

    doc.text("Total Efectivo:", 115, finalY + 25);
    doc.text(`$ ${cashTotal.toLocaleString()}`, 190, finalY + 25, { align: 'right' });

    doc.text("Total Transferencia:", 115, finalY + 32);
    doc.text(`$ ${transferTotal.toLocaleString()}`, 190, finalY + 32, { align: 'right' });

    // Línea y Total Final
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.line(115, finalY + 36, 190, finalY + 36);

    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL NETO:", 115, finalY + 42);
    doc.text(`$ ${totalAmount.toLocaleString()}`, 190, finalY + 42, { align: 'right' });

    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.setFont("helvetica", "italic");
    doc.text("Este documento es un extracto fidedigno de las operaciones registradas en el Terminal POS de Bayup.", 20, 285);

    doc.save(`Auditoria_Ventas_${userName}_${new Date().getTime()}.pdf`);
};

export const generateInvoicePDF = async (data: { company: any, order: any, customer: any }) => {
    const { company, order, customer } = data;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    
    const primaryColor: [number, number, number] = [0, 77, 77];
    const secondaryColor: [number, number, number] = [0, 242, 255];

    // --- CABECERA ---
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text(company?.full_name?.toUpperCase() || "MI NEGOCIO", 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("COMPROBANTE OFICIAL DE VENTA", 20, 33);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(`FACTURA #${String(order.id).slice(-4).toUpperCase()}`, 190, 25, { align: 'right' });
    doc.setFontSize(9);
    doc.text(`Fecha: ${new Date(order.created_at).toLocaleDateString()}`, 190, 32, { align: 'right' });

    // --- INFORMACIÓN DE ACTORES ---
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL VENDEDOR", 20, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`${company?.full_name || 'Empresa Registrada'}`, 20, 66);
    doc.text(`Email: ${company?.email || 'N/A'}`, 20, 71);
    doc.text(`WhatsApp: ${company?.phone || company?.company_phone || 'N/A'}`, 20, 76);
    doc.text(`Ciudad: ${company?.city || 'Sede Principal'}`, 20, 81);

    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL CLIENTE", 120, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`${customer.name || 'Cliente Particular'}`, 120, 66);
    doc.text(`Email: ${customer.email || 'N/A'}`, 120, 71);
    doc.text(`WhatsApp: ${customer.phone || 'N/A'}`, 120, 76);
    doc.text(`Ciudad: ${customer.city || 'N/A'}`, 120, 81);

    // --- TABLA DE PRODUCTOS ---
    const tableItems = order.items.map((item: any) => [
        item.product_variant?.product?.name || item.product_name || "Producto",
        item.product_variant?.sku || "N/A",
        item.quantity,
        `$ ${item.price_at_purchase.toLocaleString()}`,
        `$ ${(item.price_at_purchase * item.quantity).toLocaleString()}`
    ]);

    autoTable(doc, {
        startY: 95,
        head: [['Producto', 'Referencia', 'Cant', 'V. Unitario', 'Subtotal']],
        body: tableItems,
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 9, cellPadding: 5 }
    });

    // --- RESUMEN FINAL ---
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFillColor(245, 245, 245);
    doc.rect(120, finalY, 70, 35, 'F');

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text("SUBTOTAL BRUTO:", 125, finalY + 10);
    doc.text(`$ ${order.total_price.toLocaleString()}`, 185, finalY + 10, { align: 'right' });
    
    doc.text("IMPUESTOS (0%):", 125, finalY + 18);
    doc.text("$ 0", 185, finalY + 18, { align: 'right' });

    doc.setDrawColor(200, 200, 200);
    doc.line(125, finalY + 22, 185, finalY + 22);

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL NETO:", 125, finalY + 30);
    doc.text(`$ ${order.total_price.toLocaleString()}`, 185, finalY + 30, { align: 'right' });

    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Gracias por su compra. Este documento es un soporte válido de la operación comercial.", 20, 285);
    doc.text("Generado por Bayup Interactive UP", 190, 285, { align: 'right' });

    doc.save(`Factura_${String(order.id).slice(-4).toUpperCase()}_${customer.name.replace(/\s+/g, '_')}.pdf`);
};
