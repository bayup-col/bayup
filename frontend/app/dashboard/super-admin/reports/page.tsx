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
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    // Cálculos Proyectivos
    const netProfit = financialData.currentRevenue - financialData.monthlyExpenses;
    const progressToGoal = (financialData.currentRevenue / financialData.monthlyGoal) * 100;
    const remainingToGoal = financialData.monthlyGoal - financialData.currentRevenue;
    
    // Punto de equilibrio: Cuántas tiendas más necesitamos para cubrir gastos si estuviéramos en 0
    // O mejor: Cuántas tiendas promedio necesitamos para llegar a la META partiendo de donde estamos
    const shopsNeededForGoal = Math.ceil(remainingToGoal / financialData.avgRevenuePerShop);
    const shopsNeededForBreakEven = Math.ceil(financialData.monthlyExpenses / financialData.avgRevenuePerShop);

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            
            {/* 1. HEADER ESTRATÉGICO */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Business Intelligence</h1>
                    <p className="text-gray-500 mt-1 font-medium">Análisis de rentabilidad, proyecciones y cumplimiento de metas.</p>
                </div>
                <div className="bg-gray-900 text-white p-1 rounded-2xl flex">
                    <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-purple-600 rounded-xl shadow-lg">Vista Mensual</button>
                    <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all">Anual</button>
                </div>
            </div>

            {/* 2. KPIs DE CONTROL DE META (Pestaña Principal) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Card de Meta Mensual */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progreso de Meta Mensual</p>
                            <h2 className="text-4xl font-black text-gray-900 mt-1">{formatCurrency(financialData.currentRevenue)}</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-purple-600 uppercase">Objetivo</p>
                            <p className="text-lg font-bold text-gray-400">{formatCurrency(financialData.monthlyGoal)}</p>
                        </div>
                    </div>
                    
                    {/* Barra de Progreso */}
                    <div className="space-y-2">
                        <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden p-1">
                            <div 
                                className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-1000 shadow-lg shadow-purple-200"
                                style={{ width: `${progressToGoal}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                            <span>0%</span>
                            <span>{progressToGoal.toFixed(1)}% Alcanzado</span>
                            <span>100%</span>
                        </div>
                    </div>

                    <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="text-2xl">🎯</div>
                            <p className="text-sm font-bold text-purple-900 leading-tight">
                                Necesitas facturar <span className="text-purple-600 underline">{formatCurrency(remainingToGoal)}</span> adicionales para llegar a la meta.
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-purple-400 uppercase">Equivale a aprox.</p>
                            <p className="text-lg font-black text-purple-700">{shopsNeededForGoal} Empresas nuevas</p>
                        </div>
                    </div>
                </div>

                {/* Card Punto de Equilibrio (Break-even) */}
                <div className="bg-gray-900 p-8 rounded-[3rem] text-white shadow-2xl flex flex-col justify-between relative overflow-hidden group">
                    <div className="relative z-10">
                        <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest mb-6 italic">Punto de Equilibrio</h3>
                        <div className="space-y-6">
                            <div>
                                <p className="text-xs text-gray-400 font-bold">Gastos Operativos Mes</p>
                                <p className="text-2xl font-black text-rose-400">{formatCurrency(financialData.monthlyExpenses)}</p>
                            </div>
                            <div className="h-px bg-white/10 w-full"></div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold">Estado Actual</p>
                                <p className="text-2xl font-black text-green-400">+{formatCurrency(netProfit)}</p>
                                <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">Utilidad Neta Libre</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10 relative z-10 text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Mínimo para no tener pérdidas:</p>
                        <p className="text-lg font-black text-white">{shopsNeededForBreakEven} Empresas activas</p>
                    </div>
                    <div className="absolute -bottom-10 -right-10 text-9xl opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-700">⚖️</div>
                </div>
            </div>

            {/* 3. COMPARATIVA DE CRECIMIENTO Y AFILIADOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Sección Empresas (Clientes) */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                    <h3 className="text-lg font-bold text-gray-800 italic">Salud de la Red (Tiendas)</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase">Tiendas este mes</p>
                            <p className="text-2xl font-black text-gray-900">{shopGrowth[2].count}</p>
                            <span className="text-[10px] font-bold text-green-600">+14 nuevas</span>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase">Crecimiento Red</p>
                            <p className="text-2xl font-black text-gray-900">+9.8%</p>
                            <span className="text-[10px] font-bold text-gray-400 italic">vs mes anterior</span>
                        </div>
                    </div>
                    <div className="h-32 flex items-end gap-2 pt-4">
                        {shopGrowth.map((g, i) => (
                            <div key={i} className="flex-1 bg-purple-100 rounded-t-xl relative group">
                                <div className="absolute bottom-0 w-full bg-purple-600 rounded-t-xl transition-all duration-700" style={{ height: `${(g.revenue / 400000) * 100}%` }}></div>
                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400 uppercase">{g.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sección Afiliados */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                    <h3 className="text-lg font-bold text-gray-800 italic">Análisis de Afiliación</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase">Activos</p>
                            <p className="text-xl font-black text-green-600">{financialData.activeAffiliates}</p>
                        </div>
                        <div className="border-x border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase">Inactivos</p>
                            <p className="text-xl font-black text-rose-600">{financialData.inactiveAffiliates}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase">Retención</p>
                            <p className="text-xl font-black text-gray-900">78%</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl text-white shadow-xl">
                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Facturación por Afiliados</p>
                        <h4 className="text-2xl font-black mt-1">{formatCurrency(financialData.affiliateRevenue)}</h4>
                        <p className="text-xs text-indigo-100 mt-2 font-medium">
                            Representa el <span className="font-black text-white">37.6%</span> de tus ingresos totales.
                        </p>
                    </div>
                </div>

            </div>

            {/* 4. FOOTER ACCIÓN */}
            <div className="p-8 bg-white border border-gray-100 rounded-[3rem] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-gray-900 rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-gray-200">📊</div>
                    <div>
                        <h4 className="text-xl font-black text-gray-900">Informe de estado: <span className="text-green-600">Saludable</span></h4>
                        <p className="text-sm text-gray-500">Los ingresos actuales cubren el 100% de los gastos y generan utilidad.</p>
                    </div>
                </div>
                <button className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-purple-600 transition-all shadow-xl">Exportar Auditoría Financiera</button>
            </div>

        </div>
    );
}
