"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  MessageSquare, 
  Globe, 
  ShoppingBag, 
  Send, 
  Search, 
  Filter, 
  CheckCircle2, 
  Plus, 
  X, 
  Paperclip, 
  ArrowLeft, 
  Settings2, 
  LayoutGrid, 
  Download, 
  CreditCard, 
  Clock, 
  Bot, 
  DollarSign, 
  Mail, 
  Phone, 
  Briefcase, 
  Target, 
  History, 
  Info as InfoIcon, 
  Pencil, 
  Trash2,
  MapPin,
  Activity,
  TrendingUp,
  Zap,
  Tag,
  Calendar,
  Palette,
  MoreVertical,
  MoreHorizontal,
  GripVertical,
  ShieldCheck,
  BellOff,
  Archive,
  Ban
} from 'lucide-react';
import TiltCard from '@/components/dashboard/TiltCard';
import ChatsInfoModal from '@/components/dashboard/ChatsInfoModal';
import ChatsMetricModal from '@/components/dashboard/ChatsMetricModal';
import { useToast } from "@/context/toast-context";
import { generateChatsPDF } from '@/lib/chats-report';

// --- CONFIGURACIÓN ---
const CHANNEL_CONFIG = {
    whatsapp: { name: 'WhatsApp', logo: '/assets/logowhatsapp.webp', color: '#25D366', bg: 'bg-[#E5DDD5]', bubble_me: 'bg-[#dcf8c6] border-[#c7e5b4]', bubble_customer: 'bg-white border-gray-100' },
    mercadolibre: { name: 'Mercado Libre', logo: '/assets/logomercadolibre.webp', color: '#FFE600', bg: 'bg-white', bubble_me: 'bg-[#3483fa] text-white border-[#2a6fd1]', bubble_customer: 'bg-[#f5f5f5] border-gray-200' },
    instagram: { name: 'Instagram', logo: '/assets/logoinstagram.webp', color: '#E4405F', bg: 'bg-white', bubble_me: 'bg-gradient-to-tr from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white border-transparent', bubble_customer: 'bg-gray-100 border-gray-200' },
    shopify: { name: 'Shopify', logo: '/assets/logoshopify.webp', color: '#96bf48', bg: 'bg-gray-50', bubble_me: 'bg-[#008060] text-white border-[#006b4d]', bubble_customer: 'bg-white border-gray-200 shadow-sm' }
};

const INITIAL_STAGES = [
    { id: 'st1', label: 'Prospectos', key: 'prospect', color: '#94a3b8' },
    { id: 'st2', label: 'Negociación', key: 'negotiation', color: '#f59e0b' },
    { id: 'st3', label: 'Ganados', key: 'closed', color: '#10b981' },
    { id: 'st4', label: 'Soporte', key: 'support', color: '#3b82f6' }
];

