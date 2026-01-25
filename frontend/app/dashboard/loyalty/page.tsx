"use client";

import { useState } from 'react';

interface LoyaltyRule {
    points_per_amount: number;
    currency_value: number;
}

interface Reward {
    id: string;
    title: string;
    points_cost: number;
    description: string;
    status: 'active' | 'draft';
}

const MOCK_REWARDS: Reward[] = [
    { id: 'r1', title: 'Cupón 20% Descuento', points_cost: 500, description: 'Válido para cualquier categoría.', status: 'active' },
    { id: 'r2', title: 'Envío Gratis', points_cost: 200, description: 'En compras superiores a $50.000.', status: 'active' },
    { id: 'r3', title: 'Camiseta de Regalo', points_cost: 1200, description: 'Referencia básica algodón.', status: 'draft' },
];

export default function LoyaltyPage() {
    const [rule, setRule] = useState<LoyaltyRule>({ points_per_amount: 1000, currency_value: 1 });
    const [rewards, setRewards] = useState<Reward[]>(MOCK_REWARDS);
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(amount).replace('$', '$ ');
    };

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Loyalty Pro 💎</h1>
                    <p className="text-gray-500 mt-2 font-medium">Convierte a tus compradores en fans con un Club de Puntos exclusivo.</p>
                </div>
                <button 
                    onClick={() => setIsConfigOpen(true)}
                    className="bg-gray-900 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all"
                >
                    ⚙️ Configurar Reglas
                </button>
            </div>

            {/* KPI de Fidelización */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-gray-900 p-10 rounded-[3rem] text-white relative overflow-hidden flex flex-col justify-center shadow-2xl">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Tasa de Conversión</p>
                    <h3 className="text-3xl font-black">1 Punto = {formatCurrency(rule.points_per_amount)}</h3>
                    <p className="text-xs text-gray-400 mt-4 leading-relaxed font-medium">Por cada {formatCurrency(rule.points_per_amount)} de compra, el cliente acumula {rule.currency_value} punto.</p>
                    <div className="absolute -right-6 -bottom-6 text-8xl opacity-10 rotate-12">💎</div>
                </div>
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Clientes en el Club</p>
                    <h3 className="text-3xl font-black text-gray-900">1,240 <span className="text-sm font-bold text-emerald-500 ml-2">↑ 12%</span></h3>
                    <p className="text-xs text-gray-400 mt-4 font-medium italic">Participación activa este mes.</p>
                </div>
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Puntos por Canjear</p>
                    <h3 className="text-3xl font-black text-gray-900">458,200</h3>
                    <p className="text-xs text-gray-400 mt-4 font-medium">Equivale a {formatCurrency(458200)} en descuentos.</p>
                </div>
            </div>

            {/* Catálogo de Recompensas */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Catálogo de Beneficios</h2>
                    <button className="bg-purple-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-100">+ Nueva Recompensa</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {rewards.map((r) => (
                        <div key={r.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-6">
                                <div className="h-14 w-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">🎁</div>
                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${r.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>{r.status}</span>
                            </div>
                            <h3 className="text-xl font-black text-gray-900 leading-tight">{r.title}</h3>
                            <p className="text-xs text-gray-400 mt-2 font-medium leading-relaxed">{r.description}</p>
                            <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
                                <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Costo</p><p className="text-lg font-black text-purple-600">{r.points_cost} Pts</p></div>
                                <button className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-purple-600 hover:text-white transition-all">✎</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Configuración de Reglas Modal */}
            {isConfigOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                            <div><h2 className="text-2xl font-black text-gray-900 tracking-tight">Configurar Club</h2><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Reglas de acumulación</p></div>
                            <button onClick={() => setIsConfigOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-gray-50 text-gray-400 text-xl transition-colors">✕</button>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">¿Cuánto dinero equivale a 1 Punto?</label>
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl font-black text-gray-300">$</span>
                                    <input type="number" value={rule.points_per_amount} onChange={(e) => setRule({...rule, points_per_amount: parseFloat(e.target.value)})} className="flex-1 p-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-purple-200 outline-none text-lg font-black transition-all shadow-inner" />
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium leading-relaxed italic">Ejemplo: Si pones 1.000, el cliente ganará 1 punto por cada $1.000 gastados en la tienda.</p>
                            </div>
                        </div>
                        <div className="p-10 pt-0"><button onClick={() => setIsConfigOpen(false)} className="w-full bg-gray-900 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl">Guardar Configuración</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
