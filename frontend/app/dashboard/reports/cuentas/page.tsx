"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Tag, 
  X, 
  CheckCircle2, 
  DollarSign, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  Filter,
  Download,
  Sparkles,
  Bot,
  Zap,
  TrendingUp,
  Activity,
    Target, 
    ArrowUpRight, 
    ArrowDownRight,
    Clock, 
    Briefcase,  Users,
  ShieldCheck,
  AlertCircle,
  FileText,
  CreditCard,
  History,
  Package,
  ArrowRight,
  Monitor,
  ShoppingBag,
  Layers,
  Award
} from 'lucide-react';
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";
import { motion, AnimatePresence } from 'framer-motion';

// --- INTERFACES ---
interface DebtRecord {
    id: string;
    entity_name: string; // Proveedor o Cliente
    amount: number;
    due_date: string;
    status: 'pending' | 'paid' | 'overdue';
    type: 'payable' | 'receivable';
    invoice_num: string;
    category: string;
    description: string;
    created_at: string;
}

// --- MOCK DATA ---
const MOCK_RECORDS: DebtRecord[] = [
    {
        id: 'd1', entity_name: 'Textiles del Norte', amount: 4500000, due_date: '2026-02-15',
        status: 'pending', type: 'payable', invoice_num: 'INV-8820', category: 'Materia Prima',
        description: 'Compra de lino para colección primavera', created_at: '2026-01-20'
    },
    {
        id: 'd2', entity_name: 'Andrés Felipe (VIP)', amount: 1250000, due_date: '2026-02-05',
        status: 'overdue', type: 'receivable', invoice_num: 'FAC-9010', category: 'Venta Crédito',
        description: 'Venta de 3 relojes gold con compromiso de pago', created_at: '2026-01-10'
    },
    {
        id: 'd3', entity_name: 'Importaciones Elite', amount: 8200000, due_date: '2026-03-01',
        status: 'pending', type: 'payable', invoice_num: 'INV-9940', category: 'Mercancía',
        description: 'Importación de accesorios premium', created_at: '2026-01-25'
    }
];

