"use client";

import { useState, useMemo, useRef, MouseEvent, useEffect } from 'react';
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
    RotateCcw,  Box,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

// --- COMPONENTE DE NÚMEROS ANIMADOS ---
function AnimatedNumber({ value, className, type = 'currency' }: { value: number, className?: string, type?: 'currency' | 'percentage' | 'simple' }) {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current: number) => {
        if (type === 'percentage') return `${Math.round(current)}%`;
        if (type === 'simple') return Math.round(current).toLocaleString();
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(current);
    });

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    return <motion.span className={className}>{display}</motion.span>;
}

// --- Tipos de Estado de Envío (Requeridos) ---
type ShippingStatus = 'label_generated' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'incident' | 'returned';

interface Shipment {
  id: string;
  order_id: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
  carrier: string;
  tracking_number: string;
  status: ShippingStatus;
  last_update: string;
  estimated_delivery: string;
  history: { date: string; message: string; location: string }[];
}

// --- Mock Data Logística ---
const MOCK_SHIPMENTS: Shipment[] = [
  {
    id: "SHP-1001",
    order_id: "ORD-7828",
    customer: { name: "Carlos Ruiz", phone: "+57 315 555 1234", address: "Av. Siempre Viva 742", city: "Cali" },
    carrier: "Coordinadora",
    tracking_number: "123456789",
    status: "in_transit",
    last_update: "2026-01-30T14:20:00",
    estimated_delivery: "2026-02-01",
    history: [
        { date: "2026-01-30T10:00:00", message: "Recibido en centro de distribución", location: "Medellín" },
        { date: "2026-01-30T14:20:00", message: "En tránsito a ciudad destino", location: "Bogotá - Cali" }
    ]
  },
  {
    id: "SHP-1002",
    order_id: "ORD-7825",
    customer: { name: "Luisa Lane", phone: "+57 300 555 9999", address: "Calle 100 #15-20", city: "Barranquilla" },
    carrier: "Servientrega",
    tracking_number: "SRV-998877",
    status: "out_for_delivery",
    last_update: "2026-01-30T09:15:00",
    estimated_delivery: "2026-01-30",
    history: [
        { date: "2026-01-29T16:00:00", message: "Guía generada por el remitente", location: "Bodega Principal" },
        { date: "2026-01-30T09:15:00", message: "En reparto - Vehículo de entrega", location: "Barranquilla" }
    ]
  },
  {
    id: "SHP-1003",
    order_id: "ORD-7830",
    customer: { name: "Maria Fernanda", phone: "+57 310 987 6543", address: "Cra 80 #12-34", city: "Medellín" },
    carrier: "Interrapidisimo",
    tracking_number: "INT-445566",
    status: "incident",
    last_update: "2026-01-30T11:00:00",
    estimated_delivery: "2026-01-31",
    history: [
        { date: "2026-01-30T11:00:00", message: "Dirección insuficiente / No reside", location: "Medellín Norte" }
    ]
  }
];

