"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Store, 
  MapPin, 
  Globe, 
  Smartphone, 
  ChevronRight, 
  X, 
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  TrendingUp,
  TrendingDown,
  Clock, 
  DollarSign,
  Rocket,
  Activity,
  Zap,
  LayoutGrid,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Package,
  Search,
  Filter,
  Download,
  Calendar,
  Sparkles,
    Bot, 
    Truck, 
    Monitor,
    ArrowLeftRight,  BarChart3
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
    Cell,
    PieChart,
    Pie
} from 'recharts';

// --- INTERFACES ---
interface Branch {
    id: string;
    name: string;
    responsible: string;
    location: string;
    status: 'open' | 'closed' | 'maintenance';
    revenue: number;
    expenses: number;
    growth: number;
    stock_status: 'optimal' | 'critical' | 'normal';
    staff_count: number;
    trend_data: { day: string; value: number }[];
}

// --- MOCK DATA ---
const MOCK_BRANCHES: Branch[] = [
    {
        id: 'b1',
        name: 'Tienda Principal',
        responsible: 'Sebastian Gomez',
        location: 'Bogotá, Chicó',
        status: 'open',
        revenue: 12500000,
        expenses: 4200000,
        growth: 12.5,
        stock_status: 'optimal',
        staff_count: 8,
        trend_data: [
            { day: 'L', value: 400 }, { day: 'M', value: 300 }, { day: 'M', value: 500 },
            { day: 'J', value: 450 }, { day: 'V', value: 650 }, { day: 'S', value: 800 }, { day: 'D', value: 720 }
        ]
    },
    {
        id: 'b2',
        name: 'Sucursal Norte',
        responsible: 'Elena Rodriguez',
        location: 'Medellín, Poblado',
        status: 'open',
        revenue: 8400000,
        expenses: 3100000,
        growth: 8.2,
        stock_status: 'normal',
        staff_count: 5,
        trend_data: [
            { day: 'L', value: 200 }, { day: 'M', value: 250 }, { day: 'M', value: 300 },
            { day: 'J', value: 280 }, { day: 'V', value: 400 }, { day: 'S', value: 550 }, { day: 'D', value: 480 }
        ]
    },
    {
        id: 'b3',
        name: 'Showroom Sur',
        responsible: 'Carlos Ruiz',
        location: 'Cali, Unicentro',
        status: 'maintenance',
        revenue: 4200000,
        expenses: 1800000,
        growth: -2.4,
        stock_status: 'critical',
        staff_count: 3,
        trend_data: [
            { day: 'L', value: 150 }, { day: 'M', value: 120 }, { day: 'M', value: 180 },
            { day: 'J', value: 160 }, { day: 'V', value: 220 }, { day: 'S', value: 300 }, { day: 'D', value: 250 }
        ]
    }
];

