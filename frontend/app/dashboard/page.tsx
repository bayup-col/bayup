"use client";

import React, { useState, useEffect, memo, useMemo } from 'react';
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/context/theme-context";
import Link from 'next/link';
import { motion, AnimatePresence, Variants, useSpring, useTransform } from 'framer-motion';
import { 
  Activity, Search, Sparkles, Users, LayoutDashboard, CheckCircle2, 
  ArrowRight, TrendingUp, AlertCircle, Package, CreditCard, 
  MessageCircle, Lightbulb, Zap, Globe, ShieldCheck, RefreshCw, Clock
} from 'lucide-react';
import { ActionButton } from "@/components/landing/ActionButton";
import OnboardingModal from '@/components/dashboard/OnboardingModal';

// --- COMPONENTE DE NÚMEROS ANIMADOS (MEMOIZADO) ---
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

// --- TILT CARD OPTIMIZADO (MEMOIZADO) ---
const TiltCard = memo(({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [glare, setGlare] = useState({ x: 50, y: 50, op: 0 });

    const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (window.matchMedia('(pointer: coarse)').matches) return;
        const box = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - box.left;
        const y = e.clientY - box.top;
        setRotateX((y - box.height/2) / 25);
        setRotateY((box.width/2 - x) / 25);
        setGlare({ x: (x/box.width)*100, y: (y/box.height)*100, op: 0.1 });
    };

    return (
        <motion.div
            onMouseMove={handleMove}
            onMouseLeave={() => { setRotateX(0); setRotateY(0); setGlare(g => ({...g, op: 0})); }}
            animate={{ rotateX, rotateY }}
            className={`bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/80 shadow-2xl relative overflow-hidden ${className}`}
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
        >
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                 style={{ opacity: glare.op, background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, white 0%, transparent 60%)`, zIndex: 1 }} />
            <div style={{ transform: "translateZ(20px)", position: "relative", zIndex: 2 }}>{children}</div>
        </motion.div>
    );
});
TiltCard.displayName = 'TiltCard';

// --- DASHBOARD PRINCIPAL ---
export default function DashboardPage() {
  const { userEmail, token, isGlobalStaff } = useAuth();
  const { theme } = useTheme();
  
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 1250000, conversion: 4.8, ticket: 85400 });

  // Carga de Datos Optimizada
  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://gallant-education-production-8b4a.up.railway.app';
            const res = await fetch(`${apiBase}/admin/logs`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const logs = await res.json();
                setActivities(logs.slice(0, 5).map((log: any) => ({
                    id: log.id, type: 'order', user: log.user_name || 'Sistema', detail: log.detail, time: 'Hoy'
                })));
            }
        } catch (e) { console.error("Mode Offline Active"); }
    };
    fetchData();
  }, [token]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-20 relative">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_10px_#10B981]"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Gestión de Activos</span>
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase text-black">
            Dashboard <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">Operativo</span>
          </h1>
        </div>
        <div className="flex gap-4">
            <ActionButton href="/dashboard/products/new" variant="outline"><Package size={16} /><span>Nuevo Producto</span></ActionButton>
            <ActionButton href="/dashboard/discounts"><Zap size={16} className="text-[#EAB308] fill-[#EAB308]"/><span>Crear Oferta</span></ActionButton>
        </div>
      </div>

      {/* Grid Superior */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <TiltCard className="lg:col-span-7 p-8 h-full">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-cyan/10 text-cyan flex items-center justify-center"><ShieldCheck size={20} /></div>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Estado de tu tienda</h2>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase text-emerald-600">Bajo Control</span>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[ {l:'Pagos', v:'OK'}, {l:'Stock', v:'Al día'}, {l:'Envíos', v:'Al día'}, {l:'Sincronía', v:'Activa'} ].map((it, i) => (
                    <div key={i} className="space-y-1">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">{it.l}</p>
                        <p className="text-sm font-black uppercase text-[#004d4d]">{it.v}</p>
                    </div>
                ))}
            </div>
        </TiltCard>

        <TiltCard className="lg:col-span-5 p-8 h-full bg-[#001A1A] text-white">
            <div className="flex items-center gap-3 mb-6">
                <Globe size={20} className="text-cyan" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan/60">Rendimiento Hoy</h2>
            </div>
            <div className="space-y-2">
                <p className="text-[10px] font-bold text-white/40 uppercase">Ventas Netas</p>
                <h3 className="text-4xl font-black italic text-white"><AnimatedNumber value={stats.revenue} /></h3>
            </div>
        </TiltCard>
      </div>

      {/* Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-10 bg-white rounded-[3rem] border border-gray-100 shadow-xl">
              <h3 className="text-xl font-black italic uppercase mb-8">Oportunidades IA</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1,2].map(i => (
                      <div key={i} className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 space-y-4">
                          <div className="h-2 w-24 bg-gray-200 rounded-full animate-pulse" />
                          <div className="h-4 w-full bg-gray-100 rounded-full animate-pulse" />
                      </div>
                  ))}
              </div>
          </div>
          
          <div className="p-10 bg-white rounded-[3rem] border border-gray-100 shadow-xl h-full">
              <h3 className="text-lg font-black italic uppercase mb-8">Actividad</h3>
              <div className="space-y-6">
                  {activities.length > 0 ? activities.map(act => (
                      <div key={act.id} className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0"><Package size={14}/></div>
                          <div className="flex flex-col"><span className="text-xs font-black">{act.user}</span><span className="text-[10px] text-gray-400">{act.detail}</span></div>
                      </div>
                  )) : (
                      <div className="py-10 text-center text-gray-300 text-xs font-bold uppercase">Cargando actividad...</div>
                  )}
              </div>
          </div>
      </div>

      <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} onComplete={() => {}} />
    </div>
  );
}
