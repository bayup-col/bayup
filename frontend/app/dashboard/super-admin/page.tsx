"use client";

import { useEffect, useState, useMemo } from 'react';
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
    Bot
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import SuperAdminMetricModal from "@/components/dashboard/SuperAdminMetricModal";

export default function SuperAdminDashboard() {
    const { token } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('finanzas'); // finanzas, red, geografia
    
    // Estados del Modal de Métricas
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

    const openMetric = (type: 'revenue' | 'commission' | 'companies' | 'affiliates') => {
        setSelectedMetricType(type);
        setIsMetricModalOpen(true);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-6">
                    <div className="h-20 w-20 bg-[#004d4d] rounded-[2rem] flex items-center justify-center animate-bounce shadow-2xl shadow-[#004d4d]/20">
                        <Activity size={40} className="text-[#00F2FF]" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 animate-pulse">Sincronizando Torre de Control...</p>
                </div>
            </div>
        );
    }

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

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-1000">
            
            {/* 1. HEADER ESTRATÉGICO */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-[#004d4d] rounded-xl flex items-center justify-center shadow-lg shadow-[#004d4d]/20">
                            <ShieldCheck size={16} className="text-[#00F2FF]" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#004d4d]/60">Bayup Operating System v2.0</span>
                    </div>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">
                        Torre de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-cyan">Control</span>
                    </h1>
                </div>
                <div className="flex gap-4">
                    <button className="px-8 py-4 bg-gray-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl flex items-center gap-3 active:scale-95">
                        <DollarSign size={16} className="text-emerald-400" /> Exportar Libro de Red
                    </button>
                </div>
            </header>

            {/* 2. KPIs DE ALTO IMPACTO (Financiero Dinámico) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Ingreso Bruto Red" 
                    value={formatCurrency(safeStats.total_revenue)} 
                    icon={<Globe size={20} className="text-blue-500" />}
                    trend="Flujo Total" 
                    trendUp={true}
                    color="blue"
                    onClick={() => openMetric('revenue')}
                />
                <StatCard 
                    title="Recaudo Bayup" 
                    value={formatCurrency(safeStats.total_commission)} 
                    icon={<DollarSign size={20} className="text-emerald-500" />}
                    trend="Utilidad Real" 
                    trendUp={true}
                    color="emerald"
                    onClick={() => openMetric('commission')}
                />
                <StatCard 
                    title="Empresas Activas" 
                    value={safeStats.active_companies} 
                    icon={<Building2 size={20} className="text-purple-500" />}
                    trend={`${safeStats.active_companies} tenants`} 
                    trendUp={true}
                    color="purple"
                    onClick={() => openMetric('companies')}
                />
                <StatCard 
                    title="Red Afiliados" 
                    value={safeStats.active_affiliates} 
                    icon={<Users size={20} className="text-amber-500" />}
                    trend="Fuerza de Venta" 
                    trendUp={true}
                    color="amber"
                    onClick={() => openMetric('affiliates')}
                />
            </div>

            <SuperAdminMetricModal 
                isOpen={isMetricModalOpen}
                onClose={() => setIsMetricModalOpen(false)}
                type={selectedMetricType}
                data={safeStats}
            />

            {/* 3. MONITOR DE SUSCRIPCIONES Y GEOGRAFÍA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Panel de Vencimientos (CONTROL 2) */}
                <div className="lg:col-span-2 bg-white rounded-[3.5rem] border border-gray-100 shadow-xl overflow-hidden flex flex-col">
                    <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">Alertas de Suscripción</h2>
                            <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Planes por vencer en 5 días</p>
                        </div>
                        <button className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 hover:text-rose-500 transition-colors">
                            <Clock size={18} />
                        </button>
                    </div>
                    <div className="flex-1 p-4">
                        {safeStats.expiring_soon && safeStats.expiring_soon.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {safeStats.expiring_soon.map((user: any, i: number) => (
                                    <div key={i} className="p-6 bg-rose-50/50 border border-rose-100 rounded-[2.5rem] flex items-center justify-between group hover:bg-rose-50 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-rose-500 shadow-sm font-black text-xs">
                                                {user.days_left}d
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{user.name}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{user.plan}</p>
                                            </div>
                                        </div>
                                        <button className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[8px] font-black uppercase shadow-lg shadow-rose-200 active:scale-95 transition-all">Cobrar</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-60 flex flex-col items-center justify-center opacity-30">
                                <CheckCircle2 size={40} className="mb-4 text-emerald-500" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Suscripciones al día</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mapa de Tráfico (CONTROL 3) */}
                <div className="bg-[#001A1A] rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-10 opacity-10"><Globe size={150} /></div>
                    <div className="relative z-10">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-cyan mb-8">Tráfico de Red</h3>
                        <div className="space-y-6">
                            {safeStats.geo_data && safeStats.geo_data.map((city: any, i: number) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <MapPin size={14} className="text-cyan group-hover:animate-bounce" />
                                        <span className="text-xs font-bold uppercase tracking-widest">{city.city}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-white">{formatCurrency(city.revenue)}</p>
                                        <div className="w-20 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${(city.revenue / safeStats.total_revenue) * 100}%` }} className="h-full bg-cyan" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative z-10 pt-10">
                        <p className="text-[9px] font-bold text-cyan/60 uppercase tracking-widest italic">&quot;Cali lidera la penetración de mercado con el 40% del flujo total.&quot;</p>
                    </div>
                </div>
            </div>

            {/* 4. ACCIONES MAESTRAS (CONTROL 4) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ActionButton 
                    title="Inyectar Fashion" 
                    subtitle="Lanzar Tienda Ropa"
                    icon={<Zap className="text-cyan" />}
                    onClick={() => console.log('Inyectando...')}
                    dark={true}
                />
                <ActionButton 
                    title="Auditoría Logs" 
                    subtitle="Monitor de Errores"
                    icon={<Activity className="text-rose-500" />}
                    onClick={() => router.push('/dashboard/super-admin/observability')}
                />
                <ActionButton 
                    title="Libro de Caja" 
                    subtitle="Conciliación Wompi"
                    icon={<DollarSign className="text-emerald-500" />}
                    onClick={() => router.push('/dashboard/super-admin/tesoreria')}
                />
                <ActionButton 
                    title="Bayt Global" 
                    subtitle="IA de Estrategia"
                    icon={<Bot className="text-purple-500" />}
                    onClick={() => console.log('Bot activado')}
                />
            </div>

            {/* 5. RESUMEN DE LA RED */}
            <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">Directorio de Crecimiento</h2>
                    <span className="px-4 py-1.5 bg-[#004d4d] text-[#00f2ff] rounded-full text-[8px] font-black uppercase">Top 5 Empresas</span>
                </div>
                <div className="divide-y divide-gray-50">
                    {safeStats.top_companies && safeStats.top_companies.map((company: any, i: number) => (
                        <div key={i} className="p-8 flex items-center justify-between hover:bg-gray-50/50 transition-all group">
                            <div className="flex items-center gap-6">
                                <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center font-black text-gray-400 group-hover:bg-[#004d4d] group-hover:text-white transition-all text-sm">
                                    0{i+1}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{company.name}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Ventas Totales: {formatCurrency(company.revenue)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#004d4d] transition-colors"><MousePointer2 size={18}/></button>
                                <button className="px-6 py-3 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">Entrar a Tienda</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const StatCard = ({ title, value, icon, trend, trendUp, color, onClick }: any) => {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        purple: 'bg-purple-50 text-purple-600',
        amber: 'bg-amber-50 text-amber-600'
    };
    
    return (
        <div 
            onClick={onClick}
            className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group cursor-pointer"
        >
            <div className="flex justify-between items-start mb-6">
                <div className={`h-12 w-12 rounded-2xl ${colors[color]} flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
                    {icon}
                </div>
                <span className={`flex items-center text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${trendUp ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                    {trend}
                </span>
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">{title}</p>
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter italic">{value}</h3>
            </div>
        </div>
    );
};

const ActionButton = ({ title, subtitle, icon, onClick, dark = false }: any) => (
    <div 
        onClick={onClick}
        className={`p-8 rounded-[3rem] cursor-pointer transition-all duration-500 hover:scale-[1.03] group ${
            dark ? 'bg-[#001A1A] text-white border border-white/5' : 'bg-white border border-gray-100 shadow-xl'
        }`}
    >
        <div className={`h-14 w-14 rounded-2xl mb-6 flex items-center justify-center transition-all ${
            dark ? 'bg-cyan/10 group-hover:bg-cyan group-hover:text-[#001A1A]' : 'bg-gray-50 group-hover:bg-gray-900 group-hover:text-white'
        }`}>
            {icon}
        </div>
        <h4 className={`text-xl font-black italic tracking-tighter ${dark ? 'text-white' : 'text-gray-900'}`}>{title}</h4>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{subtitle}</p>
    </div>
);