export default function SucursalesPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'monitor' | 'transferencias' | 'inventario' | 'bayt'>('monitor');
    const [branches, setBranches] = useState<Branch[]>(MOCK_BRANCHES);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
            {[
                { label: 'Sucursales Activas', value: '03', sub: 'Puntos de venta', icon: <Store size={20}/>, trend: 'OK', color: 'text-[#004d4d]' },
                { label: 'Venta Total Red', value: '$ 25.1M', sub: 'Consolidado mensual', icon: <DollarSign size={20}/>, trend: '+12.5%', color: 'text-emerald-600' },
                { label: 'Sucursal Estrella', value: 'Principal', sub: 'Mayor facturación', icon: <Zap size={20}/>, trend: 'Top 1', color: 'text-[#00f2ff]' },
                { label: 'Eficiencia Operativa', value: '74.2%', sub: 'Margen promedio', icon: <Activity size={20}/>, trend: '+2.1%', color: 'text-amber-500' },
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
                    placeholder="Buscar por nombre de sucursal o ciudad..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-transparent text-sm font-bold text-slate-700 outline-none" 
                />
            </div>
            <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex items-center gap-3">
                <button className="h-12 flex items-center gap-2 px-5 rounded-2xl bg-white text-slate-500 border border-gray-100 hover:bg-gray-50 transition-all">
                    <Filter size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Ubicación</span>
                </button>
                <button className="h-12 flex items-center gap-2 px-5 bg-gray-900 text-white rounded-2xl shadow-lg hover:bg-black transition-all">
                    <Download size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Auditoría Red</span>
                </button>
            </div>
        </div>
    );

    const renderBranchMonitor = () => (
        <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {branches.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())).map((branch) => (
                <motion.div 
                    key={branch.id} 
                    onClick={() => setSelectedBranch(branch)}
                    whileHover={{ y: -10 }} 
                    className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-8 relative overflow-hidden cursor-pointer group"
                >
                    {/* Status Badge */}
                    <div className="flex justify-between items-start">
                        <div className="h-14 w-14 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-2xl">
                            <Store size={28} />
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            branch.status === 'open' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            branch.status === 'maintenance' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                            {branch.status === 'open' ? 'Operando' : branch.status === 'maintenance' ? 'Mantenimiento' : 'Cerrada'}
                        </span>
                    </div>

                    {/* Basic Info */}
                    <div>
                        <h4 className="text-2xl font-black text-gray-900 tracking-tight">{branch.name}</h4>
                        <div className="flex items-center gap-2 text-gray-400 mt-1">
                            <MapPin size={12} className="text-[#00f2ff]"/>
                            <p className="text-[10px] font-bold uppercase tracking-widest">{branch.location}</p>
                        </div>
                    </div>

                    {/* Mini Charts & Stats */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Facturación</p>
                                <p className="text-sm font-black text-gray-900 mt-1">{formatCurrency(branch.revenue)}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Crecimiento</p>
                                <div className="flex items-center gap-1 mt-1">
                                    {branch.growth >= 0 ? <ArrowUpRight size={12} className="text-emerald-500"/> : <ArrowDownRight size={12} className="text-rose-500"/>}
                                    <p className={`text-sm font-black ${branch.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{branch.growth}%</p>
                                </div>
                            </div>
                        </div>

                        {/* Trend Area */}
                        <div className="h-20 w-full opacity-40 group-hover:opacity-100 transition-opacity">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={branch.trend_data}>
                                    <Area type="monotone" dataKey="value" stroke={branch.growth >= 0 ? "#10b981" : "#f43f5e"} fill={branch.growth >= 0 ? "#10b981" : "#f43f5e"} fillOpacity={0.1} strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Stock Status Bar */}
                    <div className="pt-6 border-t border-gray-50 space-y-2">
                        <div className="flex justify-between items-end">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Estado de Inventario</p>
                            <span className={`text-[9px] font-black uppercase ${
                                branch.stock_status === 'optimal' ? 'text-emerald-600' :
                                branch.stock_status === 'normal' ? 'text-blue-600' : 'text-rose-600'
                            }`}>{branch.stock_status}</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: branch.stock_status === 'optimal' ? '90%' : branch.stock_status === 'normal' ? '65%' : '25%' }} 
                                className={`h-full rounded-full ${
                                    branch.stock_status === 'optimal' ? 'bg-emerald-500' :
                                    branch.stock_status === 'normal' ? 'bg-blue-500' : 'bg-rose-500'
                                }`}
                            ></motion.div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    const renderBaytInsight = () => (
        <div className="px-4">
            <div className="bg-[#004d4d] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Globe size={300} /></div>
                <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
                    <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center animate-pulse"><Bot size={64} className="text-[#00f2ff]" /></div>
                    <div className="flex-1 space-y-6">
                        <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#00f2ff]/20">Bayt Network-Insight</span>
                        <h3 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2ff]">Optimización de Red de Ventas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                <div className="flex items-center gap-3"><Truck className="text-[#00f2ff]" size={20}/><p className="text-[10px] font-black uppercase tracking-widest text-[#00f2ff]">Logística Inteligente</p></div>
                                <p className="text-sm font-medium italic leading-relaxed">"La **Sucursal Norte** tiene exceso de stock en calzado, mientras la **Tienda Principal** está en crítico. Sugiero transferencia inmediata de 45 pares para capturar la demanda del fin de semana."</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                <div className="flex items-center gap-3"><TrendingUp className="text-emerald-400" size={20}/><p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Oportunidad de Expansión</p></div>
                                <p className="text-sm font-medium italic leading-relaxed">"El 22% de tus pedidos web en Cali son recogidos en punto físico. El **Showroom Sur** tiene potencial para convertirse en centro de distribución 'Dark Store' para reducir costos de envío."</p>
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
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Red de Operaciones</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">Sucursales</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">
                        Control multi-sede, expansión de imperio y rendimiento logístico de <span className="font-bold text-[#001A1A]">tu red</span>.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsCreateModalOpen(true)} className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group">
                        <Rocket size={18} className="text-[#00f2ff] group-hover:rotate-12 transition-transform" />
                        Registrar Sucursal
                    </button>
                </div>
            </div>

            {/* --- KPIs ESTRATÉGICOS --- */}
            {renderKPIs()}

            {/* --- MENÚ FLOTANTE CENTRAL --- */}
            <div className="flex items-center justify-center gap-6 shrink-0 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 backdrop-blur-xl flex items-center relative">
                    {[
                        { id: 'monitor', label: 'Monitor de Red', icon: <Monitor size={14}/> },
                        { id: 'transferencias', label: 'Transferencias', icon: <ArrowLeftRight size={14}/> },
                        { id: 'inventario', label: 'Inventario por Sede', icon: <Package size={14}/> },
                        { id: 'bayt', label: 'Bayt Insight', icon: <Sparkles size={14}/> }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`relative px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 flex items-center gap-2 ${activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}
                        >
                            {activeTab === tab.id && (
                                <motion.div layoutId="activeBranchTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
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
                    {activeTab === 'monitor' && (
                        <div className="space-y-8">
                            {renderActionBar()}
                            {renderBranchMonitor()}
                        </div>
                    )}
                    {activeTab === 'transferencias' && (
                        <div className="px-4 py-20 text-center text-gray-300 font-bold uppercase tracking-widest border-4 border-dashed border-gray-100 rounded-[4rem]">Historial de Transferencias entre sedes en desarrollo</div>
                    )}
                    {activeTab === 'inventario' && (
                        <div className="px-4 py-20 text-center text-gray-300 font-bold uppercase tracking-widest border-4 border-dashed border-gray-100 rounded-[4rem]">Monitor de Stock segmentado por sede en desarrollo</div>
                    )}
                    {activeTab === 'bayt' && renderBaytInsight()}
                </motion.div>
            </AnimatePresence>

            {/* --- MODAL 360° DETALLE DE SUCURSAL --- */}
            <AnimatePresence>
                {selectedBranch && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedBranch(null)} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-6xl h-[90vh] rounded-[4rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-white/20">
                            
                            {/* SIDEBAR SUCURSAL */}
                            <div className="w-full md:w-[400px] bg-gray-50 border-r border-gray-100 p-12 overflow-y-auto custom-scrollbar space-y-12">
                                <button onClick={() => setSelectedBranch(null)} className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 shadow-sm transition-all"><X size={24}/></button>
                                
                                <section className="space-y-6">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-200 pb-3">Información de Sede</h4>
                                    <div className="flex items-center gap-6">
                                        <div className="h-20 w-20 rounded-[1.5rem] bg-gray-900 text-white flex items-center justify-center text-3xl font-black shadow-2xl">
                                            <Store size={32} />
                                        </div>
                                        <div><h3 className="text-xl font-black text-gray-900 tracking-tight">{selectedBranch.name}</h3><p className="text-sm font-bold text-[#004d4d] mt-1 italic">{selectedBranch.responsible}</p></div>
                                    </div>
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center gap-4 text-sm font-bold text-gray-600"><MapPin size={18} className="text-[#00f2ff]"/> {selectedBranch.location}</div>
                                        <div className="flex items-center gap-4 text-sm font-bold text-gray-600"><Users size={18} className="text-[#00f2ff]"/> {selectedBranch.staff_count} Colaboradores</div>
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-200 pb-3">Resumen de Operación</h4>
                                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between"><span className="text-[9px] font-black text-gray-400 uppercase">Facturación:</span><span className="text-xs font-black text-emerald-600">{formatCurrency(selectedBranch.revenue)}</span></div>
                                        <div className="flex items-center justify-between"><span className="text-[9px] font-black text-gray-400 uppercase">Gastos:</span><span className="text-xs font-black text-rose-600">{formatCurrency(selectedBranch.expenses)}</span></div>
                                        <div className="pt-2 border-t border-gray-50 flex items-center justify-between"><span className="text-[10px] font-black text-gray-900 uppercase">Utilidad:</span><span className="text-sm font-black text-[#004d4d]">{formatCurrency(selectedBranch.revenue - selectedBranch.expenses)}</span></div>
                                    </div>
                                </section>

                                <button className="w-full py-5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#004d4d] transition-all shadow-2xl flex items-center justify-center gap-3">
                                    <Download size={16} className="text-[#00f2ff]" /> Descargar Auditoría
                                </button>
                            </div>

                            {/* MAIN CONTENT: TRENDS & ANALYTICS */}
                            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                                <div className="p-12 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
                                    <div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Rendimiento Detallado</h2>
                                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest mt-2 flex items-center gap-2"><Activity size={14} className="text-[#00f2ff]"/> Análisis de facturación semanal</p>
                                    </div>
                                    <button className="h-12 px-6 bg-gray-50 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#004d4d] border border-gray-100">Configurar Metas</button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-gray-50/20">
                                    {/* Gráfica de Tendencia */}
                                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={selectedBranch.trend_data}>
                                                <defs>
                                                    <linearGradient id="colorBranch" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#004d4d" stopOpacity={0.1}/>
                                                        <stop offset="95%" stopColor="#004d4d" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                                <Area type="monotone" dataKey="value" stroke="#004d4d" strokeWidth={4} fillOpacity={1} fill="url(#colorBranch)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Alertas Específicas */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-[#001a1a] p-8 rounded-[2.5rem] text-white space-y-4">
                                            <div className="flex items-center gap-3"><AlertCircle className="text-amber-400" size={20}/><p className="text-[10px] font-black uppercase tracking-widest">Alerta de Margen</p></div>
                                            <p className="text-sm font-medium italic opacity-80 leading-relaxed">"Los gastos operativos de esta sede subieron un 15% este mes. Revisa el consumo de servicios públicos y logística local."</p>
                                        </div>
                                        <div className="bg-[#004d4d] p-8 rounded-[2.5rem] text-white space-y-4">
                                            <div className="flex items-center gap-3"><TrendingUp className="text-emerald-400" size={20}/><p className="text-[10px] font-black uppercase tracking-widest">Potencial de Venta</p></div>
                                            <p className="text-sm font-medium italic opacity-80 leading-relaxed">"Sábado es el día de mayor tráfico en esta ubicación. Refuerza el staff con 1 persona adicional para maximizar cierres."</p>
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