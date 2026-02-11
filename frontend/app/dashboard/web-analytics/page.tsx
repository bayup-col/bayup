"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  TrendingUp, TrendingDown, Target, Zap, Eye, MousePointer2, DollarSign, Activity, Users, Globe, Clock, 
  ShoppingCart, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Monitor, Smartphone, Search, 
  PieChart as LucidePieChart, BarChart3, Calendar, Layers, Sparkles, ChevronDown, Timer, ExternalLink, MessageSquare, 
  Mail, Share2, Download, Rocket, Trophy, ChevronRight, CheckCircle2, X, ArrowRight, Tag, AlertCircle,
  ZapIcon, Bot, Lightbulb, Info, HelpCircle, Radar, QrCode, Save, Filter, RotateCcw, ShieldCheck, Workflow
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '@/lib/jspdf-types';

// --- COMPONENTE NÚMEROS ANIMADOS ---
function AnimatedNumber({ value }: { value: number | string }) {
    const [display, setDisplay] = useState(0);
    const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
    useEffect(() => {
        let start = 0; const end = numericValue; const duration = 1000; const increment = end / (duration / 16);
        const timer = setInterval(() => {
            start += increment; if (start >= end) { setDisplay(end); clearInterval(timer); }
            else { setDisplay(Math.floor(start)); }
        }, 16);
        return () => clearInterval(timer);
    }, [numericValue]);
    if (typeof value === 'string' && value.includes('%')) return <span>{display.toFixed(1)}%</span>;
    return <span>{display.toLocaleString('es-CO')}</span>;
}

// --- COMPONENTE TILT CARD PLATINUM ---
const TiltCard = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => {
    const [rotateX, setRotateX] = useState(0); const [rotateY, setRotateY] = useState(0);
    const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget; const box = card.getBoundingClientRect();
        const centerX = box.width / 2; const centerY = box.height / 2;
        setRotateX((e.clientY - box.top - centerY) / 7); setRotateY((centerX - (e.clientX - box.left)) / 7);
        setGlarePos({ x: ((e.clientX - box.left)/box.width)*100, y: ((e.clientY - box.top)/box.height)*100, opacity: 0.3 });
    };
    return (
        <motion.div onClick={onClick} onMouseMove={handleMouseMove} onMouseLeave={() => { setRotateX(0); setRotateY(0); setGlarePos(p => ({...p, opacity: 0})); }} animate={{ rotateX, rotateY, scale: rotateX !== 0 ? 1.05 : 1 }} transition={{ type: "spring", stiffness: 250, damping: 20 }} style={{ transformStyle: "preserve-3d", perspective: "1000px" }} className={`bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/80 shadow-2xl group relative overflow-hidden h-full cursor-pointer ${className}`}>
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-300" style={{ opacity: glarePos.opacity, background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.9) 0%, transparent 50%)`, zIndex: 1 }} />
            <div style={{ transform: "translateZ(80px)", position: "relative", zIndex: 2 }}>{children}</div>
            <div className="absolute -bottom-20 -right-20 h-40 w-40 bg-[#00f2ff]/20 blur-[60px] rounded-full pointer-events-none" />
        </motion.div>
    );
};

