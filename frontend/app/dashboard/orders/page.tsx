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
  Store,
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
  DollarSign,
  Clock,
  ShieldCheck,
  FileText,
  Printer,
  User
} from 'lucide-react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { apiRequest } from '@/lib/api';
import MetricDetailModal from '@/components/dashboard/MetricDetailModal';
import { exportOrdersToExcel } from '@/lib/orders-export';

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
            animate={{ rotateX, rotateY, scale: rotateX !== 0 ? 1.05 : 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 25 }}
            className={`bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/80 shadow-[0_40px_80px_-15px_rgba(0,77,77,0.15)] cursor-pointer overflow-hidden relative group isolate ${className}`}
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
        >
            <div style={{ transform: "translateZ(30px)" }}>{children}</div>
            <div className="absolute -bottom-20 -right-20 h-40 w-40 bg-[#004d4d]/5 blur-[80px] rounded-full -z-10" />
        </motion.div>
    );
};

// --- TYPES ---
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'delayed';

interface Order {
    id: string;
    customer_name: string;
    total_price: number;
    status: OrderStatus;
    source: string;
    created_at: string;
    items?: any[];
}

export default function OrdersPage() {
    const { token, userEmail } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    
    const [orders, setOrders] = useState<Order[]>([]);
    const [allRawOrders, setAllRawOrders] = useState<any[]>([]); 
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<'all' | OrderStatus>('all');
    const [selectedMetric, setSelectedMetric] = useState<any>(null);
    
    // UI States
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [activeGuideTab, setActiveGuideTab] = useState('overview');

    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    const fetchOrders = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [ordersData, productsData] = await Promise.all([
                apiRequest<any[]>('/orders', { token }),
                apiRequest<any[]>('/products', { token })
            ]);
            
            if (ordersData) {
                setAllRawOrders(ordersData);
                const webOrders = ordersData.filter(o => o.source?.toLowerCase() !== 'pos');
                setOrders(webOrders);
            }
            if (productsData) setProducts(productsData);
        } catch (err) {
            console.error(err);
            showToast("Error al sincronizar datos", "error");
        } finally {
            setLoading(false);
        }
    }, [token, showToast]);

    const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
        try {
            await apiRequest(`/orders/${orderId}/status`, {
                method: 'PATCH',
                token,
                body: JSON.stringify({ status: newStatus })
            });
            showToast(`Pedido actualizado a ${newStatus} ✨`, "success");
            fetchOrders();
            if (newStatus === 'processing') {
                // Lógica de envío de factura automática por WhatsApp aquí si es necesario
            }
        } catch (e) {
            showToast("Error al actualizar estado", "error");
        }
    };

    useEffect(() => { 
        fetchOrders(); 
        const handleFocus = () => fetchOrders();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [fetchOrders]);

    const kpis = useMemo(() => {
        // 1. Total Pedidos Web
        const totalOrdersCount = orders.length;
        
        // 2. Items Activos (Total de productos en catálogo)
        const activeItemsCount = products.length;

        // 3. Stock Crítico
        const lowStockProducts = products.filter(p => (p.variants?.reduce((a:any,v:any)=>a+(v.stock||0),0) || 0) <= 5);
        const criticalCount = lowStockProducts.length;

        // 4. Ticket Promedio
        const totalRevenue = orders.reduce((acc, o) => acc + (o.total_price || 0), 0);
        const avgTicket = totalOrdersCount > 0 ? (totalRevenue / totalOrdersCount) : 0;

        // --- Lógica de Modales ---
        
        // Top 3 Productos (Web)
        const productSales: Record<string, number> = {};
        orders.forEach(o => o.items?.forEach((i: any) => {
            const name = i.product_variant?.product?.name || "Producto";
            productSales[name] = (productSales[name] || 0) + i.quantity;
        }));
        const top3Products = Object.entries(productSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, qty]) => ({ l: name, v: `${qty} uds`, icon: <Package size={14}/> }));

        // Categorías más compradas
        const categorySales: Record<string, number> = {};
        orders.forEach(o => o.items?.forEach((i: any) => {
            const cat = i.product_variant?.product?.category || "General";
            categorySales[cat] = (categorySales[cat] || 0) + i.quantity;
        }));
        const topCategories = Object.entries(categorySales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, qty]) => ({ l: name, v: `${qty} uds`, icon: <Layers size={14}/> }));

        // Últimas Ventas POS vs Web
        const lastWeb = allRawOrders.filter(o => o.source?.toLowerCase() !== 'pos')[0];
        const lastPOS = allRawOrders.filter(o => o.source?.toLowerCase() === 'pos')[0];

        return [
            { 
                id: 'total', 
                label: 'Total Pedidos', 
                value: totalOrdersCount, 
                icon: <ShoppingBag size={24}/>, 
                color: 'text-cyan-600', 
                bg: 'bg-cyan-50', 
                trend: 'Digital', 
                isSimple: true,
                details: top3Products,
                advice: "Estos son tus productos estrella en la web. Considera destacarlos en el banner principal."
            },
            { 
                id: 'active', 
                label: 'Ítems Activos', 
                value: activeItemsCount, 
                icon: <Layers size={24}/>, 
                color: 'text-purple-600', 
                bg: 'bg-purple-50', 
                trend: 'Catálogo', 
                isSimple: true,
                details: topCategories,
                advice: "Tus categorías más dinámicas. Asegúrate de tener siempre stock de seguridad para estos grupos."
            },
            { 
                id: 'stock', 
                label: 'Stock Crítico', 
                value: criticalCount, 
                icon: <AlertCircle size={24}/>, 
                color: 'text-rose-600', 
                bg: 'bg-rose-50', 
                trend: 'Atención', 
                isSimple: true,
                details: lowStockProducts.slice(0, 3).map(p => ({ l: p.name, v: "Agotándose", icon: <Zap size={14}/> })),
                advice: `¡Alerta! ${criticalCount} productos están en stock crítico pero los clientes siguen buscándolos en tu web.`
            },
            { 
                id: 'average', 
                label: 'Ticket Promedio', 
                value: avgTicket, 
                icon: <Target size={24}/>, 
                color: 'text-[#004d4d]', 
                bg: 'bg-[#004d4d]/5', 
                trend: 'Market OK',
                isCurrency: true,
                details: [
                    { l: "Última Web", v: `$ ${(lastWeb?.total_price || 0).toLocaleString()}`, icon: <Globe size={14}/> },
                    { l: "Última POS", v: `$ ${(lastPOS?.total_price || 0).toLocaleString()}`, icon: <Store size={14}/> }
                ],
                advice: "Compara tu rendimiento físico vs digital para ajustar tus estrategias de envío gratuito."
            }
        ];
    }, [orders, products, allRawOrders]);

    const handleExport = async () => {
        if (orders.length === 0) {
            showToast("No hay pedidos para exportar", "info");
            return;
        }
        try {
            showToast("Generando Auditoría de Ventas...", "info");
            await exportOrdersToExcel(orders, "Bayup_Tienda");
            showToast("¡Historial exportado! 📊", "success");
        } catch (e) {
            showToast("Error al generar el archivo", "error");
        }
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const matchesSearch = o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'all' || o.status === activeTab;
            return matchesSearch && matchesTab;
        });
    }, [orders, searchTerm, activeTab]);

    const guideContent = {
        overview: { title: 'Flujo de Ventas', icon: <LayoutGrid size={20}/>, color: 'text-slate-600', description: 'Central de monitoreo transaccional. Aquí ves el ciclo completo de tus ventas.', whyImportant: 'Controlar cada etapa evita pedidos olvidados y mejora el flujo de caja.', kpi: { label: 'Eficiencia Cierre', val: '94%' }, baytTip: 'Prioriza siempre los pedidos "Por Facturar" para agilizar el despacho.' },
        pending: { title: 'Nuevos Pedidos', icon: <Clock size={20}/>, color: 'text-amber-500', description: 'Ventas recién ingresadas que esperan validación.', whyImportant: 'Un tiempo de respuesta menor a 30 min aumenta la recompra en un 25%.', kpi: { label: 'Lead Time', val: '15m' }, baytTip: 'Si el pedido es de un cliente "Mayorista", validad el stock antes de confirmar.' },
        processing: { title: 'En Alistamiento', icon: <Zap size={20}/>, color: 'text-blue-500', description: 'Pedidos en etapa de empaque y generación de guía.', whyImportant: 'Es la fase donde más errores humanos pueden ocurrir. Verifica el SKU.', kpi: { label: 'Precisión Packing', val: '99.8%' }, baytTip: 'Usa el escáner de códigos de barras para evitar enviar tallas incorrectas.' },
        delayed: { title: 'Gestión Alertas', icon: <AlertCircle size={20}/>, color: 'text-rose-500', description: 'Pedidos con novedades o retrasos críticos.', whyImportant: 'Resolver un retraso proactivamente salva la relación con el cliente.', kpi: { label: 'Recuperación', val: '88%' }, baytTip: 'Llama al cliente de inmediato si detectas una novedad en la transportadora.' }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 pb-20 animate-in fade-in duration-1000">
            
            {/* 1. HEADER PLATINUM */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#00f2ff] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#004d4d]/60 italic">Monitor de Órdenes v2.0</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-[#001A1A]">
                        PEDI<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-[#004d4d]">DOS</span>
                    </h1>
                    <p className="text-gray-400 font-medium text-lg italic max-w-2xl mt-4">
                        ¡Aquí encontrarás todos los pedidos que tienes en tu web! 📦
                    </p>
                </div>
            </header>

            {/* 2. GRID DE MÉTRICAS PEDIDOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                {kpis.map((kpi, i) => (
                    <div key={i} onClick={() => setSelectedMetric(kpi)}>
                        <PremiumCard className="p-8 group h-full">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg group-hover:scale-110 border border-white/50 ${kpi.bg} ${kpi.color}`}>
                                    {kpi.icon}
                                </div>
                                <div className="px-3 py-1 bg-gray-100 rounded-full text-[9px] font-black uppercase tracking-wider text-gray-400">
                                    {kpi.trend}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">{kpi.label}</p>
                                <h3 className="text-3xl font-black text-gray-900 tracking-tighter italic">
                                    <AnimatedNumber value={kpi.value} type={kpi.isSimple ? 'simple' : 'currency'} />
                                </h3>
                            </div>
                        </PremiumCard>
                    </div>
                ))}
            </div>

            {/* 3. NAVEGACIÓN CENTRAL Y BÚSQUEDA TÁCTICA */}
            <div className="px-4 space-y-10">
                <div className="flex justify-center items-center gap-4 relative z-20">
                    <div className="p-1.5 bg-white/60 backdrop-blur-xl border border-white/80 rounded-full shadow-2xl flex items-center overflow-x-auto no-scrollbar relative">
                        {([
                            { id: 'all', label: 'Todos' },
                            { id: 'pending', label: 'Pendientes' },
                            { id: 'processing', label: 'Proceso' },
                            { id: 'shipped', label: 'Enviados' },
                            { id: 'completed', label: 'Éxito' },
                            { id: 'delayed', label: 'Alertas' }
                        ] as const).map((tab) => (
                            <button 
                                key={tab.id} 
                                onClick={() => setActiveTab(tab.id as any)} 
                                className={`relative px-10 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 z-10 whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-[#004D4D]'}`}
                            >
                                {activeTab === tab.id && (
                                    <motion.div layoutId="activeOrderTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                )}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={() => setIsGuideOpen(true)}
                        className="h-12 w-12 rounded-full bg-white border border-gray-100 text-[#004d4d] flex items-center justify-center hover:scale-110 hover:bg-[#004d4d] hover:text-white transition-all shadow-xl active:scale-95 group"
                    >
                        <Info size={20} />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full max-w-5xl mx-auto">
                    <div className="flex-1 flex items-center gap-4 bg-white/60 backdrop-blur-md p-2 rounded-3xl border border-white/80 shadow-sm transition-all focus-within:shadow-xl focus-within:border-cyan/30 w-full">
                        <Search size={20} className="text-gray-300 ml-4" />
                        <input 
                            placeholder="Buscar por ID, nombre de cliente o canal..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="flex-1 bg-transparent outline-none text-sm font-bold text-gray-900 py-3" 
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <motion.button 
                            layout 
                            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                            onMouseEnter={() => setIsFilterHovered(true)} 
                            onMouseLeave={() => setIsFilterHovered(false)} 
                            className={`h-14 flex items-center gap-2 px-6 rounded-3xl transition-all border ${isFilterPanelOpen ? 'bg-[#004d4d] text-white border-[#004d4d]' : 'bg-white border-white/80 text-slate-500 hover:text-[#004d4d] shadow-sm'}`}
                        >
                            {isFilterPanelOpen ? <FilterX size={20}/> : <Filter size={20}/>}
                            <AnimatePresence>{isFilterHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase">Filtros</motion.span>}</AnimatePresence>
                        </motion.button>
                        <motion.button 
                            layout 
                            onClick={handleExport}
                            onMouseEnter={() => setIsExportHovered(true)} 
                            onMouseLeave={() => setIsExportHovered(false)} 
                            className="h-14 flex items-center gap-2 px-6 rounded-3xl bg-white border border-white/80 text-slate-500 hover:text-emerald-600 transition-all shadow-sm"
                        >
                            <Download size={20}/> 
                            <AnimatePresence>{isExportHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase">Excel</motion.span>}</AnimatePresence>
                        </motion.button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/80 shadow-xl overflow-hidden">
                        <table className="w-full text-center">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    {['ID Pedido', 'Cliente', 'Estado', 'Total', 'Acciones'].map((h, i) => (
                                        <th key={i} className="px-10 py-6 text-center text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em]">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/50">
                                {loading ? (
                                    <tr><td colSpan={5} className="py-20 text-center"><div className="h-12 w-12 border-4 border-[#004d4d] border-t-cyan rounded-full animate-spin mx-auto" /></td></tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr><td colSpan={5} className="py-20 text-center text-gray-300 font-black uppercase text-[10px]">Sin movimientos registrados</td></tr>
                                ) : filteredOrders.map((o) => (
                                    <tr key={o.id} className="hover:bg-white/60 transition-all cursor-pointer group">
                                        <td className="px-10 py-8 font-black text-gray-900">#{o.id.slice(0, 8).toUpperCase()}</td>
                                        <td className="px-10 py-8">
                                            <p className="text-sm font-black text-gray-900">{o.customer_name}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">{o.source || 'Tienda'}</p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                o.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                                                o.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                                o.status === 'delayed' ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-400'
                                            }`}>
                                                {o.status === 'completed' ? 'Exitoso' : 
                                                 o.status === 'pending' ? 'Pendiente' : 
                                                 o.status === 'delayed' ? 'Alerta' : o.status}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 font-black text-[#004D4D] text-base">
                                            <AnimatedNumber value={o.total_price} />
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => setSelectedOrder(o)} className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 hover:text-[#004D4D] hover:bg-white transition-all shadow-sm flex items-center justify-center" title="Ver Detalle"><Eye size={16}/></button>
                                                
                                                {o.status === 'pending' && (
                                                    <button onClick={() => handleUpdateStatus(o.id, 'processing')} className="px-4 h-10 rounded-xl bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2">
                                                        Confirmar
                                                    </button>
                                                )}

                                                {o.status === 'processing' && (
                                                    <button onClick={() => handleUpdateStatus(o.id, 'shipped')} className="px-4 h-10 rounded-xl bg-[#004D4D] text-white font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2">
                                                        Despachar
                                                    </button>
                                                )}

                                                {o.status === 'shipped' && (
                                                    <button onClick={() => handleUpdateStatus(o.id, 'completed')} className="px-4 h-10 rounded-xl bg-cyan text-gray-900 font-black text-[9px] uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-lg flex items-center gap-2">
                                                        Entregado
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* MODAL DETALLE DE PEDIDO (PLATINUM) */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-8">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-[#001A1A]/90 backdrop-blur-2xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="relative bg-white w-full max-w-4xl rounded-[4rem] shadow-3xl overflow-hidden border border-white/20 flex flex-col md:flex-row text-slate-900">
                            
                            {/* LATERAL: RESUMEN RÁPIDO */}
                            <div className="w-full md:w-80 bg-[#004D4D] p-12 text-white flex flex-col justify-between shrink-0 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"><div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-cyan rounded-full blur-[80px]" /></div>
                                <div className="relative z-10 space-y-10">
                                    <div className="space-y-4">
                                        <div className="h-16 w-16 rounded-3xl bg-white/10 flex items-center justify-center border border-white/10 text-cyan"><Package size={32} /></div>
                                        <div>
                                            <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">PEDIDO</h3>
                                            <p className="text-cyan text-[10px] font-black uppercase tracking-[0.2em] mt-2">#{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10">
                                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Total Liquidado</p>
                                            <span className="text-3xl font-black italic text-white">${selectedOrder.total_price.toLocaleString()}</span>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-cyan animate-pulse" /><span className="text-[10px] font-black uppercase tracking-widest text-white/60">Estado: {selectedOrder.status}</span></div>
                                            <div className="flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-white/20" /><span className="text-[10px] font-black uppercase tracking-widest text-white/60">Canal: {selectedOrder.source || 'Tienda'}</span></div>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="relative z-10 w-full py-5 bg-white text-[#004D4D] rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-cyan transition-all">Cerrar Detalle</button>
                            </div>

                            {/* CONTENIDO: DETALLE TÉCNICO */}
                            <div className="flex-1 overflow-y-auto p-12 bg-[#FAFAFA] custom-scrollbar space-y-10">
                                <section className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><User size={14} className="text-[#004D4D]"/> Datos del Cliente</h4>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div><p className="text-[9px] font-bold text-gray-400 uppercase">Nombre Completo</p><p className="text-sm font-black text-gray-900">{selectedOrder.customer_name}</p></div>
                                        <div><p className="text-[9px] font-bold text-gray-400 uppercase">Email / Contacto</p><p className="text-sm font-black text-gray-900">{selectedOrder.customer_email || 'No registrado'}</p></div>
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><ShoppingBag size={14} className="text-[#004D4D]"/> Artículos Adquiridos</h4>
                                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                                        <div className="divide-y divide-gray-50">
                                            {selectedOrder.items?.map((item: any, i: number) => (
                                                <div key={i} className="p-6 flex items-center justify-between group hover:bg-gray-50 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden">
                                                            {item.product_variant?.product?.image_url ? (
                                                                <img src={item.product_variant.product.image_url} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <Package size={20}/>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-gray-900">{item.product_variant?.product?.name || 'Producto'}</p>
                                                            <p className="text-[9px] font-bold text-[#004D4D] uppercase">
                                                                {item.product_variant?.name !== 'Estándar' ? item.product_variant?.name : 'Genérico'} | Cant: {item.quantity}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-gray-900">${(item.price_at_purchase * item.quantity).toLocaleString()}</p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Unit: ${item.price_at_purchase.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                                                <div className="p-10 text-center text-gray-300 italic text-xs">Información de ítems no disponible en esta versión</div>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <div className="pt-6 flex justify-between items-center">
                                    <div className="flex items-center gap-4 text-gray-400">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[9px] font-black uppercase tracking-widest">Operación Registrada: {new Date(selectedOrder.created_at).toLocaleString()}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button className="h-12 w-12 rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-[#004D4D] shadow-sm flex items-center justify-center transition-all"><Printer size={18}/></button>
                                        <button className="h-12 px-8 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">Generar Guía</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <MetricDetailModal isOpen={!!selectedMetric} onClose={() => setSelectedMetric(null)} metric={selectedMetric} />
            
            {/* TUTORIAL MAESTRO DE PEDIDOS */}
            <AnimatePresence>
                {isGuideOpen && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 md:p-8">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuideOpen(false)} className="absolute inset-0 bg-[#001A1A]/90 backdrop-blur-2xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="relative bg-white w-full max-w-6xl h-[85vh] rounded-[4rem] shadow-3xl overflow-hidden border border-white/20 flex flex-col md:flex-row text-slate-900">
                            
                            <button onClick={() => setIsGuideOpen(false)} className="absolute top-8 right-8 h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#004D4D] hover:bg-white transition-all z-[1600] shadow-sm">
                                <X size={24} />
                            </button>

                            <div className="w-full md:w-80 bg-gray-50 border-r border-gray-100 p-10 flex flex-col shrink-0">
                                <div className="mb-10">
                                    <div className="flex items-center gap-3 mb-2"><div className="h-2 w-2 rounded-full bg-[#004D4D] animate-pulse" /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004D4D]/60">Tutorial Maestro</span></div>
                                    <h3 className="text-2xl font-black italic uppercase text-[#001A1A] tracking-tighter leading-none">Gestión de <span className="text-[#004D4D]">Ventas</span></h3>
                                </div>
                                <div className="space-y-2 flex-1">
                                    {(Object.entries(guideContent) as any).map(([key, item]: any) => (
                                        <button key={key} onClick={() => setActiveGuideTab(key)} className={`w-full flex items-center gap-4 p-4 rounded-[1.5rem] transition-all text-left group ${activeGuideTab === key ? 'bg-white shadow-xl border border-white scale-[1.02]' : 'hover:bg-white/50 text-gray-400'}`}>
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${activeGuideTab === key ? 'bg-[#004D4D] text-white' : 'bg-gray-100'}`}>{item.icon}</div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${activeGuideTab === key ? 'text-gray-900' : ''}`}>{item.title.split(' ')[0]}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-auto pt-8 border-t border-gray-100"><div className="bg-[#004D4D] p-6 rounded-3xl text-white relative overflow-hidden group cursor-help"><div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><Bot size={80}/></div><p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-cyan">Bayt Sales</p><p className="text-[11px] font-medium leading-relaxed italic opacity-80">Bayt analiza tus tendencias de venta para predecir picos de demanda.</p></div></div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-12 bg-white custom-scrollbar relative">
                                <AnimatePresence mode="wait">
                                    <motion.div key={activeGuideTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-16 w-16 rounded-[1.8rem] flex items-center justify-center ${guideContent[activeTab as keyof typeof guideContent]?.color || 'text-slate-600'} bg-white shadow-xl border border-gray-50`}>{guideContent[activeGuideTab as keyof typeof guideContent].icon}</div>
                                                <div><h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">{guideContent[activeGuideTab as keyof typeof guideContent].title}</h2><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Excelencia Operativa</p></div>
                                            </div>
                                            <p className="text-lg font-medium text-gray-600 leading-relaxed max-w-3xl italic">&quot;{guideContent[activeGuideTab as keyof typeof guideContent].description}&quot;</p>
                                        </div>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 flex flex-col justify-between group">
                                                <div>
                                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Activity size={12} className="text-[#004D4D]" /> Métrica Clave</h4>
                                                    <div className="flex items-end gap-4"><span className="text-6xl font-black italic text-gray-900 tracking-tighter">{guideContent[activeGuideTab as keyof typeof guideContent].kpi.val}</span><div className="mb-2 h-10 w-px bg-gray-200" /><p className="text-[10px] font-bold text-[#004D4D] uppercase leading-tight mb-2">{guideContent[activeGuideTab as keyof typeof guideContent].kpi.label}</p></div>
                                                </div>
                                                <div className="mt-8 h-2 w-full bg-white rounded-full overflow-hidden border border-gray-100 shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: '92%' }} className="h-full bg-gradient-to-r from-[#004D4D] to-cyan rounded-full" /></div>
                                            </div>
                                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Target size={14} className="text-rose-500" /> Valor Estratégico</h4>
                                                <p className="text-sm font-medium text-gray-600 leading-relaxed">{guideContent[activeGuideTab as keyof typeof guideContent].whyImportant}</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#001A1A] p-10 rounded-[3rem] text-white relative overflow-hidden isolate">
                                            <div className="absolute top-0 right-0 p-8 opacity-5 -z-10 rotate-12"><Bot size={150}/></div>
                                            <div className="flex items-center gap-4 mb-6"><div className="h-10 w-10 rounded-xl bg-cyan flex items-center justify-center text-[#001A1A] shadow-[0_0_15px_rgba(0,242,255,0.3)]"><Bot size={20} /></div><h4 className="text-xs font-black uppercase tracking-[0.2em] text-cyan">Estrategia Bayt AI</h4></div>
                                            <p className="text-lg font-bold italic leading-tight text-white/90">&quot;{guideContent[activeGuideTab as keyof typeof guideContent].baytTip}&quot;</p>
                                            <div className="mt-8 flex items-center gap-3"><div className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" /><span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan/60">Análisis Predictivo de Ventas v2.0</span></div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
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