"use client";

import { useState, useEffect } from 'react';
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/context/theme-context";
import Link from 'next/link';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  Activity, 
  Search, 
  Sparkles, 
  Users, 
  LayoutDashboard, 
  CheckCircle2, 
  ArrowRight, 
  TrendingUp, 
  AlertCircle,
  Package,
  CreditCard,
  MessageCircle,
  Lightbulb,
  Zap,
  Globe,
  ShieldCheck,
  TrendingDown,
  RefreshCw,
  Clock,
  BarChart3,
  Ghost
} from 'lucide-react';
import { GlassyButton } from "@/components/landing/GlassyButton";
import { ActionButton } from "@/components/landing/ActionButton";
import { useSpring, useTransform } from 'framer-motion';
import OnboardingModal from '@/components/dashboard/OnboardingModal';

// --- COMPONENTE DE NÚMEROS ANIMADOS ---
function AnimatedNumber({ value, className, type = 'currency' }: { value: number, className?: string, type?: 'currency' | 'percentage' | 'simple' }) {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current: number) => {
        try {
            if (type === 'percentage') return `${current.toFixed(1)}%`;
            if (type === 'simple') return Math.round(current).toLocaleString();
            return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(current);
        } catch (e) {
            return current.toString();
        }
    });

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    return <motion.span className={className}>{display}</motion.span>;
}

