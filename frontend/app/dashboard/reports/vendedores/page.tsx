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
  MapPin, Briefcase, Camera, Star, Smartphone, Lightbulb, BrainCircuit
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
    
    // UI States
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isDateHovered, setIsDateHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [activeGuideStep, setActiveGuideStep] = useState(0);
    const [editingSeller, setEditingSeller] = useState<Seller | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        role: 'Asesor Comercial',
        branch: 'Tienda Principal',
        target: '10000000',
        avatar: ''
    });

    // --- CARGA ---
    useEffect(() => {
        const saved = localStorage.getItem('bayup_sellers_data');
        if (saved) { setSellers(JSON.parse(saved)); } 
        else {
            const initial: Seller[] = [
                { id: '1', name: 'Elena Rodriguez', role: 'Líder de Ventas', branch: 'Tienda Principal', total_sales: 45800000, sales_month: 8500000, target: 10000000, conversion_rate: 12.4, growth: 15, status: 'online', avatar: 'ER', created_at: '2026-01-01' },
                { id: '2', name: 'Carlos Ruiz', role: 'Asesor Senior', branch: 'Sucursal Norte', total_sales: 28400000, sales_month: 5200000, target: 10000000, conversion_rate: 9.8, growth: 8, status: 'online', avatar: 'CR', created_at: '2026-01-15' }
            ];
            setSellers(initial);
            localStorage.setItem('bayup_sellers_data', JSON.stringify(initial));
        }
        setLoading(false);
    }, []);

    const saveSellers = (data: Seller[]) => {
        setSellers(data);
        localStorage.setItem('bayup_sellers_data', JSON.stringify(data));
    };

    // --- HELPERS ---
    const formatCurrency = (amount: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    const formatDots = (val: string | number) => {
        const num = typeof val === 'string' ? val.replace(/\D/g, '') : val.toString();
        if (!num) return "";
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const filteredSellers = useMemo(() => {
        return sellers.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesBranch = filterBranch === 'all' || s.branch === filterBranch;
            let matchesDate = true;
            if (dateRange.start && dateRange.end && s.created_at) {
                const d = new Date(s.created_at).getTime();
                matchesDate = d >= new Date(dateRange.start).getTime() && d <= new Date(dateRange.end).getTime();
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
            saveSellers(newData);
            showToast("Perfil de asesor actualizado", "success");
        } else {
            const newSeller: Seller = {
                id: Date.now().toString(),
                ...formData,
                target: targetNum,
                total_sales: 0,
                sales_month: 0,
                conversion_rate: 0,
                growth: 0,
                status: 'offline',
                avatar: formData.name.substring(0, 2).toUpperCase(),
                created_at: new Date().toISOString().split('T')[0]
            };
            saveSellers([...sellers, newSeller]);
            showToast("Nuevo asesor registrado", "success");
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (!confirm("¿Eliminar este asesor?")) return;
        saveSellers(sellers.filter(s => s.id !== id));
        showToast("Asesor eliminado", "info");
    };

    const handleDownloadReport = () => {
        showToast("Generando Excel profesional...", "info");
        setTimeout(() => showToast("Reporte descargado 📈", "success"), 1500);
    };

    if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin text-[#004d4d]" size={40} /></div>;

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4">
                <div>
                    <div className="flex items-center gap-3 mb-2"><span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse"></span><span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Fuerza de Ventas Elite</span></div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">Equipo <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">Comercial</span></h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">Gestiona y motiva el rendimiento de tus asesores de alto impacto.</p>
                </div>
                <button onClick={() => { setEditingSeller(null); setFormData({ name: '', role: 'Asesor Comercial', branch: 'Tienda Principal', target: '10000000', avatar: '' }); setIsModalOpen(true); }} className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group">
                    <UserPlus size={18} className="text-[#00f2ff] group-hover:rotate-12 transition-transform" /> Registrar Asesor
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                {[
                    { label: 'Asesores Activos', value: sellers.length, icon: <Users size={20}/>, color: 'text-[#004d4d]', trend: 'Live' },
                    { label: 'Facturación Equipo', value: formatCurrency(sellers.reduce((acc,s)=>acc+s.sales_month,0)), icon: <DollarSign size={20}/>, color: 'text-emerald-600', trend: '+12%' },
                    { label: 'Conversión Prom.', value: '10.4%', icon: <Target size={20}/>, color: 'text-[#00f2ff]', trend: 'Estable' },
                    { label: 'Líder del Mes', value: rankingSellers[0]?.name || 'N/A', icon: <Medal size={20}/>, color: 'text-amber-500', trend: 'MVP' },
                ].map((kpi, i) => (
                    <TiltCard key={i} className="p-8">
                        <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color}`}>{kpi.icon}</div>
                        <div className="mt-6"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p><h3 className="text-2xl font-black text-gray-900 mt-1">{kpi.value}</h3></div>
                    </TiltCard>
                ))}
            </div>

            {/* Suite & Tabs */}
            <div className="flex flex-col items-center gap-8 px-4">
                <div className="flex items-center gap-4">
                    <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl flex items-center overflow-x-auto relative z-10">
                        {[ { id: 'equipo', label: 'Equipo Elite', icon: <Users size={14}/> }, { id: 'ranking', label: 'Ranking Mensual', icon: <Award size={14}/> }, { id: 'metas', label: 'Gestión de Metas', icon: <Target size={14}/> }, { id: 'bayt', label: 'Bayt Insight', icon: <Sparkles size={14}/> } ].map((tab) => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all z-10 whitespace-nowrap ${activeTab === tab.id ? 'bg-[#004D4D] text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}>{activeTab === tab.id && <motion.div layoutId="sellerTabGlow" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" />}<span className="flex items-center gap-2">{tab.icon} {tab.label}</span></button>
                        ))}
                    </div>
                    <button onClick={() => setIsGuideOpen(true)} className="h-12 w-12 rounded-full bg-white border border-gray-100 shadow-xl flex items-center justify-center text-[#004D4D] hover:bg-black hover:text-white transition-all"><Info size={20}/></button>
                </div>

                <div className="w-full max-w-[1100px] flex justify-between items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm transition-all focus-within:shadow-xl focus-within:border-[#004d4d]/20 relative z-20">
                    <div className="relative w-full"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} /><input type="text" placeholder="Buscar asesor por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-transparent text-sm font-bold outline-none placeholder:text-gray-300" /></div>
                    <div className="flex items-center gap-1">
                        <div className="relative"><motion.button layout onMouseEnter={() => setIsFilterHovered(true)} onMouseLeave={() => setIsFilterHovered(false)} onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className={`h-12 flex items-center gap-2 px-4 rounded-xl transition-all ${isFilterMenuOpen ? 'bg-[#004d4d] text-white' : 'bg-gray-50 text-gray-500 hover:bg-white hover:border-gray-100'}`}><Filter size={18}/> <AnimatePresence>{isFilterHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase px-1">Sucursal</motion.span>}</AnimatePresence></motion.button><AnimatePresence>{isFilterMenuOpen && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50"><button onClick={() => { setFilterBranch('all'); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 rounded-xl text-[10px] font-bold uppercase hover:bg-gray-50 rounded-xl">Todas</button>{BRANCHES.map(b => (<button key={b} onClick={() => { setFilterBranch(b); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 rounded-xl text-[10px] font-bold uppercase hover:bg-gray-50 rounded-xl">{b}</button>))}</motion.div>}</AnimatePresence></div>
                        <div className="relative group/date"><motion.button layout onMouseEnter={() => setIsDateHovered(true)} onMouseLeave={() => setIsDateHovered(false)} className={`h-12 flex items-center gap-2 px-4 rounded-xl transition-all ${dateRange.start ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-500 hover:bg-white hover:border-gray-100'}`}><Calendar size={18}/> <AnimatePresence>{isDateHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase px-1">Fechas</motion.span>}</AnimatePresence></motion.button><div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 opacity-0 scale-95 pointer-events-none group-hover/date:opacity-100 group-hover/date:scale-100 group-hover/date:pointer-events-auto transition-all z-50 flex gap-2"><input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="p-2 bg-gray-50 rounded-lg text-[10px] font-bold outline-none border border-transparent focus:border-[#004d4d]" /><input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="p-2 bg-gray-50 rounded-lg text-[10px] font-bold outline-none border border-transparent focus:border-[#004d4d]" /><button onClick={() => setDateRange({start:'', end:''})} className="p-2 bg-rose-50 text-rose-500 rounded-lg"><RotateCcw size={14}/></button></div></div>
                        <motion.button layout onMouseEnter={() => setIsExportHovered(true)} onMouseLeave={() => setIsExportHovered(false)} onClick={handleDownloadReport} className="h-12 flex items-center gap-2 px-4 rounded-xl bg-gray-50 text-gray-500 hover:bg-white hover:border-gray-100 transition-all"><Download size={18}/> <AnimatePresence>{isExportHovered && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase px-1">Excel</motion.span>}</AnimatePresence></motion.button>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="px-4">
                    {activeTab === 'equipo' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredSellers.map(s => (
                                <motion.div key={s.id} whileHover={{ y: -10 }} className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-6 group relative overflow-hidden">
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="h-16 w-16 rounded-[1.8rem] bg-gray-900 text-white flex items-center justify-center text-xl font-black shadow-2xl relative">{s.avatar}<div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-white ${s.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></div></div>
                                        <div className="flex gap-2"><button onClick={() => { setEditingSeller(s); setFormData({ name: s.name, role: s.role, branch: s.branch, target: s.target.toString(), avatar: s.avatar }); setIsModalOpen(true); }} className="h-10 w-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-[#004d4d] hover:text-white transition-all"><Edit3 size={16}/></button><button onClick={() => handleDelete(s.id)} className="h-10 w-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16}/></button></div>
                                    </div>
                                    <div className="relative z-10"><h4 className="text-xl font-black text-gray-900">{s.name}</h4><p className="text-[10px] font-bold text-[#004d4d] uppercase italic">{s.role} · {s.branch}</p></div>
                                    <div className="space-y-4 relative z-10">
                                        <div className="flex justify-between"><span className="text-[9px] font-black text-gray-400 uppercase">Facturación Mes</span><span className="text-xs font-black text-gray-900">{formatCurrency(s.sales_month)}</span></div>
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((s.sales_month/s.target)*100, 100)}%` }} className="h-full bg-gradient-to-r from-[#004d4d] to-[#00f2ff]" /></div>
                                    </div>
                                    <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-[#00f2ff]/5 blur-3xl rounded-full" />
                                </motion.div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'ranking' && (
                        <div className="space-y-6">
                            {rankingSellers.map((s, idx) => (
                                <motion.div key={s.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex items-center justify-between gap-10 group hover:shadow-xl transition-all">
                                    <div className="flex items-center gap-8">
                                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-black ${idx === 0 ? 'bg-amber-100 text-amber-600 shadow-lg shadow-amber-200/50' : 'bg-gray-50 text-gray-400'}`}>{idx === 0 ? <Trophy size={24}/> : idx + 1}</div>
                                        <div className="h-16 w-16 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-xl font-black shadow-xl">{s.avatar}</div>
                                        <div><h4 className="text-xl font-black text-gray-900 flex items-center gap-2">{s.name} {idx === 0 && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black uppercase rounded border border-amber-100">Líder del Mes</span>}</h4><p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{s.branch}</p></div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Facturación Bruta</p>
                                        <p className="text-3xl font-black text-emerald-600 tracking-tighter">{formatCurrency(s.sales_month)}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* BAYT INSIGHT VENDEDORES - RESTAURADO */}
                    {activeTab === 'bayt' && (
                        <motion.div key="bayt" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <TiltCard className="p-12 bg-gray-900 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Medal size={300} /></div>
                                <div className="space-y-8 h-full flex flex-col justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 bg-[#00f2ff]/10 text-[#00f2ff] rounded-2xl border border-[#00f2ff]/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.2)]"><Bot size={32}/></div>
                                        <div><h3 className="text-2xl font-black italic uppercase">Team Mastery</h3><p className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest mt-1">Inteligencia Comercial Predictiva</p></div>
                                    </div>
                                    <p className="text-lg font-medium leading-relaxed italic text-gray-300">&quot;Basado en el rendimiento de los últimos 3 meses, proyectamos que un ajuste del 2% en los bonos por utilidad neta incrementará el cierre de ventas Pro en un <span className="text-[#00f2ff] font-black">18.4%</span>.&quot;</p>
                                    <div className="pt-8 border-t border-white/10 grid grid-cols-2 gap-6">
                                        <div className="space-y-1"><p className="text-[10px] font-black uppercase text-white/40">Potencial ROI</p><p className="text-xl font-black text-emerald-400">+12.5%</p></div>
                                        <div className="space-y-1"><p className="text-[10px] font-black uppercase text-white/40">Efficiency Score</p><p className="text-xl font-black text-[#00f2ff]">Superior</p></div>
                                    </div>
                                </div>
                            </TiltCard>
                            <div className="space-y-8">
                                <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3"><Lightbulb className="text-amber-500" size={20}/><h4 className="text-sm font-black uppercase tracking-widest">Recomendaciones Estratégicas</h4></div>
                                    <div className="space-y-4">
                                        {[
                                            { t: 'Optimización de Leads', d: 'Asignar prospectos de alta gama a Carlos Ruiz (Top Performer).', i: <Zap/> },
                                            { t: 'Acelerador Trimestral', d: 'Implementar meta volante por volumen este fin de semana.', i: <TrendingUp/> }
                                        ].map((rec, i) => (
                                            <div key={i} className="flex items-center gap-4 p-5 bg-gray-50 rounded-[2rem] border border-transparent hover:border-[#004d4d]/20 transition-all cursor-pointer group">
                                                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-[#004d4d] shadow-sm group-hover:scale-110 transition-transform">{rec.i}</div>
                                                <div><p className="text-sm font-black text-gray-900">{rec.t}</p><p className="text-[10px] font-medium text-gray-500">{rec.d}</p></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={() => showToast("Analizando métricas profundas...", "info")} className="w-full py-6 bg-[#004D4D] text-white rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4 hover:bg-black transition-all group">
                                    <BrainCircuit size={20} className="group-hover:rotate-12 transition-transform"/> Ejecutar Auditoría de Rendimiento
                                </button>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* --- MODAL REGISTRO ASESOR PLATINUM PLUS --- */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-[1200px] h-[85vh] rounded-[4rem] shadow-3xl overflow-hidden relative z-10 border border-white flex flex-col lg:flex-row">
                            
                            {/* Botón de Cerrar Absoluto */}
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="absolute top-8 right-8 h-12 w-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-rose-500 hover:border-rose-100 transition-all shadow-xl z-[100] group"
                            >
                                <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                            </button>

                            {/* COLUMNA IZQUIERDA: FORMULARIO TÁCTICO */}
                            <div className="w-full lg:w-[500px] bg-gray-50 border-r border-gray-100 p-12 overflow-y-auto custom-scrollbar flex flex-col space-y-10">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-gray-900 rounded-2xl flex items-center justify-center text-[#00f2ff] shadow-lg shadow-cyan-500/20"><UserPlus size={24}/></div>
                                        <h3 className="text-2xl font-black uppercase italic tracking-tight text-gray-900">Talento Comercial</h3>
                                    </div>
                                </div>

                                <form onSubmit={handleSaveSeller} className="space-y-8 flex-1">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Nombre del Asesor</label>
                                        <input required placeholder="Ej: Sebastian Garcia" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-5 bg-white border border-gray-100 rounded-[2rem] outline-none focus:border-[#004d4d] text-sm font-bold shadow-sm transition-all" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Rol Operativo</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['Asesor Senior', 'Asesor Junior'].map(role => (
                                                <button key={role} type="button" onClick={() => setFormData({...formData, role})} className={`py-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${formData.role === role ? 'bg-[#004d4d] text-white border-transparent shadow-lg' : 'bg-white text-gray-400 border-gray-50'}`}>{role}</button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Sucursal de Operación</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {BRANCHES.map(b => (
                                                <button key={b} type="button" onClick={() => setFormData({...formData, branch: b})} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${formData.branch === b ? 'bg-emerald-50 text-emerald-700 border-emerald-500/20' : 'bg-white text-gray-400 border-gray-50'}`}>
                                                    <div className="flex items-center gap-3"><MapPin size={14}/> <span className="text-[10px] font-black uppercase">{b}</span></div>
                                                    {formData.branch === b && <CheckCircle2 size={16}/>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Meta de Facturación (COP)</label>
                                        <div className="relative group">
                                            <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500" size={20} />
                                            <input required value={formatDots(formData.target)} onChange={e => setFormData({...formData, target: e.target.value.replace(/\D/g, '')})} className="w-full pl-14 p-5 bg-white border border-gray-100 rounded-[2rem] outline-none focus:border-emerald-500 text-xl font-black text-gray-900 shadow-sm transition-all" />
                                        </div>
                                        <p className="text-[9px] font-black text-emerald-600 ml-4 mt-2">Equivale a: {formatCurrency(parseInt(formData.target || '0'))}</p>
                                    </div>

                                    <button type="submit" className="w-full py-6 bg-gray-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black hover:scale-[1.02] transition-all flex items-center justify-center gap-4 mt-10">
                                        <ShieldCheck size={24} className="text-[#00f2ff]"/> {editingSeller ? 'Actualizar Perfil' : 'Finalizar Registro'}
                                    </button>
                                </form>
                            </div>

                            {/* COLUMNA DERECHA: LIVE CARD PREVIEW (ESTILO APPLE) */}
                            <div className="flex-1 bg-[#FAFAFA] p-16 flex flex-col items-center justify-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#004d4d 1px, transparent 1px)', size: '20px 20px' }}></div>
                                
                                <div className="text-center mb-12 mt-20 relative z-10">
                                    <span className="px-4 py-1 bg-[#004d4d]/10 text-[#004d4d] rounded-full text-[10px] font-black uppercase tracking-[0.3em]">Vista en Vivo</span>
                                    <h4 className="text-xl font-medium text-gray-400 mt-4 italic">Vista previa de la tarjeta oficial del asesor</h4>
                                </div>

                                <motion.div 
                                    key={formData.name + formData.branch}
                                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    className="w-[450px] my-auto"
                                >
                                    <TiltCard className="p-12 h-auto bg-white shadow-3xl">
                                        <div className="flex justify-between items-start mb-10">
                                            <div className="h-24 w-24 rounded-[2.5rem] bg-gray-900 text-white flex items-center justify-center text-4xl font-black shadow-2xl ring-8 ring-gray-50 relative">
                                                {formData.name ? formData.name.substring(0, 2).toUpperCase() : '?'}
                                                <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-emerald-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white"><Star size={12} fill="currentColor" /></div>
                                            </div>
                                            <div className="text-right">
                                                <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 mx-auto mb-2"><Smartphone size={20}/></div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado Live</p>
                                                <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">En Línea</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 mb-10">
                                            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{formData.name || 'Nombre del Asesor'}</h2>
                                            <p className="text-xs font-bold text-[#004d4d] uppercase tracking-[0.2em] italic">{formData.role} · {formData.branch}</p>
                                        </div>
                                        <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-6">
                                            <div className="flex justify-between items-center"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Meta Asignada</span><span className="text-sm font-black text-gray-900">{formatCurrency(parseInt(formData.target || '0'))}</span></div>
                                            <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-gray-100 shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: '15%' }} className="h-full bg-[#004d4d] rounded-full"></motion.div></div>
                                            <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-gray-400 uppercase">Potencial ROI</span><span className="text-xs font-black text-emerald-600">+12.5%</span></div>
                                        </div>
                                    </TiltCard>
                                </motion.div>

                                {/* Insight de Bayt en el Modal - Subido con margen inferior */}
                                <div className="mt-auto mb-10 bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-xl max-w-sm flex items-center gap-6 relative z-10 animate-bounce-slow">
                                    <div className="h-12 w-12 bg-gray-900 text-[#00f2ff] rounded-2xl flex items-center justify-center shadow-lg"><Bot size={24}/></div>
                                    <p className="text-xs font-medium text-gray-600 italic leading-relaxed">&quot;Un asesor en **{formData.branch}** requiere un acelerador de meta del 5% para maximizar la sucursal.&quot;</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL GUÍA ELITE VENDEDORES */}
            <AnimatePresence>
                {isGuideOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuideOpen(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-6xl h-[80vh] rounded-[4rem] shadow-3xl overflow-hidden relative z-10 border border-white flex flex-col md:flex-row">
                            
                            {/* COLUMNA IZQUIERDA: MENÚ TÁCTICO */}
                            <div className="w-full md:w-[320px] bg-gray-50 border-r border-gray-100 p-10 flex flex-col gap-3">
                                <div className="h-12 w-12 bg-gray-900 text-[#00f2ff] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/20"><Bot size={24}/></div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004d4d] mb-4">Guía Comercial</h3>
                                
                                {[
                                    { id: 0, label: 'Panel de Control', icon: <LayoutGrid size={16}/> },
                                    { id: 1, label: 'Ranking de Honor', icon: <Trophy size={16}/> },
                                    { id: 2, label: 'Asignación Metas', icon: <Target size={16}/> },
                                    { id: 3, label: 'Inteligencia Bayt', icon: <Sparkles size={16}/> }
                                ].map(step => (
                                    <button 
                                        key={step.id} 
                                        onClick={() => setActiveGuideStep(step.id)} 
                                        className={`flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${activeGuideStep === step.id ? 'bg-[#004d4d] text-white shadow-xl shadow-[#004d4d]/20' : 'text-gray-500 hover:bg-white hover:shadow-sm'}`}
                                    >
                                        <div className={activeGuideStep === step.id ? 'text-[#00f2ff]' : 'text-gray-300'}>{step.icon}</div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span>
                                    </button>
                                ))}

                                <div className="mt-auto pt-8 border-t border-gray-100">
                                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Estado Sistema</p>
                                        <p className="text-[10px] font-bold text-emerald-900 mt-1">Monitoreo Live Activo</p>
                                    </div>
                                </div>
                            </div>

                            {/* COLUMNA DERECHA: CONTENIDO VISUAL */}
                            <div className="flex-1 p-16 flex flex-col justify-between relative overflow-y-auto custom-scrollbar bg-white">
                                <button onClick={() => setIsGuideOpen(false)} className="absolute top-10 right-10 text-gray-300 hover:text-rose-500 transition-colors z-[100]"><X size={24}/></button>
                                
                                <div className="space-y-12">
                                    {activeGuideStep === 0 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Analítica de <span className="text-[#004D4D]">Fuerza</span></h2>
                                                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">&quot;Visualiza el impacto real de cada asesor en tu caja mensual.&quot;</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:bg-white hover:shadow-xl transition-all">
                                                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 mb-6 shadow-sm"><DollarSign size={24}/></div>
                                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Facturación Equipo</p>
                                                    <p className="text-sm font-medium text-gray-600 mt-2 italic">Suma total de ventas cerradas por todos los asesores en el periodo actual.</p>
                                                </div>
                                                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:bg-white hover:shadow-xl transition-all">
                                                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-[#00f2ff] mb-6 shadow-sm"><Activity size={24}/></div>
                                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Tasa de Conversión</p>
                                                    <p className="text-sm font-medium text-gray-600 mt-2 italic">Efectividad promedio del equipo al transformar leads en ventas reales.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeGuideStep === 1 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Ranking & <span className="text-[#004D4D]">Gamificación</span></h2>
                                                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">Motiva a tu equipo mediante el reconocimiento público del desempeño.</p>
                                            </div>
                                            <div className="relative p-10 bg-[#001A1A] rounded-[3.5rem] overflow-hidden text-white shadow-2xl">
                                                <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={120}/></div>
                                                <div className="space-y-6 relative z-10">
                                                    <div className="flex items-center gap-6">
                                                        <div className="h-14 w-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-lg"><Trophy size={28}/></div>
                                                        <div>
                                                            <p className="text-sm font-black uppercase tracking-widest text-amber-400">Líder del Mes (MVP)</p>
                                                            <p className="text-xs font-medium text-gray-400 mt-1 italic">El asesor con mayor facturación neta acumulada.</p>
                                                        </div>
                                                    </div>
                                                    <div className="h-px w-full bg-white/10"></div>
                                                    <div className="flex items-center gap-6 opacity-60">
                                                        <div className="h-14 w-14 rounded-2xl bg-gray-800 text-white flex items-center justify-center"><Users size={28}/></div>
                                                        <div>
                                                            <p className="text-sm font-black uppercase tracking-widest">Escalafón General</p>
                                                            <p className="text-xs font-medium text-gray-400 mt-1">Organización automática por volumen de cierre.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeGuideStep === 2 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Gestión de <span className="text-[#004D4D]">Objetivos</span></h2>
                                                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">Asigna cuotas realistas y monitorea el progreso visualmente.</p>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="p-8 bg-[#004D4D]/5 border border-[#004D4D]/10 rounded-[2.5rem] flex items-center gap-8">
                                                    <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-[#004d4d] shadow-xl"><Target size={32}/></div>
                                                    <div>
                                                        <h4 className="text-lg font-black uppercase text-gray-900 tracking-tight">Metas Dinámicas</h4>
                                                        <p className="text-xs text-gray-500 font-medium mt-1 italic">Cada cambio en la meta se refleja instantáneamente en la barra de progreso del asesor.</p>
                                                    </div>
                                                </div>
                                                <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-center gap-8">
                                                    <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-xl"><CheckCircle2 size={32}/></div>
                                                    <div>
                                                        <h4 className="text-lg font-black uppercase text-gray-900 tracking-tight">Umbral de Éxito</h4>
                                                        <p className="text-xs text-gray-500 font-medium mt-1 italic">El sistema marca en verde a quienes superan el 100% de su objetivo.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeGuideStep === 3 && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#001A1A]">Inteligencia <span className="text-[#004D4D]">Comercial</span></h2>
                                                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">Deja que Bayt AI optimice tu estrategia de equipo.</p>
                                            </div>
                                            <div className="p-10 bg-gray-900 rounded-[3.5rem] relative overflow-hidden text-white shadow-2xl">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00f2ff]/10 rounded-full blur-[80px]"></div>
                                                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                                    <div className="h-24 w-24 bg-[#00f2ff]/10 text-[#00f2ff] rounded-[2rem] border border-[#00f2ff]/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,242,255,0.2)] animate-pulse"><Bot size={48}/></div>
                                                    <div className="space-y-4">
                                                        <p className="text-sm font-black uppercase tracking-[0.3em] text-[#00f2ff]">Bayt Strategist</p>
                                                        <p className="text-lg font-medium leading-relaxed italic text-gray-300">&quot;Bayt identifica asesores con alto ROAS para asignarles leads de mayor valor, maximizando la utilidad por cada conversación.&quot;</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-12 pt-12 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-gray-900 text-[#00f2ff] flex items-center justify-center font-black text-xs shadow-lg italic">B</div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bayup Training Module v2.0</p>
                                    </div>
                                    <button onClick={() => setIsGuideOpen(false)} className="px-12 py-5 bg-gray-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-95">Entendido, Continuar Operación</button>
                                </div>
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