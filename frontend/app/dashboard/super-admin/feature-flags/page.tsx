"use client";

import { useState } from 'react';
import { 
    Tag, 
    ToggleLeft, 
    ToggleRight, 
    Zap, 
    Split, 
    ShieldAlert, 
    Users,
    Filter,
    Activity
} from 'lucide-react';

export default function GlobalFeatureFlags() {
    const [flags, setFlags] = useState([
        { id: 1, name: 'Bayt Voice Assistant', description: 'Habilita control por voz en app móvil', active: false, target: 'Plan Gold', rollout: 20 },
        { id: 2, name: 'Mercado Pago V2', description: 'Nueva pasarela con soporte 3D Secure', active: true, target: 'Global', rollout: 100 },
        { id: 3, name: 'Dark Mode UI', description: 'Interfaz nocturna premium', active: true, target: 'Staff Only', rollout: 100 },
        { id: 4, name: 'Checkout Simplificado', description: 'A/B Test de una sola página', active: true, target: 'A/B Group A', rollout: 50 },
    ]);

    const toggleFlag = (id: number) => {
        setFlags(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f));
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Feature Flags & Experimentos</h1>
                    <p className="text-gray-500 mt-1 font-medium">Control granular de funcionalidades sin redeploy.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-100">
                        <ShieldAlert size={14} /> Kill Switch Global
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">
                        <Split size={14} /> Crear Experimento A/B
                    </button>
                </div>
            </div>

            {/* Flags Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {flags.map((flag) => (
                    <div key={flag.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-gray-900 tracking-tight">{flag.name}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">{flag.description}</p>
                            </div>
                            <button onClick={() => toggleFlag(flag.id)} className="transition-all hover:scale-110">
                                {flag.active ? (
                                    <ToggleRight size={48} className="text-[#004d4d]" />
                                ) : (
                                    <ToggleLeft size={48} className="text-gray-200" />
                                )}
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Target</p>
                                <p className="text-[10px] font-black text-gray-900 uppercase">{flag.target}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Rollout</p>
                                <p className="text-[10px] font-black text-gray-900">{flag.rollout}%</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Impacto</p>
                                <div className="flex items-center gap-1 text-emerald-600">
                                    <Activity size={10} />
                                    <span className="text-[10px] font-black">Estable</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${flag.active ? 'bg-[#004d4d]' : 'bg-gray-200'}`} style={{ width: `${flag.rollout}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