export default function CuentasCarteraPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    
    const [activeTab, setActiveTab] = useState<'pagar' | 'cobrar' | 'bayt'>('pagar');
    const [records, setRecords] = useState<DebtRecord[]>(MOCK_RECORDS);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRecord, setSelectedRecord] = useState<DebtRecord | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    const totals = useMemo(() => {
        const payable = records.filter(r => r.type === 'payable' && r.status !== 'paid').reduce((acc, r) => acc + r.amount, 0);
        const receivable = records.filter(r => r.type === 'receivable' && r.status !== 'paid').reduce((acc, r) => acc + r.amount, 0);
        return { payable, receivable };
    }, [records]);

    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            const matchesSearch = r.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) || r.invoice_num.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = (activeTab === 'pagar' && r.type === 'payable') || (activeTab === 'cobrar' && r.type === 'receivable');
            return matchesSearch && matchesTab;
        });
    }, [records, searchTerm, activeTab]);

    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
            {[
                { label: 'Cuentas por Pagar', value: formatCurrency(totals.payable), sub: 'Deuda a proveedores', icon: <CreditCard size={20}/>, color: 'text-rose-600', trend: 'Pasivo' },
                { label: 'Cartera por Cobrar', value: formatCurrency(totals.receivable), sub: 'Deuda de clientes', icon: <Users size={20}/>, color: 'text-emerald-600', trend: 'Activo' },
                { label: 'Balance Neto', value: formatCurrency(totals.receivable - totals.payable), sub: 'Salud financiera', icon: <Activity size={20}/>, color: 'text-[#004d4d]', trend: 'OK' },
                { label: 'Vencimientos 7d', value: '03', sub: 'Alertas próximas', icon: <Clock size={20}/>, color: 'text-amber-500', trend: 'Crítico' },
            ].map((kpi, i) => (
                <motion.div key={i} whileHover={{ y: -5, scale: 1.02 }} className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/80 shadow-sm flex flex-col justify-between group transition-all">
                    <div className="flex justify-between items-start">
                        <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                            {kpi.icon}
                        </div>
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${kpi.trend === 'Activo' ? 'bg-emerald-50 text-emerald-600' : kpi.trend === 'Pasivo' ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-400'}`}>{kpi.trend}</span>
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
                    placeholder={`Buscar ${activeTab === 'pagar' ? 'proveedor' : 'cliente'} o factura...`} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-transparent text-sm font-bold text-slate-700 outline-none" 
                />
            </div>
            <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex items-center gap-3">
                <button className="h-12 flex items-center gap-2 px-5 rounded-2xl bg-white text-slate-500 border border-gray-100 hover:bg-gray-50 transition-all">
                    <Filter size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Categoría</span>
                </button>
                <button className="h-12 flex items-center gap-2 px-5 bg-gray-900 text-white rounded-2xl shadow-lg hover:bg-black transition-all">
                    <Download size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Exportar</span>
                </button>
            </div>
        </div>
    );

    const renderRecordList = () => (
        <div className="px-4 space-y-4">
            {filteredRecords.map((r) => (
                <motion.div 
                    key={r.id} 
                    onClick={() => setSelectedRecord(r)}
                    whileHover={{ x: 5 }} 
                    className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10 cursor-pointer"
                >
                    <div className="flex items-center gap-6 flex-1">
                        <div className={`h-16 w-16 rounded-[1.8rem] flex items-center justify-center text-xl font-black shadow-2xl relative ${r.type === 'payable' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {r.type === 'payable' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h4 className="text-xl font-black text-gray-900 tracking-tight">{r.entity_name}</h4>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                                    r.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    r.status === 'overdue' ? 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse' :
                                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                                }`}>
                                    {r.status === 'overdue' ? 'Vencido' : r.status === 'pending' ? 'Pendiente' : 'Saldado'}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-[#004d4d] mt-1 italic">Factura: {r.invoice_num}</p>
                        </div>
                    </div>
                    
                    <div className="flex-[1.5] grid grid-cols-3 gap-8 px-10 border-x border-gray-50">
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Categoría</p>
                            <p className="text-xs font-black text-gray-900 mt-1 text-center">{r.category}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Vencimiento</p>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <Calendar size={12} className={r.status === 'overdue' ? 'text-rose-500' : 'text-[#00f2ff]'}/>
                                <p className={`text-xs font-black ${r.status === 'overdue' ? 'text-rose-600' : 'text-gray-900'}`}>{r.due_date}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Monto Total</p>
                            <p className={`text-sm font-black mt-1 text-center ${r.type === 'payable' ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(r.amount)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-[#004d4d] flex items-center justify-center transition-all shadow-inner"><Edit3 size={20}/></button>
                        <button className="h-12 w-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><CheckCircle2 size={20} className="text-[#00f2ff]"/></button>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    const renderBaytInsight = () => (
        <div className="px-4">
            <div className="bg-[#004d4d] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><ShieldCheck size={300} /></div>
                <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
                    <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center animate-pulse"><Bot size={64} className="text-[#00f2ff]" /></div>
                    <div className="flex-1 space-y-6">
                        <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#00f2ff]/20">Bayt Finance-IQ</span>
                        <h3 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2ff]">Auditoría de Salud Financiera</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                <div className="flex items-center gap-3"><AlertCircle className="text-amber-400" size={20}/><p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Riesgo de Liquidez</p></div>
                                <p className="text-sm font-medium italic leading-relaxed">"Tienes pagos a proveedores por **$12.7M** en los próximos 15 días. Te sugiero incentivar el cobro de la cartera de **Andrés Felipe** para cubrir el balance sin afectar el flujo de caja."</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                <div className="flex items-center gap-3"><TrendingUp className="text-emerald-400" size={20}/><p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Oportunidad de Pago</p></div>
                                <p className="text-sm font-medium italic leading-relaxed">"**Textiles del Norte** ofrece un 5% de descuento por pronto pago antes del día 10. Si saldas la deuda hoy, ahorrarías **$225.000**."</p>
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
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Finanzas & Cobranza</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Cuentas <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">& Cartera</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">
                        Control total de obligaciones con proveedores y <span className="font-bold text-[#001A1A]">recuperación de activos</span>.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsCreateModalOpen(true)} className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group">
                        <Zap size={18} className="text-[#00f2ff] group-hover:rotate-12 transition-transform" />
                        Nueva Obligación
                    </button>
                </div>
            </div>

            {/* --- KPIs ESTRATÉGICOS --- */}
            {renderKPIs()}

            {/* --- MENÚ FLOTANTE CENTRAL (RE-DISEÑADO) --- */}
            <div className="flex items-center justify-center gap-6 shrink-0 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 backdrop-blur-xl flex items-center relative">
                    {[
                        { id: 'pagar', label: 'Cuentas por Pagar', icon: <CreditCard size={14}/> },
                        { id: 'cobrar', label: 'Cartera de Clientes', icon: <Users size={14}/> },
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
                                    <motion.div layoutId="activeDebtTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
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
                    {activeTab !== 'bayt' ? (
                        <div className="space-y-8">
                            {renderActionBar()}
                            {renderRecordList()}
                        </div>
                    ) : renderBaytInsight()}
                </motion.div>
            </AnimatePresence>

            {/* --- MODAL 360° DETALLE DE OBLIGACIÓN --- */}
            <AnimatePresence>
                {selectedRecord && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRecord(null)} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-4xl rounded-[4rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-white/20">
                            
                            {/* SIDEBAR ENTIDAD */}
                            <div className="w-full md:w-[350px] bg-gray-50 border-r border-gray-100 p-12 overflow-y-auto custom-scrollbar space-y-12">
                                <button onClick={() => setSelectedRecord(null)} className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 shadow-sm transition-all"><X size={24}/></button>
                                
                                <section className="space-y-6">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-200 pb-3">Detalle de la Entidad</h4>
                                    <div className="flex items-center gap-6">
                                        <div className={`h-20 w-20 rounded-[1.5rem] text-white flex items-center justify-center text-3xl font-black shadow-2xl ${selectedRecord.type === 'payable' ? 'bg-rose-600' : 'bg-emerald-600'}`}>
                                            {selectedRecord.entity_name.charAt(0)}
                                        </div>
                                        <div><h3 className="text-xl font-black text-gray-900 tracking-tight">{selectedRecord.entity_name}</h3><p className="text-sm font-bold text-[#004d4d] mt-1 italic">{selectedRecord.type === 'payable' ? 'Proveedor' : 'Cliente Cartera'}</p></div>
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-200 pb-3">Estado de Cuenta</h4>
                                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between"><span className="text-[9px] font-black text-gray-400 uppercase">Total:</span><span className="text-sm font-black text-gray-900">{formatCurrency(selectedRecord.amount)}</span></div>
                                        <div className="flex items-center justify-between"><span className="text-[9px] font-black text-gray-400 uppercase">Vencimiento:</span><span className="text-xs font-black text-rose-600">{selectedRecord.due_date}</span></div>
                                    </div>
                                </section>

                                <button className="w-full py-5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#004d4d] transition-all shadow-2xl flex items-center justify-center gap-3">
                                    <FileText size={16} className="text-[#00f2ff]" /> Ver Factura PDF
                                </button>
                            </div>

                            {/* MAIN CONTENT: ACTIONS & HISTORY */}
                            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                                <div className="p-12 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
                                    <div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Gestión de Pago</h2>
                                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest mt-2 flex items-center gap-2"><Clock size={14} className="text-[#00f2ff]"/> Registra abonos o cancelaciones</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button className="px-8 py-4 bg-[#004d4d] rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl flex items-center gap-3"><Check size={18}/> {selectedRecord.type === 'payable' ? 'Marcar como Pagado' : 'Registrar Cobro'}</button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-gray-50/20">
                                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-50 pb-4">Descripción de la Obligación</h4>
                                        <p className="text-sm font-medium text-gray-600 leading-relaxed italic">"{selectedRecord.description}"</p>
                                        <div className="grid grid-cols-2 gap-8 pt-4">
                                            <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Fecha de Registro</p><p className="text-sm font-black text-gray-900">{selectedRecord.created_at}</p></div>
                                            <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nro de Comprobante</p><p className="text-sm font-black text-gray-900">{selectedRecord.invoice_num}</p></div>
                                        </div>
                                    </div>

                                    {/* Timeline de Seguimiento */}
                                    <div className="space-y-8">
                                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Historia de Movimientos</h4>
                                        <div className="relative pl-12 space-y-10 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                            <div className="relative">
                                                <div className="absolute left-[-52px] top-0 h-10 w-10 rounded-full border-4 border-white bg-gray-900 flex items-center justify-center text-white shadow-lg z-10"><Plus size={14} fill="currentColor" /></div>
                                                <div className="bg-white p-6 rounded-[2.2rem] border border-gray-100 shadow-sm"><p className="text-xs font-black text-gray-900 uppercase tracking-widest">Obligación Registrada</p><p className="text-[10px] text-gray-400 mt-1">{selectedRecord.created_at} · Por: Sistema</p></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- MODAL CREAR OBLIGACIÓN --- */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-lg rounded-[4rem] shadow-3xl overflow-hidden relative border border-white/20 z-10">
                            <div className="bg-[#004d4d] p-10 text-white flex items-center gap-6">
                                <div className="h-16 w-16 bg-[#00f2ff] text-[#004d4d] rounded-2xl flex items-center justify-center shadow-lg"><Zap size={32} /></div>
                                <div><h2 className="text-2xl font-black uppercase tracking-tight">Nueva Obligación</h2><p className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest">Registro de Deuda o Cartera</p></div>
                            </div>
                            <div className="p-10 space-y-8 bg-white">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button className="py-4 rounded-2xl border-2 border-[#004d4d] bg-emerald-50 text-[#004d4d] text-xs font-black uppercase">C. por Pagar</button>
                                        <button className="py-4 rounded-2xl border-2 border-gray-100 text-gray-400 text-xs font-black uppercase">C. por Cobrar</button>
                                    </div>
                                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre Proveedor / Cliente</label><input type="text" className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" placeholder="Ej: Textiles del Norte" /></div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Monto Total</label><input type="text" className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" placeholder="$ 0.00" /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Vencimiento</label><input type="date" className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" /></div>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4"><button onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase text-gray-400">Cancelar</button><button className="flex-[2] py-5 bg-gray-900 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-2xl">Registrar en Cartera</button></div>
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