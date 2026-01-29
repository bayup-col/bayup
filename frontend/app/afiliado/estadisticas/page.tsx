"use client";

import { 
    BarChart3, PieChart, TrendingUp, Users, 
    Target, Zap, ArrowUpRight, Globe,
    Activity, Layers, Sparkles, Calendar, Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';

export default function AffiliateStats() {
    const [timeRange, setTimeRange] = useState('Mensual');

    // Mapeo de datos dinámicos por periodo
    const dataByRange: any = {
        'Semanal': {
            stats: [
                { label: 'Empresas Activas', val: '42', detail: '+1 esta semana', color: 'text-blue-600', icon: <Globe size={20}/> },
                { label: 'Crecimiento Red', val: '+5.2%', detail: 'VS semana anterior', color: 'text-purple-600', icon: <TrendingUp size={20}/> },
                { label: 'Promedio Ventas', val: '$ 1.1M', detail: 'Por empresa/semana', color: 'text-emerald-600', icon: <Target size={20}/> },
                { label: 'Retención', val: '100%', detail: 'Tasa semanal', color: 'text-amber-600', icon: <Zap size={20}/> },
            ],
            growth: [
                { name: 'Lun', value: 38 },
                { name: 'Mar', value: 39 },
                { name: 'Mie', value: 40 },
                { name: 'Jue', value: 42 },
                { name: 'Vie', value: 42 },
            ],
            top: [
                { name: 'Moda Urbana Store', rev: '$ 3.2M', share: 45, color: '#9333ea' },
                { name: 'Tech Gadgets S.A.', rev: '$ 2.8M', share: 30, color: '#00F2FF' },
                { name: 'Otros', rev: '$ 1.5M', share: 25, color: '#374151' },
            ]
        },
        'Mensual': {
            stats: [
                { label: 'Empresas Activas', val: '42', detail: '+3 este mes', color: 'text-blue-600', icon: <Globe size={20}/> },
                { label: 'Crecimiento Red', val: '+24%', detail: 'VS mes anterior', color: 'text-purple-600', icon: <TrendingUp size={20}/> },
                { label: 'Promedio Ventas', val: '$ 4.2M', detail: 'Por empresa/mes', color: 'text-emerald-600', icon: <Target size={20}/> },
                { label: 'Retención', val: '98.2%', detail: 'Tasa de permanencia', color: 'text-amber-600', icon: <Zap size={20}/> },
            ],
            growth: [
                { name: 'Sep', value: 12 },
                { name: 'Oct', value: 18 },
                { name: 'Nov', value: 25 },
                { name: 'Dic', value: 34 },
                { name: 'Ene', value: 42 },
            ],
            top: [
                { name: 'Tech Gadgets S.A.', rev: '$ 45.8M', share: 32, color: '#00F2FF' },
                { name: 'Moda Urbana Store', rev: '$ 12.4M', share: 18, color: '#9333ea' },
                { name: 'Café Aroma Premium', rev: '$ 2.1M', share: 12, color: '#10b981' },
                { name: 'Otros Referidos', rev: '$ 8.5M', share: 38, color: '#374151' },
            ]
        },
        'Anual': {
            stats: [
                { label: 'Empresas Activas', val: '42', detail: '+28 este año', color: 'text-blue-600', icon: <Globe size={20}/> },
                { label: 'Crecimiento Red', val: '+145%', detail: 'VS año anterior', color: 'text-purple-600', icon: <TrendingUp size={20}/> },
                { label: 'Promedio Ventas', val: '$ 38.5M', detail: 'Por empresa/año', color: 'text-emerald-600', icon: <Target size={20}/> },
                { label: 'Retención', val: '92.5%', detail: 'Tasa anual', color: 'text-amber-600', icon: <Zap size={20}/> },
            ],
            growth: [
                { name: '2022', value: 5 },
                { name: '2023', value: 15 },
                { name: '2024', value: 28 },
                { name: '2025', value: 42 },
            ],
            top: [
                { name: 'Tech Gadgets S.A.', rev: '$ 185M', share: 40, color: '#00F2FF' },
                { name: 'Moda Urbana Store', rev: '$ 95M', share: 25, color: '#9333ea' },
                { name: 'Hogar & Confort', rev: '$ 42M', share: 15, color: '#10b981' },
                { name: 'Otros', rev: '$ 60M', share: 20, color: '#374151' },
            ]
        }
    };

    const currentData = useMemo(() => dataByRange[timeRange], [timeRange]);

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">
                        Inteligencia de <span className="text-purple-600">Rendimiento</span>
                    </h1>
                    <p className="text-gray-400 text-sm font-medium mt-1">Análisis profundo del impacto y salud de tu red de afiliados.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                        {['Semanal', 'Mensual', 'Anual'].map((range) => (
                            <button 
                                key={range} 
                                onClick={() => setTimeRange(range)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === range ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {currentData.stats.map((s: any, i: number) => (
                    <motion.div 
                        key={`${timeRange}-stat-${i}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative group overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className={`h-10 w-10 bg-gray-50 ${s.color} rounded-xl flex items-center justify-center`}>
                                {s.icon}
                            </div>
                            <ArrowUpRight size={16} className="text-emerald-500" />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                        <h3 className="text-2xl font-black text-gray-900 italic mt-2">{s.val}</h3>
                        <p className="text-[9px] font-bold text-gray-300 uppercase mt-4">{s.detail}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Retention & Growth Chart */}
                <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col min-h-[500px]">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                                <Activity size={18} className="text-purple-600" /> Crecimiento de Cartera
                            </h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Evolución {timeRange.toLowerCase()} de empresas vinculadas</p>
                        </div>
                        <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                            <Layers size={18} />
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={currentData.growth}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#9333ea" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#9333ea' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#9333ea" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Best Performing Businesses */}
                <div className="bg-gray-900 p-12 rounded-[3.5rem] text-white shadow-2xl flex flex-col min-h-[500px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5">
                        <Sparkles size={180} />
                    </div>
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-[#00F2FF] flex items-center gap-3">
                                <Target size={18} /> Top Generadores (ROI)
                            </h4>
                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Contribución {timeRange.toLowerCase()}</p>
                        </div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{timeRange === 'Anual' ? 'FY 2025' : 'Q1 2026'}</span>
                    </div>

                    <div className="flex-1 space-y-8 relative z-10">
                        {currentData.top.map((item: any, i: number) => (
                            <div key={`${timeRange}-top-${i}`} className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-black uppercase italic">{item.name}</p>
                                        <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">{item.rev} Generados</p>
                                    </div>
                                    <p className="text-xs font-black text-[#00F2FF]">{item.share}%</p>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }} 
                                        animate={{ width: `${item.share}%` }} 
                                        transition={{ duration: 1.5, delay: i * 0.2, ease: "easeOut" }}
                                        style={{ backgroundColor: item.color }}
                                        className="h-full rounded-full shadow-[0_0_10px_rgba(0,242,255,0.2)]"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-10 pt-10 border-t border-white/5 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                                <Activity size={20} className="text-[#00F2FF]" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-400">Eficiencia de Red</p>
                                <p className="text-sm font-bold italic text-white">Óptima (94%)</p>
                            </div>
                        </div>
                        <button className="text-[10px] font-black uppercase text-purple-400 hover:text-white transition-colors">Ver Auditoría</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
