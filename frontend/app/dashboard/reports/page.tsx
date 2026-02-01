"use client";

import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Clock, 
  Download, 
  Filter, 
  Store, 
  Users, 
  Calendar,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  PieChart,
  BarChart3,
  Activity,
  Zap,
  Target,
  Bot,
  Sparkles,
  LayoutGrid,
  CreditCard,
  Briefcase,
  Layers,
  Globe,
  Monitor,
  ShoppingBag,
  Info,
  ShieldAlert,
  Trophy,
  ArrowRight,
  RefreshCcw
} from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
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
    LineChart,
    Line,
    Legend
} from 'recharts';

// --- CONFIGURACIÓN DE COLORES ---
const COLORS = {
    primary: "#004d4d",
    accent: "#00f2ff",
    success: "#10b981",
    danger: "#f43f5e",
    warning: "#f59e0b",
    white: "#ffffff",
    gray: "#f3f4f6"
};

// --- MOCK DATA PARA INTELIGENCIA ---
const REVENUE_BY_CHANNEL = [
    { name: 'Web Store', value: 4500000, color: '#004d4d' },
    { name: 'WhatsApp', value: 3200000, color: '#25D366' },
    { name: 'Instagram', value: 1800000, color: '#E4405F' },
    { name: 'POS Físico', value: 2500000, color: '#001a1a' },
];

const SALES_TREND = [
    { name: 'Lun', actual: 4000, anterior: 3200 },
    { name: 'Mar', actual: 3000, anterior: 3800 },
    { name: 'Mie', actual: 5000, anterior: 4100 },
    { name: 'Jue', actual: 4500, anterior: 4200 },
    { name: 'Vie', actual: 6500, anterior: 5800 },
    { name: 'Sab', actual: 8000, anterior: 7200 },
    { name: 'Dom', actual: 7200, anterior: 6500 },
];

const BRANCH_COMPARISON = [
    { name: 'Tienda Principal', ventas: 12500000, gastos: 4200000, profit: 8300000 },
    { name: 'Sucursal Norte', ventas: 8400000, gastos: 3100000, profit: 5300000 },
    { name: 'Showroom Sur', ventas: 4200000, gastos: 1800000, profit: 2400000 },
];

const ADVISOR_RANKING = [
    { name: 'Elena Rodriguez', ventas: 4500000, conversion: '12.4%', growth: '+15%', status: 'high' },
    { name: 'Carlos Ruiz', ventas: 3800000, conversion: '9.8%', growth: '+8%', status: 'normal' },
    { name: 'Roberto Gómez', ventas: 2100000, conversion: '6.2%', growth: '-2%', status: 'low' },
];

