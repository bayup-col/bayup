"use client";

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Package, 
  AlertCircle, 
  ShoppingBag, 
  Trophy, 
  Layers, 
  Edit3, 
  Trash2, 
  MoreVertical, 
  ChevronDown, 
  Info,
  ArrowUpRight,
  Eye,
  Zap,
  BarChart3,
  X,
  ImageIcon,
  TrendingUp,
  Globe,
  MessageSquare,
  Smartphone,
  CheckCheck,
  ChevronRight,
  Loader2,
  FilterX,
  Target,
  Sparkles,
  Bot,
  MousePointer2,
  Rocket,
  LayoutGrid,
  Activity,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  ArrowDownRight
} from 'lucide-react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { apiRequest } from '@/lib/api';
import MetricDetailModal from '@/components/dashboard/MetricDetailModal';
import { exportProductsToExcel } from '@/lib/products-export';

// --- COMPONENTES ATÓMICOS ---
const AnimatedNumber = memo(({ value, type = 'currency' }: { value: number, type?: 'currency' | 'simple' }) => {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current: number) => {
        if (type === 'simple') return Math.round(current).toLocaleString();
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(current);
    });
    useEffect(() => { spring.set(value); }, [value, spring]);
    return <motion.span>{display}</motion.span>;
});
AnimatedNumber.displayName = 'AnimatedNumber';

const PremiumCard = ({ children, onClick, className = "" }: { children: React.ReactNode, onClick?: () => void, className?: string }) => {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const box = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - box.left;
        const y = e.clientY - box.top;
        setRotateX((y - box.height/2) / 20);
        setRotateY((box.width/2 - x) / 20);
    };
    return (
        <motion.div
            onClick={onClick}
            onMouseMove={handleMove}
            onMouseLeave={() => { setRotateX(0); setRotateY(0); }}
            animate={{ rotateX, rotateY, scale: rotateX !== 0 ? 1.02 : 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 25 }}
            className={`bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/80 shadow-xl cursor-pointer overflow-hidden relative group isolate ${className}`}
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
        >
            <div style={{ transform: "translateZ(30px)" }}>{children}</div>
            <div className="absolute -bottom-20 -right-20 h-40 w-40 bg-[#004d4d]/5 blur-[80px] rounded-full -z-10" />
        </motion.div>
    );
};

