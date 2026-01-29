"use client";

import { useState } from 'react';
import { 
    Activity, 
    Server, 
    Database, 
    Cloud, 
    Terminal, 
    AlertCircle,
    Cpu,
    Zap
} from 'lucide-react';

export default function GlobalObservability() {
    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Observabilidad Técnica</h1>
                    <p className="text-gray-500 mt-1 font-medium">Logs, métricas y estado de la infraestructura en vivo.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">
                        <Terminal size={14} /> Consola en Vivo
                    </button>
                </div>
            </div>

            {/* Infrastructure Health */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'API Backend', status: 'Healthy', val: '99.9%', icon: <Server size={20} />, color: 'text-emerald-500' },
                    { label: 'Database (Postgres)', status: 'Healthy', val: '25ms', icon: <Database size={20} />, color: 'text-emerald-500' },
                    { label: 'Frontend (Vercel)', status: 'Healthy', val: '98ms', icon: <Cloud size={20} />, color: 'text-emerald-500' },
                    { label: 'Worker Queue', status: 'Busy', val: '1,200/s', icon: <Cpu size={20} />, color: 'text-blue-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">{stat.icon}</div>
                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-gray-50 ${stat.color}`}>{stat.status}</span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
                        <h3 className="text-xl font-black text-gray-900">{stat.val}</h3>
                    </div>
                ))}
            </div>

            {/* Error Logs Console */}
            <div className="bg-[#001111] p-10 rounded-[3rem] shadow-2xl relative overflow-hidden font-mono">
                <div className="flex justify-between items-center mb-6 text-white/50 border-b border-white/10 pb-6">
                    <div className="flex items-center gap-2">
                        <Terminal size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">system_logs_stream</span>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                        <div className="h-2 w-2 rounded-full bg-[#00ffff]"></div>
                    </div>
                </div>
                <div className="space-y-3 text-[11px]">
                    <p className="text-[#00ffff]"><span className="text-white/30">[10:45:01]</span> INFO: API Request /auth/login - 200 OK (45ms)</p>
                    <p className="text-[#00ffff]"><span className="text-white/30">[10:45:05]</span> INFO: Webhook payment.succeeded processed for order_892</p>
                    <p className="text-amber-400"><span className="text-white/30">[10:45:10]</span> WARN: Latency spike detected in OpenAI integration (1.5s)</p>
                    <p className="text-rose-400"><span className="text-white/30">[10:45:12]</span> ERROR: Failed to fetch inventory for shop_nike (Timeout)</p>
                    <p className="text-[#00ffff]"><span className="text-white/30">[10:45:15]</span> INFO: New user registered: dani@dani.com (super_admin)</p>
                    <p className="text-[#00ffff] animate-pulse"><span className="text-white/30">[10:45:20]</span> _</p>
                </div>
            </div>
        </div>
    );
}
