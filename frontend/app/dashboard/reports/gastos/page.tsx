"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Clock,
  Briefcase,
  Users,
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
  Award,
  ArrowDownRight,
  Receipt
} from 'lucide-react';
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";

// --- INTERFACES ---
interface Expense {
    id: string;
    category: 'operativo_fijo' | 'operativo_diario' | 'fijo' | 'diario';
    description: string;
    amount: number;
    due_date: string;
    status: 'paid' | 'pending' | 'overdue';
    payment_method: string;
    created_at: string;
}

// --- MOCK DATA ---
const MOCK_EXPENSES: Expense[] = [
    {
        id: 'e1', description: 'Arriendo Bodega Central', amount: 3500000, 
        due_date: '2026-02-05', status: 'paid', category: 'operativo_fijo',
        payment_method: 'Transferencia', created_at: '2026-01-01'
    },
    {
        id: 'e2', description: 'Pago Nómina Elena Rodriguez', amount: 1200000, 
        due_date: '2026-01-30', status: 'paid', category: 'operativo_fijo',
        payment_method: 'Transferencia', created_at: '2026-01-30'
    },
    {
        id: 'e3', description: 'Papelería y Cintas', amount: 45000, 
        due_date: '2026-02-01', status: 'paid', category: 'operativo_diario',
        payment_method: 'Efectivo', created_at: '2026-02-01'
    },
    {
        id: 'e4', description: 'Mantenimiento Aires Acondicionados', amount: 250000, 
        due_date: '2026-02-10', status: 'pending', category: 'operativo_diario',
        payment_method: 'Pendiente', created_at: '2026-02-01'
    }
];