// --- COMPONENTE TILT CARD PREMIUM ---
const TiltCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const box = card.getBoundingClientRect();
        const x = e.clientX - box.left;
        const y = e.clientY - box.top;
        const centerX = box.width / 2;
        const centerY = box.height / 2;
        
        const rotateX = (y - centerY) / 12;
        const rotateY = (centerX - x) / 12;
        
        setRotateX(rotateX);
        setRotateY(rotateY);
        setGlarePos({ 
            x: (x / box.width) * 100, 
            y: (y / box.height) * 100,
            opacity: 0.15 
        });
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
        setGlarePos(prev => ({ ...prev, opacity: 0 }));
    };

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={{ rotateX, rotateY, scale: rotateX !== 0 ? 1.01 : 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
            className={`bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/80 shadow-2xl flex flex-col justify-between group relative overflow-hidden ${className}`}
        >
            <div 
                className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                style={{
                    opacity: glarePos.opacity,
                    background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.8) 0%, transparent 60%)`,
                    zIndex: 1
                }}
            />
            <div style={{ transform: "translateZ(50px)", position: "relative", zIndex: 2 }} className="h-full">
                {children}
            </div>
            <div className="absolute -bottom-20 -right-20 h-40 w-40 bg-[#00f2ff]/10 blur-[60px] rounded-full pointer-events-none" />
        </motion.div>
    );
};

export default function DashboardPage() {
  const { userEmail, token, isGlobalStaff } = useAuth();
  const { theme } = useTheme();
  
  // Onboarding Pilar 4
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Estados de datos
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const [pendingCollection, setPendingCollection] = useState<any>(null);
  const [loadingOpps, setLoadingOpps] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
        if (!token || isGlobalStaff) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (!data.onboarding_completed) setIsOnboardingOpen(true);
            }
        } catch (e) { console.error(e); }
    };
    checkOnboarding();
  }, [token, isGlobalStaff]);

  const handleCompleteOnboarding = async () => {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        await fetch(`${apiUrl}/admin/update-profile`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ onboarding_completed: true })
        });
        setIsOnboardingOpen(false);
    } catch (err) { console.error(err); }
  };

  // Actividad Real (Conectada al Backend)
  const [activities, setActivities] = useState<any[]>([]);

  // Carga de datos reales y oportunidades
  useEffect(() => {
    const fetchData = async () => {
        if (!token) return;
                try {
                    const apiBase = "http://localhost:8000";
                    const [expRes, recRes, oppRes, logsRes] = await Promise.all([
                        fetch(`${apiBase}/expenses`, { headers: { 'Authorization': `Bearer ${token}` } }),
                        fetch(`${apiBase}/receivables`, { headers: { 'Authorization': `Bearer ${token}` } }),
                        fetch(`${apiBase}/analytics/opportunities`, { headers: { 'Authorization': `Bearer ${token}` } }),
                        fetch(`${apiBase}/admin/logs`, { headers: { 'Authorization': `Bearer ${token}` } })
                    ]);
        
                    // Blindaje contra 401 (Unauthorized)
                    if (expRes.status === 401 || recRes.status === 401) {
                        console.warn("Sesión expirada o servidor no disponible. Usando respaldo local.");
                        loadFallbackData();
                        return;
                    }
        
                    if (expRes.ok) {
                        const exps = await expRes.json();
                        const pending = exps.filter((e: any) => e.status === 'pending')
                            .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
                        setPendingPayment(pending);
                    }
                    if (recRes.ok) {
                        const recs = await recRes.json();
                        const pending = recs.filter((r: any) => r.status === 'pending')
                            .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
                        setPendingCollection(pending);
                    }
                    if (oppRes.ok) {
                        const opps = await oppRes.json();
                        setOpportunities(opps);
                    }
                    if (logsRes.ok) {
                        const logs = await logsRes.json();
                        setActivities(logs.slice(0, 5).map((log: any) => ({
                            id: log.id,        
                            type: log.action.includes('USER') ? 'customer' : log.action.includes('PRODUCT') ? 'order' : 'message',
                            user: log.user_name || 'Sistema',
                            detail: log.detail,
                            time: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            amount: null       
                        })));
                    }
                } catch (e) { 
                    console.error("Error conectando con el backend. Activando modo offline.");
                    loadFallbackData();
                } finally {
                    setLoadingOpps(false);     
                    setIsLoadingLogs(false);   
                }
            };
        
            const loadFallbackData = () => {
                // Cargar datos de respaldo desde localStorage para mantener la UI funcional
                const savedExpenses = localStorage.getItem('bayup_expenses_data');
                const savedReceivables = localStorage.getItem('bayup_debt_records_v2');
                
                if (savedExpenses) {
                    const exps = JSON.parse(savedExpenses);
                    setPendingPayment(exps.find((e:any) => e.status === 'pending') || null);
                }
                if (savedReceivables) {
                    const recs = JSON.parse(savedReceivables);
                    setPendingCollection(recs.find((r:any) => r.type === 'receivable' && r.status === 'pending') || null);
                }
            };
        
    fetchData();
  }, [token]);

  // Mock en tiempo real (Solo si no hay logs reales)
  useEffect(() => {
    if (activities.length > 0) return;
    
    const types = ['order', 'message', 'customer'] as const;
    const names = ['Juan K.', 'Elena M.', 'Santi P.', 'Laura O.', 'Mateo D.'];
    const details = {
        order: 'Nueva venta',
        message: 'Mensaje WhatsApp',
        customer: 'Cliente registrado'
    };

    const interval = setInterval(() => {
        const type = types[Math.floor(Math.random() * types.length)];
        const newAct = {
            id: Date.now(),
            type,
            user: names[Math.floor(Math.random() * names.length)],
            detail: details[type],
            time: 'Ahora',
            amount: type === 'order' ? `$${Math.floor(Math.random() * 500) + 50}.000` : null
        };
        setActivities(prev => [newAct, ...prev.slice(0, 4)]);
    }, 15000);

    return () => clearInterval(interval);
  }, [activities.length]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
  };

  // Componente de Gráfica Minimalista
  const WeeklyChart = () => (
    <div className="h-40 w-full flex items-end justify-between gap-2 pt-6">
        {[35, 50, 30, 65, 85, 60, 95].map((h, i) => (
            <motion.div 
                key={i} 
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex-1 flex flex-col items-center gap-3 group relative cursor-pointer"
            >
                <div className="w-full bg-gray-50 rounded-t-2xl relative h-full overflow-hidden border border-gray-100">
                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-[#004d4d] to-[#00F2FF] rounded-t-2xl opacity-80 group-hover:opacity-100 transition-all duration-300 h-full"></div>
                </div>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest group-hover:text-[#004d4d] transition-colors">
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}
                </span>
                
                {/* Tooltip */}
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-[#001A1A] text-[#00F2FF] text-[9px] font-bold px-2 py-1 rounded-lg">
                    {h}%
                </div>
            </motion.div>
        ))}
    </div>
  );

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 30 } }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-20 animate-in fade-in duration-700 relative">
      
      {/* 1. Header Premium */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_10px_#10B981]"></span>
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'dark' ? 'text-[#00F2FF]/60' : 'text-[#004d4d]/60'}`}>Gestión de Activos</span>
          </div>
          <h1 className={`text-5xl font-black italic tracking-tighter uppercase leading-tight transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-[#001A1A]'}`}>
            Dashboard <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">Operativo</span>
          </h1>
          <p className={`mt-2 font-medium max-w-lg leading-relaxed transition-colors duration-500 ${theme === 'dark' ? 'text-slate-400' : 'text-[#004d4d]/60'}`}>
            Resumen de inteligencia y rendimiento en tiempo real para <span className={`font-bold transition-colors duration-500 ${theme === 'dark' ? 'text-[#00F2FF]' : 'text-[#001A1A]'}`}>{userEmail?.split('@')[0] || 'tu empresa'}</span>.
          </p>
        </div>
        
        <div className="flex gap-4">
            <ActionButton href="/dashboard/products/new" variant="outline">
                <Package size={16} />
                <span>Nuevo Producto</span>
            </ActionButton>
            <ActionButton href="/dashboard/discounts">
                <Zap size={16} className="text-[#EAB308] fill-[#EAB308]"/>
                <span>Crear Oferta</span>
            </ActionButton>
        </div>
      </div>

      {/* 2. Business Pulse - Sección inteligente superior */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* BLOQUE 1: Estado Operativo (Health Card) */}
        <motion.div variants={itemVariants} className="lg:col-span-7 h-full">
            <TiltCard className={`p-8 h-full transition-all duration-500 ${theme === 'dark' ? 'bg-[#001a1a]/80 border-[#00F2FF]/10' : 'bg-white border-[#004d4d]/5'}`}>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-colors duration-500 ${theme === 'dark' ? 'bg-[#00F2FF]/10 text-[#00F2FF]' : 'bg-[#004d4d]/5 text-[#004d4d]'}`}>
                            <ShieldCheck size={20} />
                        </div>
                        <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'dark' ? 'text-[#00F2FF]/40' : 'text-[#004d4d]/40'}`}>Estado de tu tienda</h2>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${theme === 'dark' ? 'bg-[#10B981]/10 border-[#10B981]/20' : 'bg-emerald-50 border-emerald-100'}`}>
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-[#10B981]' : 'text-emerald-600'}`}>Bajo Control</span>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { label: 'Pagos', val: 'OK', status: 'success' },
                        { label: 'Stock Crítico', val: '2 prod.', status: 'critical' },
                        { label: 'Envíos', val: 'Al día', status: 'success' },
                        { label: 'Sincronía', val: 'Activa', status: 'success' }
                    ].map((item, i) => (
                        <div key={i} className="space-y-1">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                            <p className={`text-sm font-black uppercase ${item.status === 'success' ? 'text-[#004d4d]' : 'text-rose-600'}`}>{item.val}</p>
                        </div>
                    ))}
                </div>
            </TiltCard>
        </motion.div>

        {/* BLOQUE 4: Canales Activos (Compacto) */}
        <motion.div variants={itemVariants} className="lg:col-span-5 h-full">
            <TiltCard className={`p-8 h-full transition-all duration-500 ${theme === 'dark' ? 'bg-[#001a1a]/80 border-[#00F2FF]/10' : 'bg-white border-[#004d4d]/5'}`}>
                <div className="flex items-center gap-3 mb-6">
                    <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-colors duration-500 ${theme === 'dark' ? 'bg-[#00F2FF]/10 text-[#00F2FF]' : 'bg-[#004d4d]/5 text-[#004d4d]'}`}>
                        <Globe size={20} />
                    </div>
                    <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'dark' ? 'text-[#00F2FF]/40' : 'text-[#004d4d]/40'}`}>Canales Activos</h2>
                </div>
                <div className="space-y-4">
                    <div className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-500 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50/50 border-gray-100'}`}>
                        <div className="flex items-center gap-3">
                            <MessageCircle size={14} className="text-[#10B981]" />
                            <span className={`text-[10px] font-black uppercase transition-colors duration-500 ${theme === 'dark' ? 'text-white/80' : 'text-[#004d4d]/80'}`}>WhatsApp CRM</span>
                        </div>
                        <span className="text-[9px] font-bold text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded-md">8 chats</span>
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-500 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50/50 border-gray-100'}`}>
                        <div className="flex items-center gap-3">
                            <Zap size={14} className="text-[#10B981]" />
                            <span className={`text-[10px] font-black uppercase transition-colors duration-500 ${theme === 'dark' ? 'text-white/80' : 'text-[#004d4d]/80'}`}>Tienda Online</span>
                        </div>
                        <span className="text-[9px] font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-md">Activa</span>
                    </div>
                </div>
            </TiltCard>
        </motion.div>

        {/* BLOQUE 2: Acciones Recomendadas (IA) */}
        <motion.div variants={itemVariants} className="lg:col-span-8 h-full">
            <TiltCard className={`p-10 h-full relative overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-[#001a1a] border-[#00F2FF]/20 shadow-black/60' : 'bg-[#001A1A] text-white'}`}>
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none transition-colors duration-500 ${theme === 'dark' ? 'bg-[#00F2FF]/20' : 'bg-[#00F2FF]/10'}`}></div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-2xl border flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.2)] transition-all duration-500 ${theme === 'dark' ? 'bg-[#002626] border-[#00F2FF]/40 text-[#00F2FF]' : 'bg-[#004d4d] border-[#00F2FF]/30 text-[#00F2FF]'}`}>
                                <Lightbulb size={24} className={theme === 'dark' ? 'text-[#00F2FF] fill-[#00F2FF]/20' : 'text-white fill-white'} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black italic uppercase tracking-wider text-white">Acciones Recomendadas</h3>
                                <p className="text-[9px] font-bold text-[#00F2FF] uppercase tracking-[0.2em] mt-1">Inteligencia de Negocio Bayup</p>
                            </div>
                        </div>
                        <div className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 active:text-[#00F2FF] transition-colors cursor-pointer group-active:text-[#00F2FF]">
                            <RefreshCw size={16} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { title: 'Reabastecer "Zapatillas"', desc: 'Alta demanda en última semana.', action: 'Ver Stock' },
                            { title: 'Oferta Clientes Rec.', desc: 'Mejora retención en un 12%.', action: 'Crear' },
                            { title: 'Campaña WhatsApp', desc: '12 chats pendientes de cierre.', action: 'Ir' },
                            { title: 'Ajuste de Precio', desc: '"Reloj Tech" 15% arriba del mercado.', action: 'Revisar' }
                        ].map((item, i) => (
                            <div key={i} className="p-5 bg-white/5 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all flex items-center justify-between group/item">
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-white uppercase tracking-tight">{item.title}</p>
                                    <p className="text-[9px] text-white/40 font-medium">{item.desc}</p>
                                </div>
                                <button className="h-8 px-4 bg-white text-[#001A1A] text-[9px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform">
                                    {item.action}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </TiltCard>
        </motion.div>

        {/* BLOQUE 3: Rendimiento Hoy vs Ayer */}
        <motion.div variants={itemVariants} className="lg:col-span-4 h-full">
            <TiltCard className={`p-10 h-full transition-all duration-500 ${theme === 'dark' ? 'bg-[#001a1a]/80 border-[#00F2FF]/10' : 'bg-white border-[#004d4d]/5'}`}>
                <div className="flex items-center gap-3 mb-8">
                    <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-colors duration-500 ${theme === 'dark' ? 'bg-[#00F2FF]/10 text-[#00F2FF]' : 'bg-[#004d4d]/5 text-[#004d4d]'}`}>
                        <TrendingUp size={20} />
                    </div>
                    <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'dark' ? 'text-[#00F2FF]/40' : 'text-[#004d4d]/40'}`}>Rendimiento Hoy</h2>
                </div>
                
                <div className="space-y-8">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ventas Netas</p>
                        <div className="flex items-end gap-3 mt-1">
                            <h3 className={`text-4xl font-black italic tracking-tighter transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-[#001A1A]'}`}>
                                <AnimatedNumber value={1250000} />
                            </h3>
                            <span className="mb-1 text-xs font-black text-emerald-500 flex items-center gap-0.5">
                                <TrendingUp size={12} /> <AnimatedNumber value={15} type="percentage" />
                            </span>
                        </div>
                    </div>
                    
                    <div className={`grid grid-cols-2 gap-6 pt-6 border-t transition-colors duration-500 ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Ticket Prom.</p>
                            <p className={`text-lg font-black tracking-tight transition-colors duration-500 ${theme === 'dark' ? 'text-[#00F2FF]' : 'text-[#004d4d]'}`}>
                                <AnimatedNumber value={85400} />
                            </p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Conversión</p>
                            <p className={`text-lg font-black tracking-tight transition-colors duration-500 ${theme === 'dark' ? 'text-[#00F2FF]' : 'text-[#004d4d]'}`}>
                                <AnimatedNumber value={4.8} type="percentage" />
                            </p>
                        </div>
                    </div>
                </div>
            </TiltCard>
        </motion.div>
      </motion.div>

      {/* 3. Grid Principal: Oportunidades (Alargado), Gráfica y Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Oportunidades y Tendencia */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* NUEVA CARD: OPORTUNIDADES DE MERCADO (ALARGADA) */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group border transition-all duration-500 ${theme === 'dark' ? 'bg-[#001a1a] border-[#00F2FF]/20 shadow-black/60' : 'bg-[#001A1A] border-[#004d4d]/20 text-white'}`}
            >
                <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none animate-pulse transition-colors duration-500 ${theme === 'dark' ? 'bg-[#00F2FF]/10' : 'bg-[#00F2FF]/5'}`}></div>
                
                <div className="flex items-center justify-between mb-10 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl border flex items-center justify-center shadow-[0_0_25px_rgba(0,242,255,0.15)] transition-all duration-500 ${theme === 'dark' ? 'bg-[#002626] border-[#00F2FF]/40 text-[#00F2FF]' : 'bg-[#004d4d] border-[#00F2FF]/30 text-[#00F2FF]'}`}>
                            <Sparkles size={24} className="text-[#EAB308] fill-[#EAB308]" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black italic uppercase tracking-wider text-white">Oportunidades Detectadas</h3>
                            <p className="text-[9px] font-bold text-[#00F2FF] uppercase tracking-[0.2em] mt-1">Demanda insatisfecha identificada por Bayup AI</p>
                        </div>
                    </div>
                    <button 
                        className={`hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:bg-[#00F2FF] transition-all group/btn ${theme === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-[#001A1A]'}`}
                    >
                        Importar Todo <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    {loadingOpps ? (
                        <div className="col-span-4 py-10 flex flex-col items-center justify-center text-white/20 gap-4">
                            <RefreshCw size={24} className="animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Escaneando mercado global...</p>
                        </div>
                    ) : opportunities.length > 0 ? (
                        opportunities.map((opp, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`p-6 rounded-[2.5rem] border transition-all group/item cursor-pointer flex flex-col justify-between min-h-[180px] ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-[#00F2FF]/30' : 'bg-white/5 border-white/5 hover:bg-white hover:border-white'}`}
                            >
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[9px] font-black text-[#00F2FF] bg-[#00F2FF]/10 px-2 py-1 rounded-lg uppercase tracking-widest border border-[#00F2FF]/20 group-hover/item:text-[#004d4d] group-hover/item:border-[#004d4d]/20 group-hover/item:bg-[#004d4d]/5 transition-colors">Demand</span>
                                        <TrendingUp size={14} className="text-emerald-400 group-hover/item:text-[#004d4d] transition-colors" />
                                    </div>
                                    <p className="text-sm font-black text-white uppercase tracking-tight line-clamp-2 group-hover/item:text-[#004d4d] transition-colors">{opp.term}</p>
                                    <div className="flex items-center gap-2">
                                        <Users size={12} className="text-white/40 group-hover/item:text-[#004d4d]/40 transition-colors" />
                                        <span className="text-[10px] font-bold text-white/60 group-hover/item:text-[#004d4d]/60 transition-colors">{opp.volume} búsquedas</span>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-white/5 group-hover/item:border-[#004d4d]/5 transition-colors space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[8px] font-black text-white/30 uppercase group-hover/item:text-[#004d4d]/30 transition-colors">Potencial</span>
                                        <span className={`text-xs font-black transition-colors ${theme === 'dark' ? 'text-[#00F2FF]' : 'text-emerald-400 group-hover/item:text-[#004d4d]'}`}>
                                            +<AnimatedNumber value={opp.potential} />
                                        </span>
                                    </div>
                                    <button className={`w-full py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${theme === 'dark' ? 'bg-[#00F2FF]/10 text-[#00F2FF] hover:bg-[#00F2FF] hover:text-black' : 'bg-white/5 text-white group-hover/item:bg-[#004d4d] group-hover/item:text-white'}`}>
                                        {opp.action ? opp.action.split(' ')[0] : 'Explorar'}
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-4 py-10 text-center text-white/40">
                            <CheckCircle2 size={32} className="mx-auto mb-4 text-[#00F2FF]" />
                            <p className="text-xs font-black uppercase tracking-widest">Inventario Optimizado al 100%</p>
                        </div>
                    )}
                </div>
            </motion.div>
            
            {/* Gráfica de Rendimiento */}
            <div className={`p-10 rounded-[3rem] border transition-all duration-500 relative overflow-hidden ${theme === 'dark' ? 'bg-[#001a1a]/80 border-[#00F2FF]/10 shadow-black/40' : 'bg-white border-[#004d4d]/5 shadow-[0_10px_40px_rgba(0,0,0,0.02)]'}`}>
                <div className="flex justify-between items-end mb-4 relative z-10">
                    <div>
                        <h2 className={`text-2xl font-black italic uppercase tracking-tighter transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-[#001A1A]'}`}>Tendencia Semanal</h2>
                        <p className={`text-xs font-bold uppercase tracking-widest mt-1 transition-colors duration-500 ${theme === 'dark' ? 'text-[#00F2FF]/40' : 'text-[#004d4d]/40'}`}>Rendimiento Operativo</p>
                    </div>
                    <button className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${theme === 'dark' ? 'bg-white/5 text-[#00F2FF] hover:bg-[#00F2FF]/10' : 'bg-gray-50 text-[#004d4d] hover:bg-[#004d4d] hover:text-white'}`}>
                        Detalles
                    </button>
                </div>
                <WeeklyChart />
            </div>

            {/* Finanzas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-white rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.02)] border border-[#004d4d]/5 hover:border-rose-100 transition-colors group">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100"><AlertCircle size={18}/></div>
                        <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Por Pagar</span>
                    </div>
                    {pendingPayment ? (
                        <div>
                            <h4 className="text-xl font-black text-[#001A1A] leading-tight">{pendingPayment.description}</h4>
                            <p className="text-2xl font-black text-rose-600 mt-2 tracking-tight">
                                <AnimatedNumber value={pendingPayment.amount} />
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Vence: {new Date(pendingPayment.due_date).toLocaleDateString()}</p>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-xs font-bold text-gray-300 uppercase">Sin deudas pendientes</p>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-white rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.02)] border border-[#004d4d]/5 hover:border-emerald-100 transition-colors group">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100"><CreditCard size={18}/></div>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Por Cobrar</span>
                    </div>
                    {pendingCollection ? (
                        <div>
                            <h4 className="text-xl font-black text-[#001A1A] leading-tight">{pendingCollection.client_name}</h4>
                            <p className="text-2xl font-black text-emerald-600 mt-2 tracking-tight">
                                <AnimatedNumber value={pendingCollection.amount} />
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Estimado: {new Date(pendingCollection.due_date).toLocaleDateString()}</p>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-xs font-bold text-gray-300 uppercase">Cartera al día</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Columna Derecha: Actividad */}
        <div className="space-y-8">
            
            {/* Actividad Reciente (Timeline) */}
            <div className="p-10 bg-white rounded-[3rem] shadow-[0_10px_40px_rgba(0,0,0,0.02)] border border-[#004d4d]/5 relative overflow-hidden h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black italic text-[#001A1A] uppercase tracking-tighter">Actividad</h3>
                    <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#004d4d] cursor-pointer transition-colors">
                        <Clock size={14} />
                    </div>
                </div>
                <div className="flex-1 space-y-10 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                    <AnimatePresence initial={false}>
                        {activities.map((act) => (
                            <motion.div 
                                key={act.id}
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="relative pl-12 flex flex-col gap-1"
                            >
                                <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center z-10 shadow-sm ${
                                    act.type === 'order' ? 'bg-emerald-50 text-emerald-600' :
                                    act.type === 'message' ? 'bg-blue-50 text-blue-600' :
                                    'bg-[#004d4d]/10 text-[#004d4d]'
                                }`}>
                                    {act.type === 'order' ? <Package size={14} /> : act.type === 'message' ? <MessageCircle size={14} /> : <Users size={14} />}
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs font-black text-[#001A1A] truncate max-w-[120px]">{act.user}</span>
                                    <span className="text-[8px] font-black text-[#004d4d]/30 uppercase tracking-widest">{act.time}</span>
                                </div>
                                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide truncate">{act.detail}</p>
                                {act.amount && <span className="text-xs font-black text-emerald-600 mt-1">{act.amount}</span>}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
                <button className="mt-10 w-full py-4 bg-gray-50 rounded-2xl text-[9px] font-black text-[#004d4d] uppercase tracking-[0.2em] hover:bg-gray-100 transition-all">Historial Completo</button>
            </div>

        </div>
                  </div>
      
                  {/* Modal de Onboarding Pilar 4 */}
                  <OnboardingModal 
                      isOpen={isOnboardingOpen} 
                      onClose={() => setIsOnboardingOpen(false)}
                      onComplete={handleCompleteOnboarding}
                  />
              </div>
          );
      }