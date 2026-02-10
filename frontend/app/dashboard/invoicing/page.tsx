"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { InteractiveUP } from '@/components/landing/InteractiveUP';
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
  Home
} from 'lucide-react';

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
    'Ropa': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=400',
    'Calzado': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400',
    'Tecnología': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400',
    'default': 'https://images.unsplash.com/photo-1583394838336-3dd0f943c736?auto=format&fit=crop&q=80&w=400'
};

const KPICard = ({ title, value, trendValue, icon: Icon, iconColor = "text-[#004D4D]", iconBg = "bg-[#004D4D]/5", valueClassName = "text-gray-900" }: any) => {
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
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        <span className="text-[10px] font-black">{isUp ? '+' : ''}{trendValue}%</span>
                    </div>
                </div>
                <div style={{ transform: "translateZ(20px)" }}>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">{title}</p>
                    <h3 className={`text-3xl font-black tracking-tighter ${valueClassName}`}>
                        {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
                    </h3>
                </div>
            </div>
        </motion.div>
    );
};

export default function InvoicingPage() {
    const { token, userEmail: authEmail } = useAuth();
    const { showToast } = useToast();
    const [isPOSActive, setIsPOSActive] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<PastInvoice | null>(null);
    
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
    const [dateRange, setDateRange] = useState('Mes');
    const [currentPage, setCurrentPage] = useState(1);
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isDateHovered, setIsDateHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);
    const itemsPerPage = 20;

    const handleDatePreset = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
        const today = new Date();
        const formatDate = (d: Date) => d.toISOString().split('T')[0];
        let start = new Date();
        let end = new Date();
        switch (preset) {
            case 'today': break;
            case 'yesterday': start.setDate(today.getDate() - 1); end.setDate(today.getDate() - 1); break;
            case 'week': start.setDate(today.getDate() - 7); break;
            case 'month': start = new Date(today.getFullYear(), today.getMonth(), 1); break;
        }
        setDateRangeState({ from: formatDate(start), to: formatDate(end) });
    };

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

    const recentCustomers: any[] = [];

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
                // Sincronización Real con el módulo de Categorías
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

    useEffect(() => {
        return () => {
            products.forEach(p => { if (p.image_url?.startsWith('blob:')) URL.revokeObjectURL(p.image_url); });
        };
    }, [products]);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    const calculateSubtotal = () => invoiceItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const calculatePlatformFee = () => paymentMethod === 'transfer' ? calculateSubtotal() * 0.025 : 0;
    const calculateGatewayFee = () => paymentMethod === 'transfer' ? calculateSubtotal() * 0.035 : 0;
    const calculateFinalTotal = () => calculateSubtotal() + calculatePlatformFee() + calculateGatewayFee();

    const filteredProducts = useMemo(() => {
        return products.filter(p => (p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku?.toLowerCase().includes(productSearch.toLowerCase())) && (selectedCategory === 'Todas' || p.category === selectedCategory)).slice(0, 12);
    }, [productSearch, products, selectedCategory]);

    const handleExportExcel = () => {
        if (history.length === 0) {
            showToast("No hay datos para exportar", "info");
            return;
        }

        // Estilos CSS para el Excel
        const styles = `
            <style>
                .header { background-color: #004D4D; color: #ffffff; font-weight: bold; text-align: center; }
                .cell { border: 1px solid #e2e8f0; padding: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; }
                .title { font-size: 22px; font-weight: bold; color: #004D4D; font-family: 'Segoe UI'; }
                .subtitle { font-size: 14px; color: #64748b; font-family: 'Segoe UI'; margin-bottom: 20px; }
                .currency { text-align: right; font-weight: bold; color: #004D4D; }
                .tag { font-size: 10px; font-weight: bold; text-transform: uppercase; padding: 4px; border-radius: 4px; text-align: center; }
            </style>
        `;

        // Construcción de la Tabla HTML
        let tableHtml = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head><meta charset="utf-8">${styles}</head>
            <body>
                <table>
                    <tr><td colspan="9" class="title">BAYUP - REPORTE MASTER DE FACTURACIÓN</td></tr>
                    <tr><td colspan="9" class="subtitle">Generado el: ${new Date().toLocaleString()} | Total Registros: ${history.length}</td></tr>
                    <tr></tr>
                    <thead>
                        <tr class="header">
                            <th class="cell">NÚMERO FACTURA</th>
                            <th class="cell">FECHA Y HORA</th>
                            <th class="cell">CLIENTE</th>
                            <th class="cell">EMAIL / CONTACTO</th>
                            <th class="cell">TIPO</th>
                            <th class="cell">CANAL</th>
                            <th class="cell">MÉTODO PAGO</th>
                            <th class="cell">DETALLE PRODUCTOS</th>
                            <th class="cell">TOTAL NETO</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        history.forEach(inv => {
            const itemsList = inv.items ? inv.items.map(it => `• ${it.product_name || it.name} (x${it.quantity})`).join("<br>") : "N/A";
            
            tableHtml += `
                <tr>
                    <td class="cell" style="font-weight: bold;">${inv.invoice_num}</td>
                    <td class="cell">${new Date(inv.date).toLocaleString()}</td>
                    <td class="cell" style="text-transform: capitalize;">${inv.customer}</td>
                    <td class="cell">${inv.customer_email || "N/A"}<br><span style="color: #64748b;">${inv.customer_phone || ""}</span></td>
                    <td class="cell" style="text-align: center;">${inv.customer_type === 'wholesale' ? 'MAYORISTA' : 'FINAL'}</td>
                    <td class="cell" style="text-align: center; font-weight: bold;">${inv.source.toUpperCase()}</td>
                    <td class="cell" style="text-align: center;">${inv.payment_method === 'transfer' ? 'TRANSFERENCIA' : 'EFECTIVO'}</td>
                    <td class="cell" style="font-size: 10px;">${itemsList}</td>
                    <td class="cell currency">${formatCurrency(inv.total)}</td>
                </tr>
            `;
        });

        // Cálculo del Gran Total al final
        const grandTotal = history.reduce((acc, curr) => acc + curr.total, 0);
        tableHtml += `
                    <tr>
                        <td colspan="8" class="cell" style="text-align: right; font-weight: bold; background-color: #f8fafc;">TOTAL GENERAL ACUMULADO:</td>
                        <td class="cell currency" style="background-color: #004D4D; color: #ffffff;">${formatCurrency(grandTotal)}</td>
                    </tr>
                </tbody>
                </table>
            </body>
            </html>
        `;

        // Exportación del archivo
        const fileName = `Reporte_Elite_Bayup_${new Date().toISOString().split('T')[0]}.xls`;
        const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        
        link.href = url;
        link.download = fileName;
        link.click();
        
        URL.revokeObjectURL(url);
        showToast("Reporte Elite generado correctamente", "success");
    };

    const { paginatedHistory, totalPages } = useMemo(() => {
        const filtered = history.filter(inv => {
            const matchesSearch = inv.customer.toLowerCase().includes(historySearch.toLowerCase()) || 
                                 inv.invoice_num.toLowerCase().includes(historySearch.toLowerCase());
            
            let matchesChannel = advancedFilters.channel === 'all';
            if (!matchesChannel) {
                if (advancedFilters.channel === 'web') {
                    matchesChannel = ['web', 'mercadolibre', 'shopify', 'falabella'].includes(inv.source);
                } else if (advancedFilters.channel === 'redes') {
                    matchesChannel = ['instagram', 'facebook', 'tiktok', 'redes'].includes(inv.source);
                } else if (advancedFilters.channel === 'pos') {
                    matchesChannel = inv.source === 'pos';
                } else {
                    matchesChannel = inv.source === advancedFilters.channel;
                }
            }
            
            const matchesPayment = advancedFilters.paymentMethod === 'all' || 
                                  (advancedFilters.paymentMethod === 'transfer' && inv.payment_method === 'transfer') ||
                                  (advancedFilters.paymentMethod === 'cash' && inv.payment_method === 'cash');

            let matchesDate = true;
            if (dateRangeState.from && dateRangeState.to) {
                const invDate = new Date(inv.date).toISOString().split('T')[0];
                matchesDate = invDate >= dateRangeState.from && invDate <= dateRangeState.to;
            }

            return matchesSearch && matchesChannel && matchesPayment && matchesDate;
        });
        return { paginatedHistory: filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), totalPages: Math.ceil(filtered.length / itemsPerPage) };
    }, [historySearch, history, advancedFilters, dateRangeState, currentPage]);

    const suggestedCustomers = useMemo(() => customerSearchQuery.length < 2 ? [] : recentCustomers.filter(c => c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) || c.phone.includes(customerSearchQuery)), [customerSearchQuery]);

    const handleAddProduct = (p: Product) => {
        setSelectedProductForModal(p);
        const basePrice = customerType === 'wholesale' ? p.price * 0.85 : p.price;
        setModalConfig({ quantity: 1, manualPrice: basePrice, selectedAttributes: {} });
    };

    const handleAddFromModal = () => {
        if (!selectedProductForModal) return;
        const p = selectedProductForModal;
        if (p.variants?.[0]?.attributes) {
            for (const [attr, options] of Object.entries(p.variants[0].attributes)) {
                if (Array.isArray(options) && options.length > 0 && !modalConfig.selectedAttributes[attr]) {
                    setAttributeError(`Debes elegir una opción para ${attr}`);
                    return;
                }
            }
        }
        setAttributeError(null);
        setInvoiceItems([...invoiceItems, { 
            id: `${p.id}-${Date.now()}`, variant_id: p.variants?.[0]?.id || p.id,
            name: p.name, price: modalConfig.manualPrice, quantity: modalConfig.quantity, sku: p.sku || 'N/A',
            image: p.image_url || PRODUCT_IMAGES[p.category || 'default'] || PRODUCT_IMAGES.default,
            selectedAttributes: modalConfig.selectedAttributes
        }]);
        setSelectedProductForModal(null);
    };

    const generateLuxuryPDF = async (invoiceData?: any) => {
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        const blueDark = [0, 77, 77];
        const cyan = [0, 242, 255];
        const royalBlue = [29, 78, 216];

        const data = invoiceData || {
            customer: customerInfo.name || "Consumidor Final",
            customer_phone: customerInfo.phone || "S/N",
            customer_email: customerInfo.email || "No registrado",
            customer_type: customerType,
            seller: selectedSeller || authEmail?.split('@')[0] || "Bayup AI",
            source: selectedChannel,
            payment_method: paymentMethod,
            total: calculateFinalTotal(),
            items: invoiceItems.map(it => ({ product_name: it.name, quantity: it.quantity, price_at_purchase: it.price, selectedAttributes: it.selectedAttributes })),
            invoice_num: `#FAC-MASTER-${Date.now().toString().slice(-6)}`,
            date: new Date().toISOString()
        };

        doc.setFillColor(blueDark[0], blueDark[1], blueDark[2]); doc.rect(0, 0, 210, 50, 'F');
        doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(28); doc.text("BAY", 20, 30);
        doc.setTextColor(cyan[0], cyan[1], cyan[2]); doc.text("UP.", 42, 30);
        doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text("COMPROBANTE OFICIAL DE VENTA", 20, 40);
        doc.setFontSize(12); doc.text(data.invoice_num, 140, 25);
        doc.setFontSize(10); doc.text(`Fecha: ${new Date(data.date).toLocaleDateString()}`, 140, 32);
        doc.text(`Estado: PAGADO`, 140, 39);

        doc.setTextColor(0, 0, 0); doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("ADQUIRIENTE", 20, 65);
        doc.setFont("helvetica", "normal"); doc.text(`Nombre: ${data.customer}`, 20, 72); doc.text(`WhatsApp: ${data.customer_phone}`, 20, 78); doc.text(`Email: ${data.customer_email}`, 20, 84);
        doc.setFont("helvetica", "bold"); doc.text("EMITIDO POR", 120, 65);
        doc.setFont("helvetica", "normal"); doc.text(`Empresa: ${authEmail?.split('@')[0].toUpperCase() || "BAYUP USER"}`, 120, 72); doc.text("Sede: Medellín - C.C. El Tesoro", 120, 78);

        doc.setFillColor(250, 250, 250); doc.rect(20, 92, 170, 25, 'F'); doc.setDrawColor(230, 230, 230); doc.rect(20, 92, 170, 25, 'S');
        doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text("ASESOR:", 25, 100); doc.text("CANAL:", 75, 100); doc.text("PERFIL:", 120, 100); doc.text("PAGO:", 160, 100);
        doc.setFont("helvetica", "normal"); doc.text(data.seller || "Sistema", 25, 108); doc.text(data.source.toUpperCase(), 75, 108); doc.text(data.customer_type === 'wholesale' ? "MAYORISTA" : "FINAL", 120, 108);
        if (data.payment_method === 'transfer') { doc.setTextColor(royalBlue[0], royalBlue[1], royalBlue[2]); doc.text("TRANSFERENCIA", 160, 108); } else { doc.setTextColor(16, 185, 129); doc.text("EFECTIVO", 160, 108); }
        doc.setTextColor(0, 0, 0);

        let yPos = 130; doc.setFillColor(245, 245, 245); doc.rect(20, yPos, 170, 10, 'F'); doc.setFont("helvetica", "bold"); doc.text("PRODUCTO", 25, yPos + 7); doc.text("CANT", 130, yPos + 7); doc.text("TOTAL", 160, yPos + 7);
        doc.setFont("helvetica", "normal"); yPos += 15;
        if (data.items && Array.isArray(data.items)) {
            data.items.forEach((item: any) => {
                const rawName = item.product_name || item.name || "Producto sin nombre";
                const itemName = rawName.toString();
                doc.text(itemName.slice(0, 45), 25, yPos); 
                doc.text((item.quantity || 0).toString(), 133, yPos); 
                doc.text(formatCurrency((item.price_at_purchase || 0) * (item.quantity || 0)), 160, yPos);
                
                if (item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0) {
                    const attrs = Object.entries(item.selectedAttributes).map(([k,v]) => `${k}: ${v}`).join(" | ");
                    doc.setFontSize(7); doc.setTextColor(100, 100, 100); 
                    doc.text(attrs.toString().slice(0, 60), 25, yPos + 5); 
                    doc.setFontSize(9); doc.setTextColor(0, 0, 0); 
                    yPos += 6;
                }
                yPos += 10;
            });
        }
        yPos += 10; doc.setDrawColor(230, 230, 230); doc.line(20, yPos, 190, yPos); yPos += 15;
        doc.text("SUBTOTAL:", 110, yPos); doc.text(formatCurrency(data.total), 160, yPos);
        yPos += 12; doc.setFillColor(blueDark[0], blueDark[1], blueDark[2]); doc.rect(105, yPos - 8, 85, 12, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("TOTAL NETO:", 110, yPos); doc.text(formatCurrency(data.total), 155, yPos);
        return doc;
    };

    const handleFinalizeSale = async () => {
        if (invoiceItems.length === 0) { showToast("No hay productos en la factura", "info"); return; }
        if (!selectedSeller) { showToast("Por favor, selecciona un asesor responsable", "info"); return; }
        
        setIsProcessing(true);
        try {
            const res = await fetch('https://gallant-education-production-8b4a.up.railway.app/orders', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: customerInfo.name || 'Consumidor Final', customer_email: customerInfo.email || null,
                    customer_phone: customerInfo.phone || null, customer_type: customerType,
                    payment_method: paymentMethod, seller_name: selectedSeller || authEmail?.split('@')[0],
                    source: selectedChannel, items: invoiceItems.map(item => ({ product_variant_id: item.variant_id, quantity: item.quantity }))
                })
            });
            if (!res.ok) throw new Error("Error servidor");
            if (customerInfo.phone) {
                const doc = await generateLuxuryPDF(); doc.save(`Factura_${customerInfo.name}.pdf`);
                window.open(`https://wa.me/${customerInfo.phone.replace(/\+/g, '')}?text=Factura digital enviada.`, '_blank');
            }
            showToast("Venta procesada", "success"); setIsPOSActive(false); setCustomerInfo({ name: '', email: '', phone: '' }); setInvoiceItems([]); loadEcosystem();
        } catch (err) { showToast("Error al procesar", "error"); } finally { setIsProcessing(false); }
    };

    const handleSendWhatsApp = async () => {
        if (!customerInfo.phone) { showToast("Ingresa WhatsApp", "info"); return; }
        const doc = await generateLuxuryPDF(); doc.save(`Factura_${customerInfo.name}.pdf`);
        window.open(`https://wa.me/${customerInfo.phone.replace(/\+/g, '')}?text=Factura digital`, '_blank');
    };

    return (
        <div className="relative min-h-[calc(100vh-120px)] bg-[#FAFAFA] overflow-hidden">
            <AnimatePresence mode="wait">
                {!isPOSActive ? (
                    <motion.div key="history-view" className="max-w-7xl mx-auto pb-20 space-y-4">
                        <motion.div initial={{ y: -200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -200, opacity: 0 }} className="space-y-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_10px_#10B981]"></span>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Gestión Financiera</span>
                                    </div>
                                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] pr-2 py-1">Facturación</span>
                                    </h1>
                                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed">
                                        Control financiero y registro de ventas en tiempo real para <span className="font-bold text-[#001A1A]">{authEmail?.split('@')[0] || 'tu empresa'}</span>.
                                    </p>
                                </div>
                                <button onClick={() => setIsPOSActive(true)} className="px-12 py-6 bg-gray-900 text-white rounded-[2.2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all">Nueva Venta POS</button>
                            </div>
                            <div className="grid grid-cols-4 gap-6">
                                <KPICard title="Ventas Hoy" value={4250000} trendValue={12.5} icon={TrendingUp} iconColor="text-emerald-600" />
                                <KPICard title="Ventas Mes" value={124800000} trendValue={8.2} icon={DollarSign} iconColor="text-[#004D4D]" />
                                <KPICard title="Ticket Promedio" value={325000} trendValue={-2.1} icon={ShoppingBag} iconColor="text-rose-600" />
                                <KPICard title="Canal POS vs Web" value="65% / 35%" trendValue={0.5} icon={Zap} iconColor="text-yellow-500" />
                            </div>

                            {/* --- TÍTULO SECCIÓN HISTORIAL --- */}
                            <div className="mt-10 mb-4 px-2 flex items-center gap-3">
                                <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_10px_#10B981]"></span>
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Historial de Facturación</h3>
                            </div>

                            {/* --- BARRA DE BÚSQUEDA Y FILTROS AVANZADOS (ESTILO PEDIDOS) --- */}
                            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar factura por número o cliente..." 
                                        value={historySearch}
                                        onChange={(e) => setHistorySearch(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none"
                                    />
                                </div>
                                <div className="h-8 w-px bg-slate-100 hidden md:block"></div>
                                <div className="flex items-center gap-2 relative">
                                    {/* Overlay invisible para cerrar menús al hacer clic fuera */}
                                    {(isFilterMenuOpen || isDateMenuOpen) && (
                                        <div 
                                            className="fixed inset-0 z-40" 
                                            onClick={() => { setIsFilterMenuOpen(false); setIsDateMenuOpen(false); }}
                                        />
                                    )}

                                    {/* Botón Filtros */}
                                    <div className="relative z-50">
                                        <motion.button 
                                            layout
                                            onMouseEnter={() => setIsFilterHovered(true)}
                                            onMouseLeave={() => setIsFilterHovered(false)}
                                            onClick={() => { setIsFilterMenuOpen(!isFilterMenuOpen); setIsDateMenuOpen(false); }}
                                            className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isFilterMenuOpen ? 'bg-[#004D4D] text-white shadow-lg' : 'text-slate-500 hover:text-[#004D4D] hover:bg-[#004D4D]/5'}`}
                                        >
                                            <motion.div layout><Filter size={18}/></motion.div>
                                            <AnimatePresence mode="popLayout">
                                                {isFilterHovered && (
                                                    <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Filtro</motion.span>
                                                )}
                                            </AnimatePresence>
                                        </motion.button>
                                        
                                        <AnimatePresence>
                                            {isFilterMenuOpen && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: paginatedHistory.length === 0 ? 10 : -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: paginatedHistory.length === 0 ? 10 : -10, scale: 0.95 }}
                                                    className={`absolute ${paginatedHistory.length === 0 ? 'bottom-full mb-4 origin-bottom-right' : 'top-full mt-2 origin-top-right'} right-0 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 w-[280px] z-50 overflow-hidden`}
                                                >
                                                    <div className="flex flex-col">
                                                        {[
                                                            { 
                                                                id: 'canal', 
                                                                label: 'Canal de Venta', 
                                                                icon: <Globe size={16}/>, 
                                                                options: [
                                                                    { val: 'all', l: 'Todos' }, 
                                                                    { val: 'web', l: 'Web / Digital' }, 
                                                                    { val: 'whatsapp', l: 'WhatsApp' }, 
                                                                    { val: 'redes', l: 'Redes Sociales' }, 
                                                                    { val: 'pos', l: 'Tienda Física' }
                                                                ], 
                                                                key: 'channel' 
                                                            },
                                                            { 
                                                                id: 'pago', 
                                                                label: 'Método de Pago', 
                                                                icon: <CreditCard size={16}/>, 
                                                                options: [
                                                                    { val: 'all', l: 'Todos' }, 
                                                                    { val: 'transfer', l: 'Transferencia' }, 
                                                                    { val: 'cash', l: 'Efectivo' }
                                                                ], 
                                                                key: 'paymentMethod' 
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
                                                                onClick={() => { setAdvancedFilters({channel: 'all', paymentMethod: 'all'}); setIsFilterMenuOpen(false); setActiveAccordion(null); }}
                                                                className="w-full py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase shadow-lg hover:bg-black transition-all"
                                                            >
                                                                Limpiar Filtros
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Botón Fecha */}
                                    <div className="relative z-50">
                                        <motion.button 
                                            layout
                                            onMouseEnter={() => setIsDateHovered(true)}
                                            onMouseLeave={() => setIsDateHovered(false)}
                                            onClick={() => { setIsDateMenuOpen(!isDateMenuOpen); setIsFilterMenuOpen(false); }}
                                            className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isDateMenuOpen ? 'bg-[#004D4D] text-white shadow-lg' : 'text-slate-500 hover:text-[#004D4D] hover:bg-[#004D4D]/5'}`}
                                        >
                                            <motion.div layout><Calendar size={18}/></motion.div>
                                            <AnimatePresence mode="popLayout">
                                                {isDateHovered && (
                                                    <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Fecha</motion.span>
                                                )}
                                            </AnimatePresence>
                                        </motion.button>
                                        
                                        <AnimatePresence>
                                            {isDateMenuOpen && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: paginatedHistory.length === 0 ? 10 : -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: paginatedHistory.length === 0 ? 10 : -10, scale: 0.95 }}
                                                    className={`absolute ${paginatedHistory.length === 0 ? 'bottom-full mb-4 origin-bottom-right' : 'top-full mt-2 origin-top-right'} right-0 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 w-[300px] z-50`}
                                                >
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Desde</label>
                                                                <input type="date" value={dateRangeState.from} onChange={(e) => setDateRangeState({...dateRangeState, from: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2 text-[10px] font-bold outline-none focus:border-[#004D4D]"/>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hasta</label>
                                                                <input type="date" value={dateRangeState.to} onChange={(e) => setDateRangeState({...dateRangeState, to: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2 text-[10px] font-bold outline-none focus:border-[#004D4D]"/>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {['today', 'yesterday', 'week', 'month'].map(p => (
                                                                <button key={p} onClick={() => handleDatePreset(p as any)} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-500">{p === 'week' ? '7 Días' : p === 'month' ? 'Mes' : p}</button>
                                                            ))}
                                                        </div>
                                                        <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                                                            <button onClick={() => setIsDateMenuOpen(false)} className="w-full py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase shadow-lg hover:bg-black transition-all">Aplicar Filtro</button>
                                                            <button 
                                                                onClick={() => { setDateRangeState({from: '', to: ''}); setIsDateMenuOpen(false); }}
                                                                className="w-full py-2 bg-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase hover:bg-slate-200 transition-all"
                                                            >
                                                                Limpiar Fechas
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <motion.button 
                                        layout
                                        onMouseEnter={() => setIsExportHovered(true)}
                                        onMouseLeave={() => setIsExportHovered(false)}
                                        onClick={handleExportExcel}
                                        className="h-12 flex items-center gap-2 px-4 rounded-xl transition-all text-xs font-bold uppercase text-slate-500 hover:text-[#004D4D] hover:bg-[#004D4D]/5"
                                        title="Exportar a Excel"
                                    >
                                        <motion.div layout><Download size={18}/></motion.div>
                                        <AnimatePresence mode="popLayout">
                                            {isExportHovered && (
                                                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Exportar</motion.span>
                                            )}
                                        </AnimatePresence>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden mt-1">
                            <table className="min-w-full divide-y divide-gray-50">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        {['Factura', 'Cliente', 'Canal', 'Tipo', 'Pago', 'Monto'].map((h, i) => (
                                            <th key={i} className={`px-10 py-6 text-center text-[10px] font-black text-[#004D4D] uppercase tracking-[0.2em]`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {paginatedHistory.map((inv) => (
                                        <tr key={inv.id} onClick={() => setSelectedInvoice(inv)} className="hover:bg-gray-50/80 transition-all group cursor-pointer text-center">
                                            <td className="px-10 py-8"><p className="text-sm font-black text-gray-900">{inv.invoice_num}</p><p className="text-[9px] text-gray-400 mt-1">{new Date(inv.date).toLocaleDateString()}</p></td>
                                            <td className="px-10 py-8 text-sm font-bold text-gray-900">{inv.customer}</td>
                                            <td className="px-10 py-8"><div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${CHANNELS[inv.source]?.color || 'bg-gray-50 text-gray-400'}`}>{CHANNELS[inv.source]?.icon}{CHANNELS[inv.source]?.label}</div></td>
                                            <td className="px-10 py-8"><span className={`inline-block px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${inv.customer_type === 'wholesale' ? 'bg-[#004D4D] text-white shadow-sm' : 'bg-gray-100 text-gray-500'}`}>{inv.customer_type === 'wholesale' ? 'Mayorista' : 'Final'}</span></td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center justify-center gap-2">
                                                    {(inv.source === 'web' || inv.payment_method === 'transfer') ? (
                                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-700 uppercase"><div className="h-5 w-5 rounded-lg bg-blue-50 flex items-center justify-center"><CreditCard size={12} /></div> Transferencia</div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase"><div className="h-5 w-5 rounded-lg bg-emerald-50 flex items-center justify-center"><DollarSign size={12} /></div> Efectivo</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-sm font-black text-[#004D4D]">{formatCurrency(inv.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* --- CONTROLES DE PAGINACIÓN REDISEÑADOS --- */}
                            {history.length > 0 && (
                                <div className="p-6 bg-slate-50 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            Mostrando <span className="text-slate-900">{paginatedHistory.length}</span> de <span className="text-slate-900">{history.length}</span> resultados 
                                            <span className="mx-2 text-slate-200">|</span> 
                                            Página <span className="text-slate-900">{currentPage}</span> de <span className="text-slate-900">{totalPages || 1}</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentPage === 1 ? 'text-gray-300 bg-slate-100 cursor-not-allowed' : 'bg-white text-[#004D4D] shadow-sm hover:bg-white hover:shadow-md'}`}
                                        >
                                            Anterior
                                        </button>
                                        <button 
                                            disabled={currentPage === totalPages || totalPages === 0}
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 bg-slate-100 cursor-not-allowed' : 'bg-white text-[#004D4D] shadow-sm hover:bg-white hover:shadow-md'}`}
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div key="pos-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-white flex flex-col lg:flex-row overflow-hidden">
                        <GlassCloseButton onClick={() => setIsPOSActive(false)} className="absolute top-6 right-6 z-[1010] !bg-gray-900/10" />
                        <motion.div initial={{ y: -200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full lg:w-1/2 h-full flex flex-col bg-[#FAFAFA] border-r border-gray-100 overflow-y-auto custom-scrollbar p-16 space-y-10">
                            <h2 className="text-4xl font-black italic uppercase">Nueva <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">Venta</span></h2>
                            <div className="flex justify-start">
                                <div className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm flex items-center relative overflow-hidden w-fit">
                                    <motion.div className="absolute h-[calc(100%-8px)] rounded-xl bg-[#004D4D] shadow-lg" animate={{ x: posCustomerMode === 'create' ? 4 : 154, width: 150 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                                    <button onClick={() => setPosCustomerMode('create')} className={`relative z-10 px-6 py-2.5 text-[10px] font-black uppercase w-[150px] ${posCustomerMode === 'create' ? 'text-white' : 'text-gray-400'}`}>Crear cliente</button>
                                    <button onClick={() => setPosCustomerMode('search')} className={`relative z-10 px-6 py-2.5 text-[10px] font-black uppercase w-[150px] ${posCustomerMode === 'search' ? 'text-white' : 'text-gray-400'}`}>Buscar cliente</button>
                                </div>
                            </div>
                            <AnimatePresence mode="wait">
                                {posCustomerMode === 'create' ? (
                                    <motion.section key="create-mode" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8 bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre</label><input type="text" placeholder="Ej: Juan Pérez" value={customerInfo.name} onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-bold shadow-inner placeholder:text-gray-300" /></div>
                                            <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp</label><input type="text" placeholder="Ej: 3001234567" value={customerInfo.phone} onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value.replace(/\D/g, '')})} className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-bold shadow-inner placeholder:text-gray-300" /></div>
                                            <div className="space-y-2 md:col-span-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label><input type="email" placeholder="Ej: juan@example.com" value={customerInfo.email} onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#004D4D]/20 text-sm font-bold shadow-inner placeholder:text-gray-300" /></div>
                                            <div className="space-y-3 relative"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Asesor</label>
                                                <div className="relative"><button onClick={() => setIsSellerDropdownOpen(!isSellerDropdownOpen)} className="w-full flex items-center justify-between p-4 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold transition-all hover:bg-white hover:border-[#004D4D]/20 shadow-inner group"><span className={selectedSeller ? "text-gray-900" : "text-gray-400"}>{selectedSeller || "Seleccionar..."}</span><ChevronDown size={16} className={`transition-transform ${isSellerDropdownOpen ? 'rotate-180 text-[#004D4D]' : ''}`} /></button>
                                                <AnimatePresence>{isSellerDropdownOpen && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-[2rem] shadow-2xl z-[100] overflow-hidden"><div className="max-h-60 overflow-y-auto p-2">{sellers.map((s, i) => (<button key={i} onClick={() => {setSelectedSeller(s.name); setIsSellerDropdownOpen(false);}} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-[#004D4D] hover:text-white transition-all text-left"><div className="h-8 w-8 rounded-full bg-[#004D4D]/5 flex items-center justify-center text-[10px] font-black">{s.name.charAt(0)}</div><p className="text-xs font-black">{s.name}</p></button>))}</div></motion.div>)}</AnimatePresence></div>
                                            </div>
                                            <div className="space-y-3"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Canal de Operación</label>
                                                <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl shadow-inner h-14">
                                                    {(['pos', 'whatsapp', 'instagram'] as const).map((channel) => (
                                                        <motion.button 
                                                            key={channel} 
                                                            layout 
                                                            onClick={() => setSelectedChannel(channel)} 
                                                            className={`relative flex items-center justify-center rounded-xl transition-all h-full group ${selectedChannel === channel ? 'bg-[#004D4D] text-white shadow-md flex-[2.5]' : 'text-gray-400 hover:bg-white flex-1'}`}
                                                        >
                                                            <div className="flex items-center gap-3 px-4 overflow-hidden whitespace-nowrap">
                                                                {channel === 'pos' ? <Home size={18} /> : channel === 'whatsapp' ? <MessageSquare size={18} /> : <Instagram size={18} />}
                                                                {selectedChannel === channel && (
                                                                    <motion.span 
                                                                        initial={{ opacity: 0, x: -10 }} 
                                                                        animate={{ opacity: 1, x: 0 }} 
                                                                        className="text-[10px] font-black uppercase tracking-widest"
                                                                    >
                                                                        {channel === 'pos' ? 'En local' : channel === 'whatsapp' ? 'WhatsApp' : 'Redes Social'}
                                                                    </motion.span>
                                                                )}
                                                            </div>
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-50 md:col-span-2">
                                                <p className="text-[10px] font-black text-[#004D4D] uppercase tracking-widest">Cliente</p>
                                                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100"><button onClick={() => setCustomerType('final')} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase ${customerType === 'final' ? 'bg-[#004D4D] text-white shadow-sm' : 'text-gray-400'}`}>Final</button><button onClick={() => setCustomerType('wholesale')} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase ${customerType === 'wholesale' ? 'bg-[#004D4D] text-white shadow-sm' : 'text-gray-400'}`}>Mayorista</button></div>
                                            </div>
                                        </div>
                                    </motion.section>
                                ) : (
                                    <motion.section key="search-mode" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative space-y-8">
                                            <div className="relative group"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={22} /><input type="text" placeholder="Nombre o Celular..." value={customerSearchQuery} onChange={(e) => setCustomerSearchQuery(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-white border-2 border-gray-50 focus:border-[#004D4D]/10 rounded-3xl outline-none text-base font-black transition-all shadow-sm" /></div>
                                            <AnimatePresence>{suggestedCustomers.length > 0 && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 p-2 bg-[#004D4D]/5 rounded-3xl border border-[#004D4D]/10">{suggestedCustomers.map((rc, i) => (<button key={i} onClick={() => { setCustomerInfo({ name: rc.name, phone: rc.phone, email: rc.email || '' }); setPosCustomerMode('create'); setCustomerSearchQuery(""); }} className="w-full flex items-center justify-between px-5 py-4 bg-white border border-gray-100 rounded-2xl hover:border-[#00F2FF]/30 transition-all group shadow-sm"><div className="flex items-center gap-4"><div className="h-8 w-8 rounded-full bg-[#004D4D] text-white flex items-center justify-center text-[10px] font-black">{rc.name.charAt(0)}</div><div className="text-left"><p className="text-xs font-black text-gray-900">{rc.name}</p><p className="text-[9px] font-bold text-gray-400 uppercase">{rc.phone}</p></div></div><ArrowRight size={14} className="text-gray-300 group-hover:text-[#004D4D]" /></button>))}</motion.div>)}</AnimatePresence>
                                        </div>
                                        <div className="flex flex-wrap gap-3 px-4">{recentCustomers.slice(0, 3).map((rc, i) => (<button key={i} onClick={() => { setCustomerInfo({ name: rc.name, phone: rc.phone, email: rc.email }); setPosCustomerMode('create'); }} className="flex items-center gap-3 px-5 py-3 bg-white border border-gray-100 rounded-2xl hover:border-[#00F2FF]/30 transition-all shadow-sm"><div className="h-6 w-6 rounded-full bg-[#004D4D]/5 flex items-center justify-center text-[10px] font-black text-[#004D4D]">{rc.name.charAt(0)}</div><div className="text-left"><p className="text-[10px] font-black text-gray-900">{rc.name}</p><p className="text-[8px] font-bold text-gray-400 uppercase">{rc.phone}</p></div></button>))}</div>
                                    </motion.section>
                                )}
                            </AnimatePresence>
                            <section className="space-y-8 pb-20">
                                <div className="space-y-6"><div className="relative group"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={22} /><input type="text" placeholder="Buscar producto o SKU..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-white border-2 border-gray-50 focus:border-[#004D4D]/10 rounded-3xl outline-none text-base font-black shadow-sm" /></div>
                                    <div className="flex gap-2 overflow-x-auto pb-2">{categories.map((cat) => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase whitespace-nowrap border ${selectedCategory === cat ? 'bg-[#004D4D] text-white border-[#004D4D] shadow-lg' : 'bg-white text-gray-400 border-gray-100'}`}>{cat}</button>))}</div></div>
                                <div className="grid grid-cols-2 xl:grid-cols-3 gap-6 pt-10">{filteredProducts.map(p => (<button key={p.id} onClick={() => handleAddProduct(p)} className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden p-4 text-left hover:shadow-2xl transition-all group"><div className="aspect-square bg-gray-50 rounded-2xl mb-4 overflow-hidden"><img src={p.image_url || PRODUCT_IMAGES.default} className="w-full h-full object-cover transition-transform group-hover:scale-110" /></div><p className="text-xs font-black text-gray-900 leading-tight truncate">{p.name}</p><p className="text-[10px] font-black text-[#004D4D] mt-1">{formatCurrency(p.price)}</p></button>))}</div>
                            </section>
                        </motion.div>
                        <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full lg:w-1/2 h-full bg-gray-200 p-16 flex items-center justify-center relative">
                            <div className="w-full max-w-xl bg-white shadow-2xl rounded-[3.5rem] flex flex-col h-[calc(100vh-140px)] overflow-hidden border border-white group">
                                <div className="bg-[#004D4D] p-10 text-white flex justify-between items-start shrink-0 z-20"><div className="flex items-center gap-6"><div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg"><User size={24} className="text-[#004D4D]" /></div><div><h4 className="text-xl font-black uppercase leading-none">Factura</h4><p className="text-[9px] font-black text-[#00F2FF] uppercase mt-1">Comprobante Oficial</p></div></div><div className="text-right space-y-1"><p className="text-[10px] font-black">{new Date().toLocaleDateString()}</p><p className="text-[9px] font-bold text-[#00F2FF] opacity-60">#FAC-MASTER</p><div className="flex justify-end mt-4 opacity-10 scale-[1.2] origin-right"><div className="text-xl font-black text-white italic flex items-center"><span>BAY</span><InteractiveUP /></div></div></div></div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                                    <div className="p-10 grid grid-cols-2 gap-10 border-b bg-white"><div className="space-y-2"><p className="text-[9px] font-black text-gray-300 uppercase">Adquiriente</p><p className="text-base font-black text-gray-900 truncate">{customerInfo.name || 'Consumidor Final'}</p><p className="text-[10px] font-bold text-gray-400 flex items-center gap-2"><Smartphone size={12} className="text-[#004D4D]" /> {customerInfo.phone || 'S/N'}</p></div><div className="text-right space-y-2"><p className="text-[9px] font-black text-gray-300 uppercase">Emisor</p><p className="text-sm font-black text-[#004D4D] truncate">{authEmail?.split('@')[0] || 'Tu Empresa'}</p></div></div>
                                    <div className="p-10 pt-6 space-y-8"><div className="flex items-center text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] px-2 border-b pb-4"><span className="flex-1">Descripción</span><span className="w-16 text-center">Cant.</span><span className="w-28 text-right">Total</span></div>
                                        <div className="space-y-6">{invoiceItems.map((item, index) => (<div key={index} className="flex items-start gap-4 px-2 group/line"><div className="flex-1 min-w-0"><p className="text-sm font-black text-gray-900 group-hover/line:text-[#004D4D] transition-colors">{item.name}</p>{item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (<p className="text-[8px] font-black text-cyan-600 mt-1">{Object.entries(item.selectedAttributes).map(([k,v]) => `${k}: ${v}`).join(' • ')}</p>)}<p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{formatCurrency(item.price)}</p></div><div className="w-16 flex items-center justify-center gap-2 bg-gray-50 rounded-lg py-1"><button onClick={() => {if(item.quantity > 1) setInvoiceItems(invoiceItems.map((it, i) => i === index ? {...it, quantity: it.quantity - 1} : it))}}><Minus size={12} /></button><span className="text-xs font-black text-gray-900">{item.quantity}</span><button onClick={() => setInvoiceItems(invoiceItems.map((it, i) => i === index ? {...it, quantity: it.quantity + 1} : it))}><Plus size={12} /></button></div><div className="w-28 text-right flex flex-col items-end gap-1"><span className="text-sm font-black text-[#004D4D]">{formatCurrency(item.price * item.quantity)}</span><button onClick={() => setInvoiceItems(invoiceItems.filter((_, i) => i !== index))} className="text-rose-500 hover:text-white"><Trash2 size={10} /></button></div></div>))}</div>
                                    </div>
                                    <div className="p-10 pt-0 space-y-6 mb-10"><div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 space-y-4"><div className="flex justify-between items-center px-2"><p className="text-[9px] font-black text-gray-400 uppercase">Pago</p><div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm"><button onClick={() => setPaymentMethod('cash')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase ${paymentMethod === 'cash' ? 'bg-[#004D4D] text-white shadow-md' : 'text-gray-400'}`}>Efectivo</button><button onClick={() => setPaymentMethod('transfer')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase ${paymentMethod === 'transfer' ? 'bg-[#004D4D] text-white shadow-md' : 'text-gray-400'}`}>Transferencia</button></div></div><div className="space-y-2 px-2 border-t pt-4"><div className="flex justify-between text-gray-400 text-[10px] font-black uppercase"><span>Subtotal</span><span>{formatCurrency(calculateSubtotal())}</span></div><div className="pt-4 flex justify-between items-end"><p className="text-[10px] font-black text-gray-900 uppercase">Total Final</p><h3 className="text-5xl font-black text-[#004D4D] tracking-tighter"><AnimatedNumber value={calculateFinalTotal()} /></h3></div></div></div>
                                        <div className="space-y-4">{paymentMethod === 'transfer' && (<div className="grid grid-cols-2 gap-4"><button onClick={handleSendWhatsApp} className="py-4 bg-white text-emerald-600 rounded-2xl border border-emerald-100 font-black text-[10px] uppercase flex items-center justify-center gap-2">WhatsApp</button><button onClick={() => setIsQRModalOpen(true)} className="py-4 bg-cyan-50 text-[#004D4D] rounded-2xl border border-cyan-100 font-black text-[10px] uppercase flex items-center justify-center gap-2">Generar QR</button></div>)}<button onClick={(e) => {e.preventDefault(); handleFinalizeSale();}} disabled={isProcessing || invoiceItems.length === 0 || !selectedSeller} className={`w-full py-7 rounded-[2.2rem] font-black text-[12px] uppercase flex items-center justify-center gap-4 shadow-2xl transition-all ${isProcessing || invoiceItems.length === 0 || !selectedSeller ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#004D4D] text-white hover:bg-black'}`}>{isProcessing ? 'Procesando...' : <><Receipt size={24} /> Confirmar Venta</>}</button></div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL PRODUCTO LUXURY */}
            <AnimatePresence>{selectedProductForModal && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-gray-900/40 backdrop-blur-md p-4"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                    <div className="w-full md:w-[42%] p-12 bg-[#FAFAFA] border-r flex flex-col gap-10 overflow-y-auto custom-scrollbar"><div className="relative aspect-square w-full rounded-[2.5rem] overflow-hidden shadow-xl border border-white group"><img src={selectedProductForModal.image_url || PRODUCT_IMAGES.default} className="w-full h-full object-cover transition-transform group-hover:scale-110" /></div>
                        <div className="space-y-8">{selectedProductForModal.variants?.[0]?.attributes && Object.entries(selectedProductForModal.variants[0].attributes).map(([attrName, options]: [string, any]) => (
                            <div key={attrName} className="space-y-4"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{attrName}</p><div className="flex flex-wrap gap-2">{options.map((opt: string) => (<button key={opt} onClick={() => {setModalConfig({...modalConfig, selectedAttributes: {...modalConfig.selectedAttributes, [attrName]: opt}}); setAttributeError(null);}} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${modalConfig.selectedAttributes[attrName] === opt ? 'bg-[#004D4D] text-white border-[#004D4D] shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}>{opt}</button>))}</div></div>
                        ))}</div></div>
                    <div className="w-full md:w-[58%] p-12 flex flex-col gap-10 overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-start"><div><h3 className="text-3xl font-black text-gray-900 tracking-tighter leading-tight">{selectedProductForModal.name}</h3><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Hash size={12}/> {selectedProductForModal.sku}</p></div><GlassCloseButton onClick={() => setSelectedProductForModal(null)}/></div>
                        <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100"><p className="text-sm text-gray-500 font-medium leading-relaxed">{selectedProductForModal.description}</p></div>
                        <div className="pt-10 border-t border-gray-100 grid grid-cols-2 gap-10">
                            <div className="space-y-4"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unidades</p><div className="flex items-center bg-gray-50 rounded-2xl p-1.5 justify-between border"><button onClick={() => setModalConfig({...modalConfig, quantity: Math.max(1, modalConfig.quantity-1)})} className="h-12 w-12 flex items-center justify-center bg-white rounded-xl shadow-sm"><Minus size={20}/></button><span className="text-xl font-black">{modalConfig.quantity}</span><button onClick={() => setModalConfig({...modalConfig, quantity: modalConfig.quantity+1})} className="h-12 w-12 flex items-center justify-center bg-white rounded-xl shadow-sm"><Plus size={20}/></button></div></div>
                            <div className="space-y-4"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Precio Unitario</p><input type="text" value={new Intl.NumberFormat('de-DE').format(modalConfig.manualPrice)} onChange={e => setModalConfig({...modalConfig, manualPrice: parseFloat(e.target.value.replace(/\./g,'')) || 0})} className={`w-full p-4 bg-white border rounded-2xl outline-none text-lg font-black transition-all ${modalConfig.manualPrice <= selectedProductForModal.cost ? 'border-rose-500 text-rose-600' : 'border-gray-100 text-[#004D4D]'}`} />{modalConfig.manualPrice <= selectedProductForModal.cost && (<div className="flex items-center gap-1.5 text-[#E11D48] mt-2"><div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></div><p className="text-[8px] font-black uppercase text-rose-600">Pérdida detectada: Precio inferior al costo</p></div>)}</div>
                        </div>
                        {attributeError && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600"><Info size={16}/><p className="text-[10px] font-black uppercase">{attributeError}</p></motion.div>)}
                        <button onClick={handleAddFromModal} className="w-full py-6 bg-[#004D4D] text-white rounded-[2.2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all">Confirmar e insertar item</button>
                    </div></motion.div></div>
            )}</AnimatePresence>

            {/* MODAL DETALLE HISTORIAL */}
            <AnimatePresence>{selectedInvoice && (
                <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-gray-900/60 backdrop-blur-xl p-4"><motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-xl bg-white shadow-2xl rounded-[3.5rem] flex flex-col h-[calc(100vh-100px)] overflow-hidden border border-white relative">
                    <div className="bg-[#004D4D] p-10 text-white flex justify-between items-start shrink-0 relative overflow-hidden z-20">
                        <div className="flex items-center gap-6 relative z-10"><div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg"><User size={24} className="text-[#004D4D]"/></div><div><h4 className="text-xl font-black uppercase leading-none">Factura</h4><p className="text-[9px] font-black text-[#00F2FF] uppercase mt-1">Registro Histórico</p></div></div>
                        <div className="text-right space-y-1 relative z-10 pr-14"><p className="text-[10px] font-black">{new Date(selectedInvoice.date).toLocaleDateString()}</p><p className="text-[9px] font-bold text-[#00F2FF] opacity-60">{selectedInvoice.invoice_num}</p><div className="flex justify-end mt-4 opacity-10 scale-[1.2] origin-right"><div className="text-xl font-black text-white italic flex items-center"><span>BAY</span><InteractiveUP/></div></div></div>
                        <GlassCloseButton onClick={() => setSelectedInvoice(null)} className="absolute top-8 right-8 !bg-white/10 !text-white z-30" />
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-0">
                        <div className="p-10 border-b border-gray-100 space-y-8">
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-3"><p className="text-[9px] font-black text-gray-300 uppercase">Adquiriente</p><p className="text-lg font-black text-gray-900">{selectedInvoice.customer}</p><div className="space-y-1.5"><p className="text-[10px] font-bold text-gray-400 flex items-center gap-2"><Smartphone size={12} className="text-[#004D4D]"/>{selectedInvoice.customer_phone}</p><p className="text-[10px] font-bold text-gray-400 flex items-center gap-2"><Mail size={12} className="text-[#004D4D]"/>{selectedInvoice.customer_email}</p></div></div>
                                <div className="text-right space-y-2"><p className="text-[9px] font-black text-gray-300 uppercase">Asesor</p><p className="text-sm font-black text-[#004D4D]">{selectedInvoice.seller || 'Sistema AI'}</p></div>
                            </div>
                            <div className="grid grid-cols-2 gap-10 pt-6 border-t border-gray-50">
                                <div className="space-y-1"><p className="text-[9px] font-black text-gray-300 uppercase">Tipo</p><p className="text-xs font-black text-gray-700 uppercase">{selectedInvoice.customer_type === 'wholesale' ? 'Mayorista' : 'Final'}</p></div>
                                <div className="text-right space-y-1"><p className="text-[9px] font-black text-gray-300 uppercase">Canal</p><p className="text-xs font-black text-[#004D4D] uppercase">{CHANNELS[selectedInvoice.source]?.label || selectedInvoice.source}</p></div>
                            </div>
                        </div>
                        <div className="p-10 pt-6 space-y-8">
                            <div className="flex items-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 border-b pb-4">
                                <span className="flex-1">Descripción del Item</span>
                                <span className="w-16 text-center">Cant.</span>
                                <span className="w-28 text-right">Total</span>
                            </div>
                            <div className="space-y-6">
                                {selectedInvoice.items?.map((item: any, i: number) => (
                                    <div key={i} className="flex items-start gap-4 px-2">
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="text-sm font-black text-gray-900 leading-tight">
                                                {item.product_name || item.name || "Producto registrado"}
                                            </p>
                                            {/* Mostramos los atributos si existen para dar descripción real */}
                                            {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 ? (
                                                <p className="text-[8px] font-black text-blue-600 uppercase mt-1">
                                                    {Object.entries(item.selectedAttributes).map(([k,v]) => `${k}: ${v}`).join(' • ')}
                                                </p>
                                            ) : (
                                                <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">
                                                    Precio Unit: {formatCurrency(item.price_at_purchase || 0)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="w-16 text-center text-xs font-black text-gray-900 pt-1">{item.quantity}</div>
                                        <div className="w-28 text-right text-sm font-black text-[#004D4D] pt-1">{formatCurrency((item.price_at_purchase || 0) * item.quantity)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-10 pt-0 space-y-8 mb-10"><div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 space-y-4"><div className="flex justify-between text-gray-400 text-[10px] font-black uppercase"><span>Total Liquidado</span><span>{formatCurrency(selectedInvoice.total)}</span></div><div className="pt-4 border-t flex justify-between items-end"><p className="text-[10px] font-black text-gray-900 uppercase">Monto Final</p><h3 className="text-5xl font-black text-[#004D4D] tracking-tighter">{formatCurrency(selectedInvoice.total)}</h3></div></div>
                            <div className="grid grid-cols-2 gap-4"><button onClick={() => window.open(`https://wa.me/${selectedInvoice.customer_phone?.replace(/\+/g,'')}?text=Factura digital`, '_blank')} className="py-5 bg-white text-[#004D4D] border rounded-[1.8rem] font-black text-[10px] uppercase shadow-sm">Compartir</button><button onClick={() => generateLuxuryPDF(selectedInvoice).then(d => d.save(`Factura_${selectedInvoice.customer}.pdf`))} className="py-5 bg-[#004D4D] text-white rounded-[1.8rem] font-black text-[10px] uppercase shadow-xl hover:bg-black transition-all">Descargar factura</button></div>
                        </div>
                    </div>
                </motion.div></div>
            )}</AnimatePresence>
        </div>
    );
}
