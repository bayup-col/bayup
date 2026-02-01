"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Smartphone, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Store, 
  Package, 
  LayoutGrid, 
  Globe, 
  Briefcase,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Activity,
  Zap,
  Target,
  Bot,
  Sparkles,
  Download,
  Filter,
  Search,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  PieChart,
  Medal,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "@/context/auth-context";
import { useToast } from '@/context/toast-context';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    Cell 
} from 'recharts';

// --- INTERFACES ---
interface Seller {
    id: string;
    name: string;
    role: string;
    branch: string;
    total_sales: number;
    sales_month: number;
    last_month_sales: number;
    conversion_rate: number;
    status: 'online' | 'offline' | 'on_break';
    channels: { web: boolean; social: boolean; in_store: boolean };
    avatar: string;
    trend_data: { name: string; value: number }[];
}

const MOCK_SELLERS: Seller[] = [
    {
        id: 's1',
        name: 'Elena Rodriguez',
        role: 'Líder de Ventas',
        branch: 'Tienda Principal',
        total_sales: 45800000,
        sales_month: 8500000,
        last_month_sales: 7200000,
        conversion_rate: 12.4,
        status: 'online',
        channels: { web: true, social: true, in_store: true },
        avatar: 'ER',
        trend_data: [
            { name: 'Lun', value: 1200 }, { name: 'Mar', value: 900 }, { name: 'Mie', value: 1500 },
            { name: 'Jue', value: 1300 }, { name: 'Vie', value: 1800 }, { name: 'Sab', value: 2200 }, { name: 'Dom', value: 1900 }
        ]
    },
    {
        id: 's2',
        name: 'Carlos Ruiz',
        role: 'Asesor Senior',
        branch: 'Sucursal Norte',
        total_sales: 28400000,
        sales_month: 5200000,
        last_month_sales: 4800000,
        conversion_rate: 9.8,
        status: 'online',
        channels: { web: false, social: true, in_store: true },
        avatar: 'CR',
        trend_data: [
            { name: 'Lun', value: 800 }, { name: 'Mar', value: 1100 }, { name: 'Mie', value: 950 },
            { name: 'Jue', value: 1200 }, { name: 'Vie', value: 1400 }, { name: 'Sab', value: 1800 }, { name: 'Dom', value: 1500 }
        ]
    },
    {
        id: 's3',
        name: 'Roberto Gómez',
        role: 'Asesor Junior',
        branch: 'Showroom Sur',
        total_sales: 12400000,
        sales_month: 2100000,
        last_month_sales: 2500000,
        conversion_rate: 6.2,
        status: 'on_break',
        channels: { web: false, social: false, in_store: true },
        avatar: 'RG',
        trend_data: [
            { name: 'Lun', value: 400 }, { name: 'Mar', value: 350 }, { name: 'Mie', value: 500 },
            { name: 'Jue', value: 450 }, { name: 'Vie', value: 600 }, { name: 'Sab', value: 800 }, { name: 'Dom', value: 700 }
        ]
    }
];

