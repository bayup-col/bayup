"use client";

import React, { useState, useEffect, memo, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  CheckCircle2, Truck, RefreshCw, Lightbulb, Wallet, CreditCard, Calendar, TrendingDown
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
  const { token, userName, updateUser, shopSlug, isGlobalStaff } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

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
  const [products, setProducts] = useState<any[]>([]);
  const [openInsight, setOpenInsight] = useState<null | 'meta' | 'producto' | 'stock' | 'analisis'>(null);
  const [stockFilter, setStockFilter] = useState<'all' | 'urgent' | 'low'>('all');
  const [monthlyGoal, setMonthlyGoal] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return Number(localStorage.getItem('bayup_monthly_goal') || 0);
  });
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [expenses, setExpenses] = useState<any[]>([]);
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

  // --- DATOS DE INSIGHTS (compartidos con modales) ---
  const insightData = useMemo(() => {
    const now = new Date();
    const isThisMonth = (o: any) => { const d = new Date(o.created_at); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); };
    const monthOrders = orders.filter(isThisMonth);
    const channelTotals = {
      web:       monthOrders.filter(o => o.source === 'web').reduce((a, o) => a + (o.total_price || 0), 0),
      pos:       monthOrders.filter(o => !o.source || o.source === 'pos').reduce((a, o) => a + (o.total_price || 0), 0),
      redes:     monthOrders.filter(o => o.source === 'redes').reduce((a, o) => a + (o.total_price || 0), 0),
      whatsapp:  monthOrders.filter(o => o.source === 'whatsapp').reduce((a, o) => a + (o.total_price || 0), 0),
    };
    const monthlyTotal = Object.values(channelTotals).reduce((a, v) => a + v, 0);
    const goal = monthlyGoal > 0 ? monthlyGoal : Math.max(monthlyTotal * 1.35, 500_000);
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
    const topProducts = Object.values(productMap).sort((a, b) => b.total - a.total);
    const topProduct = topProducts[0];

    const monthOrdersSorted = [...monthOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = lastDay - now.getDate();
    const dailyNeeded = daysLeft > 0 ? Math.max(0, (goal - monthlyTotal) / daysLeft) : 0;

    const statusCount: Record<string, number> = {};
    orders.forEach(o => { const s = o.status || 'pending'; statusCount[s] = (statusCount[s] || 0) + 1; });

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dayCounts: Record<number, number> = {};
    orders.forEach(o => { const d = new Date(o.created_at).getDay(); dayCounts[d] = (dayCounts[d] || 0) + 1; });
    const peakDayIdx = Object.keys(dayCounts).length > 0
        ? parseInt(Object.keys(dayCounts).reduce((a, b) => dayCounts[+a] > dayCounts[+b] ? a : b))
        : 1;

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((a, o) => a + (o.total_price || 0), 0);
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'paid').length;
    const successRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

    const leaderSharePct = topProducts.length > 0 && totalRevenue > 0 ? Math.round((topProducts[0].total / totalRevenue) * 100) : 0;
    const maxDayCount = Math.max(...Object.values(dayCounts), 1);
    const dayStats = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map((day, i) => ({
      day, count: dayCounts[i] || 0,
      pct: Math.round(((dayCounts[i] || 0) / maxDayCount) * 100),
    }));
    const activeDays = now.getDate();
    const projectedPct = activeDays > 0 && monthlyTotal > 0 ? Math.round((monthlyTotal / activeDays) * lastDay / goal * 100) : 0;
    return { monthlyTotal, goal, goalPct, fmt, topProducts, topProduct, monthOrders: monthOrdersSorted, daysLeft, dailyNeeded, statusCount, peakDay: dayNames[peakDayIdx], totalOrders, totalRevenue, avgTicket, completedOrders, successRate, leaderSharePct, dayStats, activeDays, projectedPct, channelTotals };
  }, [orders, monthlyGoal]);

  // --- GASTOS DEL MES (desde API) ---
  const monthlyExpensesTotal = useMemo(() => {
    const now = new Date();
    return expenses
      .filter(e => { const d = new Date(e.due_date || e.created_at || 0); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); })
      .reduce((a, e) => a + (e.amount || 0), 0);
  }, [expenses]);

  // --- INSIGHTS DINÁMICOS ---
  const insights = useMemo(() => {
    const { monthlyTotal, goalPct, topProduct, fmt } = insightData;
    return [
        {
            icon: <TrendingUp size={15} />, iconBg: 'bg-rose-100 text-rose-500',
            tag: 'Meta del mes', tagBg: 'bg-rose-100', tagColor: 'text-rose-600',
            title: '1. Meta del mes',
            text: monthlyTotal > 0 ? `${goalPct}% completado. Ventas acumuladas: ${fmt(monthlyTotal)}.` : 'Sin ventas registradas este mes aún. ¡Activa tu primera venta!',
            modal: 'meta' as const,
        },
        {
            icon: <Zap size={15} />, iconBg: 'bg-amber-100 text-amber-500',
            tag: 'Top ventas', tagBg: 'bg-amber-100', tagColor: 'text-amber-600',
            title: '2. Producto líder del mes',
            text: topProduct ? `"${topProduct.name}" lidera con ${fmt(topProduct.total)} (${topProduct.units} uds).` : 'Registra ventas para ver tu producto estrella del mes.',
            modal: 'producto' as const,
        },
        {
            icon: <AlertCircle size={15} />, iconBg: 'bg-red-100 text-red-500',
            tag: 'Alerta stock', tagBg: 'bg-red-100', tagColor: 'text-red-600',
            title: '3. Stock crítico',
            text: realStats.low_stock > 0 ? `${realStats.low_stock} producto${realStats.low_stock > 1 ? 's' : ''} con stock crítico (≤5 uds). Reponlos para no perder ventas.` : 'Inventario en niveles óptimos. Todo bajo control.',
            modal: 'stock' as const,
        }
    ];
  }, [insightData, realStats]);

  // --- PRODUCTOS CON STOCK CRÍTICO ---
  const lowStockProducts = useMemo(() =>
    products
        .map(p => ({ ...p, stockLevel: p.stock ?? (p.variants?.reduce((a: number, v: any) => a + (v.stock || 0), 0) ?? 0) }))
        .filter(p => p.stockLevel <= 5)
        .sort((a, b) => a.stockLevel - b.stockLevel),
  [products]);

  const loadDashboardData = useCallback(async () => {
    if (!token) return;
    try {
        // Ejecutamos las peticiones con captura de errores individual para no romper el flujo
        const [pData, oData, lData, uData, eData] = await Promise.all([
            apiRequest<any[]>('/products', { token }).catch(() => []),
            apiRequest<any[]>('/orders', { token }).catch(() => []),
            isGlobalStaff ? apiRequest<any[]>('/admin/logs', { token }).catch(() => []) : Promise.resolve([]),
            apiRequest<any>('/auth/me', { token }).catch(() => null),
            apiRequest<any[]>('/expenses', { token }).catch(() => []),
        ]);
        setExpenses(Array.isArray(eData) ? eData : []);

        if (uData?.full_name && (uData.full_name !== userName || uData.shop_slug !== shopSlug)) {
            setCompanyName(uData.full_name);
            updateUser({ name: uData.full_name, slug: uData.shop_slug });
        }
        
        const products = Array.isArray(pData) ? pData : [];
        setProducts(products);
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

  const exportAnalysisPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210; const H = 297;
    const fmtCOP = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
    const now = new Date();
    const monthLabel = now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

    // ── Fondo oscuro header ──
    doc.setFillColor(10, 26, 26);
    doc.rect(0, 0, W, 52, 'F');

    // Acento teal izquierdo
    doc.setFillColor(0, 178, 189);
    doc.rect(0, 0, 4, 52, 'F');

    // Logo / título
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('BAYUP', 14, 18);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 178, 189);
    doc.text('Análisis Detallado · Resumen Ejecutivo', 14, 26);
    doc.setTextColor(180, 200, 200);
    doc.setFontSize(8);
    doc.text(monthLabel.toUpperCase(), 14, 33);
    doc.text(`Generado el ${now.toLocaleDateString('es-CO')} a las ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, 14, 39);

    // Empresa
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(userName || 'Mi Tienda', W - 14, 22, { align: 'right' });

    // ── KPIs principales — 4 cajas ──
    const kpis = [
      { label: 'Ingresos Totales', value: fmtCOP(insightData.totalRevenue), sub: 'Todos los tiempos', accent: true },
      { label: 'Ticket Promedio', value: fmtCOP(insightData.avgTicket), sub: 'Por pedido', accent: false },
      { label: 'Total Pedidos', value: String(insightData.totalOrders), sub: 'Histórico', accent: false },
      { label: 'Tasa de Éxito', value: `${insightData.successRate}%`, sub: `${insightData.completedOrders} completados`, accent: false },
    ];
    const kpiW = (W - 28 - 9) / 4;
    kpis.forEach((k, i) => {
      const x = 14 + i * (kpiW + 3);
      const y = 58;
      doc.setFillColor(k.accent ? 0 : 248, k.accent ? 178 : 250, k.accent ? 189 : 250);
      if (k.accent) doc.setFillColor(232, 250, 249);
      doc.roundedRect(x, y, kpiW, 24, 2, 2, 'F');
      doc.setDrawColor(k.accent ? 0 : 220, k.accent ? 178 : 230, k.accent ? 189 : 230);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, kpiW, 24, 2, 2, 'S');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 120, 120);
      doc.text(k.label.toUpperCase(), x + 3, y + 6);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(k.accent ? 0 : 10, k.accent ? 140 : 26, k.accent ? 149 : 26);
      doc.text(k.value, x + 3, y + 14);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(140, 160, 160);
      doc.text(k.sub, x + 3, y + 20);
    });

    // ── Sección: Actividad por día ──
    let y = 92;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(10, 26, 26);
    doc.text('ACTIVIDAD POR DÍA', 14, y);
    doc.setFillColor(0, 178, 189);
    doc.rect(14, y + 1.5, 28, 0.5, 'F');
    y += 6;

    const barAreaW = W - 28;
    const barAreaH = 30;
    doc.setFillColor(248, 250, 250);
    doc.setDrawColor(220, 230, 230);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, y, barAreaW, barAreaH + 8, 2, 2, 'FD');

    const maxPct = Math.max(...insightData.dayStats.map(d => d.pct), 1);
    const barW = (barAreaW - 20) / insightData.dayStats.length;
    insightData.dayStats.forEach((d, i) => {
      const bx = 14 + 10 + i * barW;
      const bh = Math.max((d.pct / maxPct) * barAreaH, 1);
      const by = y + barAreaH - bh + 2;
      const isPeak = d.day === insightData.peakDay;
      doc.setFillColor(isPeak ? 0 : 200, isPeak ? 178 : 215, isPeak ? 189 : 215);
      doc.roundedRect(bx + 1, by, barW - 4, bh, 1, 1, 'F');
      doc.setFontSize(6.5);
      doc.setFont('helvetica', isPeak ? 'bold' : 'normal');
      doc.setTextColor(isPeak ? 0 : 140, isPeak ? 140 : 160, isPeak ? 149 : 160);
      doc.text(d.day.slice(0, 2), bx + barW / 2 - 2, y + barAreaH + 6);
    });
    y += barAreaH + 14;

    // ── 2 columnas: estado pedidos + top productos ──
    const colW = (W - 28 - 6) / 2;

    // Estado pedidos
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(10, 26, 26);
    doc.text('ESTADO DE PEDIDOS', 14, y);
    doc.setFillColor(0, 178, 189);
    doc.rect(14, y + 1.5, 30, 0.5, 'F');
    y += 6;

    const statusColors: Record<string, [number,number,number]> = {
      pending: [251, 191, 36], paid: [16, 185, 129], shipped: [59, 130, 246],
      delivered: [34, 197, 94], cancelled: [239, 68, 68],
    };
    const statusLabels: Record<string, string> = {
      pending: 'Pendiente', paid: 'Pagado', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
    };
    const totalSt = Object.values(insightData.statusCount).reduce((a, v) => a + v, 0);
    const entries = Object.entries(insightData.statusCount);

    if (entries.length === 0) {
      doc.setFontSize(8); doc.setTextColor(160, 170, 170);
      doc.text('Sin pedidos registrados', 14, y + 5);
      y += 12;
    } else {
      entries.forEach(([status, count], i) => {
        const [r, g, b] = statusColors[status] || [150, 150, 150];
        const pct = totalSt > 0 ? Math.round((count / totalSt) * 100) : 0;
        const rowY = y + i * 10;
        // dot
        doc.setFillColor(r, g, b);
        doc.circle(16, rowY + 2, 1.5, 'F');
        // label
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 70, 70);
        doc.text(statusLabels[status] || status, 20, rowY + 3.5);
        // bar bg
        doc.setFillColor(230, 235, 235);
        doc.roundedRect(55, rowY, colW - 46, 5, 1, 1, 'F');
        // bar fill
        doc.setFillColor(r, g, b);
        doc.roundedRect(55, rowY, Math.max(((pct / 100) * (colW - 46)), 1), 5, 1, 1, 'F');
        // count + pct
        doc.setFont('helvetica', 'bold'); doc.setTextColor(10, 26, 26);
        doc.text(`${count}  ${pct}%`, 55 + colW - 42, rowY + 3.8);
      });
      y += entries.length * 10 + 4;
    }

    // Top productos (columna derecha, misma Y de inicio)
    const rightX = 14 + colW + 6;
    let ryStart = y - (entries.length > 0 ? entries.length * 10 + 4 : 12);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(10, 26, 26);
    doc.text('TOP PRODUCTOS', rightX, ryStart - 6);
    doc.setFillColor(245, 158, 11);
    doc.rect(rightX, ryStart - 4.5, 24, 0.5, 'F');

    const medals = ['🥇', '🥈', '🥉'];
    insightData.topProducts.slice(0, 5).forEach((p, i) => {
      const ry = ryStart + i * 11;
      const isTop = i === 0;
      doc.setFillColor(isTop ? 255 : 248, isTop ? 251 : 250, isTop ? 235 : 250);
      doc.setDrawColor(isTop ? 253 : 220, isTop ? 230 : 230, isTop ? 138 : 230);
      doc.setLineWidth(0.3);
      doc.roundedRect(rightX, ry, colW, 9, 1, 1, 'FD');
      // rank
      doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      doc.setTextColor(isTop ? 180 : 100, isTop ? 120 : 120, isTop ? 0 : 120);
      doc.text(String(i + 1), rightX + 3, ry + 6);
      // name
      doc.setFont('helvetica', 'normal'); doc.setTextColor(10, 26, 26);
      const truncName = p.name.length > 22 ? p.name.slice(0, 22) + '…' : p.name;
      doc.text(truncName, rightX + 9, ry + 6);
      // value
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isTop ? 146 : 10, isTop ? 100 : 26, isTop ? 0 : 26);
      doc.text(fmtCOP(p.total), rightX + colW - 3, ry + 6, { align: 'right' });
    });

    // ── Métricas adicionales ──
    y += 8;
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(10, 26, 26);
    doc.text('MÉTRICAS CLAVE', 14, y);
    doc.setFillColor(0, 178, 189); doc.rect(14, y + 1.5, 25, 0.5, 'F');
    y += 7;

    const metricRows = [
      ['Días activos este mes', String(insightData.activeDays)],
      ['Pedidos completados', String(insightData.completedOrders)],
      ['Día pico de ventas', insightData.peakDay],
      ['Productos en catálogo', String(products.length)],
      ['Productos con stock crítico', String(lowStockProducts.length)],
    ];
    const mColW = (W - 28 - 6) / 3;
    metricRows.forEach((row, i) => {
      const mx = 14 + (i % 3) * (mColW + 3);
      const my = y + Math.floor(i / 3) * 14;
      doc.setFillColor(248, 250, 250); doc.setDrawColor(220, 230, 230); doc.setLineWidth(0.3);
      doc.roundedRect(mx, my, mColW, 12, 1.5, 1.5, 'FD');
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 140, 140);
      doc.text(row[0], mx + 3, my + 5);
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(10, 26, 26);
      doc.text(row[1], mx + 3, my + 10.5);
    });
    y += Math.ceil(metricRows.length / 3) * 14 + 6;

    // ── Insight ejecutivo ──
    doc.setFillColor(232, 250, 249);
    doc.setDrawColor(0, 178, 189);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, y, W - 28, 22, 2, 2, 'FD');
    doc.setFillColor(0, 178, 189);
    doc.rect(14, y, 3, 22, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 140, 149);
    doc.text('INSIGHT EJECUTIVO', 21, y + 6);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 60, 60);
    const insightText = insightData.successRate >= 70
      ? `Tu operación tiene una tasa de éxito del ${insightData.successRate}% — excelente. Tu día más activo es el ${insightData.peakDay} y el ticket promedio es de ${fmtCOP(insightData.avgTicket)}.`
      : insightData.totalOrders === 0
      ? 'Aún no hay ventas registradas. Registra tu primera orden para comenzar a ver análisis completos.'
      : `Tasa de éxito del ${insightData.successRate}%. Tu día más activo es el ${insightData.peakDay}. Revisa los pedidos cancelados para identificar áreas de mejora.`;
    const lines = doc.splitTextToSize(insightText, W - 40);
    doc.text(lines, 21, y + 12);
    y += 28;

    // ── Footer ──
    doc.setFillColor(10, 26, 26);
    doc.rect(0, H - 14, W, 14, 'F');
    doc.setFillColor(0, 178, 189);
    doc.rect(0, H - 14, 4, 14, 'F');
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 180, 180);
    doc.text('Reporte generado por Bayup · bayup.co', 10, H - 6);
    doc.setTextColor(100, 130, 130);
    doc.text(`Página 1 de 1  ·  ${now.toLocaleDateString('es-CO')}`, W - 14, H - 6, { align: 'right' });

    doc.save(`bayup-analisis-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}.pdf`);
    showToast('Reporte PDF generado exitosamente', 'success');
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
                        <div key={i} onClick={() => setOpenInsight(ins.modal)} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 transition-colors duration-150 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${ins.iconBg}`}>{ins.icon}</div>
                                <h5 className="font-semibold text-[13px] text-white leading-tight">{ins.title}</h5>
                            </div>
                            <span className={`self-start text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${ins.tagBg} ${ins.tagColor}`}>{ins.tag}</span>
                            <p className="text-[11px] text-white/50 leading-relaxed">{ins.text}</p>
                        </div>
                    ))}

                    <button onClick={() => setOpenInsight('analisis')} className="mt-auto w-full py-2.5 rounded-xl border border-white/10 text-[9px] font-semibold tracking-widest uppercase text-white/50 hover:text-white hover:border-white/20 transition-colors duration-150 flex items-center justify-center gap-2">
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

        {/* ── MODALES FLOTANTES — renderizados en document.body para evitar problemas de stacking context ── */}
        {mounted && createPortal(<>
        <AnimatePresence>
          {openInsight === 'meta' && (() => {
            const { channelTotals } = insightData;
            const totalAllChannels = insightData.monthlyTotal;
            const goalWithChannels = insightData.goal;
            const goalPctAll = goalWithChannels > 0 ? Math.min(Math.round((totalAllChannels / goalWithChannels) * 100), 100) : 0;
            const totalOrders = insightData.monthOrders.length;
            const avgTicket = totalOrders > 0 ? totalAllChannels / totalOrders : 0;
            const netMargin = totalAllChannels - monthlyExpensesTotal;
            const marginPct = totalAllChannels > 0 ? Math.round((netMargin / totalAllChannels) * 100) : 0;
            const recommendedNext = Math.round(totalAllChannels > 0 ? totalAllChannels * 1.2 : insightData.goal * 1.1);
            const dailyNeededAll = insightData.daysLeft > 0 ? Math.max(0, (goalWithChannels - totalAllChannels) / insightData.daysLeft) : 0;
            const fmtCOP = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
            return (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-[#0A1A1A]/50 backdrop-blur-sm z-[300]"
                onClick={() => setOpenInsight(null)}
              />
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                className="fixed inset-0 flex items-center justify-center z-[301] p-4 pointer-events-none"
              >
                <div className="pointer-events-auto w-full max-w-2xl bg-white rounded-2xl shadow-[0_24px_80px_rgba(10,26,26,0.22)] max-h-[88vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

                  {/* ── HEADER OSCURO — ocupa todo el tope, sin línea suelta ── */}
                  <div className="bg-gradient-to-br from-[#0A1A1A] to-[#0f2828] px-6 pt-5 pb-5 shrink-0">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="h-6 w-6 rounded-lg bg-[#00b2bd]/20 flex items-center justify-center">
                            <Target size={13} className="text-[#00b2bd]" />
                          </div>
                          <h3 className="text-[18px] font-black text-white leading-none">Meta del mes</h3>
                        </div>
                        <p className="text-[9px] text-[#00b2bd] font-bold uppercase tracking-widest ml-8">
                          {new Date().toLocaleDateString('es-CO',{month:'long',year:'numeric'}).toUpperCase()} · {insightData.activeDays} DÍAS ACTIVOS
                        </p>
                      </div>
                      <button onClick={() => setOpenInsight(null)} className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0">
                        <X size={14} className="text-white/60" />
                      </button>
                    </div>
                    {/* Progress row */}
                    <div className="flex items-center gap-5">
                      {/* Arc */}
                      <div className="relative h-[90px] w-[90px] shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="11"/>
                          <circle cx="50" cy="50" r="38" fill="none" stroke="url(#tealArcM1)" strokeWidth="11" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 38 * goalPctAll / 100} ${2 * Math.PI * 38}`}
                          />
                          <defs><linearGradient id="tealArcM1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00b2bd"/><stop offset="100%" stopColor="#00e5f0"/></linearGradient></defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[1.45rem] font-black text-white leading-none">{goalPctAll}%</span>
                          <span className="text-[7px] text-white/40 font-bold mt-0.5 uppercase tracking-widest">Meta</span>
                        </div>
                      </div>
                      {/* 4 stats */}
                      <div className="flex-1 grid grid-cols-4 gap-3">
                        <div>
                          <p className="text-[8px] text-white/40 uppercase tracking-widest font-semibold mb-0.5">Total facturado</p>
                          <p className="text-[1.2rem] font-black text-white leading-tight">{insightData.fmt(totalAllChannels)}</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-white/40 uppercase tracking-widest font-semibold mb-0.5">Meta mensual</p>
                          <div className="flex items-center gap-1">
                            {editingGoal ? (
                              <>
                                <input type="text" inputMode="numeric" value={goalInput}
                                  onChange={e => {
                                    const raw = e.target.value.replace(/\./g,'').replace(/[^\d]/g,'');
                                    setGoalInput(raw ? Number(raw).toLocaleString('es-CO') : '');
                                  }}
                                  className="w-28 bg-white/10 border border-white/20 rounded-lg px-2 py-0.5 text-[11px] font-bold text-white outline-none text-right"
                                  autoFocus
                                  onKeyDown={e=>{
                                    if(e.key==='Enter'){const v=Number(String(goalInput).replace(/\./g,'').replace(/[^\d]/g,''));if(v>0){setMonthlyGoal(v);localStorage.setItem('bayup_monthly_goal',String(v));}setEditingGoal(false);setGoalInput('');}
                                    if(e.key==='Escape'){setEditingGoal(false);setGoalInput('');}
                                  }}
                                />
                                <button onClick={()=>{const v=Number(String(goalInput).replace(/\./g,'').replace(/[^\d]/g,''));if(v>0){setMonthlyGoal(v);localStorage.setItem('bayup_monthly_goal',String(v));}setEditingGoal(false);setGoalInput('');}} className="text-[9px] font-black text-[#00b2bd]">OK</button>
                              </>
                            ) : (
                              <>
                                <p className="text-[1.2rem] font-black text-[#00b2bd] leading-tight">{insightData.fmt(goalWithChannels)}</p>
                                <button onClick={()=>{setEditingGoal(true);setGoalInput(Math.round(goalWithChannels).toLocaleString('es-CO'));}} className="opacity-40 hover:opacity-80"><Edit3 size={9} className="text-white"/></button>
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-[8px] text-white/40 uppercase tracking-widest font-semibold mb-0.5">Días restantes</p>
                          <p className="text-[1.2rem] font-black text-amber-400 leading-tight">{insightData.daysLeft}d</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-white/40 uppercase tracking-widest font-semibold mb-0.5">Necesario/día</p>
                          <p className="text-[1.2rem] font-black text-amber-400 leading-tight">{dailyNeededAll > 0 ? insightData.fmt(dailyNeededAll) : '—'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {/* Canales + Métricas — 2 columnas iguales */}
                    <div className="px-6 pt-5 pb-4 grid grid-cols-2 gap-5">

                      {/* Canales de venta — solo lectura, datos reales */}
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-3">Facturado por canal</p>
                        <div className="space-y-2">
                          {([
                            { icon: <Globe size={13}/>, label: 'Página web', value: channelTotals.web, dot: 'bg-blue-400' },
                            { icon: <Store size={13}/>, label: 'Tienda física', value: channelTotals.pos, dot: 'bg-emerald-400' },
                            { icon: <Smartphone size={13}/>, label: 'Redes sociales', value: channelTotals.redes, dot: 'bg-purple-400' },
                            { icon: <MessageSquare size={13}/>, label: 'WhatsApp', value: channelTotals.whatsapp, dot: 'bg-green-400' },
                          ]).map((ch, i) => (
                            <div key={i} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`h-2 w-2 rounded-full shrink-0 ${ch.dot}`}/>
                                <span className="text-[11px] text-gray-600 font-medium truncate">{ch.label}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[12px] font-black text-[#0A1A1A]">{fmtCOP(ch.value)}</span>
                                {totalAllChannels > 0 && <span className="text-[9px] text-gray-400 bg-gray-100 rounded-full px-1.5 py-0.5 font-semibold">{Math.round((ch.value/totalAllChannels)*100)}%</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Métricas clave */}
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-3">Métricas clave</p>
                        <div className="space-y-2">
                          <div className="bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[11px] text-gray-600 font-medium">Ticket promedio</span>
                            <span className="text-[12px] font-black text-[#0A1A1A]">{avgTicket > 0 ? fmtCOP(avgTicket) : '—'}</span>
                          </div>
                          <div className="bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                            <span className="text-[11px] text-gray-600 font-medium">Pedidos del mes</span>
                            <span className="text-[12px] font-black text-[#0A1A1A]">{totalOrders}</span>
                          </div>
                          <div className={`border rounded-xl px-3.5 py-2.5 flex items-center justify-between ${monthlyExpensesTotal > 0 ? (netMargin >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100') : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex items-center gap-1.5">
                              <Wallet size={11} className={monthlyExpensesTotal > 0 ? (netMargin >= 0 ? 'text-emerald-500' : 'text-red-400') : 'text-gray-400'}/>
                              <span className="text-[11px] text-gray-600 font-medium">Gastos del mes</span>
                            </div>
                            <span className={`text-[12px] font-black ${monthlyExpensesTotal > 0 ? (netMargin >= 0 ? 'text-emerald-600' : 'text-red-500') : 'text-gray-400'}`}>
                              {monthlyExpensesTotal > 0 ? fmtCOP(monthlyExpensesTotal) : 'Sin gastos'}
                            </span>
                          </div>
                          {monthlyExpensesTotal > 0 && (
                            <div className={`border rounded-xl px-3.5 py-2.5 flex items-center justify-between ${netMargin >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                              <span className="text-[11px] text-gray-600 font-medium">Margen neto est.</span>
                              <div className="text-right">
                                <p className={`text-[12px] font-black ${netMargin >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtCOP(netMargin)}</p>
                                <p className={`text-[9px] font-bold ${netMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{marginPct}% s/ ventas</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recomendación próximo mes */}
                    <div className="mx-6 mb-5 bg-[#f0fafb] border border-[#00b2bd]/20 rounded-xl px-5 py-4 flex items-start gap-4">
                      <div className="h-9 w-9 rounded-xl bg-[#00b2bd]/15 flex items-center justify-center shrink-0">
                        <Sparkles size={15} className="text-[#00b2bd]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Recomendación para el próximo mes</p>
                        <p className="text-[1.3rem] font-black text-[#00b2bd] leading-none mb-1.5">{fmtCOP(recommendedNext)}</p>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          {totalAllChannels > 0
                            ? `+20% sobre tu facturación actual de ${fmtCOP(totalAllChannels)}.${avgTicket > 0 ? ` Con tu ticket promedio necesitarías ~${Math.ceil(recommendedNext / avgTicket)} pedidos.` : ''}`
                            : 'Registra ventas este mes para recibir una recomendación personalizada basada en tu historial.'}
                        </p>
                        {totalAllChannels > 0 && (
                          <button onClick={()=>{setMonthlyGoal(recommendedNext);localStorage.setItem('bayup_monthly_goal',String(recommendedNext));}}
                            className="mt-2 text-[10px] font-black text-[#00b2bd] border border-[#00b2bd]/30 bg-[#00b2bd]/10 hover:bg-[#00b2bd]/20 rounded-full px-3 py-1 transition-colors">
                            Aplicar esta meta →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="px-5 py-4 shrink-0 flex gap-3 border-t border-gray-100">
                    <button onClick={()=>{setEditingGoal(true);setGoalInput(Math.round(goalWithChannels).toLocaleString('es-CO'));}}
                      className="flex-1 h-11 rounded-xl bg-[#0A1A1A] text-white text-[13px] font-black flex items-center justify-center gap-2 hover:bg-[#1a2e2e] transition-colors">
                      <Target size={14}/> Ajustar meta
                    </button>
                    <button onClick={()=>{setOpenInsight(null);router.push('/dashboard/orders');}}
                      className="h-11 px-5 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 text-[13px] font-semibold flex items-center gap-1.5 hover:bg-gray-200 transition-colors whitespace-nowrap">
                      Ver pedidos <ChevronRight size={14}/>
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
            );
          })()}
        </AnimatePresence>

        {/* ── MODAL 2: PRODUCTO LÍDER DEL MES ── */}
        <AnimatePresence>
          {openInsight === 'producto' && (() => {
            const top = insightData.topProducts[0];
            const totalRev = insightData.totalRevenue;
            const avgPricePerUnit = top && top.units > 0 ? top.total / top.units : 0;
            const fmtCOP = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

            // Top productos por canal (usando monthOrders)
            const buildChannelRanking = (sources: string[]) => {
              const map: Record<string, { name: string; total: number; units: number }> = {};
              insightData.monthOrders
                .filter(o => sources.includes(o.source || 'pos'))
                .forEach((o: any) => {
                  (o.items || o.order_items || []).forEach((item: any) => {
                    const key = item.product_id || item.product_name || 'Unknown';
                    const name = item.product_name || item.name || 'Producto';
                    if (!map[key]) map[key] = { name, total: 0, units: 0 };
                    map[key].total += item.total_price || (item.unit_price * (item.quantity || 1)) || 0;
                    map[key].units += item.quantity || 1;
                  });
                });
              return Object.values(map).sort((a, b) => b.units - a.units).slice(0, 4);
            };
            const webTop = buildChannelRanking(['web']);
            const posTop = buildChannelRanking(['pos', '']);

            return (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-[#0A1A1A]/60 backdrop-blur-sm z-[300]"
                onClick={() => setOpenInsight(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 20 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="fixed inset-0 flex items-center justify-center z-[301] p-4 pointer-events-none"
              >
                <div className="pointer-events-auto w-full max-w-4xl bg-white rounded-3xl shadow-[0_32px_100px_rgba(10,26,26,0.28)] max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

                  {/* ── HEADER OSCURO ── */}
                  <div className="bg-gradient-to-br from-[#0A1A1A] via-[#12100a] to-[#1a1200] px-8 pt-6 pb-6 shrink-0">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-amber-400/15 border border-amber-400/25 flex items-center justify-center">
                          <Trophy size={16} className="text-amber-400" />
                        </div>
                        <div>
                          <h3 className="text-[20px] font-black text-white leading-none tracking-tight">Producto líder del mes</h3>
                          <p className="text-[9px] text-amber-400/80 font-bold uppercase tracking-widest mt-0.5">
                            {new Date().toLocaleDateString('es-CO',{month:'long',year:'numeric'}).toUpperCase()} · ANÁLISIS DE VENTAS
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setOpenInsight(null)} className="h-9 w-9 rounded-full bg-white/8 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all shrink-0">
                        <X size={15} className="text-white/50" />
                      </button>
                    </div>

                    {insightData.topProducts.length === 0 ? (
                      <div className="py-8 text-center">
                        <Trophy size={32} className="text-amber-400/20 mx-auto mb-3" />
                        <p className="text-white/40 text-sm font-semibold">Sin ventas registradas aún</p>
                        <p className="text-white/25 text-xs mt-1">Registra tu primera venta para ver el ranking.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-5 gap-4 items-center">
                        {/* Medalla */}
                        <div className="relative h-[100px] flex items-center justify-center">
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/15 to-amber-600/5 border border-amber-400/20" />
                          <div className="relative flex flex-col items-center gap-1">
                            <span className="text-[3.2rem] leading-none">🥇</span>
                            <span className="text-[7px] text-amber-400/60 font-black uppercase tracking-[0.15em]">#1 LÍDER</span>
                          </div>
                        </div>
                        {/* Nombre producto */}
                        <div className="col-span-2 pl-2">
                          <p className="text-[9px] text-white/35 uppercase tracking-widest font-semibold mb-1">Producto estrella del mes</p>
                          <p className="text-[1.35rem] font-black text-white leading-tight">{top.name}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full" style={{width:`${insightData.leaderSharePct}%`}}/>
                            </div>
                            <span className="text-[10px] text-amber-400 font-black">{insightData.leaderSharePct}% del total</span>
                          </div>
                        </div>
                        {/* Stats */}
                        <div className="col-span-2 grid grid-cols-3 gap-3">
                          {[
                            { label: 'Ingresos', value: fmtCOP(top.total), accent: true },
                            { label: 'Unidades', value: String(top.units), accent: false },
                            { label: 'Precio prom.', value: avgPricePerUnit > 0 ? fmtCOP(avgPricePerUnit) : '—', accent: false },
                          ].map((s, i) => (
                            <div key={i} className={`rounded-xl p-3 text-center ${s.accent ? 'bg-amber-400/15 border border-amber-400/25' : 'bg-white/6 border border-white/8'}`}>
                              <p className="text-[8px] text-white/35 uppercase tracking-widest font-semibold mb-1">{s.label}</p>
                              <p className={`text-[12px] font-black leading-tight ${s.accent ? 'text-amber-300' : 'text-white'}`}>{s.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {insightData.topProducts.length > 0 && (
                    <div className="flex-1 overflow-y-auto">

                      {/* 3 columnas: ranking global + web + tienda */}
                      <div className="px-8 pt-6 pb-5 grid grid-cols-3 gap-6">

                        {/* Ranking global */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="h-6 w-6 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                              <Trophy size={11} className="text-amber-500" />
                            </div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Ranking general</p>
                          </div>
                          <div className="space-y-2.5">
                            {insightData.topProducts.slice(0, 5).map((p, i) => {
                              const pct = top.total > 0 ? (p.total / top.total) * 100 : 0;
                              const medals = ['🥇','🥈','🥉'];
                              const barColor = i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-gray-300' : 'bg-gray-200';
                              return (
                                <div key={i} className={`rounded-xl px-3.5 py-3 ${i === 0 ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50 border border-gray-100'}`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-base leading-none shrink-0">
                                      {i < 3 ? medals[i] : <span className="text-[10px] text-gray-400 font-black w-5 inline-block text-center">{i+1}</span>}
                                    </span>
                                    <span className={`flex-1 text-[11px] font-semibold truncate ${i === 0 ? 'text-amber-800' : 'text-gray-700'}`}>{p.name}</span>
                                    <span className="text-[9px] text-gray-400 shrink-0">{p.units}u</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                                      <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.55,ease:'easeOut',delay:i*0.06}}
                                        className={`h-full rounded-full ${barColor}`}/>
                                    </div>
                                    <span className={`text-[11px] font-black shrink-0 ${i === 0 ? 'text-amber-700' : 'text-[#0A1A1A]'}`}>{fmtCOP(p.total)}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Top Página Web */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="h-6 w-6 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                              <Globe size={11} className="text-blue-500" />
                            </div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Página web</p>
                          </div>
                          {webTop.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 rounded-2xl bg-gray-50 border border-dashed border-gray-200">
                              <Globe size={22} className="text-gray-200 mb-2" />
                              <p className="text-[11px] text-gray-400 font-medium text-center">Sin ventas web<br/>este mes</p>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {webTop.map((p, i) => {
                                const pct = webTop[0].units > 0 ? (p.units / webTop[0].units) * 100 : 0;
                                const medals = ['🥇','🥈','🥉'];
                                return (
                                  <div key={i} className={`rounded-xl px-3.5 py-3 ${i === 0 ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-base leading-none shrink-0">
                                        {i < 3 ? medals[i] : <span className="text-[10px] text-gray-400 font-black">{i+1}</span>}
                                      </span>
                                      <span className={`flex-1 text-[11px] font-semibold truncate ${i === 0 ? 'text-blue-800' : 'text-gray-700'}`}>{p.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                                        <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.55,ease:'easeOut',delay:i*0.06}}
                                          className={`h-full rounded-full ${i === 0 ? 'bg-blue-400' : 'bg-gray-300'}`}/>
                                      </div>
                                      <span className="text-[10px] text-gray-500 shrink-0 font-semibold">{p.units} uds</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Top Tienda Física */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="h-6 w-6 rounded-lg bg-[#e8faf9] border border-[#00b2bd]/30 flex items-center justify-center">
                              <Store size={11} className="text-[#00b2bd]" />
                            </div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Tienda física</p>
                          </div>
                          {posTop.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 rounded-2xl bg-gray-50 border border-dashed border-gray-200">
                              <Store size={22} className="text-gray-200 mb-2" />
                              <p className="text-[11px] text-gray-400 font-medium text-center">Sin ventas POS<br/>este mes</p>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {posTop.map((p, i) => {
                                const pct = posTop[0].units > 0 ? (p.units / posTop[0].units) * 100 : 0;
                                const medals = ['🥇','🥈','🥉'];
                                return (
                                  <div key={i} className={`rounded-xl px-3.5 py-3 ${i === 0 ? 'bg-[#e8faf9] border border-[#00b2bd]/20' : 'bg-gray-50 border border-gray-100'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-base leading-none shrink-0">
                                        {i < 3 ? medals[i] : <span className="text-[10px] text-gray-400 font-black">{i+1}</span>}
                                      </span>
                                      <span className={`flex-1 text-[11px] font-semibold truncate ${i === 0 ? 'text-[#006d73]' : 'text-gray-700'}`}>{p.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                                        <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.55,ease:'easeOut',delay:i*0.06}}
                                          className={`h-full rounded-full ${i === 0 ? 'bg-[#00b2bd]' : 'bg-gray-300'}`}/>
                                      </div>
                                      <span className="text-[10px] text-gray-500 shrink-0 font-semibold">{p.units} uds</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Insight box */}
                      <div className="mx-8 mb-6 bg-gradient-to-r from-[#fffbf0] to-[#fffdf5] border border-amber-200/70 rounded-2xl px-5 py-4 flex items-start gap-4">
                        <div className="h-9 w-9 rounded-xl bg-amber-100 border border-amber-200/60 flex items-center justify-center shrink-0">
                          <Lightbulb size={15} className="text-amber-500" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1.5">Recomendación</p>
                          <p className="text-[12px] text-gray-600 leading-relaxed">
                            <span className="font-bold text-[#0A1A1A]">{top.name}</span> lidera con el{' '}
                            <span className="text-amber-600 font-bold">{insightData.leaderSharePct}%</span> de tus ingresos totales.
                            {insightData.topProducts.length >= 2 && <> El segundo lugar es <span className="font-semibold text-[#0A1A1A]">{insightData.topProducts[1].name}</span> con {fmtCOP(insightData.topProducts[1].total)}.</>}
                            {insightData.leaderSharePct > 60
                              ? ' Alta concentración en un solo producto — considera promocionar otros para diversificar el riesgo.'
                              : insightData.leaderSharePct > 35
                              ? ' Distribución saludable. Potencia el líder con bundles o combos para aumentar el ticket promedio.'
                              : ' Excelente distribución entre productos. Tu catálogo está bien equilibrado.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CTAs */}
                  <div className="px-8 py-5 shrink-0 flex gap-3 border-t border-gray-100">
                    <button onClick={()=>{setOpenInsight(null);router.push('/dashboard/products');}}
                      className="flex-1 h-12 rounded-2xl bg-[#0A1A1A] text-white text-[13px] font-black flex items-center justify-center gap-2 hover:bg-[#1a2e2e] transition-colors">
                      <Package size={15}/> Ver todos los productos
                    </button>
                    <button onClick={()=>{setOpenInsight(null);router.push('/dashboard/orders');}}
                      className="h-12 px-6 rounded-2xl bg-gray-100 border border-gray-200 text-gray-600 text-[13px] font-semibold flex items-center gap-2 hover:bg-gray-200 transition-colors whitespace-nowrap">
                      Ver pedidos <ChevronRight size={14}/>
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
            );
          })()}
        </AnimatePresence>

        {/* ── MODAL 3: STOCK CRÍTICO ── */}
        <AnimatePresence>
          {openInsight === 'stock' && (() => {
            const agotados = lowStockProducts.filter(p => p.stockLevel === 0);
            const bajos = lowStockProducts.filter(p => p.stockLevel > 0 && p.stockLevel <= 3);
            const totalProductos = products.length;
            const pctAfectados = totalProductos > 0 ? Math.round((lowStockProducts.length / totalProductos) * 100) : 0;
            const filtered = lowStockProducts.filter(p =>
              stockFilter === 'all' ? true : stockFilter === 'urgent' ? p.stockLevel === 0 : p.stockLevel > 0
            );
            return (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-[#0A1A1A]/60 backdrop-blur-sm z-[300]"
                onClick={() => setOpenInsight(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 20 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="fixed inset-0 flex items-center justify-center z-[301] p-4 pointer-events-none"
              >
                <div className="pointer-events-auto w-full max-w-4xl bg-white rounded-3xl shadow-[0_32px_100px_rgba(10,26,26,0.28)] max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

                  {/* ── HEADER OSCURO ── */}
                  <div className="bg-gradient-to-br from-[#0A1A1A] via-[#140a0a] to-[#1a0808] px-8 pt-6 pb-6 shrink-0">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-red-500/20 border border-red-400/30 flex items-center justify-center">
                          <AlertCircle size={16} className="text-red-400" />
                        </div>
                        <div>
                          <h3 className="text-[20px] font-black text-white leading-none tracking-tight">Alerta de inventario</h3>
                          <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
                            <span className="text-red-400/80">URGENTE · ACCIÓN REQUERIDA</span>
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setOpenInsight(null)} className="h-9 w-9 rounded-full bg-white/8 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all shrink-0">
                        <X size={15} className="text-white/50" />
                      </button>
                    </div>

                    {lowStockProducts.length === 0 ? (
                      <div className="py-6 text-center">
                        <CheckCircle2 size={28} className="text-emerald-400/40 mx-auto mb-2" />
                        <p className="text-white/40 text-sm font-semibold">Inventario en niveles óptimos</p>
                        <p className="text-white/25 text-xs mt-1">Todos tus productos tienen stock suficiente.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-4">
                        <div className="rounded-2xl bg-red-500/15 border border-red-400/25 p-4 text-center">
                          <p className="text-[2.2rem] font-black text-red-400 leading-none">{agotados.length}</p>
                          <p className="text-[8px] text-red-400/70 uppercase tracking-widest font-bold mt-1.5">Agotados</p>
                        </div>
                        <div className="rounded-2xl bg-orange-400/15 border border-orange-400/25 p-4 text-center">
                          <p className="text-[2.2rem] font-black text-orange-300 leading-none">{bajos.length}</p>
                          <p className="text-[8px] text-orange-400/70 uppercase tracking-widest font-bold mt-1.5">Stock bajo</p>
                        </div>
                        <div className="rounded-2xl bg-white/6 border border-white/10 p-4 text-center">
                          <p className="text-[2.2rem] font-black text-white leading-none">{lowStockProducts.length}</p>
                          <p className="text-[8px] text-white/35 uppercase tracking-widest font-bold mt-1.5">Total afectados</p>
                        </div>
                        <div className="rounded-2xl bg-white/6 border border-white/10 p-4 text-center">
                          <p className="text-[2.2rem] font-black text-white leading-none">{pctAfectados}%</p>
                          <p className="text-[8px] text-white/35 uppercase tracking-widest font-bold mt-1.5">Del catálogo</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {lowStockProducts.length > 0 && (
                    <div className="flex-1 overflow-y-auto">
                      <div className="px-8 pt-6 pb-4 grid grid-cols-2 gap-6">

                        {/* Lista de productos afectados */}
                        <div>
                          {/* Filter tabs */}
                          <div className="flex items-center gap-2 mb-4">
                            {([
                              { key: 'all' as const, label: 'Todos', count: lowStockProducts.length },
                              { key: 'urgent' as const, label: 'Agotados', count: agotados.length },
                              { key: 'low' as const, label: 'Stock bajo', count: bajos.length },
                            ]).map(tab => (
                              <button key={tab.key} onClick={() => setStockFilter(tab.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all ${
                                  stockFilter === tab.key
                                    ? 'bg-[#0A1A1A] border-[#0A1A1A] text-white'
                                    : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-600'
                                }`}>
                                {tab.label}
                                <span className={`min-w-[16px] px-1 rounded-full text-[8px] font-black ${stockFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>{tab.count}</span>
                              </button>
                            ))}
                          </div>

                          <div className="space-y-2.5">
                            {filtered.length === 0 ? (
                              <p className="text-[12px] text-gray-400 text-center py-8">Sin productos en esta categoría</p>
                            ) : filtered.map((p, i) => (
                              <div key={i} className={`rounded-xl px-4 py-3.5 flex items-center gap-3 border ${p.stockLevel === 0 ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'}`}>
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${p.stockLevel === 0 ? 'bg-red-100' : 'bg-orange-100'}`}>
                                  {p.stockLevel === 0
                                    ? <AlertCircle size={14} className="text-red-500" />
                                    : <TrendingDown size={14} className="text-orange-500" />
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-semibold text-[#0A1A1A] truncate">{p.name}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min((p.stockLevel / 10) * 100, 100)}%` }}
                                        transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.05 }}
                                        className={`h-full rounded-full ${p.stockLevel === 0 ? 'bg-red-500' : p.stockLevel <= 2 ? 'bg-red-400' : 'bg-orange-400'}`}
                                      />
                                    </div>
                                    <span className={`text-[10px] font-black shrink-0 ${p.stockLevel === 0 ? 'text-red-500' : 'text-orange-500'}`}>
                                      {p.stockLevel === 0 ? 'AGOTADO' : `${p.stockLevel} uds`}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => { setOpenInsight(null); router.push('/dashboard/products'); }}
                                  className={`shrink-0 h-8 px-3.5 rounded-xl text-[10px] font-bold transition-colors ${p.stockLevel === 0 ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-orange-400 text-white hover:bg-orange-500'}`}
                                >
                                  Reponer
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Panel derecho: métricas y análisis */}
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-3">Estado del inventario</p>
                            <div className="space-y-2.5">
                              <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between">
                                <span className="text-[12px] text-gray-600 font-medium">Total de productos</span>
                                <span className="text-[13px] font-black text-[#0A1A1A]">{totalProductos}</span>
                              </div>
                              <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between">
                                <span className="text-[12px] text-gray-600 font-medium">Con stock OK</span>
                                <span className="text-[13px] font-black text-emerald-600">{totalProductos - lowStockProducts.length}</span>
                              </div>
                              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center justify-between">
                                <span className="text-[12px] text-gray-600 font-medium">Requieren atención</span>
                                <span className="text-[13px] font-black text-red-500">{lowStockProducts.length}</span>
                              </div>
                            </div>
                          </div>

                          {/* Barra de salud del inventario */}
                          <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Salud del inventario</span>
                              <span className={`text-[12px] font-black ${100 - pctAfectados >= 80 ? 'text-emerald-600' : 100 - pctAfectados >= 60 ? 'text-orange-500' : 'text-red-500'}`}>
                                {100 - pctAfectados}%
                              </span>
                            </div>
                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${100 - pctAfectados}%` }}
                                transition={{ duration: 0.7, ease: 'easeOut' }}
                                className={`h-full rounded-full ${100 - pctAfectados >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 100 - pctAfectados >= 60 ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
                              />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2">
                              {100 - pctAfectados >= 80 ? 'Inventario en buena salud general.' : 100 - pctAfectados >= 60 ? 'Requiere atención moderada.' : 'Estado crítico — acción inmediata necesaria.'}
                            </p>
                          </div>

                          {/* Prioridad de reposición */}
                          {agotados.length > 0 && (
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-3">Prioridad crítica</p>
                              <div className="space-y-2">
                                {agotados.slice(0, 3).map((p, i) => (
                                  <div key={i} className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                                    <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                                      <span className="text-[9px] font-black text-white">{i + 1}</span>
                                    </div>
                                    <span className="flex-1 text-[12px] font-semibold text-[#0A1A1A] truncate">{p.name}</span>
                                    <span className="text-[9px] font-black text-red-500 bg-red-100 px-2 py-0.5 rounded-full">AGOTADO</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Insight box */}
                      <div className="mx-8 mb-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/60 rounded-2xl px-5 py-4 flex items-start gap-4">
                        <div className="h-9 w-9 rounded-xl bg-red-100 border border-red-200/60 flex items-center justify-center shrink-0">
                          <Lightbulb size={15} className="text-red-500" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1.5">Recomendación</p>
                          <p className="text-[12px] text-gray-600 leading-relaxed">
                            {agotados.length > 0
                              ? <><span className="font-bold text-red-600">{agotados.length} producto{agotados.length > 1 ? 's' : ''} agotado{agotados.length > 1 ? 's' : ''}</span> — cada día sin stock representa ventas perdidas. Prioriza la reposición de {agotados[0]?.name} primero.{bajos.length > 0 ? ` Además ${bajos.length} producto${bajos.length > 1 ? 's tienen' : ' tiene'} stock bajo y podría agotarse pronto.` : ''}</>
                              : <><span className="font-bold text-orange-600">{bajos.length} producto{bajos.length > 1 ? 's' : ''} con stock bajo</span> — considera reponer antes de que se agoten para evitar interrupciones en ventas.</>
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CTAs */}
                  <div className="px-8 py-5 shrink-0 flex gap-3 border-t border-gray-100">
                    <button
                      onClick={() => { setOpenInsight(null); router.push('/dashboard/products'); }}
                      className="flex-1 h-12 rounded-2xl bg-[#0A1A1A] text-white text-[13px] font-black flex items-center justify-center gap-2 hover:bg-[#1a2e2e] transition-colors"
                    >
                      <Package size={15} /> Reponer inventario ahora
                    </button>
                    <button
                      onClick={() => setOpenInsight(null)}
                      className="h-12 px-6 rounded-2xl bg-gray-100 border border-gray-200 text-gray-600 text-[13px] font-semibold flex items-center gap-2 hover:bg-gray-200 transition-colors whitespace-nowrap"
                    >
                      Cerrar <X size={14}/>
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
            );
          })()}
        </AnimatePresence>

        {/* ── MODAL 4: ANÁLISIS DETALLADO ── */}
        <AnimatePresence>
          {openInsight === 'analisis' && (() => {
            const fmtCOP = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
            const statusStyles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
              pending:   { bg: 'bg-amber-50 border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-400',   label: 'Pendiente'  },
              paid:      { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Pagado'     },
              shipped:   { bg: 'bg-blue-50 border-blue-200',     text: 'text-blue-700',    dot: 'bg-blue-500',    label: 'Enviado'    },
              delivered: { bg: 'bg-green-50 border-green-200',   text: 'text-green-700',   dot: 'bg-green-500',   label: 'Entregado'  },
              cancelled: { bg: 'bg-red-50 border-red-200',       text: 'text-red-600',     dot: 'bg-red-500',     label: 'Cancelado'  },
            };
            const totalStatuses = Object.values(insightData.statusCount).reduce((a, v) => a + v, 0);
            return (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-[#0A1A1A]/60 backdrop-blur-sm z-[300]"
                onClick={() => setOpenInsight(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 20 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="fixed inset-0 flex items-center justify-center z-[301] p-4 pointer-events-none"
              >
                <div className="pointer-events-auto w-full max-w-4xl bg-white rounded-3xl shadow-[0_32px_100px_rgba(10,26,26,0.28)] max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

                  {/* ── HEADER OSCURO ── */}
                  <div className="bg-gradient-to-br from-[#0A1A1A] via-[#0a1a14] to-[#081a10] px-8 pt-6 pb-6 shrink-0">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[#00b2bd]/20 border border-[#00b2bd]/30 flex items-center justify-center">
                          <BarChart3 size={16} className="text-[#00b2bd]" />
                        </div>
                        <div>
                          <h3 className="text-[20px] font-black text-white leading-none tracking-tight">Análisis detallado</h3>
                          <p className="text-[9px] text-[#00b2bd]/70 font-bold uppercase tracking-widest mt-0.5">
                            RESUMEN EJECUTIVO · {new Date().toLocaleDateString('es-CO',{month:'long',year:'numeric'}).toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setOpenInsight(null)} className="h-9 w-9 rounded-full bg-white/8 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all shrink-0">
                        <X size={15} className="text-white/50" />
                      </button>
                    </div>

                    {/* 4 KPIs principales en header */}
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'Ingresos totales', value: fmtCOP(insightData.totalRevenue), sub: 'Todos los tiempos', accent: true },
                        { label: 'Ticket promedio', value: fmtCOP(insightData.avgTicket), sub: 'Por pedido', accent: false },
                        { label: 'Total pedidos', value: String(insightData.totalOrders), sub: 'Histórico', accent: false },
                        { label: 'Tasa de éxito', value: `${insightData.successRate}%`, sub: `${insightData.completedOrders} completados`, accent: false },
                      ].map((k, i) => (
                        <div key={i} className={`rounded-2xl p-4 ${k.accent ? 'bg-[#00b2bd]/15 border border-[#00b2bd]/25' : 'bg-white/6 border border-white/10'}`}>
                          <p className="text-[8px] text-white/35 uppercase tracking-widest font-semibold mb-1">{k.label}</p>
                          <p className={`text-[1.15rem] font-black leading-tight ${k.accent ? 'text-[#00b2bd]' : 'text-white'}`}>{k.value}</p>
                          <p className="text-[9px] text-white/25 mt-0.5">{k.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <div className="px-8 pt-6 pb-4 grid grid-cols-2 gap-6">

                      {/* Columna izquierda: gráfico de actividad + estado pedidos */}
                      <div className="space-y-5">

                        {/* Gráfico barras por día */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-lg bg-[#e8faf9] border border-[#00b2bd]/30 flex items-center justify-center">
                                <Activity size={11} className="text-[#00b2bd]" />
                              </div>
                              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Actividad por día</p>
                            </div>
                            <span className="text-[10px] text-gray-400">Pico: <span className="font-black text-[#0A1A1A]">{insightData.peakDay}</span></span>
                          </div>
                          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                            <div className="flex items-end gap-2 h-20">
                              {insightData.dayStats.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                                  <div className="w-full flex items-end justify-center" style={{ height: '56px' }}>
                                    <motion.div
                                      initial={{ height: 0 }}
                                      animate={{ height: `${Math.max((d.pct / 100) * 56, 4)}px` }}
                                      transition={{ duration: 0.55, ease: 'easeOut', delay: i * 0.05 }}
                                      style={{ width: '100%' }}
                                      className={`rounded-t-md ${d.day === insightData.peakDay ? 'bg-gradient-to-t from-[#00b2bd] to-[#00d4e0]' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                                    />
                                  </div>
                                  <span className={`text-[9px] font-bold ${d.day === insightData.peakDay ? 'text-[#00b2bd]' : 'text-gray-400'}`}>{d.day.slice(0,2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Estado de pedidos */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="h-6 w-6 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                              <ShoppingBag size={11} className="text-gray-500" />
                            </div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Estado de pedidos</p>
                          </div>
                          {Object.keys(insightData.statusCount).length === 0 ? (
                            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl py-8 text-center">
                              <ShoppingBag size={20} className="text-gray-200 mx-auto mb-2" />
                              <p className="text-[12px] text-gray-400 font-medium">Sin pedidos registrados</p>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {Object.entries(insightData.statusCount).map(([status, count]) => {
                                const s = statusStyles[status] || { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600', dot: 'bg-gray-400', label: status };
                                const pct = totalStatuses > 0 ? Math.round((count / totalStatuses) * 100) : 0;
                                return (
                                  <div key={status} className={`border rounded-xl px-4 py-3 ${s.bg}`}>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${s.dot}`} />
                                        <span className={`text-[12px] font-semibold ${s.text}`}>{s.label}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[11px] font-black ${s.text}`}>{count}</span>
                                        <span className="text-[9px] text-gray-400 font-semibold">{pct}%</span>
                                      </div>
                                    </div>
                                    <div className="h-1 bg-white/60 rounded-full overflow-hidden">
                                      <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.5,ease:'easeOut'}}
                                        className={`h-full rounded-full ${s.dot}`}/>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Columna derecha: top productos + métricas adicionales */}
                      <div className="space-y-5">

                        {/* Top productos */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="h-6 w-6 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                              <Trophy size={11} className="text-amber-500" />
                            </div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Top productos</p>
                          </div>
                          {insightData.topProducts.length === 0 ? (
                            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl py-8 text-center">
                              <Package size={20} className="text-gray-200 mx-auto mb-2" />
                              <p className="text-[12px] text-gray-400 font-medium">Sin ventas registradas</p>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {insightData.topProducts.slice(0, 5).map((p, i) => {
                                const maxT = insightData.topProducts[0]?.total || 1;
                                const pct = maxT > 0 ? (p.total / maxT) * 100 : 0;
                                const medals = ['🥇','🥈','🥉'];
                                const totalShare = insightData.totalRevenue > 0 ? Math.round((p.total / insightData.totalRevenue) * 100) : 0;
                                return (
                                  <div key={i} className={`rounded-xl px-4 py-3 border ${i === 0 ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-base leading-none shrink-0">
                                        {i < 3 ? medals[i] : <span className="text-[10px] text-gray-400 font-black w-4 inline-block text-center">{i+1}</span>}
                                      </span>
                                      <span className={`flex-1 text-[11px] font-semibold truncate ${i === 0 ? 'text-amber-800' : 'text-gray-700'}`}>{p.name}</span>
                                      <span className="text-[9px] text-gray-400">{totalShare}%</span>
                                      <span className={`text-[11px] font-black shrink-0 ${i === 0 ? 'text-amber-700' : 'text-[#0A1A1A]'}`}>{fmtCOP(p.total)}</span>
                                    </div>
                                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                                      <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.55,ease:'easeOut',delay:i*0.06}}
                                        className={`h-full rounded-full ${i === 0 ? 'bg-gradient-to-r from-amber-400 to-yellow-400' : 'bg-gray-300'}`}/>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Métricas adicionales */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="h-6 w-6 rounded-lg bg-[#e8faf9] border border-[#00b2bd]/30 flex items-center justify-center">
                              <Zap size={11} className="text-[#00b2bd]" />
                            </div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Métricas clave</p>
                          </div>
                          <div className="space-y-2">
                            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between">
                              <span className="text-[12px] text-gray-600 font-medium">Días activos este mes</span>
                              <span className="text-[13px] font-black text-[#0A1A1A]">{insightData.activeDays}</span>
                            </div>
                            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between">
                              <span className="text-[12px] text-gray-600 font-medium">Pedidos completados</span>
                              <span className="text-[13px] font-black text-emerald-600">{insightData.completedOrders}</span>
                            </div>
                            <div className={`border rounded-xl px-4 py-3 flex items-center justify-between ${insightData.successRate >= 70 ? 'bg-emerald-50 border-emerald-100' : insightData.successRate >= 40 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
                              <span className="text-[12px] text-gray-600 font-medium">Tasa de éxito</span>
                              <span className={`text-[13px] font-black ${insightData.successRate >= 70 ? 'text-emerald-600' : insightData.successRate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>{insightData.successRate}%</span>
                            </div>
                            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between">
                              <span className="text-[12px] text-gray-600 font-medium">Día pico de ventas</span>
                              <span className="text-[13px] font-black text-[#00b2bd]">{insightData.peakDay}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Insight box */}
                    <div className="mx-8 mb-6 bg-gradient-to-r from-[#e8faf9] to-[#f0fffe] border border-[#00b2bd]/30 rounded-2xl px-5 py-4 flex items-start gap-4">
                      <div className="h-9 w-9 rounded-xl bg-[#00b2bd]/10 border border-[#00b2bd]/20 flex items-center justify-center shrink-0">
                        <Lightbulb size={15} className="text-[#00b2bd]" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-[#00b2bd] uppercase tracking-widest mb-1.5">Insight ejecutivo</p>
                        <p className="text-[12px] text-gray-600 leading-relaxed">
                          Tu día más activo es <span className="font-bold text-[#0A1A1A]">{insightData.peakDay}</span>.{' '}
                          {insightData.successRate >= 70
                            ? <><span className="font-bold text-emerald-600">{insightData.successRate}% de tasa de éxito</span> — operación excelente. El ticket promedio de {fmtCOP(insightData.avgTicket)} indica una base de clientes sólida.</>
                            : insightData.successRate >= 40
                            ? <><span className="font-bold text-amber-600">{insightData.successRate}% de tasa de éxito</span> — hay margen de mejora. Revisa los pedidos cancelados para identificar patrones.</>
                            : insightData.totalOrders === 0
                            ? 'Aún no hay ventas registradas. Crea tu primera orden para comenzar a ver análisis.'
                            : <><span className="font-bold text-red-500">{insightData.successRate}% de tasa de éxito</span> — requiere atención. Muchos pedidos no se están completando.</>
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="px-8 py-5 shrink-0 flex gap-3 border-t border-gray-100">
                    <button onClick={()=>{setOpenInsight(null);router.push('/dashboard/orders');}}
                      className="flex-1 h-12 rounded-2xl bg-[#0A1A1A] text-white text-[13px] font-black flex items-center justify-center gap-2 hover:bg-[#1a2e2e] transition-colors">
                      <ShoppingBag size={15}/> Ver todos los pedidos
                    </button>
                    <button onClick={exportAnalysisPDF}
                      className="h-12 px-6 rounded-2xl bg-gray-100 border border-gray-200 text-gray-600 text-[13px] font-semibold flex items-center gap-2 hover:bg-gray-200 transition-colors whitespace-nowrap">
                      <Download size={14}/> Exportar PDF
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
            );
          })()}
        </AnimatePresence>

        </>, document.body)}

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
