"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Plus, 
  ShoppingCart, 
  ChevronDown, 
  Search, 
  X, 
  CheckCircle2, 
  Mail, 
  MessageSquare, 
  Bell, 
  Calendar,
  Filter,
  ArrowUpRight,
  MoreVertical,
  ExternalLink,
  Users,
  Package,
  Clock,
  DollarSign,
  Rocket,
  Trash2,
  Send,
  History,
  Truck,
  Store,
  ChevronRight,
  Download,
  ShieldCheck,
  AlertCircle,
  FileText,
  Zap,
  ArrowRight,
  Layers,
  LayoutGrid,
  Sparkles,
  Bot,
  CreditCard,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '@/lib/jspdf-types';

// --- INTERFACES ---
interface POItem {
    id: string;
    name: string;
    sku: string;
    qty: number;
    cost: number;
    received: number;
}

interface PurchaseOrder {
    id: string;
    provider: { name: string; email: string; phone: string };
    warehouse: string;
    status: 'draft' | 'sent' | 'partially_received' | 'received' | 'canceled';
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
        warehouse: "Bodega Central",
        status: 'sent',
        items: [
            { id: "p1", name: "Camisa Lino Blanca", sku: "SH-LIN-WH", qty: 100, cost: 45000, received: 0 },
            { id: "p2", name: "Vestido Floral", sku: "DR-FLO-01", qty: 50, cost: 85000, received: 0 }
        ],
        total: 8750000,
        created_at: "2026-01-28T10:00:00",
        expected_at: "2026-02-05",
        history: [{ date: "28 Ene, 10:00 AM", status: "Orden Creada", user: "Sebastián", comment: "Reposición de stock mensual" }]
    },
    {
        id: "PO-2026-002",
        provider: { name: "Accesorios Global", email: "info@global.com", phone: "+57 311 444 5566" },
        warehouse: "Sucursal Norte",
        status: 'partially_received',
        items: [
            { id: "p3", name: "Reloj Chrono Black", sku: "WA-CH-BL", qty: 20, cost: 120000, received: 15 }
        ],
        total: 2400000,
        created_at: "2026-01-25T09:00:00",
        expected_at: "2026-01-30",
        history: [
            { date: "25 Ene, 09:00 AM", status: "Orden Enviada", user: "Sistema", comment: "Enviada vía WhatsApp" },
            { date: "30 Ene, 02:00 PM", status: "Recepción Parcial", user: "Camilo (Logística)", comment: "Faltan 5 unidades por defecto de fábrica" }
        ]
    }
];

