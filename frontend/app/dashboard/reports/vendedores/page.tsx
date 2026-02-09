"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Shield, Trash2, Edit3, X, 
  ChevronRight, TrendingUp, DollarSign, Activity, 
  Zap, Target, Bot, Sparkles, Download, Filter, LayoutGrid,
  Search, ArrowUpRight, Clock, Award, Medal, Trophy, CheckCircle2,
  CreditCard, FileText, Check, ShieldCheck, 
  History as LucideHistory, Scale, ShoppingBag, Info, Loader2, Calendar, RotateCcw,
  MapPin, Briefcase, Camera, Star, Smartphone, Lightbulb, BrainCircuit, BarChart3, PieChart, AlertCircle
} from 'lucide-react';
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";

// --- INTERFACES ---
interface Seller {
    id: string;
    name: string;
    role: string;
    branch: string;
    total_sales: number;
    sales_month: number;
    target: number;
    conversion_rate: number;
    growth: number;
    status: 'online' | 'offline' | 'on_break';
    avatar: string;
    created_at?: string;
}

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

const BRANCHES = ['Tienda Principal', 'Sucursal Norte', 'Showroom Sur'];

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

export default function VendedoresPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    
    // --- ESTADOS ---
    const [activeTab, setActiveTab] = useState<'equipo' | 'ranking' | 'metas' | 'bayt'>('equipo');
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [filterBranch, setFilterBranch] = useState("all");
    
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isDateHovered, setIsDateHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [activeGuideStep, setActiveGuideStep] = useState(0);
    const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
    const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
    const [recordToDelete, setRecordToDelete] = useState<Seller | null>(null);

    const [formData, setFormData] = useState({
        name: '', role: 'Asesor Comercial', branch: 'Tienda Principal', target: '10000000', avatar: ''
    });

    // --- CARGA ---
    useEffect(() => {
        const saved = localStorage.getItem('bayup_sellers_data');
        if (saved) { setSellers(JSON.parse(saved)); } 
        else {
            const initial: Seller[] = [];
            setSellers(initial); localStorage.setItem('bayup_sellers_data', JSON.stringify(initial));
        }
        setLoading(false);
    }, []);

    const saveSellers = (data: Seller[]) => { setSellers(data); localStorage.setItem('bayup_sellers_data', JSON.stringify(data)); };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    const formatDots = (val: string | number) => {
        const num = typeof val === 'string' ? val.replace(/\D/g, '') : val.toString();
        if (!num) return ""; return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const filteredSellers = useMemo(() => {
        return sellers.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesBranch = filterBranch === 'all' || s.branch === filterBranch;
            let matchesDate = true;
            if (dateRange.start && dateRange.end && s.created_at) {
                const d = new Date(s.created_at).getTime();
                const start = new Date(dateRange.start).getTime();
                const end = new Date(dateRange.end).getTime();
                matchesDate = d >= start && d <= end;
            }
            return matchesSearch && matchesBranch && matchesDate;
        });
    }, [sellers, searchTerm, filterBranch, dateRange]);

    const rankingSellers = useMemo(() => [...sellers].sort((a, b) => b.sales_month - a.sales_month), [sellers]);

    const handleSaveSeller = (e: React.FormEvent) => {
        e.preventDefault();
        const targetNum = parseInt(formData.target.replace(/\D/g, ''));
        if (editingSeller) {
            const newData = sellers.map(s => s.id === editingSeller.id ? { ...s, ...formData, target: targetNum } : s);
            saveSellers(newData); showToast("Perfil actualizado", "success");
        } else {
            const newSeller: Seller = {
                id: Date.now().toString(), ...formData, target: targetNum, total_sales: 0, sales_month: 0,
                conversion_rate: 0, growth: 0, status: 'offline', avatar: formData.name.substring(0, 2).toUpperCase(),
                created_at: new Date().toISOString().split('T')[0]
            };
            saveSellers([...sellers, newSeller]); showToast("Asesor registrado", "success");
        }
        setIsModalOpen(false);
    };

    const handleDownloadReport = () => {
        const title = `AUDITORÍA DE FUERZA COMERCIAL: ${new Date().toLocaleDateString()}`;
        const html = `
            <html><head><meta charset="utf-8"><style>
                .header { background: #001a1a; color: #00f2ff; padding: 30px; text-align: center; font-family: sans-serif; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; font-family: sans-serif; }
                th { background: #f8fafc; color: #64748b; padding: 12px; font-size: 11px; text-transform: uppercase; border: 1px solid #e2e8f0; }
                td { padding: 12px; font-size: 13px; border: 1px solid #e2e8f0; text-align: center; }
                .amount { color: #10b981; font-weight: bold; }
            </style></head><body>
                <div class="header">${title}<br><small>Reporte Oficial Bayup Platinum</small></div>
                <table>
                    <thead>
                        <tr>
                            <th>Asesor</th>
                            <th>Rol</th>
                            <th>Sucursal</th>
                            <th>Ventas Mes</th>
                            <th>Meta</th>
                            <th>Cumplimiento</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredSellers.map(s => `
                            <tr>
                                <td style="text-align: left;">${s.name}</td>
                                <td>${s.role}</td>
                                <td>${s.branch}</td>
                                <td class="amount">${formatCurrency(s.sales_month)}</td>
                                <td>${formatCurrency(s.target)}</td>
                                <td>${Math.round((s.sales_month/s.target)*100)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body></html>
        `;
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Reporte_Vendedores_${new Date().toISOString().split('T')[0]}.xls`;
        a.click();
        showToast("Reporte Platinum generado correctamente 📈", "success");
    };

    if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin text-[#004d4d]" size={40} /></div>;

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-1000">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4">
                <div>
                    <div className="flex items-center gap-3 mb-2"><span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span><span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Fuerza de Ventas Elite</span></div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">Equipo <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">Comercial</span></h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">Gestiona y motiva el rendimiento de tus asesores de alto impacto.</p>
                </div>
                <button onClick={() => { setEditingSeller(null); setFormData({ name: '', role: 'Asesor Comercial', branch: 'Tienda Principal', target: '10000000', avatar: '' }); setIsModalOpen(true); }} className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group"><Zap size={18} className="text-[#00f2ff] group-hover:rotate-12 transition-transform" /> Registrar Asesor</button>
            </div>

            {/* KPIs INTERACTIVOS PLATINUM */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                {[
                    { id: 'equipo', label: 'Asesores Activos', value: sellers.length, isText: false, icon: <Users size={20}/>, color: 'text-[#004d4d]', trend: 'Live' },
                    { id: 'ventas', label: 'Facturación Equipo', value: sellers.reduce((acc,s)=>acc+s.sales_month,0), isText: false, prefix: '$ ', icon: <DollarSign size={20}/>, color: 'text-emerald-600', trend: '+12%' },
                    { id: 'rendimiento', label: 'Conversión Prom.', value: 10.4, isText: false, suffix: '%', icon: <Target size={20}/>, color: 'text-[#00f2ff]', trend: 'Estable' },
                    { id: 'lider', label: 'Líder del Mes', value: rankingSellers[0]?.name || 'N/A', isText: true, icon: <Medal size={20}/>, color: 'text-amber-500', trend: 'MVP' },
                ].map((kpi, i) => (
                    <div key={i} onClick={() => setSelectedKPI(kpi.id)} className="cursor-pointer h-full">
                        <TiltCard className="p-8">
                            <div className="flex justify-between items-start"><div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color}`}>{kpi.icon}</div><span className="text-[10px] font-black px-2 py-1 bg-gray-50 text-gray-400 rounded-lg uppercase tracking-widest">Stats</span></div>
                            <div className="mt-6">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                                <h3 className="text-2xl font-black text-gray-900 mt-1">{kpi.isText ? kpi.value : (<>{kpi.prefix}<AnimatedNumber value={kpi.value as number} />{kpi.suffix}</>)}</h3>
                                <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{kpi.trend}</p>
                            </div>
                        </TiltCard>
                    </div>
                ))}
            </div>

            {/* Menu Tabs & Suite Elite */}
            <div className="flex flex-col items-center gap-8 px-4">
                <div className="flex items-center gap-4">
                    <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl flex items-center overflow-x-auto relative z-10">
                        {[ { id: 'equipo', label: 'Equipo Elite', icon: <Users size={14}/> }, { id: 'ranking', label: 'Ranking Mensual', icon: <Award size={14}/> }, { id: 'metas', label: 'Gestión de Metas', icon: <Target size={14}/> }, { id: 'bayt', label: 'Bayt Insight', icon: <Sparkles size={14}/> } ].map((tab) => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}>{activeTab === tab.id && <motion.div layoutId="sellerTabGlow" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}<span className="flex items-center gap-2">{tab.icon} {tab.label}</span></button>
                        ))}
                    </div>
                    <button onClick={() => setIsGuideOpen(true)} className="h-12 w-12 rounded-full bg-white border border-gray-100 shadow-xl flex items-center justify-center text-[#004D4D] hover:bg-black hover:text-white transition-all group shrink-0"><Info size={20} className="group-hover:scale-110 transition-transform" /></button>
                </div>

                {/* Action Bar Platinum de 1100px */}
                <div className="w-full max-w-[1100px] mx-auto flex justify-between items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm transition-all focus-within:shadow-xl focus-within:border-[#004d4d]/20 relative z-20">
                    <div className="relative w-full"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} /><input type="text" placeholder="Buscar asesor por nombre, sucursal o meta..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-transparent text-sm font-bold outline-none placeholder:text-gray-300" /></div>
                    
                    <div className="flex items-center gap-1">
                        {/* FILTROS */}
                        <div className="relative">
                            <motion.button layout onMouseEnter={() => setIsFilterHovered(true)} onMouseLeave={() => setIsFilterHovered(false)} onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className={`h-12 flex items-center gap-2 px-4 rounded-xl transition-all ${isFilterMenuOpen ? 'bg-[#004d4d] text-white' : 'bg-gray-50 text-gray-500 hover:bg-white hover:border-gray-100'}`}>
                                <Filter size={18}/> 
                                <AnimatePresence>{isFilterHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase whitespace-nowrap overflow-hidden px-1">Sucursal</motion.span>}</AnimatePresence>
                            </motion.button>
                            <AnimatePresence>{isFilterMenuOpen && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50"><button onClick={() => { setFilterBranch('all'); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 rounded-xl text-[9px] font-black uppercase hover:bg-gray-50">Todas</button>{BRANCHES.map(b => (<button key={b} onClick={() => { setFilterBranch(b); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 rounded-xl text-[9px] font-black uppercase hover:bg-gray-50">{b}</button>))}</motion.div>}</AnimatePresence>
                        </div>

                        {/* CALENDARIO */}
                        <div className="relative group/date">
                            <motion.button layout onMouseEnter={() => setIsDateHovered(true)} onMouseLeave={() => setIsDateHovered(false)} className={`h-12 flex items-center gap-2 px-4 rounded-xl transition-all ${dateRange.start ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-500 hover:bg-white hover:border-gray-100'}`}>
                                <Calendar size={18}/> 
                                <AnimatePresence>{isDateHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase whitespace-nowrap overflow-hidden px-1">Fechas</motion.span>}</AnimatePresence>
                            </motion.button>
                            <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 opacity-0 scale-95 pointer-events-none group-hover/date:opacity-100 group-hover/date:scale-100 group-hover/date:pointer-events-auto transition-all z-50 flex gap-2"><input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="p-2 bg-gray-50 rounded-lg text-[10px] font-bold outline-none"/><input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="p-2 bg-gray-50 rounded-lg text-[10px] font-bold outline-none"/><button onClick={() => setDateRange({start:'', end:''})} className="p-2 bg-rose-50 text-rose-500 rounded-lg"><RotateCcw size={14}/></button></div>
                        </div>

                        {/* EXPORTAR */}
                        <motion.button layout onMouseEnter={() => setIsExportHovered(true)} onMouseLeave={() => setIsExportHovered(false)} onClick={handleDownloadReport} className="h-12 flex items-center gap-2 px-4 rounded-xl bg-gray-50 text-gray-500 hover:bg-white hover:border-gray-100 transition-all">
                            <Download size={18}/> 
                            <AnimatePresence>{isExportHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase whitespace-nowrap overflow-hidden px-1">Excel</motion.span>}</AnimatePresence>
                        </motion.button>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="px-4">
                    {activeTab === 'equipo' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
                            {filteredSellers.map(s => (
                                <motion.div key={s.id} whileHover={{ y: -10 }} className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-6 group relative overflow-hidden">
                                    <div className="flex justify-between items-start relative z-10"><div className="h-16 w-16 rounded-[1.8rem] bg-gray-900 text-white flex items-center justify-center text-xl font-black shadow-2xl relative">{s.avatar}<div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-white ${s.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></div></div><div className="flex gap-2"><button onClick={() => { setEditingSeller(s); setFormData({ name: s.name, role: s.role, branch: s.branch, target: s.target.toString(), avatar: s.avatar }); setIsModalOpen(true); }} className="h-10 w-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-[#004d4d] hover:text-white transition-all shadow-inner"><Edit3 size={16}/></button><button onClick={() => setRecordToDelete(s)} className="h-10 w-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-inner"><Trash2 size={16}/></button></div></div>
                                    <div className="relative z-10"><h4 className="text-xl font-black text-gray-900">{s.name}</h4><p className="text-[10px] font-bold text-[#004d4d] uppercase italic">{s.role} · {s.branch}</p></div>
                                    <div className="space-y-4 relative z-10"><div className="flex justify-between"><span className="text-[9px] font-black text-gray-400 uppercase">Facturación Mes</span><span className="text-xs font-black text-gray-900">{formatCurrency(s.sales_month)}</span></div><div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((s.sales_month/s.target)*100, 100)}%` }} className="h-full bg-gradient-to-r from-[#004d4d] to-[#00f2ff]" /></div></div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'ranking' && (
                        <div className="space-y-6 animate-in fade-in duration-500">{rankingSellers.map((s, idx) => (
                            <motion.div key={s.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex items-center justify-between gap-10 group hover:shadow-xl transition-all"><div className="flex items-center gap-8"><div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-black ${idx === 0 ? 'bg-amber-100 text-amber-600 shadow-lg shadow-amber-200/50' : 'bg-gray-50 text-gray-400'}`}>{idx === 0 ? <Trophy size={24}/> : idx + 1}</div><div className="h-16 w-16 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-xl font-black shadow-xl">{s.avatar}</div><div><h4 className="text-xl font-black text-gray-900">{s.name}</h4><p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{s.branch}</p></div></div><div className="text-right"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Facturación Bruta</p><p className="text-3xl font-black text-emerald-600 tracking-tighter">{formatCurrency(s.sales_month)}</p></div></motion.div>
                        ))}</div>
                    )}
                    {activeTab === 'metas' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">{sellers.map(s => (
                            <TiltCard key={s.id} className="p-10 bg-white shadow-xl">
                                <div className="flex justify-between items-center mb-8"><div><h4 className="text-lg font-black text-gray-900 uppercase italic">{s.name}</h4><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Meta de Cierre</p></div><div className="text-right"><p className="text-2xl font-black text-[#004d4d]">{Math.round((s.sales_month/s.target)*100)}%</p><p className="text-[8px] font-black text-emerald-600 uppercase">Cumplimiento</p></div></div>
                                <div className="space-y-6">
                                    <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase"><span>Recaudado: {formatCurrency(s.sales_month)}</span><span>Meta: {formatCurrency(s.target)}</span></div>
                                    <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-100 shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((s.sales_month/s.target)*100, 100)}%` }} className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.3)]" /></div>
                                    <div className="flex items-center gap-3 p-4 bg-[#004d4d]/5 rounded-2xl border border-[#004d4d]/10"><Activity size={14} className="text-[#004d4d]"/><p className="text-[10px] font-medium text-gray-600 italic">Déficit actual para bono: {formatCurrency(Math.max(s.target - s.sales_month, 0))}</p></div>
                                </div>
                            </TiltCard>
                        ))}</div>
                    )}
                    {activeTab === 'bayt' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
                            <TiltCard className="p-12 bg-gray-900 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Medal size={300} /></div>
                                <div className="space-y-8 h-full flex flex-col justify-between relative z-10">
                                    <div className="flex items-center gap-4"><div className="h-14 w-14 bg-[#00f2ff]/10 text-[#00f2ff] rounded-2xl border border-[#00f2ff]/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.2)]"><Bot size={32}/></div><div><h3 className="text-2xl font-black italic uppercase">Team Mastery</h3><p className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest mt-1">Inteligencia Comercial Predictiva</p></div></div>
                                    <p className="text-lg font-medium leading-relaxed italic text-gray-300">&quot;Basado en el rendimiento de los últimos 3 meses, un ajuste del 2% en los bonos por utilidad neta incrementará el cierre en un <span className="text-[#00f2ff] font-black">18.4%</span>.&quot;</p>
                                    <div className="pt-8 border-t border-white/10 grid grid-cols-2 gap-6"><div className="space-y-1"><p className="text-[10px] font-black uppercase text-white/40">Potencial ROI</p><p className="text-xl font-black text-emerald-400">+12.5%</p></div><div className="space-y-1"><p className="text-[10px] font-black uppercase text-white/40">Efficiency Score</p><p className="text-xl font-black text-[#00f2ff]">Superior</p></div></div>
                                </div>
                            </TiltCard>
                            <div className="space-y-8">
                                <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3"><Lightbulb className="text-amber-500" size={20}/><h4 className="text-sm font-black uppercase tracking-widest">Recomendaciones Tácticas</h4></div>
                                    <div className="space-y-4">
                                        {[ { t: 'Optimización de Leads', d: 'Asignar prospectos de alta gama a Carlos Ruiz.', i: <Zap/> }, { t: 'Acelerador Trimestral', d: 'Implementar meta volante por volumen este fin de semana.', i: <TrendingUp/> } ].map((rec, i) => (
                                            <div key={i} className="flex items-center gap-4 p-5 bg-gray-50 rounded-[2rem] border border-transparent hover:border-[#004d4d]/20 transition-all cursor-pointer group"><div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-[#004d4d] shadow-sm group-hover:scale-110 transition-transform">{rec.i}</div><div><p className="text-sm font-black text-gray-900">{rec.t}</p><p className="text-[10px] font-medium text-gray-500">{rec.d}</p></div></div>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={() => showToast("Analizando métricas profundas...", "info")} className="w-full py-6 bg-[#004D4D] text-white rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4 hover:bg-black transition-all group"><BrainCircuit size={20} className="group-hover:rotate-12 transition-transform"/> Ejecutar Auditoría de Rendimiento</button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* MODAL DETALLE KPI DINÁMICO */}
            <AnimatePresence>
                {selectedKPI && (
                    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedKPI(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-3xl overflow-hidden border border-white">
                            <div className="p-10 bg-gradient-to-br from-gray-900 to-[#001a1a] text-white relative">
                                <button onClick={() => setSelectedKPI(null)} className="absolute top-6 right-6 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all group"><X size={20} className="group-hover:rotate-90 transition-transform"/></button>
                                <div className="space-y-4"><h3 className="text-3xl font-black italic uppercase tracking-tighter">{selectedKPI === 'equipo' ? 'Fuerza Comercial' : selectedKPI === 'ventas' ? 'Analítica Cierre' : selectedKPI === 'rendimiento' ? 'Eficiencia Pro' : 'MVP Periodo'}</h3><p className="text-[10px] font-black uppercase text-[#00f2ff] mt-2 tracking-[0.3em]">Team Performance Bayup</p></div>
                            </div>
                            <div className="p-10 space-y-8">
                                {selectedKPI === 'equipo' && (<div className="space-y-6"><div className="flex justify-between items-end"><p className="text-xs font-bold text-gray-400 uppercase">Crecimiento Mensual</p><p className="text-xl font-black text-emerald-600">+1 Asesor</p></div><div className="p-6 bg-gray-50 rounded-2xl"><p className="text-xs font-medium italic">"Tu equipo escaló un 15% este trimestre. Bayt sugiere capacitación en ventas."</p></div></div>)}
                                {selectedKPI === 'ventas' && (<div className="space-y-6"><div className="flex justify-between items-end"><p className="text-xs font-bold text-gray-400 uppercase">Variación vs Enero</p><p className="text-xl font-black text-emerald-600">+8.4M Extra</p></div><div className="p-10 bg-gray-900 rounded-[2.5rem] text-white text-center relative overflow-hidden"><div className="absolute top-0 right-0 p-4 opacity-10"><BarChart3 size={100}/></div><p className="text-sm font-medium italic">"Volumen superando la proyección lineal. Garantiza stock para el equipo."</p></div></div>)}
                                {selectedKPI === 'rendimiento' && (<div className="space-y-6"><div className="flex justify-between items-end"><p className="text-xs font-bold text-gray-400 uppercase">Conversión Meta</p><p className="text-xl font-black text-[#004d4d]">12% Objetivo</p></div><div className="grid grid-cols-2 gap-4"><div className="p-5 bg-gray-50 rounded-2xl text-center"><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Actual</p><p className="text-2xl font-black">10.4%</p></div><div className="p-5 bg-gray-50 rounded-2xl text-center"><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Déficit</p><p className="text-2xl font-black text-rose-500">1.6%</p></div></div></div>)}
                                {selectedKPI === 'lider' && (<div className="space-y-6"><div className="p-8 bg-amber-50 border border-amber-100 rounded-[2.5rem] text-center"><p className="text-xl font-black text-gray-900">{rankingSellers[0]?.name || 'N/A'}</p><p className="text-[10px] font-bold text-amber-800 uppercase mt-1">Líder Absoluto</p></div><p className="text-[10px] font-medium text-gray-500 text-center italic">"Programa una mentoría dirigida por el MVP para elevar el nivel del equipo."</p></div>)}
                                <button onClick={() => setSelectedKPI(null)} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-black transition-all">Cerrar Análisis</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL CONFIRMACIÓN ELIMINACIÓN ASESOR */}
            <AnimatePresence>
                {recordToDelete && (
                    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRecordToDelete(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 text-center relative z-10 border border-white">
                            <div className="h-20 w-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce"><AlertCircle size={40} /></div>
                            <h3 className="text-xl font-black text-gray-900 uppercase italic">¿Remover Asesor?</h3>
                            <p className="text-gray-500 text-sm mt-4 font-medium italic">Estás por desvincular a **{recordToDelete.name}**. Se perderá su historial de metas activas.</p>
                            <div className="flex flex-col gap-3 mt-10"><button onClick={() => { saveSellers(sellers.filter(s => s.id !== recordToDelete.id)); setRecordToDelete(null); showToast("Asesor removido", "info"); }} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl active:scale-95 transition-all">Confirmar Eliminación</button><button onClick={() => setRecordToDelete(null)} className="w-full py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase hover:text-gray-900 transition-all">Cancelar</button></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL REGISTRO ASESOR PLATINUM PLUS */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-[1200px] h-[85vh] rounded-[4rem] shadow-3xl overflow-hidden relative z-10 border border-white flex flex-col lg:flex-row">
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 h-12 w-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-rose-500 hover:border-rose-100 transition-all shadow-xl z-[100] group"><X size={24} className="group-hover:rotate-90 transition-transform duration-300" /></button>
                            <div className="w-full lg:w-[500px] bg-gray-50 border-r border-gray-100 p-12 overflow-y-auto custom-scrollbar flex flex-col space-y-10">
                                <div className="flex items-center gap-4"><div className="h-12 w-12 bg-gray-900 rounded-2xl flex items-center justify-center text-[#00f2ff] shadow-lg"><UserPlus size={24}/></div><h3 className="text-2xl font-black uppercase italic text-gray-900">Editor Talento</h3></div>
                                <form onSubmit={handleSaveSeller} className="space-y-8">
                                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre Completo</label><input required placeholder="Ej: Sebastian Garcia" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-5 bg-white border border-gray-100 rounded-[2rem] outline-none focus:border-[#004d4d] text-sm font-bold shadow-sm transition-all" /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Rol Comercial</label><div className="grid grid-cols-2 gap-3">{['Asesor Senior', 'Asesor Junior'].map(role => (<button key={role} type="button" onClick={() => setFormData({...formData, role})} className={`py-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${formData.role === role ? 'bg-[#004d4d] text-white border-transparent shadow-lg' : 'bg-white text-gray-400 border-gray-50'}`}>{role}</button>))}</div></div>
                                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Meta de Facturación (COP)</label><div className="relative"><DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500" size={20} /><input required value={formatDots(formData.target)} onChange={e => setFormData({...formData, target: e.target.value.replace(/\D/g, '')})} className="w-full pl-14 p-5 bg-white border border-gray-100 rounded-[2rem] outline-none focus:border-emerald-500 text-xl font-black text-gray-900 shadow-sm transition-all" /></div></div>
                                    <button type="submit" className="w-full py-6 bg-gray-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 mt-10"><ShieldCheck size={24} className="text-[#00f2ff]"/> {editingSeller ? 'Actualizar Perfil' : 'Finalizar Registro'}</button>
                                </form>
                            </div>
                            <div className="flex-1 bg-[#FAFAFA] p-16 flex flex-col items-center justify-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#004d4d 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                                <div className="text-center mb-12 mt-20 relative z-10"><span className="px-4 py-1 bg-[#004d4d]/10 text-[#004d4d] rounded-full text-[10px] font-black uppercase tracking-[0.3em]">Vista en Vivo</span><h4 className="text-xl font-medium text-gray-400 mt-4 italic">Previsualización oficial del asesor</h4></div>
                                <motion.div key={formData.name + formData.role} initial={{ scale: 0.8, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="w-[450px] my-auto relative z-10">
                                    <TiltCard className="p-12 h-auto bg-white shadow-3xl">
                                        <div className="flex justify-between items-start mb-10"><div className="h-24 w-24 rounded-[2.5rem] bg-gray-900 text-white flex items-center justify-center text-4xl font-black shadow-2xl ring-8 ring-gray-50 relative">{formData.name ? formData.name.substring(0, 2).toUpperCase() : '?'}<div className="absolute -bottom-2 -right-2 h-8 w-8 bg-emerald-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white"><Star size={12} fill="currentColor" /></div></div><div className="text-right"><div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 mx-auto mb-2"><Smartphone size={20}/></div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado Live</p><p className="text-xs font-black text-emerald-500 uppercase tracking-widest">En Línea</p></div></div>
                                        <div className="space-y-2 mb-10"><h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{formData.name || 'Nombre del Asesor'}</h2><p className="text-xs font-bold text-[#004d4d] uppercase tracking-[0.2em] italic">{formData.role} · {formData.branch}</p></div>
                                        <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-6"><div className="flex justify-between items-center"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Meta Mensual</span><span className="text-sm font-black text-gray-900">{formatCurrency(parseInt(formData.target || '0'))}</span></div><div className="h-2 w-full bg-white rounded-full overflow-hidden border border-gray-100 shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: '15%' }} className="h-full bg-[#004d4d] rounded-full"></motion.div></div><div className="flex justify-between items-center"><span className="text-[9px] font-bold text-gray-400 uppercase">Proyección ROI</span><span className="text-xs font-black text-emerald-600">+12.5%</span></div></div>
                                    </TiltCard>
                                </motion.div>
                                <div className="mt-auto mb-10 bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl max-w-sm flex items-center gap-6 relative z-10 animate-bounce-slow"><div className="h-12 w-12 bg-gray-900 text-[#00f2ff] rounded-2xl flex items-center justify-center shadow-lg"><Bot size={24}/></div><p className="text-xs font-medium text-gray-600 italic leading-relaxed">&quot;Un asesor Senior asignado a **{formData.branch}** incrementa la tasa de cierre en un 14.2%.&quot;</p></div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL GUÍA ELITE VENDEDORES PLATINUM */}
            <AnimatePresence>
                {isGuideOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuideOpen(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.95, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-6xl h-[80vh] rounded-[4rem] shadow-3xl overflow-hidden relative z-10 border border-white flex flex-col md:flex-row">
                            <div className="w-full md:w-[320px] bg-gray-50 border-r border-gray-100 p-10 flex flex-col gap-3"><div className="h-12 w-12 bg-gray-900 text-[#00f2ff] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/20"><Bot size={24}/></div><h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004d4d] mb-4">Guía Comercial</h3>{[ { id: 0, label: 'Panel de Control', icon: <LayoutGrid size={16}/> }, { id: 1, label: 'Ranking de Honor', icon: <Trophy size={16}/> }, { id: 2, label: 'Asignación Metas', icon: <Target size={16}/> }, { id: 3, label: 'Inteligencia Bayt', icon: <Sparkles size={16}/> } ].map(step => (<button key={step.id} onClick={() => setActiveGuideStep(step.id)} className={`flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${activeGuideStep === step.id ? 'bg-[#004d4d] text-white shadow-xl shadow-[#004d4d]/20' : 'text-gray-500 hover:bg-white'}`}><div className={activeGuideStep === step.id ? 'text-[#00f2ff]' : 'text-gray-300'}>{step.icon}</div><span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span></button>))}<div className="mt-auto pt-8 border-t border-gray-100 px-2"><p className="text-[8px] font-black uppercase text-gray-300 tracking-[0.2em]">Bayup Sales Core v2.0</p></div></div>
                            <div className="flex-1 p-16 flex flex-col justify-between relative bg-white overflow-y-auto custom-scrollbar">
                                <button onClick={() => setIsGuideOpen(false)} className="absolute top-10 right-10 text-gray-300 hover:text-rose-500 transition-colors z-[100]"><X size={24}/></button>
                                <div className="space-y-12">
                                    {activeGuideStep === 0 && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8"><div className="space-y-4"><h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Analítica de <span className="text-[#004D4D]">Fuerza</span></h2><p className="text-gray-500 text-lg font-medium leading-relaxed italic">&quot;Monitorea el impacto real de cada asesor en tu flujo de caja mensual.&quot;</p></div><div className="grid grid-cols-2 gap-6"><div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:bg-white hover:shadow-xl transition-all"><div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-[#004d4d] mb-6 shadow-sm"><Users size={24}/></div><p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Gestión de Equipo</p><p className="text-sm font-medium text-gray-600 mt-2 italic">Crea perfiles oficiales, asigna sucursales y supervisa el staff.</p></div><div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:bg-white hover:shadow-xl transition-all"><div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-[#00f2ff] mb-6 shadow-sm"><Zap size={24}/></div><p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Pro-Tip Bayt</p><p className="text-sm font-medium text-gray-600 mt-2 italic">&quot;Un equipo balanceado incrementa el ROI comercial en un 18%.&quot;</p></div></div></div>)}
                                    {activeGuideStep === 1 && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8"><div className="space-y-4"><h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Ranking & <span className="text-[#004D4D]">Reconocimiento</span></h2><p className="text-gray-500 text-lg font-medium leading-relaxed italic">Gamifica el rendimiento de tu marca premiando a los mejores.</p></div><div className="relative p-10 bg-gray-900 rounded-[3.5rem] overflow-hidden text-white shadow-2xl"><div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={120}/></div><div className="space-y-6 relative z-10"><div className="flex items-center gap-6"><div className="h-14 w-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-lg"><Trophy size={28}/></div><p className="text-sm font-black uppercase tracking-widest text-amber-400">Líder del Mes (MVP)</p></div><p className="text-sm text-gray-400 italic">El sistema organiza automáticamente el ranking basándose en la facturación bruta.</p></div></div></div>)}
                                    {activeGuideStep === 3 && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8"><div className="space-y-4"><h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Inteligencia <span className="text-[#004D4D]">Bayt AI</span></h2><p className="text-gray-500 text-lg font-medium leading-relaxed italic">Deja que la IA optimice la distribución de tus leads comerciales.</p></div><div className="p-10 bg-[#001A1A] rounded-[3.5rem] relative overflow-hidden text-white shadow-2xl"><div className="absolute top-0 right-0 w-64 h-64 bg-[#00f2ff]/10 rounded-full blur-[80px]"></div><div className="relative z-10 flex flex-col items-center text-center space-y-6"><div className="h-20 w-20 bg-[#00f2ff]/10 text-[#00f2ff] rounded-[2rem] border border-[#00f2ff]/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,242,255,0.2)] animate-pulse"><Bot size={48}/></div><div className="space-y-4"><p className="text-sm font-black uppercase tracking-[0.3em] text-[#00f2ff]">Sales Strategist</p><p className="text-lg font-medium leading-relaxed italic text-gray-300">&quot;Bayt identifica qué asesores tienen mejor tasa de conversión por categoría para asignarles prospectos específicos automáticamente.&quot;</p></div></div></div></div>)}
                                </div>
                                <button onClick={() => setIsGuideOpen(false)} className="px-12 py-5 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-95">Entendido, Continuar Operación</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
                @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
            `}</style>
        </div>
    );
}