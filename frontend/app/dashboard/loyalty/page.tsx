"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Settings, 
  Plus, 
  X, 
  Gift, 
  Camera, 
  CheckCircle2, 
  Star, 
  Trash2,
  Coins,
  ArrowRight,
  ArrowUpRight,
  TrendingUp,
  Users,
  Clock,
  LayoutGrid,
  Search,
  Filter,
  Download,
  Calendar,
  Sparkles,
  Bot,
  Zap,
  ChevronRight,
  Medal,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from "@/context/toast-context";

interface Reward {
    id: string;
    name: string;
    points: number;
    image: string | null;
    stock: number | null;
}

interface Member {
    id: string;
    name: string;
    points: number;
    level: 'Bronce' | 'Plata' | 'Oro' | 'Diamante';
    progress: number;
    last_purchase: string;
}

const MOCK_MEMBERS: Member[] = [
    { id: 'm1', name: 'Elena Rodriguez', points: 4250, level: 'Oro', progress: 85, last_purchase: 'Hace 2 días' },
    { id: 'm2', name: 'Carlos Ruiz', points: 1200, level: 'Plata', progress: 40, last_purchase: 'Hace 1 semana' },
    { id: 'm3', name: 'Roberto Gómez', points: 8500, level: 'Diamante', progress: 100, last_purchase: 'Ayer' },
];

