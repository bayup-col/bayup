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
  ShoppingBag,
  Smartphone,
  Bot,
  Globe,
  MessageSquare
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

// --- COMPONENTE TILT CARD PREMIUM ---
const TiltCard = ({ children }: { children: React.ReactNode }) => {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const box = card.getBoundingClientRect();
        const x = e.clientX - box.left;
        const y = e.clientY - box.top;
        const centerX = box.width / 2;
        const centerY = box.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        setRotateX(rotateX);
        setRotateY(rotateY);
        setGlarePos({ 
            x: (x / box.width) * 100, 
            y: (y / box.height) * 100,
            opacity: 0.15 
        });
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
        setGlarePos(prev => ({ ...prev, opacity: 0 }));
    };

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={{ rotateX, rotateY, scale: rotateX !== 0 ? 1.02 : 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
            className="bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/80 shadow-2xl flex flex-col justify-between group relative overflow-hidden h-full"
        >
            <div 
                className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                style={{
                    opacity: glarePos.opacity,
                    background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.8) 0%, transparent 60%)`,
                    zIndex: 1
                }}
            />
            <div style={{ transform: "translateZ(60px)", position: "relative", zIndex: 2 }}>
                {children}
            </div>
            <div className="absolute -bottom-20 -right-20 h-40 w-40 bg-[#00f2ff]/10 blur-[60px] rounded-full pointer-events-none" />
        </motion.div>
    );
};

// --- KPI CARD WRAPPER ---
const KPICard = ({ title, value, trendValue, icon: Icon, iconColor = "text-[#004D4D]", iconBg = "bg-[#004D4D]/5", valueClassName = "text-gray-900", isCurrency = true }: any) => {
    const isUp = trendValue >= 0;
    return (
        <TiltCard>
            <div className="flex justify-between items-start mb-6">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${iconBg} ${iconColor}`}>
                    <Icon size={24} />
                </div>
                {trendValue !== 0 && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        <span className="text-[10px] font-black">{isUp ? '+' : ''}{trendValue}%</span>
                    </div>
                )}
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">{title}</p>
                <h3 className={`text-3xl font-black tracking-tighter ${valueClassName}`}>
                    {isCurrency ? (typeof value === 'number' ? <AnimatedNumber value={value} /> : value) : value.toLocaleString()}
                </h3>
            </div>
        </TiltCard>
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
    
    // Estados para Nueva Categoría e Inteligencia
    const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
    const [isDeletingCategory, setIsDeletingCategory] = useState(false);
    const [modalView, setModalView] = useState<'analytics' | 'products'>('analytics');
    const [newCategoryData, setNewCategoryData] = useState({ name: '', description: '' });
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);

    // Estados de Guía
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [activeGuideTab, setActiveGuideTab] = useState('all');

    const guideContent = {
        all: {
            title: 'Catálogo Maestro', icon: <Package size={20}/>, color: 'text-[#004D4D]',
            howItWorks: 'Visualiza el 100% de tus activos comerciales, incluyendo productos listos para la venta, borradores y artículos archivados.',
            example: 'Úsalo para tener una perspectiva global de tu capacidad de oferta.',
            tip: 'Mantén un SKU maestro coherente para facilitar la búsqueda rápida.'
        },
        active: {
            title: 'Productos Activos', icon: <Zap size={20}/>, color: 'text-emerald-600',
            howItWorks: 'Artículos que están actualmente publicados y visibles en todos tus canales de venta.',
            example: 'Si un producto aparece aquí, significa que tus clientes pueden comprarlo ahora.',
            tip: 'Revisa periódicamente el stock para evitar ventas fallidas.'
        },
        draft: {
            title: 'Borradores', icon: <Clock size={20}/>, color: 'text-amber-600',
            howItWorks: 'Productos en fase de edición que aún no han sido lanzados al público.',
            example: 'Estás preparando una nueva colección; guárdala aquí hasta tener las fotos.',
            tip: 'Utiliza este estado para pre-cargar lanzamientos masivos.'
        },
        categories: {
            title: 'Categorías', icon: <Layers size={20}/>, color: 'text-cyan-600',
            howItWorks: 'Agrupaciones lógicas de productos por familias o tipos.',
            example: 'Categoría "Verano 2026" o "Calzado Deportivo".',
            tip: 'Crea categorías atractivas para mejorar la navegación.'
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
                    status: p.status || 'active', 
                    category: p.collection?.title || 'General' 
                })));
            } else { setProducts([]); }

            if (categoriesData && Array.isArray(categoriesData)) { setCategories(categoriesData); }
        } catch (err) {
            showToast("Error al sincronizar catálogo", "error");
        } finally { setLoading(false); }
    }, [token, showToast]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const handleUpdateStatus = async (productId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'draft' : 'active';
        try {
            await apiRequest(`/products/${productId}/status?status=${newStatus}`, { method: 'PUT', token });
            showToast(`Producto marcado como ${newStatus}`, "success");
            await fetchProducts();
        } catch (err) {
            showToast("Error al actualizar estado", "error");
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm("¿Estás seguro de eliminar este producto?")) return;
        try {
            await apiRequest(`/products/${productId}`, { method: 'DELETE', token });
            showToast("Producto eliminado", "success");
            await fetchProducts();
        } catch (err) {
            showToast("Error al eliminar producto", "error");
        }
    };

    const handleDeleteCategory = async () => {
        if (!categoryToDelete || !token) return;
        setIsDeletingCategory(true);
        try {
            await apiRequest(`/collections/${categoryToDelete.id}`, { method: 'DELETE', token });
            showToast("Categoría eliminada", "success");
            setCategoryToDelete(null);
            await fetchProducts(); 
        } catch (err) { showToast("Error al eliminar", "error"); } finally { setIsDeletingCategory(false); }
    };

    const handleCreateCategory = async () => {
        if (!token || !newCategoryData.name.trim()) return;
        setIsCreatingCategory(true);
        try {
            await apiRequest('/collections', { 
                method: 'POST', token, 
                body: JSON.stringify({ title: newCategoryData.name, description: newCategoryData.description, status: 'active' }) 
            });
            showToast("Categoría creada", "success");
            setIsNewCategoryModalOpen(false);
            setNewCategoryData({ name: '', description: '' });
            await fetchProducts(); 
        } catch (err) { showToast("Error al crear", "error"); } finally { setIsCreatingCategory(false); }
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.variants?.some(v => v.sku?.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesTab = activeTab === 'all' || p.status === activeTab;
            return matchesSearch && (activeTab === 'categories' ? true : matchesTab);
        });
    }, [products, searchTerm, activeTab]);

    const lowStockCount = products.filter(p => (p.variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) || 0) <= 5).length;
    const averageTicket = products.length > 0 ? products.reduce((acc, p) => acc + p.price, 0) / products.length : 0;
    const topProductMonth = products.length > 0 ? (products.find(p => p.status === 'active')?.name || products[0]?.name || "Sin datos") : "Sin datos";

    return (
        <div className="relative min-h-[calc(100vh-120px)] bg-[#FAFAFA] overflow-hidden px-4 sm:px-6 lg:px-8 text-slate-900">
            <div className="max-w-7xl mx-auto pb-20 space-y-12">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mt-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse"></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Gestión de Activos</span>
                        </div>
                        <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] pr-2 py-1">Catálogo Maestro</span>
                        </h1>
                    </div>
                    <PremiumButton onClick={() => router.push('/dashboard/products/new')}><Plus size={18} /> Nuevo Producto</PremiumButton>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard title="Total Productos" value={products.length} trendValue={0} icon={Package} isCurrency={false} />
                    <KPICard title="Producto del mes" value={topProductMonth} trendValue={0} icon={Trophy} iconColor="text-yellow-500" iconBg="bg-yellow-50" isCurrency={false} valueClassName="text-lg leading-tight mt-2" />
                    <KPICard title="Stock Crítico" value={lowStockCount} trendValue={0} icon={AlertCircle} iconColor="text-rose-600" isCurrency={false} />
                    <KPICard title="Ticket Promedio" value={averageTicket} trendValue={0} icon={ShoppingBag} iconColor="text-cyan-600" />
                </div>

                <div className="flex justify-center items-center gap-4 pt-4">
                    <div className="p-1.5 bg-white border border-slate-200 rounded-full shadow-xl flex items-center relative z-10">
                        {(['all', 'active', 'draft', 'categories'] as const).map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`relative px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all z-10 ${activeTab === tab ? 'text-white bg-[#004D4D] shadow-lg' : 'text-slate-500 hover:text-[#004D4D]'}`}>
                                {tab === 'all' ? 'Todos' : tab === 'active' ? 'Activos' : tab === 'draft' ? 'Borradores' : 'Categorías'}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setIsGuideOpen(true)} className="h-12 w-12 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-[#004D4D] hover:bg-[#004D4D] hover:text-white transition-all"><Info size={20}/></button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab !== 'categories' ? (
                        <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="flex bg-white p-2 rounded-2xl border border-slate-100 shadow-sm items-center">
                                <Search className="ml-4 text-slate-400" size={18} />
                                <input placeholder="Buscar producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 p-3 bg-transparent outline-none text-sm font-medium text-slate-900" />
                            </div>
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-50 text-slate-900">
                                    <thead className="bg-gray-50/50">
                                        <tr><th className="px-10 py-6 text-left text-[10px] font-black text-[#004D4D] uppercase tracking-widest">Producto</th><th className="px-10 py-6 text-center text-[10px] font-black text-[#004D4D] uppercase tracking-widest">Estado</th><th className="px-10 py-6 text-center text-[10px] font-black text-[#004D4D] uppercase tracking-widest">Stock</th><th className="px-10 py-6 text-right text-[10px] font-black text-[#004D4D] uppercase tracking-widest">Precio</th><th className="px-10 py-6 text-right text-[10px] font-black text-[#004D4D] uppercase tracking-widest">Acciones</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredProducts.length === 0 ? (<tr><td colSpan={5} className="py-20 text-center text-gray-400 font-black uppercase text-[10px]">Sin resultados encontrados</td></tr>) : (
                                            filteredProducts.map(p => (
                                                <tr key={p.id} className="hover:bg-gray-50/50 transition-all group">
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner relative group/img">
                                                                {p.image_url ? (
                                                                    <img src={p.image_url} className="h-full w-full object-cover transition-transform group-hover/img:scale-110" />
                                                                ) : (
                                                                    <div className="h-full w-full bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center text-gray-300">
                                                                        <ImageIcon size={24} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-gray-900 tracking-tight">{p.name}</p>
                                                                <p className="text-[9px] font-bold text-[#004D4D] uppercase italic">{p.category}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8 text-center">
                                                        <button 
                                                            onClick={() => handleUpdateStatus(p.id, p.status || 'active')}
                                                            className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase transition-all border ${
                                                                p.status === 'active' 
                                                                ? 'bg-[#004D4D] text-white border-transparent' 
                                                                : 'bg-white text-gray-400 border-gray-200 hover:border-[#004D4D]/30'
                                                            }`}
                                                        >
                                                            {p.status === 'active' ? 'Activo' : 'Borrador'}
                                                        </button>
                                                    </td>
                                                    <td className="px-10 py-8 text-center">
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className={`text-sm font-black ${p.variants?.reduce((a,v) => a + (v.stock || 0), 0) <= 5 ? 'text-rose-500' : 'text-slate-900'}`}>
                                                                {p.variants?.reduce((a,v) => a + (v.stock || 0), 0) || 0}
                                                            </span>
                                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">unidades</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8 text-right text-sm font-black text-gray-900">
                                                        <AnimatedNumber value={p.price} />
                                                    </td>
                                                    <td className="px-10 py-8 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => router.push(`/dashboard/products/${p.id}/edit`)} className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 hover:text-[#004D4D] hover:bg-[#004D4D]/5 flex items-center justify-center transition-all border border-transparent hover:border-[#004D4D]/10"><Edit3 size={16}/></button>
                                                            <button onClick={() => handleDeleteProduct(p.id)} className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all border border-transparent hover:border-rose-100"><Trash2 size={16}/></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="categories" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                            <div className="flex items-center justify-between">
                                <div><h3 className="text-2xl font-black italic uppercase text-[#001A1A] tracking-tighter">Categorías Maestro</h3><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Organización inteligente del inventario</p></div>
                                <PremiumButton onClick={() => setIsNewCategoryModalOpen(true)}><Plus size={18} /> Nueva Categoría</PremiumButton>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {categories.map(cat => (
                                    <div key={cat.id} onClick={() => { setSelectedCategory(cat); setModalView('analytics'); }} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-[#004D4D]/10 transition-all cursor-pointer group text-slate-900">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="h-14 w-14 rounded-2xl bg-[#004D4D]/5 flex items-center justify-center text-[#004D4D] group-hover:bg-[#004D4D] group-hover:text-white transition-all duration-500"><Layers size={24}/></div>
                                            <button onClick={(e) => { e.stopPropagation(); setCategoryToDelete(cat); }} className="h-8 w-8 rounded-full flex items-center justify-center text-gray-300 hover:bg-rose-50 hover:text-rose-500 transition-all"><Trash2 size={16}/></button>
                                        </div>
                                        <h4 className="text-xl font-black text-gray-900 group-hover:text-[#004D4D] transition-colors">{cat.title}</h4>
                                        <div className="mt-4 flex items-center justify-between">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{products.filter(p => p.collection_id === cat.id).length} Artículos</p>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[9px] font-black text-[#004D4D] uppercase">Ver Inteligencia</span>
                                                <ArrowUpRight size={14} className="text-[#004D4D]" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => setIsNewCategoryModalOpen(true)} className="border-2 border-dashed border-gray-200 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-[#004D4D]/20 hover:text-[#004D4D] transition-all"><Plus size={32}/><span className="text-[10px] font-black uppercase">Nueva Categoría</span></button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* MODAL INTELIGENCIA DE CATEGORÍA (VERSIÓN ELITE) */}
            <AnimatePresence>
                {selectedCategory && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 md:p-8">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCategory(null)} className="absolute inset-0 bg-[#001A1A]/90 backdrop-blur-2xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="relative bg-white w-full max-w-7xl h-[90vh] rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.2)] overflow-hidden border border-white/20 flex flex-col md:flex-row text-slate-900">
                            
                            {/* LATERAL IZQUIERDO: SCORE CARD */}
                            <div className="w-full md:w-96 bg-[#004D4D] p-12 text-white flex flex-col justify-between shrink-0 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                                    <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#4fffcb] rounded-full blur-[80px]" />
                                </div>
                                
                                <div className="relative z-10 space-y-10">
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-xl border border-white/10 text-[#4fffcb]">
                                            <Layers size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{selectedCategory.title}</h3>
                                            <p className="text-[#4fffcb] text-[9px] font-black uppercase tracking-[0.2em] mt-2">Ecosistema Inteligente</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 relative group">
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Zap size={12} className="text-[#4fffcb]" /> Salud de Colección
                                            </p>
                                            <div className="flex items-end justify-between">
                                                <span className="text-5xl font-black italic tracking-tighter">88<span className="text-xl text-[#4fffcb]">/100</span></span>
                                                <div className="h-12 w-12 rounded-full border-4 border-[#4fffcb] border-t-transparent animate-spin duration-[3s]" />
                                            </div>
                                            <p className="text-[9px] font-bold text-emerald-400 uppercase mt-4">Rendimiento por encima del promedio</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                                                <p className="text-[8px] font-black text-white/30 uppercase mb-1">Conversión</p>
                                                <span className="text-xl font-black italic">4.2%</span>
                                            </div>
                                            <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                                                <p className="text-[8px] font-black text-white/30 uppercase mb-1">Ticket Prom.</p>
                                                <span className="text-xl font-black italic">$185k</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative z-10 space-y-4">
                                    <button 
                                        onClick={() => setModalView(modalView === 'analytics' ? 'products' : 'analytics')}
                                        className={`w-full py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 border-2 ${modalView === 'products' ? 'bg-[#4fffcb] text-[#004D4D] border-[#4fffcb]' : 'bg-transparent text-white border-white/20 hover:bg-white/10'}`}
                                    >
                                        {modalView === 'analytics' ? <><ShoppingBag size={18}/> Ver Inventario</> : <><BarChart3 size={18}/> Ver Análisis</>}
                                    </button>
                                    <button onClick={() => setSelectedCategory(null)} className="w-full py-5 bg-white text-[#004D4D] rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-[#4fffcb] transition-all">
                                        Cerrar Reporte
                                    </button>
                                </div>
                            </div>

                            {/* CONTENIDO PRINCIPAL: DASHBOARD PRO */}
                            <div className="flex-1 overflow-y-auto p-12 bg-[#FAFAFA] custom-scrollbar relative">
                                <AnimatePresence mode="wait">
                                    {modalView === 'analytics' ? (
                                        <motion.div key="analytics" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                                            
                                            {/* FILA 1: MERCADO Y VERDICTO */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8 relative overflow-hidden group">
                                                    <div className="flex justify-between items-center relative z-10">
                                                        <div className="space-y-1">
                                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#004D4D]">Inteligencia de Mercado</h4>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Volumen de interés mensual</p>
                                                        </div>
                                                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><TrendingUp size={20} /></div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-10 relative z-10">
                                                        <div className="space-y-2">
                                                            <span className="text-5xl font-black tracking-tighter text-slate-900 italic">14.2k</span>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                                                                <Eye size={12} className="text-cyan-500" /> Vistas Totales
                                                            </p>
                                                        </div>
                                                        <div className="space-y-2 text-right">
                                                            <span className="text-5xl font-black tracking-tighter text-[#00F2FF] italic">850</span>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2 justify-end">
                                                                <ShoppingBag size={12} className="text-[#4fffcb]" /> Intenciones
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="h-32 flex items-end gap-3 pt-6 relative z-10">
                                                        {[30, 50, 45, 90, 65, 80, 100, 70, 85, 60].map((h, i) => (
                                                            <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.05 }} className="flex-1 bg-gradient-to-t from-[#004D4D]/10 to-[#004D4D] rounded-t-xl hover:to-[#00F2FF] transition-all cursor-crosshair group/bar relative">
                                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity">Day {i+1}</div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </section>

                                                <section className="bg-[#001A1A] p-10 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000 text-[#4fffcb]">
                                                        <Bot size={150} />
                                                    </div>
                                                    <div className="relative z-10 space-y-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-12 w-12 rounded-2xl bg-[#4fffcb] flex items-center justify-center text-[#001A1A] shadow-[0_0_20px_rgba(79,255,203,0.4)]">
                                                                <Bot size={24} />
                                                            </div>
                                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#4fffcb]">Veredicto Bayt AI</h4>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <p className="text-lg font-bold text-white leading-tight italic">
                                                                "Esta colección tiene un <span className="text-[#4fffcb]">potencial viral alto</span> en el segmento 18-24."
                                                            </p>
                                                            <p className="text-sm text-white/60 leading-relaxed font-medium">
                                                                Los datos sugieren que la tasa de abandono de carrito baja un 15% cuando ofreces <span className="text-white font-bold underline decoration-[#4fffcb]">envío prioritario</span>. Recomendamos aumentar el stock de variantes en color Cyan y Negro de inmediato.
                                                            </p>
                                                        </div>
                                                        <div className="pt-4 flex flex-wrap gap-3">
                                                            <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-[#4fffcb] uppercase">Viabilidad: 92%</div>
                                                            <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-white/40 uppercase">Riesgo: Muy Bajo</div>
                                                        </div>
                                                    </div>
                                                </section>
                                            </div>

                                            {/* FILA 2: DEMOGRAFÍA Y AUDIENCIA (REDiseñado) */}
                                            <section className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-12">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#004D4D]">Anatomía de la Audiencia</h4>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase">¿Quiénes están comprando esta categoría?</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                                                        <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-16 items-center">
                                                    {/* Gráfico Género */}
                                                    <div className="space-y-8">
                                                        <div className="relative h-48 w-48 mx-auto">
                                                            <svg className="w-full h-full" viewBox="0 0 36 36">
                                                                <path className="text-slate-100" strokeDasharray="100, 100" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                                <path className="text-rose-500" strokeDasharray="65, 100" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                            </svg>
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                <span className="text-3xl font-black italic text-slate-900">65%</span>
                                                                <span className="text-[8px] font-black text-rose-500 uppercase">Mujeres</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-center gap-8 text-center">
                                                            <div><p className="text-lg font-black text-rose-500 italic">65%</p><p className="text-[8px] font-bold text-slate-400 uppercase">Mujeres</p></div>
                                                            <div className="w-px h-8 bg-slate-100" />
                                                            <div><p className="text-lg font-black text-blue-500 italic">35%</p><p className="text-[8px] font-bold text-slate-400 uppercase">Hombres</p></div>
                                                        </div>
                                                    </div>

                                                    {/* Histograma de Edad (Heatmap) */}
                                                    <div className="md:col-span-2 space-y-8">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center md:text-left">Distribución por Etapa de Vida</p>
                                                        <div className="grid grid-cols-4 gap-4">
                                                            {[
                                                                { label: 'Gen Z', range: '18-24', val: 52, color: 'bg-emerald-500' },
                                                                { label: 'Millenials', range: '25-34', val: 28, color: 'bg-[#004D4D]' },
                                                                { label: 'Gen X', range: '35-44', val: 15, color: 'bg-cyan-500' },
                                                                { label: 'Boomers', range: '45+', val: 5, color: 'bg-slate-300' }
                                                            ].map((age) => (
                                                                <div key={age.range} className="space-y-4">
                                                                    <div className="h-40 bg-slate-50 rounded-3xl relative overflow-hidden flex flex-col justify-end p-1">
                                                                        <motion.div 
                                                                            initial={{ height: 0 }} 
                                                                            animate={{ height: `${age.val}%` }} 
                                                                            className={`${age.color} w-full rounded-2xl shadow-lg relative group`}
                                                                        >
                                                                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                        </motion.div>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <p className="text-sm font-black text-slate-900">{age.val}%</p>
                                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{age.label}</p>
                                                                        <p className="text-[7px] font-bold text-slate-300">{age.range} Años</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>

                                            {/* FILA 3: ORIGEN DEL TRÁFICO */}
                                            <section className="bg-slate-900 p-10 rounded-[3.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                                                    <Globe size={400} className="absolute -left-20 -bottom-20" />
                                                </div>
                                                <div className="space-y-6 relative z-10 max-w-sm">
                                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#4fffcb]">Impacto Omnicanal</h4>
                                                    <p className="text-sm text-white/60 leading-relaxed font-medium">
                                                        El <span className="text-white font-bold">72% de tus clientes</span> interactúan con esta categoría a través de WhatsApp antes de finalizar la compra web.
                                                    </p>
                                                    <div className="flex gap-4">
                                                        <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-500" /><span className="text-[9px] font-black uppercase">WhatsApp (Active)</span></div>
                                                        <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-cyan-500" /><span className="text-[9px] font-black uppercase">Web Store</span></div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-10 relative z-10">
                                                    {[
                                                        { icon: <MessageSquare size={24}/>, label: 'WhatsApp', val: '45%' },
                                                        { icon: <Smartphone size={24}/>, label: 'Instagram', val: '30%' },
                                                        { icon: <Globe size={24}/>, label: 'Google', val: '25%' }
                                                    ].map(source => (
                                                        <div key={source.label} className="text-center space-y-3">
                                                            <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">{source.icon}</div>
                                                            <div><p className="text-xl font-black italic">{source.val}</p><p className="text-[8px] font-bold text-white/40 uppercase">{source.label}</p></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="products" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                                            <div className="flex items-center justify-between text-slate-900">
                                                <div className="space-y-1">
                                                    <h4 className="text-3xl font-black italic uppercase text-[#001A1A] tracking-tighter">Inventario en <span className="text-[#004D4D]">{selectedCategory.title}</span></h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visualizando items vinculados a esta familia</p>
                                                </div>
                                                <div className="px-6 py-3 bg-[#004D4D]/5 rounded-2xl border border-[#004D4D]/10">
                                                    <span className="text-xs font-black text-[#004D4D] uppercase tracking-widest">
                                                        {products.filter(p => p.category === selectedCategory.title || p.collection_id === selectedCategory.id).length} Artículos
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                                {products.filter(p => p.category === selectedCategory.title || p.collection_id === selectedCategory.id).map(p => (
                                                    <div key={p.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-[#004D4D]/10 transition-all group relative overflow-hidden">
                                                        <div className="aspect-square w-full bg-slate-50 rounded-[2rem] mb-6 overflow-hidden relative border border-gray-50">
                                                            {p.image_url ? (
                                                                <img src={p.image_url} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center text-slate-200"><ImageIcon size={48}/></div>
                                                            )}
                                                            <div className="absolute top-4 right-4 h-10 w-10 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <ArrowUpRight size={18} className="text-[#004D4D]" />
                                                            </div>
                                                        </div>
                                                        <h5 className="text-lg font-black text-slate-900 line-clamp-1 group-hover:text-[#004D4D] transition-colors">{p.name}</h5>
                                                        <div className="mt-4 flex items-center justify-between">
                                                            <div className="space-y-1">
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Referencia</p>
                                                                <p className="text-xs font-black text-slate-700">{p.variants?.[0]?.sku || 'S/N'}</p>
                                                            </div>
                                                            <div className="text-right space-y-1">
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Precio Unit.</p>
                                                                <p className="text-sm font-black text-[#004D4D]">${p.price.toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="mt-8 pt-6 border-t border-slate-50 flex gap-3">
                                                            <button 
                                                                onClick={() => { setSelectedCategory(null); router.push(`/dashboard/products/${p.id}/edit`); }}
                                                                className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all"
                                                            >
                                                                Editar Perfil
                                                            </button>
                                                            <button className="px-4 py-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL NUEVA CATEGORIA */}
            <AnimatePresence>{isNewCategoryModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNewCategoryModalOpen(false)} className="absolute inset-0 bg-[#001A1A]/80 backdrop-blur-xl" />
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl p-10 text-slate-900 border border-white">
                        <div className="flex justify-between items-center mb-8"><div className="h-12 w-12 rounded-2xl bg-[#004D4D]/5 flex items-center justify-center text-[#004D4D]"><Layers size={24}/></div><button onClick={() => setIsNewCategoryModalOpen(false)} className="text-slate-300 hover:text-[#004D4D]"><X size={24}/></button></div>
                        <h3 className="text-2xl font-black italic uppercase text-[#001A1A] tracking-tighter">Nueva <span className="text-[#004D4D]">Categoría</span></h3>
                        <div className="space-y-6 mt-8">
                            <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre</label><input value={newCategoryData.name} onChange={e => setNewCategoryData({...newCategoryData, name: e.target.value})} placeholder="Ej: Accesorios Premium" className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-bold text-slate-900 shadow-inner" /></div>
                            <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Descripción</label><textarea value={newCategoryData.description} onChange={e => setNewCategoryData({...newCategoryData, description: e.target.value})} placeholder="Describe esta familia..." rows={3} className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[2rem] outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-medium text-slate-900 shadow-inner resize-none" /></div>
                            <button onClick={handleCreateCategory} disabled={isCreatingCategory} className="w-full py-5 bg-[#004D4D] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#004D4D]/20">{isCreatingCategory ? 'Procesando...' : 'Crear Categoría'}</button>
                        </div>
                    </motion.div>
                </div>
            )}</AnimatePresence>

            {/* MODAL ELIMINAR CATEGORIA */}
            <AnimatePresence>{categoryToDelete && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setCategoryToDelete(null)} className="absolute inset-0 bg-[#001A1A]/80 backdrop-blur-xl" />
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white w-full max-w-sm rounded-[3rem] p-10 text-center text-slate-900">
                        <div className="h-20 w-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle size={40} className="animate-pulse" /></div>
                        <h3 className="text-xl font-black uppercase text-slate-900 tracking-tight">¿Eliminar Categoría?</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-2 leading-relaxed">Esta acción borrará permanentemente la familia <span className="text-[#004D4D] italic">"{categoryToDelete.title}"</span>.</p>
                        <div className="mt-8 space-y-3">
                            <button onClick={handleDeleteCategory} disabled={isDeletingCategory} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-rose-600/20">{isDeletingCategory ? 'Eliminando...' : 'Sí, eliminar'}</button>
                            <button onClick={() => setCategoryToDelete(null)} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase">Cancelar</button>
                        </div>
                    </motion.div>
                </div>
            )}</AnimatePresence>

            {/* GUIA MAESTRA */}
            <AnimatePresence>
                {isGuideOpen && (
                    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setIsGuideOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white w-full max-w-4xl h-[70vh] rounded-[3rem] shadow-2xl overflow-hidden border border-white flex flex-col md:flex-row text-slate-900">
                            <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-2 overflow-y-auto">
                                <div className="mb-6"><h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004D4D]">Guía Operativa</h3><p className="text-[10px] text-slate-400 font-bold mt-1">Maestría de Productos</p></div>
                                {Object.entries(guideContent).map(([key, item]) => (<button key={key} onClick={() => setActiveGuideTab(key)} className={`flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${activeGuideTab === key ? 'bg-[#004D4D] text-white shadow-lg' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}><div className={`${activeGuideTab === key ? 'text-white' : item.color}`}>{item.icon}</div><span className="text-[10px] font-black uppercase tracking-wide">{item.title}</span></button>))}
                            </div>
                            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0"><div className="flex items-center gap-4 text-slate-900"><div className={`h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center ${guideContent[activeGuideTab as keyof typeof guideContent].color}`}>{guideContent[activeGuideTab as keyof typeof guideContent].icon}</div><h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">{guideContent[activeGuideTab as keyof typeof guideContent].title}</h2></div><button onClick={() => setIsGuideOpen(false)} className="h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"><X size={20}/></button></div>
                                <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar text-slate-900"><section><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><div className="h-1 w-4 bg-[#004D4D] rounded-full"></div> ¿Qué significa?</h4><p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">{guideContent[activeGuideTab as keyof typeof guideContent].howItWorks}</p></section><div className="grid md:grid-cols-2 gap-8 text-slate-900"><section className="space-y-4"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ShoppingBag size={14} className="text-[#00F2FF]"/> Ejemplo</h4><div className="p-6 bg-cyan-50/30 border border-cyan-100 rounded-[2rem] text-slate-900"><p className="text-xs font-medium text-[#004D4D] leading-relaxed italic">"{guideContent[activeGuideTab as keyof typeof guideContent].example}"</p></div></section><section className="space-y-4 text-slate-900"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap size={14} className="text-amber-500"/> Pro-Tip</h4><div className="p-6 bg-amber-50/30 border border-amber-100 rounded-[2rem] text-slate-900"><p className="text-xs font-bold text-amber-900 leading-relaxed">{guideContent[activeGuideTab as keyof typeof guideContent].tip}</p></div></section></div></div>
                                <div className="p-8 border-t border-slate-50 flex justify-end bg-slate-50/30"><button onClick={() => setIsGuideOpen(false)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Entendido</button></div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
