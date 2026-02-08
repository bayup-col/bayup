"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Bot, 
  Activity, 
  Settings, 
  Plus, 
  X, 
  CheckCircle2, 
  Sparkles, 
  MessageSquare, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  ArrowRight, 
  ArrowUpRight,
  Clock, 
  ShieldCheck, 
  Cpu,
  Workflow,
  MousePointer2,
  Trash2,
  Eye,
  Settings2,
  AlertCircle,
  LucideHistory,
  Scale,
  Medal,
  Info
} from 'lucide-react';
import { useToast } from "@/context/toast-context";
import AutomationsInfoModal from '@/components/dashboard/AutomationsInfoModal';
import AutomationsMetricModal from '@/components/dashboard/AutomationsMetricModal';
import TiltCard from '@/components/dashboard/TiltCard';
import { useEffect } from 'react';

// --- INTERFACES ---
interface Automation {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'inactive';
    trigger: { icon: any; label: string };
    logic: 'static' | 'bayt_ai';
    action: { icon: any; label: string };
    stats: {
        executions: number;
        hours_saved: number;
        revenue_impact: number;
    }
}

// --- DATA ---
const INITIAL_AUTOMATIONS: Automation[] = [
    { 
        id: 'auto_1', 
        name: 'Recuperación de Carrito Predictiva', 
        description: 'Bayt AI analiza por qué el cliente abandonó y envía un descuento personalizado vía WhatsApp.', 
        trigger: { icon: <ShoppingCart size={16}/>, label: 'Carrito Abandonado' }, 
        logic: 'bayt_ai',
        action: { icon: <MessageSquare size={16}/>, label: 'WhatsApp Smart' }, 
        status: 'active', 
        stats: { executions: 1240, hours_saved: 42, revenue_impact: 8500000 } 
    },
    { 
        id: 'auto_2', 
        name: 'Auto-Abastecimiento de Bodega', 
        description: 'Cuando el stock baja del 10%, Bayt genera una PO automática al proveedor con mejor precio.', 
        trigger: { icon: <Activity size={16}/>, label: 'Stock Crítico' }, 
        logic: 'bayt_ai',
        action: { icon: <Workflow size={16}/>, label: 'Generar PO' }, 
        status: 'active', 
        stats: { executions: 85, hours_saved: 120, revenue_impact: 0 } 
    },
    { 
        id: 'auto_3', 
        name: 'Mensaje de Bienvenida Estático', 
        description: 'Envía un catálogo digital a cada nuevo cliente registrado.', 
        trigger: { icon: <Users size={16}/>, label: 'Registro Nuevo' }, 
        logic: 'static',
        action: { icon: <MessageSquare size={16}/>, label: 'Email Catálogo' }, 
        status: 'inactive', 
        stats: { executions: 0, hours_saved: 0, revenue_impact: 0 } 
    },
];

