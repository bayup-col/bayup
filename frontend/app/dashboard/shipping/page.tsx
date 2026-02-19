"use client";

import { useState, useMemo, useRef, useEffect, memo, useCallback } from 'react';
import { useAuth } from "@/context/auth-context";
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
  Activity,
  Box,
  RotateCcw,
  LucidePieChart,
  Target,
  Rocket,
  ShieldCheck,
  Plus,
  Save,
  Loader2,
  DollarSign,
  FilterX,
  LayoutGrid,
  Bot,
  Sparkles,
  MessageCircle,
  Phone,
  Power
} from 'lucide-react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import MetricDetailModal from '@/components/dashboard/MetricDetailModal';
import { exportShipmentsToExcel } from '@/lib/shipping-export';
import { apiRequest } from '@/lib/api';

// --- COMPONENTES ATÓMICOS PREMIUM ---
const AnimatedNumber = memo(({ value, type = 'simple', className }: { value: number, className?: string, type?: 'currency' | 'percentage' | 'simple' }) => {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current: number) => {
        if (type === 'percentage') return `${current.toFixed(1)}%`;
        if (type === 'simple') return Math.round(current).toLocaleString();
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(current);
    });

    useEffect(() => { spring.set(value); }, [value, spring]);
    return <motion.span className={className}>{display}</motion.span>;
});
AnimatedNumber.displayName = 'AnimatedNumber';

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
            animate={{ rotateX, rotateY, scale: rotateX !== 0 ? 1.05 : 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 25 }}
            className={`rounded-[3rem] border transition-all duration-500 relative overflow-hidden isolate cursor-pointer ${dark ? 'bg-[#001A1A] border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]' : 'bg-white/40 backdrop-blur-xl border-white/80 shadow-[0_40px_80px_-15px_rgba(0,77,77,0.15)]'} ${className}`}
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
        >
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                 style={{ opacity: glare.op, background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, ${dark ? 'rgba(0,242,255,0.2)' : 'white'} 0%, transparent 60%)`, zIndex: 1 }} />
            <div style={{ transform: "translateZ(50px)", position: "relative", zIndex: 2 }} className="h-full">{children}</div>
            <div className={`absolute -bottom-20 -right-20 h-40 w-40 blur-[80px] rounded-full pointer-events-none ${dark ? 'bg-[#00f2ff]/10' : 'bg-[#004d4d]/5'}`} />
        </motion.div>
    );
};

// --- TYPES ---
type ShippingStatus = 'label_generated' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'incident' | 'returned';

interface Shipment {
  id: string;
  tracking_number: string;
  order_id: string;
  carrier: string;
  status: ShippingStatus;
  customer: { name: string; city: string; phone?: string; };
  last_update: string;
}

// --- COMPONENTE PRINCIPAL ---
export default function ShippingPage() {
  const { token, userEmail } = useAuth();
  const { showToast } = useToast();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | ShippingStatus>('all');

  const fetchShipments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
        const data = await apiRequest<any[]>('/admin/shipments', { token });
        if (data) {
            const mapped = data.map(s => ({
                id: s.id,
                tracking_number: s.tracking_number || 'S/N',
                order_id: s.order_id,
                carrier: s.carrier || 'Por asignar',
                status: s.status as ShippingStatus,
                customer: { 
                    name: s.recipient_name || 'Cliente', 
                    city: s.destination_address || 'Sin dirección',
                    phone: '' // Podríamos traerlo del pedido si fuera necesario
                },
                last_update: s.updated_at
            }));
            setShipments(mapped);
        }
    } catch (e) {
        showToast("Error al cargar envíos", "error");
    } finally {
        setLoading(false);
    }
  }, [token, showToast]);

  const handleUpdateStatus = async (shipmentId: string, newStatus: ShippingStatus) => {
    try {
        await apiRequest(`/admin/shipments/${shipmentId}/status`, {
            method: 'PATCH',
            token,
            body: JSON.stringify({ status: newStatus })
        });
        showToast("Estado actualizado ✨", "success");
        fetchShipments();
        // Si hay uno seleccionado, actualizarlo también
        if (selectedShipment?.id === shipmentId) {
            setSelectedShipment(prev => prev ? { ...prev, status: newStatus } : null);
        }
    } catch (e) {
        showToast("Error al actualizar", "error");
    }
  };

  useEffect(() => {
    fetchShipments();
    const handleFocus = () => fetchShipments();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchShipments]);
  
  // UI & Filters
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isFilterHovered, setIsFilterHovered] = useState(false);
  const [isExportHovered, setIsExportHovered] = useState(false);
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState('overview');

  const stats = useMemo(() => ({
    total: shipments.length,
    transit: shipments.filter(s => s.status === 'in_transit' || s.status === 'out_for_delivery').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    alerts: shipments.filter(s => s.status === 'incident' || s.status === 'returned').length,
  }), [shipments]);

  const kpis = [
      { id: 'total_shipments', label: 'Envíos activos', value: stats.total, icon: <Package size={24}/>, color: 'text-[#004d4d]', bg: 'bg-[#004d4d]/5', trend: 'Live', description: 'Volumen total de paquetes bajo gestión logística.' },
      { id: 'in_transit', label: 'En camino', value: stats.transit, icon: <Truck size={24}/>, color: 'text-blue-600', bg: 'bg-blue-50', trend: '85% ok', description: 'Envíos navegando la red logística nacional.' },
      { id: 'delivered', label: 'Entregados', value: stats.delivered, icon: <CheckCircle2 size={24}/>, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Excellent', description: 'Ventas finalizadas con entrega exitosa confirmada.' },
      { id: 'alerts', label: 'Alertas críticas', value: stats.alerts, icon: <AlertCircle size={24}/>, color: 'text-rose-600', bg: 'bg-rose-50', trend: 'Atención', description: 'Incidentes o novedades que requieren intervención inmediata.' }
  ];

  const handleExport = async () => {
      if (shipments.length === 0) {
          showToast("No hay envíos para exportar", "info");
          return;
      }
      try {
          showToast("Generando Excel Logístico...", "info");
          await exportShipmentsToExcel(shipments, "Bayup_Logística");
          showToast("¡Base de datos exportada! 📦", "success");
      } catch (e) { showToast("Error al exportar", "error"); }
  };

  const filteredShipments = useMemo(() => {
    return shipments.filter(shp => {
      const matchS = shp.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) || shp.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchT = activeTab === 'all' || shp.status === activeTab;
      const matchC = carrierFilter === 'all' || shp.carrier === carrierFilter;
      return matchS && matchT && matchC;
    });
  }, [shipments, searchTerm, activeTab, carrierFilter]);

  const getStatusInfo = (status: ShippingStatus) => {
    switch(status) {
      case 'label_generated': return { label: 'Guía generada', color: 'bg-slate-100 text-slate-600', icon: <Printer size={12}/> };
      case 'in_transit': return { label: 'En tránsito', color: 'bg-blue-50 text-blue-600', icon: <Truck size={12}/> };
      case 'out_for_delivery': return { label: 'En reparto', color: 'bg-cyan-50 text-cyan-600', icon: <Zap size={12}/> };
      case 'delivered': return { label: 'Entregado', color: 'bg-emerald-50 text-emerald-600', icon: <CheckCircle2 size={12}/> };
      case 'incident': return { label: 'Incidencia', color: 'bg-rose-50 text-rose-600', icon: <AlertCircle size={12}/> };
      case 'returned': return { label: 'Devuelto', color: 'bg-amber-50 text-amber-600', icon: <RotateCcw size={12}/> };
    }
  };

  const guideContent = {
    overview: { title: 'Monitor 360', icon: <LayoutGrid size={20}/>, color: 'text-slate-600', description: 'Control absoluto del flujo logístico.', whyImportant: 'Reduce quejas en un 40%.', kpi: { label: 'Eficiencia', val: '98%' }, baytTip: 'Audita tiempos semanalmente.' },
    label: { title: 'Guía generada', icon: <Printer size={20}/>, color: 'text-blue-500', description: 'Etiqueta lista para empaque.', whyImportant: 'Clave para el ranking de tienda.', kpi: { label: 'Empaque', val: '< 2h' }, baytTip: 'Empaque premium es publicidad.' },
    transit: { title: 'En tránsito', icon: <Truck size={20}/>, color: 'text-cyan-500', description: 'Paquete viajando por la red nacional.', whyImportant: 'Manten el link de rastreo activo.', kpi: { label: 'Rastreo', val: '100%' }, baytTip: 'Contacta antes que el cliente.' },
    delivery: { title: 'Reparto final', icon: <Zap size={20}/>, color: 'text-amber-500', description: 'Entregas en curso (milla final).', whyImportant: 'Etapa de mayor cantidad de novedades.', kpi: { label: 'Éxito', val: '94%' }, baytTip: 'Avisa por WhatsApp la llegada.' },
    incidents: { title: 'Gestión alertas', icon: <AlertCircle size={20}/>, color: 'text-rose-500', description: 'Intervención inmediata en novedades.', whyImportant: 'Transforma problemas en fidelidad.', kpi: { label: 'Respuesta', val: '< 1h' }, baytTip: 'Trata como prioridad #1.' }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20 animate-in fade-in duration-1000">
      
      {/* 1. HEADER PLATINUM */}
      <div className="px-4 text-slate-900">
          <div className="flex items-center gap-3 mb-2">
              <div className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#00f2ff] animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.3em] text-[#004d4d]/60 italic">Logística Global v2.0</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none text-[#001A1A]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-[#004d4d]">Envíos</span>
          </h1>
          <p className="text-gray-400 font-medium text-lg italic max-w-2xl mt-4">¡Rastrea y encuentra tus pedidos en tiempo real! 🚚</p>
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
                          <div className="px-3 py-1 bg-gray-100 rounded-full text-[9px] font-black tracking-wider text-gray-400">
                              {kpi.trend}
                          </div>
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-gray-400 tracking-[0.2em] mb-1.5">{kpi.label}</p>
                          <h3 className="text-3xl font-black text-gray-900 tracking-tighter italic">
                              <AnimatedNumber value={kpi.value} type="simple" />
                          </h3>
                      </div>
                  </PremiumCard>
              </div>
          ))}
      </div>

      <main className="px-4 space-y-10">
        {/* NAVEGACIÓN CENTRAL Y BÚSQUEDA TÁCTICA */}
        <div className="flex flex-col items-center gap-10">
            <div className="flex items-center gap-4 relative z-20">
                <div className="p-1.5 bg-white/60 backdrop-blur-xl border border-white/80 rounded-full shadow-2xl flex items-center overflow-x-auto no-scrollbar relative">
                    {['all', 'label_generated', 'in_transit', 'out_for_delivery', 'delivered', 'incident'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`relative px-10 py-3.5 rounded-full text-[10px] font-black tracking-widest transition-all duration-500 z-10 whitespace-nowrap ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-[#004D4D]'}`}>
                            {activeTab === tab && <motion.div layoutId="shippingTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" />}
                            {tab === 'all' ? 'Todos' : tab === 'label_generated' ? 'Guía' : tab === 'in_transit' ? 'Tránsito' : tab === 'out_for_delivery' ? 'Reparto' : tab === 'delivered' ? 'Entregado' : 'Incidencia'}
                        </button>
                    ))}
                </div>
                <button onClick={() => setIsGuideOpen(true)} className="h-12 w-12 rounded-full bg-white border border-gray-100 text-[#004d4d] flex items-center justify-center hover:scale-110 hover:bg-[#004d4d] hover:text-white transition-all shadow-xl active:scale-95 group"><Info size={20}/></button>
            </div>

            <div className="w-full max-w-5xl flex flex-col md:flex-row items-center gap-4 mx-auto">
                 <div className="flex-1 flex items-center gap-4 bg-white/60 backdrop-blur-md p-2 rounded-3xl border border-white/80 shadow-sm transition-all focus-within:shadow-xl focus-within:border-cyan/30 w-full">
                    <Search size={20} className="text-gray-300 ml-4" />
                    <input type="text" placeholder="Buscar guía o destinatario..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 bg-transparent outline-none text-sm font-bold text-gray-900 py-3" />
                 </div>
                 <div className="flex items-center gap-3">
                     <motion.button layout onMouseEnter={() => setIsFilterHovered(true)} onMouseLeave={() => setIsFilterHovered(false)} onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)} className={`h-14 flex items-center gap-2 px-6 rounded-3xl transition-all border ${isFilterPanelOpen ? 'bg-[#004d4d] text-white' : 'bg-white border-white/80 text-slate-500 hover:text-[#004d4d] shadow-sm'}`}>
                        {isFilterPanelOpen ? <FilterX size={20}/> : <Filter size={20}/>} 
                        {isFilterHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} className="text-[10px] font-black uppercase">Filtro</motion.span>}
                     </motion.button>
                     <motion.button layout onMouseEnter={() => setIsExportHovered(true)} onMouseLeave={() => setIsExportHovered(false)} onClick={handleExport} className="h-14 flex items-center gap-2 px-6 rounded-3xl bg-white border border-white/80 text-slate-500 hover:text-emerald-600 shadow-sm transition-all">
                        <Download size={20}/> {isExportHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} className="text-[10px] font-black uppercase">Excel</motion.span>}
                     </motion.button>
                 </div>
            </div>

            <AnimatePresence>
                {isFilterPanelOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="w-full max-w-5xl overflow-hidden">
                        <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-gray-400 tracking-widest ml-1 text-slate-900">Transportadora</label>
                                <div className="grid grid-cols-2 gap-2 text-slate-900">
                                    {['all', 'Servientrega', 'Coordinadora', 'Envia', 'Interrapidisimo'].map(c => (
                                        <button key={c} onClick={() => setCarrierFilter(c)} className={`py-3 rounded-xl text-[9px] font-black border transition-all ${carrierFilter === c ? 'bg-[#004d4d] border-[#004d4d] text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}`}>{c === 'all' ? 'Todas' : c}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3 text-slate-900">
                                <label className="text-[9px] font-black text-gray-400 tracking-widest ml-1">Fecha de despacho</label>
                                <div className="p-4 bg-white rounded-2xl border border-gray-100 flex items-center gap-3 text-gray-400"><CalendarIcon size={16}/><span className="text-[10px] font-bold">Seleccionar rango...</span></div>
                            </div>
                            <div className="flex flex-col justify-end"><button onClick={() => { setCarrierFilter('all'); setSearchTerm(""); }} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] tracking-widest hover:bg-black shadow-xl">Limpiar filtros</button></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <div className="bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/80 shadow-xl overflow-hidden text-slate-900">
            <table className="w-full text-center">
                <thead><tr className="bg-gray-50/50 text-[10px] font-black text-[#004D4D] tracking-[0.2em]"><th className="px-8 py-6">Envío</th><th className="px-8 py-6">Destinatario</th><th className="px-8 py-6 text-center">Estado</th><th className="px-8 py-6 text-right pr-12">Acciones</th></tr></thead>
                <tbody className="divide-y divide-gray-100/50">
                    {filteredShipments.length === 0 ? (<tr><td colSpan={4} className="py-20 text-center text-gray-300 font-black text-[10px]">Sin movimientos logísticos activos</td></tr>) : filteredShipments.map((shp) => (
                        <tr key={shp.id} onClick={() => setSelectedShipment(shp)} className="group hover:bg-white/60 transition-all cursor-pointer">
                            <td className="px-8 py-8"><p className="text-sm font-black text-gray-900">{shp.id}</p><p className="text-[10px] text-gray-400 font-bold">{shp.carrier}</p></td>
                            <td className="px-8 py-8"><p className="text-sm font-bold text-gray-700">{shp.customer.name}</p><p className="text-[10px] text-gray-400 italic">{shp.customer.city}</p></td>
                            <td className="px-8 py-8 text-center"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest ${getStatusInfo(shp.status)?.color}`}>{getStatusInfo(shp.status)?.label}</span></td>
                            <td className="px-8 py-8 text-right pr-12"><ChevronRight size={24} className="text-slate-200 group-hover:text-[#004D4D] ml-auto transition-all"/></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </main>

      <MetricDetailModal isOpen={!!selectedMetric} onClose={() => setSelectedMetric(null)} metric={selectedMetric} />

      {/* GUIA OPERATIVA LOGÍSTICA PLATINUM PLUS */}
      <AnimatePresence>
          {isGuideOpen && (
              <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 md:p-8">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuideOpen(false)} className="absolute inset-0 bg-[#001A1A]/90 backdrop-blur-2xl" />
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="relative bg-white w-full max-w-6xl h-[85vh] rounded-[4rem] shadow-3xl overflow-hidden border border-white/20 flex flex-col md:flex-row text-slate-900">
                      <button onClick={() => setIsGuideOpen(false)} className="absolute top-8 right-8 h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#004D4D] hover:bg-white transition-all z-[1600] shadow-sm"><X size={24} /></button>
                      <div className="w-full md:w-80 bg-gray-50 border-r border-gray-100 p-10 flex flex-col shrink-0">
                          <div className="mb-10"><div className="flex items-center gap-3 mb-2"><div className="h-2 w-2 rounded-full bg-[#004D4D] animate-pulse" /><span className="text-[10px] font-black tracking-[0.2em] text-[#004D4D]/60">Tutorial maestro</span></div><h3 className="text-2xl font-black italic text-[#001A1A] tracking-tighter leading-none">Control <span className="text-[#004D4D]">logístico</span></h3></div>
                          <div className="space-y-2 flex-1">
                              {(Object.entries(guideContent) as any).map(([key, item]: any) => (
                                  <button key={key} onClick={() => setActiveGuideTab(key)} className={`w-full flex items-center gap-4 p-4 rounded-[1.5rem] transition-all text-left group ${activeGuideTab === key ? 'bg-white shadow-xl border border-white scale-[1.02]' : 'hover:bg-white/50 text-gray-400'}`}>
                                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${activeGuideTab === key ? 'bg-[#004D4D] text-white' : 'bg-gray-100'}`}>{item.icon}</div>
                                      <span className={`text-[10px] font-black tracking-widest ${activeGuideTab === key ? 'text-gray-900' : ''}`}>{item.title.split(' ')[0]}</span>
                                  </button>
                              ))}
                          </div>
                          <div className="mt-auto pt-8 border-t border-gray-100"><div className="bg-[#004D4D] p-6 rounded-3xl text-white relative overflow-hidden group cursor-help"><div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><Bot size={80}/></div><p className="text-[10px] font-black tracking-[0.2em] mb-2 text-cyan">Bayt logistics</p><p className="text-[11px] font-medium leading-relaxed italic opacity-80">Bayt monitorea tus guías en tiempo real.</p></div></div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-12 bg-white custom-scrollbar relative text-slate-900">
                          <AnimatePresence mode="wait">
                              <motion.div key={activeGuideTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                                  <div className="space-y-6"><div className="flex items-center gap-4 text-slate-900"><div className={`h-16 w-16 rounded-[1.8rem] flex items-center justify-center ${guideContent[activeGuideTab as keyof typeof guideContent].color} bg-white shadow-xl border border-gray-50`}>{guideContent[activeGuideTab as keyof typeof guideContent].icon}</div><div><h2 className="text-4xl font-black text-gray-900 tracking-tighter italic">{guideContent[activeGuideTab as keyof typeof guideContent].title}</h2><p className="text-gray-400 text-xs font-bold tracking-widest mt-1 text-slate-900">Excelencia en operaciones</p></div></div><p className="text-lg font-medium text-gray-600 leading-relaxed max-w-3xl italic text-slate-900">&quot;{guideContent[activeGuideTab as keyof typeof guideContent].description}&quot;</p></div>
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 flex flex-col justify-between group"><div className="text-slate-900"><h4 className="text-[10px] font-black text-gray-400 tracking-widest mb-6 flex items-center gap-2"><Activity size={12} className="text-[#004D4D]" /> Objetivo estratégico</h4><div className="flex items-end gap-4"><span className="text-6xl font-black italic text-gray-900 tracking-tighter">{guideContent[activeGuideTab as keyof typeof guideContent].kpi.val}</span><div className="mb-2 h-10 w-px bg-gray-200" /><p className="text-[10px] font-bold text-[#004D4D] leading-tight mb-2">{guideContent[activeGuideTab as keyof typeof guideContent].kpi.label}</p></div></div><div className="mt-8 h-2 w-full bg-white rounded-full overflow-hidden border border-gray-100 shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: '90%' }} className="h-full bg-gradient-to-r from-[#004D4D] to-cyan rounded-full" /></div></div><div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4"><h4 className="text-[10px] font-black text-gray-400 tracking-widest flex items-center gap-2"><Target size={14} className="text-rose-500" /> ¿Por qué es vital?</h4><p className="text-sm font-medium text-gray-600 leading-relaxed text-slate-900">{guideContent[activeGuideTab as keyof typeof guideContent].whyImportant}</p></div></div>
                                  <div className="bg-[#001A1A] p-10 rounded-[3rem] text-white relative overflow-hidden isolate"><div className="absolute top-0 right-0 p-8 opacity-5 -z-10 rotate-12"><Bot size={150}/></div><div className="flex items-center gap-4 mb-6"><div className="h-10 w-10 rounded-xl bg-cyan flex items-center justify-center text-[#001A1A] shadow-[0_0_15px_rgba(0,242,255,0.3)]"><Bot size={20} /></div><h4 className="text-xs font-black tracking-[0.2em] text-cyan">Estrategia Bayt AI</h4></div><p className="text-lg font-bold italic leading-tight text-white/90">&quot;{guideContent[activeGuideTab as keyof typeof guideContent].baytTip}&quot;</p><div className="mt-8 flex items-center gap-3"><div className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" /><span className="text-[9px] font-black tracking-[0.2em] text-cyan/60">Análisis predictivo de logística v2.0</span></div></div>
                              </motion.div>
                          </AnimatePresence>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* PANEL DETALLADO DEL ENVÍO */}
      <AnimatePresence>
        {selectedShipment && (
            <>
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200]" onClick={() => setSelectedShipment(null)} />
                <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-3xl z-[210] border-l border-white/20 flex flex-col text-slate-900">
                    <div className="p-8 bg-[#004D4D] text-white flex justify-between items-start shrink-0 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Truck size={150}/></div>
                        <div className="relative z-10 text-white">
                            <h2 className="text-3xl font-black italic tracking-tighter text-white">{selectedShipment.id}</h2>
                            <p className="text-[10px] text-cyan font-black mt-1">Guía: {selectedShipment.tracking_number}</p>
                        </div>
                        <button onClick={() => setSelectedShipment(null)} className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white"><X size={20}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-gray-50/50 text-slate-900">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4 text-slate-900">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${getStatusInfo(selectedShipment.status)?.color}`}>{getStatusInfo(selectedShipment.status)?.icon}</div>
                                <div><p className="text-[10px] font-black text-gray-400 tracking-widest">Estado actual</p><h4 className="text-lg font-black text-gray-900 italic">{getStatusInfo(selectedShipment.status)?.label}</h4></div>
                            </div>
                            
                            <select 
                                value={selectedShipment.status} 
                                onChange={(e) => handleUpdateStatus(selectedShipment.id, e.target.value as ShippingStatus)}
                                className="h-10 px-4 bg-[#004D4D] text-white rounded-xl text-[10px] font-black tracking-widest shadow-lg outline-none cursor-pointer"
                            >
                                <option value="label_generated">Guía generada</option>
                                <option value="in_transit">En tránsito</option>
                                <option value="out_for_delivery">En reparto</option>
                                <option value="delivered">Entregado</option>
                                <option value="incident">Incidencia</option>
                                <option value="returned">Devuelto</option>
                            </select>
                        </div>
                        <div className="space-y-4 text-slate-900">
                            <h5 className="text-[10px] font-black text-gray-400 tracking-[0.3em] ml-2">Destinatario</h5>
                            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6 text-slate-900">
                                <div className="flex items-center gap-6 text-slate-900"><div className="h-16 w-16 rounded-[1.8rem] bg-slate-900 text-white flex items-center justify-center text-2xl font-black italic">{selectedShipment.customer.name.charAt(0)}</div><div><h4 className="text-xl font-black text-gray-900">{selectedShipment.customer.name}</h4><div className="flex items-center gap-2 text-gray-400"><MapPin size={12} className="text-cyan" /><span className="text-[10px] font-bold">{selectedShipment.customer.city}, Colombia</span></div></div></div>
                                <button onClick={() => { const p = selectedShipment.customer.phone || '3000000000'; window.open(`https://wa.me/${p}?text=Hola%20${selectedShipment.customer.name},%20sobre%20tu%20envío%20${selectedShipment.id}`, '_blank'); }} className="w-full flex items-center justify-center gap-2 p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 font-black text-[10px] hover:bg-emerald-600 hover:text-white transition-all"><MessageCircle size={16}/> Contactar WhatsApp</button>
                            </div>
                        </div>
                        <div className="space-y-6 text-slate-900">
                            <h5 className="text-[10px] font-black text-gray-400 tracking-[0.3em] ml-2 text-slate-900">Historial de ruta</h5>
                            <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 text-slate-900">
                                {[ { t: '10:30 am', e: 'En reparto local' }, { t: '08:15 am', e: 'Hub regional' }, { t: 'Ayer', e: 'Despacho bodega' } ].map((step, i) => (
                                    <div key={i} className="relative text-slate-900"><div className={`absolute -left-[25px] top-1 h-4 w-4 rounded-full border-4 border-white shadow-sm ${i === 0 ? 'bg-cyan animate-pulse' : 'bg-gray-300'}`} /><div className="flex items-center justify-between text-slate-900"><p className="text-sm font-black text-gray-900">{step.e}</p><span className="text-[9px] font-bold text-gray-400">{step.t}</span></div></div>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 pt-10 border-t border-gray-100 text-slate-900">
                            <button onClick={() => { showToast("Generando guía...", "info"); setTimeout(() => showToast("Guía descargada 📄", "success"), 1500); }} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 hover:bg-black transition-all"><Download size={18} className="text-cyan"/> Descargar guía PDF</button>
                            <button onClick={() => { showToast("Reiniciando...", "info"); setTimeout(() => showToast("Gestión renovada 🔄", "success"), 1500); }} className="w-full py-5 bg-white border border-gray-200 text-gray-500 rounded-2xl font-black text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-gray-50 transition-all"><RefreshCcw size={18}/> Renovar gestión logística</button>
                        </div>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}
