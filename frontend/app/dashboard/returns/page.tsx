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
  Layers
} from 'lucide-react';

// --- MOCK DATA ---
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
    const [selectedCase, setSelectedCase] = useState<WarrantyCase | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState('all');

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-10 animate-in fade-in duration-700">
            
            {/* --- HEADER MAESTRO --- */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_10px_#10B981]"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Servicio Postventa</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Garantías <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">& Casos</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">
                        Control operativo y seguimiento táctico de incidencias de producto.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="h-14 px-8 bg-gray-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-3">
                        <Plus size={18} /> Abrir Nuevo Caso
                    </button>
                </div>
            </div>

            {/* --- KPI CARDS (ESTILO ENVÍOS) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 px-4 shrink-0">
                {[
                    { label: 'Casos Abiertos', value: '14', icon: <Layers size={18}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'En Revisión', value: '05', icon: <Search size={18}/>, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Resueltos', value: '128', icon: <CheckCircle2 size={18}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Tiempo Promedio', value: '18h', icon: <Clock size={18}/>, color: 'text-[#004d4d]', bg: 'bg-gray-50' },
                    { label: 'Tasa Devolución', value: '1.4%', icon: <TrendingUp size={18}/>, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'Alertas Demora', value: '03', icon: <AlertCircle size={18}/>, color: 'text-rose-600', bg: 'bg-rose-100', pulse: true },
                ].map((kpi, i) => (
                    <motion.div key={i} whileHover={{ y: -5 }} className="bg-white/60 backdrop-blur-md p-6 rounded-[2.2rem] border border-white/80 shadow-sm flex flex-col justify-between group cursor-pointer">
                        <div className="flex justify-between items-start">
                            <div className={`h-10 w-10 rounded-xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                                {kpi.icon}
                            </div>
                            {kpi.pulse && <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#F43F5E]"></div>}
                        </div>
                        <div className="mt-4">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                            <h3 className="text-xl font-black text-gray-900 mt-1">{kpi.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* --- ACTION BAR --- */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white/60 backdrop-blur-md p-3 rounded-3xl border border-white/60 shadow-sm mx-4 shrink-0">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input type="text" placeholder="Buscar caso por ID, cliente o producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-transparent text-sm font-bold text-slate-700 outline-none" />
                </div>
                <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
                <div className="flex items-center gap-3">
                    <button className="h-12 flex items-center gap-2 px-5 rounded-2xl bg-white text-slate-500 border border-gray-100 hover:bg-gray-50 transition-all">
                        <Filter size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Filtros</span>
                    </button>
                    <button className="h-12 flex items-center gap-2 px-5 bg-gray-900 text-white rounded-2xl shadow-lg hover:bg-black transition-all">
                        <Download size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Exportar Reporte</span>
                    </button>
                </div>
            </div>

            {/* --- CASE LIST --- */}
            <div className="px-4 space-y-4">
                {MOCK_CASES.map((c) => (
                    <motion.div 
                        key={c.id} 
                        onClick={() => setSelectedCase(c)}
                        whileHover={{ scale: 1.01, x: 5 }}
                        className={`bg-white rounded-[2.5rem] p-8 border transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center gap-10 relative overflow-hidden ${
                            c.priority === 'critical' ? 'border-rose-100 bg-rose-50/10 shadow-lg shadow-rose-50' : 'border-gray-50'
                        }`}
                    >
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${c.priority === 'critical' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                        
                        {/* Info Caso */}
                        <div className="flex-1 flex items-center gap-6">
                            <div className="h-16 w-16 rounded-[1.5rem] bg-gray-50 flex items-center justify-center text-[#004d4d] border border-gray-100">
                                <ShieldCheck size={32} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">#{c.id}</h3>
                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${c.priority === 'critical' ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        Prioridad {c.priority}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-[#004d4d] mt-1 italic uppercase tracking-tighter">Orden Relacionada: {c.order.id}</p>
                            </div>
                        </div>

                        {/* Cliente & Producto */}
                        <div className="flex-[1.5] grid grid-cols-2 gap-8 border-x border-gray-50 px-10">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-[#004d4d] text-white flex items-center justify-center text-xs font-black shadow-lg">
                                    {c.customer.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900">{c.customer.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{c.customer.channel}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl overflow-hidden border border-gray-100">
                                    <img src={c.product.image} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900 truncate max-w-[150px]">{c.product.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{c.product.sku}</p>
                                </div>
                            </div>
                        </div>

                        {/* Estado & Tiempo */}
                        <div className="flex-1 flex items-center justify-between pl-4">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado Actual</p>
                                <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 border ${STATUS_MAP[c.status].color}`}>
                                    {STATUS_MAP[c.status].label}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Días Abierto</p>
                                <p className={`text-2xl font-black mt-1 ${c.days_open > 5 ? 'text-rose-600' : 'text-gray-900'}`}>{c.days_open} Días</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* --- CASE DETAIL DRAWER (VISTA 360°) --- */}
            <AnimatePresence>
                {selectedCase && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCase(null)} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                        <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="bg-white w-full max-w-6xl h-[90vh] rounded-[4rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-white/20">
                            
                            {/* SIDEBAR DETAIL: CLIENTE & PEDIDO */}
                            <div className="w-full md:w-[400px] bg-gray-50 border-r border-gray-100 p-12 overflow-y-auto custom-scrollbar space-y-12">
                                <button onClick={() => setSelectedCase(null)} className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 shadow-sm transition-all"><X size={24}/></button>
                                
                                <section className="space-y-6">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-200 pb-3">Información del Cliente</h4>
                                    <div className="flex items-center gap-6">
                                        <div className="h-20 w-20 rounded-[1.5rem] bg-[#004d4d] text-white flex items-center justify-center text-3xl font-black shadow-2xl">{selectedCase.customer.name.charAt(0)}</div>
                                        <div><h3 className="text-xl font-black text-gray-900 tracking-tight">{selectedCase.customer.name}</h3><p className="text-sm font-bold text-[#004d4d] mt-1 italic">{selectedCase.customer.channel}</p></div>
                                    </div>
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center gap-4 text-sm font-bold text-gray-600"><Smartphone size={18} className="text-[#00f2ff]"/> {selectedCase.customer.phone}</div>
                                        <div className="flex items-center gap-4 text-sm font-bold text-gray-600"><FileText size={18} className="text-[#00f2ff]"/> {selectedCase.customer.email}</div>
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-200 pb-3">Detalle del Pedido</h4>
                                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                                        <div className="flex items-center gap-4 border-b border-gray-50 pb-4">
                                            <div className="h-12 w-12 rounded-xl overflow-hidden shadow-inner"><img src={selectedCase.product.image} className="w-full h-full object-cover" /></div>
                                            <div><p className="text-sm font-black text-gray-900">{selectedCase.product.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{selectedCase.product.sku}</p></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Factura</p><p className="text-xs font-black text-gray-900">#{selectedCase.order.id}</p></div>
                                            <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Bodega</p><p className="text-xs font-black text-gray-900">{selectedCase.order.warehouse}</p></div>
                                        </div>
                                    </div>
                                </section>

                                <button className="w-full py-5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#004d4d] transition-all shadow-2xl flex items-center justify-center gap-3">
                                    <MessageSquare size={16} className="text-[#00f2ff]" /> Notificar al Cliente
                                </button>
                            </div>

                            {/* MAIN CONTENT: TIMELINE & OPERATIVA */}
                            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                                <div className="p-12 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
                                    <div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Trazabilidad del Caso</h2>
                                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest mt-2 flex items-center gap-2"><History size={14} className="text-[#00f2ff]"/> Historial inmutable de eventos</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button className="px-6 py-3 bg-gray-50 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#004d4d] border border-gray-100">Adjuntar Evidencia</button>
                                        <button className="px-6 py-3 bg-[#004d4d] rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-xl">Cambiar Estado</button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-gray-50/20">
                                    <div className="relative pl-12 space-y-12 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                        {selectedCase.history.map((event, i) => (
                                            <div key={i} className="relative group">
                                                <div className="absolute left-[-52px] top-0 h-10 w-10 rounded-full border-4 border-white bg-[#004d4d] flex items-center justify-center text-white shadow-lg z-10 group-hover:scale-110 transition-transform">
                                                    <Zap size={14} fill="currentColor" />
                                                </div>
                                                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <h5 className="text-sm font-black text-[#004d4d] uppercase tracking-widest">{event.status}</h5>
                                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">{event.date}</span>
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-600 leading-relaxed italic">"{event.comment}"</p>
                                                    <div className="pt-4 border-t border-gray-50 flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-black">{event.user.charAt(0)}</div>
                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Responsable: {event.user}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-10 border-t border-gray-100 bg-white">
                                    <div className="flex gap-4 items-center">
                                        <div className="flex-1 bg-gray-50 rounded-2xl p-2 border border-gray-100">
                                            <textarea rows={1} placeholder="Agregar comentario interno..." className="w-full bg-transparent px-4 py-3 text-sm font-bold outline-none resize-none" />
                                        </div>
                                        <button className="h-14 w-14 bg-[#004d4d] text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 transition-all"><Send size={24} className="text-[#00f2ff]" /></button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 20px; }
                .animate-spin-slow { animation: spin 8s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}