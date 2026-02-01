"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  X, 
  ArrowUpRight, 
  Mail, 
  Smartphone, 
  MessageSquare, 
  BarChart3, 
  Calendar, 
  ChevronRight, 
  Plus, 
  Rocket, 
  CheckCircle2, 
  PieChart as LucidePieChart, 
  Eye, 
  MousePointer2, 
  DollarSign, 
  Activity, 
  Users, 
  Share2, 
  Layers, 
  ChevronDown, 
  Clock, 
  Filter, 
  Sparkles, 
  Bot,
  Download, 
  ArrowRight, 
  Tag, 
  AlertCircle, 
  Info, 
  Radar,
  Globe,
  Monitor,
  LayoutGrid,
  Search,
  Check,
  ChevronLeft,
  ThumbsUp,
  ThumbsDown,
  Gift,
  Instagram,
  Star,
  RefreshCcw,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Pie,
    Pie as RePie
} from 'recharts';

// --- CONFIGURACIÓN DE COLORES ---
const COLORS = {
    primary: "#004d4d",
    accent: "#00f2ff",
    white: "#ffffff",
    gray: "#f3f4f6",
    success: "#10b981",
    danger: "#f43f5e",
    warning: "#f59e0b"
};

// --- MOCK DATA ---
const SALES_BY_CHANNEL = [
    { name: 'Web', value: 4500000, color: '#004d4d' },
    { name: 'WhatsApp', value: 2800000, color: '#25D366' },
    { name: 'Marketplace', value: 1500000, color: '#FFE600' },
    { name: 'Instagram', value: 1200000, color: '#E4405F' },
];

const CONVERSION_BY_HOUR = [
    { hour: '00:00', value: 12 }, { hour: '04:00', value: 5 }, { hour: '08:00', value: 25 },
    { hour: '12:00', value: 45 }, { hour: '16:00', value: 38 }, { hour: '20:00', value: 65 },
    { hour: '23:59', value: 30 }
];

const CAMPAIGN_FUNNEL = [
    { name: 'Vistas', value: 10000, color: '#004d4d' },
    { name: 'Clicks', value: 4500, color: '#006666' },
    { name: 'Leads', value: 1200, color: '#008080' },
    { name: 'Ventas', value: 350, color: '#00f2ff' },
];

const MOCK_CAMPAIGNS: any[] = [
    { 
        id: 'c1', name: 'Cyber Monday Bayup', status: 'active', objective: 'Conversión', 
        channels: ['whatsapp', 'instagram'], budget: 1500000, sales: 8400000, roas: 5.6, performance: 'excelente'
    },
    { 
        id: 'c2', name: 'Reactivación Inactivos', status: 'active', objective: 'Fidelización', 
        channels: ['email', 'whatsapp'], budget: 500000, sales: 1200000, roas: 2.4, performance: 'normal'
    },
    { 
        id: 'c3', name: 'Liquidación Verano', status: 'paused', objective: 'Liquidación', 
        channels: ['web', 'marketplace'], budget: 2000000, sales: 3100000, roas: 1.55, performance: 'bajo'
    },
];

