"use client";

import { useState } from 'react';

interface Warehouse {
    id: string;
    name: string;
    location: string;
    total_items: number;
    value: number;
    is_main: boolean;
}

interface Transfer {
    id: string;
    origin: string;
    destination: string;
    items_count: number;
    status: 'pending' | 'in_transit' | 'received';
    date: string;
}

const MOCK_WAREHOUSES: Warehouse[] = [
    { id: 'w1', name: 'Bodega Central', location: 'Zona Industrial', total_items: 1250, value: 45000000, is_main: true },
    { id: 'w2', name: 'Sede Norte', location: 'C.C. Unicentro', total_items: 340, value: 12800000, is_main: false },
    { id: 'w3', name: 'Showroom Sur', location: 'Av. Pasoancho', total_items: 120, value: 5400000, is_main: false },
];

const MOCK_TRANSFERS: Transfer[] = [
    { id: 'TR-1001', origin: 'Bodega Central', destination: 'Sede Norte', items_count: 50, status: 'in_transit', date: 'Hoy, 09:00 AM' },
    { id: 'TR-998', origin: 'Sede Norte', destination: 'Bodega Central', items_count: 5, status: 'received', date: 'Ayer' },
];

export default function BodegasPage() {
    const [activeTab, setActiveTab] = useState<'inventory' | 'transfers'>('inventory');
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(amount).replace('$', '$ ');
    };

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Bodegas & Stock</h1>
                    <p className="text-gray-500 mt-2 font-medium">Controla la distribución de tu inventario en múltiples ubicaciones.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsTransferModalOpen(true)} className="bg-purple-600 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-purple-100 hover:bg-purple-700 transition-all active:scale-95">
                        📦 Nueva Transferencia
                    </button>
                </div>
            </div>

            {/* Tabs de Control */}
            <div className="flex space-x-1 bg-gray-50 p-1.5 rounded-2xl w-fit border border-gray-100 shadow-sm">
                <button onClick={() => setActiveTab('inventory')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'inventory' ? 'bg-white text-purple-700 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>🏢 Inventario por Ubicación</button>
                <button onClick={() => setActiveTab('transfers')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'transfers' ? 'bg-white text-purple-700 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>🔄 Historial de Movimientos</button>
            </div>

            {activeTab === 'inventory' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {MOCK_WAREHOUSES.map((w) => (
                        <div key={w.id} className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                            <div className="relative z-10 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${w.is_main ? 'bg-gray-900 text-white' : 'bg-purple-50 text-purple-600'}`}>
                                        {w.is_main ? '🏠' : '🏬'}
                                    </div>
                                    {w.is_main && <span className="px-3 py-1 bg-gray-900 text-white text-[8px] font-black uppercase rounded-lg tracking-widest">Principal</span>}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{w.name}</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{w.location}</p>
                                </div>
                                <div className="pt-6 border-t border-gray-50 flex justify-between items-end">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Existencias</p>
                                        <p className="text-xl font-black text-gray-900">{w.total_items} <span className="text-[10px] text-gray-400">Unds</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Valorización</p>
                                        <p className="text-sm font-black text-purple-600">{formatCurrency(w.value)}</p>
                                    </div>
                                </div>
                                <button className="w-full py-4 bg-gray-50 group-hover:bg-purple-600 group-hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Ver Stock Detallado</button>
                            </div>
                            <div className="absolute -right-10 -bottom-10 text-[10rem] opacity-[0.02] group-hover:rotate-12 transition-transform duration-700">📦</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden animate-in fade-in duration-500">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Transferencias de Mercancía</h2>
                        <span className="text-[10px] font-black text-purple-600 uppercase bg-purple-50 px-3 py-1 rounded-full">Monitoreo de Carga</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-50">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Referencia</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Ruta (Origen → Destino)</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Items</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {MOCK_TRANSFERS.map((tr) => (
                                    <tr key={tr.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-6 font-black text-sm text-gray-900">#{tr.id}</td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-gray-700">{tr.origin}</span>
                                                <span className="text-purple-400">→</span>
                                                <span className="text-xs font-bold text-purple-600">{tr.destination}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{tr.date}</p>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-black text-gray-900">{tr.items_count} unds</td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                tr.status === 'received' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                                            }`}>
                                                {tr.status === 'received' ? 'Completado' : 'En Tránsito'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            {tr.status !== 'received' && <button className="bg-gray-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all">Confirmar Recepción</button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL TRANSFERENCIA (ASISTENTE) */}
            {isTransferModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                            <div><h2 className="text-2xl font-black text-gray-900 tracking-tight">Movimiento de Inventario</h2><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Traslada mercancía entre bodegas de forma segura</p></div>
                            <button onClick={() => setIsTransferModalOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-gray-50 text-gray-400 text-xl transition-colors">✕</button>
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                            {/* Ruta del Movimiento */}
                            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar border-r border-gray-50">
                                <section className="space-y-6">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-purple-600"></span> Definir Ruta</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Origen</label><select className="w-full mt-2 p-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-bold text-gray-700"><option>Bodega Central</option><option>Sede Norte</option></select></div>
                                        <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Destino</label><select className="w-full mt-2 p-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-bold text-gray-700"><option>Sede Norte</option><option>Showroom Sur</option></select></div>
                                    </div>
                                </section>
                                <section className="space-y-6">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-purple-600"></span> Selección de Productos</h3>
                                    <div className="flex gap-3"><input type="text" placeholder="Buscar por SKU o Nombre..." className="flex-1 p-4 bg-gray-50 rounded-2xl outline-none focus:bg-white border border-transparent focus:border-purple-200 transition-all text-sm font-bold shadow-inner" /><button className="px-8 bg-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Añadir</button></div>
                                    <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-[2rem]"><p className="text-xs font-bold text-gray-300 uppercase tracking-widest italic">Añade productos para transferir</p></div>
                                </section>
                            </div>
                            {/* Resumen del Envío */}
                            <div className="w-full lg:w-80 bg-gray-50 p-10 flex flex-col justify-between">
                                <div className="space-y-8">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Resumen de Carga</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-gray-500"><span className="text-[10px] font-black uppercase">Total Items</span><span className="text-sm font-black text-gray-900">0</span></div>
                                        <div className="flex justify-between items-center text-gray-500"><span className="text-[10px] font-black uppercase">Peso Estimado</span><span className="text-sm font-black text-gray-900">0.0 kg</span></div>
                                    </div>
                                </div>
                                <div className="pt-10 space-y-4">
                                    <button onClick={() => { setIsTransferModalOpen(false); alert("Transferencia iniciada. Mercancía en tránsito."); }} className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all">Generar Remisión y Enviar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Banner Informativo */}
            <div className="bg-white rounded-[3rem] border border-gray-100 p-12 flex flex-col md:flex-row items-center gap-10 shadow-xl shadow-purple-50/20 relative overflow-hidden">
                <div className="h-24 w-24 bg-purple-600 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl relative z-10">⚖️</div>
                <div className="flex-1 relative z-10">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">Auditoría de Stock Inteligente</h3>
                    <p className="text-gray-500 text-sm mt-3 leading-relaxed max-w-2xl font-medium">
                        El sistema de **Transferencias Pro** asegura que tu inventario esté siempre cuadrado. Cuando envías mercancía, el stock se bloquea en origen y solo se libera en destino tras la confirmación de recepción.
                    </p>
                </div>
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-9xl font-black">STOCK</div>
            </div>
        </div>
    );
}
