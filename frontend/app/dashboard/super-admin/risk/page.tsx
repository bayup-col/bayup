"use client";

import { useState } from 'react';
import { 
    ShieldCheck, 
    ShieldAlert, 
    Zap, 
    Ban, 
    Eye, 
    Lock, 
    AlertTriangle,
    Flag,
    UserX
} from 'lucide-react';

export default function GlobalRisk() {
    const threats = [
        { id: 'AN-901', source: 'IP: 182.16.xx.xx', type: 'Fuerza Bruta', level: 'Crítico', shop: 'Nike Store', time: 'hace 2 min' },
        { id: 'AN-902', source: 'User: @hack_me', type: 'Venta Atípica', level: 'Alto', shop: 'Boutique XYZ', time: 'hace 15 min' },
        { id: 'AN-903', source: 'API Key: ...af12', type: 'Uso Abusivo OpenAI', level: 'Medio', shop: 'Internal', time: 'hace 1 hora' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Riesgos & Fraude</h1>
                    <p className="text-gray-500 mt-1 font-medium">Detección proactiva de anomalías y seguridad.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">
                        <Lock size={14} /> Reglas de Firewall
                    </button>
                </div>
            </div>

            {/* Risk Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 bg-[#004d4d] p-8 rounded-[2.5rem] text-white shadow-xl shadow-[#004d4d]/10 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Puntaje de Riesgo Global</p>
                        <h3 className="text-4xl font-black">Estable</h3>
                        <p className="text-xs mt-2 font-medium opacity-70 italic">Monitoreo 24/7 activo por Bayt Shield.</p>
                    </div>
                    <ShieldCheck size={64} className="opacity-20" />
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-center text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">IPs Bloqueadas</p>
                    <h3 className="text-3xl font-black text-gray-900">1,245</h3>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-center text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Intentos Hoy</p>
                    <h3 className="text-3xl font-black text-rose-600">12</h3>
                </div>
            </div>

            {/* Threat List */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">Alertas Recientes</h2>
                    <span className="flex items-center gap-2 text-[10px] font-black text-rose-600 uppercase animate-pulse">
                        <div className="h-1.5 w-1.5 rounded-full bg-rose-600"></div> Vivo
                    </span>
                </div>
                <div className="divide-y divide-gray-50">
                    {threats.map((th) => (
                        <div key={th.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-center gap-6">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${th.level === 'Crítico' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                    <ShieldAlert size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{th.type} - {th.source}</p>
                                    <div className="flex gap-4 mt-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{th.shop}</span>
                                        <span className={`text-[10px] font-black uppercase italic ${th.level === 'Crítico' ? 'text-rose-600' : 'text-amber-600'}`}>{th.level}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="h-10 px-4 bg-gray-50 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:bg-gray-900 hover:text-white transition-all">Ver Detalles</button>
                                <button className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">
                                    <UserX size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