export default function WebAnalyticsPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'traffic' | 'conversion' | 'audience' | 'inventory' | 'marketing'>('overview');
    
    // UI States
    const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
    const [selectedInventoryCategory, setSelectedInventoryCategory] = useState<string | null>(null);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [activeGuideStep, setActiveGuideStep] = useState(0);
    const [isRadarModalOpen, setIsRadarModalOpen] = useState(false);
    const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
    const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
    const [startMonth, setStartMonth] = useState('Enero 2026');
    const [endMonth, setEndMonth] = useState('Enero 2026');
    
    // Search Suite States
    const [searchTerm, setSearchTerm] = useState("");
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isDateHovered, setIsDateHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const availableMonths = ['Octubre 2025', 'Noviembre 2025', 'Diciembre 2025', 'Enero 2026', 'Febrero 2026', 'Marzo 2026'];

    const formatCurrency = (amount: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');

    // --- PDF EXPORT PLATINUM ---
    const handleDownloadReport = () => {
        const savedSettings = localStorage.getItem('bayup_general_settings');
        const bizName = savedSettings ? JSON.parse(savedSettings)?.identity?.name : 'Tienda Bayup';
        const doc = new jsPDF();
        
        doc.setFillColor(0, 26, 26); doc.rect(0, 0, 210, 50, 'F');
        doc.setTextColor(0, 242, 255); doc.setFontSize(24); doc.text("AUDITORÍA ESTRATÉGICA BI", 105, 25, { align: 'center' });
        doc.setFontSize(10); doc.text(`EMPRESA: ${bizName.toUpperCase()} | PERIODO: ${startMonth} - ${endMonth}`, 105, 35, { align: 'center' });

        autoTable(doc, {
            startY: 60,
            head: [['Métrica Principal', 'Valor Real', 'Eficiencia']],
            body: [
                ['Ventas Totales Brutas', formatCurrency(0), '0%'],
                ['Ticket Promedio de Venta', formatCurrency(0), 'N/A'],
                ['Tasa de Conversión General', '0%', 'N/A'],
                ['Pedidos Procesados Hoy', '0 pedidos', 'Iniciando']
            ],
            headStyles: { fillColor: [0, 77, 77] },
            theme: 'striped'
        });

        doc.save(`Auditoria_BI_${bizName.replace(/\s/g, '_')}.pdf`);
        showToast("Reporte Platinum descargado 📄", "success");
    };

    // --- RENDERS ---
    const renderOverview = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="bg-[#001a1a] p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center gap-12 border border-white/10">
                <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(0,242,255,0.08)_0%,_transparent_60%)] animate-pulse"></div>
                <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center shadow-3xl shrink-0 z-10"><Bot size={64} className="text-[#00f2ff] animate-pulse" /></div>
                <div className="flex-1 space-y-4 relative z-10">
                    <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#00f2ff]/20">Bayt Strategic Intelligence</span>
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter">Análisis de Operación Global</h3>
                    <p className="text-gray-300 text-lg font-medium leading-relaxed italic">"Bayt está recopilando datos de tu tienda. Muy pronto recibirás sugerencias estratégicas para maximizar tu rentabilidad."</p>
                </div>
                <button onClick={() => setActiveTab('marketing')} className="relative z-10 px-10 py-5 bg-[#00f2ff] text-[#001a1a] rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-3xl flex items-center gap-3"><Rocket size={18}/> Activar Monitor</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[ 
                    { id: 'ventas', label: 'Ventas Hoy', val: 0, trend: 'Live', up: true, icon: <DollarSign/>, color: 'text-[#004d4d]' }, 
                    { id: 'ticket', label: 'Ticket Promedio', val: 0, trend: 'N/A', up: true, icon: <ShoppingCart/>, color: 'text-purple-500' }, 
                    { id: 'pedidos', label: 'Pedidos Hoy', val: 0, trend: 'Live', up: true, icon: <Package/>, color: 'text-blue-500' }, 
                    { id: 'conversion', label: 'Tasa Conversión', val: '0%', trend: 'N/A', up: true, icon: <Target/>, color: 'text-emerald-500' }, 
                ].map((kpi, i) => (
                    <TiltCard key={i} onClick={() => setSelectedKPI(kpi.id)}>
                        <div className="p-8">
                            <div className="flex justify-between items-start"><div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color}`}>{kpi.icon}</div><div className={`text-[10px] font-black px-2 py-1 rounded-lg ${kpi.up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{kpi.trend}</div></div>
                            <div className="mt-6"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p><h3 className="text-2xl font-black text-gray-900 mt-1">{typeof kpi.val === 'number' && "$ "}<AnimatedNumber value={kpi.val} /></h3></div>
                        </div>
                    </TiltCard>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/60 backdrop-blur-md p-12 rounded-[4rem] border border-white/80 shadow-sm space-y-8">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-6"><div className="flex items-center gap-4"><div className="h-12 w-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center"><CheckCircle2 size={24}/></div><h4 className="text-xl font-black text-gray-900 italic uppercase">Estado de Salida</h4></div><span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-lg border border-emerald-100">Optimizado</span></div>
                    <p className="text-gray-500 font-medium italic leading-relaxed">No se detectan fugas de capital críticas. El flujo de tu checkout se mantiene saludable.</p>
                    <div className="grid grid-cols-2 gap-8"><div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-inner text-center"><p className="text-2xl font-black text-gray-900">$ 0</p><p className="text-[9px] font-black text-gray-400 uppercase mt-2 tracking-widest">Valor Perdido</p></div><div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-inner text-center"><p className="text-2xl font-black text-emerald-600">0</p><p className="text-[9px] font-black text-gray-400 uppercase mt-2 tracking-widest">Abandonos</p></div></div>
                </div>
                <div className="bg-[#004d4d] p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden border border-white/5 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><CheckCircle2 size={200} fill="white"/></div>
                    <div className="space-y-8 relative z-10">
                        <div className="flex justify-between items-center border-b border-white/10 pb-6"><div className="flex items-center gap-4"><div className="h-12 w-12 bg-white/10 text-[#00f2ff] rounded-2xl flex items-center justify-center"><ShieldCheck size={24}/></div><h4 className="text-xl font-black uppercase italic tracking-tight">Éxito de Recuperación</h4></div><span className="px-3 py-1 bg-[#00f2ff]/10 text-[#00f2ff] text-[8px] font-black uppercase rounded-lg">Stand-by</span></div>
                        <p className="text-gray-200 text-lg font-medium italic">"Bayup AI está monitoreando tus carritos. Activaremos el protocolo de rescate automáticamente."</p>
                        <div className="grid grid-cols-2 gap-8 mt-6"><div className="text-left"><p className="text-4xl font-black text-[#00f2ff]">$ 0</p><p className="text-[9px] font-black text-white/40 uppercase mt-2">Rescatado Hoy</p></div><div className="text-right"><p className="text-4xl font-black text-white">0%</p><p className="text-[9px] font-black text-white/40 uppercase mt-2">ROI Proyectado</p></div></div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderActionBar = () => (
        <div className="w-full max-w-[1100px] mx-auto flex justify-between items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm focus-within:shadow-xl transition-all relative z-30 px-4">
            <div className="relative w-full"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} /><input type="text" placeholder="Buscar métrica o reporte..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-transparent text-sm font-bold outline-none placeholder:text-gray-300" /></div>
            <div className="flex items-center gap-1">
                <motion.button layout onMouseEnter={() => setIsFilterHovered(true)} onMouseLeave={() => setIsFilterHovered(false)} className="h-12 flex items-center gap-2 px-4 rounded-xl bg-gray-50 text-gray-500 hover:bg-white transition-all"><Filter size={18}/> <AnimatePresence>{isFilterHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase px-1">Filtros</motion.span>}</AnimatePresence></motion.button>
                <div className="relative group/date">
                    <motion.button layout onMouseEnter={() => setIsDateHovered(true)} onMouseLeave={() => setIsDateHovered(false)} className="h-12 flex items-center gap-2 px-4 rounded-xl bg-gray-50 text-gray-500 hover:bg-white transition-all"><Calendar size={18}/> <AnimatePresence>{isDateHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase px-1">Periodo</motion.span>}</AnimatePresence></motion.button>
                    <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 opacity-0 scale-95 pointer-events-none group-hover/date:opacity-100 group-hover/date:scale-100 group-hover/date:pointer-events-auto transition-all z-50 flex gap-2"><input type="date" className="p-2 bg-gray-50 rounded-lg text-[10px] outline-none"/><input type="date" className="p-2 bg-gray-50 rounded-lg text-[10px] outline-none"/><button onClick={() => setDateRange({start:'', end:''})} className="p-2 bg-rose-50 text-rose-500 rounded-lg transition-colors hover:bg-rose-100"><RotateCcw size={14}/></button></div>
                </div>
                <motion.button layout onMouseEnter={() => setIsExportHovered(true)} onMouseLeave={() => setIsExportHovered(false)} onClick={handleDownloadReport} className="h-12 flex items-center gap-2 px-4 rounded-xl bg-gray-50 text-gray-500 hover:bg-white transition-all"><Download size={18}/> <AnimatePresence>{isExportHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase px-1">Exportar</motion.span>}</AnimatePresence></motion.button>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 pb-32 animate-in fade-in duration-1000">
            {/* Header Maestro */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 px-4">
                <div className="flex items-center gap-8">
                    <div className="h-20 w-20 bg-gray-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative border-2 border-white/10 shrink-0"><BarChart3 className="text-white" size={36} /></div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#00f2ff] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#004d4d]/60 italic">Intelligence & Analytics v2.0</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-[#001A1A]">
                                ESTADÍSTICAS <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-[#004d4d]">MAESTRAS</span>
                            </h1>
                            <button onClick={() => setIsGuideOpen(true)} className="h-12 w-12 rounded-full bg-white border border-gray-100 shadow-xl flex items-center justify-center text-[#004D4D] hover:bg-black hover:text-white transition-all group shrink-0"><Info size={20} className="group-hover:scale-110 transition-transform" /></button>
                        </div>
                                            <p className="text-gray-400 font-medium text-lg italic max-w-2xl mt-4">
                                                Hola <span className="text-[#004d4d] font-bold">{(token ? 'Socio' : 'Usuario')}</span>, ¡este es el resumen del día para ti! 👋
                                            </p>                    </div>
                </div>
                <div className="flex items-center gap-4 relative">
                    <button onClick={() => setIsRadarModalOpen(true)} className="h-20 bg-white/60 backdrop-blur-xl px-10 rounded-[2rem] font-black text-[10px] uppercase tracking-widest border border-white/80 shadow-sm flex items-center gap-4 hover:border-[#00f2ff]/30 transition-all group">
                        <Radar size={22} className="text-[#004d4d] group-hover:rotate-90 transition-transform" /> Mapa Live
                    </button>
                    
                    <div className="relative">
                        <button onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)} className="h-20 bg-white/60 backdrop-blur-xl px-10 rounded-[2rem] font-black text-[10px] uppercase tracking-widest border border-white/80 shadow-sm flex items-center gap-4 hover:border-[#004d4d]/20 transition-all group active:scale-95">
                            <Calendar size={22} className="text-[#004d4d]" /><div className="text-left"><p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Periodo</p><p className="text-sm font-black text-gray-900 italic tracking-tighter">{startMonth} - {endMonth}</p></div><ChevronDown size={18} className={`text-gray-300 transition-transform duration-500 ${isPeriodDropdownOpen ? 'rotate-180 text-[#004d4d]' : ''}`} />
                        </button>
                        <AnimatePresence>{isPeriodDropdownOpen && (<motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="absolute top-full right-0 mt-4 bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-3xl border border-gray-100 p-10 z-[600] min-w-[500px]"><div className="grid grid-cols-2 gap-12"><div className="space-y-6"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-emerald-500"></div> Mes Inicio</p><div className="space-y-2 max-h-60 overflow-y-auto pr-4 custom-scrollbar">{availableMonths.map(m=>(<button key={m} onClick={()=>setStartMonth(m)} className={`w-full px-6 py-3 text-left text-[11px] font-black uppercase rounded-2xl transition-all ${startMonth===m?'bg-gray-900 text-white shadow-xl':'text-gray-500 hover:bg-gray-50'}`}>{m}</button>))}</div></div><div className="space-y-6 border-l border-gray-100 pl-12"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-rose-500"></div> Mes Cierre</p><div className="space-y-2 max-h-60 overflow-y-auto pr-4 custom-scrollbar">{availableMonths.map(m=>(<button key={m} onClick={()=>setEndMonth(m)} className={`w-full px-6 py-3 text-left text-[11px] font-black uppercase rounded-2xl transition-all ${endMonth===m?'bg-gray-900 text-white shadow-xl':'text-gray-500 hover:bg-gray-50'}`}>{m}</button>))}</div></div></div><div className="mt-10 pt-8 border-t border-gray-100 flex justify-end"><button onClick={()=>setIsPeriodDropdownOpen(false)} className="px-10 py-4 bg-[#004d4d] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-black transition-all">Aplicar Rango</button></div></motion.div>)}</AnimatePresence>
                    </div>
                </div>
            </div>

            {renderActionBar()}

            {/* Navegación Central */}
            <div className="flex items-center justify-center pt-4 z-20 px-4">
                <div className="flex bg-white/80 backdrop-blur-2xl p-2 rounded-full border border-gray-100 shadow-2xl gap-2 w-full max-w-6xl overflow-x-auto no-scrollbar relative">
                    {[ { id: 'overview', label: 'Resumen', icon: <LucidePieChart size={16}/> }, { id: 'traffic', label: 'Tráfico', icon: <Globe size={16}/> }, { id: 'conversion', label: 'Ventas', icon: <Target size={16}/> }, { id: 'audience', label: 'Audiencia', icon: <Users size={16}/> }, { id: 'inventory', label: 'Stock', icon: <Package size={16}/> }, { id: 'marketing', label: 'Marketing', icon: <Rocket size={16}/> } ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 flex items-center justify-center gap-3 px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap relative z-10 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-600'}`}>{isActive && (<motion.div layoutId="activeWebTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />)}<span className="relative z-20 flex items-center gap-2">{tab.icon} {tab.label}</span></button>
                        );
                    })}
                </div>
            </div>

            {/* Contenido Dinámico */}
            <div className="min-h-[800px] px-4">
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.5 }}>
                        {activeTab === 'overview' && renderOverview()}
                        {activeTab === 'traffic' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="bg-white/60 backdrop-blur-md p-12 rounded-[4rem] border border-white/80 shadow-sm space-y-10"><h4 className="text-xl font-black italic uppercase text-gray-900">Rutas de Adquisición</h4><div className="space-y-8">{[ { s: 'Directo', p: '36%', c: 'bg-gray-900' }, { s: 'Instagram Ads', p: '25%', c: 'bg-purple-600' }, { s: 'Google SEO', p: '14%', c: 'bg-[#004d4d]' } ].map((item, i) => (<div key={i} className="space-y-3 group"><div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span className="text-gray-400 group-hover:text-gray-900 transition-colors">{item.s}</span><span>{item.p}</span></div><div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden p-0.5 shadow-inner border border-gray-100"><motion.div initial={{ width: 0 }} animate={{ width: item.p }} className={`h-full ${item.c} rounded-full shadow-sm`} /></div></div>))}</div></div>
                                    <div className="bg-[#001a1a] p-12 rounded-[4rem] text-white flex flex-col justify-between border border-white/5 shadow-2xl relative overflow-hidden group"><div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700"><Clock size={200} /></div><h4 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-3 relative z-10"><Timer className="text-[#00f2ff] animate-pulse"/> Hora de Oro</h4><p className="text-gray-300 italic relative z-10 mt-6">"Tus ventas se concentran entre las <span className="text-white font-black underline decoration-[#00f2ff] decoration-2 underline-offset-8">8:30 PM y 10:00 PM</span>. Bayt recomienda programar tus disparos push en este rango."</p><div className="flex items-end gap-1 h-16 mt-8 relative z-10">{[20, 40, 60, 100, 80, 30].map((h, i) => (<div key={i} className="flex-1 bg-white/5 rounded-t-lg relative h-full overflow-hidden"><div className={`absolute bottom-0 w-full ${h > 80 ? 'bg-[#00f2ff] shadow-[0_0_10px_#00f2ff]' : 'bg-gray-700'}`} style={{ height: `${h}%` }}></div></div>))}</div></div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'conversion' && (
                            <div className="bg-white/60 backdrop-blur-md p-16 rounded-[4rem] border border-white/80 shadow-sm max-w-5xl mx-auto relative overflow-hidden animate-in fade-in duration-500">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#004d4d] via-[#00f2ff] to-emerald-500" />
                                <h3 className="text-4xl font-black text-gray-900 tracking-tight italic uppercase text-center mb-20">Embudo de Conversión Real</h3>
                                <div className="space-y-6">
                                    {[ { s: 'Sesiones Globales', p: 100, v: '12,450', i: 'Base de entrada' }, { s: 'Visualización de Producto', p: 67, v: '8,420', i: 'Interés real' }, { s: 'Adición al Carrito', p: 17, v: '2,150', i: 'Intención de compra' }, { s: 'Compra Finalizada', p: 4.2, v: '524', i: 'Cierre de caja' } ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-12 p-10 hover:bg-white rounded-[3.5rem] border border-transparent hover:border-gray-100 transition-all group">
                                            <div className="w-16 h-16 bg-gray-900 text-[#00f2ff] rounded-2xl flex items-center justify-center font-black text-xl shadow-xl italic group-hover:scale-110 transition-transform">0{i+1}</div>
                                            <div className="flex-1 space-y-4">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span>{item.s} <span className="text-gray-300 ml-2 italic">({item.i})</span></span><span>{item.v} ({item.p}%)</span></div>
                                                <div className="h-4 bg-gray-50 rounded-full overflow-hidden p-1 border border-gray-100 shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: `${item.p}%` }} className={`h-full ${i === 3 ? 'bg-[#00f2ff] shadow-[0_0_15px_#00f2ff]' : 'bg-[#004d4d]'} rounded-full`} /></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activeTab === 'audience' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="bg-white/60 backdrop-blur-md p-12 rounded-[4rem] border border-white/80 shadow-sm space-y-10">
                                        <h4 className="text-sm font-black uppercase tracking-[0.2em] italic text-gray-900 flex items-center gap-3"><Users size={20} className="text-purple-500"/> Composición Demográfica</h4>
                                        <div className="space-y-8 pt-4">
                                            {[ { g: 'Mujeres', p: '68%', c: 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.3)]' }, { g: 'Hombres', p: '28%', c: 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.3)]' }, { g: 'Otros', p: '4%', c: 'bg-gray-300' } ].map((item, i) => (
                                                <div key={i} className="space-y-3">
                                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span className="text-gray-400">{item.g}</span><span className="text-gray-900">{item.p}</span></div>
                                                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: item.p }} className={`h-full ${item.c} rounded-full`} /></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-[#001a1a] p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden border border-white/5 group">
                                        <div className="absolute -right-10 -bottom-10 text-[12rem] font-black text-white/5 pointer-events-none italic uppercase group-hover:scale-110 transition-transform duration-1000">TECH</div>
                                        <h4 className="text-sm font-black uppercase tracking-[0.2em] italic text-[#00f2ff] flex items-center gap-3 relative z-10"><Monitor size={20}/> Origen Tecnológico</h4>
                                        <div className="grid grid-cols-2 gap-12 mt-12 relative z-10 text-center">
                                            <div className="p-8 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all"><Smartphone size={40} className="mx-auto text-emerald-400 mb-4"/><p className="text-4xl font-black italic tracking-tighter">82%</p><p className="text-[9px] font-black text-white/40 uppercase mt-2">Móvil</p></div>
                                            <div className="p-8 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all"><Monitor size={40} className="mx-auto text-blue-400 mb-4"/><p className="text-4xl font-black italic tracking-tighter">18%</p><p className="text-[9px] font-black text-white/40 uppercase mt-2">Escritorio</p></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'inventory' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <div className="bg-[#1e1b4b] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row items-center gap-16 group">
                                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000"><Package size={300} /></div>
                                    <div className="h-32 w-32 bg-white/10 rounded-[3rem] flex items-center justify-center border border-white/20 backdrop-blur-md relative z-10 shadow-3xl animate-pulse"><ZapIcon size={48} className="text-[#00f2ff]"/></div>
                                    <div className="flex-1 space-y-6 relative z-10">
                                        <h3 className="text-4xl font-black uppercase italic tracking-tighter">Stock Inteligente Bayt</h3>
                                        <p className="text-purple-100 text-xl font-medium italic leading-relaxed">"Detecto riesgo de quiebre en <span className="text-white font-black underline decoration-[#00f2ff] decoration-2 underline-offset-8">Tabletas Purificadoras X</span>. Recomiendo reposición de 450 uds hoy."</p>
                                        <button className="px-10 py-5 bg-white text-[#1e1b4b] rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-[#00f2ff] transition-all active:scale-95">Gestionar Inventario AI</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {[ { id: 'winners', label: 'Ganadores', val: '+$124M', icon: <Trophy/>, c: 'text-emerald-500', bg: 'bg-emerald-500/5' }, { id: 'stuck', label: 'Estancado', val: '$24.5M', icon: <AlertTriangle/>, c: 'text-rose-600', bg: 'bg-rose-500/5' } ].map((cat, i) => (
                                        <TiltCard key={i} onClick={() => setSelectedInventoryCategory(cat.id as any)}>
                                            <div className="p-10 relative h-full">
                                                <div className={`absolute -right-4 -top-4 w-40 h-40 ${cat.bg} rounded-full blur-3xl`} />
                                                <div className="relative z-10 flex justify-between items-center"><div className={`h-14 w-14 rounded-2xl bg-white shadow-inner flex items-center justify-center ${cat.c}`}>{cat.icon}</div><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">{cat.label} Analyzer</span></div>
                                                <div className="relative z-10 mt-10"><h3 className="text-4xl font-black text-gray-900 tracking-tighter italic">{cat.val}</h3><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Impacto en Liquidez</p></div>
                                            </div>
                                        </TiltCard>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activeTab === 'marketing' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {[ { l: 'Email Marketing', v: '1,240', r: 2100000, i: <Mail/>, c: 'text-purple-600' }, { l: 'WhatsApp Direct', v: '680', r: 3300000, i: <MessageSquare/>, c: 'text-emerald-600' }, { l: 'ROI Rescate AI', v: '+420%', r: 5400000, i: <TrendingUp/>, c: 'text-[#00f2ff]' } ].map((m, i) => (
                                        <div key={i} className={`p-10 rounded-[4rem] border border-white/80 shadow-sm flex flex-col items-center gap-6 ${i === 2 ? 'bg-[#001a1a] text-white border-white/5 shadow-3xl' : 'bg-white/60 backdrop-blur-md'}`}>
                                            <div className={`h-16 w-16 rounded-[2rem] bg-gray-900 flex items-center justify-center shadow-xl ${m.c}`}>{m.i}</div>
                                            <div className="text-center"><h4 className="text-3xl font-black italic tracking-tighter">{m.v}</h4><p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{m.l}</p></div>
                                            <p className={`text-xl font-black ${i === 2 ? 'text-[#00f2ff]' : 'text-emerald-600'}`}>{formatCurrency(m.r)}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white/60 backdrop-blur-md rounded-[4rem] border border-white/80 shadow-sm overflow-hidden">
                                    <div className="p-10 border-b border-gray-100 flex justify-between items-center"><h4 className="text-sm font-black uppercase tracking-[0.3em] italic text-gray-900">Rendimiento de Cupones AI</h4><button className="h-12 px-8 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Exportar Reporte</button></div>
                                    <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-50 text-left"><thead className="bg-gray-50/50"><tr><th className="px-12 py-8 text-[10px] font-black text-gray-400 uppercase">Cupón</th><th className="px-12 py-8 text-[10px] font-black text-gray-400 uppercase text-center">Efectividad</th><th className="px-12 py-8 text-[10px] font-black text-gray-400 uppercase text-right">Ingreso Bruto</th></tr></thead>
                                    <tbody className="divide-y divide-gray-50">{[ { c: 'WELCOME10', e: '28%', r: 12450000 }, { c: 'PROMOVERANO', e: '42%', r: 8900000 } ].map((item, i) => (<tr key={i} className="hover:bg-white group transition-all"><td className="px-12 py-8"><span className="px-4 py-2 bg-gray-900 text-[#00f2ff] rounded-xl font-black text-xs uppercase font-mono shadow-md">{item.c}</span></td><td className="px-12 py-8 text-center font-black italic text-gray-900">{item.e}</td><td className="px-12 py-8 text-right font-black italic text-emerald-600">{formatCurrency(item.r)}</td></tr>))}</tbody></table></div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* MODALES PLATINUM PLUS */}
            <AnimatePresence>
                {selectedKPI && (
                    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedKPI(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-3xl overflow-hidden border border-white">
                            <div className="p-10 bg-gradient-to-br from-gray-900 to-[#001a1a] text-white relative">
                                <button onClick={() => setSelectedKPI(null)} className="absolute top-6 right-6 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all group z-10"><X size={20} className="group-hover:rotate-90 transition-transform"/></button>
                                <div className="space-y-4"><h3 className="text-3xl font-black italic uppercase tracking-tighter">Supply Intelligence</h3><p className="text-[10px] font-black uppercase text-[#00f2ff] tracking-[0.3em] mt-2 italic">Business Analysis Bayup</p></div>
                            </div>
                            <div className="p-10 space-y-8">
                                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-inner"><p className="text-sm font-medium italic text-gray-600 leading-relaxed">"Bayt ha analizado la fluctuación de {selectedKPI}. Se detecta una tendencia positiva del +18% este mes, impulsada principalmente por automatizaciones de WhatsApp AI."</p></div>
                                <button onClick={() => setSelectedKPI(null)} className="w-full py-6 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase shadow-xl hover:bg-black active:scale-95 transition-all">Cerrar Análisis</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isRadarModalOpen && (
                    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRadarModalOpen(false)} className="absolute inset-0 bg-black/95 backdrop-blur-3xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#001a1a] w-full max-w-6xl rounded-[4rem] shadow-[0_0_100px_rgba(0,242,255,0.1)] overflow-hidden relative border border-white/10 flex flex-col md:flex-row h-[80vh]">
                            <button onClick={() => setIsRadarModalOpen(false)} className="absolute top-8 right-8 h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all border border-white/10 z-[100] group"><X size={24} className="group-hover:rotate-90 transition-transform"/></button>
                            <div className="flex-1 relative flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                                <div className="h-[500px] w-[500px] rounded-full border border-[#00f2ff]/20 relative flex items-center justify-center"><div className="h-full w-full rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(0,242,255,0.1)_350deg,#00f2ff_360deg)] animate-spin-slow opacity-50"></div><div className="absolute h-3 w-3 bg-[#00f2ff] rounded-full shadow-[0_0_15px_#00f2ff] animate-pulse"></div></div>
                                <div className="absolute bottom-10 left-10"><p className="text-[10px] font-black text-[#00f2ff] uppercase tracking-[0.5em] flex items-center gap-3"><div className="h-2 w-2 bg-[#00f2ff] rounded-full animate-ping"></div> Radar Global Activo</p></div>
                            </div>
                            <div className="w-full md:w-[400px] bg-black/40 backdrop-blur-xl border-l border-white/10 p-12 flex flex-col justify-between shrink-0"><h3 className="text-3xl font-black italic uppercase text-white tracking-tight">Live Activity</h3><div className="flex-1 overflow-y-auto pr-2 space-y-4 my-10 custom-scrollbar">{[ { c: 'Bogotá D.C.', u: 12, s: 'Checkout' }, { c: 'Medellín', u: 6, s: 'Catálogo' }, { c: 'Cali', u: 3, s: 'Producto' } ].map((city, i) => (<div key={i} className="p-6 bg-white/5 rounded-[2rem] border border-white/5 group hover:bg-white/10 transition-all"><p className="text-sm font-black text-white italic">{city.c}</p><div className="flex justify-between mt-3"><span className="text-xs font-black text-[#00f2ff] tracking-tight">{city.u} usuarios</span><span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">{city.s}</span></div></div>))}</div><button className="w-full py-6 bg-[#00f2ff] text-[#001a1a] rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-3xl hover:bg-white transition-all active:scale-95">Ver Auditoría de Tráfico</button></div>
                        </motion.div>
                    </div>
                )}

                {isGuideOpen && (
                    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuideOpen(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.95, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-6xl h-[80vh] rounded-[4rem] shadow-3xl overflow-hidden relative z-10 border border-white flex flex-col md:flex-row">
                            <div className="w-full md:w-[320px] bg-gray-50 border-r border-gray-100 p-10 flex flex-col gap-3"><div className="h-12 w-12 bg-gray-900 text-[#00f2ff] rounded-2xl flex items-center justify-center mb-6 shadow-lg"><Bot size={24}/></div><h3 className="text-xs font-black uppercase text-[#004d4d] mb-4 tracking-[0.2em]">Guía Maestro Analítica</h3>{[ { id: 0, label: 'Tráfico Web', icon: <Globe size={16}/> }, { id: 1, label: 'Embudo Venta', icon: <Target size={16}/> }, { id: 2, label: 'Fuga Capital', icon: <AlertCircle size={16}/> }, { id: 3, label: 'AI Strategy', icon: <Sparkles size={16}/> } ].map(step => (<button key={step.id} onClick={() => setActiveGuideStep(step.id)} className={`flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${activeGuideStep === step.id ? 'bg-[#004d4d] text-white shadow-xl shadow-[#004d4d]/20' : 'text-gray-500 hover:bg-white'}`}><div className={activeGuideStep === step.id ? 'text-[#00f2ff]' : 'text-gray-300'}>{step.icon}</div><span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span></button>))}<div className="mt-auto pt-8 border-t border-gray-100 px-2"><p className="text-[8px] font-black uppercase text-gray-300 tracking-[0.2em]">Bayup Sales Core v2.0</p></div></div>
                            <div className="flex-1 p-16 flex flex-col justify-between relative bg-white overflow-y-auto custom-scrollbar">
                                <button onClick={() => setIsGuideOpen(false)} className="absolute top-10 right-10 text-gray-300 hover:text-rose-500 transition-colors z-[100] group transition-all"><X size={24} className="group-hover:rotate-90"/></button>
                                <div className="space-y-12">
                                    {activeGuideStep === 0 && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8"><h2 className="text-4xl font-black italic uppercase text-[#001A1A]">Ruta de <span className="text-[#004D4D]">Adquisición</span></h2><p className="text-gray-500 text-lg font-medium italic">&quot;Optimiza tu pauta detectando el origen real de tus clientes más rentables.&quot;</p><div className="grid grid-cols-2 gap-6"><div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-inner group hover:bg-white transition-all"><div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-purple-600 mb-4 shadow-sm"><Share2 size={20}/></div><p className="text-[10px] font-black text-gray-400 uppercase">Tráfico Social</p><p className="text-xs font-medium mt-2 italic text-gray-600">Monitorea Instagram y TikTok Ads.</p></div></div></div>)}
                                    {activeGuideStep === 1 && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8"><h2 className="text-4xl font-black italic uppercase text-[#001A1A]">Embudo de <span className="text-[#004D4D]">Ventas</span></h2><div className="relative p-10 bg-gray-900 rounded-[3.5rem] overflow-hidden text-white shadow-2xl text-center"><div className="absolute top-0 right-0 p-4 opacity-10"><Target size={120}/></div><div className="relative z-10 flex flex-col items-center gap-6"><div className="flex gap-4"><div className="h-14 w-24 bg-white/10 rounded-xl flex items-center justify-center font-black">Visitas</div><div className="h-14 w-14 bg-[#00f2ff] text-[#001a1a] rounded-xl flex items-center justify-center font-black">$$$</div></div><p className="text-sm italic text-gray-400">"Bayt analiza la deserción en cada paso. Si el checkout cae, recibirás una alerta roja."</p></div></div></div>)}
                                    {activeGuideStep === 3 && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8"><h2 className="text-4xl font-black italic uppercase text-[#001A1A]">Inteligencia <span className="text-[#004D4D]">Bayt AI</span></h2><div className="p-10 bg-[#001A1A] rounded-[3.5rem] relative overflow-hidden text-white shadow-2xl text-center"><div className="h-20 w-20 bg-[#00f2ff]/10 text-[#00f2ff] rounded-[2rem] border border-[#00f2ff]/30 flex items-center justify-center animate-pulse mx-auto mb-6"><Bot size={48}/></div><p className="text-lg font-medium leading-relaxed italic text-gray-300">"Bayt predice picos de demanda analizando el abandono de checkout en tiempo real para lanzar cupones automáticos."</p></div></div>)}
                                </div>
                                <button onClick={() => setIsGuideOpen(false)} className="px-12 py-5 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase shadow-2xl active:scale-95 mt-12">Entendido, Continuar Operación</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin-slow { animation: spin-slow 10s linear infinite; }
            `}</style>
        </div>
    );
}
