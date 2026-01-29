"use client";

import { useState } from 'react';
import { 
    BarChart3, 
    TrendingUp, 
    Users, 
    MousePointer2, 
    ShoppingCart, 
    Clock, 
    MapPin, 
    Calendar,
    Download,
    Filter,
    ChevronDown,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

export default function GlobalWebAnalytics() {
    const [timeRange, setTimeRange] = useState('Ultimos 30 días');

    const stats = [
        { label: 'Tráfico Total', value: '1.2M', trend: '+12.5%', icon: <Users className="text-blue-500" />, positive: true },
        { label: 'Tasa de Conversión', value: '3.4%', trend: '+0.8%', icon: <TrendingUp className="text-emerald-500" />, positive: true },
        { label: 'Carritos Abandonados', value: '12,450', trend: '-2.1%', icon: <ShoppingCart className="text-rose-500" />, positive: false },
        { label: 'Promedio Sesión', value: '4:20', trend: '+15s', icon: <Clock className="text-amber-500" />, positive: true },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Estadísticas Web Global</h1>
                    <p className="text-gray-500 mt-1 font-medium">Fuente de datos principal para la estrategia de Marketing.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
                        <Filter size={14} /> {timeRange} <ChevronDown size={14} />
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">
                        <Download size={14} /> Descargar PDF Completo
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                {stat.icon}
                            </div>
                            <span className={`flex items-center text-[10px] font-black px-2 py-1 rounded-lg ${stat.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {stat.positive ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
                                {stat.trend}
                            </span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
                    </div>
                ))}
            </div>

            {/* Main Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Traffic Sources */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                        <h2 className="text-lg font-bold text-gray-800">Tendencias de Tráfico Histórico</h2>
                        <div className="flex gap-2">
                            <span className="h-2 w-8 bg-purple-500 rounded-full"></span>
                            <span className="h-2 w-8 bg-purple-200 rounded-full"></span>
                        </div>
                    </div>
                    <div className="flex-1 p-8 flex items-end justify-between gap-2 h-64">
                        {[40, 60, 45, 90, 65, 80, 50, 70, 85, 100, 75, 95].map((h, i) => (
                            <div key={i} className="flex-1 bg-gradient-to-t from-[#004d4d] to-[#008080] rounded-t-xl hover:opacity-80 transition-all cursor-pointer group relative" style={{ height: `${h}%` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {h}%
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-6 border-t border-gray-50 bg-gray-50/20 text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enero • Febrero • Marzo • Abril • Mayo • Junio • Julio • Agosto • Septiembre • Octubre • Noviembre • Diciembre</p>
                    </div>
                </div>

                {/* Geo Location */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                        <h2 className="text-lg font-bold text-gray-800">Ubicación Geográfica</h2>
                    </div>
                    <div className="flex-1 p-8 space-y-6">
                        {[
                            { country: 'México', share: 45, color: 'bg-[#004d4d]' },
                            { country: 'Colombia', share: 25, color: 'bg-[#006666]' },
                            { country: 'España', share: 15, color: 'bg-[#008080]' },
                            { country: 'Otros', share: 15, color: 'bg-gray-300' },
                        ].map((loc, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                    <span className="text-gray-500">{loc.country}</span>
                                    <span className="text-gray-900">{loc.share}%</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className={`${loc.color} h-full`} style={{ width: `${loc.share}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Products Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Productos Más Vendidos</h2>
                    <div className="space-y-4">
                        {[1, 2, 3].map((p) => (
                            <div key={p} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-[#f0f9f9] transition-all cursor-pointer">
                                <div className="h-12 w-12 bg-white rounded-xl border border-gray-100"></div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Producto de Ejemplo #{p}</p>
                                    <p className="text-[10px] font-bold text-gray-400">1,200 Ventas este mes</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-emerald-600">+$24,500</p>
                                    <p className="text-[9px] font-black text-gray-400 uppercase">Revenue</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Horas Pico de Tráfico</h2>
                    <div className="flex items-end justify-between h-48 gap-1 px-4">
                        {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i} className="flex-1 bg-gray-100 rounded-t-sm hover:bg-[#004d4d] transition-all cursor-pointer group relative" style={{ height: `${Math.random() * 100}%` }}>
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-black opacity-0 group-hover:opacity-100">{i}h</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Distribución de 00:00 a 23:59</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