export default function ShippingPage() {
  const { showToast } = useToast();
  const [shipments, setShipments] = useState<Shipment[]>(MOCK_SHIPMENTS);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | ShippingStatus>('all');
  
  // --- Efecto para Cargar Envíos Registrados desde Pedidos ---
  useEffect(() => {
    const savedShipments = JSON.parse(localStorage.getItem('bayup_shipments') || '[]');
    if (savedShipments.length > 0) {
        // Filtrar duplicados por order_id para no repetir si recargas
        setShipments(prev => {
            const combined = [...prev, ...savedShipments];
            const unique = combined.filter((v, i, a) => a.findIndex(t => t.order_id === v.order_id) === i);
            return unique;
        });
    }
  }, []);

  const [isCarrierDropdownOpen, setIsCarrierDropdownOpen] = useState(false);
  const [shippingData, setShippingData] = useState({ carrier: '', trackingNumber: '' });
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState('all');

  const guideContent = {
    all: {
        title: 'Vista 360 Logística',
        icon: <Package size={20}/>,
        color: 'text-blue-500',
        howItWorks: 'Centraliza todos los envíos digitales de tu plataforma sin importar su estado actual.',
        example: 'Úsalo para tener una auditoría rápida de cuántos paquetes tienes fuera de bodega en este momento.',
        tip: 'Si un cliente llama preguntando por su paquete, búscalo aquí primero para obtener el ID de envío global.'
    },
    label_generated: {
        title: 'Guía Generada',
        icon: <Printer size={20}/>,
        color: 'text-slate-500',
        howItWorks: 'Paquetes que ya tienen asignada una transportadora y número de guía, pero aún no han sido recogidos por el camión.',
        example: 'Generaste la guía a las 10 AM. El paquete aparece aquí hasta que la transportadora lo escanee al recogerlo en la tarde.',
        tip: 'Aprovecha este tiempo para asegurar que el empaque sea premium y la etiqueta esté en un lugar visible.'
    },
    in_transit: {
        title: 'En Tránsito',
        icon: <Truck size={20}/>,
        color: 'text-blue-600',
        howItWorks: 'El paquete ya está en manos de la transportadora y se mueve entre centros de distribución hacia la ciudad destino.',
        example: 'El envío salió de Medellín y está viajando por carretera hacia Cali.',
        tip: 'Monitorea envíos que lleven más de 48h en este estado. Si el viaje es nacional, ya deberían estar cerca de su destino.'
    },
    out_for_delivery: {
        title: 'En Reparto',
        icon: <Activity size={20}/>,
        color: 'text-cyan-600',
        howItWorks: '¡Fase final! El paquete está en el vehículo de entrega local y llegará al cliente en las próximas horas.',
        example: 'El mensajero de Servientrega cargó el paquete en su camioneta a las 8 AM en Barranquilla.',
        tip: 'Este es el mejor momento para enviarle un recordatorio al cliente: "¡Tu pedido llega hoy!". Aumenta la tasa de entrega efectiva.'
    },
    delivered: {
        title: 'Entregado',
        icon: <CheckCircle2 size={20}/>,
        color: 'text-emerald-600',
        howItWorks: 'Objetivo cumplido. El cliente recibió el producto y la transportadora confirmó la entrega.',
        example: 'El cliente firmó la planilla de recibido. El sistema se actualiza automáticamente a este estado.',
        tip: 'Es el momento perfecto para pedir feedback. Envía un cupón de descuento para su próxima compra digital.'
    },
    incident: {
        title: 'Incidencia',
        icon: <AlertCircle size={20}/>,
        color: 'text-rose-600',
        howItWorks: 'Alertas críticas reportadas por la transportadora: dirección errada, cliente ausente o paquete dañado.',
        example: 'La transportadora reporta "Dirección no existe". El paquete se detiene y requiere tu intervención inmediata.',
        tip: 'Llama al cliente de inmediato cuando veas un envío aquí. Resolver incidencias en menos de 1 hora salva el 90% de las ventas.'
    }
  };

  const carriers = ['Servientrega', 'Coordinadora', 'Envia', 'Interrapidisimo', 'FedEx', 'DHL'];

  const getTrackingUrl = (carrier?: string, code?: string) => {
    if (!carrier || !code) return "#";
    const cleanCode = code.trim();
    if (carrier === 'Coordinadora') return `https://www.coordinadora.com/portafolio-de-servicios/servicios-en-linea/rastreo-de-guias/?guia=${cleanCode}`;
    if (carrier === 'Servientrega') return `https://www.servientrega.com/wps/portal/Colombia/transacciones-personas/rastreo-envios?id=${cleanCode}`;
    if (carrier === 'Interrapidisimo') return `https://www.interrapidisimo.com/sigue-tu-envio/?guia=${cleanCode}`;
    return "#";
  };

  const handlePrintLabel = async (shp: Shipment) => {
    try {
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [100, 150] }); // Formato etiqueta térmica
        const petrol = [0, 77, 77];
        
        doc.setFillColor(petrol[0], petrol[1], petrol[2]);
        doc.rect(0, 0, 100, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text("BAYUP LOGISTICS", 50, 12, { align: 'center' });

        doc.setTextColor(0,0,0);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("DESTINATARIO:", 10, 35);
        doc.setFont("helvetica", "normal");
        doc.text(shp.customer.name, 10, 40);
        doc.text(shp.customer.address, 10, 45);
        doc.text(`${shp.customer.city}, Colombia`, 10, 50);
        doc.text(shp.customer.phone, 10, 55);

        doc.setFont("helvetica", "bold");
        doc.text("TRANSPORTADORA:", 10, 75);
        doc.setFontSize(12);
        doc.text(shp.carrier.toUpperCase(), 10, 82);
        
        doc.setFontSize(8);
        doc.text("GUÍA DE RASTREO:", 10, 95);
        doc.setFontSize(14);
        doc.text(shp.tracking_number, 10, 102);

        // Simulación de código de barras
        doc.setFillColor(0,0,0);
        doc.rect(10, 115, 80, 15, 'F');
        doc.setFontSize(6);
        doc.text("|| |||| ||| ||||| || |||| ||| ||||| ||", 50, 135, { align: 'center' });

        doc.save(`Etiqueta_${shp.tracking_number}.pdf`);
        showToast("Etiqueta generada con éxito", "success");
    } catch (e) { console.error(shp); }
  };

  // --- Nuevos Estados de Filtros y UI ---
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [isCustomerViewOpen, setIsCustomerViewOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [isFilterHovered, setIsFilterHovered] = useState(false);
  const [isDateHovered, setIsDateHovered] = useState(false);
  const [isExportHovered, setIsExportHovered] = useState(false);
  const [dateRangeState, setDateRangeState] = useState({ from: '', to: '' });
  const [advancedFilters, setAdvancedFilters] = useState({ carrier: 'all', status: 'all' });

  // --- Lógica de Filtrado ---
  const filteredShipments = useMemo(() => {
    return shipments.filter(shp => {
      const matchesSearch = 
        shp.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
        shp.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shp.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTab = activeTab === 'all' || shp.status === activeTab;
      
      const matchesCarrier = advancedFilters.carrier === 'all' || shp.carrier === advancedFilters.carrier;
      const matchesAdvancedStatus = advancedFilters.status === 'all' || shp.status === advancedFilters.status;

      let matchesDate = true;
      if (dateRangeState.from && dateRangeState.to) {
          const shpDate = new Date(shp.last_update).toISOString().split('T')[0];
          matchesDate = shpDate >= dateRangeState.from && shpDate <= dateRangeState.to;
      }
      
      return matchesSearch && matchesTab && matchesCarrier && matchesAdvancedStatus && matchesDate;
    });
  }, [shipments, searchTerm, activeTab, advancedFilters, dateRangeState]);

  // --- Funciones de Acción ---
  const handleDatePreset = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
      const today = new Date();
      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      let start = new Date();
      let end = new Date();
      if (preset === 'yesterday') { start.setDate(today.getDate() - 1); end.setDate(today.getDate() - 1); }
      else if (preset === 'week') { start.setDate(today.getDate() - 7); }
      else if (preset === 'month') { start = new Date(today.getFullYear(), today.getMonth(), 1); }
      setDateRangeState({ from: formatDate(start), to: formatDate(end) });
  };

  const handleExportExcel = () => {
    if (shipments.length === 0) { showToast("No hay datos para exportar", "info"); return; }
    const styles = `<style>.header { background-color: #004D4D; color: #ffffff; font-weight: bold; text-align: center; }.cell { border: 1px solid #e2e8f0; padding: 8px; font-family: sans-serif; font-size: 12px; }.title { font-size: 20px; font-weight: bold; color: #004D4D; }</style>`;
    let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8">${styles}</head><body><table><tr><td colspan="7" class="title">BAYUP - REPORTE DE ENVÍOS ELITE</td></tr><thead><tr class="header"><th>ID ENVÍO</th><th>PEDIDO</th><th>CLIENTE</th><th>TRANSPORTADORA</th><th>GUÍA</th><th>ESTADO</th><th>ÚLTIMA ACT.</th></tr></thead><tbody>`;
    shipments.forEach(s => {
        tableHtml += `<tr><td class="cell">${s.id}</td><td class="cell">${s.order_id}</td><td class="cell">${s.customer.name}</td><td class="cell">${s.carrier}</td><td class="cell">${s.tracking_number}</td><td class="cell">${s.status}</td><td class="cell">${s.last_update}</td></tr>`;
    });
    tableHtml += `</tbody></table></body></html>`;
    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `Reporte_Envios_Bayup.xls`; link.click();
    showToast("Excel logístico generado con éxito", "success");
  };

  const getStatusInfo = (status: ShippingStatus) => {
    switch (status) {
      case 'label_generated': return { label: 'Guía Generada', color: 'bg-slate-100 text-slate-600', icon: <Printer size={12}/> };
      case 'in_transit': return { label: 'En Tránsito', color: 'bg-blue-50 text-blue-600', icon: <Truck size={12}/> };
      case 'out_for_delivery': return { label: 'En Reparto', color: 'bg-cyan-50 text-cyan-600', icon: <Activity size={12}/> };
      case 'delivered': return { label: 'Entregado', color: 'bg-emerald-50 text-emerald-600', icon: <CheckCircle2 size={12}/> };
      case 'incident': return { label: 'Incidencia', color: 'bg-rose-50 text-rose-600', icon: <AlertCircle size={12}/> };
      case 'returned': return { label: 'Devuelto', color: 'bg-amber-50 text-amber-600', icon: <RotateCcw size={12}/> };
    }
  };

  const stats = useMemo(() => ({
    total: shipments.length,
    transit: shipments.filter(s => s.status === 'in_transit' || s.status === 'out_for_delivery').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    alerts: shipments.filter(s => s.status === 'incident' || s.status === 'returned').length,
  }), [shipments]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-cyan-100 pb-20">
      
      {/* --- Header --- */}
      <div className="px-8 py-8 md:py-10 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3 mb-2">
              <span className="h-2 w-2 rounded-full bg-[#00F2FF] animate-pulse shadow-[0_0_10px_#00F2FF]"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Gestión Logística</span>
          </div>
          <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] pr-2 py-1">Envíos</span>
          </h1>
          <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed">
              Centro de monitoreo y seguimiento de despachos en tiempo real.
          </p>
      </div>

      <main className="px-8 max-w-[1600px] mx-auto space-y-10">
        
        {/* --- KPI Stats --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
                { label: 'Envíos Activos', val: stats.total, icon: <Package/>, color: 'text-slate-600', bg: 'bg-slate-100' },
                { label: 'En Camino', val: stats.transit, icon: <Truck/>, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Entregados', val: stats.delivered, icon: <CheckCircle2/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Alertas', val: stats.alerts, icon: <AlertCircle/>, color: 'text-rose-600', bg: 'bg-rose-50' },
            ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className={`h-14 w-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                        {stat.icon}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-1"><AnimatedNumber value={stat.val} type="simple" /></h3>
                    </div>
                </div>
            ))}
        </div>

        {/* --- Control Bar --- */}
        <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-4">
                {/* Centered Workflow Menu */}
                <div className="p-1.5 bg-white border border-slate-200 rounded-full shadow-xl shadow-slate-200/50 flex items-center relative z-10 overflow-x-auto max-w-full">
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'label_generated', label: 'Guía' },
                        { id: 'in_transit', label: 'Tránsito' },
                        { id: 'out_for_delivery', label: 'Reparto' },
                        { id: 'delivered', label: 'Entregado' },
                        { id: 'incident', label: 'Incidencia' }
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`relative px-6 py-3 rounded-full text-xs font-black uppercase tracking-wide transition-all duration-300 z-10 whitespace-nowrap ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                {isActive && (
                                    <motion.div layoutId="shippingTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                )}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Guía Icon Button */}
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsGuideOpen(true)}
                    className="h-12 w-12 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-[#004D4D] hover:bg-[#004D4D] hover:text-white transition-all group shrink-0"
                >
                    <Info size={20} className="group-hover:animate-pulse"/>
                </motion.button>
            </div>

            <div className="w-full flex justify-between items-center bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                 <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar por guía, cliente o ID..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-transparent text-sm font-medium outline-none"
                    />
                 </div>
                 
                 <div className="flex items-center gap-1 relative">
                     {/* Overlay de Cierre */}
                     {(isFilterMenuOpen || isDateMenuOpen) && <div className="fixed inset-0 z-40" onClick={() => { setIsFilterMenuOpen(false); setIsDateMenuOpen(false); }} />}

                     {/* Botón Filtros */}
                     <div className="relative z-50">
                        <motion.button 
                            layout
                            onMouseEnter={() => setIsFilterHovered(true)}
                            onMouseLeave={() => setIsFilterHovered(false)}
                            onClick={() => { setIsFilterMenuOpen(!isFilterMenuOpen); setIsDateMenuOpen(false); }}
                            className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isFilterMenuOpen ? 'bg-[#004D4D] text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-500 hover:text-[#004D4D] hover:bg-[#004D4D]/5'}`}
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
                                    initial={{ opacity: 0, y: filteredShipments.length === 0 ? -10 : 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: filteredShipments.length === 0 ? -10 : 10, scale: 0.95 }}
                                    className={`absolute ${filteredShipments.length === 0 ? 'bottom-full mb-4' : 'top-full mt-2'} right-0 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 w-[280px] z-50 origin-top-right overflow-hidden`}
                                >
                                    <div className="flex flex-col">
                                        {[
                                            { id: 'transp', label: 'Transportadora', icon: <Truck size={16}/>, options: ['all', ...carriers], key: 'carrier' },
                                            { id: 'est', label: 'Estado Detallado', icon: <Activity size={16}/>, options: ['all', 'label_generated', 'in_transit', 'out_for_delivery', 'delivered', 'incident'], key: 'status' }
                                        ].map((s) => (
                                            <div key={s.id} className="border-b border-slate-50 last:border-none">
                                                <button onClick={() => setActiveAccordion(activeAccordion === s.id ? null : s.id)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left">
                                                    <div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${activeAccordion === s.id ? 'bg-[#004D4D] text-white' : 'bg-slate-100 text-slate-500'}`}>{s.icon}</div><span className="text-[10px] font-black uppercase text-slate-700">{s.label}</span></div>
                                                    <ChevronRight size={14} className={`text-slate-300 transition-transform ${activeAccordion === s.id ? 'rotate-90' : ''}`}/>
                                                </button>
                                                <AnimatePresence>{activeAccordion === s.id && (
                                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-slate-50/30 px-4 pb-4 flex flex-wrap gap-2 pt-2">
                                                        {s.options.map(o => (<button key={o} onClick={() => setAdvancedFilters({...advancedFilters, [s.key]: o})} className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase transition-all ${advancedFilters[s.key as keyof typeof advancedFilters] === o ? 'bg-[#004D4D] text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>{o === 'all' ? 'Todos' : o.replace('_', ' ')}</button>))}
                                                    </motion.div>
                                                )}</AnimatePresence>
                                            </div>
                                        ))}
                                        <div className="p-4 bg-slate-50"><button onClick={() => { setAdvancedFilters({carrier: 'all', status: 'all'}); setIsFilterMenuOpen(false); }} className="w-full py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase">Limpiar Filtros</button></div>
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
                            <motion.div layout><CalendarIcon size={18}/></motion.div>
                            <AnimatePresence mode="popLayout">
                                {isDateHovered && (
                                    <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Fecha</motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                        <AnimatePresence>
                            {isDateMenuOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: filteredShipments.length === 0 ? -10 : 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: filteredShipments.length === 0 ? -10 : 10, scale: 0.95 }}
                                    className={`absolute ${filteredShipments.length === 0 ? 'bottom-full mb-4' : 'top-full mt-2'} right-0 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 w-[300px] z-50 origin-top-right`}
                                >
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Desde</label><input type="date" value={dateRangeState.from} onChange={e => setDateRangeState({...dateRangeState, from: e.target.value})} className="w-full bg-slate-50 border rounded-xl p-2 text-[10px] font-bold outline-none" /></div>
                                            <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase">Hasta</label><input type="date" value={dateRangeState.to} onChange={e => setDateRangeState({...dateRangeState, to: e.target.value})} className="w-full bg-slate-50 border rounded-xl p-2 text-[10px] font-bold outline-none" /></div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {['today', 'yesterday', 'week', 'month'].map(p => (<button key={p} onClick={() => handleDatePreset(p as any)} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-500">{p === 'week' ? '7 Días' : p === 'month' ? 'Mes' : p}</button>))}
                                        </div>
                                        <div className="pt-4 border-t flex flex-col gap-2">
                                            <button onClick={() => setIsDateMenuOpen(false)} className="w-full py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase">Aplicar</button>
                                            <button onClick={() => { setDateRangeState({from: '', to: ''}); setIsDateMenuOpen(false); }} className="w-full py-2 text-slate-400 text-[9px] font-black uppercase">Limpiar</button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                     </div>

                     {/* Botón Exportar */}
                     <motion.button 
                        layout
                        onMouseEnter={() => setIsExportHovered(true)}
                        onMouseLeave={() => setIsExportHovered(false)}
                        onClick={handleExportExcel}
                        className="h-12 flex items-center gap-2 px-4 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:text-[#004D4D] hover:bg-[#004D4D]/5 transition-all shadow-sm"
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
        </div>

        {/* --- Data Table --- */}
        <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            <th className="p-8">Información de Envío</th>
                            <th className="p-8">Destinatario</th>
                            <th className="p-8 text-center">Transportadora</th>
                            <th className="p-8 text-center">Estado</th>
                            <th className="p-8 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredShipments.map((shp) => (
                            <tr key={shp.id} onClick={() => setSelectedShipment(shp)} className="group hover:bg-slate-50/80 transition-all cursor-pointer">
                                <td className="p-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#004D4D] group-hover:scale-110 transition-transform">
                                            <Box size={20}/>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900">{shp.id}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Pedido {shp.order_id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-8">
                                    <p className="text-sm font-bold text-slate-700">{shp.customer.name}</p>
                                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1"><MapPin size={10}/> {shp.customer.city}</p>
                                </td>
                                <td className="p-8 text-center">
                                    <p className="text-sm font-black text-[#004D4D] uppercase italic tracking-tighter">{shp.carrier}</p>
                                    <p className="text-[10px] text-cyan-600 font-bold mt-1">#{shp.tracking_number}</p>
                                </td>
                                <td className="p-8 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        {getStatusInfo(shp.status)?.icon}
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusInfo(shp.status)?.color}`}>
                                            {getStatusInfo(shp.status)?.label}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-8 text-right">
                                    <button className="p-2 text-slate-300 group-hover:text-[#004D4D] transition-colors">
                                        <ChevronRight size={24}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {filteredShipments.length === 0 && (
                <div className="p-20 text-center text-slate-300">
                    <Truck size={48} className="mx-auto opacity-20 mb-4"/>
                    <p className="text-lg font-bold">No hay envíos que coincidan</p>
                </div>
            )}
        </div>
      </main>

      {/* --- Side Panel Detail --- */}
      <AnimatePresence>
        {selectedShipment && (
            <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedShipment(null)} className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[200]" />
                <motion.div 
                    initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-[210] border-l border-slate-100 flex flex-col"
                >
                    <div className="p-8 bg-[#004D4D] text-white flex justify-between items-start shrink-0">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">Estado de Rastreo Real-Time</span>
                            </div>
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter">{selectedShipment.id}</h2>
                            <p className="text-[10px] text-white/60 font-medium uppercase mt-1">Transportadora: {selectedShipment.carrier} | Guía: {selectedShipment.tracking_number}</p>
                        </div>
                        <button onClick={() => setSelectedShipment(null)} className="h-10 w-10 rounded-full bg-white/10 hover:bg-rose-500 transition-all flex items-center justify-center"><X size={20}/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-[#FAFAFA]">
                        {/* Customer Card */}
                        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative group/card">
                            <div className="flex justify-between items-center">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <User size={14}/> Datos de Entrega
                                    </h3>
                                    <div className="space-y-2">
                                        <p className="text-lg font-black text-slate-900">{selectedShipment.customer.name}</p>
                                        <p className="text-sm font-medium text-slate-500">{selectedShipment.customer.address}</p>
                                        <p className="text-sm font-bold text-[#004D4D]">{selectedShipment.customer.city}, Colombia</p>
                                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600"><Smartphone size={14}/> {selectedShipment.customer.phone}</div>
                                        </div>
                                    </div>
                                </div>
                                {/* Client Insight Button */}
                                <div className="absolute right-20 top-1/2 -translate-y-1/2">
                                    <motion.button
                                        whileHover={{ scale: 1.05, backgroundColor: '#004D4D', color: '#fff', boxShadow: '0 20px 40px rgba(0,77,77,0.2)' }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setIsCustomerViewOpen(true)}
                                        className="h-32 w-32 rounded-[2.5rem] bg-slate-50 text-[#004D4D] border border-slate-100 flex items-center justify-center shadow-xl transition-all group/btn"
                                        title="Ver Perfil Inteligente"
                                    >
                                        <User size={56} className="group-hover/btn:animate-pulse" />
                                    </motion.button>
                                </div>
                            </div>
                        </section>

                        {/* Logistics Timeline */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="relative flex items-center justify-center">
                                    <motion.div 
                                        animate={{ 
                                            scale: [1, 1.5, 1],
                                            opacity: [0.3, 0.6, 0.3]
                                        }}
                                        transition={{ 
                                            duration: 2, 
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                        className="absolute h-6 w-6 bg-emerald-400 rounded-full blur-md"
                                    />
                                    <motion.div
                                        animate={{ 
                                            scale: [1, 1.2, 1]
                                        }}
                                        transition={{ 
                                            duration: 0.8, 
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                        className="relative z-10 text-emerald-500"
                                    >
                                        <Activity size={16}/>
                                    </motion.div>
                                </div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Línea de Tiempo Logística</h3>
                            </div>
                            
                            <div className="relative space-y-8 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                {selectedShipment.history.map((log, i) => (
                                    <div key={i} className="flex gap-6 relative">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center z-10 relative ${i === 0 ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-200' : 'bg-white border-2 border-slate-300 text-slate-600'}`}>
                                            {i === 0 && (
                                                <motion.div 
                                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                    className="absolute inset-0 bg-cyan-400 rounded-full blur-sm"
                                                />
                                            )}
                                            <div className="relative z-10 flex items-center justify-center">
                                                {i === 0 ? <Activity size={14} color="white" /> : <Clock size={14}/>}
                                            </div>
                                        </div>
                                        <div>
                                            <p className={`text-xs font-black ${i === 0 ? 'text-slate-900' : 'text-slate-500'}`}>{log.message}</p>
                                            <p className={`text-[10px] font-bold mt-0.5 uppercase tracking-tighter ${i === 0 ? 'text-[#004D4D]' : 'text-slate-400'}`}>{log.location}</p>
                                            <p className="text-[9px] text-slate-400 mt-1">{new Date(log.date).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="p-8 border-t border-slate-100 bg-white grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => handlePrintLabel(selectedShipment)}
                            className="py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-all"
                        >
                            <Printer size={16}/> Imprimir Guía
                        </button>
                        <button 
                            onClick={() => {
                                const url = getTrackingUrl(selectedShipment.carrier, selectedShipment.tracking_number);
                                if (url !== "#") window.open(url, '_blank');
                                else showToast("Rastreo no disponible", "info");
                            }}
                            className="py-4 bg-[#004D4D] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-cyan-900/20 hover:bg-black transition-all"
                        >
                            <Map size={16} className="text-cyan-400"/> Rastrear API
                        </button>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      {/* --- Customer Intelligence Modal --- */}
      <AnimatePresence>
        {isCustomerViewOpen && selectedShipment && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[500] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4"
            >
                <motion.div 
                    initial={{ scale: 0.9, x: 100, opacity: 0 }} 
                    animate={{ scale: 1, x: 0, opacity: 1 }} 
                    exit={{ scale: 0.9, x: 100, opacity: 0 }}
                    className="relative bg-[#FAFAFA] w-full max-w-6xl h-[90vh] rounded-[3.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/20"
                >
                    {/* Close Button */}
                    <button 
                        onClick={() => setIsCustomerViewOpen(false)}
                        className="absolute top-8 right-8 z-[510] h-12 w-12 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all hover:rotate-90"
                    >
                        <X size={20}/>
                    </button>

                    {/* Left Sidebar: Basic Info & Loyalty */}
                    <div className="w-full md:w-[350px] bg-white border-r border-slate-100 p-10 flex flex-col items-center text-center space-y-8">
                        <div className="relative">
                            <div className="h-32 w-32 rounded-[2.5rem] bg-gradient-to-br from-[#004D4D] to-cyan-500 flex items-center justify-center text-white text-4xl font-black shadow-2xl">
                                {selectedShipment.customer.name.charAt(0)}
                            </div>
                            <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white shadow-lg">
                                <Zap size={16} fill="currentColor"/>
                            </div>
                        </div>
                        
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedShipment.customer.name}</h2>
                            <p className="text-sm font-medium text-cyan-600 mb-3">{selectedShipment.customer.email}</p>
                            
                            <div className="flex flex-col gap-2 items-center">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                                    Premium Member
                                </div>
                                <div className={`inline-flex items-center gap-2 px-4 py-1.5 border rounded-full text-[9px] font-black uppercase tracking-widest ${selectedShipment.order_id.includes('7825') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-cyan-50 text-cyan-600 border-cyan-100'}`}>
                                    {selectedShipment.order_id.includes('7825') ? 'Socio Mayorista' : 'Consumidor Final'}
                                </div>
                            </div>
                        </div>

                        <div className="w-full grid grid-cols-2 gap-4 py-6 border-y border-slate-50">
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Edad</p>
                                <p className="text-lg font-black text-slate-900">28 Años</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Club Puntos</p>
                                <p className="text-lg font-black text-emerald-600">1,250</p>
                            </div>
                        </div>

                        <div className="w-full space-y-4 text-left">
                            <div className="flex items-center gap-4 text-slate-600">
                                <Smartphone size={18} className="text-slate-400"/>
                                <span className="text-sm font-bold">{selectedShipment.customer.phone}</span>
                            </div>
                            <div className="flex items-center gap-4 text-slate-600">
                                <MapPin size={18} className="text-slate-400"/>
                                <span className="text-xs font-medium leading-tight">{selectedShipment.customer.address}, {selectedShipment.customer.city}</span>
                            </div>
                        </div>

                        {/* Customer Spend Trend Graph */}
                        <div className="w-full pt-6 border-t border-slate-50 space-y-4">
                            <div className="flex justify-between items-end">
                                <div className="text-left">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gasto Mensual</p>
                                    <p className="text-lg font-black text-slate-900">$450,000</p>
                                </div>
                                <div className="flex items-center gap-1 text-emerald-500 font-black text-[10px]">
                                    <TrendingUp size={12}/> +15%
                                </div>
                            </div>
                            <div className="flex items-end justify-between h-16 gap-1 px-2">
                                {[30, 45, 25, 60, 80, 100].map((h, i) => (
                                    <div key={i} className="w-full bg-slate-50 rounded-t-md relative overflow-hidden group">
                                        <motion.div 
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h}%` }}
                                            className={`absolute bottom-0 w-full rounded-t-md ${i === 5 ? 'bg-cyan-500' : 'bg-slate-200'}`}
                                        ></motion.div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Últimos 6 meses</p>
                        </div>
                    </div>

                    {/* Right Content: Insights & Analytics */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
                        {/* Summary Header */}
                        <div className="flex justify-between items-end pr-16">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Customer <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004D4D] to-cyan-500">Intelligence</span></h3>
                                <p className="text-slate-400 text-sm font-medium mt-1">Análisis de comportamiento y patrones de compra.</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Última Actividad</p>
                                <p className="text-sm font-black text-slate-900">{new Date(selectedShipment.last_update).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Bento Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Behavioral Box */}
                            <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Globe size={14}/> Comportamiento en Sitio</h4>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="p-4 bg-slate-50 rounded-2xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Tiempo/Sitio</p>
                                        <p className="text-lg font-black text-slate-900 mt-1">12m 45s</p>
                                    </div>
                                    <div className="p-4 bg-cyan-50 rounded-2xl overflow-hidden">
                                        <p className="text-[9px] font-black text-cyan-600 uppercase">Cupones</p>
                                        <p className="text-sm font-black text-cyan-700 mt-1 truncate">WELCOME10</p>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-2xl overflow-hidden">
                                        <p className="text-[9px] font-black text-emerald-600 uppercase">Tipo Cliente</p>
                                        <p className="text-sm font-black text-emerald-700 mt-1 truncate">Recurrente</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Búsquedas Recientes</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['Zapatillas Nike', 'Camisetas Oversize', 'Gorra Black', 'Calzado Deportivo'].map(tag => (
                                            <span key={tag} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Tech Stack Box */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Smartphone size={14}/> Tecnología</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Smartphone size={16} className="text-emerald-500"/>
                                            <span className="text-xs font-bold text-slate-700">Mobile</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-900">70%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                        <div className="h-full bg-emerald-500" style={{ width: '70%' }}></div>
                                        <div className="h-full bg-[#004D4D]" style={{ width: '30%' }}></div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Globe size={16} className="text-[#004D4D]"/>
                                            <span className="text-xs font-bold text-slate-700">Desktop</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-900">30%</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium italic mt-4 text-center border-t pt-4">Dispositivo: iPhone 15 Pro</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- Logistics Mastery Guide Modal --- */}
      <AnimatePresence>
        {isGuideOpen && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIsGuideOpen(false)}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 30 }}
                    className="relative bg-white w-full max-w-4xl h-[70vh] rounded-[3rem] shadow-2xl overflow-hidden border border-white flex flex-col md:flex-row"
                >
                    {/* Navigation Sidebar */}
                    <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-2 overflow-y-auto">
                        <div className="mb-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004D4D]">Maestría Logística</h3>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">Guía Operativa Bayup</p>
                        </div>
                        {Object.entries(guideContent).map(([key, item]) => (
                            <button
                                key={key}
                                onClick={() => setActiveGuideTab(key)}
                                className={`flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${activeGuideTab === key ? 'bg-[#004D4D] text-white shadow-lg' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
                            >
                                <div className={`${activeGuideTab === key ? 'text-white' : item.color}`}>
                                    {item.icon}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-wide">{item.title}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-white">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0">
                            <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center ${guideContent[activeGuideTab as keyof typeof guideContent].color}`}>
                                    {guideContent[activeGuideTab as keyof typeof guideContent].icon}
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                                    {guideContent[activeGuideTab as keyof typeof guideContent].title}
                                </h2>
                            </div>
                            <button onClick={() => setIsGuideOpen(false)} className="h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                                <X size={20}/>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                            <section>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="h-1 w-4 bg-[#004D4D] rounded-full"></div> ¿Qué significa?
                                </h4>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                                    {guideContent[activeGuideTab as keyof typeof guideContent].howItWorks}
                                </p>
                            </section>

                            <div className="grid md:grid-cols-2 gap-8">
                                <section className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Smartphone size={14} className="text-cyan-500"/> Ejemplo de Operación
                                    </h4>
                                    <div className="p-6 bg-cyan-50/30 border border-cyan-100 rounded-[2rem]">
                                        <p className="text-xs font-medium text-cyan-900 leading-relaxed italic">
                                            "{guideContent[activeGuideTab as keyof typeof guideContent].example}"
                                        </p>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Zap size={14} className="text-amber-500"/> Tip de Experto
                                    </h4>
                                    <div className="p-6 bg-amber-50/30 border border-amber-100 rounded-[2rem]">
                                        <p className="text-xs font-bold text-amber-900 leading-relaxed">
                                            {guideContent[activeGuideTab as keyof typeof guideContent].tip}
                                        </p>
                                    </div>
                                </section>
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-50 flex justify-end bg-slate-50/30">
                            <button 
                                onClick={() => setIsGuideOpen(false)}
                                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all"
                            >
                                ¡Entendido, a despachar!
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
