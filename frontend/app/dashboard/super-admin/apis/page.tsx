"use client";

import { useState } from 'react';
import { 
    Zap, 
    Link2, 
    Activity, 
    ShieldAlert, 
    Globe, 
    Server,
    Settings,
    RefreshCcw,
    Lock
} from 'lucide-react';

export default function GlobalAPIs() {
    const integrations = [
        { name: 'OpenAI (Bayt AI)', status: 'Online', latency: '240ms', usage: '85%', color: 'bg-emerald-500' },
        { name: 'Mercado Pago', status: 'Online', latency: '120ms', usage: '42%', color: 'bg-emerald-500' },
        { name: 'Stripe Global', status: 'Online', latency: '95ms', usage: '12%', color: 'bg-emerald-500' },
        { name: 'n8n Automations', status: 'Degradado', latency: '1.2s', usage: '98%', color: 'bg-amber-500' },
        { name: 'AWS S3 (Images)', status: 'Online', latency: '45ms', usage: '20%', color: 'bg-emerald-500' },
        { name: 'WhatsApp API', status: 'Online', latency: '310ms', usage: '65%', color: 'bg-emerald-500' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">APIs & Integraciones</h1>
                    <p className="text-gray-500 mt-1 font-medium">Estado técnico y control de servicios externos.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">
                    <RefreshCcw size={14} /> Forzar Re-Sincronización
                </button>
            </div>

            {/* Integration Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map((api, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
                                    <Link2 size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">{api.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className={`h-1.5 w-1.5 rounded-full ${api.color} animate-pulse`}></div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${api.color.replace('bg-', 'text-')}`}>{api.status}</span>
                                    </div>
                                </div>
                            </div>
                            <button className="h-8 w-8 rounded-lg hover:bg-gray-50 flex items-center justify-center text-gray-400">
                                <Settings size={14} />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Latencia</p>
                                <p className="text-xs font-black text-gray-900">{api.latency}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Uso de Cuota</p>
                                <p className="text-xs font-black text-gray-900">{api.usage}</p>
                            </div>
                        </div>

                        <button className="w-full mt-6 py-3 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-900 hover:text-white transition-all">
                            Ver Logs de Errores
                        </button>
                    </div>
                ))}
            </div>

            {/* Webhooks Management */}
            <div className="bg-[#002222] p-10 rounded-[3rem] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10"><Server size={150} /></div>
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-[#004d4d] flex items-center justify-center shadow-lg"><Activity size={24} /></div>
                        <div>
                            <h2 className="text-2xl font-black italic tracking-tighter">Gestor de Webhooks</h2>
                            <p className="text-[#00ffff] text-xs font-bold uppercase tracking-widest">Escuchando eventos en tiempo real.</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center"><Zap size={14} className="text-emerald-500" /></div>
                                <span className="text-sm font-bold uppercase tracking-widest">order.created</span>
                            </div>
                            <span className="text-[10px] font-black text-emerald-400 uppercase">Activo</span>
                        </div>
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-8 rounded-full bg-rose-500/20 flex items-center justify-center"><ShieldAlert size={14} className="text-rose-500" /></div>
                                <span className="text-sm font-bold uppercase tracking-widest">payment.failed</span>
                            </div>
                            <span className="text-[10px] font-black text-rose-400 uppercase">Activo</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
