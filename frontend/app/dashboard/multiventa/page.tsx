"use client";

import { useState } from 'react';
import { useAuth } from "@/context/auth-context";

interface Channel {
    id: string;
    name: string;
    type: 'marketplace' | 'web' | 'pos';
    status: 'connected' | 'disconnected' | 'syncing';
    icon: string;
    active_products: number;
}

const CONNECTED_CHANNELS: Channel[] = [
    { id: 'ch_1', name: 'Mercado Libre', type: 'marketplace', status: 'connected', icon: '🟡', active_products: 450 },
    { id: 'ch_2', name: 'Tienda Online (Bayup)', type: 'web', status: 'connected', icon: '🌐', active_products: 500 },
    { id: 'ch_3', name: 'Amazon Store', type: 'marketplace', status: 'syncing', icon: '🟠', active_products: 120 },
    { id: 'ch_4', name: 'WhatsApp Business', type: 'web', status: 'connected', icon: '🟢', active_products: 350 },
];

export default function MultiventaPage() {
    const { token } = useAuth();
    const [isSyncing, setIsSyncing] = useState(false);

    const handleGlobalSync = () => {
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 2500);
    };

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-12">
            {/* 1. Header Estratégico */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Multiventa Hub</h1>
                    <p className="text-gray-500 mt-2 font-medium">Centraliza tu catálogo y domina múltiples canales de venta desde un solo lugar.</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={handleGlobalSync}
                        disabled={isSyncing}
                        className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 ${isSyncing ? 'bg-gray-100 text-gray-400' : 'bg-purple-600 text-white shadow-purple-100 hover:bg-purple-700'}`}
                    >
                        {isSyncing ? (
                            <> <div className="h-3 w-3 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div> Sincronizando... </>
                        ) : (
                            <> 🔄 Sincronizar Todo </>
                        )}
                    </button>
                    <button className="bg-gray-900 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all">
                        + Conectar Canal
                    </button>
                </div>
            </div>

            {/* 2. Los 4 Pilares de Multiventa */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: 'Catálogo Maestro', desc: 'Crea una vez, publica en todos lados.', icon: '📚', color: 'bg-blue-50 text-blue-600' },
                    { title: 'Canales de Venta', desc: 'Gestión masiva de publicaciones.', icon: '🔗', color: 'bg-purple-50 text-purple-600' },
                    { title: 'Control Stock', desc: 'Inventario sincronizado en tiempo real.', icon: '⚖️', color: 'bg-emerald-50 text-emerald-600' },
                    { title: 'Logística Pro', desc: 'Picking, Packing y Etiquetas.', icon: '📦', color: 'bg-amber-50 text-amber-600' },
                ].map((pilar, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                        <div className={`h-14 w-14 ${pilar.color} rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner group-hover:scale-110 transition-transform`}>{pilar.icon}</div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{pilar.title}</h3>
                        <p className="text-xs text-gray-400 mt-2 font-medium leading-relaxed">{pilar.desc}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 3. Conexiones Activas */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Canales Conectados</h2>
                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full italic">Omnicanalidad Activa</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {CONNECTED_CHANNELS.map((channel) => (
                            <div key={channel.id} className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm flex items-center justify-between group hover:border-purple-100 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl border border-gray-100">{channel.icon}</div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">{channel.name}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">{channel.active_products} productos activos</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md tracking-tighter ${channel.status === 'connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 animate-pulse'}`}>
                                        {channel.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Actividad de Sincronización */}
                <div className="bg-gray-900 rounded-[3rem] p-10 text-white relative overflow-hidden flex flex-col h-full">
                    <div className="relative z-10 space-y-8">
                        <h2 className="text-xl font-black tracking-tight">Monitor de Sincronización</h2>
                        <div className="space-y-6">
                            {[
                                { msg: 'Stock actualizado en Mercado Libre', time: 'Hace 2 min', type: 'success' },
                                { msg: 'Nueva orden en Amazon Store', time: 'Hace 5 min', type: 'info' },
                                { msg: 'Precio sincronizado en Tienda Web', time: 'Hace 12 min', type: 'success' },
                            ].map((log, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <div className={`h-2 w-2 rounded-full mt-1.5 ${log.type === 'success' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]'}`}></div>
                                    <div>
                                        <p className="text-xs font-bold leading-tight">{log.msg}</p>
                                        <p className="text-[10px] text-gray-500 mt-1 font-black uppercase tracking-widest">{log.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-auto pt-10 relative z-10">
                        <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">Ver Logs Completos</button>
                    </div>
                    <div className="absolute -right-10 -bottom-10 text-[12rem] opacity-[0.03] rotate-12">🔗</div>
                </div>
            </div>

            {/* 5. Banner de Eficiencia */}
            <div className="bg-white rounded-[3rem] border border-purple-100 p-12 flex flex-col md:flex-row items-center gap-10 shadow-xl shadow-purple-50/50">
                <div className="h-24 w-24 bg-purple-600 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl">✨</div>
                <div className="flex-1">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">Optimiza tu operación eCommerce</h3>
                    <p className="text-gray-500 text-sm mt-3 leading-relaxed max-w-2xl font-medium">
                        Al usar Multiventa, tu inventario se descuenta automáticamente en todos tus canales cuando realizas una venta física o digital. Evita quiebres de stock y mejora la confianza de tus clientes.
                    </p>
                </div>
                <button className="w-full md:w-auto px-10 py-4 bg-gray-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg">Descubrir Logística</button>
            </div>
        </div>
    );
}
