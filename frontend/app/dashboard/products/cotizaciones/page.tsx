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
  Palette,
  RefreshCw,
  Activity,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import TiltCard from '@/components/dashboard/TiltCard';

// --- Types ---
type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'expired' | 'declined';

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
  items: any[];
  total: number;
}

const MOCK_QUOTATIONS: Quotation[] = [
  {
    id: "q1",
    folio: "COT-992",
    customer: { name: "Juan Perez", company: "Constructora S.A.", email: "juan@constructora.com", phone: "+57 300 456 7890", address: "Calle 100 #15-20", city: "Bogotá" },
    status: "sent",
    date: "2026-01-28T10:00:00",
    expiryDate: "2026-02-15T23:59:59",
    items: [{ name: "Consultoría IT", qty: 1, price: 4500000 }],
    total: 4500000
  },
  {
    id: "q2",
    folio: "COT-991",
    customer: { name: "Ana Maria", company: "Inversiones Global", email: "ana@global.com", phone: "+57 311 222 3344", address: "Av. Siempre Viva 742", city: "Medellín" },
    status: "accepted",
    date: "2026-01-25T14:30:00",
    expiryDate: "2026-02-10T23:59:59",
    items: [{ name: "Equipos Oficina", qty: 1, price: 1200000 }],
    total: 1200000
  }
];