export default function GastosPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    
    const [activeTab, setActiveTab] = useState<'resumen' | 'fijos' | 'diarios' | 'bayt'>('resumen');
    const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    const totals = useMemo(() => {
        const fixed = expenses.filter(e => e.category === 'operativo_fijo').reduce((acc, e) => acc + e.amount, 0);
        const daily = expenses.filter(e => e.category === 'operativo_diario').reduce((acc, e) => acc + e.amount, 0);
        const pending = expenses.filter(e => e.status === 'pending' || e.status === 'overdue').reduce((acc, e) => acc + e.amount, 0);
        return { fixed, daily, pending };
    }, [expenses]);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => {
            const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = (activeTab === 'resumen') || 
                             (activeTab === 'fijos' && e.category === 'operativo_fijo') || 
                             (activeTab === 'diarios' && e.category === 'operativo_diario');
            return matchesSearch && matchesTab;
        });
    }, [expenses, searchTerm, activeTab]);

    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
            {[
                { label: 'Total Gastos Mes', value: formatCurrency(totals.fixed + totals.daily), sub: 'Operación total', icon: <Receipt size={20}/>, color: 'text-rose-600', trend: 'Pasivo' },
                { label: 'Costos Fijos', value: formatCurrency(totals.fixed), sub: 'Presupuesto base', icon: <Briefcase size={20}/>, color: 'text-[#004d4d]', trend: 'Fijo' },
                { label: 'Caja Menor', value: formatCurrency(totals.daily), sub: 'Gasto variable hoy', icon: <DollarSign size={20}/>, color: 'text-amber-500', trend: 'Variable' },
                { label: 'Pendiente Pago', value: formatCurrency(totals.pending), sub: 'Obligaciones por saldar', icon: <Clock size={20}/>, color: 'text-rose-500', trend: 'Crítico' },
            ].map((kpi, i) => (
                <motion.div key={i} whileHover={{ y: -5, scale: 1.02 }} className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/80 shadow-sm flex flex-col justify-between group transition-all">
                    <div className="flex justify-between items-start">
                        <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                            {kpi.icon}
                        </div>
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg bg-gray-50 text-gray-400`}>{kpi.trend}</span>
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
                    placeholder="Buscar por concepto o categoría..." 
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
                    <Download size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Reporte PDF</span>
                </button>
            </div>
        </div>
    );

    const renderExpenseList = () => (
        <div className="px-4 space-y-4">
            {filteredExpenses.map((e) => (
                <motion.div 
                    key={e.id} 
                    onClick={() => setSelectedExpense(e)}
                    whileHover={{ x: 5 }} 
                    className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10 cursor-pointer"
                >
                    <div className="flex items-center gap-6 flex-1">
                        <div className={`h-16 w-16 rounded-[1.8rem] flex items-center justify-center text-xl font-black shadow-2xl relative ${e.category === 'operativo_fijo' ? 'bg-gray-900 text-white' : 'bg-purple-50 text-purple-600'}`}>
                            {e.category === 'operativo_fijo' ? <Briefcase size={24} /> : <ShoppingBag size={24} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h4 className="text-xl font-black text-gray-900 tracking-tight">{e.description}</h4>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                                    e.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    e.status === 'overdue' ? 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse' :
                                    'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                    {e.status === 'paid' ? 'Pagado' : e.status === 'overdue' ? 'Vencido' : 'Pendiente'}
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">{e.category.replace('_', ' ')}</p>
                        </div>
                    </div>
                    
                    <div className="flex-[1.5] grid grid-cols-3 gap-8 px-10 border-x border-gray-50">
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Medio Pago</p>
                            <p className="text-xs font-black text-gray-900 mt-1 text-center">{e.payment_method}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Fecha Pago</p>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <Calendar size={12} className="text-[#00f2ff]"/>
                                <p className="text-xs font-black text-gray-900">{e.due_date}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Monto</p>
                            <p className="text-sm font-black text-rose-600 mt-1 text-center">{formatCurrency(e.amount)}</p>
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
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><DollarSign size={300} /></div>
                <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
                    <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center animate-pulse"><Bot size={64} className="text-[#00f2ff]" /></div>
                    <div className="flex-1 space-y-6">
                        <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#00f2ff]/20">Bayt Expense-Optimizer</span>
                        <h3 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2ff]">Optimización de Costos Operativos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                <div className="flex items-center gap-3"><Sparkles className="text-[#00f2ff]" size={20}/><p className="text-[10px] font-black uppercase tracking-widest text-[#00f2ff]">Eficiencia Detectada</p></div>
                                <p className="text-sm font-medium italic leading-relaxed">"Tus gastos en insumos diarios han bajado un 12% este mes. Te sugiero centralizar las compras de papelería en un solo proveedor para obtener un 5% extra de descuento por volumen."</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                <div className="flex items-center gap-3"><AlertCircle className="text-rose-400" size={20}/><p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Alerta de Margen</p></div>
                                <p className="text-sm font-medium italic leading-relaxed">"El costo de la nómina ha subido debido a horas extras en logística. Podrías optimizar el flujo de despachos los Martes para evitar picos de trabajo los Viernes."</p>
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
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Finanzas Operativas</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Control de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">Gastos</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">
                        Gestiona costos fijos, caja menor y optimiza la <span className="font-bold text-[#001A1A]">salud financiera</span> de tu negocio.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsCreateModalOpen(true)} className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group">
                        <Zap size={18} className="text-[#00f2ff] group-hover:rotate-12 transition-transform" />
                        Registrar Gasto
                    </button>
                </div>
            </div>

            {/* --- KPIs ESTRATÉGICOS --- */}
            {renderKPIs()}

            {/* --- MENÚ FLOTANTE CENTRAL --- */}
            <div className="flex items-center justify-center gap-6 shrink-0 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 backdrop-blur-xl flex items-center relative">
                    {[
                        { id: 'resumen', label: 'Todos los Gastos', icon: <LayoutGrid size={14}/> },
                        { id: 'fijos', label: 'Costos Fijos', icon: <Briefcase size={14}/> },
                        { id: 'diarios', label: 'Caja Menor', icon: <DollarSign size={14}/> },
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
                                    <motion.div layoutId="activeExpenseTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
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
                            {renderExpenseList()}
                        </div>
                    ) : renderBaytInsight()}
                </motion.div>
            </AnimatePresence>

            {/* --- MODAL CREAR GASTO (Full Pro) --- */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-lg rounded-[4rem] shadow-3xl overflow-hidden relative border border-white/20 z-10">
                            <div className="bg-gray-900 p-10 text-white flex items-center gap-6">
                                <div className="h-16 w-16 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><DollarSign size={32} /></div>
                                <div><h2 className="text-2xl font-black uppercase tracking-tight">Registrar Gasto</h2><p className="text-rose-400 text-[10px] font-black uppercase tracking-widest">Salida de Capital</p></div>
                            </div>
                            <div className="p-10 space-y-8 bg-white">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button className="py-4 rounded-2xl border-2 border-gray-900 bg-gray-50 text-gray-900 text-xs font-black uppercase">Gasto Fijo</button>
                                        <button className="py-4 rounded-2xl border-2 border-gray-100 text-gray-400 text-xs font-black uppercase">Caja Menor</button>
                                    </div>
                                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Concepto del Gasto</label><input type="text" className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-gray-900 outline-none text-sm font-bold shadow-inner" placeholder="Ej: Pago de Internet" /></div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Monto</label><input type="text" className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-gray-900 outline-none text-sm font-bold shadow-inner" placeholder="$ 0.00" /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Fecha</label><input type="date" className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-gray-900 outline-none text-sm font-bold shadow-inner" /></div>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4"><button onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase text-gray-400">Cancelar</button><button onClick={() => setIsCreateModalOpen(false)} className="flex-[2] py-5 bg-gray-900 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-2xl">Confirmar Registro</button></div>
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