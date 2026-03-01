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
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import MetricDetailModal from '@/components/dashboard/MetricDetailModal';

// --- COMPONENTES ATÓMICOS ---
const AnimatedNumber = memo(({ value, type = 'currency' }: { value: number, type?: 'currency' | 'simple' | 'percentage' }) => {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current: number) => {
        if (type === 'percentage') return Math.round(current) + "%";
        if (type === 'simple') return Math.round(current).toLocaleString();
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(current);
    });
    useEffect(() => { spring.set(value); }, [value, spring]);
    return <motion.span>{display}</motion.span>; 
});
AnimatedNumber.displayName = 'AnimatedNumber';

const PremiumCard = ({ children, className = "", dark = false }: { children: React.ReactNode, className?: string, dark?: boolean }) => {
    return (
        <div className={`rounded-[3rem] border transition-all duration-500 relative overflow-hidden isolate ${
            dark 
            ? 'bg-gradient-to-br from-[#001a1a]/95 to-[#002626]/95 border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]' 
            : 'bg-white/40 backdrop-blur-xl border-white/80 shadow-xl'
        } ${className}`}>
            {dark && <div className="absolute inset-0 bg-gradient-to-tr from-cyan/5 to-transparent pointer-events-none" />}
            <div className="h-full relative z-[2]">{children}</div>
        </div>
    );
};

const AuroraMetricCard = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => {
    return (
        <div className="relative group cursor-pointer h-full perspective-1000" onClick={onClick}>
            <div className="absolute inset-0 -m-[2px] rounded-[3rem] overflow-hidden pointer-events-none z-0">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    style={{ willChange: 'transform' }}
                    className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent_0deg,#00F2FF_20deg,#10B981_40deg,#9333EA_60deg,transparent_80deg,transparent_360deg)] opacity-30 group-hover:opacity-100 transition-opacity duration-1000 blur-[12px] transform-gpu"
                />
            </div>
            <div className="relative z-10 h-full transform-gpu">{children}</div>
        </div>
    );
};