// Terminal Neural v4.2 - Bayup Interactive
export default function AutomationsPage() {
    const { showToast } = useToast();

    useEffect(() => {
        showToast("Terminal Neural activa y sincronizada. Protocolo Platinum v4.2 cargado correctamente.", "success");
    }, [showToast]);

    const [automations, setAutomations] = useState<Automation[]>(INITIAL_AUTOMATIONS);
    const [activeTab, setActiveTab] = useState<'mis_flujos' | 'recetas' | 'historial'>('mis_flujos');
    const [isCreatingFlow, setIsCreatingFlow] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [selectedKPI, setSelectedKPI] = useState<any>(null);
    const [selectedAutomationDetail, setSelectedAutomationDetail] = useState<Automation | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [newFlow, setNewFlow] = useState({
        name: '',
        trigger: 'Carrito Abandonado',
        logic: 'bayt_ai' as 'static' | 'bayt_ai',
        action: 'WhatsApp Smart'
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    const toggleStatus = (id: string) => {
        setAutomations(prev => prev.map(a => 
            a.id === id ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' } : a
        ));
        showToast("Estado de flujo actualizado", "success");
    };

    const handleCreateFlow = () => {
        if (!newFlow.name.trim()) return;
        
        const triggerIcon = newFlow.trigger === 'Stock Crítico' ? <Activity size={16}/> : <ShoppingCart size={16}/>;
        const actionIcon = newFlow.action.includes('WhatsApp') ? <MessageSquare size={16}/> : <Workflow size={16}/>;

        const automation: Automation = {
            id: `auto_${Date.now()}`,
            name: newFlow.name,
            description: `Flujo neural optimizado para ${newFlow.trigger.toLowerCase()}.`,
            status: 'active',
            trigger: { icon: triggerIcon, label: newFlow.trigger },
            logic: newFlow.logic,
            action: { icon: actionIcon, label: newFlow.action },
            stats: { executions: 0, hours_saved: 0, revenue_impact: 0 }
        };

        setAutomations(prev => [automation, ...prev]);
        setIsCreatingFlow(false);
        setNewFlow({ name: '', trigger: 'Carrito Abandonado', logic: 'bayt_ai', action: 'WhatsApp Smart' });
        showToast("Flujo neural activado con éxito", "success");
    };

    const renderKPIs = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 shrink-0">
            {[
                { label: 'Flujos Activos', value: automations.filter(a => a.status === 'active').length, sub: 'Operando 24/7', icon: <Cpu size={20}/>, color: 'text-[#00f2ff]' },
                { label: 'Tiempo Ahorrado', value: `${automations.reduce((acc, a) => acc + a.stats.hours_saved, 0)}h`, sub: 'Este mes', icon: <Clock size={20}/>, color: 'text-emerald-500' },
                { label: 'Impacto en Ventas', value: formatCurrency(automations.reduce((acc, a) => acc + a.stats.revenue_impact, 0)), sub: 'Recuperado por IA', icon: <TrendingUp size={20}/>, color: 'text-blue-500' },
                { label: 'Eficiencia Neural', value: '98.4%', sub: 'Sin errores de flujo', icon: <Zap size={20}/>, color: 'text-amber-500' },
            ].map((kpi, i) => (
                <TiltCard key={i} onClick={() => setSelectedKPI(kpi)} className="h-full">
                    <div className="bg-white/95 p-8 rounded-[2.5rem] border border-white shadow-xl flex flex-col justify-between h-full group transition-all">
                        <div className="flex justify-between items-start">
                            <div className={`h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                                {kpi.icon}
                            </div>
                            <span className="text-[10px] font-black px-2 py-1 bg-gray-50 text-gray-400 rounded-lg">Live</span>
                        </div>
                        <div className="mt-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                            <h3 className="text-3xl font-black text-gray-900 mt-1">{kpi.value}</h3>
                            <p className="text-[9px] font-bold text-gray-400 mt-1 italic">{kpi.sub}</p>
                        </div>
                    </div>
                </TiltCard>
            ))}
        </div>
    );

    const renderFlowCard = (auto: Automation) => (
        <motion.div 
            key={auto.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedAutomationDetail(auto)}
            className={`bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-2xl transition-all relative overflow-hidden cursor-pointer ${auto.status === 'inactive' ? 'opacity-60' : ''}`}
        >
            {auto.logic === 'bayt_ai' && (
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00f2ff] to-[#004d4d]"></div>
            )}

            <div className="space-y-8 relative z-10">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner ${auto.status === 'active' ? 'bg-[#004d4d] text-[#00f2ff]' : 'bg-gray-100 text-gray-400'}`}>
                            {auto.logic === 'bayt_ai' ? <Bot size={24}/> : <Zap size={24}/>}
                        </div>
                        {auto.logic === 'bayt_ai' && (
                            <span className="px-3 py-1 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[8px] font-black uppercase tracking-widest border border-[#00f2ff]/20">Bayt AI Core</span>
                        )}
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${auto.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                        {auto.status === 'active' ? 'Operando' : 'Pausado'}
                    </div>
                </div>

                <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase group-hover:text-[#004d4d] transition-colors">{auto.name}</h3>
                    <p className="text-sm font-medium text-gray-500 mt-4 leading-relaxed italic line-clamp-2">"{auto.description}"</p>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 relative overflow-hidden">
                    <div className="flex flex-col items-center gap-1 flex-1">
                        <div className="text-[#004d4d]">{auto.trigger.icon}</div>
                        <p className="text-[8px] font-black uppercase text-gray-400">{auto.trigger.label}</p>
                    </div>
                    <ArrowRight size={16} className="text-gray-200" />
                    <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                        {auto.logic === 'bayt_ai' ? <Sparkles className="text-[#00f2ff] animate-pulse" size={18}/> : <Cpu className="text-gray-300" size={18}/>}
                    </div>
                    <ArrowRight size={16} className="text-gray-200" />
                    <div className="flex flex-col items-center gap-1 flex-1">
                        <div className="text-[#004d4d]">{auto.action.icon}</div>
                        <p className="text-[8px] font-black uppercase text-gray-400">{auto.action.label}</p>
                    </div>
                </div>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-50 grid grid-cols-2 gap-6">
                <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ahorro Tiempo</p>
                    <p className="text-lg font-black text-emerald-600">{auto.stats.hours_saved} Horas</p>
                </div>
                <div className="text-right flex items-center justify-end">
                    <button className="h-12 w-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center group-hover:bg-[#004d4d] group-hover:text-white transition-all shadow-sm"><ArrowUpRight size={20}/></button>
                </div>
            </div>
        </motion.div>
    );

    const renderAutomationDetailModal = () => {
        if (!selectedAutomationDetail) return null;
        const auto = selectedAutomationDetail;

        const handleToggle = () => {
            toggleStatus(auto.id);
            setSelectedAutomationDetail({ ...auto, status: auto.status === 'active' ? 'inactive' : 'active' });
        };

        const handleDelete = () => {
            setIsDeleteModalOpen(true);
        };

        return (
            <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAutomationDetail(null)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl" />
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }} className="relative bg-white w-full max-w-4xl rounded-[4rem] shadow-3xl overflow-hidden flex flex-col border border-white/20">
                    <div className="p-10 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 rounded-3xl bg-white shadow-xl flex items-center justify-center text-[#004d4d]">
                                {auto.logic === 'bayt_ai' ? <Bot size={32} /> : <Zap size={32} />}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 italic uppercase tracking-tighter">{auto.name}</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Status: {auto.status === 'active' ? 'Operativo' : 'Inactivo'}</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedAutomationDetail(null)} className="h-12 w-12 rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-rose-500 transition-all shadow-sm"><X size={24}/></button>
                    </div>

                    <div className="p-12 space-y-12 overflow-y-auto max-h-[70vh] custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-[#004d4d] p-8 rounded-[3rem] text-white">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#00f2ff]">Ejecuciones</p>
                                <h4 className="text-3xl font-black mt-2">{auto.stats.executions}</h4>
                                <p className="text-[10px] font-bold text-white/40 mt-2 uppercase tracking-tighter">Ciclos Completados</p>
                            </div>
                            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tiempo Ahorrado</p>
                                <h4 className="text-3xl font-black text-gray-900 mt-2">{auto.stats.hours_saved}h</h4>
                                <p className="text-[10px] font-bold text-emerald-500 mt-2 italic">Productividad Alta</p>
                            </div>
                            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Impacto Econ.</p>
                                <h4 className="text-3xl font-black text-gray-900 mt-2">{formatCurrency(auto.stats.revenue_impact)}</h4>
                                <p className="text-[10px] font-bold text-gray-400 mt-2 italic">Retorno Atribuido</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Settings size={14}/> Configuración del Flujo</h4>
                            <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Disparador (Trigger)</p>
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#004d4d]">{auto.trigger.icon}</div>
                                        <p className="text-sm font-black text-gray-900">{auto.trigger.label}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acción Final</p>
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#004d4d]">{auto.action.icon}</div>
                                        <p className="text-sm font-black text-gray-900">{auto.action.label}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Sparkles size={14}/> Auditoría de Bayt AI</h4>
                            <div className="bg-gray-900 p-10 rounded-[3.5rem] text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5"><Bot size={150} /></div>
                                <p className="text-base font-medium italic opacity-90 leading-relaxed relative z-10">
                                    "{auto.status === 'active' 
                                        ? `El flujo '${auto.name}' está operando bajo el protocolo de máxima eficiencia. He analizado las últimas ejecuciones y el tiempo de respuesta es óptimo (< 200ms). No se requieren ajustes tácticos.` 
                                        : `Este flujo neural está pausado. Los eventos disparadores se están acumulando en la cola. Sugiero reanudar para evitar cuellos de botella en la operativa.`}"
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                            <button 
                                onClick={handleToggle}
                                className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl transition-all ${auto.status === 'active' ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-[#004d4d] text-white shadow-[#004d4d]/20'}`}
                            >
                                {auto.status === 'active' ? 'Pausar Ejecución' : 'Reanudar Ejecución'}
                            </button>
                            <button 
                                onClick={handleDelete}
                                className="py-5 bg-white border-2 border-rose-100 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-rose-50 transition-all"
                            >
                                Eliminar Flujo
                            </button>
                        </div>
                    </div>

                    <div className="p-10 border-t border-gray-100 bg-gray-50 flex justify-end">
                        <button onClick={() => setSelectedAutomationDetail(null)} className="px-12 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Cerrar Detalle</button>
                    </div>
                </motion.div>
            </div>
        );
    };

    const renderDeleteConfirmModal = () => {
        if (!selectedAutomationDetail) return null;
        
        const confirmDelete = () => {
            setAutomations(prev => prev.filter(a => a.id !== selectedAutomationDetail.id));
            setIsDeleteModalOpen(false);
            setSelectedAutomationDetail(null);
            showToast("Protocolo neural desactivado y eliminado", "success");
        };

        return (
            <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeleteModalOpen(false)} className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" />
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-md rounded-[3rem] shadow-3xl overflow-hidden border border-rose-100 p-10 text-center">
                    <div className="h-20 w-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Trash2 size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 italic uppercase tracking-tight">¿Confirmar Eliminación?</h3>
                    <p className="text-sm font-medium text-gray-500 mt-4 leading-relaxed italic">
                        Estás a punto de desmantelar el flujo neural <span className="font-bold text-gray-900">"{selectedAutomationDetail.name}"</span>. Esta acción es irreversible y detendrá toda automatización vinculada.
                    </p>
                    
                    <div className="grid grid-cols-1 gap-3 mt-10">
                        <button 
                            onClick={confirmDelete}
                            className="w-full py-5 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95"
                        >
                            Eliminar Definitivamente
                        </button>
                        <button 
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="w-full py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:text-gray-900 transition-all"
                        >
                            Abortar Operación
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-32 space-y-12 animate-in fade-in duration-1000 relative">
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#004d4d]/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#00f2ff]/5 rounded-full blur-[100px]" />
            </div>

            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-4 shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_10px_#00f2ff]"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Automatización de Procesos</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        Terminal <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] px-2 py-1">Neural</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">
                        Configura flujos inteligentes donde <span className="font-bold text-[#001A1A]">Bayt AI</span> toma decisiones operativas por ti.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsCreatingFlow(true)}
                        className="h-14 px-10 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4 group"
                    >
                        <Workflow size={18} className="text-[#00f2ff] group-hover:rotate-180 transition-transform duration-700" />
                        Crear Flujo (IA)
                    </button>
                </div>
            </div>

            {renderKPIs()}

            <div className="flex items-center justify-center gap-4 shrink-0 relative z-20">
                <div className="p-1.5 bg-white border border-gray-100 rounded-full shadow-xl shadow-gray-200/50 backdrop-blur-xl flex items-center relative">
                    {[
                        { id: 'mis_flujos', label: 'Mis Flujos', icon: <Zap size={14}/> },
                        { id: 'recetas', label: 'Recetas Elite', icon: <Sparkles size={14}/> },
                        { id: 'historial', label: 'Log de Eventos', icon: <LucideHistory size={14}/> }
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`relative px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 z-10 flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {isActive && (
                                    <motion.div layoutId="activeAutoTab" className="absolute inset-0 bg-[#004D4D] rounded-full shadow-lg -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                )}
                                {tab.icon}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <motion.button
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowInfoModal(true)}
                    className="h-12 w-12 rounded-full bg-white/80 backdrop-blur-xl border border-white shadow-2xl flex items-center justify-center text-[#004d4d] hover:bg-gray-900 hover:text-white transition-all group"
                >
                    <Info size={18} />
                </motion.button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                    {activeTab === 'mis_flujos' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-4">
                            {automations.map(auto => renderFlowCard(auto))}
                        </div>
                    )}
                    {activeTab === 'recetas' && (
                        <div className="px-4 space-y-10">
                            <div className="bg-gradient-to-r from-[#004d4d] to-[#001a1a] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Medal size={300} /></div>
                                <div className="flex flex-col md:flex-row items-center gap-16 relative z-10 text-center md:text-left">
                                    <div className="h-32 w-32 bg-gray-900 rounded-[3rem] border-2 border-[#00f2ff]/50 flex items-center justify-center shadow-3xl animate-pulse">
                                        <Sparkles size={64} className="text-[#00f2ff]" />
                                    </div>
                                    <div className="flex-1 space-y-6">
                                        <span className="px-4 py-1.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded-full text-[10px] font-black uppercase tracking-[0.4em] border border-[#00f2ff]/20">Smart Templates</span>
                                        <h3 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00f2ff]">Recetas de Élite para tu Negocio</h3>
                                        <p className="text-gray-300 text-lg font-medium italic opacity-80">"No reinventes la rueda. Activa flujos prediseñados por expertos en e-commerce y IA."</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    { title: 'Cobro de Cartera Persuasivo', desc: 'Bayt analiza la confianza del cliente y redacta un mensaje de cobro único para facturas vencidas.', icon: <Scale size={16}/> },
                                    { title: 'Incentivo por Fidelidad', desc: 'Al llegar a 10 compras, Bayt activa una campaña de Marketing exclusiva para ese cliente.', icon: <Crown size={16}/> }
                                ].map((r, i) => (
                                    <div key={i} className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-[#00f2ff] transition-all">
                                        <div className="space-y-6">
                                            <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center text-[#004d4d] shadow-inner group-hover:scale-110 transition-transform">{r.icon}</div>
                                            <h4 className="text-2xl font-black uppercase italic tracking-tight text-gray-900 leading-none">{r.title}</h4>
                                            <p className="text-sm font-medium text-gray-500 leading-relaxed italic">{r.desc}</p>
                                        </div>
                                        <button className="mt-8 py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all">Instalar Receta</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 'historial' && (
                        <div className="px-4">
                            <div className="bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                    <h3 className="text-xl font-black uppercase italic text-gray-900">Registro de Actividad Neural</h3>
                                    <div className="flex gap-2">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]"></span>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Escaneando Eventos...</p>
                                    </div>
                                </div>
                                <div className="p-20 flex flex-col items-center justify-center text-gray-300 gap-6 opacity-50">
                                    <Activity size={80} strokeWidth={1} />
                                    <p className="text-xs font-black uppercase tracking-[0.3em] text-center leading-relaxed">No hay ejecuciones recientes en este periodo.<br/>Tus automatizaciones están en standby.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            <div className="px-4 pt-12">
                <div className="bg-[#001a1a] p-16 rounded-[4rem] text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-16 shadow-2xl border border-white/5">
                    <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(0,242,255,0.08)_0%,_transparent_60%)] animate-pulse"></div>
                    <div className="h-24 w-24 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center shadow-3xl">
                        <ShieldCheck size={48} className="text-[#00f2ff]" />
                    </div>
                    <div className="flex-1 relative z-10 space-y-4">
                        <h3 className="text-3xl font-black tracking-tight italic uppercase">Seguridad en la Ejecución</h3>
                        <p className="text-gray-400 text-lg font-medium leading-relaxed italic">
                            "Cada flujo ejecutado por la Terminal Neural es auditado en tiempo real. Bayt garantiza que ninguna acción automatizada comprometa la integridad de tus datos financieros."
                        </p>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isCreatingFlow && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreatingFlow(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 100 }} className="bg-white w-full max-w-5xl h-[85vh] rounded-[4rem] shadow-3xl overflow-hidden flex flex-col relative z-10 border border-white/20">
                            
                            <div className="bg-gray-900 p-10 text-white shrink-0 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Workflow size={200} /></div>
                                <button onClick={() => { setIsCreatingFlow(false); setWizardStep(1); }} className="absolute top-10 right-10 h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all z-20"><X size={24} /></button>
                                
                                <div className="relative z-10 flex items-center gap-8">
                                    <div className="h-20 w-20 rounded-[2rem] bg-[#00f2ff] text-[#001a1a] flex items-center justify-center text-3xl font-black shadow-[0_0_30px_rgba(0,242,255,0.3)]">
                                        {wizardStep}
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black uppercase italic tracking-tighter">Arquitecto de <span className="text-[#00f2ff]">Flujos Neurales</span></h3>
                                        <div className="flex items-center gap-2 mt-3">
                                            {[1, 2, 3, 4].map((s) => (
                                                <div key={s} className="flex items-center gap-2">
                                                    <div className={`h-1.5 rounded-full transition-all duration-500 ${wizardStep >= s ? 'w-12 bg-[#00f2ff]' : 'w-4 bg-white/10'}`} />
                                                    {s < 4 && <span className="text-[8px] text-white/20 font-black">/</span>}
                                                </div>
                                            ))}
                                            <span className="ml-4 text-[10px] font-black uppercase text-[#00f2ff]/60 tracking-widest">
                                                {wizardStep === 1 ? 'Identidad' : wizardStep === 2 ? 'Disparador' : wizardStep === 3 ? 'Cerebro' : 'Ejecución'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-12 md:p-16 custom-scrollbar bg-[#FAFAFA]">
                                <AnimatePresence mode="wait">
                                    {wizardStep === 1 && (
                                        <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto space-y-12">
                                            <div className="text-center space-y-4">
                                                <h4 className="text-4xl font-black text-gray-900 tracking-tight uppercase italic">Nombre del Protocolo</h4>
                                                <p className="text-gray-500 font-medium">Asigna un nombre técnico a esta automatización para identificarla en el log.</p>
                                            </div>
                                            <div className="relative group">
                                                <input 
                                                    autoFocus
                                                    type="text" 
                                                    value={newFlow.name}
                                                    onChange={(e) => setNewFlow({...newFlow, name: e.target.value})}
                                                    placeholder="Ej: Recuperación de Carrito VIP"
                                                    className="w-full bg-white border-b-4 border-gray-100 p-8 text-3xl font-black text-gray-900 outline-none focus:border-[#00f2ff] transition-all placeholder:text-gray-100 text-center"
                                                />
                                                <div className="absolute -bottom-1 left-0 right-0 h-1 bg-[#00f2ff] scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
                                            </div>
                                            <div className="flex justify-center">
                                                <button 
                                                    disabled={!newFlow.name.trim()}
                                                    onClick={() => setWizardStep(2)}
                                                    className="px-16 py-5 bg-gray-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-3xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
                                                >
                                                    Siguiente: Nodo de Entrada
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {wizardStep === 2 && (
                                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                            <div className="max-w-xl">
                                                <h4 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic">Disparador (Trigger)</h4>
                                                <p className="text-gray-500 font-medium mt-2">¿Qué evento debe activar este flujo en tiempo real?</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                {[
                                                    { id: 'Carrito Abandonado', label: 'Carrito Abandonado', icon: <ShoppingCart size={24}/>, desc: 'Cuando un cliente deja productos.' },
                                                    { id: 'Stock Crítico', label: 'Stock Crítico', icon: <Activity size={24}/>, desc: 'Cuando el inventario baja del 10%.' },
                                                    { id: 'Registro Nuevo', label: 'Registro Nuevo', icon: <Users size={24}/>, desc: 'Al crear una cuenta nueva.' },
                                                    { id: 'Factura Vencida', label: 'Factura Vencida', icon: <Scale size={24}/>, desc: 'Cuando un pago supera la fecha.' },
                                                ].map((t) => (
                                                    <button 
                                                        key={t.id}
                                                        onClick={() => { setNewFlow({...newFlow, trigger: t.id}); setWizardStep(3); }}
                                                        className={`p-8 rounded-[3rem] border-2 transition-all text-left flex flex-col justify-between h-64 group ${newFlow.trigger === t.id ? 'border-[#004d4d] bg-white shadow-2xl ring-4 ring-[#004d4d]/5' : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm'}`}
                                                    >
                                                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-all ${newFlow.trigger === t.id ? 'bg-[#004d4d] text-[#00f2ff]' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}>
                                                            {t.icon}
                                                        </div>
                                                        <div>
                                                            <h5 className="text-sm font-black text-gray-900 uppercase tracking-tight">{t.label}</h5>
                                                            <p className="text-[10px] text-gray-400 mt-2 font-medium leading-relaxed">{t.desc}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {wizardStep === 3 && (
                                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                                            <div className="max-w-xl">
                                                <h4 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic">Nodo de Inteligencia</h4>
                                                <p className="text-gray-500 font-medium mt-2">Define cómo se procesará la información antes de actuar.</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                <button 
                                                    onClick={() => { setNewFlow({...newFlow, logic: 'static'}); setWizardStep(4); }}
                                                    className={`p-10 rounded-[4rem] border-2 transition-all text-left group relative overflow-hidden ${newFlow.logic === 'static' ? 'border-gray-900 bg-white shadow-2xl' : 'border-gray-100 bg-white'}`}
                                                >
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-gray-900 transition-colors"><Zap size={28}/></div>
                                                        <h5 className="text-xl font-black text-gray-900 uppercase italic">Lógica Estática</h5>
                                                    </div>
                                                    <p className="text-sm text-gray-500 font-medium leading-relaxed italic">"Ejecuta la acción siempre de la misma forma, sin variaciones basadas en datos externos."</p>
                                                </button>

                                                <button 
                                                    onClick={() => { setNewFlow({...newFlow, logic: 'bayt_ai'}); setWizardStep(4); }}
                                                    className={`p-10 rounded-[4rem] border-2 transition-all text-left group relative overflow-hidden ${newFlow.logic === 'bayt_ai' ? 'border-[#004d4d] bg-white shadow-2xl' : 'border-gray-100 bg-white'}`}
                                                >
                                                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Bot size={150} /></div>
                                                    <div className="flex items-center gap-4 mb-6 relative z-10">
                                                        <div className="h-14 w-14 bg-[#004d4d]/5 rounded-2xl flex items-center justify-center text-[#004d4d] group-hover:scale-110 transition-transform"><Bot size={32}/></div>
                                                        <div>
                                                            <h5 className="text-xl font-black text-gray-900 uppercase italic">Bayt AI Engine</h5>
                                                            <span className="px-2 py-0.5 bg-[#00f2ff]/10 text-[#00f2ff] rounded text-[8px] font-black uppercase">Recomendado</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-500 font-medium leading-relaxed italic relative z-10">"La IA analiza el contexto (historial del cliente, hora, precios) y personaliza la acción para maximizar el éxito."</p>
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {wizardStep === 4 && (
                                        <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                                            <div className="max-w-xl">
                                                <h4 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic">Acción de Salida</h4>
                                                <p className="text-gray-500 font-medium mt-2">¿Cuál es el resultado final de este flujo neural?</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                {[
                                                    { id: 'WhatsApp Smart', label: 'WhatsApp Smart', icon: <MessageSquare size={24}/>, color: 'text-emerald-500' },
                                                    { id: 'Generar PO', label: 'Generar PO', icon: <Workflow size={24}/>, color: 'text-blue-500' },
                                                    { id: 'Email Personalizado', label: 'Email Personalizado', icon: <Sparkles size={24}/>, color: 'text-purple-500' },
                                                    { id: 'Crear Ticket', label: 'Crear Ticket', icon: <Settings size={24}/>, color: 'text-amber-500' },
                                                ].map((a) => (
                                                    <button 
                                                        key={a.id}
                                                        onClick={() => setNewFlow({...newFlow, action: a.id})}
                                                        className={`p-8 rounded-[3rem] border-2 transition-all text-left flex flex-col justify-between h-64 group ${newFlow.action === a.id ? 'border-[#004d4d] bg-white shadow-2xl ring-4 ring-[#004d4d]/5' : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm'}`}
                                                    >
                                                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-all ${newFlow.action === a.id ? 'bg-[#004d4d] text-[#00f2ff]' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}>
                                                            <div className={newFlow.action === a.id ? 'text-[#00f2ff]' : a.color}>{a.icon}</div>
                                                        </div>
                                                        <div>
                                                            <h5 className="text-sm font-black text-gray-900 uppercase tracking-tight">{a.label}</h5>
                                                            <p className="text-[10px] text-gray-400 mt-2 font-medium leading-relaxed">Ejecutar protocolo de salida vía {a.label.split(' ')[0]}.</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="bg-gray-900 p-12 rounded-[4rem] text-white relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000"><Bot size={150} /></div>
                                                <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                                                    <div className="flex-1 space-y-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-2 w-2 rounded-full bg-[#00f2ff] animate-ping"></div>
                                                            <span className="text-[10px] font-black uppercase text-[#00f2ff] tracking-[0.3em]">Predicción de Impacto IA</span>
                                                        </div>
                                                        <h5 className="text-3xl font-black italic uppercase italic">Protocolo Listo para Despegue</h5>
                                                        <p className="text-gray-400 text-lg font-medium leading-relaxed italic italic">
                                                            "He analizado tu flujo: **{newFlow.trigger}** + **{newFlow.logic === 'bayt_ai' ? 'Bayt Engine' : 'Lógica Base'}** —&gt; **{newFlow.action}**. Estimo un ahorro operativo de **12 horas semanales**."
                                                        </p>
                                                    </div>
                                                    <button 
                                                        onClick={() => { handleCreateFlow(); setWizardStep(1); }}
                                                        className="px-16 py-8 bg-[#00f2ff] text-gray-900 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] shadow-[0_0_50px_rgba(0,242,255,0.3)] hover:bg-white hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-4"
                                                    >
                                                        <Zap size={24} fill="currentColor"/> Activar Ahora
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="p-8 bg-white border-t border-gray-100 flex justify-between items-center px-16">
                                <button 
                                    onClick={() => wizardStep > 1 && setWizardStep(wizardStep - 1)}
                                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors ${wizardStep === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                                >
                                    Regresar
                                </button>
                                <div className="text-[9px] font-black text-gray-300 uppercase tracking-[0.5em]">
                                    Terminal Neural • Step {wizardStep} of 4
                                </div>
                                <button 
                                    onClick={() => wizardStep < 4 && setWizardStep(wizardStep + 1)}
                                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#004d4d] hover:gap-4 transition-all ${wizardStep === 4 ? 'opacity-0 pointer-events-none' : ''}`}
                                >
                                    Continuar <ArrowRight size={14}/>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedAutomationDetail && renderAutomationDetailModal()}
            </AnimatePresence>

            <AnimatePresence>
                {isDeleteModalOpen && renderDeleteConfirmModal()}
            </AnimatePresence>

            <AutomationsMetricModal 
                isOpen={!!selectedKPI} 
                onClose={() => setSelectedKPI(null)} 
                metric={selectedKPI} 
            />

            <AutomationsInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
            `}</style>
        </div>
    );
}

function Crown(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
        </svg>
    )
}