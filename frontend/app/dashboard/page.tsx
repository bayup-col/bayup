"use client";

import React, { useState, useEffect, memo, useMemo, useCallback, useRef } from 'react';
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/context/theme-context";
import { useToast } from "@/context/toast-context";
import Link from 'next/link';
import { 
  Plus, Search, Filter, Download, Package, AlertCircle, ShoppingBag, Trophy, Layers, 
  Edit3, Trash2, MoreVertical, ChevronDown, Info, ArrowUpRight, Eye, Zap, BarChart3, 
  X, ImageIcon, TrendingUp, Globe, Store, MessageSquare, Smartphone, CheckCheck, 
  ChevronRight, Loader2, FilterX, Target, Sparkles, Bot, MousePointer2, Rocket, 
  LayoutGrid, Activity, DollarSign, Clock, ShieldCheck, FileText, Printer, User, 
  CheckCircle2, Truck, RefreshCw, Lightbulb, Wallet, CreditCard, Calendar
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import MetricDetailModal from '@/components/dashboard/MetricDetailModal';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- COMPONENTES ATÓMICOS ---
const AnimatedNumber = memo(({ value, type = 'currency' }: { value: number, type?: 'currency' | 'simple' | 'percentage' }) => {
    const [display, setDisplay] = useState(value);
    const rafRef = useRef<number | null>(null);
    const startRef = useRef<number | null>(null);
    const fromRef = useRef(value);

    useEffect(() => {
        const from = fromRef.current;
        const to = value;
        if (from === to) return;
        const duration = 600;
        const animate = (ts: number) => {
            if (!startRef.current) startRef.current = ts;
            const progress = Math.min((ts - startRef.current) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(from + (to - from) * eased);
            if (progress < 1) rafRef.current = requestAnimationFrame(animate);
            else { fromRef.current = to; startRef.current = null; }
        };
        rafRef.current = requestAnimationFrame(animate);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [value]);

    const formatted = useMemo(() => {
        if (type === 'percentage') return Math.round(display) + "%";
        if (type === 'simple') return Math.round(display).toLocaleString();
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(display);
    }, [display, type]);

    return <span>{formatted}</span>;
});
AnimatedNumber.displayName = 'AnimatedNumber';

const ChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-100 shadow-xl rounded-2xl p-4 text-xs min-w-[160px]">
            <p className="font-semibold text-gray-500 mb-2">{payload[0]?.payload?.label}</p>
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2 mt-1">
                    <div style={{ background: p.stroke || p.color }} className="h-2 w-2 rounded-full shrink-0" />
                    <span className="text-gray-400 text-[10px]">{p.name}:</span>
                    <span className="font-bold text-gray-800 text-[10px]">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p.value)}</span>
                </div>
            ))}
        </div>
    );
};

const PremiumCard = ({ children, className = "", dark = false }: { children: React.ReactNode, className?: string, dark?: boolean }) => {
    return (
        <div className={`rounded-[3rem] border relative overflow-hidden ${
            dark
            ? 'bg-gradient-to-br from-[#001a1a] to-[#002626] border-white/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.4)]'
            : 'bg-white border-gray-100 shadow-md'
        } ${className}`}>
            {dark && <div className="absolute inset-0 bg-gradient-to-tr from-cyan/5 to-transparent pointer-events-none" />}
            <div className="h-full relative z-[2]">{children}</div>
        </div>
    );
};

const AuroraMetricCard = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => {
    return (
        <div className="relative group cursor-pointer h-full" onClick={onClick}>
            <div className="absolute inset-0 -m-[1px] rounded-[3rem] overflow-hidden pointer-events-none z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan/30 via-emerald-400/20 to-purple-500/20 blur-[8px]" />
            </div>
            <div className="relative z-10 h-full">{children}</div>
        </div>
    );
};

