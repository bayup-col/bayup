"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Smartphone, 
  Globe, 
  ShoppingBag, 
  Instagram, 
  Send, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ChevronRight, 
  CheckCircle2, 
  Activity, 
  TrendingUp, 
  Layers, 
  Calendar,
  Zap,
  User,
  Users,
  Star,
  MoreVertical,
  MousePointer2,
  Share2,
  Plus,
  X,
  Trophy,
  Paperclip,
  Smile,
  Mic,
  ArrowLeft,
  ArrowRight,
  Settings2,
  MapPin,
  LayoutGrid,
  Download,
  Tag,
  CreditCard,
  Clock,
  Hash,
  BarChart3,
  PieChart,
  Bot,
  AlertCircle,
  RefreshCw,
  DollarSign
} from 'lucide-react';

// --- CONFIGURACIÓN DE ESTILOS POR CANAL ---
const CHANNEL_CONFIG = {
    whatsapp: { 
        name: 'WhatsApp', 
        logo: '/assets/logowhatsapp.png', 
        color: '#25D366', 
        bg: 'bg-[#E5DDD5]', 
        bubble_me: 'bg-[#dcf8c6] border-[#c7e5b4]', 
        bubble_customer: 'bg-white border-gray-100',
        pattern: 'https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png'
    },
    mercadolibre: { 
        name: 'Mercado Libre', 
        logo: '/assets/logomercadolibre.png', 
        color: '#FFE600', 
        bg: 'bg-white', 
        bubble_me: 'bg-[#3483fa] text-white border-[#2a6fd1]', 
        bubble_customer: 'bg-[#f5f5f5] border-gray-200',
        pattern: null
    },
    instagram: { 
        name: 'Instagram', 
        logo: '/assets/logoinstagram.png', 
        color: '#E4405F', 
        bg: 'bg-white', 
        bubble_me: 'bg-gradient-to-tr from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white border-transparent', 
        bubble_customer: 'bg-gray-100 border-gray-200',
        pattern: null
    },
    shopify: { 
        name: 'Shopify', 
        logo: '/assets/logoshopify.png', 
        color: '#96bf48', 
        bg: 'bg-gray-50', 
        bubble_me: 'bg-[#008060] text-white border-[#006b4d]', 
        bubble_customer: 'bg-white border-gray-200 shadow-sm',
        pattern: null
    }
};

// --- MOCK DATA ---
const MOCK_CHATS: any[] = [
    {
        id: "c1",
        customer: {
            id: "u1", name: "Elena Rodriguez", email: "elena@email.com", phone: "+57 300 456 7890",
            city: "Medellín", address: "Calle 10 #45-20", age: 28, type: 'Final',
            ltv: 4500000, aov: 350000, frequency: "Mensual",
            top_products: ["Reloj Gold", "Vestido Lino"]
        },
        source: 'whatsapp', last_message: "¿Podrías enviarme el catálogo de invierno?", time: "10:30 AM",
        unread: true, status: 'negotiation', date: '2026-02-01T10:30:00',
        messages: [
            { id: "m1", sender: 'customer', text: "Hola! Me encantó el vestido que vi en el catálogo.", time: "10:25 AM", type: 'chat' },
            { id: "m2", sender: 'me', text: "Hola Elena! Qué bueno saludarte. Claro que sí, con gusto.", time: "10:28 AM", type: 'chat' },
            { id: "m3", sender: 'customer', text: "¿Podrías enviarme el catálogo de invierno completo?", time: "10:30 AM", type: 'chat' }
        ]
    },
    {
        id: "c2",
        customer: {
            id: "u2", name: "Carlos Ruiz", email: "carlos@gmail.com", phone: "+57 311 222 3344",
            city: "Bogotá", address: "Cra 15 #100-20", type: 'Mayorista',
            ltv: 12800000, aov: 1200000, frequency: "Quincenal",
            top_products: ["Zapatos Oxford", "Camisa Blanca"]
        },
        source: 'mercadolibre', last_message: "¿Tienen disponibilidad de 50 unidades?", time: "09:15 AM",
        unread: false, status: 'prospect', date: '2026-02-01T09:15:00',
        messages: [{ id: "m2", sender: 'customer', text: "¿Tienen disponibilidad de 50 unidades de este producto?", time: "09:15 AM", type: 'question' }]
    }
];

