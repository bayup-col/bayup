"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from "@/context/auth-context";
import { 
  User, 
  Mail, 
  Smartphone, 
  MapPin, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  MessageSquare,
  Package,
  CheckCircle2,
  ChevronRight,
  Store,
  DollarSign,
  Printer
} from 'lucide-react';

interface InvoicingItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    sku: string;
}

interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    sku: string;
    variants?: any[];
}

interface PastInvoice {
    id: string;
    invoice_num: string;
    date: string;
    customer: string;
    customer_email?: string;
    source: 'web' | 'pos' | 'instagram' | 'whatsapp';
    seller?: string;
    total: number;
    status: 'paid' | 'cancelled' | 'refunded';
}

const CHANNELS = {
    web: { icon: '🌐', label: 'Tienda Web', color: 'bg-blue-50 text-blue-600' },
    instagram: { icon: '📸', label: 'Instagram', color: 'bg-pink-50 text-pink-600' },
    whatsapp: { icon: '✅', label: 'WhatsApp', color: 'bg-emerald-50 text-emerald-600' },
    pos: { icon: '🏪', label: 'Tienda Física', color: 'bg-gray-900 text-white' }
};

const InputWithIcon = ({ icon: Icon, ...props }: any) => (
    <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-600 transition-colors">
            <Icon size={18} />
        </div>
        <input 
            {...props} 
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all shadow-inner" 
        />
    </div>
);