export default function DashboardPage() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
  
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const [isCustomReportModalOpen, setIsCustomReportModalOpen] = useState(false);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [companyName, setCompanyName] = useState('...');
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

  const loadDashboardData = useCallback(async () => {
    if (!token) return;
    try {
        const [pData, oData, lData, uData] = await Promise.all([
            apiRequest<any[]>('/products', { token }),
            apiRequest<any[]>('/orders', { token }),
            apiRequest<any[]>('/admin/logs', { token }),
            apiRequest<any>('/auth/me', { token })
        ]);

        if (uData?.full_name) setCompanyName(uData.full_name);
        
        if (oData) {
            setOrders(oData);
            
            // 1. Filtrar ventas de HOY
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const ordersToday = oData.filter(o => new Date(o.created_at) >= today);
            
            // 2. Análisis de Día y Hora Pico (HISTÓRICO)
            const daysMap: any = { 0: 'Domingos', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábados' };
            const dayCounts: any = {};
            const hourCounts: any = {};
            
            oData.forEach(o => {
                const d = new Date(o.created_at);
                const day = d.getDay();
                const hour = d.getHours();
                dayCounts[day] = (dayCounts[day] || 0) + 1;
                hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            });

            const topDay = Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b, '1');
            const topHour = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b, '20');

            setRealStats({
                revenue: ordersToday.reduce((acc, o) => acc + (o.total_price || 0), 0),
                orders_count: ordersToday.length,
                conversion: 4.8,
                low_stock: (pData || []).filter(p => (p.variants?.reduce((a:any,v:any)=>a+(v.stock||0),0)||0) <= 5).length,
                avg_ticket: ordersToday.length > 0 ? ordersToday.reduce((acc, o) => acc + (o.total_price || 0), 0) / ordersToday.length : 0,
                cash: ordersToday.filter(o => o.payment_method === 'cash').reduce((acc, o) => acc + (o.total_price || 0), 0),
                transfer: ordersToday.filter(o => o.payment_method !== 'cash').reduce((acc, o) => acc + (o.total_price || 0), 0),
                healthy: (pData || []).length - (pData || []).filter(p => (p.variants?.reduce((a:any,v:any)=>a+(v.stock||0),0)||0) <= 5).length,
                total_products: (pData || []).length,
                total_balance: oData.reduce((acc, o) => acc + (o.total_price || 0), 0),
                peak_day: daysMap[topDay] || 'Lunes',
                peak_hour: `${topHour}:00 PM`,
                online_now: Math.floor(Math.random() * 3) + 1 // Simulado hasta tener Storefront Tracker
            });
        }
        if (lData) setActivities(lData.slice(0, 5));
    } catch (e) { console.error(e); }
  }, [token]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const kpis = [
    { 
        label: 'Ventas de hoy', value: realStats.revenue, icon: <Activity size={24}/>, color: "text-emerald-500", bg: "bg-emerald-500/10", trend: "Live", isCurrency: true,
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
              apiRequest<any[]>('/products', { token }),
              apiRequest<any[]>('/expenses', { token })
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
              apiRequest<any[]>('/products', { token }),
              apiRequest<any[]>('/orders', { token }),
              apiRequest<any[]>('/expenses', { token })
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

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20 px-4">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-8 overflow-visible">
            <div className="space-y-2 text-center xl:text-left">
                <div className="flex items-center justify-center xl:justify-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#00f2ff] animate-pulse" />
                    <span className={`text-[10px] font-black tracking-[0.3em] uppercase italic ${theme === 'dark' ? 'text-white/40' : 'text-[#004d4d]/60'}`}>Tú panel de control</span>
                </div>
                <h1 className={`text-4xl md:text-6xl font-black italic tracking-tighter leading-[1.4] py-4 overflow-visible transition-colors duration-500 ${theme === 'dark' ? 'text-white shadow-[0_0_30px_rgba(255,255,255,0.05)]' : 'text-[#001A1A]'}`}>
                    ¡Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-[#004d4d] inline-block pb-4 pr-2"> {companyName}</span>!
                </h1>
                <p className="text-gray-400 font-medium text-lg italic">¡Aquí tienes el resumen de tu negocio hoy! 🚀</p>
            </div>
            <div className="flex gap-4 shrink-0">
                <button onClick={handleDownloadReport} className={`h-16 px-10 rounded-full flex items-center justify-center gap-3 transition-all group ${theme === 'dark' ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' : 'bg-white border border-gray-100 text-[#004d4d] shadow-xl'}`}>
                    <FileText size={20} className="text-cyan"/><span className="font-black tracking-widest text-[10px] uppercase">Reporte diario</span>
                </button>
                <button onClick={() => setIsCustomReportModalOpen(true)} className={`h-16 px-10 rounded-full flex items-center justify-center gap-3 shadow-2xl transition-all ${theme === 'dark' ? 'bg-cyan/10 border border-cyan/20 text-cyan hover:bg-cyan/20' : 'bg-[#004d4d] text-white hover:bg-black'}`}>
                    <Calendar size={20} className="text-cyan"/><span className="font-black tracking-widest text-[10px] uppercase">Reportes del mes</span>
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, i) => (
                <div key={i}>
                    <AuroraMetricCard onClick={() => setSelectedMetric(kpi)}>
                        <MetricKPI {...kpi} dark={theme === 'dark'} />
                    </AuroraMetricCard>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <PremiumCard dark={true} className="lg:col-span-8 p-12 min-h-[450px]">
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                        <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_#10B981]" />
                        <span className="text-[10px] font-black text-emerald-500 tracking-[0.4em] uppercase">Tráfico en Tiempo Real</span>
                    </div>
                    <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Globe size={12} className="text-cyan" /> bayup.com.co/shop/{companyName.toLowerCase().replace(/ /g, '-')}
                    </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <h2 className="text-8xl font-black text-white italic tracking-tighter leading-none mb-4 flex items-center gap-4">
                        <AnimatedNumber value={realStats.online_now} type="simple" />
                        <span className="text-2xl text-cyan not-italic tracking-normal">Online</span>
                    </h2>
                    <p className="text-gray-400 text-base font-medium italic">Personas navegando tu tienda ahora</p>
                </div>
                <div className="mt-12 grid grid-cols-3 gap-8 pt-10 border-t border-white/5">
                    <div><p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2">Órdenes Hoy</p><span className="text-xl font-black text-white italic">{realStats.orders_count} Pedidos</span></div>
                    <div><p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2">Día Pico</p><span className="text-xl font-black text-white italic">{realStats.peak_day}</span></div>
                    <div><p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2">Hora Pico</p><span className={`text-xl font-black text-white italic ${theme === 'dark' ? 'shadow-[0_0_15px_rgba(0,242,255,0.3)]' : ''}`}>{realStats.peak_hour}</span></div>
                </div>
            </PremiumCard>
            <PremiumCard dark={theme === 'dark'} className="lg:col-span-4 p-10 flex flex-col justify-between">
                <div className="space-y-8">
                    <div className={`flex items-center justify-between border-b pb-6 ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                        <div className="flex items-center gap-3">
                            <Activity size={20} className="text-cyan"/>
                            <h4 className={`text-xs font-black tracking-widest ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Actividad Live</h4>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {activities.length > 0 ? activities.map((act, i) => (
                            <div key={i} className="flex items-center gap-4 group/item">
                                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-white/5 text-gray-400 group-hover/item:text-cyan' : 'bg-gray-50 text-gray-400 group-hover/item:text-[#004d4d]'}`}>
                                    <RefreshCw size={16}/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-[11px] font-black truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{act.user_name || 'Sistema'}</p>
                                    <p className="text-[9px] text-gray-500 truncate font-medium italic">{act.detail}</p>
                                </div>
                            </div>
                        )) : (<div className="py-12 text-center space-y-4"><div className="h-12 w-12 border-4 border-white/5 border-t-cyan rounded-full animate-spin mx-auto" /><p className="text-[10px] font-black text-gray-500">Sincronizando flujo...</p></div>)}
                    </div>
                </div>
                <button onClick={loadDashboardData} className={`w-full py-4 rounded-2xl text-[9px] font-black transition-all uppercase tracking-widest ${theme === 'dark' ? 'bg-white/5 text-gray-400 hover:bg-cyan/10 hover:text-cyan' : 'bg-gray-50 text-gray-400 hover:bg-[#004d4d] hover:text-white'}`}>Actualizar terminal</button>
            </PremiumCard>
        </div>

        {/* 4. SECCIÓN DE RENDIMIENTO SEMANAL (PLATINUM CHART) */}
        <PremiumCard dark={theme === 'dark'} className="p-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp size={18} className="text-cyan" />
                        <h4 className={`text-xs font-black tracking-[0.3em] uppercase ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Rendimiento Semanal</h4>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold italic tracking-widest uppercase">Visualización de ingresos de los últimos 7 días</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-cyan" /><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ventas Web</span></div>
                    <div className="flex items-center gap-2"><div className={`h-2 w-2 rounded-full ${theme === 'dark' ? 'bg-white/20' : 'bg-[#004d4d]'}`} /><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ventas POS</span></div>
                </div>
            </div>

            <div className="h-64 flex items-end justify-between gap-4 px-4 relative">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                    {[1, 2, 3, 4].map(i => <div key={i} className={`w-full h-px ${theme === 'dark' ? 'bg-white' : 'bg-gray-900'}`} />)}
                </div>

                {(() => {
                    const maxVal = Math.max(...weeklySales) || 1;
                    return weeklySales.map((val, i) => {
                        const day = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][i];
                        const heightPercent = (val / maxVal) * 100;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar relative z-10">
                                <div className="relative w-full flex flex-col items-center justify-end h-48">
                                    <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${heightPercent}%` }}
                                        transition={{ delay: i * 0.1, duration: 1, ease: "circOut" }}
                                        className="w-full max-w-[40px] bg-gradient-to-t from-[#004d4d] to-cyan rounded-t-2xl relative group-hover/bar:shadow-[0_0_30px_rgba(0,242,255,0.4)] transition-all duration-500"
                                    >
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover/bar:opacity-100 transition-all shadow-2xl border border-white/10 whitespace-nowrap z-50">
                                            $ {val.toLocaleString()}
                                        </div>
                                    </motion.div>
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${theme === 'dark' ? 'text-white/40 group-hover/bar:text-cyan' : 'text-gray-400 group-hover/bar:text-[#004d4d]'}`}>{day}</span>
                            </div>
                        );
                    });
                })()}
            </div>
        </PremiumCard>

        <MetricDetailModal isOpen={!!selectedMetric} onClose={() => setSelectedMetric(null)} metric={selectedMetric} />
        
        <AnimatePresence>
            {isCustomReportModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCustomReportModalOpen(false)} className="fixed inset-0 bg-[#001A1A]/95 backdrop-blur-xl" />
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-md rounded-[4rem] shadow-3xl p-12 z-10"><div className="text-center mb-10"><Calendar size={40} className="mx-auto text-[#004d4d] mb-4"/><h3 className="text-2xl font-black italic tracking-tighter text-[#001A1A]">Auditar mi negocio</h3><p className="text-xs text-gray-400 font-medium italic">Selecciona el rango de fechas para tu reporte.</p></div><div className="space-y-6"><div><label className="text-[9px] font-black text-gray-400 uppercase ml-2">Desde</label><input type="date" value={customRange.start} onChange={e => setCustomRange({...customRange, start: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold text-sm" /></div><div><label className="text-[9px] font-black text-gray-400 uppercase ml-2">Hasta</label><input type="date" value={customRange.end} onChange={e => setCustomRange({...customRange, end: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold text-sm" /></div></div><button onClick={handleGenerateCustomReport} className="w-full py-6 mt-10 bg-gray-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3"><Download size={18}/> Descargar Reporte</button></motion.div>
                </div>
            )}
        </AnimatePresence>
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
    return (
        <PremiumCard dark={dark} className="p-8 group h-full border-none shadow-none">
            <div className="flex justify-between items-start mb-6">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg group-hover:scale-110 border ${dark ? 'bg-white/5 border-white/10' : 'border-white/50 ' + bg} ${color}`}>
                    {icon}
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black tracking-wider ${
                    dark ? 'bg-white/5 text-white/40' : 'bg-gray-100 text-gray-400'
                }`}>
                    {trend}
                </div>
            </div>
            <div>
                <p className={`text-[10px] font-black tracking-tight mb-1.5 ${dark ? 'text-white/40' : 'text-gray-400'}`}>{label}</p>
                <h3 className={`text-3xl font-black tracking-tighter italic ${dark ? 'text-white' : 'text-gray-900'}`}>
                    <AnimatedNumber value={value} type={isCurrency ? 'currency' : isPercentage ? 'percentage' : 'simple'} />
                </h3>
            </div>
        </PremiumCard>
    );
}
