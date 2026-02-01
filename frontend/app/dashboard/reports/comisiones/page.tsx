"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Settings, 
  Plus, 
  X, 
  Gift, 
  CheckCircle2, 
  Star, 
  Trash2,
  Coins,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Activity,
  Zap,
  Target,
  Users,
  Briefcase,
  Clock,
  LayoutGrid,
  Filter,
  Search,
  Download,
  Calendar,
  Sparkles,
  Bot,
  ArrowUpRight,
  Award,
  Medal,
  CreditCard,
  FileText, 
  Percent, 
  Check, 
  ShieldCheck,
  History as LucideHistory,
  Scale,
  TrendingDown,
  ShoppingBag
} from 'lucide-react';
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";

// --- INTERFACES ---
interface CommissionSettlement {
    id: string;
    seller_id: string;
    seller_name: string;
    avatar: string;
    total_sales: number; // Ingreso bruto
    total_profit: number; // Utilidad real (Venta - Costo)
    target: number;
    rate: number;
    earned: number;
    status: 'pending' | 'paid' | 'overdue';
    period: string;
    progress: number;
    last_payment?: string;
}

// --- MOCK DATA ---
const MOCK_SETTLEMENTS: CommissionSettlement[] = [
    {
        id: 'c1', seller_id: 's1', seller_name: 'Elena Rodriguez', avatar: 'ER',
        total_sales: 12500000, total_profit: 4500000, target: 10000000, rate: 5.0, earned: 0,
        status: 'pending', period: 'Febrero 2026', progress: 0, last_payment: '30 Ene 2026'
    },
    {
        id: 'c2', seller_id: 's2', seller_name: 'Carlos Ruiz', avatar: 'CR',
        total_sales: 8400000, total_profit: 2100000, target: 10000000, rate: 5.0, earned: 0,
        status: 'pending', period: 'Febrero 2026', progress: 0, last_payment: '30 Ene 2026'
    }
];

