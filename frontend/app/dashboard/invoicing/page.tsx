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
interface Product { id: string; name: string; category: string; description?: string; price: number; wholesale_price?: number; sku: string; image_url?: string; variants?: any[]; }
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
    const [history, setHistory] = useState<PastInvoice[]>([]);
    const [historySearch, setHistorySearch] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [isHistoryFilterOpen, setIsHistoryFilterOpen] = useState(false);
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isDateHovered, setIsDateHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);

    const filteredHistory = useMemo(() => {
        return history.filter(inv => {
            const matchesSearch = (inv.customer?.toLowerCase() || '').includes(historySearch.toLowerCase()) || 
                                 (inv.invoice_num?.toLowerCase() || '').includes(historySearch.toLowerCase());
            
            const invDate = new Date(inv.date);
            const matchesStart = !dateRange.start || invDate >= new Date(dateRange.start);
            const matchesEnd = !dateRange.end || invDate <= new Date(dateRange.end);
            
            return matchesSearch && matchesStart && matchesEnd;
        });
    }, [history, historySearch, dateRange]);

    const handleExportInvoicesPDF = async () => {
        if (filteredHistory.length === 0) {
            showToast("No hay facturas para exportar", "info");
            return;
        }
        try {
            showToast("Generando Reporte de Auditoría...", "info");
            const { generateInvoicesAuditPDF } = await import('@/lib/report-generator');
            await generateInvoicesAuditPDF({
                userName: authEmail?.split('@')[0] || 'Empresario',
                invoices: filteredHistory,
                range: dateRange
            });
            showToast("¡Reporte de ventas listo! 📄", "success");
        } catch (e) {
            console.error(e);
            showToast("Error al exportar", "error");
        }
    };

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
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [tempPrice, setTempPrice] = useState<number>(0);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const loadData = useCallback(async () => {
        if (!token) return;
        try {
            const [pRes, oRes, cRes] = await Promise.all([
                apiRequest<any[]>('/products', { token }),
                apiRequest<any[]>('/orders', { token }),
                apiRequest<any[]>('/collections', { token })
            ]);
            if (pRes) setProducts(pRes);
            if (cRes) setCategories(['Todas', ...cRes.map((c: any) => c.title)]);
            if (oRes) setHistory(oRes.map((o: any) => ({
                id: o.id, invoice_num: `FAC-${o.id.slice(0, 4).toUpperCase()}`, date: o.created_at,
                customer: o.customer_name || 'Final', source: o.source || 'pos', payment_method: o.payment_method || 'cash', total: o.total_price || 0
            })));
        } catch (e) {
            console.error("Error loading data:", e);
        }
    }, [token]);

    useEffect(() => { loadData(); }, [loadData]);

    const addToCart = (product: Product, variant?: any, customPrice?: number) => {
        const targetVariant = variant || product.variants?.[0];
        if (!targetVariant) {
            showToast("Este producto no tiene variantes configuradas", "error");
            return;
        }

        // Determinar precio base (Usar customPrice si viene del modal, sino calcular)
        let finalPrice = customPrice;
        
        if (finalPrice === undefined) {
            const basePrice = customerInfo.type === 'mayorista' && (product.wholesale_price || 0) > 0 
                ? (product.wholesale_price || 0) 
                : product.price;
            finalPrice = basePrice + (targetVariant.price_adjustment || 0);
        }

        const newItem: InvoicingItem = {
            id: product.id,
            variant_id: targetVariant.id,
            name: `${product.name} ${targetVariant.name !== 'Estándar' ? `(${targetVariant.name}: ${targetVariant.sku})` : ''}`,
            price: finalPrice,
            quantity: 1,
            sku: targetVariant.sku || product.sku,
            image: targetVariant.image_url || product.image_url
        };

        setInvoiceItems([...invoiceItems, newItem]);
        setSelectedProductForVariant(null);
        setSelectedVariant(null);
        showToast("Producto añadido", "success");
    };

    const handleProductClick = (product: Product) => {
        if (product.variants && product.variants.length > 1) {
            setSelectedProductForVariant(product);
            setSelectedVariant(product.variants[0]);
            setCurrentImageIndex(0);
            
            // Inicializar precio temporal según tipo de cliente
            const base = customerInfo.type === 'mayorista' && (product.wholesale_price || 0) > 0 
                ? (product.wholesale_price || 0) 
                : product.price;
            setTempPrice(base + (product.variants[0].price_adjustment || 0));
        } else {
            addToCart(product);
        }
    };

    const calculateSubtotal = () => invoiceItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const invoicingKpis = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const ordersToday = history.filter(inv => inv.date?.startsWith(today));
        
        const salesToday = ordersToday.reduce((acc, inv) => acc + (Number(inv.total) || 0), 0);
        const operationsCount = history.length || 0;
        const totalRevenue = history.reduce((acc, inv) => acc + (Number(inv.total) || 0), 0);
        const avgTicket = operationsCount > 0 ? (totalRevenue / operationsCount) : 0;

        const totalsArray = history.map(o => Number(o.total) || 0);
        const maxInvoice = totalsArray.length > 0 ? Math.max(...totalsArray) : 0;
        const minInvoice = totalsArray.length > 0 ? Math.min(...totalsArray) : 0;

        return [
            { 
                label: 'Ventas de Hoy', 
                value: Number(salesToday) || 0, 
                icon: <Activity size={24}/>, 
                isCurrency: true,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
                trend: "Live",
                details: [
                    { l: "Efectivo", v: `$ ${(ordersToday.filter(o => o.payment_method === 'cash').reduce((a, b) => a + (Number(b.total) || 0), 0)).toLocaleString()}`, icon: <DollarSign size={14}/> },
                    { l: "Transferencia", v: `$ ${(ordersToday.filter(o => o.payment_method === 'transfer').reduce((a, b) => a + (Number(b.total) || 0), 0)).toLocaleString()}`, icon: <CreditCard size={14}/> },
                    { l: "Promedio", v: `$ ${(ordersToday.length > 0 ? (salesToday / ordersToday.length) : 0).toLocaleString()}`, icon: <Target size={14}/> }
                ],
                advice: salesToday > 0 ? "Flujo de caja positivo para hoy. Sigue así." : "Aún no hay ventas registradas hoy. ¡Lanza una oferta relámpago!"
            },
            { 
                label: 'Operaciones', 
                value: operationsCount, 
                icon: <ShoppingBag size={24}/>, 
                isSimple: true,
                color: "text-cyan-500",
                bg: "bg-cyan-50",
                trend: "Total",
                details: [
                    { l: "POS Físico", v: `${history.filter(o => o.source === 'pos').length}`, icon: <Store size={14}/> },
                    { l: "Ventas Web", v: `${history.filter(o => o.source === 'web').length}`, icon: <Globe size={14}/> },
                    { l: "WhatsApp", v: `${history.filter(o => o.source === 'whatsapp').length}`, icon: <MessageSquare size={14}/> }
                ],
                advice: "Diversifica tus canales de venta para aumentar el volumen de operaciones."
            },
            { 
                label: 'Ticket Promedio', 
                value: Number(avgTicket) || 0, 
                icon: <Target size={24}/>, 
                isCurrency: true,
                color: "text-purple-600",
                bg: "bg-purple-50",
                trend: "Market",
                details: [
                    { l: "Mayor Valor", v: `$ ${(Number(maxInvoice) || 0).toLocaleString()}`, icon: <TrendingUp size={14}/> },
                    { l: "Menor Valor", v: `$ ${(Number(minInvoice) || 0).toLocaleString()}`, icon: <ArrowDownRight size={14}/> },
                    { l: "Meta Sugerida", v: `$ ${((Number(avgTicket) || 0) * 1.2).toLocaleString()}`, icon: <Zap size={14}/> }
                ],
                advice: avgTicket > 0 ? "Para subir tu ticket, ofrece productos complementarios en el momento de pago." : "Define tus precios estratégicamente para atraer más clientes."
            },
            { 
                label: 'Flujo Caja', 
                value: Number(totalRevenue) || 0, 
                icon: <Wallet size={24}/>, 
                isCurrency: true,
                color: "text-[#004D4D]",
                bg: "bg-[#004D4D]/5",
                trend: "Acumulado",
                details: [
                    { l: "Ingresos", v: `$ ${(Number(totalRevenue) || 0).toLocaleString()}`, icon: <Plus size={14}/> },
                    { l: "Egresos", v: "$ 0", icon: <Minus size={14}/> },
                    { l: "Balance", v: `$ ${(Number(totalRevenue) || 0).toLocaleString()}`, icon: <ShieldCheck size={14}/> }
                ],
                advice: "Mantén tus gastos registrados para tener un balance de rentabilidad real."
            }
        ];
    }, [history]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => (p.name.toLowerCase().includes(productSearch.toLowerCase())) && (selectedCategory === 'Todas' || p.category === selectedCategory)).slice(0, 12);
    }, [productSearch, products, selectedCategory]);

    const handleFinalize = async () => {
        if (invoiceItems.length === 0) return;
        setIsProcessing(true);
        try {
            const body = { customer_name: customerInfo.name || 'Consumidor Final', items: invoiceItems.map(i => ({ product_variant_id: i.variant_id, quantity: i.quantity })), source: 'pos', payment_method: paymentMethod };
            const res = await apiRequest('/orders', { method: 'POST', token, body: JSON.stringify(body) });
            if (res) { showToast("Venta Exitosa ✨", "success"); setIsPOSActive(false); setInvoiceItems([]); loadData(); }
        } catch (e) {} finally { setIsProcessing(false); }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 pb-20 animate-in fade-in duration-1000 text-slate-900">
            <AnimatePresence mode="wait">
                {!isPOSActive ? (
                    <div className="space-y-10">
                        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2"><div className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#00f2ff] animate-pulse" /><span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#004d4d]/60 italic">Terminal de Facturación v2.0</span></div>
                                <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none text-[#001A1A]">FACTURA<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-[#004d4d]">CIÓN</span></h1>
                                <p className="text-gray-400 font-medium text-lg italic mt-4">Hola <span className="text-[#004d4d] font-bold">{authEmail?.split('@')[0]}</span>, audita tu flujo de caja en tiempo real. 👋</p>
                            </div>
                            <button onClick={() => setIsPOSActive(true)} className="h-16 px-10 bg-gray-900 text-white rounded-full font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all">Nueva Venta POS</button>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                            {invoicingKpis.map((k, i) => (
                                <div key={i} onClick={() => setSelectedMetric(k)}>
                                    <PremiumCard className="p-8"><div className="flex justify-between items-start mb-6"><div className={`h-14 w-14 rounded-2xl flex items-center justify-center border border-white/50 ${k.bg} ${k.color}`}>{k.icon}</div></div><div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{k.l}</p><h3 className="text-3xl font-black text-gray-900 tracking-tighter italic"><AnimatedNumber value={k.v} type={k.isSimple ? 'simple' : 'currency'} /></h3></div></PremiumCard>
                                </div>
                            ))}
                        </div>

                        <div className="px-4 space-y-8">
                            <div className="flex flex-col md:flex-row items-center gap-4 w-full max-w-6xl mx-auto">
                                <div className="flex-1 flex items-center gap-4 bg-white/60 backdrop-blur-md p-2 rounded-3xl border border-white/80 shadow-sm transition-all focus-within:shadow-xl focus-within:border-[#004D4D]/20 w-full">
                                    <Search size={22} className="text-gray-300 ml-4" />
                                    <input 
                                        placeholder="Buscar por ID de factura o nombre de cliente..." 
                                        value={historySearch} 
                                        onChange={e => setHistorySearch(e.target.value)} 
                                        className="flex-1 bg-transparent outline-none text-sm font-bold text-gray-900 py-4" 
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <motion.button 
                                        layout
                                        onMouseEnter={() => setIsFilterHovered(true)}
                                        onMouseLeave={() => setIsFilterHovered(false)}
                                        onClick={() => setIsHistoryFilterOpen(!isHistoryFilterOpen)}
                                        className={`h-16 flex items-center gap-2 px-6 rounded-3xl transition-all border ${isHistoryFilterOpen ? 'bg-[#004D4D] text-white border-[#004D4D]' : 'bg-white border-white/80 text-gray-500 hover:text-[#004D4D] shadow-sm'}`}
                                    >
                                        <Filter size={20}/>
                                        <AnimatePresence>
                                            {isFilterHovered && (
                                                <motion.span 
                                                    initial={{ opacity: 0, width: 0, marginLeft: 0 }} 
                                                    animate={{ opacity: 1, width: 'auto', marginLeft: 8 }} 
                                                    exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                                                    className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden"
                                                >
                                                    Filtros
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </motion.button>
                                    
                                    <motion.button 
                                        layout
                                        onMouseEnter={() => setIsDateHovered(true)}
                                        onMouseLeave={() => setIsDateHovered(false)}
                                        className="h-16 flex items-center gap-2 px-6 rounded-3xl bg-white border border-white/80 text-gray-500 hover:text-[#004D4D] shadow-sm"
                                    >
                                        <Calendar size={20}/>
                                        <AnimatePresence>
                                            {isDateHovered && (
                                                <motion.span 
                                                    initial={{ opacity: 0, width: 0, marginLeft: 0 }} 
                                                    animate={{ opacity: 1, width: 'auto', marginLeft: 8 }} 
                                                    exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                                                    className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden"
                                                >
                                                    Fecha
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </motion.button>

                                    <motion.button 
                                        layout
                                        onMouseEnter={() => setIsExportHovered(true)}
                                        onMouseLeave={() => setIsExportHovered(false)}
                                        onClick={handleExportInvoicesPDF}
                                        className="h-16 flex items-center gap-2 px-6 rounded-3xl bg-[#004D4D] text-white shadow-2xl hover:bg-black transition-all group"
                                    >
                                        <Download size={20} className="group-hover:translate-y-0.5 transition-transform"/>
                                        <AnimatePresence>
                                            {isExportHovered && (
                                                <motion.span 
                                                    initial={{ opacity: 0, width: 0, marginLeft: 0 }} 
                                                    animate={{ opacity: 1, width: 'auto', marginLeft: 8 }} 
                                                    exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                                                    className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden"
                                                >
                                                    Exportar PDF
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </motion.button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {isHistoryFilterOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        exit={{ opacity: 0, y: -10 }}
                                        className="max-w-6xl mx-auto p-8 bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/80 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8"
                                    >
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Desde Fecha</label>
                                            <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="w-full p-4 bg-white/50 border border-gray-100 rounded-2xl outline-none font-bold text-sm" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Hasta Fecha</label>
                                            <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="w-full p-4 bg-white/50 border border-gray-100 rounded-2xl outline-none font-bold text-sm" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/80 shadow-xl overflow-hidden">
                                <table className="w-full text-center">
                                    <thead>
                                        <tr className="bg-gray-50/50">
                                            {['Factura', 'Fecha', 'Cliente', 'Canal', 'Total Liquidado'].map((h, i) => (
                                                <th key={i} className="px-8 py-6 text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em]">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100/50">
                                        {filteredHistory.length === 0 ? (
                                            <tr><td colSpan={5} className="py-20 text-center text-gray-300 font-black uppercase text-[10px]">Sin movimientos registrados</td></tr>
                                        ) : filteredHistory.map((inv) => (
                                            <tr key={inv.id} className="hover:bg-white/60 transition-all cursor-pointer group">
                                                <td className="px-8 py-8 font-black text-gray-900 text-sm">{inv.invoice_num}</td>
                                                <td className="px-8 py-8 font-bold text-gray-400 text-xs">{new Date(inv.date).toLocaleDateString()}</td>
                                                <td className="px-8 py-8">
                                                    <p className="font-bold text-gray-700">{inv.customer}</p>
                                                    <p className="text-[9px] font-black text-[#004D4D] uppercase italic">{inv.payment_method}</p>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <span className="px-4 py-1.5 bg-gray-100 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400">{inv.source}</span>
                                                </td>
                                                <td className="px-8 py-8 font-black text-[#004D4D] text-base">$ {inv.total.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <motion.div key="pos-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[3000] flex flex-col lg:flex-row overflow-hidden bg-white">
                        {/* IZQUIERDA: PANEL DE CONTROL (EDICIÓN) */}
                        <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 flex flex-col bg-[#FAFAFA] border-r border-gray-100 overflow-hidden relative">
                            <header className="p-8 border-b bg-white flex justify-between items-center shrink-0">
                                <button onClick={() => setIsPOSActive(false)} className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-rose-500 transition-all"><ArrowLeft size={16}/> Cancelar Venta</button>
                            </header>
                            
                            <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <div className="flex flex-col gap-6">
                                        <div className="flex p-1 bg-gray-100 rounded-2xl w-fit">
                                            <button onClick={() => setPosCustomerMode('create')} className={`px-8 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${posCustomerMode === 'create' ? 'bg-white text-[#004D4D] shadow-md' : 'text-gray-400'}`}>Registrar Nuevo</button>
                                            <button onClick={() => setPosCustomerMode('search')} className={`px-8 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${posCustomerMode === 'search' ? 'bg-white text-[#004D4D] shadow-md' : 'text-gray-400'}`}>Buscar Existente</button>
                                        </div>
                                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#001A1A]">Información del <span className="text-[#004D4D]">Cliente</span></h3>
                                    </div>
                                    {posCustomerMode === 'create' ? (
                                        <div className="grid grid-cols-2 gap-6 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                                            <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label><input value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm focus:bg-white" placeholder="Ej: Juan Pérez" /></div>
                                            <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label><input value={customerInfo.email} onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm focus:bg-white" placeholder="juan@ejemplo.com" /></div>
                                            <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp</label><input value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm focus:bg-white" placeholder="300 000 0000" /></div>
                                            <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Ciudad</label><input value={customerInfo.city} onChange={e => setCustomerInfo({...customerInfo, city: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm focus:bg-white" placeholder="Ej: Medellín" /></div>
                                            <div className="space-y-2 col-span-1 relative">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">¿Dónde nos compras?</label>
                                                <button 
                                                    type="button"
                                                    onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}
                                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between font-bold text-sm hover:bg-white transition-all"
                                                >
                                                    <span className="flex items-center gap-3 text-[#004D4D]">
                                                        {customerInfo.source === 'Tienda Física' ? <Store size={16}/> : customerInfo.source === 'WhatsApp' ? <MessageSquare size={16}/> : <Globe size={16}/>}
                                                        <span className="truncate">{customerInfo.source}</span>
                                                    </span>
                                                    <ChevronDown size={16} className={`transition-transform ${isSourceDropdownOpen ? 'rotate-180' : ''}`}/>
                                                </button>
                                                <AnimatePresence>
                                                    {isSourceDropdownOpen && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: 5 }} 
                                                            animate={{ opacity: 1, y: 0 }} 
                                                            exit={{ opacity: 0, y: 5 }}
                                                            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 p-2"
                                                        >
                                                            {[
                                                                { label: 'Tienda Física', icon: <Store size={14}/> },
                                                                { label: 'WhatsApp', icon: <MessageSquare size={14}/> },
                                                                { label: 'Página Web', icon: <Globe size={14}/> }
                                                            ].map((opt) => (
                                                                <button 
                                                                    key={opt.label}
                                                                    onClick={() => { setCustomerInfo({...customerInfo, source: opt.label}); setIsSourceDropdownOpen(false); }}
                                                                    className="w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-[#004D4D] transition-all"
                                                                >
                                                                    {opt.icon} {opt.label}
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            <div className="space-y-2 col-span-1">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Cliente:</label>
                                                <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 h-[54px] relative isolate">
                                                    <button 
                                                        onClick={() => setCustomerInfo({...customerInfo, type: 'final'})}
                                                        className={`flex-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 ${customerInfo.type === 'final' ? 'text-white' : 'text-gray-400'}`}
                                                    >
                                                        Final
                                                    </button>
                                                    <button 
                                                        onClick={() => setCustomerInfo({...customerInfo, type: 'mayorista'})}
                                                        className={`flex-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 ${customerInfo.type === 'mayorista' ? 'text-white' : 'text-gray-400'}`}
                                                    >
                                                        Mayorista
                                                    </button>
                                                    <motion.div 
                                                        animate={{ x: customerInfo.type === 'final' ? 0 : '100%' }}
                                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                        className="absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-[#004D4D] rounded-xl shadow-lg -z-0"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 flex items-center gap-4 shadow-sm animate-in slide-in-from-right-4"><Search className="text-gray-300"/><input className="bg-transparent outline-none font-bold text-sm flex-1" placeholder="Nombre, ID o Email..." /></div>
                                    )}
                                </div>

                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#001A1A]">PRODUC<span className="text-[#004D4D]">TOS</span></h3>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white p-2 rounded-3xl border border-gray-100 shadow-sm focus-within:shadow-xl focus-within:border-[#004D4D]/20 transition-all w-full">
                                        <Search size={20} className="text-gray-300 ml-4"/>
                                        <input 
                                            value={productSearch} 
                                            onChange={e => setProductSearch(e.target.value)} 
                                            placeholder="Buscar por nombre o SKU de producto..." 
                                            className="flex-1 bg-transparent outline-none text-sm font-bold py-3" 
                                        />
                                    </div>
                                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2 scroll-smooth">
                                        {categories.map(cat => (
                                            <button 
                                                key={cat} 
                                                onClick={() => setSelectedCategory(cat)} 
                                                className={`flex-shrink-0 px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-500 ${selectedCategory === cat ? 'bg-[#004D4D] text-white shadow-xl scale-105' : 'bg-white border border-gray-100 text-gray-400 hover:text-[#004D4D] hover:border-[#004D4D]/20'}`}
                                            >
                                                {cat === 'Todas' ? 'Ver Todo' : cat}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pb-20">
                                        {filteredProducts.map(p => {
                                            const isWholesale = customerInfo.type === 'mayorista' && (p.wholesale_price || 0) > 0;
                                            const displayPrice = isWholesale ? p.wholesale_price : p.price;
                                            
                                            return (
                                                <button 
                                                    key={p.id} 
                                                    onClick={() => handleProductClick(p)} 
                                                    className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:scale-105 transition-all text-left group relative isolate"
                                                >
                                                    {isWholesale && (
                                                        <div className="absolute top-3 right-3 z-10 px-2 py-0.5 bg-[#4fffcb] text-[#004D4D] text-[7px] font-black uppercase rounded-md shadow-sm">Mayorista</div>
                                                    )}
                                                    <div className="aspect-square bg-gray-50 rounded-2xl mb-4 overflow-hidden border border-gray-50">
                                                        {p.image_url ? <img src={p.image_url} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"/> : <div className="h-full w-full flex items-center justify-center text-gray-200"><Package size={24}/></div>}
                                                    </div>
                                                    <p className="text-[10px] font-black text-gray-900 truncate leading-tight">{p.name}</p>
                                                    <p className={`text-[11px] font-black mt-1 ${isWholesale ? 'text-emerald-500' : 'text-[#004D4D]'}`}>
                                                        ${(displayPrice || 0).toLocaleString()}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* MODAL SELECCIÓN DE VARIANTE (PRO DUAL-COLUMN) */}
                        <AnimatePresence>
                            {selectedProductForVariant && (
                                <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 md:p-8">
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProductForVariant(null)} className="absolute inset-0 bg-[#001A1A]/90 backdrop-blur-2xl" />
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95, y: 40 }} 
                                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                                        exit={{ opacity: 0, scale: 0.95, y: 40 }} 
                                        className="relative bg-white w-full max-w-5xl h-[80vh] rounded-[4rem] shadow-3xl overflow-hidden border border-white/20 flex flex-col md:flex-row"
                                    >
                                        {/* COLUMNA IZQUIERDA: GALERÍA */}
                                        <div className="w-full md:w-1/2 bg-gray-50 flex flex-col p-10 space-y-6 shrink-0 border-r border-gray-100">
                                            <div className="flex-1 rounded-[3rem] overflow-hidden bg-white shadow-inner flex items-center justify-center relative group">
                                                {selectedProductForVariant.image_url ? (
                                                    <img 
                                                        src={selectedVariant?.image_url || selectedProductForVariant.image_url} 
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                                        alt="Main"
                                                    />
                                                ) : (
                                                    <Package size={80} className="text-gray-200" />
                                                )}
                                                <div className="absolute top-6 left-6 px-4 py-1.5 bg-white/80 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-[#004D4D]">Vista Previa</div>
                                            </div>
                                            
                                            {/* Miniaturas (Usando variantes como galería) */}
                                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                                <button 
                                                    onClick={() => setSelectedVariant(null)}
                                                    className={`h-20 w-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all ${!selectedVariant ? 'border-[#004D4D] scale-95' : 'border-white opacity-60'}`}
                                                >
                                                    <img src={selectedProductForVariant.image_url} className="w-full h-full object-cover" alt="Thumb" />
                                                </button>
                                                {selectedProductForVariant.variants?.filter(v => v.image_url).map((v, i) => (
                                                    <button 
                                                        key={i}
                                                        onClick={() => setSelectedVariant(v)}
                                                        className={`h-20 w-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all ${selectedVariant?.id === v.id ? 'border-[#004D4D] scale-95' : 'border-white opacity-60'}`}
                                                    >
                                                        <img src={v.image_url} className="w-full h-full object-cover" alt="Thumb" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* COLUMNA DERECHA: SELECCIÓN Y PRECIO */}
                                        <div className="flex-1 p-12 overflow-y-auto custom-scrollbar flex flex-col justify-between space-y-10">
                                            <div className="space-y-8">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest">{selectedProductForVariant.category}</span>
                                                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">REF: {selectedVariant?.sku || selectedProductForVariant.sku}</span>
                                                    </div>
                                                    <h3 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A] leading-none">{selectedProductForVariant.name}</h3>
                                                </div>

                                                <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 italic">
                                                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                                        {selectedProductForVariant.description || 'Sin descripción detallada disponible para este artículo.'}
                                                    </p>
                                                </div>

                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                                        <Layers size={14}/> Seleccionar Variante Disponible
                                                    </label>
                                                    <div className="flex flex-wrap gap-3">
                                                        {selectedProductForVariant.variants?.map((v: any) => (
                                                            <button 
                                                                key={v.id}
                                                                onClick={() => {
                                                                    setSelectedVariant(v);
                                                                    const base = customerInfo.type === 'mayorista' && (selectedProductForVariant.wholesale_price || 0) > 0 
                                                                        ? (selectedProductForVariant.wholesale_price || 0) 
                                                                        : selectedProductForVariant.price;
                                                                    setTempPrice(base + (v.price_adjustment || 0));
                                                                }}
                                                                disabled={v.stock <= 0}
                                                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                                                                    selectedVariant?.id === v.id 
                                                                        ? 'bg-[#004D4D] border-[#004D4D] text-white shadow-xl scale-105' 
                                                                        : v.stock > 0 
                                                                            ? 'bg-white border-gray-100 text-gray-400 hover:border-[#004D4D]/20 hover:text-[#004D4D]'
                                                                            : 'bg-gray-100 border-transparent text-gray-200 cursor-not-allowed opacity-50'
                                                                }`}
                                                            >
                                                                {v.name} ({v.sku})
                                                                {v.stock > 0 && v.stock <= 5 && <span className="ml-2 text-[8px] text-rose-400 animate-pulse">¡Últimas!</span>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-6 pt-10 border-t border-gray-100">
                                                <div className="grid grid-cols-2 gap-6 items-end">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio Unitario Sugerido</label>
                                                        <div className="relative">
                                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-xl">$</span>
                                                            <input 
                                                                type="text" 
                                                                value={tempPrice.toLocaleString('de-DE')}
                                                                onChange={(e) => {
                                                                    const val = Number(e.target.value.replace(/\D/g, ''));
                                                                    setTempPrice(val);
                                                                }}
                                                                className="w-full pl-12 pr-6 py-5 bg-emerald-50 border-2 border-transparent focus:border-emerald-200 rounded-3xl outline-none text-2xl font-black text-emerald-700 shadow-inner"
                                                            />
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => addToCart(selectedProductForVariant, selectedVariant, tempPrice)}
                                                        disabled={!selectedVariant || selectedVariant.stock <= 0}
                                                        className="h-[68px] bg-[#004D4D] text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30 disabled:scale-100"
                                                    >
                                                        <ShoppingCart size={20}/> Sumar a Factura
                                                    </button>
                                                </div>
                                                <button onClick={() => setSelectedProductForVariant(null)} className="w-full text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors tracking-widest text-center">Descartar y Volver</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>

                        {/* DERECHA: PREVISUALIZACIÓN FACTURA REAL (DISEÑO MAESTRO) */}
                        <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 bg-[#001A1A] p-16 flex items-center justify-center relative overflow-hidden text-slate-900">
                            <div className="absolute top-0 right-0 p-20 opacity-5 rotate-12"><Zap size={600} fill="white"/></div>
                            
                            <div className="w-full max-w-2xl bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] rounded-[4rem] flex flex-col h-full overflow-hidden relative border border-white/20 animate-in zoom-in-95 duration-700">
                                {/* Encabezado Factura Real */}
                                <div className="bg-[#004D4D] p-12 text-white flex justify-between items-start shrink-0 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-10"><InteractiveUP /></div>
                                    <div className="space-y-2 relative z-10">
                                        <div className="flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-cyan animate-pulse shadow-[0_0_10px_#00f2ff]"/><span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan">Factura Oficial</span></div>
                                        <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">PRE-DOCUMENTO</h2>
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mt-3">Ref: FA-{new Date().getTime().toString().slice(-6)}</p>
                                    </div>
                                    <div className="text-right space-y-1 relative z-10">
                                        <p className="text-[10px] font-black text-white/60 uppercase">Emisión</p>
                                        <p className="text-sm font-black">{new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Cuerpo de Factura Real */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-12 space-y-12">
                                    <div className="grid grid-cols-2 gap-12 border-b border-gray-100 pb-10">
                                        <div className="space-y-3">
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Facturado A:</p>
                                            <h4 className="text-2xl font-black text-gray-900 italic tracking-tighter leading-tight">{customerInfo.name || 'CLIENTE FINAL'}</h4>
                                            <div className="flex flex-col gap-1.5 text-[10px] font-bold text-gray-400 uppercase">
                                                <div className="flex items-center gap-2"><MapPin size={12} className="text-[#004D4D]"/> {customerInfo.city || 'UBICACIÓN POR DEFINIR'}</div>
                                                <div className="flex items-center gap-2"><Smartphone size={12} className="text-[#004D4D]"/> {customerInfo.phone || 'S/N'}</div>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-3">
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Emitido Por:</p>
                                            <h4 className="text-sm font-black text-[#004D4D] uppercase">{authEmail?.split('@')[0] || 'EMPRESA USUARIA'}</h4>
                                            <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-gray-400 uppercase">
                                                <ShieldCheck size={12} className="text-[#004D4D]"/> Operación Verificada
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="flex items-center text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] px-4 bg-gray-50 py-4 rounded-xl">
                                            <span className="flex-1 text-left">Descripción del Ítem</span>
                                            <span className="w-20 text-center">Cant.</span>
                                            <span className="w-32 text-right">V. Unitario</span>
                                            <span className="w-32 text-right">Total Bruto</span>
                                        </div>
                                        <div className="divide-y divide-gray-50">
                                            {invoiceItems.length === 0 ? (
                                                <div className="py-24 text-center opacity-20 italic text-xs">Agrega productos para previsualizar la liquidación</div>
                                            ) : invoiceItems.map((item, i) => (
                                                <div key={i} className="flex items-center px-4 py-6 group">
                                                    <div className="flex-1 text-left min-w-0">
                                                        <p className="text-sm font-black text-gray-900 uppercase tracking-tighter truncate">{item.name}</p>
                                                        <p className="text-[9px] font-bold text-[#004D4D] uppercase mt-1">Ref: {item.sku}</p>
                                                    </div>
                                                    <div className="w-20 flex items-center justify-center gap-2">
                                                        <button onClick={() => {const ni = [...invoiceItems]; if(ni[i].quantity > 1) ni[i].quantity--; setInvoiceItems(ni);}} className="h-5 w-5 bg-gray-50 rounded-md flex items-center justify-center text-[10px] font-black hover:bg-gray-200">-</button>
                                                        <span className="text-xs font-black text-gray-900 w-4 text-center">{item.quantity}</span>
                                                        <button onClick={() => {const ni = [...invoiceItems]; ni[i].quantity++; setInvoiceItems(ni);}} className="h-5 w-5 bg-gray-50 rounded-md flex items-center justify-center text-[10px] font-black hover:bg-gray-200">+</button>
                                                    </div>
                                                    <div className="w-32 text-right font-black text-xs text-gray-400">${item.price.toLocaleString()}</div>
                                                    <div className="w-32 text-right font-black text-sm text-[#004D4D]">${(item.price * item.quantity).toLocaleString()}</div>
                                                    <button onClick={() => setInvoiceItems(invoiceItems.filter((_, idx) => idx !== i))} className="ml-4 text-rose-200 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-10 border-t-2 border-gray-100 grid grid-cols-2 gap-12 mt-auto">
                                        <div className="p-8 bg-gray-50 rounded-[3rem] border border-gray-100 flex flex-col justify-center gap-4">
                                            <p className="text-[9px] font-black text-[#004D4D] uppercase tracking-[0.2em]">Sello Digital Bayup</p>
                                            <p className="text-[10px] font-medium text-gray-400 italic leading-relaxed">Documento generado mediante Terminal Master POS. Válido como comprobante interno de venta física y digital.</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-[11px] font-black uppercase text-gray-400 tracking-widest px-2"><span>Monto Subtotal</span><span>${calculateSubtotal().toLocaleString()}</span></div>
                                            <div className="flex justify-between items-center text-[11px] font-black uppercase text-gray-400 tracking-widest px-2"><span>Impuestos (0%)</span><span>$0</span></div>
                                            <div className="pt-8 border-t border-gray-50 flex justify-between items-end px-2">
                                                <p className="text-sm font-black uppercase tracking-tighter text-[#004D4D]">Total Neto</p>
                                                <h3 className="text-6xl font-black text-[#001A1A] tracking-tighter leading-none"><AnimatedNumber value={calculateSubtotal()} /></h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Acciones de Factura Real */}
                                <div className="p-12 bg-gray-50 border-t border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
                                    <div className="md:col-span-3 grid grid-cols-2 gap-4">
                                        <button onClick={() => setPaymentMethod('cash')} className={`py-5 rounded-2xl font-black text-[10px] uppercase border-2 flex items-center justify-center gap-3 transition-all ${paymentMethod === 'cash' ? 'bg-[#004D4D] border-[#004D4D] text-white shadow-xl scale-[1.02]' : 'bg-white border-gray-200 text-gray-400'}`}><DollarSign size={16}/> Efectivo</button>
                                        <button onClick={() => setPaymentMethod('transfer')} className={`py-5 rounded-2xl font-black text-[10px] uppercase border-2 flex items-center justify-center gap-3 transition-all ${paymentMethod === 'transfer' ? 'bg-[#004D4D] border-[#004D4D] text-white shadow-xl scale-[1.02]' : 'bg-white border-gray-200 text-gray-400'}`}><CreditCard size={16}/> Transferencia</button>
                                    </div>
                                    <button onClick={handleFinalize} disabled={isProcessing || invoiceItems.length === 0} className="py-5 bg-cyan text-[#001A1A] rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:scale-100">
                                        {isProcessing ? <Loader2 className="animate-spin"/> : <Send size={18}/>} EMITIR FACTURA
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <MetricDetailModal isOpen={!!selectedMetric} onClose={() => setSelectedMetric(null)} metric={selectedMetric} />
            <style jsx global>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; } .custom-scrollbar-dark::-webkit-scrollbar { width: 4px; } .custom-scrollbar-dark::-webkit-scrollbar-thumb { background: #004D4D; border-radius: 10px; }`}</style>
        </div>
    );
}
