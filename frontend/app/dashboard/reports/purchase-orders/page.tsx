"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, ShoppingCart, ChevronDown, Search, X, CheckCircle2, Mail, MessageSquare, Bell, Calendar,
  Filter, ArrowUpRight, MoreVertical, ExternalLink, Users, Package, Clock, DollarSign, Rocket,
  Trash2, Send, History as LucideHistory, Truck, Store, ChevronRight, Download, ShieldCheck,
  AlertCircle, FileText, Zap, ArrowRight, Layers, LayoutGrid, Sparkles, Bot, CreditCard, Target,
  Info, RotateCcw, Star, BarChart3, PieChart, TrendingUp, Activity, QrCode, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    status: 'sent' | 'partially_received' | 'received' | 'canceled';
    items: POItem[];
    total: number;
    created_at: string;
    expected_at: string;
    history: { date: string; status: string; user: string; comment: string }[];
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

// --- COMPONENTE NÚMEROS ANIMADOS ---
function AnimatedNumber({ value }: { value: number }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = 0; const end = value; const duration = 1000; const increment = end / (duration / 16);
        const timer = setInterval(() => {
            start += increment; if (start >= end) { setDisplay(end); clearInterval(timer); } else { setDisplay(Math.floor(start)); }
        }, 16);
        return () => clearInterval(timer);
    }, [value]);
    return <span>{display.toLocaleString('es-CO')}</span>;
}

// --- COMPONENTE TILT CARD ---
const TiltCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    const [rotateX, setRotateX] = useState(0); const [rotateY, setRotateY] = useState(0);
    const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget; const box = card.getBoundingClientRect();
        const centerX = box.width / 2; const centerY = box.height / 2;
        setRotateX((e.clientY - box.top - centerY) / 7); setRotateY((centerX - (e.clientX - box.left)) / 7);
        setGlarePos({ x: ((e.clientX - box.left)/box.width)*100, y: ((e.clientY - box.top)/box.height)*100, opacity: 0.3 });
    };
    return (
        <motion.div onMouseMove={handleMouseMove} onMouseLeave={() => { setRotateX(0); setRotateY(0); setGlarePos(p => ({...p, opacity: 0})); }} animate={{ rotateX, rotateY, scale: rotateX !== 0 ? 1.05 : 1 }} transition={{ type: "spring", stiffness: 250, damping: 20 }} style={{ transformStyle: "preserve-3d", perspective: "1000px" }} className={`bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/80 shadow-2xl flex flex-col justify-between group relative overflow-hidden h-full ${className}`}>
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-300" style={{ opacity: glarePos.opacity, background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.9) 0%, transparent 50%)`, zIndex: 1 }} />
            <div style={{ transform: "translateZ(80px)", position: "relative", zIndex: 2 }}>{children}</div>
            <div className="absolute -bottom-20 -right-20 h-40 w-40 bg-[#00f2ff]/20 blur-[60px] rounded-full pointer-events-none" />
        </motion.div>
    );
};

