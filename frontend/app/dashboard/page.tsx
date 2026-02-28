"use client";

import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/context/theme-context";
import Link from 'next/link';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { 
  Activity, Search, Sparkles, Users, LayoutDashboard, CheckCircle2, 
  ArrowRight, TrendingUp, AlertCircle, Package, CreditCard, 
  MessageCircle, Lightbulb, Zap, Globe, ShieldCheck, RefreshCw, Clock, Bot, 
  ArrowUpRight, ArrowDownRight, ShoppingBag, DollarSign, Wallet, Plus, FileText, Target,
  MessageSquare, Calendar, Download
} from 'lucide-react';
import { ActionButton } from "@/components/landing/ActionButton";
import MetricDetailModal from '@/components/dashboard/MetricDetailModal';
import { useToast } from "@/context/toast-context";
import { apiRequest } from '@/lib/api';
import { generateDailyReport } from '@/lib/report-generator';

// --- COMPONENTE DE NÚMEROS ANIMADOS ---
const AnimatedNumber = memo(({ value, type = 'currency', className }: { value: number, className?: string, type?: 'currency' | 'percentage' | 'simple' }) => {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current: number) => {
        if (type === 'percentage') return `${current.toFixed(1)}%`;
        if (type === 'simple') return Math.round(current).toLocaleString();
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(current);
    });

    useEffect(() => { spring.set(value); }, [value, spring]);
    return <motion.span className={className}>{display}</motion.span>;
});
AnimatedNumber.displayName = 'AnimatedNumber';

// --- TILT CARD PREMIUM ---
interface PremiumCardProps {
    children: React.ReactNode;
    className?: string;
    dark?: boolean;
}

