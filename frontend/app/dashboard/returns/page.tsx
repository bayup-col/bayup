"use client";

import { useState } from 'react';

interface ReturnCase {
    id: string;
    order_id: string;
    customer: string;
    reason: string;
    type: 'return' | 'warranty';
    status: 'pending' | 'review' | 'approved' | 'rejected';
    resolution?: 'refund' | 'replacement' | 'store_credit';
    date: string;
}

const MOCK_CASES: ReturnCase[] = [
    { id: 'CAS-101', order_id: 'FAC-5001', customer: 'Roberto Gómez', reason: 'Talla incorrecta', type: 'return', status: 'pending', date: 'Hace 2 horas' },
    { id: 'CAS-098', order_id: 'FAC-4980', customer: 'Lucía Fernández', reason: 'Defecto de fábrica en costura', type: 'warranty', status: 'review', date: 'Ayer' },
    { id: 'CAS-095', order_id: 'FAC-4955', customer: 'Carlos Ruiz', reason: 'No es el color esperado', type: 'return', status: 'approved', resolution: 'store_credit', date: 'Hace 2 días' },
];

export default function ReturnsPage() {
    const [cases, setCases] = useState<ReturnCase[]>(MOCK_CASES);
    const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'resolved'>('all');

    const STATUS_CONFIG = {
        pending: { label: 'Recibido', color: 'bg-amber-50 text-amber-600 border-amber-100' },
        review: { label: 'En Revisión', color: 'bg-blue-50 text-blue-600 border-blue-100' },
        approved: { label: 'Aprobado', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        rejected: { label: 'Rechazado', color: 'bg-rose-50 text-rose-600 border-rose-100' }
    };

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Garantías & Devoluciones</h1>
                    <p className="text-gray-500 mt-2 font-medium">Gestiona incidencias post-venta y fideliza a tus clientes.</p>
                </div>
                <button 
                    onClick={() => setIsNewCaseModalOpen(true)}
                    className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all"
                >
                    + Abrir Nuevo Caso
                </button>
            </div>

            {/* KPIs de Servicio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Casos Abiertos', val: 8, icon: '🛡️', color: 'bg-purple-50 text-purple-600' },
                    { label: 'En Revisión', val: 3, icon: '🔍', color: 'bg-blue-50 text-blue-600' },
                    { label: 'Tiempo de Resolución', val: '24h', icon: '⏱️', color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Tasa de Devolución', val: '1.2%', icon: '📉', color: 'bg-rose-50 text-rose-600' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center gap-5">
                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-2xl ${kpi.color} shadow-inner`}>{kpi.icon}</div>
                        <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p><p className="text-2xl font-black text-gray-900">{kpi.val}</p></div>
                    </div>
                ))}
            </div>

            {/* Listado de Casos */}
            <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex gap-4">
                        {['all', 'pending', 'resolved'].map((t) => (
                            <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>
                                {t === 'all' ? 'Todos los Casos' : t === 'pending' ? 'Pendientes' : 'Historial Resueltos'}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-50">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Caso / Orden</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Motivo y Tipo</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {cases.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-black text-gray-900">#{c.id}</p>
                                        <p className="text-[10px] font-bold text-purple-600 mt-1 uppercase tracking-tighter">Orden: {c.order_id}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-bold text-gray-900">{c.customer}</p>
                                        <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">{c.date}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-gray-700">{c.reason}</span>
                                            <span className="text-[9px] font-black uppercase text-gray-400 mt-1">{c.type === 'warranty' ? '🛡️ Garantía' : '🔄 Devolución'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${STATUS_CONFIG[c.status].color}`}>
                                            {STATUS_CONFIG[c.status].label}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 text-gray-400 hover:text-purple-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm">Gestionar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Banner IA Servicio */}
            <div className="bg-gray-900 rounded-[3rem] p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
                <div className="h-24 w-24 bg-purple-600 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl">✨</div>
                <div className="flex-1 relative z-10">
                    <h3 className="text-2xl font-black tracking-tight">Resolución Automática con IA</h3>
                    <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-2xl">
                        Nuestra IA analiza los motivos de devolución. Si se trata de un cambio de talla común, puede generar automáticamente una **Nota de Crédito** para el cliente y coordinar la recogida con la transportadora sin que tú intervengas.
                    </p>
                </div>
                <button className="bg-white text-gray-900 px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-100 transition-all shadow-xl">Configurar Políticas</button>
                <div className="absolute -right-10 -bottom-10 text-[15rem] opacity-5 rotate-12 font-black">🛡️</div>
            </div>

            {/* MODAL: NUEVO CASO (SIMULADO) */}
            {isNewCaseModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                            <div><h2 className="text-2xl font-black text-gray-900 tracking-tight">Registrar Incidencia</h2><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Garantía o Devolución de producto</p></div>
                            <button onClick={() => setIsNewCaseModalOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-gray-50 text-gray-400 text-xl transition-colors">✕</button>
                        </div>
                        <div className="p-10 space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1"># de Orden Original</label><input type="text" placeholder="Ej: FAC-5001" className="w-full mt-2 p-4 bg-gray-50 rounded-2xl outline-none focus:bg-white border border-transparent focus:border-purple-200 transition-all text-sm font-bold shadow-inner" /></div>
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Solicitud</label><select className="w-full mt-2 p-4 bg-gray-50 rounded-2xl outline-none focus:bg-white border border-transparent focus:border-purple-200 transition-all text-sm font-bold text-gray-700 shadow-inner"><option>Devolución (Cambio)</option><option>Garantía (Falla)</option></select></div>
                            </div>
                            <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción del Problema</label><textarea rows={4} placeholder="Detalla qué sucedió con el producto..." className="w-full mt-2 p-4 bg-gray-50 rounded-2xl outline-none focus:bg-white border border-transparent focus:border-purple-200 transition-all text-sm font-medium shadow-inner" /></div>
                            <div className="p-6 border-2 border-dashed border-gray-100 rounded-[2rem] text-center hover:bg-gray-50 cursor-pointer transition-all"><p className="text-sm font-bold text-gray-400">📸 Adjuntar fotos de evidencia</p></div>
                        </div>
                        <div className="p-10 pt-0"><button onClick={() => setIsNewCaseModalOpen(false)} className="w-full bg-gray-900 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl">Iniciar Proceso de Reclamo</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
