"use client";

import { useState } from 'react';
import { 
    MessageSquare, 
    Ticket, 
    Search, 
    Filter, 
    User, 
    Clock, 
    CheckCircle2, 
    AlertCircle,
    Send
} from 'lucide-react';

export default function GlobalSupport() {
    const [selectedType, setSelectedType] = useState('Todos');

    const tickets = [
        { id: 'TK-1024', user: 'Tech Nova', type: 'Empresa', issue: 'Error en pasarela de pagos', priority: 'Alta', status: 'Abierto', time: 'hace 10 min' },
        { id: 'TK-1025', user: '@juan_afiliado', type: 'Afiliado', issue: 'Consulta liquidación marzo', priority: 'Media', status: 'Pendiente', time: 'hace 2 horas' },
        { id: 'TK-1026', user: 'Vogue Boutique', type: 'Empresa', issue: 'Cambio de plan a Gold', priority: 'Baja', status: 'Cerrado', time: 'ayer' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Centro de Soporte</h1>
                    <p className="text-gray-500 mt-1 font-medium">Gestión unificada de tickets y chats.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-600 shadow-sm hover:bg-gray-50 transition-all">
                        <Filter size={14} /> Filtrar por Tipo
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#004d4d] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#003333] transition-all shadow-xl shadow-[#004d4d]/20">
                        <MessageSquare size={14} /> Abrir Chat Global
                    </button>
                </div>
            </div>

            {/* Support Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center"><AlertCircle size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tickets Abiertos</p>
                        <h3 className="text-xl font-black text-gray-900">12</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Clock size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tiempo de Respuesta</p>
                        <h3 className="text-xl font-black text-gray-900">14m</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-[#f0f9f9] text-[#004d4d] flex items-center justify-center"><CheckCircle2 size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Resueltos Hoy</p>
                        <h3 className="text-xl font-black text-gray-900">45</h3>
                    </div>
                </div>
            </div>

            {/* Tickets Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">Bandeja de Entrada</h2>
                    <div className="relative w-64">
                        <input type="text" placeholder="Buscar ticket..." className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-[#004d4d] transition-all" />
                        <Search size={14} className="absolute left-3.5 top-2 text-gray-400" />
                    </div>
                </div>
                <div className="divide-y divide-gray-50">
                    {tickets.map((tk) => (
                        <div key={tk.id} className="p-6 flex items-center justify-between hover:bg-[#f0f9f9] transition-colors cursor-pointer group">
                            <div className="flex items-center gap-6">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black ${tk.type === 'Empresa' ? 'bg-[#f0f9f9] text-[#004d4d]' : 'bg-pink-50 text-pink-600'}`}>
                                    {tk.id.slice(0, 2)}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{tk.issue}</p>
                                    <div className="flex gap-4 mt-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tk.user} ({tk.type})</span>
                                        <span className="text-[10px] font-bold text-gray-300 uppercase italic">{tk.time}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${tk.priority === 'Alta' ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'}`}>
                                        Prioridad {tk.priority}
                                    </span>
                                </div>
                                <button className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-[#004d4d] hover:text-white transition-all text-gray-400">
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
