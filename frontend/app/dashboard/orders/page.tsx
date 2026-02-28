"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { 
  Plus, Search, Filter, Download, Package, AlertCircle, ShoppingBag, Trophy, Layers, 
  Edit3, Trash2, MoreVertical, ChevronDown, Info, ArrowUpRight, Eye, Zap, BarChart3, 
  X, ImageIcon, TrendingUp, Globe, Store, MessageSquare, Smartphone, CheckCheck, 
  ChevronRight, Loader2, FilterX, Target, Sparkles, Bot, MousePointer2, Rocket, 
  LayoutGrid, Activity, DollarSign, Clock, ShieldCheck, FileText, Printer, User, 
  CheckCircle2, Truck
} from 'lucide-react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { apiRequest } from '@/lib/api';
import MetricDetailModal from '@/components/dashboard/MetricDetailModal';
import { exportOrdersToExcel } from '@/lib/orders-export';

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

const PremiumCard = ({ children, className = "", dark = false }: { children: React.ReactNode, className?: string, dark?: boolean }) => {
    return (
        <motion.div
            animate={{ scale: 1 }}
            className={`rounded-[3rem] border transition-all duration-500 relative overflow-hidden isolate ${dark ? 'bg-[#001A1A] border-white/5 shadow-2xl' : 'bg-white/40 backdrop-blur-xl border-white/80 shadow-xl'} ${className}`}
        >
            <div className="h-full relative z-[2]">{children}</div>
        </motion.div>
    );
};

const AuroraMetricCard = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => {
    return (
        <div className="relative group cursor-pointer h-full perspective-1000" onClick={onClick}>
            <div className="absolute inset-0 -m-[2px] rounded-[3rem] overflow-hidden pointer-events-none z-0">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    style={{ willChange: 'transform' }}
                    className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent_0deg,#00F2FF_20deg,#10B981_40deg,#9333EA_60deg,transparent_80deg,transparent_360deg)] opacity-40 group-hover:opacity-100 transition-opacity duration-700 blur-[8px] transform-gpu"
                />
            </div>
            <div className="relative z-10 h-full transform-gpu">
                {children}
            </div>
        </div>
    );
};

