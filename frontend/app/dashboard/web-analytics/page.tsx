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
    const now2 = new Date();

    // ── Paleta ───────────────────────────────────────────────────────────
    const Cdark:   [number,number,number] = [10,26,26];
    const Cteal:   [number,number,number] = [0,77,77];
    const CtealM:  [number,number,number] = [0,178,189];
    const CtealL:  [number,number,number] = [232,250,249];
    const Cwhite:  [number,number,number] = [255,255,255];
    const Cgray:   [number,number,number] = [248,250,250];
    const Cgray2:  [number,number,number] = [220,228,228];
    const Cgreen:  [number,number,number] = [22,163,74];
    const Cred:    [number,number,number] = [220,38,38];
    const Cpurple: [number,number,number] = [109,40,217];
    const Camber:  [number,number,number] = [180,83,9];
    const CblueL:  [number,number,number] = [239,246,255];
    const Cblue:   [number,number,number] = [37,99,235];
    const companyName = userName || userEmail || '';

    // ── Helpers ──────────────────────────────────────────────────────────
    const fmtK = (n: number) => n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : fmt(n);

    const pageHeader = (pg: number, title: string, sub: string, accent: [number,number,number] = CtealM) => {
      doc.setFillColor(...Cdark); doc.rect(0, 0, W, 44, 'F');
      doc.setFillColor(...accent); doc.rect(0, 0, 5, 44, 'F');
      doc.setFillColor(...accent); doc.rect(0, 42, W, 2, 'F');
      doc.setFillColor(...accent); doc.roundedRect(W-26, 7, 18, 8, 2, 2, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...Cwhite);
      doc.text(`PÁG ${pg}`, W-17, 12.5, { align:'center' });
      doc.setFontSize(18); doc.setTextColor(...Cwhite);
      doc.text(title, 13, 19);
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...accent);
      doc.text(sub, 13, 27);
      doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(160,200,200);
      const meta = `${periodLabel.toUpperCase()}  ·  ${now2.toLocaleDateString('es-CO',{day:'2-digit',month:'long',year:'numeric'})}`;
      doc.text(meta, 13, 35);
      if (companyName) { doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(120,160,160); doc.text(companyName, W-14, 35, { align:'right' }); }
    };

    const secLabel = (label: string, yy: number) => {
      doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...Cteal);
      doc.text(label, 14, yy);
      doc.setFillColor(...CtealM); doc.rect(14, yy+1.5, Math.min(label.length*1.55, W-28), 0.5, 'F');
    };

    const kpiBox = (x: number, yy: number, bw: number, bh: number, label: string, val: string, sub: string, hl: boolean, accent?: [number,number,number]) => {
      const acc = accent || (hl ? CtealL : Cgray);
      const border = accent || (hl ? CtealM : Cgray2);
      doc.setFillColor(...acc); doc.setDrawColor(...border); doc.setLineWidth(hl ? 0.5 : 0.3);
      doc.roundedRect(x, yy, bw, bh, 2.5, 2.5, 'FD');
      if (hl) { doc.setFillColor(...(accent ? accent : CtealM)); doc.rect(x, yy, 3, bh, 'F'); }
      const tx = x + (hl ? 6 : 4);
      doc.setFont('helvetica','normal'); doc.setFontSize(6); doc.setTextColor(120,135,135);
      doc.text(label.toUpperCase(), tx, yy+6);
      doc.setFont('helvetica','bold'); doc.setFontSize(10);
      if (hl) { doc.setTextColor(...Cteal); } else { doc.setTextColor(...Cdark); }
      doc.text(val, tx, yy+13);
      if (sub) { doc.setFont('helvetica','normal'); doc.setFontSize(6); doc.setTextColor(155,165,165); doc.text(sub, tx, yy+18); }
    };

    const hBar = (x: number, yy: number, bw: number, label: string, val: number, maxVal: number, pct: string, col: [number,number,number], isTop: boolean) => {
      if (isTop) { doc.setFillColor(...CtealL); } else { doc.setFillColor(...Cgray); }
      doc.setDrawColor(...Cgray2); doc.setLineWidth(0.2);
      doc.roundedRect(x, yy, bw, 9, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', isTop?'bold':'normal'); doc.setFontSize(7.5); doc.setTextColor(...Cdark);
      const lbl = label.length > 22 ? label.slice(0,22)+'…' : label;
      doc.text(lbl, x+3, yy+6);
      const barX = x+50; const barW = bw-50-28;
      doc.setFillColor(228,235,235); doc.roundedRect(barX, yy+2.5, barW, 4, 1,1,'F');
      if (val > 0) { doc.setFillColor(...col); doc.roundedRect(barX, yy+2.5, Math.max((val/maxVal)*barW, 1.5), 4, 1,1,'F'); }
      doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...Cteal);
      doc.text(pct, x+bw-2, yy+6, { align:'right' });
    };

    const pageFooter = () => {
      doc.setFillColor(...Cdark); doc.rect(0, H-10, W, 10, 'F');
      doc.setFillColor(...CtealM); doc.rect(0, H-10, 4, 10, 'F');
      doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(135,170,170);
      doc.text(`Reporte de Analítica Comercial · BayUP · bayup.com.co`, 8, H-4);
    };

    // Datos mensuales
    const monthlyForPDF = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now2.getFullYear(), now2.getMonth() - 5 + i, 1);
      const m = d.getMonth();
      const mo = orders.filter(o => { const od = new Date(o.created_at); return od.getMonth()===m && od.getFullYear()===d.getFullYear(); });
      return { mes: MONTHS_LABELS[m], pedidos: mo.length, ventas: mo.reduce((a,o)=>a+(o.total_price||0),0) };
    });

    // ════════════════════════════════════════════════════════════════════════
    // PÁGINA 1 — RESUMEN EJECUTIVO
    // ════════════════════════════════════════════════════════════════════════
    pageHeader(1, 'ANALÍTICA COMERCIAL', 'Resumen ejecutivo · Inteligencia de negocio BayUP');
    let y = 54;

    // KPIs fila
    const kW1 = (W-28-9)/4;
    kpiBox(14,          y, kW1, 24, 'Pedidos totales',   fmtN(totalOrders),                  `${period==='7d'?'7':'30'} días`,                    true);
    kpiBox(14+kW1+3,    y, kW1, 24, 'Ingresos totales',  totalRevenue>0?fmt(totalRevenue):'$0','Del período actual',                               true);
    kpiBox(14+2*(kW1+3),y, kW1, 24, 'Ticket promedio',   avgTicket>0?fmt(avgTicket):'$0',     'Por pedido',                                        false);
    kpiBox(14+3*(kW1+3),y, kW1, 24, 'Hora pico',          peakHour.hour||'—',                  peakHour.ventas>0?`${fmt(peakHour.ventas)} en esa hora`:'Sin datos', false);
    y += 30;

    // Gráfica barras mensuales
    secLabel('EVOLUCIÓN DE VENTAS — ÚLTIMOS 6 MESES', y); y += 5;
    const mH = 45; const mY = y; const mX = 20; const mW = W-40;
    doc.setFillColor(...Cgray); doc.setDrawColor(...Cgray2); doc.setLineWidth(0.15);
    doc.roundedRect(14, y, W-28, mH+10, 2,2,'FD');
    const maxM = Math.max(...monthlyForPDF.map(m=>m.ventas), 1);
    const mbW = mW/monthlyForPDF.length;
    monthlyForPDF.forEach((m,i) => {
      const bh = Math.max((m.ventas/maxM)*(mH-6), 1);
      const bx = mX+i*mbW+mbW*0.2; const bw = mbW*0.6;
      if (i===monthlyForPDF.length-1) { doc.setFillColor(...Cteal); } else { doc.setFillColor(...CtealM); }
      doc.roundedRect(bx, mY+mH-bh+2, bw, bh, 0.8,0.8,'F');
      if (m.ventas > 0) {
        doc.setFont('helvetica','bold'); doc.setFontSize(5.5); doc.setTextColor(...Cteal);
        doc.text(fmtK(m.ventas), bx+bw/2, mY+mH-bh, { align:'center' });
      }
      doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(120,130,130);
      doc.text(m.mes, bx+bw/2, mY+mH+9, { align:'center' });
    });
    y += mH+16;

    // Día pico y tendencia
    const wkMax = Math.max(...realData.weeklyData.map(d=>d.ventas),1);
    const wkW2 = (W-28-6)/2;
    secLabel('DISTRIBUCIÓN SEMANAL', y); y += 5;
    realData.weeklyData.forEach((d,i) => {
      const col: [number,number,number] = d.day===peakDayName ? Cteal : CtealM;
      const bx2 = 14+(i%4)*(wkW2/2+1.5); const by2 = y+Math.floor(i/4)*11;
      const bwk = wkW2/2;
      hBar(bx2, by2, bwk, d.day, d.ventas, wkMax, fmt(d.ventas), col, d.day===peakDayName);
    });
    y += Math.ceil(realData.weeklyData.length/4)*11+6;

    // Insight
    if (y < H-25) {
      doc.setFillColor(...Cdark); doc.roundedRect(14, y, W-28, 14, 2.5, 2.5, 'F');
      doc.setFillColor(...CtealM); doc.rect(14, y, 4, 14, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...CtealM);
      doc.text('INSIGHT CLAVE', 21, y+6);
      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(200,225,225);
      const ins = totalOrders>0
        ? `${peakDayName} y ${secondDayName} concentran el ${topTwoDaysPct}% de las ventas semanales. La hora de mayor actividad es ${peakHour.hour}. Ticket promedio: ${fmt(avgTicket)}.`
        : 'Aún no hay pedidos registrados. Los insights aparecerán aquí cuando tus clientes comiencen a comprar.';
      doc.text(doc.splitTextToSize(ins, W-55), 21, y+11.5);
    }
    pageFooter();

    // ════════════════════════════════════════════════════════════════════════
    // PÁGINA 2 — TRÁFICO
    // ════════════════════════════════════════════════════════════════════════
    doc.addPage();
    pageHeader(2, 'TRÁFICO', 'Análisis de actividad · Distribución horaria y semanal', [37,99,235]);
    y = 54;

    // KPIs tráfico
    const peakOrders = realData.hourlyData.reduce((b,h)=>h.sessions>b.sessions?h:b, realData.hourlyData[0]||{hour:'—',sessions:0,ventas:0});
    const totalDayOrders = realData.weeklyData.reduce((a,d)=>a+d.sessions,0);
    const tkW = (W-28-9)/4;
    kpiBox(14,           y, tkW, 22, 'Pedidos totales',   fmtN(totalOrders),          'En el período',           true, [37,99,235] as [number,number,number]);
    kpiBox(14+tkW+3,     y, tkW, 22, 'Hora más activa',   peakOrders.hour||'—',       `${peakOrders.sessions} pedidos`, false);
    kpiBox(14+2*(tkW+3), y, tkW, 22, 'Día más activo',    peakDayName||'—',            `${topTwoDaysPct}% de ventas sem.`, false);
    kpiBox(14+3*(tkW+3), y, tkW, 22, 'Ticket promedio',   avgTicket>0?fmt(avgTicket):'$0','Por transacción',      false);
    y += 28;

    // Barras horarias
    secLabel('VENTAS POR HORA DEL DÍA', y); y += 5;
    const hZoneH = 50;
    doc.setFillColor(...Cgray); doc.setDrawColor(...Cgray2); doc.setLineWidth(0.15);
    doc.roundedRect(14, y, W-28, hZoneH+12, 2,2,'FD');
    const maxH = Math.max(...realData.hourlyData.map(h=>h.ventas),1);
    const hbW = (W-40)/realData.hourlyData.length;
    realData.hourlyData.forEach((h,i) => {
      const bh = Math.max((h.ventas/maxH)*(hZoneH-4),1);
      const bx = 20+i*hbW+hbW*0.15; const bw = hbW*0.7;
      const isP = h.hour===peakHour.hour;
      if (isP) { doc.setFillColor(...Cteal); } else { doc.setFillColor(0,178,189); }
      doc.roundedRect(bx, y+hZoneH-bh+2, bw, bh, 0.5,0.5,'F');
      if (isP && h.ventas>0) {
        doc.setFillColor(239,246,255); doc.roundedRect(bx-2, y+hZoneH-bh-5, bw+4, 5, 1,1,'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(5); doc.setTextColor(...Cteal);
        doc.text('PICO', bx+bw/2, y+hZoneH-bh-1.5, { align:'center' });
      }
      doc.setFont('helvetica','normal'); doc.setFontSize(5.5); doc.setTextColor(140,150,150);
      doc.text(h.hour, bx+bw/2, y+hZoneH+8, { align:'center' });
    });
    y += hZoneH+18;

    // Tabla horaria + tabla semanal en 2 cols
    secLabel('DETALLE HORARIO', y); y += 4;
    autoTable(doc, {
      startY: y,
      head: [['HORA','PEDIDOS','INGRESOS']],
      body: realData.hourlyData.filter(h=>h.sessions>0||h.ventas>0).map(h=>[h.hour,fmtN(h.sessions),fmt(h.ventas)]),
      styles:{ fontSize:7.5, cellPadding:2.5 },
      headStyles:{ fillColor:Cdark, textColor:Cwhite, fontStyle:'bold', fontSize:7, halign:'center' },
      alternateRowStyles:{ fillColor:Cgray },
      columnStyles:{ 0:{cellWidth:22,halign:'center'}, 1:{cellWidth:24,halign:'center'}, 2:{halign:'right',fontStyle:'bold',textColor:Cteal} },
      margin:{ left:14, right:W/2+4 },
    });

    secLabel('DISTRIBUCIÓN SEMANAL', y); y += 4;
    autoTable(doc, {
      startY: y,
      head: [['DÍA','PEDIDOS','INGRESOS','% DE LA SEMANA']],
      body: realData.weeklyData.map(d=>[
        d.day, fmtN(d.sessions), fmt(d.ventas),
        totalDayOrders>0?`${((d.sessions/totalDayOrders)*100).toFixed(1)}%`:'—',
      ]),
      styles:{ fontSize:8, cellPadding:3 },
      headStyles:{ fillColor:Cdark, textColor:Cwhite, fontStyle:'bold', fontSize:7.5, halign:'center' },
      alternateRowStyles:{ fillColor:Cgray },
      didParseCell:(data)=>{ if(data.section==='body'&&data.column.index===0&&String(data.cell.raw)===peakDayName){ data.cell.styles.fontStyle='bold'; data.cell.styles.textColor=Cteal; } },
      columnStyles:{ 0:{cellWidth:22,halign:'center'}, 1:{cellWidth:24,halign:'center'}, 2:{halign:'right',fontStyle:'bold',textColor:Cteal}, 3:{cellWidth:32,halign:'center'} },
      margin:{ left:W/2+4, right:14 },
    });
    pageFooter();

    // ════════════════════════════════════════════════════════════════════════
    // PÁGINA 3 — AUDIENCIA
    // ════════════════════════════════════════════════════════════════════════
    doc.addPage();
    pageHeader(3, 'AUDIENCIA', 'Comportamiento de clientes · Estrategia publicitaria', Cpurple);
    y = 54;

    // KPIs audiencia
    const uniqueCust = new Set(orders.map(o=>o.customer_email||o.customer_name||o.customer)).size;
    const recurrentes = orders.reduce((acc: Record<string, number>, o: any)=>{const k=o.customer_email||o.customer_name||o.customer;if(k)acc[k]=(acc[k]||0)+1;return acc;},{} as Record<string,number>);
    const recCount = Object.values(recurrentes).filter(v=>v>1).length;
    const newCount = uniqueCust - recCount;
    const recPct = uniqueCust>0 ? Math.round((recCount/uniqueCust)*100) : 0;
    const aW = (W-28-9)/4;
    kpiBox(14,           y, aW, 22, 'Clientes únicos',    fmtN(uniqueCust),             'Distintos compradores',  true, [109,40,217] as [number,number,number]);
    kpiBox(14+aW+3,      y, aW, 22, 'Clientes recurrentes',fmtN(recCount),              `${recPct}% del total`,   false);
    kpiBox(14+2*(aW+3),  y, aW, 22, 'Clientes nuevos',    fmtN(newCount),              `${100-recPct}% del total`,false);
    kpiBox(14+3*(aW+3),  y, aW, 22, 'Ticket promedio',    avgTicket>0?fmt(avgTicket):'$0','Por compra',           false);
    y += 28;

    // Nuevos vs recurrentes — barras horizontales
    secLabel('NUEVOS VS CLIENTES RECURRENTES', y); y += 5;
    const nrData = [
      { label:'Nuevos clientes',      val:newCount,  col:CtealM  as [number,number,number], note:`${100-recPct}%` },
      { label:'Clientes recurrentes', val:recCount,  col:Cpurple as [number,number,number], note:`${recPct}%` },
    ];
    const maxNR = Math.max(newCount, recCount, 1);
    nrData.forEach((r,i)=>{
      const bx = 14+48; const bMaxW = W-28-48-25;
      if (i===0) { doc.setFillColor(...CtealL); } else { doc.setFillColor(243,232,255); }
      doc.setDrawColor(...Cgray2); doc.setLineWidth(0.2);
      doc.roundedRect(14, y+i*14, W-28, 12, 2,2,'FD');
      doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(...Cdark);
      doc.text(r.label, 18, y+i*14+7.5);
      doc.setFillColor(228,235,235); doc.roundedRect(bx, y+i*14+3, bMaxW, 6, 1,1,'F');
      if(r.val>0){ doc.setFillColor(...r.col); doc.roundedRect(bx, y+i*14+3, Math.max((r.val/maxNR)*bMaxW,2), 6, 1,1,'F'); }
      doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...r.col);
      doc.text(`${fmtN(r.val)}  (${r.note})`, W-16, y+i*14+7.5, { align:'right' });
    });
    y += nrData.length*14+10;

    // Comportamiento por hora — tabla de insights
    secLabel('COMPORTAMIENTO DE COMPRA POR FRANJA HORARIA', y); y += 4;
    const franjas = [
      { f:'Mañana (6am–11am)',   ords:realData.hourlyData.filter((_,i)=>i<=5).reduce((a,h)=>a+h.sessions,0),  rev:realData.hourlyData.filter((_,i)=>i<=5).reduce((a,h)=>a+h.ventas,0) },
      { f:'Mediodía (12pm–2pm)', ords:realData.hourlyData.filter((_,i)=>i>=6&&i<=8).reduce((a,h)=>a+h.sessions,0), rev:realData.hourlyData.filter((_,i)=>i>=6&&i<=8).reduce((a,h)=>a+h.ventas,0) },
      { f:'Tarde (3pm–6pm)',     ords:realData.hourlyData.filter((_,i)=>i>=9&&i<=12).reduce((a,h)=>a+h.sessions,0), rev:realData.hourlyData.filter((_,i)=>i>=9&&i<=12).reduce((a,h)=>a+h.ventas,0) },
      { f:'Noche (7pm–10pm)',    ords:realData.hourlyData.filter((_,i)=>i>=13).reduce((a,h)=>a+h.sessions,0), rev:realData.hourlyData.filter((_,i)=>i>=13).reduce((a,h)=>a+h.ventas,0) },
    ];
    const totalFOrds = franjas.reduce((a,f)=>a+f.ords,0);
    autoTable(doc, {
      startY: y,
      head: [['FRANJA HORARIA','PEDIDOS','INGRESOS (COP)','% ACTIVIDAD','ESTRATEGIA']],
      body: franjas.map(f=>{
        const pct = totalFOrds>0 ? ((f.ords/totalFOrds)*100).toFixed(1) : '0.0';
        const strat = Number(pct)>=35?'✓ Invierte más anuncios aquí':Number(pct)>=20?'~ Franja con potencial':'↓ Bajo rendimiento';
        return [f.f, fmtN(f.ords), fmt(f.rev), `${pct}%`, strat];
      }),
      styles:{ fontSize:8.5, cellPadding:3.5 },
      headStyles:{ fillColor:Cdark, textColor:Cwhite, fontStyle:'bold', fontSize:8, halign:'center' },
      alternateRowStyles:{ fillColor:Cgray },
      columnStyles:{ 0:{cellWidth:55}, 1:{cellWidth:24,halign:'center'}, 2:{halign:'right',fontStyle:'bold',textColor:Cteal}, 3:{cellWidth:28,halign:'center'}, 4:{halign:'left'} },
      didParseCell:(data)=>{ if(data.section==='body'&&data.column.index===4){ const v=String(data.cell.raw||''); if(v.startsWith('✓'))data.cell.styles.textColor=Cgreen; else if(v.startsWith('↓'))data.cell.styles.textColor=Cred; else data.cell.styles.textColor=Camber; } },
      margin:{ left:14, right:14 },
    });

    // Box recomendaciones de campaña
    const fy3 = (doc as any).lastAutoTable.finalY + 7;
    if (fy3 < H-28) {
      doc.setFillColor(...Cdark); doc.roundedRect(14, fy3, W-28, 18, 2.5, 2.5, 'F');
      doc.setFillColor(...Cpurple); doc.rect(14, fy3, 4, 18, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(200,180,255);
      doc.text('RECOMENDACIONES PARA CAMPAÑAS PUBLICITARIAS', 21, fy3+7);
      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(190,200,210);
      const rec1 = totalOrders>0
        ? `· Concentra tu presupuesto publicitario en ${peakDayName}${secondDayName?` y ${secondDayName}`:''} (${topTwoDaysPct}% de ventas semanales).`
        : '· Empieza a registrar pedidos para obtener recomendaciones personalizadas.';
      const rec2 = `· Hora pico: ${peakHour.hour}. Programa tus anuncios digitales 1-2h antes para capturar intención de compra.`;
      const rec3 = recPct>0 ? `· El ${recPct}% de clientes son recurrentes — activa campañas de retención y programa de fidelidad.` : '';
      doc.text([rec1, rec2, ...(rec3?[rec3]:[])], 21, fy3+13);
    }
    pageFooter();

    // ════════════════════════════════════════════════════════════════════════
    // PÁGINA 4 — PRODUCTOS
    // ════════════════════════════════════════════════════════════════════════
    doc.addPage();
    pageHeader(4, 'PRODUCTOS', 'Rendimiento de catálogo · Top productos y rentabilidad', Camber);
    y = 54;

    // KPIs productos
    const topProd = realData.topProducts[0];
    const totalUnits = realData.topProducts.reduce((a,p)=>a+p.units,0);
    const pW = (W-28-9)/4;
    kpiBox(14,          y, pW, 22, 'Productos vendidos', fmtN(realData.topProducts.length), 'Con al menos 1 venta', false);
    kpiBox(14+pW+3,     y, pW, 22, 'Unidades totales',   fmtN(totalUnits),                  'Artículos despachados', false);
    kpiBox(14+2*(pW+3), y, pW, 22, 'Producto estrella',  topProd?topProd.name.split(' ').slice(0,3).join(' '):'—', topProd?fmt(topProd.revenue):'Sin ventas', true, [180,83,9] as [number,number,number]);
    kpiBox(14+3*(pW+3), y, pW, 22, 'Ingresos totales',   totalRevenue>0?fmt(totalRevenue):'$0', 'De todos los productos', false);
    y += 28;

    if (realData.topProducts.length === 0) {
      doc.setFont('helvetica','italic'); doc.setFontSize(9); doc.setTextColor(180,180,180);
      doc.text('Sin datos de productos para el período seleccionado.', 14, y+10);
    } else {
      // Barras horizontales top productos
      secLabel('TOP PRODUCTOS POR INGRESOS', y); y += 5;
      const maxProd = realData.topProducts[0].revenue;
      const halfW = (W-32)/2;
      realData.topProducts.slice(0,8).forEach((p,i) => {
        const col = i<3 ? Cteal as [number,number,number] : CtealM as [number,number,number];
        hBar(14, y+i*10, halfW, `#${i+1} ${p.name}`, p.revenue, maxProd, fmt(p.revenue), col, i<3);
      });

      // Tabla derecha — unidades y participación
      const totalProdRev = realData.topProducts.reduce((a,p)=>a+p.revenue,0);
      autoTable(doc, {
        startY: y,
        head: [['PRODUCTO','UNIADES','INGRESOS','%']],
        body: realData.topProducts.slice(0,8).map((p,i)=>[
          `#${i+1} ${p.name.length>22?p.name.slice(0,22)+'…':p.name}`,
          fmtN(p.units),
          fmt(p.revenue),
          totalProdRev>0?`${((p.revenue/totalProdRev)*100).toFixed(1)}%`:'—',
        ]),
        styles:{ fontSize:7.5, cellPadding:2.8 },
        headStyles:{ fillColor:Cdark, textColor:Cwhite, fontStyle:'bold', fontSize:7, halign:'center' },
        alternateRowStyles:{ fillColor:Cgray },
        columnStyles:{
          0:{cellWidth:70},
          1:{cellWidth:20,halign:'center'},
          2:{halign:'right',fontStyle:'bold',textColor:Cteal},
          3:{cellWidth:20,halign:'center'},
        },
        margin:{ left:W/2+4, right:14 },
      });
      y += realData.topProducts.slice(0,8).length*10+8;

      // Participación acumulada top 3
      const top3Rev = realData.topProducts.slice(0,3).reduce((a,p)=>a+p.revenue,0);
      const top3Pct = totalProdRev>0 ? Math.round((top3Rev/totalProdRev)*100) : 0;
      if (y < H-28) {
        doc.setFillColor(...Cdark); doc.roundedRect(14, y, W-28, 14, 2.5, 2.5, 'F');
        doc.setFillColor(180,83,9); doc.rect(14, y, 4, 14, 'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(254,215,170);
        doc.text('CONCENTRACIÓN DE INGRESOS', 21, y+6.5);
        doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(245,225,200);
        const prodIns = `Los 3 productos más vendidos concentran el ${top3Pct}% de los ingresos del período (${fmt(top3Rev)}). Refuerza stock y publicidad de ${topProd?.name||'tu producto estrella'}.`;
        doc.text(doc.splitTextToSize(prodIns, W-55), 21, y+12);
      }
    }
    pageFooter();

    // ════════════════════════════════════════════════════════════════════════
    // PÁGINA 5 — GEOGRÁFICO
    // ════════════════════════════════════════════════════════════════════════
    doc.addPage();
    pageHeader(5, 'GEOGRAFÍA', 'Análisis por ciudad · Foco publicitario y logístico', Cgreen);
    y = 54;

    if (realData.cities.length === 0) {
      doc.setFont('helvetica','italic'); doc.setFontSize(9); doc.setTextColor(180,180,180);
      doc.text('Sin datos geográficos para el período seleccionado.', 14, y+10);
      pageFooter();
      const pc = doc.getNumberOfPages();
      for(let i=1;i<=pc;i++){doc.setPage(i);pageFooter();}
      doc.save(`estadisticas_bayup_${now2.toISOString().slice(0,10)}.pdf`);
      setShowExportMenu(false); showToast('PDF generado ✓', 'success'); return;
    }

    // KPIs geo
    const gW = (W-28-9)/4;
    const totalCityOrd = realData.cities.reduce((a,c)=>a+c.orders,0);
    kpiBox(14,          y, gW, 22, 'Ciudad principal',   realData.cities[0].city,           `${realData.cities[0].orders} pedidos`,          true, [22,163,74] as [number,number,number]);
    kpiBox(14+gW+3,     y, gW, 22, 'Ciudades activas',   fmtN(realData.cities.length),      'Con al menos 1 pedido',                         false);
    kpiBox(14+2*(gW+3), y, gW, 22, 'Ingresos ciudad 1',  fmt(realData.cities[0].revenue),  `${totalRevenue>0?Math.round((realData.cities[0].revenue/totalRevenue)*100):0}% del total`, false);
    kpiBox(14+3*(gW+3), y, gW, 22, 'Ticket prom. top',   fmt(realData.cities[0].avg),       'Ciudad principal',                              false);
    y += 28;

    // Barras horizontales ciudades
    secLabel('INGRESOS POR CIUDAD', y); y += 5;
    const maxCity = realData.cities[0].revenue;
    const cHalfW = (W-32)/2;
    realData.cities.forEach((c,i) => {
      const col: [number,number,number] = i===0 ? Cteal : CtealM;
      const pctStr = totalRevenue>0 ? `${((c.revenue/totalRevenue)*100).toFixed(1)}%` : '—';
      hBar(14, y+i*10, cHalfW, c.city, c.revenue, maxCity, `${fmt(c.revenue)}  (${pctStr})`, col, i===0);
    });

    // Tabla completa ciudades (mitad derecha)
    autoTable(doc, {
      startY: y,
      head: [['#','CIUDAD','PEDIDOS','INGRESOS','TICKET PROM.','% TOTAL']],
      body: realData.cities.map((c,i)=>{
        const pct = totalRevenue>0 ? `${((c.revenue/totalRevenue)*100).toFixed(1)}%` : '—';
        return [`${i+1}`, c.city, fmtN(c.orders), fmt(c.revenue), fmt(c.avg), pct];
      }),
      styles:{ fontSize:7.8, cellPadding:3 },
      headStyles:{ fillColor:Cdark, textColor:Cwhite, fontStyle:'bold', fontSize:7.5, halign:'center' },
      alternateRowStyles:{ fillColor:Cgray },
      columnStyles:{
        0:{cellWidth:10,halign:'center'},
        1:{cellWidth:40},
        2:{cellWidth:22,halign:'center'},
        3:{halign:'right',fontStyle:'bold',textColor:Cteal},
        4:{halign:'right'},
        5:{cellWidth:22,halign:'center'},
      },
      didParseCell:(data)=>{ if(data.section==='body'&&data.row.index===0){ data.cell.styles.fontStyle='bold'; } },
      margin:{ left:W/2+4, right:14 },
    });
    y += realData.cities.length*10+8;

    // Insight estratégico
    const top3Cities = realData.cities.slice(0,3);
    const top3CityRev = top3Cities.reduce((a,c)=>a+c.revenue,0);
    const top3CityPct = totalRevenue>0 ? Math.round((top3CityRev/totalRevenue)*100) : 0;
    const fy5 = (doc as any).lastAutoTable?.finalY || y;
    if (fy5 < H-28) {
      doc.setFillColor(...Cdark); doc.roundedRect(14, fy5+5, W-28, 18, 2.5, 2.5, 'F');
      doc.setFillColor(...Cgreen); doc.rect(14, fy5+5, 4, 18, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(134,239,172);
      doc.text('ESTRATEGIA GEOGRÁFICA RECOMENDADA', 21, fy5+12);
      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(185,225,195);
      const geoIns1 = `· ${top3Cities.map(c=>c.city).join(', ')} concentran el ${top3CityPct}% de los ingresos — prioriza estos mercados en campañas pagadas.`;
      const geoIns2 = `· Ciudad con mayor ticket promedio: ${[...realData.cities].sort((a,b)=>b.avg-a.avg)[0]?.city||'—'} (${fmt([...realData.cities].sort((a,b)=>b.avg-a.avg)[0]?.avg||0)}) — ideal para campañas de producto premium.`;
      const geoIns3 = realData.cities.length>3 ? `· Hay ${realData.cities.length-3} ciudades secundarias con potencial sin explotar — considera testing de anuncios localizados.` : '';
      doc.text([geoIns1, geoIns2, ...(geoIns3?[geoIns3]:[])], 21, fy5+19);
    }

    // ── Footer todas las páginas ──────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i=1; i<=pageCount; i++) { doc.setPage(i); pageFooter(); }

    doc.save(`estadisticas_bayup_${now2.toISOString().slice(0,10)}.pdf`);
    setShowExportMenu(false);
    showToast('PDF de estadísticas generado ✓', 'success');
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
