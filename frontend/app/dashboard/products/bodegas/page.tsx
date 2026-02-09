"use client";

import { useState, useRef, useEffect, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  MapPin, 
  ArrowRightLeft, 
  History, 
  TrendingUp, 
  AlertCircle, 
  ChevronRight, 
  Plus, 
  Search, 
  Filter,
  Package,
  ArrowRight,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Warehouse as WarehouseIcon,
  LayoutGrid,
  Info,
  X,
  Zap,
  ShieldCheck,
  Activity,
  RefreshCw,
  Smartphone,
  Layers,
  BarChart3,
  Truck,
  Download
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/context/toast-context";
import TiltCard from '@/components/dashboard/TiltCard';

// --- CONTENIDO DE LA GUÍA (ESTILO PEDIDOS) ---
const BODEGAS_GUIDE_CONTENT = {
    general: {
        title: 'Vista General',
        icon: <LayoutGrid size={20}/>,
        color: 'text-blue-500',
        howItWorks: 'Es el centro de monitoreo de toda tu red logística. Aquí puedes ver la capacidad ocupada y el stock total de cada una de tus sedes en tiempo real.',
        example: 'Si tienes una bodega en Bogotá y otra en Medellín, desde aquí sabrás instantáneamente qué sucursal tiene más espacio disponible para recibir un nuevo contenedor.',
        tip: 'Mantén la capacidad ocupada por debajo del 85% para garantizar una operación fluida y evitar cuellos de botella en el despacho.'
    },
    transfers: {
        title: 'Traslados',
        icon: <ArrowRightLeft size={20}/>,
        color: 'text-amber-500',
        howItWorks: 'Permite mover mercancía entre bodegas de forma segura. El sistema genera una remisión digital que bloquea el stock en origen y solo lo libera en destino tras la confirmación.',
        example: 'Tu tienda del Norte se quedó sin "Relojes Gold" pero la bodega Central tiene 50. Creas un traslado, la transportadora lo lleva y al recibirlo en el Norte, el stock sube automáticamente allá.',
        tip: 'Usa traslados preventivos los miércoles basándote en la predicción de ventas del fin de semana para nunca perder una venta por falta de stock local.'
    },
    stock: {
        title: 'Stock Global',
        icon: <Box size={20}/>,
        color: 'text-cyan-500',
        howItWorks: 'Consolida la suma de todos los productos en todas tus ubicaciones. Es la cifra maestra que ven tus canales de venta online (Web, Shopify, MercadoLibre).',
        example: 'Si sumando todas las bodegas tienes 100 unidades, ese es el número que Bayup sincronizará con MercadoLibre para asegurar que nunca vendas algo que no tienes físicamente.',
        tip: 'Sincroniza manualmente una vez al día al iniciar la jornada para asegurar que los ajustes físicos de inventario nocturnos se reflejen en la nube.'
    },
    alerts: {
        title: 'Alertas',
        icon: <AlertCircle size={20}/>,
        color: 'text-rose-500',
        howItWorks: 'Detecta automáticamente productos con bajo inventario o bodegas que han superado su capacidad crítica. El sistema te avisa antes de que ocurra una rotura de stock.',
        example: 'Un producto llega a 5 unidades (tu mínimo configurado). Bayup genera una alerta roja aquí para que procedas a reponer stock o realizar un traslado urgente.',
        tip: 'No ignores las alertas amarillas. Son la diferencia entre un despacho de 24 horas y un retraso de 5 días por falta de producto.'
    }
};

// --- MODAL DE GUÍA PREMIUM (ESTILO PEDIDOS) ---
const BodegasGuideModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState('general');

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        className="relative bg-white w-full max-w-4xl h-[70vh] rounded-[3rem] shadow-2xl overflow-hidden border border-white flex flex-col md:flex-row"
                    >
                        {/* Navigation Sidebar */}
                        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-2 overflow-y-auto">
                            <div className="mb-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004D4D]">Estrategia Logística</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">Guía de Maestría</p>
                            </div>
                            {Object.entries(BODEGAS_GUIDE_CONTENT).map(([key, item]) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={`flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${activeTab === key ? 'bg-[#004D4D] text-white shadow-lg' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
                                >
                                    <div className={`${activeTab === key ? 'text-white' : item.color}`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wide">{item.title}</span>
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 flex flex-col overflow-hidden bg-white">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0">
                                <div className="flex items-center gap-4">
                                    <div className={`h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center ${BODEGAS_GUIDE_CONTENT[activeTab as keyof typeof BODEGAS_GUIDE_CONTENT].color}`}>
                                        {BODEGAS_GUIDE_CONTENT[activeTab as keyof typeof BODEGAS_GUIDE_CONTENT].icon}
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                                        {BODEGAS_GUIDE_CONTENT[activeTab as keyof typeof BODEGAS_GUIDE_CONTENT].title}
                                    </h2>
                                </div>
                                <button onClick={onClose} className="h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                                    <X size={20}/>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                                <section>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <div className="h-1 w-4 bg-[#004D4D] rounded-full"></div> ¿Cómo funciona?
                                    </h4>
                                    <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                                        {BODEGAS_GUIDE_CONTENT[activeTab as keyof typeof BODEGAS_GUIDE_CONTENT].howItWorks}
                                    </p>
                                </section>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <section className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Smartphone size={14} className="text-cyan-500"/> Ejemplo Real
                                        </h4>
                                        <div className="p-6 bg-cyan-50/30 border border-cyan-100 rounded-[2rem]">
                                            <p className="text-xs font-medium text-cyan-900 leading-relaxed italic">
                                                "{BODEGAS_GUIDE_CONTENT[activeTab as keyof typeof BODEGAS_GUIDE_CONTENT].example}"
                                            </p>
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Zap size={14} className="text-amber-500"/> Bayup Pro-Tip
                                        </h4>
                                        <div className="p-6 bg-amber-50/30 border border-amber-100 rounded-[2rem]">
                                            <p className="text-xs font-bold text-amber-900 leading-relaxed">
                                                {BODEGAS_GUIDE_CONTENT[activeTab as keyof typeof BODEGAS_GUIDE_CONTENT].tip}
                                            </p>
                                        </div>
                                    </section>
                                </div>
                            </div>

                            <div className="p-8 border-t border-slate-50 flex justify-end bg-slate-50/30">
                                <button 
                                    onClick={onClose}
                                    className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all"
                                >
                                    Cerrar Guía
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- MODAL DE DETALLE DE MÉTRICA ---
const BodegasMetricModal = ({ isOpen, onClose, metric }: { isOpen: boolean, onClose: () => void, metric: any }) => {
    if (!metric) return null;
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-lg rounded-[4rem] shadow-3xl overflow-hidden relative border border-white/20 z-10">
                        <div className={`p-10 text-white relative overflow-hidden ${metric.color.replace('text-', 'bg-')}`}>
                            <div className="absolute top-0 right-0 p-6 opacity-10">{metric.icon}</div>
                            <h2 className="text-3xl font-black uppercase tracking-tight relative z-10">{metric.label}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest mt-2 relative z-10 opacity-80">{metric.sub}</p>
                            <button onClick={onClose} className="absolute top-8 right-8 bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="text-center py-6">
                                <span className="text-5xl font-black text-gray-900 tracking-tighter italic">{metric.value}</span>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Estado Logístico Global</p>
                            </div>
                            <div className="space-y-4">
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-gray-500">Estado de Red</span>
                                    <span className="text-sm font-black text-emerald-600">Operativa</span>
                                </div>
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-gray-500">Última Sincro</span>
                                    <span className="text-sm font-black text-[#004d4d]">Hace 2 min</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl">Cerrar Detalle</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- MODAL DE DETALLE DE BODEGA ---
const WarehouseDetailModal = ({ isOpen, onClose, warehouse }: { isOpen: boolean, onClose: () => void, warehouse: any }) => {
    const { showToast } = useToast();
    if (!warehouse) return null;

    const handleGenerateCount = () => {
        showToast(`Solicitud de conteo enviada a ${warehouse.name}`, "info");
        setTimeout(() => {
            showToast("Reporte de inventario generado en PDF 📄", "success");
        }, 1500);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-4xl rounded-[4rem] shadow-3xl overflow-hidden relative border border-white/20 z-10 flex flex-col lg:flex-row">
                        <div className="lg:w-1/3 bg-[#004d4d] p-12 text-white relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 p-6 opacity-10"><WarehouseIcon size={150} /></div>
                            <div className="relative z-10 space-y-8">
                                <div>
                                    <span className="bg-[#00f2ff] text-[#004d4d] text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{warehouse.type}</span>
                                    <h2 className="text-4xl font-black tracking-tight mt-6 leading-none">{warehouse.name}</h2>
                                    <p className="flex items-center gap-2 text-xs font-bold text-white/60 uppercase tracking-widest mt-4"><MapPin size={14} className="text-[#00f2ff]" /> {warehouse.location}</p>
                                </div>
                                <div className="space-y-6 pt-10 border-t border-white/10">
                                    <div className="flex justify-between items-center"><span className="text-[10px] font-black text-white/40 uppercase">Stock Actual</span><span className="text-2xl font-black">{warehouse.total_items} Unds</span></div>
                                    <div className="flex justify-between items-center"><span className="text-[10px] font-black text-white/40 uppercase">Capacidad</span><span className="text-2xl font-black">{warehouse.capacity_used}%</span></div>
                                </div>
                            </div>
                            <button onClick={onClose} className="absolute top-8 left-8 bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors lg:hidden"><X size={20}/></button>
                        </div>
                        <div className="flex-1 p-12 space-y-10 bg-white overflow-y-auto max-h-[80vh] custom-scrollbar">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-black text-gray-900 uppercase italic">Inventario Local</h3>
                                <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" placeholder="Buscar SKU..." className="pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-[#00f2ff]/30 w-40"/></div>
                            </div>
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50/50">
                                    <tr><th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Producto</th><th className="px-6 py-4 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Stock</th><th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Estado</th></tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {[ {n:'Zapato Oxford', s:'WA-01', q:45, st:'normal'}, {n:'Camisa Lino', s:'CL-02', q:12, st:'bajo'}, {n:'Reloj Gold', s:'RE-03', q:2, st:'crítico'} ].map((p, i) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4"><p className="text-xs font-black text-gray-900">{p.n}</p><p className="text-[9px] text-gray-400 uppercase font-bold">{p.s}</p></td>
                                            <td className="px-6 py-4 text-center font-black text-[#004d4d] text-sm">{p.q}</td>
                                            <td className="px-6 py-4 text-right"><span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${p.st === 'normal' ? 'bg-emerald-50 text-emerald-600' : p.st === 'bajo' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>{p.st}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="flex gap-4 pt-6 border-t border-gray-100"><button onClick={handleGenerateCount} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all">Generar Conteo</button><button onClick={onClose} className="px-8 py-4 border-2 border-gray-100 text-gray-400 rounded-2xl hover:bg-gray-50 transition-all font-black uppercase text-[10px]">Cerrar</button></div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- MODAL DE NUEVO TRASLADO (FUNCIONAL) ---
const TransferModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            onClose();
            showToast("¡Remisión de traslado #TR-1024 generada con éxito! 🚛", "success");
        }, 2000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-3xl rounded-[4rem] shadow-3xl overflow-hidden relative border border-white/20 z-10 flex flex-col max-h-[90vh]">
                        
                        {/* Header */}
                        <div className="bg-[#004d4d] p-10 text-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 bg-[#00f2ff] text-[#004d4d] rounded-2xl flex items-center justify-center shadow-lg"><ArrowRightLeft size={32} /></div>
                                <div><h2 className="text-2xl font-black uppercase tracking-tight">Nuevo Traslado</h2><p className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest">Movimiento de Inventario</p></div>
                            </div>
                            <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><X size={20}/></button>
                        </div>

                        {/* Body */}
                        <div className="p-10 flex-1 overflow-y-auto custom-scrollbar bg-white">
                            <div className="space-y-8">
                                {/* Route Selection */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Origen</label>
                                        <select className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner appearance-none cursor-pointer">
                                            <option>Bodega Central - Occidente</option>
                                            <option>Almacén Logístico Sur</option>
                                        </select>
                                    </div>
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex h-10 w-10 bg-white border border-gray-100 rounded-full items-center justify-center text-[#004d4d] shadow-md z-10 mt-3">
                                        <ArrowRight size={16} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Destino</label>
                                        <select className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner appearance-none cursor-pointer">
                                            <option>Tienda Flagship Norte</option>
                                            <option>Showroom Innovación</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Product Selection */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Seleccionar Productos</label>
                                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
                                        <div className="flex gap-4">
                                            <input type="text" placeholder="Buscar SKU o nombre..." className="flex-1 p-4 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-[#00f2ff]/50 transition-all"/>
                                            <button className="px-6 bg-[#004d4d] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">Añadir</button>
                                        </div>
                                        {/* Mock Added Item */}
                                        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center"><Package size={16} className="text-gray-400"/></div>
                                                <div><p className="text-xs font-black text-gray-900">Reloj Cronógrafo Gold</p><p className="text-[9px] font-bold text-gray-400">SKU: RE-03</p></div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <input type="number" defaultValue={10} className="w-16 p-2 bg-gray-50 rounded-lg text-center font-black text-sm outline-none"/>
                                                <button className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all"><X size={16}/></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Logistics Info */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Transportadora</label>
                                        <select className="w-full p-4 bg-gray-50 rounded-2xl border-transparent outline-none text-sm font-bold"><option>Flota Propia</option><option>Servientrega</option><option>Coordinadora</option></select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Prioridad</label>
                                        <select className="w-full p-4 bg-gray-50 rounded-2xl border-transparent outline-none text-sm font-bold"><option>Normal</option><option>Alta</option><option>Crítica</option></select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-gray-100 bg-gray-50 flex gap-4 shrink-0">
                            <button onClick={onClose} className="flex-1 py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-600 transition-colors">Cancelar</button>
                            <button onClick={handleSubmit} disabled={isLoading} className="flex-[2] py-4 bg-[#004d4d] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2">
                                {isLoading ? <RefreshCw size={16} className="animate-spin"/> : <Truck size={16}/>}
                                {isLoading ? 'Procesando...' : 'Generar Remisión'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default function BodegasPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'bodegas' | 'traslados' | 'bayt'>('bodegas');
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
    const [selectedKPI, setSelectedKPI] = useState<any>(null);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = () => {
        setIsSyncing(true);
        showToast("Sincronizando inventario global...", "info");
        setTimeout(() => {
            setIsSyncing(false);
            showToast("¡Stock sincronizado con todas las bodegas! 🔄", "success");
        }, 2500);
    };

    const handleExportPDF = async () => {
        try {
            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            const petrol = [0, 77, 77];
            const cyan = [0, 242, 255];

            // Helper para formato moneda
            const formatMoney = (val: number) => `$ ${val.toLocaleString('es-CO')}`;

            // Header Premium - Portada
            doc.setFillColor(petrol[0], petrol[1], petrol[2]);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("REPORTE MAESTRO DE BODEGAS", 15, 20);
            doc.setFontSize(10);
            doc.text(`Generado por Bayup Intelligence: ${new Date().toLocaleString()}`, 15, 30);

            // Resumen Global
            let y = 55;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.text("Resumen Logístico Global", 15, y);
            
            y += 15;
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const totalStock = warehouses.reduce((acc, w) => acc + w.total_items, 0);
            doc.text(`Total Ubicaciones: ${warehouses.length}`, 15, y);
            doc.text(`Stock Consolidado: ${totalStock} Unidades`, 80, y);
            doc.text(`Precisión de Inventario: 99.9%`, 150, y);

            // Tabla Resumen
            y += 20;
            doc.setFillColor(245, 245, 245);
            doc.rect(14, y-6, 185, 8, 'F');
            doc.setFont("helvetica", "bold");
            doc.text("BODEGA / SEDE", 16, y);
            doc.text("TIPO", 80, y);
            doc.text("CAPACIDAD", 130, y);
            doc.text("STOCK", 170, y);

            y += 10;
            doc.setFont("helvetica", "normal");
            warehouses.forEach(w => {
                doc.text(w.name, 16, y);
                doc.text(w.type, 80, y);
                doc.text(`${w.capacity_used}%`, 130, y);
                doc.text(w.total_items.toString(), 170, y);
                y += 8;
            });

            // --- PÁGINAS DETALLADAS POR BODEGA ---
            const getMockDetails = (id: string) => {
                // Simulación de datos específicos por bodega para el reporte
                const products = [
                    { name: 'Zapato Oxford Cuero', sku: 'ZAP-001', qty: Math.floor(Math.random() * 50) + 10, cost: 120000 },
                    { name: 'Camisa Lino Blanca', sku: 'CAM-442', qty: Math.floor(Math.random() * 30) + 5, cost: 85000 },
                    { name: 'Reloj Cronógrafo Gold', sku: 'REL-220', qty: Math.floor(Math.random() * 10) + 1, cost: 450000 },
                    { name: 'Pantalón Chino Azul', sku: 'PAN-991', qty: Math.floor(Math.random() * 60) + 20, cost: 95000 },
                ];
                
                const transfers = [
                    { date: '2026-02-01', type: 'Entrada', ref: 'TR-1001', qty: 20 },
                    { date: '2026-01-28', type: 'Salida', ref: 'TR-0998', qty: 5 },
                    { date: '2026-01-15', type: 'Entrada', ref: 'TR-0950', qty: 50 },
                ];

                const totalValue = products.reduce((acc, p) => acc + (p.qty * p.cost), 0);
                return { products, transfers, totalValue };
            };

            warehouses.forEach((w) => {
                doc.addPage();
                const details = getMockDetails(w.id);
                
                // Header Bodega
                doc.setFillColor(petrol[0], petrol[1], petrol[2]);
                doc.rect(0, 0, 210, 30, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(16);
                doc.setFont("helvetica", "bold");
                doc.text(w.name.toUpperCase(), 15, 20);
                
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.text(`Ubicación: ${w.location} | Tipo: ${w.type}`, 15, 27);

                // Resumen Financiero
                let curY = 50;
                doc.setTextColor(0, 0, 0);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(12);
                doc.text("Resumen Financiero & Operativo", 15, curY);
                
                curY += 10;
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.text(`Valor Total Inventario (Costo):`, 15, curY);
                doc.setFont("helvetica", "bold");
                doc.text(formatMoney(details.totalValue), 75, curY);
                
                curY += 6;
                doc.setFont("helvetica", "normal");
                doc.text(`Total Unidades Físicas:`, 15, curY);
                doc.text(w.total_items.toString(), 75, curY);

                // Tabla Inventario
                curY += 20;
                doc.setFillColor(240, 240, 240);
                doc.rect(15, curY - 6, 180, 8, 'F');
                doc.setFont("helvetica", "bold");
                doc.text("PRODUCTO", 17, curY);
                doc.text("SKU", 80, curY);
                doc.text("CANT", 110, curY);
                doc.text("C.UNIT", 130, curY);
                doc.text("TOTAL", 160, curY);

                curY += 10;
                doc.setFont("helvetica", "normal");
                details.products.forEach(p => {
                    doc.text(p.name, 17, curY);
                    doc.text(p.sku, 80, curY);
                    doc.text(p.qty.toString(), 110, curY);
                    doc.text(formatMoney(p.cost), 130, curY);
                    doc.text(formatMoney(p.cost * p.qty), 160, curY);
                    curY += 8;
                });

                // Historial Traslados
                curY += 15;
                doc.setFillColor(240, 240, 240);
                doc.rect(15, curY - 6, 180, 8, 'F');
                doc.setFont("helvetica", "bold");
                doc.text("HISTORIAL DE TRASLADOS RECIENTES", 17, curY);
                
                curY += 10;
                doc.setFontSize(9);
                doc.text("FECHA", 17, curY);
                doc.text("TIPO", 50, curY);
                doc.text("REF", 90, curY);
                doc.text("CANTIDAD", 130, curY);
                
                curY += 8;
                doc.setFont("helvetica", "normal");
                details.transfers.forEach(t => {
                    doc.text(t.date, 17, curY);
                    doc.text(t.type, 50, curY);
                    doc.text(t.ref, 90, curY);
                    doc.text(t.qty.toString(), 130, curY);
                    curY += 6;
                });
            });

            doc.save(`Reporte_Detallado_Bodegas_${new Date().toISOString().split('T')[0]}.pdf`);
            showToast("Reporte detallado descargado con éxito 📄", "success");
        } catch (e) {
            console.error(e);
            showToast("Error al generar el PDF", "error");
        }
    };

    const warehouses = [
        { id: 'w1', name: 'Bodega Central - Occidente', type: 'Bodega Central', location: 'Bogotá, DC', total_items: 1250, capacity_used: 78, is_main: true, alerts: 0, logo: '🏢' },
        { id: 'w2', name: 'Tienda Flagship Norte', type: 'Tienda Física', location: 'C.C. Andino', total_items: 340, capacity_used: 45, is_main: false, alerts: 2, logo: '🏪' },
        { id: 'w3', name: 'Almacén Logístico Sur', type: 'Almacén', location: 'Cali, Valle', total_items: 890, capacity_used: 92, is_main: false, alerts: 5, logo: '📦' },
        { id: 'w4', name: 'Showroom Innovación', type: 'Showroom', location: 'Medellín, ANT', total_items: 120, capacity_used: 15, is_main: false, alerts: 0, logo: '✨' },
    ];

    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
            {[
                { label: 'Ubicaciones', value: '04', sub: 'Activas', icon: <WarehouseIcon size={20}/>, color: 'text-[#004d4d]', bg: 'bg-[#004d4d]/5' },
                { label: 'Stock Global', value: '2.600', sub: 'Unidades', icon: <Box size={20}/>, color: 'text-[#008080]', bg: 'bg-cyan-50' },
                { label: 'En Tránsito', value: '187', sub: 'Por llegar', icon: <ArrowRightLeft size={20}/>, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Alertas Stock', value: '07', sub: 'Críticas', icon: <AlertCircle size={20}/>, color: 'text-rose-600', bg: 'bg-rose-50' },
            ].map((kpi, i) => (
                <TiltCard key={i} className="h-full">
                    <div onClick={() => setSelectedKPI(kpi)} className="bg-white/95 p-8 rounded-[2.5rem] border border-white shadow-xl flex flex-col justify-between h-full group transition-all cursor-pointer">
                        <div className="flex justify-between items-start">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${kpi.bg} ${kpi.color} shadow-inner group-hover:scale-110 transition-transform`}>{kpi.icon}</div>
                            <span className="text-[10px] font-black px-3 py-1 bg-gray-50 text-gray-400 rounded-lg uppercase tracking-widest">Real-time</span>
                        </div>
                        <div className="mt-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                            <h3 className="text-3xl font-black text-gray-900 mt-1">{kpi.value}</h3>
                            <p className="text-[9px] font-bold text-gray-400 mt-1 italic">{kpi.sub}</p>
                        </div>
                    </div>
                </TiltCard>
            ))}
        </div>
    );

    const renderBodegas = () => (
        <div className="px-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 pb-10">
            {warehouses.map((w) => (
                <TiltCard key={w.id} className="h-full">
                    <div onClick={() => setSelectedWarehouse(w)} className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl relative group overflow-hidden h-full flex flex-col justify-between cursor-pointer">
                        <div className="absolute top-0 right-0 p-8 opacity-5 text-6xl group-hover:rotate-12 transition-transform">{w.logo}</div>
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <div className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center text-2xl shadow-inner border border-gray-100 ${w.is_main ? 'bg-[#004d4d] text-[#00f2ff]' : 'bg-gray-50 text-gray-400'}`}><WarehouseIcon size={24}/></div>
                                {w.alerts > 0 && <span className="h-3 w-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_#F43F5E]"></span>}
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight group-hover:text-[#004d4d] transition-colors">{w.name}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2 mt-2"><MapPin size={12} className="text-[#00f2ff]"/> {w.location}</p>
                        </div>
                        <div className="mt-8 pt-8 border-t border-gray-50">
                            <div className="flex justify-between items-end mb-3"><p className="text-[9px] font-black text-gray-400 uppercase">Capacidad</p><p className="text-xs font-black text-gray-900">{w.capacity_used}%</p></div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${w.capacity_used}%` }} className={`h-full rounded-full ${w.capacity_used > 90 ? 'bg-rose-500' : 'bg-[#00f2ff]'}`}></motion.div></div>
                        </div>
                        <div className="mt-6 flex justify-between items-center"><p className="text-xl font-black text-[#004d4d]">{w.total_items} <span className="text-[9px] text-gray-400 uppercase">Items</span></p><div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-[#004d4d] group-hover:bg-[#004d4d]/5 transition-all"><ChevronRight size={20}/></div></div>
                    </div>
                </TiltCard>
            ))}
            <TiltCard className="h-full min-h-[350px]">
                <div onClick={() => setIsTransferModalOpen(true)} className="bg-gray-50 p-10 rounded-[3.5rem] border-2 border-dashed border-gray-200 hover:border-[#00f2ff] hover:bg-[#00f2ff]/5 transition-all cursor-pointer h-full flex flex-col items-center justify-center text-center gap-6 group">
                    <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-gray-300 group-hover:bg-[#004d4d] group-hover:text-white transition-all shadow-xl"><Plus size={32} /></div>
                    <div><h3 className="text-xl font-black text-gray-400 group-hover:text-[#004d4d] transition-colors">Añadir Bodega</h3><p className="text-[10px] font-bold text-gray-300 mt-2 uppercase tracking-widest">Expandir red logística</p></div>
                </div>
            </TiltCard>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-1000 relative">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2"><span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span><span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Inteligencia de Inventario</span></div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">Bodegas <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00f2ff] px-2 py-1">& Stock</span></h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">Gestiona tus existencias y traslados entre sucursales en <span className="font-bold text-[#001A1A]">tiempo real</span>.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleExportPDF}
                        className="h-14 px-6 bg-white border border-gray-100 text-gray-500 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:text-[#004d4d] hover:border-[#004d4d] flex items-center gap-3 transition-all"
                    >
                        <Download size={18}/> PDF
                    </button>
                    <button 
                        onClick={handleSync} 
                        disabled={isSyncing}
                        className="h-14 px-8 bg-white border border-gray-100 text-[#004d4d] rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-lg flex items-center gap-3 transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''}/> 
                        {isSyncing ? 'Sincronizando...' : 'Sincronizar Stock'}
                    </button>
                    <button onClick={() => setIsTransferModalOpen(true)} className="h-14 px-8 bg-[#004d4d] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 hover:scale-105 transition-all"><ArrowRightLeft size={18} className="text-[#00f2ff]"/> Nuevo Traslado</button>
                </div>
            </div>

            {renderKPIs()}

            <div className="flex items-center justify-center gap-6 shrink-0 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 backdrop-blur-xl flex items-center relative">
                    {[ { id: 'bodegas', label: 'Bodegas', icon: <WarehouseIcon size={14}/> }, { id: 'traslados', label: 'Traslados', icon: <ArrowRightLeft size={14}/> }, { id: 'bayt', label: 'Bayt Insight', icon: <Zap size={14}/> } ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}>
                                {isActive && <motion.div layoutId="activeWarehouseTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                                {tab.icon} {tab.label}
                            </button>
                        );
                    })}
                </div>
                <button onClick={() => setShowInfoModal(true)} className="h-12 w-12 rounded-full bg-white border border-slate-200 shadow-xl flex items-center justify-center text-[#004D4D] hover:bg-[#004D4D] hover:text-white transition-all active:scale-95 group"><Info size={20} /></button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="space-y-10">
                    {activeTab === 'bodegas' && renderBodegas()}
                    {activeTab === 'traslados' && <div className="px-4 text-center py-20 bg-white/40 rounded-[3rem] border border-dashed border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-widest">Gestión de Traslados (Próximamente Platinum Plus)</div>}
                    {activeTab === 'bayt' && (
                        <div className="px-4"><div className="bg-[#004d4d] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5"><div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Activity size={300} /></div><div className="flex flex-col md:flex-row items-center gap-16 relative z-10"><div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center animate-pulse"><Zap size={64} className="text-[#00f2ff]" /></div><div className="flex-1 space-y-6"><span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#00f2ff]/20">Warehouse Intelligence</span><h3 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2ff]">Logística Predictiva</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10"><p className="text-sm font-medium italic leading-relaxed">"La **Tienda Flagship** está agotando stock de 'Reloj Gold'. Recomiendo trasvasar 15 unidades de la Bodega Central antes del fin de semana."</p></div><div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10"><p className="text-sm font-medium italic leading-relaxed">"El Almacén Sur tiene capacidad ocupada al 92%. Sugiero liquidación de inventario de baja rotación para liberar espacio operativo."</p></div></div></div></div></div></div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* MODALES */}
            <BodegasGuideModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
            <WarehouseDetailModal isOpen={!!selectedWarehouse} onClose={() => setSelectedWarehouse(null)} warehouse={selectedWarehouse} />
            <BodegasMetricModal isOpen={!!selectedKPI} onClose={() => setSelectedKPI(null)} metric={selectedKPI} />
            <TransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} />

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
            `}</style>
        </div>
    );
}