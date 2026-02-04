"use client";

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  ChevronRight, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  TrendingUp, 
  User, 
  ShoppingBag, 
  MoreVertical, 
  MessageSquare, 
  FileText, 
  Zap, 
  ArrowRight,
  Camera,
  History,
  X,
  Package,
  ArrowUpRight,
  RefreshCcw,
    Truck, 
    Plus, 
    Layers,
    Smartphone, 
    Send, 
    Info,
    ShieldAlert,
    Bot,
    LayoutGrid
  } from 'lucide-react';
  
import { useToast } from "@/context/toast-context";
import TiltCard from '@/components/dashboard/TiltCard';
import ReturnsInfoModal from '@/components/dashboard/ReturnsInfoModal';
import ReturnsMetricModal from '@/components/dashboard/ReturnsMetricModal';
import { generateReturnsPDF } from '@/lib/returns-report';

// --- INTERFACES ---
interface WarrantyCase {
    id: string;
    customer: { name: string; phone: string; email: string; channel: string };
    product: { name: string; sku: string; image: string };
    order: { id: string; date: string; warehouse: string };
    status: 'received' | 'review' | 'approved' | 'rejected' | 'tech_support' | 'waiting_customer' | 'closed';
    entry_date: string;
    days_open: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    history: { date: string; status: string; user: string; comment: string }[];
}

