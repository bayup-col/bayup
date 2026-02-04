import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatsReportData {
  chats: any[];
  stats: {
    totalChats: number;
    activeChannels: number;
    aiEfficiency: string;
    totalRevenue: string;
  };
}

export const generateChatsPDF = (data: ChatsReportData) => {
  const doc = new jsPDF();
  const now = new Date();
  const dateStr = format(now, "dd 'de' MMMM, yyyy", { locale: es });

  // --- PORTADA EJECUTIVA ---
  doc.setFillColor(0, 77, 77); // Color Petrol
  doc.rect(0, 0, 210, 297, 'F');

  // Decoración abstracta
  doc.setDrawColor(0, 242, 255); // Cyan
  doc.setLineWidth(0.5);
  doc.line(20, 20, 190, 20);
  doc.line(20, 277, 190, 277);

  doc.setTextColor(0, 242, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("BAYUP CORPORATE INTELLIGENCE", 20, 15);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(40);
  doc.setFont("helvetica", "bold");
  doc.text("INFORME", 20, 80);
  doc.text("OMNICANAL", 20, 100);

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Auditoría de Mensajería y Conversión CRM", 20, 115);

  // Resumen de KPIs en Portada
  doc.setFillColor(255, 255, 255, 0.1);
  doc.roundedRect(20, 140, 170, 60, 5, 5, 'F');

  doc.setFontSize(10);
  doc.text("MÉTRICAS CLAVE DEL PERIODO", 30, 155);
  
  const kpis = [
    { l: 'Total Chats:', v: data.stats.totalChats.toString() },
    { l: 'Canales Activos:', v: data.stats.activeChannels.toString() },
    { l: 'Eficiencia IA:', v: data.stats.aiEfficiency },
    { l: 'Ventas Chat:', v: data.stats.totalRevenue }
  ];

  kpis.forEach((kpi, i) => {
    doc.text(kpi.l, 30, 165 + (i * 7));
    doc.text(kpi.v, 80, 165 + (i * 7));
  });

  doc.setFontSize(10);
  doc.text(`Fecha de Emisión: ${dateStr}`, 20, 270);
  doc.text("Documento de carácter confidencial", 20, 275);

  // --- PÁGINA 2: DETALLE DE CONVERSACIONES ---
  doc.addPage();
  doc.setTextColor(0, 77, 77);
  doc.setFontSize(18);
  doc.text("Trazabilidad de Conversaciones", 14, 25);

  const tableData = data.chats.map(chat => [
    chat.customer.name,
    chat.source.toUpperCase(),
    chat.customer.type,
    chat.status.toUpperCase(),
    `$ ${chat.customer.ltv.toLocaleString('de-DE')}`,
    chat.time
  ]);

  autoTable(doc, {
    startY: 35,
    head: [['Cliente', 'Canal', 'Tipo', 'Estado', 'Inversión LTV', 'Últ. Interacción']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [0, 77, 77], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 4 },
    alternateRowStyles: { fillColor: [245, 250, 250] }
  });

  // --- ANÁLISIS DE BAYT AI ---
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFillColor(240, 252, 255);
  doc.roundedRect(14, finalY, 182, 40, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(0, 77, 77);
  doc.setFont("helvetica", "bold");
  doc.text("ANÁLISIS ESTRATÉGICO BAYT AI", 20, finalY + 10);
  
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  const analysis = `Se detecta una eficiencia del ${data.stats.aiEfficiency} en respuestas automatizadas. El canal de mayor rentabilidad es WhatsApp, representando un flujo de ${data.stats.totalRevenue}. Se recomienda escalar la pauta en Instagram para balancear el tráfico del pipeline de prospectos.`;
  const splitText = doc.splitTextToSize(analysis, 170);
  doc.text(splitText, 20, finalY + 20);

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, 190, 285, { align: 'right' });
  }

  doc.save(`Reporte_Omnicanal_Bayup_${format(now, 'yyyyMMdd_HHmm')}.pdf`);
};