const PRESET_COLORS = [ '#94a3b8', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#00f2ff', '#004d4d', '#1e293b' ];

const MOCK_CHATS_INIT: any[] = [];

export default function MensajesPage() {
    const { showToast } = useToast();
    const [view, setView] = useState<'inbox' | 'crm' | 'channels'>('inbox');
    const [chats, setChats] = useState(MOCK_CHATS_INIT);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(MOCK_CHATS_INIT[0].id);
    const [showCustomerProfile, setShowCustomerProfile] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [selectedKPI, setSelectedKPI] = useState<any>(null);
    const [stages, setStages] = useState(INITIAL_STAGES);
    const [availableTags, setAvailableTags] = useState([]);
    const [showTagManager, setShowTagManager] = useState(false);
    const [showQuickSettings, setShowQuickSettings] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [selectedTagColor, setSelectedTagColor] = useState(PRESET_COLORS[0]);
    const [isQuickAdding, setIsQuickAdding] = useState<string | null>(null);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [filterChannel, setFilterChannel] = useState('all');
    const [filterTag, setFilterTag] = useState('all');
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
    const [isFilterHovered, setIsFilterHovered] = useState(false);
    const [isDateHovered, setIsDateHovered] = useState(false);
    const [isExportHovered, setIsExportHovered] = useState(false);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const selectedChat = useMemo(() => chats.find(c => c.id === selectedChatId), [selectedChatId, chats]);
    const config = selectedChat ? (CHANNEL_CONFIG as any)[selectedChat.source] : null;

    useEffect(() => {
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }, [selectedChatId, selectedChat?.messages]);

    const filteredChats = useMemo(() => {
        return chats.filter(chat => {
            const matchesSearch = chat.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesChannel = filterChannel === 'all' || chat.source === filterChannel;
            const matchesTag = filterTag === 'all' || chat.customer.tags?.includes(filterTag);
            return matchesSearch && matchesChannel && matchesTag;
        });
    }, [searchTerm, filterChannel, filterTag, chats]);

    const handleDragEnd = (chatId: string, stageKey: string) => {
        const stage = stages.find(s => s.key === stageKey);
        if (!stage) return;
        setChats(prev => prev.map(c => {
            if (c.id === chatId) {
                const otherStageLabels = stages.map(s => s.label);
                const cleanTags = (c.customer.tags || []).filter((t: string) => !otherStageLabels.includes(t));
                return { ...c, status: stageKey, customer: { ...c.customer, tags: [...cleanTags, stage.label] } };
            }
            return c;
        }));
        showToast(`Estado: ${stage.label}`, "success");
    };

    const handleUpdateStage = (id: string, label: string) => {
        setStages(stages.map(s => s.id === id ? { ...s, label } : s));
        showToast("Tablero actualizado", "success");
    };

    const handleExport = () => {
        generateChatsPDF({ chats: filteredChats, stats: { totalChats: chats.length, activeChannels: 4, aiEfficiency: '82%', totalRevenue: '$ 4.2M' } });
        showToast("Auditoría exportada", "success");
    };

    const handleAddTag = () => { if (!newTagName.trim()) return; setAvailableTags([...availableTags, { name: newTagName, color: selectedTagColor } as any]); setNewTagName(""); showToast("Etiqueta creada", "success"); };

    const RenderActionBar = () => (
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white/60 backdrop-blur-md p-3 rounded-3xl border border-white/60 shadow-sm mx-4 shrink-0 relative z-30">
            <div className="relative flex-1 w-full"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input type="text" placeholder="Buscar por nombre o ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-transparent text-sm font-bold text-slate-700 outline-none" /></div>
            <div className="flex items-center gap-3">
                <button onClick={() => setShowTagManager(true)} className="h-12 w-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-[#004d4d] hover:bg-gray-900 hover:text-white transition-all shadow-sm"><Tag size={18}/></button>
                {view === 'crm' && (
                    <div className="relative">
                        <motion.button layout onMouseEnter={() => setIsFilterHovered(true)} onMouseLeave={() => setIsFilterHovered(false)} onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className={`h-12 flex items-center gap-2 px-5 rounded-2xl transition-all ${isFilterMenuOpen ? 'bg-[#004D4D] text-white shadow-lg' : 'bg-white text-slate-500 border border-gray-100 hover:bg-gray-50'}`}><Filter size={18}/><AnimatePresence mode="popLayout">{isFilterHovered && <motion.span initial={{opacity:0, width:0}} animate={{opacity:1, width:'auto'}} exit={{opacity:0, width:0}} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Filtros</motion.span>}</AnimatePresence></motion.button>
                        <AnimatePresence>{isFilterMenuOpen && ( <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:10}} className="absolute top-full right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 w-[320px] z-50 overflow-hidden"><div className="p-4 border-b border-gray-50"><p className="text-[9px] font-black text-gray-400 uppercase mb-3">Canal</p><div className="flex flex-wrap gap-2">{['all', 'whatsapp', 'instagram', 'mercadolibre', 'shopify'].map(o => ( <button key={o} onClick={() => {setFilterChannel(o); setIsFilterMenuOpen(false);}} className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase transition-all ${filterChannel === o ? 'bg-[#004D4D] text-white' : 'bg-gray-50 text-gray-500'}`}>{o}</button> ))}</div></div><div className="p-4"><p className="text-[9px] font-black text-gray-400 uppercase mb-3">Etiquetas</p><div className="flex flex-wrap gap-2">{stages.map(s => ( <button key={s.label} onClick={() => {setFilterTag(s.label); setIsFilterMenuOpen(false);}} className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase transition-all ${filterTag === s.label ? 'bg-[#004D4D] text-[#00f2ff]' : 'bg-gray-50 text-gray-500'}`}>{s.label}</button> ))}</div></div></motion.div> )}</AnimatePresence>
                    </div>
                )}
                <div className="relative">
                    <motion.button layout onMouseEnter={() => setIsDateHovered(true)} onMouseLeave={() => setIsDateHovered(false)} onClick={() => setIsDateMenuOpen(!isDateMenuOpen)} className={`h-12 flex items-center gap-2 px-5 rounded-2xl transition-all ${isDateMenuOpen ? 'bg-[#004D4D] text-white shadow-lg' : 'bg-white text-slate-500 border border-gray-100 hover:bg-gray-50'}`}><Calendar size={18}/><AnimatePresence mode="popLayout">{isDateHovered && <motion.span initial={{opacity:0, width:0}} animate={{opacity:1, width:'auto'}} exit={{opacity:0, width:0}} className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">Fechas</motion.span>}</AnimatePresence></motion.button>
                    <AnimatePresence>{isDateMenuOpen && ( <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:10}} className="absolute top-full right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 w-[300px] z-50"><div className="space-y-4"><div className="grid grid-cols-2 gap-3"><input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs font-bold" /><input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs font-bold" /></div><button onClick={() => setIsDateMenuOpen(false)} className="w-full py-3 bg-[#004D4D] text-white rounded-xl text-[9px] font-black uppercase">Aplicar</button></div></motion.div> )}</AnimatePresence>
                </div>
                <motion.button layout onClick={handleExport} className="h-12 flex items-center gap-2 px-4 bg-gray-900 text-white rounded-2xl shadow-lg hover:bg-black transition-all"><Download size={18}/></motion.button>
            </div>
        </div>
    );

    const renderTrelloCard = (chat: any, stage: any) => (
        <motion.div key={chat.id} layout layoutId={chat.id} drag="x" dragConstraints={{ left: -100, right: 100 }} dragElastic={0.8} onDragEnd={(_, info) => { const threshold = 80; const currentIndex = stages.findIndex(s => s.key === stage.key); if (info.offset.x > threshold && currentIndex < stages.length - 1) handleDragEnd(chat.id, stages[currentIndex + 1].key); else if (info.offset.x < -threshold && currentIndex > 0) handleDragEnd(chat.id, stages[currentIndex - 1].key); }} whileDrag={{ scale: 1.1, rotate: 2, zIndex: 100, boxShadow: "0 30px 60px rgba(0,0,0,0.15)" }} onClick={() => { setSelectedChatId(chat.id); setView('inbox'); }} className="bg-white p-5 rounded-[2.2rem] border border-white shadow-sm hover:shadow-xl transition-all group cursor-pointer active:cursor-grabbing space-y-4 mb-4"><div className="flex items-center justify-between"><div className="h-2 w-12 rounded-full" style={{ backgroundColor: stage.color }}></div><img src={(CHANNEL_CONFIG as any)[chat.source].logo} className="h-5 w-5 grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all" /></div><h5 className="text-sm font-black text-gray-900 tracking-tight leading-tight">{chat.customer.name}</h5><div className="flex items-center justify-between pt-2 border-t border-gray-50"><div className="flex items-center gap-2"><Clock size={12} className="text-gray-300"/><span className="text-[8px] font-black text-gray-300 uppercase">{chat.time}</span></div><div className="h-7 w-7 rounded-full bg-gray-50 flex items-center justify-center text-[10px] font-black text-[#004d4d] border border-white shadow-inner">{chat.customer.name.charAt(0)}</div></div></motion.div>
    );

    return (
        <div className="max-w-[1600px] mx-auto min-h-screen flex flex-col gap-8 animate-in fade-in duration-1000 relative pb-20 overflow-hidden">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0 pt-4">
                <div>
                    <div className="flex items-center gap-3 mb-2"><span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span><span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Terminal de Inteligencia</span></div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">Terminal <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">Omnicanal CRM</span></h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">Gestión comercial y automatización de mensajería en tiempo real.</p>
                </div>
                <div className="flex items-center gap-4"><div className="flex -space-x-2">{Object.values(CHANNEL_CONFIG).map((c: any, i) => ( <img key={i} src={c.logo} className="h-10 w-10 rounded-full border-4 border-[#FAFAFA] bg-white shadow-sm" alt="" /> ))}</div></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
                {[ { label: 'Todos los Chats', value: chats.length, sub: 'Pendientes hoy', icon: <MessageSquare size={20}/>, color: 'text-[#004d4d]' }, { label: 'Canales Activos', value: '04', sub: 'Sincronizados', icon: <Globe size={20}/>, color: 'text-[#008080]' }, { label: 'Eficiencia IA', value: '82%', sub: 'Auto-respuesta', icon: <Zap size={20}/>, color: 'text-amber-500' }, { label: 'Ventas Chat', value: '$ 4.2M', sub: 'Conversión directa', icon: <DollarSign size={20}/>, color: 'text-emerald-600' } ].map((kpi, i) => (
                    <TiltCard key={i} className="h-full" onClick={() => setSelectedKPI(kpi)}>
                        <div className="bg-white/95 p-8 rounded-[2.5rem] border border-white shadow-xl flex flex-col justify-between h-full group transition-all cursor-pointer"><div className="flex justify-between items-start mb-4"><div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>{kpi.icon}</div><span className="text-[10px] font-black px-2 py-1 bg-[#00f2ff]/10 text-[#004d4d] rounded-lg">LIVE</span></div><div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p><h3 className="text-3xl font-black text-gray-900 mt-1">{kpi.value}</h3><p className="text-[9px] font-bold text-gray-400 mt-1 italic">{kpi.sub}</p></div></div>
                    </TiltCard>
                ))}
            </div>

            <div className="flex items-center justify-center gap-4 shrink-0 relative z-20">
                <div className="p-1 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/30 backdrop-blur-xl flex items-center relative">
                    {[ { id: 'inbox', label: 'Inbox', icon: <MessageSquare size={14}/> }, { id: 'channels', label: 'Canales', icon: <Globe size={14}/> }, { id: 'crm', label: 'Tablero', icon: <LayoutGrid size={14}/> } ].map((tab) => {
                        const isActive = view === tab.id;
                        return ( <button key={tab.id} onClick={() => setView(tab.id as any)} className={`relative px-8 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}>{isActive && ( <motion.div layoutId="activeViewTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} /> )}{tab.icon}{tab.label}</button> );
                    })}
                </div>
                <motion.button whileHover={{ scale: 1.1, rotate: 5 }} onClick={() => setShowInfoModal(true)} className="h-12 w-12 rounded-full bg-white/80 backdrop-blur-xl border border-white shadow-2xl flex items-center justify-center text-[#004d4d] hover:bg-gray-900 hover:text-white transition-all group"><InfoIcon size={18} /></motion.button>
            </div>

            <RenderActionBar />

            <AnimatePresence mode="wait">
                {view === 'inbox' ? (
                    <motion.div key="inbox-view" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="flex flex-col gap-6 flex-1 overflow-hidden h-[calc(100vh-550px)]" >
                        <div className="flex-1 flex overflow-hidden bg-white rounded-[4rem] border border-gray-100 shadow-[0_30px_100px_rgba(0,0,0,0.08)] mb-4 mx-4">
                            <motion.div animate={{ width: isSidebarCollapsed ? 100 : 320 }} className="flex flex-col border-r border-gray-100 bg-white shrink-0 overflow-hidden">
                                {!isSidebarCollapsed && (
                                    <div className="p-6 pb-2">
                                        <div className="flex items-center justify-around py-3 bg-gray-50/50 backdrop-blur-md rounded-2xl border border-gray-100 shadow-inner relative">
                                            <button onClick={() => showToast("Bayt AI activo", "info")} className="p-2 hover:bg-[#004d4d] hover:text-[#00f2ff] rounded-xl text-gray-400 transition-all group" title="Bayt AI"><Bot size={18} /></button>
                                            <div className="h-4 w-px bg-gray-200"></div>
                                            <button onClick={() => setShowTagManager(true)} className="p-2 hover:bg-[#004d4d] hover:text-[#00f2ff] rounded-xl text-gray-400 transition-all" title="Etiquetas"><Tag size={18} /></button>
                                            <div className="h-4 w-px bg-gray-200"></div>
                                            <button onClick={() => setShowQuickSettings(!showQuickSettings)} className="p-2 hover:bg-[#004d4d] hover:text-[#00f2ff] rounded-xl text-gray-400 transition-all" title="Ajustes"><Settings2 size={18} /></button>
                                        </div>
                                    </div>
                                )}
                                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#FAFAFA]/30 pb-10 pt-2">
                                    {filteredChats.map((chat) => {
                                        const currentStage = stages.find(s => s.key === chat.status);
                                        return (
                                            <div key={chat.id} onClick={() => setSelectedChatId(chat.id)} className={`flex items-center cursor-pointer transition-all border-b border-gray-50/50 ${isSidebarCollapsed ? 'p-6 justify-center' : 'p-8 gap-4'} ${selectedChatId === chat.id ? 'bg-white shadow-xl z-10' : 'hover:bg-white/80'}`}>
                                                <div className="relative flex-shrink-0">
                                                    <div className={`${isSidebarCollapsed ? 'h-12 w-12' : 'h-14 w-14'} rounded-2xl flex items-center justify-center text-xl font-black text-[#004d4d] bg-gray-50 transition-all`} style={{ boxShadow: `inset 0 0 0 3px ${currentStage?.color || '#eee'}` }}>{chat.customer.name.charAt(0)}</div>
                                                    <div className="absolute -bottom-1 -right-1 h-7 w-7 bg-white rounded-xl flex items-center justify-center shadow-xl border border-gray-100 p-1.5 z-10"><img src={(CHANNEL_CONFIG as any)[chat.source].logo} className="w-full h-full object-contain" /></div>
                                                </div>
                                                {!isSidebarCollapsed && <div className="flex-1 min-w-0"><p className="text-sm font-black truncate">{chat.customer.name}</p><span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: currentStage?.color }}>{currentStage?.label}</span></div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                            <div className="flex-1 flex flex-col bg-white relative">
                                {selectedChat && (
                                    <>
                                        <div className="px-12 py-8 border-b border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-6 relative"><div className="relative"><button onClick={() => setShowCustomerProfile(true)} className="h-20 w-20 rounded-[2.2rem] text-white flex items-center justify-center text-3xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95" style={{ backgroundColor: stages.find(s => s.key === selectedChat.status)?.color }}>{selectedChat.customer.name.charAt(0)}</button><div className="absolute -bottom-2 -right-2 h-10 w-10 bg-white rounded-2xl flex items-center justify-center shadow-2xl border-4 border-gray-50 p-2"><img src={(CHANNEL_CONFIG as any)[selectedChat.source].logo} className="w-full h-full object-contain" /></div></div><div><h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">{selectedChat.customer.name}</h3><div className="flex gap-3 items-center mt-1"><span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: stages.find(s => s.key === selectedChat.status)?.color }}></span><p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#004d4d]">Vía {(CHANNEL_CONFIG as any)[selectedChat.source].name}</p></div></div></div>
                                            <div className="flex items-center gap-4"><button className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400"><Settings2 size={20}/></button></div>
                                        </div>
                                        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-16 space-y-12 custom-scrollbar bg-gray-50/30"><div className="flex justify-center"><span className="px-4 py-1.5 bg-white border border-gray-100 rounded-full text-[8px] font-black text-gray-300 uppercase tracking-[0.3em]">Cifrado Activo</span></div></div>
                                        <div className="p-10 bg-white border-t border-gray-100 flex gap-6 items-center"><div className="flex gap-3"><button className="h-16 w-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center hover:bg-gray-100 transition-all"><Paperclip size={28}/></button></div><input type="text" placeholder="Escribe tu respuesta..." className="flex-1 bg-gray-50 border-2 border-transparent rounded-[2.2rem] px-10 py-6 text-base font-bold outline-none focus:bg-white focus:border-[#00f2ff]/30 transition-all shadow-inner" /><button className="bg-[#004d4d] text-white h-20 w-20 rounded-[2rem] shadow-xl flex items-center justify-center hover:bg-black transition-all group"><Send size={32} className="text-[#00f2ff]"/></button></div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : view === 'crm' ? (
                    <div className="flex-1 flex gap-6 overflow-x-auto pb-24 custom-scrollbar px-6 pt-2 h-[calc(100vh-550px)]">
                        <LayoutGroup>
                            {stages.map((stage) => {
                                const stageChats = filteredChats.filter(c => c.status === stage.key);
                                return (
                                    <motion.div layout key={stage.id} className="min-w-[340px] max-w-[340px] flex flex-col bg-gray-100/40 rounded-[3rem] border border-gray-200/30 h-full overflow-hidden shadow-inner">
                                        <div className="p-6 flex items-center justify-between shrink-0 bg-white/40 backdrop-blur-sm border-b border-gray-200/20"><div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full shadow-lg" style={{ backgroundColor: stage.color }}></div><input className="bg-transparent border-none text-xs font-black uppercase tracking-[0.2em] text-gray-900 focus:outline-none focus:bg-white/80 rounded-lg px-2 w-full transition-all" defaultValue={stage.label} onBlur={(e) => handleUpdateStage(stage.id, e.target.value)} /></div><span className="text-[10px] font-black text-gray-400 bg-white px-2 py-0.5 rounded-lg shadow-sm border border-gray-100">{stageChats.length}</span></div>
                                        <motion.div layout className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-4"><AnimatePresence mode="popLayout">{stageChats.map(chat => renderTrelloCard(chat, stage))}</AnimatePresence></motion.div>
                                        <div className="p-4 shrink-0 bg-white/20"><button onClick={() => setIsQuickAdding(stage.id)} className="w-full py-4 flex items-center justify-center gap-3 text-gray-400 hover:text-[#004d4d] hover:bg-white/80 rounded-2xl transition-all group font-black uppercase text-[10px] tracking-[0.2em]"><Plus size={16}/> Añadir Tarjeta</button></div>
                                    </motion.div>
                                );
                            })}
                            <button onClick={() => setStages([...stages, { id: `st${Date.now()}`, label: 'Nueva Lista', key: `st${Date.now()}`, color: '#004d4d' }])} className="min-w-[340px] h-fit bg-white/10 border-2 border-dashed border-gray-200 rounded-[3rem] p-8 flex items-center justify-center gap-4 text-gray-400 hover:border-[#004d4d] hover:text-[#004d4d] transition-all group backdrop-blur-sm"><Plus size={24}/><span className="text-[10px] font-black uppercase tracking-[0.3em]">Nueva Lista</span></button>
                        </LayoutGroup>
                    </div>
                ) : null }
            </AnimatePresence>

            <AnimatePresence>{showTagManager && (
                <div className="fixed inset-0 z-[1700] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTagManager(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-lg rounded-[3rem] shadow-3xl overflow-hidden flex flex-col relative z-10 border border-white/20">
                        <div className="bg-gray-900 p-8 text-white flex justify-between items-center"><h3 className="text-xl font-black italic uppercase tracking-tighter">Administrador de Etiquetas</h3><button onClick={() => setShowTagManager(false)}><X size={20}/></button></div>
                        <div className="p-8 space-y-8">
                            <div className="space-y-4"><input autoFocus type="text" placeholder="Nombre de etiqueta..." value={newTagName} onChange={(e) => setNewTagName(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold" /><div className="flex flex-wrap gap-2 justify-center">{PRESET_COLORS.map(c => ( <button key={c} onClick={() => setSelectedTagColor(c)} className={`h-8 w-8 rounded-full border-2 transition-all ${selectedTagColor === c ? 'border-gray-900 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }} /> ))}</div><button onClick={handleAddTag} className="w-full py-4 bg-[#004d4d] text-white rounded-xl font-black text-[10px] uppercase">Crear Etiqueta</button></div>
                            <div className="space-y-3"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Mis Etiquetas</p><div className="flex flex-wrap gap-3">{availableTags.map((t: any, i: number) => ( <div key={i} className="flex items-center gap-2 border border-gray-100 pl-4 pr-2 py-2 rounded-xl group" style={{ backgroundColor: `${t.color}15` }}><div className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }}></div><span className="text-[10px] font-black uppercase" style={{ color: t.color }}>{t.name}</span><button onClick={() => setAvailableTags(availableTags.filter((tag: any) => tag.name !== t.name))} className="text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><X size={14}/></button></div> ))}</div></div>
                        </div>
                    </motion.div>
                </div>
            )}</AnimatePresence>

            <ChatsInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
            <ChatsMetricModal isOpen={!!selectedKPI} onClose={() => setSelectedKPI(null)} metric={selectedKPI} />
            <style jsx global>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; }.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }`}</style>
        </div>
    );
}