"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Plus, ShoppingCart, ChevronDown, Search, X, CheckCircle2, Mail, MessageSquare, Bell, Calendar as CalendarIcon,
  Filter, ArrowUpRight, MoreVertical, ExternalLink, Users, Package, Clock, DollarSign, Rocket,
  Trash2, Send, History as LucideHistory, Truck, Store, ChevronRight, Download, ShieldCheck,
  AlertCircle, FileText, Zap, ArrowRight, Layers, LayoutGrid, Sparkles, Bot, CreditCard, Target,
  Info, RotateCcw, Star, BarChart3, Activity, QrCode, Save, RefreshCw, ArrowDownRight, Printer
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- INTERFACES ---
interface POItem {
    id: string; name: string; sku: string; qty: number; cost: number; received: number;
}

interface PurchaseOrder {
    id: string;
    provider: { name: string; email: string; phone: string };
    warehouse: string;
    status: 'sent' | 'received' | 'canceled';
    items: POItem[];
    total: number;
    created_at: string;
    expected_at: string;
    history: { date: string; status: string; user: string; comment: string }[];
}

interface MetricData {
    id: string;
    title: string;
    value: any;
    trend?: string;
    trendUp?: boolean;
    icon: any;
    color: string;
    bg: string;
    description: string;
    detailContent?: React.ReactNode;
}

// --- MOCK DATA ---
const MOCK_ORDERS: PurchaseOrder[] = [
    {
        id: "PO-2026-001",
        provider: { name: "Textiles del Norte", email: "ventas@norte.com", phone: "+57 300 111 2233" },
        warehouse: "Bodega Central", status: 'sent',
        items: [
            { id: "p1", name: "Camisa Lino Blanca", sku: "SH-LIN-WH", qty: 100, cost: 45000, received: 0 },
            { id: "p2", name: "Vestido Floral", sku: "DR-FLO-01", qty: 50, cost: 85000, received: 0 }
        ],
        total: 8750000, created_at: "2026-01-28", expected_at: "2026-02-05",
        history: [{ date: "28 Ene", status: "Creada", user: "Admin", comment: "Stock inicial" }]
    }
];

// --- COMPONENTES DE APOYO ---
function AnimatedNumber({ value, type = 'simple' }: { value: number, type?: 'simple' | 'currency' | 'percent' }) {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current: number) => {
        if (type === 'percent') return `${current.toFixed(1)}%`;
        if (type === 'simple') return Math.round(current).toLocaleString();
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(current);
    });
    useEffect(() => { spring.set(value); }, [value, spring]);
    return <motion.span>{display}</motion.span>;
}

