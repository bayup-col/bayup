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
  ArrowUpRight, ArrowDownRight, ShoppingBag, DollarSign, Wallet
} from 'lucide-react';
import { ActionButton } from "@/components/landing/ActionButton";
import OnboardingModal from '@/components/dashboard/OnboardingModal';
import MetricDetailModal from '@/components/dashboard/MetricDetailModal';

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
const PremiumCard = ({ children, className = "", dark = false }: { children: React.ReactNode, className?: string, dark?: boolean }) => {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [glare, setGlare] = useState({ x: 50, y: 50, op: 0 });

    const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const box = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - box.left;
        const y = e.clientY - box.top;
        setRotateX((y - box.height/2) / 20);
        setRotateY((box.width/2 - x) / 20);
        setGlare({ x: (x/box.width)*100, y: (y/box.height)*100, op: dark ? 0.15 : 0.1 });
    };

    return (
        <motion.div
            onMouseMove={handleMove}
            onMouseLeave={() => { setRotateX(0); setRotateY(0); setGlare(g => ({...g, op: 0})); }}
            animate={{ rotateX, rotateY, scale: rotateX !== 0 ? 1.02 : 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 25 }}
            className={`rounded-[3rem] border transition-all duration-500 relative overflow-hidden isolate ${dark ? 'bg-[#001A1A] border-white/5 shadow-2xl' : 'bg-white/40 backdrop-blur-xl border-white/80 shadow-xl'} ${className}`}
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
        >
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                 style={{ opacity: glare.op, background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, ${dark ? 'rgba(0,242,255,0.2)' : 'white'} 0%, transparent 60%)`, zIndex: 1 }} />
            <div style={{ transform: "translateZ(30px)", position: "relative", zIndex: 2 }} className="h-full">{children}</div>
            <div className={`absolute -bottom-20 -right-20 h-40 w-40 blur-[80px] rounded-full pointer-events-none ${dark ? 'bg-[#00f2ff]/10' : 'bg-[#004d4d]/5'}`} />
        </motion.div>
    );
};

// --- DASHBOARD PRINCIPAL ---
export default function DashboardPage() {
  const { userEmail, token } = useAuth();
  
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [stats] = useState({ revenue: 0, conversion: 0, active_orders: 0, low_stock: 0 });

  const loadActivities = useCallback(async () => {
    if (!token) return;
    try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://gallant-education-production-8b4a.up.railway.app';
        const res = await fetch(`${apiBase}/admin/logs`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const logs = await res.json();
            setActivities(logs.slice(0, 6));
        }
    } catch (e) { console.error("Sync Error"); }
  }, [token]);

  useEffect(() => { loadActivities(); }, [loadActivities]);

  const kpis = [
    { label: "Ventas de Hoy", value: stats.revenue, icon: <DollarSign size={24}/>, color: "text-emerald-600", bg: "bg-emerald-50", trend: "+0%", isCurrency: true },
    { label: "Órdenes Activas", value: stats.active_orders, icon: <ShoppingBag size={24}/>, color: "text-cyan-500", bg: "bg-cyan-50", trend: "Estable" },
    { label: "Tasa de Conversión", value: stats.conversion, icon: <TrendingUp size={24}/>, color: "text-purple-600", bg: "bg-purple-50", trend: "0%", isPercentage: true },
    { label: "Stock Crítico", value: stats.low_stock, icon: <Package size={24}/>, color: "text-rose-600", bg: "bg-rose-50", trend: "OK" },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20 animate-in fade-in duration-1000">
      
      {/* 1. SECCIÓN DE BIENVENIDA (HERO) */}
      <div className="flex flex-col xl:flex-row items-center gap-8">
        <div className="flex-1 space-y-4 text-center xl:text-left">
            <div className="flex items-center justify-center xl:justify-start gap-3">
                <div className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#00f2ff] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#004d4d]/60 italic">Terminal de Comando v2.0</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-[#001A1A]">
                VISTAZO <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-[#004d4d]">RÁPIDO</span>
            </h1>
            <p className="text-gray-400 font-medium text-lg italic max-w-2xl">
                Hola <span className="text-[#004d4d] font-bold">{userEmail?.split('@')[0]}</span>, ¡este es el resumen del día para ti! 👋
            </p>
        </div>
        <div className="flex gap-4 shrink-0">
            <ActionButton href="/dashboard/products/new" variant="outline" className="h-16 px-8 rounded-full border-2"><Package size={20} /> <span className="font-black uppercase tracking-widest text-[10px]">Nuevo Item</span></ActionButton>
            <ActionButton href="/dashboard/discounts" className="h-16 px-8 rounded-full bg-[#004d4d] text-white shadow-2xl hover:bg-black"><Zap size={20} className="text-cyan fill-cyan"/> <span className="font-black uppercase tracking-widest text-[10px]">Lanzar Oferta</span></ActionButton>
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
          <PremiumCard dark className="lg:col-span-8 p-12 flex flex-col md:flex-row items-center gap-12 group">
              <div className="relative shrink-0">
                  <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center shadow-[0_0_40px_rgba(0,242,255,0.3)] group-hover:scale-110 transition-transform duration-700">
                      <Bot size={64} className="text-cyan animate-pulse" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-emerald-500 rounded-full border-4 border-[#001A1A] flex items-center justify-center text-white shadow-xl animate-bounce">
                      <Sparkles size={18} fill="currentColor" />
                  </div>
              </div>
              <div className="flex-1 space-y-6 text-center md:text-left">
                  <span className="px-4 py-1.5 bg-cyan/10 text-cyan rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-cyan/20">Bayt Strategic Mind</span>
                  <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">Tu marca está escalando</h3>
                  <p className="text-gray-400 text-lg leading-relaxed italic">
                      &quot;He detectado que el <span className="text-white font-bold">85% de tus visitas</span> llegan vía dispositivos móviles. Sugiero optimizar las imágenes de tu catálogo para reducir el tiempo de carga en un 12%.&quot;
                  </p>
                  <div className="pt-4 flex flex-wrap justify-center md:justify-start gap-4">
                      <div className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[9px] font-black uppercase text-cyan tracking-widest">Viabilidad: 94%</div>
                      <div className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[9px] font-black uppercase text-emerald-400 tracking-widest">Impacto: Alto</div>
                  </div>
              </div>
          </PremiumCard>

          <PremiumCard className="lg:col-span-4 p-10 flex flex-col justify-between">
              <div className="space-y-8">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                      <div className="flex items-center gap-3">
                          <Activity size={20} className="text-[#004d4d]"/>
                          <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Actividad Live</h4>
                      </div>
                      <Link href="/dashboard/reports" className="text-[9px] font-black uppercase text-cyan hover:underline tracking-tighter">Ver Todo</Link>
                  </div>
                  <div className="space-y-6">
                      {activities.length > 0 ? activities.map((act, i) => (
                          <div key={i} className="flex items-center gap-4 group/item">
                              <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover/item:bg-[#004d4d] group-hover/item:text-cyan transition-all">
                                  <RefreshCw size={16} className="group-hover/item:rotate-180 transition-transform duration-700"/>
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-black text-gray-900 truncate uppercase">{act.user_name || 'Sistema'}</p>
                                  <p className="text-[9px] text-gray-400 truncate font-medium italic">{act.detail}</p>
                              </div>
                              <span className="text-[8px] font-bold text-gray-300 uppercase shrink-0">Hace poco</span>
                          </div>
                      )) : (
                          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                              <div className="h-12 w-12 rounded-full border-4 border-gray-50 border-t-cyan animate-spin" />
                              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Sincronizando flujo...</p>
                          </div>
                      )}
                  </div>
              </div>
              <button onClick={loadActivities} className="w-full py-4 mt-8 bg-gray-50 rounded-2xl text-[9px] font-black uppercase text-gray-400 hover:bg-[#004d4d] hover:text-white transition-all">Refrescar Terminal</button>
          </PremiumCard>
      </div>

      {/* 4. SECCIÓN DE ACCESOS DIRECTOS PREMIUM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <AccessCard label="Inventario Maestro" sub="Control de 360° de tus productos" href="/dashboard/products" icon={<Package size={32}/>} />
          <AccessCard label="Cartera & Finanzas" sub="Gestión de flujo de caja real" href="/dashboard/reports/cuentas" icon={<Wallet size={32}/>} />
          <AccessCard label="Venta Omnicanal" sub="WhatsApp, Web y POS Físico" href="/dashboard/invoicing" icon={<Globe size={32}/>} />
      </div>

      <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} onComplete={() => {}} />
      <MetricDetailModal 
        isOpen={!!selectedMetric} 
        onClose={() => setSelectedMetric(null)} 
        metric={selectedMetric} 
      />
    </div>
  );
}

// --- SUB-COMPONENTES AUXILIARES ---

function MetricKPI({ label, value, icon, color, bg, trend, isCurrency = false, isPercentage = false }: any) {
    return (
        <PremiumCard className="p-8 group h-full">
            <div className="flex justify-between items-start mb-6">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg group-hover:scale-110 border border-white/50 ${bg} ${color}`}>
                    {icon}
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                    {trend}
                </div>
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">{label}</p>
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter">
                    {isCurrency && "$ "}<AnimatedNumber value={value} type={isPercentage ? 'percentage' : 'simple'} />
                </h3>
            </div>
        </PremiumCard>
    );
}

function AccessCard({ label, sub, href, icon }: any) {
    return (
        <Link href={href}>
            <PremiumCard className="p-10 group cursor-pointer hover:border-cyan/30 transition-all overflow-hidden h-full">
                <div className="flex items-center gap-8 relative z-10">
                    <div className="h-20 w-20 rounded-[2rem] bg-gray-900 text-white flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(0,242,255,0.3)] border-2 border-white/5 group-hover:border-cyan/50">
                        {React.cloneElement(icon, { className: "text-white group-hover:text-cyan transition-colors" })}
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">{label}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{sub}</p>
                    </div>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all">
                    <ArrowRight size={24} className="text-cyan" />
                </div>
            </PremiumCard>
        </Link>
    );
}
