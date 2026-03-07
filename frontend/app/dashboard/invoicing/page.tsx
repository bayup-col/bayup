"use client";

import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { InteractiveUP } from '@/components/landing/InteractiveUP';    
import MetricDetailModal from '@/components/dashboard/MetricDetailModal';
import {
  User, Mail, Smartphone, Search, Plus, Trash2, MessageSquare, CheckCircle2,
  Store, DollarSign, Calendar, Filter, TrendingUp, ArrowDownRight, ShoppingBag,
  Zap, Download, ChevronDown, Package, ShoppingCart, CreditCard, MapPin,
  Activity, ArrowLeft, Loader2, Send, ShieldCheck, Target, Layers, Globe,
  FileText, Wallet, Eye, ChevronRight, X, Sparkles, Moon
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
    const [extraFilters, setExtraFilters] = useState({ type: 'Todos', source: 'Todos', payment: 'Todos' });
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
        try {
            const [pRes, userData] = await Promise.all([
                apiRequest<any[]>('/products', { token }),
                apiRequest<any>('/auth/me', { token })
            ]);
            if (userData) setCompanyData(userData);
            if (pRes) setProducts(pRes);
        } catch (e) { console.error("Error en carga vital:", e); }

        try {
            const cRes = await apiRequest<any[]>('/collections', { token });
            if (cRes) setCategories(['Todas', ...cRes.map((c: any) => c.title)]);
        } catch (e) {}

        try {
            const oRes = await apiRequest<any[]>('/orders', { token });
            if (oRes) {
                const sorted = [...oRes].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                const mapped = sorted.map((o, i) => ({
                    id: o.id, invoice_num: `#${String(i + 1).padStart(4, '0')}`, date: o.created_at,
                    customer: o.customer_name || 'Cliente', customer_email: o.customer_email,
                    customer_phone: o.customer_phone, customer_city: o.customer_city,
                    source: o.source || 'pos', payment_method: o.payment_method || 'cash', total: o.total_price || 0
                })).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setHistory(mapped);
            }
        } catch (e) {}
    }, [token]);

    useEffect(() => { loadData(); }, [loadData]);

    const AuroraMetricCard = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => {
        return (
            <div className="relative group cursor-pointer h-full perspective-1000" onClick={onClick}>
                <div className="absolute inset-0 -m-[2px] rounded-[3rem] overflow-hidden pointer-events-none z-0">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent_0deg,#00F2FF_20deg,#10B981_40deg,#9333EA_60deg,transparent_80deg,transparent_360deg)] opacity-40 group-hover:opacity-100 transition-opacity duration-700 blur-[8px] transform-gpu"
                    />
                </div>
                <div className="relative z-10 h-full transform-gpu">{children}</div>
            </div>
        );
    };

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
        const selections = variantsMap && Object.keys(variantsMap).length > 0 ? Object.values(variantsMap) : [];
        const variantDesc = selections.length > 0 ? selections.map(v => `${v.name}: ${v.sku}`).join(' / ') : 'Base';
        const finalPrice = customPrice !== undefined ? customPrice : (customerInfo.type === 'mayorista' ? (product.wholesale_price || product.price) : product.price) + selections.reduce((acc, v) => acc + (v.price_adjustment || 0), 0);
        const mainImg = Array.isArray(product.image_url) && product.image_url.length > 0 ? product.image_url[0] : (typeof product.image_url === 'string' ? product.image_url : null);
        const primaryVariantId = selections.length > 0 ? selections[0].id : product.id;

        setInvoiceItems(prev => [...prev, {
            id: product.id, variant_id: primaryVariantId, name: selections.length === 0 ? product.name : `${product.name} (${variantDesc})`,
            price: finalPrice, quantity: 1, sku: selections.length > 0 ? selections.map(s => s.sku).join('-') : product.sku,
            image: selections.length > 0 ? (selections.find(s => s.image_url)?.image_url || mainImg) : mainImg
        }]);
        setSelectedProductForVariant(null);
        showToast("Producto añadido ✨", "success");
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
            const matchesStart = !dateRange.start || new Date(inv.date) >= new Date(dateRange.start);
            const matchesEnd = !dateRange.end || new Date(inv.date) <= new Date(dateRange.end);
            const matchesSource = extraFilters.source === 'Todos' || inv.source === extraFilters.source;
            const matchesPayment = extraFilters.payment === 'Todos' || inv.payment_method === (extraFilters.payment === 'Efectivo' ? 'cash' : 'transfer');
            return matchesSearch && matchesStart && matchesEnd && matchesSource && matchesPayment;
        });
    }, [history, historySearch, dateRange, extraFilters]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const totalStock = p.variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) || 0;
            if (totalStock <= 0) return false;
            const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku?.toLowerCase() || '').includes(productSearch.toLowerCase());
            const matchesCategory = selectedCategory === 'Todas' || (p.category || 'General').toLowerCase() === selectedCategory.toLowerCase();
            return matchesSearch && matchesCategory;
        }).slice(0, 12);
    }, [productSearch, products, selectedCategory]);

    const invoicingKpis = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const ordersToday = history.filter(inv => inv.date?.split('T')[0] === today);
        const salesToday = ordersToday.reduce((acc, inv) => acc + (Number(inv.total) || 0), 0);
        const totalRevenue = history.reduce((acc, inv) => acc + (Number(inv.total) || 0), 0);
        return [
            { label: 'Ventas de hoy', value: salesToday, icon: <Activity size={24}/>, color: "text-emerald-600", bg: "bg-emerald-50", trend: "En vivo", isCurrency: true },
            { label: 'Operaciones', value: history.length, icon: <ShoppingBag size={24}/>, isSimple: true, color: "text-cyan-500", bg: "bg-cyan-50", trend: "Total" },
            { label: 'Ticket promedio', value: history.length > 0 ? (totalRevenue / history.length) : 0, icon: <Target size={24}/>, isCurrency: true, color: "text-purple-600", bg: "bg-purple-50", trend: "Market" },
            { label: 'Flujo de caja', value: totalRevenue, icon: <Wallet size={24}/>, isCurrency: true, color: "text-[#004D4D]", bg: "bg-[#004D4D]/5", trend: "Balance" }
        ];
    }, [history]);

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 pb-20 text-slate-900 overflow-visible">
            <AnimatePresence mode="wait">
                {!isPOSActive ? (
                    <div className="space-y-10 p-4">
                        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2"><div className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#00f2ff] animate-pulse" /><span className="text-[10px] font-black tracking-[0.3em] text-[#004d4d]/60 italic uppercase">Terminal de facturación</span></div>
                                <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-[1.2] text-[#001A1A] py-2 px-1"><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-[#004d4d] inline-block pr-10">Facturación</span></h1>
                                <p className="text-gray-400 font-medium text-lg italic mt-4">¡Lleva el control de todas tus ventas aquí! 💰</p>
                            </div>
                            <button onClick={() => setIsPOSActive(true)} className="h-16 px-10 bg-[#004d4d] text-white rounded-full font-black text-[11px] tracking-[0.4em] shadow-2xl hover:bg-black transition-all flex items-center gap-3"><Plus size={18} className="text-[#00f2ff]" /> Nueva venta</button>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                            {invoicingKpis.map((k, i) => (
                                <div key={i}><AuroraMetricCard onClick={() => {}}><PremiumCard className="p-8 border-none bg-white/80 backdrop-blur-2xl"><div className="flex justify-between items-start mb-6"><div className={`h-14 w-14 rounded-2xl flex items-center justify-center border border-white/50 ${k.bg} ${k.color}`}>{k.icon}</div></div><div><p className="text-[10px] font-black text-gray-400 tracking-widest mb-1.5 uppercase">{k.label}</p><h3 className="text-3xl font-black text-gray-900 tracking-tighter italic"><AnimatedNumber value={k.value} type={k.isSimple ? 'simple' : 'currency'} /></h3></div></PremiumCard></AuroraMetricCard></div>
                            ))}
                        </div>

                        <div className="px-4 space-y-8">
                            <div className="flex flex-col md:flex-row items-center gap-4 w-full max-w-6xl mx-auto">
                                <div className="flex-1 flex items-center gap-4 bg-white/60 backdrop-blur-md p-2 rounded-3xl border border-white/80 shadow-sm w-full"><Search size={22} className="text-gray-300 ml-4" /><input placeholder="Buscar por ID o cliente..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} className="flex-1 bg-transparent outline-none text-sm font-bold text-gray-900 py-4" /></div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setIsHistoryFilterOpen(!isHistoryFilterOpen)} className="h-16 px-6 rounded-3xl border bg-white border-white/80 text-gray-500 shadow-sm transition-all"><Filter size={20}/></button>
                                    <button onClick={async () => { showToast("Generando Auditoría...", "info"); const { generateInvoicesAuditPDF } = await import('@/lib/report-generator'); await generateInvoicesAuditPDF({ userName: companyData?.full_name || 'Empresario', invoices: filteredHistory, range: dateRange }); }} className="h-16 flex items-center gap-2 px-6 rounded-3xl bg-[#004D4D] text-white shadow-2xl hover:bg-black transition-all group"><Download size={20}/><span className="text-[10px] font-black tracking-widest">Exportar PDF</span></button>
                                </div>
                            </div>

                            <div className="bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/80 shadow-xl overflow-hidden mx-4">
                                <table className="w-full text-center">
                                    <thead className="bg-gray-50/50"><tr>{['Factura', 'Fecha', 'Cliente', 'Canal', 'Total', 'Acción'].map(h => <th key={h} className="px-8 py-6 text-[10px] font-black text-[#004D4D] tracking-widest uppercase">{h}</th>)}</tr></thead>
                                    <tbody className="divide-y divide-gray-100/50">
                                        {filteredHistory.map((inv) => (
                                            <tr key={inv.id} className="hover:bg-white/60 transition-all group active:bg-gray-100/50">
                                                <td className="px-8 py-8 font-black text-gray-900 text-sm">{inv.invoice_num}</td>
                                                <td className="px-8 py-8 font-bold text-gray-400 text-xs">{new Date(inv.date).toLocaleDateString()}</td>
                                                <td className="px-8 py-8"><p className="font-bold text-gray-700">{inv.customer}</p><p className="text-[9px] font-black text-[#004D4D] italic">{inv.payment_method}</p></td>
                                                <td className="px-8 py-8"><span className="px-4 py-1.5 bg-gray-100 rounded-full text-[9px] font-black text-gray-400">{inv.source}</span></td>
                                                <td className="px-8 py-8 font-black text-[#004D4D] text-base">$ {inv.total.toLocaleString()}</td>
                                                <td className="px-8 py-8 text-center"><button onClick={() => handleViewDetail(inv)} className="h-10 w-10 bg-white border border-gray-100 text-gray-400 hover:text-[#004D4D] rounded-xl shadow-sm transition-all flex items-center justify-center m-auto group-hover:scale-110 active:scale-95"><Eye size={18}/></button></td>
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
                                    <div className="grid grid-cols-2 gap-6 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                                        <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 tracking-widest ml-1 uppercase">Nombre</label><input value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="Nombre completo" /></div>
                                        <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 tracking-widest ml-1 uppercase">WhatsApp</label><input value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="300..." /></div>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <h3 className="text-2xl font-black italic tracking-tighter text-[#001A1A]">Produc<span className="text-[#004D4D]">tos</span></h3>
                                    <div className="flex items-center gap-4 bg-white p-2 rounded-3xl border border-gray-100 shadow-sm transition-all w-full"><Search size={20} className="text-gray-300 ml-4"/><input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Buscar..." className="flex-1 bg-transparent outline-none text-sm font-bold py-3" /></div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-slate-900">
                                        {filteredProducts.map(p => {
                                            const displayImg = Array.isArray(p.image_url) && p.image_url.length > 0 ? p.image_url[0] : (typeof p.image_url === 'string' ? p.image_url : null);
                                            return (
                                                <button key={p.id} onClick={() => handleProductClick(p)} className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:scale-105 transition-all text-left relative group">
                                                    <div className="aspect-square bg-gray-50 rounded-2xl mb-4 overflow-hidden">{displayImg ? <img src={displayImg} className="h-full w-full object-cover"/> : <div className="h-full w-full flex items-center justify-center text-gray-200"><Package size={24}/></div>}</div>
                                                    <p className="text-[10px] font-black text-gray-900 truncate uppercase">{p.name}</p><p className="text-[11px] font-black mt-1 text-[#004D4D]">${(p.price || 0).toLocaleString()}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 bg-[#F3F4F6] p-8 lg:p-12 flex justify-center items-start relative overflow-y-auto custom-scrollbar">
                            <div className="w-full max-w-3xl bg-white shadow-2xl rounded-[1.5rem] flex flex-col min-h-fit overflow-hidden relative border border-gray-200 p-12 space-y-10 my-8">
                                <div className="flex justify-between items-start border-b-2 border-gray-900 pb-8">
                                    <div className="space-y-4">{companyData?.logo_url ? <img src={companyData.logo_url} className="h-16 w-auto object-contain" /> : <div className="text-3xl font-black italic tracking-tighter text-[#001A1A]">{companyData?.full_name || authEmail?.split('@')[0]}</div>}</div>
                                    <div className="text-right border-2 border-gray-900 p-4 rounded-xl inline-block bg-gray-50 min-w-[220px]">
                                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Factura de Venta</p>
                                        <p className="text-2xl font-black text-[#004D4D]">#{String(history.length + 1).padStart(4, '0')}</p>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="border border-gray-900 rounded-xl overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-900 text-white"><tr><th className="px-6 py-3 text-[9px] font-black uppercase">Descripción del Activo</th><th className="px-4 py-3 text-[9px] font-black uppercase text-center">Cant.</th><th className="px-6 py-3 text-[9px] font-black uppercase text-right">Subtotal</th></tr></thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {invoiceItems.map((item, i) => (
                                                    <tr key={i} className="group hover:bg-gray-50/50">
                                                        <td className="px-6 py-5">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="text-xs font-black text-gray-900 uppercase">{item.name.split('(')[0]}</p>
                                                                {item.name.includes('(') && (
                                                                    <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-0.5 rounded-lg">
                                                                        {item.name.match(/\(([^)]+)\)/)?.[1].split('/').map((part, idx) => {
                                                                            const cleanPart = part.trim();
                                                                            if (cleanPart.includes('#')) {
                                                                                const hex = cleanPart.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}/)?.[0];
                                                                                return <div key={idx} className="flex items-center gap-1"><div className="h-3 w-3 rounded-full border border-white" style={{ backgroundColor: hex }} /></div>;
                                                                            }
                                                                            return <span key={idx} className="text-[8px] font-black text-gray-500 uppercase">{cleanPart}</span>;
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-5 text-center font-black text-xs">{item.quantity}</td>
                                                        <td className="px-6 py-5 text-right font-black text-[#004D4D] text-xs">${(item.price * item.quantity).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-gray-900 rounded-2xl text-white shadow-xl">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Total Neto</span>
                                    <h3 className="text-2xl font-black italic"><AnimatedNumber value={calculateSubtotal()} /></h3>
                                </div>
                                <button onClick={handleFinalize} className="w-full h-16 bg-[#001A1A] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl">Confirmar y Facturar</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedProductForVariant && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-10">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProductForVariant(null)} className="absolute inset-0 bg-[#001A1A]/90 backdrop-blur-2xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="relative bg-white w-full max-w-5xl h-[85vh] rounded-[4rem] shadow-3xl overflow-hidden border border-white/20 flex flex-col md:flex-row text-slate-900">
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
                                                            <button key={v.id} onClick={() => { const newSelections = { ...selectedVariants, [attrName]: v }; setSelectedVariants(newSelections); const base = customerInfo.type === 'mayorista' && (selectedProductForVariant.wholesale_price || 0) > 0 ? selectedProductForVariant.wholesale_price : selectedProductForVariant.price; const adjustments = Object.values(newSelections).reduce((acc: number, sel: any) => acc + (sel.price_adjustment || 0), 0); setTempPrice((base || 0) + adjustments); }} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase border-2 transition-all ${selectedVariants[attrName]?.id === v.id ? 'bg-[#004D4D] border-[#004D4D] text-white shadow-xl scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-[#004D4D]/20'}`}>{v.sku}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="w-full flex flex-col p-8 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100 space-y-6 items-center text-center"><p className="text-[10px] font-black text-[#004D4D] uppercase">Sin variantes configuradas</p></div>
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