// --- MOCK DATA ---
const MOCK_CASES: WarrantyCase[] = [
    {
        id: "GAR-1024",
        customer: { name: "Elena Rodriguez", phone: "+57 300 456 7890", email: "elena@email.com", channel: "WhatsApp" },
        product: { name: "Reloj Cronógrafo Gold", sku: "WA-GOLD-001", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200" },
        order: { id: "FAC-8240", date: "15 Ene 2026", warehouse: "Bodega Central" },
        status: 'review',
        entry_date: "2026-01-28T10:30:00",
        days_open: 4,
        priority: 'medium',
        history: [
            { date: "28 Ene, 10:30 AM", status: "Caso Recibido", user: "Sistema AI", comment: "Solicitud generada vía WhatsApp" },
            { date: "29 Ene, 02:15 PM", status: "En Revisión", user: "Carlos (Soporte)", comment: "Se solicita video de evidencia al cliente" }
        ]
    },
    {
        id: "GAR-1015",
        customer: { name: "Carlos Ruiz", phone: "+57 311 222 3344", email: "carlos@gmail.com", channel: "Web" },
        product: { name: "Zapatos Oxford Cuero", sku: "SH-OX-BR", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200" },
        order: { id: "FAC-8100", date: "10 Ene 2026", warehouse: "Sede Norte" },
        status: 'tech_support',
        entry_date: "2026-01-25T09:00:00",
        days_open: 7,
        priority: 'critical',
        history: [
            { date: "25 Ene, 09:00 AM", status: "Caso Recibido", user: "Sistema AI", comment: "Reporte de defecto en suela" }
        ]
    }
];

const STATUS_MAP = {
    received: { label: 'Recibido', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    review: { label: 'En Revisión', color: 'bg-amber-50 text-amber-600 border-amber-100' },
    approved: { label: 'Aprobado', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    rejected: { label: 'Rechazado', color: 'bg-rose-50 text-rose-600 border-rose-100' },
    tech_support: { label: 'Soporte Técnico', color: 'bg-purple-50 text-purple-600 border-purple-100' },
    waiting_customer: { label: 'Esperando Cliente', color: 'bg-gray-50 text-gray-500 border-gray-100' },
    closed: { label: 'Caso Cerrado', color: 'bg-[#004d4d] text-white border-[#004d4d]' }
};

export default function GarantiasPage() {
    const { showToast } = useToast();
    const [cases, setCases] = useState<WarrantyCase[]>(MOCK_CASES);
    const [selectedCase, setSelectedCase] = useState<WarrantyCase | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<'todos' | 'abiertos' | 'revision' | 'resueltos'>('todos');
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [selectedKPI, setSelectedKPI] = useState<any>(null);
    const [isCreatingCase, setIsCreatingCase] = useState(false);
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
    
    // UI States para Barra de Acción
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isDateHovered, setIsDateHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
    const [filterDateRange, setFilterDateRange] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [wizardStep, setWizardStep] = useState(1);
    const [internalComment, setInternalComment] = useState("");
    const [newCase, setNewCase] = useState({ orderId: '', reason: '', description: '' });

    const filteredCases = useMemo(() => {
        return cases.filter(c => {
            const matchesSearch = c.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 c.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 c.product.name.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (!matchesSearch) return false;

            // Filtro por Tab
            let matchesTab = true;
            if (activeTab === 'todos') matchesTab = true;
            else if (activeTab === 'abiertos') matchesTab = ['received', 'tech_support', 'waiting_customer'].includes(c.status);
            else if (activeTab === 'revision') matchesTab = c.status === 'review';
            else if (activeTab === 'resueltos') matchesTab = ['approved', 'rejected', 'closed'].includes(c.status);

            if (!matchesTab) return false;

            // Filtro por Prioridad
            if (filterPriority !== 'all' && c.priority !== filterPriority) return false;

            // Filtro por Fecha (Simulado)
            if (filterDateRange !== 'all') {
                const caseDate = new Date(c.entry_date);
                const now = new Date();
                if (filterDateRange === 'today') {
                    if (caseDate.toDateString() !== now.toDateString()) return false;
                } else if (filterDateRange === 'week') {
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    if (caseDate < weekAgo) return false;
                }
            }
            
            return true;
        });
    }, [searchTerm, activeTab, cases, filterPriority, filterDateRange]);

    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
            {[
                { label: 'Todos mis casos', value: '19', sub: 'Pendientes por resolver', icon: <ShieldAlert size={18}/>, color: 'text-[#004d4d]' },
                { label: 'Tiempo Prom.', value: '18h', sub: 'SLA de respuesta', icon: <Clock size={18}/>, color: 'text-blue-600' },
                { label: 'Tasa Retorno', value: '1.4%', sub: 'Impacto en inventario', icon: <TrendingUp size={18}/>, color: 'text-amber-600' },
                { label: 'Alertas Críticas', value: '03', sub: 'Requieren atención', icon: <AlertCircle size={18}/>, color: 'text-rose-600', pulse: true },
            ].map((kpi, i) => (
                <TiltCard key={i} onClick={() => setSelectedKPI(kpi)} className="h-full">
                    <div className="bg-white/95 p-8 rounded-[2.5rem] border border-white shadow-xl flex flex-col justify-between h-full group transition-all">
                        <div className="flex justify-between items-start">
                            <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                                {kpi.icon}
                            </div>
                            <span className="text-[10px] font-black px-2 py-1 bg-gray-50 text-gray-400 rounded-lg">Live</span>
                        </div>
                        <div className="mt-6">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                            <h3 className="text-xl font-black text-gray-900 mt-1">{kpi.value}</h3>
                            <p className="text-[9px] font-bold text-gray-400 mt-1 italic">{kpi.sub}</p>
                        </div>
                        {kpi.pulse && <div className="absolute top-6 right-6 h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#F43F5E]"></div>}
                    </div>
                </TiltCard>
            ))}
        </div>
    );

    const renderCreateCaseWizard = () => (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreatingCase(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-5xl h-[85vh] rounded-[4rem] shadow-3xl overflow-hidden flex flex-col relative z-10 border border-white/20">
                <div className="bg-gray-900 p-10 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><ShieldCheck size={200} /></div>
                    <button onClick={() => setIsCreatingCase(false)} className="absolute top-10 right-10 h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all z-20"><X size={24} /></button>
                    <div className="relative z-10 flex items-center gap-8">
                        <div className="h-20 w-20 rounded-[2rem] bg-[#00f2ff] text-[#001a1a] flex items-center justify-center text-3xl font-black shadow-[0_0_30px_rgba(0,242,255,0.3)]">{wizardStep}</div>
                        <div>
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter">Apertura de <span className="text-[#00f2ff]">Garantía Táctica</span></h3>
                            <div className="flex items-center gap-2 mt-3">
                                {[1, 2, 3].map(s => <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${wizardStep >= s ? 'w-12 bg-[#00f2ff]' : 'w-4 bg-white/10'}`} />)}
                                <span className="ml-4 text-[10px] font-black uppercase text-[#00f2ff]/60 tracking-widest">{wizardStep === 1 ? 'Pedido' : wizardStep === 2 ? 'Motivo' : 'Confirmación'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-12 md:p-16 custom-scrollbar bg-[#FAFAFA]">
                    <AnimatePresence mode="wait">
                        {wizardStep === 1 && (
                            <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-12">
                                <div className="text-center space-y-4">
                                    <h4 className="text-4xl font-black text-gray-900 tracking-tight uppercase italic">ID de Operación</h4>
                                    <p className="text-gray-500 font-medium">Ingresa el número de factura o pedido para sincronizar los datos del producto.</p>
                                </div>
                                <input type="text" value={newCase.orderId} onChange={(e) => setNewCase({...newCase, orderId: e.target.value})} placeholder="FAC-0000" className="w-full bg-white border-b-4 border-gray-100 p-8 text-3xl font-black text-gray-900 outline-none focus:border-[#00f2ff] text-center uppercase" />
                                <div className="flex justify-center"><button disabled={!newCase.orderId.trim()} onClick={() => setWizardStep(2)} className="px-16 py-5 bg-gray-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-3xl hover:scale-105 transition-all disabled:opacity-30">Siguiente: Definir Motivo</button></div>
                            </motion.div>
                        )}
                        {wizardStep === 2 && (
                            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                                <div className="text-center"><h4 className="text-3xl font-black text-gray-900 uppercase italic">Diagnóstico de Entrada</h4><p className="text-gray-500 font-medium mt-2">Selecciona la razón principal del reporte.</p></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { id: 'defecto', label: 'Defecto Fábrica', icon: <ShieldAlert size={24}/>, desc: 'Falla técnica de origen.' },
                                        { id: 'daño', label: 'Daño Logístico', icon: <Truck size={24}/>, desc: 'Producto golpeado en viaje.' },
                                        { id: 'talla', label: 'Talla/Color', icon: <Layers size={24}/>, desc: 'No le quedó al cliente.' },
                                        { id: 'error', label: 'Error Despacho', icon: <AlertCircle size={24}/>, desc: 'Se envió producto equivocado.' },
                                    ].map(r => (
                                        <button key={r.id} onClick={() => { setNewCase({...newCase, reason: r.label}); setWizardStep(3); }} className={`p-8 rounded-[3rem] border-2 transition-all text-left flex flex-col justify-between h-64 ${newCase.reason === r.label ? 'border-[#004d4d] bg-white shadow-2xl' : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm'}`}>
                                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-4 ${newCase.reason === r.label ? 'bg-[#004d4d] text-[#00f2ff]' : 'bg-gray-50 text-gray-400'}`}>{r.icon}</div>
                                            <div><h5 className="text-sm font-black text-gray-900 uppercase tracking-tight">{r.label}</h5><p className="text-[10px] text-gray-400 mt-2 font-medium leading-relaxed">{r.desc}</p></div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                        {wizardStep === 3 && (
                            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                                <div className="max-w-2xl mx-auto space-y-8">
                                    <div className="text-center space-y-4"><h4 className="text-3xl font-black text-gray-900 uppercase italic">Descripción & Confirmación</h4><p className="text-gray-500 font-medium">Detalla la inconsistencia detectada por el cliente.</p></div>
                                    <textarea value={newCase.description} onChange={(e) => setNewCase({...newCase, description: e.target.value})} placeholder="Escribe aquí los detalles del caso..." className="w-full bg-white border-2 border-gray-100 rounded-[2.5rem] p-8 text-sm font-bold text-gray-700 outline-none focus:border-[#004d4d] shadow-inner transition-all min-h-[150px] resize-none italic" />
                                    <div className="bg-gray-900 p-10 rounded-[3.5rem] text-white flex flex-col md:flex-row items-center gap-10">
                                        <div className="flex-1"><span className="text-[10px] font-black uppercase text-[#00f2ff] tracking-[0.3em]">IA Validation System</span><h5 className="text-2xl font-black italic uppercase mt-2">¿Confirmar Apertura?</h5></div>
                                        <button onClick={() => { 
                                            const caseId = `GAR-${Math.floor(Math.random() * 9000) + 1000}`;
                                            const caseObj: WarrantyCase = {
                                                id: caseId,
                                                customer: { name: "Cliente Nuevo", phone: "Sincronizando...", email: "cliente@nuevo.com", channel: "Web" },
                                                product: { name: "Producto en Verificación", sku: "SKU-AUTO", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200" },
                                                order: { id: newCase.orderId, date: new Date().toLocaleDateString(), warehouse: "Bodega Principal" },
                                                status: 'received',
                                                entry_date: new Date().toISOString(),
                                                days_open: 0,
                                                priority: 'medium',
                                                history: [{ date: "Hoy", status: "Caso Abierto", user: "Bayup Operator", comment: newCase.description }]
                                            };
                                            setCases(prev => [caseObj, ...prev]);
                                            setIsCreatingCase(false);
                                            showToast("Caso registrado en la Terminal Neural", "success");
                                        }} className="px-12 py-6 bg-[#00f2ff] text-gray-900 rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-[0_0_40px_rgba(0,242,255,0.3)] hover:bg-white transition-all">Activar Caso</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="p-8 bg-white border-t border-gray-100 flex justify-between items-center px-16">
                    <button onClick={() => wizardStep > 1 && setWizardStep(wizardStep - 1)} className={`text-[10px] font-black uppercase tracking-widest text-gray-400 ${wizardStep === 1 ? 'opacity-0' : ''}`}>Regresar</button>
                    <button onClick={() => wizardStep < 3 && setWizardStep(wizardStep + 1)} className={`text-[10px] font-black uppercase tracking-widest text-[#004d4d] ${wizardStep === 3 ? 'opacity-0' : ''}`}>Siguiente <ArrowRight size={14}/></button>
                </div>
            </motion.div>
        </div>
    );

    const renderCaseDetailModal = () => {
        if (!selectedCase) return null;

        const handleAddComment = () => {
            if (!internalComment.trim()) return;
            const newHistoryItem = { 
                date: "Ahora", 
                status: STATUS_MAP[selectedCase.status].label, 
                user: "Bayup Operator", 
                comment: internalComment 
            };
            const updatedCases = cases.map(c => 
                c.id === selectedCase.id ? { ...c, history: [newHistoryItem, ...c.history] } : c
            );
            setCases(updatedCases);
            setSelectedCase({ ...selectedCase, history: [newHistoryItem, ...selectedCase.history] });
            setInternalComment("");
            showToast("Comentario interno registrado", "info");
        };

        const handleNotifyCustomer = () => {
            const notifyItem = { 
                date: "Ahora", 
                status: "Notificación Cliente", 
                user: "Sistema AI", 
                comment: `Se envió actualización de estado (${STATUS_MAP[selectedCase.status].label}) al cliente vía ${selectedCase.customer.channel}.` 
            };
            const updatedCases = cases.map(c => 
                c.id === selectedCase.id ? { ...c, history: [notifyItem, ...c.history] } : c
            );
            setCases(updatedCases);
            setSelectedCase({ ...selectedCase, history: [notifyItem, ...selectedCase.history] });
            showToast(`Notificación enviada a ${selectedCase.customer.name} 📧`, "success");
        };

        const handleStatusChange = (newStatus: any) => {
            const updatedCases = cases.map(c => 
                c.id === selectedCase.id ? { 
                    ...c, 
                    status: newStatus,
                    history: [{ date: "Hoy", status: STATUS_MAP[newStatus as keyof typeof STATUS_MAP].label, user: "Bayup Operator", comment: "Cambio de estado manual" }, ...c.history]
                } : c
            );
            setCases(updatedCases);
            setSelectedCase({ ...selectedCase, status: newStatus as any });
            setIsStatusMenuOpen(false);
            showToast(`Estado actualizado a ${STATUS_MAP[newStatus as keyof typeof STATUS_MAP].label}`, "success");
        };

        return (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                <input type="file" ref={fileInputRef} className="hidden" onChange={() => showToast("Evidencia adjuntada correctamente ✨", "success")} />
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSelectedCase(null); setIsStatusMenuOpen(false); }} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="bg-white w-full max-w-6xl h-[90vh] rounded-[4rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-white/20">
                    <div className="w-full md:w-[400px] bg-gray-50 border-r border-gray-100 p-12 overflow-y-auto custom-scrollbar space-y-12">
                        <button onClick={() => { setSelectedCase(null); setIsStatusMenuOpen(false); }} className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 shadow-sm transition-all"><X size={24}/></button>
                        <section className="space-y-6">
                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-200 pb-3">Información del Cliente</h4>
                            <div className="flex items-center gap-6"><div className="h-20 w-20 rounded-[1.5rem] bg-[#004d4d] text-white flex items-center justify-center text-3xl font-black shadow-2xl">{selectedCase.customer.name.charAt(0)}</div><div><h3 className="text-xl font-black text-gray-900 tracking-tight">{selectedCase.customer.name}</h3><p className="text-sm font-bold text-[#004d4d] mt-1 italic">{selectedCase.customer.channel}</p></div></div>
                            <div className="space-y-4 pt-4"><div className="flex items-center gap-4 text-sm font-bold text-gray-600"><Smartphone size={18} className="text-[#00f2ff]"/> {selectedCase.customer.phone}</div><div className="flex items-center gap-4 text-sm font-bold text-gray-600"><FileText size={18} className="text-[#00f2ff]"/> {selectedCase.customer.email}</div></div>
                        </section>
                        <section className="space-y-6">
                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-200 pb-3">Detalle del Pedido</h4>
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                                <div className="flex items-center gap-4 border-b border-gray-50 pb-4"><div className="h-12 w-12 rounded-xl overflow-hidden shadow-inner"><img src={selectedCase.product.image} className="w-full h-full object-cover" /></div><div><p className="text-sm font-black text-gray-900">{selectedCase.product.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{selectedCase.product.sku}</p></div></div>
                                <div className="grid grid-cols-2 gap-4"><div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Factura</p><p className="text-xs font-black text-gray-900">#{selectedCase.order.id}</p></div><div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Bodega</p><p className="text-xs font-black text-gray-900">{selectedCase.order.warehouse}</p></div></div>
                            </div>
                        </section>
                        <button 
                            onClick={handleNotifyCustomer}
                            className="w-full py-5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#004d4d] transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95"
                        >
                            <MessageSquare size={16} className="text-[#00f2ff]" /> Notificar al Cliente
                        </button>
                    </div>
                    <div className="flex-1 flex flex-col bg-white overflow-hidden">
                        <div className="p-12 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
                            <div><h2 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Trazabilidad del Caso</h2><p className="text-gray-400 text-xs font-black uppercase tracking-widest mt-2 flex items-center gap-2"><History size={14} className="text-[#00f2ff]"/> Historial inmutable de eventos</p></div>
                            <div className="flex gap-3 relative">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-6 py-3 bg-gray-50 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#004d4d] border border-gray-100 hover:bg-gray-100 transition-all"
                                >
                                    Adjuntar Evidencia
                                </button>
                                <button 
                                    onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                                    className="px-6 py-3 bg-[#004d4d] rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-xl hover:bg-black transition-all"
                                >
                                    Cambiar Estado
                                </button>

                                <AnimatePresence>
                                    {isStatusMenuOpen && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full right-0 mt-2 w-56 bg-white rounded-3xl shadow-3xl border border-gray-100 p-3 z-50 space-y-1"
                                        >
                                            {Object.entries(STATUS_MAP).map(([key, info]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => handleStatusChange(key)}
                                                    className={`w-full text-left px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedCase.status === key ? 'bg-[#004d4d] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                                                >
                                                    {info.label}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-gray-50/20">
                            <div className="relative pl-12 space-y-12 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                {selectedCase.history.map((event, i) => (
                                    <div key={i} className="relative group">
                                        <div className="absolute left-[-52px] top-0 h-10 w-10 rounded-full border-4 border-white bg-[#004d4d] flex items-center justify-center text-white shadow-lg z-10 group-hover:scale-110 transition-transform"><Zap size={14} fill="currentColor" /></div>
                                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                                            <div className="flex justify-between items-center"><h5 className="text-sm font-black text-[#004d4d] uppercase tracking-widest">{event.status}</h5><span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">{event.date}</span></div>
                                            <p className="text-sm font-medium text-gray-600 leading-relaxed italic">"{event.comment}"</p>
                                            <div className="pt-4 border-t border-gray-50 flex items-center gap-2"><div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-black">{event.user.charAt(0)}</div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Responsable: {event.user}</p></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-10 border-t border-gray-100 bg-white">
                            <div className="flex gap-4 items-center">
                                <div className="flex-1 bg-gray-50 rounded-2xl p-2 border border-gray-100 focus-within:border-[#004d4d] transition-all">
                                    <textarea 
                                        rows={1} 
                                        value={internalComment}
                                        onChange={(e) => setInternalComment(e.target.value)}
                                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                                        placeholder="Agregar comentario interno..." 
                                        className="w-full bg-transparent px-4 py-3 text-sm font-bold outline-none resize-none" 
                                    />
                                </div>
                                <button 
                                    onClick={handleAddComment}
                                    className="h-14 w-14 bg-[#004d4d] text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 transition-all active:scale-95"
                                >
                                    <Send size={24} className="text-[#00f2ff]" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-10 animate-in fade-in duration-700 relative">
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#004d4d]/5 rounded-full blur-[120px]" /><div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#00f2ff]/5 rounded-full blur-[100px]" />
            </div>
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
                <div><div className="flex items-center gap-3 mb-2"><span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse"></span><span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Servicio Postventa</span></div><h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">Garantías <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">& Casos</span></h1><p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">Control operativo y seguimiento táctico de incidencias de producto.</p></div>
                <div className="flex items-center gap-4"><button onClick={() => { setIsCreatingCase(true); setWizardStep(1); }} className="h-14 px-8 bg-gray-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-3 group"><Plus size={18} className="group-hover:rotate-90 transition-transform" /> Abrir Nuevo Caso</button></div>
            </div>
            {renderKPIs()}
            <div className="flex items-center justify-center gap-4 shrink-0 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 backdrop-blur-xl flex items-center relative">
                    {[ { id: 'todos', label: 'Todos', icon: <LayoutGrid size={14}/> }, { id: 'abiertos', label: 'Casos Abiertos', icon: <ShieldAlert size={14}/> }, { id: 'revision', label: 'En Revisión', icon: <Search size={14}/> }, { id: 'resueltos', label: 'Resueltos', icon: <CheckCircle2 size={14}/> } ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (<button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}>{isActive && ( <motion.div layoutId="activeReturnTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} /> )}{tab.icon}{tab.label}</button>);
                    })}
                </div>
                <motion.button whileHover={{ scale: 1.1, rotate: 5 }} onClick={() => setShowInfoModal(true)} className="h-12 w-12 rounded-full bg-white/80 backdrop-blur-xl border border-white shadow-2xl flex items-center justify-center text-[#004d4d] hover:bg-gray-900 hover:text-white transition-all"><Info size={18} /></motion.button>
            </div>
            {/* --- ACTION BAR --- */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white/60 backdrop-blur-md p-2 rounded-[2rem] border border-white/60 shadow-sm mx-4 shrink-0 relative z-30">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar caso por ID, cliente o producto..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="w-full pl-14 pr-6 py-3.5 bg-transparent text-sm font-bold text-slate-700 outline-none" 
                    />
                </div>
                
                <div className="flex items-center gap-2 pr-2">
                    {/* Filtro de Prioridad */}
                    <div className="relative">
                        <motion.button 
                            layout
                            onMouseEnter={() => setIsFilterHovered(true)}
                            onMouseLeave={() => setIsFilterHovered(false)}
                            onClick={() => { setIsFilterMenuOpen(!isFilterMenuOpen); setIsDateMenuOpen(false); }}
                            className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isFilterMenuOpen ? 'bg-[#004d4d] text-white shadow-lg' : 'bg-white text-slate-500 border border-gray-100 hover:text-[#004d4d] shadow-sm'} group`}
                        >
                            <motion.div layout><Filter size={18}/></motion.div>
                            <AnimatePresence mode="popLayout">
                                {(isFilterHovered || isFilterMenuOpen) && (
                                    <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">
                                        {filterPriority === 'all' ? 'Prioridad' : filterPriority}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>

                        <AnimatePresence>
                            {isFilterMenuOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50"
                                >
                                    {['all', 'low', 'medium', 'high', 'critical'].map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => { setFilterPriority(p); setIsFilterMenuOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterPriority === p ? 'bg-[#004d4d] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            {p === 'all' ? 'Todas' : p}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Filtro de Fecha */}
                    <div className="relative">
                        <motion.button 
                            layout
                            onMouseEnter={() => setIsDateHovered(true)}
                            onMouseLeave={() => setIsDateHovered(false)}
                            onClick={() => { setIsDateMenuOpen(!isDateMenuOpen); setIsFilterMenuOpen(false); }}
                            className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isDateMenuOpen ? 'bg-[#004d4d] text-white shadow-lg' : 'bg-white text-slate-500 border border-gray-100 hover:text-[#004d4d] shadow-sm'} group`}
                        >
                            <motion.div layout><Calendar size={18}/></motion.div>
                            <AnimatePresence mode="popLayout">
                                {(isDateHovered || isDateMenuOpen) && (
                                    <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">
                                        {filterDateRange === 'all' ? 'Fecha' : 
                                         filterDateRange === 'today' ? 'Hoy' : 
                                         filterDateRange === 'week' ? '7 días' : 'Este Mes'}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>

                        <AnimatePresence>
                            {isDateMenuOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50"
                                >
                                    {[
                                        { id: 'all', label: 'Siempre' },
                                        { id: 'today', label: 'Hoy' },
                                        { id: 'week', label: 'Últimos 7 días' },
                                        { id: 'month', label: 'Este Mes' }
                                    ].map((range) => (
                                        <button
                                            key={range.id}
                                            onClick={() => { setFilterDateRange(range.id); setIsDateMenuOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterDateRange === range.id ? 'bg-[#004d4d] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            {range.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Botón Exportar */}
                    <motion.button 
                        layout
                        onMouseEnter={() => setIsExportHovered(true)}
                        onMouseLeave={() => setIsExportHovered(false)}
                        onClick={() => { 
                            showToast("Generando reporte estratégico Platinum...", "info");
                            setTimeout(() => {
                                generateReturnsPDF({
                                    cases: filteredCases,
                                    stats: {
                                        totalCases: filteredCases.length,
                                        avgResponseTime: '18h',
                                        returnRate: '1.4%',
                                        criticalAlerts: filteredCases.filter(c => c.priority === 'critical').length
                                    }
                                });
                                showToast("Reporte de calidad exportado 📄", "success");
                            }, 1500);
                        }}
                        className="h-12 flex items-center gap-2 px-4 bg-white border border-gray-100 rounded-2xl text-slate-500 hover:text-emerald-600 transition-all shadow-sm"
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
            <div className="px-4 space-y-4"><AnimatePresence mode="popLayout">{filteredCases.map((c) => (
                <motion.div key={c.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} onClick={() => setSelectedCase(c)} whileHover={{ scale: 1.01, x: 5 }} className={`bg-white rounded-[2.5rem] p-8 border transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center gap-10 relative overflow-hidden ${c.priority === 'critical' ? 'border-rose-100 bg-rose-50/10 shadow-lg shadow-rose-50' : 'border-gray-50'}`}><div className={`absolute left-0 top-0 bottom-0 w-1.5 ${c.priority === 'critical' ? 'bg-rose-500' : 'bg-blue-500'}`}></div><div className="flex-1 flex items-center gap-6"><div className="h-16 w-16 rounded-[1.5rem] bg-gray-50 flex items-center justify-center text-[#004d4d] border border-gray-100"><ShieldCheck size={32} /></div><div><div className="flex items-center gap-3"><h3 className="text-xl font-black text-gray-900 tracking-tight">#{c.id}</h3><span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${c.priority === 'critical' ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-400'}`}>Prioridad {c.priority}</span></div><p className="text-sm font-bold text-[#004d4d] mt-1 italic uppercase tracking-tighter">Factura: {c.order.id}</p></div></div><div className="flex-[1.5] grid grid-cols-2 gap-8 border-x border-gray-50 px-10"><div className="flex items-center gap-4"><div className="h-10 w-10 rounded-full bg-[#004d4d] text-white flex items-center justify-center text-xs font-black shadow-lg">{c.customer.name.charAt(0)}</div><div><p className="text-sm font-black text-gray-900">{c.customer.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{c.customer.channel}</p></div></div><div className="flex items-center gap-4"><div className="h-10 w-10 rounded-xl overflow-hidden border border-gray-100"><img src={c.product.image} className="w-full h-full object-cover" alt="" /></div><div><p className="text-sm font-black text-gray-900 truncate max-w-[150px]">{c.product.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{c.product.sku}</p></div></div></div><div className="flex-1 flex items-center justify-between pl-4"><div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</p><span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 border ${STATUS_MAP[c.status].color}`}>{STATUS_MAP[c.status].label}</span></div><div className="text-right"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Abierto</p><p className={`text-2xl font-black mt-1 ${c.days_open > 5 ? 'text-rose-600' : 'text-gray-900'}`}>{c.days_open} Días</p></div></div></motion.div>
            ))}</AnimatePresence></div>
            <AnimatePresence>{selectedCase && renderCaseDetailModal()}</AnimatePresence>
            <AnimatePresence>{isCreatingCase && renderCreateCaseWizard()}</AnimatePresence>
            <ReturnsInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
            <ReturnsMetricModal isOpen={!!selectedKPI} onClose={() => setSelectedKPI(null)} metric={selectedKPI} />
            <style jsx global>{`.custom-scrollbar::-webkit-scrollbar { width: 5px; }.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 20px; }`}</style>
        </div>
    );
}