export default function InvoicingPage() {
    const { token, isAuthenticated } = useAuth();
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<PastInvoice | null>(null);
    
    // --- CONEXIÓN DE DATOS REALES ---
    const [products, setProducts] = useState<Product[]>([]);
    const [history, setHistory] = useState<PastInvoice[]>([]);
    const [sellers, setSellers] = useState<{name: string, role: string}[]>([]);
    const [categories, setCategories] = useState<string[]>(['Todos']);
    
    // Estados de Filtros
    const [historySearch, setHistorySearch] = useState('');
    const [historyFilter, setHistoryFilter] = useState('all');

    // Estado Facturación Manual
    const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '', city: '' });
    const [selectedSeller, setSelectedSeller] = useState('');
    const [isSellerDropdownOpen, setIsSellerDropdownOpen] = useState(false);
    const sellerRef = useRef<HTMLDivElement>(null);

    const [invoiceItems, setInvoiceItems] = useState<InvoicingItem[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

    // 1. CARGAR TODO EL ECOSISTEMA
    const loadEcosystem = useCallback(async () => {
        if (!token) return;
        
        // Cargar Vendedores (Staff Real)
        try {
            const res = await fetch('http://localhost:8000/admin/users', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setSellers(data.map((u: any) => ({ name: u.full_name || u.email, role: u.role })));
            }
        } catch (e) { console.error("Error loading sellers"); }

        // Cargar Productos Reales con Stock
        try {
            const res = await fetch('http://localhost:8000/products', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (e) { console.error("Error loading products"); }

        // Cargar Historial de Ventas Reales
        try {
            const res = await fetch('http://localhost:8000/orders', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                const mappedHistory: PastInvoice[] = data.map((o: any) => ({
                    id: o.id,
                    invoice_num: `FAC-${o.id.slice(0, 4).toUpperCase()}`,
                    date: o.created_at,
                    customer: o.customer_name || 'Cliente General',
                    customer_email: o.customer_email || 'No registrado',
                    source: 'pos',
                    seller: o.seller_name || 'Sistema Central',
                    total: o.total_price || 0,
                    status: 'paid',
                    items: o.items // Guardamos los items para el detalle
                }));
                setHistory(mappedHistory);
            }
        } catch (e) { console.error("Error loading order history"); }

        // Cargar Colecciones (Categorías) Reales
        try {
            const res = await fetch('http://localhost:8000/collections', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                const titles = data.map((c: any) => c.title);
                setCategories(['Todos', ...titles]);
            }
        } catch (e) { console.error("Error loading collections"); }
    }, [token]);

    useEffect(() => { loadEcosystem(); }, [loadEcosystem]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(amount).replace('$', '$ ');
    };

    const calculateTotal = () => invoiceItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
            const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [productSearch, selectedCategory, products]);

    const filteredHistory = useMemo(() => {
        return history.filter(inv => {
            const matchesSearch = inv.customer.toLowerCase().includes(historySearch.toLowerCase()) || inv.invoice_num.toLowerCase().includes(historySearch.toLowerCase());
            const matchesFilter = historyFilter === 'all' || inv.source === historyFilter;
            return matchesSearch && matchesFilter;
        });
    }, [historySearch, historyFilter, history]);

    const handleAddProduct = (p: Product) => {
        const existing = invoiceItems.find(item => item.id === p.id);
        if (existing) {
            setInvoiceItems(invoiceItems.map(item => item.id === p.id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setInvoiceItems([...invoiceItems, { 
                id: p.id, 
                variant_id: (p as any).variants?.[0]?.id || p.id,
                name: p.name, 
                price: p.price, 
                quantity: 1, 
                sku: p.sku || 'N/A' 
            }]);
        }
    };

    // --- ACCIÓN DE FACTURACIÓN INTEGRADA ---
    const handleCompleteInvoice = async (sendWhatsApp = false) => {
        if (!customerInfo.email || invoiceItems.length === 0) {
            return alert("El email del cliente y al menos un producto son obligatorios.");
        }
        
        setIsSendingWhatsApp(true);
        
        try {
            const orderData = {
                customer_name: customerInfo.name,
                customer_email: customerInfo.email,
                seller_name: selectedSeller,
                items: invoiceItems.map(item => ({
                    product_variant_id: (item as any).variant_id,
                    quantity: item.quantity
                }))
            };

            await fetch('http://localhost:8000/orders', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            // Envío por WhatsApp si se solicita
            if (sendWhatsApp && customerInfo.phone) {
                const total = calculateTotal();
                const message = `¡Hola ${customerInfo.name}! ✨ Gracias por tu compra. Tu pedido por ${formatCurrency(total)} ha sido procesado exitosamente. 🚀`;
                window.open(`https://wa.me/${customerInfo.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
            }

            alert(`¡Venta completada! El stock ha sido descontado automáticamente.`);
            
            // Limpiar y Recargar
            setIsManualModalOpen(false);
            setCustomerInfo({ name: '', email: '', phone: '', city: '' });
            setInvoiceItems([]);
            loadEcosystem(); // Recargar productos para ver el nuevo stock
            
        } catch (err) {
            alert("Hubo un error al procesar la venta en el servidor.");
        } finally {
            setIsSendingWhatsApp(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (sellerRef.current && !sellerRef.current.contains(e.target as Node)) setIsSellerDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-16 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
                        Facturación
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Gestiona tus ventas y emite facturas al instante.</p>
                </div>
                <button 
                    onClick={() => setIsManualModalOpen(true)} 
                    className="bg-gray-900 hover:bg-black text-white px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-gray-200 active:scale-95 transition-all flex items-center gap-3"
                >
                    <Plus size={16} /> Nueva Venta (POS)
                </button>
            </div>

            {/* SECCIÓN 1: HISTORIAL */}
            <div className="space-y-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Historial de Operaciones</h2>
                    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-80 group">
                            <input 
                                type="text" 
                                placeholder="Buscar por factura o cliente..." 
                                value={historySearch} 
                                onChange={(e) => setHistorySearch(e.target.value)} 
                                className="w-full pl-12 pr-6 py-3.5 text-sm border border-gray-100 bg-white rounded-2xl outline-none focus:border-purple-200 transition-all font-medium shadow-sm" 
                            />
                            <Search className="absolute left-4 top-3.5 text-gray-300 group-focus-within:text-purple-500 transition-colors" size={20} />
                        </div>
                        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                            {['all', 'pos', 'web', 'whatsapp'].map((f) => (
                                <button key={f} onClick={() => setHistoryFilter(f)} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${historyFilter === f ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>{f === 'all' ? 'Todos' : f === 'pos' ? 'Tienda' : f}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Factura</th>
                                    <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente / Responsable</th>
                                    <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Canal</th>
                                    <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto Total</th>
                                    <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {filteredHistory.map((inv) => (
                                    <tr 
                                        key={inv.id} 
                                        onClick={() => setSelectedInvoice(inv)}
                                        className="hover:bg-gray-50/50 transition-all group cursor-pointer"
                                    >
                                        <td className="px-10 py-8"><p className="text-sm font-black text-gray-900 group-hover:text-purple-600 transition-colors">{inv.invoice_num}</p><p className="text-[10px] text-gray-400 mt-1">{new Date(inv.date).toLocaleDateString()}</p></td>
                                        <td className="px-10 py-8"><p className="text-sm font-bold text-gray-900">{inv.customer}</p><p className="text-[10px] text-gray-400 uppercase font-black mt-1">Vendedor: {inv.seller}</p></td>
                                        <td className="px-10 py-8"><div className="flex items-center gap-2"><span className="text-lg">{CHANNELS[inv.source]?.icon}</span><span className="text-[10px] font-black text-gray-500 uppercase">{CHANNELS[inv.source]?.label}</span></div></td>
                                        <td className="px-10 py-8 font-black text-sm text-gray-900">{formatCurrency(inv.total)}</td>
                                        <td className="px-10 py-8 text-right"><span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">Pagado</span></td>
                                    </tr>
                                ))}
                                {filteredHistory.length === 0 && <tr><td colSpan={5} className="py-24 text-center"><div className="flex flex-col items-center gap-4 text-gray-300"><Store size={48} strokeWidth={1} /><p className="text-xs font-bold uppercase tracking-[0.2em]">No hay ventas registradas aún</p></div></td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL POS: REDISEÑO PREMIUM */}
            {isManualModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-7xl h-[90vh] rounded-[3.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
                        {/* Header POS */}
                        <div className="p-8 md:px-12 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
                                    <Store className="text-purple-600" size={28} />
                                    Punto de Venta Directo
                                </h2>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Terminal Inteligente Sincronizada</p>
                            </div>
                            <button 
                                onClick={() => { setIsManualModalOpen(false); setInvoiceItems([]); }} 
                                className="h-14 w-14 flex items-center justify-center rounded-[1.5rem] bg-gray-50 hover:bg-rose-50 hover:text-rose-500 text-gray-400 transition-all active:scale-90"
                            >
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                            {/* Panel Izquierdo: Configuración */}
                            <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 custom-scrollbar bg-white">
                                {/* Sección Cliente */}
                                <section className="space-y-8 animate-in slide-in-from-left duration-500">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                                            <User size={20} />
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest text-[11px]">Identificación del Cliente</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputWithIcon icon={User} placeholder="Nombre completo del cliente" value={customerInfo.name} onChange={(e: any) => setCustomerInfo({...customerInfo, name: e.target.value})} />
                                        <InputWithIcon icon={Mail} placeholder="Correo electrónico (Para registro automático)" value={customerInfo.email} onChange={(e: any) => setCustomerInfo({...customerInfo, email: e.target.value})} />
                                        <InputWithIcon icon={Smartphone} placeholder="WhatsApp (Ej: 57300...)" value={customerInfo.phone} onChange={(e: any) => setCustomerInfo({...customerInfo, phone: e.target.value})} />
                                        <div className="relative group" ref={sellerRef}>
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-600 transition-colors">
                                                <Store size={18} />
                                            </div>
                                            <input 
                                                type="text" 
                                                placeholder="Vendedor Responsable" 
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-2xl outline-none text-sm font-bold transition-all shadow-inner" 
                                                value={selectedSeller} 
                                                onChange={(e) => { setSelectedSeller(e.target.value); setIsSellerDropdownOpen(true); }} 
                                                onFocus={() => setIsSellerDropdownOpen(true)} 
                                            />
                                            {isSellerDropdownOpen && (
                                                <div className="absolute z-[160] top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    {sellers.filter(s => s.name.toLowerCase().includes(selectedSeller.toLowerCase())).map((s, i) => (
                                                        <button key={i} onClick={() => { setSelectedSeller(s.name); setIsSellerDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-all text-left">
                                                            <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">👤</div>
                                                            <div>
                                                                <p className="text-gray-900">{s.name}</p>
                                                                <p className="text-[9px] text-gray-400 uppercase tracking-widest">{s.role}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                {/* Sección Selección Productos */}
                                <section className="space-y-8 pt-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                                                <Package size={20} />
                                            </div>
                                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest text-[11px]">Catálogo en Stock</h3>
                                        </div>
                                        <div className="flex gap-2">
                                            {categories.slice(0, 5).map(cat => (
                                                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${selectedCategory === cat ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-purple-200'}`}>{cat}</button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div className="relative group">
                                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-purple-500 transition-colors" size={22} />
                                            <input type="text" placeholder="Escribe el nombre o SKU del producto para añadirlo..." className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-transparent focus:bg-white focus:border-purple-200 rounded-[2rem] outline-none text-sm font-black transition-all shadow-inner" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {filteredProducts.map(p => {
                                                const mainVariant = p.variants?.[0];
                                                const stock = mainVariant?.stock || 0;
                                                return (
                                                    <button 
                                                        key={p.id} 
                                                        onClick={() => stock > 0 && handleAddProduct(p)} 
                                                        className={`p-5 bg-white border border-gray-100 rounded-[2rem] text-left hover:border-purple-200 hover:shadow-2xl transition-all group relative overflow-hidden active:scale-95 ${stock === 0 ? 'opacity-50 grayscale' : ''}`}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <p className="text-[9px] font-black text-gray-300 uppercase mb-1 tracking-widest">{p.sku || 'SIN SKU'}</p>
                                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${stock > 5 ? 'bg-gray-50 text-gray-400' : stock > 0 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                Stock: {stock}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-black text-gray-900 group-hover:text-purple-600 transition-colors leading-tight h-10 overflow-hidden">{p.name}</p>
                                                        <div className="mt-4 flex items-center justify-between">
                                                            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{formatCurrency(p.price)}</span>
                                                            <div className="h-8 w-8 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all"><Plus size={14} /></div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Panel Derecho: Carrito y Cierre (Sticky) */}
                            <div className="w-full lg:w-[450px] bg-gray-50/50 border-l border-gray-100 flex flex-col h-full relative">
                                <div className="p-8 md:p-12 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Tu Orden</h3>
                                        <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full">{invoiceItems.length} Ítems</span>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {invoiceItems.map((item, index) => (
                                            <div key={item.id} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-3xl group animate-in slide-in-from-right duration-300 shadow-sm">
                                                <div className="flex-1">
                                                    <p className="text-xs font-black text-gray-900 leading-tight">{item.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 mt-1">{formatCurrency(item.price)} / unit</p>
                                                </div>
                                                <div className="flex items-center bg-gray-50 rounded-2xl p-1.5 gap-3 border border-gray-100">
                                                    <button onClick={() => {if(item.quantity > 1) setInvoiceItems(invoiceItems.map((it, i) => i === index ? {...it, quantity: it.quantity - 1} : it))}} className="h-8 w-8 flex items-center justify-center bg-white rounded-xl text-gray-400 hover:text-rose-500 shadow-sm transition-all"><Minus size={14} /></button>
                                                    <span className="text-sm font-black w-6 text-center">{item.quantity}</span>
                                                    <button onClick={() => setInvoiceItems(invoiceItems.map((it, i) => i === index ? {...it, quantity: it.quantity + 1} : it))} className="h-8 w-8 flex items-center justify-center bg-white rounded-xl text-gray-400 hover:text-emerald-500 shadow-sm transition-all"><Plus size={14} /></button>
                                                </div>
                                                <button onClick={() => setInvoiceItems(invoiceItems.filter((_, i) => i !== index))} className="ml-4 p-2 text-gray-200 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                        {invoiceItems.length === 0 && (
                                            <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center gap-3">
                                                <Store className="text-gray-200" size={40} />
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">El carrito está vacío</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-8 md:p-12 bg-white border-t border-gray-100 space-y-8 shadow-[0_-20px_60px_rgba(0,0,0,0.03)] relative z-10">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-gray-400">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Subtotal Bruto</span>
                                            <span className="text-sm font-bold">{formatCurrency(calculateTotal())}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-rose-400">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Ajuste Plataforma (-2.5%)</span>
                                            <span className="text-sm font-bold">-{formatCurrency(calculateTotal() * 0.025)}</span>
                                        </div>
                                        <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">Total a Pagar</p>
                                                <p className="text-xs text-gray-400 font-medium">IVA Incluido</p>
                                            </div>
                                            <span className="text-4xl font-black text-purple-600 tracking-tighter">{formatCurrency(calculateTotal() * 0.975)}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => handleCompleteInvoice(true)} 
                                            disabled={isSendingWhatsApp || invoiceItems.length === 0} 
                                            className={`flex flex-col items-center justify-center py-5 rounded-[2rem] font-black text-[9px] uppercase tracking-widest transition-all gap-2 border-2 ${isSendingWhatsApp || invoiceItems.length === 0 ? 'bg-gray-50 text-gray-200 border-gray-100 cursor-not-allowed' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 shadow-xl shadow-emerald-100/50'}`}
                                        >
                                            <MessageSquare size={20} />
                                            WhatsApp + Facturar
                                        </button>
                                        <button 
                                            onClick={() => handleCompleteInvoice(false)} 
                                            disabled={isSendingWhatsApp || invoiceItems.length === 0} 
                                            className={`flex flex-col items-center justify-center py-5 rounded-[2rem] font-black text-[9px] uppercase tracking-widest transition-all gap-2 ${isSendingWhatsApp || invoiceItems.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-black shadow-2xl shadow-gray-200'}`}
                                        >
                                            <CheckCircle2 size={20} />
                                            Solo Facturar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                                </div>
                            )}
                
                            {/* MODAL DETALLE DE FACTURA (FLOTANTE) */}
                            {selectedInvoice && (
                                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                                    <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                                        {/* Header Oscuro */}
                                        <div className="bg-gray-900 p-10 text-white relative">
                                            <button 
                                                onClick={() => setSelectedInvoice(null)}
                                                className="absolute top-8 right-8 h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all active:scale-90"
                                            >
                                                <Plus className="rotate-45" size={24} />
                                            </button>
                                            <div className="flex items-center gap-6">
                                                <div className="h-16 w-16 bg-purple-600 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-purple-500/20 text-2xl">
                                                    <DollarSign size={32} />
                                                </div>
                                                <div>
                                                    <h2 className="text-3xl font-black tracking-tighter">Detalle de Venta</h2>
                                                    <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{selectedInvoice.invoice_num} • {new Date(selectedInvoice.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                </div>
                                            </div>
                                        </div>
                
                                                                {/* Contenido del Detalle */}
                                                                <div className="p-10 space-y-10">
                                                                    {/* Grid de Información */}
                                                                    <div className="grid grid-cols-2 gap-8">
                                                                        <div className="space-y-1.5">
                                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Información del Cliente</p>
                                                                            <p className="text-base font-black text-gray-900">{selectedInvoice.customer}</p>
                                                                            <p className="text-[11px] font-bold text-purple-600">{selectedInvoice.customer_email}</p>
                                                                        </div>
                                                                        <div className="space-y-1.5 text-right">
                                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Responsable de Venta</p>
                                                                            <p className="text-sm font-black text-gray-900">{selectedInvoice.seller}</p>
                                                                            <div className="flex items-center justify-end gap-2 mt-1">
                                                                                <span className="text-sm">{CHANNELS[selectedInvoice.source]?.icon}</span>
                                                                                <p className="text-[10px] font-black text-gray-500 uppercase">{CHANNELS[selectedInvoice.source]?.label}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                                    {/* Resumen Financiero */}
                                            <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100">
                                                <div className="flex justify-between items-center mb-4">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resumen de Pago</p>
                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium text-gray-500">Subtotal</span>
                                                        <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedInvoice.total)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium text-gray-500">Impuestos (Incl.)</span>
                                                        <span className="text-sm font-bold text-gray-900">$ 0</span>
                                                    </div>
                                                    <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                                                        <span className="text-base font-black text-gray-900 uppercase tracking-tight">Total Cobrado</span>
                                                        <span className="text-3xl font-black text-purple-600 tracking-tighter">{formatCurrency(selectedInvoice.total)}</span>
                                                    </div>
                                                </div>
                                            </div>
                
                                            {/* Botones de Acción */}
                                            <div className="flex gap-4 pt-4">
                                                <button className="flex-1 flex flex-col items-center justify-center py-5 bg-gray-50 text-gray-500 rounded-[2rem] font-black text-[9px] uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100 gap-2">
                                                    <Printer size={20} />
                                                    Imprimir Factura
                                                </button>
                                                <button className="flex-1 flex flex-col items-center justify-center py-5 bg-emerald-50 text-emerald-600 rounded-[2rem] font-black text-[9px] uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100 gap-2">
                                                    <MessageSquare size={20} />
                                                    Reenviar WhatsApp
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                }
                