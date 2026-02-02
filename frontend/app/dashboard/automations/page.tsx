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
  Medal
} from 'lucide-react';
import { useToast } from "@/context/toast-context";

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

export default function AutomationsPage() {
    const { showToast } = useToast();
    const [automations, setAutomations] = useState<Automation[]>(INITIAL_AUTOMATIONS);
    const [activeTab, setActiveTab] = useState<'mis_flujos' | 'recetas' | 'historial'>('mis_flujos');
    const [isCreatingFlow, setIsCreatingFlow] = useState(false);
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
        setAutomations(automations.map(a => 
            a.id === id ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' } : a
        ));
        showToast("Estado de flujo actualizado", "success");
    };

    const handleCreateFlow = async () => {
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

        setAutomations([...automations, automation]);
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
                <motion.div key={i} whileHover={{ y: -5, scale: 1.02 }} className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/80 shadow-sm flex flex-col justify-between group transition-all">
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
                </motion.div>
            ))}
        </div>
    );

    const renderFlowCard = (auto: Automation) => (
        <motion.div 
            key={auto.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-2xl transition-all relative overflow-hidden ${auto.status === 'inactive' ? 'opacity-60' : ''}`}
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
                    <button 
                        onClick={() => toggleStatus(auto.id)}
                        className={`w-14 h-7 rounded-full relative transition-all duration-500 ${auto.status === 'active' ? 'bg-emerald-500' : 'bg-gray-200'}`}
                    >
                        <motion.div 
                            animate={{ x: auto.status === 'active' ? 28 : 4 }}
                            className="absolute top-1 h-5 w-5 bg-white rounded-full shadow-sm"
                        />
                    </button>
                </div>

                <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">{auto.name}</h3>
                    <p className="text-sm font-medium text-gray-500 mt-4 leading-relaxed italic">"{auto.description}"</p>
                </div>

                {/* Diagrama de Conexión Neural */}
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
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Impacto</p>
                    <p className="text-lg font-black text-emerald-600">{auto.stats.revenue_impact > 0 ? `+${formatCurrency(auto.stats.revenue_impact)}` : 'Optimización'}</p>
                </div>
                <div className="text-right flex items-center justify-end gap-2">
                    <button className="h-10 w-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-[#004d4d] hover:text-white transition-all"><Settings2 size={16}/></button>
                    <button className="h-10 w-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="max-w-[1600px] mx-auto pb-32 space-y-12 animate-in fade-in duration-1000">
            
            {/* Header Maestro */}
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

            {/* Menú Flotante Central */}
            <div className="flex items-center justify-center gap-6 shrink-0 relative z-20">
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
                                    { title: 'Cobro de Cartera Persuasivo', desc: 'Bayt analiza la confianza del cliente y redacta un mensaje de cobro único para facturas vencidas.', icon: <Scale /> },
                                    { title: 'Incentivo por Fidelidad', desc: 'Al llegar a 10 compras, Bayt activa una campaña de Marketing exclusiva para ese cliente.', icon: <Crown /> }
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

            {/* Banner de Impacto Final */}
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

            {/* Modal Crear Flujo */}
            <AnimatePresence>
                {isCreatingFlow && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreatingFlow(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 relative z-10 border border-white overflow-hidden">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-12 w-12 bg-[#004d4d]/5 text-[#004d4d] rounded-2xl flex items-center justify-center shadow-inner"><Workflow size={24}/></div>
                                <div><h3 className="text-xl font-black text-gray-900 uppercase italic">Configurar Flujo Neural</h3><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">IA Decision-Making Engine</p></div>
                            </div>
                            
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre del Flujo</label>
                                    <input 
                                        autoFocus
                                        type="text" 
                                        value={newFlow.name} 
                                        onChange={(e) => setNewFlow({...newFlow, name: e.target.value})}
                                        placeholder="Ej: Reactivación de Clientes Inactivos"
                                        className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner transition-all" 
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Disparador (Trigger)</label>
                                        <select 
                                            value={newFlow.trigger} 
                                            onChange={(e) => setNewFlow({...newFlow, trigger: e.target.value})}
                                            className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner transition-all appearance-none"
                                        >
                                            <option>Carrito Abandonado</option>
                                            <option>Stock Crítico</option>
                                            <option>Registro Nuevo</option>
                                            <option>Factura Vencida</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Acción Ejecutiva</label>
                                        <select 
                                            value={newFlow.action} 
                                            onChange={(e) => setNewFlow({...newFlow, action: e.target.value})}
                                            className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#004d4d] outline-none text-sm font-bold shadow-inner transition-all appearance-none"
                                        >
                                            <option>WhatsApp Smart</option>
                                            <option>Generar PO</option>
                                            <option>Email Personalizado</option>
                                            <option>Crear Ticket</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="p-6 bg-[#001a1a] rounded-[2.5rem] text-white flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center"><Bot size={20} className="text-[#00f2ff]"/></div>
                                        <div><p className="text-xs font-black uppercase tracking-widest">Lógica Bayt AI</p><p className="text-[9px] text-white/40">Habilitar análisis inteligente</p></div>
                                    </div>
                                    <div 
                                        onClick={() => setNewFlow({...newFlow, logic: newFlow.logic === 'bayt_ai' ? 'static' : 'bayt_ai'})}
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full cursor-pointer px-1 transition-all ${newFlow.logic === 'bayt_ai' ? 'bg-[#00f2ff]' : 'bg-white/10'}`}
                                    >
                                        <div className={`h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${newFlow.logic === 'bayt_ai' ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 pt-4">
                                    <button onClick={handleCreateFlow} disabled={!newFlow.name.trim()} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                                        <Zap size={18} className="text-[#00f2ff]"/> Activar Flujo Neural
                                    </button>
                                    <button onClick={() => setIsCreatingFlow(false)} className="w-full py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-all">Cancelar</button>
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

function Crown(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
        </svg>
    )
}
