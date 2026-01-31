"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { InteractiveUP } from '@/components/landing/InteractiveUP';
import { PremiumButton } from '@/components/landing/PremiumButton';
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
  Calendar,
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

// --- COMPONENTE DE NÚMEROS ANIMADOS ---
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

// --- KPI CARD ---
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
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'draft' | 'archived' | 'categories'>('all');
    
    // Estados para Nueva Categoría
    const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [modalView, setModalView] = useState<'analytics' | 'products'>('analytics');
    const [newCategoryData, setNewCategoryData] = useState({ name: '', description: '' });
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);

    // Resetear vista al cerrar o cambiar categoría
    useEffect(() => {
        if (!selectedCategory) setModalView('analytics');
    }, [selectedCategory]);

    // Guía de Maestría
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
        },
        categories: {
            title: 'Categorías',
            icon: <Layers size={20}/>,
            color: 'text-cyan-600',
            howItWorks: 'Agrupaciones lógicas de productos por familias, temporadas o tipos.',
            example: 'Categoría "Verano 2026" o "Calzado Deportivo". Ayudan al cliente a navegar mejor en tu tienda.',
            tip: 'Crea categorías atractivas para mejorar la conversión en tu tienda online.'
        }
    };

    // Filtros Avanzados
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isDateHovered, setIsDateHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);
    const [dateRangeState, setDateRangeState] = useState({ from: '', to: '' });
    const [advancedFilters, setAdvancedFilters] = useState({ category: 'all', stockStatus: 'all' });

    const handleDatePreset = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
        const today = new Date();
        const formatDate = (d: Date) => d.toISOString().split('T')[0];
        let start = new Date();
        let end = new Date();
        if (preset === 'yesterday') { start.setDate(today.getDate() - 1); end.setDate(today.getDate() - 1); }
        else if (preset === 'week') { start.setDate(today.getDate() - 7); }
        else if (preset === 'month') { start = new Date(today.getFullYear(), today.getMonth(), 1); }
        setDateRangeState({ from: formatDate(start), to: formatDate(end) });
    };

    const handleExportExcel = () => {
        if (products.length === 0) { showToast("No hay datos para exportar", "info"); return; }
        const styles = `<style>.header { background-color: #004D4D; color: #ffffff; font-weight: bold; text-align: center; }.cell { border: 1px solid #e2e8f0; padding: 8px; font-family: sans-serif; font-size: 12px; }.title { font-size: 20px; font-weight: bold; color: #004D4D; }</style>`;
        let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8">${styles}</head><body><table><tr><td colspan="6" class="title">BAYUP - REPORTE DE CATÁLOGO MAESTRO</td></tr><thead><tr class="header"><th>PRODUCTO</th><th>CATEGORÍA</th><th>SKU</th><th>STOCK TOTAL</th><th>PRECIO</th><th>ESTADO</th></tr></thead><tbody>`;
        products.forEach(p => {
            const stock = p.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
            tableHtml += `<tr><td class="cell">${p.name}</td><td class="cell">${p.category}</td><td class="cell">${p.variants?.[0]?.sku || 'S/N'}</td><td class="cell">${stock}</td><td class="cell">${p.price}</td><td class="cell">${p.status}</td></tr>`;
        });
        tableHtml += `</tbody></table></body></html>`;
        const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a"); link.href = url; link.download = `Catalogo_Bayup_${new Date().toISOString().split('T')[0]}.xls`; link.click();
        showToast("Excel de catálogo generado", "success");
    };

    const handleCreateCategory = async () => {
        if (!token) { showToast("Sesión expirada, por favor reingresa", "error"); return; }
        if (!newCategoryData.name.trim()) { showToast("El nombre es obligatorio", "error"); return; }
        
        setIsCreatingCategory(true);
        try {
            await apiRequest('/collections', { 
                method: 'POST', 
                token, 
                body: JSON.stringify({
                    title: newCategoryData.name,
                    description: newCategoryData.description || '',
                    status: 'active'
                }) 
            });
            showToast("Categoría creada con éxito", "success");
            setIsNewCategoryModalOpen(false);
            setNewCategoryData({ name: '', description: '' });
            await fetchProducts(); 
        } catch (err) {
            console.error("Error creating category:", err);
            showToast("Error al crear la categoría", "error");
        } finally {
            setIsCreatingCategory(false);
        }
    };

    const fetchProducts = useCallback(async () => {
        if (!token) { setLoading(false); return; }
        setLoading(true);
        try {
            const [productsData, categoriesData] = await Promise.all([
                apiRequest<any[]>('/products', { token }),
                apiRequest<any[]>('/collections', { token })
            ]);

            if (productsData && Array.isArray(productsData)) {
                setProducts(productsData.map((p: any) => ({ 
                    ...p, 
                    status: p.status || (p.variants?.every((v:any) => v.stock === 0) ? 'archived' : 'active'), 
                    category: p.category || 'General' 
                })));
            }

            if (categoriesData && Array.isArray(categoriesData)) {
                setCategories(categoriesData);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            showToast("Error al sincronizar catálogo", "error");
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
            return matchesSearch && (activeTab === 'categories' ? true : matchesTab) && matchesCategory && matchesStock;
        });
    }, [products, searchTerm, activeTab, advancedFilters]);

    const lowStockCount = products.filter(p => (p.variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) || 0) <= 5).length;
    const averageTicket = products.length > 0 ? products.reduce((acc, p) => acc + p.price, 0) / products.length : 0;
    const topProductMonth = products.length > 0 ? products.find(p => p.status === 'active')?.name || products[0].name : "Sin datos";

    return (
        <div className="relative min-h-[calc(100vh-120px)] bg-[#FAFAFA] overflow-hidden px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto pb-20 space-y-12">
                <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col md:flex-row md:items-center justify-between gap-8 mt-4">
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
                        <PremiumButton onClick={() => router.push('/dashboard/products/new')}>
                            <Plus size={18} /> Nuevo Producto
                        </PremiumButton>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard title="Total Productos" value={products.length} trendValue={4.2} icon={Package} iconColor="text-[#004D4D]" isCurrency={false} />
                    <KPICard title="Producto del mes" value={topProductMonth} trendValue={12.5} icon={Trophy} iconColor="text-yellow-500" iconBg="bg-yellow-50" isCurrency={false} valueClassName="text-lg leading-tight mt-2" />
                    <KPICard title="Stock Crítico" value={lowStockCount} trendValue={-5.1} icon={AlertCircle} iconColor="text-rose-600" isCurrency={false} />
                    <KPICard title="Ticket Promedio" value={averageTicket} trendValue={8.2} icon={ShoppingBag} iconColor="text-cyan-600" />
                </div>

                <div className="flex justify-center items-center gap-4 pt-4">
                    <div className="p-1.5 bg-white border border-slate-200 rounded-full shadow-xl shadow-slate-200/50 flex items-center relative z-10">
                        {(['all', 'active', 'draft', 'categories'] as const).map((tab) => {
                            const isActive = activeTab === tab;
                            return (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`relative px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 z-10 ${isActive ? 'text-white' : 'text-slate-500 hover:text-[#004D4D]'}`}>
                                    {isActive && <motion.div layoutId="productsTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                                    {tab === 'all' ? 'Todos los items' : tab === 'active' ? 'Productos Activos' : tab === 'draft' ? 'Borradores' : 'Categorías'}
                                </button>
                            );
                        })}
                    </div>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsGuideOpen(true)} className="h-12 w-12 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-[#004D4D] hover:bg-[#004D4D] hover:text-white transition-all group shrink-0">
                        <Info size={20} className="group-hover:animate-pulse"/>
                    </motion.button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab !== 'categories' ? (
                        <motion.div 
                            key="products-list" 
                            initial={{ y: -100, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }} 
                            exit={{ y: 500, opacity: 0 }} 
                            transition={{ duration: 0.6, ease: "anticipate" }} 
                            className="space-y-10"
                        >
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 px-2">
                                    <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse"></span>
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Listado de Productos</h3>
                                </div>
                                <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="relative flex-1 w-full">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input type="text" placeholder="Buscar por nombre, categoría o SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-transparent text-sm font-medium text-slate-700 outline-none" />
                                    </div>
                                    <div className="flex items-center gap-2 relative">
                                        {(isFilterMenuOpen || isDateMenuOpen) && <div className="fixed inset-0 z-40" onClick={() => { setIsFilterMenuOpen(false); setIsDateMenuOpen(false); }} />}
                                        <div className="relative z-50">
                                            <motion.button layout onMouseEnter={() => setIsFilterHovered(true)} onMouseLeave={() => setIsFilterHovered(false)} onClick={() => { setIsFilterMenuOpen(!isFilterMenuOpen); setIsDateMenuOpen(false); }} className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isFilterMenuOpen ? 'bg-[#004D4D] text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-500 hover:text-[#004D4D] hover:bg-[#004D4D]/5'}`}>
                                                <motion.div layout><Filter size={18}/></motion.div>
                                                <AnimatePresence mode="popLayout">{isFilterHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Filtro</motion.span>}</AnimatePresence>
                                            </motion.button>
                                            <AnimatePresence>
                                                {isFilterMenuOpen && (
                                                    <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute top-full mt-2 right-0 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 w-[280px] z-50 overflow-hidden">
                                                        <div className="flex flex-col">
                                                            {[
                                                                { id: 'category', label: 'Categorías', icon: <Layers size={16}/>, options: ['all', ...Array.from(new Set(products.map(p => p.category || 'General')))], key: 'category' },
                                                                { id: 'stock', label: 'Estado de Stock', icon: <Box size={16}/>, options: [{ val: 'all', l: 'Todos' }, { val: 'low', l: 'Stock Bajo' }, { val: 'out', l: 'Agotado' }], key: 'stockStatus' }
                                                            ].map((section) => (
                                                                <div key={section.id} className="border-b border-slate-50 last:border-none">
                                                                    <button onClick={() => setActiveAccordion(activeAccordion === section.id ? null : section.id)} className={`w-full flex items-center justify-between p-4 transition-colors hover:bg-slate-50 ${activeAccordion === section.id ? 'bg-slate-50/50' : ''}`}>
                                                                        <div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${activeAccordion === section.id ? 'bg-[#004D4D] text-white' : 'bg-slate-100 text-slate-500'}`}>{section.icon}</div><span className="text-[10px] font-black uppercase tracking-wide text-slate-700">{section.label}</span></div>
                                                                        <ChevronRight size={14} className={`text-slate-300 transition-transform ${activeAccordion === section.id ? 'rotate-90' : ''}`}/>
                                                                    </button>
                                                                    <AnimatePresence>
                                                                        {activeAccordion === section.id && (
                                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-slate-50/30 px-4 pb-4 flex flex-wrap gap-2 pt-2">
                                                                                {section.options.map((opt: any) => {
                                                                                    const val = typeof opt === 'string' ? opt : opt.val;
                                                                                    const label = typeof opt === 'string' ? (opt === 'all' ? 'Todas' : opt) : opt.l;
                                                                                    return <button key={val} onClick={() => setAdvancedFilters({...advancedFilters, [section.key]: val})} className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase transition-all ${advancedFilters[section.key as keyof typeof advancedFilters] === val ? 'bg-[#004D4D] text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-[#004D4D]'}`}>{label}</button>;
                                                                                })}
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                            ))}
                                                            <div className="p-4 bg-slate-50"><button onClick={() => { setAdvancedFilters({category: 'all', stockStatus: 'all'}); setIsFilterMenuOpen(false); setActiveAccordion(null); }} className="w-full py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase">Limpiar Filtros</button></div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div className="relative z-50">
                                            <motion.button layout onMouseEnter={() => setIsDateHovered(true)} onMouseLeave={() => setIsDateHovered(false)} onClick={() => { setIsDateMenuOpen(!isDateMenuOpen); setIsFilterMenuOpen(false); }} className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isDateMenuOpen ? 'bg-[#004D4D] text-white shadow-lg' : 'text-slate-500 hover:text-[#004D4D] hover:bg-[#004D4D]/5'}`}>
                                                <motion.div layout><Calendar size={18}/></motion.div>
                                                <AnimatePresence mode="popLayout">{isDateHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Fecha</motion.span>}</AnimatePresence>
                                            </motion.button>
                                            <AnimatePresence>
                                                {isDateMenuOpen && (
                                                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full mt-2 right-0 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 w-[300px] z-50 origin-top-right">
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Desde</label><input type="date" value={dateRangeState.from} onChange={e => setDateRangeState({...dateRangeState, from: e.target.value})} className="w-full bg-slate-50 border rounded-xl p-2 text-[10px] font-bold outline-none" /></div><div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Hasta</label><input type="date" value={dateRangeState.to} onChange={e => setDateRangeState({...dateRangeState, to: e.target.value})} className="w-full bg-slate-50 border rounded-xl p-2 text-[10px] font-bold outline-none" /></div></div>
                                                            <div className="flex flex-wrap gap-2">{['today', 'yesterday', 'week', 'month'].map(p => (<button key={p} onClick={() => handleDatePreset(p as any)} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-500">{p === 'week' ? '7 Días' : p === 'month' ? 'Mes' : p}</button>))}</div>
                                                            <div className="pt-4 border-t flex flex-col gap-2"><button onClick={() => setIsDateMenuOpen(false)} className="w-full py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase">Aplicar</button><button onClick={() => { setDateRangeState({from: '', to: ''}); setIsDateMenuOpen(false); }} className="w-full py-2 text-slate-400 text-[9px] font-black uppercase">Limpiar</button></div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <motion.button layout onMouseEnter={() => setIsExportHovered(true)} onMouseLeave={() => setIsExportHovered(false)} onClick={handleExportExcel} className="h-12 flex items-center gap-2 px-4 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:text-[#004D4D] hover:bg-[#004D4D]/5 transition-all shadow-sm">
                                            <motion.div layout><Download size={18}/></motion.div>
                                            <AnimatePresence mode="popLayout">{isExportHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Exportar</motion.span>}</AnimatePresence>
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-50">
                                        <thead className="bg-gray-50/50">
                                            <tr><th className="px-10 py-6 text-left text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em] w-[40%]">Producto</th><th className="px-10 py-6 text-center text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em]">Estado</th><th className="px-10 py-6 text-center text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em]">Stock Total</th><th className="px-10 py-6 text-center text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em]">Categoría</th><th className="px-10 py-6 text-right text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em]">Precio</th><th className="px-10 py-6 text-right text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em]">Acciones</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 bg-white">
                                            {loading ? (<tr><td colSpan={6} className="px-10 py-20 text-center"><div className="flex flex-col items-center gap-4"><div className="relative h-12 w-12"><div className="absolute inset-0 animate-ping rounded-full bg-[#00f2ff]/20"></div><div className="relative animate-spin rounded-full h-12 w-12 border-b-2 border-[#004D4D]"></div></div><span className="text-[10px] font-black text-[#004D4D]/40 uppercase tracking-widest">Sincronizando...</span></div></td></tr>) : filteredProducts.length === 0 ? (<tr><td colSpan={6} className="px-10 py-20 text-center text-gray-400"><Box size={40} className="mx-auto mb-4 opacity-10" /><p className="text-xs font-black uppercase tracking-widest">No hay resultados</p></td></tr>) : (
                                                filteredProducts.map((p) => (
                                                    <tr key={p.id} className="hover:bg-gray-50/50 transition-all group">
                                                        <td className="px-10 py-8"><div className="flex items-center gap-6"><div className="h-16 w-16 bg-white rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-110 transition-transform duration-500">{p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" /> : <ImageIcon className="text-gray-200" size={24} />}</div><div><div className="text-sm font-black text-gray-900 tracking-tight">{p.name}</div><div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-2"><Zap size={10} className="text-[#00F2FF]" /> {p.variants?.length || 0} Variantes <span className="h-1 w-1 rounded-full bg-gray-200"></span> SKU: {p.variants?.[0]?.sku || 'S/N'}</div></div></div></td>
                                                        <td className="px-10 py-8 text-center"><span className={`inline-flex px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${p.status === 'active' ? 'bg-[#004D4D] text-white shadow-lg shadow-[#004D4D]/20' : 'bg-gray-100 text-gray-400'}`}>{p.status === 'active' ? 'Activo' : 'Borrador'}</span></td>
                                                        <td className="px-10 py-8 text-center"><div className="flex flex-col items-center"><span className={`text-sm font-black ${p.variants?.reduce((a,v)=>a+(v.stock||0),0) <= 5 ? 'text-rose-600' : 'text-gray-900'}`}>{p.variants?.reduce((a,v)=>a+(v.stock||0),0)}</span><span className="text-[8px] text-gray-400 font-bold uppercase">Unidades</span></div></td>
                                                        <td className="px-10 py-8 text-center"><span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-lg">{p.category}</span></td>
                                                        <td className="px-10 py-8 text-right"><span className="text-sm font-black text-[#004D4D]">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(p.price).replace('$', '$ ')}</span></td>
                                                        <td className="px-10 py-8 text-right"><div className="flex items-center justify-end gap-2"><button onClick={() => router.push(`/dashboard/products/${p.id}/edit`)} className="p-2.5 rounded-xl bg-white border border-gray-100 text-[#004D4D]/40 hover:text-[#004D4D] hover:shadow-md transition-all"><Edit3 size={16} /></button><button className="p-2.5 rounded-xl bg-white border border-gray-100 text-rose-300 hover:text-rose-600 hover:shadow-md transition-all"><Trash2 size={16} /></button></div></td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="categories-view" initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 500, opacity: 0 }} transition={{ duration: 0.6, ease: "anticipate" }} className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-12">
                            <div className="flex items-center justify-between mb-12">
                                <div><h3 className="text-2xl font-black italic uppercase text-[#001A1A] tracking-tighter">Categorías Maestro</h3><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Organización lógica de tu inventario</p></div>
                                <PremiumButton onClick={() => setIsNewCategoryModalOpen(true)}>
                                    <Plus size={18} /> Nueva Categoría
                                </PremiumButton>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {categories.length === 0 ? (
                                    <div className="col-span-full py-20 text-center text-slate-400">
                                        <Layers size={40} className="mx-auto mb-4 opacity-10" />
                                        <p className="text-xs font-black uppercase tracking-widest">No hay categorías registradas</p>
                                    </div>
                                ) : (
                                    categories.map((cat, i) => (
                                        <motion.div 
                                            key={cat.id || cat.title} 
                                            initial={{ opacity: 0, scale: 0.9 }} 
                                            animate={{ opacity: 1, scale: 1 }} 
                                            transition={{ delay: i * 0.1 }} 
                                            onClick={() => setSelectedCategory(cat)}
                                            className="group bg-gray-50/50 rounded-[2.5rem] border border-gray-100 p-8 hover:bg-white hover:shadow-2xl hover:shadow-[#004D4D]/10 transition-all cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="h-14 w-14 rounded-2xl bg-[#004D4D]/5 flex items-center justify-center text-[#004D4D] group-hover:bg-[#004D4D] group-hover:text-white transition-all duration-500">
                                                    <Layers size={24} />
                                                </div>
                                                <div className="px-3 py-1 bg-white rounded-full border border-gray-100 text-[9px] font-black text-[#004D4D] uppercase">
                                                    {products.filter(p => p.category === cat.title || p.collection_id === cat.id).length} Items
                                                </div>
                                            </div>
                                            <h4 className="text-xl font-black text-gray-900 group-hover:text-[#004D4D] transition-colors">{cat.title}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{cat.description || 'Sincronizado con Tienda Web'}</p>
                                            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] font-black text-[#004D4D] uppercase tracking-widest">Ver Inteligencia</span>
                                                <ArrowUpRight size={16} className="text-[#004D4D]" />
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- MODAL INTELIGENCIA DE CATEGORÍA --- */}
            <AnimatePresence>
                {selectedCategory && (
                    <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 md:p-8">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCategory(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="relative bg-white/90 w-full max-w-6xl h-[85vh] rounded-[4rem] shadow-2xl overflow-hidden border border-white flex flex-col md:flex-row">
                            {/* Lateral Izquierdo: Resumen y KPI */}
                            <div className="w-full md:w-80 bg-[#004D4D] p-10 text-white flex flex-col justify-between shrink-0">
                                <div className="space-y-6">
                                    <div className="h-16 w-16 rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                        <Layers size={32} className="text-[#4fffcb]" />
                                    </div>
                                    <div className="min-h-[80px] flex flex-col justify-center">
                                        <h3 className={`font-black italic uppercase tracking-tighter leading-[1.1] line-clamp-2 ${selectedCategory.title.length > 15 ? 'text-xl' : 'text-3xl'}`}>
                                            {selectedCategory.title}
                                        </h3>
                                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-2 italic">Reporte de Inteligencia Web</p>
                                    </div>
                                    <div className="pt-4 space-y-4">
                                        <div className="p-6 rounded-[2.5rem] bg-white/5 border border-white/10">
                                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Conversión Mensual</p>
                                            <div className="flex items-end gap-2">
                                                <span className="text-3xl font-black italic">4.2%</span>
                                                <span className="text-[10px] font-black text-[#4fffcb] mb-1">+1.2%</span>
                                            </div>
                                        </div>
                                        <div className="p-6 rounded-[2.5rem] bg-white/5 border border-white/10">
                                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Ticket Promedio</p>
                                            <div className="flex items-end gap-2">
                                                <span className="text-2xl font-black italic">$ 185k</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <button 
                                        onClick={() => setModalView(modalView === 'analytics' ? 'products' : 'analytics')}
                                        className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border flex items-center justify-center gap-3 ${modalView === 'products' ? 'bg-[#4fffcb] text-[#004D4D] border-[#4fffcb]' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'}`}
                                    >
                                        {modalView === 'analytics' ? <><ShoppingBag size={16}/> Ver Productos</> : <><BarChart3 size={16}/> Ver Reporte</>}
                                    </button>
                                    <PremiumButton onClick={() => setSelectedCategory(null)} className="w-full">
                                        Cerrar Reporte
                                    </PremiumButton>
                                </div>
                            </div>

                            {/* Contenido Principal: Animaciones Divergentes */}
                            <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50 backdrop-blur-sm custom-scrollbar relative">
                                <AnimatePresence mode="wait">
                                    {modalView === 'analytics' ? (
                                        <div key="analytics-grid" className="space-y-10">
                                            {/* GRUPO SUPERIOR: Entra/Sale hacia ARRIBA */}
                                            <motion.div 
                                                initial={{ y: -500, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: -500, opacity: 0 }}
                                                transition={{ duration: 0.6, ease: "anticipate" }}
                                                className="grid grid-cols-1 lg:grid-cols-2 gap-10"
                                            >
                                                {/* Bloque 1: Tráfico y Búsquedas */}
                                                <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#004D4D]">Rendimiento de Mercado</h4>
                                                        <TrendingUp size={18} className="text-emerald-500" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="space-y-1">
                                                            <span className="text-4xl font-black tracking-tighter text-slate-900">1,240</span>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Compras/Mes</p>
                                                        </div>
                                                        <div className="space-y-1 text-right">
                                                            <span className="text-4xl font-black tracking-tighter text-[#00F2FF]">8,500</span>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Búsquedas/Mes</p>
                                                        </div>
                                                    </div>
                                                    <div className="h-24 flex items-end gap-2 pt-4">
                                                        {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                                                            <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.1 }} className="flex-1 bg-gradient-to-t from-[#004D4D] to-[#4fffcb] rounded-t-lg opacity-20 hover:opacity-100 transition-all cursor-pointer" />
                                                        ))}
                                                    </div>
                                                </section>

                                                {/* Bloque 2: Demografía */}
                                                <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#004D4D]">Audiencia Clave</h4>
                                                        <BarChart3 size={18} className="text-purple-500" />
                                                    </div>
                                                    <div className="space-y-6">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-black uppercase text-slate-500">Género Dominante</span>
                                                            <div className="flex gap-4">
                                                                <span className="text-[10px] font-black text-rose-500">Mujeres 65%</span>
                                                                <span className="text-[10px] font-black text-blue-500">Hombres 35%</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                                            <div className="h-full bg-rose-500" style={{ width: '65%' }} />
                                                            <div className="h-full bg-blue-500" style={{ width: '35%' }} />
                                                        </div>
                                                        <div className="pt-4 grid grid-cols-3 gap-2">
                                                            {['18-24', '25-34', '35+'].map((age, i) => (
                                                                <div key={age} className="text-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                                                    <span className="block text-sm font-black text-slate-900">{i === 1 ? '52%' : i === 0 ? '28%' : '20%'}</span>
                                                                    <span className="text-[8px] font-black text-slate-400 uppercase">{age}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </section>
                                            </motion.div>

                                            {/* GRUPO INFERIOR: Entra/Sale hacia ABAJO */}
                                            <motion.div 
                                                initial={{ y: 500, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: 500, opacity: 0 }}
                                                transition={{ duration: 0.6, ease: "anticipate" }}
                                                className="grid grid-cols-1 lg:grid-cols-2 gap-10"
                                            >
                                                {/* Bloque 3: Geografía */}
                                                <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#004D4D]">Focos Geográficos</h4>
                                                        <TrendingUp size={18} className="rotate-90 text-cyan-500" />
                                                    </div>
                                                    <div className="space-y-4">
                                                        {['Bogotá', 'Medellín', 'Cali', 'Barranquilla'].map((city, i) => (
                                                            <div key={city} className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-[10px] font-black text-slate-400 w-4">0{i+1}</span>
                                                                    <span className="text-sm font-black text-slate-700">{city}</span>
                                                                </div>
                                                                <span className="text-[10px] font-black text-[#004D4D]">{40 - i * 10}% Interés</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>

                                                {/* Bloque 4: Bayt AI Advice */}
                                                <section className="bg-[#001A1A] p-10 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                                        <Zap size={120} className="text-[#4fffcb]" />
                                                    </div>
                                                    <div className="relative z-10 space-y-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-[#4fffcb] flex items-center justify-center text-[#001A1A]">
                                                                <Zap size={20} />
                                                            </div>
                                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#4fffcb]">Consejo Bayt AI</h4>
                                                        </div>
                                                        <p className="text-sm font-medium text-white/80 leading-relaxed italic">
                                                            "Para esta categoría, los usuarios suelen buscar una experiencia completa. Te recomiendo combinarla con <span className="text-[#4fffcb] font-bold">Accesorios Tech</span> y <span className="text-[#4fffcb] font-bold">Lifestyle Moderno</span> para aumentar el valor del carrito en un 25%."
                                                        </p>
                                                        <div className="pt-4 flex gap-3">
                                                            <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-[#4fffcb] uppercase tracking-widest">Cross-selling Activo</div>
                                                            <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest">Optimización de SEO</div>
                                                        </div>
                                                    </div>
                                                </section>
                                            </motion.div>
                                        </div>
                                    ) : (
                                        <motion.div 
                                            key="products-view"
                                            initial={{ y: -500, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: 500, opacity: 0 }}
                                            transition={{ duration: 0.6, ease: "anticipate" }}
                                            className="space-y-10"
                                        >
                                            <div className="flex items-center justify-between px-4">
                                                <h4 className="text-2xl font-black italic uppercase text-[#001A1A] tracking-tighter">Productos en <span className="text-[#004D4D]">{selectedCategory.title}</span></h4>
                                                <span className="px-4 py-2 bg-[#004D4D]/5 rounded-full text-[10px] font-black text-[#004D4D] uppercase tracking-widest">
                                                    {products.filter(p => p.category === selectedCategory.title || p.collection_id === selectedCategory.id).length} Artículos Encontrados
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {products
                                                    .filter(p => p.category === selectedCategory.title || p.collection_id === selectedCategory.id)
                                                    .map((p, i) => (
                                                        <motion.div 
                                                            key={p.id}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: i * 0.05 }}
                                                            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
                                                        >
                                                            <div className="h-40 w-full bg-slate-50 rounded-2xl mb-4 overflow-hidden relative">
                                                                {p.image_url ? (
                                                                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                ) : (
                                                                    <div className="h-full w-full flex items-center justify-center text-slate-200">
                                                                        <ImageIcon size={40} />
                                                                    </div>
                                                                )}
                                                                <div className="absolute top-3 right-3 px-3 py-1 bg-[#004D4D] text-white text-[8px] font-black uppercase rounded-full shadow-lg">
                                                                    ${p.price.toLocaleString()}
                                                                </div>
                                                            </div>
                                                            <h5 className="text-sm font-black text-slate-900 line-clamp-1">{p.name}</h5>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">SKU: {p.variants?.[0]?.sku || 'S/N'}</p>
                                                            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all">
                                                                <button onClick={() => router.push(`/dashboard/products/${p.id}/edit`)} className="text-[9px] font-black text-[#004D4D] uppercase tracking-widest hover:underline">Editar Producto</button>
                                                                <ArrowUpRight size={14} className="text-[#004D4D]" />
                                                            </div>
                                                        </motion.div>
                                                    ))
                                                }
                                                {products.filter(p => p.category === selectedCategory.title || p.collection_id === selectedCategory.id).length === 0 && (
                                                    <div className="col-span-full py-20 text-center text-slate-400">
                                                        <Box size={48} className="mx-auto mb-4 opacity-10" />
                                                        <p className="text-xs font-black uppercase tracking-widest">Esta categoría aún no tiene productos asignados</p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- MODAL NUEVA CATEGORÍA --- */}
            <AnimatePresence>
                {isNewCategoryModalOpen && (
                    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNewCategoryModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }} className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden border border-white">
                            <div className="p-10 space-y-8">
                                <div className="flex justify-between items-center text-[#004D4D]">
                                    <div className="h-14 w-14 rounded-2xl bg-[#004D4D]/5 flex items-center justify-center">
                                        <Layers size={28} />
                                    </div>
                                    <button onClick={() => setIsNewCategoryModalOpen(false)} className="h-10 w-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div>
                                    <h3 className="text-3xl font-black italic uppercase text-[#001A1A] tracking-tighter">Nueva <span className="text-[#004D4D]">Categoría</span></h3>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Define una nueva familia de productos</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#004D4D]/60 ml-1">Nombre Maestro</label>
                                        <input 
                                            type="text" 
                                            value={newCategoryData.name}
                                            onChange={(e) => setNewCategoryData({...newCategoryData, name: e.target.value})}
                                            placeholder="Ej: Colección Verano 2026"
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-[#004D4D]/10 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#004D4D]/60 ml-1">Descripción (Opcional)</label>
                                        <textarea 
                                            value={newCategoryData.description}
                                            onChange={(e) => setNewCategoryData({...newCategoryData, description: e.target.value})}
                                            placeholder="¿De qué trata esta categoría?"
                                            rows={3}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-[#004D4D]/10 transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-4 pt-8 border-t border-slate-50">
                                    <button 
                                        onClick={() => setIsNewCategoryModalOpen(false)}
                                        className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-[#004D4D] transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <PremiumButton onClick={handleCreateCategory}>
                                        {isCreatingCategory ? 'Creando...' : 'Crear Categoría'}
                                    </PremiumButton>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isGuideOpen && (
                    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuideOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative bg-white w-full max-w-4xl h-[70vh] rounded-[3rem] shadow-2xl overflow-hidden border border-white flex flex-col md:flex-row">
                            <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-2 overflow-y-auto"><div className="mb-6"><h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004D4D]">Maestría de Productos</h3><p className="text-[10px] text-slate-400 font-bold mt-1">Guía Operativa Bayup</p></div>{Object.entries(guideContent).map(([key, item]) => (<button key={key} onClick={() => setActiveGuideTab(key)} className={`flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${activeGuideTab === key ? 'bg-[#004D4D] text-white shadow-lg' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}><div className={`${activeGuideTab === key ? 'text-white' : item.color}`}>{item.icon}</div><span className="text-[10px] font-black uppercase tracking-wide">{item.title}</span></button>))}</div>
                            <div className="flex-1 flex flex-col overflow-hidden bg-white"><div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0"><div className="flex items-center gap-4"><div className={`h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center ${guideContent[activeGuideTab as keyof typeof guideContent].color}`}>{guideContent[activeGuideTab as keyof typeof guideContent].icon}</div><h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">{guideContent[activeGuideTab as keyof typeof guideContent].title}</h2></div><button onClick={() => setIsGuideOpen(false)} className="h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"><X size={20}/></button></div><div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar"><section><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><div className="h-1 w-4 bg-[#004D4D] rounded-full"></div> ¿Qué significa?</h4><p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">{guideContent[activeGuideTab as keyof typeof guideContent].howItWorks}</p></section><div className="grid md:grid-cols-2 gap-8"><section className="space-y-4"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ShoppingBag size={14} className="text-[#00F2FF]"/> Ejemplo de Operación</h4><div className="p-6 bg-cyan-50/30 border border-cyan-100 rounded-[2rem]"><p className="text-xs font-medium text-[#004D4D] leading-relaxed italic">"{guideContent[activeGuideTab as keyof typeof guideContent].example}"</p></div></section><section className="space-y-4"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap size={14} className="text-amber-500"/> Tip de Experto</h4><div className="p-6 bg-amber-50/30 border border-amber-100 rounded-[2rem]"><p className="text-xs font-bold text-amber-900 leading-relaxed">{guideContent[activeGuideTab as keyof typeof guideContent].tip}</p></div></section></div></div><div className="p-8 border-t border-slate-50 flex justify-end bg-slate-50/30"><button onClick={() => setIsGuideOpen(false)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all">¡Entendido, a organizar!</button></div></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