export default function MarketingPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [selectedObjective, setSelectedObjective] = useState<string | null>(null);
    const [selectedAudience, setSelectedAudience] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'todos' | 'campañas' | 'canales' | 'estrategias'>('todos');
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 px-4 shrink-0">
            {[
                { label: 'Campañas Activas', value: '08', sub: 'En curso', icon: <Rocket size={18}/>, color: 'text-blue-600' },
                { label: 'Ventas Marketing', value: '$ 12.4M', sub: '+15% vs mes ant.', icon: <DollarSign size={18}/>, color: 'text-emerald-600' },
                { label: 'ROAS Promedio', value: '4.8x', sub: 'Objetivo: 5.0x', icon: <TrendingUp size={18}/>, color: 'text-[#004d4d]' },
                { label: 'CAC Promedio', value: '$ 12.500', sub: '-5% esta semana', icon: <Activity size={18}/>, color: 'text-amber-600' },
                { label: 'Mejor Campaña', value: 'Cyber Bayup', sub: 'ROAS 8.2x', icon: <ThumbsUp size={18}/>, color: 'text-[#00f2ff]' },
                { label: 'Peor Campaña', value: 'Test FB Ads', sub: 'ROAS 0.8x', icon: <ThumbsDown size={18}/>, color: 'text-rose-600' },
            ].map((kpi, i) => (
                <motion.div key={i} whileHover={{ y: -5 }} className="bg-white/60 backdrop-blur-md p-6 rounded-[2.2rem] border border-white/80 shadow-sm flex flex-col justify-between group cursor-pointer">
                    <div className="flex justify-between items-start">
                        <div className={`h-10 w-10 rounded-xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                            {kpi.icon}
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                        <h3 className="text-xl font-black text-gray-900 mt-1">{kpi.value}</h3>
                        <p className="text-[8px] font-bold text-gray-400 mt-1 italic">{kpi.sub}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    const renderCharts = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
            {/* Ventas por Canal */}
            <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-8 h-[450px] flex flex-col">
                <div className="flex justify-between items-center">
                    <h4 className="text-xl font-black uppercase italic tracking-widest text-[#004d4d]">Ventas por Canal</h4>
                    <PieChart className="text-gray-200" size={24} />
                </div>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={SALES_BY_CHANNEL} layout="vertical" margin={{ left: 20, right: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} width={80} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="value" radius={[0, 20, 20, 0]} barSize={25}>
                                {SALES_BY_CHANNEL.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Conversión por Horario */}
            <div className="bg-[#004d4d] p-10 rounded-[3.5rem] shadow-2xl space-y-8 h-[450px] flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 text-white"><Clock size={200} /></div>
                <div className="flex justify-between items-center relative z-10">
                    <h4 className="text-xl font-black uppercase italic tracking-widest text-white">Momento de Compra</h4>
                    <span className="text-[10px] font-black uppercase text-[#00f2ff] bg-white/10 px-4 py-1.5 rounded-full border border-white/10">Radar Live</span>
                </div>
                <div className="flex-1 min-h-0 relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={CONVERSION_BY_HOUR}>
                            <defs>
                                <linearGradient id="colorHour" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: 'white', opacity: 0.5, fontSize: 10 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#001a1a', border: 'none', borderRadius: '15px', color: 'white' }} />
                            <Area type="monotone" dataKey="value" stroke="#00f2ff" strokeWidth={4} fillOpacity={1} fill="url(#colorHour)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-[10px] font-medium text-white/40 italic relative z-10 text-center">Concentración de ventas detectada entre las 19:00 y 21:00 hrs.</p>
            </div>

            {/* Funnel de Marketing */}
            <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-8 h-[450px] flex flex-col">
                <div className="flex justify-between items-center">
                    <h4 className="text-xl font-black uppercase italic tracking-widest text-[#004d4d]">Embudo de Conversión</h4>
                    <Layers className="text-gray-200" size={24} />
                </div>
                <div className="flex-1 min-h-0 flex items-center justify-center">
                    <div className="w-full max-w-md space-y-4">
                        {CAMPAIGN_FUNNEL.map((step, i) => (
                            <div key={i} className="flex items-center gap-6">
                                <div 
                                    className="h-14 rounded-2xl flex items-center justify-end px-6 text-white font-black text-xs shadow-lg transition-all hover:scale-105" 
                                    style={{ width: `${100 - (i * 15)}%`, backgroundColor: step.color }}
                                >
                                    {step.value.toLocaleString()}
                                </div>
                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{step.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Conversión por Dispositivo */}
            <div className="bg-gray-50 p-10 rounded-[3.5rem] border border-gray-100 shadow-inner space-y-8 h-[450px] flex flex-col">
                <div className="flex justify-between items-center">
                    <h4 className="text-xl font-black uppercase italic tracking-widest text-gray-900">Uso de Tecnología</h4>
                    <Monitor className="text-gray-300" size={24} />
                </div>
                <div className="flex-1 flex items-center justify-around gap-10">
                    <div className="flex flex-col items-center gap-6 group">
                        <div className="h-48 w-24 bg-white rounded-3xl border-4 border-gray-200 flex flex-col justify-end p-2 shadow-xl group-hover:border-[#004d4d] transition-all">
                            <motion.div initial={{ height: 0 }} animate={{ height: '82%' }} className="w-full bg-[#004d4d] rounded-2xl shadow-[0_0_20px_rgba(0,77,77,0.3)]"></motion.div>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-gray-900 italic">82%</p>
                            <p className="text-[10px] font-black uppercase text-gray-400 mt-1">Mobile</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-6 group">
                        <div className="h-48 w-48 bg-white rounded-3xl border-4 border-gray-200 flex items-end p-2 shadow-xl group-hover:border-[#004d4d] transition-all">
                            <motion.div initial={{ height: 0 }} animate={{ height: '18%' }} className="w-full bg-gray-200 rounded-2xl"></motion.div>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-gray-900 italic">18%</p>
                            <p className="text-[10px] font-black uppercase text-gray-400 mt-1">Desktop</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCampaignList = () => (
        <div className="px-4 space-y-6">
            <div className="flex justify-between items-end">
                <h4 className="text-2xl font-black text-[#004d4d] italic uppercase tracking-tighter">Historial de Campañas</h4>
                <div className="flex gap-3">
                    <button className="h-10 px-6 rounded-xl bg-white border border-gray-100 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">Filtrar</button>
                    <button className="h-10 px-6 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl">Exportar</button>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {MOCK_CAMPAIGNS.map((c) => (
                    <motion.div 
                        key={c.id} 
                        whileHover={{ x: 5 }}
                        className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden"
                    >
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${c.performance === 'excelente' ? 'bg-[#00f2ff]' : c.performance === 'normal' ? 'bg-amber-400' : 'bg-rose-500'}`}></div>
                        <div className="flex items-center gap-6 flex-1">
                            <div className="h-16 w-16 rounded-[1.5rem] bg-gray-50 flex items-center justify-center text-[#004d4d] border border-gray-100 shadow-inner">
                                <Target size={32} />
                            </div>
                            <div>
                                <h5 className="text-xl font-black text-gray-900 tracking-tight">{c.name}</h5>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-500">{c.objective}</span>
                                    <div className="flex -space-x-1">
                                        {c.channels.map((ch: string) => (
                                            <div key={ch} className="h-5 w-5 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center p-1">
                                                {ch === 'whatsapp' ? <MessageSquare size={10} /> : ch === 'instagram' ? <Instagram size={10} /> : <Globe size={10} />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-10 flex-[1.5] border-x border-gray-50 px-10">
                            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Presupuesto</p><p className="text-sm font-bold text-gray-900 mt-1">{formatCurrency(c.budget)}</p></div>
                            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ventas</p><p className="text-sm font-black text-emerald-600 mt-1">{formatCurrency(c.sales)}</p></div>
                            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ROAS</p><p className="text-xl font-black text-[#004d4d] mt-1">{c.roas}x</p></div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <span className={`inline-block px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${c.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                    {c.status === 'active' ? 'En Curso' : 'Pausada'}
                                </span>
                            </div>
                            <button className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#004d4d] transition-all"><ArrowUpRight size={20} /></button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    const renderBaytRecommendations = () => (
        <div className="px-4">
            <div className="bg-[#004953] p-16 rounded-[4rem] text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-16 shadow-2xl border border-white/5">
                <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(0,242,255,0.08)_0%,_transparent_60%)] animate-pulse"></div>
                <div className="h-32 w-32 bg-gray-900 rounded-[3rem] flex items-center justify-center shadow-2xl relative z-10 border-2 border-[#00f2ff]/50 overflow-hidden">
                    <Bot size={64} className="text-[#00f2ff] animate-pulse" />
                </div>
                <div className="flex-1 relative z-10 space-y-6">
                    <div>
                        <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#00f2ff]/20">Asesor Estratégico AI</span>
                        <h3 className="text-4xl font-black tracking-tight italic mt-4 uppercase">Recomendaciones de Bayt</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            <div className="flex items-start gap-4 bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                                <Sparkles size={24} className="text-[#00f2ff] shrink-0" />
                                <p className="text-sm font-medium italic opacity-90 leading-relaxed">"Lanza una campaña para el **Reloj Cronógrafo Gold**. Tiene una tasa de conversión del 12% pero el tráfico ha bajado un 40%."</p>
                            </div>
                            <div className="flex items-start gap-4 bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                                <TrendingUp size={24} className="text-[#00f2ff] shrink-0" />
                                <p className="text-sm font-medium italic opacity-90 leading-relaxed">"Tu canal de WhatsApp es un 22% más rentable que Instagram en las últimas 48 horas. Mueve el 15% del presupuesto allí."</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCreateWizard = () => (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-5xl h-[85vh] rounded-[5rem] shadow-3xl overflow-hidden flex flex-col relative z-10 border border-white/20">
                {/* Wizard Header */}
                <div className="bg-[#004d4d] p-12 text-white shrink-0 relative">
                    <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-12 right-12 h-14 w-14 bg-white/10 rounded-full flex items-center justify-center hover:bg-rose-500 transition-all"><X size={28} /></button>
                    <div className="flex items-center gap-8">
                        <div className="h-20 w-20 rounded-[2rem] bg-[#00f2ff] text-[#004d4d] flex items-center justify-center text-3xl font-black shadow-2xl">
                            {wizardStep}
                        </div>
                        <div>
                            <h3 className="text-4xl font-black uppercase italic tracking-tighter">Nueva Estrategia Comercial</h3>
                            <div className="flex items-center gap-4 mt-2">
                                {[1, 2, 3, 4].map((s) => (
                                    <div key={s} className={`h-1.5 w-16 rounded-full transition-all ${wizardStep >= s ? 'bg-[#00f2ff]' : 'bg-white/20'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wizard Content */}
                <div className="flex-1 overflow-y-auto p-16 custom-scrollbar bg-[#FAFAFA]">
                    <AnimatePresence mode="wait">
                        {wizardStep === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                <div className="text-center space-y-4">
                                    <h4 className="text-3xl font-black text-gray-900 uppercase">Paso 1: ¿Cuál es tu objetivo principal?</h4>
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Bayt adaptará el flujo de trabajo según tu elección</p>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    {[
                                        { id: 'conv', label: 'Maximizar Conversión', icon: <Target size={32}/>, desc: 'Enfocado en ventas directas y ROI.' },
                                        { id: 'traf', label: 'Generar Tráfico', icon: <Activity size={32}/>, desc: 'Lleva más personas a tu tienda web.' },
                                        { id: 'fid', label: 'Fidelizar Clientes', icon: <Gift size={32}/>, desc: 'Premia a tus clientes recurrentes.' },
                                        { id: 'liq', label: 'Liquidar Stock', icon: <Package size={32}/>, desc: 'Mueve inventario de baja rotación.' },
                                    ].map((obj) => (
                                        <button 
                                            key={obj.id} 
                                            onClick={() => { setSelectedObjective(obj.id); setWizardStep(2); }}
                                            className="bg-white p-10 rounded-[3rem] border-2 border-gray-100 hover:border-[#004d4d] transition-all text-left group shadow-sm hover:shadow-xl"
                                        >
                                            <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center text-[#004d4d] mb-6 group-hover:scale-110 transition-transform">{obj.icon}</div>
                                            <h5 className="text-xl font-black text-gray-900">{obj.label}</h5>
                                            <p className="text-sm text-gray-400 mt-2 font-medium">{obj.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {wizardStep === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                <div className="text-center space-y-4">
                                    <h4 className="text-3xl font-black text-gray-900 uppercase">Paso 2: Define tu Audiencia</h4>
                                    <div className="bg-[#004d4d]/5 p-4 rounded-2xl border border-[#004d4d]/10 max-w-2xl mx-auto flex items-center gap-4">
                                        <Bot size={24} className="text-[#004d4d]" />
                                        <p className="text-xs font-bold text-[#004d4d] italic">"Basado en tu objetivo de Conversión, sugiero segmentar a **Clientes Recurrentes** y **Compradores de Accesorios**."</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {['Clientes Recurrentes', 'Mayoristas', 'Inactivos (+3 meses)', 'Top Spenders', 'Compradores Moda', 'Nuevos Prospectos'].map((aud) => (
                                        <button 
                                            key={aud} 
                                            onClick={() => setSelectedAudience(prev => prev.includes(aud) ? prev.filter(a => a !== aud) : [...prev, aud])}
                                            className={`p-6 rounded-[2rem] border-2 transition-all text-center ${selectedAudience.includes(aud) ? 'bg-[#004d4d] text-white border-[#004d4d]' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'}`}
                                        >
                                            <p className="text-xs font-black uppercase tracking-widest">{aud}</p>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-center pt-6">
                                    <button onClick={() => setWizardStep(3)} className="px-14 py-5 bg-gray-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all">Siguiente Paso</button>
                                </div>
                            </motion.div>
                        )}

                        {wizardStep === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                <div className="text-center space-y-4">
                                    <h4 className="text-3xl font-black text-gray-900 uppercase">Paso 3: Creatividad y Canal</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-8">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Canal Maestro</label>
                                            <div className="grid grid-cols-3 gap-3 mt-4">
                                                {['whatsapp', 'instagram', 'web', 'email', 'sms'].map(c => (
                                                    <button key={c} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-center hover:border-[#004d4d] transition-all"><img src={`/assets/logo ${c}.png`} className="h-6 w-auto grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" alt={c} /></button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 space-y-4">
                                            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                                                <p className="text-[10px] font-black text-[#004d4d] uppercase tracking-widest">Copy Sugerido por Bayt</p>
                                                <RefreshCcw size={14} className="text-gray-300" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-600 leading-relaxed italic">"Hola [Nombre], ¡tenemos algo especial para ti! Como eres uno de nuestros clientes Elite, hoy te damos un 20% OFF extra en la nueva colección Gold. ✨"</p>
                                        </div>
                                    </div>
                                    <div className="space-y-8">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Producto Sugerido</label>
                                        <div className="bg-[#004d4d] p-8 rounded-[3rem] text-white flex items-center gap-6 shadow-2xl relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Star size={100} fill="white" /></div>
                                            <div className="h-24 w-24 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-md relative z-10">
                                                <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="relative z-10">
                                                <h6 className="text-xl font-black tracking-tight italic">Reloj Gold Elite</h6>
                                                <p className="text-[10px] font-black uppercase text-[#00f2ff] tracking-widest mt-1">Alta rotación detectada</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-center pt-6">
                                    <button onClick={() => setWizardStep(4)} className="px-14 py-5 bg-gray-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl">Configurar Presupuesto</button>
                                </div>
                            </motion.div>
                        )}

                        {wizardStep === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                <div className="text-center space-y-4">
                                    <h4 className="text-3xl font-black text-gray-900 uppercase">Paso 4: Inversión y Timing</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-8 bg-white p-10 rounded-[3.5rem] border border-gray-100">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Presupuesto Estimado</label>
                                            <div className="flex items-center gap-4 mt-4">
                                                <span className="text-4xl font-black text-[#004d4d]">$</span>
                                                <input type="text" defaultValue="1.500.000" className="text-4xl font-black text-gray-900 bg-transparent outline-none border-b-4 border-gray-100 focus:border-[#00f2ff] transition-all w-full" />
                                            </div>
                                        </div>
                                        <div className="pt-6 border-t border-gray-50">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Distribución Recomendada</p>
                                            <div className="flex gap-2 mt-4 h-3 rounded-full overflow-hidden">
                                                <div className="flex-1 bg-[#004d4d]" title="WhatsApp 60%"></div>
                                                <div className="w-[30%] bg-[#00f2ff]" title="IG 30%"></div>
                                                <div className="w-[10%] bg-gray-200" title="Otros 10%"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-8 bg-[#001a1a] p-10 rounded-[3.5rem] text-white">
                                        <div className="flex items-center justify-between">
                                            <h6 className="text-lg font-black uppercase italic tracking-widest">Hora de Oro Bayt</h6>
                                            <Clock size={24} className="text-[#00f2ff]" />
                                        </div>
                                        <p className="text-sm font-medium italic opacity-80">"Tus clientes han mostrado una tasa de apertura un 45% mayor los **Viernes a las 19:30 PM**. He programado el inicio para ese momento."</p>
                                        <button className="w-full py-5 bg-[#00f2ff] text-gray-900 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-white transition-all">Confirmar Lanzamiento</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-1000">
            
            {/* --- HEADER MAESTRO --- */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Inteligencia Comercial</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Marketing <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">& ROI</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">
                        Decisiones basadas en datos reales para maximizar tu <span className="font-bold text-[#001A1A]">rentabilidad</span>.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => { setWizardStep(1); setIsCreateModalOpen(true); }}
                        className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group"
                    >
                        <Rocket size={18} className="text-[#00f2ff] group-hover:rotate-12 transition-transform" />
                        Lanzar Nueva Campaña
                    </button>
                </div>
            </div>

            {/* --- SECCIÓN 1: KPIs ESTRATÉGICOS --- */}
            {renderKPIs()}

            {/* --- MENÚ DE NAVEGACIÓN FLOTANTE (ESTILO BAYUP) --- */}
            <div className="flex items-center justify-center gap-6 shrink-0 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 backdrop-blur-xl flex items-center relative">
                    {[
                        { id: 'todos', label: 'Todos', icon: <LayoutGrid size={14}/> },
                        { id: 'campañas', label: 'Campañas', icon: <Target size={14}/> },
                        { id: 'canales', label: 'Canales', icon: <Globe size={14}/> },
                        { id: 'estrategias', label: 'Estrategias', icon: <Sparkles size={14}/> }
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`relative px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeMarketingTab"
                                        className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                {tab.icon}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* --- SECCIONES SEGMENTADAS CON ANIMACIÓN --- */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-12"
                >
                    {(activeTab === 'todos' || activeTab === 'canales') && renderCharts()}
                    {(activeTab === 'todos' || activeTab === 'campañas') && renderCampaignList()}
                    {(activeTab === 'todos' || activeTab === 'estrategias') && renderBaytRecommendations()}
                </motion.div>
            </AnimatePresence>

            {/* --- WIZARD DE CREACIÓN --- */}
            <AnimatePresence>
                {isCreateModalOpen && renderCreateWizard()}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 30px; }
                @keyframes pulse-cyan { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .animate-pulse-cyan { animation: pulse-cyan 2s infinite; }
            `}</style>
        </div>
    );
}
