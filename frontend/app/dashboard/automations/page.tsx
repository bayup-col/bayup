"use client";

import { useState } from 'react';

interface Workflow {
    id: string;
    name: string;
    trigger: string;
    action: string;
    status: 'active' | 'paused';
    runs: number;
}

const TEMPLATES = [
    { name: 'Venta Mayor a $1M', trigger: 'Nueva Venta', action: 'Notificar WhatsApp Dueño', icon: '💰' },
    { name: 'Stock Bajo (<5)', trigger: 'Cambio Inventario', action: 'Enviar Email Proveedor', icon: '📉' },
    { name: 'Felicitación Cumpleaños', trigger: 'Fecha Especial', action: 'Enviar Cupón 20%', icon: '🎂' },
];

export default function AutomationsPage() {
    const [workflows, setWorkflows] = useState<Workflow[]>([
        { id: 'w1', name: 'Alerta Stock Crítico', trigger: 'Inventario < 5', action: 'Email a Compras', status: 'active', runs: 45 },
        { id: 'w2', name: 'Bienvenida VIP', trigger: 'Venta > $500k', action: 'WhatsApp Personalizado', status: 'paused', runs: 12 },
    ]);

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Automatizaciones ⚙️</h1>
                    <p className="text-gray-500 mt-2 font-medium">Crea flujos de trabajo inteligentes que operen tu negocio por ti.</p>
                </div>
                <button className="bg-gray-900 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all">+ Crear Workflow Pro</button>
            </div>

            {/* Galería de Plantillas Rápidas */}
            <div className="space-y-6">
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest ml-4">Plantillas Sugeridas (IA)</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {TEMPLATES.map((t, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-purple-200 transition-all cursor-pointer group">
                            <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">{t.icon}</div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">{t.name}</h3>
                            <p className="text-[10px] text-gray-400 font-medium mt-2 leading-relaxed">Disparador: <span className="text-gray-600 font-bold">{t.trigger}</span></p>
                            <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Acción: <span className="text-purple-600 font-bold">{t.action}</span></p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Listado de Automatizaciones Activas */}
            <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Mis Flujos Activos</h2>
                    <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase tracking-widest">Motor de Reglas v2.0</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-50">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre del Flujo</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Disparador / Acción</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Ejecuciones</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {workflows.map((w) => (
                                <tr key={w.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-6 font-black text-sm text-gray-900">{w.name}</td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <span className="px-2 py-1 bg-gray-100 rounded-lg text-[9px] font-black text-gray-500 uppercase">{w.trigger}</span>
                                            <span className="text-gray-300">→</span>
                                            <span className="px-2 py-1 bg-purple-50 rounded-lg text-[9px] font-black text-purple-600 uppercase">{w.action}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold text-gray-600">{w.runs} veces</td>
                                    <td className="px-8 py-6 text-right">
                                        <button onClick={() => setWorkflows(workflows.map(x => x.id === w.id ? { ...x, status: x.status === 'active' ? 'paused' : 'active' } : x))} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${w.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-gray-400'}`}>
                                            {w.status === 'active' ? '● Activo' : 'Pausado'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Banner de Poder */}
            <div className="bg-gray-900 rounded-[3rem] p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
                <div className="h-24 w-24 bg-purple-600 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl relative z-10">⚙️</div>
                <div className="flex-1 relative z-10">
                    <h3 className="text-2xl font-black tracking-tight">Libera tiempo con Workflows</h3>
                    <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-2xl">
                        Nuestra infraestructura te permite conectar eventos de tu tienda con acciones externas. Crea automatizaciones que respondan a ventas, cambios de stock, registros de clientes y mucho más.
                    </p>
                </div>
                <button className="bg-white text-gray-900 px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-100 transition-all shadow-xl">Ver Documentación API</button>
                <div className="absolute -right-10 -bottom-10 text-[15rem] opacity-5 rotate-12 font-black italic">AUTO</div>
            </div>
        </div>
    );
}
