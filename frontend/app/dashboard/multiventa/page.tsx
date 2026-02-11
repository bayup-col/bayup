"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Zap, 
  RefreshCw, 
  AlertTriangle, 
  Plus, 
  ChevronRight, 
  Layers, 
  Settings2, 
  ShoppingCart, 
  Info, 
  MousePointer2, 
  Search,
  Tag,
  LayoutGrid,
  Store,
  CheckCircle2,
  X,
  Link2,
  PiggyBank,
  Activity
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import TiltCard from '@/components/dashboard/TiltCard';

// --- MODAL DE GUÍA FLOTANTE ---
const MultiventaGuideModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative border border-white/20 z-10">
                        <div className="bg-[#004d4d] p-10 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10"><Globe size={120} /></div>
                            <h2 className="text-3xl font-black uppercase tracking-tight relative z-10">Guía Omnicanal</h2>
                            <p className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest mt-2 relative z-10">Sincronización Total</p>
                            <button onClick={onClose} className="absolute top-8 right-8 bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="flex gap-6">
                                <div className="h-12 w-12 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center shrink-0"><RefreshCw size={24}/></div>
                                <div><h4 className="font-black text-gray-900 text-lg">Sincronización Real</h4><p className="text-xs text-gray-500 font-medium mt-1">El stock se descuenta automáticamente de todos los canales al vender en uno.</p></div>
                            </div>
                            <div className="flex gap-6">
                                <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0"><Layers size={24}/></div>
                                <div><h4 className="font-black text-gray-900 text-lg">Catálogos Diferenciados</h4><p className="text-xs text-gray-500 font-medium mt-1">Elige qué productos enviar a cada canal. Control total de tu inventario.</p></div>
                            </div>
                            <button onClick={onClose} className="w-full py-4 bg-[#004d4d] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] transition-transform">Entendido</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- MODAL DE DETALLE DE MÉTRICA ---
