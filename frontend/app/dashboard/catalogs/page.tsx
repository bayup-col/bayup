"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Globe, 
  Plus, 
  Settings2, 
  Eye, 
  BarChart3, 
  Calendar, 
  Clock, 
  Trash2, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Layout, 
  Image as ImageIcon, 
  ShoppingBag,
  Send,
  Link as LinkIcon,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Users
} from 'lucide-react';

// --- MOCK DATA ---
interface Product {
    id: string;
    name: string;
    price_retail: number;
    price_wholesale: number;
    has_wholesale: boolean;
    stock: number;
    image_url: string;
    category: string;
}

const MOCK_PRODUCTS: Product[] = [
    { id: "1", name: "Reloj Cronógrafo Gold", price_retail: 2500, price_wholesale: 1800, has_wholesale: true, stock: 45, image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200&auto=format&fit=crop', category: "Accesorios" },
    { id: "2", name: "Gafas Aviador Silver", price_retail: 1200, price_wholesale: 900, has_wholesale: true, stock: 12, image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=200&auto=format&fit=crop', category: "Accesorios" },
    { id: "3", name: "Camiseta Básica Tech", price_retail: 350, price_wholesale: 220, has_wholesale: true, stock: 150, image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=200&auto=format&fit=crop', category: "Ropa" },
    { id: "4", name: "Billetera Slim Cuero", price_retail: 180, price_wholesale: 130, has_wholesale: false, stock: 8, image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=200&auto=format&fit=crop', category: "Accesorios" },
];

interface Catalog {
    id: string;
    name: string;
    status: 'draft' | 'scheduled' | 'sent';
    product_count: number;
    type: 'whatsapp' | 'hybrid';
    last_modified: string;
    sent_date?: string;
}

const INITIAL_CATALOGS: Catalog[] = [
  { id: 'cat_1', name: 'Lanzamiento Invierno 2026', status: 'sent', product_count: 12, type: 'hybrid', last_modified: 'Hoy, 09:00 AM', sent_date: '01 Feb 2026' },
  { id: 'cat_2', name: 'Promoción Mayorista Accesorios', status: 'scheduled', product_count: 8, type: 'hybrid', last_modified: 'Hace 2 horas' },
  { id: 'cat_3', name: 'Borrador Campaña Redes', status: 'draft', product_count: 5, type: 'whatsapp', last_modified: 'Ayer' },
];

export default function CatalogsPage() {
    const [view, setView] = useState<'list' | 'create' | 'web-editor'>('list');
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'scheduled'>('all');
    const [step, setStep] = useState(1);
    const [isWholesaleActive, setIsWholesaleActive] = useState(false);
    const [catalogName, setCatalogName] = useState("");
    const [welcomeMsg, setWelcomeMsg] = useState("🔥 ¡Mira lo nuevo que llegó a nuestra tienda! 🔥");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const toggleProduct = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-10 animate-in fade-in duration-700">
            {/* --- HEADER --- */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_10px_#10B981]"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Omnicanalidad & Ventas</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] pr-2 py-1">Catálogos WhatsApp</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed">
                        Convierte tus chats en pedidos organizados y automatizados con <span className="font-bold text-[#001A1A]">experiencia mayorista</span>.
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setView('web-editor')}
                        className="flex items-center gap-3 px-8 py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-purple-600 hover:border-purple-200 transition-all shadow-sm"
                    >
                        <Globe size={16} className="text-purple-600" />
                        Web Mayorista
                    </button>
                    <button 
                        onClick={() => { setView('create'); setStep(1); }}
                        className="group relative px-8 py-5 bg-[#004d4d] text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-[#004d4d]/20 hover:scale-[1.02] active:scale-95 transition-all overflow-hidden"
                    >
                        <span className="flex items-center gap-3 relative z-10">
                            <Plus size={16} className="text-[#00f2ff]" />
                            Crear Catálogo
                        </span>
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {view === 'list' ? (
                    <motion.div 
                        key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="space-y-12"
                    >
                        {/* --- DASHBOARD METRICS --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Catálogos Activos', value: '14', sub: 'Enviados este mes', icon: <MessageSquare size={18} />, color: 'bg-emerald-50 text-emerald-600' },
                                { label: 'Pedidos Recibidos', value: '128', sub: 'Desde catálogos', icon: <ShoppingBag size={18} />, color: 'bg-purple-50 text-purple-600' },
                                { label: 'Ventas Generadas', value: '$ 12.5M', sub: 'Conversión directa', icon: <TrendingUp size={18} />, color: 'bg-emerald-50 text-emerald-600' },
                                { label: 'Clientes Mayoristas', value: '45', sub: 'Accesos web activa', icon: <Users size={18} />, color: 'bg-purple-50 text-purple-600' },
                            ].map((kpi, i) => (
                                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                                        <p className="text-3xl font-black text-gray-900 mt-2">{kpi.value}</p>
                                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase italic">{kpi.sub}</p>
                                    </div>
                                    <div className={`h-14 w-14 rounded-2xl ${kpi.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                                        {kpi.icon}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* --- FLOATING FILTER MENU --- */}
                        <div className="flex justify-center pt-4">
                            <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 flex items-center relative z-10">
                                {[
                                    { id: 'all', label: 'Todos' },
                                    { id: 'draft', label: 'Catálogos' },
                                    { id: 'enviados', label: 'Enviados' },
                                    { id: 'scheduled', label: 'Programados' }
                                ].map((tab) => {
                                    const isActive = statusFilter === (tab.id === 'enviados' ? 'sent' : tab.id);
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setStatusFilter(tab.id === 'enviados' ? 'sent' : tab.id as any)}
                                            className={`relative px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 z-10 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeTab"
                                                    className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg shadow-[#004D4D]/20 -z-10"
                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                />
                                            )}
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* --- CATALOG LIST --- */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-4">
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Registro Operativo</h2>
                                <div className="flex gap-2">
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input type="text" placeholder="Buscar catálogo..." className="pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-purple-200 w-48 transition-all" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                                {INITIAL_CATALOGS
                                    .filter(cat => statusFilter === 'all' || cat.status === statusFilter)
                                    .map((cat) => (
                                    <div key={cat.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_40px_rgba(147,51,234,0.05)] transition-all group flex items-center justify-between">
                                        <div className="flex items-center gap-8 flex-1">
                                            <div className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center text-2xl shadow-inner ${cat.type === 'hybrid' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {cat.type === 'hybrid' ? <Globe size={24} /> : <MessageSquare size={24} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-black text-gray-900 tracking-tight">{cat.name}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                        cat.status === 'sent' ? 'bg-emerald-50 text-emerald-600' : cat.status === 'scheduled' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'
                                                    }`}>
                                                        {cat.status}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 flex items-center gap-2">
                                                    <Clock size={12} /> Editado {cat.last_modified} • <ShoppingBag size={12} /> {cat.product_count} Productos
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-12">
                                            <div className="hidden lg:block text-right">
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Canal</p>
                                                <p className="text-xs font-bold text-[#004d4d] mt-1">{cat.type === 'hybrid' ? 'WA + Web Mayorista' : 'Solo WhatsApp'}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all shadow-inner"><Eye size={18} /></button>
                                                <button className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all shadow-inner"><BarChart3 size={18} /></button>
                                                <button className="px-6 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 transition-all">Ver Pedidos</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : view === 'create' ? (
                    <motion.div 
                        key="create" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-10"
                    >
                        {/* --- WIZARD LEFT SIDE --- */}
                        <div className="lg:col-span-7 space-y-8">
                            <div className="bg-white/80 backdrop-blur-md p-10 rounded-[3rem] border border-white shadow-xl shadow-gray-200/20 space-y-10">
                                {/* STEPS */}
                                <div className="flex items-center justify-between">
                                    {[1, 2, 3].map(s => (
                                        <div key={s} className="flex flex-col items-center gap-2">
                                            <div className={`h-1.5 w-24 rounded-full transition-all duration-500 ${step >= s ? 'bg-purple-600' : 'bg-gray-100'}`}></div>
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${step >= s ? 'text-purple-600' : 'text-gray-300'}`}>Paso {s}</span>
                                        </div>
                                    ))}
                                </div>

                                <AnimatePresence mode="wait">
                                    {step === 1 && (
                                        <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                            <div>
                                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Configuración del Catálogo</h3>
                                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Define el mensaje y la estrategia de venta</p>
                                            </div>
                                            
                                            <div className="space-y-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre interno</label>
                                                    <input type="text" placeholder="Ej: Nueva Colección 2026" value={catalogName} onChange={(e) => setCatalogName(e.target.value)} className="w-full p-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-purple-200 text-sm font-bold transition-all shadow-inner" />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mensaje de Bienvenida</label>
                                                    <textarea rows={3} placeholder="¡Hola! Te comparto nuestros nuevos productos..." value={welcomeMsg} onChange={(e) => setWelcomeMsg(e.target.value)} className="w-full p-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-purple-200 text-sm font-bold transition-all shadow-inner resize-none" />
                                                </div>
                                                
                                                <div className="p-8 bg-purple-50 rounded-[2rem] border border-purple-100 flex items-center justify-between group">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${isWholesaleActive ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-purple-300'}`}>
                                                            <Globe size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-purple-900 uppercase tracking-widest">Compartir Catálogo Completo</p>
                                                            <p className="text-[10px] text-purple-400 font-bold uppercase mt-0.5 tracking-tighter italic">Habilitar acceso a Web Mayorista privada</p>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => setIsWholesaleActive(!isWholesaleActive)}
                                                        className={`h-7 w-12 rounded-full relative transition-all duration-300 flex items-center px-1 ${isWholesaleActive ? 'bg-purple-600' : 'bg-gray-200'}`}
                                                    >
                                                        <div className={`h-5 w-5 bg-white rounded-full shadow-md transition-all ${isWholesaleActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                                    </button>
                                                </div>

                                                <AnimatePresence>
                                                    {isWholesaleActive && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden">
                                                            <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest ml-1 italic">✨ Texto invitación Web Mayorista</label>
                                                            <input type="text" defaultValue="✨ Encuentra nuestro catálogo completo, solo para ti" className="w-full p-5 bg-purple-600/5 border border-purple-200 rounded-2xl outline-none text-sm font-bold text-purple-900 shadow-sm" />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 2 && (
                                        <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Selección de Productos</h3>
                                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2 italic">{selectedIds.length} ítems seleccionados</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                                        <input type="text" placeholder="Buscar..." className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-purple-200 w-40" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar p-1">
                                                {MOCK_PRODUCTS.map(p => (
                                                    <div key={p.id} onClick={() => toggleProduct(p.id)} className={`group relative p-4 rounded-[2rem] border transition-all cursor-pointer ${selectedIds.includes(p.id) ? 'border-purple-600 bg-purple-50/50 shadow-lg shadow-purple-100/50 scale-[1.02]' : 'border-gray-50 bg-gray-50/50 hover:bg-white hover:border-gray-200'}`}>
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-20 w-20 rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-inner">
                                                                <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-black text-gray-900 truncate tracking-tight">{p.name}</p>
                                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">{p.category}</p>
                                                                <div className="flex items-center gap-3 mt-2">
                                                                    <div className={`h-2 w-2 rounded-full ${p.has_wholesale ? 'bg-purple-600 shadow-[0_0_8px_rgba(147,51,234,0.4)]' : 'bg-gray-300'}`}></div>
                                                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">
                                                                        {p.has_wholesale ? 'Precio Mayorista Activo' : 'Sin Precio Mayorista'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {selectedIds.includes(p.id) && (
                                                            <div className="absolute top-4 right-4 h-6 w-6 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg">
                                                                <CheckCircle2 size={14} />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 3 && (
                                        <motion.div key="s3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-12 text-center py-10">
                                            <div className="h-32 w-32 bg-purple-50 rounded-[3rem] flex items-center justify-center mx-auto text-purple-600 shadow-xl shadow-purple-50">
                                                <Send size={60} />
                                            </div>
                                            <div className="space-y-4">
                                                <h3 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">¡Catálogo Listo!</h3>
                                                <p className="text-gray-500 text-lg font-medium leading-relaxed max-w-lg mx-auto italic">
                                                    Tu catálogo ha sido generado con <span className="text-purple-600 font-black">{selectedIds.length} productos</span> {isWholesaleActive ? 'y acceso exclusivo a la Web Mayorista.' : '.'}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <button className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 hover:bg-white hover:border-purple-200 transition-all group flex flex-col items-center gap-3">
                                                    <Clock className="text-gray-300 group-hover:text-purple-600" size={32} />
                                                    <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-gray-900 tracking-widest">Programar</span>
                                                </button>
                                                <button className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 hover:bg-white hover:border-purple-200 transition-all group flex flex-col items-center gap-3">
                                                    <AlertCircle className="text-gray-300 group-hover:text-amber-500" size={32} />
                                                    <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-gray-900 tracking-widest">Guardar Borrador</span>
                                                </button>
                                                <button className="p-8 bg-[#25D366] rounded-[2.5rem] shadow-2xl shadow-emerald-200 group flex flex-col items-center gap-3 hover:scale-105 transition-all">
                                                    <Send className="text-white" size={32} />
                                                    <span className="text-[10px] font-black uppercase text-white tracking-widest">Enviar Ahora</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* NAVIGATION BUTTONS */}
                                {step < 3 && (
                                    <div className="pt-10 flex justify-between items-center border-t border-gray-50">
                                        <button 
                                            onClick={() => step === 1 ? setView('list') : setStep(prev => prev - 1)}
                                            className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-gray-900 transition-all"
                                        >
                                            {step === 1 ? 'Cancelar' : 'Volver'}
                                        </button>
                                        <button 
                                            onClick={() => setStep(prev => prev + 1)}
                                            disabled={step === 2 && selectedIds.length === 0}
                                            className={`px-12 py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center gap-3 ${
                                                step === 2 && selectedIds.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#004d4d] text-white shadow-xl shadow-[#004d4d]/20 hover:scale-105'
                                            }`}
                                        >
                                            Siguiente Paso <ChevronRight size={16} className="text-[#00f2ff]" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* --- PREVIEW RIGHT SIDE --- */}
                        <div className="lg:col-span-5 relative">
                            <div className="sticky top-8">
                                <div className="bg-[#E5DDD5] rounded-[3.5rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.15)] border-[12px] border-gray-900 min-h-[750px] flex flex-col">
                                    <div className="bg-[#075E54] p-6 text-white flex items-center gap-4 shadow-lg relative z-10">
                                        <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center text-xl backdrop-blur-md">👤</div>
                                        <div>
                                            <p className="text-base font-black tracking-tight tracking-widest">Vista Previa WhatsApp</p>
                                            <div className="flex items-center gap-1.5 opacity-70">
                                                <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest">En línea</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar" style={{backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")'}}>
                                        {selectedIds.length > 0 ? (
                                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                                <div className="bg-white p-5 rounded-2xl rounded-tl-none shadow-md max-w-[85%] border-l-4 border-emerald-500 relative">
                                                    <p className="text-[13px] font-black text-emerald-700 uppercase tracking-widest mb-2 italic">*{catalogName || 'Nuevo Catálogo'}*</p>
                                                    <p className="text-[12px] font-medium text-gray-800 leading-relaxed">{welcomeMsg}</p>
                                                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                                        <LinkIcon size={12} /> Ver productos seleccionados...
                                                    </div>
                                                </div>

                                                {isWholesaleActive && (
                                                    <div className="bg-[#dcf8c6] p-5 rounded-2xl rounded-tl-none shadow-md max-w-[85%] border-l-4 border-emerald-600 relative ml-0">
                                                        <div className="flex items-start gap-3">
                                                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                                                                <Globe size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[12px] font-black text-emerald-900 leading-tight">Web Mayorista</p>
                                                                <p className="text-[11px] font-bold text-emerald-700/80 mt-1 italic">✨ Encuentra nuestro catálogo completo, solo para ti</p>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 p-3 bg-white/40 rounded-xl border border-emerald-100 text-center">
                                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Acceder Ahora →</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-center px-10 gap-6">
                                                <div className="h-20 w-20 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
                                                    <MessageSquare size={32} />
                                                </div>
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-relaxed italic italic">Selecciona productos para visualizar el mensaje masivo</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="web-editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                        {/* --- WEB MAYORISTA EDITOR --- */}
                        <div className="flex items-center gap-4">
                            <button onClick={() => setView('list')} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900">← Volver al hub</button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Editor Panel */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm space-y-10">
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                        <Settings2 size={20} className="text-purple-600" /> Editor Web Mayorista
                                    </h2>

                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><ImageIcon size={14} /> Banner Publicitario</p>
                                            <div className="h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white hover:border-purple-200 transition-all">
                                                <Plus size={20} className="text-gray-300" />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subir Imagen (1200x400)</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Layout size={14} /> Gestión de Categorías</p>
                                            <div className="space-y-2">
                                                {['Ropa', 'Calzado', 'Accesorios'].map(cat => (
                                                    <div key={cat} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                        <span className="text-xs font-bold text-gray-700">{cat}</span>
                                                        <div className="h-4 w-8 bg-purple-600 rounded-full flex items-center px-1"><div className="h-2.5 w-2.5 bg-white rounded-full translate-x-4"></div></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-6 bg-purple-600 text-white rounded-2xl shadow-xl shadow-purple-100 space-y-4">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                                <CreditCard size={14} /> Política de Precios
                                            </div>
                                            <p className="text-xs font-medium leading-relaxed italic">"Solo los productos con Precio Mayorista activo serán visibles en esta plataforma."</p>
                                            <button className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Configurar Márgenes</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview (Mini Web) */}
                            <div className="lg:col-span-8 bg-gray-100 rounded-[4rem] p-10 shadow-inner min-h-[800px] border-[10px] border-white relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-emerald-400"></div>
                                <div className="bg-white p-10 rounded-[3rem] shadow-sm space-y-12 min-h-full">
                                    {/* Web Header */}
                                    <div className="flex justify-between items-center border-b border-gray-50 pb-8">
                                        <div className="h-10 w-32 bg-gray-100 rounded-lg animate-pulse"></div>
                                        <div className="flex items-center gap-6">
                                            <div className="h-8 w-8 bg-gray-50 rounded-full"></div>
                                            <div className="h-10 w-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg"><ShoppingBag size={18} /></div>
                                        </div>
                                    </div>

                                    <div className="space-y-10">
                                        <div className="bg-purple-50 p-12 rounded-[2.5rem] border border-purple-100 relative overflow-hidden">
                                            <div className="relative z-10">
                                                <span className="bg-purple-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Oferta Especial</span>
                                                <h3 className="text-3xl font-black text-purple-900 tracking-tight mt-4">Precios Mayoristas Activos</h3>
                                                <p className="text-purple-400 text-sm font-medium mt-2 italic">Aprovecha descuentos de hasta el 35% en compras por volumen.</p>
                                            </div>
                                            <div className="absolute right-0 bottom-0 p-10 opacity-10 text-9xl font-black text-purple-600">SALE</div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {MOCK_PRODUCTS.filter(p => p.has_wholesale).map(p => (
                                                <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-[0_4px_15px_rgba(0,0,0,0.02)] flex items-center gap-6 group hover:border-purple-200 transition-all">
                                                    <div className="h-24 w-24 rounded-[1.8rem] bg-gray-50 overflow-hidden shadow-inner">
                                                        <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-black text-gray-900 tracking-tight truncate">{p.name}</p>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <p className="text-xs font-black text-purple-600">${p.price_wholesale}</p>
                                                            <p className="text-[10px] text-gray-300 font-bold line-through">${p.price_retail}</p>
                                                        </div>
                                                        <button className="mt-4 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-purple-600 transition-all">Añadir al pedido</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- OMNICHANNEL FOOTER --- */}
            <div className="relative p-12 bg-white rounded-[4rem] border border-gray-100 overflow-hidden shadow-2xl shadow-gray-200/20 group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                    <MessageSquare size={180} className="text-purple-600" />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                    <div className="h-28 w-28 bg-purple-600 rounded-[2.5rem] flex items-center justify-center text-5xl shadow-[0_0_50px_rgba(147,51,234,0.3)] animate-pulse">
                        <TrendingUp size={48} className="text-white" />
                    </div>
                    
                    <div className="flex-1 text-center lg:text-left">
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-tight uppercase tracking-widest italic">Venta Híbrida Inteligente</h3>
                        <p className="text-gray-500 text-lg mt-4 max-w-3xl leading-relaxed font-medium">
                            No solo envíes mensajes. Ofrece una <span className="text-purple-600 font-bold italic">experiencia de compra premium</span> a tus clientes mayoristas con una mini-web privada integrada a tu inventario.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 min-w-[240px]">
                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ticket Promedio Mayorista</p>
                            <p className="text-2xl font-black text-purple-600">+42%</p>
                        </div>
                        <button className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-purple-600 transition-all">
                            Configurar Web Mayorista
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}