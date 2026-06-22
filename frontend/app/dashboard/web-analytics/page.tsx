"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  TrendingUp, TrendingDown, Eye, Users, ShoppingCart, DollarSign, Monitor, Smartphone,
  Globe, Clock, MapPin, Search, Package, Star, ArrowUpRight, ArrowDownRight,
  Download, Calendar, ChevronDown, Activity, Target, Zap, BarChart3, RefreshCw,
  User, Heart, ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { apiRequest } from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

// ── UTILS ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const fmtN = (n: number) => n.toLocaleString('es-CO');
const pct = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;

// ── MINI COMPONENTS ────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, trend, trendUp, color = 'emerald' }: any) {
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
        {trend != null && (
          <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
            {trendUp ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>} {trend}
          </span>
        )}
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

// ── DATOS MOCK (se reemplazarán con API real) ──────────────────────────────
const HOURS = ['6am','7am','8am','9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm'];
const DAYS  = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun'];

function buildMockData(orders: any[]) {
  // Horas pico
  const hourMap: Record<number, { sessions: number; ventas: number }> = {};
  HOURS.forEach((_, i) => { hourMap[i + 6] = { sessions: 0, ventas: 0 }; });
  orders.forEach(o => {
    const h = new Date(o.created_at).getHours();
    if (hourMap[h]) { hourMap[h].sessions += Math.floor(Math.random() * 8 + 3); hourMap[h].ventas += o.total_price || 0; }
  });
  const hourlyData = HOURS.map((h, i) => ({ hour: h, sessions: hourMap[i + 6]?.sessions || Math.floor(Math.random() * 60 + 10), ventas: hourMap[i + 6]?.ventas || Math.floor(Math.random() * 200000) }));

  // Días de la semana
  const dayMap: Record<number, number> = { 0:6,1:0,2:1,3:2,4:3,5:4,6:5 };
  const dayTotals = DAYS.map(() => ({ sessions: 0, ventas: 0 }));
  orders.forEach(o => {
    const d = dayMap[new Date(o.created_at).getDay()];
    dayTotals[d].sessions += Math.floor(Math.random() * 10 + 5);
    dayTotals[d].ventas += o.total_price || 0;
  });
  const weeklyData = DAYS.map((d, i) => ({ day: d, sessions: dayTotals[i].sessions || Math.floor(Math.random() * 200 + 50), ventas: dayTotals[i].ventas || Math.floor(Math.random() * 500000) }));

  // Mensual
  const monthlyData = MONTHS.map((m, i) => {
    const base = 300000 + i * 120000;
    return { mes: m, ventas: base + Math.floor(Math.random() * 100000), sesiones: 400 + i * 80 + Math.floor(Math.random() * 100) };
  });

  // Top productos
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
  if (topProducts.length === 0) {
    ['Camiseta Básica','Pantalón Chino','Zapatos Cuero','Chaqueta Denim','Vestido Floral','Bolso Piel','Gorra Cap','Sudadera'].forEach((name, i) => {
      topProducts.push({ name, units: 120 - i * 12, revenue: 800000 - i * 80000 });
    });
  }

  // Ciudades
  const cities = [
    { city: 'Bogotá', orders: 38, revenue: 1200000, avg: 31578 },
    { city: 'Medellín', orders: 22, revenue: 780000, avg: 35454 },
    { city: 'Cali', orders: 15, revenue: 490000, avg: 32666 },
    { city: 'Barranquilla', orders: 10, revenue: 310000, avg: 31000 },
    { city: 'Bucaramanga', orders: 7, revenue: 210000, avg: 30000 },
    { city: 'Cartagena', orders: 5, revenue: 175000, avg: 35000 },
    { city: 'Pereira', orders: 3, revenue: 85000, avg: 28333 },
  ];

  return { hourlyData, weeklyData, monthlyData, topProducts, cities };
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────
export default function WebAnalyticsPage() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'resumen' | 'trafico' | 'audiencia' | 'productos' | 'geografico'>('resumen');

  useEffect(() => {
    if (!token) return;
    apiRequest<any[]>('/orders', { token }).then(d => {
      setOrders(Array.isArray(d) ? d : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  const mock = useMemo(() => buildMockData(orders), [orders]);

  // KPIs generales
  const totalRevenue = orders.reduce((a, o) => a + (o.total_price || 0), 0);
  const totalOrders = orders.length;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalSessions = mock.monthlyData.reduce((a, m) => a + m.sesiones, 0);
  const conversionRate = totalSessions > 0 ? (totalOrders / totalSessions * 100) : 0;

  // Dispositivos (mock)
  const deviceData = [
    { name: 'Móvil', value: 64, color: '#004d4d' },
    { name: 'PC', value: 29, color: '#00b2bd' },
    { name: 'Tablet', value: 7, color: '#00f2ff' },
  ];

  // Audiencia (mock)
  const audienceData = [
    { name: 'Mujeres', value: 58, color: '#ec4899' },
    { name: 'Hombres', value: 36, color: '#3b82f6' },
    { name: 'Sin datos', value: 6, color: '#e5e7eb' },
  ];

  // Rangos de edad (mock)
  const ageData = [
    { range: '18-24', pct: 22 },
    { range: '25-34', pct: 38 },
    { range: '35-44', pct: 21 },
    { range: '45-54', pct: 12 },
    { range: '55+', pct: 7 },
  ];

  // Fuentes de tráfico (mock)
  const trafficSources = [
    { source: 'Directo', sessions: 1240, pct: 34, color: '#004d4d' },
    { source: 'Redes Sociales', sessions: 980, pct: 27, color: '#00b2bd' },
    { source: 'Google Organic', sessions: 720, pct: 20, color: '#10b981' },
    { source: 'WhatsApp', sessions: 440, pct: 12, color: '#22c55e' },
    { source: 'Email', sessions: 255, pct: 7, color: '#6366f1' },
  ];

  // Productos más buscados (mock)
  const topSearched = [
    { term: 'camiseta negra', searches: 340 },
    { term: 'vestido verano', searches: 280 },
    { term: 'zapatos cuero', searches: 210 },
    { term: 'pantalón slim', searches: 195 },
    { term: 'chaqueta denim', searches: 170 },
    { term: 'bolso mujer', searches: 145 },
    { term: 'gorra cap', searches: 120 },
    { term: 'sudadera oversize', searches: 98 },
  ];

  const periodLabel = { '7d': 'Últimos 7 días', '30d': 'Últimos 30 días', '90d': 'Últimos 90 días' }[period];

  const tabs = [
    { id: 'resumen',    label: 'Resumen' },
    { id: 'trafico',   label: 'Tráfico' },
    { id: 'audiencia', label: 'Audiencia' },
    { id: 'productos', label: 'Productos' },
    { id: 'geografico',label: 'Geográfico' },
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
          {/* Selector de periodo */}
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
          <button className="h-10 flex items-center gap-2 px-4 rounded-2xl bg-[#004d4d] hover:bg-[#003838] text-white text-[10px] font-semibold uppercase tracking-widest transition-all shadow-sm">
            <Download size={13}/> Exportar
          </button>
        </div>
      </div>

      {/* ── KPIs PRINCIPALES ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Sesiones totales" value={fmtN(totalSessions)} trend="+12.4%" trendUp icon={<Eye/>} color="teal"/>
        <StatCard label="Pedidos" value={fmtN(totalOrders)} trend="+8.1%" trendUp icon={<ShoppingCart/>} color="blue"/>
        <StatCard label="Ingresos" value={totalRevenue > 0 ? fmt(totalRevenue) : '$0'} trend="+15.3%" trendUp icon={<DollarSign/>} color="emerald"/>
        <StatCard label="Ticket promedio" value={fmt(avgTicket)} trend="+3.2%" trendUp icon={<Target/>} color="purple"/>
        <StatCard label="Conversión" value={`${conversionRate.toFixed(1)}%`} trend="-0.4%" trendUp={false} icon={<Zap/>} color="amber"/>
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
          {/* Gráfico de ventas mensual */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
            <SectionTitle sub="Evolución de ventas e ingresos">Ventas mensuales</SectionTitle>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mock.monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#004d4d" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#004d4d" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="gSes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00b2bd" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#00b2bd" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false}/>
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#004d4d" strokeWidth={2.5} fill="url(#gVentas)" dot={false} activeDot={{ r: 4, fill: '#004d4d', stroke: 'white', strokeWidth: 2 }}/>
                  <Area type="monotone" dataKey="sesiones" name="Sesiones" stroke="#00b2bd" strokeWidth={1.5} fill="url(#gSes)" dot={false} activeDot={{ r: 3 }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-6 mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2"><div className="h-[3px] w-5 rounded-full bg-[#004d4d]"/><span className="text-[10px] text-gray-400">Ventas</span></div>
              <div className="flex items-center gap-2"><div className="h-[2px] w-5 rounded-full bg-[#00b2bd]"/><span className="text-[10px] text-gray-400">Sesiones</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Horas pico */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <SectionTitle sub="Actividad por hora del día">Horas de mayor actividad</SectionTitle>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mock.hourlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false}/>
                    <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={2}/>
                    <Tooltip content={<ChartTooltip/>}/>
                    <Bar dataKey="sessions" name="Sesiones" fill="#004d4d" radius={[4,4,0,0]} maxBarSize={18}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex items-center gap-2 p-3 bg-[#004d4d]/5 rounded-2xl">
                <Clock size={13} className="text-[#004d4d] shrink-0"/>
                <p className="text-[10px] text-gray-600"><span className="font-bold text-[#004d4d]">Pico máximo: 7pm – 9pm</span> — Mayor concentración de compras</p>
              </div>
            </div>

            {/* Días de la semana */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <SectionTitle sub="Volumen de ventas por día">Días más rentables</SectionTitle>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mock.weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false}/>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<ChartTooltip/>}/>
                    <Bar dataKey="ventas" name="Ventas" fill="#00b2bd" radius={[4,4,0,0]} maxBarSize={28}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex items-center gap-2 p-3 bg-emerald-50 rounded-2xl">
                <TrendingUp size={13} className="text-emerald-600 shrink-0"/>
                <p className="text-[10px] text-gray-600"><span className="font-bold text-emerald-600">Viernes y Sábado</span> concentran el 42% de las ventas semanales</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: TRÁFICO ── */}
      {activeTab === 'trafico' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fuentes */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <SectionTitle sub="¿De dónde viene tu tráfico?">Fuentes de tráfico</SectionTitle>
              <div className="space-y-3">
                {trafficSources.map((s, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-gray-700">{s.source}</span>
                      <span className="text-[10px] text-gray-400">{fmtN(s.sessions)} · {s.pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ delay: i * 0.08, duration: 0.5 }}
                        className="h-full rounded-full" style={{ backgroundColor: s.color }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dispositivos */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <SectionTitle sub="¿Desde qué dispositivo compran?">Dispositivos</SectionTitle>
              <div className="flex items-center gap-6">
                <div style={{ width: 160, height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={deviceData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" stroke="none">
                        {deviceData.map((d, i) => <Cell key={i} fill={d.color}/>)}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`${v}%`, '']}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {deviceData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }}/>
                        <span className="text-[11px] font-medium text-gray-600">{d.name}</span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-900">{d.value}%</span>
                    </div>
                  ))}
                  <div className="mt-3 p-3 bg-blue-50 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Smartphone size={12} className="text-blue-600"/>
                      <p className="text-[10px] text-blue-700 font-medium">El 64% compra desde móvil — optimiza para mobile</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mini KPIs de dispositivo */}
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
                {[
                  { icon: <Smartphone size={14}/>, label: 'Móvil', sessions: '2,341', conv: '3.8%' },
                  { icon: <Monitor size={14}/>, label: 'PC', sessions: '1,058', conv: '5.2%' },
                  { icon: <BarChart3 size={14}/>, label: 'Tablet', sessions: '255', conv: '2.9%' },
                ].map((d, i) => (
                  <div key={i} className="text-center p-2 rounded-2xl bg-gray-50">
                    <div className="flex justify-center text-gray-400 mb-1">{d.icon}</div>
                    <p className="text-[9px] text-gray-400 font-semibold">{d.label}</p>
                    <p className="text-[11px] font-bold text-gray-800">{d.sessions}</p>
                    <p className="text-[9px] text-emerald-600 font-semibold">{d.conv}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actividad por hora completa */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
            <SectionTitle sub="Ingresos generados por franja horaria">Ventas por hora del día</SectionTitle>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mock.hourlyData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
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
          </div>
        </div>
      )}

      {/* ── TAB: AUDIENCIA ── */}
      {activeTab === 'audiencia' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Género */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <SectionTitle sub="Distribución por género">Género</SectionTitle>
              <div style={{ width: '100%', height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={audienceData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" stroke="none">
                      {audienceData.map((d, i) => <Cell key={i} fill={d.color}/>)}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`${v}%`, '']}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {audienceData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }}/>
                      <span className="text-[11px] text-gray-600">{d.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-900">{d.value}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-pink-50 rounded-2xl">
                <p className="text-[10px] text-pink-700 font-medium flex items-center gap-1.5"><Heart size={11}/> Audiencia mayoritariamente femenina — 58%</p>
              </div>
            </div>

            {/* Edades */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <SectionTitle sub="Distribución por grupo de edad">Rangos de edad</SectionTitle>
              <div className="space-y-3 mt-2">
                {ageData.map((a, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-gray-700">{a.range}</span>
                      <span className="text-[10px] text-gray-400">{a.pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${a.pct}%` }} transition={{ delay: i * 0.1, duration: 0.5 }}
                        className="h-full rounded-full bg-gradient-to-r from-[#004d4d] to-[#00b2bd]"/>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-[#004d4d]/5 rounded-2xl">
                <p className="text-[10px] text-[#004d4d] font-medium flex items-center gap-1.5"><User size={11}/> Core buyer: <strong>25-34 años</strong> (38%)</p>
              </div>
            </div>

            {/* Comportamiento */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <SectionTitle sub="Métricas de comportamiento">Comportamiento</SectionTitle>
              <div className="space-y-4">
                {[
                  { label: 'Tiempo promedio en sitio', value: '4:32 min', icon: <Clock size={14}/>, color: 'text-[#004d4d] bg-[#004d4d]/10' },
                  { label: 'Páginas vistas por sesión', value: '3.8', icon: <Eye size={14}/>, color: 'text-blue-600 bg-blue-50' },
                  { label: 'Tasa de rebote', value: '38.2%', icon: <TrendingDown size={14}/>, color: 'text-amber-600 bg-amber-50' },
                  { label: 'Clientes recurrentes', value: '24.6%', icon: <Users size={14}/>, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Carrito abandonado', value: '62.1%', icon: <ShoppingBag size={14}/>, color: 'text-rose-600 bg-rose-50' },
                  { label: 'NPS estimado', value: '72 / 100', icon: <Star size={14}/>, color: 'text-purple-600 bg-purple-50' },
                ].map((m, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center [&_svg]:w-3.5 [&_svg]:h-3.5 ${m.color}`}>{m.icon}</div>
                      <span className="text-[11px] text-gray-600">{m.label}</span>
                    </div>
                    <span className="text-[12px] font-bold text-gray-900">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Nuevo vs recurrente */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
            <SectionTitle sub="Comparativa mensual nuevos vs recurrentes">Nuevos vs Clientes recurrentes</SectionTitle>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mock.monthlyData.map((m, i) => ({ ...m, nuevos: Math.floor(m.sesiones * 0.75), recurrentes: Math.floor(m.sesiones * 0.25) }))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false}/>
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Bar dataKey="nuevos" name="Nuevos" fill="#004d4d" radius={[4,4,0,0]} maxBarSize={22} stackId="a"/>
                  <Bar dataKey="recurrentes" name="Recurrentes" fill="#00f2ff" radius={[4,4,0,0]} maxBarSize={22} stackId="a"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: PRODUCTOS ── */}
      {activeTab === 'productos' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top productos por ingresos */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <SectionTitle sub="Mayor generación de ingresos">Top productos más vendidos</SectionTitle>
              <div className="space-y-2.5">
                {mock.topProducts.slice(0, 8).map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`text-[10px] font-black w-5 shrink-0 ${i < 3 ? 'text-[#004d4d]' : 'text-gray-300'}`}>#{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] font-semibold text-gray-800 truncate">{p.name}</span>
                        <span className="text-[10px] text-gray-400 shrink-0 ml-2">{fmtN(p.units)} uds</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(p.revenue / (mock.topProducts[0]?.revenue || 1)) * 100}%` }} transition={{ delay: i * 0.06 }}
                          className={`h-full rounded-full ${i < 3 ? 'bg-gradient-to-r from-[#004d4d] to-[#00b2bd]' : 'bg-gray-300'}`}/>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-900 shrink-0">{fmt(p.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Términos más buscados */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
              <SectionTitle sub="Lo que buscan tus clientes en la tienda">Top búsquedas en tienda</SectionTitle>
              <div className="space-y-2.5">
                {topSearched.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`text-[10px] font-black w-5 shrink-0 ${i < 3 ? 'text-amber-500' : 'text-gray-300'}`}>#{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] font-semibold text-gray-800 flex items-center gap-1.5">
                          <Search size={10} className="text-gray-300 shrink-0"/> {s.term}
                        </span>
                        <span className="text-[10px] text-gray-400">{fmtN(s.searches)} búsquedas</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(s.searches / topSearched[0].searches) * 100}%` }} transition={{ delay: i * 0.06 }}
                          className={`h-full rounded-full ${i < 3 ? 'bg-gradient-to-r from-amber-400 to-amber-300' : 'bg-gray-200'}`}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-amber-50 rounded-2xl">
                <p className="text-[10px] text-amber-700 font-medium flex items-center gap-1.5">
                  <Zap size={11}/> "Camiseta negra" con 340 búsquedas — asegura stock disponible
                </p>
              </div>
            </div>
          </div>

          {/* Gráfico de barras productos */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
            <SectionTitle sub="Comparativa visual de ingresos por producto">Ingresos por producto</SectionTitle>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mock.topProducts.slice(0,6).map(p => ({ name: p.name.split(' ').slice(0,2).join(' '), revenue: p.revenue }))} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false}/>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Bar dataKey="revenue" name="Ventas" fill="#004d4d" radius={[6,6,0,0]} maxBarSize={40}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: GEOGRÁFICO ── */}
      {activeTab === 'geografico' && (
        <div className="space-y-6">
          {/* KPIs geo */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Ciudad #1" value="Bogotá" sub="38 pedidos · 38%" icon={<MapPin/>} color="teal"/>
            <StatCard label="Ciudad más rentable" value="Medellín" sub="$35.454 ticket prom." icon={<DollarSign/>} color="emerald"/>
            <StatCard label="Ciudades activas" value="7" sub="En todo el país" icon={<Globe/>} color="blue"/>
            <StatCard label="Cobertura nacional" value="94%" sub="Envíos completados" icon={<Activity/>} color="purple"/>
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
                    {mock.cities.map((c, i) => (
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
                {mock.cities.map((c, i) => {
                  const maxRev = mock.cities[0].revenue;
                  const pctW = (c.revenue / maxRev) * 100;
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

              {/* Insight */}
              <div className="mt-5 p-4 bg-[#001a1a] rounded-2xl">
                <p className="text-[9px] font-bold tracking-widest text-[#00f2ff] mb-1">INSIGHT GEOGRÁFICO</p>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Bogotá + Medellín representan el <span className="text-white font-semibold">60%</span> de los ingresos.
                  Cali tiene potencial de crecimiento con ticket promedio competitivo.
                </p>
              </div>
            </div>
          </div>

          {/* Mapa heat (visual) */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6">
            <SectionTitle sub="Concentración de compras por región">Distribución nacional de compras</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { region: 'Bogotá D.C.', pct: 38, orders: 38, badge: 'bg-[#004d4d] text-white' },
                { region: 'Antioquia', pct: 22, orders: 22, badge: 'bg-[#004d4d]/80 text-white' },
                { region: 'Valle del Cauca', pct: 15, orders: 15, badge: 'bg-[#00b2bd]/80 text-white' },
                { region: 'Atlántico', pct: 10, orders: 10, badge: 'bg-[#00b2bd]/50 text-white' },
                { region: 'Santander', pct: 7, orders: 7, badge: 'bg-gray-200 text-gray-600' },
                { region: 'Bolívar', pct: 5, orders: 5, badge: 'bg-gray-100 text-gray-500' },
                { region: 'Risaralda', pct: 3, orders: 3, badge: 'bg-gray-100 text-gray-500' },
              ].map((r, i) => (
                <div key={i} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <span className={`text-[8px] font-bold tracking-widest px-2 py-0.5 rounded-full ${r.badge}`}>{r.pct}%</span>
                  <p className="text-[11px] font-semibold text-gray-800 mt-2 leading-tight">{r.region}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{r.orders} pedidos</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
