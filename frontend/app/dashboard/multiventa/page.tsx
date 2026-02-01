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
  Search
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
    const [view, setView] = useState<'dashboard' | 'connect'>('dashboard');
    const [step, setStep] = useState(1);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 3000);
    };

    const getStatusGlow = (status: Marketplace['status']) => {
        switch (status) {
            case 'connected': return 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]';
            case 'warning': return 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]';
            case 'error': return 'bg-rose-500 shadow-[0_0_12px_rgba(225,29,72,0.4)]';
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
                        onClick={handleSync}
                        className="flex items-center gap-3 px-8 py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#004d4d] hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <RefreshCw size={14} className={`${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Sincronizando...' : 'Forzar Sincro'}
                    </button>
                    <button 
                        onClick={() => { setView('connect'); setStep(1); }}
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
                        {/* --- KPI INDICATORS --- */}
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
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 italic">{kpi.sub}</p>
                                    </div>
                                    <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center text-[#004d4d]/20 group-hover:bg-[#00f2ff]/10 group-hover:text-[#00f2ff] transition-all">
                                        {kpi.icon}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* --- MARKETPLACE GRID --- */}
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

                            {/* ADD NEW PLACEHOLDER */}
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

                        {/* --- MONITOR & ACTIVITY --- */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-10 border-t border-gray-100">
                            <div className="lg:col-span-2 bg-[#004d4d] rounded-[4rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-[#004d4d]/20">
                                <div className="absolute top-0 right-0 p-12 opacity-10">
                                    <Activity size={150} />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                                    <div className="h-32 w-32 rounded-full border-8 border-white/10 flex items-center justify-center relative">
                                        <div className="h-24 w-24 rounded-full border-8 border-[#00f2ff] border-t-transparent animate-spin duration-[3000ms]"></div>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <p className="text-2xl font-black text-[#00f2ff]">98%</p>
                                            <p className="text-[8px] font-black uppercase tracking-widest">Salud</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="text-3xl font-black tracking-tight">Monitor de Sincronización</h3>
                                        <p className="text-white/60 text-lg mt-4 max-w-xl font-medium leading-relaxed">
                                            Tu stock maestro está actualmente sincronizado con <span className="text-[#00f2ff]">4 canales externos</span>. Sin discrepancias detectadas en las últimas 24 horas.
                                        </p>
                                        <div className="flex gap-4 mt-8 justify-center md:justify-start">
                                            <div className="px-6 py-3 bg-white/10 rounded-2xl border border-white/10 flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-[#00f2ff] animate-pulse"></div>
                                                <span className="text-[10px] font-black uppercase tracking-widest">Sincronización Automática ON</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[4rem] p-12 border border-gray-100 shadow-sm flex flex-col">
                                <h3 className="text-lg font-black text-[#004d4d] uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                                    <Activity size={18} className="text-[#00f2ff]" /> Alertas Recientes
                                </h3>
                                <div className="space-y-8 flex-1">
                                    {[
                                        { title: 'Token Expirado', desc: 'Amazon requiere re-autenticación', type: 'error', time: 'hace 10m' },
                                        { title: 'Stock Bajo', desc: 'MercadoLibre: Zapato Oxford (SKU-01)', type: 'warning', time: 'hace 1h' },
                                        { title: 'Nueva Orden', desc: 'Shopify: #10294 - $125.000', type: 'success', time: 'hace 2h' },
                                    ].map((alert, i) => (
                                        <div key={i} className="flex gap-4 group cursor-pointer">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                alert.type === 'error' ? 'bg-rose-50 text-rose-500' : alert.type === 'warning' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'
                                            }`}>
                                                {alert.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between gap-4">
                                                    <p className="text-xs font-black text-gray-900 group-hover:text-[#004d4d] transition-colors uppercase tracking-widest">{alert.title}</p>
                                                    <span className="text-[8px] font-bold text-gray-300 uppercase">{alert.time}</span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1 font-medium">{alert.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="mt-10 w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d] border border-[#004d4d]/10 rounded-2xl hover:bg-gray-50 transition-all">
                                    Ver Centro de Alertas
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="connect"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white/80 backdrop-blur-xl rounded-[4rem] border border-white/60 shadow-2xl shadow-[#004d4d]/5 overflow-hidden flex flex-col"
                    >
                        {/* WIZARD HEADER */}
                        <div className="p-12 border-b border-gray-50 flex items-center justify-between bg-white/50">
                            <div>
                                <button 
                                    onClick={() => setView('dashboard')}
                                    className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-[#004d4d] flex items-center gap-2 mb-4"
                                >
                                    <ChevronRight size={14} className="rotate-180" /> Cancelar Conexión
                                </button>
                                <h2 className="text-3xl font-black text-[#004d4d] tracking-tight">Conectar nuevo Marketplace</h2>
                            </div>
                            
                            {/* STEPS INDICATOR */}
                            <div className="flex gap-4">
                                {[1, 2, 3, 4].map((s) => (
                                    <div key={s} className="flex flex-col items-center gap-2">
                                        <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= s ? 'bg-[#00f2ff]' : 'bg-gray-100'}`}></div>
                                        <span className={`text-[8px] font-black uppercase tracking-tighter ${step >= s ? 'text-[#004d4d]' : 'text-gray-300'}`}>Paso {s}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 lg:p-20 custom-scrollbar min-h-[600px] flex items-center justify-center">
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div 
                                        key="step1" 
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                        className="w-full max-w-4xl text-center space-y-12"
                                    >
                                        <div className="space-y-4">
                                            <h3 className="text-2xl font-black text-[#004d4d] tracking-tight">¿Qué marketplace deseas conectar?</h3>
                                            <p className="text-gray-400 text-sm font-medium uppercase tracking-widest italic">Selecciona el ecosistema que quieres integrar hoy</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            {[
                                                { name: 'MercadoLibre', logo: '🟡' },
                                                { name: 'Shopify', logo: '🟢' },
                                                { name: 'Amazon', logo: '🟠' },
                                                { name: 'Falabella', logo: '🔵' },
                                                { name: 'Magento', logo: '🔴' },
                                                { name: 'WooCommerce', logo: '🟣' },
                                                { name: 'VTEX', logo: '🟡' },
                                                { name: 'Walmart', logo: '🔵' },
                                            ].map((market, i) => (
                                                <button 
                                                    key={i}
                                                    onClick={() => setStep(2)}
                                                    className="group bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-[#00f2ff] hover:bg-[#00f2ff]/5 hover:scale-105 transition-all flex flex-col items-center gap-4"
                                                >
                                                    <div className="text-4xl group-hover:scale-125 transition-transform">{market.logo}</div>
                                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{market.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div 
                                        key="step2" 
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                        className="w-full max-w-2xl text-center space-y-12"
                                    >
                                        <div className="h-32 w-32 bg-[#004d4d]/5 rounded-[3rem] flex items-center justify-center mx-auto text-[#004d4d]">
                                            <ShieldCheck size={60} className="text-[#00f2ff]" />
                                        </div>
                                        <div className="space-y-6">
                                            <h3 className="text-3xl font-black text-[#004d4d] tracking-tight leading-tight">Autorización de Seguridad</h3>
                                            <p className="text-gray-500 text-lg font-medium leading-relaxed">
                                                Para conectar tu cuenta de <span className="text-[#004d4d] font-black italic">MercadoLibre</span>, necesitamos que autorices a Bayup a sincronizar tus productos y ventas vía API oficial.
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 text-left space-y-4">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Info size={14} className="text-[#00f2ff]" /> Información de Seguridad</p>
                                            <p className="text-xs text-gray-500 font-medium leading-relaxed italic">"Tu contraseña de marketplace nunca es almacenada. Utilizamos tokens de acceso encriptados de nivel bancario (AES-256)."</p>
                                        </div>
                                        <button 
                                            onClick={() => setStep(3)}
                                            className="w-full py-6 bg-[#004d4d] text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-[#004d4d]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                        >
                                            Autorizar Conexión Segura <ExternalLink size={16} />
                                        </button>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div 
                                        key="step3" 
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                        className="w-full max-w-2xl space-y-12"
                                    >
                                        <div className="text-center space-y-4">
                                            <h3 className="text-3xl font-black text-[#004d4d] tracking-tight">Configuración de Canal</h3>
                                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest italic">Personaliza cómo Bayup interactúa con este marketplace</p>
                                        </div>
                                        
                                        <div className="space-y-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">País de Operación</label>
                                                <select className="w-full p-5 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-[#00f2ff]/40 outline-none text-sm font-bold text-gray-700 shadow-inner">
                                                    <option>Colombia (CO)</option>
                                                    <option>México (MX)</option>
                                                    <option>Chile (CL)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bodega de Despacho</label>
                                                <select className="w-full p-5 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-[#00f2ff]/40 outline-none text-sm font-bold text-gray-700 shadow-inner">
                                                    <option>Bodega Central - Occidente</option>
                                                    <option>Almacén Norte (Tienda Física)</option>
                                                </select>
                                            </div>
                                            <div className="p-6 bg-[#00f2ff]/5 rounded-3xl border border-[#00f2ff]/20 flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-black text-[#004d4d] uppercase tracking-widest">Sincronización de Stock</p>
                                                    <p className="text-[10px] text-[#008080] font-bold mt-1">Actualizar automáticamente existencias</p>
                                                </div>
                                                <div className="h-6 w-11 bg-[#004d4d] rounded-full relative flex items-center px-1">
                                                    <div className="h-4 w-4 bg-[#00f2ff] rounded-full shadow-sm translate-x-5"></div>
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => setStep(4)}
                                            className="w-full py-6 bg-[#004d4d] text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all"
                                        >
                                            Continuar a Confirmación
                                        </button>
                                    </motion.div>
                                )}

                                {step === 4 && (
                                    <motion.div 
                                        key="step4" 
                                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                        className="w-full max-w-2xl text-center space-y-12"
                                    >
                                        <div className="relative mx-auto h-40 w-40">
                                            <motion.div 
                                                animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                                className="absolute inset-0 border-4 border-dashed border-[#00f2ff] rounded-full"
                                            ></motion.div>
                                            <div className="absolute inset-0 flex items-center justify-center text-[#00f2ff]">
                                                <Link2 size={60} />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            <h3 className="text-4xl font-black text-[#004d4d] tracking-tight">¡Casi listo para el despegue!</h3>
                                            <p className="text-gray-500 text-lg font-medium leading-relaxed max-w-lg mx-auto">
                                                Estamos listos para conectar <span className="text-[#004d4d] font-black italic">MercadoLibre (CO)</span> con tu inventario de la <span className="text-[#004d4d] font-black italic">Bodega Central</span>.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Stock</p>
                                                <p className="text-xs font-black text-[#004d4d]">Auto-Sync</p>
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Precios</p>
                                                <p className="text-xs font-black text-[#004d4d]">Espejo</p>
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Pedidos</p>
                                                <p className="text-xs font-black text-[#004d4d]">Centralizados</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            <button 
                                                onClick={() => { setView('dashboard'); alert("Integración finalizada con éxito."); }}
                                                className="w-full py-6 bg-[#004d4d] text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-[#004d4d]/20 hover:bg-black transition-all"
                                            >
                                                Finalizar e Iniciar Sincro
                                            </button>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Al finalizar, importaremos tus primeras 50 publicaciones automáticamente.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
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
                        <h3 className="text-3xl font-black text-[#004d4d] tracking-tight leading-tight">Tu Negocio en Todo el Mundo</h3>
                        <p className="text-gray-500 text-lg mt-4 max-w-3xl leading-relaxed font-medium">
                            La omnicanalidad no es solo estar en todos lados, es estar <span className="text-[#004d4d] font-bold italic">bien organizado</span> en todos lados. Bayup Multivende asegura que nunca vendas lo que no tienes y que cada pedido cuente.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 min-w-[240px]">
                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Uptime APIs</span>
                                <span className="text-xs font-black text-emerald-600">99.9%</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full w-[99.9%] bg-emerald-500"></div>
                            </div>
                        </div>
                        <button className="px-8 py-4 bg-[#004d4d] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#004d4d]/10 hover:bg-[#00f2ff] hover:text-[#004d4d] transition-all">
                            Documentación API
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}