"use client";

import { useState } from 'react';
import {
    DollarSign,
    ArrowUpCircle,
    ArrowDownCircle,
    Wallet,
    FileSpreadsheet,
    PieChart,
    Plus,
    Calendar,
    Download,
    CreditCard
} from 'lucide-react';
import { useTheme } from '@/context/theme-context';

export default function GlobalTreasury() {
    const { theme } = useTheme();
    const [filterMonth, setFilterMonth] = useState('Marzo 2026');

    // Variables de estilo por tema
    const textPrimary = theme === 'dark' ? 'text-white/90' : 'text-gray-900';
    const textSecondary = theme === 'dark' ? 'text-white/50' : 'text-gray-500';
    const textMuted = theme === 'dark' ? 'text-white/40' : 'text-gray-400';
    const cardBg = theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm';
    const tableBg = theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm';
    const tableHeader = theme === 'dark' ? 'bg-white/[0.03] border-white/5' : 'bg-gray-50 border-gray-100';
    const tableRow = theme === 'dark' ? 'border-white/5 hover:bg-white/5' : 'border-gray-50 hover:bg-gray-50/50';
    const divider = theme === 'dark' ? 'divide-white/5' : 'divide-gray-50';
    const btnSecondary = theme === 'dark' ? 'bg-white/5 border-white/10 text-white/50' : 'bg-gray-100 border-gray-200 text-gray-500';
    const iconBtn = theme === 'dark' ? 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-700';
    const loadMore = theme === 'dark' ? 'text-white/30 bg-white/[0.03] hover:bg-white/5' : 'text-gray-400 bg-gray-50 hover:bg-gray-100';

    const movements = [
        { id: '1', concept: 'Comisión Ventas Red Nike', type: 'Ingreso', amount: 4500.50, status: 'Completado', date: 'Hoy, 10:45 AM' },
        { id: '2', concept: 'Pago Hosting AWS (S3 & EC2)', type: 'Egreso', amount: 1200.00, status: 'Programado', date: 'Mañana' },
        { id: '3', concept: 'Pago Afiliado: @juan_tech', type: 'Egreso', amount: 850.00, status: 'Pendiente', date: 'Ayer' },
        { id: '4', concept: 'Ingreso Suscripción Plan Gold (TechHub)', type: 'Ingreso', amount: 299.00, status: 'Completado', date: '27 Mar 2026' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className={`text-3xl font-black tracking-tight italic ${textPrimary}`}>Tesorería & Caja</h1>
                    <p className={`mt-1 font-medium ${textSecondary}`}>Control financiero total de la red Bayup.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#004d4d] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#004d4d]/20 hover:bg-[#003333] transition-all">
                        <Plus size={14} /> Registrar Movimiento
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">
                        <FileSpreadsheet size={14} /> Exportación Contable
                    </button>
                </div>
            </div>

            {/* Balances */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group border ${cardBg}`}>
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform"><DollarSign size={120} /></div>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${textMuted}`}>Saldo en Bóveda</p>
                    <h3 className={`text-3xl font-black ${textPrimary}`}>$854,200.00</h3>
                    <div className="flex items-center gap-2 mt-4 text-cyan font-black text-[10px] uppercase">
                        <ArrowUpCircle size={14} /> +15.4% este mes
                    </div>
                </div>
                <div className={`p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group border ${cardBg}`}>
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform"><ArrowDownCircle size={120} /></div>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${textMuted}`}>Egresos Programados</p>
                    <h3 className="text-3xl font-black text-rose-400">$12,450.00</h3>
                    <p className={`text-[10px] mt-4 font-bold uppercase tracking-widest ${textMuted}`}>3 pagos pendientes hoy</p>
                </div>
                <div className="bg-[#002222] p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"><Wallet size={120} /></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#00ffff] mb-1">Fondo de Reserva</p>
                    <h3 className="text-3xl font-black">$50,000.00</h3>
                    <button className="mt-4 text-[9px] font-black uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-all">
                        Gestionar Fondo
                    </button>
                </div>
            </div>

            {/* Table of Movements */}
            <div className={`rounded-[2.5rem] shadow-sm overflow-hidden border ${tableBg}`}>
                <div className={`p-8 border-b flex justify-between items-center ${tableHeader}`}>
                    <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white/80' : 'text-gray-700'}`}>Historial de Movimientos</h2>
                    <div className="flex gap-2">
                        <button className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest ${btnSecondary}`}>Filtrar por Tipo</button>
                        <button className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest ${btnSecondary}`}>{filterMonth}</button>
                    </div>
                </div>
                <div className={`divide-y ${divider}`}>
                    {movements.map((move) => (
                        <div key={move.id} className={`p-6 flex items-center justify-between transition-colors ${tableRow}`}>
                            <div className="flex items-center gap-6">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${move.type === 'Ingreso' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                    {move.type === 'Ingreso' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                                </div>
                                <div>
                                    <p className={`text-sm font-black uppercase tracking-tight ${textPrimary}`}>{move.concept}</p>
                                    <p className={`text-[10px] font-bold uppercase mt-1 ${textMuted}`}>{move.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <p className={`text-sm font-black ${move.type === 'Ingreso' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {move.type === 'Ingreso' ? '+' : '-'}${move.amount.toLocaleString()}
                                    </p>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${move.status === 'Pendiente' ? 'bg-amber-500/20 text-amber-400' : move.status === 'Programado' ? 'bg-blue-500/20 text-blue-400' : theme === 'dark' ? 'bg-white/10 text-white/40' : 'bg-gray-100 text-gray-400'}`}>
                                        {move.status}
                                    </span>
                                </div>
                                <button className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${iconBtn}`}>
                                    <Download size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <button className={`w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${loadMore}`}>
                    Cargar más movimientos
                </button>
            </div>
        </div>
    );
}
