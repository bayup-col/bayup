"use client";

import { useState } from 'react';

interface Automation {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'inactive';
    trigger: string;
    action: string;
    stats: {
        runs: number;
        conversions: number;
    }
}

const INITIAL_AUTOMATIONS: Automation[] = [
    { id: 'auto_1', name: 'Recuperación de Carrito', description: 'Envía un recordatorio 2 horas después de abandonar.', trigger: 'Carrito Abandonado', action: 'WhatsApp / Email', status: 'active', stats: { runs: 1240, conversions: 28 } },
    { id: 'auto_2', name: 'Mensaje de Bienvenida', description: 'Regala un cupón a los nuevos suscriptores.', trigger: 'Registro Nuevo', action: 'Email', status: 'active', stats: { runs: 850, conversions: 45 } },
    { id: 'auto_3', name: 'Reactivación de Clientes', description: 'Mensaje automático tras 30 días de inactividad.', trigger: 'Inactividad 30d', action: 'WhatsApp', status: 'inactive', stats: { runs: 0, conversions: 0 } },
];

export default function AutomationsPage() {
    const [automations, setAutomations] = useState<Automation[]>(INITIAL_AUTOMATIONS);

    const toggleStatus = (id: string) => {
        setAutomations(automations.map(a => 
            a.id === id ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' } : a
        ));
        const auto = automations.find(a => a.id === id);
        alert(`Automatización "${auto?.name}" ${auto?.status === 'active' ? 'desactivada' : 'activada'} con éxito.`);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Automatizaciones</h1>
                    <p className="text-gray-500 mt-2 font-medium">Configura flujos inteligentes para vender de forma automática.</p>
                </div>
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                    + Nuevo Flujo (IA)
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {automations.map((auto) => (
                    <div key={auto.id} className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm flex flex-col justify-between group hover:border-purple-100 transition-all">
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${auto.status === 'active' ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-400'}`}>
                                    {auto.id === 'auto_1' ? '🛒' : auto.id === 'auto_2' ? '👋' : '💤'}
                                </div>
                                <button 
                                    onClick={() => toggleStatus(auto.id)}
                                    className={`w-14 h-7 rounded-full relative transition-all duration-500 ${auto.status === 'active' ? 'bg-emerald-500' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute top-1 left-1 h-5 w-5 bg-white rounded-full transition-transform shadow-sm ${auto.status === 'active' ? 'translate-x-7' : ''}`}></div>
                                </button>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900">{auto.name}</h3>
                                <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">{auto.trigger}</p>
                                <p className="text-sm text-gray-500 mt-4 leading-relaxed font-medium">{auto.description}</p>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conversiones</p>
                                <p className="text-lg font-black text-purple-600">{auto.stats.conversions}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acción</p>
                                <p className="text-xs font-bold text-gray-900">{auto.action}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}