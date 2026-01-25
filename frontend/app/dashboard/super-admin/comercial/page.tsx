"use client";

import { useState } from 'react';

export default function ComercialModule() {
    const [monthRange, setMonthRange] = useState({ start: 'Enero', end: 'Marzo' });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    // --- MOCK DATA ---
    const stats = [
        { title: "Ingresos Totales", value: 1250400, trend: +18.5, icon: '💰' },
        { title: "Volumen Operado", value: 8450000, trend: +12.2, icon: '📈' },
        { title: "Facturación Afiliados", value: 3240000, trend: +24.8, icon: '🤝' }, // NUEVO KPI
        { title: "Empresas Activas", value: 156, trend: +5, icon: '🏢', isCurrency: false },
    ];

    const topAffiliates = [
        { name: "Juan Camilo Marketing", shops: 12, totalGMV: 1450000, level: 'Platinum' },
        { name: "Agencia ScaleUp", shops: 8, totalGMV: 920000, level: 'Gold' },
        { name: "Laura Influencer", shops: 25, totalGMV: 450000, level: 'Gold' },
        { name: "Andrés E-commerce", shops: 5, totalGMV: 310000, level: 'Silver' },
        { name: "Comunidad Tech", shops: 14, totalGMV: 110000, level: 'Silver' },
    ];

    const topClients = [
        { name: "Distribuidora Global", total: 850000, avg: 280000, growth: "+12%" },
        { name: "Supermercados El Rey", total: 720000, avg: 240000, growth: "+8%" },
        { name: "Tecnología Avanzada SA", total: 610000, avg: 203000, growth: "+15%" },
        { name: "Moda Paris Boutique", total: 540000, avg: 180000, growth: "-2%" },
        { name: "Ferretería Central", total: 490000, avg: 163000, growth: "+5%" },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            
            {/* Header y Filtro */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Módulo Comercial</h1>
                    <p className="text-gray-500 mt-1 font-medium">Evaluación de rendimiento y crecimiento de la red.</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-black uppercase text-gray-400 ml-2">Periodo:</span>
                    <select className="bg-transparent text-sm font-bold text-purple-600 outline-none cursor-pointer">
                        <option selected>Marzo 2024</option>
                    </select>
                </div>
            </div>

            {/* Grid de KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((s) => (
                    <div key={s.title} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all relative group overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl shadow-inner">{s.icon}</div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${s.trend > 0 ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                                {s.trend > 0 ? '↑' : '↓'} {Math.abs(s.trend)}%
                            </span>
                        </div>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{s.title}</p>
                        <h3 className="text-2xl font-black text-gray-900 mt-1">
                            {s.isCurrency !== false ? formatCurrency(s.value) : s.value}
                        </h3>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-50 group-hover:bg-purple-500 transition-all"></div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. Gráfica de Crecimiento */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-8 italic flex items-center gap-2">
                        📊 Crecimiento Mensual de Ingresos
                    </h2>
                    <div className="h-64 flex items-end justify-between gap-4">
                        {[40, 55, 45, 70, 85, 100].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col gap-3 group">
                                <div className="relative w-full bg-gray-50 rounded-2xl h-48 overflow-hidden">
                                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t-xl transition-all duration-1000" style={{ height: `${h}%` }}></div>
                                </div>
                                <span className="text-[10px] font-black text-gray-400 text-center uppercase">Mes {i+1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Top Clientes MVP */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                        <h2 className="text-lg font-bold text-gray-800 italic">Top Clientes (MVP)</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {topClients.map((c, i) => (
                            <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-purple-600 bg-purple-50 h-6 w-6 rounded-lg flex items-center justify-center">{i+1}</span>
                                    <div>
                                        <p className="text-xs font-black text-gray-900">{c.name}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">Avg: {formatCurrency(c.avg)}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-green-600">{c.growth}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- NUEVA SECCIÓN: PROGRAMA DE AFILIADOS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Ranking de Afiliados (5/12) */}
                <div className="lg:col-span-5 bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-xl font-black italic mb-6 flex items-center gap-3 text-purple-400">
                            🏆 Ranking de Afiliados Estrella
                        </h2>
                        <div className="space-y-4">
                            {topAffiliates.map((af, i) => (
                                <div key={af.name} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <span className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-amber-400 text-amber-950' : 'bg-white/10 text-gray-400'}`}>
                                            {i + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">{af.name}</p>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{af.shops} tiendas referidas</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-green-400">{formatCurrency(af.totalGMV)}</p>
                                        <p className="text-[9px] font-bold text-gray-500 uppercase">{af.level}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Efecto de fondo */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
                </div>

                {/* Columna Derecha: Alertas y Sugerencias (7/12) */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="h-20 w-20 bg-purple-50 rounded-3xl flex items-center justify-center text-4xl shadow-inner">💡</div>
                        <div className="flex-1">
                            <h4 className="text-lg font-black text-gray-900 tracking-tight">Estrategia de Afiliados</h4>
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                Los afiliados están moviendo el **38.3% del volumen total**. Recomendamos crear un nivel "Black" para los que superen el $1M en GMV referido.
                            </p>
                        </div>
                        <button className="px-6 py-3 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-100">Optimizar Incentivos</button>
                    </div>

                    <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 shadow-sm">
                        <h2 className="text-lg font-bold text-rose-900 mb-4 italic flex items-center gap-2">⚠️ Riesgo de Deserción (Churn)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-white rounded-2xl border border-rose-100 flex items-center gap-3">
                                <div className="h-8 w-8 bg-rose-50 rounded-lg flex items-center justify-center text-lg">💤</div>
                                <div>
                                    <p className="text-xs font-black text-gray-900">Importaciones J&K</p>
                                    <p className="text-[9px] font-bold text-rose-400 uppercase">Sin operar 45d</p>
                                </div>
                            </div>
                            <div className="p-4 bg-white rounded-2xl border border-rose-100 flex items-center gap-3">
                                <div className="h-8 w-8 bg-rose-50 rounded-lg flex items-center justify-center text-lg">💤</div>
                                <div>
                                    <p className="text-xs font-black text-gray-900">Calzado Premium</p>
                                    <p className="text-[9px] font-bold text-rose-400 uppercase">Sin operar 60d</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
