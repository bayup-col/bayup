"use client";

import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { InteractiveUP } from '@/components/landing/InteractiveUP';    
import MetricDetailModal from '@/components/dashboard/MetricDetailModal';
import {
  User,
  Mail,
  Smartphone,
  Search,
  Plus,
  Trash2,
  MessageSquare,
  CheckCircle2,
  Store,
  DollarSign,
  Calendar,
  Filter,
  TrendingUp,
  ArrowDownRight,
  ShoppingBag,
  Zap,
  Download,
  ChevronDown,
  Package,
  ShoppingCart,
  CreditCard,
  MapPin,
  Activity,
  ArrowLeft,
  Loader2,
  Send,
  ShieldCheck,
  Target,
  Layers,
  Globe,
  FileText,
  Wallet,
  Eye
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

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

const PremiumCard = ({ children, onClick, className = "", dark = false }: { children: React.ReactNode, onClick?: () => void, className?: string, dark?: boolean }) => {
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
            className={`rounded-[3rem] border transition-all duration-500 relative overflow-hidden isolate cursor-pointer ${dark ? 'bg-[#001A1A] border-white/5 shadow-2xl' : 'bg-white/40 backdrop-blur-xl border-white/80 shadow-xl'} ${className}`}
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
        >
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                 style={{ opacity: 0.1, background: `radial-gradient(circle at 50% 50%, ${dark ? 'rgba(0,242,255,0.2)' : 'white'} 0%, transparent 60%)`, zIndex: 1 }} />
            <div style={{ transform: "translateZ(30px)", position: "relative", zIndex: 2 }} className="h-full">{children}</div>
            <div className={`absolute -bottom-20 -right-20 h-40 w-40 bg-[#004d4d]/5 blur-[80px] rounded-full -z-10`} />
        </motion.div>
    );
};

// --- INTERFACES ---
interface Product { id: string; name: string; category: string; description?: string; price: number; wholesale_price?: number; sku: string; image_url?: any; variants?: any[]; }
interface InvoicingItem { id: string; name: string; variant_id?: string; price: number; quantity: number; sku: string; image?: string; }
interface PastInvoice { id: string; invoice_num: string; date: string; customer: string; customer_email?: string; customer_phone?: string; customer_city?: string; source: string; payment_method: string; total: number; }