const StatusBadge = ({ status }: { status: QuoteStatus }) => {
  const styles = { draft: "bg-slate-100 text-slate-600 border-slate-200", sent: "bg-blue-50 text-blue-700 border-blue-200", accepted: "bg-emerald-50 text-emerald-700 border-emerald-200", expired: "bg-rose-50 text-rose-700 border-rose-200", declined: "bg-amber-50 text-amber-700 border-amber-200" };
  const labels = { draft: "Borrador", sent: "Enviada", accepted: "Aceptada", expired: "Vencida", declined: "Rechazada" };
  return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${styles[status]}`}>{labels[status]}</span>;
};

// --- MODAL DE GUÍA PREMIUM ---
const COTIZACIONES_GUIDE_CONTENT = {
    general: { title: 'Gestión Comercial', icon: <Layout size={20}/>, color: 'text-blue-500', howItWorks: 'Visualiza el ciclo completo de tus propuestas comerciales. Desde la captación del prospecto hasta el cierre de la venta.', example: 'Un cliente pregunta por WhatsApp; creas un borrador rápido y lo envías en menos de 2 minutos.', tip: 'El 70% de las ventas se cierran por la rapidez de respuesta.' },
    borradores: { title: 'Borradores', icon: <Edit3 size={20}/>, color: 'text-slate-500', howItWorks: 'Propuestas en construcción. Aquí puedes guardar ideas complejas antes de formalizarlas.', example: 'Estás diseñando un paquete de servicios a medida; guárdalo como borrador.', tip: 'No dejes borradores por más de 24 horas.' },
    enviadas: { title: 'Enviadas', icon: <Send size={20}/>, color: 'text-cyan-500', howItWorks: 'Cotizaciones que ya están en manos del cliente. El sistema rastrea aperturas.', example: 'El cliente recibe el link PDF. Si no responde en 48 horas, realiza seguimiento.', tip: 'Llama justo después de confirmar que el cliente abrió el PDF.' },
    aceptadas: { title: 'Aceptadas', icon: <CheckCircle2 size={20}/>, color: 'text-emerald-500', howItWorks: 'Éxito comercial. El cliente aprobó el presupuesto y está lista para facturarse.', example: 'Haz clic en "Convertir a Venta" para generar el pedido automáticamente.', tip: 'Pide un adelanto del pago de inmediato.' }
};

const CotizacionesGuideModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState('general');
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative bg-white w-full max-w-4xl h-[70vh] rounded-[3rem] shadow-2xl overflow-hidden border border-white flex flex-col md:flex-row">
                        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-2 overflow-y-auto">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004D4D] mb-6">Estrategia Comercial</h3>
                            {Object.entries(COTIZACIONES_GUIDE_CONTENT).map(([key, item]) => (
                                <button key={key} onClick={() => setActiveTab(key)} className={`flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${activeTab === key ? 'bg-[#004D4D] text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}>
                                    <div className={`${activeTab === key ? 'text-white' : item.color}`}>{item.icon}</div>
                                    <span className="text-[10px] font-black uppercase tracking-wide">{item.title}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 flex flex-col overflow-hidden bg-white">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className={`h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center ${COTIZACIONES_GUIDE_CONTENT[activeTab as keyof typeof COTIZACIONES_GUIDE_CONTENT].color}`}>{COTIZACIONES_GUIDE_CONTENT[activeTab as keyof typeof COTIZACIONES_GUIDE_CONTENT].icon}</div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase italic">{COTIZACIONES_GUIDE_CONTENT[activeTab as keyof typeof COTIZACIONES_GUIDE_CONTENT].title}</h2>
                                </div>
                                <button onClick={onClose} className="h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"><X size={20}/></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                                <section><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><div className="h-1 w-4 bg-[#004D4D] rounded-full"></div> ¿Cómo funciona?</h4><p className="text-sm font-medium text-slate-600 bg-slate-50 p-6 rounded-[2rem]">{COTIZACIONES_GUIDE_CONTENT[activeTab as keyof typeof COTIZACIONES_GUIDE_CONTENT].howItWorks}</p></section>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <section className="space-y-4"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Smartphone size={14} className="text-cyan-500"/> Ejemplo</h4><div className="p-6 bg-cyan-50/30 border border-cyan-100 rounded-[2rem]"><p className="text-xs font-medium text-cyan-900 italic">"{COTIZACIONES_GUIDE_CONTENT[activeTab as keyof typeof COTIZACIONES_GUIDE_CONTENT].example}"</p></div></section>
                                    <section className="space-y-4"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap size={14} className="text-amber-500"/> Pro-Tip</h4><div className="p-6 bg-amber-50/30 border border-amber-100 rounded-[2rem]"><p className="text-xs font-bold text-amber-900">{COTIZACIONES_GUIDE_CONTENT[activeTab as keyof typeof COTIZACIONES_GUIDE_CONTENT].tip}</p></div></section>
                                </div>
                            </div>
                            <div className="p-8 border-t border-slate-50 flex justify-end"><button onClick={onClose} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">Cerrar Guía</button></div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- MODAL GENERADOR DE COTIZACIONES ---
const QuoteGeneratorModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault(); setIsLoading(true);
        setTimeout(() => { setIsLoading(false); onClose(); showToast("¡Cotización #COT-1025 generada con éxito! 📄", "success"); }, 2000);
    };
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-3xl rounded-[4rem] shadow-3xl overflow-hidden relative border border-white/20 z-10 flex flex-col max-h-[90vh]">
                        <div className="bg-[#004d4d] p-10 text-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-6"><div className="h-16 w-16 bg-[#00f2ff] text-[#004d4d] rounded-2xl flex items-center justify-center shadow-lg"><FileText size={32} /></div><div><h2 className="text-2xl font-black uppercase tracking-tight">Nueva Cotización</h2><p className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest">Editor de Propuestas</p></div></div>
                            <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-10 flex-1 overflow-y-auto bg-white space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Cliente</label><input type="text" required className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" placeholder="Ej: Juan Perez" /></div>
                                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Empresa</label><input type="text" className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" placeholder="Opcional" /></div>
                            </div>
                            <div className="space-y-4"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Items</label><div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex gap-4"><input type="text" placeholder="Producto o Servicio..." className="flex-1 p-4 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-[#00f2ff]/50"/><button type="button" className="px-6 bg-[#004d4d] text-white rounded-xl font-black text-[10px] uppercase">Añadir</button></div></div>
                            <button type="submit" disabled={isLoading} className="w-full py-5 bg-[#004d4d] text-white rounded-[1.5rem] font-black uppercase text-[10px] shadow-2xl flex items-center justify-center gap-3">{isLoading ? <RefreshCw size={18} className="animate-spin"/> : <CheckCircle2 size={18} className="text-[#00f2ff]"/>} {isLoading ? 'Generando...' : 'Crear Cotización'}</button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- MODAL ESCÁNER IA ---
const IAScannerModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const { showToast } = useToast();
    const [isScanning, setIsScanning] = useState(false);
    const handleScan = () => {
        setIsScanning(true);
        setTimeout(() => { setIsScanning(false); onClose(); showToast("¡Formato analizado! Nuevo template 'Bayup Pro' creado. ✨", "success"); }, 3000);
    };
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                    <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-white">
                        <div className="p-10 bg-gradient-to-br from-[#004D4D] to-[#001A1A] text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10"><Zap size={120} /></div>
                            <div className="relative z-10 flex justify-between items-start"><div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center"><Zap size={32} className="text-[#00F2FF]" /></div><button onClick={onClose} className="text-white/60 hover:text-white"><X size={24} /></button></div>
                            <div className="relative z-10 mt-8"><h2 className="text-3xl font-black uppercase italic">Escáner IA</h2><p className="text-white/60 text-sm font-bold uppercase mt-1">Ingeniería Documental Pro</p></div>
                        </div>
                        <div className="p-10 space-y-8 bg-white">
                            <div className="border-2 border-dashed border-slate-100 rounded-[2.5rem] p-12 flex flex-col items-center justify-center relative overflow-hidden">
                                {isScanning && <motion.div initial={{ top: '-10%' }} animate={{ top: '110%' }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute left-0 right-0 h-1 bg-[#00F2FF] shadow-[0_0_15px_#00F2FF] z-20"/>}
                                <FileText size={48} className="text-slate-200" /><p className="text-xs font-black text-slate-400 mt-4 uppercase">Sube tu PDF antiguo</p>
                            </div>
                            <button onClick={handleScan} disabled={isScanning} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-[10px] shadow-xl flex items-center justify-center gap-3">{isScanning ? <RefreshCw size={18} className="animate-spin"/> : <Zap size={18} className="text-[#00F2FF]"/>} {isScanning ? 'Escaneando...' : 'Iniciar Escáner IA'}</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- MODAL DE DETALLE DE MÉTRICA ---
const CotizacionesMetricModal = ({ isOpen, onClose, metric }: { isOpen: boolean, onClose: () => void, metric: any }) => {
    if (!metric) return null;
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-lg rounded-[4rem] shadow-3xl overflow-hidden relative border border-white/20 z-10">
                        <div className={`p-10 text-white relative overflow-hidden ${metric.color.replace('text-', 'bg-')}`}>
                            <div className="absolute top-0 right-0 p-6 opacity-10">{metric.icon}</div>
                            <h2 className="text-3xl font-black uppercase tracking-tight relative z-10">{metric.title}</h2>
                            <button onClick={onClose} className="absolute top-8 right-8 bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-10 space-y-8 bg-white">
                            <div className="text-center py-6"><span className="text-5xl font-black text-gray-900 italic">{metric.value}</span><p className="text-[10px] font-black text-gray-400 uppercase mt-4">Rendimiento Comercial</p></div>
                            <button onClick={onClose} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Cerrar</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default function CotizacionesPage() {
  const { showToast } = useToast();
  const { token } = useAuth();
  const router = useRouter();
  
  const [quotations, setQuotations] = useState<Quotation[]>(MOCK_QUOTATIONS);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [selectedKPI, setSelectedKPI] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [dateRangeState, setDateRangeState] = useState({ from: '', to: '' });
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  const kpiData = [
    { id: 'q_t', title: 'Cotizaciones Hoy', value: '12', trend: '+5% vs ayer', icon: <FileText size={20}/>, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { id: 'v_t', title: 'Volumen Total', value: '$ 5.7M', trend: '+12% mes', icon: <DollarSign size={20}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'c_r', title: 'Tasa de Cierre', value: '68%', trend: '+2% mes', icon: <BarChart3 size={20}/>, color: 'text-[#004D4D]', bg: 'bg-[#004D4D]/5' },
    { id: 'p_f', title: 'Por Vencer', value: '03', trend: 'Crítico', icon: <Clock3 size={20}/>, color: 'text-rose-600', bg: 'bg-rose-50' }
  ];

  const handleDatePreset = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
      const today = new Date();
      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      let start = new Date(); let end = new Date();
      switch (preset) {
          case 'today': break;
          case 'yesterday': start.setDate(today.getDate() - 1); end.setDate(today.getDate() - 1); break;
          case 'week': start.setDate(today.getDate() - 7); break;
          case 'month': start = new Date(today.getFullYear(), today.getMonth(), 1); break;
      }
      setDateRangeState({ from: formatDate(start), to: formatDate(end) });
  };

  const handleExportPDF = async () => {
    try {
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        const petrol = [0, 77, 77];
        doc.setFillColor(petrol[0], petrol[1], petrol[2]); doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.text("REPORTE DE COTIZACIONES", 15, 20);
        doc.setFontSize(10); doc.text(`Generado: ${new Date().toLocaleString()} | Items: ${filteredQuotes.length}`, 15, 30);
        let y = 55;
        doc.setFillColor(245, 245, 245); doc.rect(14, y-6, 185, 8, 'F'); doc.setTextColor(0, 0, 0); doc.text("FOLIO", 16, y); doc.text("CLIENTE", 50, y); doc.text("TOTAL", 170, y);
        y += 10;
        filteredQuotes.forEach(q => { doc.text(`#${q.folio}`, 16, y); doc.text(q.customer.name, 50, y); doc.text(`$ ${q.total.toLocaleString()}`, 170, y); y += 8; });
        doc.save(`Reporte_Cotizaciones.pdf`);
        showToast("PDF Exportado ✨", "success");
    } catch (e) { console.error(e); }
  };

  const handleCopyLink = (q: Quotation) => {
    navigator.clipboard.writeText(`https://bayup.col/view/quote/${q.id}`);
    showToast("Link copiado 🔗", "success");
  };

  const handleDownloadSinglePDF = async (q: Quotation) => {
    try {
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        const petrol = [0, 77, 77];
        doc.setFillColor(petrol[0], petrol[1], petrol[2]); doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(24); doc.text("BAYUP", 15, 20);
        doc.setFontSize(10); doc.text(`COTIZACIÓN: #${q.folio}`, 15, 30);
        doc.setTextColor(0, 0, 0); doc.text(`Cliente: ${q.customer.name}`, 15, 50); doc.text(`Empresa: ${q.customer.company}`, 15, 56);
        doc.setFont("helvetica", "bold"); doc.text("TOTAL PROPUESTA:", 110, 100); doc.text(`$ ${q.total.toLocaleString()}`, 160, 100);
        doc.save(`Cotizacion_${q.folio}.pdf`);
        
        // Avanzar el proceso
        if (q.status === 'draft') {
            setQuotations(quotations.map(item => item.id === q.id ? { ...item, status: 'sent' } : item));
            setSelectedQuote({ ...q, status: 'sent' });
        }
        showToast("PDF generado y estado actualizado 📄", "success");
    } catch (e) { console.error(e); }
  };

  const handleWhatsAppQuote = (q: Quotation) => {
    const msg = `¡Hola ${q.customer.name}! 👋 Te envío la cotización #${q.folio} por un valor de $ ${q.total.toLocaleString()}. Puedes ver el detalle aquí: https://bayup.col/q/${q.id}`;
    window.open(`https://wa.me/${q.customer.phone.replace(/\+/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    
    // Avanzar el proceso
    if (q.status === 'draft') {
        setQuotations(quotations.map(item => item.id === q.id ? { ...item, status: 'sent' } : item));
        setSelectedQuote({ ...q, status: 'sent' });
    }
    showToast("Cotización enviada por WhatsApp 📲", "success");
  };

  const handleDeleteQuote = (id: string) => {
    if (confirm("¿Eliminar cotización?")) { setQuotations(quotations.filter(q => q.id !== id)); setSelectedQuote(null); showToast("Cotización eliminada 🗑️", "info"); }
  };

  const handleAcceptQuote = (q: Quotation) => {
    setQuotations(quotations.map(item => item.id === q.id ? { ...item, status: 'accepted' } : item));
    setSelectedQuote({ ...q, status: 'accepted' });
    showToast("¡Cotización aprobada! 🚀", "success");
  };

  const filteredQuotes = useMemo(() => {
    return quotations.filter(q => {
      const matchesSearch = q.folio.toLowerCase().includes(searchTerm.toLowerCase()) || q.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotations, searchTerm, statusFilter]);

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-1000 relative">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
          <div>
              <div className="flex items-center gap-3 mb-2"><span className="h-2 w-2 rounded-full bg-[#00F2FF] animate-pulse shadow-[0_0_10px_#00F2FF]"></span><span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Gestión Comercial</span></div>
              <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">Cotiza <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">Ciones</span></h1>
              <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">Crea propuestas profesionales y convierte prospectos en clientes.</p>
          </div>
          <div className="flex items-center gap-4">
              <button onClick={() => setIsGeneratorOpen(true)} className="h-14 px-8 bg-[#004D4D] text-white rounded-[1.5rem] font-black text-[10px] uppercase shadow-xl flex items-center gap-3 hover:scale-105 transition-all"><Plus size={18}/> Nueva Cotización</button>
              <button onClick={() => setIsCreateModalOpen(true)} className="h-14 px-8 bg-white border border-gray-100 text-[#004D4D] rounded-[1.5rem] font-black text-[10px] uppercase shadow-sm hover:shadow-lg flex items-center gap-3 transition-all"><Zap size={18} className="text-[#00F2FF]"/> Formato IA</button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
          {kpiData.map((kpi, i) => (
              <TiltCard key={i} className="h-full">
                  <div onClick={() => setSelectedKPI(kpi)} className="bg-white/95 p-8 rounded-[2.5rem] border border-white shadow-xl flex flex-col justify-between h-full group transition-all cursor-pointer">
                      <div className="flex justify-between items-start">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${kpi.bg} ${kpi.color} shadow-inner group-hover:scale-110 transition-transform`}>{kpi.icon}</div>
                          <span className="text-[10px] font-black px-3 py-1 bg-gray-50 text-gray-400 rounded-lg uppercase tracking-widest">{kpi.trend}</span>
                      </div>
                      <div className="mt-6"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.title}</p><h3 className="text-3xl font-black text-gray-900 mt-1">{kpi.value}</h3></div>
                  </div>
              </TiltCard>
          ))}
      </div>

      <div className="flex flex-col items-center justify-center space-y-6 pt-4">
            <div className="flex items-center gap-4">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl flex items-center relative">
                    {[ { id: 'all', label: 'Todas' }, { id: 'draft', label: 'Borradores' }, { id: 'sent', label: 'Enviadas' }, { id: 'accepted', label: 'Aceptadas' } ].map((tab) => {
                        const isActive = statusFilter === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setStatusFilter(tab.id)} className={`relative px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}>
                                {isActive && <motion.div layoutId="activeTabQuote" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
                <button onClick={() => setIsGuideOpen(true)} className="h-12 w-12 rounded-full bg-white border border-gray-100 text-[#004d4d] flex items-center justify-center hover:scale-110 hover:bg-[#004d4d] hover:text-white transition-all shadow-xl"><Info size={20} /></button>
            </div>
            <div className="w-full flex justify-between items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm mx-4 relative">
                 <div className="relative w-full max-w-md"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-transparent text-sm font-bold outline-none"/></div>
                 <div className="flex items-center gap-2 pr-2">
                     <div className="relative"><button onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className={`h-12 w-12 flex items-center justify-center rounded-xl transition-all ${isFilterMenuOpen ? 'bg-[#004D4D] text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-400'}`}><Filter size={18}/></button>
                        {isFilterMenuOpen && (<div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 w-48 z-50 animate-in fade-in zoom-in-95">{['Todas', 'Borradores', 'Enviadas', 'Aceptadas', 'Vencidas'].map((f) => (<button key={f} onClick={() => setIsFilterMenuOpen(false)} className="w-full text-left px-4 py-2 text-[9px] font-black uppercase text-gray-500 hover:bg-gray-50 rounded-lg">{f}</button>))}</div>)}</div>
                     <div className="relative"><button onClick={() => setIsDateMenuOpen(!isDateMenuOpen)} className={`h-12 w-12 flex items-center justify-center rounded-xl transition-all ${isDateMenuOpen ? 'bg-[#004D4D] text-white shadow-lg' : 'bg-white border border-gray-100 text-gray-400'}`}><CalendarIcon size={18}/></button>
                        {isDateMenuOpen && (<div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-64 z-50 animate-in fade-in zoom-in-95 space-y-4"><div className="grid grid-cols-2 gap-2"><div className="space-y-1"><label className="text-[8px] font-black text-gray-400 uppercase">Desde</label><input type="date" value={dateRangeState.from} onChange={e => setDateRangeState({...dateRangeState, from: e.target.value})} className="w-full p-2 bg-gray-50 rounded-lg text-[10px] font-bold outline-none"/></div><div className="space-y-1"><label className="text-[8px] font-black text-gray-400 uppercase">Hasta</label><input type="date" value={dateRangeState.to} onChange={e => setDateRangeState({...dateRangeState, to: e.target.value})} className="w-full p-2 bg-gray-50 rounded-lg text-[10px] font-bold outline-none"/></div></div><div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">{['today', 'yesterday', 'week', 'month'].map(p => <button key={p} onClick={() => handleDatePreset(p as any)} className="px-2 py-1 bg-gray-50 hover:bg-gray-100 rounded text-[8px] font-black uppercase text-gray-500">{p}</button>)}</div><button onClick={() => setIsDateMenuOpen(false)} className="w-full py-2 bg-[#004D4D] text-white rounded-lg text-[9px] font-black uppercase">Aplicar Rango</button></div>)}</div>
                     <button onClick={handleExportPDF} className="h-12 w-12 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-emerald-600 transition-all"><Download size={18}/></button>
                 </div>
            </div>
      </div>

      <div className="px-4"><div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden"><table className="w-full text-left"><thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest"><tr><th className="p-6">Folio</th><th className="p-6">Cliente</th><th className="p-6">Estado</th><th className="p-6 text-right">Total</th><th className="p-6"></th></tr></thead><tbody className="divide-y divide-gray-50">{filteredQuotes.map((q) => (<tr key={q.id} onClick={() => setSelectedQuote(q)} className="group hover:bg-gray-50 transition-colors cursor-pointer"><td className="p-6 font-black text-sm text-[#004D4D]">#{q.folio}</td><td className="p-6"><p className="text-sm font-bold text-gray-900">{q.customer.name}</p><p className="text-[10px] text-gray-400 uppercase font-bold">{q.customer.company}</p></td><td className="p-6"><StatusBadge status={q.status} /></td><td className="p-6 text-right font-black text-sm text-gray-900">$ {q.total.toLocaleString()}</td><td className="p-6 text-right"><ChevronRight size={20} className="text-gray-300 ml-auto"/></td></tr>))}</tbody></table></div></div>

      <AnimatePresence>
        {selectedQuote && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedQuote(null)} className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[400]" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-[410] flex flex-col border-l border-slate-200">
              <div className="px-8 py-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50 shrink-0">
                <div><div className="flex items-center gap-3 mb-2"><h2 className="text-2xl font-black text-slate-900">#{selectedQuote.folio}</h2><StatusBadge status={selectedQuote.status} /></div><p className="text-sm text-slate-500 font-medium flex items-center gap-2"><CalendarIcon size={14}/> Emitida el {new Date(selectedQuote.date).toLocaleDateString()}</p></div>
                <button onClick={() => setSelectedQuote(null)} className="p-2 hover:bg-slate-200/50 rounded-full text-slate-500"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                <section className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                    <div className="flex justify-between items-center"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Activity size={14}/> Proceso de Cierre</h3><span className="bg-[#00F2FF]/10 text-[#004D4D] text-[8px] font-black px-3 py-1 rounded-full uppercase">{selectedQuote.status === 'accepted' ? 'Exitoso' : 'Interacción: 2 aperturas'}</span></div>
                    <div className="flex justify-between items-start relative px-2">
                        <div className="absolute top-4 left-8 right-8 h-0.5 bg-slate-200 -z-0"></div>
                        {[ { label: 'Emitida', s: 'done', icon: <FileText size={14}/> }, { label: 'Enviada', s: selectedQuote.status === 'draft' ? 'pending' : 'done', icon: <Send size={14}/> }, { label: 'Abierta', s: selectedQuote.status === 'sent' ? 'current' : 'done', icon: <Eye size={14}/> }, { label: 'Cierre', s: selectedQuote.status === 'accepted' ? 'done' : 'pending', icon: <CheckCircle2 size={14}/> } ].map((step, i) => (
                            <div key={i} className="flex flex-col items-center gap-3 relative z-10">
                                <div className={`h-9 w-9 rounded-2xl border-4 border-white shadow-md flex items-center justify-center transition-all ${step.s === 'done' ? 'bg-emerald-500 text-white' : step.s === 'current' ? 'bg-[#00F2FF] text-[#004D4D] animate-pulse scale-110' : 'bg-white text-slate-300'}`}>{step.icon}</div>
                                <span className={`text-[9px] font-black uppercase tracking-tight ${step.s === 'pending' ? 'text-slate-300' : 'text-slate-900'}`}>{step.label}</span>
                            </div>
                        ))}
                    </div>
                </section>
                <div className="grid grid-cols-4 gap-3">
                    <button onClick={() => handleCopyLink(selectedQuote)} className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 transition-all gap-2 group hover:bg-cyan-50 hover:border-cyan-400"><div className="text-slate-400 group-hover:text-cyan-600"><Eye size={20}/></div><span className="text-[9px] font-black uppercase tracking-wider text-slate-500 group-hover:text-cyan-700">Link</span></button>
                    <button onClick={() => handleDownloadSinglePDF(selectedQuote)} className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 transition-all gap-2 group hover:bg-[#004D4D]/5 hover:border-[#004D4D]"><div className="text-slate-400 group-hover:text-[#004D4D]"><Download size={20}/></div><span className="text-[9px] font-black uppercase tracking-wider text-slate-500 group-hover:text-[#004D4D]">PDF</span></button>
                    <button onClick={() => handleWhatsAppQuote(selectedQuote)} className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 transition-all gap-2 group hover:bg-emerald-50 hover:border-emerald-400"><div className="text-slate-400 group-hover:text-emerald-600"><Smartphone size={20}/></div><span className="text-[9px] font-black uppercase tracking-wider text-slate-500 group-hover:text-emerald-700">WhatsApp</span></button>
                    <button onClick={() => handleDeleteQuote(selectedQuote.id)} className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 transition-all gap-2 group hover:bg-rose-50 hover:border-rose-400"><div className="text-slate-400 group-hover:text-rose-600"><Trash2 size={20}/></div><span className="text-[9px] font-black uppercase tracking-wider text-slate-500 group-hover:text-rose-700">Eliminar</span></button>
                </div>
                <div className="grid grid-cols-2 gap-8"><section className="space-y-4"><h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={14}/> Cliente</h3><div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"><p className="text-sm font-bold text-slate-900">{selectedQuote.customer.name}</p><p className="text-[10px] text-[#004D4D] font-black mt-1 uppercase">{selectedQuote.customer.company}</p></div></section><section className="space-y-4"><h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={14}/> Validez</h3><div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"><p className="text-sm font-bold text-rose-600 italic">Vence: {new Date(selectedQuote.expiryDate).toLocaleDateString()}</p></div></section></div>
                <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex items-center justify-between shadow-xl"><div><p className="text-[10px] text-slate-400 uppercase font-black">Monto Total</p><p className="text-4xl font-black mt-1 italic">$ {selectedQuote.total.toLocaleString()}</p></div><div className="h-16 w-16 rounded-3xl bg-white/10 flex items-center justify-center text-[#00F2FF] border border-white/10"><DollarSign size={32}/></div></section>
              </div>
              <div className="p-6 border-t border-slate-200 bg-white flex gap-4"><button disabled={selectedQuote.status === 'accepted'} onClick={() => handleAcceptQuote(selectedQuote)} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${selectedQuote.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl'}`}><CheckCircle2 size={16}/> {selectedQuote.status === 'accepted' ? 'Aceptada' : 'Aprobar y Convertir a Venta'}</button></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CotizacionesMetricModal isOpen={!!selectedKPI} onClose={() => setSelectedKPI(null)} metric={selectedKPI} />
      <QuoteGeneratorModal isOpen={isGeneratorOpen} onClose={() => setIsGeneratorOpen(false)} />
      <CotizacionesGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <IAScannerModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
      `}</style>
    </div>
  );
}