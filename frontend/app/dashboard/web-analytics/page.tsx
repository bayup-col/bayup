"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  TrendingUp, TrendingDown, Eye, Users, ShoppingCart, DollarSign, Monitor, Smartphone,
  Globe, Clock, MapPin, Search, Package, Star, ArrowUpRight, ArrowDownRight,
  Download, Calendar, ChevronDown, Activity, Target, Zap, BarChart3, RefreshCw,
  User, Heart, ShoppingBag, FileSpreadsheet, FileText
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { useToast } from '@/context/toast-context';
import { apiRequest } from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

// ── UTILS ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const fmtN = (n: number) => n.toLocaleString('es-CO');

// ── MINI COMPONENTS ────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color = 'emerald' }: any) {
  const colors: any = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue:    'bg-blue-50 text-blue-600',
    purple:  'bg-purple-50 text-purple-600',
    amber:   'bg-amber-50 text-amber-600',
    rose:    'bg-rose-50 text-rose-600',
    teal:    'bg-teal-50 text-teal-600',
  };
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-5 hover:-translate-y-0.5 transition-transform duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`h-9 w-9 rounded-2xl flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4 ${colors[color]}`}>{icon}</div>
      </div>
      <p className="text-[8px] font-bold tracking-[0.22em] uppercase text-gray-400 mb-1">{label}</p>
      <h3 className="text-2xl font-bold tracking-tight text-gray-900 leading-none">{value}</h3>
      {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
      <div className="mt-3 h-[3px] w-full rounded-full bg-gray-100">
        <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-[#004d4d]/60 to-transparent"/>
      </div>
    </div>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-gray-900">{children}</h2>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="h-12 w-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3 [&_svg]:w-6 [&_svg]:h-6 text-gray-300">{icon}</div>
      <p className="text-sm font-semibold text-gray-400">{title}</p>
      <p className="text-[10px] text-gray-300 mt-1 max-w-[240px]">{sub}</p>
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-xl rounded-2xl p-3 text-xs min-w-[140px]">
      <p className="font-semibold text-gray-500 mb-1.5 text-[10px]">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div style={{ background: p.color }} className="h-1.5 w-1.5 rounded-full"/>
          <span className="text-gray-400 text-[10px]">{p.name}:</span>
          <span className="font-bold text-gray-800 text-[10px]">
            {typeof p.value === 'number' && p.name?.toLowerCase().includes('venta')
              ? fmt(p.value)
              : fmtN(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── DATOS REALES DESDE PEDIDOS ─────────────────────────────────────────────
const HOURS = ['6am','7am','8am','9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm'];
const DAYS  = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const MONTHS_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function buildRealData(orders: any[]) {
  // Distribución horaria de pedidos reales
  const hourMap: Record<number, { orders: number; ventas: number }> = {};
  HOURS.forEach((_, i) => { hourMap[i + 6] = { orders: 0, ventas: 0 }; });
  orders.forEach(o => {
    const h = new Date(o.created_at).getHours();
    if (hourMap[h]) { hourMap[h].orders += 1; hourMap[h].ventas += o.total_price || 0; }
  });
  const hourlyData = HOURS.map((h, i) => ({
    hour: h,
    sessions: hourMap[i + 6]?.orders || 0,
    ventas: hourMap[i + 6]?.ventas || 0,
  }));

  // Distribución por día de la semana (real)
  const dayMap: Record<number, number> = { 0:6, 1:0, 2:1, 3:2, 4:3, 5:4, 6:5 };
  const dayTotals = DAYS.map(() => ({ sessions: 0, ventas: 0 }));
  orders.forEach(o => {
    const d = dayMap[new Date(o.created_at).getDay()];
    if (d !== undefined) { dayTotals[d].sessions += 1; dayTotals[d].ventas += o.total_price || 0; }
  });
  const weeklyData = DAYS.map((d, i) => ({ day: d, sessions: dayTotals[i].sessions, ventas: dayTotals[i].ventas }));

  // Ventas mensuales reales — últimos 6 meses
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const m = d.getMonth(); const y = d.getFullYear();
    const ventas = orders
      .filter(o => { const od = new Date(o.created_at); return od.getMonth() === m && od.getFullYear() === y; })
      .reduce((a, o) => a + (o.total_price || 0), 0);
    return { mes: MONTHS_LABELS[m], ventas };
  });

  // Top productos desde artículos de pedidos reales
  const productMap: Record<string, { name: string; units: number; revenue: number }> = {};
  orders.forEach(o => {
    (o.items || o.order_items || []).forEach((item: any) => {
      const k = item.product_name || item.name || 'Producto';
      if (!productMap[k]) productMap[k] = { name: k, units: 0, revenue: 0 };
      productMap[k].units += item.quantity || 1;
      productMap[k].revenue += item.total_price || (item.unit_price * (item.quantity || 1)) || 0;
    });
  });
  const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  // Ciudades desde dirección de envío de pedidos reales
  const cityMap: Record<string, { orders: number; revenue: number }> = {};
  orders.forEach(o => {
    const city = o.shipping_address?.city || o.city || null;
    if (city) {
      if (!cityMap[city]) cityMap[city] = { orders: 0, revenue: 0 };
      cityMap[city].orders += 1;
      cityMap[city].revenue += o.total_price || 0;
    }
  });
  const cities = Object.entries(cityMap)
    .map(([city, d]) => ({ city, orders: d.orders, revenue: d.revenue, avg: d.orders > 0 ? Math.round(d.revenue / d.orders) : 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 7);

  return { hourlyData, weeklyData, monthlyData, topProducts, cities };
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────
export default function WebAnalyticsPage() {
  const { token, userName, userEmail } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const dark = theme === 'dark';

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'resumen' | 'trafico' | 'audiencia' | 'productos' | 'geografico'>('resumen');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    apiRequest<any[]>('/orders', { token }).then(d => {
      setOrders(Array.isArray(d) ? d : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  const realData = useMemo(() => buildRealData(orders), [orders]);

  // KPIs — solo datos reales de pedidos
  const totalRevenue = orders.reduce((a, o) => a + (o.total_price || 0), 0);
  const totalOrders = orders.length;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Hora y día pico calculados desde pedidos reales
  const peakHour = realData.hourlyData.reduce(
    (best, h) => h.ventas > best.ventas ? h : best,
    realData.hourlyData[0] || { hour: '—', ventas: 0 }
  );
  const sortedDays = [...realData.weeklyData].sort((a, b) => b.ventas - a.ventas);
  const totalWeekRevenue = realData.weeklyData.reduce((a, d) => a + d.ventas, 0);
  const topTwoDaysRevenue = sortedDays.slice(0, 2).reduce((a, d) => a + d.ventas, 0);
  const topTwoDaysPct = totalWeekRevenue > 0 ? Math.round((topTwoDaysRevenue / totalWeekRevenue) * 100) : 0;
  const peakDayName = sortedDays[0]?.day || '—';
  const secondDayName = sortedDays[1]?.day || '—';

  const handleExportCSV = () => {
    const monthlySection = [
      ['RESUMEN MENSUAL — ÚLTIMOS 6 MESES'],
      ['Mes', 'Ingresos (COP)'],
      ...realData.monthlyData.map(m => [m.mes, m.ventas]),
    ];
    const productSection = realData.topProducts.length > 0 ? [
      [],
      ['TOP PRODUCTOS'],
      ['Producto', 'Unidades', 'Ingresos (COP)'],
      ...realData.topProducts.map(p => [p.name, p.units, p.revenue]),
    ] : [];
    const orderSection = [
      [],
      ['DETALLE DE PEDIDOS'],
      ['Fecha', 'Cliente', 'Total (COP)', 'Estado'],
      ...orders.map(o => [
        o.created_at ? new Date(o.created_at).toLocaleDateString('es-CO') : '',
        o.customer_name || o.customer || '—',
        o.total_price || 0,
        o.status || '—',
      ]),
    ];
    const header = [[`ESTADÍSTICAS BAYUP — Exportado el ${new Date().toLocaleDateString('es-CO')}`], []];
    const all = [...header, ...monthlySection, ...productSection, ...orderSection];
    const csv = all.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `estadisticas_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    showToast('CSV descargado ✓', 'success');
  };

  const handleExportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Bayup';
    wb.created = new Date();

    // ── Hoja 1: Resumen mensual ──
    const ws1 = wb.addWorksheet('Resumen Mensual');
    ws1.columns = [
      { key: 'mes', width: 20 },
      { key: 'ventas', width: 25 },
    ];
    const t1 = ws1.addRow(['ESTADÍSTICAS BAYUP — RESUMEN MENSUAL']);
    t1.font = { bold: true, size: 13, color: { argb: 'FFFFFF' }, name: 'Arial' };
    t1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004D4D' } };
    t1.height = 38; ws1.mergeCells('A1:B1');
    t1.alignment = { vertical: 'middle', horizontal: 'center' };
    ws1.addRow([]);
    const h1 = ws1.addRow(['MES', 'INGRESOS (COP)']);
    h1.eachCell(cell => {
      cell.font = { bold: true, size: 10, name: 'Arial', color: { argb: '004D4D' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6F2F2' } };
      cell.border = { bottom: { style: 'medium', color: { argb: '00B2BD' } } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    h1.height = 28;
    realData.monthlyData.forEach((m, i) => {
      const row = ws1.addRow([m.mes, m.ventas]);
      row.height = 26;
      row.getCell(2).numFmt = '"$"#,##0';
      row.getCell(2).font = { bold: true, color: { argb: '004D4D' }, name: 'Arial', size: 10 };
      if (i % 2 === 0) row.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F7FAFA' } }; });
    });

    // ── Hoja 2: Top productos ──
    if (realData.topProducts.length > 0) {
      const ws2 = wb.addWorksheet('Top Productos');
      ws2.columns = [
        { key: 'name', width: 40 },
        { key: 'units', width: 16 },
        { key: 'revenue', width: 22 },
      ];
      const t2 = ws2.addRow(['TOP PRODUCTOS POR INGRESOS']);
      t2.font = { bold: true, size: 13, color: { argb: 'FFFFFF' }, name: 'Arial' };
      t2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004D4D' } };
      t2.height = 38; ws2.mergeCells('A1:C1');
      t2.alignment = { vertical: 'middle', horizontal: 'center' };
      ws2.addRow([]);
      const h2 = ws2.addRow(['PRODUCTO', 'UNIDADES', 'INGRESOS (COP)']);
      h2.eachCell(cell => {
        cell.font = { bold: true, size: 10, name: 'Arial', color: { argb: '004D4D' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6F2F2' } };
        cell.border = { bottom: { style: 'medium', color: { argb: '00B2BD' } } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      h2.height = 28;
      realData.topProducts.forEach((p, i) => {
        const row = ws2.addRow([p.name, p.units, p.revenue]);
        row.height = 26;
        row.getCell(3).numFmt = '"$"#,##0';
        row.getCell(3).font = { bold: true, color: { argb: '004D4D' }, name: 'Arial', size: 10 };
        if (i % 2 === 0) row.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F7FAFA' } }; });
      });
    }

    // ── Hoja 3: Detalle de pedidos ──
    const ws3 = wb.addWorksheet('Pedidos');
    ws3.columns = [
      { key: 'fecha', width: 16 },
      { key: 'cliente', width: 30 },
      { key: 'total', width: 20 },
      { key: 'estado', width: 16 },
    ];
    const t3 = ws3.addRow(['DETALLE DE PEDIDOS']);
    t3.font = { bold: true, size: 13, color: { argb: 'FFFFFF' }, name: 'Arial' };
    t3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004D4D' } };
    t3.height = 38; ws3.mergeCells('A1:D1');
    t3.alignment = { vertical: 'middle', horizontal: 'center' };
    ws3.addRow([]);
    const h3 = ws3.addRow(['FECHA', 'CLIENTE', 'TOTAL (COP)', 'ESTADO']);
    h3.eachCell(cell => {
      cell.font = { bold: true, size: 10, name: 'Arial', color: { argb: '004D4D' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6F2F2' } };
      cell.border = { bottom: { style: 'medium', color: { argb: '00B2BD' } } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    h3.height = 28;
    orders.forEach((o, i) => {
      const row = ws3.addRow({
        fecha: o.created_at ? new Date(o.created_at).toLocaleDateString('es-CO') : '—',
        cliente: o.customer_name || o.customer || '—',
        total: o.total_price || 0,
        estado: o.status || '—',
      });
      row.height = 26;
      row.getCell(3).numFmt = '"$"#,##0';
      row.getCell(3).font = { bold: true, color: { argb: '004D4D' }, name: 'Arial', size: 10 };
      if (i % 2 === 0) row.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F7FAFA' } }; });
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `estadisticas_bayup_${new Date().toISOString().slice(0,10)}.xlsx`);
    setShowExportMenu(false);
    showToast('Excel descargado ✓', 'success');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const teal: [number, number, number] = [0, 77, 77];
    const tealMid: [number, number, number] = [0, 178, 189];
    const white: [number, number, number] = [255, 255, 255];
    const gray50: [number, number, number] = [247, 250, 250];
    const companyName = userName || userEmail || '';
    const dateStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

    // ── Header band ──────────────────────────────────────────────────────
    doc.setFillColor(...teal);
    doc.rect(0, 0, W, 26, 'F');
    // Acento inferior
    doc.setFillColor(...tealMid);
    doc.rect(0, 24, W, 2, 'F');

    // Logo BayUP a la izquierda
    doc.setTextColor(...white);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('BayUP.', 14, 16);

    // Título centrado
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTADÍSTICAS', W / 2, 11, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Reporte de analítica e inteligencia comercial', W / 2, 17, { align: 'center' });
    if (companyName) {
      doc.setFontSize(8);
      doc.text(companyName, W / 2, 22, { align: 'center' });
    }

    // Fecha a la derecha
    doc.setFontSize(8);
    doc.text(`Generado: ${dateStr}`, W - 14, 16, { align: 'right' });
    doc.setFontSize(7);
    doc.text(periodLabel, W - 14, 22, { align: 'right' });

    // ── KPIs ─────────────────────────────────────────────────────────────
    let y = 34;
    doc.setTextColor(...teal);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('INDICADORES PRINCIPALES', 14, y);
    y += 5;

    const kpis = [
      { label: 'PEDIDOS TOTALES',  value: fmtN(totalOrders) },
      { label: 'INGRESOS TOTALES', value: totalRevenue > 0 ? fmt(totalRevenue) : '$0' },
      { label: 'TICKET PROMEDIO',  value: avgTicket > 0 ? fmt(avgTicket) : '$0' },
    ];
    const boxW = (W - 28 - 8) / 3;
    kpis.forEach((kpi, i) => {
      const x = 14 + i * (boxW + 4);
      doc.setFillColor(...gray50);
      doc.roundedRect(x, y, boxW, 18, 2, 2, 'F');
      doc.setDrawColor(...teal);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y, boxW, 18, 2, 2, 'S');
      doc.setTextColor(130, 130, 130);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.text(kpi.label, x + boxW / 2, y + 7, { align: 'center' });
      doc.setTextColor(...teal);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(kpi.value, x + boxW / 2, y + 14, { align: 'center' });
    });
    y += 25;

    // ── Ventas mensuales ─────────────────────────────────────────────────
    const now2 = new Date();
    const monthlyForPDF = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now2.getFullYear(), now2.getMonth() - 5 + i, 1);
      const m = d.getMonth();
      const yr = d.getFullYear();
      const monthOrders = orders.filter(o => {
        const od = new Date(o.created_at);
        return od.getMonth() === m && od.getFullYear() === yr;
      });
      return {
        mes: MONTHS_LABELS[m],
        pedidos: monthOrders.length,
        ventas: monthOrders.reduce((a, o) => a + (o.total_price || 0), 0),
      };
    });

    const midX = W / 2 + 2;

    doc.setTextColor(...teal);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('VENTAS MENSUALES — ÚLTIMOS 6 MESES', 14, y);

    if (realData.topProducts.length > 0) {
      doc.text('TOP PRODUCTOS POR INGRESOS', midX, y);
    }
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['MES', 'PEDIDOS', 'INGRESOS (COP)']],
      body: monthlyForPDF.map(m => [m.mes, fmtN(m.pedidos), fmt(m.ventas)]),
      styles: { fontSize: 8.5, cellPadding: 3.5 },
      headStyles: { fillColor: teal, textColor: white, fontStyle: 'bold', fontSize: 8, halign: 'center' },
      alternateRowStyles: { fillColor: gray50 },
      columnStyles: {
        0: { cellWidth: 22, halign: 'center' },
        1: { cellWidth: 22, halign: 'center' },
        2: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: midX },
    });

    if (realData.topProducts.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['PRODUCTO', 'UNIDADES', 'INGRESOS (COP)']],
        body: realData.topProducts.slice(0, 8).map((p, i) => [`#${i + 1} ${p.name}`, fmtN(p.units), fmt(p.revenue)]),
        styles: { fontSize: 8.5, cellPadding: 3.5 },
        headStyles: { fillColor: teal, textColor: white, fontStyle: 'bold', fontSize: 8, halign: 'center' },
        alternateRowStyles: { fillColor: gray50 },
        columnStyles: {
          0: { overflow: 'ellipsize' },
          1: { cellWidth: 24, halign: 'center' },
          2: { cellWidth: 42, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: midX, right: 14 },
      });
    }

    // ── Footer en cada página ────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(...teal);
      doc.rect(0, H - 8, W, 8, 'F');
      doc.setTextColor(...white);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Generado por BayUP • bayup.com.co', W / 2, H - 3, { align: 'center' });
      doc.text(`Pág. ${i} / ${pageCount}`, W - 14, H - 3, { align: 'right' });
    }

    doc.save(`estadisticas_bayup_${new Date().toISOString().slice(0, 10)}.pdf`);
    setShowExportMenu(false);
    showToast('PDF generado ✓', 'success');
  };

  const periodLabel = { '7d': 'Últimos 7 días', '30d': 'Últimos 30 días', '90d': 'Últimos 90 días' }[period];

  const tabs = [
    { id: 'resumen',     label: 'Resumen' },
    { id: 'trafico',    label: 'Tráfico' },
    { id: 'audiencia',  label: 'Audiencia' },
    { id: 'productos',  label: 'Productos' },
    { id: 'geografico', label: 'Geográfico' },
  ] as const;

  return (
    <div className="space-y-6 pb-20">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className={`flex items-center gap-2 text-[10px] font-bold tracking-[0.22em] uppercase mb-1 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#004d4d] inline-block"/>
            Web Intelligence
          </p>
          <h1 className="text-4xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00b2bd] to-[#004d4d]">ESTADÍSTICAS</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
            Panel de analítica e inteligencia comercial
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setIsPeriodOpen(v => !v)}
              className="h-10 flex items-center gap-2 px-4 rounded-2xl border border-gray-200 bg-white text-[10px] font-semibold text-gray-600 hover:border-[#004d4d]/30 transition-all shadow-sm"
            >
              <Calendar size={13} className="text-[#004d4d]"/>
              {periodLabel}
              <ChevronDown size={11} className={`transition-transform ${isPeriodOpen ? 'rotate-180' : ''}`}/>
            </button>
            <AnimatePresence>
              {isPeriodOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsPeriodOpen(false)}/>
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                    className="absolute right-0 top-12 z-50 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden min-w-[160px]">
                    {(['7d','30d','90d'] as const).map(p => (
                      <button key={p} onClick={() => { setPeriod(p); setIsPeriodOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[11px] font-medium transition-colors ${period === p ? 'bg-[#004d4d]/5 text-[#004d4d] font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                        {{ '7d': 'Últimos 7 días', '30d': 'Últimos 30 días', '90d': 'Últimos 90 días' }[p]}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <div className="relative" ref={exportMenuRef}>
            <button onClick={() => setShowExportMenu(v => !v)}
              className="h-10 flex items-center gap-2 px-4 rounded-2xl bg-[#004d4d] hover:bg-[#003838] text-white text-[10px] font-semibold uppercase tracking-widest transition-all shadow-sm">
              <Download size={13}/> Exportar <ChevronDown size={11} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`}/>
            </button>
            <AnimatePresence>
              {showExportMenu && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 top-12 z-50 w-52 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
                  <button onClick={handleExportExcel}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-semibold text-gray-700 hover:bg-[#004d4d]/5 transition-colors text-left">
                    <FileSpreadsheet size={14} className="text-[#004d4d]"/> Excel (.xlsx)
                    <span className="ml-auto text-[9px] text-[#004d4d] font-bold uppercase tracking-wide">Recomendado</span>
                  </button>
                  <div className="h-px bg-gray-100 mx-3"/>
                  <button onClick={handleExportCSV}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-left">
                    <Download size={14} className="text-gray-400"/> CSV (.csv)
                  </button>
                  <div className="h-px bg-gray-100 mx-3"/>
                  <button onClick={handleExportPDF}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-left">
                    <FileText size={14} className="text-rose-500"/> PDF (.pdf)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── KPIs PRINCIPALES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Pedidos" value={fmtN(totalOrders)} sub={totalOrders === 0 ? 'Sin pedidos aún' : undefined} icon={<ShoppingCart/>} color="blue"/>
        <StatCard label="Ingresos totales" value={totalRevenue > 0 ? fmt(totalRevenue) : '$0'} icon={<DollarSign/>} color="emerald"/>
        <StatCard label="Ticket promedio" value={avgTicket > 0 ? fmt(avgTicket) : '$0'} icon={<Target/>} color="purple"/>
      </div>

      {/* ── TABS ── */}
      <div className={`flex p-1 rounded-2xl gap-1 w-fit ${dark ? 'bg-white/5' : 'bg-gray-100'}`}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all duration-150 ${
              activeTab === t.id
              ? 'bg-[#004d4d] text-white shadow-sm'
              : dark ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: RESUMEN ── */}
      {activeTab === 'resumen' && (
        <div className="space-y-6">
          {/* Ventas mensuales */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
            <SectionTitle sub="Evolución de ingresos por mes">Ventas mensuales</SectionTitle>
            {realData.monthlyData.some(m => m.ventas > 0) ? (
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={realData.monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#004d4d" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#004d4d" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false}/>
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<ChartTooltip/>}/>
                    <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#004d4d" strokeWidth={2.5} fill="url(#gVentas)" dot={false} activeDot={{ r: 4, fill: '#004d4d', stroke: 'white', strokeWidth: 2 }}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState icon={<TrendingUp/>} title="Sin ventas registradas" sub="El gráfico aparecerá aquí cuando tengas pedidos"/>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Horas pico */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <SectionTitle sub="Ventas por hora del día">Horas de mayor actividad</SectionTitle>
              {totalOrders > 0 ? (
                <>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={realData.hourlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false}/>
                        <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={2}/>
                        <Tooltip content={<ChartTooltip/>}/>
                        <Bar dataKey="ventas" name="Ventas" fill="#004d4d" radius={[4,4,0,0]} maxBarSize={18}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {peakHour.ventas > 0 && (
                    <div className="mt-3 flex items-center gap-2 p-3 bg-[#004d4d]/5 rounded-2xl">
                      <Clock size={13} className="text-[#004d4d] shrink-0"/>
                      <p className="text-[10px] text-gray-600">
                        <span className="font-bold text-[#004d4d]">Hora pico: {peakHour.hour}</span> — Mayor concentración de ventas
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState icon={<Clock/>} title="Sin datos horarios" sub="Los datos aparecerán aquí cuando tengas pedidos"/>
              )}
            </div>

            {/* Días de la semana */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <SectionTitle sub="Volumen de ventas por día">Días más rentables</SectionTitle>
              {totalOrders > 0 ? (
                <>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={realData.weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false}/>
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                        <Tooltip content={<ChartTooltip/>}/>
                        <Bar dataKey="ventas" name="Ventas" fill="#00b2bd" radius={[4,4,0,0]} maxBarSize={28}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {topTwoDaysRevenue > 0 && (
                    <div className="mt-3 flex items-center gap-2 p-3 bg-emerald-50 rounded-2xl">
                      <TrendingUp size={13} className="text-emerald-600 shrink-0"/>
                      <p className="text-[10px] text-gray-600">
                        <span className="font-bold text-emerald-600">{peakDayName} y {secondDayName}</span> concentran el {topTwoDaysPct}% de las ventas semanales
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState icon={<BarChart3/>} title="Sin datos por día" sub="Los datos aparecerán aquí cuando tengas pedidos"/>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: TRÁFICO ── */}
      {activeTab === 'trafico' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <SectionTitle sub="¿De dónde viene tu tráfico?">Fuentes de tráfico</SectionTitle>
              <EmptyState icon={<Globe/>} title="Integración pendiente" sub="Conecta Google Analytics o activa el píxel de Bayup para ver el origen de tus visitas"/>
            </div>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <SectionTitle sub="¿Desde qué dispositivo compran?">Dispositivos</SectionTitle>
              <EmptyState icon={<Monitor/>} title="Integración pendiente" sub="Los datos de dispositivo estarán disponibles con la integración de analítica web"/>
            </div>
          </div>

          {/* Ventas por hora — dato real */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
            <SectionTitle sub="Ingresos generados por franja horaria">Ventas por hora del día</SectionTitle>
            {totalOrders > 0 ? (
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={realData.hourlyData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gHour" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#004d4d" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#004d4d" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false}/>
                    <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<ChartTooltip/>}/>
                    <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#004d4d" strokeWidth={2} fill="url(#gHour)" dot={false} activeDot={{ r: 4, fill: '#004d4d', stroke: 'white', strokeWidth: 2 }}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState icon={<Activity/>} title="Sin datos horarios" sub="Los datos aparecerán aquí cuando tengas pedidos"/>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: AUDIENCIA ── */}
      {activeTab === 'audiencia' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <SectionTitle sub="Distribución por género">Género</SectionTitle>
              <EmptyState icon={<Users/>} title="Integración pendiente" sub="Disponible con Google Analytics o píxel de Bayup"/>
            </div>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <SectionTitle sub="Distribución por grupo de edad">Rangos de edad</SectionTitle>
              <EmptyState icon={<User/>} title="Integración pendiente" sub="Disponible con Google Analytics o píxel de Bayup"/>
            </div>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <SectionTitle sub="Métricas de comportamiento">Comportamiento</SectionTitle>
              <EmptyState icon={<Eye/>} title="Integración pendiente" sub="Tiempo en sitio, páginas vistas y tasa de rebote requieren analítica web"/>
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
            <SectionTitle sub="Comparativa mensual nuevos vs recurrentes">Nuevos vs Clientes recurrentes</SectionTitle>
            <EmptyState icon={<Heart/>} title="Integración pendiente" sub="Disponible con Google Analytics o píxel de Bayup"/>
          </div>
        </div>
      )}

      {/* ── TAB: PRODUCTOS ── */}
      {activeTab === 'productos' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top productos por ingresos — dato real */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <SectionTitle sub="Mayor generación de ingresos">Top productos más vendidos</SectionTitle>
              {realData.topProducts.length > 0 ? (
                <div className="space-y-2.5">
                  {realData.topProducts.slice(0, 8).map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`text-[10px] font-black w-5 shrink-0 ${i < 3 ? 'text-[#004d4d]' : 'text-gray-300'}`}>#{i+1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] font-semibold text-gray-800 truncate">{p.name}</span>
                          <span className="text-[10px] text-gray-400 shrink-0 ml-2">{fmtN(p.units)} uds</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(p.revenue / (realData.topProducts[0]?.revenue || 1)) * 100}%` }} transition={{ delay: i * 0.06 }}
                            className={`h-full rounded-full ${i < 3 ? 'bg-gradient-to-r from-[#004d4d] to-[#00b2bd]' : 'bg-gray-300'}`}/>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-900 shrink-0">{fmt(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<Package/>} title="Sin ventas de productos" sub="Los datos aparecerán aquí cuando tengas pedidos con artículos"/>
              )}
            </div>

            {/* Búsquedas — no disponible aún */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <SectionTitle sub="Lo que buscan tus clientes en la tienda">Top búsquedas en tienda</SectionTitle>
              <EmptyState icon={<Search/>} title="Buscador no integrado" sub="Activa el buscador en tu tienda para ver los términos que consultan tus clientes"/>
            </div>
          </div>

          {/* Gráfico de barras productos — dato real */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
            <SectionTitle sub="Comparativa visual de ingresos por producto">Ingresos por producto</SectionTitle>
            {realData.topProducts.length > 0 ? (
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={realData.topProducts.slice(0, 6).map(p => ({ name: p.name.split(' ').slice(0, 2).join(' '), revenue: p.revenue }))} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false}/>
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<ChartTooltip/>}/>
                    <Bar dataKey="revenue" name="Ventas" fill="#004d4d" radius={[6,6,0,0]} maxBarSize={40}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState icon={<BarChart3/>} title="Sin datos de productos" sub="Los datos aparecerán aquí cuando tengas pedidos"/>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: GEOGRÁFICO ── */}
      {activeTab === 'geografico' && (
        <div className="space-y-6">
          {realData.cities.length > 0 ? (
            <>
              {/* KPIs geo — derivados de pedidos reales */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Ciudad principal" value={realData.cities[0]?.city || '—'} sub={`${realData.cities[0]?.orders || 0} pedidos`} icon={<MapPin/>} color="teal"/>
                <StatCard label="Ciudades activas" value={String(realData.cities.length)} sub="Con al menos un pedido" icon={<Globe/>} color="blue"/>
                <StatCard label="Ticket promedio" value={fmt(avgTicket)} sub="Todas las ciudades" icon={<DollarSign/>} color="emerald"/>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tabla ciudades */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
                  <SectionTitle sub="Volumen y rentabilidad por ciudad">Ciudades con mayor venta</SectionTitle>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-50">
                          {['Ciudad','Pedidos','Ingresos','Ticket prom.'].map(h => (
                            <th key={h} className="py-2 pr-4 text-left text-[8px] font-bold tracking-widest uppercase text-gray-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {realData.cities.map((c, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black ${i === 0 ? 'text-[#004d4d]' : 'text-gray-300'}`}>#{i+1}</span>
                                <span className="text-[12px] font-semibold text-gray-800">{c.city}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-[11px] font-medium text-gray-600">{c.orders}</td>
                            <td className="py-3 pr-4 text-[11px] font-semibold text-gray-900">{fmt(c.revenue)}</td>
                            <td className="py-3">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.avg > 33000 ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                {fmt(c.avg)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Barras por ciudad */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
                  <SectionTitle sub="Distribución de ingresos por ciudad">Participación por ciudad</SectionTitle>
                  <div className="space-y-3">
                    {realData.cities.map((c, i) => {
                      const maxRev = realData.cities[0].revenue;
                      const pctW = maxRev > 0 ? (c.revenue / maxRev) * 100 : 0;
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-semibold text-gray-700">{c.city}</span>
                            <span className="text-[10px] text-gray-400">{fmt(c.revenue)}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pctW}%` }} transition={{ delay: i * 0.07, duration: 0.5 }}
                              className="h-full rounded-full" style={{ background: i === 0 ? 'linear-gradient(90deg,#004d4d,#00b2bd)' : '#e5e7eb' }}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-10">
              <EmptyState
                icon={<MapPin/>}
                title="Sin datos geográficos"
                sub="Los datos de ciudad aparecerán cuando los pedidos incluyan dirección de envío"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