export default function PurchaseOrdersPage() {
    const { showToast } = useToast();
    
    // --- ESTADOS ---
    const [activeTab, setActiveTab] = useState<'todos' | 'pendientes' | 'recibidos' | 'proveedores' | 'bayt'>('todos');
    const [orders, setOrders] = useState<PurchaseOrder[]>(MOCK_ORDERS);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [activeGuideStep, setActiveGuideStep] = useState(0);

    // --- ESTADOS CREADOR ---
    const [companyInfo, setCompanyInfo] = useState<any>(null);
    const [newPOHeader, setNewPOHeader] = useState({ provider_name: '', warehouse: 'Bodega Central', expected_at: new Date().toISOString().split('T')[0] });
    const [newPOItems, setNewPOItems] = useState<POItem[]>([{ id: '1', name: '', sku: '', qty: 1, cost: 0, received: 0 }]);

    useEffect(() => {
        const savedSettings = localStorage.getItem('bayup_general_settings');
        if (savedSettings) setCompanyInfo(JSON.parse(savedSettings));
    }, []);

    const newPOTotal = useMemo(() => newPOItems.reduce((acc, i) => acc + (i.qty * i.cost), 0), [newPOItems]);
    const formatCurrency = (amount: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');

    const handleDownloadPO = (order: PurchaseOrder) => {
        const doc = new jsPDF();
        
        // Estética Platinum
        doc.setFillColor(0, 26, 26);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(0, 242, 255);
        doc.setFontSize(22);
        doc.text("BAYUP SUPPLY CHAIN", 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`ORDEN DE COMPRA: ${order.id} | Emisión: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });

        doc.setTextColor(40, 40, 40);
        doc.setFontSize(12);
        doc.text("DATOS DEL PROVEEDOR:", 14, 55);
        doc.setFontSize(10);
        doc.text([
            `Nombre: ${order.provider.name}`,
            `Email: ${order.provider.email || 'N/A'}`,
            `Teléfono: ${order.provider.phone || 'N/A'}`,
            `Bodega de Recepción: ${order.warehouse}`
        ], 14, 62);

        autoTable(doc, {
            startY: 90,
            head: [['Producto', 'SKU', 'Cant.', 'Costo Unit.', 'Subtotal']],
            body: order.items.map(i => [i.name, i.sku, i.qty, formatCurrency(i.cost), formatCurrency(i.qty * i.cost)]),
            headStyles: { fillColor: [0, 77, 77], textColor: [255, 255, 255], fontStyle: 'bold' },
            foot: [['', '', '', 'TOTAL ORDEN:', formatCurrency(order.total)]],
            footStyles: { fillColor: [240, 253, 244], textColor: [16, 185, 129], fontStyle: 'bold' },
            theme: 'striped'
        });

        doc.save(`Orden_Compra_${order.id}.pdf`);
        showToast("PDF generado con éxito 📄", "success");
    };

    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
            {[
                { id: 'abiertas', label: 'Órdenes Abiertas', value: 12, icon: <ShoppingCart size={20}/>, color: 'text-[#004d4d]' },
                { id: 'inversion', label: 'Inversión Mensual', value: 45200000, isCurrency: true, icon: <DollarSign size={20}/>, color: 'text-emerald-600' },
                { id: 'proveedores', label: 'Proveedores Top', value: 8, icon: <Users size={20}/>, color: 'text-amber-500' },
                { id: 'cumplimiento', label: 'Cumplimiento', value: 94.2, isPercent: true, icon: <CheckCircle2 size={20}/>, color: 'text-[#00f2ff]' },
            ].map((kpi, i) => (
                <div key={i} onClick={() => setSelectedKPI(kpi.id)} className="cursor-pointer h-full">
                    <TiltCard className="p-8">
                        <div className="flex justify-between items-start"><div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color}`}>{kpi.icon}</div><span className="text-[10px] font-black px-2 py-1 bg-gray-50 text-gray-400 rounded-lg uppercase">Stats</span></div>
                        <div className="mt-6"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p><h3 className="text-3xl font-black text-gray-900 mt-1">{kpi.isCurrency && "$ "}<AnimatedNumber value={kpi.value} />{kpi.isPercent && "%"}</h3></div>
                    </TiltCard>
                </div>
            ))}
        </div>
    );

    const renderOrderList = () => (
        <div className="px-4 space-y-4">
            {orders.filter(o => activeTab === 'todos' || (activeTab === 'pendientes' && o.status !== 'received') || (activeTab === 'recibidos' && o.status === 'received')).map((o) => (
                <motion.div key={o.id} onClick={() => setSelectedOrder(o)} whileHover={{ x: 5 }} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10 cursor-pointer group">
                    <div className="flex items-center gap-6 flex-1"><div className="h-16 w-16 rounded-[1.8rem] bg-gray-900 text-white flex items-center justify-center text-xl font-black shadow-2xl"><ShoppingCart size={24} /></div><div><h4 className="text-xl font-black text-gray-900 tracking-tight">{o.id}</h4><p className="text-sm font-bold text-[#004d4d] italic">{o.provider.name}</p></div></div>
                    <div className="flex items-center gap-6"><div className="text-right"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total</p><p className="text-xl font-black text-gray-900">{formatCurrency(o.total)}</p></div><button onClick={(e) => { e.stopPropagation(); handleDownloadPO(o); }} className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-[#004d4d] flex items-center justify-center transition-all shadow-inner"><Download size={20}/></button><button className="h-12 w-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg"><ArrowUpRight size={20} /></button></div>
                </motion.div>
            ))}
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-1000">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
                <div><div className="flex items-center gap-3 mb-2"><span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse"></span><span className="text-[10px] font-black uppercase text-[#004d4d]/60 tracking-[0.2em]">Supply Chain Intelligence</span></div><h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">Órdenes de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">Compra</span></h1><p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">Gestión de abastecimiento certificada.</p></div>
                <button onClick={() => setIsCreateModalOpen(true)} className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group"><Rocket size={18} className="text-[#00f2ff] group-hover:rotate-12 transition-transform" /> Nueva Orden</button>
            </div>

            {renderKPIs()}

            <div className="flex items-center justify-center gap-6 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl flex items-center overflow-x-auto relative">
                    {[ { id: 'todos', label: 'Todos', icon: <LayoutGrid size={14}/> }, { id: 'pendientes', label: 'Pendientes', icon: <Clock size={14}/> }, { id: 'recibidos', label: 'Recibidos', icon: <CheckCircle2 size={14}/> }, { id: 'proveedores', label: 'Proveedores', icon: <Users size={14}/> }, { id: 'bayt', label: 'Bayt Insight', icon: <Sparkles size={14}/> } ].map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}>{activeTab === tab.id && <motion.div layoutId="activePOtab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" />}{tab.icon} {tab.label}</button>
                    ))}
                </div>
                <button onClick={() => setIsGuideOpen(true)} className="h-12 w-12 rounded-full bg-white border border-gray-100 shadow-xl flex items-center justify-center text-[#004D4D] hover:bg-black hover:text-white transition-all group shrink-0"><Info size={20} className="group-hover:scale-110 transition-transform" /></button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                    {(activeTab === 'todos' || activeTab === 'pendientes' || activeTab === 'recibidos') && renderOrderList()}
                    {activeTab === 'bayt' && (
                        <div className="px-4"><div className="bg-[#004d4d] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl"><div className="flex items-center gap-16 relative z-10"><div className="h-32 w-32 bg-gray-900 rounded-[3rem] flex items-center justify-center"><Bot size={64} className="text-[#00f2ff]" /></div><div className="flex-1 space-y-6"><h3 className="text-4xl font-black italic uppercase">Supply Insight</h3><p className="text-lg font-medium italic">"Bayt detectó un retraso potencial en textiles. Sugiero diversificar proveedores."</p></div></div></div></div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* MODAL DETALLE KPI DINÁMICO */}
            <AnimatePresence>
                {selectedKPI && (
                    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedKPI(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-3xl overflow-hidden border border-white">
                            <div className="p-10 bg-gradient-to-br from-gray-900 to-[#001a1a] text-white relative">
                                <button onClick={() => setSelectedKPI(null)} className="absolute top-6 right-6 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all group"><X size={20} className="group-hover:rotate-90 transition-transform"/></button>
                                <div className="space-y-4">
                                    <h3 className="text-3xl font-black italic uppercase tracking-tighter">
                                        {selectedKPI === 'abiertas' ? 'Órdenes Activas' : 
                                         selectedKPI === 'inversion' ? 'Análisis Inversión' : 
                                         selectedKPI === 'proveedores' ? 'Red de Aliados' : 'Tasa Cumplimiento'}
                                    </h3>
                                    <p className="text-[10px] font-black uppercase text-[#00f2ff] mt-2 tracking-[0.3em]">Supply Strategist Bayup</p>
                                </div>
                            </div>
                            <div className="p-10 space-y-8">
                                {selectedKPI === 'abiertas' && (<div className="p-6 bg-gray-50 rounded-2xl"><p className="text-xs font-medium italic">"12 órdenes en tránsito. El 40% llega esta semana según la promesa de entrega."</p></div>)}
                                {selectedKPI === 'inversion' && (<div className="p-6 bg-gray-50 rounded-2xl"><p className="text-xs font-medium italic">"Inversión mensual de $45.2M. Has optimizado el costo unitario un 5.2% vs Diciembre."</p></div>)}
                                {selectedKPI === 'proveedores' && (<div className="p-6 bg-gray-50 rounded-2xl"><p className="text-xs font-medium italic">"8 proveedores activos. Textiles del Norte lidera con un 98% de cumplimiento."</p></div>)}
                                {selectedKPI === 'cumplimiento' && (<div className="p-6 bg-gray-50 rounded-2xl"><p className="text-xs font-medium italic">"Índice de 94.2%. Solo se reportaron novedades en 3 de cada 50 items recibidos."</p></div>)}
                                <button onClick={() => setSelectedKPI(null)} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-black transition-all">Cerrar</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL NUEVA ORDEN MAESTRO */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-[1400px] h-[90vh] rounded-[4rem] shadow-3xl overflow-hidden relative z-10 border border-white flex flex-col lg:flex-row">
                            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-8 right-8 h-12 w-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-rose-500 shadow-xl group z-[100] transition-all"><X size={24} className="group-hover:rotate-90 transition-transform"/></button>
                            <div className="w-full lg:w-[500px] bg-gray-50 border-r border-gray-100 p-10 overflow-y-auto custom-scrollbar flex flex-col space-y-8">
                                <div className="flex items-center gap-4"><div className="h-12 w-12 bg-gray-900 rounded-2xl flex items-center justify-center text-[#00f2ff] shadow-lg"><Plus size={24}/></div><h3 className="text-xl font-black uppercase italic text-gray-900">Editor de Orden</h3></div>
                                <div className="space-y-6">
                                    <input value={newPOHeader.provider_name} onChange={e => setNewPOHeader({...newPOHeader, provider_name: e.target.value})} placeholder="Proveedor" className="w-full p-5 bg-white border border-gray-100 rounded-2xl outline-none text-sm font-bold shadow-sm" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <select value={newPOHeader.warehouse} onChange={e => setNewPOHeader({...newPOHeader, warehouse: e.target.value})} className="w-full p-4 bg-white border border-gray-100 rounded-2xl outline-none text-xs font-bold"><option>Bodega Central</option><option>Sucursal Norte</option></select>
                                        <input type="date" value={newPOHeader.expected_at} onChange={e => setNewPOHeader({...newPOHeader, expected_at: e.target.value})} className="w-full p-4 bg-white border border-gray-100 rounded-2xl outline-none text-xs font-bold" />
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-gray-200 space-y-4">
                                    <div className="flex justify-between items-center"><h4 className="text-[10px] font-black uppercase text-gray-400">Ítems</h4><button onClick={() => setNewPOItems([...newPOItems, { id: Date.now().toString(), name: '', sku: '', qty: 1, cost: 0, received: 0 }])} className="h-8 w-8 bg-gray-900 text-[#00f2ff] rounded-lg flex items-center justify-center"><Plus size={16}/></button></div>
                                    {newPOItems.map(item => (<div key={item.id} className="p-4 bg-white border border-gray-100 rounded-2xl space-y-3 relative group"><button onClick={() => setNewPOItems(newPOItems.filter(i => i.id !== item.id))} className="absolute -top-2 -right-2 h-6 w-6 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button><input value={item.name} onChange={e => setNewPOItems(newPOItems.map(i => i.id === item.id ? {...i, name: e.target.value} : i))} placeholder="Producto" className="w-full text-[10px] font-bold outline-none" /><div className="grid grid-cols-2 gap-4"><input type="number" value={item.qty} onChange={e => setNewPOItems(newPOItems.map(i => i.id === item.id ? {...i, qty: parseInt(e.target.value)||0} : i))} className="p-2 bg-gray-50 rounded-lg text-[10px] font-black" /><input type="number" value={item.cost} onChange={e => setNewPOItems(newPOItems.map(i => i.id === item.id ? {...i, cost: parseInt(e.target.value)||0} : i))} className="p-2 bg-gray-50 rounded-lg text-[10px] font-black text-emerald-600" /></div></div>))}
                                </div>
                                <div className="mt-auto pt-8 border-t border-gray-200"><button onClick={() => { setOrders([{id:`PO-2026-${Math.floor(Math.random()*900)+100}`, provider:{name:newPOHeader.provider_name, email:'', phone:''}, warehouse:newPOHeader.warehouse, status:'sent', items:newPOItems, total:newPOTotal, created_at:new Date().toISOString(), expected_at:newPOHeader.expected_at, history:[]}, ...orders]); setIsCreateModalOpen(false); showToast("Orden Enviada 🚀", "success"); }} className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase shadow-2xl flex items-center justify-center gap-3"><Send size={18} className="text-[#00f2ff]"/> Confirmar y Procesar</button></div>
                            </div>
                            <div className="flex-1 bg-[#FAFAFA] p-16 overflow-y-auto relative flex justify-center">
                                <div className="w-[800px] bg-white shadow-2xl p-16 border border-gray-200 min-h-[1000px] relative text-slate-900 h-fit">
                                    <div className="flex justify-between items-start mb-12">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">{companyInfo?.identity?.logo ? <img src={companyInfo.identity.logo} className="h-14 w-14 object-cover" /> : <div className="h-12 w-12 bg-gray-900 text-[#00f2ff] flex items-center justify-center rounded-xl font-black text-xl italic">B</div>}<h2 className="text-2xl font-black italic uppercase">{companyInfo?.identity?.name || 'Tienda Bayup'}</h2></div>
                                            <div className="text-[9px] leading-relaxed text-gray-500 font-bold uppercase">NIT: {companyInfo?.contact?.nit || '900.xxx.xxx-x'}</div>
                                        </div>
                                        <div className="w-64 border-2 border-gray-900 rounded-xl overflow-hidden"><div className="bg-gray-900 text-white text-[10px] font-black text-center py-2 uppercase tracking-widest">Orden de Compra</div><div className="p-4 text-[10px] font-bold"><div className="flex justify-between"><span>ID Orden:</span><span className="font-black">PO-2026-TEMP</span></div><div className="flex justify-between"><span>Fecha:</span><span>{new Date().toLocaleDateString()}</span></div></div></div>
                                    </div>
                                    <div className="p-8 border border-gray-100 rounded-3xl bg-gray-50/50 mb-12"><p className="text-[8px] font-black text-white bg-[#004d4d] px-2 py-0.5 inline-block rounded uppercase tracking-widest mb-3">Proveedor:</p><h4 className="text-lg font-black uppercase italic">{newPOHeader.provider_name || 'Nombre Entidad'}</h4></div>
                                    <table className="w-full border-collapse mb-12"><thead><tr className="bg-gray-100 text-[9px] font-black uppercase text-gray-600 border-y border-gray-200"><th className="py-3 px-4 text-left">Producto</th><th className="py-3 px-4 text-center">Cant.</th><th className="py-3 px-4 text-right">Subtotal</th></tr></thead><tbody>{newPOItems.map((item, idx) => (<tr key={idx} className="border-b border-gray-50 text-[10px] font-bold text-gray-700"><td className="py-4 px-4 uppercase">{item.name || 'Nuevo ítem...'}</td><td className="py-4 px-4 text-center">{item.qty}</td><td className="py-4 px-4 text-right">{formatCurrency(item.qty * item.cost)}</td></tr>))}</tbody></table>
                                    <div className="flex justify-end pt-6 border-t-4 border-gray-900 text-right"><p className="text-3xl font-black">{formatCurrency(newPOTotal)}</p></div>
                                    <div className="absolute bottom-16 left-16 right-16 flex justify-between items-end opacity-30 pt-12 border-t border-gray-100"><p className="text-[8px] font-bold uppercase">Software Bayup Supply Core v2.0</p><QrCode size={60}/></div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL DETALLE ORDEN */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                        <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="bg-white w-full max-w-6xl h-[90vh] rounded-[4rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-white/20">
                            <button onClick={() => setSelectedOrder(null)} className="absolute top-8 right-8 h-12 w-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-rose-500 shadow-sm transition-all z-50 group"><X size={24} className="group-hover:rotate-90 transition-transform" /></button>
                            <div className="w-full md:w-[400px] bg-gray-50 border-r border-gray-100 p-12 overflow-y-auto custom-scrollbar space-y-12">
                                <div className="flex items-center gap-6 pt-10"><div className="h-20 w-20 rounded-[1.5rem] bg-gray-900 text-white flex items-center justify-center text-3xl font-black shadow-2xl">{selectedOrder.provider.name.charAt(0)}</div><div><h3 className="text-xl font-black text-gray-900 tracking-tight">{selectedOrder.provider.name}</h3><p className="text-sm font-bold text-[#004d4d] mt-1 italic">Aliado Maestro</p></div></div>
                                <button onClick={() => handleDownloadPO(selectedOrder)} className="w-full py-5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#004d4d] transition-all shadow-2xl flex items-center justify-center gap-3"><Download size={16} className="text-[#00f2ff]"/> Descargar PDF</button>
                            </div>
                            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                                <div className="p-12 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10"><div><h2 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">{selectedOrder.id}</h2><p className="text-gray-400 text-xs font-black uppercase mt-2 flex items-center gap-2"><CheckCircle2 size={14} className="text-[#00f2ff]"/> Detalle de Mercancía</p></div></div>
                                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-gray-50/20">
                                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden mb-12"><table className="w-full text-left"><thead className="bg-gray-50/50"><tr><th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase">Item</th><th className="px-8 py-5 text-[9px] font-black text-gray-400 text-center">Cant.</th><th className="px-8 py-5 text-[9px] font-black text-gray-400 text-right">Costo</th></tr></thead><tbody className="divide-y divide-gray-50">{selectedOrder.items.map((i,idx)=>(<tr key={idx}><td className="px-8 py-6 font-black text-gray-900 text-sm">{i.name}<br/><span className="text-[10px] text-gray-400 uppercase">{i.sku}</span></td><td className="px-8 py-6 text-center font-black">{i.qty}</td><td className="px-8 py-6 text-right font-black text-[#004d4d]">{formatCurrency(i.cost)}</td></tr>))}</tbody></table></div>
                                    <div className="space-y-8"><h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Trazabilidad</h4><div className="relative pl-12 space-y-10 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">{selectedOrder.history.map((h,i)=>(<div key={i} className="relative"><div className="absolute left-[-52px] top-0 h-10 w-10 rounded-full border-4 border-white bg-[#004d4d] flex items-center justify-center text-white shadow-lg z-10"><Zap size={14}/></div><div className="bg-white p-6 rounded-[2.2rem] border border-gray-100 shadow-sm"><div className="flex justify-between items-center"><h5 className="text-xs font-black text-[#004d4d] uppercase">{h.status}</h5><span className="text-[10px] text-gray-300 font-bold">{h.date}</span></div><p className="text-sm font-medium text-gray-600 mt-2 italic">"{h.comment}"</p></div></div>))}</div></div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL GUÍA ELITE PLATINUM */}
            <AnimatePresence>
                {isGuideOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuideOpen(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.95, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-6xl h-[80vh] rounded-[4rem] shadow-3xl overflow-hidden relative z-10 border border-white flex flex-col md:flex-row">
                            <div className="w-full md:w-[320px] bg-gray-50 border-r border-gray-100 p-10 flex flex-col gap-3"><div className="h-12 w-12 bg-gray-900 text-[#00f2ff] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/20"><Bot size={24}/></div><h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004d4d] mb-4">Guía Maestro Supply</h3>{[ { id: 0, label: 'Abastecimiento Pro', icon: <ShoppingCart size={16}/> }, { id: 1, label: 'Red de Aliados', icon: <Users size={16}/> }, { id: 2, label: 'Logística Arribo', icon: <Truck size={16}/> }, { id: 3, label: 'Inteligencia IA', icon: <Sparkles size={16}/> } ].map(step => (<button key={step.id} onClick={() => setActiveGuideStep(step.id)} className={`flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${activeGuideStep === step.id ? 'bg-[#004d4d] text-white shadow-xl shadow-[#004d4d]/20' : 'text-gray-500 hover:bg-white'}`}><div className={activeGuideStep === step.id ? 'text-[#00f2ff]' : 'text-gray-300'}>{step.icon}</div><span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span></button>))}<div className="mt-auto pt-8 border-t border-gray-100 px-2"><p className="text-[8px] font-black uppercase text-gray-300 tracking-[0.2em]">Bayup Sales Core v2.0</p></div></div>
                            <div className="flex-1 p-16 flex flex-col justify-between relative bg-white overflow-y-auto custom-scrollbar">
                                <button onClick={() => setIsGuideOpen(false)} className="absolute top-10 right-10 text-gray-300 hover:text-rose-500 transition-colors z-[100] transition-all group"><X size={24} className="group-hover:rotate-90"/></button>
                                <div className="space-y-12">
                                    {activeGuideStep === 0 && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8"><h2 className="text-4xl font-black italic uppercase text-[#001A1A]">Ingeniería de <span className="text-[#004D4D]">Abastecimiento</span></h2><div className="grid grid-cols-2 gap-6"><div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100"><p className="text-[10px] font-black text-gray-400 uppercase">Stock Seguridad</p><p className="text-lg font-black mt-2 italic">Margen de 15 días sugerido por Bayt.</p></div><div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100"><p className="text-[10px] font-black text-gray-400 uppercase">Rotación</p><p className="text-lg font-black mt-2 italic">Giro de capital cada 4.2 semanas.</p></div></div></div>)}
                                    {activeGuideStep === 1 && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8"><h2 className="text-4xl font-black italic uppercase text-[#001A1A]">Red de <span className="text-[#004D4D]">Aliados</span></h2><div className="p-10 bg-gray-900 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl"><div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheck size={120}/></div><div className="space-y-6 relative z-10"><div className="flex items-center gap-6"><div className="h-14 w-14 rounded-2xl bg-[#004d4d] text-[#00f2ff] flex items-center justify-center shadow-lg"><Star size={28}/></div><p className="text-sm font-black text-[#00f2ff] uppercase tracking-widest">Score de Confianza</p></div><p className="text-xs text-gray-400 italic">"Bayt sugiere: No concentres más del 40% en un solo proveedor."</p></div></div></div>)}
                                    {activeGuideStep === 2 && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8"><h2 className="text-4xl font-black italic uppercase text-[#001A1A]">Logística de <span className="text-[#004D4D]">Arribo</span></h2><div className="p-10 bg-gray-50 rounded-[3rem] border border-gray-100 relative overflow-hidden"><div className="flex items-center gap-6 mb-8"><div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-[#004d4d] shadow-lg"><Truck size={28}/></div><div><p className="text-xl font-black text-gray-900">Protocolo de Carga</p><p className="text-[10px] font-black text-gray-400 uppercase">Validación de SKUs</p></div></div><div className="space-y-4"><div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl"><div className="h-2 w-2 rounded-full bg-[#00f2ff] shadow-[0_0_8px_#00f2ff]"></div><p className="text-[10px] font-bold text-gray-600 uppercase">Validación automática vs. Orden original.</p></div></div></div></div>)}
                                    {activeGuideStep === 3 && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8"><h2 className="text-4xl font-black italic uppercase text-[#001A1A]">Inteligencia <span className="text-[#004D4D]">Bayt AI</span></h2><div className="p-10 bg-[#001A1A] rounded-[3.5rem] relative overflow-hidden text-white shadow-2xl text-center"><div className="h-20 w-20 bg-[#00f2ff]/10 text-[#00f2ff] rounded-[2rem] border border-[#00f2ff]/30 flex items-center justify-center animate-pulse mx-auto mb-6"><Bot size={48}/></div><p className="text-lg font-medium leading-relaxed italic text-gray-300">"Bayt analiza tu velocidad de venta para sugerirte exactamente qué pedir y cuándo."</p></div></div>)}
                                </div>
                                <button onClick={() => setIsGuideOpen(false)} className="px-12 py-5 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-95 mt-12">Entendido, Continuar Operación</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
            `}</style>
        </div>
    );
}
