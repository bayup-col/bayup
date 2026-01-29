"use client";

import { useState } from 'react';
import { 
    Mail, 
    MessageCircle, 
    Users, 
    Target, 
    Zap, 
    BarChart3, 
    Plus,
    Tag,
    History,
    Megaphone
} from 'lucide-react';

export default function GlobalMarketing() {
    const [activeTab, setActiveTab] = useState('campaigns');

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Marketing & ROI</h1>
                    <p className="text-gray-500 mt-1 font-medium">Acciones basadas en datos reales de Estadísticas Web.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-[#004d4d] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#004d4d]/20 hover:bg-[#003333] transition-all">
                    <Plus size={14} /> Nueva Campaña Global
                </button>
            </div>

            {/* Quick Stats from Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-[#004d4d] to-[#008080] p-6 rounded-[2rem] text-white shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <BarChart3 size={20} className="opacity-80" />
                        <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-lg">Sync con Analytics</span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Segmentos Sugeridos</p>
                    <h3 className="text-xl font-black">12 Nuevos Segmentos</h3>
                    <p className="text-[10px] mt-2 opacity-70">Basado en picos de tráfico de esta semana.</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">ROI Promedio Campañas</p>
                    <h3 className="text-xl font-black text-gray-900">340%</h3>
                    <p className="text-[10px] mt-2 text-emerald-600 font-bold uppercase">+12% vs mes anterior</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Conversión Marketing</p>
                    <h3 className="text-xl font-black text-gray-900">5.8%</h3>
                    <p className="text-[10px] mt-2 text-[#004d4d] font-bold uppercase">Optimizado por Bayt AI</p>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-50 bg-gray-50/30">
                    {[
                        { id: 'campaigns', label: 'Campañas Activas', icon: <Megaphone size={14} /> },
                        { id: 'segments', label: 'Segmentación Avanzada', icon: <Target size={14} /> },
                        { id: 'discounts', label: 'Cupones Globales', icon: <Tag size={14} /> },
                        { id: 'history', label: 'Historial & ROI', icon: <History size={14} /> },
                    ].map((tab) => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-[#004d4d]' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {tab.icon} {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#004d4d] rounded-t-full"></div>}
                        </button>
                    ))}
                </div>

                <div className="p-8">
                    {activeTab === 'campaigns' && (
                        <div className="space-y-4">
                            {[
                                { name: 'Promo Cibermonday 2026', type: 'Email', reach: '45,000 users', status: 'En curso', conversion: '4.2%' },
                                { name: 'Recuperación de Carritos (Global)', type: 'WhatsApp', reach: '12,000 users', status: 'Automatizado', conversion: '8.5%' },
                                { name: 'Anuncio Mantenimiento Red', type: 'Notificación Push', reach: '100% Companies', status: 'Programado', conversion: 'N/A' },
                            ].map((camp, i) => (
                                <div key={i} className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-gray-100 hover:border-[#004d4d]/30 transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${camp.type === 'Email' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                            {camp.type === 'Email' ? <Mail size={20} /> : <MessageCircle size={20} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{camp.name}</p>
                                            <div className="flex gap-4 mt-1">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">{camp.reach}</span>
                                                <span className="text-[10px] font-black text-[#004d4d] uppercase italic">{camp.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-gray-900">{camp.conversion}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase">Conversión</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'segments' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { title: 'Usuarios Inactivos (>30 días)', count: '12,402', color: 'border-amber-200 bg-amber-50' },
                                { title: 'Top Spenders (VIP)', count: '2,150', color: 'border-[#004d4d]/20 bg-[#f0f9f9]' },
                                { title: 'Carritos Abandonados Hoy', count: '450', color: 'border-rose-200 bg-rose-50' },
                                { title: 'Nuevos Registros (Semana)', count: '1,200', color: 'border-blue-200 bg-blue-50' },
                            ].map((seg, i) => (
                                <div key={i} className={`p-8 rounded-[2.5rem] border ${seg.color} space-y-4`}>
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">{seg.title}</h4>
                                        <button className="h-8 w-8 rounded-xl bg-white/50 flex items-center justify-center hover:bg-white transition-all shadow-sm">
                                            <Zap size={14} className="text-gray-900" />
                                        </button>
                                    </div>
                                    <div>
                                        <p className="text-4xl font-black text-gray-900 tracking-tighter">{seg.count}</p>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Usuarios detectados por Analytics</p>
                                    </div>
                                    <button className="w-full py-3 bg-white/80 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">
                                        Crear Campaña para este Segmento
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
