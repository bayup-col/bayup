"use client";

import { useState, useMemo, useRef, MouseEvent, useEffect } from 'react';
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";
import { 
  Search,
  Filter,
  MoreHorizontal,
  ChevronRight,
  X,
  CheckCircle2,
  MessageSquare,
  Clock, 
  AlertCircle, 
  ArrowUpDown,
  Download,
  FileText,
  DollarSign,
  BarChart3,
  Info,
  Zap,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  User,
  MapPin,
  Mail,
  Smartphone,
  Printer,
  Send,
  Edit3,
  Trash2,
  Plus,
  Copy,
  Clock3,
  Eye,
  Layout,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

// --- COMPONENTE DE NÚMEROS ANIMADOS (Shared style) ---
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

// --- Types ---
type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'expired' | 'declined';

interface QuoteItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface Quotation {
  id: string;
  folio: string;
  customer: {
    name: string;
    company: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
  status: QuoteStatus;
  date: string;
  expiryDate: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
  templateId: string;
}

interface MetricData {
    id: string;
    title: string;
    value: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
    icon: any;
    color: string;
    bg: string;
    description: string;
    detailContent?: React.ReactNode;
}

// --- Mock Data ---
const MOCK_QUOTATIONS: Quotation[] = [
  {
    id: "q1",
    folio: "COT-992",
    customer: { name: "Juan Perez", company: "Constructora S.A.", email: "juan@constructora.com", phone: "+57 300 456 7890", address: "Calle 100 #15-20", city: "Bogotá" },
    status: "sent",
    date: "2026-01-28T10:00:00",
    expiryDate: "2026-02-15T23:59:59",
    items: [{ id: "1", name: "Servicio de Consultoría Pro", price: 4500000, qty: 1 }],
    subtotal: 4500000,
    tax: 0,
    total: 4500000,
    notes: "Propuesta para el proyecto de infraestructura fase 1.",
    templateId: "t1"
  },
  {
    id: "q2",
    folio: "COT-991",
    customer: { name: "Ana Maria", company: "Inversiones Global", email: "ana@global.com", phone: "+57 311 222 3344", address: "Av. Siempre Viva 742", city: "Medellín" },
    status: "accepted",
    date: "2026-01-25T14:30:00",
    expiryDate: "2026-02-10T23:59:59",
    items: [{ id: "2", name: "Kit de Equipamiento Oficina", price: 1200000, qty: 1 }],
    subtotal: 1200000,
    tax: 0,
    total: 1200000,
    notes: "Descuento por volumen aplicado.",
    templateId: "t2"
  }
];

// --- Components (Redesigned matching Orders) ---

const TiltCard = ({ data, onClick }: { data: MetricData, onClick: () => void }) => {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        x.set(e.clientX - rect.left / rect.width - 0.5);
        y.set(e.clientY - rect.top / rect.height - 0.5);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { x.set(0); y.set(0); }}
            onClick={onClick}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative h-full cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className={`relative h-full bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:shadow-cyan-900/5 overflow-hidden`}>
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${data.bg} opacity-20 rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700`}></div>
                <div className="relative z-10 flex flex-col h-full justify-between" style={{ transform: "translateZ(20px)" }}>
                    <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-2xl ${data.bg} ${data.color} shadow-sm`}>
                            {data.icon}
                        </div>
                        {data.trend && (
                             <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wide ${data.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {data.trendUp ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                                {data.trend}
                             </div>
                        )}
                    </div>
                    <div className="mt-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{data.title}</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{data.value}</h3>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const StatusBadge = ({ status }: { status: QuoteStatus }) => {
  const styles = {
    draft: "bg-slate-100 text-slate-600 border-slate-200",
    sent: "bg-blue-50 text-blue-700 border-blue-200",
    accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
    expired: "bg-rose-50 text-rose-700 border-rose-200",
    declined: "bg-amber-50 text-amber-700 border-amber-200",
  };
  
  const labels = {
    draft: "Borrador",
    sent: "Enviada",
    accepted: "Aceptada",
    expired: "Vencida",
    declined: "Rechazada",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default function CotizacionesPage() {
  const { showToast } = useToast();
  const { token } = useAuth();
  
  // States
  const [quotations, setQuotations] = useState<Quotation[]>(MOCK_QUOTATIONS);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState({ clientType: 'all', status: 'all' });
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [dateRangeState, setDateRangeState] = useState({ from: '', to: '' });
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] = useState<any | null>(null);
  
  // Hover states for UI buttons
  const [isFilterHovered, setIsFilterHovered] = useState(false);
  const [isDateHovered, setIsDateHovered] = useState(false);
  const [isExportHovered, setIsExportHovered] = useState(false);

  const guideContent = {
    all: {
        title: 'Gestión Total',
        icon: <Layout size={20}/>,
        color: 'text-blue-500',
        howItWorks: 'Visualiza el ciclo completo de tus propuestas comerciales, desde borradores hasta aceptaciones.',
        example: 'Ideal para tener un panorama de cuántas ventas potenciales tienes en el pipeline este mes.',
        tip: 'Mantén los folios organizados para facilitar la búsqueda legal posterior.'
    },
    draft: {
        title: 'Borradores',
        icon: <Edit3 size={20}/>,
        color: 'text-slate-500',
        howItWorks: 'Propuestas en construcción que aún no han sido enviadas al cliente.',
        example: 'Estás armando un presupuesto complejo; guárdalo aquí y termínalo mañana.',
        tip: 'Usa el escáner IA para acelerar la creación de borradores basados en tus PDFs viejos.'
    },
    sent: {
        title: 'Enviadas',
        icon: <Send size={20}/>,
        color: 'text-blue-500',
        howItWorks: 'Cotizaciones que ya están en manos del cliente y esperan respuesta.',
        example: 'El cliente recibió el link por WhatsApp y el sistema marca que ya fue "Enviada".',
        tip: 'Si una cotización lleva 3 días en este estado, realiza un seguimiento manual.'
    },
    accepted: {
        title: 'Aceptadas',
        icon: <CheckCircle2 size={20}/>,
        color: 'text-emerald-500',
        howItWorks: 'El éxito comercial. El cliente aprobó el presupuesto y está lista para convertirse en venta.',
        example: 'Haz clic en "Convertir a Venta" para que el stock se descuente automáticamente.',
        tip: 'Felicita al cliente de inmediato para fortalecer la relación post-venta.'
    }
  };
  
  const handleDatePreset = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
      const today = new Date();
      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      let start = new Date();
      let end = new Date();

      switch (preset) {
          case 'today': break;
          case 'yesterday': start.setDate(today.getDate() - 1); end.setDate(today.getDate() - 1); break;
          case 'week': start.setDate(today.getDate() - 7); break;
          case 'month': start = new Date(today.getFullYear(), today.getMonth(), 1); break;
      }
      setDateRangeState({ from: formatDate(start), to: formatDate(end) });
  };

  const handleExport = async () => {
    try {
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        const petrol = [0, 77, 77];
        doc.setFillColor(petrol[0], petrol[1], petrol[2]);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setFontSize(22); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold");
        doc.text("REPORTE DE COTIZACIONES", 14, 20);
        doc.save(`Reporte_Cotizaciones_${new Date().toISOString().split('T')[0]}.pdf`);
        showToast("Reporte generado con éxito", "success");
    } catch (e) { console.error(e); }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  // KPIs matching the Orders module style
  const kpiData = useMemo(() => [
    {
        id: 'quotes_today',
        title: 'Cotizaciones Hoy',
        value: <AnimatedNumber value={12} type="simple" />,
        trend: '+5% vs ayer',
        trendUp: true,
        icon: <FileText size={20}/>,
        color: 'text-cyan-600',
        bg: 'from-cyan-50 to-emerald-50',
        description: 'Total de propuestas comerciales generadas durante el día de hoy.'
    },
    {
        id: 'volume_total',
        title: 'Volumen Total',
        value: <AnimatedNumber value={5700000} />,
        trend: '+12% este mes',
        trendUp: true,
        icon: <DollarSign size={20}/>,
        color: 'text-emerald-600',
        bg: 'from-emerald-50 to-teal-50',
        description: 'Valor monetario total de todas las cotizaciones activas en el sistema.'
    },
    {
        id: 'conversion_rate',
        title: 'Tasa de Cierre',
        value: <AnimatedNumber value={68} type="percentage" />,
        trend: '+2% vs mes anterior',
        trendUp: true,
        icon: <BarChart3 size={20}/>,
        color: 'text-[#004D4D]',
        bg: 'from-teal-50 to-cyan-50',
        description: 'Porcentaje de cotizaciones que se convierten en ventas reales.'
    },
    {
        id: 'pending_followup',
        title: 'Por Vencer',
        value: <div className="flex items-baseline gap-1"><AnimatedNumber value={3} type="simple"/> <span className="text-sm">Quotes</span></div>,
        icon: <Clock3 size={20}/>,
        color: 'text-rose-600',
        bg: 'from-rose-50 to-orange-50',
        description: 'Propuestas comerciales que expiran en las próximas 48 horas.'
    }
  ], []);

  const filteredQuotes = useMemo(() => {
    return quotations.filter(q => {
      const matchesSearch = 
        q.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.customer.company.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotations, searchTerm, statusFilter]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-cyan-100">
      
      {/* --- Main Header (Copy from Orders) --- */}
      <div className="px-8 py-8 md:py-10 max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
              <div className="flex items-center gap-3 mb-2">
                  <span className="h-2 w-2 rounded-full bg-[#00F2FF] animate-pulse shadow-[0_0_10px_#00F2FF]"></span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Gestión Comercial</span>
              </div>
              <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] pr-2 py-1">Cotizaciones</span>
              </h1>
              <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed">
                  Crea propuestas profesionales y convierte prospectos en clientes con inteligencia comercial.
              </p>
          </div>
          <div className="flex items-center gap-4">
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsGeneratorOpen(true)}
                className="bg-[#004D4D] text-white px-8 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center gap-3"
              >
                <Plus size={18} /> Nueva Cotización
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-white border border-slate-200 text-[#004D4D] px-8 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all flex items-center gap-3"
              >
                <Zap size={18} /> Nuevo Formato (IA)
              </motion.button>
          </div>
      </div>

      <main className="px-8 pb-8 max-w-[1600px] mx-auto space-y-8">
        
        {/* --- KPI Cards (Tilt Effect) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-48">
          {kpiData.map((data) => (
            <TiltCard key={data.id} data={data} onClick={() => {}} />
          ))}
        </div>

        {/* --- WORKFLOW NAVIGATION (Centered & Connected) --- */}
        <div className="flex flex-col items-center justify-center space-y-6 pt-4">
            <div className="flex items-center gap-4">
                <div className="p-1.5 bg-white border border-slate-200 rounded-full shadow-xl shadow-slate-200/50 flex items-center relative z-10">
                    {[
                        { id: 'all', label: 'Todas' },
                        { id: 'draft', label: 'Borradores' },
                        { id: 'sent', label: 'Enviadas' },
                        { id: 'accepted', label: 'Aceptadas' },
                        { id: 'expired', label: 'Vencidas' },
                        { id: 'templates', label: 'Mis Formatos' }
                    ].map((tab) => {
                        const isActive = statusFilter === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id)}
                                className={`relative px-6 py-3 rounded-full text-xs font-black uppercase tracking-wide transition-all duration-300 z-10 ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabQuote"
                                        className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsGuideOpen(true)}
                    className="h-12 w-12 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-900 hover:bg-[#004D4D] hover:text-white transition-all group"
                >
                    <Info size={20} className="group-hover:animate-pulse"/>
                </motion.button>
            </div>

            {/* Action Row */}
            <div className="w-full flex justify-between items-center bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                 <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar cotización, cliente o folio..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-transparent text-sm font-medium text-slate-700 outline-none"
                    />
                 </div>
                 <div className="flex items-center gap-2 relative">
                     {/* Overlay de Cierre */}
                     {(isFilterMenuOpen || isDateMenuOpen) && <div className="fixed inset-0 z-40" onClick={() => { setIsFilterMenuOpen(false); setIsDateMenuOpen(false); }} />}

                     <div className="relative z-50">
                        <motion.button 
                            onMouseEnter={() => setIsFilterHovered(true)}
                            onMouseLeave={() => setIsFilterHovered(false)}
                            onClick={() => { setIsFilterMenuOpen(!isFilterMenuOpen); setIsDateMenuOpen(false); }}
                            className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isFilterMenuOpen ? 'bg-[#004D4D] text-white shadow-lg' : 'text-slate-500 hover:text-[#004D4D] hover:bg-[#004D4D]/5'}`}
                        >
                            <Filter size={18}/>
                            <AnimatePresence>
                                {isFilterHovered && (
                                    <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Filtro</motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                        
                        <AnimatePresence>
                            {isFilterMenuOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 w-[300px] z-50 origin-top-right overflow-hidden"
                                >
                                    <div className="flex flex-col">
                                        {[
                                            { id: 'status', label: 'Estado Propuesta', icon: <Clock size={16}/>, options: ['all', 'draft', 'sent', 'accepted', 'expired'], key: 'status' },
                                            { id: 'client', label: 'Tipo de Cliente', icon: <User size={16}/>, options: ['all', 'empresa', 'persona'], key: 'clientType' }
                                        ].map((section) => (
                                            <div key={section.id} className="border-b border-slate-50 last:border-none">
                                                <button 
                                                    onClick={() => setActiveAccordion(activeAccordion === section.id ? null : section.id)}
                                                    className={`w-full flex items-center justify-between p-4 transition-colors hover:bg-slate-50 ${activeAccordion === section.id ? 'bg-slate-50/50' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${activeAccordion === section.id ? 'bg-[#004D4D] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                            {section.icon}
                                                        </div>
                                                        <span className="text-xs font-black uppercase tracking-wide text-slate-700">{section.label}</span>
                                                    </div>
                                                    <ChevronRight size={16} className={`text-slate-300 transition-transform ${activeAccordion === section.id ? 'rotate-90' : ''}`}/>
                                                </button>
                                                
                                                <AnimatePresence>
                                                    {activeAccordion === section.id && (
                                                        <motion.div 
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden bg-slate-50/30 px-4 pb-4"
                                                        >
                                                            <div className="flex flex-wrap gap-2 pt-2">
                                                                {section.options.map(opt => (
                                                                    <button 
                                                                        key={opt}
                                                                        onClick={() => setAdvancedFilters({...advancedFilters, [section.key]: opt})}
                                                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${advancedFilters[section.key as keyof typeof advancedFilters] === opt ? 'bg-[#004D4D] text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-[#004D4D]'}`}
                                                                    >
                                                                        {opt === 'all' ? 'Todos' : opt}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ))}
                                        <div className="p-4 bg-slate-50">
                                            <button 
                                                onClick={() => { setAdvancedFilters({clientType: 'all', status: 'all'}); setIsFilterMenuOpen(false); setActiveAccordion(null); }}
                                                className="w-full py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-slate-900/10 hover:bg-black transition-all"
                                            >
                                                Limpiar Filtros
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                     </div>

                     <div className="relative z-50">
                        <motion.button 
                            onMouseEnter={() => setIsDateHovered(true)}
                            onMouseLeave={() => setIsDateHovered(false)}
                            onClick={() => { setIsDateMenuOpen(!isDateMenuOpen); setIsFilterMenuOpen(false); }}
                            className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isDateMenuOpen ? 'bg-[#004D4D] text-white shadow-lg' : 'text-slate-500 hover:text-[#004D4D] hover:bg-[#004D4D]/5'}`}
                        >
                            <CalendarIcon size={18}/>
                            <AnimatePresence mode="popLayout">
                                {isDateHovered && (
                                    <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Fecha</motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>

                        <AnimatePresence>
                            {isDateMenuOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-6 w-[320px] z-50 origin-top-right"
                                >
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Desde</label>
                                                <input type="date" value={dateRangeState.from} onChange={(e) => setDateRangeState({ ...dateRangeState, from: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-[#004D4D]"/>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hasta</label>
                                                <input type="date" value={dateRangeState.to} onChange={(e) => setDateRangeState({ ...dateRangeState, to: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-[#004D4D]"/>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button onClick={() => handleDatePreset('today')} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 transition-colors">Hoy</button>
                                            <button onClick={() => handleDatePreset('yesterday')} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 transition-colors">Ayer</button>
                                            <button onClick={() => handleDatePreset('week')} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 transition-colors">Esta Semana</button>
                                            <button onClick={() => handleDatePreset('month')} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 transition-colors">Este Mes</button>
                                        </div>
                                        <button onClick={() => setIsDateMenuOpen(false)} className="w-full py-2.5 bg-[#004D4D] text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-[#004D4D]/20 flex items-center justify-center gap-2">
                                            <Download size={14}/> Aplicar
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                     </div>

                     <motion.button 
                        onMouseEnter={() => setIsExportHovered(true)}
                        onMouseLeave={() => setIsExportHovered(false)}
                        onClick={handleExport}
                        className="h-12 flex items-center gap-2 px-4 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:text-[#004D4D] hover:bg-[#004D4D]/5 transition-all shadow-sm"
                     >
                        <Download size={18}/>
                        <AnimatePresence>
                            {isExportHovered && (
                                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Exportar</motion.span>
                            )}
                        </AnimatePresence>
                     </motion.button>
                 </div>
            </div>
        </div>

        {/* --- Dynamic Content Area (Table or Templates) --- */}
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {statusFilter !== 'templates' ? (
              <motion.div 
                key="table-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-wider">
                        <th className="p-6">Folio</th>
                        <th className="p-6">Cliente / Empresa</th>
                        <th className="p-6">Fecha Emisión</th>
                        <th className="p-6">Vencimiento</th>
                        <th className="p-6">Estado</th>
                        <th className="p-6 text-right">Total</th>
                        <th className="p-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredQuotes.map((q) => (
                        <tr 
                          key={q.id} 
                          onClick={() => setSelectedQuote(q)}
                          className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                        >
                          <td className="p-6">
                            <span className="font-black text-slate-900 group-hover:text-[#004D4D] transition-colors text-sm">#{q.folio}</span>
                          </td>
                          <td className="p-6">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900">{q.customer.name}</span>
                              <span className="text-xs text-slate-400 font-medium">{q.customer.company}</span>
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="text-xs font-medium text-slate-500">
                              {new Date(q.date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                              <Clock size={12}/>
                              {new Date(q.expiryDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-6">
                            <StatusBadge status={q.status} />
                          </td>
                          <td className="p-6 text-right">
                            <span className="text-sm font-black text-slate-900">{formatCurrency(q.total)}</span>
                          </td>
                          <td className="p-6 text-right">
                            <button className="p-2 text-slate-300 hover:text-cyan-600 hover:bg-cyan-50 rounded-full transition-all opacity-0 group-hover:opacity-100">
                              <ChevronRight size={20} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="templates-view"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {[
                  { id: 't1', name: 'Corporativo Bayup', desc: 'Diseño ultra-premium con tipografía técnica.', color: 'from-slate-900 to-slate-800' },
                  { id: 't2', name: 'Retail Moderno', desc: 'Enfocado en visibilidad de productos y kits.', color: 'from-[#004D4D] to-[#001A1A]' },
                  { id: 't3', name: 'Minimal Crystal', desc: 'Estilo glassmorphism para servicios digitales.', color: 'from-cyan-500 to-blue-600' }
                ].map((template) => (
                  <motion.div 
                    key={template.id}
                    whileHover={{ y: -10 }}
                    className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between h-[300px]"
                    onClick={() => setSelectedTemplateForPreview(template)}
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${template.color} opacity-10 rounded-bl-[4rem] -mr-8 -mt-8`}></div>
                    
                    <div>
                      <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${template.color} flex items-center justify-center text-white mb-6 shadow-lg`}>
                        <Layout size={24}/>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">{template.name}</h3>
                      <p className="text-sm text-slate-400 font-medium mt-2 leading-relaxed">{template.desc}</p>
                    </div>

                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-50">
                      <button className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-2">
                        <Trash2 size={14}/> Eliminar
                      </button>
                      <span className="text-[#004D4D] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        Seleccionar <ChevronRight size={14}/>
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* --- Right Panel (Quotation Details) --- */}
      <AnimatePresence>
        {selectedQuote && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedQuote(null)} className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[200]" />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-[210] flex flex-col border-l border-slate-200"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-black text-slate-900">#{selectedQuote.folio}</h2>
                    <StatusBadge status={selectedQuote.status} />
                  </div>
                  <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                    <CalendarIcon size={14}/> Emitido el {new Date(selectedQuote.date).toLocaleDateString()}
                  </p>
                </div>
                <button onClick={() => setSelectedQuote(null)} className="p-2 hover:bg-slate-200/50 rounded-full transition-colors text-slate-500">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Actions Grid */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { icon: <Eye size={20}/>, label: 'Previsualizar', color: 'hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-600' },
                    { icon: <Download size={20}/>, label: 'PDF', color: 'hover:border-[#004D4D] hover:bg-[#004D4D]/5 hover:text-[#004D4D]' },
                    { icon: <Smartphone size={20}/>, label: 'WhatsApp', color: 'hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600' },
                    { icon: <Trash2 size={20}/>, label: 'Eliminar', color: 'hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600' },
                  ].map((btn, i) => (
                    <motion.button key={i} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className={`flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 transition-all gap-2 group shadow-sm ${btn.color}`}>
                      <div className="text-slate-400 group-hover:text-inherit transition-colors">{btn.icon}</div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 group-hover:text-inherit">{btn.label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Info Sections */}
                <div className="grid grid-cols-2 gap-8">
                  <section className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={14}/> Cliente</h3>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-sm font-bold text-slate-900">{selectedQuote.customer.name}</p>
                      <p className="text-xs text-[#004D4D] font-black mt-1 uppercase tracking-tighter">{selectedQuote.customer.company}</p>
                    </div>
                  </section>
                  <section className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={14}/> Validez</h3>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-sm font-bold text-rose-600 italic">Vence: {new Date(selectedQuote.expiryDate).toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase mt-1 tracking-widest">Quedan 12 días</p>
                    </div>
                  </section>
                </div>

                {/* Items Table */}
                <section className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Resumen de Servicios</h3>
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                        <tr><th className="p-4">Descripción</th><th className="p-4 text-center">Cant</th><th className="p-4 text-right">Precio</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {selectedQuote.items.map(item => (
                          <tr key={item.id}><td className="p-4 text-slate-900 font-bold">{item.name}</td><td className="p-4 text-center text-slate-500">{item.qty}</td><td className="p-4 text-right text-slate-900">{formatCurrency(item.price)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Total Box */}
                <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex items-center justify-between shadow-xl">
                    <div><p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">Monto Total Propuesta</p><p className="text-4xl font-black mt-1 italic">{formatCurrency(selectedQuote.total)}</p></div>
                    <div className="h-16 w-16 rounded-3xl bg-white/10 flex items-center justify-center text-[#00F2FF] border border-white/10 shadow-inner"><DollarSign size={32}/></div>
                </section>
              </div>

              <div className="p-6 border-t border-slate-200 bg-white flex gap-4">
                <button className="flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all"><CheckCircle2 size={16}/> Aprobar y Convertir a Venta</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- IA Scanner Modal (Redesigned) --- */}
      <AnimatePresence>
        {isCreateModalOpen && (
            // ... (Creation modal code)
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-white">
                    <div className="p-10 bg-gradient-to-br from-[#004D4D] to-[#001A1A] text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg"><Zap size={32} className="text-[#00F2FF]" /></div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-white/60 hover:text-white transition-colors"><X size={24} /></button>
                        </div>
                        <div className="relative z-10 mt-8">
                            <h2 className="text-3xl font-black tracking-tighter uppercase italic">Escáner de Formatos IA</h2>
                            <p className="text-white/60 text-sm font-bold uppercase tracking-widest mt-1 text-cyan-400">Ingeniería Documental Pro</p>
                        </div>
                    </div>
                    <div className="p-10 space-y-8">
                        <label className="border-2 border-dashed border-slate-100 rounded-[2.5rem] p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-cyan-50/30 hover:border-cyan-200 transition-all group">
                            <FileText size={48} className="text-slate-300 group-hover:text-[#004D4D] transition-colors" />
                            <p className="text-sm font-black text-slate-900 mt-4 uppercase">Arrastra tu PDF actual</p>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Nuestra IA imitará tu estilo visual</p>
                        </label>
                        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                            <Info size={20} className="text-amber-600 mt-0.5" />
                            <p className="text-xs text-amber-900 font-medium leading-relaxed italic">Sube tu formato actual. El sistema extraerá logos, tipografías y tablas para crear una versión digital ultra-potenciada.</p>
                        </div>
                        <button className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all">Iniciar Procesamiento IA</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* --- Template Preview & Edit Modal --- */}
      <AnimatePresence>
        {selectedTemplateForPreview && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTemplateForPreview(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="relative bg-[#FAFAFA] w-full max-w-5xl h-[85vh] rounded-[3.5rem] shadow-2xl overflow-hidden border border-white flex flex-col md:flex-row"
            >
              {/* Left Side: Mock Invoice Preview */}
              <div className="flex-1 bg-white p-10 overflow-y-auto custom-scrollbar">
                <div className="border-[12px] border-slate-50 rounded-[2rem] p-8 min-h-full shadow-inner flex flex-col space-y-8">
                  {/* Mock Invoice Header */}
                  <div className="flex justify-between items-start">
                    <div className="text-2xl font-black italic text-[#004D4D]">BAYUP</div>
                    <div className="text-right"><h4 className="text-xl font-black uppercase">COTIZACIÓN</h4><p className="text-xs text-slate-400 font-bold tracking-widest">FOLIO: #0001</p></div>
                  </div>
                  <div className="h-[1px] w-full bg-slate-100"></div>
                  <div className="grid grid-cols-2 gap-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <div><p>Emisor</p><p className="text-slate-900 font-black text-sm mt-1">Tu Empresa Bayup</p></div>
                    <div className="text-right"><p>Cliente</p><p className="text-slate-900 font-black text-sm mt-1">Nombre del Cliente</p></div>
                  </div>
                  <div className="flex-1 bg-slate-50/50 rounded-2xl p-6 border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-2">
                    <Palette size={32} className="text-slate-300"/>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Previsualización del Formato: {selectedTemplateForPreview.name}</p>
                  </div>
                  <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Total a Pagar</p>
                    <p className="text-4xl font-black text-[#004D4D] italic">$ 0.00</p>
                  </div>
                </div>
              </div>

              {/* Right Side: Settings & Actions */}
              <div className="w-full md:w-[380px] bg-slate-50 border-l border-slate-100 p-10 flex flex-col justify-between">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Editor de <br/> <span className="text-[#004D4D]">Formato</span></h3>
                    <p className="text-xs text-slate-400 font-medium mt-2">Configura la estética de este template.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Color de Acento</label>
                      <div className="flex gap-2">
                        {['bg-[#004D4D]', 'bg-cyan-500', 'bg-slate-900', 'bg-rose-500'].map(c => (
                          <div key={c} className={`h-8 w-8 rounded-full ${c} cursor-pointer border-2 border-white shadow-sm hover:scale-110 transition-transform`}></div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipografía</label>
                      <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#004D4D]">
                        <option>Inter (Moderno)</option>
                        <option>Playfair Display (Elegante)</option>
                        <option>Space Mono (Técnico)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full py-4 bg-[#004D4D] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all">Guardar Cambios</button>
                  <button onClick={() => setSelectedTemplateForPreview(null)} className="w-full py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-[#004D4D]">Cerrar Editor</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Workflow Guide Modal --- */}
      <AnimatePresence>
          {isGuideOpen && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
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
                              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004D4D]">Flujo Bayup</h3>
                              <p className="text-[10px] text-slate-400 font-bold mt-1">Guía de Cotizaciones</p>
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
                                      <div className="h-1 w-4 bg-[#004D4D] rounded-full"></div> ¿Cómo funciona?
                                  </h4>
                                  <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                                      {guideContent[activeGuideTab as keyof typeof guideContent].howItWorks}
                                  </p>
                              </section>

                              <div className="grid md:grid-cols-2 gap-8">
                                  <section className="space-y-4">
                                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                          <Smartphone size={14} className="text-cyan-500"/> Ejemplo Real
                                      </h4>
                                      <div className="p-6 bg-cyan-50/30 border border-cyan-100 rounded-[2rem]">
                                          <p className="text-xs font-medium text-cyan-900 leading-relaxed italic">
                                              "{guideContent[activeGuideTab as keyof typeof guideContent].example}"
                                          </p>
                                      </div>
                                  </section>

                                  <section className="space-y-4">
                                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                          <Zap size={14} className="text-amber-500"/> Bayup Pro-Tip
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
                                  Cerrar Guía
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