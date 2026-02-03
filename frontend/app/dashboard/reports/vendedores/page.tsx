"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Shield, Trash2, Edit3, X, 
  ChevronRight, TrendingUp, DollarSign, Activity, 
  Zap, Target, Bot, Sparkles, Download, Filter, 
  Search, ArrowUpRight, Clock, Award, Medal, 
  CreditCard, FileText, Check, ShieldCheck, 
  History as LucideHistory, Scale, ShoppingBag, Info, Loader2
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
}

const BRANCHES = ['Tienda Principal', 'Sucursal Norte', 'Showroom Sur'];

// --- COMPONENTE TILT CARD PREMIUM ---
const TiltCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const box = card.getBoundingClientRect();
        const x = e.clientX - box.left;
        const y = e.clientY - box.top;
        const centerX = box.width / 2;
        const centerY = box.height / 2;
        const rotateX = (y - centerY) / 7; 
        const rotateY = (centerX - x) / 7;
        setRotateX(rotateX);
        setRotateY(rotateY);
        setGlarePos({ x: (x/box.width)*100, y: (y/box.height)*100, opacity: 0.3 });
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
    
    const [activeTab, setActiveTab] = useState<'equipo' | 'ranking' | 'metas' | 'bayt'>('equipo');
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterBranch, setFilterBranch] = useState("all");
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [activeGuideStep, setActiveGuideStep] = useState(0);
    const [editingSeller, setEditingSeller] = useState<Seller | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        role: 'Asesor Comercial',
        branch: 'Tienda Principal',
        target: '10000000',
        avatar: 'ER'
    });

    // --- CARGA Y PERSISTENCIA ---
    useEffect(() => {
        const saved = localStorage.getItem('bayup_sellers_data');
        if (saved) {
            setSellers(JSON.parse(saved));
        } else {
            const initial: Seller[] = [
                { id: '1', name: 'Elena Rodriguez', role: 'Líder de Ventas', branch: 'Tienda Principal', total_sales: 45800000, sales_month: 8500000, target: 10000000, conversion_rate: 12.4, growth: 15, status: 'online', avatar: 'ER' },
                { id: '2', name: 'Carlos Ruiz', role: 'Asesor Senior', branch: 'Sucursal Norte', total_sales: 28400000, sales_month: 5200000, target: 10000000, conversion_rate: 9.8, growth: 8, status: 'online', avatar: 'CR' }
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
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    const formatDots = (val: string | number) => {
        const num = typeof val === 'string' ? val.replace(/\D/g, '') : val.toString();
        if (!num) return "";
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const filteredSellers = useMemo(() => {
        return sellers.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesBranch = filterBranch === 'all' || s.branch === filterBranch;
            return matchesSearch && matchesBranch;
        });
    }, [sellers, searchTerm, filterBranch]);

    const rankingSellers = useMemo(() => [...sellers].sort((a, b) => b.sales_month - a.sales_month), [sellers]);

    // --- HANDLERS ---
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
                avatar: formData.name.substring(0, 2).toUpperCase()
            };
            saveSellers([...sellers, newSeller]);
            showToast("Nuevo asesor registrado", "success");
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (!confirm("¿Eliminar este asesor del equipo comercial?")) return;
        saveSellers(sellers.filter(s => s.id !== id));
        showToast("Asesor eliminado", "info");
    };

    const handleDownloadReport = () => {
        const html = `<html><body><h1 style="color:#004d4d">REPORTE EQUIPO COMERCIAL</h1><table border="1">
            <tr style="background:#004d4d;color:white"><th>Asesor</th><th>Ventas Mes</th><th>Meta</th><th>Conversión</th></tr>
            ${sellers.map(s => `<tr><td>${s.name}</td><td>${formatCurrency(s.sales_month)}</td><td>${formatCurrency(s.target)}</td><td>${s.conversion_rate}%</td></tr>`).join('')}
        </table></body></html>`;
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'Reporte_Vendedores_Bayup.xls';
        a.click();
        showToast("Excel profesional generado 🚀", "success");
    };

    // --- COMPONENTE BOTÓN EXPANDIBLE ---
    const ExpandableButton = ({ icon: Icon, label, onClick, variant = "white" }: any) => {
        const [isHovered, setIsHovered] = useState(false);
        return (
            <button
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={onClick}
                className={`h-12 flex items-center justify-center rounded-2xl transition-all duration-500 border ${
                    variant === "black" ? "bg-gray-900 text-white border-transparent" : "bg-white text-slate-500 border-gray-100 hover:bg-gray-50"
                } ${isHovered ? "px-6 gap-3" : "w-12 px-0"}`}
            >
                <Icon size={18} className={variant === "black" ? "text-[#00f2ff]" : ""} />
                <AnimatePresence>
                    {isHovered && (
                        <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">
                            {label}
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>
        );
    };

    if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin text-[#004d4d]" size={40} /></div>;

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-1000">
            
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span>
                        <span className="text-[10px] font-black uppercase text-[#004d4d]/60 tracking-[0.2em]">Fuerza de Ventas Elite</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Equipo <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">Comercial</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">
                        Gestiona, motiva y audita el rendimiento operativo de tus <span className="font-bold text-[#001A1A]">asesores de alto impacto</span>.
                    </p>
                </div>
                <button onClick={() => { setEditingSeller(null); setFormData({ name: '', role: 'Asesor Comercial', branch: 'Tienda Principal', target: '10000000', avatar: '' }); setIsModalOpen(true); }} className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group">
                    <UserPlus size={18} className="text-[#00f2ff] group-hover:rotate-12 transition-transform" /> Registrar Asesor
                </button>
            </div>

            {/* KPIs Platinum */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                {[
                    { label: 'Asesores Activos', value: sellers.length, icon: <Users size={20}/>, color: 'text-[#004d4d]', trend: 'Live' },
                    { label: 'Facturación Equipo', value: formatCurrency(sellers.reduce((acc,s)=>acc+s.sales_month,0)), icon: <DollarSign size={20}/>, color: 'text-emerald-600', trend: '+12%' },
                    { label: 'Conversión Prom.', value: '10.4%', icon: <Target size={20}/>, color: 'text-[#00f2ff]', trend: 'Estable' },
                    { label: 'Líder del Mes', value: rankingSellers[0]?.name || 'N/A', icon: <Medal size={20}/>, color: 'text-amber-500', trend: 'MVP' },
                ].map((kpi, i) => (
                    <TiltCard key={i} className="p-8">
                        <div className="flex justify-between items-start">
                            <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color}`}>{kpi.icon}</div>
                            <span className="text-[10px] font-black px-2 py-1 bg-gray-50 text-gray-400 rounded-lg uppercase">{kpi.trend}</span>
                        </div>
                        <div className="mt-6"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p><h3 className="text-2xl font-black text-gray-900 mt-1">{kpi.value}</h3></div>
                    </TiltCard>
                ))}
            </div>

            {/* Tabs & Info */}
            <div className="flex items-center justify-center gap-4">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl flex items-center overflow-x-auto">
                    {[
                        { id: 'equipo', label: 'Equipo Elite', icon: <Users size={14}/> },
                        { id: 'ranking', label: 'Ranking Mensual', icon: <Award size={14}/> },
                        { id: 'metas', label: 'Gestión de Metas', icon: <Target size={14}/> },
                        { id: 'bayt', label: 'Bayt Insight', icon: <Sparkles size={14}/> }
                    ].map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-[#004D4D] text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
                <button onClick={() => setIsGuideOpen(true)} className="h-12 w-12 rounded-full bg-white border border-gray-100 shadow-xl flex items-center justify-center text-[#004d4d] hover:bg-[#004d4d] hover:text-white transition-all group">
                    <Info size={20} className="group-hover:scale-110 transition-transform" />
                </button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                    {/* VISTA EQUIPO */}
                    {activeTab === 'equipo' && (
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row gap-4 items-center bg-white/60 backdrop-blur-md p-3 rounded-3xl border border-white/60 shadow-sm mx-4 shrink-0 relative z-30">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input type="text" placeholder="Buscar por nombre o sucursal..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-transparent text-sm font-bold text-slate-700 outline-none" />
                                </div>
                                <div className="flex items-center gap-3 relative">
                                    <ExpandableButton icon={Filter} label="Sucursal" onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} />
                                    <AnimatePresence>
                                        {isFilterMenuOpen && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full mt-2 right-0 w-48 bg-white rounded-2xl shadow-2xl p-2 z-50 border border-gray-100">
                                                <button onClick={() => { setFilterBranch('all'); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 rounded-xl text-[9px] font-black uppercase hover:bg-gray-50">Todas</button>
                                                {BRANCHES.map(b => <button key={b} onClick={() => { setFilterBranch(b); setIsFilterMenuOpen(false); }} className="w-full text-left p-3 rounded-xl text-[9px] font-black uppercase hover:bg-gray-50">{b}</button>)}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <ExpandableButton icon={Download} label="Reporte" onClick={handleDownloadReport} variant="black" />
                                </div>
                            </div>
                            <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredSellers.map(s => (
                                    <motion.div key={s.id} whileHover={{ y: -10 }} className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-6 group">
                                        <div className="flex justify-between items-start">
                                            <div className="h-16 w-16 rounded-[1.8rem] bg-gray-900 text-white flex items-center justify-center text-xl font-black shadow-2xl relative">
                                                {s.avatar}
                                                <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-white ${s.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingSeller(s); setFormData({ name: s.name, role: s.role, branch: s.branch, target: s.target.toString(), avatar: s.avatar }); setIsModalOpen(true); }} className="h-10 w-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-[#004d4d] hover:text-white transition-all"><Edit3 size={16}/></button>
                                                <button onClick={() => handleDelete(s.id)} className="h-10 w-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                        <div><h4 className="text-xl font-black text-gray-900">{s.name}</h4><p className="text-[10px] font-bold text-[#004d4d] uppercase italic">{s.role} · {s.branch}</p></div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between"><span className="text-[9px] font-black text-gray-400 uppercase">Facturación Mes</span><span className="text-xs font-black text-gray-900">{formatCurrency(s.sales_month)}</span></div>
                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((s.sales_month/s.target)*100, 100)}%` }} className="h-full bg-gradient-to-r from-[#004d4d] to-[#00f2ff]" /></div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* VISTA RANKING */}
                    {activeTab === 'ranking' && (
                        <div className="px-4 space-y-6">
                            {rankingSellers.map((s, idx) => (
                                <div key={s.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between gap-10">
                                    <div className="flex items-center gap-8">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl font-black ${idx === 0 ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>{idx + 1}</div>
                                        <div className="h-14 w-14 rounded-xl bg-gray-900 text-white flex items-center justify-center font-black">{s.avatar}</div>
                                        <div><h4 className="text-lg font-black">{s.name}</h4><p className="text-[10px] uppercase font-bold text-gray-400">{s.branch}</p></div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black uppercase text-gray-400">Ventas Acumuladas</p>
                                        <p className="text-xl font-black text-emerald-600">{formatCurrency(s.sales_month)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* VISTA METAS */}
                    {activeTab === 'metas' && (
                        <div className="px-4">
                            <div className="bg-white rounded-[4rem] border border-gray-100 shadow-xl overflow-hidden p-12 space-y-10">
                                <h3 className="text-2xl font-black uppercase italic">Asignación de Objetivos</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {sellers.map(s => (
                                        <div key={s.id} className="p-8 bg-gray-50 rounded-[3rem] border border-gray-100 space-y-6">
                                            <div className="flex justify-between items-center"><h4 className="text-lg font-black">{s.name}</h4><Target size={20} className="text-[#004d4d]"/></div>
                                            <div className="space-y-2"><label className="text-[9px] font-black uppercase text-gray-400">Meta Mensual (COP)</label>
                                                <input type="text" value={formatDots(s.target)} onChange={(e) => {
                                                    const val = parseInt(e.target.value.replace(/\D/g, '') || '0');
                                                    saveSellers(sellers.map(sel => sel.id === s.id ? {...sel, target: val} : sel));
                                                }} className="w-full p-4 bg-white rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none font-black text-[#004d4d]" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bayt' && (
                        <div className="px-4">
                            <div className="bg-[#004d4d] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Medal size={300} /></div>
                                <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
                                    <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center animate-pulse"><Bot size={64} className="text-[#00f2ff]" /></div>
                                    <div className="flex-1 space-y-6">
                                        <h3 className="text-4xl font-black uppercase italic tracking-tighter">Team Optimization</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                                <div className="flex items-center gap-3"><Sparkles className="text-[#00f2ff]" size={20}/><p className="text-[10px] font-black uppercase tracking-widest">Top Performer</p></div>
                                                <p className="text-sm font-medium italic leading-relaxed text-white/80">"Elena Rodriguez ha mantenido un ROAS de 6.2x. Sugiero asignarle los leads mayoristas del nuevo catálogo."</p>
                                            </div>
                                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                                <div className="flex items-center gap-3"><TrendingUp className="text-emerald-400" size={20}/><p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Eficiencia</p></div>
                                                <p className="text-sm font-medium italic leading-relaxed text-white/80">"La tasa de cierre grupal sube un 15% cuando las respuestas son en menos de 5 min. Implementa incentivos por tiempo de respuesta."</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* MODAL REGISTRO ASESOR */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-md rounded-[3.5rem] shadow-3xl p-10 relative z-10 border border-white">
                            <form onSubmit={handleSaveSeller} className="space-y-8">
                                <h3 className="text-2xl font-black text-gray-900 uppercase italic">Perfil de Asesor</h3>
                                <div className="space-y-6">
                                    <input required placeholder="Nombre Completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" />
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Sucursal Asignada</label>
                                        <select value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner appearance-none">
                                            {BRANCHES.map(b => <option key={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Meta Mensual Inicial</label>
                                        <input required value={formatDots(formData.target)} onChange={e => setFormData({...formData, target: e.target.value.replace(/\D/g, '')})} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-black shadow-inner" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">Confirmar Registro</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL GUÍA ELITE */}
            <AnimatePresence>
                {isGuideOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuideOpen(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-6xl h-[80vh] rounded-[4rem] shadow-3xl overflow-hidden relative z-10 border border-white flex flex-col md:flex-row">
                            <div className="w-full md:w-[300px] bg-gray-50 border-r border-gray-100 p-10 flex flex-col gap-3">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004d4d]">Guía Maestro</h3>
                                {[
                                    { id: 0, label: 'Gestión de Equipo', icon: <Users size={14}/> },
                                    { id: 1, label: 'Ranking & KPI', icon: <Award size={14}/> },
                                    { id: 2, label: 'Metas Tácticas', icon: <Target size={14}/> }
                                ].map(step => (
                                    <button key={step.id} onClick={() => setActiveGuideStep(step.id)} className={`flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${activeGuideStep === step.id ? 'bg-[#004d4d] text-white shadow-lg' : 'text-gray-500 hover:bg-white'}`}>
                                        <div className={activeGuideStep === step.id ? 'text-[#00f2ff]' : 'text-gray-300'}>{step.icon}</div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex-1 p-12 bg-white flex flex-col justify-between">
                                <div className="space-y-8">
                                    <h2 className="text-3xl font-black uppercase italic">Comercial Mastery</h2>
                                    <p className="text-sm font-medium text-gray-600 leading-relaxed bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 shadow-inner italic">
                                        {[
                                            "Registra a tus asesores y asígnalos a sucursales físicas o digitales. Puedes monitorear su estado de conexión y crecimiento mensual en tiempo real.",
                                            "El Ranking organiza a tu equipo según su facturación neta del mes. Úsalo para identificar a tus MVPs y detectar brechas de rendimiento antes del cierre.",
                                            "Define objetivos realistas para cada asesor. Las metas se reflejan en barras de progreso visuales que ayudan al equipo a visualizar su bono de comisión."
                                        ][activeGuideStep]}
                                    </p>
                                </div>
                                <button onClick={() => setIsGuideOpen(false)} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">Entendido</button>
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
