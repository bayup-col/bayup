"use client";

import { useEffect, useState } from 'react';
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
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    const generateAISummary = (data: any) => {
        if (!data) return "Analizando datos del sistema...";
        const growth = data.total_revenue > 0 ? "positivo" : "estable";
        return `Resumen Ejecutivo: La facturación total asciende a ${formatCurrency(data.total_revenue)}, generando una ganancia neta estimada de ${formatCurrency(data.total_commission)}. Actualmente hay ${data.active_companies} empresas operando activamente y ${data.active_affiliates} afiliados promoviendo productos. El sistema se encuentra estable con ${data.recent_alerts.length} alertas recientes.`;
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004d4d]"></div>
            </div>
        );
    }

    if (!stats) return <div className="p-8 text-center text-gray-500">No se pudieron cargar los datos.</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            
            {/* 1. Header & AI Summary */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Panel de Control Global</h1>
                        <p className="text-gray-500 mt-1 font-medium">Visión estratégica en tiempo real de Bayup.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-5 py-2.5 bg-gray-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-xl">
                            Reporte Financiero PDF
                        </button>
                    </div>
                </div>

                {/* AI Insight Card */}
                <div className="bg-gradient-to-r from-[#002222] to-[#004d4d] p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Activity size={100} />
                    </div>
                    <div className="relative z-10 flex gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                            <Activity size={20} className="text-[#00ffff]" />
                        </div>
                        <div className="space-y-1 max-w-3xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#00ffff]">Bayt AI Insights</p>
                            <p className="text-sm font-medium leading-relaxed opacity-90">
                                {generateAISummary(stats)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. KPIs Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Facturación Total" 
                    value={formatCurrency(stats.total_revenue)} 
                    icon={<DollarSign size={20} className="text-green-600" />}
                    trend="+12.5%" 
                    trendUp={true}
                />
                <StatCard 
                    title="Ganancia Neta (Comisión)" 
                    value={formatCurrency(stats.total_commission)} 
                    icon={<DollarSign size={20} className="text-[#004d4d]" />}
                    trend="+5.2%" 
                    trendUp={true}
                />
                <StatCard 
                    title="Empresas Activas" 
                    value={stats.active_companies} 
                    icon={<Building2 size={20} className="text-blue-600" />}
                    trend="+2" 
                    trendUp={true}
                />
                <StatCard 
                    title="Afiliados Activos" 
                    value={stats.active_affiliates} 
                    icon={<Users size={20} className="text-amber-600" />}
                    trend="+8" 
                    trendUp={true}
                />
            </div>

            {/* 3. Panel Dividido */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Top Empresas */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden h-full">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                            <h2 className="text-lg font-bold text-gray-800">Top Empresas por Facturación</h2>
                            <button className="text-[10px] font-black uppercase tracking-widest text-[#004d4d] hover:text-[#003333]">Ver todas</button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {stats.top_companies.length > 0 ? (
                                stats.top_companies.map((company: any, index: number) => (
                                    <div key={index} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-500 text-xs">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900">{company.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{company.plan} Plan</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-gray-900">{formatCurrency(company.revenue)}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 text-center text-gray-400 text-xs font-medium">No hay datos de ventas aún.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Alertas Críticas */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                            <h2 className="text-lg font-bold text-gray-800">Alertas del Sistema</h2>
                        </div>
                        <div className="flex-1 p-6 space-y-4">
                            {stats.recent_alerts.map((alert: any) => (
                                <div key={alert.id} className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div className="mt-1">
                                        {alert.type === 'warning' && <AlertTriangle size={16} className="text-amber-500" />}
                                        {alert.type === 'success' && <CheckCircle2 size={16} className="text-green-500" />}
                                        {alert.type === 'info' && <Info size={16} className="text-blue-500" />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">{alert.message}</p>
                                        <p className="text-[10px] font-medium text-gray-400 mt-1">{alert.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 border-t border-gray-50">
                            <button className="w-full py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                                Ver Logs Técnicos
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