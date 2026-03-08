"use client";

import { useState } from 'react';

export default function SuperAdminReports() {
    // --- MOCK DATA PARA ANÁLISIS ---
    const financialData = {
        monthlyGoal: 500000,
        currentRevenue: 385000,
        monthlyExpenses: 210000,
        avgRevenuePerShop: 12500, // Lo que nos deja cada tienda en promedio (2.5%)
        activeAffiliates: 45,
        inactiveAffiliates: 12,
        affiliateRevenue: 145000, // Facturación traída por afiliados
    };

    const shopGrowth = [
        { month: 'Ene', count: 120, revenue: 280000 },
        { month: 'Feb', count: 142, revenue: 320000 },
        { month: 'Mar', count: 156, revenue: 385000 },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    };

    // Cálculos Proyectivos
    const netProfit = financialData.currentRevenue - financialData.monthlyExpenses;
    const progressToGoal = (financialData.currentRevenue / financialData.monthlyGoal) * 100;
    const remainingToGoal = financialData.monthlyGoal - financialData.currentRevenue;
    
    const shopsNeededForGoal = Math.ceil(remainingToGoal / financialData.avgRevenuePerShop);
    const shopsNeededForBreakEven = Math.ceil(financialData.monthlyExpenses / financialData.avgRevenuePerShop);

    const GlassCard = ({ children, className = "" }: any) => (
        <div className={`bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group ${className}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />
            <div className="relative z-10">{children}</div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 pb-24 animate-in fade-in duration-1000">
            
            {/* 1. HEADER ESTRATÉGICO ELITE */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-cyan/10 border border-cyan/20 rounded-full flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" />
                            <span className="text-[8px] font-black text-cyan uppercase tracking-widest">BUSINESS INTELLIGENCE v4.0</span>
                        </div>
                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em]">Sector: Financial Analytics</span>
                    </div>
                    <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Métricas de <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan to-[#004D4D]">Rendimiento</span>
                    </h1>
                </div>
                <div className="bg-white/5 border border-white/10 p-1.5 rounded-[2rem] flex items-center shadow-2xl">
                    <button className="px-10 py-4 text-[10px] font-black uppercase tracking-widest bg-cyan text-[#001A1A] rounded-2xl shadow-xl shadow-cyan/20 transition-all">Vista Mensual</button>
                    <button className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Anual</button>
                </div>
            </header>

            {/* 2. KPIs DE CONTROL DE META */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* Cristal de Meta Mensual */}
                <GlassCard className="lg:col-span-2 space-y-10">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-2">Progreso de Meta Mensual</p>
                            <h2 className="text-6xl font-black text-white italic tracking-tighter">{formatCurrency(financialData.currentRevenue)}</h2>
                        </div>
                        <div className="text-right space-y-2">
                            <p className="text-[10px] font-black text-cyan uppercase tracking-widest">Objetivo Final</p>
                            <p className="text-2xl font-black text-white/20 italic">{formatCurrency(financialData.monthlyGoal)}</p>
                        </div>
                    </div>
                    
                    {/* Barra de Progreso Elite */}
                    <div className="space-y-4">
                        <div className="w-full bg-white/5 h-6 rounded-full overflow-hidden p-1.5 border border-white/5 shadow-inner">
                            <div 
                                className="h-full bg-gradient-to-r from-[#004D4D] via-cyan to-white rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(0,242,255,0.4)]"
                                style={{ width: `${progressToGoal}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/20">
                            <span>Inhibición 0%</span>
                            <span className="text-cyan font-black">{progressToGoal.toFixed(1)}% Cumplido</span>
                            <span>Carga 100%</span>
                        </div>
                    </div>

                    <div className="bg-cyan/5 p-8 rounded-[2.5rem] border border-cyan/10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="h-14 w-14 bg-cyan/10 rounded-2xl flex items-center justify-center text-3xl border border-cyan/20 shadow-lg shadow-cyan/5">🚀</div>
                            <p className="text-sm font-black text-white tracking-tight uppercase leading-relaxed max-w-sm">
                                Se requiere inyectar <span className="text-cyan underline decoration-cyan/30 underline-offset-4">{formatCurrency(remainingToGoal)}</span> adicionales para alcanzar el objetivo.
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Proyección de Crecimiento</p>
                            <p className="text-2xl font-black text-cyan italic mt-1">+{shopsNeededForGoal} Tenants</p>
                        </div>
                    </div>
                </GlassCard>

                {/* Cristal Punto de Equilibrio */}
                <GlassCard className="bg-[#001A1A] border-cyan/20 shadow-[0_0_80px_rgba(0,242,255,0.05)] flex flex-col justify-between">
                    <div className="space-y-10">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[10px] font-black text-cyan uppercase tracking-[0.4em] italic">Punto de Equilibrio</h3>
                            <div className="h-2 w-2 rounded-full bg-cyan animate-pulse shadow-[0_0_10px_rgba(0,242,255,0.8)]" />
                        </div>
                        <div className="space-y-8">
                            <div className="group">
                                <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-1">Gastos de Operación</p>
                                <p className="text-4xl font-black text-rose-500 italic tracking-tighter group-hover:scale-105 transition-all transition-duration-500">{formatCurrency(financialData.monthlyExpenses)}</p>
                            </div>
                            <div className="h-px bg-white/5 w-full"></div>
                            <div className="group">
                                <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-1">Utilidad Neta Libre</p>
                                <p className="text-4xl font-black text-emerald-400 italic tracking-tighter group-hover:scale-105 transition-all transition-duration-500">+{formatCurrency(netProfit)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/5 text-center">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">Umbral de Sostenibilidad</p>
                        <p className="text-2xl font-black text-white italic tracking-tighter">{shopsNeededForBreakEven} Empresas activas</p>
                    </div>
                </GlassCard>
            </div>

            {/* 3. COMPARATIVA DE CRECIMIENTO Y AFILIADOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                {/* Salud de la Red (Glass) */}
                <GlassCard className="space-y-10">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Análisis de Flujo Red</h3>
                        <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-white/20"><span className="text-xs">📊</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] hover:bg-white/[0.05] transition-all">
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Volumen de Red</p>
                            <p className="text-3xl font-black text-white italic tracking-tighter">{shopGrowth[2].count}</p>
                            <span className="text-[9px] font-black text-cyan uppercase mt-1 inline-block">+14 NUEVOS TENANTS</span>
                        </div>
                        <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] hover:bg-white/[0.05] transition-all">
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Crecimiento Orgánico</p>
                            <p className="text-3xl font-black text-white italic tracking-tighter">+9.8%</p>
                            <span className="text-[9px] font-black text-white/10 uppercase mt-1 inline-block">MÉTRICA INTERMENSUAL</span>
                        </div>
                    </div>
                    <div className="h-40 flex items-end gap-3 pt-6">
                        {shopGrowth.map((g, i) => (
                            <div key={i} className="flex-1 bg-white/5 rounded-t-[1.5rem] relative group cursor-pointer overflow-hidden">
                                <motion.div initial={{ height: 0 }} animate={{ height: `${(g.revenue / 400000) * 100}%` }} className="absolute bottom-0 w-full bg-gradient-to-t from-[#004D4D] to-cyan rounded-t-[1.5rem] transition-all duration-700 group-hover:opacity-80" />
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[9px] font-black text-white/20 uppercase opacity-0 group-hover:opacity-100 transition-all">{g.month}</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Análisis Afiliados (Glass) */}
                <GlassCard className="space-y-10">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Fuerza de Ventas Externas</h3>
                        <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-white/20"><span className="text-xs">🤝</span></div>
                    </div>
                    <div className="grid grid-cols-3 gap-6 text-center">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Activos</p>
                            <p className="text-2xl font-black text-emerald-400 italic tracking-tighter">{financialData.activeAffiliates}</p>
                        </div>
                        <div className="space-y-1 border-x border-white/5">
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Bajas</p>
                            <p className="text-2xl font-black text-rose-500 italic tracking-tighter">{financialData.inactiveAffiliates}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Loyalty</p>
                            <p className="text-2xl font-black text-white italic tracking-tighter">78%</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-[#004D4D] to-[#001A1A] p-8 rounded-[2.5rem] border border-cyan/20 shadow-xl shadow-cyan/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan/10 rounded-full blur-3xl group-hover:bg-cyan/20 transition-all" />
                        <p className="text-[10px] font-black text-cyan uppercase tracking-[0.3em] mb-2">Recaudo Red Afiliados</p>
                        <h4 className="text-4xl font-black text-white italic tracking-tighter">{formatCurrency(financialData.affiliateRevenue)}</h4>
                        <p className="text-[10px] text-white/40 mt-4 font-black uppercase tracking-widest">
                            Representa el <span className="text-white">37.6%</span> del volumen transaccional global.
                        </p>
                    </div>
                </GlassCard>

            </div>

            {/* 4. FOOTER ACCIÓN ELITE */}
            <div className="p-10 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[4rem] shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10">
                <div className="flex items-center gap-8">
                    <div className="h-20 w-20 bg-[#001A1A] rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl border border-cyan/20">📡</div>
                    <div className="space-y-1">
                        <h4 className="text-2xl font-black text-white tracking-tighter italic uppercase">Estado de Red: <span className="text-emerald-400">Óptimo</span></h4>
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Los flujos actuales garantizan la escalabilidad de la infraestructura.</p>
                    </div>
                </div>
                <button className="bg-cyan text-[#001A1A] px-12 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-2xl shadow-cyan/30 flex items-center gap-4">
                    Generar Auditoría Global <span className="text-xl">➔</span>
                </button>
            </div>

        </div>
    );
}