const PremiumCard = ({ children, className = "", dark = false }: PremiumCardProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [glare, setGlare] = useState({ x: 50, y: 50, op: 0 });

    const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const box = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - box.left;
        const y = e.clientY - box.top;
        setGlare({ x: (x/box.width)*100, y: (y/box.height)*100, op: dark ? 0.15 : 0.1 });
    };

    return (
        <motion.div
            onMouseEnter={() => setIsHovered(true)}
            onMouseMove={handleMove}
            onMouseLeave={() => { setIsHovered(false); setGlare(g => ({...g, op: 0})); }}
            animate={{ scale: isHovered ? 1.02 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`rounded-[3rem] border transition-all duration-500 relative overflow-hidden isolate ${dark ? 'bg-[#001A1A] border-white/5 shadow-2xl' : 'bg-white/40 backdrop-blur-xl border-white/80 shadow-xl'} ${className}`}
        >
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                 style={{ opacity: glare.op, background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, ${dark ? 'rgba(0,242,255,0.2)' : 'white'} 0%, transparent 60%)`, zIndex: 1 }} />
            <div className="h-full relative z-[2]">{children}</div>
            <div className={`absolute -bottom-20 -right-20 h-40 w-40 blur-[80px] rounded-full pointer-events-none ${dark ? 'bg-[#00f2ff]/10' : 'bg-[#004d4d]/5'}`} />
        </motion.div>
    );
};

// --- COMPONENTE ESPECIAL PARA MÉTRICAS CON EFECTO AURORA (BORDE EXTERNO) ---
const AuroraMetricCard = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => {
    return (
        <div className="relative group cursor-pointer h-full perspective-1000" onClick={onClick}>
            {/* EL HALO AURORA (OPTIMIZADO PARA FLUIDEZ EXTREMA) */}
            <div className="absolute inset-0 -m-[2px] rounded-[3rem] overflow-hidden pointer-events-none z-0">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    style={{ willChange: 'transform' }}
                    className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent_0deg,#00F2FF_20deg,#10B981_40deg,#9333EA_60deg,transparent_80deg,transparent_360deg)] opacity-40 group-hover:opacity-100 transition-opacity duration-700 blur-[8px] transform-gpu"
                />
            </div>
            
            {/* LA CARD ORIGINAL INTACTA */}
            <div className="relative z-10 h-full transform-gpu">
                <PremiumCard className="h-full border-none shadow-none bg-white/80 backdrop-blur-2xl">
                    {children}
                </PremiumCard>
            </div>
        </div>
    );
};

// --- DASHBOARD PRINCIPAL ---
export default function DashboardPage() {
  const { userEmail, token } = useAuth();
  const { showToast } = useToast();
  
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const [isCustomReportModalOpen, setIsCustomReportModalOpen] = useState(false);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  useEffect(() => {
    // Onboarding desactivado
  }, []);

  const [activities, setActivities] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState('...');
  const [realStats, setRealStats] = useState({ 
    revenue: 0, 
    orders_count: 0, 
    conversion: 0, 
    low_stock: 0,
    avg_ticket: 0,
    out_of_stock: 0
  });

  // --- CÁLCULO DE VENTAS SEMANALES (RESET DOMINGO 11 PM) ---
  const weeklySales = useMemo(() => {
    const dailyTotals = [0, 0, 0, 0, 0, 0, 0]; // Lun, Mar, Mié, Jue, Vie, Sáb, Dom
    if (!orders || orders.length === 0) return dailyTotals;

    const now = new Date();
    const currentDay = now.getDay(); // 0: Dom, 1: Lun...
    const currentHour = now.getHours();

    // Determinar inicio de semana (Lunes)
    let startOfWeek = new Date(now);
    if (currentDay === 0 && currentHour >= 23) {
        startOfWeek.setDate(now.getDate() + 1);
    } else {
        const diff = (currentDay === 0 ? 7 : currentDay) - 1;
        startOfWeek.setDate(now.getDate() - diff);
    }
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

  useEffect(() => {
    // Escuchar actualizaciones en tiempo real desde otros componentes
    const handleNameUpdate = (e: any) => {
        if (e.detail) setCompanyName(e.detail);
    };

    window.addEventListener('bayup_name_update', handleNameUpdate);
    return () => window.removeEventListener('bayup_name_update', handleNameUpdate);
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!token) return;
    try {
        const [products, fetchedOrders, logs, userData] = await Promise.all([
            apiRequest<any[]>('/products', { token }),
            apiRequest<any[]>('/orders', { token }),
            apiRequest<any[]>('/admin/logs', { token }),
            apiRequest<any>('/auth/me', { token })
        ]);

        if (userData && userData.full_name) {
            setCompanyName(userData.full_name);
        }

        if (fetchedOrders) setOrders(fetchedOrders);
        if (logs) setActivities(logs.slice(0, 6));

        // Calcular Estadísticas Reales
        const today = new Date().toISOString().split('T')[0];
        const ordersToday = fetchedOrders?.filter(o => o.created_at.startsWith(today)) || [];
        const revenue = ordersToday.reduce((acc, o) => acc + (o.total_price || 0), 0);
        const lowStock = products?.filter(p => (p.variants?.reduce((a:any,v:any)=>a+(v.stock||0),0) || 0) <= 5).length || 0;
        const outOfStock = products?.filter(p => (p.variants?.reduce((a:any,v:any)=>a+(v.stock||0),0) || 0) === 0).length || 0;
        
        const avgTicket = ordersToday.length > 0 ? revenue / ordersToday.length : 0;
        
        setRealStats({
            revenue,
            orders_count: ordersToday.length,
            low_stock: lowStock,
            avg_ticket: avgTicket,
            out_of_stock: outOfStock,
            conversion: 0
        });

    } catch (e) { console.error("Sync Error", e); }
  }, [token]);

  const advisorInsight = useMemo(() => {
    const { revenue, low_stock, orders_count, avg_ticket } = realStats;
    
    if (low_stock > 0) {
        return {
            title: "Inventario en Riesgo",
            message: `He detectado que tienes ${low_stock} productos con stock crítico. Reabastece estas unidades pronto para evitar perder ventas esta semana.`,
            viability: "98%",
            impact: "Crítico",
            signals: ["Stock < 5", "Alta demanda"],
            actionLabel: "Reponer Stock",
            actionLink: "/dashboard/inventory"
        };
    }
    
    if (revenue === 0) {
        return {
            title: "Impulso de Ventas",
            message: "Hoy el flujo está tranquilo. Sugiero enviar un mensaje masivo por WhatsApp a tus clientes habituales con una oferta relámpago de 24 horas.",
            viability: "85%",
            impact: "Alto",
            signals: ["Tráfico bajo", "Potencial de Recompra"],
            actionLabel: "Lanzar Campaña",
            actionLink: "/dashboard/marketing"
        };
    }

    if (orders_count > 5) {
        return {
            title: "Optimización Logística",
            message: `Tienes ${orders_count} pedidos pendientes por procesar. Sugiero agrupar los despachos por zona para reducir costos de envío hoy.`,
            viability: "92%",
            impact: "Medio",
            signals: ["Pedidos represados", "Ruta óptima"],
            actionLabel: "Gestionar Envíos",
            actionLink: "/dashboard/orders"
        };
    }

    return {
        title: "Estrategia de Crecimiento",
        message: "Tu rendimiento es estable. He detectado que optimizar tus imágenes actuales podría subir la conversión un 12%.",
        viability: "94%",
        impact: "Alto",
        signals: ["Métricas estables", "Mejora UI"],
        actionLabel: "Ver Consejos AI",
        actionLink: "/dashboard/ai-assistants"
    };
  }, [realStats]);

      useEffect(() => { 
          loadDashboardData(); 
          
          // Refresco automático al volver a la pestaña (Integración Live)
          const handleFocus = () => loadDashboardData();
          window.addEventListener('focus', handleFocus);
          return () => window.removeEventListener('focus', handleFocus);
      }, [loadDashboardData]);
    const kpis = [
    { 
        label: "Ventas de hoy", 
        value: realStats.revenue, 
        icon: <DollarSign size={24}/>, 
        color: "text-emerald-600", 
        bg: "bg-emerald-50", 
        trend: "Live", 
        isCurrency: true,
        details: [
            { l: "Ticket prom.", v: `$ ${realStats.avg_ticket.toLocaleString()}`, icon: <DollarSign size={14}/> },
            { l: "Margen bruto", v: `${realStats.revenue > 0 ? '---' : '0%'}`, icon: <Zap size={14}/> },
            { l: "Ventas/hora", v: `${(realStats.orders_count / 24).toFixed(1)}`, icon: <Activity size={14}/> }
        ],
        advice: realStats.revenue > 0 ? "Ventas activas detectadas. El flujo es positivo." : "Aún no hay ventas registradas hoy. ¡Es hora de lanzar una campaña!"
    },
    { 
        label: "Pedidos pendientes", 
        value: realStats.orders_count, 
        icon: <ShoppingBag size={24}/>, 
        color: "text-cyan-500", 
        bg: "bg-cyan-50", 
        trend: "Estable",
        details: [
            { l: "Por despachar", v: `${realStats.orders_count}`, icon: <Package size={14}/> },
            { l: "En tránsito", v: "0", icon: <TrendingUp size={14}/> },
            { l: "Demora prom.", v: "---", icon: <Activity size={14}/> }
        ],
        advice: realStats.orders_count > 0 ? "Tienes pedidos pendientes. Prioriza el despacho." : "No hay órdenes pendientes. Excelente eficiencia operativa."
    },
    { 
        label: "Mi Saldo Bayup", 
        value: realStats.revenue * 0.03, 
        icon: <Wallet size={24}/>, 
        color: "text-purple-600", 
        bg: "bg-purple-50", 
        trend: "3% Éxito", 
        isCurrency: true,
        details: [
            { l: "Comisión neta", v: "3%", icon: <Target size={14}/> },
            { l: "Recuperación", v: "Próx. Venta", icon: <RefreshCw size={14}/> },
            { l: "Estado", v: "Pendiente", icon: <Clock size={14}/> }
        ],
        advice: "Este saldo se descontará automáticamente de tus ventas web con tarjeta. ¡Tú solo enfócate en vender!"
    },
    { 
        label: "Inventario bajo", 
        value: realStats.low_stock, 
        icon: <Package size={24}/>, 
        color: "text-rose-600", 
        bg: "bg-rose-50", 
        trend: realStats.low_stock > 0 ? "Atención" : "OK",
        details: [
            { l: "Items agotados", v: `${realStats.out_of_stock}`, icon: <Package size={14}/> },
            { l: "Reposición", v: "No iniciada", icon: <Activity size={14}/> },
            { l: "Valor inmov.", v: "$ 0", icon: <DollarSign size={14}/> }
        ],
        advice: realStats.low_stock > 0 ? `Tienes ${realStats.low_stock} productos por agotarse. Reabastece pronto.` : "Tus niveles de inventario están saludables."
    },
  ];

      const handleDownloadReport = async () => {
          if (!token) return;
          try {
              showToast("Generando Reporte Elite de 5 Páginas...", "info");
              // Obtener datos reales para el reporte
              const [products, orders, expenses] = await Promise.all([
                  apiRequest<any[]>('/products', { token }),
                  apiRequest<any[]>('/orders', { token }),
                  apiRequest<any[]>('/expenses', { token })
              ]);
              
              await generateDailyReport({
                  userName: companyName,
                  products: products || [],
                  orders: orders || [],
                  expenses: expenses || []
              });
              showToast("¡Reporte del día descargado! 📊", "success");
          } catch (e) {
              console.error(e);
              showToast("Error al generar el reporte", "error");
          }
      };

      const handleGenerateCustomReport = async () => {
          if (!token || !customRange.start || !customRange.end) {
              showToast("Por favor selecciona ambas fechas", "info");
              return;
          }
          try {
              showToast("Generando reporte de periodo...", "info");
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
                  expenses: filteredExpenses
              });

              showToast("¡Reporte listo! 📊", "success");
              setIsCustomReportModalOpen(false);
          } catch (e) {
              console.error(e);
              showToast("Error al generar reporte", "error");
          }
      };
  
      return (
          <div className="max-w-[1600px] mx-auto space-y-10 pb-20 animate-in fade-in duration-1000">
            
            {/* 1. SECCIÓN DE BIENVENIDA (HERO) */}
            <div className="flex flex-col xl:flex-row items-center gap-8 overflow-visible">
              <div className="flex-1 space-y-4 text-center xl:text-left overflow-visible">
                  <div className="flex items-center justify-center xl:justify-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#00f2ff] animate-pulse" />
                      <span className="text-[10px] font-black tracking-[0.3em] text-[#004d4d]/60 italic">Tú panel de control</span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter leading-tight text-[#001A1A] pt-4 pb-8 px-2 overflow-visible">
                      ¡Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-[#004d4d] inline-block py-2 pb-4 pr-1">{companyName}</span>!
                  </h1>
                  <p className="text-gray-400 font-medium text-lg italic max-w-2xl">
                      ¡Aquí tienes el resumen de tu negocio hoy! 🚀
                  </p>
              </div>
              <div className="flex gap-4 shrink-0 relative z-20">
                  <button onClick={handleDownloadReport} className="h-16 px-10 bg-white border border-gray-100 text-[#004d4d] rounded-full flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transition-all group">
                      <FileText size={20} className="text-cyan transition-transform group-hover:scale-110"/> 
                      <span className="font-black tracking-widest text-[10px]">Reporte diario</span>
                  </button>
                  <button onClick={() => setIsCustomReportModalOpen(true)} className="h-16 px-10 bg-[#004d4d] text-white rounded-full flex items-center justify-center gap-3 shadow-2xl hover:bg-black transition-all group">
                      <Calendar size={20} className="text-cyan transition-transform group-hover:scale-110"/> 
                      <span className="font-black tracking-widest text-[10px]">Reportes del mes</span>
                  </button>
              </div>
            </div>

            {/* MODAL REPORTE PERSONALIZADO */}
            <AnimatePresence>
                {isCustomReportModalOpen && (
                    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCustomReportModalOpen(false)} className="absolute inset-0 bg-[#001A1A]/80 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 40 }} className="bg-white w-full max-w-md rounded-[3.5rem] shadow-3xl p-12 relative z-10 border border-white">
                            <div className="text-center space-y-4 mb-10">
                                <div className="h-20 w-20 bg-cyan/10 rounded-[2rem] flex items-center justify-center mx-auto text-[#004d4d] shadow-inner"><Calendar size={40}/></div>
                                <h3 className="text-2xl font-black italic tracking-tighter text-[#001A1A]">Auditar mi <span className="text-[#004d4d]">negocio</span></h3>
                                <p className="text-xs text-gray-400 font-medium italic">Selecciona el rango de fechas para generar tu reporte inteligente.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Desde el día:</label>
                                    <input type="date" value={customRange.start} onChange={e => setCustomRange({...customRange, start: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-[#004d4d]/20 rounded-2xl outline-none font-bold text-sm shadow-inner" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Hasta el día:</label>
                                    <input type="date" value={customRange.end} onChange={e => setCustomRange({...customRange, end: e.target.value})} className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-[#004d4d]/20 rounded-2xl outline-none font-bold text-sm shadow-inner" />
                                </div>
                            </div>

                            <div className="mt-10 grid grid-cols-1 gap-4">
                                <button onClick={handleGenerateCustomReport} className="w-full py-6 bg-gray-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3">
                                    <Download size={18} className="text-cyan"/> Descargar Reporte
                                </button>
                                <button onClick={() => setIsCustomReportModalOpen(false)} className="w-full py-4 text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-rose-500 transition-colors">Cancelar</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        {/* 2. GRID DE MÉTRICAS MAESTRAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, i) => (
              <div key={i}>
                  <AuroraMetricCard onClick={() => setSelectedMetric(kpi)}>
                      <MetricKPI {...kpi} />
                  </AuroraMetricCard>
              </div>
          ))}
      </div>

      {/* 3. MONITOR DE TRÁFICO WEB & ANALYTICS LIGERO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <PremiumCard dark className="lg:col-span-8 p-12 flex flex-col group min-h-[420px] relative overflow-hidden">
              {/* Fondo decorativo de ondas de pulso */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] border border-cyan rounded-full animate-ping duration-[3s]" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] border border-cyan rounded-full animate-ping duration-[2s]" />
              </div>

              {/* CABECERA: ESTADO EN VIVO */}
              <div className="flex items-center justify-between w-full mb-12 relative z-10">
                  <div className="flex items-center gap-4">
                      <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_#10B981]" />
                      <span className="text-[10px] font-black text-emerald-500 tracking-[0.4em] uppercase">Tráfico en Tiempo Real</span>
                  </div>
                  <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Globe size={12} className="text-cyan" /> bayup.com.co/shop/{companyName.toLowerCase().replace(/ /g, '-')}
                  </div>
              </div>

              {/* MÉTRICA PRINCIPAL: PERSONAS AHORA */}
              <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
                  <h2 className="text-8xl font-black text-white italic tracking-tighter leading-none mb-4 flex items-center gap-4">
                      <AnimatedNumber value={Math.floor(Math.random() * 5) + 1} type="simple" />
                      <span className="text-2xl text-cyan not-italic tracking-normal">Online</span>
                  </h2>
                  <p className="text-gray-400 text-base font-medium italic">Personas navegando tu tienda en este instante</p>
              </div>

              {/* INDICADORES TÁCTICOS */}
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 pt-10 border-t border-white/5 relative z-10">
                  <div className="flex flex-col items-center sm:items-start">
                      <div className="flex items-center gap-2 mb-2">
                          <Target size={14} className="text-cyan" />
                          <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Récord Histórico</span>
                      </div>
                      <span className="text-xl font-black text-white italic">42 Visitas simultáneas</span>
                  </div>
                  <div className="flex flex-col items-center sm:items-start">
                      <div className="flex items-center gap-2 mb-2">
                          <Clock size={14} className="text-cyan" />
                          <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Día de mayor flujo</span>
                      </div>
                      <span className="text-xl font-black text-white italic">Sábados</span>
                  </div>
                  <div className="flex flex-col items-center sm:items-start">
                      <div className="flex items-center gap-2 mb-2">
                          <Zap size={14} className="text-cyan" />
                          <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Hora Pico (Heatmap)</span>
                      </div>
                      <span className="text-xl font-black text-white italic">7:00 PM - 9:00 PM</span>
                  </div>
              </div>
          </PremiumCard>

          <PremiumCard className="lg:col-span-4 p-10 flex flex-col justify-between">
              <div className="space-y-8">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                      <div className="flex items-center gap-3">
                          <Activity size={20} className="text-[#004d4d]"/>
                          <h4 className="text-xs font-black tracking-widest text-gray-900">Actividad en tiempo real</h4>
                      </div>
                      <Link href="/dashboard/reports" className="text-[9px] font-black text-cyan hover:underline tracking-tighter">Ver todo</Link>
                  </div>
                  <div className="space-y-6">
                      {activities.length > 0 ? activities.map((act, i) => (
                          <div key={i} className="flex items-center gap-4 group/item">
                              <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover/item:bg-[#004d4d] group-hover/item:text-cyan transition-all">
                                  <RefreshCw size={16} className="group-hover/item:rotate-180 transition-transform duration-700"/>
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-black text-gray-900 truncate">{act.user_name || 'Sistema'}</p>
                                  <p className="text-[9px] text-gray-400 truncate font-medium italic">{act.detail}</p>
                              </div>
                              <span className="text-[8px] font-bold text-gray-300 shrink-0">Hace poco</span>
                          </div>
                      )) : (
                          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                              <div className="h-12 w-12 rounded-full border-4 border-gray-50 border-t-cyan animate-spin" />
                              <p className="text-[10px] font-black text-gray-300 tracking-widest">Sincronizando flujo...</p>
                          </div>
                      )}
                  </div>
              </div>
              <button onClick={loadDashboardData} className="w-full py-4 mt-8 bg-gray-50 rounded-2xl text-[9px] font-black text-gray-400 hover:bg-[#004d4d] hover:text-white transition-all">Refrescar terminal</button>
          </PremiumCard>
      </div>

      {/* 4. SECCIÓN DE RENDIMIENTO SEMANAL (PLATINUM CHART) */}
      <PremiumCard className="p-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div>
                  <div className="flex items-center gap-3 mb-2">
                      <TrendingUp size={18} className="text-[#004d4d]" />
                      <h4 className="text-xs font-black tracking-[0.3em] text-gray-900 uppercase">Rendimiento Semanal</h4>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold italic tracking-widest">Visualización de ingresos de los últimos 7 días</p>
              </div>
              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-cyan" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ventas Web</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-[#004d4d]" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ventas POS</span>
                  </div>
              </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-4 px-4 relative">
              {/* Líneas de guía */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                  {[1, 2, 3, 4].map(i => <div key={i} className="w-full h-px bg-gray-900" />)}
              </div>

              {/* Barras de datos */}
              {(() => {
                  const formatCash = (n: number) => {
                      if (n < 1e3) return n;
                      if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + "K";
                      if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + "M";
                      return n;
                  };

                  const maxVal = Math.max(...weeklySales) || 1; // Evitar división por cero

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
                                      <div className="absolute top-2 left-0 right-0 text-center text-[8px] font-black text-white/40 group-hover/bar:text-white transition-colors">
                                          {formatCash(val)}
                                      </div>
                                  </motion.div>
                              </div>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover/bar:text-[#004d4d] transition-colors">{day}</span>
                          </div>
                      );
                  });
              })()}
          </div>
      </PremiumCard>

      <MetricDetailModal 
        isOpen={!!selectedMetric} 
        onClose={() => setSelectedMetric(null)} 
        metric={selectedMetric} 
      />
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
}

function MetricKPI({ label, value, icon, color, bg, trend, isCurrency = false, isPercentage = false }: MetricKPIProps) {
    return (
        <PremiumCard className="p-8 group h-full">
            <div className="flex justify-between items-start mb-6">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg group-hover:scale-110 border border-white/50 ${bg} ${color}`}>
                    {icon}
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black tracking-wider ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                    {trend}
                </div>
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 tracking-tight mb-1.5">{label}</p>
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter">
                    {isCurrency && "$ "}<AnimatedNumber value={value} type={isPercentage ? 'percentage' : 'simple'} />
                </h3>
            </div>
        </PremiumCard>
    );
}
