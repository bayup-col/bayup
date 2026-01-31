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
  ChevronDown
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
    
    const totalInventoryValue = products.reduce((acc, p) => {
        const productStock = p.variants?.reduce((vAcc: number, v: any) => vAcc + (v.stock || 0), 0) || 0;
        return acc + (p.price * productStock);
    }, 0);

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
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] pr-2 py-1">Inventario</span>
                        </h1>
                        <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed">
                            Catálogo maestro y control de existencias para <span className="font-bold text-[#001A1A]">{userEmail?.split('@')[0] || 'tu empresa'}</span>.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => router.push('/dashboard/products/new')} 
                            className="px-12 py-6 bg-gray-900 text-white rounded-[2.2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center gap-3"
                        >
                            <Plus size={18} /> Nuevo Producto
                        </button>
                    </div>
                </motion.div>

                {/* --- KPI CARDS (Estilo Facturación) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard title="Total Productos" value={products.length} trendValue={4.2} icon={Package} iconColor="text-[#004D4D]" isCurrency={false} />
                    <KPICard title="Valor Inventario" value={totalInventoryValue} trendValue={12.5} icon={DollarSign} iconColor="text-emerald-600" />
                    <KPICard title="Stock Crítico" value={lowStockCount} trendValue={-5.1} icon={AlertCircle} iconColor="text-rose-600" isCurrency={false} />
                    <KPICard title="Categorías" value={new Set(products.map(p => p.category)).size} icon={Layers} iconColor="text-cyan-600" isCurrency={false} />
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
                            {/* Tabs Estilo Facturación */}
                            <div className="flex bg-slate-50 p-1 rounded-xl mr-2">
                                {(['all', 'active', 'draft'] as const).map((tab) => (
                                    <button 
                                        key={tab} 
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${activeTab === tab ? 'bg-[#004D4D] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {tab === 'all' ? 'Todos' : tab === 'active' ? 'Activos' : 'Borradores'}
                                    </button>
                                ))}
                            </div>

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
            </div>
        </div>
    );
}
