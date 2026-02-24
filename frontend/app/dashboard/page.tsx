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
  MessageSquare
} from 'lucide-react';
import { ActionButton } from "@/components/landing/ActionButton";
import OnboardingModal from '@/components/dashboard/OnboardingModal';
import OnboardingWizard from '@/components/dashboard/OnboardingWizard';
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

// --- DASHBOARD PRINCIPAL ---
export default function DashboardPage() {
  const { userEmail, token } = useAuth();
  const { showToast } = useToast();
  
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<any>(null);

  useEffect(() => {
    // Verificar si ya completó el onboarding
    const completed = localStorage.getItem('bayup_onboarding_completed');
    if (!completed) {
        setTimeout(() => setIsWizardOpen(true), 1500); // Pequeño delay para que cargue el dashboard de fondo
    }
  }, []);

  const handleWizardComplete = () => {
      setIsWizardOpen(false);
      localStorage.setItem('bayup_onboarding_completed', 'true');
      showToast("¡Felicidades! Tu terminal Bayup está lista para operar. 🚀", "success");
  };
  const [activities, setActivities] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState('...');
  const [realStats, setRealStats] = useState({ 
    revenue: 0, 
    orders_count: 0, 
    conversion: 0, 
    low_stock: 0,
    avg_ticket: 0,
    out_of_stock: 0
  });

  useEffect(() => {
    // Intentar cargar nombre de empresa real desde los ajustes generales
    const loadName = () => {
        const savedData = localStorage.getItem('bayup_general_settings');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.identity?.name && parsed.identity.name.trim() !== "") {
                    setCompanyName(parsed.identity.name);
                } else {
                    setCompanyName('Mi Negocio');
                }
            } catch (e) { 
                console.error("Error al parsear ajustes de empresa:", e);
                setCompanyName('Mi Negocio');
            }
        } else {
            setCompanyName('Mi Negocio');
        }
    };

    loadName();

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
        const [products, orders, logs] = await Promise.all([
            apiRequest<any[]>('/products', { token }),
            apiRequest<any[]>('/orders', { token }),
            apiRequest<any[]>('/admin/logs', { token })
        ]);

        if (logs) setActivities(logs.slice(0, 6));

        // Calcular Estadísticas Reales
        const today = new Date().toISOString().split('T')[0];
        const ordersToday = orders?.filter(o => o.created_at.startsWith(today)) || [];
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
            title: "Inventario en riesgo",
            message: `He detectado que tienes ${low_stock} productos con stock crítico. Reabastece estas unidades pronto para evitar perder ventas esta semana.`,
            viability: "98%",
            impact: "Crítico"
        };
    }
    
    if (revenue === 0) {
        return {
            title: "Impulso de ventas",
            message: "Hoy el flujo está tranquilo. Sugiero enviar un mensaje masivo por WhatsApp a tus clientes habituales con una oferta relámpago de 24 horas.",
            viability: "85%",
            impact: "Alto"
        };
    }

    if (orders_count > 5) {
        return {
            title: "Optimización de logística",
            message: `Tienes ${orders_count} pedidos pendientes por procesar. Sugiero agrupar los despachos por zona para reducir costos de envío hoy.`,
            viability: "92%",
            impact: "Medio"
        };
    }

    if (avg_ticket < 50000 && revenue > 0) {
        return {
            title: "Estrategia de ticket",
            message: "Tu ticket promedio está por debajo de la meta. Intenta crear 'Kits' o combos de productos para incentivar compras de mayor valor.",
            viability: "90%",
            impact: "Alto"
        };
    }

    return {
        title: "Oportunidad de crecimiento 🚀",
        message: "Tu rendimiento es estable. He detectado que el 85% de tus visitas son móviles; optimizar tus imágenes actuales podría subir la conversión un 12%.",
        viability: "94%",
        impact: "Alto"
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

      const handleViewStore = () => {
          const origin = window.location.origin;
          const savedSettings = localStorage.getItem('bayup_general_settings');
          let slug = 'preview';
          if (savedSettings) {
              try {
                  const parsed = JSON.parse(savedSettings);
                  if (parsed.identity?.slug) slug = parsed.identity.slug;
              } catch(e){}
          }
          window.open(`${origin}/shop/${slug}`, '_blank');
      };
  
      return (
          <div className="max-w-[1600px] mx-auto space-y-10 pb-20 animate-in fade-in duration-1000">
            
            {/* 1. SECCIÓN DE BIENVENIDA (HERO) */}
            <div className="flex flex-col xl:flex-row items-center gap-8">
              <div className="flex-1 space-y-4 text-center xl:text-left">
                  <div className="flex items-center justify-center xl:justify-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#00f2ff] animate-pulse" />
                      <span className="text-[10px] font-black tracking-[0.3em] text-[#004d4d]/60 italic">Tú panel de control</span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter leading-none text-[#001A1A] pb-2 overflow-visible">
                      ¡Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-[#004d4d] inline-block px-1 pr-4">{companyName}</span>!
                  </h1>
                  <p className="text-gray-400 font-medium text-lg italic max-w-2xl">
                      ¡Aquí tienes el resumen de tu negocio hoy! 🚀
                  </p>
              </div>
              <div className="flex gap-4 shrink-0 relative z-20">
                  <button onClick={handleDownloadReport} className="h-16 px-10 bg-[#004d4d] text-white rounded-full flex items-center justify-center gap-3 shadow-2xl hover:bg-black transition-all group">
                      <FileText size={20} className="text-cyan transition-transform group-hover:scale-110"/> 
                      <span className="font-black tracking-widest text-[10px]">Reporte diario</span>
                  </button>
              </div>
            </div>
        {/* 2. GRID DE MÉTRICAS MAESTRAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, i) => (
              <div key={i} onClick={() => setSelectedMetric(kpi)} className="cursor-pointer">
                  <MetricKPI {...kpi} />
              </div>
          ))}
      </div>

      {/* 3. CORE ANALYTICS & BAYT INTELLIGENCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <PremiumCard dark className="lg:col-span-8 p-12 flex flex-col items-center justify-center group min-h-[380px]">
              {/* CABECERA CENTRADA */}
              <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative shrink-0">
                      <div className="h-20 w-20 bg-gray-900 rounded-[2.5rem] border-2 border-[#00f2ff]/50 flex items-center justify-center shadow-[0_0_40px_rgba(0,242,255,0.3)] group-hover:scale-110 transition-transform duration-700">
                          <Bot size={40} className="text-cyan animate-pulse" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-7 w-7 bg-emerald-500 rounded-full border-4 border-[#001A1A] flex items-center justify-center text-white shadow-xl animate-bounce">
                          <Sparkles size={12} fill="currentColor" />
                      </div>
                  </div>
                  <span className="px-4 py-1 bg-cyan/10 text-cyan rounded-full text-[8px] font-black tracking-[0.1em] border border-cyan/20">Tu asesor inteligente</span>
              </div>

              {/* CONTENIDO DE VALOR EN EL CENTRO */}
              <div className="mt-10 mb-10 space-y-6 flex flex-col items-center text-center w-full max-w-2xl">
                  <h3 className="text-3xl font-black text-white italic tracking-tighter leading-tight">{advisorInsight.title}</h3>
                  <p className="text-gray-400 text-base leading-relaxed italic px-4">
                      &quot;{advisorInsight.message}&quot;
                  </p>
              </div>

              {/* ETIQUETAS DE IMPACTO AL FINAL */}
              <div className="flex flex-wrap justify-center gap-4">
                  <div className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[9px] font-black tracking-widest">Viabilidad: {advisorInsight.viability}</div>
                  <div className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[9px] font-black tracking-widest">Impacto: {advisorInsight.impact}</div>
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

                  const weeklyData = [1200000, 2500000, 1800000, 4200000, 2100000, 3100000, 1500000]; // Ventas reales (Mock)
                  const maxVal = Math.max(...weeklyData);

                  return weeklyData.map((val, i) => {
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

      <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} onComplete={() => {}} />
      <OnboardingWizard isOpen={isWizardOpen} onComplete={handleWizardComplete} />
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
