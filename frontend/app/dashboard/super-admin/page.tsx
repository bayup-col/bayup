"use client";

import { useEffect, useState, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { 
    TrendingUp, 
    TrendingDown, 
    Users, 
    Building2, 
    DollarSign, 
    Activity, 
    AlertTriangle, 
    CheckCircle2, 
    Info,
    Zap,
    Globe,
    MapPin,
    Clock,
    LayoutGrid,
    Rocket,
    MousePointer2,
    ShieldCheck,
    Bot,
    ArrowUpRight,
    Search,
    Download,
    X,
    Filter,
    BarChart3,
    Layers,
    Activity as ActivityIcon
} from 'lucide-react';
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import SuperAdminMetricModal from "@/components/dashboard/SuperAdminMetricModal";

// --- COMPONENTES ATÓMICOS PREMIUM ---
const AnimatedNumber = memo(({ value, type = 'currency' }: { value: number, type?: 'currency' | 'simple' }) => {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current: number) => {
        if (type === 'simple') return Math.round(current).toLocaleString();
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(current);
    });
    useEffect(() => { spring.set(value); }, [value, spring]);
    return <motion.span>{display}</motion.span>;
});
AnimatedNumber.displayName = 'AnimatedNumber';

const GlassCard = ({ children, onClick, className = "", hover = true }: any) => (
    <motion.div
        onClick={onClick}
        whileHover={hover ? { y: -5, scale: 1.01 } : {}}
        className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />
        <div className="relative z-10">{children}</div>
    </motion.div>
);

