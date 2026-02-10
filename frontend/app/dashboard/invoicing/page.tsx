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
  Briefcase,
  Send,
  ShieldCheck,
  Navigation
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
interface Product { id: string; name: string; category: string; price: number; sku: string; image_url?: string; variants?: any[]; }
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
    const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '', city: '' });
    const [invoiceItems, setInvoiceItems] = useState<InvoicingItem[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas'); 
    const [categories, setCategories] = useState<string[]>(['Todas']); 
    const [isProcessing, setIsProcessing] = useState(false);
    const [posCustomerMode, setPosCustomerMode] = useState<'search' | 'create'>('create');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');

    const loadData = useCallback(async () => {
        if (!token) return;
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://gallant-education-production-8b4a.up.railway.app';
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
        } catch (e) {}
    }, [token]);

    useEffect(() => { loadData(); }, [loadData]);

    const calculateSubtotal = () => invoiceItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

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
                            {[ { l: 'Ventas Hoy', v: 4250000 }, { l: 'Operaciones', v: 124 }, { l: 'Ticket Promedio', v: 325000 }, { l: 'Flujo Caja', v: 124000000 } ].map((k, i) => (
                                <PremiumCard key={i} className="p-8"><div className="flex justify-between items-start mb-6"><div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-[#004D4D]/5 text-[#004D4D]"><Activity size={24}/></div></div><div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{k.l}</p><h3 className="text-3xl font-black text-gray-900 tracking-tighter italic">{i !== 1 && "$ "}<AnimatedNumber value={k.v} type={i === 1 ? 'simple' : 'currency'} /></h3></div></PremiumCard>
                            ))}
                        </div>

                        <div className="px-4 space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                                <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Historial de Operaciones</h4>
                                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-full max-w-md"><Search size={18} className="text-gray-300 ml-2"/><input placeholder="Buscar..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} className="flex-1 bg-transparent outline-none text-sm font-bold" /></div>
                            </div>
                            <div className="bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/80 shadow-xl overflow-hidden"><table className="w-full text-center">
                                <thead><tr className="bg-gray-50/50">{['Factura', 'Cliente', 'Monto'].map((h, i) => (<th key={i} className="px-8 py-6 text-[10px] font-black text-[#004D4D] uppercase">{h}</th>))}</tr></thead>
                                <tbody className="divide-y divide-gray-100/50">{history.map((inv) => (<tr key={inv.id} className="hover:bg-white/60 transition-all cursor-pointer"><td className="px-8 py-8 font-black text-gray-900 text-sm">{inv.invoice_num}</td><td className="px-8 py-8 font-bold text-gray-600">{inv.customer}</td><td className="px-8 py-8 font-black text-[#004D4D]">$ {inv.total.toLocaleString()}</td></tr>))}</tbody>
                            </table></div>
                        </div>
                    </div>
                ) : (
                    <motion.div key="pos-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[3000] flex flex-col lg:flex-row overflow-hidden bg-white">
                        {/* IZQUIERDA: PANEL DE CONTROL (EDICIÓN) */}
                        <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 flex flex-col bg-[#FAFAFA] border-r border-gray-100 overflow-hidden relative">
                            <header className="p-8 border-b bg-white flex justify-between items-center shrink-0">
                                <button onClick={() => setIsPOSActive(false)} className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-rose-500 transition-all"><ArrowLeft size={16}/> Cancelar Venta</button>
                                <div className="p-1 bg-gray-100 rounded-2xl flex gap-1">
                                    <button onClick={() => setPosCustomerMode('create')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${posCustomerMode === 'create' ? 'bg-white text-[#004D4D] shadow-md' : 'text-gray-400'}`}>Registrar</button>
                                    <button onClick={() => setPosCustomerMode('search')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${posCustomerMode === 'search' ? 'bg-white text-[#004D4D] shadow-md' : 'text-gray-400'}`}>Buscar</button>
                                </div>
                            </header>
                            
                            <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#001A1A]">Información del <span className="text-[#004D4D]">Adquiriente</span></h3>
                                    {posCustomerMode === 'create' ? (
                                        <div className="grid grid-cols-2 gap-6 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                                            <div className="space-y-2 col-span-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label><input value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm focus:bg-white" placeholder="Ej: Juan Pérez" /></div>
                                            <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp</label><input value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm focus:bg-white" placeholder="300 000 0000" /></div>
                                            <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Ciudad</label><input value={customerInfo.city} onChange={e => setCustomerInfo({...customerInfo, city: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm focus:bg-white" placeholder="Ej: Medellín" /></div>
                                        </div>
                                    ) : (
                                        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 flex items-center gap-4 shadow-sm animate-in slide-in-from-right-4"><Search className="text-gray-300"/><input className="bg-transparent outline-none font-bold text-sm flex-1" placeholder="Nombre, ID o Email..." /></div>
                                    )}
                                </div>

                                <div className="space-y-8">
                                    <div className="flex items-center justify-between"><h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#001A1A]">Catálogo <span className="text-[#004D4D]">Estratégico</span></h3><div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm"><Search size={14} className="text-gray-300"/><input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Filtrar..." className="bg-transparent outline-none text-[10px] font-bold w-32" /></div></div>
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">{categories.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-[#004D4D] text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-400'}`}>{cat === 'Todas' ? 'Ver Todo' : cat}</button>))}</div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pb-20">
                                        {filteredProducts.map(p => (<button key={p.id} onClick={() => setInvoiceItems([...invoiceItems, { id: p.id, variant_id: p.variants?.[0]?.id || p.id, name: p.name, price: p.price, quantity: 1, sku: p.sku || 'N/A', image: p.image_url }])} className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:scale-105 transition-all text-left group"><div className="aspect-square bg-gray-50 rounded-2xl mb-4 overflow-hidden border border-gray-50">{p.image_url ? <img src={p.image_url} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"/> : <div className="h-full w-full flex items-center justify-center text-gray-200"><Package size={24}/></div>}</div><p className="text-[10px] font-black text-gray-900 truncate leading-tight">{p.name}</p><p className="text-[11px] font-black text-[#004D4D] mt-1">${p.price.toLocaleString()}</p></button>))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

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