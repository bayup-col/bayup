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

export default function GlobalTreasury() {
    const [filterMonth, setFilterMonth] = useState('Marzo 2026');

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
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Tesorería & Caja</h1>
                    <p className="text-gray-500 mt-1 font-medium">Control financiero total de la red Bayup.</p>
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
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform"><DollarSign size={120} /></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Saldo en Bóveda</p>
                    <h3 className="text-3xl font-black text-gray-900">$854,200.00</h3>
                    <div className="flex items-center gap-2 mt-4 text-[#004d4d] font-black text-[10px] uppercase">
                        <ArrowUpCircle size={14} /> +15.4% este mes
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform"><ArrowDownCircle size={120} /></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Egresos Programados</p>
                    <h3 className="text-3xl font-black text-rose-600">$12,450.00</h3>
                    <p className="text-[10px] mt-4 text-gray-400 font-bold uppercase tracking-widest">3 pagos pendientes hoy</p>
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
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <h2 className="text-lg font-bold text-gray-800">Historial de Movimientos</h2>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500">Filtrar por Tipo</button>
                        <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500">{filterMonth}</button>
                    </div>
                </div>
                <div className="divide-y divide-gray-50">
                    {movements.map((move) => (
                        <div key={move.id} className="p-6 flex items-center justify-between hover:bg-[#f0f9f9] transition-colors">
                            <div className="flex items-center gap-6">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${move.type === 'Ingreso' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {move.type === 'Ingreso' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{move.concept}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{move.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <p className={`text-sm font-black ${move.type === 'Ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {move.type === 'Ingreso' ? '+' : '-'}${move.amount.toLocaleString()}
                                    </p>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${move.status === 'Pendiente' ? 'bg-amber-100 text-amber-600' : move.status === 'Programado' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                        {move.status}
                                    </span>
                                </div>
                                <button className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-gray-900 hover:text-white transition-all text-gray-400">
                                    <Download size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <button className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 bg-gray-50/30 hover:bg-gray-50 transition-all">
                    Cargar más movimientos
                </button>
            </div>
        </div>
    );
}