export default function SuperAdminDashboard() {
    const { token } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
    const [selectedMetricType, setSelectedMetricType] = useState<'revenue' | 'commission' | 'companies' | 'affiliates'>('revenue');

    useEffect(() => {
        const fetchStats = async () => {
            if (!token) return;
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/super-admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [token]);

    const safeStats = stats || {
        total_revenue: 0,
        total_commission: 0,
        active_companies: 0,
        active_affiliates: 0,
        expiring_soon: [],
        geo_data: [],
        top_companies: [],
        recent_alerts: []
    };

    const openMetric = (type: 'revenue' | 'commission' | 'companies' | 'affiliates') => {
        setSelectedMetricType(type);
        setIsMetricModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="h-24 w-24 rounded-[2.5rem] bg-[#004D4D] flex items-center justify-center animate-pulse border border-cyan/30 shadow-[0_0_50px_rgba(0,242,255,0.2)]">
                        <Bot size={48} className="text-cyan" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan/40 animate-pulse">Sincronizando Torre de Control...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20 animate-in fade-in duration-1000">
            
            {/* 1. HEADER TÁCTICO */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-cyan/10 border border-cyan/20 rounded-full flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" />
                            <span className="text-[8px] font-black text-cyan uppercase tracking-widest">SISTEMA OPERATIVO v4.2</span>
                        </div>
                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em]">Sector: Global Administration</span>
                    </div>
                    <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Torre de <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan to-[#004D4D]">Control</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <button className="h-14 px-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[9px] font-black text-white uppercase tracking-widest transition-all flex items-center gap-3">
                        <Filter size={16} className="text-cyan" /> Filtros Avanzados
                    </button>
                    <button className="h-14 px-10 bg-cyan text-[#001A1A] rounded-2xl text-[10px] font-black text-white uppercase tracking-widest shadow-[0_0_30px_rgba(0,242,255,0.3)] hover:scale-105 transition-all flex items-center gap-3">
                        <Download size={18} /> Exportar Reporte Global
                    </button>
                </div>
            </header>

            {/* 2. KPIs DE ALTO MANDO */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    label="Ingreso Bruto Red"
                    value={safeStats.total_revenue}
                    icon={<Globe size={24}/>}
                    trend="+12.5%"
                    color="cyan"
                    onClick={() => openMetric('revenue')}
                />
                <StatCard 
                    label="Recaudo Bayup"
                    value={safeStats.total_commission}
                    icon={<DollarSign size={24}/>}
                    trend="+8.2%"
                    color="emerald"
                    onClick={() => openMetric('commission')}
                />
                <StatCard 
                    label="Empresas Activas"
                    value={safeStats.active_companies}
                    icon={<Building2 size={24}/>}
                    trend={`${safeStats.active_companies} tenants`}
                    color="purple"
                    isCurrency={false}
                    onClick={() => openMetric('companies')}
                />
                <StatCard 
                    label="Red Afiliados"
                    value={safeStats.active_affiliates}
                    icon={<Users size={24}/>}
                    trend="Fuerza de Venta"
                    color="amber"
                    isCurrency={false}
                    onClick={() => openMetric('affiliates')}
                />
            </div>

            {/* 3. PANELES DE OPERACIÓN */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Monitor de Suscripciones */}
                <div className="lg:col-span-2">
                    <GlassCard hover={false} className="h-full flex flex-col">
                        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <div className="space-y-1">
                                <h2 className="text-sm font-black uppercase tracking-widest text-white">Alertas de Suscripción</h2>
                                <p className="text-[9px] font-bold text-cyan/60 uppercase">Revisiones de ciclo de facturación</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40"><Clock size={18}/></div>
                        </div>
                        <div className="p-8">
                            {safeStats.expiring_soon && safeStats.expiring_soon.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {safeStats.expiring_soon.map((user: any, i: number) => (
                                        <div key={i} className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 font-black text-xs border border-rose-500/20">{user.days_left}d</div>
                                                <div>
                                                    <p className="text-xs font-black text-white uppercase">{user.name}</p>
                                                    <p className="text-[9px] font-bold text-white/30 uppercase">{user.plan}</p>
                                                </div>
                                            </div>
                                            <button className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[8px] font-black uppercase shadow-lg shadow-rose-500/20 hover:scale-105 transition-all">Cobrar</button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center opacity-20">
                                    <CheckCircle2 size={48} className="mb-4 text-emerald-400" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white">Suscripciones al día</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Mapa Geográfico de Ventas */}
                <GlassCard hover={false} className="bg-[#001A1A]">
                    <div className="p-10 border-b border-white/5 bg-black/20">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-cyan">Tráfico de Red</h3>
                    </div>
                    <div className="p-10 space-y-8">
                        {safeStats.geo_data && safeStats.geo_data.map((city: any, i: number) => (
                            <div key={i} className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <MapPin size={12} className="text-cyan" />
                                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">{city.city}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-white">${city.revenue.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${(city.revenue / safeStats.total_revenue) * 100}%` }} className="h-full bg-gradient-to-r from-cyan to-[#004D4D]" />
                                </div>
                            </div>
                        ))}
                        <div className="pt-10 mt-10 border-t border-white/5">
                            <p className="text-[10px] font-bold text-cyan/40 uppercase italic tracking-widest leading-relaxed">
                                &quot;Análisis: Cali y Bogotá concentran el 65% del flujo transaccional de la red.&quot;
                            </p>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* 4. ACCIONES DE INFRAESTRUCTURA */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <QuickAction 
                    title="Inyectar Fashion" 
                    subtitle="Template Automation" 
                    icon={<Rocket size={20}/>} 
                    color="cyan"
                />
                <QuickAction 
                    title="Logs de Sistema" 
                    subtitle="Error Monitor v4" 
                    icon={<ActivityIcon size={20}/>} 
                    color="rose"
                    onClick={() => router.push('/dashboard/super-admin/observability')}
                />
                <QuickAction 
                    title="Libro de Red" 
                    subtitle="Conciliación Global" 
                    icon={<DollarSign size={20}/>} 
                    color="emerald"
                    onClick={() => router.push('/dashboard/super-admin/tesoreria')}
                />
                <QuickAction 
                    title="Mesa de Ayuda" 
                    subtitle="Tickets Soporte" 
                    icon={<Headset size={20}/>} 
                    color="purple"
                    onClick={() => router.push('/dashboard/super-admin/soporte')}
                />
            </div>

            {/* 5. DIRECTORIO TOP EMPRESAS */}
            <GlassCard hover={false}>
                <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="space-y-1">
                        <h2 className="text-sm font-black uppercase tracking-widest text-white">Directorio de Crecimiento</h2>
                        <p className="text-[9px] font-bold text-cyan/60 uppercase">Top 5 empresas con mayor volumen</p>
                    </div>
                    <div className="px-4 py-2 bg-cyan/10 border border-cyan/20 rounded-xl text-[8px] font-black text-cyan uppercase tracking-widest">Auditoría Live</div>
                </div>
                <div className="p-4">
                    {safeStats.top_companies && safeStats.top_companies.map((company: any, i: number) => (
                        <div key={i} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all rounded-3xl group">
                            <div className="flex items-center gap-6">
                                <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center font-black text-white/20 group-hover:text-cyan group-hover:bg-cyan/10 transition-all text-sm border border-white/5">0{i+1}</div>
                                <div>
                                    <p className="text-sm font-black text-white uppercase tracking-tight">{company.name}</p>
                                    <p className="text-[10px] font-bold text-white/30 uppercase mt-1">Flujo Acumulado: ${company.revenue.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 hover:text-cyan hover:bg-cyan/10 transition-all border border-white/5"><MousePointer2 size={18}/></button>
                                <button className="px-6 py-3 bg-white text-[#001A1A] rounded-xl text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 shadow-xl">Impersonar</button>
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>

            <SuperAdminMetricModal 
                isOpen={isMetricModalOpen}
                onClose={() => setIsMetricModalOpen(false)}
                type={selectedMetricType}
                data={safeStats}
            />
        </div>
    );
}

const StatCard = ({ label, value, icon, trend, color, isCurrency = true, onClick }: any) => {
    const colorMap: any = {
        cyan: 'text-cyan bg-cyan/10 border-cyan/20',
        emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
        purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
        amber: 'text-amber-400 bg-amber-400/10 border-amber-400/20'
    };

    return (
        <GlassCard onClick={onClick} className="p-8 group h-full">
            <div className="flex justify-between items-start mb-8">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg border ${colorMap[color]}`}>
                    {icon}
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[9px] font-black text-white/60 tracking-tighter uppercase">
                        <TrendingUp size={10} className="text-emerald-400" /> {trend}
                    </div>
                </div>
            </div>
            <div>
                <p className="text-[10px] font-black text-white/30 tracking-[0.3em] uppercase mb-2">{label}</p>
                <h3 className="text-4xl font-black text-white tracking-tighter italic">
                    <AnimatedNumber value={value} type={isCurrency ? 'currency' : 'simple'} />
                </h3>
            </div>
        </GlassCard>
    );
};

const QuickAction = ({ title, subtitle, icon, color, onClick }: any) => {
    const colorMap: any = {
        cyan: 'text-cyan bg-cyan/10 group-hover:bg-cyan group-hover:text-[#001A1A]',
        rose: 'text-rose-400 bg-rose-400/10 group-hover:bg-rose-400 group-hover:text-white',
        emerald: 'text-emerald-400 bg-emerald-400/10 group-hover:bg-emerald-400 group-hover:text-white',
        purple: 'text-purple-400 bg-purple-400/10 group-hover:bg-purple-400 group-hover:text-white',
    };

    return (
        <GlassCard onClick={onClick} className="p-10 flex flex-col items-center text-center space-y-6">
            <div className={`h-16 w-16 rounded-[2rem] flex items-center justify-center transition-all duration-500 shadow-2xl border border-white/5 ${colorMap[color]}`}>
                {icon}
            </div>
            <div className="space-y-1">
                <h4 className="text-xl font-black text-white italic tracking-tighter uppercase">{title}</h4>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">{subtitle}</p>
            </div>
        </GlassCard>
    );
};
