"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Zap, 
  RefreshCw, 
  AlertTriangle, 
  Plus, 
  ChevronRight, 
  ExternalLink, 
  LayoutGrid, 
  Settings2, 
  Activity, 
  Link2, 
  CheckCircle2, 
  Package, 
  ShoppingCart, 
  ArrowRight, 
  Info, 
  Layers, 
  ShieldCheck, 
  MousePointer2, 
  Search,
  Filter,
  Tag,
  Check
} from 'lucide-react';

interface Marketplace {
    id: string;
    name: string;
    logo: string;
    status: 'connected' | 'error' | 'warning';
    sales_today: number;
    pending_orders: number;
    last_sync: string;
    country: string;
}

const CONNECTED_MARKETPLACES: Marketplace[] = [
    { id: 'm1', name: 'MercadoLibre', logo: '🟡', status: 'connected', sales_today: 1250000, pending_orders: 8, last_sync: 'Hace 2 min', country: 'Colombia' },
    { id: 'm2', name: 'Shopify Store', logo: '🟢', status: 'connected', sales_today: 850000, pending_orders: 3, last_sync: 'Hace 5 min', country: 'Global' },
    { id: 'm3', name: 'Amazon Store', logo: '🟠', status: 'warning', sales_today: 420000, pending_orders: 12, last_sync: 'Hace 1 hora', country: 'USA' },
    { id: 'm4', name: 'Falabella', logo: '🟢', status: 'connected', sales_today: 0, pending_orders: 0, last_sync: 'Hace 15 min', country: 'Chile' },
];

