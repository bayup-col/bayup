"use client";

import { useState } from 'react';

interface Shipment {
    id: string;
    order_id: string;
    customer: string;
    address: string;
    city: string;
    carrier: string;
    tracking_number: string;
    status: 'pending' | 'prepped' | 'shipped' | 'delivered' | 'failed';
    date: string;
}

const MOCK_SHIPMENTS: Shipment[] = [
    { id: 'shp_1', order_id: 'FAC-5001', customer: 'Roberto Gómez', address: 'Calle 10 # 45-20', city: 'Bogotá', carrier: 'Servientrega', tracking_number: '992837411', status: 'shipped', date: 'Hoy, 10:30 AM' },
    { id: 'shp_2', order_id: 'FAC-5002', customer: 'Marta Lucía', address: 'Av. El Dorado # 60-15', city: 'Bogotá', carrier: 'Interrapidísimo', tracking_number: '772100293', status: 'prepped', date: 'Hoy, 08:15 AM' },
    { id: 'shp_3', order_id: 'FAC-4990', customer: 'Felipe Marín', address: 'Cra 50 # 12-80', city: 'Medellín', carrier: 'Coordinadora', tracking_number: '110293847', status: 'delivered', date: 'Ayer' },
];

export default function ShippingPage() {
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'shipped' | 'delivered'>('all');

    const STATUS_CONFIG = {
        pending: { label: 'Por Preparar', color: 'bg-amber-50 text-amber-600 border-amber-100' },
        prepped: { label: 'Preparado', color: 'bg-blue-50 text-blue-600 border-blue-100' },
        shipped: { label: 'En Camino', color: 'bg-purple-50 text-purple-600 border-purple-100' },
        delivered: { label: 'Entregado', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        failed: { label: 'Incidencia', color: 'bg-rose-50 text-rose-600 border-rose-100' }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Logística de Envíos</h1>
                    <p className="text-gray-500 mt-2 font-medium">Gestiona despachos, rastreo y entregas de tus pedidos.</p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-white border border-gray-100 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-all shadow-sm">Imprimir Guías Masivo</button>
                    <button className="bg-gray-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200">+ Crear Despacho</button>
                </div>
            </div>

            {/* KPIs Logísticos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Pendientes', val: 12, icon: '📦', color: 'text-amber-600 bg-amber-50' },
                    { label: 'En Ruta', val: 45, icon: '🚚', color: 'text-purple-600 bg-purple-50' },
                    { label: 'Entregados Hoy', val: 89, icon: '✅', color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Retrasados', val: 2, icon: '⚠️', color: 'text-rose-600 bg-rose-50' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center gap-5">
                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-2xl ${kpi.color} shadow-inner`}>{kpi.icon}</div>
                        <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p><p className="text-2xl font-black text-gray-900">{kpi.val}</p></div>
                    </div>
                ))}
            </div>

            {/* Listado de Envíos */}
            <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex gap-4">
                        {['all', 'pending', 'shipped', 'delivered'].map((t) => (
                            <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>
                                {t === 'all' ? 'Todos' : t === 'pending' ? 'Pendientes' : t === 'shipped' ? 'En Ruta' : 'Entregados'}
                            </button>
                        ))}
                    </div>
                    <div className="relative"><input type="text" placeholder="Buscar guía o pedido..." className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500 w-64" /><span className="absolute left-3 top-2.5 opacity-30 text-xs">🔍</span></div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-50">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Pedido / Guía</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente y Destino</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Transportadora</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {MOCK_SHIPMENTS.map((shp) => (
                                <tr key={shp.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-black text-gray-900">#{shp.order_id}</p>
                                        <p className="text-[10px] font-bold text-purple-600 mt-1 uppercase tracking-tighter">Guía: {shp.tracking_number}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-bold text-gray-900">{shp.customer}</p>
                                        <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">{shp.city} · {shp.address}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-gray-300"></span>
                                            <span className="text-xs font-bold text-gray-600">{shp.carrier}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${STATUS_CONFIG[shp.status].color}`}>
                                            {STATUS_CONFIG[shp.status].label}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="p-2 hover:bg-white rounded-lg transition-all text-gray-400 hover:text-purple-600 border border-transparent hover:border-gray-100 shadow-sm opacity-0 group-hover:opacity-100">📋 Rastrear</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Banner IA Logística */}
            <div className="bg-gray-900 rounded-[3rem] p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
                <div className="h-24 w-24 bg-purple-600 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl">⚡</div>
                <div className="flex-1 relative z-10">
                    <h3 className="text-2xl font-black tracking-tight">Rastreo Inteligente Activado</h3>
                    <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-2xl">
                        Tu Asistente IA está monitoreando los cambios de estado en las transportadoras. Cuando un pedido sea entregado, el cliente recibirá una notificación por WhatsApp automáticamente y el stock se liberará de forma definitiva.
                    </p>
                </div>
                <button className="bg-white text-gray-900 px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-100 transition-all shadow-xl">Configurar Webhooks</button>
                <div className="absolute -right-10 -bottom-10 text-[15rem] opacity-5 rotate-12 font-black">🚚</div>
            </div>
        </div>
    );
}
