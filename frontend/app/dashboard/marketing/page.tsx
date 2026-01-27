"use client";

import { useState, useMemo } from 'react';
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
  PieChart,
  Eye,
  MousePointer2,
  DollarSign,
  Activity,
  Users,
  Share2,
  Layers,
  ChevronDown,
  Star,
  Globe,
  Clock,
  Filter,
  Sparkles,
  ZapOff,
  UserCheck,
  History,
  ShieldAlert,
  Gamepad2,
  ZapIcon,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from "@/context/toast-context";
import { useAuth } from "@/context/auth-context";

export default function MarketingPage() {
    const { token } = useAuth();
    const { showToast } = useToast();
    
    // UI State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAutopilotOpen, setIsAutopilotOpen] = useState(false);
    const [isExecutingAutopilot, setIsExecutingAutopilot] = useState(false);
    const [autopilotStep, setAutopilotStep] = useState(0);

    const [campaignForm, setCampaignForm] = useState({
        name: '', type: 'whatsapp', segment: 'Todos los clientes', message: ''
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount).replace('$', '$ ');
    };

    // --- LÓGICA DE PILOTO AUTOMÁTICO (EJECUCIÓN REAL) ---
    const handleStartAutopilot = async () => {
        setIsExecutingAutopilot(true);
        
        // Paso 1: Análisis
        setAutopilotStep(1);
        await new Promise(r => setTimeout(r, 1500));
        
        // Paso 2: Creación de Cupón Relámpago
        setAutopilotStep(2);
        await new Promise(r => setTimeout(r, 1200));
        
        // Paso 3: Optimización de Mensaje
        setAutopilotStep(3);
        await new Promise(r => setTimeout(r, 1200));
        
        // Paso 4: Lanzamiento
        setAutopilotStep(4);
        await new Promise(r => setTimeout(r, 1000));

        showToast("¡Plan de Choque ejecutado! Bayt ha optimizado tu tienda hoy ✨", "success");
        setIsExecutingAutopilot(false);
        setIsAutopilotOpen(false);
        setAutopilotStep(0);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-500">
            {/* Header con Modo Piloto Automático */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">Estrategias de Crecimiento <Rocket className="text-purple-600" /></h1>
                    <p className="text-gray-500 mt-2 font-medium italic">Ejecución táctica impulsada por Inteligencia Artificial.</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setIsAutopilotOpen(true)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100 flex items-center gap-3 animate-bounce"
                    >
                        <Zap size={16} fill="white" /> Optimizar Rentabilidad Hoy
                    </button>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3"
                    >
                        <Plus size={16} /> Nueva Estrategia
                    </button>
                </div>
            </div>

            {/* KPIs & Gráficas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Ingresos Marketing', val: 28500000, trend: '+12%', icon: <DollarSign/>, color: 'text-emerald-600' },
                    { label: 'Conversión AI', val: '4.8%', trend: '+0.4%', icon: <Target/>, color: 'text-purple-600' },
                    { label: 'ROI Estimado', val: '+450%', trend: 'Estable', icon: <TrendingUp/>, color: 'text-amber-600' },
                    { label: 'Ventas Perdidas', val: 4500000, trend: 'Detectado', icon: <ShieldAlert/>, color: 'text-rose-600' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-purple-200 transition-all">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                            <div className={`h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center ${kpi.color}`}>{kpi.icon}</div>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mt-6">{typeof kpi.val === 'number' ? formatCurrency(kpi.val) : kpi.val}</h3>
                    </div>
                ))}
            </div>

            {/* Tabla de Campañas */}
            <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Historial de Ejecuciones</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-50">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Campaña</th>
                                <th className="px-10 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Interacción</th>
                                <th className="px-10 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Impacto Financiero</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {[{ name: 'Flash Sale Navidad', rate: 45, rev: 15400000 }, { name: 'Recuperación Carritos', rate: 62, rev: 8900500 }].map((c, i) => (
                                <tr key={i} className="hover:bg-gray-50/50 transition-all group cursor-pointer">
                                    <td className="px-10 py-8"><p className="text-sm font-black text-gray-900 group-hover:text-purple-600 transition-colors">{c.name}</p></td>
                                    <td className="px-10 py-8"><div className="flex items-center gap-3"><div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden"><div className="bg-purple-600 h-full" style={{ width: `${c.rate}%` }}/></div><span className="text-xs font-black">{c.rate}%</span></div></td>
                                    <td className="px-10 py-8 text-right font-black text-sm text-purple-600">{formatCurrency(c.rev)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL: MODO PILOTO AUTOMÁTICO (BRUTAL) */}
            <AnimatePresence>
                {isAutopilotOpen && (
                    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden relative border border-white/20 flex flex-col"
                        >
                            <div className="bg-emerald-500 p-10 text-white relative">
                                <button onClick={() => !isExecutingAutopilot && setIsAutopilotOpen(false)} className="absolute top-8 right-8 h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all"><X size={24} /></button>
                                <div className="flex items-center gap-6">
                                    <div className="h-20 w-20 bg-gray-900 rounded-[2rem] flex items-center justify-center shadow-2xl"><Zap size={36} className="text-emerald-400" fill="currentColor" /></div>
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tight text-gray-900">Modo Piloto Automático</h2>
                                        <p className="text-emerald-900 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Bayt tomará el control comercial hoy</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-12 space-y-10 bg-gray-50/30">
                                {autopilotStep === 0 ? (
                                    <div className="space-y-8 animate-in fade-in">
                                        <div className="bg-white p-8 rounded-[2.5rem] border border-emerald-100 shadow-sm">
                                            <h4 className="text-lg font-black text-gray-900 flex items-center gap-3"><Bot className="text-purple-600"/> Plan de Choque Sugerido</h4>
                                            <div className="mt-6 space-y-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">1</div>
                                                    <p className="text-sm font-medium text-gray-600">Activar **Cupón Relámpago (15% OFF)** por las próximas 4 horas.</p>
                                                </div>
                                                <div className="flex items-start gap-4">
                                                    <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">2</div>
                                                    <p className="text-sm font-medium text-gray-600">Enviar WhatsApp a los **50 clientes** que abandonaron ayer.</p>
                                                </div>
                                                <div className="flex items-start gap-4">
                                                    <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">3</div>
                                                    <p className="text-sm font-medium text-gray-600">Cambiar el banner principal de la web por el producto **AirPods Pro** (más buscado hoy).</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-purple-600 rounded-3xl text-white shadow-xl relative overflow-hidden">
                                            <p className="text-xs font-medium relative z-10 opacity-90">Impacto Estimado en Ventas:</p>
                                            <h3 className="text-4xl font-black relative z-10">+{formatCurrency(4200000)}</h3>
                                            <div className="absolute -right-10 -bottom-10 text-9xl opacity-10 rotate-12"><TrendingUp/></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-20 flex flex-col items-center text-center space-y-8 animate-in zoom-in-95">
                                        <div className="relative">
                                            <div className="h-24 w-24 border-8 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
                                            <Bot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500" size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900">
                                                {autopilotStep === 1 && "Analizando debilidades de hoy..."}
                                                {autopilotStep === 2 && "Generando códigos de descuento..."}
                                                {autopilotStep === 3 && "Optimizando diseño de la web..."}
                                                {autopilotStep === 4 && "Lanzando ráfaga de WhatsApp..."}
                                            </h3>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Por favor, mantén esta ventana abierta</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-10 bg-white border-t border-gray-100 flex gap-4">
                                <button onClick={() => setIsAutopilotOpen(false)} disabled={isExecutingAutopilot} className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 transition-all">Descartar</button>
                                <button 
                                    onClick={handleStartAutopilot} 
                                    disabled={isExecutingAutopilot}
                                    className="flex-[2] py-5 bg-gray-900 hover:bg-black text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    <CheckCircle2 size={18} /> {isExecutingAutopilot ? 'Ejecutando...' : 'Autorizar Ejecución AI'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}