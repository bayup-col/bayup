"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Activity, 
  AlertCircle, 
  ArrowRight, 
  ArrowUpRight, 
  Award, 
  BarChart3, 
  Bot, 
  Calendar, 
  Camera, 
  Check, 
  CheckCircle2, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Download, 
  DollarSign, 
  Eye, 
  FileText, 
  Filter, 
  Gift, 
  Globe, 
  Heart, 
  Image,
  Info, 
  Instagram, 
  LayoutGrid, 
  Layers, 
  Lightbulb, 
  Loader2, 
  Mail, 
  MapPin, 
  MessageCircle, 
  MessageSquare, 
  Monitor, 
  MousePointer2, 
  Package, 
  Pencil, 
  PieChart as LucidePieChart, 
  Plus, 
  Radar, 
  RefreshCcw, 
  Rocket, 
  Search, 
  Send, 
  Share2, 
  Smartphone, 
  ShoppingCart, 
  Sparkles, 
  Star, 
  Tag, 
  Target, 
  ThumbsDown, 
  ThumbsUp, 
  TrendingUp, 
  User, 
  Users, 
  X, 
  Zap 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    PieChart,
    Pie
} from 'recharts';
import TiltCard from '@/components/dashboard/TiltCard';
import MarketingInfoModal from '@/components/dashboard/MarketingInfoModal';
import MarketingMetricModal from '@/components/dashboard/MarketingMetricModal';
import { generateMarketingPDF } from '@/lib/marketing-report';

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
        channels: ['whatsapp', 'instagram'], budget: 1500000, sales: 8400000, roas: 5.6, performance: 'excelente',
        createdAt: new Date().toISOString()
    },
    { 
        id: 'c2', name: 'Reactivación Inactivos', status: 'active', objective: 'Fidelización', 
        channels: ['email', 'whatsapp'], budget: 500000, sales: 1200000, roas: 2.4, performance: 'normal',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    { 
        id: 'c3', name: 'Liquidación Verano', status: 'paused', objective: 'Liquidación', 
        channels: ['web', 'marketplace'], budget: 2000000, sales: 3100000, roas: 1.55, performance: 'bajo',
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
];

export default function MarketingPage() {
    const { showToast } = useToast();
    const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [campaignName, setCampaignName] = useState("");
    
    // ... otros estados ...

    const handleCreateCampaign = () => {
        const newCampaign = {
            id: `c${Date.now()}`,
            name: campaignName,
            status: 'active',
            objective: selectedObjective === 'conv' ? 'Conversión' : 
                       selectedObjective === 'traf' ? 'Tráfico' : 
                       selectedObjective === 'inter' ? 'Interacción' : 
                       selectedObjective === 'fid' ? 'Fidelización' : 'Estrategia',
            channels: [selectedChannel === 'wa' ? 'whatsapp' : 'instagram'],
            budget: 1500000, // En un flujo real esto vendría del input de presupuesto
            sales: 0,
            roas: 0,
            performance: 'normal'
        };

        setCampaigns([newCampaign, ...campaigns]);
        showToast("¡Campaña lanzada con éxito! 🚀", "success");
        setIsCreateModalOpen(false);
        
        // Resetear Wizard
        setWizardStep(1);
        setCampaignName("");
        setSelectedObjective(null);
    };
    const [selectedObjective, setSelectedObjective] = useState<string | null>(null);
    const [selectedAudience, setSelectedAudience] = useState<string[]>([]);
    const [selectedGender, setSelectedGender] = useState<'all' | 'male' | 'female'>('all');
    const [selectedCity, setSelectedCity] = useState<string>('all');
    const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<'wa' | 'ig'>('wa');
    const [selectedFormat, setSelectedFormat] = useState<'text' | 'image'>('image');
    const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
    const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
    const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
    const [scheduleTime, setScheduleTime] = useState("19:30");
    const [selectedProduct, setSelectedProduct] = useState<number | null>(0);
    const [uploadedMedia, setUploadedMedia] = useState<string | null>(null);
    const [isMediaVideo, setIsMediaVideo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [campaignCopy, setCampaignCopy] = useState("¡Hola! 👋 Tenemos stock limitado de la nueva colección Urban. Por ser cliente VIP, te reservamos un cupón del 20% OFF solo por hoy.");
    
    // ... (mantener AI_COPY_SUGGESTIONS y handleRegenerateCopy igual)

    const handleFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const isVideo = file.type.startsWith('video/');
            setIsMediaVideo(isVideo);
            
            const reader = new FileReader();
            reader.onload = (event) => {
                setUploadedMedia(event.target?.result as string);
                setSelectedProduct(null);
                showToast(isVideo ? "Video cargado con éxito 🎬" : "Imagen cargada con éxito ✨", "success");
            };
            reader.readAsDataURL(file);
        }
    };
    const [activeTab, setActiveTab] = useState<'todos' | 'campañas' | 'canales' | 'estrategias' | 'estadisticas'>('todos');
    
    // UI States para Auditoría
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [selectedKPI, setSelectedKPI] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCampaignDetail, setSelectedCampaignDetail] = useState<any | null>(null);
    const [filterObjective, setFilterObjective] = useState('all');
    const [filterDateRange, setFilterDateRange] = useState('all');
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isDateHovered, setIsDateHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    const handleExport = () => {
        showToast("Generando reporte estratégico Platinum...", "info");
        
        // Calcular estadísticas globales reales basadas en las campañas actuales
        const totalSales = campaigns.reduce((acc, c) => acc + c.sales, 0);
        const totalBudget = campaigns.reduce((acc, c) => acc + c.budget, 0);
        const activeCount = campaigns.filter(c => c.status === 'active').length;
        const avgRoas = campaigns.length > 0 
            ? Number((campaigns.reduce((acc, c) => acc + c.roas, 0) / campaigns.length).toFixed(1))
            : 0;

        setTimeout(() => {
            try {
                generateMarketingPDF({
                    campaigns: campaigns,
                    globalStats: {
                        totalSales: totalSales,
                        totalBudget: totalBudget,
                        avgRoas: avgRoas,
                        activeCampaigns: activeCount
                    }
                });
                showToast("Reporte exportado con éxito 📄", "success");
            } catch (error) {
                console.error("Error generating PDF:", error);
                showToast("Error al generar el reporte", "danger");
            }
        }, 1500);
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
                <TiltCard key={i} onClick={() => setSelectedKPI(kpi)} className="h-full">
                    <div className="bg-white/95 p-6 rounded-[2.2rem] border border-white shadow-xl flex flex-col justify-between h-full group transition-all">
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
                    </div>
                </TiltCard>
            ))}
        </div>
    );

    const renderActionBar = () => (
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white/60 backdrop-blur-md p-2 rounded-[2rem] border border-white/60 shadow-sm mx-4 shrink-0 relative z-30">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar campaña por nombre..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-3.5 bg-transparent text-sm font-bold text-slate-700 outline-none" 
                />
            </div>
            
            <div className="flex items-center gap-2 pr-2">
                <div className="relative">
                    <motion.button 
                        layout
                        onMouseEnter={() => setIsFilterHovered(true)}
                        onMouseLeave={() => setIsFilterHovered(false)}
                        onClick={() => { setIsFilterMenuOpen(!isFilterMenuOpen); setIsDateMenuOpen(false); }}
                        className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isFilterMenuOpen ? 'bg-[#004d4d] text-white shadow-lg' : 'bg-white text-slate-500 border border-gray-100 hover:text-[#004d4d] shadow-sm'} group`}
                    >
                        <motion.div layout><Filter size={18}/></motion.div>
                        <AnimatePresence mode="popLayout">
                            {(isFilterHovered || isFilterMenuOpen) && (
                                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">
                                    {filterObjective === 'all' ? 'Objetivo' : filterObjective}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>

                    <AnimatePresence>
                        {isFilterMenuOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50"
                            >
                                {['all', 'Conversión', 'Fidelización', 'Liquidación'].map((obj) => (
                                    <button
                                        key={obj}
                                        onClick={() => { setFilterObjective(obj); setIsFilterMenuOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterObjective === obj ? 'bg-[#004d4d] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {obj === 'all' ? 'Todos' : obj}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Filtro de Fecha */}
                <div className="relative">
                    <motion.button 
                        layout
                        onMouseEnter={() => setIsDateHovered(true)}
                        onMouseLeave={() => setIsDateHovered(false)}
                        onClick={() => { setIsDateMenuOpen(!isDateMenuOpen); setIsFilterMenuOpen(false); }}
                        className={`h-12 flex items-center gap-2 px-4 rounded-2xl transition-all ${isDateMenuOpen ? 'bg-[#004d4d] text-white shadow-lg' : 'bg-white text-slate-500 border border-gray-100 hover:text-[#004d4d] shadow-sm'} group`}
                    >
                        <motion.div layout><Calendar size={18}/></motion.div>
                        <AnimatePresence mode="popLayout">
                            {(isDateHovered || isDateMenuOpen) && (
                                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">
                                    {filterDateRange === 'all' ? 'Fecha' : 
                                     filterDateRange === 'today' ? 'Hoy' : 
                                     filterDateRange === 'week' ? '7 días' : 'Este Mes'}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>

                    <AnimatePresence>
                        {isDateMenuOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50"
                            >
                                {[
                                    { id: 'all', label: 'Siempre' },
                                    { id: 'today', label: 'Hoy' },
                                    { id: 'week', label: 'Últimos 7 días' },
                                    { id: 'month', label: 'Este Mes' }
                                ].map((range) => (
                                    <button
                                        key={range.id}
                                        onClick={() => { setFilterDateRange(range.id); setIsDateMenuOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterDateRange === range.id ? 'bg-[#004d4d] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <motion.button 
                    layout
                    onMouseEnter={() => setIsExportHovered(true)}
                    onMouseLeave={() => setIsExportHovered(false)}
                    onClick={handleExport}
                    className="h-12 flex items-center gap-2 px-4 bg-white border border-gray-100 rounded-2xl text-slate-500 hover:text-emerald-600 transition-all shadow-sm"
                >
                    <motion.div layout><Download size={18}/></motion.div>
                    <AnimatePresence mode="popLayout">
                        {isExportHovered && (
                            <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Exportar</motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </div>
    );

    const renderCharts = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
            <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-8 h-[450px] flex flex-col">
                <div className="flex justify-between items-center">
                    <h4 className="text-xl font-black uppercase italic tracking-widest text-[#004d4d]">Ventas por Canal</h4>
                    <LucidePieChart className="text-gray-200" size={24} />
                </div>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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

            <div className="bg-[#004d4d] p-10 rounded-[3.5rem] shadow-2xl space-y-8 h-[450px] flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 text-white"><Clock size={200} /></div>
                <div className="flex justify-between items-center relative z-10">
                    <h4 className="text-xl font-black uppercase italic tracking-widest text-white">Momento de Compra</h4>
                    <span className="text-[10px] font-black uppercase text-[#00f2ff] bg-white/10 px-4 py-1.5 rounded-full border border-white/10">Radar Live</span>
                </div>
                <div className="flex-1 min-h-0 relative z-10">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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

    const filteredCampaigns = useMemo(() => {
        return campaigns.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesObjective = filterObjective === 'all' || c.objective === filterObjective;
            
            // Lógica de filtrado por fecha
            let matchesDate = true;
            if (filterDateRange !== 'all') {
                const campaignDate = new Date(c.createdAt);
                const now = new Date();
                if (filterDateRange === 'today') {
                    matchesDate = campaignDate.toDateString() === now.toDateString();
                } else if (filterDateRange === 'week') {
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    matchesDate = campaignDate >= weekAgo;
                } else if (filterDateRange === 'month') {
                    matchesDate = campaignDate.getMonth() === now.getMonth() && campaignDate.getFullYear() === now.getFullYear();
                }
            }

            return matchesSearch && matchesObjective && matchesDate;
        });
    }, [searchTerm, filterObjective, filterDateRange, campaigns]);

    const renderCampaignList = () => (
        <div className="px-4 space-y-6">
            <div className="flex justify-between items-end pb-4 border-b border-gray-100">
                <h4 className="text-2xl font-black text-[#004d4d] italic uppercase tracking-tighter">Historial de Campañas</h4>
                <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">Control Maestro</p>
                </div>
            </div>
            {renderActionBar()}
            <div className="grid grid-cols-1 gap-4">
                {filteredCampaigns.map((c) => (
                    <motion.div 
                        key={c.id} 
                        whileHover={{ x: 5 }}
                        onClick={() => setSelectedCampaignDetail(c)}
                        className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden cursor-pointer group"
                    >
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-3 ${c.performance === 'excelente' ? 'bg-[#00f2ff]' : c.performance === 'normal' ? 'bg-amber-400' : 'bg-rose-500'}`}></div>
                        <div className="flex items-center gap-6 flex-1">
                            <div className="h-16 w-16 rounded-[1.5rem] bg-gray-50 flex items-center justify-center text-[#004d4d] border border-gray-100 shadow-inner group-hover:scale-110 transition-transform">
                                <Target size={32} />
                            </div>
                            <div>
                                <h5 className="text-xl font-black text-gray-900 tracking-tight group-hover:text-[#004d4d] transition-colors">{c.name}</h5>
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
                            <button className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#004d4d] group-hover:text-white transition-all shadow-sm active:scale-95"><ArrowUpRight size={20} /></button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    const renderCampaignDetailModal = () => {
        if (!selectedCampaignDetail) return null;
        const c = selectedCampaignDetail;

        const handleToggleStatus = () => {
            const updated = campaigns.map(camp => 
                camp.id === c.id ? { ...camp, status: camp.status === 'active' ? 'paused' : 'active' } : camp
            );
            setCampaigns(updated);
            setSelectedCampaignDetail({ ...c, status: c.status === 'active' ? 'paused' : 'active' });
            showToast(c.status === 'active' ? "Campaña pausada" : "Campaña reanudada", "info");
        };

        const handleCancelCampaign = () => {
            if (window.confirm("¿Estás seguro de cancelar definitivamente esta campaña? Esta acción no se puede deshacer.")) {
                setCampaigns(campaigns.filter(camp => camp.id !== c.id));
                setSelectedCampaignDetail(null);
                showToast("Campaña cancelada y eliminada", "success");
            }
        };

        return (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCampaignDetail(null)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl" />
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }} className="relative bg-white w-full max-w-4xl rounded-[4rem] shadow-3xl overflow-hidden flex flex-col border border-white/20">
                    <div className="p-10 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 rounded-3xl bg-white shadow-xl flex items-center justify-center text-[#004d4d]">
                                <Target size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 italic uppercase tracking-tighter">{c.name}</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">ID: {c.id} • Creada: {new Date(c.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedCampaignDetail(null)} className="h-12 w-12 rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-rose-500 transition-all shadow-sm"><X size={24}/></button>
                    </div>

                    <div className="p-12 space-y-12 overflow-y-auto max-h-[70vh] custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-[#004d4d] p-8 rounded-[3rem] text-white">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#00f2ff]">Ventas Totales</p>
                                <h4 className="text-3xl font-black mt-2">{formatCurrency(c.sales)}</h4>
                                <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#00f2ff]" style={{ width: '70%' }}></div>
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Retorno ROAS</p>
                                <h4 className="text-3xl font-black text-gray-900 mt-2">{c.roas}x</h4>
                                <p className="text-[10px] font-bold text-emerald-500 mt-2 italic">Rendimiento Óptimo</p>
                            </div>
                            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Presupuesto</p>
                                <h4 className="text-3xl font-black text-gray-900 mt-2">{formatCurrency(c.budget)}</h4>
                                <p className="text-[10px] font-bold text-gray-400 mt-2 italic">54% Ejecutado</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Activity size={14}/> Análisis Táctico de Bayt</h4>
                            <div className="bg-gray-900 p-8 rounded-[3rem] text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform"><Sparkles size={100} /></div>
                                <p className="text-sm font-medium italic opacity-90 leading-relaxed">
                                    "{c.roas > 4 
                                        ? `La campaña ${c.name} está superando el ROAS objetivo por un 22%. Mantener activa y considerar un aumento del 10% en el presupuesto diario para maximizar el cierre de ventas.` 
                                        : `El rendimiento es estable pero el CPA ha subido ligeramente. Sugiero optimizar los copies antes de aumentar la inversión.`}"
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Información Base</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between p-4 bg-gray-50 rounded-2xl"><span className="text-xs text-gray-500">Objetivo</span><span className="text-xs font-black uppercase">{c.objective}</span></div>
                                    <div className="flex justify-between p-4 bg-gray-50 rounded-2xl"><span className="text-xs text-gray-500">Canales</span><span className="text-xs font-black uppercase">{c.channels.join(', ')}</span></div>
                                    <div className="flex justify-between p-4 bg-gray-50 rounded-2xl"><span className="text-xs text-gray-500">Estado</span><span className={`text-xs font-black uppercase ${c.status === 'active' ? 'text-emerald-500' : 'text-amber-500'}`}>{c.status === 'active' ? 'En Curso' : 'Pausada'}</span></div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones de Control</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <button 
                                        onClick={handleToggleStatus}
                                        className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${c.status === 'active' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}
                                    >
                                        {c.status === 'active' ? 'Pausar Campaña' : 'Reanudar Campaña'}
                                    </button>
                                    <button 
                                        onClick={handleCancelCampaign}
                                        className="w-full py-4 bg-white border-2 border-rose-100 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all"
                                    >
                                        Cancelar Definitivamente
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 border-t border-gray-100 bg-gray-50 flex justify-end">
                        <button 
                            onClick={() => setSelectedCampaignDetail(null)}
                            className="px-12 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all"
                        >
                            Cerrar Panel
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    };

    const renderCampaignAnalytics = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
                <div className="bg-white/60 backdrop-blur-md p-12 rounded-[4rem] border border-white/80 shadow-sm space-y-10">
                    <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                        <div className="h-12 w-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center shadow-inner">
                            <Users size={24}/>
                        </div>
                        <div>
                            <h4 className="text-xl font-black italic uppercase text-gray-900">Audiencia Impactada</h4>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Perfil de redención de campañas</p>
                        </div>
                    </div>
                    <div className="space-y-8">
                        {[
                            { label: 'Mujeres (18-35)', value: '54%', color: 'bg-rose-400' },
                            { label: 'Hombres (25-45)', value: '32%', color: 'bg-blue-400' },
                            { label: 'Mujeres (45+)', value: '10%', color: 'bg-rose-200' },
                            { label: 'Otros', value: '4%', color: 'bg-gray-300' }
                        ].map((item, i) => (
                            <div key={i} className="space-y-3 group">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-gray-400 group-hover:text-gray-900 transition-colors">{item.label}</span>
                                    <span>{item.value}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden shadow-inner">
                                    <motion.div initial={{ width: 0 }} animate={{ width: item.value }} className={`h-full ${item.color} rounded-full`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[#001a1a] p-12 rounded-[4rem] text-white flex flex-col justify-between border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-10 -bottom-10 text-[12rem] font-black text-white/5 pointer-events-none italic uppercase group-hover:scale-110 transition-transform duration-1000">LIVE</div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                            <div className="h-12 w-12 bg-white/10 text-[#00f2ff] rounded-2xl flex items-center justify-center animate-pulse">
                                <Globe size={24}/>
                            </div>
                            <h4 className="text-xl font-black uppercase italic tracking-tight">Foco Geográfico</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-8 mt-10">
                            {[
                                { city: 'Bogotá D.C.', p: '45%', s: '+12%' },
                                { city: 'Medellín', p: '28%', s: '+5%' },
                                { city: 'Cali', p: '15%', s: '-2%' },
                                { city: 'Barranquilla', p: '12%', s: '+18%' }
                            ].map((city, i) => (
                                <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all">
                                    <p className="text-sm font-black text-white italic">{city.city}</p>
                                    <div className="flex justify-between items-end mt-2">
                                        <p className="text-2xl font-black text-[#00f2ff]">{city.p}</p>
                                        <p className={`text-[9px] font-bold ${city.s.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{city.s}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-xl mx-4">
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-[#004d4d] text-white rounded-2xl flex items-center justify-center shadow-lg">
                            <Activity size={24}/>
                        </div>
                        <h4 className="text-2xl font-black italic uppercase text-[#004d4d]">Efectividad Temporal</h4>
                    </div>
                    <div className="flex gap-4">
                        <span className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase"><div className="h-2 w-2 rounded-full bg-[#004d4d]"></div> Conversión %</span>
                    </div>
                </div>
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <AreaChart data={CONVERSION_BY_HOUR}>
                            <defs>
                                <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#004d4d" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#004d4d" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                            <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="value" stroke="#004d4d" strokeWidth={4} fillOpacity={1} fill="url(#colorEff)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-[10px] font-bold text-gray-400 italic text-center mt-6 uppercase tracking-[0.2em]">Pico de éxito publicitario: 20:00 PM - 22:00 PM</p>
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
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-6xl h-[90vh] rounded-[4rem] shadow-3xl overflow-hidden flex flex-col relative z-10 border border-white/20">
                <div className="bg-gray-900 p-10 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Rocket size={200} /></div>
                    <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-10 right-10 h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all z-20"><X size={24} /></button>
                    <div className="relative z-10 flex items-center gap-8">
                        <div className="h-20 w-20 rounded-[2rem] bg-[#00f2ff] text-[#001a1a] flex items-center justify-center text-3xl font-black shadow-[0_0_30px_rgba(0,242,255,0.3)]">
                            {wizardStep}
                        </div>
                        <div>
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter">Configurador de <span className="text-[#00f2ff]">Estrategia</span></h3>
                            <div className="flex items-center gap-2 mt-3">
                                {[1, 2, 3, 4].map((s) => (
                                    <div key={s} className="flex items-center gap-2">
                                        <div className={`h-1.5 rounded-full transition-all duration-500 ${wizardStep >= s ? 'w-12 bg-[#00f2ff]' : 'w-4 bg-white/10'}`} />
                                        {s < 4 && <span className="text-[8px] text-white/20 font-black">/</span>}
                                    </div>
                                ))}
                                <span className="ml-4 text-[10px] font-black uppercase text-[#00f2ff]/60 tracking-widest">
                                    {wizardStep === 1 ? 'Objetivo' : wizardStep === 2 ? 'Segmentación' : wizardStep === 3 ? 'Creativo' : 'Inversión'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-12 md:p-20 custom-scrollbar bg-[#FAFAFA]">
                    <AnimatePresence mode="wait">
                        {wizardStep === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                                <div className="max-w-2xl">
                                    <h4 className="text-4xl font-black text-gray-900 tracking-tight uppercase italic">Identidad de la Campaña</h4>
                                    <p className="text-gray-500 font-medium mt-4 leading-relaxed">
                                        Asigna un nombre a tu estrategia y selecciona el objetivo que mejor se adapte a tu necesidad comercial.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                                        <Pencil size={12}/> Nombre de tu Estrategia
                                    </label>
                                    <input 
                                        type="text" 
                                        value={campaignName}
                                        onChange={(e) => setCampaignName(e.target.value)}
                                        placeholder="Ej: Lanzamiento Colección Verano 2026"
                                        className="w-full max-w-2xl bg-white border-b-4 border-gray-100 p-6 text-2xl font-black text-gray-900 outline-none focus:border-[#00f2ff] transition-all placeholder:text-gray-200"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[
                                        { id: 'conv', label: 'Ventas Directas', icon: <ShoppingCart size={28}/>, desc: 'Ideal para conversiones en la web.', tags: ['Ventas', 'ROI Alto'], color: 'text-emerald-500' },
                                        { id: 'traf', label: 'Tráfico Web', icon: <Globe size={28}/>, desc: 'Lleva personas a tu tienda.', tags: ['Visitas', 'Clicks'], color: 'text-blue-500' },
                                        { id: 'inter', label: 'Interacción', icon: <MessageSquare size={18}/>, desc: 'Mensajes por WhatsApp y DM.', tags: ['Chats', 'Leads'], color: 'text-purple-500' },
                                        { id: 'reco', label: 'Reconocimiento', icon: <Eye size={28}/>, desc: 'Haz que tu marca se vea más.', tags: ['Alcance', 'Vistas'], color: 'text-amber-500' },
                                        { id: 'fid', label: 'Fidelización', icon: <Star size={28}/>, desc: 'Premia a tus clientes Oro/Diamante.', tags: ['LTV', 'Retención'], color: 'text-cyan-500' },
                                        { id: 'liq', label: 'Liquidar Stock', icon: <Package size={28}/>, desc: 'Mueve inventario estancado.', tags: ['Flujo Caja', 'Ofertas'], color: 'text-rose-500' },
                                    ].map((obj) => (
                                        <button 
                                            key={obj.id} 
                                            onClick={() => { setSelectedObjective(obj.id); setWizardStep(2); }}
                                            disabled={!campaignName.trim()}
                                            className={`bg-white p-8 rounded-[2.5rem] border-2 transition-all text-left group relative overflow-hidden flex flex-col justify-between h-64 ${selectedObjective === obj.id ? 'border-[#004d4d] shadow-2xl ring-4 ring-[#004d4d]/5' : 'border-gray-100 hover:border-gray-200 shadow-sm'} ${!campaignName.trim() ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        >
                                            <div className="relative z-10">
                                                <div className={`h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${obj.color}`}>
                                                    {obj.icon}
                                                </div>
                                                <h5 className="text-xl font-black text-gray-900 uppercase tracking-tight">{obj.label}</h5>
                                                <p className="text-xs text-gray-400 mt-2 font-medium leading-relaxed">{obj.desc}</p>
                                            </div>
                                            <div className="flex gap-2 relative z-10">
                                                {obj.tags.map(t => <span key={t} className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-gray-50 text-gray-400 rounded-md border border-gray-100">{t}</span>)}
                                            </div>
                                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight className="text-gray-200" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {wizardStep === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                                <div className="max-w-2xl">
                                    <h4 className="text-4xl font-black text-gray-900 tracking-tight uppercase italic">Población Objetivo</h4>
                                    <p className="text-gray-500 font-medium mt-4">Filtra exactamente a quién quieres que le llegue el mensaje.</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2"><User size={12}/> Género</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { id: 'all', label: 'Todos' },
                                                    { id: 'male', label: 'Hombres' },
                                                    { id: 'female', label: 'Mujeres' }
                                                ].map(g => (
                                                    <button 
                                                        key={g.id} type="button"
                                                        onClick={() => setSelectedGender(g.id as any)}
                                                        className={`py-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${selectedGender === g.id ? 'bg-gray-900 text-white border-gray-900 shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}
                                                    >
                                                        {g.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4 relative">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2"><MapPin size={12}/> Ubicación Geográfica</label>
                                            <button 
                                                type="button"
                                                onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                                                className={`w-full p-5 bg-white border-2 rounded-[1.5rem] flex items-center justify-between transition-all ${isCityDropdownOpen ? 'border-[#00f2ff] shadow-lg' : 'border-gray-100 hover:border-gray-200'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse" />
                                                    <span className="text-sm font-bold text-gray-700">
                                                        {selectedCity === 'all' ? 'Todas las ciudades (Nacional)' : 
                                                         selectedCity === 'bogota' ? 'Bogotá D.C. (Foco Principal)' : 
                                                         selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}
                                                    </span>
                                                </div>
                                                <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            <AnimatePresence>
                                                {isCityDropdownOpen && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[2rem] shadow-2xl border border-gray-100 py-3 z-50 overflow-hidden"
                                                    >
                                                        {[
                                                            { id: 'all', label: 'Todas las ciudades (Nacional)', desc: 'Alcance total' },
                                                            { id: 'bogota', label: 'Bogotá D.C.', desc: 'Mayor tasa conversión' },
                                                            { id: 'medellin', label: 'Medellín', desc: 'Crecimiento +15%' },
                                                            { id: 'cali', label: 'Cali', desc: 'Público Joven' },
                                                            { id: 'barranquilla', label: 'Barranquilla', desc: 'Ticket Alto' }
                                                        ].map((city) => (
                                                            <button
                                                                key={city.id}
                                                                type="button"
                                                                onClick={() => { setSelectedCity(city.id); setIsCityDropdownOpen(false); }}
                                                                className={`w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors ${selectedCity === city.id ? 'bg-[#004d4d]/5' : ''}`}
                                                            >
                                                                <div>
                                                                    <p className={`text-sm font-black ${selectedCity === city.id ? 'text-[#004d4d]' : 'text-gray-700'}`}>{city.label}</p>
                                                                    <p className="text-[10px] text-gray-400 font-medium uppercase">{city.desc}</p>
                                                                </div>
                                                                {selectedCity === city.id && <CheckCircle2 size={16} className="text-[#004d4d]" />}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Comportamiento de Compra</label>
                                            <div className="grid grid-cols-1 gap-3">
                                                {[
                                                    { id: 'rec', label: 'Clientes Recurrentes', icon: <TrendingUp size={16}/>, val: '842 pers.' },
                                                    { id: 'top', label: 'Top Spenders (VIP)', icon: <Award size={16}/>, val: '156 pers.' },
                                                    { id: 'ina', label: 'Inactivos (+3 meses)', icon: <Clock size={16}/>, val: '420 pers.' },
                                                ].map(aud => (
                                                    <button 
                                                        key={aud.id} type="button"
                                                        onClick={() => setSelectedAudience(prev => prev.includes(aud.id) ? prev.filter(a => a !== aud.id) : [...prev, aud.id])}
                                                        className={`p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${selectedAudience.includes(aud.id) ? 'bg-[#004d4d] text-white border-[#004d4d]' : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'}`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${selectedAudience.includes(aud.id) ? 'bg-white/10' : 'bg-gray-50'}`}>{aud.icon}</div>
                                                            <span className="text-[10px] font-black uppercase tracking-tight">{aud.label}</span>
                                                        </div>
                                                        <span className={`text-[9px] font-bold ${selectedAudience.includes(aud.id) ? 'text-white/60' : 'text-gray-400'}`}>{aud.val}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-[#004d4d] p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl flex flex-col justify-between">
                                        <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12"><Users size={150} fill="white" /></div>
                                        <div className="relative z-10 space-y-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 animate-pulse"><Bot size={32} className="text-[#00f2ff]" /></div>
                                                <div>
                                                    <h5 className="text-xl font-black uppercase italic tracking-tighter text-[#00f2ff]">Bayt Targeting Advisor</h5>
                                                    <p className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em]">Sugerencia basada en tus Stats</p>
                                                </div>
                                            </div>
                                            <p className="text-lg font-medium leading-relaxed italic opacity-90">
                                                &quot;Tus estadísticas muestran que el <span className="text-[#00f2ff] font-bold">68% de tus ventas</span> provienen de <span className="text-white font-bold underline underline-offset-4">Mujeres en Bogotá</span>. Si buscas un ROI inmediato, sugiero filtrar por estos criterios.&quot;
                                            </p>
                                            <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/10">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Alcance Potencial</p>
                                                    <p className="text-4xl font-black mt-2">1,240 <span className="text-xs font-medium text-white/40">Personas</span></p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Precisión Audiencia</p>
                                                    <p className="text-4xl font-black mt-2 text-emerald-400">92%</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center pt-10">
                                    <button onClick={() => setWizardStep(3)} className="px-16 py-5 bg-gray-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-3xl hover:scale-105 active:scale-95 transition-all">Siguiente: Diseño Creativo</button>
                                </div>
                            </motion.div>
                        )}

                        {wizardStep === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                                <div className="max-w-2xl">
                                    <h4 className="text-4xl font-black text-gray-900 tracking-tight uppercase italic">Canales y Creativos</h4>
                                    <p className="text-gray-500 font-medium mt-4">Define el contenido visual y el mensaje de tu campaña.</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                    <div className="lg:col-span-2 space-y-10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Canal de Difusión</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { id: 'wa', label: 'WhatsApp', icon: <MessageSquare size={18}/>, color: 'text-emerald-500' },
                                                        { id: 'ig', label: 'Instagram', icon: <Instagram size={18}/>, color: 'text-purple-500' }
                                                    ].map(c => (
                                                        <button 
                                                            key={c.id} type="button"
                                                            onClick={() => setSelectedChannel(c.id as any)}
                                                            className={`p-6 border rounded-[2rem] flex flex-col items-center gap-3 transition-all ${selectedChannel === c.id ? 'bg-gray-900 text-white border-gray-900 scale-105 shadow-xl' : 'bg-white border-gray-100 text-slate-500 hover:border-gray-300'}`}
                                                        >
                                                            <div className={selectedChannel === c.id ? 'text-[#00f2ff]' : c.color}>{c.icon}</div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{c.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Formato del Anuncio</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { id: 'text', label: 'Texto Plano', icon: <FileText size={18}/> },
                                                        { id: 'image', label: 'Imagen/Video', icon: <Camera size={18}/> }
                                                    ].map(f => (
                                                        <button 
                                                            key={f.id} type="button"
                                                            onClick={() => setSelectedFormat(f.id as any)}
                                                            className={`p-6 border rounded-[2rem] flex flex-col items-center gap-3 transition-all ${selectedFormat === f.id ? 'bg-gray-900 text-white border-gray-900 scale-105 shadow-xl' : 'bg-white border-gray-100 text-slate-500 hover:border-gray-300'}`}
                                                        >
                                                            <div className={selectedFormat === f.id ? 'text-[#00f2ff]' : 'text-gray-400'}>{f.icon}</div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{f.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Selección de Producto / Subida */}
                                        {selectedFormat === 'image' && (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between ml-4">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Image size={12}/> Contenido Visual</label>
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            type="file" 
                                                            ref={fileInputRef} 
                                                            onChange={handleFileChange} 
                                                            accept="image/*,video/*" 
                                                            className="hidden" 
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={handleFileUpload}
                                                            className="px-4 py-2 bg-gray-900 text-[#00f2ff] rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all"
                                                        >
                                                            <Plus size={14}/> Subir Multimedia
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                    {/* Opción de Subida (Preview) */}
                                                    {uploadedMedia && (
                                                        <button 
                                                            type="button"
                                                            onClick={() => { setSelectedProduct(null); }}
                                                            className={`relative aspect-square rounded-3xl overflow-hidden border-4 transition-all ${selectedProduct === null ? 'border-[#00f2ff] scale-105 shadow-xl' : 'border-transparent opacity-60'}`}
                                                        >
                                                            {isMediaVideo ? (
                                                                <video src={uploadedMedia} className="w-full h-full object-cover" muted />
                                                            ) : (
                                                                <img src={uploadedMedia} className="w-full h-full object-cover" alt="Subido" />
                                                            )}
                                                            <div className="absolute top-2 right-2 h-5 w-5 bg-[#00f2ff] rounded-full flex items-center justify-center shadow-lg"><Check size={12} className="text-[#004d4d]" /></div>
                                                            {isMediaVideo && <div className="absolute bottom-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase">Video</div>}
                                                        </button>
                                                    )}

                                                    {[
                                                        { id: 0, name: 'Reloj Gold', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200' },
                                                        { id: 1, name: 'Sneakers Pro', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200' },
                                                        { id: 2, name: 'Urban Tee', img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200' },
                                                        { id: 3, name: 'Tech Pack', img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200' }
                                                    ].map((p) => (
                                                        <button 
                                                            key={p.id} type="button"
                                                            onClick={() => setSelectedProduct(p.id)}
                                                            className={`relative aspect-square rounded-3xl overflow-hidden border-4 transition-all ${selectedProduct === p.id ? 'border-[#00f2ff] scale-105 shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                                        >
                                                            <img src={p.img} className="w-full h-full object-cover" alt={p.name} />
                                                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 backdrop-blur-sm">
                                                                <p className="text-[8px] font-black text-white uppercase text-center">{p.name}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 space-y-6 shadow-sm relative">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <Zap size={18} className="text-amber-500"/>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cuerpo del Mensaje (Editable)</span>
                                                </div>
                                                <button type="button" className="text-[9px] font-black text-[#004d4d] flex items-center gap-2 uppercase hover:underline"><RefreshCcw size={12}/> Sugerir otro</button>
                                            </div>
                                            <textarea 
                                                value={campaignCopy}
                                                onChange={(e) => setCampaignCopy(e.target.value)}
                                                className="w-full bg-gray-50 rounded-2xl p-6 text-sm font-medium text-gray-700 leading-relaxed italic outline-none border-2 border-transparent focus:border-[#00f2ff]/30 transition-all min-h-[120px] resize-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-6 flex flex-col items-center">
                                        <div className="w-full flex justify-between items-center px-4">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Eye size={12}/> Visualización</label>
                                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                                <button onClick={() => setPreviewMode('mobile')} className={`p-2 rounded-lg transition-all ${previewMode === 'mobile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><Smartphone size={16}/></button>
                                                <button onClick={() => setPreviewMode('desktop')} className={`p-2 rounded-lg transition-all ${previewMode === 'desktop' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><Monitor size={16}/></button>
                                            </div>
                                        </div>

                                        <div className={`transition-all duration-500 overflow-hidden ${previewMode === 'mobile' ? 'w-[320px] aspect-[9/16] rounded-[3.5rem] border-[8px] border-gray-800' : 'w-full max-w-[600px] aspect-[16/10] rounded-[2rem] border-[12px] border-gray-800'} bg-gray-900 shadow-2xl relative`}>
                                            <div className="absolute top-0 w-full h-6 bg-gray-800 flex justify-center items-center z-20"><div className="h-1 w-12 bg-gray-700 rounded-full"></div></div>
                                            
                                            <div className={`p-4 pt-10 flex items-center gap-3 border-b border-white/5 ${selectedChannel === 'wa' ? 'bg-[#075E54]' : 'bg-gray-900'}`}>
                                                <div className="h-8 w-8 rounded-full bg-white/20" />
                                                <div className="h-2 w-20 bg-white/20 rounded-full" />
                                            </div>

                                            <div className="p-4 space-y-4">
                                                {selectedChannel === 'wa' ? (
                                                    <div className="space-y-3">
                                                        <div className="bg-[#DCF8C6] p-3 rounded-2xl rounded-tl-none self-start max-w-[90%] shadow-sm">
                                                            {selectedFormat === 'image' && (
                                                                <div className={`${previewMode === 'mobile' ? 'h-40' : 'h-64'} w-full rounded-lg mb-3 overflow-hidden`}>
                                                                    {selectedProduct !== null ? (
                                                                        <img src={[
                                                                            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
                                                                            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
                                                                            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400',
                                                                            'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400'
                                                                        ][selectedProduct]} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        isMediaVideo ? (
                                                                            <video src={uploadedMedia || ''} className="w-full h-full object-cover" autoPlay muted loop />
                                                                        ) : (
                                                                            <img src={uploadedMedia || ''} className="w-full h-full object-cover" />
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}
                                                            <p className="text-[10px] text-gray-800 leading-tight">{campaignCopy}</p>
                                                            <p className="text-[8px] text-gray-400 text-right mt-1">10:45 AM ✓✓</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={`space-y-4 ${previewMode === 'desktop' ? 'max-w-[400px] mx-auto bg-gray-800 p-6 rounded-2xl' : ''}`}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-amber-400 to-purple-600 p-0.5"><div className="h-full w-full rounded-full bg-gray-900 border border-white/10" /></div>
                                                            <span className="text-[8px] font-bold text-white uppercase">Tu_Marca_Bayup</span>
                                                        </div>
                                                        <div className="aspect-square w-full rounded-lg overflow-hidden bg-white/5 border border-white/10">
                                                            {selectedFormat === 'image' ? (
                                                                selectedProduct !== null ? (
                                                                    <img src={[
                                                                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
                                                                        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
                                                                        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400',
                                                                        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400'
                                                                    ][selectedProduct]} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    isMediaVideo ? (
                                                                        <video src={uploadedMedia || ''} className="w-full h-full object-cover" autoPlay muted loop />
                                                                    ) : (
                                                                        <img src={uploadedMedia || ''} className="w-full h-full object-cover" />
                                                                    )
                                                                )
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center p-6 text-center"><p className="text-[10px] text-white/60 italic leading-relaxed">{campaignCopy}</p></div>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-3 px-1"><Heart size={14} className="text-white"/><MessageCircle size={14} className="text-white"/><Send size={14} className="text-white"/></div>
                                                        <p className="text-[9px] text-white/80 px-1 line-clamp-2"><span className="font-bold mr-2">tu_marca</span>{campaignCopy}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center pt-6">
                                    <button onClick={() => setWizardStep(4)} className="px-16 py-5 bg-gray-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all">Siguiente: Presupuesto</button>
                                </div>
                            </motion.div>
                        )}

                        {wizardStep === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12 pb-10">
                                <div className="max-w-2xl text-center mx-auto">
                                    <h4 className="text-4xl font-black text-gray-900 tracking-tight uppercase italic">Finalización y Lanzamiento</h4>
                                    <p className="text-gray-500 font-medium mt-4">Define cuándo quieres que inicie la campaña y confirma tu inversión.</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                                    <div className="space-y-8">
                                        <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-8">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Inversión Estimada</label>
                                                <div className="flex items-center gap-6 bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 shadow-inner">
                                                    <span className="text-5xl font-black text-[#004d4d]">$</span>
                                                    <input type="text" defaultValue="1.500.000" className="text-5xl font-black text-gray-900 bg-transparent outline-none w-full tracking-tighter" />
                                                </div>
                                            </div>
                                            <div className="flex gap-2 h-2.5 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#004d4d]" style={{ width: '70%' }}></div>
                                                <div className="h-full bg-[#00f2ff] ml-1" style={{ width: '30%' }}></div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-6">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2"><Clock size={12}/> Lanzamiento Estratégico</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button 
                                                    onClick={() => setScheduleMode('now')}
                                                    className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2 ${scheduleMode === 'now' ? 'bg-gray-900 text-white border-gray-900 shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}
                                                >
                                                    <Zap size={20} className={scheduleMode === 'now' ? 'text-[#00f2ff]' : ''}/>
                                                    <span className="text-[10px] font-black uppercase">Inmediato</span>
                                                </button>
                                                <button 
                                                    onClick={() => setScheduleMode('later')}
                                                    className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2 ${scheduleMode === 'later' ? 'bg-gray-900 text-white border-gray-900 shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}
                                                >
                                                    <Calendar size={20} className={scheduleMode === 'later' ? 'text-[#00f2ff]' : ''}/>
                                                    <span className="text-[10px] font-black uppercase">Programado</span>
                                                </button>
                                            </div>

                                            <AnimatePresence>
                                                {scheduleMode === 'later' && (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-6 overflow-hidden">
                                                        <div className="grid grid-cols-2 gap-6">
                                                            <div className="space-y-3">
                                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Día de Salida</p>
                                                                <div className="relative group">
                                                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#004d4d]"><Calendar size={18}/></div>
                                                                    <input 
                                                                        type="date" 
                                                                        value={scheduleDate}
                                                                        onChange={(e) => setScheduleDate(e.target.value)}
                                                                        className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-[#00f2ff]/30 rounded-3xl outline-none text-sm font-bold text-gray-700 transition-all shadow-inner"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Hora Exacta</p>
                                                                <div className="relative group">
                                                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#004d4d]"><Clock size={18}/></div>
                                                                    <input 
                                                                        type="time" 
                                                                        value={scheduleTime}
                                                                        onChange={(e) => setScheduleTime(e.target.value)}
                                                                        className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-[#00f2ff]/30 rounded-3xl outline-none text-sm font-bold text-gray-700 transition-all shadow-inner"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="p-6 bg-[#004d4d] rounded-3xl border border-white/10 relative overflow-hidden group">
                                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform"><Zap size={60} fill="white" /></div>
                                                            <div className="relative z-10 flex items-start gap-4">
                                                                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0"><Lightbulb size={20} className="text-[#00f2ff]" /></div>
                                                                <p className="text-[11px] font-medium text-cyan-50 leading-relaxed italic">
                                                                    &quot;He validado tu selección. Programar para el <span className="text-[#00f2ff] font-black">{scheduleDate}</span> a las <span className="text-[#00f2ff] font-black">{scheduleTime}</span> te permitirá capturar el pico de tráfico nocturno de tus clientes en Bogotá.&quot;
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {scheduleMode === 'now' && (
                                                <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center gap-6">
                                                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm"><Zap size={24} fill="currentColor"/></div>
                                                    <div>
                                                        <p className="text-sm font-black text-emerald-900 uppercase">Lanzamiento Inmediato</p>
                                                        <p className="text-xs font-medium text-emerald-600">Tu campaña se disparará a todos los canales en cuanto confirmes.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="bg-gray-900 p-12 rounded-[4rem] text-white space-y-10 shadow-2xl relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700"><TrendingUp size={120} /></div>
                                            <h5 className="text-2xl font-black uppercase italic tracking-widest text-[#00f2ff]">Predicción Final</h5>
                                            <div className="space-y-8">
                                                <div className="flex justify-between items-center border-b border-white/10 pb-6">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Ventas Proyectadas</p>
                                                        <p className="text-3xl font-black text-emerald-400 mt-1">+$8.4M</p>
                                                    </div>
                                                    <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20"><TrendingUp size={24}/></div>
                                                </div>
                                                <div className="flex justify-between items-center border-b border-white/10 pb-6">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">ROAS Esperado</p>
                                                        <p className="text-3xl font-black text-[#00f2ff] mt-1">5.6x</p>
                                                    </div>
                                                    <div className="h-12 w-12 bg-[#00f2ff]/10 rounded-2xl flex items-center justify-center text-[#00f2ff] border border-[#00f2ff]/20"><Rocket size={24}/></div>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Confianza IA</p>
                                                        <p className="text-3xl font-black text-white mt-1">94%</p>
                                                    </div>
                                                    <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10"><CheckCircle2 size={24}/></div>
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleCreateCampaign}
                                            className="w-full py-8 bg-[#00f2ff] text-gray-900 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] shadow-[0_0_50px_rgba(0,242,255,0.3)] hover:bg-white hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-4"
                                        >
                                            <Zap size={24} fill="currentColor"/> Lanzar Ahora
                                        </button>
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
        <div className={`max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-1000 relative`}>
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#004d4d]/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#00f2ff]/5 rounded-full blur-[100px]" />
            </div>

            <div className="px-4">
                <div className="bg-gray-900 p-12 md:p-16 rounded-[4rem] text-white relative overflow-hidden shadow-3xl border border-white/5 group">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
                    <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(0,242,255,0.12)_0%,_transparent_60%)] animate-pulse" />
                    
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="h-32 w-32 bg-gray-800 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center shadow-[0_0_40px_rgba(0,242,255,0.2)] shrink-0 group-hover:scale-105 transition-transform duration-700">
                                <Bot size={64} className="text-[#00f2ff] animate-pulse" />
                            </div>
                            <div className="text-center md:text-left space-y-4">
                                <div className="flex items-center justify-center md:justify-start gap-3">
                                    <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-ping" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00f2ff]/60">Marketing Intelligence System</span>
                                </div>
                                <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
                                    Marketing <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f2ff] to-emerald-400">Hub & ROI</span>
                                </h1>
                                <p className="text-gray-400 text-lg font-medium max-w-xl italic leading-relaxed">
                                    &quot;Bienvenido. He analizado tus picos de venta. Hoy es un día <span className="text-emerald-400 font-bold">óptimo</span> para lanzar una campaña de fidelización.&quot;
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-center gap-4">
                            <button 
                                onClick={() => { setWizardStep(1); setIsCreateModalOpen(true); }}
                                className="px-12 py-6 bg-[#00f2ff] text-gray-900 rounded-full font-black text-[11px] uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(0,242,255,0.4)] hover:bg-white hover:scale-105 transition-all active:scale-95 flex items-center gap-4 group/btn"
                            >
                                <Rocket size={20} className="group-hover/btn:rotate-12 transition-transform" />
                                Lanzar Estrategia
                            </button>
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">IA Engine v4.2 Active</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="px-8 flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] italic">Métricas de Rendimiento Global</h4>
                    <div className="h-px flex-1 bg-gray-100 mx-8 opacity-50" />
                </div>
                {renderKPIs()}
            </div>

            <div className="flex items-center justify-center gap-4 shrink-0 relative z-20 pt-4">
                <div className="p-2 bg-white/60 backdrop-blur-2xl border border-white shadow-2xl rounded-full flex items-center relative gap-2">
                    {[
                        { id: 'todos', label: 'Todos', icon: <LayoutGrid size={14}/> },
                        { id: 'campañas', label: 'Campañas', icon: <Target size={14}/> },
                        { id: 'canales', label: 'Canales', icon: <Globe size={14}/> },
                        { id: 'estadisticas', label: 'Estadísticas', icon: <BarChart3 size={14}/> },
                        { id: 'estrategias', label: 'Estrategias', icon: <Sparkles size={14}/> }
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`relative px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 z-10 flex items-center gap-3 ${isActive ? 'text-white shadow-xl' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeMarketingTab"
                                        className="absolute inset-0 bg-gray-900 rounded-full -z-10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                {tab.icon}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Botón de Información (Alineado al lado del menú) */}
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowInfoModal(true)}
                    className="h-14 w-14 rounded-full bg-white/80 backdrop-blur-xl border border-white shadow-2xl flex items-center justify-center text-[#004d4d] hover:bg-gray-900 hover:text-white transition-all group"
                >
                    <Info size={20} className="group-hover:scale-110 transition-transform" />
                </motion.button>
            </div>

            <div className="relative px-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-16"
                    >
                        {(activeTab === 'todos' || activeTab === 'canales') && renderCharts()}
                        {(activeTab === 'todos' || activeTab === 'campañas') && renderCampaignList()}
                        {activeTab === 'estadisticas' && renderCampaignAnalytics()}
                        {(activeTab === 'todos' || activeTab === 'estrategias') && renderBaytRecommendations()}
                    </motion.div>
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {isCreateModalOpen && renderCreateWizard()}
            </AnimatePresence>

            <AnimatePresence>
                {selectedCampaignDetail && renderCampaignDetailModal()}
            </AnimatePresence>

            <MarketingInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
            
            <MarketingMetricModal 
                isOpen={!!selectedKPI} 
                onClose={() => setSelectedKPI(null)} 
                metric={selectedKPI} 
            />

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 30px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                @keyframes pulse-cyan { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .animate-pulse-cyan { animation: pulse-cyan 2s infinite; }
            `}</style>
        </div>
    );
}