export default function PurchaseOrdersPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    
    const [activeTab, setActiveTab] = useState<'todos' | 'pendientes' | 'recibidos' | 'proveedores'>('todos');
    const [orders, setOrders] = useState<PurchaseOrder[]>(MOCK_ORDERS);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const matchesSearch = o.provider.name.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.toLowerCase().includes(searchTerm.toLowerCase());
            if (activeTab === 'pendientes') return matchesSearch && (o.status === 'sent' || o.status === 'partially_received');
            if (activeTab === 'recibidos') return matchesSearch && o.status === 'received';
            return matchesSearch;
        });
    }, [orders, searchTerm, activeTab]);

    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
            {[
                { label: 'Órdenes Abiertas', value: '12', sub: 'Por recibir', icon: <ShoppingCart size={20}/>, trend: '+2', color: 'text-[#004d4d]' },
                { label: 'Inversión Mensual', value: '$ 45.2M', sub: 'Enero 2026', icon: <DollarSign size={20}/>, trend: '+15%', color: 'text-emerald-600' },
                { label: 'Proveedores Top', value: '08', sub: 'Aliados activos', icon: <Users size={20}/>, trend: 'OK', color: 'text-amber-500' },
                { label: 'Cumplimiento', value: '94.2%', sub: 'Items recibidos', icon: <CheckCircle2 size={20}/>, trend: '+2.1%', color: 'text-[#00f2ff]' },
            ].map((kpi, i) => (
                <motion.div key={i} whileHover={{ y: -5, scale: 1.02 }} className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/80 shadow-sm flex flex-col justify-between group transition-all">
                    <div className="flex justify-between items-start">
                        <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                            {kpi.icon}
                        </div>
                        <span className="text-[10px] font-black px-2 py-1 bg-gray-50 text-gray-400 rounded-lg">{kpi.trend}</span>
                    </div>
                    <div className="mt-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">{kpi.value}</h3>
                        <p className="text-[9px] font-bold text-gray-400 mt-1 italic">{kpi.sub}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    const renderActionBar = () => (
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white/60 backdrop-blur-md p-3 rounded-3xl border border-white/60 shadow-sm mx-4 shrink-0 relative z-30">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar por ID de orden o proveedor..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-transparent text-sm font-bold text-slate-700 outline-none" 
                />
            </div>
            <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex items-center gap-3">
                <button className="h-12 flex items-center gap-2 px-5 rounded-2xl bg-white text-slate-500 border border-gray-100 hover:bg-gray-50 transition-all">
                    <Filter size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Bodega</span>
                </button>
                <button className="h-12 flex items-center gap-2 px-5 bg-gray-900 text-white rounded-2xl shadow-lg hover:bg-black transition-all">
                    <Download size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Reporte</span>
                </button>
            </div>
        </div>
    );

    const renderOrderList = () => (
        <div className="px-4 space-y-4">
            {filteredOrders.map((o) => (
                <motion.div 
                    key={o.id} 
                    onClick={() => setSelectedOrder(o)}
                    whileHover={{ x: 5 }} 
                    className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10 cursor-pointer"
                >
                    <div className="flex items-center gap-6 flex-1">
                        <div className="h-16 w-16 rounded-[1.8rem] bg-gray-900 text-white flex items-center justify-center text-xl font-black shadow-2xl relative">
                            <ShoppingCart size={24} />
                            {o.status === 'partially_received' && <div className="absolute -top-2 -right-2 h-6 w-6 bg-amber-500 rounded-full border-4 border-white animate-pulse"></div>}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h4 className="text-xl font-black text-gray-900 tracking-tight">{o.id}</h4>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                                    o.status === 'sent' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    o.status === 'partially_received' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                                }`}>
                                    {o.status.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-[#004d4d] mt-1 italic">{o.provider.name}</p>
                        </div>
                    </div>
                    
                    <div className="flex-[1.5] grid grid-cols-3 gap-8 px-10 border-x border-gray-50">
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Destino</p>
                            <p className="text-xs font-black text-gray-900 mt-1 text-center">{o.warehouse}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Fecha Esperada</p>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <Clock size={12} className="text-[#00f2ff]"/>
                                <p className="text-xs font-black text-gray-900">{o.expected_at}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Inversión Total</p>
                            <p className="text-sm font-black text-[#004d4d] mt-1 text-center">{formatCurrency(o.total)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Cumplimiento</p>
                            <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden border border-gray-50 p-0.5">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '70%' }}></div>
                            </div>
                        </div>
                        <button className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-[#004d4d] flex items-center justify-center transition-all shadow-inner"><Download size={20}/></button>
                        <button className="h-12 w-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><ArrowUpRight size={20} /></button>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    const renderBaytInsight = () => (
        <div className="px-4">
            <div className="bg-[#004d4d] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Package size={300} /></div>
                <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
                    <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center animate-pulse"><Bot size={64} className="text-[#00f2ff]" /></div>
                    <div className="flex-1 space-y-6">
                        <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#00f2ff]/20">Bayt Supply-Insight</span>
                        <h3 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2ff]">Inteligencia de Abastecimiento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                <div className="flex items-center gap-3"><Sparkles className="text-[#00f2ff]" size={20}/><p className="text-[10px] font-black uppercase tracking-widest text-[#00f2ff]">Sugerencia de Compra</p></div>
                                <p className="text-sm font-medium italic leading-relaxed">"El producto **Camisa Lino Blanca** tiene un stock de solo 5 unidades. Basado en la tendencia de ventas, se agotará en 48 horas. Recomiendo abrir orden de 100 unidades hoy."</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                <div className="flex items-center gap-3"><Truck className="text-amber-400" size={20}/><p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Alerta de Proveedor</p></div>
                                <p className="text-sm font-medium italic leading-relaxed">"**Accesorios Global** ha entregado tarde las últimas 3 órdenes. Considera diversificar con el proveedor alterno Sugerido: **Importaciones Elite**."</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-1000">
            
            {/* --- HEADER MAESTRO --- */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Gestión de Abastecimiento</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Órdenes de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">Compra</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">
                        Control total de compras, reposición de stock y <span className="font-bold text-[#001A1A]">proveedores</span>.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsCreateModalOpen(true)} className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group">
                        <Rocket size={18} className="text-[#00f2ff] group-hover:rotate-12 transition-transform" />
                        Nueva Orden
                    </button>
                </div>
            </div>

            {/* --- KPIs ESTRATÉGICOS --- */}
            {renderKPIs()}

            {/* --- MENÚ FLOTANTE CENTRAL --- */}
            <div className="flex items-center justify-center gap-6 shrink-0 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 backdrop-blur-xl flex items-center relative">
                    {[
                        { id: 'todos', label: 'Todos', icon: <LayoutGrid size={14}/> },
                        { id: 'pendientes', label: 'Pendientes', icon: <Clock size={14}/> },
                        { id: 'recibidos', label: 'Recibidos', icon: <CheckCircle2 size={14}/> },
                        { id: 'proveedores', label: 'Proveedores', icon: <Users size={14}/> },
                        { id: 'bayt', label: 'Bayt Insight', icon: <Sparkles size={14}/> }
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`relative px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {isActive && (
                                    <motion.div layoutId="activePOtab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                )}
                                {tab.icon}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* --- CONTENIDO DINÁMICO --- */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="space-y-10">
                    {activeTab === 'todos' || activeTab === 'pendientes' || activeTab === 'recibidos' ? (
                        <div className="space-y-8">
                            {renderActionBar()}
                            {renderOrderList()}
                        </div>
                    ) : activeTab === 'bayt' ? (
                        renderBaytInsight()
                    ) : (
                        <div className="px-4 py-20 text-center text-gray-300 font-bold uppercase tracking-widest border-4 border-dashed border-gray-100 rounded-[4rem]">Directorio de Proveedores en desarrollo</div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* --- MODAL 360° DETALLE DE ORDEN --- */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                        <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="bg-white w-full max-w-6xl h-[90vh] rounded-[4rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-white/20">
                            
                            {/* SIDEBAR LOGÍSTICO */}
                            <div className="w-full md:w-[400px] bg-gray-50 border-r border-gray-100 p-12 overflow-y-auto custom-scrollbar space-y-12">
                                <button onClick={() => setSelectedOrder(null)} className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 shadow-sm transition-all"><X size={24}/></button>
                                
                                <section className="space-y-6">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-200 pb-3">Información del Proveedor</h4>
                                    <div className="flex items-center gap-6">
                                        <div className="h-20 w-20 rounded-[1.5rem] bg-gray-900 text-white flex items-center justify-center text-3xl font-black shadow-2xl">{selectedOrder.provider.name.charAt(0)}</div>
                                        <div><h3 className="text-xl font-black text-gray-900 tracking-tight">{selectedOrder.provider.name}</h3><p className="text-sm font-bold text-[#004d4d] mt-1 italic">Aliado Estratégico</p></div>
                                    </div>
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center gap-4 text-sm font-bold text-gray-600"><MessageSquare size={18} className="text-[#00f2ff]"/> {selectedOrder.provider.phone}</div>
                                        <div className="flex items-center gap-4 text-sm font-bold text-gray-600"><Mail size={18} className="text-[#00f2ff]"/> {selectedOrder.provider.email}</div>
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-200 pb-3">Logística de Arribo</h4>
                                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between"><span className="text-[9px] font-black text-gray-400 uppercase">Destino:</span><span className="text-xs font-black text-gray-900">{selectedOrder.warehouse}</span></div>
                                        <div className="flex items-center justify-between"><span className="text-[9px] font-black text-gray-400 uppercase">Expectativa:</span><span className="text-xs font-black text-amber-600">{selectedOrder.expected_at}</span></div>
                                    </div>
                                </section>

                                <button className="w-full py-5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#004d4d] transition-all shadow-2xl flex items-center justify-center gap-3">
                                    <Send size={16} className="text-[#00f2ff]" /> Re-enviar Orden
                                </button>
                            </div>

                            {/* MAIN CONTENT: ITEMS & HISTORY */}
                            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                                <div className="p-12 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
                                    <div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Detalle de la Orden</h2>
                                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest mt-2 flex items-center gap-2"><CheckCircle2 size={14} className="text-[#00f2ff]"/> {selectedOrder.items.length} productos solicitados</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button className="px-6 py-3 bg-[#004d4d] rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-xl flex items-center gap-2"><Package size={14}/> Recibir Mercancía</button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-gray-50/20">
                                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50/50">
                                                <tr>
                                                    <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Producto</th>
                                                    <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Cant.</th>
                                                    <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Recibido</th>
                                                    <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Costo</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {selectedOrder.items.map((item, i) => (
                                                    <tr key={i} className="hover:bg-gray-50/30 transition-colors">
                                                        <td className="px-8 py-6">
                                                            <p className="text-sm font-black text-gray-900">{item.name}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.sku}</p>
                                                        </td>
                                                        <td className="px-8 py-6 text-center font-black text-gray-900">{item.qty}</td>
                                                        <td className="px-8 py-6 text-center">
                                                            <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black ${item.received === item.qty ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                {item.received} unidades
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6 text-right font-black text-[#004d4d]">{formatCurrency(item.cost)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Timeline de Orden */}
                                    <div className="space-y-8">
                                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Trazabilidad de la Orden</h4>
                                        <div className="relative pl-12 space-y-10 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                            {selectedOrder.history.map((event, i) => (
                                                <div key={i} className="relative">
                                                    <div className="absolute left-[-52px] top-0 h-10 w-10 rounded-full border-4 border-white bg-[#004d4d] flex items-center justify-center text-white shadow-lg z-10">
                                                        <Zap size={14} fill="currentColor" />
                                                    </div>
                                                    <div className="bg-white p-6 rounded-[2.2rem] border border-gray-100 shadow-sm">
                                                        <div className="flex justify-between items-center">
                                                            <h5 className="text-xs font-black text-[#004d4d] uppercase tracking-widest">{event.status}</h5>
                                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">{event.date}</span>
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-600 mt-3 leading-relaxed italic">"{event.comment}"</p>
                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-4">Gestor: {event.user}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
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