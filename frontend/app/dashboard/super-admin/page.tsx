"use client";

import { useEffect, useState } from 'react';
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
    Info 
} from 'lucide-react';

export default function SuperAdminDashboard() {
    const { token } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!token) return;
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/stats`, {
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    };

    const generateAISummary = (data: any) => {
        if (!data) return "Analizando datos del sistema...";
        return `Resumen Global Bayup: La facturación consolidada es de ${formatCurrency(data.total_revenue)}, con utilidades para la plataforma de ${formatCurrency(data.total_commission)}. Contamos con ${data.active_companies} empresas activas y ${data.active_affiliates} afiliados. El sistema registra ${data.recent_alerts.length} eventos recientes en los logs de actividad.`;
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Activity size={40} className="animate-pulse text-[#004d4d]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sincronizando con la red global...</p>
                </div>
            </div>
        );
    }

    // Datos por defecto si la API falla o está vacía
    const safeStats = stats || {
        total_revenue: 0,
        total_commission: 0,
        active_companies: 0,
        active_affiliates: 0,
        top_companies: [],
        recent_alerts: []
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            
            {/* 1. Header & AI Summary */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Sistema Operativo Global</span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Torre de <span className="text-[#004d4d]">Control</span></h1>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => window.print()} className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-2">
                            <DollarSign size={14} /> Reporte de Red
                        </button>
                    </div>
                </div>

                {/* AI Insight Card */}
                <div className="bg-gradient-to-r from-[#001A1A] to-[#004d4d] p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Activity size={150} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                        <div className="h-16 w-16 rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-xl border border-white/10 shrink-0">
                            <Activity size={32} className="text-[#00F2FF]" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00F2FF]">Análisis Bayt Global</p>
                            <p className="text-lg font-medium leading-relaxed opacity-90 italic">
                                "{generateAISummary(safeStats)}"
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. KPIs Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Ventas Totales Red" 
                    value={formatCurrency(safeStats.total_revenue)} 
                    icon={<DollarSign size={20} className="text-emerald-600" />}
                    trend="+0% mes" 
                    trendUp={true}
                />
                <StatCard 
                    title="Comisión Bayup (3.5%)" 
                    value={formatCurrency(safeStats.total_revenue * 0.035)} 
                    icon={<TrendingUp size={20} className="text-[#00F2FF]" />}
                    trend="Meta: 10M" 
                    trendUp={true}
                />
                <StatCard 
                    title="Deuda por Cobrar" 
                    value={formatCurrency(0)} 
                    icon={<AlertTriangle size={20} className="text-rose-500" />}
                    trend="Corte: 30 d" 
                    trendUp={false}
                />
                <StatCard 
                    title="Red de Afiliados" 
                    value={safeStats.active_affiliates} 
                    icon={<Users size={20} className="text-amber-600" />}
                    trend="+0 nuevos" 
                    trendUp={true}
                />
            </div>

            {/* 3. ACCESOS MAESTROS (V1) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div onClick={() => router.push('/dashboard/super-admin/empresas')} className="bg-[#001A1A] p-8 rounded-[3rem] border border-white/5 shadow-2xl cursor-pointer group hover:scale-[1.02] transition-all">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-3xl bg-cyan/10 flex items-center justify-center text-cyan border border-cyan/20 group-hover:bg-cyan group-hover:text-[#001A1A] transition-all">
                            <Zap size={32} />
                        </div>
                        <div>
                            <h4 className="text-white font-black italic tracking-tighter text-xl">Inyectar Diseños</h4>
                            <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mt-1">Lanzar nuevas tiendas</p>
                        </div>
                    </div>
                </div>
                <div onClick={() => router.push('/dashboard/super-admin/tesoreria')} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl cursor-pointer group hover:scale-[1.02] transition-all">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-3xl bg-[#004d4d]/5 flex items-center justify-center text-[#004d4d] border border-[#004d4d]/10 group-hover:bg-[#004d4d] group-hover:text-white transition-all">
                            <DollarSign size={32} />
                        </div>
                        <div>
                            <h4 className="text-gray-900 font-black italic tracking-tighter text-xl">Libro de Caja</h4>
                            <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mt-1">Verificar comisiones</p>
                        </div>
                    </div>
                </div>
                <div onClick={() => router.push('/dashboard/super-admin/afiliados')} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl cursor-pointer group hover:scale-[1.02] transition-all">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-3xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-all">
                            <Users size={32} />
                        </div>
                        <div>
                            <h4 className="text-gray-900 font-black italic tracking-tighter text-xl">Red de Afiliados</h4>
                            <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mt-1">Gestionar el 0.5%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Panel Dividido */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Top Empresas */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden h-full">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                            <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">Recién Registrados</h2>
                            <button 
                                onClick={() => router.push('/dashboard/super-admin/companies')}
                                className="text-[9px] font-black uppercase tracking-widest text-[#004d4d] hover:underline"
                            >
                                Ver Directorio
                            </button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {safeStats.top_companies && safeStats.top_companies.length > 0 ? (
                                safeStats.top_companies.map((company: any, index: number) => (
                                    <div key={index} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-[#004d4d]/5 flex items-center justify-center font-black text-[#004d4d] text-xs border border-[#004d4d]/10">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{company.name}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">Ventas: {formatCurrency(company.revenue)}</p>
                                            </div>
                                        </div>
                                        <button className="px-4 py-2 bg-gray-50 text-gray-400 rounded-xl text-[8px] font-black uppercase hover:bg-[#004d4d] hover:text-white transition-all">Perfil</button>
                                    </div>
                                ))
                            ) : (
                                <div className="p-20 text-center flex flex-col items-center gap-4">
                                    <Building2 size={40} className="text-gray-100" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Esperando nuevos ecosistemas...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Alertas Críticas */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                            <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">Monitor de Red</h2>
                        </div>
                        <div className="flex-1 p-6 space-y-4">
                            {safeStats.recent_alerts && safeStats.recent_alerts.length > 0 ? safeStats.recent_alerts.map((alert: any, i: number) => (
                                <div key={i} className="flex gap-4 p-5 rounded-[2rem] bg-gray-50 border border-gray-100 hover:border-[#004d4d]/20 transition-all group">
                                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        <Activity size={16} className="text-[#004d4d]" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{alert.title}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 italic">{alert.time}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10 opacity-20">
                                    <Activity size={24} className="mx-auto mb-2" />
                                    <p className="text-[8px] font-black uppercase tracking-widest">Sin actividad reciente</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-50">
                            <button className="w-full py-4 bg-[#001A1A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">
                                Auditoría de Logs
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const StatCard = ({ title, value, icon, trend, trendUp }: any) => (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
        <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            {trend && (
                <span className={`flex items-center text-[10px] font-bold px-2 py-1 rounded-lg ${trendUp ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                    {trendUp ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                    {trend}
                </span>
            )}
        </div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{title}</p>
            <h3 className="text-2xl font-black text-gray-900">{value}</h3>
        </div>
    </div>
);