export default function VendedoresPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'equipo' | 'ranking' | 'metas' | 'bayt'>('equipo');
    const [sellers, setSellers] = useState<Seller[]>(MOCK_SELLERS);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Persistencia para integración con otros módulos
    useEffect(() => {
        const saved = localStorage.getItem('business_sellers');
        if (saved) {
            setSellers(JSON.parse(saved));
        } else {
            localStorage.setItem('business_sellers', JSON.stringify(MOCK_SELLERS));
        }
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
            {[
                { label: 'Asesores Activos', value: '08', sub: 'En línea ahora', icon: <Users size={20}/>, trend: 'OK', color: 'text-[#004d4d]' },
                { label: 'Facturación Equipo', value: '$ 45.8M', sub: 'Este mes', icon: <DollarSign size={20}/>, trend: '+18.4%', color: 'text-emerald-600' },
                { label: 'Conversión Red', value: '10.2%', sub: 'Promedio global', icon: <Target size={20}/>, trend: '+1.5%', color: 'text-[#00f2ff]' },
                { label: 'Meta Grupal', value: '82%', sub: 'Progreso mensual', icon: <Activity size={20}/>, trend: 'En curso', color: 'text-amber-500' },
            ].map((kpi, i) => (
                <motion.div key={i} whileHover={{ y: -5, scale: 1.02 }} className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/80 shadow-sm flex flex-col justify-between group transition-all">
                    <div className="flex justify-between items-start">
                        <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                            {kpi.icon}
                        </div>
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${kpi.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>{kpi.trend}</span>
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
                    placeholder="Buscar asesor por nombre, rol o sucursal..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-transparent text-sm font-bold text-slate-700 outline-none" 
                />
            </div>
            <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex items-center gap-3">
                <button className="h-12 flex items-center gap-2 px-5 rounded-2xl bg-white text-slate-500 border border-gray-100 hover:bg-gray-50 transition-all">
                    <Filter size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Sucursal</span>
                </button>
                <button className="h-12 flex items-center gap-2 px-5 bg-gray-900 text-white rounded-2xl shadow-lg hover:bg-black transition-all">
                    <Download size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Reporte Equipo</span>
                </button>
            </div>
        </div>
    );

    const renderSellerList = () => (
        <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sellers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((seller) => (
                <motion.div 
                    key={seller.id} 
                    onClick={() => setSelectedSeller(seller)}
                    whileHover={{ y: -10 }} 
                    className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-8 relative overflow-hidden cursor-pointer group"
                >
                    {/* Status Badge */}
                    <div className="flex justify-between items-start">
                        <div className="h-16 w-16 rounded-[1.8rem] bg-gray-900 text-white flex items-center justify-center text-xl font-black shadow-2xl relative">
                            {seller.avatar}
                            <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-white ${
                                seller.status === 'online' ? 'bg-emerald-500 animate-pulse' : 
                                seller.status === 'on_break' ? 'bg-amber-500' : 'bg-gray-300'
                            }`}></div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                                seller.growth >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                                {seller.growth >= 0 ? '+' : ''}{seller.growth}% Growth
                            </span>
                        </div>
                    </div>

                    {/* Info */}
                    <div>
                        <h4 className="text-2xl font-black text-gray-900 tracking-tight">{seller.name}</h4>
                        <p className="text-[10px] font-bold text-[#004d4d] uppercase tracking-widest mt-1 italic">{seller.role} · {seller.branch}</p>
                    </div>

                    {/* Stats */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Ventas Mes</p>
                                <p className="text-sm font-black text-gray-900 mt-1">{formatCurrency(seller.sales_month)}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Conversión</p>
                                <p className="text-sm font-black text-[#004d4d] mt-1">{seller.conversion_rate}%</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Meta Mensual</p>
                                <p className="text-[9px] font-black text-[#004d4d]">85%</p>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: '85%' }} 
                                    className="h-full bg-gradient-to-r from-[#004d4d] to-[#00f2ff] rounded-full shadow-[0_0_10px_rgba(0,242,255,0.3)]"
                                ></motion.div>
                            </div>
                        </div>
                    </div>

                    {/* View Button */}
                    <div className="pt-4 border-t border-gray-50 flex justify-between items-center group-hover:text-[#004d4d] transition-colors">
                        <span className="text-[10px] font-black uppercase tracking-widest">Ver Auditoría 360°</span>
                        <ArrowUpRight size={16} />
                    </div>
                </motion.div>
            ))}
        </div>
    );

    const renderBaytInsight = () => (
        <div className="px-4">
            <div className="bg-[#004d4d] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Medal size={300} /></div>
                <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
                    <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center animate-pulse"><Bot size={64} className="text-[#00f2ff]" /></div>
                    <div className="flex-1 space-y-6">
                        <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#00f2ff]/20">Bayt Talent-Insight</span>
                        <h3 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2ff]">Rendimiento del Equipo Comercial</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                <div className="flex items-center gap-3"><Sparkles className="text-[#00f2ff]" size={20}/><p className="text-[10px] font-black uppercase tracking-widest text-[#00f2ff]">Top Performer</p></div>
                                <p className="text-sm font-medium italic leading-relaxed">"**Elena Rodriguez** ha mantenido un ROAS individual de 6.2x. Sugiero asignarle los leads mayoristas del nuevo catálogo para maximizar el ticket promedio de la semana."</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                <div className="flex items-center gap-3"><TrendingUp className="text-emerald-400" size={20}/><p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Oportunidad de Mejora</p></div>
                                <p className="text-sm font-medium italic leading-relaxed">"Tu tasa de cierre grupal sube un 15% cuando los asesores responden en menos de 5 minutos. Considera implementar bonos por **Tiempo de Respuesta** en WhatsApp."</p>
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
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Fuerza de Ventas</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Equipo <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">Comercial</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">
                        Gestiona, motiva y audita el rendimiento de tus <span className="font-bold text-[#001A1A]">asesores elite</span>.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsCreateModalOpen(true)} className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group">
                        <UserPlus size={18} className="text-[#00f2ff] group-hover:rotate-12 transition-transform" />
                        Registrar Asesor
                    </button>
                </div>
            </div>

            {/* --- KPIs ESTRATÉGICOS --- */}
            {renderKPIs()}

            {/* --- MENÚ FLOTANTE CENTRAL --- */}
            <div className="flex items-center justify-center gap-6 shrink-0 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 backdrop-blur-xl flex items-center relative">
                    {[
                        { id: 'equipo', label: 'Equipo Elite', icon: <Users size={14}/> },
                        { id: 'ranking', label: 'Ranking Mensual', icon: <Award size={14}/> },
                        { id: 'metas', label: 'Gestión de Metas', icon: <Target size={14}/> },
                        { id: 'bayt', label: 'Bayt Insight', icon: <Sparkles size={14}/> }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`relative px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 flex items-center gap-2 ${activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}
                        >
                            {activeTab === tab.id && (
                                <motion.div layoutId="activeSellerTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                            )}
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- CONTENIDO DINÁMICO --- */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="space-y-10">
                    {activeTab === 'equipo' && (
                        <div className="space-y-8">
                            {renderActionBar()}
                            {renderSellerList()}
                        </div>
                    )}
                    {activeTab === 'ranking' && (
                        <div className="px-4 py-20 text-center text-gray-300 font-bold uppercase tracking-widest border-4 border-dashed border-gray-100 rounded-[4rem]">Ranking visual de asesores en desarrollo</div>
                    )}
                    {activeTab === 'metas' && (
                        <div className="px-4 py-20 text-center text-gray-300 font-bold uppercase tracking-widest border-4 border-dashed border-gray-100 rounded-[4rem]">Asignación de metas comerciales en desarrollo</div>
                    )}
                    {activeTab === 'bayt' && renderBaytInsight()}
                </motion.div>
            </AnimatePresence>

            {/* --- MODAL 360° DETALLE DE ASESOR --- */}
            <AnimatePresence>
                {selectedSeller && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSeller(null)} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                        <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="bg-white w-full max-w-6xl h-[90vh] rounded-[4rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-white/20">
                            
                            {/* SIDEBAR ASESOR */}
                            <div className="w-full md:w-[400px] bg-gray-50 border-r border-gray-100 p-12 overflow-y-auto custom-scrollbar space-y-12">
                                <button onClick={() => setSelectedSeller(null)} className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 shadow-sm transition-all"><X size={24}/></button>
                                
                                <section className="space-y-6">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-200 pb-3">Información del Asesor</h4>
                                    <div className="flex items-center gap-6">
                                        <div className="h-20 w-20 rounded-[1.5rem] bg-gray-900 text-white flex items-center justify-center text-3xl font-black shadow-2xl">
                                            {selectedSeller.avatar}
                                        </div>
                                        <div><h3 className="text-xl font-black text-gray-900 tracking-tight">{selectedSeller.name}</h3><p className="text-sm font-bold text-[#004d4d] mt-1 italic">{selectedSeller.role}</p></div>
                                    </div>
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center gap-4 text-sm font-bold text-gray-600"><MapPin size={18} className="text-[#00f2ff]"/> {selectedSeller.branch}</div>
                                        <div className="flex items-center gap-4 text-sm font-bold text-gray-600"><Briefcase size={18} className="text-[#00f2ff]"/> Fuerza de Ventas Directa</div>
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-200 pb-3">Resumen Comercial</h4>
                                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between"><span className="text-[9px] font-black text-gray-400 uppercase">Ventas Mes:</span><span className="text-xs font-black text-emerald-600">{formatCurrency(selectedSeller.sales_month)}</span></div>
                                        <div className="flex items-center justify-between"><span className="text-[9px] font-black text-gray-400 uppercase">Tasa Cierre:</span><span className="text-xs font-black text-[#004d4d]">{selectedSeller.conversion_rate}%</span></div>
                                        <div className="pt-2 border-t border-gray-50 flex items-center justify-between"><span className="text-[10px] font-black text-gray-900 uppercase">Venta Histórica:</span><span className="text-sm font-black text-gray-900">{formatCurrency(selectedSeller.total_sales)}</span></div>
                                    </div>
                                </section>

                                <button className="w-full py-5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#004d4d] transition-all shadow-2xl flex items-center justify-center gap-3">
                                    <MessageSquare size={16} className="text-[#00f2ff]" /> Contactar Asesor
                                </button>
                            </div>

                            {/* MAIN CONTENT: TRENDS & ANALYTICS */}
                            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                                <div className="p-12 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
                                    <div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Rendimiento Individual</h2>
                                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest mt-2 flex items-center gap-2"><Activity size={14} className="text-[#00f2ff]"/> Análisis de facturación semanal</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button className="h-12 px-6 bg-gray-50 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#004d4d] border border-gray-100">Ver Comisiones</button>
                                        <button className="h-12 px-6 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl">Editar Perfil</button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-gray-50/20">
                                    {/* Gráfica de Tendencia */}
                                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={selectedSeller.trend_data}>
                                                <defs>
                                                    <linearGradient id="colorSeller" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#004d4d" stopOpacity={0.1}/>
                                                        <stop offset="95%" stopColor="#004d4d" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                                <Area type="monotone" dataKey="value" stroke="#004d4d" strokeWidth={4} fillOpacity={1} fill="url(#colorSeller)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Alertas Específicas */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-[#001a1a] p-8 rounded-[2.5rem] text-white space-y-4">
                                            <div className="flex items-center gap-3"><AlertCircle className="text-amber-400" size={20}/><p className="text-[10px] font-black uppercase tracking-widest">Alerta de Meta</p></div>
                                            <p className="text-sm font-medium italic opacity-80 leading-relaxed">"Este asesor está al 85% de su meta con 5 días restantes. Sugiero incentivar el cierre de los pedidos pendientes en su bandeja de entrada."</p>
                                        </div>
                                        <div className="bg-[#004d4d] p-8 rounded-[2.5rem] text-white space-y-4">
                                            <div className="flex items-center gap-3"><TrendingUp className="text-emerald-400" size={20}/><p className="text-[10px] font-black uppercase tracking-widest">Punto Fuerte</p></div>
                                            <p className="text-sm font-medium italic opacity-80 leading-relaxed">"Su mayor efectividad ocurre los Sábados. Tiene un excelente manejo de objeciones en ventas directas."</p>
                                        </div>
                                    </div>
                                </div>
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