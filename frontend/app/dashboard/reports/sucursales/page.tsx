"use client";

import { useState, useMemo } from 'react';
import { useAuth } from '../../../../context/auth-context';

interface Branch {
    id: string;
    name: string;
    responsible: string;
    location: string;
    options: {
        independentWeb: boolean;
        independentSocial: boolean;
        onlyLocal: boolean;
    };
    stats: {
        revenueToday: number;
        lossToday: number;
        growth: number;
    };
}

const DEFAULT_BRANCH: Branch = {
    id: 'main_store',
    name: 'Tienda Principal',
    responsible: 'Admin Principal',
    location: 'Bogotá, Colombia',
    options: { independentWeb: true, independentSocial: true, onlyLocal: false },
    stats: { revenueToday: 1250000, lossToday: 45000, growth: 12.5 }
};

export default function SucursalesPage() {
    const { token } = useAuth();
    const [branches, setBranches] = useState<Branch[]>([DEFAULT_BRANCH]);
    const [isCreateModalOpen, setIsManualModalOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

    // Formulario Nueva Sucursal
    const [formData, setFormData] = useState({
        name: '', responsible: '', location: '',
        independentWeb: false, independentSocial: false, onlyLocal: true
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(amount).replace('$', '$ ');
    };

    const handleCreate = () => {
        if (!formData.name || !formData.responsible) return alert("Completa los datos principales.");
        const newBranch: Branch = {
            id: Math.random().toString(36).substr(2, 9),
            name: formData.name,
            responsible: formData.responsible,
            location: formData.location,
            options: { 
                independentWeb: formData.independentWeb, 
                independentSocial: formData.independentSocial, 
                onlyLocal: formData.onlyLocal 
            },
            stats: { revenueToday: 0, lossToday: 0, growth: 0 }
        };
        setBranches([...branches, newBranch]);
        setIsManualModalOpen(false);
        setFormData({ name: '', responsible: '', location: '', independentWeb: false, independentSocial: false, onlyLocal: true });
    };

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-12">
            {/* 1. Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Mis Sucursales</h1>
                    <p className="text-gray-500 mt-2 font-medium">Controla y expande los puntos de venta de tu empresa.</p>
                </div>
                <button 
                    onClick={() => setIsManualModalOpen(true)}
                    className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95"
                >
                    + Registrar Sucursal
                </button>
            </div>

            {/* 2. Grid de Sucursales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {branches.map((branch) => (
                    <div 
                        key={branch.id} 
                        onClick={() => setSelectedBranch(branch)}
                        className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
                    >
                        <div className="relative z-10 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="h-14 w-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">🏢</div>
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-lg border border-emerald-100 tracking-widest">Abierta</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">{branch.name}</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Responsable: {branch.responsible}</p>
                            </div>
                            <div className="pt-4 border-t border-gray-50 flex justify-between items-end">
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ventas de Hoy</p>
                                    <p className="text-xl font-black text-purple-600 mt-1">{formatCurrency(branch.stats.revenueToday)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-900 group-hover:text-purple-600 transition-colors">Ver Dashboard →</p>
                                </div>
                            </div>
                        </div>
                        {/* Decoración sutil */}
                        <div className="absolute -right-10 -bottom-10 text-9xl opacity-5 group-hover:rotate-12 transition-transform duration-700">🏢</div>
                    </div>
                ))}
            </div>

            {/* 3. MODAL CREAR SUCURSAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                            <div><h2 className="text-2xl font-black text-gray-900 tracking-tight">Nueva Sucursal</h2><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Expande tu imperio comercial</p></div>
                            <button onClick={() => setIsManualModalOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-gray-50 text-gray-400 text-xl transition-colors">✕</button>
                        </div>
                        <div className="p-10 space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                            <div className="space-y-6">
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Comercial</label><input type="text" placeholder="Ej: Bayup Norte" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-bold transition-all" /></div>
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Persona Responsable</label><input type="text" placeholder="Nombre del administrador" value={formData.responsible} onChange={(e) => setFormData({...formData, responsible: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-bold transition-all" /></div>
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ubicación / Ciudad</label><input type="text" placeholder="Dirección o ciudad" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full mt-2 p-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-purple-200 outline-none text-sm font-bold transition-all" /></div>
                            </div>
                            <div className="space-y-4 pt-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Opciones de Venta</p>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { id: 'independentWeb', label: 'Sitio Web Independiente', icon: '🌐' },
                                        { id: 'independentSocial', label: 'Redes Sociales Propias', icon: '📱' },
                                        { id: 'onlyLocal', label: 'Facturación Solo Local', icon: '🏪' }
                                    ].map(opt => (
                                        <button 
                                            key={opt.id}
                                            onClick={() => setFormData({...formData, [opt.id]: !formData[opt.id as keyof typeof formData]})}
                                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${formData[opt.id as keyof typeof formData] ? 'bg-purple-50 border-purple-200 shadow-sm' : 'bg-white border-gray-100 text-gray-400'}`}
                                        >
                                            <div className="flex items-center gap-3"><span className="text-lg">{opt.icon}</span><span className="text-xs font-black uppercase tracking-widest">{opt.label}</span></div>
                                            {formData[opt.id as keyof typeof formData] && <span className="h-2 w-2 rounded-full bg-purple-600"></span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-10 pt-0"><button onClick={handleCreate} className="w-full bg-gray-900 hover:bg-black text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all">Crear y Activar Sucursal</button></div>
                    </div>
                </div>
            )}

            {/* 4. MODAL DETALLE SUCURSAL */}
            {selectedBranch && (
                <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-white z-10">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg">🏢</div>
                                <div><h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedBranch.name}</h2><p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1 italic">{selectedBranch.location} · Resp: {selectedBranch.responsible}</p></div>
                            </div>
                            <button onClick={() => setSelectedBranch(null)} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-gray-50 text-gray-400 text-xl transition-colors">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-gray-50/20">
                            {/* Dashboard de Sucursal */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ingresos de Hoy</p><p className="text-3xl font-black text-emerald-600">{formatCurrency(selectedBranch.stats.revenueToday)}</p><p className="text-[10px] font-bold text-emerald-500 mt-2">↑ {selectedBranch.stats.growth}% vs ayer</p></div>
                                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pérdidas / Gastos</p><p className="text-3xl font-black text-rose-600">{formatCurrency(selectedBranch.stats.lossToday)}</p><p className="text-[10px] font-bold text-gray-400 mt-2 italic">Gastos operativos hoy</p></div>
                                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Utilidad Neta</p><p className="text-3xl font-black text-gray-900">{formatCurrency(selectedBranch.stats.revenueToday - selectedBranch.stats.lossToday)}</p><p className="text-[10px] font-bold text-purple-600 mt-2 uppercase tracking-widest">Balance del día</p></div>
                            </div>

                            {/* Comparativa Mensual (Visual sutil) */}
                            <div className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm space-y-8">
                                <div><h3 className="text-xl font-black text-gray-900 tracking-tight">Rendimiento Histórico</h3><p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Comparativa mes a mes de la sucursal</p></div>
                                <div className="h-48 w-full flex items-end justify-between gap-3 px-4">
                                    {[30, 45, 60, 80, 75, 100].map((h, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                            <div className="w-full bg-gray-50 rounded-2xl relative h-full overflow-hidden">
                                                <div className="absolute bottom-0 w-full bg-gray-900 rounded-t-xl transition-all duration-1000 group-hover:bg-purple-600" style={{ height: `${h}%` }}></div>
                                            </div>
                                            <span className="text-[9px] font-black text-gray-400 uppercase">{['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'][i]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-8 bg-white rounded-[2.5rem] border border-gray-50 shadow-sm"><h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">Canales Activos</h4><div className="space-y-3">{selectedBranch.options.independentWeb && <div className="flex items-center gap-3 text-xs font-bold text-gray-600"><span>🌐</span> Sitio Web Independiente</div>}{selectedBranch.options.independentSocial && <div className="flex items-center gap-3 text-xs font-bold text-gray-600"><span>📱</span> WhatsApp y Redes Propias</div>}{selectedBranch.options.onlyLocal && <div className="flex items-center gap-3 text-xs font-bold text-gray-600"><span>🏪</span> Facturación Local</div>}</div></div>
                                <div className="p-8 bg-purple-600 rounded-[2.5rem] text-white flex flex-col justify-between shadow-xl shadow-purple-100"><p className="text-xs font-bold leading-relaxed">Esta sucursal está operando al <span className="font-black">92%</span> de su capacidad instalada. Recomendamos revisar el stock de la categoría Ropa.</p><button className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Generar Reporte PDF</button></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