export default function InvoicingPage() {
    const { token, userEmail: authEmail } = useAuth();
    const { showToast } = useToast();
    
    // States
    const [isPOSActive, setIsPOSActive] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<PastInvoice | null>(null);
    const [fullSelectedOrder, setFullSelectedOrder] = useState<any>(null);
    const [selectedMetric, setSelectedMetric] = useState<any>(null);   
    const [products, setProducts] = useState<Product[]>([]);
    const [companyData, setCompanyData] = useState<any>(null);
    const [history, setHistory] = useState<PastInvoice[]>([]);
    const [historySearch, setHistorySearch] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [isHistoryFilterOpen, setIsHistoryFilterOpen] = useState(false);
    
    const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '', city: '', source: 'Tienda Física', type: 'final' });
    const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
    const [invoiceItems, setInvoiceItems] = useState<InvoicingItem[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas'); 
    const [categories, setCategories] = useState<string[]>(['Todas']); 
    const [isProcessing, setIsProcessing] = useState(false);
    const [posCustomerMode, setPosCustomerMode] = useState<'search' | 'create'>('create');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');

    const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>({});
    const [tempPrice, setTempPrice] = useState<number>(0);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [quickVariant, setQuickVariant] = useState({ name: '', sku: '' });
    const [isCreatingQuickVariant, setIsCreatingQuickVariant] = useState(false);

    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isDateHovered, setIsDateHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);

    const loadData = useCallback(async () => {
        if (!token) return;
        console.log("DEBUG: Iniciando sincronización de datos...");
        
        // 1. Cargar Perfil y Productos (Vitales)
        try {
            const [pRes, userData] = await Promise.all([
                apiRequest<any[]>('/products', { token }),
                apiRequest<any>('/auth/me', { token })
            ]);
            if (userData) setCompanyData(userData);
            if (pRes) {
                console.log(`DEBUG: ${pRes.length} productos cargados.`);
                setProducts(pRes);
            }
        } catch (e) { console.error("Error en carga vital:", e); }

        // 2. Cargar Categorías (Opcional)
        try {
            const cRes = await apiRequest<any[]>('/collections', { token });
            if (cRes) setCategories(['Todas', ...cRes.map((c: any) => c.title)]);
        } catch (e) { console.error("Error en colecciones:", e); }

        // 3. Cargar Historial (Operativo)
        try {
            const oRes = await apiRequest<any[]>('/orders', { token });
            if (oRes) {
                console.log(`DEBUG: ${oRes.length} órdenes recibidas.`);
                const sorted = [...oRes].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                const mapped = sorted.map((o, i) => ({
                    id: o.id, 
                    invoice_num: `#${String(i + 1).padStart(4, '0')}`, 
                    date: o.created_at,
                    customer: o.customer_name || 'Cliente',
                    customer_email: o.customer_email,
                    customer_phone: o.customer_phone,
                    customer_city: o.customer_city,
                    source: o.source || 'pos',
                    payment_method: o.payment_method || 'cash',
                    total: o.total_price || 0
                })).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setHistory(mapped);
            }
        } catch (e) { console.error("Error en historial:", e); }
    }, [token]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleViewDetail = async (inv: PastInvoice) => {
        setSelectedInvoice(inv);
        setFullSelectedOrder(null);
        try {
            const data = await apiRequest<any[]>(`/orders`, { token });
            const detail = data.find((o: any) => o.id === inv.id);
            if (detail) setFullSelectedOrder(detail);
        } catch (e) {}
    };

    const handleCreateQuickVariant = async () => {
        if (!quickVariant.name || !quickVariant.sku || !selectedProductForVariant) return;
        setIsCreatingQuickVariant(true);
        try {
            const newV = { name: quickVariant.name, sku: quickVariant.sku, stock: 99, price_adjustment: 0 };
            const updatedProduct = { ...selectedProductForVariant, variants: [...(selectedProductForVariant.variants || []), newV] };
            await apiRequest(`/products/${selectedProductForVariant.id}`, { method: 'PUT', token, body: JSON.stringify(updatedProduct) });
            setProducts(prev => prev.map(p => p.id === selectedProductForVariant.id ? updatedProduct : p));
            setSelectedProductForVariant(updatedProduct);
            setSelectedVariants(prev => ({ ...prev, [quickVariant.name]: newV }));
            setQuickVariant({ name: '', sku: '' });
            showToast("Variante creada ✨", "success");
        } catch (e) { showToast("Error al crear variante", "error"); } finally { setIsCreatingQuickVariant(false); }
    };

    const addToCart = (product: Product, variantsMap?: Record<string, any>, customPrice?: number) => {
        // 1. Si el producto no tiene variantes configuradas, usamos el ID del producto como fallback 
        // pero lo ideal es que el backend maneje el caso de producto base.
        // Por ahora, forzamos que si no hay variantes, se use una estructura compatible.
        const selections = variantsMap && Object.keys(variantsMap).length > 0 
            ? Object.values(variantsMap) 
            : (product.variants?.length ? [product.variants[0]] : [{ id: product.id, name: 'Base', sku: product.sku, price_adjustment: 0 }]);

        selections.forEach((variant: any) => {
            let finalPrice = customPrice !== undefined 
                ? customPrice / selections.length 
                : (customerInfo.type === 'mayorista' ? (product.wholesale_price || product.price) : product.price) + (variant.price_adjustment || 0);
            
            const mainImg = Array.isArray(product.image_url) && product.image_url.length > 0 
                ? product.image_url[0] 
                : (typeof product.image_url === 'string' ? product.image_url : null);

            setInvoiceItems(prev => [...prev, {
                id: product.id, 
                variant_id: variant.id, // Este es el product_variant_id que espera el backend
                name: variant.name === 'Base' ? product.name : `${product.name} (${variant.name}: ${variant.sku})`,
                price: finalPrice, 
                quantity: 1, 
                sku: variant.sku || product.sku, 
                image: variant.image_url || mainImg
            }]);
        });
        setSelectedProductForVariant(null);
        showToast("Añadido ✨", "success");
    };

    const handleProductClick = (product: Product) => {
        setSelectedProductForVariant(product);
        const initial: Record<string, any> = {};
        if (product.variants?.length) {
            const families = Array.from(new Set(product.variants.map(v => v.name)));
            families.forEach(f => { const first = product.variants?.find(v => v.name === f); if (first) initial[f] = first; });
        }
        setSelectedVariants(initial);
        const base = customerInfo.type === 'mayorista' && (product.wholesale_price || 0) > 0 ? product.wholesale_price : product.price;
        const adjust = Object.values(initial).reduce((acc, v) => acc + (v.price_adjustment || 0), 0);
        setTempPrice((base || 0) + adjust);
        setCurrentImageIndex(0);
    };

    const handleFinalize = async () => {
        if (invoiceItems.length === 0) return;
        setIsProcessing(true);
        try {
            const body = { customer_name: customerInfo.name || 'Cliente', customer_email: customerInfo.email, customer_phone: customerInfo.phone, items: invoiceItems.map(i => ({ product_variant_id: i.variant_id, quantity: i.quantity })), source: customerInfo.source, payment_method: paymentMethod };
            const res = await apiRequest<any>('/orders', { method: 'POST', token, body: JSON.stringify(body) });
            if (res) {
                showToast("Venta Exitosa 🚀", "success");
                const { generateInvoicePDF } = await import('@/lib/report-generator');
                await generateInvoicePDF({ company: companyData, order: res, customer: customerInfo });
                if (customerInfo.phone) window.open(`https://wa.me/57${customerInfo.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Factura #${String(res.id).slice(-4).toUpperCase()} de ${companyData?.full_name}: $${calculateSubtotal().toLocaleString()}`)}`, '_blank');
                setInvoiceItems([]); setIsPOSActive(false); loadData();
            }
        } catch (e) {} finally { setIsProcessing(false); }
    };

    const calculateSubtotal = () => invoiceItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const filteredHistory = useMemo(() => {
        return history.filter(inv => {
            const matchesSearch = (inv.customer?.toLowerCase() || '').includes(historySearch.toLowerCase()) || (inv.invoice_num?.toLowerCase() || '').includes(historySearch.toLowerCase());
            const invDate = new Date(inv.date);
            const matchesStart = !dateRange.start || invDate >= new Date(dateRange.start);
            const matchesEnd = !dateRange.end || invDate <= new Date(dateRange.end);
            return matchesSearch && matchesStart && matchesEnd;
        });
    }, [history, historySearch, dateRange]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            // 1. Verificar si el producto tiene stock (suma de todas sus variantes)
            const totalStock = p.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
            if (totalStock <= 0) return false;

            // 2. Filtros de búsqueda y categoría
            const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                                 (p.sku?.toLowerCase() || '').includes(productSearch.toLowerCase());
            
            const productCategory = p.category || (p as any).collection?.title || 'General';
            const matchesCategory = selectedCategory === 'Todas' || productCategory === selectedCategory;
            
            return matchesSearch && matchesCategory;
        }).slice(0, 12);
    }, [productSearch, products, selectedCategory]);

    const invoicingKpis = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const ordersToday = history.filter(inv => inv.date?.startsWith(today));
        const salesToday = ordersToday.reduce((acc, inv) => acc + (Number(inv.total) || 0), 0);
        const cashSalesToday = ordersToday.filter(o => o.payment_method === 'cash').reduce((a, b) => a + (Number(b.total) || 0), 0);
        const transferSalesToday = ordersToday.filter(o => o.payment_method === 'transfer').reduce((a, b) => a + (Number(b.total) || 0), 0);
        const totalRevenue = history.reduce((acc, inv) => acc + (Number(inv.total) || 0), 0);
        const operationsCount = history.length || 0;
        const avgTicket = operationsCount > 0 ? (totalRevenue / operationsCount) : 0;
        return [
            { label: 'Ventas de hoy', value: salesToday, icon: <Activity size={24}/>, color: "text-emerald-600", bg: "bg-emerald-50", trend: "Live", isCurrency: true, details: [{ l: "Efectivo", v: `$ ${cashSalesToday.toLocaleString()}`, icon: <DollarSign size={14}/> }, { l: "Transf.", v: `$ ${transferSalesToday.toLocaleString()}`, icon: <CreditCard size={14}/> }], advice: "Flujo activo." },
            { label: 'Operaciones', value: operationsCount, icon: <ShoppingBag size={24}/>, isSimple: true, color: "text-cyan-500", bg: "bg-cyan-50", trend: "Total", details: [{ l: "Canal POS", v: `${history.filter(o => o.source === 'pos').length}`, icon: <Store size={14}/> }, { l: "Canal WhatsApp", v: `${history.filter(o => o.source === 'WhatsApp').length}`, icon: <MessageSquare size={14}/> }], advice: "Monitorea tus órdenes." },
            { label: 'Ticket promedio', value: avgTicket, icon: <Target size={24}/>, isCurrency: true, color: "text-purple-600", bg: "bg-purple-50", trend: "Market", details: [], advice: "Sube tu ticket con combos." },
            { label: 'Flujo de caja', value: totalRevenue, icon: <Wallet size={24}/>, isCurrency: true, color: "text-[#004D4D]", bg: "bg-[#004D4D]/5", trend: "Balance", details: [], advice: "Registra tus gastos." }
        ];
    }, [history]);

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 pb-20 text-slate-900">
            <AnimatePresence mode="wait">
                {!isPOSActive ? (
                    <div className="space-y-10 p-4">
                        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-4">
                            <div><div className="flex items-center gap-3 mb-2"><div className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#00f2ff] animate-pulse" /><span className="text-[10px] font-black tracking-[0.3em] text-[#004d4d]/60 italic">Terminal de facturación v2.0</span></div><h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none text-[#001A1A]">Factura<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-[#004d4d]">ción</span></h1><p className="text-gray-400 font-medium text-lg italic mt-4">¡Lleva el control de todas tus ventas aquí! 💰</p></div>
                            <button onClick={() => setIsPOSActive(true)} className="h-16 px-10 bg-[#004d4d] text-white rounded-full font-black text-[11px] tracking-[0.4em] shadow-2xl hover:bg-black transition-all flex items-center gap-3">
                                <Plus size={18} className="text-[#00f2ff]" />
                                Nueva venta POS
                            </button>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                            {invoicingKpis.map((k, i) => (
                                <div key={i} onClick={() => setSelectedMetric(k)}><PremiumCard className="p-8"><div className="flex justify-between items-start mb-6"><div className={`h-14 w-14 rounded-2xl flex items-center justify-center border border-white/50 ${k.bg} ${k.color}`}>{k.icon}</div></div><div><p className="text-[10px] font-black text-gray-400 tracking-widest mb-1.5">{k.label}</p><h3 className="text-3xl font-black text-gray-900 tracking-tighter italic"><AnimatedNumber value={k.value} type={k.isSimple ? 'simple' : 'currency'} /></h3></div></PremiumCard></div>
                            ))}
                        </div>

                        <div className="px-4 space-y-8">
                            <div className="flex flex-col md:flex-row items-center gap-4 w-full max-w-6xl mx-auto">
                                <div className="flex-1 flex items-center gap-4 bg-white/60 backdrop-blur-md p-2 rounded-3xl border border-white/80 shadow-sm focus-within:shadow-xl focus-within:border-[#004D4D]/20 w-full transition-all"><Search size={22} className="text-gray-300 ml-4" /><input placeholder="Buscar por ID o cliente..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} className="flex-1 bg-transparent outline-none text-sm font-bold text-gray-900 py-4" /></div>
                                <div className="flex items-center gap-3">
                                    <motion.button layout onMouseEnter={() => setIsFilterHovered(true)} onMouseLeave={() => setIsFilterHovered(false)} onClick={() => setIsHistoryFilterOpen(!isHistoryFilterOpen)} className={`h-16 flex items-center gap-2 px-6 rounded-3xl border transition-all ${isHistoryFilterOpen ? 'bg-[#004D4D] text-white border-[#004D4D]' : 'bg-white border-white/80 text-gray-500 shadow-sm'}`}><Filter size={20}/><AnimatePresence>{isFilterHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black tracking-widest whitespace-nowrap overflow-hidden">Filtros</motion.span>}</AnimatePresence></motion.button>
                                    <motion.button layout onMouseEnter={() => setIsDateHovered(true)} onMouseLeave={() => setIsDateHovered(false)} onClick={() => setIsHistoryFilterOpen(!isHistoryFilterOpen)} className="h-16 flex items-center gap-2 px-6 rounded-3xl bg-white border border-white/80 text-gray-500 hover:text-[#004D4D] shadow-sm transition-all"><Calendar size={20}/><AnimatePresence>{isDateHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black tracking-widest whitespace-nowrap overflow-hidden">Fecha</motion.span>}</AnimatePresence></motion.button>
                                    <motion.button layout onMouseEnter={() => setIsExportHovered(true)} onMouseLeave={() => setIsExportHovered(false)} onClick={() => { if(history.length) import('@/lib/report-generator').then(m => m.generateInvoicesAuditPDF({ userName: authEmail?.split('@')[0] || 'Empresario', invoices: filteredHistory, range: dateRange })); }} className="h-16 flex items-center gap-2 px-6 rounded-3xl bg-[#004D4D] text-white shadow-2xl hover:bg-black transition-all group"><Download size={20}/><AnimatePresence>{isExportHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black tracking-widest whitespace-nowrap overflow-hidden">Exportar PDF</motion.span>}</AnimatePresence></motion.button>
                                </div>
                            </div>

                            <AnimatePresence>{isHistoryFilterOpen && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-6xl mx-auto p-8 bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/80 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Desde Fecha</label><input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="w-full p-4 bg-white/50 border border-gray-100 rounded-2xl outline-none font-bold text-sm" /></div>
                                    <div className="space-y-3"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Hasta Fecha</label><input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="w-full p-4 bg-white/50 border border-gray-100 rounded-2xl outline-none font-bold text-sm" /></div>
                                </motion.div>
                            )}</AnimatePresence>

                            <div className="bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/80 shadow-xl overflow-hidden mx-4">
                                <table className="w-full text-center">
                                    <thead className="bg-gray-50/50"><tr>{['Factura', 'Fecha', 'Cliente', 'Canal', 'Total', 'Acción'].map(h => <th key={h} className="px-8 py-6 text-[10px] font-black text-[#004D4D] tracking-widest">{h}</th>)}</tr></thead>
                                    <tbody className="divide-y divide-gray-100/50">
                                        {filteredHistory.map((inv) => (
                                            <tr key={inv.id} className="hover:bg-white/60 transition-all group active:bg-gray-100/50">
                                                <td className="px-8 py-8 font-black text-gray-900 text-sm">{inv.invoice_num}</td>
                                                <td className="px-8 py-8 font-bold text-gray-400 text-xs">{new Date(inv.date).toLocaleDateString()}</td>
                                                <td className="px-8 py-8"><p className="font-bold text-gray-700">{inv.customer}</p><p className="text-[9px] font-black text-[#004D4D] italic">{inv.payment_method}</p></td>
                                                <td className="px-8 py-8"><span className="px-4 py-1.5 bg-gray-100 rounded-full text-[9px] font-black text-gray-400">{inv.source}</span></td>
                                                <td className="px-8 py-8 font-black text-[#004D4D] text-base">$ {inv.total.toLocaleString()}</td>
                                                <td className="px-8 py-8 text-center">
                                                    <button onClick={() => handleViewDetail(inv)} className="h-10 w-10 bg-white border border-gray-100 text-gray-400 hover:text-[#004D4D] hover:border-[#004D4D]/20 rounded-xl shadow-sm transition-all flex items-center justify-center m-auto group-hover:scale-110 active:scale-95">
                                                        <Eye size={18}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[3000] flex flex-col lg:flex-row overflow-hidden bg-white">
                        <div className="flex-1 flex flex-col bg-[#FAFAFA] border-r border-gray-100 overflow-hidden relative">
                            <header className="p-8 border-b bg-white flex justify-between items-center shrink-0">
                                <button onClick={() => setIsPOSActive(false)} className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-rose-500 transition-all"><ArrowLeft size={16}/> Cancelar venta</button>
                            </header>
                            <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                                <div className="space-y-8">
                                    <div className="flex p-1 bg-gray-100 rounded-2xl w-fit">
                                        <button onClick={() => setPosCustomerMode('create')} className={`px-8 py-2.5 rounded-xl text-[9px] font-black tracking-widest transition-all ${posCustomerMode === 'create' ? 'bg-white text-[#004D4D] shadow-md' : 'text-gray-400'}`}>Registrar</button>
                                        <button onClick={() => setPosCustomerMode('search')} className={`px-8 py-2.5 rounded-xl text-[9px] font-black tracking-widest transition-all ${posCustomerMode === 'search' ? 'bg-white text-[#004D4D] shadow-md' : 'text-gray-400'}`}>Buscar</button>
                                    </div>
                                    {posCustomerMode === 'create' && (
                                        <div className="grid grid-cols-2 gap-6 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm animate-in slide-in-from-top-4">
                                            <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 tracking-widest ml-1">Nombre</label><input value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} className="w-full p-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold text-sm focus:bg-white focus:border-[#004D4D]/10" placeholder="Nombre completo" /></div>
                                            <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 tracking-widest ml-1">Correo</label><input value={customerInfo.email} onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})} className="w-full p-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold text-sm focus:bg-white focus:border-[#004D4D]/10" placeholder="email@ejemplo.com" /></div>
                                            <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 tracking-widest ml-1">WhatsApp</label><input value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} className="w-full p-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold text-sm focus:bg-white focus:border-[#004D4D]/10" placeholder="300..." /></div>
                                            <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 tracking-widest ml-1">Ciudad</label><input value={customerInfo.city} onChange={e => setCustomerInfo({...customerInfo, city: e.target.value})} className="w-full p-4 bg-gray-50 border-transparent rounded-2xl outline-none font-bold text-sm focus:bg-white focus:border-[#004D4D]/10" placeholder="Ciudad" /></div>
                                            <div className="space-y-2 relative"><label className="text-[9px] font-black text-gray-400 tracking-widest ml-1">Canal</label><button onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)} className="w-full p-4 bg-gray-50 rounded-2xl flex items-center justify-between font-bold text-sm hover:bg-white"><span className="text-[#004D4D]">{customerInfo.source}</span><ChevronDown size={16}/></button>
                                                {isSourceDropdownOpen && <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border z-50 p-2">{['Tienda Física', 'WhatsApp', 'Página Web', 'Redes Sociales'].map(opt => <button key={opt} onClick={() => { setCustomerInfo({...customerInfo, source: opt}); setIsSourceDropdownOpen(false); }} className="w-full text-left p-3 rounded-xl text-xs font-bold hover:bg-gray-50">{opt}</button>)}</div>}
                                            </div>
                                            <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 ml-1">Tarifa:</label><div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 h-[54px] relative isolate"><button onClick={() => setCustomerInfo({...customerInfo, type: 'final'})} className={`flex-1 rounded-xl text-[9px] font-black z-10 ${customerInfo.type === 'final' ? 'text-white' : 'text-gray-400'}`}>Final</button><button onClick={() => setCustomerInfo({...customerInfo, type: 'mayorista'})} className={`flex-1 rounded-xl text-[9px] font-black z-10 ${customerInfo.type === 'mayorista' ? 'text-white' : 'text-gray-400'}`}>Mayorista</button><motion.div animate={{ x: customerInfo.type === 'final' ? 0 : '100%' }} className="absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-[#004D4D] rounded-xl shadow-lg -z-0" /></div></div>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-4"><label className="text-[9px] font-black text-gray-400 ml-1">Medio de pago:</label><div className="grid grid-cols-2 gap-4"><button onClick={() => setPaymentMethod('cash')} className={`py-4 rounded-2xl font-black text-[9px] tracking-widest border-2 transition-all ${paymentMethod === 'cash' ? 'bg-[#004D4D] border-[#004D4D] text-white' : 'bg-white border-gray-100 text-gray-400'}`}>Efectivo</button><button onClick={() => setPaymentMethod('transfer')} className={`py-4 rounded-2xl font-black text-[9px] tracking-widest border-2 transition-all ${paymentMethod === 'transfer' ? 'bg-[#004D4D] border-[#004D4D] text-white' : 'bg-white border-gray-100 text-gray-400'}`}>Transferencia</button></div></div>
                                    <h3 className="text-2xl font-black italic tracking-tighter text-[#001A1A]">Produc<span className="text-[#004D4D]">tos</span></h3>
                                    <div className="flex items-center gap-4 bg-white p-2 rounded-3xl border border-gray-100 shadow-sm focus-within:shadow-xl focus-within:border-[#004D4D]/20 transition-all w-full"><Search size={20} className="text-gray-300 ml-4"/><input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Buscar..." className="flex-1 bg-transparent outline-none text-sm font-bold py-3" /></div>
                                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">{categories.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex-shrink-0 px-8 py-3 rounded-full text-[9px] font-black tracking-widest transition-all ${selectedCategory === cat ? 'bg-[#004D4D] text-white shadow-lg' : 'bg-white border text-gray-400'}`}>{cat}</button>)}</div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-slate-900">{filteredProducts.map(p => {
                                        const isWholesale = customerInfo.type === 'mayorista' && (p.wholesale_price || 0) > 0;
                                        const displayPrice = isWholesale ? p.wholesale_price : p.price;
                                        const displayImage = Array.isArray(p.image_url) && p.image_url.length > 0 ? p.image_url[0] : (typeof p.image_url === 'string' ? p.image_url : null);
                                        return (
                                            <button key={p.id} onClick={() => handleProductClick(p)} className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:scale-105 transition-all text-left relative group">
                                                <div onClick={(e) => { e.stopPropagation(); addToCart(p); }} className="absolute top-3 right-3 z-20 h-8 w-8 bg-emerald-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110 cursor-pointer"><Plus size={18} strokeWidth={3} /></div>
                                                <div className="aspect-square bg-gray-50 rounded-2xl mb-4 overflow-hidden">{displayImage ? <img src={displayImage} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"/> : <div className="h-full w-full flex items-center justify-center text-gray-200"><Package size={24}/></div>}</div>
                                                <p className="text-[10px] font-black text-gray-900 truncate">{p.name}</p><p className={`text-[11px] font-black mt-1 ${isWholesale ? 'text-emerald-500' : 'text-[#004D4D]'}`}>${(displayPrice || 0).toLocaleString()}</p>
                                            </button>
                                        );
                                    })}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 bg-[#F3F4F6] p-8 lg:p-16 flex items-center justify-center relative">
                            <div className="absolute top-0 right-0 p-20 opacity-[0.03] rotate-12 -z-0"><Zap size={600} fill="#004D4D"/></div>
                            <div className="w-full max-w-2xl bg-white shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] rounded-[4rem] flex flex-col h-full overflow-hidden relative border border-white animate-in zoom-in-95 duration-700 z-10">
                                <div className="bg-white p-12 flex justify-between items-center shrink-0 border-b border-gray-50"><div className="space-y-1"><div className="flex items-center gap-2 mb-3"><div className="h-1.5 w-1.5 rounded-full bg-[#00F2FF] animate-ping"/><span className="text-[10px] font-black tracking-[0.3em] text-[#004D4D]">Documento oficial de venta</span></div>{companyData?.logo_url ? <img src={companyData.logo_url} className="h-12 w-auto object-contain" /> : <h2 className="text-3xl font-black italic tracking-tighter leading-none text-[#001A1A]">{companyData?.full_name || authEmail?.split('@')[0]}</h2>}</div><div className="text-right"><p className="text-[9px] font-black text-gray-300">Comprobante</p><p className="text-lg font-black text-[#004D4D]">#{String(history.length + 1).padStart(4, '0')}</p></div></div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-12 space-y-12">
                                    <div className="grid grid-cols-2 gap-12 text-slate-900">
                                        <div className="space-y-4"><p className="text-[8px] font-black text-gray-300 tracking-[0.2em] bg-gray-50 w-fit px-3 py-1 rounded-full">Datos del cliente</p><h4 className="text-xl font-black italic text-gray-900 leading-tight">{customerInfo.name || 'Cliente particular'}</h4><div className="flex flex-col gap-2"><div className="flex items-center gap-2 text-[10px] font-bold text-gray-400"><Mail size={12} className="text-[#004D4D]"/> {customerInfo.email || 'Sin correo'}</div><div className="flex items-center gap-2 text-[10px] font-bold text-gray-400"><Smartphone size={12} className="text-[#004D4D]"/> {customerInfo.phone || 'Sin número'}</div><div className="flex items-center gap-2 text-[10px] font-bold text-gray-400"><MapPin size={12} className="text-[#004D4D]"/> {customerInfo.city || 'Sin ciudad'}</div></div></div>
                                        <div className="text-right space-y-4"><p className="text-[8px] font-black text-gray-300 tracking-[0.2em] bg-gray-50 w-fit px-3 py-1 rounded-full ml-auto">Datos del vendedor</p><h4 className="text-sm font-black text-[#004D4D]">{companyData?.full_name}</h4><div className="flex flex-col items-end gap-2"><div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 justify-end">{companyData?.email || authEmail} <Mail size={12} className="text-[#004D4D]"/></div><div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 justify-end">{companyData?.phone || 'Sin WhatsApp'} <Smartphone size={12} className="text-[#004D4D]"/></div><div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 mt-2"><ShieldCheck size={12}/> Operación verificada</div></div></div>
                                    </div>
                                    <div className="space-y-6"><div className="flex items-center text-[8px] font-black text-gray-300 tracking-[0.3em] px-4"><span className="flex-1">Descripción del activo</span><span className="w-16 text-center">Qty</span><span className="w-28 text-right">Subtotal</span></div><div className="space-y-2">{invoiceItems.map((item, i) => (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className="flex items-center px-6 py-5 bg-gray-50/50 rounded-3xl group"><div className="flex-1 min-w-0"><p className="text-xs font-black text-gray-900 truncate">{item.name}</p><p className="text-[7px] font-bold text-[#004D4D]">Ref: {item.sku}</p></div><div className="w-16 flex items-center justify-center gap-2"><button onClick={() => {const ni = [...invoiceItems]; if(ni[i].quantity > 1) ni[i].quantity--; setInvoiceItems(ni);}} className="h-5 w-5 bg-white border rounded">-</button><span className="text-xs font-black text-gray-900">{item.quantity}</span><button onClick={() => {const ni = [...invoiceItems]; ni[i].quantity++; setInvoiceItems(ni);}} className="h-5 w-5 bg-white border rounded">+</button></div><div className="w-28 text-right font-black text-xs text-[#004D4D]">${(item.price * item.quantity).toLocaleString()}</div><button onClick={() => setInvoiceItems(invoiceItems.filter((_, idx) => idx !== i))} className="ml-4 text-rose-200 hover:text-rose-500"><Trash2 size={14}/></button></motion.div>))}</div></div>
                                    <div className="pt-10 mt-auto"><div className="bg-gray-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group border border-white/5"><div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"><div className="space-y-4"><div className="flex items-center gap-3"><div className="h-1.5 w-1.5 rounded-full bg-[#00F2FF]"/><p className="text-[10px] font-black text-white/40 tracking-widest">Resumen de liquidación</p></div><p className="text-[10px] font-medium text-white/30 italic max-w-xs">Comprobante oficial de compra.</p></div><div className="space-y-6 flex flex-col items-center justify-center text-center px-2"><p className="text-[8px] font-black text-white/40 mb-2 tracking-[0.2em]">Total neto a pagar</p><h3 className="text-4xl font-black tracking-tighter text-white truncate"><AnimatedNumber value={calculateSubtotal()} /></h3></div></div></div></div>
                                </div>
                                <div className="p-10 bg-gray-50 border-t flex gap-4 shrink-0"><button type="button" onClick={() => showToast("Descargando...", "info")} className="flex-1 h-16 bg-white border border-gray-200 text-gray-400 rounded-2xl font-black text-[10px] hover:text-[#004D4D] transition-all flex items-center justify-center gap-3 shadow-sm"><Download size={18}/> Descargar</button><button onClick={handleFinalize} disabled={isProcessing || invoiceItems.length === 0} className="flex-[2] h-16 bg-[#001A1A] text-white rounded-2xl font-black text-[11px] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-30">{isProcessing ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>} Facturar</button></div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODALES GLOBALES (ACCESIBLES DESDE CUALQUIER VISTA) */}
            <AnimatePresence>
                {selectedInvoice && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-10">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSelectedInvoice(null); setFullSelectedOrder(null); }} className="absolute inset-0 bg-[#001A1A]/90 backdrop-blur-2xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="relative bg-white w-full max-w-2xl h-[85vh] rounded-[4rem] shadow-3xl overflow-hidden border border-white/20 flex flex-col text-slate-900">
                            <div className="bg-white p-12 flex justify-between items-center shrink-0 border-b border-gray-50">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-3"><div className="h-1.5 w-1.5 rounded-full bg-[#00F2FF] animate-ping"/><span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#004D4D]">Copia de Venta Oficial</span></div>
                                    {companyData?.logo_url ? <img src={companyData.logo_url} className="h-12 w-auto object-contain" /> : <h2 className="text-3xl font-black italic tracking-tighter uppercase text-[#001A1A]">{companyData?.full_name || authEmail?.split('@')[0]}</h2>}
                                </div>
                                <div className="text-right"><p className="text-[9px] font-black text-gray-300 uppercase">Comprobante</p><p className="text-lg font-black text-[#004D4D]">{selectedInvoice.invoice_num}</p></div>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-12 space-y-12">
                                <div className="grid grid-cols-2 gap-12 text-slate-900">
                                    <div className="space-y-4">
                                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em] bg-gray-50 w-fit px-3 py-1 rounded-full">Datos del Cliente</p>
                                        <h4 className="text-xl font-black italic uppercase text-gray-900 leading-tight">{selectedInvoice.customer}</h4>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase"><Mail size={12} className="text-[#004D4D]"/> {selectedInvoice.customer_email || 'Sin correo'}</div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase"><Smartphone size={12} className="text-[#004D4D]"/> {selectedInvoice.customer_phone || 'Sin número'}</div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase"><MapPin size={12} className="text-[#004D4D]"/> {selectedInvoice.customer_city || 'Sin ciudad'}</div>
                                        </div>
                                    </div>
                                    <div className="text-right space-y-4">
                                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em] bg-gray-50 w-fit px-3 py-1 rounded-full ml-auto">Datos del Vendedor</p>
                                        <h4 className="text-sm font-black text-[#004D4D] uppercase">{companyData?.full_name}</h4>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase justify-end">{companyData?.email || authEmail} <Mail size={12} className="text-[#004D4D]"/></div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase justify-end">{companyData?.phone || 'Sin WhatsApp'} <Smartphone size={12} className="text-[#004D4D]"/></div>
                                            <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase mt-2"><ShieldCheck size={12}/> Operación Verificada</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center text-[8px] font-black text-gray-300 uppercase tracking-[0.3em] px-4"><span className="flex-1">Descripción del Activo</span><span className="w-16 text-center">Qty</span><span className="w-28 text-right">Monto</span></div>
                                    <div className="space-y-2">
                                        {!fullSelectedOrder ? <div className="py-20 text-center animate-pulse text-gray-300 text-[10px] font-black uppercase tracking-widest">Consultando Activos...</div> : fullSelectedOrder.items?.map((item: any, i: number) => (
                                            <div key={i} className="flex items-center px-6 py-5 bg-gray-50/50 rounded-3xl group transition-all">
                                                <div className="flex-1 min-w-0"><p className="text-xs font-black text-gray-900 uppercase truncate">{item.product_variant?.product?.name || "Producto"}</p><p className="text-[7px] font-bold text-[#004D4D] uppercase">Ref: {item.product_variant?.sku || "N/A"}</p></div>
                                                <div className="w-16 text-center font-black text-xs text-gray-900">{item.quantity}</div>
                                                <div className="w-28 text-right font-black text-xs text-[#004D4D]">${(item.price_at_purchase * item.quantity).toLocaleString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-10 mt-auto">
                                    <div className="bg-gray-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group border border-white/5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                            <div className="space-y-4"><div className="flex items-center gap-3"><div className="h-1.5 w-1.5 rounded-full bg-[#00F2FF]"/><p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Resumen de Liquidación</p></div><p className="text-[10px] font-medium text-white/30 italic max-w-xs">Comprobante oficial histórico.</p></div>
                                            <div className="space-y-6 flex flex-col items-center justify-center text-center px-2">
                                                <p className="text-[8px] font-black uppercase text-white/40 mb-2 tracking-[0.2em]">Total Neto Liquidado</p>
                                                <h3 className="text-4xl font-black tracking-tighter text-white truncate italic"><AnimatedNumber value={selectedInvoice.total} /></h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-10 bg-gray-50 border-t flex gap-4 shrink-0"><button onClick={() => { setSelectedInvoice(null); setFullSelectedOrder(null); }} className="flex-1 h-16 bg-white border border-gray-200 text-gray-400 rounded-2xl font-black text-[10px] uppercase hover:bg-gray-100 transition-all">Cerrar</button><button onClick={() => { if(fullSelectedOrder) import('@/lib/report-generator').then(m => m.generateInvoicePDF({ company: companyData, order: fullSelectedOrder, customer: { name: selectedInvoice.customer, email: selectedInvoice.customer_email, phone: selectedInvoice.customer_phone, city: selectedInvoice.customer_city } })); }} className="flex-1 h-16 bg-[#004D4D] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-black transition-all flex items-center justify-center gap-3"><Download size={18}/> Descargar PDF</button></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedProductForVariant && (
                    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProductForVariant(null)} className="absolute inset-0 bg-[#001A1A]/90 backdrop-blur-2xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="relative bg-white w-full max-w-5xl h-[80vh] rounded-[4rem] shadow-3xl overflow-hidden border border-white/20 flex flex-col md:flex-row text-slate-900">
                            <div className="w-full md:w-[45%] bg-gray-50 flex flex-col p-10 space-y-6 shrink-0 border-r border-gray-100">
                                <div className="flex-1 rounded-[3rem] overflow-hidden bg-white shadow-inner flex items-center justify-center relative group">
                                    {(() => {
                                        const mainImg = Array.isArray(selectedProductForVariant.image_url) && selectedProductForVariant.image_url.length > 0 ? selectedProductForVariant.image_url[currentImageIndex] : (typeof selectedProductForVariant.image_url === 'string' ? selectedProductForVariant.image_url : null);
                                        return mainImg ? <img src={mainImg} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Main"/> : <Package size={80} className="text-gray-200" />;
                                    })()}
                                    <div className="absolute top-6 left-6 px-4 py-1.5 bg-white/80 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-[#004D4D]">Vista Previa</div>
                                </div>
                                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-2">
                                    {Array.isArray(selectedProductForVariant.image_url) && selectedProductForVariant.image_url.map((url: string, i: number) => (
                                        <button key={i} onClick={() => setCurrentImageIndex(i)} className={`h-20 w-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all ${currentImageIndex === i ? 'border-[#004D4D] scale-95' : 'border-white opacity-60'}`}><img src={url} className="w-full h-full object-cover" /></button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 p-12 overflow-y-auto custom-scrollbar flex flex-col justify-between space-y-10 bg-white">
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3"><span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest">{selectedProductForVariant.category}</span><span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">Activo en Inventario</span></div>
                                        <h3 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A] leading-none">{selectedProductForVariant.name}</h3>
                                    </div>
                                    <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 italic"><p className="text-xs text-gray-500 font-medium leading-relaxed">{selectedProductForVariant.description || 'Sin descripción detallada.'}</p></div>
                                    <div className="flex gap-8 overflow-x-auto no-scrollbar pb-4 min-h-[150px]">
                                        {selectedProductForVariant.variants && selectedProductForVariant.variants.length > 0 ? (
                                            Array.from(new Set(selectedProductForVariant.variants?.map(v => v.name))).map(attrName => (
                                                <div key={attrName} className="space-y-4 min-w-[140px]">
                                                    <label className="text-[10px] font-black text-[#004D4D] uppercase tracking-widest ml-1">{attrName}</label>
                                                    <div className="flex flex-col gap-2">
                                                        {selectedProductForVariant.variants?.filter(v => v.name === attrName).map(v => (
                                                            <button 
                                                                key={v.id} 
                                                                onClick={() => { 
                                                                    const newSelections = { ...selectedVariants, [attrName]: v }; 
                                                                    setSelectedVariants(newSelections); 
                                                                    const base = customerInfo.type === 'mayorista' && (selectedProductForVariant.wholesale_price || 0) > 0 ? selectedProductForVariant.wholesale_price : selectedProductForVariant.price; 
                                                                    const adjustments = Object.values(newSelections).reduce((acc: number, sel: any) => acc + (sel.price_adjustment || 0), 0); 
                                                                    setTempPrice((base || 0) + adjustments); 
                                                                }} 
                                                                disabled={v.stock <= 0} 
                                                                className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase border-2 transition-all ${selectedVariants[attrName]?.id === v.id ? 'bg-[#004D4D] border-[#004D4D] text-white shadow-xl scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-[#004D4D]/20'}`}
                                                            >
                                                                {v.sku}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="w-full flex flex-col p-8 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100 space-y-6">
                                                <div className="text-center space-y-1"><p className="text-[10px] font-black text-[#004D4D] uppercase">Sin variantes configuradas</p><p className="text-[9px] font-medium text-gray-400 italic">Crea una ahora mismo para este pedido.</p></div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1"><label className="text-[8px] font-black text-gray-400 uppercase ml-1">Atributo</label><input value={quickVariant.name} onChange={e => setQuickVariant({...quickVariant, name: e.target.value})} placeholder="Ej: Talla" className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none text-[10px] font-bold" /></div>
                                                    <div className="space-y-1"><label className="text-[8px] font-black text-gray-400 uppercase ml-1">Especificación</label><input value={quickVariant.sku} onChange={e => setQuickVariant({...quickVariant, sku: e.target.value})} placeholder="Ej: XL" className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none text-[10px] font-bold" /></div>
                                                </div>
                                                <button onClick={handleCreateQuickVariant} disabled={!quickVariant.name || !quickVariant.sku || isCreatingQuickVariant} className="w-full py-3 bg-[#004D4D] text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">{isCreatingQuickVariant ? 'Creando...' : '+ Crear Variante Rápida'}</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-6 pt-10 border-t border-gray-100">
                                    <div className="grid grid-cols-2 gap-6 items-end">
                                        <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio Final Editable</label><div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-xl">$</span><input type="text" value={tempPrice.toLocaleString('de-DE')} onChange={(e) => setTempPrice(Number(e.target.value.replace(/\D/g, '')))} className="w-full pl-12 pr-6 py-5 bg-emerald-50 border-2 border-transparent focus:border-emerald-200 rounded-3xl outline-none text-2xl font-black text-emerald-700 shadow-inner" /></div></div>
                                        <button onClick={() => addToCart(selectedProductForVariant, selectedVariants, tempPrice)} className="h-[68px] bg-[#001A1A] text-white rounded-3xl font-black text-[11px] uppercase shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3"><ShoppingCart size={20}/> Sumar a Factura</button>
                                    </div>
                                    <button onClick={() => setSelectedProductForVariant(null)} className="w-full text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors tracking-widest text-center">Descartar y Volver</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <MetricDetailModal isOpen={!!selectedMetric} onClose={() => setSelectedMetric(null)} metric={selectedMetric} />
            <style jsx global>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }`}</style>
        </div>
    );
}