export default function MultiventePage() {
    const [view, setView] = useState<'dashboard' | 'connect' | 'custom-catalogs'>('dashboard');
    const [mappingMode, setMappingMode] = useState<'products' | 'categories'>('products');
    const [selectedMarketplaceForCatalog, setSelectedMarketplaceForCatalog] = useState(CONNECTED_MARKETPLACES[0]);
    const [isSyncing, setIsSyncing] = useState(false);

    // Mock de productos y categorías actualizadas
    const [mappingProducts, setMappingProducts] = useState([
        { id: 'p1', name: 'Reloj Cronógrafo Gold', sku: 'WA-GOLD', category: 'Accesorios', stock: 45, active: true },
        { id: 'p2', name: 'Zapatos Oxford', sku: 'SH-OXFORD', category: 'Calzado', stock: 12, active: true },
        { id: 'p3', name: 'Camisa Lino', sku: 'CL-LINO', category: 'Ropa', stock: 88, active: false },
        { id: 'p4', name: 'Gafas Aviador', sku: 'GL-AVIA', category: 'Accesorios', stock: 5, active: true },
    ]);

    const [mappingCategories, setMappingCategories] = useState([
        { id: 'c1', name: 'Ropa', count: 124, active: true },
        { id: 'c2', name: 'Calzado', count: 45, active: true },
        { id: 'c3', name: 'Accesorios', count: 82, active: false },
        { id: 'c4', name: 'Tecnología', count: 12, active: false },
    ]);

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 3000);
    };

    const toggleProductMapping = (id: string) => {
        setMappingProducts(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
    };

    const toggleCategoryMapping = (id: string) => {
        setMappingCategories(prev => prev.map(c => {
            if (c.id === id) {
                const newState = !c.active;
                // Si activamos una categoría, activamos todos sus productos (lógica simulada)
                if (newState) {
                    setMappingProducts(prodPrev => prodPrev.map(p => p.category === c.name ? { ...p, active: true } : p));
                }
                return { ...c, active: newState };
            }
            return c;
        }));
    };

    const getStatusGlow = (status: Marketplace['status']) => {
        switch (status) {
            case 'connected': return 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]';
            case 'warning': return 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]';
            case 'error': return 'bg-rose-500 shadow-[0_0_12px_rgba(225,29,72,0.4)]';
            default: return 'bg-gray-300';
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-10 animate-in fade-in duration-700">
            {/* --- HEADER --- */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-black text-[#004d4d] tracking-tight flex items-center gap-4">
                        Multivende
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] bg-[#00f2ff] text-[#004d4d] px-4 py-1.5 rounded-full shadow-sm">Omnicanal Hub</span>
                    </h1>
                    <p className="text-gray-500 mt-3 font-medium text-lg max-w-2xl leading-relaxed">
                        Centraliza la operación de tus marketplaces y sincroniza tu inventario global en tiempo real.
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setView('custom-catalogs')}
                        className="flex items-center gap-3 px-8 py-4 bg-white border border-[#004d4d]/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#004d4d] hover:bg-[#00f2ff]/5 hover:border-[#004d4d] transition-all shadow-sm"
                    >
                        <Layers size={16} className="text-[#008080]" />
                        Catálogos Personalizados
                    </button>
                    <button 
                        onClick={handleSync}
                        className="flex items-center gap-3 px-8 py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <RefreshCw size={14} className={`${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Sincronizando...' : 'Forzar Sincro'}
                    </button>
                    <button 
                        onClick={() => { setView('connect'); }}
                        className="group relative px-8 py-5 bg-[#004d4d] text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-[#004d4d]/20 hover:scale-[1.02] active:scale-95 transition-all overflow-hidden"
                    >
                        <span className="flex items-center gap-3 relative z-10">
                            <Plus size={16} className="text-[#00f2ff]" />
                            Conectar Marketplace
                        </span>
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {view === 'dashboard' ? (
                    <motion.div 
                        key="dashboard"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-10"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Marketplaces', value: '04', sub: 'Activos', icon: <Layers size={18} />, color: 'text-[#004d4d]' },
                                { label: 'Ventas Hoy', value: '$ 2.52M', sub: 'Consolidado', icon: <Zap size={18} />, color: 'text-[#008080]' },
                                { label: 'Pedidos Pendientes', value: '23', sub: 'Por procesar', icon: <ShoppingCart size={18} />, color: 'text-[#004d4d]' },
                                { label: 'Alertas Sistema', value: '01', sub: 'Requiere atención', icon: <AlertTriangle size={18} />, color: 'text-amber-500' },
                            ].map((kpi, i) => (
                                <div key={i} className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/80 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                                        <p className={`text-3xl font-black mt-2 ${kpi.color}`}>{kpi.value}</p>
                                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase italic">{kpi.sub}</p>
                                    </div>
                                    <div className={`h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center text-[#004d4d]/20 group-hover:bg-[#00f2ff]/10 group-hover:text-[#00f2ff] transition-all`}>
                                        {kpi.icon}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                            {CONNECTED_MARKETPLACES.map((m) => (
                                <div key={m.id} className="group relative bg-white rounded-[3rem] p-10 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,77,77,0.08)] hover:border-[#004d4d]/10 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform border border-gray-100">
                                            {m.logo}
                                        </div>
                                        <div className={`h-2.5 w-2.5 rounded-full ${getStatusGlow(m.status)}`}></div>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight group-hover:text-[#004d4d] transition-colors">{m.name}</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">{m.country}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-50">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ventas Hoy</p>
                                            <p className="text-sm font-black text-[#004d4d]">${(m.sales_today/1000).toFixed(0)}k</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sincro</p>
                                            <p className="text-sm font-black text-gray-500">{m.last_sync}</p>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="flex-1 py-3 bg-gray-50 hover:bg-[#004d4d] hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Detalle</button>
                                        <button className="h-10 w-10 bg-gray-50 flex items-center justify-center rounded-xl text-gray-400 hover:text-[#004d4d]"><Settings2 size={16} /></button>
                                    </div>
                                </div>
                            ))}

                            <div 
                                onClick={() => setView('connect')}
                                className="group border-2 border-dashed border-gray-100 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center gap-6 hover:border-[#00f2ff] hover:bg-[#00f2ff]/5 transition-all cursor-pointer min-h-[380px]"
                            >
                                <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-[#004d4d] group-hover:text-white transition-all shadow-inner">
                                    <Plus size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-400 group-hover:text-[#004d4d]">Nueva Integración</h3>
                                    <p className="text-xs font-bold text-gray-300 mt-2 uppercase tracking-widest leading-relaxed">Expandir a nuevos mercados internacionales</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : view === 'custom-catalogs' ? (
                    <motion.div 
                        key="custom-catalogs"
                        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center justify-between">
                            <button onClick={() => setView('dashboard')} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all">← Volver al Centro de Control</button>
                            
                            {/* MAPPING MODE SWITCHER */}
                            <div className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-2">
                                <button 
                                    onClick={() => setMappingMode('products')}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mappingMode === 'products' ? 'bg-[#004d4d] text-white shadow-md' : 'text-gray-400 hover:text-[#004d4d]'}`}
                                >
                                    Individual
                                </button>
                                <button 
                                    onClick={() => setMappingMode('categories')}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mappingMode === 'categories' ? 'bg-[#004d4d] text-white shadow-md' : 'text-gray-400 hover:text-[#004d4d]'}`}
                                >
                                    Por Categoría
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Left: Channel Selector */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                                    <h2 className="text-xl font-black text-[#004d4d] tracking-tight flex items-center gap-3">
                                        <Layers size={20} className="text-[#00f2ff]" /> Selección de Canal
                                    </h2>
                                    <div className="space-y-3">
                                        {CONNECTED_MARKETPLACES.map(m => (
                                            <button 
                                                key={m.id}
                                                onClick={() => setSelectedMarketplaceForCatalog(m)}
                                                className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${selectedMarketplaceForCatalog.id === m.id ? 'bg-[#004d4d] border-[#004d4d] text-white shadow-xl' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-white hover:border-gray-200'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xl">{m.logo}</span>
                                                    <span className="text-xs font-black uppercase tracking-widest">{m.name}</span>
                                                </div>
                                                <ChevronRight size={14} className={selectedMarketplaceForCatalog.id === m.id ? 'text-[#00f2ff]' : 'text-gray-300'} />
                                            </button>
                                        ))}
                                    </div>
                                    <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-start gap-4">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1 animate-pulse"></div>
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest italic">Sincro Inteligente ON</p>
                                            <p className="text-[10px] text-emerald-700 font-medium mt-1 leading-relaxed">
                                                {mappingMode === 'products' 
                                                    ? 'Mapeo individual: Control total producto por producto.' 
                                                    : 'Mapeo por categoría: Cualquier producto nuevo en la categoría se sincronizará automáticamente.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Mapping List */}
                            <div className="lg:col-span-8 bg-white/80 backdrop-blur-xl rounded-[4rem] border border-white/60 shadow-2xl shadow-gray-200/20 overflow-hidden flex flex-col">
                                <div className="p-12 border-b border-gray-50 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black text-[#004d4d] tracking-tight uppercase italic">
                                            {mappingMode === 'products' ? 'Gestión de Productos' : 'Gestión de Categorías'}
                                        </h3>
                                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Personaliza qué contenido enviar a {selectedMarketplaceForCatalog.name}</p>
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                                        <input type="text" placeholder="Buscar..." className="pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-[#00f2ff]/30 w-48 transition-all" />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto min-h-[400px]">
                                    <table className="min-w-full divide-y divide-gray-50">
                                        <thead className="bg-gray-50/30">
                                            <tr>
                                                <th className="px-10 py-6 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{mappingMode === 'products' ? 'Producto' : 'Categoría'}</th>
                                                <th className="px-10 py-6 text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{mappingMode === 'products' ? 'Stock' : 'Ítems'}</th>
                                                <th className="px-10 py-6 text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado Sincro</th>
                                                <th className="px-10 py-6 text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {mappingMode === 'products' ? (
                                                mappingProducts.map((p) => (
                                                    <tr key={p.id} className="hover:bg-[#004d4d]/[0.02] transition-colors">
                                                        <td className="px-10 py-6">
                                                            <p className="text-sm font-black text-gray-900">{p.name}</p>
                                                            <p className="text-[9px] text-[#00f2ff] font-black uppercase tracking-widest mt-1">{p.category}</p>
                                                        </td>
                                                        <td className="px-10 py-6 text-center">
                                                            <span className="text-sm font-black text-[#004d4d]">{p.stock}</span>
                                                        </td>
                                                        <td className="px-10 py-6 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <div className={`h-1.5 w-1.5 rounded-full ${p.active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-200'}`}></div>
                                                                <span className="text-[9px] font-bold text-gray-400 uppercase">{p.active ? 'Vínculo activo' : 'Pausado'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-6 text-right">
                                                            <button 
                                                                onClick={() => toggleProductMapping(p.id)}
                                                                className={`h-7 w-12 rounded-full relative transition-all duration-300 flex items-center px-1 ml-auto ${p.active ? 'bg-[#004d4d]' : 'bg-gray-200'}`}
                                                            >
                                                                <div className={`h-5 w-5 bg-white rounded-full shadow-md transition-all ${p.active ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                mappingCategories.map((c) => (
                                                    <tr key={c.id} className="hover:bg-[#004d4d]/[0.02] transition-colors">
                                                        <td className="px-10 py-6">
                                                            <div className="flex items-center gap-3">
                                                                <Tag size={14} className="text-[#00f2ff]" />
                                                                <p className="text-sm font-black text-gray-900 uppercase tracking-widest">{c.name}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-6 text-center">
                                                            <span className="text-sm font-black text-[#004d4d]">{c.count} Prod.</span>
                                                        </td>
                                                        <td className="px-10 py-6 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <div className={`h-1.5 w-1.5 rounded-full ${c.active ? 'bg-[#00f2ff] animate-pulse' : 'bg-gray-200'}`}></div>
                                                                <span className="text-[9px] font-bold text-gray-400 uppercase">{c.active ? 'Sync Masiva' : 'Excluido'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-6 text-right">
                                                            <button 
                                                                onClick={() => toggleCategoryMapping(c.id)}
                                                                className={`h-7 w-12 rounded-full relative transition-all duration-300 flex items-center px-1 ml-auto ${c.active ? 'bg-[#004d4d]' : 'bg-gray-200'}`}
                                                            >
                                                                <div className={`h-5 w-5 bg-white rounded-full shadow-md transition-all ${c.active ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div className="p-10 bg-gray-50/50 border-t border-gray-50 flex justify-between items-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Sincronización bidireccional garantizada</p>
                                    <button 
                                        onClick={() => { setView('dashboard'); alert("Configuración de mapeo masivo actualizada."); }}
                                        className="px-10 py-4 bg-[#004d4d] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all"
                                    >
                                        Aplicar Cambios Masivos
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="connect" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white/80 backdrop-blur-xl rounded-[4rem] border border-white/60 shadow-2xl overflow-hidden flex flex-col"
                    >
                        <div className="p-12 border-b border-gray-50 flex items-center justify-between bg-white/50">
                            <div>
                                <button onClick={() => setView('dashboard')} className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-[#004d4d] flex items-center gap-2 mb-4">
                                    <ChevronRight size={14} className="rotate-180" /> Cancelar Conexión
                                </button>
                                <h2 className="text-3xl font-black text-[#004d4d] tracking-tight">Conectar nuevo Marketplace</h2>
                            </div>
                        </div>
                        <div className="p-20 text-center space-y-12">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {['MercadoLibre', 'Shopify', 'Amazon', 'Falabella'].map((m, i) => (
                                    <div key={i} className="bg-gray-50 p-10 rounded-[3rem] border border-transparent hover:border-[#00f2ff] transition-all cursor-pointer group">
                                        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🌐</div>
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-900">{m}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- OMNICHANNEL FOOTER --- */}
            <div className="relative p-12 bg-white rounded-[4rem] border border-gray-100 overflow-hidden shadow-2xl shadow-gray-200/20 group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                    <Globe size={180} className="text-[#004d4d]" />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                    <div className="h-28 w-28 bg-[#004d4d] rounded-[2.5rem] flex items-center justify-center text-5xl shadow-[0_0_50px_rgba(0,77,77,0.15)] group-hover:rotate-12 transition-transform">
                        <MousePointer2 size={48} className="text-[#00f2ff]" />
                    </div>
                    
                    <div className="flex-1 text-center lg:text-left">
                        <h3 className="text-3xl font-black text-[#004d4d] tracking-tight leading-tight uppercase italic">Control Total Omnicanal</h3>
                        <p className="text-gray-500 text-lg mt-4 max-w-3xl leading-relaxed font-medium">
                            Decide exactamente qué vender en cada marketplace. Ya sea un <span className="text-[#004d4d] font-bold">producto único</span> o una <span className="text-[#004d4d] font-bold">categoría completa</span>, Bayup mantiene el stock sincronizado en milisegundos.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 min-w-[240px]">
                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Stock Maestro Protegido</p>
                            <p className="text-2xl font-black text-[#004d4d]">100% Sync</p>
                        </div>
                        <button className="px-8 py-4 bg-[#004d4d] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">
                            Manual de Sincronización
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
