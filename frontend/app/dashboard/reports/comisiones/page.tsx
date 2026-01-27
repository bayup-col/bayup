"use client";

import { useState, useEffect } from 'react';

interface CommissionRule {
    id: string;
    seller_name: string;
    rate: number;
    goal: number;
    is_active: boolean;
}

interface CommissionRecord {
    id: string;
    seller_name: string;
    total_sold: number;
    commission_rate: number;
    earned: number;
    status: 'pending' | 'liquidated';
}

const INITIAL_RULES: CommissionRule[] = [
    { id: 's1', seller_name: 'Lorena Gómez', rate: 3, goal: 50000000, is_active: true },
    { id: 's2', seller_name: 'Andrés Felipe', rate: 2, goal: 20000000, is_active: true },
    { id: 's3', seller_name: 'Marta Lucía', rate: 2.5, goal: 35000000, is_active: true },
];

export default function ComisionesPage() {
    const [records, setRecords] = useState<CommissionRecord[]>([]);
    const [rules, setRules] = useState<CommissionRule[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

    // --- SINCRONIZACIÓN CON EL EQUIPO REAL ---
    useEffect(() => {
        const savedSellers = localStorage.getItem('business_sellers');
        const savedRules = localStorage.getItem('commission_rules');
        
        if (savedSellers) {
            const sellers = JSON.parse(savedSellers);
            const currentRules = savedRules ? JSON.parse(savedRules) : [];
            
            // 1. Asegurar que cada vendedor tenga una regla de comisión
            const updatedRules: CommissionRule[] = sellers.map((s: any) => {
                const existingRule = currentRules.find((r: any) => r.id === s.id);
                return existingRule || {
                    id: s.id,
                    seller_name: s.name,
                    rate: 2.5, // Tasa por defecto
                    goal: 10000000,
                    is_active: true
                };
            });
            setRules(updatedRules);
            localStorage.setItem('commission_rules', JSON.stringify(updatedRules));

            // 2. Generar registros de liquidación basados en ventas reales de los vendedores
            const updatedRecords: CommissionRecord[] = sellers.map((s: any) => {
                const rule = updatedRules.find(r => r.id === s.id);
                const rate = rule ? rule.rate : 2.5;
                const total_sold = s.sales_month || 0;
                
                return {
                    id: `c_${s.id}`,
                    seller_name: s.name,
                    total_sold: total_sold,
                    commission_rate: rate,
                    earned: (total_sold * rate) / 100,
                    status: 'pending'
                };
            });
            setRecords(updatedRecords);
        }
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(amount).replace('$', '$ ');
    };

    const handleLiquidate = (id: string) => {
        if (confirm("¿Confirmas la liquidación de esta comisión?")) {
            setRecords(records.map(r => r.id === id ? { ...r, status: 'liquidated' } : r));
        }
    };

    const updateRule = (id: string, field: keyof CommissionRule, value: any) => {
        const updated = rules.map(r => r.id === id ? { ...r, [field]: value } : r);
        setRules(updated);
        localStorage.setItem('commission_rules', JSON.stringify(updated));
    };

    const formatNumberInput = (val: number) => {
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const unformatNumberInput = (val: string) => {
        return parseFloat(val.replace(/\./g, '')) || 0;
    };

    const totalPending = records.filter(r => r.status === 'pending').reduce((a, b) => a + b.earned, 0);

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-12 animate-in fade-in duration-500">
            {/* Header: FOCO EN METRICAS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Comisiones</h1>
                    <p className="text-gray-500 mt-2 font-medium italic">Liquida incentivos y motiva a tu equipo.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Botón Configuración Sutil */}
                    <button 
                        onClick={() => setIsConfigModalOpen(true)}
                        className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-purple-600 hover:border-purple-100 shadow-sm transition-all active:scale-90 group"
                        title="Configurar Reglas"
                    >
                        <span className="text-xl group-hover:rotate-90 transition-transform duration-500">⚙️</span>
                    </button>

                    {/* Card Protagonista */}
                    <div className="bg-gray-900 px-10 py-6 rounded-[2.5rem] text-white flex flex-col justify-center shadow-2xl relative overflow-hidden min-w-[280px]">
                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-1 relative z-10">Por liquidar este mes</p>
                        <p className="text-3xl font-black relative z-10">{formatCurrency(totalPending)}</p>
                        <div className="absolute -right-4 -bottom-4 text-7xl opacity-5 rotate-12">💰</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-50 p-1.5 rounded-2xl w-fit border border-gray-100 shadow-sm">
                <button onClick={() => setActiveTab('pending')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'pending' ? 'bg-white text-purple-700 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>📅 Pendientes</button>
                <button onClick={() => setActiveTab('history')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'history' ? 'bg-white text-purple-700 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>📜 Historial</button>
            </div>

            {/* Listado de Comisiones */}
            <div className="grid grid-cols-1 gap-6">
                {records.filter(r => activeTab === 'pending' ? r.status === 'pending' : r.status === 'liquidated').map((rec) => (
                    <div key={rec.id} className="bg-white rounded-[3rem] border border-gray-50 p-10 shadow-sm hover:shadow-xl transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-8 group relative overflow-hidden">
                        <div className="flex items-center gap-8 relative z-10">
                            <div className="h-20 w-20 bg-purple-50 text-purple-600 rounded-[2rem] flex items-center justify-center text-2xl font-black shadow-inner group-hover:scale-110 transition-transform duration-500">
                                {rec.seller_name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{rec.seller_name}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Facturación Bruta:</span>
                                    <span className="text-sm font-bold text-gray-700">{formatCurrency(rec.total_sold)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Tasa</p>
                                <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-black">{rec.commission_rate}%</span>
                            </div>
                            <div className="text-center md:text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Valor a Liquidar</p>
                                <p className="text-3xl font-black text-gray-900 tracking-tighter">{formatCurrency(rec.earned)}</p>
                            </div>
                            {rec.status === 'pending' ? (
                                <button 
                                    onClick={() => handleLiquidate(rec.id)}
                                    className="bg-gray-900 text-white px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-95"
                                >
                                    Liquidar Pago
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 px-8 py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                    <span>✓</span> Pagado
                                </div>
                            )}
                        </div>
                        <div className="absolute -right-10 -bottom-10 text-[12rem] opacity-[0.02] font-black group-hover:rotate-12 transition-transform duration-1000">REF</div>
                    </div>
                ))}
            </div>

            {/* BANNER IA RESTAURADO */}
            <div className="bg-gray-900 rounded-[3rem] p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-10 shadow-2xl">
                <div className="h-24 w-24 bg-purple-600 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl relative z-10 group-hover:scale-110 transition-transform">📊</div>
                <div className="flex-1 relative z-10 text-center md:text-left">
                    <h3 className="text-2xl font-black tracking-tight leading-tight">Inteligencia de Incentivos</h3>
                    <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-2xl font-medium">
                        El sistema liquida las comisiones sumando automáticamente las ventas de todos tus canales vinculados. Al confirmar el pago, el asesor recibirá una notificación oficial por WhatsApp.
                    </p>
                </div>
                <button className="bg-white text-gray-900 px-10 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-100 transition-all shadow-xl relative z-10">Exportar Nómina</button>
                <div className="absolute -right-10 -bottom-10 text-[15rem] opacity-5 rotate-12 font-black">✨</div>
            </div>

            {/* MODAL CONFIGURACIÓN (Manteniendo funcionalidad) */}
            {isConfigModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                            <div><h2 className="text-2xl font-black text-gray-900 tracking-tight">Reglas Administrativas</h2><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Configuración técnica de comisiones</p></div>
                            <button onClick={() => setIsConfigModalOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-gray-50 text-gray-400 text-xl">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                            <table className="min-w-full divide-y divide-gray-50">
                                <thead className="bg-gray-50/50">
                                    <tr><th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Asesor</th><th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Tasa (%)</th><th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Meta Mensual</th><th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</th></tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {rules.map((rule) => (
                                        <tr key={rule.id}>
                                            <td className="px-6 py-6"><p className="text-sm font-black text-gray-900">{rule.seller_name}</p></td>
                                            <td className="px-6 py-6"><input type="number" value={rule.rate} onChange={(e) => updateRule(rule.id, 'rate', parseFloat(e.target.value))} className="w-20 p-2 bg-gray-50 rounded-lg text-sm font-black text-purple-600 outline-none focus:bg-white border-transparent transition-all" /></td>
                                            <td className="px-6 py-6">
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                                                    <input 
                                                        type="text" 
                                                        value={formatNumberInput(rule.goal)} 
                                                        onChange={(e) => updateRule(rule.id, 'goal', unformatNumberInput(e.target.value))} 
                                                        className="w-40 pl-6 p-2 bg-gray-50 rounded-lg text-sm font-black text-gray-700 outline-none focus:bg-white border-transparent transition-all" 
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right"><button onClick={() => updateRule(rule.id, 'is_active', !rule.is_active)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${rule.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>{rule.is_active ? 'Activo' : 'Pausado'}</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-10 pt-0"><button onClick={() => setIsConfigModalOpen(false)} className="w-full bg-gray-900 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl">Guardar Cambios</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
