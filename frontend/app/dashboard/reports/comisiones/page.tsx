"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Settings, Plus, X, Gift, CheckCircle2, Trash2, 
  Coins, ArrowRight, TrendingUp, DollarSign, Activity, 
  Zap, Target, Users, Briefcase, Clock, LayoutGrid, 
  Filter, Search, Download, Calendar, Sparkles, Bot, 
  ArrowUpRight, Award, Medal, CreditCard, FileText, 
  Percent, Check, ShieldCheck, History as LucideHistory, 
  Scale, MessageSquare, ChevronDown, ShoppingBag, Info, RotateCcw, ArrowDownRight, Loader2, BarChart3, TrendingDown,
  Lightbulb, BrainCircuit, PieChart
} from 'lucide-react';
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";

// --- INTERFACES ---
interface CommissionSettlement {
    id: string;
    seller_id: string;
    seller_name: string;
    avatar: string;
    total_sales: number; 
    total_profit: number; 
    status: 'pending' | 'paid';
    period: string;
    payment_date?: string;
    progress?: number;
    earned?: number;
}

const PERIODS = ['Enero 2026', 'Febrero 2026', 'Marzo 2026'];

// --- COMPONENTE NÚMEROS ANIMADOS ---
function AnimatedNumber({ value }: { value: number }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = value;
        const duration = 1000;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) { setDisplay(end); clearInterval(timer); }
            else { setDisplay(Math.floor(start)); }
        }, 16);
        return () => clearInterval(timer);
    }, [value]);
    return <span>{display.toLocaleString('es-CO')}</span>;
}

// --- COMPONENTE TILT CARD ---
const TiltCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const box = card.getBoundingClientRect();
        const centerX = box.width / 2;
        const centerY = box.height / 2;
        setRotateX((e.clientY - box.top - centerY) / 7); 
        setRotateY((centerX - (e.clientX - box.left)) / 7);
        setGlarePos({ x: ((e.clientX - box.left)/box.width)*100, y: ((e.clientY - box.top)/box.height)*100, opacity: 0.3 });
    };

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { setRotateX(0); setRotateY(0); setGlarePos(p => ({...p, opacity: 0})); }}
            animate={{ rotateX, rotateY, scale: rotateX !== 0 ? 1.05 : 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
            className={`bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/80 shadow-2xl flex flex-col justify-between group relative overflow-hidden h-full ${className}`}
        >
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-300" style={{ opacity: glarePos.opacity, background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.9) 0%, transparent 50%)`, zIndex: 1 }} />
            <div style={{ transform: "translateZ(80px)", position: "relative", zIndex: 2 }} className="h-full flex flex-col justify-between">{children}</div>
            <div className="absolute -bottom-20 -right-20 h-40 w-40 bg-[#00f2ff]/20 blur-[60px] rounded-full pointer-events-none" />
        </motion.div>
    );
};

