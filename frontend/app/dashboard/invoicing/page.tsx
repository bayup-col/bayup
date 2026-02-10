"use client";

import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { InteractiveUP } from '@/components/landing/InteractiveUP';    
import MetricDetailModal from '@/components/dashboard/MetricDetailModal';
import {
  User,
  Users,
  Mail,
  Smartphone,
  Search,
  Plus,
  Minus,
  Trash2,
  MessageSquare,
  CheckCircle2,
  Store,
  DollarSign,
  Printer,
  Calendar,
  Filter,
  TrendingUp,
  ArrowDownRight,
  ShoppingBag,
  Zap,
  ArrowUpRight,
  X,
  Globe,
  Download,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Clock,
  ArrowRight,
  Package,
  ShoppingCart,
  Info,
  CreditCard,
  FileText,
  Hash,
  MapPin,
  Receipt,
  ReceiptText,
  Instagram,
  Home,
  Activity,
  ArrowLeft,
  Loader2,
  Briefcase,
  Send,
  ShieldCheck,
  Navigation,
  Wallet,
  Target,
  Layers
} from 'lucide-react';
import { exportInvoicesToExcel } from '@/lib/invoices-export';
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
interface PastInvoice { id: string; invoice_num: string; date: string; customer: string; customer_email?: string; customer_phone?: string; source: string; payment_method: string; total: number; }

