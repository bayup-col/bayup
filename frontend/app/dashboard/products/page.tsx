"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { InteractiveUP } from '@/components/landing/InteractiveUP';
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  TrendingUp, 
  AlertCircle, 
  Layers, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreHorizontal,
  Edit3,
  Trash2,
  ChevronRight,
  Archive,
  Eye,
  CheckCircle2,
  Clock,
  Box,
  Image as ImageIcon,
  DollarSign,
  BarChart3,
  X,
  Upload,
  Info,
  ChevronDown,
  Trophy,
  ShoppingBag
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

// --- COMPONENTE DE NÚMEROS ANIMADOS (Coherencia con Facturación) ---
function AnimatedNumber({ value, className, type = 'currency' }: { value: number, className?: string, type?: 'currency' | 'percentage' | 'simple' }) {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current: number) => {
        if (type === 'percentage') return `${Math.round(current)}%`;
        if (type === 'simple') return Math.round(current).toLocaleString();
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(current).replace('$', '$ ');
    });

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    return <motion.span className={className}>{display}</motion.span>;
}

// --- KPI CARD (Estilo Facturación con 3D Tilt) ---
const KPICard = ({ title, value, trendValue, icon: Icon, iconColor = "text-[#004D4D]", iconBg = "bg-[#004D4D]/5", valueClassName = "text-gray-900", isCurrency = true }: any) => {
    const isUp = trendValue >= 0;
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
    };

    return (
        <motion.div onMouseMove={handleMouseMove} onMouseLeave={() => {x.set(0); y.set(0);}} style={{ rotateY, rotateX, transformStyle: "preserve-3d" }} className="relative h-full">
            <div style={{ transform: "translateZ(50px)", transformStyle: "preserve-3d" }} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between h-full group hover:shadow-2xl hover:shadow-[#004D4D]/10 transition-shadow duration-500">
                <div style={{ transform: "translateZ(30px)" }} className="flex justify-between items-start mb-6">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${iconBg} ${iconColor}`}>
                        <Icon size={24} />
                    </div>
                    {trendValue !== undefined && (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            <span className="text-[10px] font-black">{isUp ? '+' : ''}{trendValue}%</span>
                        </div>
                    )}
                </div>
                <div style={{ transform: "translateZ(20px)" }}>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">{title}</p>
                    <h3 className={`text-3xl font-black tracking-tighter ${valueClassName}`}>
                        {isCurrency ? (typeof value === 'number' ? <AnimatedNumber value={value} /> : value) : value.toLocaleString()}
                    </h3>
                </div>
            </div>
        </motion.div>
    );
};

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string | null;
    variants: any[];
    status?: 'active' | 'draft' | 'archived';
    category?: string;
    collection_id?: string | null;
}

export default function ProductsPage() {
    const { token, userEmail } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
    
    // Guía de Maestría (Nuevo)
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [activeGuideTab, setActiveGuideTab] = useState('all');

    const guideContent = {
        all: {
            title: 'Catálogo Maestro',
            icon: <Package size={20}/>,
            color: 'text-[#004D4D]',
            howItWorks: 'Visualiza el 100% de tus activos comerciales, incluyendo productos listos para la venta, borradores y artículos archivados.',
            example: 'Úsalo para tener una perspectiva global de tu capacidad de oferta y diversidad de categorías.',
            tip: 'Mantén un SKU maestro coherente para facilitar la búsqueda rápida desde el módulo de Facturación POS.'
        },
        active: {
            title: 'Productos Activos',
            icon: <Zap size={20}/>,
            color: 'text-emerald-600',
            howItWorks: 'Artículos que están actualmente publicados y visibles en todos tus canales de venta (Tienda Web, WhatsApp, etc.).',
            example: 'Si un producto aparece aquí, significa que tus clientes pueden comprarlo en este preciso momento.',
            tip: 'Revisa periódicamente el stock de estos productos para evitar ventas fallidas por falta de existencias.'
        },
        draft: {
            title: 'Borradores',
            icon: <Clock size={20}/>,
            color: 'text-amber-600',
            howItWorks: 'Productos en fase de edición o preparación que aún no han sido lanzados al público.',
            example: 'Estás creando una nueva colección de temporada pero aún no tienes las fotos finales; guárdala aquí.',
            tip: 'Utiliza este estado para pre-cargar lanzamientos masivos y activarlos todos a la vez cuando inicie tu campaña.'
        }
    };

    // Filtros Avanzados (Estilo Facturación)
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [advancedFilters, setAdvancedFilters] = useState({ category: 'all', stockStatus: 'all' });

    const fetchProducts = useCallback(async () => {
        if (!token) { setLoading(false); return; }
        setLoading(true);
        try {
            const data = await apiRequest<any[]>('/products', { token });
            if (data && Array.isArray(data)) {
                setProducts(data.map((p: any) => ({ 
                    ...p, 
                    status: p.status || (p.variants?.every((v:any) => v.stock === 0) ? 'archived' : 'active'), 
                    category: p.category || 'General' 
                })));
            }
        } catch (err) {
            console.error("Error fetching products:", err);
            showToast("Error al cargar productos", "error");
        } finally {
            setLoading(false);
        }
    }, [token, showToast]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 p.variants?.some(v => v.sku?.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesTab = activeTab === 'all' || p.status === activeTab;
            
            const matchesCategory = advancedFilters.category === 'all' || p.category === advancedFilters.category;
            
            let matchesStock = true;
            const totalStock = p.variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) || 0;
            if (advancedFilters.stockStatus === 'low') matchesStock = totalStock <= 5 && totalStock > 0;
            if (advancedFilters.stockStatus === 'out') matchesStock = totalStock === 0;

            return matchesSearch && matchesTab && matchesCategory && matchesStock;
        });
    }, [products, searchTerm, activeTab, advancedFilters]);

    const activeCount = products.filter(p => p.status === 'active').length;
    const lowStockCount = products.filter(p => (p.variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) || 0) <= 5).length;
    
    // Cálculos para nuevos KPIs
    const averageTicket = products.length > 0 
        ? products.reduce((acc, p) => acc + p.price, 0) / products.length 
        : 0;
    
    const topProductMonth = products.length > 0 
        ? products.find(p => p.status === 'active')?.name || products[0].name
        : "Sin datos";

    return (
        <div className="relative min-h-[calc(100vh-120px)] bg-[#FAFAFA] overflow-hidden px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto pb-20 space-y-12">
                
                {/* --- HEADER PREMIUM (Estilo Facturación) --- */}
                <motion.div 
                    initial={{ y: -100, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    className="flex flex-col md:flex-row md:items-center justify-between gap-8 mt-4"
                >
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_10px_#10B981]"></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Gestión de Activos</span>
                        </div>
                        <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] pr-2 py-1">Todos los productos</span>
                        </h1>
                        <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed">
                            Catálogo maestro y control de existencias para <span className="font-bold text-[#001A1A]">{userEmail?.split('@')[0] || 'tu empresa'}</span>.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <motion.button 
                            whileHover={{ scale: 1.05, backgroundColor: "#4fffcb", color: "#004D4D" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push('/dashboard/products/new')} 
                            className="px-12 py-6 bg-gray-900 text-white rounded-[2.2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center gap-3 hover:shadow-[#4fffcb]/20"
                        >
                            <Plus size={18} /> Nuevo Producto
                        </motion.button>
                    </div>
                </motion.div>

                {/* --- KPI CARDS (Estilo Facturación) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard title="Total Productos" value={products.length} trendValue={4.2} icon={Package} iconColor="text-[#004D4D]" isCurrency={false} />
                    <KPICard title="Producto del mes" value={topProductMonth} trendValue={12.5} icon={Trophy} iconColor="text-yellow-500" iconBg="bg-yellow-50" isCurrency={false} valueClassName="text-lg leading-tight mt-2" />
                    <KPICard title="Stock Crítico" value={lowStockCount} trendValue={-5.1} icon={AlertCircle} iconColor="text-rose-600" isCurrency={false} />
                    <KPICard title="Ticket Promedio" value={averageTicket} trendValue={8.2} icon={ShoppingBag} iconColor="text-cyan-600" />
                </div>

                {/* --- MENÚ CENTRADO FLOTANTE (NUEVO) --- */}
                <div className="flex justify-center items-center gap-4 pt-4">
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="p-1.5 bg-white border border-slate-200 rounded-full shadow-xl shadow-slate-200/50 flex items-center relative z-10"
                    >
                        {(['all', 'active', 'draft'] as const).map((tab) => {
                            const isActive = activeTab === tab;
                            return (
                                <button 
                                    key={tab} 
                                    onClick={() => setActiveTab(tab)}
                                    className={`relative px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 z-10 ${isActive ? 'text-white' : 'text-slate-500 hover:text-[#004D4D]'}`}
                                >
                                    {isActive && (
                                        <motion.div 
                                            layoutId="productsTab" 
                                            className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" 
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} 
                                        />
                                    )}
                                    {tab === 'all' ? 'Todos los items' : tab === 'active' ? 'Productos Activos' : 'Borradores'}
                                </button>
                            );
                        })}
                    </motion.div>

                    {/* Botón Guía Maestro */}
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsGuideOpen(true)}
                        className="h-12 w-12 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-[#004D4D] hover:bg-[#004D4D] hover:text-white transition-all group shrink-0"
                    >
                        <Info size={20} className="group-hover:animate-pulse"/>
                    </motion.button>
                </div>

                {/* --- BARRA DE BÚSQUEDA Y FILTROS (Estilo Facturación) --- */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_10px_#10B981]"></span>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Listado de Productos</h3>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Buscar por nombre, categoría o SKU..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none"
                            />
                        </div>
                        <div className="h-8 w-px bg-slate-100 hidden md:block"></div>
                        <div className="flex items-center gap-2 relative">
                            <div className="relative">
                                <button 
                                    onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                                    className={`p-3 rounded-xl transition-all flex items-center gap-2 text-xs font-bold uppercase ${isFilterMenuOpen ? 'bg-[#004D4D] text-white shadow-lg' : 'text-slate-500 hover:text-[#004D4D] hover:bg-[#004D4D]/5'}`}
                                >
                                    <Filter size={18}/> Filtros
                                </button>
                                
                                <AnimatePresence>
                                    {isFilterMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsFilterMenuOpen(false)} />
                                            <motion.div 
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                className="absolute top-full mt-2 right-0 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 w-[280px] z-50 overflow-hidden"
                                            >
                                                <div className="flex flex-col">
                                                    {[
                                                        { 
                                                            id: 'stock', 
                                                            label: 'Estado de Stock', 
                                                            icon: <Box size={16}/>, 
                                                            options: [
                                                                { val: 'all', l: 'Todos' }, 
                                                                { val: 'low', l: 'Stock Bajo' }, 
                                                                { val: 'out', l: 'Agotado' }
                                                            ], 
                                                            key: 'stockStatus' 
                                                        }
                                                    ].map((section) => (
                                                        <div key={section.id} className="border-b border-slate-50 last:border-none">
                                                            <button 
                                                                onClick={() => setActiveAccordion(activeAccordion === section.id ? null : section.id)}
                                                                className={`w-full flex items-center justify-between p-4 transition-colors hover:bg-slate-50 ${activeAccordion === section.id ? 'bg-slate-50/50' : ''}`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`p-2 rounded-lg ${activeAccordion === section.id ? 'bg-[#004D4D] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                                        {section.icon}
                                                                    </div>
                                                                    <span className="text-[10px] font-black uppercase tracking-wide text-slate-700">{section.label}</span>
                                                                </div>
                                                                <ChevronRight size={14} className={`text-slate-300 transition-transform ${activeAccordion === section.id ? 'rotate-90' : ''}`}/>
                                                            </button>
                                                            <AnimatePresence>
                                                                {activeAccordion === section.id && (
                                                                    <motion.div 
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        className="overflow-hidden bg-slate-50/30 px-4 pb-4"
                                                                    >
                                                                        <div className="flex flex-wrap gap-2 pt-2">
                                                                            {section.options.map(opt => (
                                                                                <button 
                                                                                    key={opt.val}
                                                                                    onClick={() => setAdvancedFilters({...advancedFilters, [section.key]: opt.val})}
                                                                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase transition-all ${advancedFilters[section.key as keyof typeof advancedFilters] === opt.val ? 'bg-[#004D4D] text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-[#004D4D]'}`}
                                                                                >
                                                                                    {opt.l}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    ))}
                                                    <div className="p-4 bg-slate-50">
                                                        <button 
                                                            onClick={() => { setAdvancedFilters({category: 'all', stockStatus: 'all'}); setIsFilterMenuOpen(false); setActiveAccordion(null); }}
                                                            className="w-full py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase shadow-lg hover:bg-black transition-all"
                                                        >
                                                            Limpiar Filtros
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- TABLA DE PRODUCTOS (Estilo Facturación) --- */}
                <motion.div 
                    initial={{ y: 50, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-50">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-10 py-6 text-left text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em] w-[40%]">Producto</th>
                                    <th className="px-10 py-6 text-center text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em]">Estado</th>
                                    <th className="px-10 py-6 text-center text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em]">Stock Total</th>
                                    <th className="px-10 py-6 text-center text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em]">Categoría</th>
                                    <th className="px-10 py-6 text-right text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em]">Precio</th>
                                    <th className="px-10 py-6 text-right text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em]">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-10 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="relative h-12 w-12">
                                                    <div className="absolute inset-0 animate-ping rounded-full bg-[#00f2ff]/20"></div>
                                                    <div className="relative animate-spin rounded-full h-12 w-12 border-b-2 border-[#004D4D]"></div>
                                                </div>
                                                <span className="text-[10px] font-black text-[#004D4D]/40 uppercase tracking-widest">Sincronizando catálogo...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-10 py-20 text-center text-gray-400">
                                            <Box size={40} className="mx-auto mb-4 opacity-10" />
                                            <p className="text-xs font-black uppercase tracking-widest">No se encontraron productos</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => {
                                        const totalStock = product.variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) || 0;
                                        return (
                                            <tr key={product.id} className="hover:bg-gray-50/50 transition-all group">
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-6">
                                                        <div className="h-16 w-16 flex-shrink-0 bg-white rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-110 transition-transform duration-500">
                                                            {product.image_url ? (
                                                                <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <ImageIcon className="text-gray-200" size={24} />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-gray-900 tracking-tight">{product.name}</div>
                                                            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                                                <Zap size={10} className="text-[#00F2FF]" />
                                                                {product.variants?.length || 0} Variantes <span className="h-1 w-1 rounded-full bg-gray-200"></span> SKU: {product.variants?.[0]?.sku || 'S/N'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    <span className={`inline-flex px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                        product.status === 'active' 
                                                            ? 'bg-[#004D4D] text-white shadow-lg shadow-[#004D4D]/20' 
                                                            : 'bg-gray-100 text-gray-400'
                                                    }`}>
                                                        {product.status === 'active' ? 'Activo' : 'Borrador'}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className={`text-sm font-black ${totalStock <= 5 ? 'text-rose-600' : 'text-gray-900'}`}>{totalStock}</span>
                                                        <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Unidades</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-lg">{product.category}</span>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <span className="text-sm font-black text-[#004D4D]">
                                                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(product.price).replace('$', '$ ')}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
                                                            className="p-2.5 rounded-xl bg-white border border-gray-100 text-[#004D4D]/40 hover:text-[#004D4D] hover:shadow-md transition-all"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => { if(confirm('¿Eliminar producto?')) { /* Logic */ } }}
                                                            className="p-2.5 rounded-xl bg-white border border-gray-100 text-rose-300 hover:text-rose-600 hover:shadow-md transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* --- MODAL MAESTRÍA DE PRODUCTOS (NUEVO) --- */}
                <AnimatePresence>
                    {isGuideOpen && (
                        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setIsGuideOpen(false)}
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
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004D4D]">Maestría de Productos</h3>
                                        <p className="text-[10px] text-slate-400 font-bold mt-1">Guía Operativa Bayup</p>
                                    </div>
                                    {Object.entries(guideContent).map(([key, item]) => (
                                        <button
                                            key={key}
                                            onClick={() => setActiveGuideTab(key)}
                                            className={`flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${activeGuideTab === key ? 'bg-[#004D4D] text-white shadow-lg' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
                                        >
                                            <div className={`${activeGuideTab === key ? 'text-white' : item.color}`}>
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
                                            <div className={`h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center ${guideContent[activeGuideTab as keyof typeof guideContent].color}`}>
                                                {guideContent[activeGuideTab as keyof typeof guideContent].icon}
                                            </div>
                                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                                                {guideContent[activeGuideTab as keyof typeof guideContent].title}
                                            </h2>
                                        </div>
                                        <button onClick={() => setIsGuideOpen(false)} className="h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                                            <X size={20}/>
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                                        <section>
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <div className="h-1 w-4 bg-[#004D4D] rounded-full"></div> ¿Qué significa?
                                            </h4>
                                            <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                                                {guideContent[activeGuideTab as keyof typeof guideContent].howItWorks}
                                            </p>
                                        </section>

                                        <div className="grid md:grid-cols-2 gap-8">
                                            <section className="space-y-4">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <ShoppingBag size={14} className="text-[#00F2FF]"/> Ejemplo de Operación
                                                </h4>
                                                <div className="p-6 bg-cyan-50/30 border border-cyan-100 rounded-[2rem]">
                                                    <p className="text-xs font-medium text-[#004D4D] leading-relaxed italic">
                                                        "{guideContent[activeGuideTab as keyof typeof guideContent].example}"
                                                    </p>
                                                </div>
                                            </section>

                                            <section className="space-y-4">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Zap size={14} className="text-amber-500"/> Tip de Experto
                                                </h4>
                                                <div className="p-6 bg-amber-50/30 border border-amber-100 rounded-[2rem]">
                                                    <p className="text-xs font-bold text-amber-900 leading-relaxed">
                                                        {guideContent[activeGuideTab as keyof typeof guideContent].tip}
                                                    </p>
                                                </div>
                                            </section>
                                        </div>
                                    </div>

                                    <div className="p-8 border-t border-slate-50 flex justify-end bg-slate-50/30">
                                        <button 
                                            onClick={() => setIsGuideOpen(false)}
                                            className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all"
                                        >
                                            ¡Entendido, a organizar!
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
