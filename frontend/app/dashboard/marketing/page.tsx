"use client";

import { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, Target, Zap, X, ArrowUpRight, Mail, Smartphone, MessageSquare, 
  BarChart3, Calendar, ChevronRight, Plus, Rocket, CheckCircle2, PieChart, 
  Eye, MousePointer2, DollarSign, Activity, Users, Share2, Layers, ChevronDown, 
  Clock, Filter, Sparkles, ZapOff, UserCheck, History, ShieldAlert, ZapIcon, Bot,
  Download, ArrowRight, Tag, AlertCircle, Info, Radar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";

export default function MarketingPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    
    // UI State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createStep, setCreateStep] = useState(1);
    const [isAutopilotOpen, setIsAutopilotOpen] = useState(false);
    const [isExecutingAutopilot, setIsExecutingAutopilot] = useState(false);
    const [autopilotStep, setAutopilotStep] = useState(0);
    const [activeView, setActiveView] = useState<'overview' | 'campaigns' | 'automation'>('overview');

    const [campaignForm, setCampaignForm] = useState({
        name: '', 
        objective: 'conversion', 
        channel: 'whatsapp', 
        segment: 'Mujeres 25-34 años', 
        budget: '500000', 
        message: ''
    });
    
    // Date Range State (Sincronizado con estilo Analytics)
    const [startMonth, setStartMonth] = useState('Enero 2026');
    const [endMonth, setEndMonth] = useState('Enero 2026');
    const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);

    const availableMonths = ['Octubre 2025', 'Noviembre 2025', 'Diciembre 2025', 'Enero 2026', 'Febrero 2026', 'Marzo 2026'];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    const handleStartAutopilot = async () => {
        setIsExecutingAutopilot(true);
        const steps = ["Escaneando Radar Live...", "Generando Cupones Inteligentes...", "Personalizando Mensajes AI...", "Iniciando Despliegue..."];
        for (let i = 1; i <= steps.length; i++) {
            setAutopilotStep(i);
            await new Promise(r => setTimeout(r, 1200));
        }
        showToast("¡Estrategia de Marketing desplegada al 100%! 🚀", "success");
        setIsExecutingAutopilot(false);
        setIsAutopilotOpen(false);
        setAutopilotStep(0);
    };

    // --- RENDERS ---

    const renderSummary = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Banner de Inteligencia Publicitaria */}
            <div className="bg-[#004953] p-16 rounded-[4rem] text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-16 shadow-2xl border border-white/5">
                <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(0,242,255,0.08)_0%,_transparent_60%)] animate-pulse"></div>
                <div className="h-32 w-32 bg-gray-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative z-10 border-2 border-[#00F2FF]/50">
                    <Bot size={60} className="text-[#00F2FF] animate-pulse" />
                </div>
                <div className="flex-1 relative z-10 space-y-6">
                    <div>
                        <span className="px-4 py-1.5 bg-[#00F2FF]/10 text-[#00F2FF] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#00F2FF]/20">Bayt Ad-Architect</span>
                        <h3 className="text-4xl font-black tracking-tight italic mt-4 uppercase">Centro de Comando de Crecimiento</h3>
                        <p className="text-gray-300 text-lg font-medium max-w-3xl leading-relaxed mt-4 italic">
                            "He detectado un pico de tráfico móvil del <span className="text-[#00F2FF] font-black underline italic">82%</span>. Basado en el abandono de checkout (61%) reportado en analítica, sugiero lanzar una campaña de **Envío Gratis** hoy a las 7:45 PM para capturar la Hora de Oro."
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsAutopilotOpen(true)} className="px-10 py-5 bg-[#00F2FF] text-gray-900 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-white transition-all active:scale-95 flex items-center gap-2">
                            <ZapIcon size={16}/> Ejecutar Autopilot AI
                        </button>
                        <button className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 backdrop-blur-md transition-all">
                            Ver Predicciones de ROI
                        </button>
                    </div>
                </div>
                <div className="absolute -right-20 -bottom-20 text-[20rem] font-black opacity-[0.03] rotate-12 pointer-events-none uppercase">GROWTH</div>
            </div>

            {/* KPIs de Performance */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Revenue Atribuido', val: 28500000, trend: '+12%', up: true },
                    { label: 'Costo por Adquisición', val: 4500, trend: '-8%', up: true },
                    { label: 'Conversión de Campañas', val: '8.4%', trend: '+1.2%', up: true },
                    { label: 'ROI Promedio', val: '5.2x', trend: 'Estable', up: true },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm relative group transition-all hover:shadow-xl">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                        <div className="flex items-end gap-3 mt-4">
                            <h3 className="text-2xl font-black text-gray-900 italic tracking-tight">{typeof kpi.val === 'number' ? formatCurrency(kpi.val) : kpi.val}</h3>
                            <div className={`text-[10px] font-black mb-1 ${kpi.up ? 'text-emerald-500' : 'text-rose-500'}`}>{kpi.trend}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Radar de Oportunidades Live */}
                <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10 relative overflow-hidden group">
                    <div className="flex justify-between items-center relative z-10">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                            <Radar size={18} className="text-purple-600 animate-spin-slow" /> Radar de Oportunidades
                        </h4>
                        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    </div>
                    
                    <div className="space-y-6 relative z-10">
                        {[
                            { name: "Recuperación de Carrito", opportunity: 4200000, count: "128 clientes", color: "bg-purple-600" },
                            { name: "Upselling Ganadores", opportunity: 8500000, count: "Top 5 productos", color: "bg-emerald-500" },
                            { name: "Reactivación de Inactivos", opportunity: 3200000, count: "450 usuarios", color: "bg-blue-500" }
                        ].map((item, i) => (
                            <div key={i} className="space-y-3 group/item">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-black text-gray-900 uppercase italic">{item.name}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{item.count}</p>
                                    </div>
                                    <p className="text-xs font-black text-gray-900">+{formatCurrency(item.opportunity)}</p>
                                </div>
                                <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className={`h-full ${item.color}`} transition={{ duration: 2, delay: i * 0.2 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Arquitecto de Mensajes AI */}
                <div className="lg:col-span-2 bg-[#004953] p-12 rounded-[3.5rem] text-white space-y-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 text-8xl opacity-5 font-black uppercase pointer-events-none">AD-AI</div>
                    <div className="flex justify-between items-center relative z-10">
                        <h4 className="text-sm font-black uppercase tracking-[0.2em] italic text-[#00F2FF]">Campaña Sugerida por Bayt</h4>
                        <Sparkles size={20} className="text-[#00F2FF]" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                        <div className="space-y-6">
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-[9px] font-black text-[#00F2FF] uppercase tracking-widest mb-4">Canal & Segmento</p>
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center"><MessageSquare size={20}/></div>
                                    <div><p className="text-xs font-black italic">WhatsApp Direct</p><p className="text-[8px] font-bold text-gray-400 uppercase">Mujeres 25-34 años</p></div>
                                </div>
                            </div>
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-[9px] font-black text-[#00F2FF] uppercase tracking-widest mb-4">Copia Sugerida por IA</p>
                                <p className="text-xs font-medium text-gray-300 italic leading-relaxed">"Hola [Nombre], hemos notado tu interés. Hoy el envío de tu Kit Pro corre por nuestra cuenta hasta las 10 PM. ¡No lo dejes escapar!"</p>
                            </div>
                        </div>
                        <div className="flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex justify-between text-[10px] font-black uppercase"><span>ROI Proyectado</span><span className="text-[#00F2FF]">420%</span></div>
                                <div className="flex justify-between text-[10px] font-black uppercase"><span>CTR Estimado</span><span className="text-[#00F2FF]">12.4%</span></div>
                                <div className="flex justify-between text-[10px] font-black uppercase"><span>Ventas Esperadas</span><span className="text-[#00F2FF]">+ $4.2M</span></div>
                            </div>
                            <button className="w-full py-5 bg-white text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-[#00F2FF] transition-all active:scale-95">Lanzar Campaña Ahora</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-500">
            {/* Header Global Sincronizado */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="h-20 w-20 bg-gray-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative">
                        <Rocket className="text-white" size={36} />
                        <div className="absolute -top-2 -right-2 h-8 w-8 bg-[#00F2FF] rounded-xl flex items-center justify-center text-gray-900 border-4 border-gray-50 shadow-lg animate-pulse">
                            <Zap size={14} fill="currentColor" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight italic uppercase">Marketing <span className="text-purple-600">Pro</span></h1>
                        <p className="text-gray-500 mt-1 font-medium">Arquitectura de Crecimiento Bayup</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative">
                    <div className="relative">
                        <button 
                            onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                            className="flex items-center bg-white p-2 rounded-3xl border border-gray-100 shadow-sm h-16 px-6 hover:border-purple-200 transition-all active:scale-95 group"
                        >
                            <Calendar size={18} className="text-purple-600 mr-4" />
                            <div className="flex flex-col items-start">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Periodo Auditoría</span>
                                <span className="text-[10px] font-black text-gray-900 uppercase">{startMonth} - {endMonth}</span>
                            </div>
                            <ChevronDown size={16} className={`text-gray-300 ml-4 transition-transform duration-300 ${isPeriodDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isPeriodDropdownOpen && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full right-0 mt-3 bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 z-[600] min-w-[450px]">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Mes de Inicio</p>
                                            <div className="space-y-1">
                                                {availableMonths.map((m) => (
                                                    <button key={`start-${m}`} onClick={() => setStartMonth(m)} className={`w-full px-4 py-2.5 text-left text-[10px] font-black uppercase rounded-xl transition-all ${startMonth === m ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>{m}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-4 border-l border-gray-50 pl-8">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span> Mes de Cierre</p>
                                            <div className="space-y-1">
                                                {availableMonths.map((m) => (
                                                    <button key={`end-${m}`} onClick={() => setEndMonth(m)} className={`w-full px-4 py-2.5 text-left text-[10px] font-black uppercase rounded-xl transition-all ${endMonth === m ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>{m}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-gray-50 flex justify-end">
                                        <button onClick={() => setIsPeriodDropdownOpen(false)} className="px-8 py-3 bg-purple-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95">Aplicar Filtro</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button className="h-16 bg-gray-900 text-white px-8 rounded-3xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 border border-white/10 active:scale-95 transition-all shadow-xl"><Download size={18} /> Reporte Marketing</button>
                </div>
            </div>

            {/* Navegación de Vistas */}
            <div className="flex items-center justify-center pt-2">
                <div className="flex bg-white/50 backdrop-blur-2xl p-2 rounded-[2.5rem] border border-gray-100 shadow-xl gap-2 w-full max-w-4xl">
                    {[
                        { id: 'overview', label: 'Centro de Inteligencia', icon: <PieChart size={16}/> },
                        { id: 'campaigns', label: 'Arquitectura de Campañas', icon: <Layers size={16}/> },
                        { id: 'automation', label: 'Estrategias Automatizadas', icon: <Zap size={16}/> },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveView(tab.id as any)} className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeView === tab.id ? 'bg-gray-900 text-white shadow-2xl scale-[1.02]' : 'text-gray-400 hover:text-gray-600 hover:bg-white/80'}`}>{tab.icon} {tab.label}</button>
                    ))}
                </div>
            </div>

            {/* Contenido de la Vista */}
            <div className="min-h-[600px]">
                {activeView === 'overview' && renderSummary()}
                {activeView === 'campaigns' && (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        {/* Gestor de Campañas */}
                        <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm text-center space-y-6">
                            <Layers size={48} className="mx-auto text-gray-200" />
                            <h3 className="text-xl font-black text-gray-900 uppercase italic">Arquitectura de Campañas Bayup</h3>
                            <p className="text-gray-400 text-sm max-w-md mx-auto">Diseña y supervisa tus estrategias manuales con integración directa a canales de alto impacto.</p>
                            <button onClick={() => setIsCreateModalOpen(true)} className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-3 mx-auto">
                                <Plus size={16}/> Nueva Estrategia
                            </button>
                        </div>

                        {/* Bóveda de Éxitos */}
                        <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                <div>
                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                                        <History size={18} className="text-purple-600" /> Bóveda de Campañas Exitosas
                                    </h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Archivo histórico de estrategias con ROI positivo</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Optimizado por Bayt</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-50">
                                    <thead>
                                        <tr className="bg-white">
                                            <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estrategia</th>
                                            <th className="px-10 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Canal</th>
                                            <th className="px-10 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Efectividad</th>
                                            <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Revenue</th>
                                            <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 bg-white">
                                        {[
                                            { name: "Flash Sale Febrero", channel: "WhatsApp", rate: "92%", rev: 15400000, roi: "+420%", icon: <MessageSquare size={14}/> },
                                            { name: "Recuperación VIP", channel: "Email", rate: "45%", rev: 8900000, roi: "+580%", icon: <Mail size={14}/> },
                                            { name: "Promo Fin de Mes", channel: "WhatsApp", rate: "88%", rev: 12200000, roi: "+310%", icon: <MessageSquare size={14}/> }
                                        ].map((item, i) => (
                                            <tr key={i} className="hover:bg-gray-50/50 group transition-all">
                                                <td className="px-10 py-8">
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900 group-hover:text-purple-600 transition-colors uppercase italic">{item.name}</p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">ROI Logrado: <span className="text-emerald-500">{item.roi}</span></p>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    <div className="flex items-center justify-center gap-2 px-3 py-1 bg-gray-100 rounded-full inline-flex mx-auto">
                                                        {item.icon}
                                                        <span className="text-[9px] font-black uppercase text-gray-600">{item.channel}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-black text-gray-900">{item.rate}</p>
                                                        <div className="w-20 bg-gray-100 h-1 rounded-full overflow-hidden mx-auto">
                                                            <div className="bg-purple-600 h-full" style={{ width: item.rate }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <p className="text-sm font-black text-gray-900">{formatCurrency(item.rev)}</p>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <button className="h-10 px-6 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl active:scale-95 flex items-center gap-2 ml-auto">
                                                        <ZapIcon size={12} fill="currentColor"/> Replicar Éxito
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                {activeView === 'automation' && (
                    <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm text-center space-y-6">
                        <Zap size={48} className="mx-auto text-gray-200" />
                        <h3 className="text-xl font-black text-gray-900 uppercase italic">Automatizaciones de Crecimiento</h3>
                        <p className="text-gray-400 text-sm max-w-md mx-auto">Configura reglas automáticas que disparan cupones cuando un cliente abandona el carrito o llega a su cumpleaños.</p>
                        <button onClick={() => setIsAutopilotOpen(true)} className="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Activar Reglas AI</button>
                    </div>
                )}
            </div>

            {/* MODAL: ESTUDIO DE ARQUITECTURA DE CAMPAÑAS (PROFESIONAL) */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-5xl rounded-[4rem] shadow-2xl overflow-hidden relative border border-white/20 flex flex-col max-h-[90vh]">
                            {/* Cabecera del Estudio */}
                            <div className="bg-gray-900 p-10 text-white relative flex-shrink-0">
                                <button onClick={() => { setIsCreateModalOpen(false); setCreateStep(1); }} className="absolute top-8 right-8 h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all"><X size={24} /></button>
                                <div className="flex items-center gap-8">
                                    <div className="h-20 w-20 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-[2.2rem] flex items-center justify-center shadow-2xl border-2 border-white/10">
                                        <Layers size={36} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-3xl font-black tracking-tighter uppercase italic">Estudio de Arquitectura</h2>
                                            <span className="px-3 py-1 bg-[#00F2FF]/20 text-[#00F2FF] rounded-full text-[8px] font-black uppercase tracking-widest border border-[#00F2FF]/30">Pro Mode</span>
                                        </div>
                                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                                            <Sparkles size={12} className="text-amber-400" /> Diseño de Estrategia de Alto Impacto
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Cuerpo con Stepper */}
                            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                                {/* Navegación de Pasos (Izquierda) */}
                                <div className="w-full md:w-72 bg-gray-50/50 p-10 border-r border-gray-100 space-y-8 flex-shrink-0">
                                    {[
                                        { s: 1, l: 'Objetivo', d: 'Meta de negocio', icon: <Target size={14}/> },
                                        { s: 2, l: 'Audiencia', d: 'Segmentación AI', icon: <Users size={14}/> },
                                        { s: 3, l: 'Creatividad', d: 'Copia & Canal', icon: <Share2 size={14}/> },
                                        { s: 4, l: 'Presupuesto', d: 'ROI & Timing', icon: <DollarSign size={14}/> }
                                    ].map((step) => (
                                        <div key={step.s} className={`flex items-start gap-4 transition-all ${createStep >= step.s ? 'opacity-100' : 'opacity-30'}`}>
                                            <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs ${createStep === step.s ? 'bg-purple-600 text-white shadow-lg' : createStep > step.s ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                {createStep > step.s ? <CheckCircle2 size={16}/> : step.s}
                                            </div>
                                            <div>
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${createStep === step.s ? 'text-gray-900' : 'text-gray-400'}`}>{step.l}</p>
                                                <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">{step.d}</p>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="pt-10">
                                        <div className="p-6 bg-gray-900 rounded-[2rem] text-white space-y-4 relative overflow-hidden group">
                                            <div className="absolute -right-4 -bottom-4 opacity-5"><Bot size={80}/></div>
                                            <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Bayt AI Tip</p>
                                            <p className="text-[10px] font-medium text-gray-300 italic leading-relaxed relative z-10">
                                                {createStep === 1 && '"La conversión en móviles es del 82%. Enfoca tu objetivo en optimizar el checkout."'}
                                                {createStep === 2 && '"El segmento 25-34 años tiene el 65% de tus ventas reales hoy."'}
                                                {createStep === 3 && '"WhatsApp tiene una tasa de apertura del 92% frente al 45% de Email."'}
                                                {createStep === 4 && '"Programa el inicio a las 7:45 PM para capturar el pico nocturno."'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Formulario Dinámico (Derecha) */}
                                <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-white">
                                    <AnimatePresence mode="wait">
                                        <motion.div key={createStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                            
                                            {createStep === 1 && (
                                                <div className="space-y-8">
                                                    <div className="space-y-2">
                                                        <h4 className="text-xl font-black text-gray-900 italic uppercase">¿Cuál es tu objetivo hoy?</h4>
                                                        <p className="text-xs text-gray-400 font-medium">Bayt optimizará los algoritmos según esta elección.</p>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {[
                                                            { id: 'conversion', l: 'Maximizar Conversión', d: 'Enfoque en cerrar ventas inmediatas.', icon: <Target className="text-rose-500"/> },
                                                            { id: 'traffic', l: 'Generar Tráfico', d: 'Atraer nuevos usuarios al catálogo.', icon: <Rocket className="text-blue-500"/> },
                                                            { id: 'retention', l: 'Fidelizar Clientes', d: 'Reactivar compradores recurrentes.', icon: <UserCheck className="text-emerald-500"/> },
                                                            { id: 'stuck', l: 'Liquidar Stock', d: 'Mover inventario estancado (Stuck).', icon: <AlertCircle className="text-amber-500"/> }
                                                        ].map((obj) => (
                                                            <div key={obj.id} onClick={() => setCampaignForm({...campaignForm, objective: obj.id})} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${campaignForm.objective === obj.id ? 'bg-purple-50 border-purple-600 shadow-md' : 'bg-white border-gray-100 opacity-60 hover:opacity-100'}`}>
                                                                <div className="flex items-center gap-4 mb-3">
                                                                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center">{obj.icon}</div>
                                                                    <p className="text-xs font-black text-gray-900 uppercase">{obj.l}</p>
                                                                </div>
                                                                <p className="text-[10px] text-gray-500 leading-relaxed">{obj.d}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {createStep === 2 && (
                                                <div className="space-y-8">
                                                    <div className="space-y-2">
                                                        <h4 className="text-xl font-black text-gray-900 italic uppercase">Segmentación Quirúrgica</h4>
                                                        <p className="text-xs text-gray-400 font-medium">Audiencias detectadas mediante patrones de comportamiento.</p>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {[
                                                            { l: 'Mujeres 25-34 años', d: 'Tu motor financiero (65% de ventas).', p: '2,450 perfiles' },
                                                            { l: 'Abandonaron hoy', d: 'Usuarios con alta intención de compra.', p: '128 perfiles' },
                                                            { l: 'Clientes VIP', d: 'LTV superior a $1.2M.', p: '450 perfiles' }
                                                        ].map((seg) => (
                                                            <div key={seg.l} onClick={() => setCampaignForm({...campaignForm, segment: seg.l})} className={`flex items-center justify-between p-6 rounded-3xl border-2 cursor-pointer transition-all ${campaignForm.segment === seg.l ? 'bg-purple-50 border-purple-600' : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}>
                                                                <div className="flex items-center gap-6">
                                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${campaignForm.segment === seg.l ? 'bg-purple-600 text-white' : 'bg-white text-gray-400'}`}><UserCheck size={18}/></div>
                                                                    <div><p className="text-xs font-black text-gray-900 uppercase">{seg.l}</p><p className="text-[10px] text-gray-500">{seg.d}</p></div>
                                                                </div>
                                                                <span className="text-[9px] font-black text-gray-400 uppercase">{seg.p}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {createStep === 3 && (
                                                <div className="space-y-8">
                                                    <div className="space-y-2">
                                                        <h4 className="text-xl font-black text-gray-900 italic uppercase">Creatividad & Canal</h4>
                                                        <p className="text-xs text-gray-400 font-medium">Elige cómo y qué quieres comunicar.</p>
                                                    </div>
                                                    <div className="flex gap-4">
                                                        {[
                                                            { id: 'whatsapp', l: 'WhatsApp', i: <MessageSquare size={16}/> },
                                                            { id: 'email', l: 'Email Pro', i: <Mail size={16}/> },
                                                            { id: 'ads', l: 'Meta Ads', i: <Smartphone size={16}/> }
                                                        ].map((c) => (
                                                            <button key={c.id} onClick={() => setCampaignForm({...campaignForm, channel: c.id})} className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase transition-all ${campaignForm.channel === c.id ? 'bg-gray-900 text-white shadow-xl' : 'bg-gray-100 text-gray-400'}`}>{c.i} {c.l}</button>
                                                        ))}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Copia del Mensaje (Sugerido por Bayt)</label>
                                                        <textarea value={campaignForm.message} onChange={(e) => setCampaignForm({...campaignForm, message: e.target.value})} rows={4} className="w-full p-6 bg-gray-50 rounded-[2rem] border border-transparent focus:border-purple-200 outline-none transition-all text-sm font-medium italic" placeholder="Redactando mensaje de alto impacto..."/>
                                                    </div>
                                                </div>
                                            )}

                                            {createStep === 4 && (
                                                <div className="space-y-8">
                                                    <div className="space-y-2">
                                                        <h4 className="text-xl font-black text-gray-900 italic uppercase">Inversión & Retorno</h4>
                                                        <p className="text-xs text-gray-400 font-medium">Configura el combustible para tu estrategia.</p>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-4">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Presupuesto Diario</label>
                                                            <div className="relative">
                                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black">$</span>
                                                                <input type="text" value={campaignForm.budget} onChange={(e) => setCampaignForm({...campaignForm, budget: e.target.value})} className="w-full pl-12 p-5 bg-gray-50 rounded-2xl outline-none font-black text-gray-900 shadow-inner text-xl" />
                                                            </div>
                                                        </div>
                                                        <div className="p-8 bg-[#004953] rounded-[2.5rem] text-white flex flex-col justify-between">
                                                            <p className="text-[9px] font-black text-[#00F2FF] uppercase tracking-[0.2em]">ROI Proyectado</p>
                                                            <div className="mt-4">
                                                                <h3 className="text-4xl font-black italic">5.8x</h3>
                                                                <p className="text-[10px] text-gray-400 mt-1">Ingreso estimado: {formatCurrency(parseInt(campaignForm.budget) * 5.8)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Footer de Acciones */}
                            <div className="p-10 bg-white border-t border-gray-100 flex justify-between items-center flex-shrink-0">
                                <button 
                                    onClick={() => createStep > 1 && setCreateStep(createStep - 1)}
                                    disabled={createStep === 1}
                                    className="px-10 py-5 text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 disabled:opacity-0 transition-all"
                                >
                                    Atrás
                                </button>
                                <div className="flex gap-4">
                                    {createStep < 4 ? (
                                        <button 
                                            onClick={() => setCreateStep(createStep + 1)}
                                            className="px-12 py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all"
                                        >
                                            Siguiente Paso
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                showToast("Estrategia enviada a los canales de despliegue 🚀", "success");
                                                setIsCreateModalOpen(false);
                                                setCreateStep(1);
                                            }}
                                            className="px-12 py-5 bg-[#00F2FF] text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(0,242,255,0.3)] active:scale-95 transition-all"
                                        >
                                            Lanzar Estrategia
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}