export default function OrdersPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    
    const [orders, setOrders] = useState<any[]>([]);
    const [allRawOrders, setAllRawOrders] = useState<any[]>([]); 
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState('all');
    const [selectedMetric, setSelectedMetric] = useState<any>(null);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    
    // UI States
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [extraFilters, setExtraFilters] = useState({ source: 'Todos', status: 'Todos' });
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);

    const fetchOrders = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [ordersData, productsData] = await Promise.all([
                apiRequest<any[]>('/orders', { token }),
                apiRequest<any[]>('/products', { token })
            ]);
            if (ordersData) {
                setAllRawOrders(ordersData);
                setOrders(ordersData);
            }
            if (productsData) setProducts(productsData);
        } catch (e) {
            showToast("Error al sincronizar datos", "error");
        } finally {
            setLoading(false);
        }
    }, [token, showToast]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const kpis = useMemo(() => {
        const totalRevenue = orders.reduce((acc, o) => acc + (o.total_price || 0), 0);
        const avgTicket = orders.length > 0 ? (totalRevenue / orders.length) : 0;
        const lowStockCount = products.filter(p => (p.variants?.reduce((a:any,v:any)=>a+(v.stock||0),0) || 0) <= 5).length;
        const warningStockCount = products.filter(p => {
            const s = p.variants?.reduce((a:any,v:any)=>a+(v.stock||0),0) || 0;
            return s > 5 && s <= 15;
        }).length;
        const healthyStockCount = products.length - (lowStockCount + warningStockCount);

        const lastWeb = allRawOrders.filter(o => o.source?.toLowerCase() !== 'pos')[0];
        const lastPOS = allRawOrders.filter(o => o.source?.toLowerCase() === 'pos')[0];

        return [
            { 
                id: 'total', label: 'Total pedidos', value: orders.length, icon: <ShoppingBag size={24}/>, color: 'text-cyan-600', bg: 'bg-cyan-50', trend: 'Digital', isSimple: true,
                details: [
                    { l: "POR FACTURAR", v: `${orders.filter(o => o.status === 'pending').length}`, icon: <Clock size={10}/> },
                    { l: "EN PREPARACIÓN", v: `${orders.filter(o => o.status === 'processing').length}`, icon: <Zap size={10}/> },
                    { l: "FINALIZADOS", v: `${orders.filter(o => o.status === 'completed').length}`, icon: <CheckCircle2 size={10}/> }
                ],
                advice: "Tienes pedidos web pendientes. Recuerda que facturar rápido mejora tu posicionamiento."
            },
            { 
                id: 'active', label: 'Ítems activos', value: products.length, icon: <Layers size={24}/>, color: 'text-purple-600', bg: 'bg-purple-50', trend: 'Catálogo', isSimple: true,
                details: [
                    { l: "DISPONIBLES", v: `${healthyStockCount}`, icon: <Package size={10}/> },
                    { l: "AGOTADOS", v: `${lowStockCount}`, icon: <Zap size={10}/> },
                    { l: "TOTAL", v: `${products.length}`, icon: <Layers size={10}/> }
                ],
                advice: "Mantener un catálogo variado atrae más visitas web. Repón los agotados pronto."
            },
            { 
                id: 'stock', label: 'Stock crítico', value: lowStockCount, icon: <AlertCircle size={24}/>, color: 'text-rose-600', bg: 'bg-rose-50', trend: 'Atención', isSimple: true,
                details: [
                    { l: "CRÍTICO", v: `${lowStockCount}`, icon: <AlertCircle size={10}/> },
                    { l: "PREVENTIVO", v: `${warningStockCount}`, icon: <Zap size={10}/> },
                    { l: "SANO", v: `${healthyStockCount}`, icon: <CheckCircle2 size={10}/> }
                ],
                advice: lowStockCount > 0 ? "¡Alerta! Tienes productos en rojo. Repón stock ya." : "Inventario sano."
            },
            { 
                id: 'average', label: 'Ticket promedio', value: avgTicket, icon: <Target size={24}/>, color: 'text-[#004d4d]', bg: 'bg-[#004d4d]/5', trend: 'Market ok', isCurrency: true,
                details: [
                    { l: "TICKET WEB", v: `$ ${(lastWeb?.total_price || 0).toLocaleString()}`, icon: <Globe size={10}/> },
                    { l: "TICKET POS", v: `$ ${(lastPOS?.total_price || 0).toLocaleString()}`, icon: <Store size={10}/> },
                    { l: "CONVERSIÓN", v: "4.8%", icon: <TrendingUp size={10}/> }
                ],
                advice: "Tu ticket promedio web es bueno. Ofrece combos para subirlo un 15% más."
            }
        ];
    }, [orders, products, allRawOrders]);

    const filteredOrders = useMemo(() => {
        return allRawOrders.filter(o => {
            const matchesSearch = o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.toLowerCase().includes(searchTerm.toLowerCase());
            const invDate = new Date(o.created_at);
            const matchesStart = !dateRange.start || invDate >= new Date(dateRange.start);
            const matchesEnd = !dateRange.end || invDate <= new Date(dateRange.end);
            const matchesSource = extraFilters.source === 'Todos' || o.source === extraFilters.source;
            const matchesStatus = extraFilters.status === 'Todos' || o.status === extraFilters.status;
            return matchesSearch && matchesStart && matchesEnd && matchesSource && matchesStatus;
        });
    }, [allRawOrders, searchTerm, dateRange, extraFilters]);

    const handleExport = () => {
        showToast("Generando Excel...", "info");
        exportOrdersToExcel(filteredOrders, "Auditoria_Pedidos");
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 pb-20 animate-in fade-in duration-1000">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#00f2ff] animate-pulse" />
                        <span className="text-[10px] font-black tracking-[0.3em] text-[#004d4d]/60 italic uppercase">Monitor de órdenes</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-[1.4] text-[#001A1A] py-2 px-1 overflow-visible">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-[#004d4d] inline-block pb-4 pr-10">Pedidos Web</span>
                    </h1>
                    <p className="text-gray-400 font-medium text-lg italic max-w-2xl mt-4">¡Aquí encontrarás todos los pedidos que tienes en tu web! 📦</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                {kpis.map((kpi, i) => (
                    <div key={i}>
                        <AuroraMetricCard onClick={() => setSelectedMetric(kpi)}>
                            <PremiumCard className="p-8 group h-full border-none bg-white/80 backdrop-blur-2xl shadow-none">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg group-hover:scale-110 border border-white/50 ${kpi.bg} ${kpi.color}`}>
                                        {kpi.icon}
                                    </div>
                                    <div className="px-3 py-1 bg-gray-100 rounded-full text-[9px] font-black tracking-wider text-gray-400">{kpi.trend}</div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 tracking-[0.2em] mb-1.5">{kpi.label}</p>
                                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter italic">
                                        <AnimatedNumber value={kpi.value} type={kpi.isSimple ? 'simple' : 'currency'} />
                                    </h3>
                                </div>
                            </PremiumCard>
                        </AuroraMetricCard>
                    </div>
                ))}
            </div>

            <div className="px-4 space-y-10">
                <div className="flex flex-col md:flex-row items-center gap-4 w-full max-w-6xl mx-auto relative z-30">
                    <div className="flex-1 flex items-center gap-4 bg-white/60 backdrop-blur-md p-2 rounded-3xl border border-white/80 shadow-sm focus-within:shadow-xl focus-within:border-[#004D4D]/20 w-full transition-all">
                        <Search size={22} className="text-gray-300 ml-4" />
                        <input placeholder="Buscar por id o nombre..." className="flex-1 bg-transparent outline-none text-sm font-bold text-gray-900 py-4" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-3">
                        <motion.button layout onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)} onMouseEnter={() => setIsFilterHovered(true)} onMouseLeave={() => setIsFilterHovered(false)} className={`h-16 flex items-center gap-2 px-6 rounded-3xl border transition-all ${isFilterPanelOpen ? 'bg-[#004d4d] text-white border-[#004d4d]' : 'bg-white border-white/80 text-slate-500 shadow-sm'}`}>
                            {isFilterPanelOpen ? <FilterX size={20}/> : <Filter size={20}/>}
                            <AnimatePresence>{isFilterHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest overflow-hidden whitespace-nowrap">Filtros avanzados</motion.span>}</AnimatePresence>
                        </motion.button>
                        <motion.button layout onMouseEnter={() => setIsExportHovered(true)} onMouseLeave={() => setIsExportHovered(false)} onClick={handleExport} className="h-16 flex items-center gap-2 px-6 rounded-3xl bg-[#004D4D] text-white shadow-2xl hover:bg-black transition-all group">
                            <Download size={20}/>
                            <AnimatePresence>{isExportHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest overflow-hidden whitespace-nowrap">Exportar Auditoría</motion.span>}</AnimatePresence>
                        </motion.button>
                    </div>
                </div>

                <AnimatePresence>
                    {isFilterPanelOpen && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-6xl mx-auto p-8 bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/80 shadow-xl space-y-8 relative z-20">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Periodo Desde</label><input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="w-full p-4 bg-white/50 border border-gray-100 rounded-2xl outline-none font-bold text-sm" /></div>
                                <div className="space-y-3"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Periodo Hasta</label><input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="w-full p-4 bg-white/50 border border-gray-100 rounded-2xl outline-none font-bold text-sm" /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100/50">
                                <div className="space-y-3"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Canal</label>
                                    <div className="flex flex-wrap gap-2">{['Todos', 'web', 'WhatsApp', 'Instagram', 'pos'].map(opt => (<button key={opt} onClick={() => setExtraFilters({...extraFilters, source: opt})} className={`px-6 py-2 rounded-full text-[9px] font-black tracking-widest transition-all ${extraFilters.source === opt ? 'bg-[#004D4D] text-white shadow-lg' : 'bg-white border text-gray-400'}`}>{opt === 'pos' ? 'TIENDA FÍSICA' : opt.toUpperCase()}</button>))}</div>
                                </div>
                                <div className="space-y-3"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Estado</label>
                                    <div className="flex flex-wrap gap-2">{['Todos', 'pending', 'processing', 'completed', 'cancelled'].map(opt => (<button key={opt} onClick={() => setExtraFilters({...extraFilters, status: opt})} className={`px-6 py-2 rounded-full text-[9px] font-black tracking-widest transition-all ${extraFilters.status === opt ? 'bg-[#004D4D] text-white shadow-lg' : 'bg-white border text-gray-400'}`}>{opt === 'pending' ? 'PENDIENTE' : opt === 'processing' ? 'PROCESO' : opt === 'completed' ? 'ÉXITO' : opt === 'cancelled' ? 'CANCELADO' : 'TODOS'}</button>))}</div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4"><button onClick={() => { setDateRange({start:'', end:''}); setExtraFilters({source:'Todos', status:'Todos'}); }} className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline">Limpiar filtros</button></div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/80 shadow-xl overflow-hidden relative z-10">
                    <table className="w-full text-center">
                        <thead className="bg-gray-50/50">
                            <tr>{['Id pedido', 'Cliente', 'Estado', 'Total', 'Acciones'].map((h, i) => (<th key={i} className="px-10 py-6 text-[10px] font-black text-[#004D4D] tracking-[0.2em] uppercase">{h}</th>))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/50">
                            {loading ? (<tr><td colSpan={5} className="py-20 text-center"><div className="h-12 w-12 border-4 border-[#004d4d] border-t-cyan rounded-full animate-spin mx-auto" /></td></tr>) : filteredOrders.length === 0 ? (<tr><td colSpan={5} className="py-20 text-center text-gray-300 font-black text-[10px] uppercase">Sin movimientos registrados</td></tr>) : filteredOrders.map((o) => (
                                <tr key={o.id} className="hover:bg-white/60 transition-all cursor-pointer group">
                                    <td className="px-10 py-8 font-black text-gray-900">#{o.id.slice(0, 8).toUpperCase()}</td>
                                    <td className="px-10 py-8"><p className="text-sm font-black text-gray-900">{o.customer_name}</p><p className="text-[9px] font-bold text-gray-400 uppercase">{o.source || 'Tienda'}</p></td>
                                    <td className="px-10 py-8"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${o.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : o.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>{o.status === 'pending' ? 'Por Facturar' : o.status === 'processing' ? 'Proceso' : 'Exitoso'}</span></td>
                                    <td className="px-10 py-8 font-black text-[#004D4D] text-base"><AnimatedNumber value={o.total_price} /></td>
                                    <td className="px-10 py-8"><button onClick={() => setSelectedOrder(o)} className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 hover:text-[#004D4D] hover:bg-white transition-all shadow-sm flex items-center justify-center m-auto"><Eye size={16}/></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <MetricDetailModal isOpen={!!selectedMetric} onClose={() => setSelectedMetric(null)} metric={selectedMetric} />
        </div>
    );
}
