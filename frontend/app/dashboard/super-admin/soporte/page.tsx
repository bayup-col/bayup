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
import { useTheme } from '@/context/theme-context';

export default function GlobalSupport() {
    const { theme } = useTheme();
    const [selectedType, setSelectedType] = useState('Todos');

    // Variables de estilo por tema
    const textPrimary = theme === 'dark' ? 'text-white/90' : 'text-gray-900';
    const textSecondary = theme === 'dark' ? 'text-white/50' : 'text-gray-500';
    const textMuted = theme === 'dark' ? 'text-white/40' : 'text-gray-400';
    const textFaint = theme === 'dark' ? 'text-white/20' : 'text-gray-300';
    const cardBg = theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm';
    const tableBg = theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm';
    const tableHeader = theme === 'dark' ? 'bg-white/[0.03] border-white/5' : 'bg-gray-50 border-gray-100';
    const tableRow = theme === 'dark' ? 'border-white/5 hover:bg-white/5' : 'border-gray-50 hover:bg-gray-50/50';
    const divider = theme === 'dark' ? 'divide-white/5' : 'divide-gray-50';
    const inputBg = theme === 'dark' ? 'bg-white/5 border-white/10 text-white/70' : 'bg-gray-50 border-gray-200 text-gray-700';
    const btnSecondary = theme === 'dark' ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10' : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200';
    const iconBtn = theme === 'dark' ? 'bg-white/5 text-white/30 hover:bg-cyan hover:text-[#001A1A]' : 'bg-gray-100 text-gray-400 hover:bg-cyan hover:text-[#001A1A]';

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
                    <h1 className={`text-3xl font-black tracking-tight italic ${textPrimary}`}>Centro de Soporte</h1>
                    <p className={`mt-1 font-medium ${textSecondary}`}>Gestión unificada de tickets y chats.</p>
                </div>
                <div className="flex gap-3">
                    <button className={`flex items-center gap-2 px-6 py-3 border rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm transition-all ${btnSecondary}`}>
                        <Filter size={14} /> Filtrar por Tipo
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#004d4d] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#003333] transition-all shadow-xl shadow-[#004d4d]/20">
                        <MessageSquare size={14} /> Abrir Chat Global
                    </button>
                </div>
            </div>

            {/* Support Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className={`p-6 rounded-[2rem] border shadow-sm flex items-center gap-4 ${cardBg}`}>
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center"><AlertCircle size={24} /></div>
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Tickets Abiertos</p>
                        <h3 className={`text-xl font-black ${textPrimary}`}>12</h3>
                    </div>
                </div>
                <div className={`p-6 rounded-[2rem] border shadow-sm flex items-center gap-4 ${cardBg}`}>
                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center"><Clock size={24} /></div>
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Tiempo de Respuesta</p>
                        <h3 className={`text-xl font-black ${textPrimary}`}>14m</h3>
                    </div>
                </div>
                <div className={`p-6 rounded-[2rem] border shadow-sm flex items-center gap-4 ${cardBg}`}>
                    <div className="h-12 w-12 rounded-2xl bg-cyan/10 text-cyan flex items-center justify-center"><CheckCircle2 size={24} /></div>
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Resueltos Hoy</p>
                        <h3 className={`text-xl font-black ${textPrimary}`}>45</h3>
                    </div>
                </div>
            </div>

            {/* Tickets Table */}
            <div className={`rounded-[2.5rem] border shadow-sm overflow-hidden ${tableBg}`}>
                <div className={`p-8 border-b flex items-center justify-between ${tableHeader}`}>
                    <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white/80' : 'text-gray-700'}`}>Bandeja de Entrada</h2>
                    <div className="relative w-64">
                        <input
                            type="text"
                            placeholder="Buscar ticket..."
                            className={`w-full pl-10 pr-4 py-2 border rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-cyan/30 transition-all ${inputBg}`}
                        />
                        <Search size={14} className={`absolute left-3.5 top-2 ${textMuted}`} />
                    </div>
                </div>
                <div className={`divide-y ${divider}`}>
                    {tickets.map((tk) => (
                        <div key={tk.id} className={`p-6 flex items-center justify-between transition-colors cursor-pointer group ${tableRow}`}>
                            <div className="flex items-center gap-6">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black ${tk.type === 'Empresa' ? 'bg-cyan/10 text-cyan' : 'bg-pink-500/10 text-pink-400'}`}>
                                    {tk.id.slice(0, 2)}
                                </div>
                                <div>
                                    <p className={`text-sm font-black uppercase tracking-tight ${textPrimary}`}>{tk.issue}</p>
                                    <div className="flex gap-4 mt-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>{tk.user} ({tk.type})</span>
                                        <span className={`text-[10px] font-bold uppercase italic ${textFaint}`}>{tk.time}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${tk.priority === 'Alta' ? 'bg-rose-500/20 text-rose-400' : theme === 'dark' ? 'bg-white/10 text-white/40' : 'bg-gray-100 text-gray-400'}`}>
                                        Prioridad {tk.priority}
                                    </span>
                                </div>
                                <button className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${iconBtn}`}>
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