export default function ComisionesPage() {
    const { showToast } = useToast();
    
    // --- ESTADOS ---
    const [activeTab, setActiveTab] = useState<'liquidar' | 'reglas' | 'historial' | 'bayt'>('liquidar');
    const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[1]);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [filterStatus, setFilterStatus] = useState<'all' | 'met' | 'pending'>('all');
    const [commissionModel, setCommissionModel] = useState<'revenue' | 'profit'>('revenue');
    const [settlements, setSettlements] = useState<CommissionSettlement[]>([]);
    const [config, setConfig] = useState({ target: 10000000, rate: 5.0 });

    // UI States
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isDateHovered, setIsDateHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [activeGuideStep, setActiveGuideStep] = useState(0);
    const [selectedSettlement, setSelectedSettlement] = useState<CommissionSettlement | null>(null);
    const [loading, setLoading] = useState(true);

    // --- CARGA ---
    useEffect(() => {
        const savedSettlements = localStorage.getItem('bayup_commissions_data');
        const savedConfig = localStorage.getItem('bayup_commissions_config');
        if (savedConfig) setConfig(JSON.parse(savedConfig));
        if (savedSettlements) { setSettlements(JSON.parse(savedSettlements)); } 
        else {
            const initial = [
                { id: 'c1', seller_id: 's1', seller_name: 'Elena Rodriguez', avatar: 'ER', total_sales: 12500000, total_profit: 4500000, status: 'pending', period: 'Febrero 2026' },
                { id: 'c2', seller_id: 's2', seller_name: 'Carlos Ruiz', avatar: 'CR', total_sales: 8400000, total_profit: 2100000, status: 'pending', period: 'Febrero 2026' },
                { id: 'c3', seller_id: 's3', seller_name: 'Ana Beltrán', avatar: 'AB', total_sales: 15800000, total_profit: 6200000, status: 'paid', period: 'Enero 2026', payment_date: '30 Ene 2026' }
            ];
            setSettlements(initial as any);
            localStorage.setItem('bayup_commissions_data', JSON.stringify(initial));
        }
        setLoading(false);
    }, []);

    const saveCommissions = (data: CommissionSettlement[]) => {
        setSettlements(data);
        localStorage.setItem('bayup_commissions_data', JSON.stringify(data));
    };

    // --- LÓGICA ---
    const formatCurrency = (amount: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    
    const processedData = useMemo(() => {
        return settlements.map(s => {
            const baseValue = commissionModel === 'revenue' ? s.total_sales : s.total_profit;
            const progress = Math.round((baseValue / config.target) * 100);
            const earned = baseValue >= config.target ? (baseValue * config.rate) / 100 : 0;
            return { ...s, progress, earned };
        });
    }, [settlements, commissionModel, config]);

    const filteredList = useMemo(() => {
        return processedData.filter(s => {
            const matchesSearch = s.seller_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPeriod = s.period === selectedPeriod;
            const matchesTab = activeTab === 'liquidar' ? s.status === 'pending' : activeTab === 'historial' ? s.status === 'paid' : true;
            let matchesFilter = true;
            if (filterStatus === 'met') matchesFilter = (s.progress || 0) >= 100;
            if (filterStatus === 'pending') matchesFilter = (s.progress || 0) < 100;
            return matchesSearch && matchesPeriod && matchesTab && matchesFilter;
        });
    }, [processedData, searchTerm, selectedPeriod, activeTab, filterStatus]);

    const globalStats = useMemo(() => {
        const totalEarned = filteredList.reduce((acc, s) => acc + (s.earned || 0), 0);
        const totalSales = filteredList.reduce((acc, s) => acc + s.total_sales, 0);
        const avgProgress = Math.round(filteredList.reduce((acc, s) => acc + (s.progress || 0), 0) / (filteredList.length || 1));
        return { totalEarned, totalSales, avgProgress };
    }, [filteredList]);

    // --- HANDLERS ---
    const handleConfirmPayment = () => {
        if (!selectedSettlement) return;
        const newData = settlements.map(s => s.id === selectedSettlement.id ? { ...s, status: 'paid' as const, payment_date: new Date().toLocaleDateString() } : s);
        saveCommissions(newData);
        setSelectedSettlement(null);
        showToast(`Pago confirmado para ${selectedSettlement.seller_name}`, "success");
    };

    if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin text-[#004d4d]" size={40} /></div>;

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-700">
            {/* Header Platinum */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4">
                <div>
                    <div className="flex items-center gap-3 mb-2"><span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span><span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Centro de Incentivos</span></div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">Liquidación <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">PRO</span></h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">&quot;Monitorea y recompensa el desempeño de tu fuerza de ventas.&quot;</p>
                </div>
                <div className="relative">
                    <button onClick={() => setIsPeriodModalOpen(!isPeriodModalOpen)} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6 hover:border-[#004d4d] transition-all group">
                        <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Periodo</p><p className="text-sm font-black text-gray-900">{selectedPeriod}</p></div>
                        <div className="h-10 w-10 bg-gray-900 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Calendar size={18} className="text-[#00f2ff]"/></div>
                    </button>
                    <AnimatePresence>{isPeriodModalOpen && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full mt-2 right-0 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50">{PERIODS.map(p => (<button key={p} onClick={() => { setSelectedPeriod(p); setIsPeriodModalOpen(false); }} className={`w-full text-left p-3 rounded-xl text-[10px] font-black uppercase ${p === selectedPeriod ? 'bg-[#004d4d] text-white' : 'hover:bg-gray-50 text-gray-500'}`}>{p}</button>))}</motion.div>}</AnimatePresence>
                </div>
            </div>

            {/* KPIs Dinámicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                <TiltCard className="p-8">
                    <div className="h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center text-[#004d4d]"><DollarSign size={24}/></div>
                    <div className="mt-6"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inversión en Comisiones</p><h3 className="text-2xl font-black text-gray-900 mt-1">$ <AnimatedNumber value={globalStats.totalEarned} /></h3></div>
                </TiltCard>
                <TiltCard className="p-8">
                    <div className="h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center text-[#00f2ff]"><Target size={24}/></div>
                    <div className="mt-6"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cumplimiento Global</p><h3 className="text-2xl font-black text-gray-900 mt-1">{globalStats.avgProgress}%</h3></div>
                </TiltCard>
                <TiltCard className="p-8">
                    <div className="h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center text-emerald-600"><ShoppingBag size={24}/></div>
                    <div className="mt-6"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Volumen Total Ventas</p><h3 className="text-2xl font-black text-gray-900 mt-1">$ <AnimatedNumber value={globalStats.totalSales} /></h3></div>
                </TiltCard>
                <TiltCard className="p-8">
                    <div className="h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center text-amber-500"><Users size={24}/></div>
                    <div className="mt-6"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Equipo Activo</p><h3 className="text-2xl font-black text-gray-900 mt-1">{filteredList.length} Asesores</h3></div>
                </TiltCard>
            </div>

            {/* Menu Tabs & Suite Platinum */}
            <div className="flex flex-col items-center gap-8 px-4">
                <div className="flex items-center gap-4">
                    <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl flex items-center overflow-x-auto relative z-10">
                        {[ { id: 'liquidar', label: 'Liquidación', icon: <CreditCard size={14}/> }, { id: 'reglas', label: 'Reglas/Metas', icon: <Scale size={14}/> }, { id: 'historial', label: 'Historial', icon: <LucideHistory size={14}/> }, { id: 'bayt', label: 'Bayt AI', icon: <Sparkles size={14}/> } ].map((tab) => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all z-10 whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}>{activeTab === tab.id && <motion.div layoutId="commTabGlow" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" />}<span className="flex items-center gap-2">{tab.icon} {tab.label}</span></button>
                        ))}
                    </div>
                    <button onClick={() => setIsGuideOpen(true)} className="h-12 w-12 rounded-full bg-white border border-gray-100 shadow-xl flex items-center justify-center text-[#004D4D] hover:bg-black hover:text-white transition-all"><Info size={20}/></button>
                </div>

                <div className="w-full max-w-[1100px] flex justify-between items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm transition-all focus-within:shadow-xl focus-within:border-[#004d4d]/20 relative z-20">
                    <div className="relative w-full"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} /><input type="text" placeholder="Buscar asesor por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-transparent text-sm font-bold outline-none placeholder:text-gray-300" /></div>
                    <div className="flex items-center gap-1">
                        <div className="relative">
                            <motion.button layout onMouseEnter={() => setIsFilterHovered(true)} onMouseLeave={() => setIsFilterHovered(false)} onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className={`h-12 flex items-center gap-2 px-4 rounded-xl transition-all ${isFilterMenuOpen ? 'bg-[#004d4d] text-white' : 'bg-gray-50 text-gray-500 hover:bg-white hover:border-gray-100'}`}><Filter size={18}/> <AnimatePresence>{isFilterHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase px-1">Filtros</motion.span>}</AnimatePresence></motion.button>
                            <AnimatePresence>{isFilterMenuOpen && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50"><button onClick={() => { setFilterStatus('all'); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 rounded-xl text-[10px] font-bold uppercase hover:bg-gray-50 rounded-xl">Todos</button><button onClick={() => { setFilterStatus('met'); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 rounded-xl text-[10px] font-bold uppercase hover:bg-gray-50 rounded-xl text-emerald-600">Metas Cumplidas</button></motion.div>}</AnimatePresence>
                        </div>
                        <div className="relative group/date"><motion.button layout onMouseEnter={() => setIsDateHovered(true)} onMouseLeave={() => setIsDateHovered(false)} className="h-12 flex items-center gap-2 px-4 rounded-xl bg-gray-50 text-gray-500 hover:bg-white hover:border-gray-100 transition-all"><Calendar size={18}/> <AnimatePresence>{isDateHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase px-1">Fechas</motion.span>}</AnimatePresence></motion.button><div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 opacity-0 scale-95 pointer-events-none group-hover/date:opacity-100 group-hover/date:scale-100 group-hover/date:pointer-events-auto transition-all z-50 flex gap-2"><input type="date" className="p-2 bg-gray-50 rounded-lg text-[10px] outline-none border border-transparent focus:border-[#004d4d]"/><input type="date" className="p-2 bg-gray-50 rounded-lg text-[10px] outline-none border border-transparent focus:border-[#004d4d]"/><button onClick={() => setDateRange({start:'', end:''})} className="p-2 bg-rose-50 text-rose-500 rounded-lg"><RotateCcw size={14}/></button></div></div>
                        <motion.button layout onMouseEnter={() => setIsExportHovered(true)} onMouseLeave={() => setIsExportHovered(false)} onClick={() => showToast("Exportando Reporte...", "info")} className="h-12 flex items-center gap-2 px-4 rounded-xl bg-gray-50 text-gray-500 hover:bg-white hover:border-gray-100 transition-all"><Download size={18}/> <AnimatePresence>{isExportHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase px-1">Excel</motion.span>}</AnimatePresence></motion.button>
                    </div>
                </div>
            </div>

            {/* CONTENIDO DE TABS */}
            <div className="px-4">
                <AnimatePresence mode="wait">
                    {/* LIQUIDACIÓN E HISTORIAL */}
                    {(activeTab === 'liquidar' || activeTab === 'historial') && (
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
                            {filteredList.map((s) => (
                                <motion.div key={s.id} whileHover={{ x: 5 }} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className="h-16 w-16 rounded-[1.8rem] bg-[#004d4d] text-white flex items-center justify-center text-xl font-black shadow-2xl">{s.avatar}</div>
                                        <div><h4 className="text-xl font-black text-gray-900">{s.seller_name}</h4><p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{s.status === 'paid' ? `Pagado el ${s.payment_date}` : 'Pendiente'}</p></div>
                                    </div>
                                    <div className="flex-[2] w-full space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase text-gray-400"><span>Progreso</span><span>{s.progress}%</span></div>
                                        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-100 shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(s.progress || 0, 100)}%` }} className="h-full bg-gradient-to-r from-[#004d4d] to-[#00f2ff]" /></div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right"><p className="text-[9px] font-black text-gray-400 uppercase">A Liquidar</p><p className="text-2xl font-black text-emerald-600">{formatCurrency(s.earned||0)}</p></div>
                                        <button onClick={() => setSelectedSettlement(s)} className="h-12 w-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-[#004d4d] flex items-center justify-center shadow-inner"><FileText size={20}/></button>
                                        {s.status === 'pending' && <button onClick={() => setSelectedSettlement(s)} className="h-12 px-6 bg-gray-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl">Liquidar</button>}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* BAYT AI: ESTRATEGIA Y REPORTES */}
                    {activeTab === 'bayt' && (
                        <motion.div key="bayt" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <TiltCard className="p-12 bg-gray-900 text-white">
                                <div className="space-y-8 h-full flex flex-col justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 bg-[#00f2ff]/10 text-[#00f2ff] rounded-2xl border border-[#00f2ff]/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.2)]"><Bot size={32}/></div>
                                        <div><h3 className="text-2xl font-black italic uppercase">Bayt Strategist</h3><p className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest mt-1">Análisis Predictivo de Nómina</p></div>
                                    </div>
                                    <p className="text-lg font-medium leading-relaxed italic text-gray-300">&quot;Basado en las ventas de Febrero, proyectamos un incremento del <span className="text-[#00f2ff] font-black">14%</span> en la utilidad neta si ajustas el acelerador de meta al 2.5% para el próximo periodo.&quot;</p>
                                    <div className="pt-8 border-t border-white/10 grid grid-cols-2 gap-6">
                                        <div className="space-y-1"><p className="text-[10px] font-black uppercase text-white/40">ROI x Incentivo</p><p className="text-xl font-black text-[#00f2ff]">4.2x</p></div>
                                        <div className="space-y-1"><p className="text-[10px] font-black uppercase text-white/40">Fuga de Utilidad</p><p className="text-xl font-black text-rose-400">0.8%</p></div>
                                    </div>
                                </div>
                            </TiltCard>
                            <div className="space-y-8">
                                <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3"><Lightbulb className="text-amber-500" size={20}/><h4 className="text-sm font-black uppercase">Recomendaciones Tácticas</h4></div>
                                    <div className="space-y-4">
                                        {[
                                            { t: 'Ajuste de Meta', d: 'Sube la meta global un 10% para Marzo.', i: <TrendingUp/> },
                                            { t: 'Bono por Utilidad', d: 'Activa bonos para ventas con margen >40%.', i: <PieChart/> }
                                        ].map((rec, i) => (
                                            <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-emerald-100 transition-all cursor-pointer">
                                                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-gray-400 shadow-sm">{rec.i}</div>
                                                <div><p className="text-xs font-black text-gray-900">{rec.t}</p><p className="text-[10px] font-medium text-gray-500">{rec.d}</p></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={() => showToast("Generando reporte de inteligencia...", "info")} className="w-full py-6 bg-[#004D4D] text-white rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4"><Download size={20}/> Descargar Reporte de Inteligencia</button>
                            </div>
                        </motion.div>
                    )}

                    {/* REGLAS Y METAS */}
                    {activeTab === 'reglas' && (
                        <motion.div key="reglas" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                            <div className="bg-white/40 p-10 rounded-[4rem] border border-white/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10">
                                <div className="space-y-4 max-w-xl"><div className="flex items-center gap-3"><Scale className="text-[#004d4d]" size={24}/><h3 className="text-2xl font-black text-[#004d4d] uppercase italic">Modelo de Comisión</h3></div><p className="text-sm font-medium text-gray-500 italic">&quot;Define si premias el Volumen de Venta o la Utilidad Neta.&quot;</p></div>
                                <div className="p-2 bg-white rounded-3xl border border-gray-100 flex gap-2">
                                    <button onClick={() => setCommissionModel('revenue')} className={`px-8 py-4 rounded-2xl text-[9px] font-black uppercase ${commissionModel === 'revenue' ? 'bg-[#004d4d] text-white shadow-lg' : 'text-gray-400'}`}>Venta Bruta</button>
                                    <button onClick={() => setCommissionModel('profit')} className={`px-8 py-4 rounded-2xl text-[9px] font-black uppercase ${commissionModel === 'profit' ? 'bg-[#004d4d] text-white shadow-lg' : 'text-gray-400'}`}>Utilidad Neta</button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* MODAL DETALLE / AUDITORIA / PAGO RECONECTADO */}
            <AnimatePresence>
                {selectedSettlement && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSettlement(null)} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-4xl rounded-[4rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-white">
                            <div className="w-full md:w-[350px] bg-gray-50 border-r border-gray-100 p-12 space-y-10">
                                <button onClick={() => setSelectedSettlement(null)} className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 shadow-sm transition-all group">
                                    <X size={20} className="group-hover:rotate-90 transition-transform" />
                                </button>
                                <div className="text-center space-y-4">
                                    <div className="h-24 w-24 bg-[#004d4d] text-white rounded-[2rem] flex items-center justify-center text-4xl font-black mx-auto shadow-2xl">{selectedSettlement.avatar}</div>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{selectedSettlement.seller_name}</h3>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                                    <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase"><span>Ventas:</span><span className="text-gray-900">{formatCurrency(selectedSettlement.total_sales)}</span></div>
                                    <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase"><span>Comisión:</span><span className="text-[#004d4d]">{formatCurrency(selectedSettlement.earned || 0)}</span></div>
                                </div>
                                <button onClick={() => { showToast("Generando comprobante...", "info"); }} className="w-full py-5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3">
                                    <Download size={16} className="text-[#00f2ff]"/> Descargar Auditoría
                                </button>
                            </div>
                            <div className="flex-1 flex flex-col bg-white p-12 space-y-8">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-12 w-12 bg-[#00f2ff]/10 text-[#00f2ff] rounded-2xl flex items-center justify-center shadow-lg"><Bot size={24}/></div>
                                    <div><h2 className="text-3xl font-black uppercase italic tracking-tighter">Análisis Bayt</h2></div>
                                </div>
                                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100"><p className="text-sm font-medium text-gray-600 leading-relaxed italic">&quot;El asesor presenta un cumplimiento verificado. Se procede a la liberación de fondos.&quot;</p></div>
                                {selectedSettlement.status === 'pending' && (
                                    <button onClick={handleConfirmPayment} className="mt-auto w-full py-6 bg-[#004D4D] text-white rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 group">
                                        <CheckCircle2 size={24} className="group-hover:scale-110 transition-transform"/> Confirmar Pago
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* TUTORIAL GUIA ELITE */}
            <AnimatePresence>
                {isGuideOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuideOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="relative bg-white w-full max-w-5xl h-[80vh] rounded-[4rem] shadow-3xl flex overflow-hidden border border-white">
                            <div className="w-72 bg-gray-50 border-r border-gray-100 p-8 flex flex-col gap-3">
                                <div className="h-12 w-12 bg-gray-900 text-[#00f2ff] rounded-2xl flex items-center justify-center mb-6 shadow-lg"><Bot size={24}/></div>
                                {[ {id:0, label:'Indicadores KPIs', icon:<BarChart3/>}, {id:1, label:'Tab Liquidación', icon:<CreditCard/>}, {id:2, label:'Tab Reglas Metas', icon:<Scale/>}, {id:3, label:'Tab Historial', icon:<LucideHistory/>}, {id:4, label:'Tab Bayt AI', icon:<Sparkles/>} ].map(s => (<button key={s.id} onClick={() => setActiveGuideStep(s.id)} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${activeGuideStep === s.id ? 'bg-[#004D4D] text-white shadow-xl' : 'text-gray-400 hover:bg-white hover:text-gray-900'}`}>{s.icon} <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span></button>))}
                            </div>
                            <div className="flex-1 p-16 flex flex-col justify-between relative overflow-y-auto custom-scrollbar bg-white">
                                <button onClick={() => setIsGuideOpen(false)} className="absolute top-10 right-10 text-gray-300 hover:text-rose-500 transition-colors z-[100]"><X size={24}/></button>
                                <div className="space-y-12">
                                    {activeGuideStep === 0 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Arquitectura de <span className="text-[#004D4D]">Métricas</span></h2>
                                                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">&quot;Entiende los latidos de tu inversión comercial en tiempo real.&quot;</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:bg-white hover:shadow-xl transition-all">
                                                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-[#004d4d] mb-6 shadow-sm"><DollarSign size={24}/></div>
                                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Inversión en Nómina</p>
                                                    <p className="text-sm font-medium text-gray-600 mt-2 italic">Representa el capital total generado por el esfuerzo comercial de tu equipo.</p>
                                                </div>
                                                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:bg-white hover:shadow-xl transition-all">
                                                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-[#00f2ff] mb-6 shadow-sm"><Target size={24}/></div>
                                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Efficiency Rate</p>
                                                    <p className="text-sm font-medium text-gray-600 mt-2 italic">Métrica que mide qué tan cerca está tu equipo de cumplir el 100% de la meta global.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {activeGuideStep === 1 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Tab <span className="text-[#004D4D]">Liquidación</span></h2>
                                                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">Gestiona y procesa los incentivos del periodo activo.</p>
                                            </div>
                                            <div className="relative p-10 bg-[#001A1A] rounded-[3.5rem] overflow-hidden text-white shadow-2xl">
                                                <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle2 size={120}/></div>
                                                <div className="space-y-6 relative z-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-full bg-[#00f2ff] text-gray-900 flex items-center justify-center font-black">1</div>
                                                        <p className="text-sm font-black uppercase tracking-widest text-[#00f2ff]">Verificar Ventas</p>
                                                    </div>
                                                    <div className="flex items-center gap-4 opacity-60">
                                                        <div className="h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center font-black">2</div>
                                                        <p className="text-sm font-black uppercase tracking-widest">Ejecutar Pago</p>
                                                    </div>
                                                    <div className="flex items-center gap-4 opacity-60">
                                                        <div className="h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center font-black">3</div>
                                                        <p className="text-sm font-black uppercase tracking-widest">Generar Auditoría</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {activeGuideStep === 2 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Tab <span className="text-[#004D4D]">Reglas & Metas</span></h2>
                                                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">Define el ADN comercial de tu marca.</p>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="p-8 bg-[#004D4D]/5 border border-[#004D4D]/10 rounded-[2.5rem] flex items-center gap-8">
                                                    <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-[#004d4d] shadow-xl"><TrendingUp size={32}/></div>
                                                    <div><h4 className="text-lg font-black uppercase text-gray-900 tracking-tight">Venta Bruta</h4><p className="text-xs text-gray-500 font-medium mt-1 italic">Premia el volumen total de transacciones para ganar mercado.</p></div>
                                                </div>
                                                <div className="p-8 bg-purple-50 border border-purple-100 rounded-[2.5rem] flex items-center gap-8">
                                                    <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-purple-600 shadow-xl"><Scale size={32}/></div>
                                                    <div><h4 className="text-lg font-black uppercase text-gray-900 tracking-tight">Utilidad Neta</h4><p className="text-xs text-gray-500 font-medium mt-1 italic">Premia la rentabilidad real de cada venta protegida.</p></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {activeGuideStep === 3 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Tab <span className="text-[#004D4D]">Historial</span></h2>
                                                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">Tu bóveda digital de liquidaciones pasadas.</p>
                                            </div>
                                            <div className="p-10 bg-gray-50 rounded-[3rem] border border-gray-100 relative overflow-hidden">
                                                <div className="flex items-center gap-6 mb-8">
                                                    <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-[#004d4d] shadow-lg"><LucideHistory size={28}/></div>
                                                    <div><p className="text-xl font-black text-gray-900">Búsqueda Forense</p><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Auditoría Permanente</p></div>
                                                </div>
                                                <p className="text-xs font-medium text-gray-500 leading-relaxed italic">Consulta liquidaciones históricas por asesor o periodo. Ideal para revisiones contables y reportes de fin de año.</p>
                                            </div>
                                        </div>
                                    )}
                                    {activeGuideStep === 4 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Tab <span className="text-[#004D4D]">Bayt AI</span></h2>
                                                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">Inteligencia de datos aplicada a tu rentabilidad.</p>
                                            </div>
                                            <div className="p-10 bg-gray-900 rounded-[3.5rem] relative overflow-hidden text-white shadow-2xl">
                                                <div className="absolute top-0 right-0 p-4 opacity-10"><Bot size={100}/></div>
                                                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                                    <div className="h-20 w-20 bg-[#00f2ff]/10 text-[#00f2ff] rounded-[2rem] border border-[#00f2ff]/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,242,255,0.2)] animate-pulse"><Bot size={40}/></div>
                                                    <p className="text-lg font-medium leading-relaxed italic text-gray-300">&quot;Bayt analiza el desempeño histórico para sugerirte ajustes en tus reglas de comisión que optimicen tu flujo de caja.&quot;</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setIsGuideOpen(false)} className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-2xl">Entendido, Continuar Gestión</button>
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