export default function ProductsPage() {
    const { token, userEmail, userPlan } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'draft' | 'categories'>('all');
    const [selectedMetric, setSelectedMetric] = useState<any>(null);
    
    // UI States
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [limitType, setLimitType] = useState<'warning' | 'blocked'>('warning');
    const isBasicPlan = userPlan?.name === "Básico" || !userPlan;

    const handleDownloadTemplate = () => {
        const headers = ["Nombre", "Descripcion", "Precio", "Categoria", "Talla", "Color", "Stock"];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + 
            "Producto de Ejemplo,Esta es una descripcion,50000,Ropa,M,Negro,10";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "plantilla_bayup_productos.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportSubmit = async () => {
        if (!importFile || !token) return;
        setIsImporting(true);
        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiBase}/products/import-excel`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                showToast(data.message, data.skipped > 0 ? "info" : "success");
                setIsImportModalOpen(false);
                setImportFile(null);
                fetchProducts();
            } else {
                showToast(data.detail || "Error al importar", "error");
            }
        } catch (e) {
            showToast("Error de conexión", "error");
        } finally {
            setIsImporting(false);
        }
    };

    const handleNewProductClick = () => {
        if (isBasicPlan) {
            if (products.length >= 30) {
                setLimitType('blocked');
                setIsLimitModalOpen(true);
                return;
            }
            if (products.length >= 20) {
                // Solo mostrar advertencia si no se ha mostrado en esta sesión
                const warned = sessionStorage.getItem('bayup_limit_warned');
                if (!warned) {
                    setLimitType('warning');
                    setIsLimitModalOpen(true);
                    sessionStorage.setItem('bayup_limit_warned', 'true');
                    return;
                }
            }
        }
        router.push('/dashboard/products/new');
    };
    const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
    const [newCategoryData, setNewCategoryData] = useState({ name: '', description: '' });
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
    const [isDeletingCategory, setIsDeletingCategory] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [productToDelete, setProductToDelete] = useState<any>(null);
    const [isDeletingProduct, setIsDeletingProduct] = useState(false);
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [activeGuideTab, setActiveGuideTab] = useState('overview');
    const [categoryView, setCategoryView] = useState<'intel' | 'list'>('intel');

    // --- COMPONENTE ESPECIAL AURORA (SÓLO BORDE) ---
    const AuroraMetricCard = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => {
        return (
            <div className="relative group cursor-pointer h-full perspective-1000" onClick={onClick}>
                <div className="absolute inset-0 -m-[2px] rounded-[3rem] overflow-hidden pointer-events-none z-0">
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        style={{ willChange: 'transform' }}
                        className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent_0deg,#00F2FF_20deg,#10B981_40deg,#9333EA_60deg,transparent_80deg,transparent_360deg)] opacity-40 group-hover:opacity-100 transition-opacity duration-700 blur-[8px] transform-gpu"
                    />
                </div>
                <div className="relative z-10 h-full transform-gpu">
                    {children}
                </div>
            </div>
        );
    };

    const fetchProducts = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        console.log("Sincronizando catálogo real...");
        
        try {
            // Intentamos cargar productos
            try {
                const productsData = await apiRequest<any[]>('/products', { token });
                setProducts(Array.isArray(productsData) ? productsData : []);
                console.log("Productos cargados:", productsData?.length);
            } catch (pErr) {
                console.error("Error cargando productos:", pErr);
                showToast("Error al cargar productos", "error");
            }

            // Intentamos cargar categorías (colecciones)
            try {
                const categoriesData = await apiRequest<any[]>('/collections', { token });
                setCategories(Array.isArray(categoriesData) ? categoriesData : []);
                console.log("Categorías cargadas:", categoriesData?.length);
            } catch (cErr) {
                console.error("Error cargando categorías:", cErr);
            }

        } catch (err) {
            console.error("Error general de sincronización:", err);
        } finally {
            setLoading(false);
        }
    }, [token, showToast]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const handleDeleteProduct = async () => {
        if (!token || !productToDelete) return;
        setIsDeletingProduct(true);
        try {
            await apiRequest(`/products/${productToDelete.id}`, { method: 'DELETE', token });
            showToast("Producto eliminado con éxito", "success");
            setProductToDelete(null);
            fetchProducts();
        } catch (err) {
            showToast("Error al eliminar el producto", "error");
        } finally {
            setIsDeletingProduct(false);
        }
    };

    const kpis = useMemo(() => {
        const total = products.length;
        const active = products.filter(p => p.status === 'active').length;
        const draft = products.filter(p => p.status === 'draft').length;
        
        const lowStock = products.filter(p => {
            const s = p.variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) || 0;
            return s <= 5;
        }).length;

        const warningStock = products.filter(p => {
            const s = p.variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) || 0;
            return s > 5 && s <= 15;
        }).length;

        const healthyStock = total - (lowStock + warningStock);
        const avgPrice = total > 0 ? products.reduce((acc, p) => acc + (p.price || 0), 0) / total : 0;

        return [
            { 
                id: 'total', label: 'Total productos', value: total, icon: <Package size={24}/>, color: 'text-[#004d4d]', bg: 'bg-[#004d4d]/5', trend: 'Live', isSimple: true,
                details: [
                    { l: "ACTIVOS", v: `${active}`, icon: <CheckCircle2 size={10}/> },
                    { l: "BORRADORES", v: `${draft}`, icon: <Edit3 size={10}/> },
                    { l: "TOTAL", v: `${total}`, icon: <Layers size={10}/> }
                ],
                advice: "Tu catálogo es la vitrina de tu marca. Mantener al menos 10 productos activos aumenta la confianza de tus compradores web."
            },
            { 
                id: 'active', label: 'Items activos', value: active, icon: <Zap size={24}/>, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Online', isSimple: true,
                details: [
                    { l: "EN WEB", v: `${active}`, icon: <Globe size={10}/> },
                    { l: "CON FOTOS", v: `${products.filter(p => p.image_url?.length > 0).length}`, icon: <ImageIcon size={10}/> },
                    { l: "VISIBILIDAD", v: "100%", icon: <Target size={10}/> }
                ],
                advice: "¡Excelente! Todos tus productos activos son visibles. Asegúrate de que las descripciones tengan palabras clave para SEO."
            },
            { 
                id: 'stock', label: 'Stock crítico', value: lowStock, icon: <AlertCircle size={24}/>, color: 'text-rose-600', bg: 'bg-rose-50', trend: 'Revisar', isSimple: true,
                details: [
                    { l: "CRÍTICO", v: `${lowStock}`, icon: <AlertCircle size={10}/> },
                    { l: "PREVENTIVO", v: `${warningStock}`, icon: <Zap size={10}/> },
                    { l: "SANO", v: `${healthyStock}`, icon: <CheckCircle2 size={10}/> }
                ],
                advice: lowStock > 0 
                    ? `Tienes ${lowStock} productos en alerta roja. Repón pronto para no perder ventas web.`
                    : "Tu inventario está bajo control. Sigue así para garantizar despachos rápidos."
            },
            { 
                id: 'average', label: 'Valor promedio', value: avgPrice, icon: <ShoppingBag size={24}/>, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'Market ok',
                details: [
                    { l: "PRECIO PROM", v: `$ ${avgPrice.toLocaleString()}`, icon: <DollarSign size={10}/> },
                    { l: "MÁS CARO", v: `$ ${Math.max(...products.map(p => p.price || 0), 0).toLocaleString()}`, icon: <TrendingUp size={10}/> },
                    { l: "MÁS BARATO", v: `$ ${Math.min(...products.map(p => p.price || 0), products.length > 0 ? products[0].price : 0).toLocaleString()}`, icon: <ArrowDownRight size={10}/> }
                ],
                advice: "El valor promedio de tu catálogo define tu posicionamiento. Considera productos 'gancho' para atraer tráfico."
            }
        ];
    }, [products]);

    const handleExport = async () => {
        if (products.length === 0) {
            showToast("No hay productos para exportar", "info");
            return;
        }
        try {
            showToast("Generando auditoría de catálogo...", "info");
            await exportProductsToExcel(products, "Bayup_Tienda");
            showToast("¡Catálogo exportado! 📊", "success");
        } catch (e) {
            showToast("Error al generar el archivo", "error");
        }
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.variants?.some((v: any) => v.sku?.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesTab = activeTab === 'all' || p.status === activeTab;
            return matchesSearch && (activeTab === 'categories' ? true : matchesTab);
        });
    }, [products, searchTerm, activeTab]);

    const handleCreateCategory = async () => {
        if (!token || !newCategoryData.name.trim()) return;
        setIsCreatingCategory(true);
        try {
            await apiRequest('/collections', { 
                method: 'POST', token, 
                body: JSON.stringify({ title: newCategoryData.name, description: newCategoryData.description, status: 'active' }) 
            });
            showToast("Categoría creada con éxito ✨", "success");
            setIsNewCategoryModalOpen(false);
            setNewCategoryData({ name: '', description: '' });
            fetchProducts(); 
        } catch (err) { showToast("Error al crear", "error"); } finally { setIsCreatingCategory(false); }
    };

    const guideContent = {
        overview: { title: 'Vista general (todos)', icon: <LayoutGrid size={20}/>, color: 'text-slate-600', description: 'Central de mando unificada. Aquí visualizas el 100% de tus activos comerciales, sin importar su estado.', whyImportant: 'Tener una visión global permite detectar redundancias en el catálogo.', kpi: { label: 'Diversidad de catálogo', val: '100%' }, baytTip: 'Usa la barra de búsqueda rápida con SKU para encontrar productos en menos de 2 segundos.' },
        active: { title: 'Módulo activos', icon: <Zap size={20}/>, color: 'text-emerald-500', description: 'El motor de ingresos. Solo los productos aquí listados son visibles para tus clientes.', whyImportant: 'Mantener esta lista depurada garantiza que no vendas productos sin stock.', kpi: { label: 'Disponibilidad web', val: '98.2%' }, baytTip: 'Si un producto tiene alta rotación pero poco margen, prioriza otros items más rentables.' },
        draft: { title: 'Laboratorio de borradores', icon: <Edit3 size={20}/>, color: 'text-amber-500', description: 'Espacio de preparación. Aquí puedes pulir fotos, descripciones y precios.', whyImportant: 'Un producto bien preparado tiene un 40% más de probabilidad de conversión.', kpi: { label: 'Calidad de carga', val: 'Elite' }, baytTip: 'No publiques nada sin al menos 3 fotos de alta calidad.' },
        categories: { title: 'Estructura de categorías', icon: <Layers size={20}/>, color: 'text-cyan-500', description: 'Segmentación estratégica. Organiza tus productos por familias lógicas.', whyImportant: 'Las categorías mejoran la navegación del usuario en un 35%.', kpi: { label: 'User experience', val: 'A+' }, baytTip: 'Crea categorías por "Ocasión de Uso" para vender más.' },
        new: { title: 'Nuevo producto (crecimiento)', icon: <Rocket size={20}/>, color: 'text-purple-500', description: 'Tu herramienta de expansión. Inyecta nuevos activos al flujo de caja.', whyImportant: 'La innovación constante mantiene a tus clientes regresando.', kpi: { label: 'Innovación mensual', val: '+5 items' }, baytTip: 'Asigna siempre el precio mayorista para activar Dropshipping en el futuro.' }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 pb-20 animate-in fade-in duration-1000">
            
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#00f2ff] animate-pulse" />
                        <span className="text-[10px] font-black tracking-[0.3em] text-[#004d4d]/60 italic">Activos maestros</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-tight text-[#001A1A] py-2 px-1">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-[#004d4d] inline-block pr-4">Productos</span>
                    </h1>
                    <p className="text-gray-400 font-medium text-lg italic max-w-2xl mt-4">¡Crea y edita todos los productos de tu tienda! 🛍️</p>
                    
                    {/* BARRA DE LÍMITE DE PLAN BÁSICO */}
                    {isBasicPlan && (
                        <div className="mt-6 max-w-md bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/80 shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${products.length >= 30 ? 'bg-rose-500' : 'bg-[#00F2FF]'} animate-pulse`} />
                                    <span className="text-[9px] font-black text-[#004D4D] tracking-widest uppercase">Plan Básico: {products.length}/30 Items</span>
                                </div>
                                <button onClick={() => router.push('/planes')} className="text-[8px] font-black text-cyan hover:underline tracking-widest uppercase">Subir de nivel</button>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-50">
                                <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: `${(products.length / 30) * 100}%` }} 
                                    className={`h-full rounded-full ${products.length >= 30 ? 'bg-rose-500' : 'bg-gradient-to-r from-[#004D4D] to-[#00F2FF]'}`}
                                />
                            </div>
                            {products.length >= 25 && (
                                <p className="text-[8px] font-black text-rose-500/80 italic tracking-widest flex items-center gap-1.5">
                                    <AlertCircle size={10} /> Te queda poco espacio. ¡Considera expandirte!
                                </p>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setIsImportModalOpen(true)} className="h-12 px-8 bg-white border border-gray-100 text-[#004d4d] rounded-full font-black text-[10px] tracking-[0.3em] shadow-xl hover:shadow-2xl transition-all flex items-center gap-3">
                        <Download size={16} className="rotate-180"/> Importar Catálogo
                    </button>
                    <button onClick={handleNewProductClick} className="h-12 px-8 bg-[#004d4d] text-white rounded-full font-black text-[10px] tracking-[0.3em] shadow-2xl hover:bg-black transition-all flex items-center gap-3 group">
                        <Plus size={16} className="group-hover:rotate-90 transition-transform"/> Nuevo producto
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                {kpis.map((kpi, i) => (
                    <div key={i}>
                        <AuroraMetricCard onClick={() => setSelectedMetric(kpi)}>
                            <PremiumCard className="p-8 group h-full border-none bg-white/80 backdrop-blur-2xl">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg group-hover:scale-110 border border-white/50 ${kpi.bg} ${kpi.color}`}>
                                        {kpi.icon}
                                    </div>
                                    <div className="px-3 py-1 bg-gray-100 rounded-full text-[9px] font-black tracking-wider text-gray-400">
                                        {kpi.trend}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 tracking-[0.2em] mb-1.5">{kpi.label}</p>
                                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter italic">
                                        <AnimatedNumber value={kpi.value} type={kpi.isSimple ? 'simple' : 'currency'} />
                                    </h3>
                                </div>
                            </PremiumCard>
                        </AuroraMetricCard>
                    </div>
                ))}
            </div>

            <div className="px-4 space-y-10">
                <div className="flex justify-center items-center gap-4 relative z-20">
                    <div className="p-1.5 bg-white/60 backdrop-blur-xl border border-white/80 rounded-full shadow-2xl flex items-center overflow-x-auto no-scrollbar relative">
                        {(['all', 'active', 'draft', 'categories'] as const).map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`relative px-10 py-3.5 rounded-full text-[10px] font-black tracking-[0.2em] transition-all duration-500 z-10 whitespace-nowrap ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-[#004D4D]'}`}>
                                {activeTab === tab && <motion.div layoutId="activeProdTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                                {tab === 'all' ? 'Todos' : tab === 'active' ? 'Activos' : tab === 'draft' ? 'Borradores' : 'Categorías'}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setIsGuideOpen(true)} className="h-12 w-12 rounded-full bg-white border border-gray-100 text-[#004d4d] flex items-center justify-center hover:scale-110 hover:bg-[#004d4d] hover:text-white transition-all shadow-xl active:scale-95 group"><Info size={20} /></button>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full max-w-5xl mx-auto">
                    <div className="flex-1 flex items-center gap-4 bg-white/60 backdrop-blur-md p-2 rounded-3xl border border-white/80 shadow-sm transition-all focus-within:shadow-xl focus-within:border-cyan/30 w-full">
                        <Search size={20} className="text-gray-300 ml-4" /><input placeholder="Buscar por nombre, SKU o categoría..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 bg-transparent outline-none text-sm font-bold text-gray-900 py-3" />
                    </div>
                    <div className="flex items-center gap-3">
                        <motion.button layout onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)} onMouseEnter={() => setIsFilterHovered(true)} onMouseLeave={() => setIsFilterHovered(false)} className={`h-14 flex items-center gap-2 px-6 rounded-3xl transition-all border ${isFilterPanelOpen ? 'bg-[#004d4d] text-white border-[#004d4d]' : 'bg-white border-white/80 text-slate-500 hover:text-[#004d4d] shadow-sm'}`}><Filter size={20}/><AnimatePresence>{isFilterHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black">Filtros</motion.span>}</AnimatePresence></motion.button>
                        <motion.button layout onClick={handleExport} onMouseEnter={() => setIsExportHovered(true)} onMouseLeave={() => setIsExportHovered(false)} className="h-14 flex items-center gap-2 px-6 rounded-3xl bg-white border border-white/80 text-slate-500 hover:text-emerald-600 shadow-sm"><Download size={20}/><AnimatePresence>{isExportHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black">Excel</motion.span>}</AnimatePresence></motion.button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab !== 'categories' ? (
                        <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/80 shadow-xl overflow-hidden">
                            <table className="w-full text-center">
                                <thead><tr className="bg-gray-50/50">{['Producto', 'Estado', 'Stock total', 'Precio unitario', 'Acciones'].map((h, i) => (<th key={i} className="px-10 py-6 text-center text-[10px] font-black text-[#004D4D] tracking-[0.2em]">{h}</th>))}</tr></thead>
                                <tbody className="divide-y divide-gray-100/50">
                                    {loading ? (<tr><td colSpan={5} className="py-20 text-center"><div className="h-12 w-12 border-4 border-[#004d4d] border-t-cyan rounded-full animate-spin mx-auto" /></td></tr>) : filteredProducts.length === 0 ? (<tr><td colSpan={5} className="py-20 text-center text-gray-300 font-black text-[10px]">Sin artículos</td></tr>) : (
                                        filteredProducts.map((p) => {
                                            const displayImage = Array.isArray(p.image_url) && p.image_url.length > 0 
                                                ? p.image_url[0] 
                                                : (typeof p.image_url === 'string' ? p.image_url : null);

                                            return (
                                                <tr key={p.id} className="hover:bg-white/60 transition-all cursor-pointer group">
                                                    <td className="px-10 py-8"><div className="flex items-center justify-center gap-4"><div className="h-14 w-14 rounded-2xl bg-gray-900 overflow-hidden shadow-lg group-hover:scale-110 transition-transform">{displayImage ? <img src={displayImage} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-white/20"><ImageIcon size={20}/></div>}</div><div className="text-left"><p className="text-sm font-black text-gray-900">{p.name}</p><p className="text-[9px] font-bold text-[#004D4D] italic">{p.collection?.title || 'General'}</p></div></div></td>
                                                    <td className="px-10 py-8"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest ${p.status === 'active' ? 'bg-[#004D4D] text-white' : 'bg-gray-100 text-gray-400'}`}>{p.status === 'active' ? 'Activo' : 'Borrador'}</span></td>
                                                    <td className="px-10 py-8 font-black text-slate-900"><div className="flex flex-col items-center"><span className={p.variants?.reduce((a:any,v:any)=>a+(v.stock||0),0) <= 5 ? 'text-rose-500' : ''}>{p.variants?.reduce((a:any,v:any)=>a+(v.stock||0),0) || 0}</span><span className="text-[8px] text-gray-400">unidades</span></div></td>
                                                    <td className="px-10 py-8 font-black text-[#004D4D] text-base"><AnimatedNumber value={p.price} /></td>
                                                    <td className="px-10 py-8"><div className="flex justify-center gap-2"><button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/products/${p.id}/edit`); }} className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 hover:text-[#004D4D] hover:bg-white transition-all flex items-center justify-center"><Edit3 size={16}/></button><button onClick={(e) => { e.stopPropagation(); setProductToDelete(p); }} className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center"><Trash2 size={16}/></button></div></td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </motion.div>
                    ) : (
                        <motion.div key="categories" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {categories.map(cat => (
                                <PremiumCard key={cat.id} className="p-8 group" onClick={() => { setSelectedCategory(cat); setCategoryView('intel'); }}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="h-14 w-14 rounded-2xl bg-[#004D4D]/5 flex items-center justify-center text-[#004D4D] group-hover:bg-[#004D4D] group-hover:text-white transition-all duration-500"><Layers size={24}/></div>
                                        <Trash2 size={16} className="text-gray-200 hover:text-rose-500 transition-colors" />
                                    </div>
                                    <h4 className="text-xl font-black text-gray-900 group-hover:text-[#004D4D] transition-colors italic tracking-tighter">{cat.title}</h4>
                                    <div className="mt-4 flex items-center justify-between">
                                        <p className="text-[10px] font-bold text-gray-400 tracking-widest">{products.filter(p => p.collection_id === cat.id).length} artículos</p>
                                        <ArrowUpRight size={16} className="text-[#004D4D] opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </PremiumCard>
                            ))}
                            <button onClick={() => setIsNewCategoryModalOpen(true)} className="border-2 border-dashed border-gray-200 rounded-[3rem] p-10 flex flex-col items-center justify-center gap-4 text-gray-400 hover:border-[#004D4D]/20 hover:text-[#004D4D] transition-all bg-white/20"><Plus size={40}/><span className="text-[10px] font-black tracking-widest">Añadir categoría</span></button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <MetricDetailModal isOpen={!!selectedMetric} onClose={() => setSelectedMetric(null)} metric={selectedMetric} />
            
            {/* MODAL DE LÍMITE DE PLAN (PREMIUM) */}
            <AnimatePresence>
                {isLimitModalOpen && (
                    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLimitModalOpen(false)} className="absolute inset-0 bg-[#001A1A]/90 backdrop-blur-2xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="relative bg-white w-full max-w-4xl rounded-[4rem] shadow-3xl border border-white overflow-hidden flex flex-col md:flex-row">
                            
                            {/* Lado Izquierdo: Estado AI */}
                            <div className="w-full md:w-80 bg-[#004D4D] p-12 text-white flex flex-col justify-between shrink-0 relative">
                                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"><div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#00f2ff] rounded-full blur-[80px]" /></div>
                                <div className="relative z-10 space-y-10">
                                    <div className="h-20 w-20 rounded-3xl bg-white/10 flex items-center justify-center border border-white/10 text-cyan shadow-xl"><Bot size={40} /></div>
                                    <div className="space-y-4">
                                        <h3 className="text-3xl font-black italic tracking-tighter leading-none">Análisis <br/><span className="text-cyan text-4xl">Bayt AI</span></h3>
                                        <p className="text-[10px] font-black tracking-widest text-cyan/60 uppercase">Capacidad del sistema</p>
                                    </div>
                                    <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10">
                                        <p className="text-[10px] font-black text-white/40 tracking-widest mb-2">Uso actual</p>
                                        <p className="text-4xl font-black italic">{products.length}<span className="text-lg text-cyan/50">/30</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Lado Derecho: Contenido y Acciones */}
                            <div className="flex-1 p-12 bg-white relative">
                                <button onClick={() => setIsLimitModalOpen(false)} className="absolute top-8 right-8 text-gray-300 hover:text-rose-500 transition-colors"><X size={24}/></button>
                                
                                <div className="h-full flex flex-col justify-center space-y-8">
                                    <div className="space-y-4">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${limitType === 'blocked' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
                                            {limitType === 'blocked' ? <ShieldCheck size={24}/> : <AlertCircle size={24}/>}
                                        </div>
                                        <h2 className="text-4xl font-black text-[#001A1A] tracking-tighter italic uppercase leading-none">
                                            {limitType === 'blocked' ? 'Límite de plan alcanzado' : '¡Casi llegas al límite!'}
                                        </h2>
                                        <p className="text-lg font-medium text-gray-500 italic leading-relaxed">
                                            {limitType === 'blocked' 
                                                ? 'Has aprovechado al máximo tu Plan Básico. Para seguir inyectando nuevos activos a tu flujo de caja, es momento de subir de nivel.' 
                                                : 'Tu catálogo está creciendo rápido. Estás a solo 10 productos de alcanzar el tope de tu plan actual.'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 space-y-2">
                                            <p className="text-[10px] font-black text-[#004D4D] tracking-widest uppercase">Beneficio Pro</p>
                                            <p className="text-sm font-bold text-gray-900">Catálogo Ilimitado</p>
                                            <p className="text-[10px] text-gray-400 font-medium italic">Vende cientos de productos sin restricciones.</p>
                                        </div>
                                        <div className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 space-y-2">
                                            <p className="text-[10px] font-black text-[#004D4D] tracking-widest uppercase">Extra Power</p>
                                            <p className="text-sm font-bold text-gray-900">Más imágenes y SEO</p>
                                            <p className="text-[10px] text-gray-400 font-medium italic">Optimización total para buscadores.</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                        <button 
                                            onClick={() => router.push('/planes')}
                                            className="flex-1 py-6 bg-gray-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 group"
                                        >
                                            <Sparkles size={18} className="text-cyan group-hover:animate-pulse" /> Ver planes y subir
                                        </button>
                                        {limitType === 'warning' && (
                                            <button 
                                                onClick={() => setIsLimitModalOpen(false)}
                                                className="px-8 py-6 bg-gray-100 text-gray-400 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-gray-200 transition-all"
                                            >
                                                Seguir vendiendo
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {selectedCategory && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 md:p-8">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCategory(null)} className="absolute inset-0 bg-[#001A1A]/90 backdrop-blur-2xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="relative bg-white w-full max-w-7xl h-[90vh] rounded-[4rem] shadow-3xl overflow-hidden border border-white/20 flex flex-col md:flex-row text-slate-900">
                            
                            {/* LATERAL IZQUIERDO: SCORE CARD */}
                            <div className="w-full md:w-96 bg-[#004D4D] p-12 text-white flex flex-col justify-between shrink-0 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"><div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#00f2ff] rounded-full blur-[80px]" /></div>
                                <div className="relative z-10 space-y-10">
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-3xl bg-white/10 flex items-center justify-center border border-white/10 text-cyan"><Layers size={32} /></div>
                                        <div><h3 className="text-2xl font-black italic tracking-tighter leading-none">{selectedCategory.title}</h3><p className="text-cyan text-[9px] font-black tracking-[0.2em] mt-2">Familia inteligente</p></div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 relative group">
                                            <p className="text-[10px] font-black text-white/40 tracking-widest mb-4 flex items-center gap-2"><Zap size={12} className="text-cyan" /> Salud de categoría</p>
                                            <div className="flex items-end justify-between"><span className="text-5xl font-black italic tracking-tighter">94<span className="text-xl text-cyan">/100</span></span><div className="h-12 w-12 rounded-full border-4 border-cyan border-t-transparent animate-spin duration-[3s]" /></div>
                                            <p className="text-[9px] font-bold text-emerald-400 mt-4">Rendimiento óptimo</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-6 rounded-3xl bg-white/5 border border-white/5"><p className="text-[8px] font-black text-white/30 mb-1">Conversión</p><span className="text-xl font-black italic">5.8%</span></div>
                                            <div className="p-6 rounded-3xl bg-white/5 border border-white/5"><p className="text-[8px] font-black text-white/30 mb-1">Impacto</p><span className="text-xl font-black italic">High</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative z-10 space-y-4">
                                    <button onClick={() => setCategoryView(categoryView === 'intel' ? 'list' : 'intel')} className={`w-full py-5 rounded-[2rem] font-black text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 border-2 ${categoryView === 'list' ? 'bg-cyan text-[#004D4D] border-cyan' : 'bg-transparent text-white border-white/20 hover:bg-white/10'}`}>
                                        {categoryView === 'intel' ? <><ShoppingBag size={18}/> Ver inventario</> : <><BarChart3 size={18}/> Ver inteligencia</>}
                                    </button>
                                    <button onClick={() => setSelectedCategory(null)} className="w-full py-5 bg-white text-[#004D4D] rounded-[2rem] font-black text-[10px] tracking-widest shadow-2xl hover:bg-cyan transition-all">Cerrar reporte</button>
                                </div>
                            </div>

                            {/* CONTENIDO PRINCIPAL: DASHBOARD PRO */}
                            <div className="flex-1 overflow-y-auto p-12 bg-[#FAFAFA] custom-scrollbar relative">
                                <AnimatePresence mode="wait">
                                    {categoryView === 'intel' ? (
                                        <motion.div key="intel" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8 relative overflow-hidden group">
                                                    <div className="flex justify-between items-center"><div className="space-y-1"><h4 className="text-xs font-black tracking-[0.2em] text-[#004D4D]">Interés de mercado</h4><p className="text-[9px] font-bold text-slate-400">Búsquedas y vistas mensuales</p></div><div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><TrendingUp size={20} /></div></div>
                                                    <div className="grid grid-cols-2 gap-10">
                                                        <div className="space-y-2"><span className="text-5xl font-black tracking-tighter text-slate-900 italic">28.4k</span><p className="text-[10px] font-bold text-slate-400 flex items-center gap-2"><Eye size={12} className="text-cyan" /> Vistas totales</p></div>
                                                        <div className="space-y-2 text-right"><span className="text-5xl font-black tracking-tighter text-cyan italic">1.2k</span><p className="text-[10px] font-bold text-slate-400 flex items-center gap-2 justify-end"><ShoppingBag size={12} className="text-emerald-500" /> Compras</p></div>
                                                    </div>
                                                    <div className="h-32 flex items-end gap-3 pt-6">
                                                        {[40, 70, 55, 90, 65, 80, 100, 70].map((h, i) => (
                                                            <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.05 }} className="flex-1 bg-gradient-to-t from-[#004D4D]/10 to-[#004D4D] rounded-t-xl hover:to-cyan transition-all" />
                                                        ))}
                                                    </div>
                                                </section>
                                                <section className="bg-[#001A1A] p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-10 opacity-10 text-cyan"><Bot size={150} /></div>
                                                    <div className="relative z-10 space-y-8">
                                                        <div className="flex items-center gap-4"><div className="h-12 w-12 rounded-2xl bg-cyan flex items-center justify-center text-[#001A1A]"><Bot size={24} /></div><h4 className="text-xs font-black tracking-[0.2em] text-cyan">Veredicto Bayt AI</h4></div>
                                                        <p className="text-lg font-bold text-white leading-tight italic">&quot;Esta categoría está experimentando un <span className="text-cyan">crecimiento orgánico del 12%</span>. Sugerimos ampliar el stock de accesorios vinculados.&quot;</p>
                                                        <div className="pt-4 flex flex-wrap gap-3"><div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-cyan">Viabilidad: 98%</div><div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-white/40">Riesgo: Mínimo</div></div>
                                                    </div>
                                                </section>
                                            </div>
                                            <section className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-12">
                                                <div className="flex items-center justify-between"><div className="space-y-1"><h4 className="text-xs font-black tracking-[0.2em] text-[#004D4D]">Origen del tráfico</h4><p className="text-[9px] font-bold text-slate-400">¿Desde dónde llegan los clientes?</p></div><div className="flex gap-4"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /><span className="text-[9px] font-black">WhatsApp (65%)</span></div><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" /><span className="text-[9px] font-black">Web (35%)</span></div></div></div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-16 items-center">
                                                    <div className="relative h-48 w-48 mx-auto"><svg className="w-full h-full" viewBox="0 0 36 36"><path className="text-slate-100" strokeDasharray="100, 100" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /><path className="text-emerald-500" strokeDasharray="65, 100" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-black italic text-slate-900">65%</span><span className="text-[8px] font-black text-emerald-500">WhatsApp</span></div></div>
                                                    <div className="md:col-span-2 space-y-8">
                                                        <div className="grid grid-cols-4 gap-4">
                                                            {[ { label: 'Mañana', val: 20, color: 'bg-slate-200' }, { label: 'Tarde', val: 45, color: 'bg-cyan' }, { label: 'Noche', val: 30, color: 'bg-[#004D4D]' }, { label: 'Madrugada', val: 5, color: 'bg-slate-100' } ].map((time) => (
                                                                <div key={time.label} className="space-y-4">
                                                                    <div className="h-40 bg-slate-50 rounded-3xl relative overflow-hidden flex flex-col justify-end p-1"><motion.div initial={{ height: 0 }} animate={{ height: `${time.val}%` }} className={`${time.color} w-full rounded-2xl shadow-lg`} /></div>
                                                                    <div className="text-center"><p className="text-sm font-black text-slate-900">{time.val}%</p><p className="text-[8px] font-black text-slate-400">{time.label}</p></div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                                            <div className="flex items-center justify-between text-slate-900"><div className="space-y-1"><h4 className="text-3xl font-black italic text-[#001A1A] tracking-tighter">Inventario en <span className="text-[#004D4D]">{selectedCategory.title}</span></h4><p className="text-[10px] font-bold text-slate-400 tracking-widest">Items vinculados a esta familia</p></div></div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                                {products.filter(p => p.collection_id === selectedCategory.id || p.category === selectedCategory.title).map(p => (
                                                    <div key={p.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden">
                                                        <div className="aspect-square w-full bg-slate-50 rounded-[2rem] mb-6 overflow-hidden relative border border-gray-50">{p.image_url ? <img src={p.image_url} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="h-full w-full flex items-center justify-center text-slate-200"><ImageIcon size={48}/></div>}</div>
                                                        <h5 className="text-lg font-black text-slate-900 group-hover:text-[#004D4D] transition-colors">{p.name}</h5>
                                                        <div className="mt-4 flex items-center justify-between"><div><p className="text-[9px] font-bold text-slate-400">SKU</p><p className="text-xs font-black text-slate-700">{p.variants?.[0]?.sku || 'S/N'}</p></div><div className="text-right"><p className="text-[9px] font-bold text-slate-400">Precio</p><p className="text-sm font-black text-[#004D4D]">${p.price.toLocaleString()}</p></div></div>
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

            {/* GUIA OPERATIVA PLATINUM PLUS */}
            <AnimatePresence>
                {isGuideOpen && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 md:p-8">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuideOpen(false)} className="absolute inset-0 bg-[#001A1A]/90 backdrop-blur-2xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="relative bg-white w-full max-w-6xl h-[85vh] rounded-[4rem] shadow-3xl overflow-hidden border border-white/20 flex flex-col md:flex-row text-slate-900">
                            <button onClick={() => setIsGuideOpen(false)} className="absolute top-8 right-8 h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#004D4D] hover:bg-white transition-all z-[1600] shadow-sm"><X size={24} /></button>
                            <div className="w-full md:w-80 bg-gray-50 border-r border-gray-100 p-10 flex flex-col shrink-0">
                                <div className="mb-10"><div className="flex items-center gap-3 mb-2"><div className="h-2 w-2 rounded-full bg-[#004D4D] animate-pulse" /><span className="text-[10px] font-black tracking-[0.2em] text-[#004D4D]/60">Tutorial maestro</span></div><h3 className="text-2xl font-black italic text-[#001A1A] tracking-tighter leading-none">Gestión de <span className="text-[#004D4D]">activos</span></h3></div>
                                <div className="space-y-2 flex-1">
                                    {(Object.entries(guideContent) as any).map(([key, item]: any) => (
                                        <button key={key} onClick={() => setActiveGuideTab(key)} className={`w-full flex items-center gap-4 p-4 rounded-[1.5rem] transition-all text-left group ${activeGuideTab === key ? 'bg-white shadow-xl shadow-gray-200/50 scale-[1.02] border border-white' : 'hover:bg-white/50 text-gray-400'}`}>
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${activeGuideTab === key ? 'bg-[#004D4D] text-white' : 'bg-gray-100 group-hover:bg-white'}`}>{item.icon}</div>
                                            <span className={`text-[10px] font-black tracking-widest ${activeGuideTab === key ? 'text-gray-900' : ''}`}>{item.title.split(' ')[0]}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-auto pt-8 border-t border-gray-100"><div className="bg-[#004D4D] p-6 rounded-3xl text-white relative overflow-hidden group cursor-help"><div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><Bot size={80}/></div><p className="text-[10px] font-black tracking-[0.2em] mb-2 text-cyan">Soporte AI</p><p className="text-[11px] font-medium leading-relaxed italic opacity-80">¿Necesitas ayuda extra? Bayt AI puede registrar tus productos por voz.</p></div></div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-12 bg-white custom-scrollbar relative">
                                <AnimatePresence mode="wait">
                                    <motion.div key={activeGuideTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                                        <div className="space-y-6"><div className="flex items-center gap-4"><div className={`h-16 w-16 rounded-[1.8rem] flex items-center justify-center ${guideContent[activeGuideTab as keyof typeof guideContent].color} bg-white shadow-xl border border-gray-50`}>{guideContent[activeGuideTab as keyof typeof guideContent].icon}</div><div><h2 className="text-4xl font-black text-gray-900 tracking-tighter italic">{guideContent[activeGuideTab as keyof typeof guideContent].title}</h2><p className="text-gray-400 text-xs font-bold tracking-widest mt-1">Propósito formativo & táctico</p></div></div><p className="text-lg font-medium text-gray-600 leading-relaxed max-w-3xl italic">&quot;{guideContent[activeGuideTab as keyof typeof guideContent].description}&quot;</p></div>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 flex flex-col justify-between group"><div><h4 className="text-[10px] font-black text-gray-400 tracking-widest mb-6 flex items-center gap-2"><Activity size={12} className="text-[#004D4D]" /> Métrica de impacto</h4><div className="flex items-end gap-4"><span className="text-6xl font-black italic text-gray-900 tracking-tighter">{guideContent[activeGuideTab as keyof typeof guideContent].kpi.val}</span><div className="mb-2 h-10 w-px bg-gray-200" /><p className="text-[10px] font-bold text-[#004D4D] leading-tight mb-2">{guideContent[activeGuideTab as keyof typeof guideContent].kpi.label}</p></div></div><div className="mt-8 h-2 w-full bg-white rounded-full overflow-hidden border border-gray-100 shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-gradient-to-r from-[#004D4D] to-cyan rounded-full" /></div></div><div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4"><h4 className="text-[10px] font-black text-gray-400 tracking-widest flex items-center gap-2"><Target size={14} className="text-rose-500" /> ¿Por qué es vital?</h4><p className="text-sm font-medium text-gray-600 leading-relaxed">{guideContent[activeGuideTab as keyof typeof guideContent].whyImportant}</p></div></div>
                                        <div className="bg-[#001A1A] p-10 rounded-[3rem] text-white relative overflow-hidden isolate"><div className="absolute top-0 right-0 p-8 opacity-5 -z-10 rotate-12"><Bot size={150}/></div><div className="flex items-center gap-4 mb-6"><div className="h-10 w-10 rounded-xl bg-cyan flex items-center justify-center text-[#001A1A] shadow-[0_0_15px_rgba(0,242,255,0.3)]"><Bot size={20} /></div><h4 className="text-xs font-black tracking-[0.2em] text-cyan">Estrategia Bayt AI</h4></div><p className="text-lg font-bold italic leading-tight text-white/90">&quot;{guideContent[activeGuideTab as keyof typeof guideContent].baytTip}&quot;</p><div className="mt-8 flex items-center gap-3"><div className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" /><span className="text-[9px] font-black tracking-[0.2em] text-cyan/60">Análisis predictivo de catálogo v2.0</span></div></div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Nueva Categoría */}
            <AnimatePresence>{isNewCategoryModalOpen && (<div className="fixed inset-0 z-[1000] flex items-center justify-center p-4"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNewCategoryModalOpen(false)} className="absolute inset-0 bg-[#001A1A]/80 backdrop-blur-xl" /><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl p-10 text-slate-900 border border-white"><h3 className="text-2xl font-black italic text-[#001A1A] tracking-tighter">Nueva <span className="text-[#004D4D]">categoría</span></h3><div className="space-y-6 mt-8"><div className="space-y-2"><label className="text-[9px] font-black text-gray-400 tracking-widest ml-1">Nombre</label><input value={newCategoryData.name} onChange={e => setNewCategoryData({...newCategoryData, name: e.target.value})} placeholder="Ej: Accesorios Premium" className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-bold text-slate-900 shadow-inner" /></div><button onClick={handleCreateCategory} disabled={isCreatingCategory} className="w-full py-5 bg-[#004D4D] text-white rounded-2xl font-black text-[10px] tracking-widest shadow-xl">{isCreatingCategory ? 'Creando...' : 'Guardar categoría'}</button></div></motion.div></div>)}</AnimatePresence>

            {/* Modal Confirmar Eliminación de Producto */}
            <AnimatePresence>
                {productToDelete && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setProductToDelete(null)} className="absolute inset-0 bg-[#001A1A]/80 backdrop-blur-xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl p-12 text-center border border-white">
                            <div className="flex justify-center mb-8">
                                <div className="h-24 w-24 rounded-[2.5rem] bg-rose-50 flex items-center justify-center text-rose-500 animate-bounce">
                                    <AlertCircle size={48} />
                                </div>
                            </div>
                            <h3 className="text-3xl font-black italic text-[#001A1A] tracking-tighter">¿Eliminar <span className="text-rose-600">activo?</span></h3>
                            <p className="text-gray-400 font-medium text-sm mt-4 leading-relaxed italic">
                                Esta acción eliminará permanentemente a <span className="text-gray-900 font-bold">&quot;{productToDelete.name}&quot;</span> de tu catálogo. ¿Deseas continuar?
                            </p>
                            <div className="grid grid-cols-2 gap-4 mt-10">
                                <button onClick={() => setProductToDelete(null)} className="py-5 bg-gray-100 text-gray-400 rounded-2xl font-black text-[10px] tracking-widest hover:bg-gray-200 transition-all">Cancelar</button>
                                <button onClick={handleDeleteProduct} disabled={isDeletingProduct} className="py-5 bg-rose-600 text-white rounded-2xl font-black text-[10px] tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all">
                                    {isDeletingProduct ? 'Eliminando...' : 'Sí, eliminar'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL IMPORTAR CATÁLOGO (PREMIUM) */}
            <AnimatePresence>
                {isImportModalOpen && (
                    <div className="fixed inset-0 z-[3500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsImportModalOpen(false)} className="absolute inset-0 bg-[#001A1A]/90 backdrop-blur-2xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="relative bg-white w-full max-w-xl rounded-[4rem] shadow-3xl border border-white p-12 overflow-hidden">
                            <div className="text-center mb-10">
                                <div className="h-20 w-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto text-emerald-600 mb-6 shadow-inner"><Download size={40} className="rotate-180" /></div>
                                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">Importador <span className="text-emerald-600">Masivo</span></h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Carga cientos de productos en segundos</p>
                            </div>

                            <div className="space-y-8">
                                <div 
                                    className={`border-2 border-dashed rounded-[2.5rem] p-12 text-center transition-all ${importFile ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-100 hover:border-[#004D4D]/30'}`}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => { e.preventDefault(); setImportFile(e.dataTransfer.files[0]); }}
                                >
                                    {importFile ? (
                                        <div className="space-y-4">
                                            <p className="text-sm font-black text-gray-900 italic">{importFile.name}</p>
                                            <button onClick={() => setImportFile(null)} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">Cambiar archivo</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <p className="text-sm font-black text-gray-400">Arrastra tu Excel o CSV aquí</p>
                                            <input type="file" accept=".xlsx,.xls,.csv" onChange={e => setImportFile(e.target.files?.[0] || null)} className="hidden" id="fileImport" />
                                            <label htmlFor="fileImport" className="inline-block px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:scale-105 transition-all">Seleccionar archivo</label>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-50 rounded-[2rem] p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm"><Activity size={20}/></div>
                                        <div><p className="text-[10px] font-black text-gray-900 uppercase">¿No tienes el formato?</p><p className="text-[9px] text-gray-400 font-bold italic">Usa nuestra plantilla oficial</p></div>
                                    </div>
                                    <button onClick={handleDownloadTemplate} className="px-6 py-3 bg-white border border-gray-100 rounded-xl font-black text-[9px] uppercase tracking-widest text-[#004D4D] hover:bg-[#004D4D] hover:text-white transition-all shadow-sm">Descargar</button>
                                </div>

                                <button 
                                    onClick={handleImportSubmit} 
                                    disabled={!importFile || isImporting}
                                    className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center justify-center gap-4 ${!importFile || isImporting ? 'bg-gray-100 text-gray-300' : 'bg-[#004D4D] text-white hover:bg-black hover:scale-[1.02]'}`}
                                >
                                    {isImporting ? <Loader2 className="animate-spin" size={20}/> : <><Rocket size={20}/> Iniciar Importación</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
            `}</style>
        </div>
    );
}