const MultiventaMetricModal = ({ isOpen, onClose, metric }: { isOpen: boolean, onClose: () => void, metric: any }) => {
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
                            <button onClick={onClose} className="absolute top-8 right-8 bg-black/10 p-2 rounded-full hover:bg-white/20 transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="text-center py-6">
                                <span className="text-5xl font-black text-gray-900 tracking-tighter italic">{metric.value}</span>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Estado del Canal Global</p>
                            </div>
                            <div className="space-y-4">
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-gray-500">Tendencia 24h</span>
                                    <span className="text-sm font-black text-emerald-600">+12.4%</span>
                                </div>
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-gray-500">Precisión Sync</span>
                                    <span className="text-sm font-black text-[#004d4d]">99.9%</span>
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

// --- MODAL DE DETALLE DE MARKETPLACE ---
const MarketplaceDetailModal = ({ isOpen, onClose, marketplace }: { isOpen: boolean, onClose: () => void, marketplace: any }) => {
    const router = useRouter();
    if (!marketplace) return null;
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-2xl rounded-[4rem] shadow-3xl overflow-hidden relative border border-white/20 z-10">
                        <div className={`bg-[#004d4d] p-10 text-white relative overflow-hidden`}>
                            <div className="absolute top-0 right-0 p-10 opacity-10 text-8xl">{marketplace.logo}</div>
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center text-4xl shadow-xl">{marketplace.logo}</div>
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tight">{marketplace.name}</h2>
                                    <p className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest mt-2">Sincronización en tiempo real • {marketplace.country}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="absolute top-8 right-8 bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-10 space-y-10 bg-white">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-center space-y-2">
                                    <p className="text-[9px] font-black text-gray-400 uppercase">Ventas Hoy</p>
                                    <p className="text-xl font-black text-gray-900">${(marketplace.sales_today / 1000).toFixed(0)}k</p>
                                </div>
                                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-center space-y-2">
                                    <p className="text-[9px] font-black text-gray-400 uppercase">Pedidos</p>
                                    <p className="text-xl font-black text-gray-900">{marketplace.pending_orders}</p>
                                </div>
                                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-center space-y-2">
                                    <p className="text-[9px] font-black text-gray-400 uppercase">Clientes</p>
                                    <p className="text-xl font-black text-gray-900">+{Math.floor(marketplace.sales_today / 50000)}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Activity size={14}/> Rendimiento del Canal</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center"><span className="text-xs font-bold text-gray-600">Eficiencia de Entrega</span><span className="text-xs font-black text-emerald-600">98.5%</span></div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[98.5%] rounded-full shadow-[0_0_10px_#10B981]"></div></div>
                                    
                                    <div className="flex justify-between items-center"><span className="text-xs font-bold text-gray-600">Satisfacción Cliente</span><span className="text-xs font-black text-amber-500">4.8/5.0</span></div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-amber-400 w-[92%] rounded-full shadow-[0_0_10px_#FBBF24]"></div></div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex gap-4">
                                <button onClick={() => router.push('/dashboard/orders')} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl">Ver Pedidos de {marketplace.name}</button>
                                <button onClick={() => router.push('/dashboard/settings/general')} className="px-6 py-4 border-2 border-gray-100 text-gray-400 rounded-2xl hover:border-cyan-400 hover:text-cyan-600 transition-all"><Settings2 size={20}/></button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- MODAL DE CONEXIÓN MANUAL ---
const ConnectChannelModal = ({ isOpen, onClose, onSync }: { isOpen: boolean, onClose: () => void, onSync: (data: any) => void }) => {
    const [step, setStep] = useState<'select' | 'manual'>('select');
    const [formData, setFormData] = useState({ name: '', url: '', token: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSync(formData);
        setStep('select');
        setFormData({ name: '', url: '', token: '' });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-2xl rounded-[4rem] shadow-3xl overflow-hidden relative border border-white/20 z-10">
                        <div className="bg-[#004d4d] p-10 text-white flex items-center justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10"><RefreshCw size={120} /></div>
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="h-16 w-16 bg-[#00f2ff] text-[#004d4d] rounded-2xl flex items-center justify-center shadow-lg"><Plus size={32} /></div>
                                <div><h2 className="text-2xl font-black uppercase tracking-tight">Vincular Canal</h2><p className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest">Integración Omnicanal</p></div>
                            </div>
                            <button onClick={() => { onClose(); setStep('select'); }} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all relative z-10"><X size={20}/></button>
                        </div>
                        <div className="p-10 space-y-8 bg-white">
                            {step === 'select' ? (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {['MercadoLibre', 'Shopify', 'Amazon', 'Falabella'].map((m, i) => (
                                            <div key={i} className="p-6 rounded-[2rem] bg-gray-50 border-2 border-transparent hover:border-cyan-400 hover:bg-white transition-all cursor-pointer text-center group">
                                                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🌐</div>
                                                <p className="text-[9px] font-black uppercase text-gray-500 group-hover:text-black">{m}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-gray-100 pt-8 text-center">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">¿Plataforma nueva o personalizada?</p>
                                        <button onClick={() => setStep('manual')} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">
                                            <Settings2 size={16} className="text-[#00f2ff]" /> Conexión Manual (API)
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre de la Tienda</label><input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" placeholder="Ej: Mi Tienda Virtual" /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">URL del Endpoint / API</label><input type="url" required value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" placeholder="https://api.tutienda.com" /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Token de Acceso</label><input type="password" required value={formData.token} onChange={e => setFormData({...formData, token: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" placeholder="••••••••••••" /></div>
                                    </div>
                                    <div className="flex gap-4 pt-4"><button type="button" onClick={() => setStep('select')} className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase text-gray-400">Volver</button><button type="submit" className="flex-[2] py-5 bg-[#004d4d] text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-2xl">Conectar Ahora</button></div>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

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
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'resumen' | 'catalogos' | 'bayt'>('resumen');
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [selectedKPI, setSelectedKPI] = useState<any>(null);
    const [selectedMarketplaceDetail, setSelectedMarketplaceDetail] = useState<any>(null);
    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    
    const [mappingMode, setMappingMode] = useState<'products' | 'categories'>('products');
    const [selectedMarketplace, setSelectedMarketplace] = useState(CONNECTED_MARKETPLACES[0]);
    const [mappingProducts, setMappingProducts] = useState([
        { id: 'p1', name: 'Reloj Cronógrafo Gold', sku: 'WA-GOLD', category: 'Accesorios', stock: 45, active: true },
        { id: 'p2', name: 'Zapatos Oxford', sku: 'SH-OXFORD', category: 'Calzado', stock: 12, active: true },
        { id: 'p3', name: 'Camisa Lino', sku: 'CL-LINO', category: 'Ropa', stock: 88, active: false },
        { id: 'p4', name: 'Gafas Aviador', sku: 'GL-AVIA', category: 'Accesorios', stock: 5, active: true },
    ]);

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 2000);
    };

    const handleManualConnection = (data: any) => {
        setIsSyncing(true);
        setTimeout(() => {
            setIsSyncing(false);
            setIsConnectModalOpen(false);
            alert(`Conexión establecida con ${data.name} 🚀`);
        }, 2000);
    };

    const toggleProductMapping = (id: string) => {
        setMappingProducts(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
    };

    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
            {[
                { label: 'Canales Activos', value: '04', sub: 'Sincronizados', icon: <Globe size={20}/>, color: 'text-[#004d4d]', bg: 'bg-[#004d4d]/5' },
                { label: 'Ventas Hoy', value: '$ 2.5M', sub: 'Omnicanal', icon: <Zap size={20}/>, color: 'text-[#008080]', bg: 'bg-cyan-50' },
                { label: 'Pedidos Pend.', value: '23', sub: 'Por procesar', icon: <ShoppingCart size={20}/>, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Alertas', value: '01', sub: 'Atención', icon: <AlertTriangle size={20}/>, color: 'text-rose-600', bg: 'bg-rose-50' },
            ].map((kpi, i) => (
                <TiltCard key={i} className="h-full">
                    <div onClick={() => setSelectedKPI(kpi)} className="bg-white/95 p-8 rounded-[2.5rem] border border-white shadow-xl flex flex-col justify-between h-full group transition-all cursor-pointer">
                        <div className="flex justify-between items-start">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${kpi.bg} ${kpi.color} shadow-inner group-hover:scale-110 transition-transform`}>{kpi.icon}</div>
                            <span className="text-[10px] font-black px-3 py-1 bg-gray-50 text-gray-400 rounded-lg uppercase tracking-widest">Live</span>
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

    const renderResumen = () => (
        <div className="px-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 pb-10">
            {CONNECTED_MARKETPLACES.map((m) => (
                <TiltCard key={m.id} className="h-full">
                    <div 
                        onClick={() => setSelectedMarketplaceDetail(m)}
                        className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl relative group overflow-hidden h-full flex flex-col justify-between cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 grayscale group-hover:grayscale-0 transition-all text-6xl">{m.logo}</div>
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <div className="h-16 w-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform border border-gray-100">{m.logo}</div>
                                <div className={`h-3 w-3 rounded-full ${m.status === 'connected' ? 'bg-emerald-500 shadow-[0_0_10px_#10B981]' : 'bg-amber-500'}`}></div>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight group-hover:text-[#004d4d] transition-colors">{m.name}</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">{m.country}</p>
                            </div>
                        </div>
                        <div className="mt-8 pt-8 border-t border-gray-50 grid grid-cols-2 gap-4">
                            <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ventas</p><p className="text-lg font-black text-[#004d4d]">${(m.sales_today/1000).toFixed(0)}k</p></div>
                            <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sincro</p><p className="text-sm font-bold text-gray-500">{m.last_sync}</p></div>
                        </div>
                        <div className="mt-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-500">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedMarketplaceDetail(m); }}
                                className="flex-1 py-3 bg-[#004d4d] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all"
                            >
                                Detalles
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); router.push('/dashboard/settings/general'); }}
                                className="h-10 w-10 bg-gray-100 flex items-center justify-center rounded-xl text-gray-400 hover:text-[#004d4d]"
                            >
                                <Settings2 size={16}/>
                            </button>
                        </div>
                    </div>
                </TiltCard>
            ))}
            <TiltCard className="h-full min-h-[350px]">
                <div onClick={() => setIsConnectModalOpen(true)} className="bg-gray-50 p-10 rounded-[3rem] border-2 border-dashed border-gray-200 hover:border-[#00f2ff] hover:bg-[#00f2ff]/5 transition-all cursor-pointer h-full flex flex-col items-center justify-center text-center gap-6 group">
                    <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-gray-300 group-hover:bg-[#004d4d] group-hover:text-white transition-all shadow-xl"><Plus size={32} /></div>
                    <div><h3 className="text-xl font-black text-gray-400 group-hover:text-[#004d4d] transition-colors">Vincular Canal</h3><p className="text-[10px] font-bold text-gray-300 mt-2 uppercase tracking-widest">Nueva Integración Manual</p></div>
                </div>
            </TiltCard>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-1000 relative">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2"><span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span><span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Omnicanalidad</span></div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">Multi <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00f2ff] px-2 py-1">Venta</span></h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">Gestiona todos tus canales de venta desde un <span className="font-bold text-[#001A1A]">único lugar</span>.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={handleSync} disabled={isSyncing} className="h-14 px-8 bg-white border border-gray-100 text-[#004d4d] rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-lg flex items-center gap-3 transition-all"><RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''}/> {isSyncing ? 'Sincronizando...' : 'Forzar Sincro'}</button>
                    <button onClick={() => setIsConnectModalOpen(true)} className="h-14 px-8 bg-[#004d4d] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 hover:scale-105 transition-all"><Plus size={18} className="text-[#00f2ff]"/> Vincular Canal</button>
                </div>
            </div>

            {renderKPIs()}

            <div className="flex items-center justify-center gap-6 shrink-0 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 backdrop-blur-xl flex items-center relative">
                    {[ { id: 'resumen', label: 'Resumen', icon: <LayoutGrid size={14}/> }, { id: 'catalogos', label: 'Catálogos', icon: <Layers size={14}/> }, { id: 'bayt', label: 'Bayt Insight', icon: <Zap size={14}/> } ].map((tab) => {
                        const isActiveTab = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 flex items-center gap-2 ${isActiveTab ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}>
                                {isActiveTab && <motion.div layoutId="activeMultiTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                                {tab.icon} {tab.label}
                            </button>
                        );
                    })}
                </div>
                <button onClick={() => setShowInfoModal(true)} className="h-12 w-12 rounded-full bg-white border border-gray-100 text-[#004d4d] flex items-center justify-center hover:scale-110 hover:bg-[#004d4d] hover:text-white transition-all shadow-xl active:scale-95 group"><Info size={20} /></button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="space-y-10">
                    {activeTab === 'resumen' && renderResumen()}
                    {activeTab === 'catalogos' && (
                        <div className="px-4 pb-10">
                            <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl flex flex-col lg:flex-row gap-10">
                                <div className="lg:w-1/3 space-y-8">
                                    <div className="bg-[#004d4d] p-8 rounded-[2.5rem] text-white relative overflow-hidden">
                                        <div className="absolute -right-6 -bottom-6 opacity-10"><Layers size={120} /></div>
                                        <h3 className="text-2xl font-black uppercase italic tracking-tight relative z-10">Configurar <br/>Catálogos</h3>
                                        <p className="text-[10px] font-bold text-[#00f2ff] uppercase tracking-widest mt-2 relative z-10">Controla qué vendes dónde</p>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Selecciona Canal</p>
                                        {CONNECTED_MARKETPLACES.map(m => (
                                            <button key={m.id} onClick={() => setSelectedMarketplace(m)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all group ${selectedMarketplace.id === m.id ? 'bg-white border-[#004d4d] shadow-lg scale-105' : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200'}`}>
                                                <div className="flex items-center gap-4"><span className="text-2xl grayscale group-hover:grayscale-0 transition-all">{m.logo}</span><span className={`text-xs font-black uppercase tracking-widest ${selectedMarketplace.id === m.id ? 'text-[#004d4d]' : 'text-gray-500'}`}>{m.name}</span></div>
                                                {selectedMarketplace.id === m.id && <div className="h-2 w-2 rounded-full bg-[#00f2ff] shadow-[0_0_10px_#00f2ff]"></div>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-1 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 p-8 flex flex-col">
                                    <div className="flex justify-between items-center mb-8">
                                        <div><h4 className="text-xl font-black text-gray-900">Productos en {selectedMarketplace.name}</h4><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestionando {mappingProducts.length} items</p></div>
                                        <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100"><button onClick={() => setMappingMode('products')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mappingMode === 'products' ? 'bg-[#004d4d] text-white' : 'text-gray-400 hover:text-gray-900'}`}>Individual</button><button onClick={() => setMappingMode('categories')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mappingMode === 'categories' ? 'bg-[#004d4d] text-white' : 'text-gray-400 hover:text-gray-900'}`}>Por Categoría</button></div>
                                    </div>
                                    <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                                        {mappingProducts.map((p) => (
                                            <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                                                <div className="flex items-center gap-4"><div className={`h-10 w-10 rounded-xl flex items-center justify-center ${p.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}><Tag size={18} /></div><div><p className="text-xs font-black text-gray-900">{p.name}</p><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{p.sku} • {p.category}</p></div></div>
                                                <div className="flex items-center gap-6"><div className="text-right"><p className="text-[9px] font-black text-gray-400 uppercase">Stock</p><p className="text-xs font-black text-[#004d4d]">{p.stock}</p></div><button onClick={() => toggleProductMapping(p.id)} className={`h-8 w-14 rounded-full relative transition-all duration-300 px-1 ${p.active ? 'bg-[#004d4d]' : 'bg-gray-200'}`}><div className={`h-6 w-6 bg-white rounded-full shadow-md transition-all ${p.active ? 'translate-x-6' : 'translate-x-0'}`}></div></button></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'bayt' && (
                        <div className="px-4"><div className="bg-[#004d4d] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5"><div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Activity size={300} /></div><div className="flex flex-col md:flex-row items-center gap-16 relative z-10"><div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center animate-pulse"><Zap size={64} className="text-[#00f2ff]" /></div><div className="flex-1 space-y-6"><span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#00f2ff]/20">Omnichannel Intelligence</span><h3 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2ff]">Optimización de Canales</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10"><p className="text-sm font-medium italic leading-relaxed">"Detecto que el producto **Reloj Gold** tiene alta demanda en MercadoLibre pero bajo stock. Sugiero mover 20 unidades del inventario web para evitar rotura de stock."</p></div><div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10"><p className="text-sm font-medium italic leading-relaxed">"Tus ventas en **Shopify** han crecido un 15% esta semana. Es el momento ideal para activar una campaña de Ads dirigida a ese tráfico."</p></div></div></div></div></div></div>
                    )}
                </motion.div>
            </AnimatePresence>

            <ConnectChannelModal isOpen={isConnectModalOpen} onClose={() => setIsConnectModalOpen(false)} onSync={handleManualConnection} />
            <MultiventaGuideModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
            <MultiventaMetricModal isOpen={!!selectedKPI} onClose={() => setSelectedKPI(null)} metric={selectedKPI} />
            <MarketplaceDetailModal isOpen={!!selectedMarketplaceDetail} onClose={() => setSelectedMarketplaceDetail(null)} marketplace={selectedMarketplaceDetail} />

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
            `}</style>
        </div>
    );
}
