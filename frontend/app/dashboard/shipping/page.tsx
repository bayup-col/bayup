"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { useToast } from "@/context/toast-context";
import { 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronDown, 
  X, 
  CheckCircle2, 
  Truck, 
  Package, 
  AlertCircle, 
  ArrowUpDown, 
  Download, 
  RefreshCcw, 
  Globe, 
  Smartphone, 
  CreditCard, 
  Calendar as CalendarIcon, 
  MapPin, 
  Map, 
  Info, 
  Printer, 
  ExternalLink, 
  User, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  RotateCcw,  
  Box,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

// --- INTERFACES ---
type ShippingStatus = 'label_generated' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'incident' | 'returned';

interface Shipment {
  id: string;
  order_id: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    city: string;
    email: string;
  };
  carrier: string;
  tracking_number: string;
  status: ShippingStatus;
  last_update: string;
  estimated_delivery: string;
  history: { date: string; message: string; location: string }[];
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
const MOCK_SHIPMENTS: Shipment[] = [];

// --- COMPONENTES DE APOYO ---
function AnimatedNumber({ value, className, type = 'simple' }: { value: number, className?: string, type?: 'currency' | 'percentage' | 'simple' }) {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current: number) => {
        if (type === 'percentage') return `${Math.round(current)}%`;
        if (type === 'simple') return Math.round(current).toLocaleString();
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(current);
    });
    useEffect(() => { spring.set(value); }, [value, spring]);
    return <motion.span className={className}>{display}</motion.span>;
}