const TiltCard = ({ data, onClick }: { data: MetricData, onClick: () => void }) => {
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
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { x.set(0); y.set(0); }}
            onClick={onClick}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative h-48 cursor-pointer group"
            whileHover={{ scale: 1.02 }}
        >
            <div className="relative h-full bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm transition-all duration-300 group-hover:shadow-2xl overflow-hidden text-left">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${data.bg} opacity-20 rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700`}></div>
                <div className="relative z-10 flex flex-col h-full justify-between" style={{ transform: "translateZ(30px)" }}>
                    <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-2xl ${data.bg} ${data.color} shadow-lg shadow-current/10 border border-white/50`}>{data.icon}</div>
                        {data.trend && (
                             <div className={`flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${data.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {data.trendUp ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>} {data.trend}
                             </div>
                        )}
                    </div>
                    <div className="mt-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{data.title}</p>
                        <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">
                            <AnimatedNumber value={data.value} type={data.id === 'inversion' ? 'currency' : data.id === 'cumplimiento' ? 'percent' : 'simple'} />
                        </h3>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const MetricModal = ({ metric, onClose }: { metric: MetricData | null, onClose: () => void }) => {
    if (!metric) return null;
    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-white">
                <div className={`p-10 bg-gradient-to-br ${metric.bg} relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div className={`h-14 w-14 rounded-2xl bg-white flex items-center justify-center ${metric.color} shadow-xl`}>{metric.icon}</div>
                        <button onClick={onClose} className="h-10 w-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-slate-900 transition-colors"><X size={20}/></button>
                    </div>
                    <div className="relative z-10 mt-8">
                        <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">
                            {metric.id === 'inversion' ? `$ ${metric.value.toLocaleString()}` : metric.id === 'cumplimiento' ? `${metric.value}%` : metric.value}
                        </h3>
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest opacity-70 mt-1">{metric.title}</p>
                    </div>
                </div>
                <div className="p-10">
                     <p className="text-slate-500 font-medium mb-8 text-sm leading-relaxed">{metric.description}</p>
                     <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">{metric.detailContent}</div>
                     <button onClick={onClose} className="w-full mt-8 py-5 rounded-2xl bg-[#004D4D] text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-cyan-900/20">Cerrar Análisis</button>
                </div>
            </motion.div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export default function PurchaseOrdersPage() {
    const { showToast } = useToast();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [activeTab, setActiveTab] = useState<'todos' | 'sent' | 'received' | 'proveedores' | 'bayt'>('todos');
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [selectedMetric, setSelectedMetric] = useState<MetricData | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [activeGuideTab, setActiveGuideTab] = useState('ciclo');
    
    // UI States
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isDateHovered, setIsDateHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    // Empresa Info para el preview
    const [companyInfo, setCompanyInfo] = useState<any>(null);

    // Formulario Nueva Orden
    const [newPO, setNewPO] = useState({ 
        provider: '', 
        warehouse: 'Bodega Central', 
        expected_at: new Date().toISOString().split('T')[0], 
        items: [{ id: '1', name: '', sku: '', qty: 1, cost: 0, received: 0 }] 
    });

    useEffect(() => {
        const savedOrders = localStorage.getItem('bayup_purchase_orders');
        if (savedOrders) setOrders(JSON.parse(savedOrders));
        else setOrders(MOCK_ORDERS);

        const savedSettings = localStorage.getItem('bayup_general_settings');
        if (savedSettings) setCompanyInfo(JSON.parse(savedSettings));
    }, []);

    useEffect(() => {
        if (orders.length > 0) localStorage.setItem('bayup_purchase_orders', JSON.stringify(orders));
    }, [orders]);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);

    const kpiData: MetricData[] = useMemo(() => [
        { id: 'abiertas', title: 'Órdenes Abiertas', value: orders.filter(o=>o.status==='sent').length, trend: 'En tránsito', trendUp: true, icon: <ShoppingCart size={24}/>, color: 'text-slate-600', bg: 'from-slate-50 to-slate-100', description: 'Volumen total de pedidos a proveedores esperando recepción.', detailContent: <div className="space-y-2"><p className="text-[10px] font-bold text-slate-500 uppercase italic">Stock entrante valorado en: {formatCurrency(orders.filter(o=>o.status==='sent').reduce((a,b)=>a+b.total,0))}</p></div> },
        { id: 'inversion', title: 'Inversión Total', value: orders.reduce((a,b)=>a+b.total,0), trend: '+12% vs dic', trendUp: true, icon: <DollarSign size={24}/>, color: 'text-emerald-600', bg: 'from-emerald-50 to-teal-50', description: 'Capital total invertido en inventario históricamente.', detailContent: <div className="h-12 flex items-end gap-1">{[40, 70, 45, 90, 60, 80].map((h, i) => (<div key={i} className="w-full bg-emerald-500 rounded-t-sm" style={{ height: `${h}%` }}></div>))}</div> },
        { id: 'proveedores', title: 'Proveedores', value: new Set(orders.map(o=>o.provider.name)).size, trend: 'Red Activa', trendUp: true, icon: <Users size={24}/>, color: 'text-blue-600', bg: 'from-blue-50 to-cyan-50', description: 'Número de aliados estratégicos registrados en la cadena.', detailContent: <div className="p-4 bg-blue-500 rounded-xl text-white text-center font-black uppercase text-[10px]">Supply Score: 9.2/10</div> },
        { id: 'cumplimiento', title: 'Efectividad', value: 94.2, trend: 'SLA Óptimo', trendUp: true, icon: <CheckCircle2 size={24}/>, color: 'text-cyan-600', bg: 'from-cyan-50 to-blue-50', description: 'Porcentaje de órdenes recibidas sin novedades de stock.', detailContent: <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs"><CheckCircle2 size={14}/> 98% Precisión SKUs</div> }
    ], [orders]);

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) || o.provider.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'todos' || o.status === activeTab;
            let matchesDate = true;
            if (dateRange.from && dateRange.to) {
                const date = new Date(o.created_at).getTime();
                matchesDate = date >= new Date(dateRange.from).getTime() && date <= new Date(dateRange.to).getTime();
            }
            return matchesSearch && matchesTab && matchesDate;
        });
    }, [orders, searchTerm, activeTab, dateRange]);

    const handleSavePO = () => {
        if (!newPO.provider || newPO.items.some(i => !i.name)) return;
        const total = newPO.items.reduce((acc, i) => acc + (i.qty * i.cost), 0);
        const order: PurchaseOrder = {
            id: `PO-${Date.now().toString().slice(-6)}`,
            provider: { name: newPO.provider, email: '', phone: '' },
            warehouse: newPO.warehouse, status: 'sent',
            items: newPO.items, total, created_at: new Date().toISOString().split('T')[0],
            expected_at: newPO.expected_at, history: [{ date: 'Hoy', status: 'Enviada', user: 'Admin', comment: 'Orden emitida' }]
        };
        setOrders([order, ...orders]); setIsCreateModalOpen(false);
        setNewPO({ provider: '', warehouse: 'Bodega Central', expected_at: new Date().toISOString().split('T')[0], items: [{ id: '1', name: '', sku: '', qty: 1, cost: 0, received: 0 }] });
        showToast("Orden de Compra enviada con éxito 🚀", "success");
    };

    const handleDownloadPO = (order: PurchaseOrder) => {
        const doc = new jsPDF();
        doc.setFillColor(0, 26, 26); doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(0, 242, 255); doc.setFontSize(22); doc.text("ORDEN DE COMPRA", 105, 20, { align: 'center' });
        autoTable(doc, { startY: 60, head: [['Ítem', 'SKU', 'Cant.', 'Costo', 'Subtotal']], body: order.items.map(i => [i.name, i.sku, i.qty, formatCurrency(i.cost), formatCurrency(i.qty * i.cost)]), headStyles: { fillColor: [0, 77, 77] } });
        doc.save(`PO_${order.id}.pdf`);
    };

    const guideContent = {
        ciclo: { title: 'Ciclo Abasto', icon: <ShoppingCart size={20}/>, color: 'text-blue-500', how: 'Crea órdenes para reponer stock basado en alertas de Bayt. La orden nace como "Enviada" y bloquea el capital en proyecciones.', tip: 'No pidas más de lo que vendes en 30 días.' },
        recepcion: { title: 'Recepción', icon: <CheckCircle2 size={20}/>, color: 'text-emerald-500', how: 'Al llegar la mercancía física, usa "Recepcionar". Esto carga el stock automáticamente a tu bodega y cierra la orden financiera.', tip: 'Cuenta cada unidad antes de confirmar.' },
        aliados: { title: 'Aliados', icon: <Users size={20}/>, color: 'text-cyan-500', how: 'Mide el SLA (Tiempo de Entrega) de cada proveedor. Bayt califica a tus aliados según la precisión de lo enviado.', tip: 'Diversifica para evitar quiebres de stock.' },
        bayt: { title: 'IA Supply', icon: <Bot size={20}/>, color: 'text-[#004D4D]', how: 'Bayt analiza tendencias de venta y te sugiere qué productos pedir hoy para evitar agotados el próximo mes.', tip: 'Sigue las sugerencias marcadas con chispa ✨.' }
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans pb-20">
            <div className="px-8 py-10 max-w-[1600px] mx-auto flex justify-between items-end">
                <div><h1 className="text-5xl font-black italic uppercase tracking-tighter text-[#001A1A]">Órdenes de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">Compra</span></h1><p className="text-[#004d4d]/60 mt-2 font-medium">Gestión estratégica de abastecimiento.</p></div>
                <button onClick={() => setIsCreateModalOpen(true)} className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group">
                    <Rocket size={18} className="text-[#00f2ff] group-hover:rotate-12 transition-transform" />
                    Nueva Orden
                </button>
            </div>

            <main className="px-8 max-w-[1600px] mx-auto space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {kpiData.map((data) => ( <TiltCard key={data.id} data={data} onClick={() => setSelectedMetric(data)} /> ))}
                </div>

                <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-1.5 bg-white border border-slate-200 rounded-full shadow-xl flex items-center relative z-10 overflow-x-auto">
                            {[ { id: 'todos', label: 'Todos' }, { id: 'sent', label: 'Enviadas' }, { id: 'received', label: 'Cerradas' } ].map((tab) => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative px-8 py-3 rounded-full text-xs font-black uppercase transition-all z-10 whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-slate-500'}`}>
                                    {activeTab === tab.id && <motion.div layoutId="activePOtab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" />}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setIsGuideOpen(true)} className="h-12 w-12 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-[#004D4D] hover:bg-black hover:text-white transition-all active:scale-95 group"><Info size={20}/></button>
                    </div>

                    <div className="w-full flex justify-between items-center bg-white p-2 rounded-2xl border border-slate-100 shadow-sm relative z-30">
                        <div className="relative w-full max-w-md"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Buscar folio o proveedor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-transparent text-sm outline-none" /></div>
                        <div className="flex items-center gap-1">
                            <div className="relative">
                                <motion.button layout onMouseEnter={() => setIsFilterHovered(true)} onMouseLeave={() => setIsFilterHovered(false)} onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isFilterMenuOpen ? 'bg-[#004D4D] text-white' : 'bg-white border border-slate-100 text-slate-500'}`}><Filter size={18}/> {isFilterHovered && <motion.span className="text-[10px] font-black uppercase px-1">Filtros</motion.span>}</motion.button>
                                {isFilterMenuOpen && (<div className="absolute top-full mt-2 right-0 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[60]">{['todos', 'sent', 'received'].map(f => (<button key={f} onClick={() => { setActiveTab(f as any); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50 rounded-xl">{f === 'sent' ? 'Enviadas' : f === 'received' ? 'Recibidas' : 'Todas'}</button>))}</div>)}
                            </div>
                            <div className="relative">
                                <motion.button layout onMouseEnter={() => setIsDateHovered(true)} onMouseLeave={() => setIsDateHovered(false)} onClick={() => setIsDateMenuOpen(!isDateMenuOpen)} className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isDateMenuOpen ? 'bg-[#004D4D] text-white' : 'bg-white border border-slate-100 text-slate-500'}`}><CalendarIcon size={18}/> {isDateHovered && <motion.span className="text-[10px] font-black uppercase px-1">Fecha</motion.span>}</motion.button>
                                {isDateMenuOpen && (<div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-[60] space-y-4"><div className="grid grid-cols-2 gap-2"><input type="date" value={dateRange.from} onChange={e=>setDateRange({...dateRange, from: e.target.value})} className="w-full p-2 bg-slate-50 rounded-lg text-[10px] outline-none"/><input type="date" value={dateRange.to} onChange={e=>setDateRange({...dateRange, to: e.target.value})} className="w-full p-2 bg-slate-50 rounded-lg text-[10px] outline-none"/></div><button onClick={()=>setIsDateMenuOpen(false)} className="w-full py-2 bg-[#004D4D] text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Aplicar Rango</button></div>)}
                            </div>
                            <motion.button layout onMouseEnter={() => setIsExportHovered(true)} onMouseLeave={() => setIsExportHovered(false)} onClick={()=>{}} className="h-12 flex items-center gap-2 px-4 rounded-2xl bg-white border border-slate-100 text-slate-500 hover:text-emerald-600 transition-all"><Download size={18}/> {isExportHovered && <motion.span className="text-[10px] font-black uppercase px-1">PDF Global</motion.span>}</motion.button>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden relative z-10">
                    <table className="w-full text-left">
                        <thead><tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="p-8">Orden</th><th className="p-8">Proveedor</th><th className="p-8 text-center">Estado</th><th className="p-8 text-right">Total</th></tr></thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredOrders.map((o) => (
                                <tr key={o.id} onClick={() => setSelectedOrder(o)} className="group hover:bg-slate-50 transition-all cursor-pointer">
                                    <td className="p-8"><p className="text-sm font-black">{o.id}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{o.warehouse}</p></td>
                                    <td className="p-8"><p className="text-sm font-bold">{o.provider.name}</p><p className="text-[10px] text-slate-400">{o.created_at}</p></td>
                                    <td className="p-8 text-center"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${o.status === 'received' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{o.status === 'received' ? 'Cerrada' : 'Enviada'}</span></td>
                                    <td className="p-8 text-right font-black text-slate-900">{formatCurrency(o.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            <AnimatePresence>{selectedMetric && <MetricModal metric={selectedMetric} onClose={() => setSelectedMetric(null)} />}</AnimatePresence>

            {/* MODAL NUEVA ORDEN (DISEÑO PROFESIONAL DUAL) */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-[#FAFAFA] w-full max-w-7xl h-[90vh] rounded-[4rem] shadow-3xl overflow-hidden relative border border-white/20 z-10 flex flex-col md:flex-row">
                            
                            {/* EDITOR (IZQUIERDA) */}
                            <div className="flex-1 overflow-y-auto p-12 space-y-10 border-r border-gray-100 custom-scrollbar">
                                <h2 className="text-3xl font-black text-[#004d4d] uppercase italic tracking-tighter">Configurar Orden</h2>
                                
                                <section className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Proveedor Maestro</label>
                                        <input value={newPO.provider} onChange={e => setNewPO({...newPO, provider: e.target.value})} placeholder="Nombre de la entidad proveedora..." className="w-full p-5 bg-white border border-gray-100 rounded-2xl outline-none focus:border-[#004d4d] text-sm font-bold shadow-sm" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Bodega Destino</label><select value={newPO.warehouse} onChange={e=>setNewPO({...newPO, warehouse: e.target.value})} className="w-full p-5 bg-white border border-gray-100 rounded-2xl outline-none text-xs font-bold"><option>Bodega Central</option><option>Sucursal Norte</option></select></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Arribo Estimado</label><input type="date" value={newPO.expected_at} onChange={e=>setNewPO({...newPO, expected_at: e.target.value})} className="w-full p-5 bg-white border border-gray-100 rounded-2xl outline-none text-xs font-bold" /></div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <div className="flex justify-between items-center"><h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Detalle de Productos</h3><button onClick={() => setNewPO({...newPO, items: [...newPO.items, { id: Date.now().toString(), name: '', sku: '', qty: 1, cost: 0, received: 0 }]})} className="h-10 px-6 bg-gray-900 text-[#00f2ff] rounded-xl text-[10px] font-black uppercase shadow-lg">+ Añadir Ítem</button></div>
                                    <div className="space-y-3">
                                        {newPO.items.map((item, idx) => (
                                            <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm relative group animate-in slide-in-from-left-4 duration-300">
                                                <button onClick={() => setNewPO({...newPO, items: newPO.items.filter(i => i.id !== item.id)})} className="absolute -top-2 -right-2 h-8 w-8 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-rose-500 hover:text-white"><X size={14}/></button>
                                                <input value={item.name} onChange={e => { const items = [...newPO.items]; items[idx].name = e.target.value; setNewPO({...newPO, items}); }} placeholder="Nombre del producto..." className="w-full text-sm font-black outline-none mb-4" />
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-1"><p className="text-[8px] font-black text-gray-400 uppercase ml-1">Cantidad</p><input type="number" value={item.qty} onChange={e => { const items = [...newPO.items]; items[idx].qty = parseInt(e.target.value)||0; setNewPO({...newPO, items}); }} className="w-full p-3 bg-gray-50 rounded-xl text-xs font-black outline-none border border-transparent focus:border-[#004d4d]" /></div>
                                                    <div className="space-y-1"><p className="text-[8px] font-black text-gray-400 uppercase ml-1">Costo Unit.</p><input type="number" value={item.cost} onChange={e => { const items = [...newPO.items]; items[idx].cost = parseInt(e.target.value)||0; setNewPO({...newPO, items}); }} className="w-full p-3 bg-gray-50 rounded-xl text-xs font-black outline-none border border-transparent focus:border-emerald-500 text-emerald-600" /></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            {/* DOCUMENTO PROFESIONAL (DERECHA) */}
                            <div className="w-full md:w-[550px] bg-gray-900 p-12 flex flex-col justify-between relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-[#004d4d]"></div>
                                
                                <div className="bg-white rounded-3xl p-10 shadow-2xl h-fit space-y-10 relative overflow-hidden min-h-[700px] flex flex-col">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12"><ShoppingCart size={200}/></div>
                                    
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                {companyInfo?.identity?.logo ? <img src={companyInfo.identity.logo} className="h-12 w-12 object-cover rounded-xl" /> : <div className="h-12 w-12 bg-gray-900 text-[#00f2ff] flex items-center justify-center rounded-xl font-black text-xl italic shadow-xl">B</div>}
                                                <h3 className="text-xl font-black italic uppercase tracking-tighter text-gray-900">{companyInfo?.identity?.name || 'Tienda Bayup'}</h3>
                                            </div>
                                            <p className="text-[8px] font-bold text-gray-400 uppercase leading-relaxed tracking-widest">NIT: {companyInfo?.contact?.nit || '900.XXX.XXX-X'}<br/>{companyInfo?.contact?.city || 'Colombia'}</p>
                                        </div>
                                        <div className="text-right border-l-2 border-gray-900 pl-6">
                                            <p className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Orden de Compra</p>
                                            <p className="text-xl font-black text-[#004d4d] mt-1 italic">#PO-TEMP</p>
                                            <p className="text-[8px] font-bold text-gray-400 mt-2">{new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative z-10">
                                        <p className="text-[8px] font-black text-gray-400 uppercase mb-2">Entidad Proveedora</p>
                                        <h4 className="text-lg font-black uppercase text-gray-900">{newPO.provider || 'NOMBRE DEL PROVEEDOR'}</h4>
                                    </div>

                                    <div className="flex-1 relative z-10 overflow-y-auto pr-2 custom-scrollbar">
                                        <table className="w-full text-left">
                                            <thead className="border-b-2 border-gray-900"><tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest"><th className="pb-4">Descripción</th><th className="pb-4 text-center">Cant</th><th className="pb-4 text-right">Subtotal</th></tr></thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {newPO.items.map((i, idx) => (
                                                    <tr key={idx} className="text-[10px] font-bold text-gray-700 animate-in fade-in duration-500"><td className="py-4 uppercase">{i.name || 'Nuevo ítem...'}</td><td className="py-4 text-center">{i.qty}</td><td className="py-4 text-right">{formatCurrency(i.qty * i.cost)}</td></tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="pt-8 border-t-4 border-gray-900 relative z-10">
                                        <div className="flex justify-between items-end"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Autorizado</p><p className="text-4xl font-black text-gray-900 italic">{formatCurrency(newPO.items.reduce((acc, i) => acc + (i.qty * i.cost), 0))}</p></div>
                                        <div className="flex justify-between items-center mt-10 opacity-30 pt-6 border-t border-gray-100"><p className="text-[7px] font-black uppercase tracking-[0.3em]">Bayup Supply Core v2.0</p><QrCode size={40}/></div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <button onClick={handleSavePO} disabled={!newPO.provider || newPO.items.some(i => !i.name)} className={`w-full py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 transition-all ${(!newPO.provider || newPO.items.some(i => !i.name)) ? 'bg-gray-800 text-gray-600' : 'bg-[#00f2ff] text-gray-900 hover:scale-[1.02] active:scale-95'}`}><Send size={24}/> Emitir Orden de Compra</button>
                                    <button onClick={() => setIsCreateModalOpen(false)} className="w-full text-white/40 text-[10px] font-black uppercase tracking-[0.3em] hover:text-rose-500 transition-colors">Cancelar Operación</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL GUÍA ESTRATÉGICA */}
            <AnimatePresence>
                {isGuideOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuideOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }} className="relative bg-white w-full max-w-4xl h-[75vh] rounded-[3rem] shadow-2xl flex overflow-hidden border border-white">
                            <div className="w-64 bg-slate-50 border-r p-6 flex flex-col gap-2">
                                <div className="h-12 w-12 bg-gray-900 text-[#00f2ff] rounded-2xl flex items-center justify-center mb-6 shadow-lg"><Bot size={24}/></div>
                                {Object.entries(guideContent).map(([k, v]) => (
                                    <button key={k} onClick={() => setActiveGuideTab(k)} className={`flex items-center gap-3 p-4 rounded-2xl text-left transition-all ${activeGuideTab === k ? 'bg-[#004D4D] text-white shadow-xl' : 'text-slate-500 hover:bg-white'}`}>
                                        <div className={activeGuideTab === k ? 'text-white' : v.color}>{v.icon}</div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{v.title}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex-1 p-16 space-y-10 relative overflow-y-auto custom-scrollbar bg-white">
                                <button onClick={() => setIsGuideOpen(false)} className="absolute top-10 right-10 text-gray-300 hover:text-rose-500 transition-all group"><X size={24} className="group-hover:rotate-90"/></button>
                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900">{guideContent[activeGuideTab as keyof typeof guideContent]?.title}</h2>
                                <div className="space-y-6">
                                    <section><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Estrategia Supply</h4><p className="text-lg font-medium text-slate-600 italic leading-relaxed">"{guideContent[activeGuideTab as keyof typeof guideContent].how}"</p></section>
                                    <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 flex gap-6 items-start">
                                        <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0"><Zap size={24}/></div>
                                        <div><p className="text-[10px] font-black text-amber-600 uppercase mb-1">Bayup Smart Tip</p><p className="text-sm font-bold text-amber-900 leading-relaxed">{guideContent[activeGuideTab as keyof typeof guideContent].tip}</p></div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* DETALLE DE ORDEN EXISTENTE */}
            <AnimatePresence>
                {selectedOrder && (
                    <>
                        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[200]" onClick={() => setSelectedOrder(null)} />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-[210] border-l flex flex-col">
                            <div className="p-8 bg-[#004D4D] text-white flex justify-between items-start shrink-0">
                                <div><h2 className="text-3xl font-black italic uppercase tracking-tighter">{selectedOrder.id}</h2><p className="text-[10px] text-white/60 font-medium uppercase mt-1">Status: {selectedOrder.status.toUpperCase()}</p></div>
                                <button onClick={() => setSelectedOrder(null)} className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center"><X size={20}/></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-[#FAFAFA] custom-scrollbar text-left">
                                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"><div className="flex items-center gap-4"><div className="h-14 w-14 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-xl font-black">{selectedOrder.provider.name.charAt(0)}</div><div><h3 className="text-lg font-black text-slate-900">{selectedOrder.provider.name}</h3><p className="text-xs font-bold text-[#004D4D] uppercase italic">Aliado Estratégico</p></div></div></section>
                                <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead><tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase"><th className="p-6">Ítem</th><th className="p-6 text-center">Cant</th><th className="p-6 text-right">Costo</th></tr></thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {selectedOrder.items.map((i, idx) => (
                                                <tr key={idx}><td className="p-6"><p className="text-xs font-black">{i.name}</p><p className="text-[9px] text-slate-400 uppercase">{i.sku}</p></td><td className="p-6 text-center text-xs font-black">{i.qty}</td><td className="p-6 text-right text-xs font-black text-emerald-600">{formatCurrency(i.cost)}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </section>
                            </div>
                            <div className="p-8 border-t bg-white grid grid-cols-2 gap-4">
                                <button onClick={() => handleDownloadPO(selectedOrder)} className="py-4 bg-slate-50 rounded-2xl font-black text-[10px] uppercase tracking-widest">Descargar PDF</button>
                                <button onClick={() => {}} className="py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg tracking-widest">Confirmar Arribo</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
            `}</style>
        </div>
    );
}
