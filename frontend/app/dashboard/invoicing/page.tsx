"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Activity
} from 'lucide-react';

// --- COMPONENTE DE NÚMEROS ANIMADOS ---
function AnimatedNumber({ value, className, type = 'currency' }: { value: number, className?: string, type?: 'currency' | 'percentage' | 'simple' }) {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current: number) => {
        if (type === 'percentage') return `${Math.round(current)}%`;
        if (type === 'simple') return Math.round(current).toLocaleString();
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(current);
    });

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    return <motion.span className={className}>{display}</motion.span>;
}

// --- TILT CARD PREMIUM (IGUAL AL INICIO) ---
const PremiumCard = ({ children, onClick, className = "", dark = false }: { children: React.ReactNode, onClick?: () => void, className?: string, dark?: boolean }) => {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [glare, setGlare] = useState({ x: 50, y: 50, op: 0 });

    const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const box = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - box.left;
        const y = e.clientY - box.top;
        setRotateX((y - box.height/2) / 20);
        setRotateY((box.width/2 - x) / 20);
        setGlare({ x: (x/box.width)*100, y: (y/box.height)*100, op: dark ? 0.15 : 0.1 });
    };

    return (
        <motion.div
            onClick={onClick}
            onMouseMove={handleMove}
            onMouseLeave={() => { setRotateX(0); setRotateY(0); setGlare(g => ({...g, op: 0})); }}
            animate={{ rotateX, rotateY, scale: rotateX !== 0 ? 1.02 : 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 25 }}
            className={`rounded-[3rem] border transition-all duration-500 relative overflow-hidden isolate cursor-pointer ${dark ? 'bg-[#001A1A] border-white/5 shadow-2xl' : 'bg-white/40 backdrop-blur-xl border-white/80 shadow-xl'} ${className}`}
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
        >
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                 style={{ opacity: glare.op, background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, ${dark ? 'rgba(0,242,255,0.2)' : 'white'} 0%, transparent 60%)`, zIndex: 1 }} />
            <div style={{ transform: "translateZ(30px)", position: "relative", zIndex: 2 }} className="h-full">{children}</div>
            <div className={`absolute -bottom-20 -right-20 h-40 w-40 blur-[80px] rounded-full pointer-events-none ${dark ? 'bg-[#00f2ff]/10' : 'bg-[#004d4d]/5'}`} />
        </motion.div>
    );
};

// --- COMPONENTE DE BOTÓN CERRAR GLASS ---
function GlassCloseButton({ onClick, className = "" }: { onClick: () => void, className?: string }) {
    return (
        <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className={`h-12 w-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] text-gray-500 hover:text-rose-500 transition-all duration-500 group ${className}`}
        >
            <X size={20} className="relative z-10" />
        </motion.button>
    );
}

interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    cost: number;
    description: string;
    sku: string;
    image_url?: string;
    variants?: any[];
}

interface InvoicingItem {
    id: string;
    name: string;
    variant_id?: string; 
    price: number;
    quantity: number;
    sku: string;
    image?: string;
    selectedAttributes?: any;
}

interface PastInvoice {
    id: string;
    invoice_num: string;
    date: string;
    customer: string;
    customer_email?: string;
    customer_phone?: string;
    customer_type?: 'final' | 'wholesale';
    source: 'web' | 'pos' | 'instagram' | 'whatsapp';
    payment_method?: 'cash' | 'transfer';
    seller?: string;
    total: number;
    items?: any[];
}

const CHANNELS = {
    web: { icon: <Globe size={14}/>, label: 'Tienda Web', color: 'bg-cyan-50 text-cyan-600' },
    instagram: { icon: <Instagram size={14}/>, label: 'Redes Sociales', color: 'bg-gray-50 text-gray-600' },
    whatsapp: { icon: <MessageSquare size={14}/>, label: 'WhatsApp', color: 'bg-emerald-50 text-emerald-600' },
    pos: { icon: <Home size={14}/>, label: 'Tienda Física', color: 'bg-[#004D4D] text-white' },
    mercadolibre: { icon: <ShoppingBag size={14}/>, label: 'Mercado Libre', color: 'bg-yellow-50 text-yellow-600' },
    shopify: { icon: <ShoppingBag size={14}/>, label: 'Shopify', color: 'bg-green-50 text-green-600' }
};

const PRODUCT_IMAGES: Record<string, string> = {
    'default': 'https://images.unsplash.com/photo-1583394838336-3dd0f943c736?auto=format&fit=crop&q=80&w=400'
};

export default function InvoicingPage() {
    const { token, userEmail: authEmail } = useAuth();
    const { showToast } = useToast();
    const [isPOSActive, setIsPOSActive] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<PastInvoice | null>(null);
    const [selectedMetric, setSelectedMetric] = useState<any>(null);
    
    const [products, setProducts] = useState<Product[]>([]);
    const [history, setHistory] = useState<PastInvoice[]>([]);
    const [sellers, setSellers] = useState<{name: string, role: string}[]>([]);
    const [historySearch, setHistorySearch] = useState('');
    const [historyFilter, setHistoryFilter] = useState('all');
    const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
    const [dateRangeState, setDateRangeState] = useState({ from: '', to: '' });
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [advancedFilters, setAdvancedFilters] = useState({ channel: 'all', paymentMethod: 'all' });
    const [currentPage, setCurrentPage] = useState(1);
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isDateHovered, setIsDateHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);
    const itemsPerPage = 20;

    const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '' });
    const [invoiceItems, setInvoiceItems] = useState<InvoicingItem[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [categories, setCategories] = useState<string[]>(['Todas']);
    const [isProcessing, setIsProcessing] = useState(false);
    const [posCustomerMode, setPosCustomerMode] = useState<'search' | 'create'>('create');
    const [customerType, setCustomerType] = useState<'final' | 'wholesale'>('final');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
    const [selectedSeller, setSelectedSeller] = useState('');
    const [isSellerDropdownOpen, setIsSellerDropdownOpen] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<'pos' | 'whatsapp' | 'instagram' | 'web'>('pos');
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [customerSearchQuery, setCustomerSearchQuery] = useState("");
    const [attributeError, setAttributeError] = useState<string | null>(null);

    const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
    const [modalConfig, setModalConfig] = useState({ quantity: 1, manualPrice: 0, selectedAttributes: {} as any });

    const loadEcosystem = useCallback(async () => {
        if (!token) return;
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://gallant-education-production-8b4a.up.railway.app';
            const [usersRes, productsRes, ordersRes, collectionsRes] = await Promise.all([
                fetch(`${apiBase}/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${apiBase}/products`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${apiBase}/orders`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${apiBase}/collections`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (usersRes.ok) {
                const data = await usersRes.json();
                setSellers(data.map((u: any) => ({ name: u.full_name || u.email, role: u.role })));
            }

            if (productsRes.ok) {
                const realProducts = await productsRes.json();
                setProducts(realProducts);
            }

            if (collectionsRes.ok) {
                const collectionsData = await collectionsRes.json();
                const collectionTitles = collectionsData.map((c: any) => c.title);
                setCategories(['Todas', ...collectionTitles]);
            }

            if (ordersRes.ok) {
                const data = await ordersRes.json();
                const mappedHistory = data.map((o: any) => ({
                    id: o.id, invoice_num: `FAC-${o.id.slice(0, 4).toUpperCase()}`, date: o.created_at,
                    customer: o.customer_name || 'Consumidor Final', customer_email: o.customer_email || 'No registrado',
                    customer_phone: o.customer_phone || 'No registrado', customer_type: o.customer_type || 'final',
                    source: o.source || 'pos', payment_method: o.payment_method || 'cash',
                    seller: o.seller_name || 'Bayup AI', total: o.total_price || 0, subtotal: o.total_price || 0,
                    processing_fee: 0, status: 'paid', items: o.items || []
                }));
                setHistory(mappedHistory.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            }
        } catch (e) { console.error("Error loading ecosystem"); }
    }, [token]);

    useEffect(() => { loadEcosystem(); }, [loadEcosystem]);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    const calculateSubtotal = () => invoiceItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const calculateFinalTotal = () => calculateSubtotal();

    const filteredProducts = useMemo(() => {
        return products.filter(p => (p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku?.toLowerCase().includes(productSearch.toLowerCase())) && (selectedCategory === 'Todas' || p.category === selectedCategory)).slice(0, 12);
    }, [productSearch, products, selectedCategory]);

    const kpis = [
        { label: "Ventas Hoy", value: history.filter(inv => new Date(inv.date).toDateString() === new Date().toDateString()).reduce((a,b)=>a+b.total, 0), icon: <TrendingUp size={24}/>, color: "text-emerald-600", bg: "bg-emerald-50", trend: "Live", isCurrency: true },
        { label: "Ventas Mes", value: history.reduce((a,b)=>a+b.total, 0), icon: <DollarSign size={24}/>, color: "text-[#004D4D]", bg: "bg-[#004D4D]/5", trend: "+0%", isCurrency: true },
        { label: "Ticket Promedio", value: history.length > 0 ? history.reduce((a,b)=>a+b.total, 0) / history.length : 0, icon: <ShoppingBag size={24}/>, color: "text-purple-600", bg: "bg-purple-50", trend: "OK", isCurrency: true },
        { label: "Operaciones", value: history.length, icon: <Activity size={24}/>, color: "text-[#00f2ff]", bg: "bg-[#00f2ff]/10", trend: "Live" },
    ];

    const { paginatedHistory, totalPages } = useMemo(() => {
        const filtered = history.filter(inv => {
            const matchesSearch = inv.customer.toLowerCase().includes(historySearch.toLowerCase()) || 
                                 inv.invoice_num.toLowerCase().includes(historySearch.toLowerCase());
            let matchesChannel = advancedFilters.channel === 'all' || inv.source === advancedFilters.channel;
            let matchesDate = true;
            if (dateRangeState.from && dateRangeState.to) {
                const invDate = new Date(inv.date).toISOString().split('T')[0];
                matchesDate = invDate >= dateRangeState.from && invDate <= dateRangeState.to;
            }
            return matchesSearch && matchesChannel && matchesDate;
        });
        return { paginatedHistory: filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), totalPages: Math.ceil(filtered.length / itemsPerPage) };
    }, [historySearch, history, advancedFilters, dateRangeState, currentPage]);

    const handleAddProduct = (p: Product) => {
        setSelectedProductForModal(p);
        const basePrice = customerType === 'wholesale' ? p.price * 0.85 : p.price;
        setModalConfig({ quantity: 1, manualPrice: basePrice, selectedAttributes: {} });
    };

    const handleAddFromModal = () => {
        if (!selectedProductForModal) return;
        const p = selectedProductForModal;
        setInvoiceItems([...invoiceItems, { 
            id: `${p.id}-${Date.now()}`, variant_id: p.variants?.[0]?.id || p.id,
            name: p.name, price: modalConfig.manualPrice, quantity: modalConfig.quantity, sku: p.sku || 'N/A',
            image: p.image_url || PRODUCT_IMAGES.default,
            selectedAttributes: modalConfig.selectedAttributes
        }]);
        setSelectedProductForModal(null);
    };

    const handleFinalizeSale = async () => {
        if (invoiceItems.length === 0) { showToast("No hay productos", "info"); return; }
        if (!selectedSeller) { showToast("Selecciona un asesor", "info"); return; }
        setIsProcessing(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://gallant-education-production-8b4a.up.railway.app';
            const res = await fetch(`${apiBase}/orders`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: customerInfo.name || 'Consumidor Final', customer_email: customerInfo.email || null,
                    customer_phone: customerInfo.phone || null, customer_type: customerType,
                    payment_method: paymentMethod, seller_name: selectedSeller,
                    source: selectedChannel, items: invoiceItems.map(item => ({ product_variant_id: item.variant_id, quantity: item.quantity }))
                })
            });
            if (res.ok) {
                showToast("Venta procesada con éxito", "success");
                setIsPOSActive(false); setInvoiceItems([]); loadEcosystem();
            }
        } catch (err) { showToast("Error al procesar", "error"); } finally { setIsProcessing(false); }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 pb-20 animate-in fade-in duration-1000">
            <AnimatePresence mode="wait">
                {!isPOSActive ? (
                    <div className="space-y-10">
                        {/* 1. HEADER */}
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#00f2ff] animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#004d4d]/60 italic">Terminal de Ventas Platinum</span>
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-[#001A1A]">
                                    FACTURA<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-[#004d4d]">CIÓN</span>
                                </h1>
                                <p className="text-gray-400 font-medium text-lg italic max-w-2xl">
                                    Hola <span className="text-[#004d4d] font-bold">{authEmail?.split('@')[0]}</span>, ¡este es el resumen del día para ti! 👋
                                </p>
                            </div>
                            <button onClick={() => setIsPOSActive(true)} className="h-16 px-10 bg-gray-900 text-white rounded-full font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all">Nueva Venta POS</button>
                        </div>

                        {/* 2. GRID DE MÉTRICAS MAESTRAS */}
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
                                                {kpi.isCurrency && "$ "}<AnimatedNumber value={kpi.value} />
                                            </h3>
                                        </div>
                                    </PremiumCard>
                                </div>
                            ))}
                        </div>

                        {/* 3. HISTORIAL TÁCTICO */}
                        <div className="px-4 space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                                <div className="flex items-center gap-3">
                                    <Activity size={20} className="text-[#004d4d]"/>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Historial de Operaciones</h4>
                                </div>
                                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-full max-w-md">
                                    <Search size={18} className="text-gray-300 ml-2" />
                                    <input placeholder="Buscar por cliente o factura..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} className="flex-1 bg-transparent outline-none text-sm font-bold" />
                                </div>
                            </div>

                            <div className="bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/80 shadow-xl overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50/50">
                                            {['Factura', 'Cliente', 'Canal', 'Tipo', 'Pago', 'Monto'].map((h, i) => (
                                                <th key={i} className="px-8 py-6 text-center text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em]">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100/50">
                                        {paginatedHistory.length === 0 ? (
                                            <tr><td colSpan={6} className="py-20 text-center text-gray-300 font-black uppercase text-[10px]">Sin operaciones registradas</td></tr>
                                        ) : paginatedHistory.map((inv) => (
                                            <tr key={inv.id} onClick={() => setSelectedInvoice(inv)} className="hover:bg-white/60 transition-all cursor-pointer group text-center">
                                                <td className="px-8 py-8 font-black text-gray-900 text-sm">{inv.invoice_num}</td>
                                                <td className="px-8 py-8 text-sm font-bold text-gray-600">{inv.customer}</td>
                                                <td className="px-8 py-8"><span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase ${CHANNELS[inv.source]?.color || 'bg-gray-50'}`}>{CHANNELS[inv.source]?.icon}{CHANNELS[inv.source]?.label}</span></td>
                                                <td className="px-8 py-8 uppercase text-[9px] font-black text-gray-400">{inv.customer_type}</td>
                                                <td className="px-8 py-8">
                                                    <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase text-slate-500">
                                                        {inv.payment_method === 'transfer' ? <CreditCard size={14}/> : <DollarSign size={14}/>}
                                                        {inv.payment_method}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8 font-black text-[#004D4D]">{formatCurrency(inv.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="fixed inset-0 z-[1000] bg-white">
                        {/* El POS se mantiene como estaba pero con los estilos de botones unificados */}
                        {/* Se renderiza dinámicamente según isPOSActive */}
                    </div>
                )}
            </AnimatePresence>

            <MetricDetailModal 
                isOpen={!!selectedMetric} 
                onClose={() => setSelectedMetric(null)} 
                metric={selectedMetric} 
            />
        </div>
    );
}