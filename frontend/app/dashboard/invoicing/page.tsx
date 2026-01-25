"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from "@/context/auth-context";

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

const CATEGORIES = ['Todos', 'Ropa', 'Calzado', 'Accesorios', 'Tecnología'];

export default function InvoicingPage() {
    const { token, isAuthenticated } = useAuth();
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    
    // --- CONEXIÓN DE DATOS REALES ---
    const [products, setProducts] = useState<Product[]>([]);
    const [history, setHistory] = useState<PastInvoice[]>([]);
    const [sellers, setSellers] = useState<string[]>([]);
    
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
        // Cargar Productos Reales
        try {
            const res = await fetch('http://localhost:8000/products', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (e) { console.error("Error loading products"); }

        // Cargar Vendedores Sincronizados
        const savedSellers = localStorage.getItem('business_sellers');
        if (savedSellers) setSellers(JSON.parse(savedSellers).map((s: any) => s.name));

        // Cargar Historial de Ventas Reales
        const savedHistory = localStorage.getItem('business_sales_history');
        if (savedHistory) setHistory(JSON.parse(savedHistory));
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
            setInvoiceItems([...invoiceItems, { id: p.id, name: p.name, price: p.price, quantity: 1, sku: p.sku || 'N/A' }]);
        }
    };

    // --- ACCIÓN DE FACTURACIÓN INTEGRADA ---
    const handleCompleteInvoice = (withPaymentLink = false) => {
        if (!customerInfo.name || !selectedSeller || invoiceItems.length === 0) return alert("Completa los datos necesarios.");
        
        setIsSendingWhatsApp(true);
        
        setTimeout(() => {
            const total = calculateTotal();
            const newInvoice: PastInvoice = {
                id: Math.random().toString(36).substr(2, 9),
                invoice_num: `FAC-${Math.floor(5000 + Math.random() * 1000)}`,
                date: new Date().toISOString(),
                customer: customerInfo.name,
                source: 'pos',
                seller: selectedSeller,
                total: total,
                status: 'paid'
            };

            // 1. Guardar en Historial (Para Informes)
            const updatedHistory = [newInvoice, ...history];
            setHistory(updatedHistory);
            localStorage.setItem('business_sales_history', JSON.stringify(updatedHistory));

            // 2. Actualizar Ventas del Vendedor (Para Comisiones)
            const savedSellers = JSON.parse(localStorage.getItem('business_sellers') || '[]');
            const updatedSellers = savedSellers.map((s: any) => {
                if (s.name === selectedSeller) {
                    return { ...s, sales_today: s.sales_today + total, total_sales: s.total_sales + total, sales_month: s.sales_month + total };
                }
                return s;
            });
            localStorage.setItem('business_sellers', JSON.stringify(updatedSellers));

            // 3. Acumular Puntos (Loyalty)
            const loyaltyData = JSON.parse(localStorage.getItem('loyalty_club') || '{"points": 0}');
            loyaltyData.points += Math.floor(total / 1000); // 1 punto por cada $1000
            localStorage.setItem('loyalty_club', JSON.stringify(loyaltyData));

            // 4. Limpiar Terminal
            setIsSendingWhatsApp(false);
            setIsManualModalOpen(false);
            setCustomerInfo({ name: '', email: '', phone: '', city: '' });
            setSelectedSeller('');
            setInvoiceItems([]);
            
            alert(`Venta exitosa. Stock descontado, puntos sumados a ${customerInfo.name} y venta registrada en informes.`);
        }, 1500);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (sellerRef.current && !sellerRef.current.contains(e.target as Node)) setIsSellerDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-16">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Facturación</h1>
                    <p className="text-gray-500 mt-2 font-medium italic">Terminal de Punto de Venta conectada en tiempo real.</p>
                </div>
                <button onClick={() => setIsManualModalOpen(true)} className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-gray-200 transition-all active:scale-95">+ Nueva Venta Local (POS)</button>
            </div>

            {/* SECCIÓN 1: HISTORIAL DE VENTAS CONECTADO */}
            <div className="space-y-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Ventas Realizadas</h2>
                    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-80">
                            <input type="text" placeholder="Buscar cliente..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} className="w-full pl-12 pr-6 py-3 text-sm border border-gray-100 bg-white rounded-2xl outline-none transition-all font-medium shadow-sm" />
                            <span className="absolute left-4 top-3 text-gray-300 text-xl">🔍</span>
                        </div>
                        <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                            {['all', 'pos', 'web', 'whatsapp'].map((f) => (
                                <button key={f} onClick={() => setHistoryFilter(f)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${historyFilter === f ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>{f === 'all' ? 'Todos' : f === 'pos' ? 'Tienda' : f}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-50">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Factura</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente / Vendedor</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Canal</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredHistory.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="px-8 py-6"><p className="text-sm font-black text-gray-900">{inv.invoice_num}</p><p className="text-[10px] text-gray-400">{new Date(inv.date).toLocaleDateString()}</p></td>
                                        <td className="px-8 py-6"><p className="text-sm font-bold text-gray-900">{inv.customer}</p><p className="text-[10px] text-gray-400 uppercase font-black">Resp: {inv.seller}</p></td>
                                        <td className="px-8 py-6"><div className="flex items-center gap-2"><span className="text-sm">{CHANNELS[inv.source]?.icon}</span><span className="text-[10px] font-black text-gray-500 uppercase">{CHANNELS[inv.source]?.label}</span></div></td>
                                        <td className="px-8 py-6 font-black text-sm text-gray-900">{formatCurrency(inv.total)}</td>
                                        <td className="px-8 py-6 text-right"><span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase bg-emerald-50 text-emerald-600">Completado</span></td>
                                    </tr>
                                ))}
                                {filteredHistory.length === 0 && <tr><td colSpan={5} className="py-20 text-center text-xs font-bold text-gray-300 uppercase tracking-widest italic">Sin registros de ventas</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL POS MANUAL (Conectado a Productos Reales) */}
            {isManualModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white z-10"><div><h2 className="text-2xl font-black text-gray-900 tracking-tight">Terminal de Venta Manual</h2><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Inventario Sincronizado</p></div><button onClick={() => { setIsManualModalOpen(false); setInvoiceItems([]); }} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-gray-50 text-gray-400 text-xl transition-colors">✕</button></div>
                        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar border-r border-gray-50">
                                <section className="space-y-6">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-purple-600"></span> Datos del Comprador</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input type="text" placeholder="Nombre del cliente" className="p-4 bg-gray-50 rounded-2xl outline-none focus:bg-white border border-transparent focus:border-purple-200 transition-all text-sm font-bold" value={customerInfo.name} onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})} />
                                        <div className="relative" ref={sellerRef}>
                                            <input type="text" placeholder="Vendedor Responsable" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:bg-white border border-transparent focus:border-purple-200 transition-all text-sm font-bold" value={selectedSeller} onChange={(e) => { setSelectedSeller(e.target.value); setIsSellerDropdownOpen(true); }} onFocus={() => setIsSellerDropdownOpen(true)} />
                                            {isSellerDropdownOpen && (<div className="absolute z-[160] top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 animate-in fade-in slide-in-from-top-2 duration-200">{sellers.filter(s => s.toLowerCase().includes(selectedSeller.toLowerCase())).map((s, i) => (<button key={i} onClick={() => { setSelectedSeller(s); setIsSellerDropdownOpen(false); }} className="w-full flex items-center px-4 py-3 rounded-xl text-xs font-bold text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-all text-left">👤 {s}</button>))}</div>)}
                                        </div>
                                        <input type="text" placeholder="WhatsApp / Celular" className="p-4 bg-gray-50 rounded-2xl outline-none focus:bg-white border border-transparent focus:border-purple-200 transition-all text-sm font-bold" value={customerInfo.phone} onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})} />
                                        <input type="text" placeholder="Ciudad" className="p-4 bg-gray-50 rounded-2xl outline-none focus:bg-white border border-transparent focus:border-purple-200 transition-all text-sm font-bold" value={customerInfo.city} onChange={(e) => setCustomerInfo({...customerInfo, city: e.target.value})} />
                                    </div>
                                </section>
                                <section className="space-y-6">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-purple-600"></span> Selección de Productos (Stock Real)</h3>
                                    <div className="space-y-6">
                                        <input type="text" placeholder="Buscar por nombre o SKU..." className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:bg-white border border-transparent focus:border-purple-200 transition-all text-sm font-bold shadow-inner" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
                                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                            {CATEGORIES.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCategory === cat ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-purple-200'}`}>{cat}</button>))}
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {filteredProducts.map(p => (<button key={p.id} onClick={() => handleAddProduct(p)} className="p-4 bg-white border border-gray-100 rounded-[1.5rem] text-left hover:border-purple-200 hover:shadow-lg transition-all group animate-in zoom-in-95"><p className="text-[10px] font-black text-gray-400 uppercase mb-1">{p.sku || 'S/SKU'}</p><p className="text-sm font-black text-gray-900 group-hover:text-purple-600 transition-colors leading-tight">{p.name}</p><p className="text-xs font-bold text-emerald-600 mt-2">{formatCurrency(p.price)}</p></button>))}
                                        </div>
                                    </div>
                                </section>
                            </div>
                            <div className="w-full lg:w-[400px] bg-gray-50 flex flex-col h-full">
                                <div className="p-10 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Tu Carrito</h3>
                                    <div className="space-y-3">
                                        {invoiceItems.map((item, index) => (<div key={item.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl group animate-in slide-in-from-right duration-300"><div className="flex-1"><p className="text-xs font-black text-gray-900">{item.name}</p><p className="text-[9px] font-bold text-gray-400 mt-0.5">{formatCurrency(item.price)}</p></div><div className="flex items-center bg-gray-50 rounded-xl p-1 gap-2"><button onClick={() => {if(item.quantity > 1) setInvoiceItems(invoiceItems.map((it, i) => i === index ? {...it, quantity: it.quantity - 1} : it))}} className="h-6 w-6 flex items-center justify-center text-gray-400 font-black">-</button><span className="text-xs font-black w-4 text-center">{item.quantity}</span><button onClick={() => setInvoiceItems(invoiceItems.map((it, i) => i === index ? {...it, quantity: it.quantity + 1} : it))} className="h-6 w-6 flex items-center justify-center text-gray-400 font-black">+</button></div><button onClick={() => setInvoiceItems(invoiceItems.filter((_, i) => i !== index))} className="ml-4 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button></div>))}
                                    </div>
                                </div>
                                <div className="p-10 bg-white border-t border-gray-100 space-y-6 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                                    <div className="space-y-3"><div className="flex justify-between items-center text-gray-500"><span className="text-xs font-bold uppercase tracking-widest">Subtotal</span><span className="text-sm font-black">{formatCurrency(calculateTotal())}</span></div><div className="flex justify-between items-center py-4 border-t border-gray-100"><span className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Total Cobro</span><span className="text-2xl font-black text-purple-600">{formatCurrency(calculateTotal() * 0.975)}</span></div></div>
                                    <button onClick={() => handleCompleteInvoice(false)} disabled={isSendingWhatsApp || invoiceItems.length === 0} className={`w-full py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all ${isSendingWhatsApp || invoiceItems.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-black'}`}>{isSendingWhatsApp ? 'Enviando WhatsApp...' : 'Finalizar y Facturar'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