export default function MensajesPage() {
    const [view, setView] = useState<'inbox' | 'crm' | 'channels'>('inbox');
    const [selectedChatId, setSelectedChatId] = useState<string | null>(MOCK_CHATS[0].id);
    const [showCustomerProfile, setShowCustomerProfile] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [selectedChannelStats, setSelectedChannelStats] = useState<any | null>(null);
    
    // --- ESTADOS DE FILTRADO ---
    const [searchTerm, setSearchTerm] = useState("");
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
    const [dateRangeState, setDateRangeState] = useState({ from: '', to: '' });
    const [advancedFilters, setAdvancedFilters] = useState({ channel: 'all', status: 'all', type: 'all' });
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isDateHovered, setIsDateHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);

    const selectedChat = useMemo(() => MOCK_CHATS.find(c => c.id === selectedChatId), [selectedChatId]);
    const config = selectedChat ? (CHANNEL_CONFIG as any)[selectedChat.source] : null;

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedChatId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    const handleDatePreset = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
        const today = new Date();
        const formatDate = (d: Date) => d.toISOString().split('T')[0];
        let start = new Date();
        let end = new Date();
        switch (preset) {
            case 'today': break;
            case 'yesterday': start.setDate(today.getDate() - 1); end.setDate(today.getDate() - 1); break;
            case 'week': start.setDate(today.getDate() - 7); break;
            case 'month': start = new Date(today.getFullYear(), today.getMonth(), 1); break;
        }
        setDateRangeState({ from: formatDate(start), to: formatDate(end) });
    };

    const handleExport = async () => {
        try {
            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            const petrol = [0, 77, 77];
            doc.setFillColor(petrol[0], petrol[1], petrol[2]);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setFontSize(22);
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.text("REPORTE DE MENSAJES & CRM", 14, 20);
            doc.save(`Reporte_Mensajes_Bayup.pdf`);
        } catch (e) { console.error(e); }
    };

    const filteredChats = useMemo(() => {
        return MOCK_CHATS.filter(chat => {
            const matchesSearch = chat.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesChannel = advancedFilters.channel === 'all' || chat.source === advancedFilters.channel;
            return matchesSearch && matchesChannel;
        });
    }, [searchTerm, advancedFilters]);

    const openChannelStats = (id: string) => {
        const channel = (CHANNEL_CONFIG as any)[id];
        setSelectedChannelStats({
            ...channel,
            id,
            metrics: {
                customers: Math.floor(Math.random() * 500) + 100,
                sales: Math.floor(Math.random() * 50) + 10,
                problems: Math.floor(Math.random() * 5),
                conversion: (Math.random() * 15 + 5).toFixed(1),
                ai_messages: 78,
                human_messages: 22
            }
        });
    };

    const RenderActionBar = () => (
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white/60 backdrop-blur-md p-3 rounded-3xl border border-white/60 shadow-sm mx-4 shrink-0 relative z-30">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar cliente, mensaje o lead..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-transparent text-sm font-bold text-slate-700 outline-none" 
                />
            </div>
            <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex items-center gap-3">
                <div className="relative">
                    <motion.button 
                        onMouseEnter={() => setIsFilterHovered(true)} onMouseLeave={() => setIsFilterHovered(false)}
                        onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                        className={`h-12 flex items-center gap-2 px-5 rounded-2xl transition-all ${isFilterMenuOpen ? 'bg-[#004D4D] text-white shadow-lg' : 'bg-white text-slate-500 border border-gray-100 hover:bg-gray-50'}`}
                    >
                        <Filter size={18}/>
                        <AnimatePresence mode="popLayout">{isFilterHovered && <motion.span initial={{opacity:0, width:0}} animate={{opacity:1, width:'auto'}} exit={{opacity:0, width:0}} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Filtrar</motion.span>}</AnimatePresence>
                    </motion.button>
                    <AnimatePresence>
                        {isFilterMenuOpen && (
                            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:10}} className="absolute top-full right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 w-[280px] z-50 overflow-hidden">
                                {[{id:'canal', label:'Canal', options:['all','whatsapp','mercadolibre','instagram','shopify'], key:'channel'}].map(s => (
                                    <div key={s.id} className="p-4"><p className="text-[9px] font-black text-gray-400 uppercase mb-3">{s.label}</p>
                                        <div className="flex flex-wrap gap-2">{s.options.map(o => (
                                            <button key={o} onClick={() => {setAdvancedFilters({...advancedFilters, channel: o}); setIsFilterMenuOpen(false);}} className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase ${advancedFilters.channel === o ? 'bg-[#004D4D] text-white' : 'bg-gray-50 text-gray-500'}`}>{o}</button>
                                        ))}</div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="relative">
                    <motion.button 
                        onMouseEnter={() => setIsDateHovered(true)} onMouseLeave={() => setIsDateHovered(false)}
                        onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
                        className={`h-12 flex items-center gap-2 px-5 rounded-2xl transition-all ${isDateMenuOpen ? 'bg-[#004D4D] text-white shadow-lg' : 'bg-white text-slate-500 border border-gray-100 hover:bg-gray-50'}`}
                    >
                        <Calendar size={18}/>
                        <AnimatePresence mode="popLayout">{isDateHovered && <motion.span initial={{opacity:0, width:0}} animate={{opacity:1, width:'auto'}} exit={{opacity:0, width:0}} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Fechas</motion.span>}</AnimatePresence>
                    </motion.button>
                    <AnimatePresence>
                        {isDateMenuOpen && (
                            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:10}} className="absolute top-full right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 w-[300px] z-50">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs font-bold" />
                                        <input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs font-bold" />
                                    </div>
                                    <button onClick={() => setIsDateMenuOpen(false)} className="w-full py-3 bg-[#004D4D] text-white rounded-xl text-[9px] font-black uppercase">Aplicar Rango</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <motion.button 
                    onMouseEnter={() => setIsExportHovered(true)} onMouseLeave={() => setIsExportHovered(false)}
                    onClick={handleExport}
                    className="h-12 flex items-center gap-2 px-4 bg-gray-900 text-white rounded-2xl shadow-lg hover:bg-black transition-all"
                >
                    <Download size={18}/>
                    <AnimatePresence mode="popLayout">{isExportHovered && <motion.span initial={{opacity:0, width:0}} animate={{opacity:1, width:'auto'}} exit={{opacity:0, width:0}} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Exportar</motion.span>}</AnimatePresence>
                </motion.button>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto h-[1350px] flex flex-col gap-6 animate-in fade-in duration-1000 relative pb-20">
            
            {/* --- HEADER MAESTRO --- */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_10px_#10B981]"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Gestión de Activos</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Mensajes <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">Omnicanal</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">
                        Terminal central de comunicación y gestión comercial en tiempo real.
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                        {Object.values(CHANNEL_CONFIG).map((c: any, i) => (
                            <img key={i} src={c.logo} className="h-8 w-8 rounded-full border-4 border-[#FAFAFA] bg-white shadow-sm" alt="" />
                        ))}
                    </div>
                </div>
            </div>

            {/* --- KPI CARDS (INTELIGENCIA OMNICANAL) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
                {[
                    { label: 'Todos los Chats', value: '128', sub: 'Pendientes hoy', icon: <MessageSquare size={20}/>, trend: '+5%', color: 'text-[#004d4d]' },
                    { label: 'Canales Activos', value: '04', sub: 'Sincronizados', icon: <Globe size={20}/>, trend: 'OK', color: 'text-[#008080]' },
                    { label: 'Eficiencia IA', value: '82%', sub: 'Auto-respuesta', icon: <Zap size={20}/>, trend: '+12%', color: 'text-amber-500' },
                    { label: 'Ventas Chat', value: '$ 4.2M', sub: 'Conversión directa', icon: <DollarSign size={20}/>, trend: '+8%', color: 'text-emerald-600' },
                ].map((kpi, i) => (
                    <motion.div 
                        key={i}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="bg-white/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/80 shadow-sm flex flex-col justify-between group transition-all"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                                {kpi.icon}
                            </div>
                            <span className="text-[10px] font-black px-2 py-1 bg-[#00f2ff]/10 text-[#004d4d] rounded-lg">{kpi.trend}</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                            <h3 className="text-2xl font-black text-gray-900 mt-1">{kpi.value}</h3>
                            <p className="text-[9px] font-bold text-gray-400 mt-1 italic">{kpi.sub}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* --- MENÚ DE NAVEGACIÓN --- */}
            <div className="flex items-center justify-center gap-4 shrink-0">
                <div className="p-1 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/30 backdrop-blur-xl flex items-center relative">
                    {[
                        { id: 'inbox', label: 'Inbox', icon: <MessageSquare size={14}/> },
                        { id: 'channels', label: 'Canales', icon: <Globe size={14}/> },
                        { id: 'crm', label: 'CRM', icon: <LayoutGrid size={14}/> }
                    ].map((tab) => {
                        const isActive = view === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setView(tab.id as any)}
                                className={`relative px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeViewTab"
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

                <button className="h-10 px-6 bg-gray-900 text-white rounded-full font-black text-[9px] uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:scale-105 transition-all group">
                    <Share2 size={14} className="text-[#00f2ff] group-hover:rotate-12 transition-transform" />
                    Difusión
                </button>
            </div>

            <AnimatePresence mode="wait">
                {view === 'inbox' ? (
                    <motion.div 
                        key="inbox-view" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
                        className="flex flex-col gap-6 flex-1 overflow-hidden"
                    >
                        <RenderActionBar />
                        <div className="flex-1 flex overflow-hidden bg-white rounded-[4rem] border border-gray-100 shadow-[0_30px_100px_rgba(0,0,0,0.08)] mb-10 mx-4">
                            {/* SIDEBAR */}
                            <motion.div animate={{ width: isSidebarCollapsed ? 100 : 320 }} className="flex flex-col border-r border-gray-100 relative bg-white shrink-0 overflow-hidden">
                                {selectedChat && config && (
                                    <div className="p-6 bg-gray-50/80 border-b border-gray-100 flex flex-col gap-4">
                                        <div className="flex items-center justify-between w-full">
                                            {!isSidebarCollapsed && <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.4em]">Canal de Respuesta</p>}
                                            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="h-8 w-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400"><ArrowLeft size={14}/></button>
                                        </div>
                                        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100">
                                            <div className="h-8 w-8 shrink-0"><img src={config.logo} className="w-full h-full object-contain" /></div>
                                                                                {!isSidebarCollapsed && (
                                                                                    <div className="flex flex-col min-w-0">
                                                                                        <span className="text-xs font-black uppercase tracking-widest text-[#004d4d] truncate italic">{config.name}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            
                                                                            {!isSidebarCollapsed && (
                                                                                <div className="flex items-center justify-around py-2 bg-white/40 rounded-2xl border border-white/60 mx-2 shadow-sm">
                                                                                    <button className="p-2 hover:bg-[#004d4d] hover:text-[#00f2ff] rounded-xl text-gray-400 transition-all group" title="Estado de IA">
                                                                                        <Bot size={16} />
                                                                                    </button>
                                                                                    <div className="h-4 w-px bg-gray-200"></div>
                                                                                    <button className="p-2 hover:bg-[#004d4d] hover:text-[#00f2ff] rounded-xl text-gray-400 transition-all" title="Gestionar Etiquetas">
                                                                                        <Tag size={16} />
                                                                                    </button>
                                                                                    <div className="h-4 w-px bg-gray-200"></div>
                                                                                    <button className="p-2 hover:bg-[#004d4d] hover:text-[#00f2ff] rounded-xl text-gray-400 transition-all" title="Configuración Rápida">
                                                                                        <Settings2 size={16} />
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}                                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#FAFAFA]/30 pb-10">
                                    {filteredChats.map((chat) => (
                                        <div key={chat.id} onClick={() => setSelectedChatId(chat.id)} className={`flex items-center cursor-pointer transition-all border-b border-gray-50/50 ${isSidebarCollapsed ? 'p-6 justify-center' : 'p-8 gap-4'} ${selectedChatId === chat.id ? 'bg-white shadow-xl z-10' : 'hover:bg-white/80'}`}>
                                            <div className="relative flex-shrink-0">
                                                <div className={`${isSidebarCollapsed ? 'h-10 w-10' : 'h-12 w-12'} rounded-[1rem] flex items-center justify-center text-lg font-black text-[#004d4d]`}>{chat.customer.name.charAt(0)}</div>
                                                <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-white rounded-lg flex items-center justify-center shadow-lg border border-gray-100 p-1"><img src={CHANNEL_CONFIG[chat.source as keyof typeof CHANNEL_CONFIG].logo} className="w-full h-full object-contain" /></div>
                                            </div>
                                            {!isSidebarCollapsed && <div className="flex-1 min-w-0"><p className="text-sm font-black truncate">{chat.customer.name}</p><p className="text-[9px] truncate text-gray-400">{chat.last_message}</p></div>}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                            {/* CHAT AREA */}
                            <div className="flex-1 flex flex-col bg-white relative">
                                {selectedChat && config && (
                                    <>
                                        <div className="px-12 py-8 border-b border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-6"><button onClick={() => setShowCustomerProfile(true)} className="h-16 w-16 rounded-[1.8rem] bg-[#004d4d] text-white flex items-center justify-center text-2xl font-black shadow-2xl">{selectedChat.customer.name.charAt(0)}</button><div><h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic">{selectedChat.customer.name}</h3><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Miembro {selectedChat.customer.type}</p></div></div>
                                            <div className="flex items-center gap-4"><button className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400"><Settings2 size={20}/></button><button className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400"><X size={20}/></button></div>
                                        </div>
                                        <div className={`flex-1 overflow-y-auto p-16 space-y-12 custom-scrollbar relative ${config.bg}`} style={config.pattern ? { backgroundImage: `url(${config.pattern})`, backgroundSize: '500px', backgroundBlendMode: 'soft-light' } : {}}>
                                            {selectedChat.messages.map((m: any) => (
                                                <div key={m.id} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[60%] p-6 rounded-[2.2rem] shadow-xl border text-sm font-medium leading-relaxed relative ${m.sender === 'me' ? `${config.bubble_me} rounded-tr-none shadow-[#004d4d]/10` : `${config.bubble_customer} rounded-tl-none`}`}>{m.text}<p className="text-[8px] mt-4 font-black uppercase opacity-40">{m.time}</p></div></div>
                                            ))}
                                            <div ref={chatEndRef} />
                                        </div>
                                        <div className="p-10 bg-white border-t border-gray-100 flex gap-6 items-center"><div className="flex gap-3"><button className="h-16 w-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center"><Paperclip size={28}/></button></div><input type="text" placeholder="Escribe tu respuesta..." className="flex-1 bg-gray-50 border-2 border-transparent rounded-[2.2rem] px-10 py-6 text-base font-bold outline-none focus:bg-white focus:border-[#00f2ff]/30 transition-all shadow-inner" /><button className="bg-[#004d4d] text-white h-20 w-20 rounded-[2rem] shadow-xl flex items-center justify-center"><Send size={32} className="text-[#00f2ff]"/></button></div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : view === 'channels' ? (
                    <motion.div 
                        key="channels-view"
                        initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                        className="flex flex-col gap-2 flex-1 overflow-hidden"
                    >
                        <RenderActionBar />
                        <div className="flex-1 flex flex-col items-center justify-center gap-10 p-10 bg-white/40 backdrop-blur-md rounded-[4rem] border border-white/60 mx-4 mb-10">
                            <div className="text-center space-y-2 mt-[-2rem]"><h2 className="text-3xl font-black text-[#004d4d] uppercase italic tracking-tighter">Selecciona un Canal Maestro</h2><p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em]">Analítica y Gestión por Origen</p></div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-6xl">
                                {Object.entries(CHANNEL_CONFIG).map(([id, config]: [string, any]) => (
                                    <motion.button key={id} whileHover={{ scale: 1.05 }} onClick={() => openChannelStats(id)} className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col items-center gap-6 group hover:border-[#004d4d] transition-all relative overflow-hidden"><div className="absolute top-0 right-0 p-8 opacity-5"><Globe size={120} /></div><div className="h-24 w-24 bg-gray-50 rounded-3xl p-5 flex items-center justify-center group-hover:bg-[#004d4d]/5 border border-gray-100 shadow-inner"><img src={config.logo} className="w-full h-full object-contain" /></div><div className="text-center"><h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">{config.name}</h3><span className="text-[10px] font-black text-[#00f2ff] bg-[#004d4d] px-3 py-1 rounded-full uppercase mt-3 inline-block">Ver Estadísticas</span></div></motion.button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="crm-view" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
                        className="flex flex-col gap-6 flex-1 overflow-hidden"
                    >
                        <RenderActionBar />
                        <div className="flex-1 flex gap-8 overflow-x-auto pb-24 custom-scrollbar px-6 pt-6">
                            {['Prospectos', 'Negociación', 'Ganados', 'Soporte'].map((stage, i) => {
                                const stageChats = filteredChats.filter(c => c.status === (stage === 'Prospectos' ? 'prospect' : stage === 'Negociación' ? 'negotiation' : stage === 'Ganados' ? 'closed' : 'support'));
                                return (
                                    <div key={stage} className="min-w-[400px] flex flex-col space-y-8">
                                        <div className="flex items-center justify-between px-8 py-2"><h4 className="text-xs font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-4"><div className="h-2 w-2 rounded-full bg-[#004d4d]"></div> {stage}</h4><span className="bg-white px-4 py-1.5 rounded-full text-[11px] font-black text-[#004d4d] border border-gray-100 shadow-sm">{stageChats.length}</span></div>
                                        <div className="flex-1 bg-gray-50/40 rounded-[4rem] border border-gray-100 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                                            {stageChats.map(chat => (
                                                <div key={chat.id} className="bg-white p-6 rounded-[2.5rem] border border-white shadow-sm hover:shadow-xl transition-all group">
                                                    <div className="flex items-center justify-between mb-4"><div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-xs text-[#004d4d] border border-white shadow-inner">{chat.customer.name.charAt(0)}</div><img src={CHANNEL_CONFIG[chat.source as keyof typeof CHANNEL_CONFIG].logo} className="h-6 w-6 p-1 bg-white rounded-lg shadow-sm" /></div>
                                                    <h5 className="text-sm font-black text-gray-900 tracking-tight">{chat.customer.name}</h5>
                                                    <p className="text-[10px] text-gray-400 mt-2 line-clamp-2 italic">"{chat.last_message}"</p>
                                                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center"><span className="text-[10px] font-black text-[#004d4d]">{formatCurrency(chat.customer.ltv)}</span><span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{chat.time}</span></div>
                                                </div>
                                            ))}
                                            <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-[3rem] group hover:border-[#004d4d] transition-all cursor-pointer"><Plus size={20} className="text-gray-200 group-hover:text-[#004d4d]" /></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- MODAL ESTADÍSTICAS DE CANAL (ELITE ANALYTICS) --- */}
            <AnimatePresence>
                {selectedChannelStats && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedChannelStats(null)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-[#FAFAFA] w-full max-w-6xl rounded-[5rem] shadow-[0_50px_100px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col relative z-10 border border-white/20 h-[90vh]">
                            {/* Header Analytics */}
                            <div className="bg-[#004d4d] p-12 text-white relative shrink-0">
                                <button onClick={() => setSelectedChannelStats(null)} className="absolute top-12 right-12 h-14 w-14 bg-white/10 rounded-full flex items-center justify-center hover:bg-rose-500 transition-all"><X size={28} /></button>
                                <div className="flex items-center gap-10">
                                    <div className="h-32 w-32 bg-white rounded-[3rem] p-6 shadow-3xl flex items-center justify-center border-8 border-white/10">
                                        <img src={selectedChannelStats.logo} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-5xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2ff]">Analítica {selectedChannelStats.name}</h3>
                                        <div className="flex items-center gap-4">
                                            <span className="bg-[#00f2ff] text-[#004d4d] text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-[0.2em]">Sincronización Total</span>
                                            <div className="flex items-center gap-2 text-white/60 text-xs font-black uppercase tracking-widest"><RefreshCw size={14} className="animate-spin-slow" /> Actualizado en vivo</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dashboard de Datos */}
                            <div className="p-16 flex-1 overflow-y-auto custom-scrollbar space-y-12 bg-white">
                                {/* KPIs Superiores */}
                                <div className="grid grid-cols-4 gap-8">
                                    {[
                                        { label: 'Clientes Totales', value: selectedChannelStats.metrics.customers, sub: 'Nuevos este mes', icon: <Users size={20}/> },
                                        { label: 'Ventas Cerradas', value: selectedChannelStats.metrics.sales, sub: 'Conversión exitosa', icon: <CheckCircle2 size={20} className="text-emerald-500"/> },
                                        { label: 'Tasa Conversión', value: selectedChannelStats.metrics.conversion + '%', sub: 'Superior al promedio', icon: <TrendingUp size={20} className="text-[#00f2ff]"/> },
                                        { label: 'Novedades/Problemas', value: selectedChannelStats.metrics.problems, sub: 'Requieren atención', icon: <AlertCircle size={20} className="text-rose-500"/> }
                                    ].map((kpi, i) => (
                                        <div key={i} className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100 shadow-inner group hover:bg-[#004d4d] transition-all duration-500">
                                            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">{kpi.icon}</div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-white/60">{kpi.label}</p>
                                            <p className="text-3xl font-black text-[#004d4d] mt-2 group-hover:text-white">{kpi.value}</p>
                                            <p className="text-[9px] font-bold text-gray-400 mt-1 italic group-hover:text-white/40">{kpi.sub}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Comparativa IA vs Humano */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="bg-[#001A1A] p-12 rounded-[4rem] text-white space-y-10 relative overflow-hidden shadow-2xl">
                                        <div className="absolute top-0 right-0 p-10 opacity-5"><Bot size={150} /></div>
                                        <div className="relative z-10 flex justify-between items-center">
                                            <h4 className="text-xl font-black uppercase italic tracking-widest">Eficiencia de Respuesta</h4>
                                            <Bot className="text-[#00f2ff]" size={24} />
                                        </div>
                                        <div className="space-y-8 relative z-10">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-xs font-black uppercase text-[#00f2ff]">Bayup AI (Automatizado)</span>
                                                    <span className="text-2xl font-black">{selectedChannelStats.metrics.ai_messages}%</span>
                                                </div>
                                                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden border border-white/5"><motion.div initial={{width:0}} animate={{width:`${selectedChannelStats.metrics.ai_messages}%`}} className="h-full bg-[#00f2ff] shadow-[0_0_15px_#00f2ff]"></motion.div></div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-xs font-black uppercase text-white/60">Intervención Humana</span>
                                                    <span className="text-2xl font-black">{selectedChannelStats.metrics.human_messages}%</span>
                                                </div>
                                                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden border border-white/5"><motion.div initial={{width:0}} animate={{width:`${selectedChannelStats.metrics.human_messages}%`}} className="h-full bg-white/40"></motion.div></div>
                                            </div>
                                        </div>
                                        <div className="pt-6 border-t border-white/10 relative z-10"><p className="text-[10px] font-medium text-white/40 leading-relaxed italic italic">"La IA está ahorrando un promedio de 12 horas de trabajo manual al día en este canal."</p></div>
                                    </div>

                                    {/* Gráfica de Tendencia (Barras Minimalistas) */}
                                    <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-xl space-y-10">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-xl font-black uppercase italic tracking-widest text-[#004d4d]">Volumen de Tráfico</h4>
                                            <Activity className="text-[#004d4d]/20" size={24} />
                                        </div>
                                        <div className="h-48 w-full flex items-end justify-between gap-3">
                                            {[40, 65, 45, 90, 55, 75, 85, 60, 95, 70, 80, 50].map((h, i) => (
                                                <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} className="flex-1 bg-gray-50 rounded-t-xl relative group overflow-hidden border border-gray-100">
                                                    <div className="absolute bottom-0 w-full bg-[#004d4d] opacity-20 group-hover:opacity-100 transition-all cursor-pointer h-full"></div>
                                                </motion.div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between text-[9px] font-black text-gray-300 uppercase tracking-widest"><span>08:00 AM</span><span>Ahora</span><span>08:00 PM</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-12 bg-gray-50 border-t border-gray-100 flex justify-center items-center gap-10 shrink-0">
                                <button onClick={() => { setAdvancedFilters({...advancedFilters, channel: selectedChannelStats.id}); setView('inbox'); setSelectedChannelStats(null); }} className="flex items-center gap-4 py-5 px-14 bg-gray-900 text-white rounded-[2.2rem] text-[11px] font-black uppercase tracking-[0.4em] hover:bg-[#004d4d] transition-all shadow-3xl group">Gestionar Conversaciones <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" /></button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- MODAL INTELIGENCIA CLIENTE --- */}
            <AnimatePresence>
                {showCustomerProfile && selectedChat && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCustomerProfile(false)} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-4xl rounded-[5rem] shadow-3xl overflow-hidden flex flex-col relative z-10 border border-white/20">
                            <div className="bg-[#004d4d] p-20 text-white relative">
                                <button onClick={() => setShowCustomerProfile(false)} className="absolute top-16 right-16 h-16 w-16 bg-white/10 rounded-full flex items-center justify-center transition-all hover:bg-rose-500"><X size={32} /></button>
                                <div className="relative z-10 flex items-center gap-16">
                                    <div className="h-48 w-48 rounded-[4rem] bg-white text-[#004d4d] flex items-center justify-center text-7xl font-black shadow-3xl relative border-[12px] border-[#004d4d]/50">
                                        {selectedChat.customer.name.charAt(0)}
                                        <div className="absolute -bottom-4 -right-4 h-16 w-16 bg-[#00f2ff] rounded-[1.5rem] flex items-center justify-center border-4 border-[#004d4d] shadow-2xl"><Zap size={32} className="text-[#004d4d]" fill="currentColor" /></div>
                                    </div>
                                    <div className="text-left space-y-6">
                                        <h3 className="text-6xl font-black uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-300 tracking-tighter">{selectedChat.customer.name}</h3>
                                        <div className="flex gap-4">
                                            <span className="bg-[#00f2ff] text-[#004d4d] text-[12px] font-black px-6 py-2.5 rounded-full uppercase tracking-[0.3em] shadow-2xl shadow-[#00f2ff]/30">Elite {selectedChat.customer.type}</span>
                                            <span className="bg-white/10 text-white text-[12px] font-black px-6 py-2.5 rounded-full uppercase tracking-[0.3em] border border-white/10">ID: {selectedChat.customer.id}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-20 space-y-20 overflow-y-auto max-h-[600px] custom-scrollbar bg-white">
                                <div className="grid grid-cols-3 gap-10">
                                    {[
                                        { label: 'Valor Total Compras', value: formatCurrency(selectedChat.customer.ltv), color: 'text-[#004d4d]' },
                                        { label: 'Ticket Promedio', value: formatCurrency(selectedChat.customer.aov), color: 'text-gray-900' },
                                        { label: 'Frecuencia Operativa', value: selectedChat.customer.frequency, color: 'text-[#008080]' },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-gray-50/80 p-10 rounded-[3rem] border border-gray-100 text-center shadow-inner">
                                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">{stat.label}</p>
                                            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-14 bg-gradient-to-br from-[#004d4d] to-[#001A1A] rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Trophy size={200} /></div>
                                    <div className="flex items-center gap-14 relative z-10">
                                        <div className="h-32 w-32 bg-white/10 backdrop-blur-3xl rounded-[2.5rem] flex items-center justify-center shrink-0 border border-white/20"><TrendingUp size={60} className="text-[#00f2ff]" /></div>
                                        <div><div className="text-xs font-black uppercase text-[#00f2ff] tracking-[0.5em] mb-4">Estrategia IA Bayup</div><p className="text-xl font-medium italic opacity-90 leading-relaxed tracking-wide">"Elena tiene un perfil de compra compulsivo ante ofertas exclusivas. Sugerencia: Enviar acceso anticipado a la nueva colección."</p></div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-16 bg-gray-50 border-t border-gray-100 flex justify-center"><button className="flex items-center gap-6 py-6 px-14 bg-gray-900 text-white rounded-[2.2rem] text-xs font-black uppercase tracking-[0.5em] hover:bg-black transition-all shadow-3xl">Auditoría de Cliente <ArrowRight size={24} /></button></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 30px; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin-slow { animation: spin-slow 8s linear infinite; }
            `}</style>
        </div>
    );
}