export default function InvoicingPage() {
    const { token, userEmail: authEmail } = useAuth();
    const { showToast } = useToast();
    
    // States
    const [isPOSActive, setIsPOSActive] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<PastInvoice | null>(null);
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

    const handleCreateQuickVariant = async () => {
        if (!quickVariant.name || !quickVariant.sku || !selectedProductForVariant) return;
        setIsCreatingQuickVariant(true);
        try {
            const newV = { name: quickVariant.name, sku: quickVariant.sku, stock: 99, price_adjustment: 0 };
            const updatedProduct = { ...selectedProductForVariant, variants: [...(selectedProductForVariant.variants || []), newV] };
            
            await apiRequest(`/products/${selectedProductForVariant.id}`, {
                method: 'PUT', token,
                body: JSON.stringify(updatedProduct)
            });

            // Actualizar estados locales
            setProducts(prev => prev.map(p => p.id === selectedProductForVariant.id ? updatedProduct : p));
            setSelectedProductForVariant(updatedProduct);
            setSelectedVariants(prev => ({ ...prev, [quickVariant.name]: newV }));
            setQuickVariant({ name: '', sku: '' });
            showToast("Variante creada y guardada ✨", "success");
        } catch (e) {
            showToast("Error al crear variante", "error");
        } finally {
            setIsCreatingQuickVariant(false);
        }
    };

    const loadData = useCallback(async () => {
        if (!token) return;
        try {
            const [pRes, oRes, cRes, userData] = await Promise.all([
                apiRequest<any[]>('/products', { token }),
                apiRequest<any[]>('/orders', { token }),
                apiRequest<any[]>('/collections', { token }),
                apiRequest<any>('/auth/me', { token })
            ]);
            if (pRes) setProducts(pRes);
            if (cRes) setCategories(['Todas', ...cRes.map((c: any) => c.title)]);
            if (userData) setCompanyData(userData);
            if (oRes) setHistory(oRes.map((o: any) => ({
                id: o.id, invoice_num: `FAC-${o.id.slice(0, 4).toUpperCase()}`, date: o.created_at,
                customer: o.customer_name || 'Cliente', source: o.source || 'pos', payment_method: o.payment_method || 'cash', total: o.total_price || 0
            })));
        } catch (e) {}
    }, [token]);

    useEffect(() => { loadData(); }, [loadData]);

    const addToCart = (product: Product, variantsMap?: Record<string, any>, customPrice?: number) => {
        const selections = variantsMap ? Object.values(variantsMap) : (product.variants?.slice(0, 1) || []);
        
        if (selections.length === 0) {
            showToast("Selecciona al menos una variante", "error");
            return;
        }

        selections.forEach((variant: any) => {
            let finalPrice = customPrice !== undefined ? customPrice / selections.length : 0;
            
            if (customPrice === undefined) {
                const base = customerInfo.type === 'mayorista' && (product.wholesale_price || 0) > 0 ? product.wholesale_price : product.price;
                finalPrice = base + (variant.price_adjustment || 0);
            }

            const mainImg = Array.isArray(product.image_url) && product.image_url.length > 0 ? product.image_url[0] : (typeof product.image_url === 'string' ? product.image_url : null);

            const newItem: InvoicingItem = {
                id: product.id, variant_id: variant.id,
                name: `${product.name} (${variant.name}: ${variant.sku})`,
                price: finalPrice, quantity: 1, sku: variant.sku || product.sku,
                image: variant.image_url || mainImg
            };
            setInvoiceItems(prev => [...prev, newItem]);
        });

        setSelectedProductForVariant(null);
        setSelectedVariants({});
        showToast("Añadido a factura ✨", "success");
    };

    const handleProductClick = (product: Product) => {
        setSelectedProductForVariant(product);
        const initialSelections: Record<string, any> = {};
        
        if (product.variants && product.variants.length > 0) {
            const families = Array.from(new Set(product.variants.map(v => v.name)));
            families.forEach(f => {
                const first = product.variants?.find(v => v.name === f);
                if (first) initialSelections[f] = first;
            });
        }
        
        setSelectedVariants(initialSelections);
        const base = customerInfo.type === 'mayorista' && (product.wholesale_price || 0) > 0 ? product.wholesale_price : product.price;
        const adjustments = Object.values(initialSelections).reduce((acc, v) => acc + (v.price_adjustment || 0), 0);
        setTempPrice(base + adjustments);
        setCurrentImageIndex(0);
    };

    const calculateSubtotal = () => invoiceItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                                 (p.sku?.toLowerCase() || '').includes(productSearch.toLowerCase());
            
            const productCategory = p.category || (p as any).collection?.title || 'General';
            const matchesCategory = selectedCategory === 'Todas' || productCategory === selectedCategory;
            
            return matchesSearch && matchesCategory;
        }).slice(0, 12);
    }, [productSearch, products, selectedCategory]);

    const handleFinalize = async () => {
        if (invoiceItems.length === 0) return;
        setIsProcessing(true);
        try {
            const body = { customer_name: customerInfo.name || 'Cliente', items: invoiceItems.map(i => ({ product_variant_id: i.variant_id, quantity: i.quantity })), source: customerInfo.source, payment_method: paymentMethod };
            await apiRequest('/orders', { method: 'POST', token, body: JSON.stringify(body) });
            showToast("Venta Exitosa ✨", "success"); setIsPOSActive(false); setInvoiceItems([]); loadData();
        } catch (e) {} finally { setIsProcessing(false); }
    };

    const invoicingKpis = useMemo(() => {
        const totalRevenue = history.reduce((acc, inv) => acc + (Number(inv.total) || 0), 0);
        const operationsCount = history.length || 0;
        const avgTicket = operationsCount > 0 ? (totalRevenue / operationsCount) : 0;
        const salesToday = history.filter(inv => inv.date?.startsWith(new Date().toISOString().split('T')[0])).reduce((acc, inv) => acc + (Number(inv.total) || 0), 0);
        return [
            { label: 'Ventas Hoy', v: salesToday, icon: <Activity size={24}/>, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: 'Operaciones', v: operationsCount, icon: <ShoppingBag size={24}/>, isSimple: true, color: "text-cyan-500", bg: "bg-cyan-50" },
            { label: 'Promedio', v: avgTicket, icon: <Target size={24}/>, color: "text-purple-600", bg: "bg-purple-50" },
            { label: 'Flujo Caja', v: totalRevenue, icon: <Wallet size={24}/>, color: "text-[#004D4D]", bg: "bg-[#004D4D]/5" }
        ];
    }, [history]);

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 pb-20 text-slate-900">
            <AnimatePresence mode="wait">
                {!isPOSActive ? (
                    <div className="space-y-10 p-4 animate-in fade-in duration-700">
                        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-4">
                            <div>
                                <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-[#001A1A]">FACTURA<span className="text-[#004D4D]">CIÓN</span></h1>
                                <p className="text-gray-400 font-medium text-lg italic mt-4">Hola <span className="text-[#004d4d] font-bold">{authEmail?.split('@')[0]}</span>, audita tu flujo en tiempo real. 👋</p>
                            </div>
                            <button onClick={() => setIsPOSActive(true)} className="h-16 px-10 bg-gray-900 text-white rounded-full font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all">Nueva Venta POS</button>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                            {invoicingKpis.map((k, i) => (
                                <div key={i} onClick={() => setSelectedMetric(k)}>
                                    <PremiumCard className="p-8"><div className="flex justify-between items-start mb-6"><div className={`h-14 w-14 rounded-2xl flex items-center justify-center border border-white/50 ${k.bg} ${k.color}`}>{k.icon}</div></div><div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{k.label}</p><h3 className="text-3xl font-black text-gray-900 tracking-tighter italic"><AnimatedNumber value={k.v} type={k.isSimple ? 'simple' : 'currency'} /></h3></div></PremiumCard>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/80 shadow-xl overflow-hidden mx-4">
                            <table className="w-full text-center">
                                <thead className="bg-gray-50/50"><tr>{['Factura', 'Fecha', 'Cliente', 'Canal', 'Total'].map(h => <th key={h} className="px-8 py-6 text-[10px] font-black text-[#004D4D] uppercase tracking-widest">{h}</th>)}</tr></thead>
                                <tbody className="divide-y divide-gray-100/50">
                                    {history.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-white/60 transition-all">
                                            <td className="px-8 py-8 font-black text-gray-900 text-sm">{inv.invoice_num}</td>
                                            <td className="px-8 py-8 font-bold text-gray-400 text-xs">{new Date(inv.date).toLocaleDateString()}</td>
                                            <td className="px-8 py-8"><p className="font-bold text-gray-700">{inv.customer}</p><p className="text-[9px] font-black text-[#004D4D] uppercase italic">{inv.payment_method}</p></td>
                                            <td className="px-8 py-8"><span className="px-4 py-1.5 bg-gray-100 rounded-full text-[9px] font-black uppercase text-gray-400">{inv.source}</span></td>
                                            <td className="px-8 py-8 font-black text-[#004D4D] text-base">$ {inv.total.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[3000] flex flex-col lg:flex-row overflow-hidden bg-white">
                        <div className="flex-1 flex flex-col bg-[#FAFAFA] border-r border-gray-100 overflow-hidden relative">
                            <header className="p-8 border-b bg-white flex justify-between items-center shrink-0">
                                <button onClick={() => setIsPOSActive(false)} className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-rose-500 transition-all"><ArrowLeft size={16}/> Cancelar Venta</button>
                            </header>
                            
                            <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                                <div className="space-y-8">
                                    <div className="flex p-1 bg-gray-100 rounded-2xl w-fit">
                                        <button onClick={() => setPosCustomerMode('create')} className={`px-8 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${posCustomerMode === 'create' ? 'bg-white text-[#004D4D] shadow-md' : 'text-gray-400'}`}>Registrar Nuevo</button>
                                        <button onClick={() => setPosCustomerMode('search')} className={`px-8 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${posCustomerMode === 'search' ? 'bg-white text-[#004D4D] shadow-md' : 'text-gray-400'}`}>Buscar Existente</button>
                                    </div>
                                    
                                    {posCustomerMode === 'create' && (
                                        <div className="grid grid-cols-2 gap-6 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm animate-in slide-in-from-top-4">
                                            <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label><input value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl outline-none font-bold text-sm focus:bg-white focus:border-[#004D4D]/10 transition-all" placeholder="Ej: Juan Pérez" /></div>
                                            <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label><input value={customerInfo.email} onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})} className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl outline-none font-bold text-sm focus:bg-white focus:border-[#004D4D]/10 transition-all" placeholder="juan@ejemplo.com" /></div>
                                            <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp</label><input value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl outline-none font-bold text-sm focus:bg-white focus:border-[#004D4D]/10 transition-all" placeholder="300 000 0000" /></div>
                                            <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Ciudad</label><input value={customerInfo.city} onChange={e => setCustomerInfo({...customerInfo, city: e.target.value})} className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl outline-none font-bold text-sm focus:bg-white focus:border-[#004D4D]/10 transition-all" placeholder="Ej: Medellín" /></div>
                                            
                                            <div className="space-y-2 relative">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Canal de Venta</label>
                                                <button onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)} className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl flex items-center justify-between font-bold text-sm hover:bg-white hover:border-[#004D4D]/10 transition-all">
                                                    <span className="text-[#004D4D] flex items-center gap-2">{customerInfo.source === 'Tienda Física' ? <Store size={14}/> : <MessageSquare size={14}/>} {customerInfo.source}</span><ChevronDown size={16} className={`transition-transform ${isSourceDropdownOpen ? 'rotate-180' : ''}`}/>
                                                </button>
                                                <AnimatePresence>
                                                    {isSourceDropdownOpen && (
                                                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-2">
                                                            {['Tienda Física', 'WhatsApp', 'Página Web', 'Redes Sociales'].map(opt => (
                                                                <button key={opt} onClick={() => { setCustomerInfo({...customerInfo, source: opt}); setIsSourceDropdownOpen(false); }} className="w-full text-left p-3 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-[#004D4D] transition-all">{opt}</button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Tarifa:</label>
                                                <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 h-[54px] relative isolate">
                                                    <button onClick={() => setCustomerInfo({...customerInfo, type: 'final'})} className={`flex-1 rounded-xl text-[9px] font-black uppercase z-10 transition-colors ${customerInfo.type === 'final' ? 'text-white' : 'text-gray-400'}`}>Final</button>
                                                    <button onClick={() => setCustomerInfo({...customerInfo, type: 'mayorista'})} className={`flex-1 rounded-xl text-[9px] font-black uppercase z-10 transition-colors ${customerInfo.type === 'mayorista' ? 'text-white' : 'text-gray-400'}`}>Mayorista</button>
                                                    <motion.div animate={{ x: customerInfo.type === 'final' ? 0 : '100%' }} className="absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-[#004D4D] rounded-xl shadow-lg -z-0" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {posCustomerMode === 'search' && (
                                        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm animate-in slide-in-from-top-4">
                                            <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-3xl border border-transparent focus-within:border-[#004D4D]/10 focus-within:bg-white transition-all">
                                                <Search size={22} className="text-gray-300 ml-4" /><input className="flex-1 bg-transparent outline-none font-bold text-sm py-4 text-gray-900" placeholder="Buscar cliente por nombre, WhatsApp o email..." />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Método de Pago:</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => setPaymentMethod('cash')} className={`py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest border-2 transition-all ${paymentMethod === 'cash' ? 'bg-[#004D4D] border-[#004D4D] text-white shadow-lg scale-[1.02]' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-[#004D4D]/20'}`}><DollarSign size={14} className="inline mr-2"/> Pago en Efectivo</button>
                                            <button onClick={() => setPaymentMethod('transfer')} className={`py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest border-2 transition-all ${paymentMethod === 'transfer' ? 'bg-[#004D4D] border-[#004D4D] text-white shadow-lg scale-[1.02]' : 'bg-white border-gray-100 text-gray-400 hover:border-[#004D4D]/20'}`}><CreditCard size={14} className="inline mr-2"/> Transferencia</button>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#001A1A]">PRODUC<span className="text-[#004D4D]">TOS</span></h3>
                                    
                                    <div className="flex items-center gap-4 bg-white p-2 rounded-3xl border border-gray-100 shadow-sm focus-within:shadow-xl focus-within:border-[#004D4D]/20 transition-all w-full">
                                        <Search size={20} className="text-gray-300 ml-4"/><input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Buscar por nombre o SKU..." className="flex-1 bg-transparent outline-none text-sm font-bold py-3" />
                                    </div>

                                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                        {categories.map(cat => (
                                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex-shrink-0 px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-[#004D4D] text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-400 hover:text-[#004D4D]'}`}>{cat}</button>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pb-20 text-slate-900">
                                        {filteredProducts.map(p => {
                                            const isWholesale = customerInfo.type === 'mayorista' && (p.wholesale_price || 0) > 0;
                                            const displayPrice = isWholesale ? p.wholesale_price : p.price;
                                            const displayImage = Array.isArray(p.image_url) && p.image_url.length > 0 ? p.image_url[0] : (typeof p.image_url === 'string' ? p.image_url : null);
                                            return (
                                                <button 
                                                    key={p.id} 
                                                    onClick={() => handleProductClick(p)} 
                                                    className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:scale-105 transition-all text-left group relative isolate"
                                                >
                                                    {isWholesale && <div className="absolute top-3 right-3 z-10 px-2 py-0.5 bg-[#4fffcb] text-[#004D4D] text-[7px] font-black uppercase rounded-md shadow-sm">Mayorista</div>}
                                                    
                                                    {/* Botón de Sumado Rápido (+) */}
                                                    <div 
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Evitar que abra el modal
                                                            addToCart(p); // Añadir directo a factura
                                                        }}
                                                        className="absolute top-3 right-3 z-20 h-8 w-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 hover:bg-emerald-600 hover:scale-110 active:scale-90 cursor-pointer"
                                                    >
                                                        <Plus size={18} strokeWidth={3} />
                                                    </div>

                                                    <div className="aspect-square bg-gray-50 rounded-2xl mb-4 overflow-hidden">{displayImage ? <img src={displayImage} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"/> : <div className="h-full w-full flex items-center justify-center text-gray-200"><Package size={24}/></div>}</div>
                                                    <p className="text-[10px] font-black text-gray-900 truncate">{p.name}</p>
                                                    <p className={`text-[11px] font-black mt-1 ${isWholesale ? 'text-emerald-500' : 'text-[#004D4D]'}`}>${displayPrice.toLocaleString()}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 bg-[#F3F4F6] p-8 lg:p-16 flex items-center justify-center relative">
                            <div className="absolute top-0 right-0 p-20 opacity-[0.03] rotate-12 -z-0"><Zap size={600} fill="#004D4D"/></div>
                            <div className="w-full max-w-2xl bg-white shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] rounded-[4rem] flex flex-col h-full overflow-hidden relative border border-white animate-in zoom-in-95 duration-700 z-10">
                                <div className="bg-white p-12 flex justify-between items-center shrink-0 border-b border-gray-50">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 mb-3"><div className="h-1.5 w-1.5 rounded-full bg-[#00F2FF] animate-ping"/><span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#004D4D]">Documento Oficial de Venta</span></div>
                                        {companyData?.logo_url ? <img src={companyData.logo_url} className="h-12 w-auto object-contain" /> : <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-[#001A1A]">{companyData?.full_name || authEmail?.split('@')[0]}</h2>}
                                    </div>
                                    <div className="text-right"><p className="text-[9px] font-black text-gray-300 uppercase">Comprobante</p><p className="text-lg font-black text-[#004D4D]">#{String(history.length + 1).padStart(4, '0')}</p></div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-12 space-y-12">
                                    <div className="grid grid-cols-2 gap-12 text-slate-900">
                                        <div className="space-y-4">
                                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em] bg-gray-50 w-fit px-3 py-1 rounded-full">Datos del Cliente</p>
                                            <h4 className="text-xl font-black italic uppercase text-gray-900">{customerInfo.name || 'Cliente Particular'}</h4>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase"><Mail size={12} className="text-[#004D4D]"/> {customerInfo.email || 'Sin correo'}</div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase"><Smartphone size={12} className="text-[#004D4D]"/> {customerInfo.phone || 'Sin número'}</div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase"><MapPin size={12} className="text-[#004D4D]"/> {customerInfo.city || 'Sin ciudad'}</div>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-4">
                                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em] bg-gray-50 w-fit px-3 py-1 rounded-full ml-auto">Datos del Vendedor</p>
                                            <h4 className="text-sm font-black text-[#004D4D] uppercase">{companyData?.full_name || authEmail?.split('@')[0]}</h4>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase justify-end">{companyData?.email || authEmail} <Mail size={12} className="text-[#004D4D]"/></div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase justify-end">{companyData?.phone || 'Sin WhatsApp'} <Smartphone size={12} className="text-[#004D4D]"/></div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase justify-end">{companyData?.city || 'Sede'} <MapPin size={12} className="text-[#004D4D]"/></div>
                                                <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase mt-2"><ShieldCheck size={12}/> Operación Verificada</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center text-[8px] font-black text-gray-300 uppercase tracking-[0.3em] px-4"><span className="flex-1">Descripción del Activo</span><span className="w-16 text-center">Qty</span><span className="w-28 text-right">Subtotal</span></div>
                                        <div className="space-y-2">
                                            {invoiceItems.map((item, i) => (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className="flex items-center px-6 py-5 bg-gray-50/50 rounded-3xl group">
                                                    <div className="flex-1 min-w-0"><p className="text-xs font-black text-gray-900 uppercase truncate">{item.name}</p><p className="text-[7px] font-bold text-[#004D4D] uppercase">Ref: {item.sku}</p></div>
                                                    <div className="w-16 flex items-center justify-center gap-2">
                                                        <button onClick={() => {const ni = [...invoiceItems]; if(ni[i].quantity > 1) ni[i].quantity--; setInvoiceItems(ni);}} className="h-5 w-5 bg-white border rounded">-</button>
                                                        <span className="text-xs font-black text-gray-900">{item.quantity}</span>
                                                        <button onClick={() => {const ni = [...invoiceItems]; ni[i].quantity++; setInvoiceItems(ni);}} className="h-5 w-5 bg-white border rounded">+</button>
                                                    </div>
                                                    <div className="w-28 text-right font-black text-xs text-[#004D4D]">${(item.price * item.quantity).toLocaleString()}</div>
                                                    <button onClick={() => setInvoiceItems(invoiceItems.filter((_, idx) => idx !== i))} className="ml-4 text-rose-200 hover:text-rose-500"><Trash2 size={14}/></button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-10 mt-auto">
                                        <div className="bg-gray-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group border border-white/5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                                <div className="space-y-4"><div className="flex items-center gap-3"><div className="h-1.5 w-1.5 rounded-full bg-[#00F2FF]"/><p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Resumen de Liquidación</p></div><p className="text-[10px] font-medium text-white/30 italic max-w-xs">Comprobante oficial de compra.</p></div>
                                                <div className="space-y-6 flex flex-col justify-center text-center">
                                                    <div className="flex justify-between text-[10px] font-black uppercase text-white/40 px-2"><span>Subtotal Bruto</span><span>${calculateSubtotal().toLocaleString()}</span></div>
                                                    <div className="pt-8 border-t border-white/10">
                                                        <p className="text-[8px] font-black uppercase text-white/40 mb-2 tracking-widest">Total Neto a Pagar</p>
                                                        <h3 className="text-4xl font-black tracking-tighter text-white truncate"><AnimatedNumber value={calculateSubtotal()} /></h3>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 bg-gray-50 border-t flex gap-4 shrink-0">
                                    <button type="button" onClick={() => showToast("Descargando...", "info")} className="flex-1 h-16 bg-white border border-gray-200 text-gray-400 rounded-2xl font-black text-[10px] uppercase hover:text-[#004D4D] transition-all flex items-center justify-center gap-3 shadow-sm"><Download size={18}/> Descargar</button>
                                    <button onClick={handleFinalize} disabled={isProcessing || invoiceItems.length === 0} className="flex-[2] h-16 bg-[#001A1A] text-white rounded-2xl font-black text-[11px] uppercase shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-30">{isProcessing ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>} FACTURAR</button>
                                </div>
                            </div>
                        </div>

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
                                                                        <button key={v.id} onClick={() => { const newSelections = { ...selectedVariants, [attrName]: v }; setSelectedVariants(newSelections); const base = customerInfo.type === 'mayorista' && (selectedProductForVariant.wholesale_price || 0) > 0 ? selectedProductForVariant.wholesale_price : selectedProductForVariant.price; const adjustments = Object.values(newSelections).reduce((acc, sel) => acc + (sel.price_adjustment || 0), 0); setTempPrice(base + adjustments); }} disabled={v.stock <= 0} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase border-2 transition-all ${selectedVariants[attrName]?.id === v.id ? 'bg-[#004D4D] border-[#004D4D] text-white shadow-xl scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-[#004D4D]/20'}`}>{v.sku}</button>
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
                                                            <button onClick={handleCreateQuickVariant} disabled={!quickVariant.name || !quickVariant.sku || isCreatingQuickVariant} className="w-full py-3 bg-[#004D4D] text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg disabled:opacity-30">{isCreatingQuickVariant ? 'Creando...' : '+ Crear Variante Rápida'}</button>
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
                    </motion.div>
                )}
            </AnimatePresence>
            <MetricDetailModal isOpen={!!selectedMetric} onClose={() => setSelectedMetric(null)} metric={selectedMetric} />
            <style jsx global>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }`}</style>
        </div>
    );
}