export default function AnalysisGeneralPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'general' | 'sucursales' | 'asesores' | 'bayt'>('general');
    const [selectedPeriod, setSelectedPeriod] = useState('Febrero 2026');
    const [searchTerm, setSearchTerm] = useState("");

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 px-4 shrink-0">
            {[
                { label: 'Ventas Brutas', value: '$ 25.1M', sub: 'Total ingresos', icon: <DollarSign size={18}/>, color: 'text-[#004d4d]', trend: '+12.5%' },
                { label: 'Utilidad Neta', value: '$ 16.2M', sub: 'Margen real', icon: <TrendingUp size={18}/>, color: 'text-emerald-600', trend: '+8.2%' },
                { label: 'Gastos Operativos', value: '$ 8.9M', sub: 'Fijos y variables', icon: <CreditCard size={18}/>, color: 'text-rose-600', trend: '+2.1%' },
                { label: 'Ticket Promedio', value: '$ 145k', sub: 'Valor por venta', icon: <ShoppingBag size={18}/>, color: 'text-amber-600', trend: '+5.4%' },
                { label: 'Conversion', value: '8.4%', sub: 'Efectividad web', icon: <Activity size={18}/>, color: 'text-[#00f2ff]', trend: '+1.2%' },
                { label: 'Staff ROI', value: '4.2x', sub: 'Retorno personal', icon: <Briefcase size={18}/>, color: 'text-blue-600', trend: 'OK' },
            ].map((kpi, i) => (
                <motion.div key={i} whileHover={{ y: -5 }} className="bg-white/60 backdrop-blur-md p-6 rounded-[2.2rem] border border-white/80 shadow-sm flex flex-col justify-between group cursor-pointer">
                    <div className="flex justify-between items-start">
                        <div className={`h-10 w-10 rounded-xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                            {kpi.icon}
                        </div>
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${kpi.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{kpi.trend}</span>
                    </div>
                    <div className="mt-4">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                        <h3 className="text-xl font-black text-gray-900 mt-1">{kpi.value}</h3>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    const [activeHistoryTab, setActiveHistoryTab] = useState<'maestro' | 'riesgos' | 'hitos'>('maestro');

    const historyData = useMemo(() => {
        const all = [
            { time: '10:45 AM', event: 'Venta POS - Tienda Principal', amount: 145000, type: 'in', category: 'Ingreso', icon: <ShoppingBag size={16}/>, tab: 'maestro' },
            { time: '09:12 AM', event: 'Gasto: Insumos de Cafetería', amount: 45000, type: 'out', category: 'Operativo', icon: <CreditCard size={16}/>, tab: 'maestro' },
            { time: '08:30 AM', event: 'Venta Web: Orden #FAC-8245', amount: 850000, type: 'in', category: 'Ingreso', icon: <Monitor size={16}/>, tab: 'maestro' },
            { time: '07:45 AM', event: 'Alerta: Margen de Utilidad Bajo en SKU-04', amount: 12000, type: 'out', category: 'Margen', icon: <ShieldAlert size={16}/>, tab: 'riesgos' },
            { time: 'Ayer', event: 'Devolución: Orden #FAC-8120', amount: 320000, type: 'out', category: 'Retorno', icon: <RefreshCcw size={16}/>, tab: 'riesgos' },
            { time: 'Hoy 08:00 AM', event: 'Hito: Récord de Ventas en 1 Hora', amount: 0, type: 'hms', category: 'Crecimiento', icon: <Zap size={16}/>, tab: 'hitos' },
            { time: 'Ayer', event: 'Hito: Meta de Ventas Semanal Superada', amount: 0, type: 'hms', category: 'Crecimiento', icon: <Trophy size={16}/>, tab: 'hitos' },
        ];

        if (activeHistoryTab === 'maestro') return all.filter(i => i.tab === 'maestro');
        return all.filter(i => i.tab === activeHistoryTab);
    }, [activeHistoryTab]);

    const renderGeneralCharts = () => (
        <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
                {/* Tendencia de Ventas (Comparativa) */}
                <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-8 h-[450px] flex flex-col">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="text-xl font-black uppercase italic tracking-widest text-[#004d4d]">Tendencia Semanal</h4>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Comparativa vs Período Anterior</p>
                        </div>
                        <BarChart3 className="text-gray-200" size={24} />
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={SALES_TREND}>
                                <defs>
                                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#004d4d" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#004d4d" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="actual" stroke="#004d4d" strokeWidth={4} fillOpacity={1} fill="url(#colorActual)" />
                                <Area type="monotone" dataKey="anterior" stroke="#d1d5db" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Ventas por Canal */}
                <div className="bg-[#004d4d] p-10 rounded-[3.5rem] shadow-2xl space-y-8 h-[450px] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5 text-white"><Globe size={200} /></div>
                    <div className="flex justify-between items-center relative z-10">
                        <h4 className="text-xl font-black uppercase italic tracking-widest text-white">Ingresos por Canal</h4>
                        <span className="text-[10px] font-black uppercase text-[#00f2ff] bg-white/10 px-4 py-1.5 rounded-full border border-white/10">Omnicanal</span>
                    </div>
                    <div className="flex-1 min-h-0 relative z-10 flex flex-col justify-center">
                        <div className="space-y-6">
                            {REVENUE_BY_CHANNEL.map((channel, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-black text-white/80 uppercase tracking-widest">{channel.name}</span>
                                        <span className="text-sm font-black text-white">{formatCurrency(channel.value)}</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${(channel.value / 4500000) * 100}%` }} 
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: channel.color }}
                                        ></motion.div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN HISTÓRICO DE FLUJO --- */}
            <div className="px-4 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/40 p-6 rounded-[3rem] border border-white/60">
                    <div>
                        <h4 className="text-xl font-black text-[#004d4d] uppercase italic">Monitor de Flujo Live</h4>
                        <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.3em] mt-1 italic">Registro cronológico de movimientos financieros</p>
                    </div>
                    <div className="p-1 bg-white border border-gray-100 rounded-2xl flex items-center shadow-sm">
                        {[
                            { id: 'maestro', label: 'Libro Maestro', icon: <Layers size={12}/> },
                            { id: 'riesgos', label: 'Alertas de Margen', icon: <ShieldAlert size={12}/> },
                            { id: 'hitos', label: 'Hitos de Crecimiento', icon: <Trophy size={12}/> }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveHistoryTab(tab.id as any)}
                                className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeHistoryTab === tab.id ? 'bg-[#004d4d] text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-xl overflow-hidden">
                    <div className="p-10 space-y-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeHistoryTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                {historyData.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-6 rounded-[2.2rem] bg-gray-50/50 border border-transparent hover:bg-white hover:border-gray-100 hover:shadow-lg transition-all group">
                                        <div className="flex items-center gap-6">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner ${
                                                item.type === 'in' ? 'bg-emerald-50 text-emerald-600' : 
                                                item.type === 'out' ? 'bg-rose-50 text-rose-600' : 
                                                'bg-[#00f2ff]/10 text-[#004d4d]'
                                            }`}>
                                                {item.icon}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900">{item.event}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[9px] font-black uppercase text-gray-400">{item.time}</span>
                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                                        item.type === 'in' ? 'bg-emerald-100 text-emerald-700' : 
                                                        item.type === 'out' ? 'bg-rose-100 text-rose-700' : 
                                                        'bg-[#00f2ff] text-[#004d4d]'
                                                    }`}>{item.category}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {item.amount > 0 && (
                                                <p className={`text-lg font-black ${item.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {item.type === 'in' ? '+' : '-'}{formatCurrency(item.amount)}
                                                </p>
                                            )}
                                            <button className="text-[9px] font-black uppercase text-[#004d4d] tracking-widest opacity-0 group-hover:opacity-100 transition-all mt-1">Ver Auditoría <ArrowRight size={10} className="inline ml-1"/></button>
                                        </div>
                                    </div>
                                ))}
                                {historyData.length === 0 && (
                                    <div className="py-20 text-center space-y-4">
                                        <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300"><Layers size={32}/></div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No hay registros para este filtro aún</p>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <div className="p-8 bg-gray-50/50 border-t border-gray-100 text-center">
                        <button className="text-[10px] font-black text-[#004d4d] uppercase tracking-[0.4em] hover:underline">Cargar historial completo</button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderBranchComparison = () => (
        <div className="px-4 space-y-8">
            <div className="bg-white/40 p-8 rounded-[3rem] border border-white/60 flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-black text-[#004d4d] uppercase italic">Eficiencia por Sucursal</h3>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Comparativa de rentabilidad operativa</p>
                </div>
                <div className="flex gap-4">
                    <button className="h-12 px-6 rounded-2xl bg-white border border-gray-100 text-[10px] font-black uppercase tracking-widest shadow-sm">Ver Mapa Live</button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {BRANCH_COMPARISON.map((branch, i) => (
                    <motion.div key={i} whileHover={{ y: -10 }} className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Store size={100} /></div>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-black italic">0{i+1}</div>
                            <h5 className="text-xl font-black text-gray-900 tracking-tight">{branch.name}</h5>
                        </div>
                        <div className="space-y-6">
                            <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-2">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ventas Totales</p>
                                <p className="text-2xl font-black text-gray-900">{formatCurrency(branch.ventas)}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-rose-50 rounded-[1.5rem] border border-rose-100">
                                    <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Gastos</p>
                                    <p className="text-sm font-black text-rose-600">{formatCurrency(branch.gastos)}</p>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-[1.5rem] border border-emerald-100">
                                    <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Profit</p>
                                    <p className="text-sm font-black text-emerald-600">{formatCurrency(branch.profit)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                            <span className="text-[10px] font-black text-[#004d4d] uppercase tracking-widest">Rentabilidad</span>
                            <span className="text-sm font-black text-[#004d4d] italic">{((branch.profit / branch.ventas) * 100).toFixed(1)}%</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    const renderAdvisorRanking = () => (
        <div className="px-4 space-y-8">
            <div className="bg-white/40 p-8 rounded-[3rem] border border-white/60 flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-black text-[#004d4d] uppercase italic">Productividad de Asesores</h3>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Ranking de facturación y crecimiento mensual</p>
                </div>
                <div className="flex gap-4">
                    <button className="h-12 px-6 rounded-2xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl">Configurar Metas</button>
                </div>
            </div>
            <div className="space-y-4">
                {ADVISOR_RANKING.map((advisor, i) => (
                    <motion.div key={i} whileHover={{ x: 10 }} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${advisor.status === 'high' ? 'bg-emerald-500' : advisor.status === 'normal' ? 'bg-amber-400' : 'bg-rose-500'}`}></div>
                        
                        <div className="flex items-center gap-6 flex-1">
                            <div className="h-16 w-16 rounded-[1.8rem] bg-[#004d4d] text-white flex items-center justify-center text-2xl font-black shadow-2xl">
                                {advisor.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-gray-900 tracking-tight">{advisor.name}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Asesor de Ventas</p>
                            </div>
                        </div>

                        <div className="flex-[2] grid grid-cols-3 gap-10 px-10 border-x border-gray-50">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Facturación</p>
                                <p className="text-xl font-black text-gray-900 mt-1">{formatCurrency(advisor.ventas)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tasa Cierre</p>
                                <p className="text-xl font-black text-[#004d4d] mt-1">{advisor.conversion}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Crecimiento</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {advisor.growth.startsWith('+') ? <ArrowUpRight className="text-emerald-500" size={16}/> : <ArrowDownRight className="text-rose-500" size={16}/>}
                                    <p className={`text-xl font-black ${advisor.growth.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>{advisor.growth}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="h-12 px-6 rounded-2xl bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#004d4d] transition-all">Reporte Individual</button>
                            <button className="h-12 w-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><Zap size={20} className="text-[#00f2ff]" /></button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    const renderBaytInsight = () => (
        <div className="px-4">
            <div className="bg-[#004d4d] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Activity size={300} /></div>
                <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
                    <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center animate-pulse"><Bot size={64} className="text-[#00f2ff]" /></div>
                    <div className="flex-1 space-y-6">
                        <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#00f2ff]/20">Bayt Business-IQ</span>
                        <h3 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2ff]">Estado General del Negocio</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                <div className="flex items-center gap-3"><Sparkles className="text-[#00f2ff]" size={20}/><p className="text-[10px] font-black uppercase tracking-widest text-[#00f2ff]">Oportunidad Detectada</p></div>
                                <p className="text-sm font-medium italic leading-relaxed">"Tu rentabilidad ha subido un 4.2% gracias a la reducción del costo logístico en la Sucursal Norte. Recomiendo replicar su modelo de empaque en la Principal."</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-4">
                                <div className="flex items-center gap-3"><TrendingDown className="text-rose-400" size={20}/><p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Alerta de Rendimiento</p></div>
                                <p className="text-sm font-medium italic leading-relaxed">"El canal de Instagram tiene el CAC más alto ($22.500). Sugiero pausar pauta en este canal y mover el 20% del presupuesto a WhatsApp, que es un 3x más eficiente."</p>
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
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Inteligencia de Negocio</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Análisis <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">General</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">
                        Visión 360° de la rentabilidad y rendimiento de <span className="font-bold text-[#001A1A]">tu empresa</span>.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white p-2 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="px-6 py-2">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Período de Análisis</p>
                            <p className="text-sm font-black text-gray-900">{selectedPeriod}</p>
                        </div>
                        <button className="h-12 w-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center hover:bg-black transition-all shadow-lg"><Calendar size={20} className="text-[#00f2ff]"/></button>
                    </div>
                    <button className="h-14 px-8 bg-[#004d4d] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 hover:scale-105 transition-all"><Download size={18} className="text-[#00f2ff]"/> Exportar Auditoría</button>
                </div>
            </div>

            {/* --- KPIs ESTRATÉGICOS --- */}
            {renderKPIs()}

            {/* --- MENÚ FLOTANTE CENTRAL --- */}
            <div className="flex items-center justify-center gap-6 shrink-0 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 backdrop-blur-xl flex items-center relative">
                    {[
                        { id: 'general', label: 'General', icon: <LayoutGrid size={14}/> },
                        { id: 'sucursales', label: 'Sucursales', icon: <Store size={14}/> },
                        { id: 'asesores', label: 'Asesores', icon: <Users size={14}/> },
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
                                    <motion.div layoutId="activeAnalysisTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
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
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="space-y-12">
                    {activeTab === 'general' && renderGeneralCharts()}
                    {activeTab === 'sucursales' && renderBranchComparison()}
                    {activeTab === 'asesores' && (
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row gap-4 items-center bg-white/60 backdrop-blur-md p-3 rounded-3xl border border-white/60 shadow-sm mx-4 shrink-0 relative z-30">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input type="text" placeholder="Buscar asesor por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-transparent text-sm font-bold text-slate-700 outline-none" />
                                </div>
                                <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
                                <div className="flex items-center gap-3">
                                    <button className="h-12 flex items-center gap-2 px-5 rounded-2xl bg-white text-slate-500 border border-gray-100 hover:bg-gray-50 transition-all"><Filter size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Rendimiento</span></button>
                                </div>
                            </div>
                            {renderAdvisorRanking()}
                        </div>
                    )}
                    {activeTab === 'bayt' && renderBaytInsight()}
                </motion.div>
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
            `}</style>
        </div>
    );
}