export default function ComisionesPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    
    const [activeTab, setActiveTab] = useState<'liquidar' | 'reglas' | 'historial' | 'bayt'>('liquidar');
    const [commissionModel, setCommissionModel] = useState<'revenue' | 'profit'>('revenue');
    const [settlements, setSettlements] = useState<CommissionSettlement[]>(MOCK_SETTLEMENTS);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSettlement, setSelectedSettlement] = useState<CommissionSettlement | null>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    // --- MOTOR DE CÁLCULO DUAL ---
    const processedSettlements = useMemo(() => {
        return settlements.map(s => {
            const baseValue = commissionModel === 'revenue' ? s.total_sales : s.total_profit;
            const isMet = baseValue >= s.target;
            const progress = Math.round((baseValue / s.target) * 100);
            const earned = isMet ? (baseValue * s.rate) / 100 : 0;

            return { ...s, progress, earned };
        });
    }, [settlements, commissionModel]);

    const totals = useMemo(() => {
        const to_pay = processedSettlements.filter(s => s.status === 'pending' && s.earned > 0).reduce((acc, s) => acc + s.earned, 0);
        const achievement = Math.round(processedSettlements.reduce((acc, s) => acc + s.progress, 0) / (processedSettlements.length || 1));
        return { to_pay, achievement };
    }, [processedSettlements]);

    const filteredSettlements = useMemo(() => {
        return processedSettlements.filter(s => {
            const matchesSearch = s.seller_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'liquidar' ? s.status === 'pending' : activeTab === 'historial' ? s.status === 'paid' : true;
            return matchesSearch && matchesTab;
        });
    }, [processedSettlements, searchTerm, activeTab]);

    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
            {[
                { label: 'Comisiones por Pagar', value: formatCurrency(totals.to_pay), sub: `Modelo: ${commissionModel === 'revenue' ? 'Venta' : 'Utilidad'}`, icon: <DollarSign size={20}/>, trend: 'Calculado', color: 'text-[#004d4d]' },
                { label: 'Cumplimiento Metas', value: `${totals.achievement}%`, sub: 'Esfuerzo del equipo', icon: <Target size={20}/>, trend: commissionModel === 'revenue' ? 'Ingreso' : 'Ganancia', color: 'text-[#00f2ff]' },
                { label: 'Valor Base Red', value: formatCurrency(processedSettlements.reduce((acc, s) => acc + (commissionModel === 'revenue' ? s.total_sales : s.total_profit), 0)), sub: 'Total comisionable', icon: <Scale size={20}/>, trend: 'Neto', color: 'text-emerald-600' },
                { label: 'Eficiencia Grupal', value: `${processedSettlements.filter(s => s.earned > 0).length} Asesores`, sub: 'Han desbloqueado pagos', icon: <Zap size={20}/>, trend: 'Activo', color: 'text-amber-500' },
            ].map((kpi, i) => (
                <motion.div key={i} whileHover={{ y: -5, scale: 1.02 }} className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/80 shadow-sm flex flex-col justify-between group transition-all">
                    <div className="flex justify-between items-start">
                        <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                            {kpi.icon}
                        </div>
                        <span className="text-[10px] font-black px-2 py-1 bg-gray-50 text-gray-400 rounded-lg">{kpi.trend}</span>
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
                    placeholder="Buscar asesor comercial..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-transparent text-sm font-bold text-slate-700 outline-none" 
                />
            </div>
            <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex items-center gap-3">
                <button className="h-12 flex items-center gap-2 px-5 rounded-2xl bg-white text-slate-500 border border-gray-100 hover:bg-gray-50 transition-all">
                    <Filter size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Cumplimiento</span>
                </button>
                <button className="h-12 flex items-center gap-2 px-5 bg-gray-900 text-white rounded-2xl shadow-lg hover:bg-black transition-all">
                    <Download size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Nómina</span>
                </button>
            </div>
        </div>
    );

    const renderRules = () => (
        <div className="px-4 space-y-10">
            {/* SELECTOR DE MODELO ESTRATÉGICO */}
            <div className="bg-white/40 p-10 rounded-[4rem] border border-white/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="space-y-4 max-w-xl text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3"><Scale className="text-[#004d4d]" size={24}/><h3 className="text-2xl font-black text-[#004d4d] uppercase italic">Motor de Liquidación Dual</h3></div>
                    <p className="text-sm font-medium text-gray-500 leading-relaxed italic">"Define si premias el **Volumen de Venta** (Ingresos Brutos) o la **Eficiencia del Margen** (Utilidad Real tras descontar costos)."</p>
                </div>
                <div className="p-2 bg-white rounded-3xl border border-gray-100 flex gap-2 shadow-inner">
                    {[
                        { id: 'revenue', label: 'Venta Total', icon: <ShoppingBag size={14}/> },
                        { id: 'profit', label: 'Utilidad Neta', icon: <DollarSign size={14}/> }
                    ].map(m => (
                        <button 
                            key={m.id} 
                            onClick={() => setCommissionModel(m.id as any)}
                            className={`px-8 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${commissionModel === m.id ? 'bg-[#004d4d] text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                        >
                            {m.icon} {m.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-xl space-y-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5"><Target size={150} /></div>
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-amber-50 text-amber-600 rounded-[1.5rem] flex items-center justify-center shadow-inner"><Coins size={32} /></div>
                        <div><h3 className="text-2xl font-black text-gray-900 tracking-tight">Umbral de Meta</h3><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Valor mínimo para empezar a cobrar</p></div>
                    </div>
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Meta de {commissionModel === 'revenue' ? 'Venta' : 'Utilidad'}:</label>
                            <div className="flex items-center gap-6 bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 shadow-inner">
                                <span className="text-3xl font-black text-[#004d4d]">$</span>
                                <input type="text" defaultValue="10.000.000" className="text-3xl font-black text-gray-900 bg-transparent outline-none w-full" />
                            </div>
                        </div>
                        <div className="p-6 bg-[#001a1a] rounded-[2.5rem] text-white space-y-2">
                            <div className="flex items-center gap-3"><ShieldCheck className="text-[#00f2ff]" size={16}/><p className="text-[10px] font-black uppercase tracking-widest text-[#00f2ff]">Regla de Inteligencia</p></div>
                            <p className="text-xs font-medium italic opacity-80 leading-relaxed">
                                {commissionModel === 'revenue' 
                                    ? "Se comisiona sobre el valor bruto de la factura. Ideal para acelerar el crecimiento." 
                                    : "Se comisiona sobre la ganancia real. Protege el margen de rentabilidad de la empresa."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-xl space-y-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5"><Percent size={150} /></div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 bg-purple-50 text-purple-600 rounded-[1.5rem] flex items-center justify-center shadow-inner"><Award size={32} /></div>
                            <div><h3 className="text-2xl font-black text-gray-900 tracking-tight">Tasa de Comisión</h3><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Incentivo por cumplimiento</p></div>
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Porcentaje a Aplicar:</label>
                            <div className="flex items-center gap-6 bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 shadow-inner">
                                <input type="text" defaultValue={commissionModel === 'revenue' ? '2.5' : '10.0'} className="text-3xl font-black text-gray-900 bg-transparent outline-none w-full text-center" />
                                <span className="text-3xl font-black text-purple-600">%</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <button className="py-4 bg-gray-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl">Guardar Modelo</button>
                            <button className="py-4 bg-white border border-gray-100 text-gray-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:text-[#004d4d] transition-all">Reglas por Asesor</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSettlementList = () => (
        <div className="px-4 space-y-4">
            {filteredSettlements.map((s) => (
                <motion.div 
                    key={s.id} 
                    onClick={() => setSelectedSettlement(s)}
                    whileHover={{ x: 5 }} 
                    className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10 cursor-pointer"
                >
                    <div className="flex items-center gap-6 flex-1">
                        <div className="h-16 w-16 rounded-[1.8rem] bg-[#004d4d] text-white flex items-center justify-center text-xl font-black shadow-2xl relative">
                            {s.avatar}
                            {s.progress >= 100 && (
                                <div className="absolute -top-2 -right-2 h-7 w-7 bg-[#00f2ff] rounded-full border-4 border-white flex items-center justify-center">
                                    <Zap size={12} className="text-[#004d4d]" fill="currentColor" />
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h4 className="text-xl font-black text-gray-900 tracking-tight">{s.seller_name}</h4>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                                    s.earned > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                                }`}>
                                    {s.earned > 0 ? 'Comisionando' : 'Bajo Meta'}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-[#004d4d] mt-1 italic">Periodo: {s.period}</p>
                        </div>
                    </div>
                    
                    <div className="flex-[2] space-y-4 px-10 border-x border-gray-50">
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Progreso de Meta ({commissionModel === 'revenue' ? 'Venta' : 'Utilidad'})</p>
                                <p className="text-xs font-black text-gray-900">{formatCurrency(commissionModel === 'revenue' ? s.total_sales : s.total_profit)} / {formatCurrency(s.target)}</p>
                            </div>
                            <p className={`text-sm font-black ${s.progress >= 100 ? 'text-emerald-600' : 'text-[#004d4d]'}`}>{s.progress}%</p>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-50 p-0.5">
                            <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: `${Math.min(s.progress, 100)}%` }} 
                                className={`h-full rounded-full shadow-[0_0_10px_rgba(0,242,255,0.3)] ${s.progress >= 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-[#004d4d] to-[#00f2ff]'}`}
                            ></motion.div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right mr-4">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Comisión Generada</p>
                            <p className={`text-2xl font-black ${s.earned > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>{formatCurrency(s.earned)}</p>
                        </div>
                        <button className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-[#004d4d] flex items-center justify-center transition-all shadow-inner"><FileText size={20}/></button>
                        <button 
                            disabled={s.earned === 0}
                            className={`h-12 px-6 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-3 ${s.earned > 0 ? 'bg-gray-900 text-white hover:bg-black active:scale-95' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                        >
                            <CreditCard size={16} className={s.earned > 0 ? 'text-[#00f2ff]' : 'text-gray-200'}/> Liquidar
                        </button>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-1000">
            {/* Header Maestro */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Incentivos Estratégicos</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Liquidación de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">Comisiones</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic italic">
                        Control dual de incentivos basado en <span className="font-bold text-[#001A1A]">rentabilidad y volumen</span>.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white p-2 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="px-6 py-2">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Periodo</p>
                            <p className="text-sm font-black text-gray-900">Febrero 2026</p>
                        </div>
                        <button className="h-12 w-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center hover:bg-black transition-all shadow-lg"><Calendar size={20} className="text-[#00f2ff]"/></button>
                    </div>
                </div>
            </div>

            {renderKPIs()}

            {/* Menú Flotante Central */}
            <div className="flex items-center justify-center gap-6 shrink-0 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 backdrop-blur-xl flex items-center relative">
                    {[
                        { id: 'liquidar', label: 'Liquidación', icon: <CreditCard size={14}/> },
                        { id: 'reglas', label: 'Reglas/Metas', icon: <Scale size={14}/> },
                        { id: 'historial', label: 'Historial', icon: <LucideHistory size={14}/> },
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
                                    <motion.div layoutId="activeCommTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                )}
                                {tab.icon}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="space-y-10">
                    {(activeTab === 'liquidar' || activeTab === 'historial') && (
                        <div className="space-y-8">
                            {renderActionBar()}
                            {renderSettlementList()}
                        </div>
                    )}
                    {activeTab === 'reglas' && renderRules()}
                    {activeTab === 'bayt' && (
                        <div className="px-4">
                            <div className="bg-[#004d4d] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Medal size={300} /></div>
                                <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
                                    <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center animate-pulse"><Bot size={64} className="text-[#00f2ff]" /></div>
                                    <div className="flex-1 space-y-6">
                                        <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#00f2ff]/20">Bayt Reward-IQ</span>
                                        <h3 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2ff]">Maximiza la Rentabilidad de tu Equipo</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                                <div className="flex items-center gap-3"><Sparkles className="text-[#00f2ff]" size={20}/><p className="text-[10px] font-black uppercase tracking-widest text-[#00f2ff]">Sugerencia de Modelo</p></div>
                                                <p className="text-sm font-medium italic leading-relaxed">"Detecto productos con margen muy bajo siendo los más vendidos. Te sugiero cambiar al **Modelo de Utilidad Neta** para incentivar a los asesores a vender productos de mayor rentabilidad."</p>
                                            </div>
                                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                                <div className="flex items-center gap-3"><TrendingUp className="text-emerald-400" size={20}/><p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Impulso de Venta</p></div>
                                                <p className="text-sm font-medium italic leading-relaxed">"Elena Rodriguez está al 125% de su meta. Activar una **sobre-comisión** por surplus ahora mismo mantendrá su ritmo hasta fin de mes."</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Modal de Detalle (Audit 360) */}
            <AnimatePresence>
                {selectedSettlement && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSettlement(null)} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-4xl rounded-[4rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-white/20">
                            
                            {/* SIDEBAR ASESOR */}
                            <div className="w-full md:w-[350px] bg-gray-50 border-r border-gray-100 p-12 overflow-y-auto custom-scrollbar space-y-12">
                                <button onClick={() => setSelectedSettlement(null)} className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 shadow-sm transition-all"><X size={24}/></button>
                                
                                <section className="space-y-6">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-200 pb-3">Perfil del Asesor</h4>
                                    <div className="flex items-center gap-6">
                                        <div className="h-20 w-20 rounded-[1.5rem] bg-[#004d4d] text-white flex items-center justify-center text-3xl font-black shadow-2xl">{selectedSettlement.avatar}</div>
                                        <div><h3 className="text-xl font-black text-gray-900 tracking-tight">{selectedSettlement.seller_name}</h3><p className="text-sm font-bold text-[#004d4d] mt-1 italic">Fuerza de Ventas Elite</p></div>
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-200 pb-3">Resumen de Periodo</h4>
                                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between"><span className="text-[9px] font-black text-gray-400 uppercase">Facturación:</span><span className="text-sm font-black text-gray-900">{formatCurrency(selectedSettlement.total_sales)}</span></div>
                                        <div className="flex items-center justify-between"><span className="text-[9px] font-black text-gray-400 uppercase">Utilidad Generada:</span><span className="text-sm font-black text-emerald-600">{formatCurrency(selectedSettlement.total_profit)}</span></div>
                                        <div className="pt-2 border-t border-gray-50 flex items-center justify-between"><span className="text-[10px] font-black text-gray-900 uppercase">Comisión Final:</span><span className="text-2xl font-black text-[#004d4d]">{formatCurrency(selectedSettlement.earned)}</span></div>
                                    </div>
                                </section>

                                <button className="w-full py-5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#004d4d] transition-all shadow-2xl flex items-center justify-center gap-3">
                                    <Download size={16} className="text-[#00f2ff]" /> Descargar Auditoría
                                </button>
                            </div>

                            {/* MAIN CONTENT */}
                            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                                <div className="p-12 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
                                    <div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Auditoría {commissionModel === 'revenue' ? 'Venta Bruta' : 'Utilidad Neta'}</h2>
                                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest mt-2 flex items-center gap-2"><LucideHistory size={14} className="text-[#00f2ff]"/> Análisis de cumplimiento del periodo</p>
                                    </div>
                                    <button disabled={selectedSettlement.earned === 0} className="h-12 px-8 bg-[#004d4d] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-3 disabled:opacity-30"><Check size={18}/> Confirmar Pago</button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-gray-50/20">
                                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                                        <div className="flex items-center gap-4 text-[#004d4d] mb-4"><Sparkles size={20}/><h4 className="text-sm font-black uppercase tracking-widest">Análisis de Desempeño</h4></div>
                                        <div className="grid grid-cols-2 gap-10">
                                            <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                                                <p className="text-[9px] font-black text-gray-400 uppercase">Base Comisionable</p>
                                                <p className="text-xl font-black text-gray-900 mt-1">{formatCurrency(commissionModel === 'revenue' ? selectedSettlement.total_sales : selectedSettlement.total_profit)}</p>
                                            </div>
                                            <div className="p-6 bg-[#004d4d] rounded-[2rem] text-white">
                                                <p className="text-[9px] font-black text-white/60 uppercase">Estado Meta</p>
                                                <p className="text-xl font-black text-[#00f2ff] mt-1">{selectedSettlement.progress >= 100 ? 'SUPERADA' : 'EN CURSO'}</p>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-emerald-50 rounded-[2.2rem] border border-emerald-100">
                                            <p className="text-xs font-medium text-emerald-800 leading-relaxed italic">"El asesor ha generado un aporte neto de {formatCurrency(selectedSettlement.total_profit)} a la empresa. Su comisión del {selectedSettlement.rate}% se calcula sobre este valor estratégico."</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- ESTILOS --- */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
            `}</style>
        </div>
    );
}