export default function DashboardPage() {
  const { token, userName, updateUser, shopSlug } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const [isCustomReportModalOpen, setIsCustomReportModalOpen] = useState(false);
  const [chartMode, setChartMode] = useState<'diario' | 'comparativo'>('diario');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [isChartDateOpen, setIsChartDateOpen] = useState(false);
  const [chartDateRange, setChartDateRange] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return { start: `${y}-${m}-01`, end: `${y}-${m}-${String(lastDay).padStart(2, '0')}` };
  });
  const [companyName, setCompanyName] = useState(userName || 'Empresario Bayup');

  // Sincronizar estado local con global si el global cambia
  useEffect(() => {
    if (userName) setCompanyName(userName);
  }, [userName]);
  const [activities, setActivities] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [realStats, setRealStats] = useState({ 
    revenue: 0, 
    orders_count: 0, 
    conversion: 0, 
    low_stock: 0, 
    avg_ticket: 0,
    cash: 0,
    transfer: 0,
    healthy: 0,
    total_products: 0,
    total_balance: 0,
    peak_day: 'Analizando...',
    peak_hour: 'Analizando...',
    online_now: 0
  });

  // --- CÁLCULO DE VENTAS SEMANALES ---
  const weeklySales = useMemo(() => {
    const dailyTotals = [0, 0, 0, 0, 0, 0, 0]; // Lun, Mar, Mié, Jue, Vie, Sáb, Dom
    if (!orders || orders.length === 0) return dailyTotals;
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    let startOfWeek = new Date(now);
    if (currentDay === 0 && currentHour >= 23) { startOfWeek.setDate(now.getDate() + 1); } 
    else { const diff = (currentDay === 0 ? 7 : currentDay) - 1; startOfWeek.setDate(now.getDate() - diff); }
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    orders.forEach(order => {
        const orderDate = new Date(order.created_at);
        if (orderDate >= startOfWeek && orderDate < endOfWeek) {
            let dayIdx = orderDate.getDay(); 
            dayIdx = dayIdx === 0 ? 6 : dayIdx - 1;
            dailyTotals[dayIdx] += (order.total_price || 0);
        }
    });
    return dailyTotals;
  }, [orders]);

  // --- DATOS MENSUALES PARA GRÁFICO ---
  const monthlySales = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dailyData: { day: string; label: string; cumReal: number; cumMeta: number; dailyVal: number }[] =
        Array.from({ length: daysInMonth }, (_, i) => ({ day: `${i+1}`, label: `${i+1} ${monthNames[month]}`, cumReal: 0, cumMeta: 0, dailyVal: 0 }));
    orders.forEach(o => {
        const d = new Date(o.created_at);
        if (d.getFullYear() === year && d.getMonth() === month) {
            const idx = d.getDate() - 1;
            if (idx < daysInMonth) dailyData[idx].dailyVal += (o.total_price || 0);
        }
    });
    const totalMonthly = dailyData.reduce((a, d) => a + d.dailyVal, 0);
    const goal = Math.max(totalMonthly * 1.35, 500_000);
    const dailyGoal = goal / daysInMonth;
    let cumR = 0, cumM = 0;
    return dailyData.map(d => {
        cumR += d.dailyVal;
        cumM += dailyGoal;
        return { ...d, cumReal: cumR, cumMeta: Math.round(cumM) };
    });
  }, [orders]);

  // --- DATOS SEMANALES PARA MODO COMPARATIVO ---
  const weeklySalesForChart = useMemo(() => {
    const days = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
    let cumR = 0;
    return weeklySales.map((val, i) => {
        cumR += val;
        return { day: days[i], label: days[i], cumReal: cumR, cumMeta: Math.round(cumR * 1.2), dailyVal: val };
    });
  }, [weeklySales]);

  // --- INSIGHTS DINÁMICOS ---
  const insights = useMemo(() => {
    const now = new Date();
    const monthlyTotal = orders.reduce((acc, o) => {
        const d = new Date(o.created_at);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() ? acc + (o.total_price || 0) : acc;
    }, 0);
    const goal = Math.max(monthlyTotal * 1.35, 500_000);
    const goalPct = goal > 0 ? Math.min(Math.round((monthlyTotal / goal) * 100), 100) : 0;
    const fmt = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

    const productMap: Record<string, { name: string; total: number; units: number }> = {};
    orders.forEach(o => {
        (o.items || o.order_items || []).forEach((item: any) => {
            const key = item.product_id || item.product_name || 'Unknown';
            const name = item.product_name || item.name || 'Producto';
            if (!productMap[key]) productMap[key] = { name, total: 0, units: 0 };
            productMap[key].total += (item.total_price || (item.unit_price * (item.quantity || 1)) || 0);
            productMap[key].units += (item.quantity || 1);
        });
    });
    const topProduct = Object.values(productMap).sort((a, b) => b.total - a.total)[0];

    return [
        {
            icon: <TrendingUp size={15} />, iconBg: 'bg-rose-100 text-rose-500',
            bg: 'bg-rose-50 border border-rose-100', tag: 'Meta del mes', tagBg: 'bg-rose-100', tagColor: 'text-rose-600',
            title: '1. Meta del mes',
            text: monthlyTotal > 0 ? `${goalPct}% completado. Ventas acumuladas: ${fmt(monthlyTotal)}.` : 'Sin ventas registradas este mes aún. ¡Activa tu primera venta!',
            link: '/dashboard/invoicing',
        },
        {
            icon: <Zap size={15} />, iconBg: 'bg-amber-100 text-amber-500',
            bg: 'bg-amber-50 border border-amber-100', tag: 'Top ventas', tagBg: 'bg-amber-100', tagColor: 'text-amber-600',
            title: '2. Producto líder del mes',
            text: topProduct ? `"${topProduct.name}" lidera con ${fmt(topProduct.total)} (${topProduct.units} uds).` : 'Registra ventas para ver tu producto estrella del mes.',
            link: '/dashboard/products',
        },
        {
            icon: <AlertCircle size={15} />, iconBg: 'bg-red-100 text-red-500',
            bg: 'bg-red-50 border border-red-100', tag: 'Alerta stock', tagBg: 'bg-red-100', tagColor: 'text-red-600',
            title: '3. Stock crítico',
            text: realStats.low_stock > 0 ? `${realStats.low_stock} producto${realStats.low_stock > 1 ? 's' : ''} con stock crítico (≤5 uds). Reponlos para no perder ventas.` : 'Inventario en niveles óptimos. Todo bajo control.',
            link: '/dashboard/products',
        }
    ];
  }, [orders, realStats]);

  const loadDashboardData = useCallback(async () => {
    if (!token) return;
    try {
        // Ejecutamos las peticiones con captura de errores individual para no romper el flujo
        const [pData, oData, lData, uData] = await Promise.all([
            apiRequest<any[]>('/products', { token }).catch(() => []),
            apiRequest<any[]>('/orders', { token }).catch(() => []),
            apiRequest<any[]>('/admin/logs', { token }).catch(() => []),
            apiRequest<any>('/auth/me', { token }).catch(() => null)
        ]);

        if (uData?.full_name && (uData.full_name !== userName || uData.shop_slug !== shopSlug)) {
            setCompanyName(uData.full_name);
            updateUser({ name: uData.full_name, slug: uData.shop_slug });
        }
        
        const products = Array.isArray(pData) ? pData : [];
        const ordersList = Array.isArray(oData) ? oData : [];
        const logs = Array.isArray(lData) ? lData : [];

        setOrders(ordersList);
        setActivities(logs.slice(0, 5));
        
        // 1. Filtrar ventas de HOY
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const ordersToday = ordersList.filter(o => new Date(o.created_at) >= today);
        
        // 2. Análisis de Día y Hora Pico (HISTÓRICO)
        const daysMap: any = { 0: 'Domingos', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábados' };
        const dayCounts: any = {};
        const hourCounts: any = {};
        
        ordersList.forEach(o => {
            const d = new Date(o.created_at);
            const day = d.getDay();
            const hour = d.getHours();
            dayCounts[day] = (dayCounts[day] || 0) + 1;
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        const topDay = Object.keys(dayCounts).length > 0 ? Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b, '1') : '1';
        const topHour = Object.keys(hourCounts).length > 0 ? Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b, '20') : '20';

        // 3. Cálculo de tráfico REAL
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
        const activeSessions = logs.filter((log: any) => new Date(log.created_at) >= fiveMinsAgo);
        const onlineCount = Math.max(1, new Set(activeSessions.map((s: any) => s.user_id)).size);

        setRealStats({
            revenue: ordersToday.reduce((acc, o) => acc + (o.total_price || 0), 0),
            orders_count: ordersToday.length,
            conversion: 4.8,
            low_stock: products.filter(p => (p.variants?.reduce((a:any,v:any)=>a+(v.stock||0),0)||0) <= 5).length,
            avg_ticket: ordersToday.length > 0 ? ordersToday.reduce((acc, o) => acc + (o.total_price || 0), 0) / ordersToday.length : 0,
            cash: ordersToday.filter(o => o.payment_method === 'cash').reduce((acc, o) => acc + (o.total_price || 0), 0),
            transfer: ordersToday.filter(o => o.payment_method !== 'cash').reduce((acc, o) => acc + (o.total_price || 0), 0),
            healthy: products.length - products.filter(p => (p.variants?.reduce((a:any,v:any)=>a+(v.stock||0),0)||0) <= 5).length,
            total_products: products.length,
            total_balance: ordersList.reduce((acc, o) => acc + (o.total_price || 0), 0),
            peak_day: daysMap[topDay] || 'Lunes',
            peak_hour: `${topHour}:00 PM`,
            online_now: onlineCount
        });
    } catch (e) { 
        // Silenciamos errores técnicos en consola para mantenerla limpia
    }
  }, [token, userName, shopSlug, updateUser]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const kpis = [
    { 
        label: 'Ventas de hoy', value: realStats.revenue, icon: <Activity size={24}/>, color: "text-emerald-500", bg: "bg-emerald-500/10", trend: "En vivo", isCurrency: true,
        details: [
            { l: 'EFECTIVO', v: `$ ${realStats.cash.toLocaleString()}`, icon: <DollarSign size={10}/> },
            { l: 'TRANSF.', v: `$ ${realStats.transfer.toLocaleString()}`, icon: <CreditCard size={10}/> },
            { l: 'ÓRDENES', v: `${realStats.orders_count}`, icon: <ShoppingBag size={10}/> }
        ],
        advice: realStats.revenue > 0 
            ? 'Tus ventas de hoy están activas. Recuerda que procesar los pedidos web rápido mejora tu reputación.' 
            : 'Aún no hay ventas registradas hoy. ¡Es un buen momento para lanzar una promoción por WhatsApp!'
    },
    { 
        label: 'Pedidos pendientes', value: orders.filter(o => o.status === 'pending').length, icon: <ShoppingBag size={24}/>, color: "text-amber-500", bg: "bg-amber-500/10", trend: "Estable",
        details: [
            { l: 'WEB', v: `${orders.filter(o => o.status === 'pending' && o.source !== 'pos').length}`, icon: <Globe size={10}/> },
            { l: 'POS', v: `${orders.filter(o => o.status === 'pending' && o.source === 'pos').length}`, icon: <Store size={10}/> },
            { l: 'TOTAL', v: `${orders.filter(o => o.status === 'pending').length}`, icon: <Layers size={10}/> }
        ],
        advice: 'Tienes pedidos pendientes por facturar. Procesar órdenes en menos de 1 hora aumenta tu probabilidad de recompra.'
    },
    { 
        label: 'Mi Saldo Bayup', value: realStats.total_balance, icon: <Wallet size={24}/>, color: "text-purple-500", bg: "bg-purple-500/10", trend: "Recaudado", isCurrency: true,
        details: [
            { l: 'DISPONIBLE', v: `$ ${realStats.total_balance.toLocaleString()}`, icon: <ShieldCheck size={10}/> },
            { l: 'PENDIENTE', v: '$ 0', icon: <Clock size={10}/> },
            { l: 'ESTIMADO', v: `$ ${(realStats.total_balance * 0.965).toLocaleString()}`, icon: <TrendingUp size={10}/> }
        ],
        advice: 'Tu saldo acumulado refleja el éxito de tu operación. Bayup recomienda reinvertir el 10% en publicidad digital.'
    },
    { 
        label: 'Inventario bajo', value: realStats.low_stock, icon: <Package size={24}/>, color: "text-rose-500", bg: "bg-rose-500/10", trend: "Atención",
        details: [
            { l: 'CRÍTICO', v: `${realStats.low_stock}`, icon: <AlertCircle size={10}/> },
            { l: 'SANO', v: `${realStats.healthy}`, icon: <CheckCircle2 size={10}/> },
            { l: 'TOTAL', v: `${realStats.total_products}`, icon: <Layers size={10}/> }
        ],
        advice: realStats.low_stock > 0 
            ? `Detecto ${realStats.low_stock} productos por agotarse. Repón stock pronto para no perder ventas en tu tienda web.`
            : 'Tu inventario está en niveles óptimos. ¡Sigue así para garantizar entregas inmediatas!'
    }
  ];

  const handleDownloadReport = async () => {
      showToast("Generando reporte...", "info");
      try {
          const [products, expenses] = await Promise.all([
              apiRequest<any[]>('/products', { token }).catch(() => []),
              apiRequest<any[]>('/expenses', { token }).catch(() => [])
          ]);
          const { generateDailyReport } = await import('@/lib/report-generator');
          await generateDailyReport({ userName: companyName, products: products || [], orders, expenses: expenses || [] });
      } catch (e) { showToast("Error al generar reporte", "error"); }
  };

  const handleGenerateCustomReport = async () => {
      if (!customRange.start || !customRange.end) return showToast("Selecciona fechas", "info");
      showToast("Generando periodo...", "info");
      try {
          const [allProducts, allOrders, allExpenses] = await Promise.all([
              apiRequest<any[]>('/products', { token }).catch(() => []),
              apiRequest<any[]>('/orders', { token }).catch(() => []),
              apiRequest<any[]>('/expenses', { token }).catch(() => [])
          ]);
          const start = new Date(customRange.start);
          const end = new Date(customRange.end);
          end.setHours(23, 59, 59, 999);

          const filteredOrders = (allOrders || []).filter(o => {
              const d = new Date(o.created_at);
              return d >= start && d <= end;
          });

          const filteredExpenses = (allExpenses || []).filter(e => {
              const d = new Date(e.date);
              return d >= start && d <= end;
          });

          const { generateDailyReport } = await import('@/lib/report-generator');
          await generateDailyReport({ 
              userName: companyName, 
              products: allProducts || [], 
              orders: filteredOrders, 
              expenses: filteredExpenses, 
              range: customRange 
          });
          setIsCustomReportModalOpen(false);
      } catch (e) { showToast("Error al generar reporte", "error"); }
  };

  // --- DATOS FILTRADOS POR RANGO PARA EL GRÁFICO ---
  const chartFilteredData = useMemo(() => {
    if (!chartDateRange.start || !chartDateRange.end) return monthlySales;
    const start = new Date(chartDateRange.start);
    const end = new Date(chartDateRange.end);
    end.setHours(23, 59, 59, 999);
    const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const days: Date[] = [];
    const cur = new Date(start);
    while (cur <= end) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
    const dailyData = days.map(d => ({ day: `${d.getDate()}`, label: `${d.getDate()} ${monthNames[d.getMonth()]}`, dailyVal: 0, cumReal: 0, cumMeta: 0 }));
    orders.forEach(o => {
      const d = new Date(o.created_at);
      if (d >= start && d <= end) {
        const idx = days.findIndex(day => day.toDateString() === d.toDateString());
        if (idx >= 0) dailyData[idx].dailyVal += (o.total_price || 0);
      }
    });
    const total = dailyData.reduce((a, d) => a + d.dailyVal, 0);
    const goal = Math.max(total * 1.35, 500_000);
    const dailyGoal = goal / Math.max(days.length, 1);
    let cumR = 0, cumM = 0;
    return dailyData.map(d => { cumR += d.dailyVal; cumM += dailyGoal; return { ...d, cumReal: cumR, cumMeta: Math.round(cumM) }; });
  }, [orders, chartDateRange, monthlySales]);

  const chartData = chartMode === 'comparativo' ? weeklySalesForChart : chartFilteredData;

  const fmtChartDate = (s: string) => {
    if (!s) return '';
    const d = new Date(s + 'T12:00:00');
    return `${d.getDate()} ${d.toLocaleDateString('es-CO', { month: 'short' }).toUpperCase()}. ${d.getFullYear()}`;
  };
  const recentOrders = useMemo(() => [...orders].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6), [orders]);

  const statusBadge = (s: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      pending:    { label: 'Pendiente',  cls: 'bg-amber-50  text-amber-600  border-amber-100'  },
      paid:       { label: 'Pagado',     cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      shipped:    { label: 'Enviado',    cls: 'bg-blue-50   text-blue-600   border-blue-100'   },
      delivered:  { label: 'Entregado',  cls: 'bg-green-50  text-green-700  border-green-100'  },
      cancelled:  { label: 'Cancelado',  cls: 'bg-rose-50   text-rose-600   border-rose-100'   },
    };
    const st = map[s] ?? { label: s, cls: 'bg-gray-50 text-gray-500 border-gray-100' };
    return <span className={`text-[8px] font-semibold tracking-widest uppercase px-2.5 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>;
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 px-4">

        {/* ── HEADER ── */}
        <div className="flex flex-col xl:flex-row items-start justify-between gap-4">
            <div>
                <p className={`flex items-center gap-2 text-[10px] font-bold tracking-[0.22em] uppercase mb-1 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#004d4d] inline-block"/>
                    <Calendar size={10} />
                    {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
                </p>
                <h1 className="text-4xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00b2bd] to-[#004d4d]">
                    BIENVENIDO, {companyName.toUpperCase()}
                </h1>
            </div>
            <div className="relative shrink-0">
                <button
                    onClick={() => setIsCustomReportModalOpen(!isCustomReportModalOpen)}
                    className="h-10 px-5 rounded-full flex items-center gap-2 bg-[#004d4d] hover:bg-[#003838] text-white transition-colors duration-150 shadow-sm"
                >
                    <Download size={13} className="text-[#00f2ff] shrink-0"/>
                    <span className="font-semibold tracking-widest text-[9px] uppercase whitespace-nowrap">Reportes</span>
                </button>

                <AnimatePresence>
                    {isCustomReportModalOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsCustomReportModalOpen(false)} />
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                transition={{ duration: 0.16 }}
                                className={`absolute right-0 top-12 z-50 w-72 rounded-3xl shadow-2xl border p-5 ${theme === 'dark' ? 'bg-[#0a1f1f] border-white/10' : 'bg-white border-gray-100'}`}
                            >
                                <p className={`text-[9px] font-semibold tracking-[0.2em] uppercase mb-4 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Selecciona el rango</p>
                                <div className="space-y-3">
                                    <div>
                                        <label className={`text-[8px] font-semibold uppercase tracking-widest ml-1 mb-1 block ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Desde</label>
                                        <input type="date" value={customRange.start} onChange={e => setCustomRange({...customRange, start: e.target.value})} className={`w-full p-3 rounded-2xl outline-none font-medium text-sm ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'}`} />
                                    </div>
                                    <div>
                                        <label className={`text-[8px] font-semibold uppercase tracking-widest ml-1 mb-1 block ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Hasta</label>
                                        <input type="date" value={customRange.end} onChange={e => setCustomRange({...customRange, end: e.target.value})} className={`w-full p-3 rounded-2xl outline-none font-medium text-sm ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'}`} />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button onClick={() => { handleDownloadReport(); setIsCustomReportModalOpen(false); }} className={`flex-1 h-9 rounded-full text-[8px] font-semibold uppercase tracking-widest border transition-colors ${theme === 'dark' ? 'border-white/10 text-white/50 hover:bg-white/5' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                        Hoy
                                    </button>
                                    <button onClick={() => { handleGenerateCustomReport(); setIsCustomReportModalOpen(false); }} disabled={!customRange.start || !customRange.end} className="flex-1 h-9 rounded-full bg-[#004d4d] hover:bg-[#003838] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[8px] font-semibold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors">
                                        <Download size={11}/> Descargar
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>

        {/* ── FILA DE 4 MÉTRICAS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {/* CARD 1: Tráfico */}
            <div>
                <div className={`group relative h-full rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${
                    theme === 'dark'
                    ? 'bg-[#0a1f1f] border border-white/[0.06] shadow-[0_2px_24px_-4px_rgba(0,0,0,0.5)]'
                    : 'bg-white border border-gray-100/80 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)]'
                }`}>
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${theme === 'dark' ? 'bg-gradient-to-br from-emerald-400/5 to-transparent' : 'bg-gradient-to-br from-gray-50/80 to-transparent'}`} />
                    <div className={`absolute top-0 left-6 right-6 h-px ${theme === 'dark' ? 'bg-gradient-to-r from-transparent via-white/10 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-200 to-transparent'}`} />

                    <div className="relative z-10 p-5">
                        <div className="flex items-center justify-between mb-5">
                            <div className="h-9 w-9 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-500">
                                <Activity size={16} />
                            </div>
                            <span className={`text-[7px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                                theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                En vivo
                            </span>
                        </div>
                        <p className={`text-[8px] font-semibold tracking-[0.22em] uppercase mb-2 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Tráfico en tiempo real</p>
                        <h3 className={`text-2xl font-bold tracking-tight leading-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            <AnimatedNumber value={realStats.online_now} type="simple" />
                            <span className={`text-sm font-medium ml-1.5 ${theme === 'dark' ? 'text-emerald-400/70' : 'text-emerald-600/70'}`}>en línea</span>
                        </h3>
                        <div className={`mt-4 h-[3px] w-full rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                            <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-emerald-400/70 to-emerald-400/10" />
                        </div>
                    </div>
                </div>
            </div>

            {/* CARDS 2-4: Ventas, Pedidos, Inventario */}
            {kpis.filter((_,i) => i !== 2).map((kpi, i) => (
                <div key={i} className="cursor-pointer" onClick={() => setSelectedMetric(kpi)}>
                    <MetricKPI {...kpi} dark={theme === 'dark'} />
                </div>
            ))}
        </div>

        {/* ── CHART + INSIGHTS ── */}
        <div className="grid grid-cols-12 gap-6">

            {/* COMPARATIVA DE VENTAS */}
            <div className="col-span-12 lg:col-span-8">
                <PremiumCard dark={theme === 'dark'} className="p-7 h-full">
                    <div className="flex flex-col h-full gap-5">
                        {/* Header */}
                        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h4 className={`font-bold text-sm uppercase tracking-[0.12em] ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Comparativa de Ventas</h4>
                                <p className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Análisis del rendimiento comercial actual vs. periodos anteriores</p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Toggle modo */}
                                <div className={`flex p-1 rounded-full gap-1 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                                    <button onClick={() => setChartMode('diario')} className={`px-3 py-1 rounded-full text-[9px] font-semibold uppercase transition-colors duration-150 ${chartMode === 'diario' ? 'bg-[#004d4d] text-white shadow-sm' : (theme === 'dark' ? 'text-white/40' : 'text-gray-400')}`}>Modo Diario</button>
                                    <button onClick={() => setChartMode('comparativo')} className={`px-3 py-1 rounded-full text-[9px] font-semibold uppercase transition-colors duration-150 ${chartMode === 'comparativo' ? 'bg-[#004d4d] text-white shadow-sm' : (theme === 'dark' ? 'text-white/40' : 'text-gray-400')}`}>Modo Comparativo</button>
                                </div>

                                {/* Date range picker */}
                                {chartMode === 'diario' && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsChartDateOpen(v => !v)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-medium border transition-colors duration-150 ${
                                                isChartDateOpen
                                                ? (theme === 'dark' ? 'bg-[#004d4d]/40 border-[#004d4d]/60 text-white' : 'bg-[#004d4d]/10 border-[#004d4d]/30 text-[#004d4d]')
                                                : (theme === 'dark' ? 'border-white/10 text-white/40 bg-white/5 hover:bg-white/10' : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50')
                                            }`}
                                        >
                                            <Calendar size={10} />
                                            <span>{fmtChartDate(chartDateRange.start)} – {fmtChartDate(chartDateRange.end)}</span>
                                            <ChevronDown size={9} className={`transition-transform duration-150 ${isChartDateOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        <AnimatePresence>
                                            {isChartDateOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setIsChartDateOpen(false)} />
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                                        transition={{ duration: 0.15 }}
                                                        className={`absolute right-0 top-10 z-50 w-64 rounded-3xl shadow-2xl border p-4 ${theme === 'dark' ? 'bg-[#0a1f1f] border-white/10' : 'bg-white border-gray-100'}`}
                                                    >
                                                        <p className={`text-[8px] font-semibold tracking-[0.2em] uppercase mb-3 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Rango del gráfico</p>
                                                        <div className="space-y-2">
                                                            <div>
                                                                <label className={`text-[8px] font-semibold uppercase tracking-widest ml-1 mb-1 block ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Desde</label>
                                                                <input
                                                                    type="date"
                                                                    value={chartDateRange.start}
                                                                    onChange={e => setChartDateRange(r => ({ ...r, start: e.target.value }))}
                                                                    className={`w-full p-2.5 rounded-2xl outline-none text-xs font-medium ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'}`}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className={`text-[8px] font-semibold uppercase tracking-widest ml-1 mb-1 block ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Hasta</label>
                                                                <input
                                                                    type="date"
                                                                    value={chartDateRange.end}
                                                                    onChange={e => setChartDateRange(r => ({ ...r, end: e.target.value }))}
                                                                    className={`w-full p-2.5 rounded-2xl outline-none text-xs font-medium ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-50 text-gray-900'}`}
                                                                />
                                                            </div>
                                                        </div>
                                                        {/* Accesos rápidos */}
                                                        <div className="flex gap-1.5 mt-3 flex-wrap">
                                                            {[
                                                                { label: 'Hoy', fn: () => { const t = new Date(); const s = t.toISOString().slice(0,10); setChartDateRange({ start: s, end: s }); } },
                                                                { label: 'Esta semana', fn: () => { const t = new Date(); const dow = t.getDay() || 7; const mon = new Date(t); mon.setDate(t.getDate() - dow + 1); const sun = new Date(mon); sun.setDate(mon.getDate() + 6); setChartDateRange({ start: mon.toISOString().slice(0,10), end: sun.toISOString().slice(0,10) }); } },
                                                                { label: 'Este mes', fn: () => { const t = new Date(); const y = t.getFullYear(); const m = String(t.getMonth()+1).padStart(2,'0'); const last = new Date(t.getFullYear(), t.getMonth()+1, 0).getDate(); setChartDateRange({ start: `${y}-${m}-01`, end: `${y}-${m}-${String(last).padStart(2,'0')}` }); } },
                                                            ].map(q => (
                                                                <button key={q.label} onClick={() => { q.fn(); setIsChartDateOpen(false); }} className={`text-[8px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${theme === 'dark' ? 'border-white/10 text-white/40 hover:bg-white/5 hover:text-white/70' : 'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}>
                                                                    {q.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <button onClick={() => setIsChartDateOpen(false)} className="mt-3 w-full h-8 rounded-full bg-[#004d4d] hover:bg-[#003838] text-white text-[8px] font-semibold uppercase tracking-widest transition-colors">
                                                            Aplicar
                                                        </button>
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Chart — flex-1 para llenar el espacio disponible */}
                        <div className="flex-1 min-h-[160px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#004d4d" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#004d4d" stopOpacity={0.01}/>
                                        </linearGradient>
                                        <linearGradient id="gradMeta" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.08}/>
                                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'} vertical={false} />
                                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: theme === 'dark' ? 'rgba(255,255,255,0.3)' : '#9ca3af' }} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(chartData.length / 6) - 1)} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Area type="monotone" dataKey="cumReal" name="Venta Real" stroke="#004d4d" strokeWidth={2.5} fill="url(#gradReal)" dot={false} activeDot={{ r: 4, fill: '#004d4d', stroke: 'white', strokeWidth: 2 }} />
                                    {chartMode === 'comparativo' && <Area type="monotone" dataKey="cumMeta" name="Meta del Mes" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 3" fill="url(#gradMeta)" dot={false} activeDot={{ r: 3, fill: '#94a3b8', stroke: 'white', strokeWidth: 2 }} />}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend */}
                        <div className={`shrink-0 flex items-center gap-6 pt-4 border-t ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                            <div className="flex items-center gap-2"><div className="h-[3px] w-5 rounded-full bg-[#004d4d]" /><span className="text-[10px] text-gray-400">Venta Real</span></div>
                            {chartMode === 'comparativo' && <div className="flex items-center gap-2"><div className="h-[2px] w-5 bg-gray-300 rounded-full" /><span className="text-[10px] text-gray-400">Meta del Mes</span></div>}
                            <button onClick={loadDashboardData} className={`ml-auto text-[9px] font-semibold tracking-widest uppercase transition-colors duration-150 flex items-center gap-1.5 ${theme === 'dark' ? 'text-white/20 hover:text-white/50' : 'text-gray-300 hover:text-[#004d4d]'}`}>
                                <RefreshCw size={10} /> Actualizar
                            </button>
                        </div>
                    </div>
                </PremiumCard>
            </div>

            {/* INSIGHTS BAYUP */}
            <div className="col-span-12 lg:col-span-4">
                <div className={`rounded-[2.5rem] h-full p-6 flex flex-col gap-4 ${theme === 'dark' ? 'bg-gradient-to-br from-[#001a1a] to-[#002626] border border-white/5' : 'bg-gradient-to-br from-[#003838] to-[#001a1a]'}`}>
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm uppercase tracking-[0.12em] text-white">Insights Bayup</h4>
                        <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[8px] text-emerald-400 font-semibold tracking-widest uppercase">En tiempo real</span>
                        </div>
                    </div>

                    {insights.map((ins, i) => (
                        <div key={i} onClick={() => router.push(ins.link)} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 transition-colors duration-150 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${ins.iconBg}`}>{ins.icon}</div>
                                <h5 className="font-semibold text-[13px] text-white leading-tight">{ins.title}</h5>
                            </div>
                            <span className={`self-start text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${ins.tagBg} ${ins.tagColor}`}>{ins.tag}</span>
                            <p className="text-[11px] text-white/50 leading-relaxed">{ins.text}</p>
                        </div>
                    ))}

                    <button onClick={() => router.push('/dashboard/web-analytics')} className="mt-auto w-full py-2.5 rounded-xl border border-white/10 text-[9px] font-semibold tracking-widest uppercase text-white/50 hover:text-white hover:border-white/20 transition-colors duration-150 flex items-center justify-center gap-2">
                        <BarChart3 size={12} /> Ver Análisis Detallado
                    </button>
                </div>
            </div>
        </div>

        {/* ── ACTIVIDAD RECIENTE ── */}
        <PremiumCard dark={theme === 'dark'} className="overflow-hidden">
            <div className={`px-7 py-5 flex items-center justify-between border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                <h4 className={`font-bold text-sm uppercase tracking-[0.12em] ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Actividad Reciente</h4>
                <button onClick={() => router.push('/dashboard/orders')} className={`text-[9px] font-semibold tracking-widest uppercase flex items-center gap-1.5 transition-colors duration-150 ${theme === 'dark' ? 'text-white/30 hover:text-white/60' : 'text-gray-400 hover:text-[#004d4d]'}`}>
                    Ver todo <ChevronRight size={12} />
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className={`border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-50'}`}>
                            {['ID Pedido','Cliente','Fecha','Total','Estado','Acción'].map(h => (
                                <th key={h} className={`px-6 py-3 text-left text-[9px] font-semibold tracking-widest uppercase ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {recentOrders.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-16 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <ShoppingBag size={28} className="text-gray-200" />
                                    <p className={`text-[11px] font-medium ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>No se han registrado pedidos todavía.</p>
                                </div>
                            </td></tr>
                        ) : recentOrders.map((o, i) => (
                            <tr key={i} className={`border-b transition-colors duration-100 ${theme === 'dark' ? 'border-white/5 hover:bg-white/5' : 'border-gray-50 hover:bg-gray-50/70'}`}>
                                <td className={`px-6 py-4 text-[11px] font-mono font-semibold ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>#{String(o.id || i+1).slice(-6).toUpperCase()}</td>
                                <td className={`px-6 py-4 text-[12px] font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{o.customer_name || o.customer || '—'}</td>
                                <td className={`px-6 py-4 text-[11px] ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>{new Date(o.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                <td className={`px-6 py-4 text-[12px] font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(o.total_price || 0)}</td>
                                <td className="px-6 py-4">{statusBadge(o.status || 'pending')}</td>
                                <td className="px-6 py-4">
                                    <button onClick={() => router.push('/dashboard/orders')} className={`text-[9px] font-semibold tracking-widest uppercase transition-colors duration-150 ${theme === 'dark' ? 'text-white/30 hover:text-[#00f2ff]' : 'text-gray-400 hover:text-[#004d4d]'}`}>Ver →</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </PremiumCard>

        <MetricDetailModal isOpen={!!selectedMetric} onClose={() => setSelectedMetric(null)} metric={selectedMetric} />

    </div>
  );
}

// --- SUB-COMPONENTES AUXILIARES ---

interface MetricKPIProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    bg: string;
    trend: string;
    isCurrency?: boolean;
    isPercentage?: boolean;
    dark?: boolean;
    details?: any[];
    advice?: string;
}

function MetricKPI({ label, value, icon, color, bg, trend, isCurrency = false, isPercentage = false, dark = false }: MetricKPIProps) {
    // Extraer color base para el acento (ej: "text-amber-500" → "amber-500")
    const accentColor = color.replace('text-', '');
    return (
        <div className={`group relative h-full rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-0.5 ${
            dark
            ? 'bg-[#0a1f1f] border border-white/[0.06] shadow-[0_2px_24px_-4px_rgba(0,0,0,0.5)]'
            : 'bg-white border border-gray-100/80 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)]'
        }`}>
            {/* Glow sutil al hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${dark ? 'bg-gradient-to-br from-[#00f2ff]/5 to-transparent' : 'bg-gradient-to-br from-gray-50/80 to-transparent'}`} />

            {/* Línea de acento top */}
            <div className={`absolute top-0 left-6 right-6 h-px ${dark ? 'bg-gradient-to-r from-transparent via-white/10 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-200 to-transparent'}`} />

            <div className="relative z-10 p-5">
                {/* Badge trend — top right */}
                <div className="flex items-center justify-between mb-5">
                    <div className={`h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 [&_svg]:w-[16px] [&_svg]:h-[16px] ${dark ? `bg-white/[0.07]` : bg} ${color}`}>
                        {icon}
                    </div>
                    <span className={`text-[7px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full ${
                        dark ? 'bg-white/5 text-white/25 border border-white/5' : 'bg-gray-50 text-gray-400 border border-gray-100'
                    }`}>{trend}</span>
                </div>

                {/* Label */}
                <p className={`text-[8px] font-semibold tracking-[0.22em] uppercase mb-2 ${dark ? 'text-white/30' : 'text-gray-400'}`}>{label}</p>

                {/* Valor */}
                <h3 className={`text-2xl font-bold tracking-tight leading-none ${dark ? 'text-white' : 'text-gray-900'}`}>
                    <AnimatedNumber value={value} type={isCurrency ? 'currency' : isPercentage ? 'percentage' : 'simple'} />
                </h3>

                {/* Barra de progreso decorativa */}
                <div className={`mt-4 h-[3px] w-full rounded-full overflow-hidden ${dark ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${dark ? 'bg-gradient-to-r from-[#00f2ff]/60 to-[#00f2ff]/10' : `bg-gradient-to-r ${bg.replace('bg-', 'from-').replace('/10', '/70')} to-transparent`}`}
                        style={{ width: value > 0 ? '60%' : '0%' }}
                    />
                </div>
            </div>
        </div>
    );
}