const TiltCard = ({ data, onClick }: { data: MetricData, onClick: () => void }) => {
    const ref = useRef<HTMLDivElement>(null);
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
            <div className="relative h-full bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm transition-all duration-300 group-hover:shadow-2xl overflow-hidden">
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
                            <AnimatedNumber value={data.value} type="simple" />
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
                        <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">{metric.value}</h3>
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
export default function ShippingPage() {
  const { showToast } = useToast();
  const [shipments, setShipments] = useState<Shipment[]>(MOCK_SHIPMENTS);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | ShippingStatus>('all');
  
  // --- UI & States ---
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isCustomerViewOpen, setIsCustomerViewOpen] = useState(false);
  const [isFilterHovered, setIsFilterHovered] = useState(false);
  const [isExportHovered, setIsExportHovered] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({ carrier: 'all', status: 'all' });
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState('all');

  // --- Logic ---
  const stats = useMemo(() => ({
    total: shipments.length,
    transit: shipments.filter(s => s.status === 'in_transit' || s.status === 'out_for_delivery').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    alerts: shipments.filter(s => s.status === 'incident' || s.status === 'returned').length,
  }), [shipments]);

  const kpiData = useMemo(() => [
      { id: 'total_shipments', title: 'Envíos Activos', value: stats.total, trend: '+5 hoy', trendUp: true, icon: <Package size={24}/>, color: 'text-slate-600', bg: 'from-slate-50 to-slate-100', description: 'Volumen total de paquetes bajo gestión.', detailContent: <div className="space-y-2"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">En Bodega: 2</p><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">En Tránsito: {stats.total - 2}</p></div> },
      { id: 'in_transit', title: 'En Camino', value: stats.transit, trend: '85% ok', trendUp: true, icon: <Truck size={24}/>, color: 'text-blue-600', bg: 'from-blue-50 to-cyan-50', description: 'Envíos navegando la red logística.', detailContent: <div className="h-12 flex items-end gap-1">{[40, 70, 45, 90].map((h, i) => (<div key={i} className="w-full bg-blue-500 rounded-t-sm" style={{ height: `${h}%` }}></div>))}</div> },
      { id: 'delivered', title: 'Entregados', value: stats.delivered, trend: '98% éxito', trendUp: true, icon: <CheckCircle2 size={24}/>, color: 'text-emerald-600', bg: 'from-emerald-50 to-teal-50', description: 'Ventas finalizadas con éxito.', detailContent: <div className="p-4 bg-emerald-500 rounded-xl text-white text-center font-black uppercase text-[10px]">Excellent SLA</div> },
      { id: 'alerts', title: 'Alertas', value: stats.alerts, trend: '-20% vs ayer', trendUp: true, icon: <AlertCircle size={24}/>, color: 'text-rose-600', bg: 'from-rose-50 to-orange-50', description: 'Incidentes que requieren atención.', detailContent: <div className="flex items-center gap-2 text-rose-600 font-bold text-xs"><AlertCircle size={14}/> 1 Dirección Errada</div> }
  ], [stats]);

  const filteredShipments = useMemo(() => {
    return shipments.filter(shp => {
      const matchS = shp.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) || shp.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchT = activeTab === 'all' || shp.status === activeTab;
      const matchC = advancedFilters.carrier === 'all' || shp.carrier === advancedFilters.carrier;
      return matchS && matchT && matchC;
    });
  }, [shipments, searchTerm, activeTab, advancedFilters]);

  // --- Handlers ---
  const handlePrintLabel = async (shp: Shipment) => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ format: [100, 150] });
    doc.setFillColor(0, 77, 77); doc.rect(0, 0, 100, 20, 'F');
    doc.setTextColor(255); doc.setFontSize(16); doc.text("BAYUP LABEL", 50, 12, { align: 'center' });
    doc.save(`Label_${shp.tracking_number}.pdf`);
  };

  const getStatusInfo = (status: ShippingStatus) => {
    switch (status) {
      case 'label_generated': return { label: 'Guía', color: 'bg-slate-100 text-slate-600', icon: <Printer size={12}/> };
      case 'in_transit': return { label: 'Tránsito', color: 'bg-blue-50 text-blue-600', icon: <Truck size={12}/> };
      case 'out_for_delivery': return { label: 'Reparto', color: 'bg-cyan-50 text-cyan-600', icon: <Activity size={12}/> };
      case 'delivered': return { label: 'Entregado', color: 'bg-emerald-50 text-emerald-600', icon: <CheckCircle2 size={12}/> };
      case 'incident': return { label: 'Incidencia', color: 'bg-rose-50 text-rose-600', icon: <AlertCircle size={12}/> };
      case 'returned': return { label: 'Devuelto', color: 'bg-amber-50 text-amber-600', icon: <RotateCcw size={12}/> };
    }
  };

  const guideContent = {
    all: { title: 'Vista 360', icon: <Package size={20}/>, color: 'text-blue-500', howItWorks: 'Visión global.', tip: 'Usa filtros.' },
    label_generated: { title: 'Guía', icon: <Printer size={20}/>, color: 'text-slate-500', howItWorks: 'Etiqueta lista.', tip: 'Empaque premium.' },
    in_transit: { title: 'Tránsito', icon: <Truck size={20}/>, color: 'text-blue-600', howItWorks: 'En viaje.', tip: 'Monitorea 48h.' },
    out_for_delivery: { title: 'Reparto', icon: <Activity size={20}/>, color: 'text-cyan-600', howItWorks: 'Última milla.', tip: 'Avisa al cliente.' },
    delivered: { title: 'Entregado', icon: <CheckCircle2 size={20}/>, color: 'text-emerald-600', howItWorks: 'Éxito total.', tip: 'Pide reseña.' },
    incident: { title: 'Incidencia', icon: <AlertCircle size={20}/>, color: 'text-rose-600', howItWorks: 'Novedad crítica.', tip: 'Llama rápido.' }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans pb-20">
      <div className="px-8 py-10 max-w-[1600px] mx-auto">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-[#001A1A]">Envíos</h1>
          <p className="text-[#004d4d]/60 mt-2 font-medium">Centro logístico en tiempo real.</p>
      </div>

      <main className="px-8 max-w-[1600px] mx-auto space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((data) => ( <TiltCard key={data.id} data={data} onClick={() => setSelectedMetric(data)} /> ))}
        </div>

        <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-4">
                <div className="p-1.5 bg-white border border-slate-200 rounded-full shadow-xl flex items-center relative z-10 overflow-x-auto">
                    {['all', 'label_generated', 'in_transit', 'out_for_delivery', 'delivered', 'incident'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`relative px-6 py-3 rounded-full text-xs font-black uppercase transition-all z-10 whitespace-nowrap ${activeTab === tab ? 'text-white' : 'text-slate-500'}`}>
                            {activeTab === tab && <motion.div layoutId="shippingTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" />}
                            {tab === 'all' ? 'Todos' : tab === 'label_generated' ? 'Guía' : tab === 'in_transit' ? 'Tránsito' : tab === 'out_for_delivery' ? 'Reparto' : tab === 'delivered' ? 'Entregado' : 'Incidencia'}
                        </button>
                    ))}
                </div>
                <button onClick={() => setIsGuideOpen(true)} className="h-12 w-12 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-[#004D4D] hover:bg-black hover:text-white transition-all"><Info size={20}/></button>
            </div>

            <div className="w-full flex justify-between items-center bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                 <div className="relative w-full max-w-md"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Buscar guía..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-transparent text-sm outline-none" /></div>
                 <div className="flex items-center gap-1">
                     <motion.button layout onMouseEnter={() => setIsFilterHovered(true)} onMouseLeave={() => setIsFilterHovered(false)} onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className="h-12 flex items-center gap-2 px-4 rounded-2xl bg-white border border-slate-100 text-slate-500">
                        <Filter size={18}/> {isFilterHovered && <motion.span className="text-[10px] font-black uppercase">Filtro</motion.span>}
                     </motion.button>
                     <motion.button layout onMouseEnter={() => setIsExportHovered(true)} onMouseLeave={() => setIsExportHovered(false)} onClick={() => {}} className="h-12 flex items-center gap-2 px-4 rounded-2xl bg-white border border-slate-100 text-slate-500">
                        <Download size={18}/> {isExportHovered && <motion.span className="text-[10px] font-black uppercase">Excel</motion.span>}
                     </motion.button>
                 </div>
            </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
            <table className="w-full text-left">
                <thead><tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="p-8">Envío</th><th className="p-8">Destinatario</th><th className="p-8 text-center">Estado</th><th className="p-8 text-right">Acciones</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                    {filteredShipments.map((shp) => (
                        <tr key={shp.id} onClick={() => setSelectedShipment(shp)} className="group hover:bg-slate-50 transition-all cursor-pointer">
                            <td className="p-8"><p className="text-sm font-black">{shp.id}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{shp.carrier}</p></td>
                            <td className="p-8"><p className="text-sm font-bold">{shp.customer.name}</p><p className="text-[10px] text-slate-400">{shp.customer.city}</p></td>
                            <td className="p-8 text-center"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${getStatusInfo(shp.status)?.color}`}>{getStatusInfo(shp.status)?.label}</span></td>
                            <td className="p-8 text-right"><ChevronRight size={24} className="text-slate-300 group-hover:text-[#004D4D]"/></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </main>

      <AnimatePresence>{selectedMetric && <MetricModal metric={selectedMetric} onClose={() => setSelectedMetric(null)} />}</AnimatePresence>

      <AnimatePresence>
        {selectedShipment && (
            <>
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[200]" onClick={() => setSelectedShipment(null)} />
                <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-[210] border-l flex flex-col">
                    <div className="p-8 bg-[#004D4D] text-white flex justify-between items-start shrink-0">
                        <div><h2 className="text-3xl font-black italic uppercase">{selectedShipment.id}</h2><p className="text-[10px] text-white/60 font-medium uppercase mt-1">Guía: {selectedShipment.tracking_number}</p></div>
                        <button onClick={() => setSelectedShipment(null)} className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center"><X size={20}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-[#FAFAFA]">
                        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative group">
                            <div className="flex justify-between items-center">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={14}/> Datos Entrega</h3>
                                    <div className="space-y-1"><p className="text-lg font-black text-slate-900">{selectedShipment.customer.name}</p><p className="text-sm font-medium text-slate-500">{selectedShipment.customer.address}</p></div>
                                </div>
                                <button onClick={() => setIsCustomerViewOpen(true)} className="h-24 w-24 rounded-[2rem] bg-slate-50 text-[#004D4D] border flex items-center justify-center shadow-md hover:bg-black hover:text-white transition-all"><User size={40}/></button>
                            </div>
                        </section>
                        <section className="space-y-6">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Activity size={14} className="text-emerald-500 animate-pulse"/> Timeline Logístico</h3>
                            <div className="relative space-y-8 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                {selectedShipment.history.map((log, i) => (
                                    <div key={i} className="flex gap-6 relative">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center z-10 ${i === 0 ? 'bg-cyan-500 text-white shadow-lg' : 'bg-white border-2 text-slate-400'}`}>
                                            {i === 0 ? <Activity size={14}/> : <Clock size={14}/>}
                                        </div>
                                        <div><p className={`text-xs font-black ${i === 0 ? 'text-slate-900' : 'text-slate-500'}`}>{log.message}</p><p className="text-[9px] text-slate-400">{log.date}</p></div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                    <div className="p-8 border-t bg-white grid grid-cols-2 gap-4">
                        <button onClick={() => handlePrintLabel(selectedShipment)} className="py-4 bg-slate-50 rounded-2xl font-black text-[10px] uppercase">Etiqueta</button>
                        <button onClick={() => {}} className="py-4 bg-[#004D4D] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg">Rastrear API</button>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCustomerViewOpen && selectedShipment && (
            <div className="fixed inset-0 z-[500] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-4xl h-[80vh] rounded-[3rem] shadow-2xl flex relative overflow-hidden">
                    <button onClick={() => setIsCustomerViewOpen(false)} className="absolute top-8 right-8 z-[510] h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center"><X size={20}/></button>
                    <div className="w-64 bg-slate-50 border-r p-10 flex flex-col items-center text-center">
                        <div className="h-24 w-24 rounded-2xl bg-[#004D4D] text-white flex items-center justify-center text-3xl font-black mb-4">{selectedShipment.customer.name.charAt(0)}</div>
                        <h2 className="text-xl font-black">{selectedShipment.customer.name}</h2>
                        <div className="mt-4 px-4 py-1.5 bg-slate-900 text-white rounded-full text-[8px] font-black uppercase">{selectedShipment.order_id.includes('7825') ? 'Mayorista' : 'Final'}</div>
                    </div>
                    <div className="flex-1 p-10 space-y-8 overflow-y-auto">
                        <h3 className="text-2xl font-black italic uppercase">Customer Intelligence</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-slate-50 p-6 rounded-2xl"><p className="text-[10px] font-black text-slate-400 uppercase">Gasto Promedio</p><p className="text-xl font-black">$450,000</p></div>
                            <div className="bg-cyan-50 p-6 rounded-2xl"><p className="text-[10px] font-black text-cyan-600 uppercase">Lealtad</p><p className="text-xl font-black text-cyan-700">Premium</p></div>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGuideOpen && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuideOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} className="relative bg-white w-full max-w-4xl h-[70vh] rounded-[3rem] shadow-2xl flex overflow-hidden">
                    <div className="w-64 bg-slate-50 border-r p-6 flex flex-col gap-2">
                        {Object.entries(guideContent).map(([k, v]) => (
                            <button key={k} onClick={() => setActiveGuideTab(k)} className={`flex items-center gap-3 p-3 rounded-2xl text-left ${activeGuideTab === k ? 'bg-[#004D4D] text-white' : 'text-slate-500'}`}>
                                <div className={activeGuideTab === k ? 'text-white' : v.color}>{v.icon}</div>
                                <span className="text-[10px] font-black uppercase">{v.title}</span>
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 p-10 space-y-10">
                        <h2 className="text-3xl font-black italic uppercase">{guideContent[activeGuideTab as keyof typeof guideContent]?.title || 'Guía'}</h2>
                        <p className="text-lg font-medium text-slate-600">{guideContent[activeGuideTab as keyof typeof guideContent].howItWorks}</p>
                        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100"><p className="text-sm font-bold text-amber-900">Pro-Tip: {guideContent[activeGuideTab as keyof typeof guideContent].tip}</p></div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