export default function LoyaltyPage() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'miembros' | 'reglas' | 'catalogo' | 'bayt'>('miembros');
    const [isActive, setIsActive] = useState(true);
    const [earnRate, setEarnRate] = useState(1000);
    const [redeemRate, setRedeemRate] = useState(100);
    const [redeemValue, setRedeemRateValue] = useState(5000);
    const [isSaving, setIsSaving] = useState(false);
    const [isBonoActive, setIsBonoActive] = useState(true);
    
    // Rewards State
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [newReward, setNewReward] = useState({ name: '', points: 0, image: null as string | null, stock: null as number | null });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cargar datos
    useEffect(() => {
        const savedRewards = localStorage.getItem('loyalty_rewards');
        if (savedRewards) {
            setRewards(JSON.parse(savedRewards));
        } else {
            const initial = [
                { id: 'r1', name: 'Gorra Oficial Bayup', points: 500, image: null, stock: 10 },
                { id: 'r2', name: 'Bono de Regalo $50.000', points: 1000, image: null, stock: null }
            ];
            setRewards(initial);
            localStorage.setItem('loyalty_rewards', JSON.stringify(initial));
        }
    }, []);

    const formatNumber = (val: number) => val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const unformatNumber = (val: string) => parseInt(val.replace(/\./g, '')) || 0;

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            showToast("Configuración del Club actualizada 🏆", "success");
        }, 1000);
    };

    const handleAddReward = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        const reward: Reward = { id: Math.random().toString(36).substr(2, 9), ...newReward };
        const updatedRewards = [...rewards, reward];
        setRewards(updatedRewards);
        localStorage.setItem('loyalty_rewards', JSON.stringify(updatedRewards));
        setIsProcessing(false);
        setIsModalOpen(false);
        setNewReward({ name: '', points: 0, image: null, stock: null });
        showToast("¡Nuevo premio añadido! 🎁", "success");
    };

    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
            {[
                { label: 'Puntos Emitidos', value: '1.2M', sub: 'Total histórico', icon: <Coins size={20}/>, trend: '+8%', color: 'text-amber-500' },
                { label: 'Miembros Activos', value: '842', sub: 'Clientes en el club', icon: <Users size={20}/>, trend: '+12%', color: 'text-[#004d4d]' },
                { label: 'Puntos por Vencer', value: '45.200', sub: 'En los próximos 30 días', icon: <Clock size={20}/>, trend: 'Alerta', color: 'text-rose-500' },
                { label: 'Tasa Redención', value: '62%', sub: 'Premios canjeados', icon: <Gift size={20}/>, trend: '+5%', color: 'text-emerald-600' },
            ].map((kpi, i) => (
                <motion.div key={i} whileHover={{ y: -5, scale: 1.02 }} className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/80 shadow-sm flex flex-col justify-between group transition-all">
                    <div className="flex justify-between items-start">
                        <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                            {kpi.icon}
                        </div>
                        <span className="text-[10px] font-black px-2 py-1 bg-gray-50 text-gray-400 rounded-lg">{kpi.trend}</span>
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
                <input type="text" placeholder="Buscar miembro por nombre o ID..." className="w-full pl-14 pr-6 py-4 bg-transparent text-sm font-bold text-slate-700 outline-none" />
            </div>
            <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex items-center gap-3">
                <button className="h-12 flex items-center gap-2 px-5 rounded-2xl bg-white text-slate-500 border border-gray-100 hover:bg-gray-50 transition-all">
                    <Filter size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Nivel</span>
                </button>
                <button className="h-12 flex items-center gap-2 px-5 bg-gray-900 text-white rounded-2xl shadow-lg hover:bg-black transition-all">
                    <Download size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Reporte</span>
                </button>
            </div>
        </div>
    );

    const renderMembers = () => (
        <div className="px-4 space-y-4">
            {MOCK_MEMBERS.map((member) => (
                <motion.div key={member.id} whileHover={{ x: 5 }} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="flex items-center gap-6 flex-1">
                        <div className="h-16 w-16 rounded-[1.8rem] bg-[#004d4d] text-white flex items-center justify-center text-2xl font-black shadow-2xl">
                            {member.name.charAt(0)}
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-gray-900 tracking-tight">{member.name}</h4>
                            <div className="flex items-center gap-3 mt-1">
                                <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${member.level === 'Diamante' ? 'bg-cyan-50 text-cyan-600 border-cyan-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                    Nivel {member.level}
                                </span>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">{member.last_purchase}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-[1.5] space-y-3">
                        <div className="flex justify-between items-end">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progreso al siguiente nivel</p>
                            <p className="text-sm font-black text-[#004d4d]">{member.points} / 10.000 PTS</p>
                        </div>
                        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-50 p-0.5">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${member.progress}%` }} className="h-full bg-gradient-to-r from-[#004d4d] to-[#00f2ff] rounded-full shadow-[0_0_10px_#00f2ff]"></motion.div>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <button className="h-12 px-6 rounded-2xl bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#004d4d] transition-all">Ver Historial</button>
                        <button className="h-12 w-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><ArrowUpRight size={20} /></button>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    const renderRules = () => (
        <div className="px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-xl space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5"><Star size={150} /></div>
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-amber-50 text-amber-600 rounded-[1.5rem] flex items-center justify-center shadow-inner"><Coins size={32} /></div>
                    <div><h3 className="text-2xl font-black text-gray-900 tracking-tight">Acumulación</h3><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Reglas de obtención de puntos</p></div>
                </div>
                <div className="space-y-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Por cada compra de:</label>
                        <div className="flex items-center gap-6 bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 shadow-inner">
                            <span className="text-3xl font-black text-[#004d4d]">$</span>
                            <input type="text" value={formatNumber(earnRate)} onChange={(e) => setEarnRate(unformatNumber(e.target.value))} className="text-3xl font-black text-gray-900 bg-transparent outline-none w-full" />
                        </div>
                    </div>
                    <div className="flex justify-center"><ArrowRight className="text-gray-200" size={32}/></div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">El cliente recibe:</label>
                        <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 flex items-center justify-between">
                            <span className="text-3xl font-black text-emerald-600">1</span>
                            <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Punto de Lealtad</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-xl space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5"><Gift size={150} /></div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-purple-50 text-purple-600 rounded-[1.5rem] flex items-center justify-center shadow-inner"><Award size={32} /></div>
                        <div><h3 className="text-2xl font-black text-gray-900 tracking-tight">Redención</h3><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Valor del bono de descuento</p></div>
                    </div>
                    <button onClick={() => setIsBonoActive(!isBonoActive)} className={`w-14 h-8 rounded-full relative transition-all duration-500 ${isBonoActive ? 'bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'bg-gray-200'}`}><div className={`absolute top-1 left-1 h-6 w-6 bg-white rounded-full transition-transform ${isBonoActive ? 'translate-x-6' : ''}`}></div></button>
                </div>
                <div className={`space-y-8 transition-all duration-500 ${isBonoActive ? 'opacity-100' : 'opacity-20 pointer-events-none grayscale'}`}>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Al completar:</label>
                        <div className="flex items-center gap-6 bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 shadow-inner">
                            <input type="text" value={formatNumber(redeemRate)} onChange={(e) => setRedeemRate(unformatNumber(e.target.value))} className="text-3xl font-black text-gray-900 bg-transparent outline-none w-full text-center" />
                            <span className="text-xs font-black text-purple-600 uppercase tracking-widest">PTS</span>
                        </div>
                    </div>
                    <div className="flex justify-center"><ArrowRight className="text-gray-200" size={32}/></div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Recibe un bono de:</label>
                        <div className="bg-[#004d4d] p-6 rounded-[2.5rem] flex items-center gap-6 shadow-2xl">
                            <span className="text-3xl font-black text-[#00f2ff]">$</span>
                            <input type="text" value={formatNumber(redeemValue)} onChange={(e) => setRedeemRateValue(unformatNumber(e.target.value))} className="text-3xl font-black text-white bg-transparent outline-none w-full" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="lg:col-span-2 flex justify-center"><button onClick={handleSave} className="px-20 py-6 bg-gray-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-3xl hover:scale-105 transition-all">Guardar Configuración Táctica</button></div>
        </div>
    );

    const renderCatalogo = () => (
        <div className="px-4 space-y-10">
            <div className="flex justify-between items-center bg-white/40 p-8 rounded-[3rem] border border-white/60">
                <div><h3 className="text-2xl font-black text-[#004d4d] uppercase italic">Catálogo de Premios</h3><p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Define qué pueden canjear tus clientes</p></div>
                <button onClick={() => setIsModalOpen(true)} className="h-16 px-10 bg-[#004d4d] text-[#00f2ff] rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-4 hover:scale-105 transition-all"><Plus size={20}/> Añadir Premio</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {rewards.map((reward) => (
                    <motion.div key={reward.id} whileHover={{ y: -10 }} className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-xl relative group">
                        <button onClick={() => {}} className="absolute top-6 right-6 h-10 w-10 bg-gray-50 text-gray-300 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                        <div className="h-48 w-full bg-gray-50 rounded-[2.5rem] border border-gray-100 mb-8 flex items-center justify-center overflow-hidden shadow-inner">
                            {reward.image ? <img src={reward.image} className="w-full h-full object-cover" /> : <Gift size={64} className="text-gray-200" />}
                        </div>
                        <div className="space-y-4">
                            <span className="text-[10px] font-black text-[#004d4d] bg-[#00f2ff]/10 px-4 py-1 rounded-full uppercase tracking-widest">{reward.points} Puntos</span>
                            <h5 className="text-xl font-black text-gray-900 tracking-tight">{reward.name}</h5>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><LayoutGrid size={12}/> Stock: {reward.stock || 'Ilimitado'}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-12 animate-in fade-in duration-1000">
            
            {/* --- HEADER MAESTRO --- */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_#F59E0B]"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Programa de Lealtad</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Club de <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-300 px-2 py-1">Puntos</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">
                        Fideliza a tus clientes premiando cada una de sus <span className="font-bold text-[#001A1A]">compras</span>.
                    </p>
                </div>
                <div className="flex items-center gap-6 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]' : 'bg-gray-300'}`}></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Programa {isActive ? 'Activo' : 'Pausado'}</p>
                    </div>
                    <button onClick={() => setIsActive(!isActive)} className={`w-12 h-7 rounded-full relative transition-all duration-500 ${isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}><div className={`absolute top-1 left-1 h-5 w-5 bg-white rounded-full transition-transform ${isActive ? 'translate-x-5' : ''}`}></div></button>
                </div>
            </div>

            {/* --- KPIs ESTRATÉGICOS --- */}
            {renderKPIs()}

            {/* --- MENÚ FLOTANTE CENTRAL --- */}
            <div className="flex items-center justify-center gap-6 shrink-0 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 backdrop-blur-xl flex items-center relative">
                    {[
                        { id: 'miembros', label: 'Miembros', icon: <Users size={14}/> },
                        { id: 'reglas', label: 'Reglas de Puntos', icon: <Settings size={14}/> },
                        { id: 'catalogo', label: 'Catálogo Premios', icon: <Gift size={14}/> },
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
                                    <motion.div
                                        layoutId="activeLoyaltyTab"
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

            {/* --- CONTENIDO DINÁMICO --- */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="space-y-10">
                    {activeTab === 'miembros' && (
                        <div className="space-y-8">
                            {renderActionBar()}
                            {renderMembers()}
                        </div>
                    )}
                    {activeTab === 'reglas' && renderRules()}
                    {activeTab === 'catalogo' && renderCatalogo()}
                    {activeTab === 'bayt' && (
                        <div className="px-4">
                            <div className="bg-[#004d4d] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Trophy size={300} /></div>
                                <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
                                    <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center animate-pulse"><Bot size={64} className="text-[#00f2ff]" /></div>
                                    <div className="flex-1 space-y-6">
                                        <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#00f2ff]/20">Estrategia de Fidelización</span>
                                        <h3 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2ff]">Maximiza el LTV de tus clientes</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10"><p className="text-sm font-medium italic leading-relaxed">"Los clientes en nivel **Oro** tienen una frecuencia de compra 3.2x mayor. Sugerencia: Ofrecer bono de bienvenida al siguiente nivel."</p></div>
                                            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10"><p className="text-sm font-medium italic leading-relaxed">"El premio **Gorra Oficial** está agotándose. Clientes con +500 pts están esperando redimir. Reponer stock pronto."</p></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* MODAL: AÑADIR PREMIO (Se mantiene lógica funcional) */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-lg rounded-[4rem] shadow-3xl overflow-hidden relative border border-white/20 z-10">
                            <div className="bg-[#004d4d] p-10 text-white flex items-center gap-6">
                                <div className="h-16 w-16 bg-[#00f2ff] text-[#004d4d] rounded-2xl flex items-center justify-center shadow-lg"><Gift size={32} /></div>
                                <div><h2 className="text-2xl font-black uppercase tracking-tight">Nuevo Premio</h2><p className="text-[10px] font-black text-[#00f2ff] uppercase tracking-widest">Catálogo de Lealtad</p></div>
                            </div>
                            <form onSubmit={handleAddReward} className="p-10 space-y-8 bg-white">
                                <div className="space-y-6">
                                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre del Regalo</label><input type="text" value={newReward.name} onChange={(e) => setNewReward({ ...newReward, name: e.target.value })} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" placeholder="Ej: Playera Edición Especial" /></div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Puntos</label><input type="text" value={formatNumber(newReward.points)} onChange={(e) => setNewReward({ ...newReward, points: unformatNumber(e.target.value) })} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Stock</label><input type="number" value={newReward.stock || ''} onChange={(e) => setNewReward({ ...newReward, stock: parseInt(e.target.value) })} className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner" placeholder="∞" /></div>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase text-gray-400">Cancelar</button><button type="submit" className="flex-[2] py-5 bg-[#004d4d] text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-2xl">Crear Premio</button></div>
                            </form>
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