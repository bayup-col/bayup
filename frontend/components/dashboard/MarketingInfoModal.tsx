"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Rocket, 
  TrendingUp, 
  Target, 
  Zap, 
  Sparkles, 
  Smartphone,
  BarChart3,
  Globe,
  LayoutGrid,
  Activity,
  DollarSign,
  PieChart,
  Users,
  MousePointer2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Lightbulb
} from "lucide-react";
import { useState } from "react";

interface MarketingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MarketingInfoModal({ isOpen, onClose }: MarketingInfoModalProps) {
  const [activeGuideTab, setActiveGuideTab] = useState('todos');

  const guideContent: any = {
    todos: {
        title: 'Visión 360° Marketing',
        icon: <LayoutGrid size={20}/>,
        color: 'text-[#004d4d]',
        bgColor: 'bg-[#004d4d]/5',
        description: 'Tu centro de inteligencia donde convergen todas las acciones de crecimiento de Bayup.',
        strategy: 'La rentabilidad no viene de un solo canal, sino de la sinergia entre ellos. Aquí monitoreas el ROAS global y la salud de tu embudo de ventas.',
        kpis: [
            { label: 'Ventas Totales', value: '$ 12.4M', sub: 'Atribuido', icon: <DollarSign size={12}/> },
            { label: 'ROAS Global', value: '4.8x', sub: 'Promedio', icon: <Activity size={12}/> }
        ],
        whyItMatters: 'Permite identificar fugas de capital en tiempo real y reasignar presupuesto a los canales que realmente están convirtiendo.',
        baytTip: "Un ROAS de 4.8x es excelente, pero el 15% de tu presupuesto se está perdiendo en clics sin compra en Desktop. Fomenta el tráfico mobile."
    },
    campañas: {
        title: 'Gestión Estratégica',
        icon: <Target size={20}/>,
        color: 'text-rose-500',
        bgColor: 'bg-rose-500/5',
        description: 'Control maestro de tus iniciativas publicitarias activas, pausadas y programadas.',
        strategy: 'Cada campaña debe tener un objetivo único: Conversión, Fidelización o Liquidación. Mezclar objetivos suele diluir el ROI.',
        kpis: [
            { label: 'Activas', value: '08', sub: 'En curso', icon: <Rocket size={12}/> },
            { label: 'CTR Promedio', value: '3.2%', sub: 'Efectividad', icon: <MousePointer2 size={12}/> }
        ],
        whyItMatters: 'Sin un historial de campañas claro, es imposible replicar el éxito. Aquí guardamos la "receta" de lo que te hace ganar dinero.',
        baytTip: "Tus campañas de 'Liquidación' funcionan mejor los domingos. Programa tus próximos lanzamientos para las 19:00 PM."
    },
    canales: {
        title: 'Optimización Omnicanal',
        icon: <Globe size={20}/>,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/5',
        description: 'Análisis comparativo de rendimiento entre WhatsApp, Instagram, Web y Marketplaces.',
        strategy: 'No todos los canales sirven para lo mismo. WhatsApp es para cierre (conversión), Instagram para descubrimiento (alcance).',
        kpis: [
            { label: 'WhatsApp', value: '42%', sub: 'Cierre', icon: <PieChart size={12}/> },
            { label: 'Web Shop', value: '38%', sub: 'Tráfico', icon: <Globe size={12}/> }
        ],
        whyItMatters: 'Te ayuda a entender dónde está tu cliente ideal. Si el 82% usa Mobile, tu comunicación debe ser corta y visual.',
        baytTip: "WhatsApp tiene el CAC (Costo de Adquisición) más bajo actualmente ($8.200). Prioriza este canal para campañas de retoma."
    },
    estadisticas: {
        title: 'Data & ROI Analytics',
        icon: <BarChart3 size={20}/>,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/5',
        description: 'Deep-dive en métricas demográficas, geográficas y temporales de tus compradores.',
        strategy: 'La data mata el presentimiento. Saber que Bogotá compra más de noche te permite optimizar tu pauta al centavo.',
        kpis: [
            { label: 'Pico Ventas', value: '20:00', sub: 'Horario', icon: <Clock size={12}/> },
            { label: 'Retención', value: '24%', sub: 'LTV', icon: <Users size={12}/> }
        ],
        whyItMatters: 'Escalar un negocio sin estadísticas es como volar a ciegas. Estos gráficos son el radar de tu crecimiento.',
        baytTip: "He detectado un patrón: los clientes de Medellín compran un 15% más cuando incluyes envío gratis en el copy."
    },
    estrategias: {
        title: 'Bayt AI Recommendations',
        icon: <Sparkles size={20}/>,
        color: 'text-[#00f2ff]',
        bgColor: 'bg-[#00f2ff]/5',
        description: 'Motor de sugerencias tácticas basado en Machine Learning y análisis de mercado real.',
        strategy: 'La IA no reemplaza tu juicio, lo potencia. Bayt encuentra patrones que el ojo humano ignora en miles de datos.',
        kpis: [
            { label: 'Confianza IA', value: '94%', sub: 'Precisión', icon: <ShieldCheck size={12}/> },
            { label: 'Ventas Proy.', value: '+$8.4M', sub: 'Impacto', icon: <TrendingUp size={12}/> }
        ],
        whyItMatters: 'Te da la ventaja competitiva de actuar antes que los demás basándote en predicciones, no solo en pasado.',
        baytTip: "Tengo una nueva estrategia de 'Reactivación' lista. Podría recuperar el 12% de tus clientes inactivos este mes."
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl"
        />

        <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="relative bg-white/90 backdrop-blur-2xl w-full max-w-6xl h-[85vh] rounded-[4rem] shadow-[0_30px_100px_rgba(0,0,0,0.3)] overflow-hidden border border-white/50 flex flex-col md:flex-row"
        >
            {/* Sidebar Táctico */}
            <div className="w-full md:w-80 bg-gray-50/50 border-r border-gray-100 p-8 flex flex-col justify-between overflow-y-auto custom-scrollbar">
                <div>
                    <div className="flex items-center gap-3 mb-10 px-2">
                        <div className="h-10 w-10 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
                            <ShieldCheck className="text-[#00f2ff]" size={20}/>
                        </div>
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-900">Guía Elite</h3>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5 tracking-tighter">Protocolo Platinum Plus</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {Object.entries(guideContent).map(([key, item]: any) => (
                            <button
                                key={key}
                                onClick={() => setActiveGuideTab(key)}
                                className={`w-full flex items-center justify-between p-5 rounded-[2rem] transition-all group ${activeGuideTab === key ? 'bg-white shadow-xl shadow-gray-200/50 translate-x-2' : 'hover:bg-white/50 hover:translate-x-1'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${activeGuideTab === key ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' : 'bg-gray-100 text-gray-400'}`}>
                                        {item.icon}
                                    </div>
                                    <div className="text-left">
                                        <span className={`text-[10px] font-black uppercase tracking-widest block transition-colors ${activeGuideTab === key ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>{key}</span>
                                        <span className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter">{item.title.split(' ')[0]}</span>
                                    </div>
                                </div>
                                {activeGuideTab === key && <motion.div layoutId="guideIndicator" className="h-1.5 w-1.5 rounded-full bg-[#004d4d]" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-10 p-6 bg-gray-900 rounded-[2.5rem] text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform"><Sparkles size={40}/></div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#00f2ff]/60 mb-2">Estatus Sistema</p>
                    <p className="text-[10px] font-medium italic opacity-80 leading-relaxed">Optimizando rendimiento publicitario en tiempo real para Bayup.</p>
                </div>
            </div>

            {/* Area de Contenido Elite */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white/40">
                {/* Cabecera */}
                <div className="p-10 border-b border-gray-50 flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-6">
                        <motion.div 
                            key={activeGuideTab + 'icon'}
                            initial={{ scale: 0.5, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                            className={`h-16 w-16 rounded-3xl ${guideContent[activeGuideTab].bgColor} flex items-center justify-center ${guideContent[activeGuideTab].color} shadow-inner border border-white`}
                        >
                            {guideContent[activeGuideTab].icon}
                        </motion.div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="h-1 w-6 bg-gray-900 rounded-full"></div>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Módulo de {activeGuideTab}</span>
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">
                                {guideContent[activeGuideTab].title}
                            </h2>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="h-12 w-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:rotate-90 transition-all shadow-sm active:scale-95"
                    >
                        <X size={24}/>
                    </button>
                </div>

                {/* Grid de Contenido (Doble Columna) */}
                <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Columna 1: Operativa */}
                        <div className="space-y-10">
                            <section>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-gray-900"></div> Definición Operativa
                                </h4>
                                <p className="text-lg font-bold text-gray-800 leading-snug tracking-tight">
                                    {guideContent[activeGuideTab].description}
                                </p>
                                <p className="text-sm font-medium text-gray-500 mt-4 leading-relaxed italic border-l-2 border-gray-100 pl-6">
                                    {guideContent[activeGuideTab].whyItMatters}
                                </p>
                            </section>

                            <section>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                    <Activity size={14} className="text-gray-900"/> Indicadores Clave (KPIs)
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {guideContent[activeGuideTab].kpis.map((kpi: any, i: number) => (
                                        <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-gray-900 transition-colors">
                                            <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-gray-900 transition-colors">
                                                {kpi.icon}
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                                                <p className="text-lg font-black text-gray-900 tracking-tighter mt-0.5">{kpi.value}</p>
                                                <p className="text-[8px] font-bold text-gray-300 italic uppercase">{kpi.sub}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Columna 2: Estratégica */}
                        <div className="space-y-10">
                            <section className="bg-gray-900 p-10 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000"><Target size={150} /></div>
                                <h4 className="text-[10px] font-black text-[#00f2ff] uppercase tracking-[0.3em] mb-6 flex items-center gap-3 relative z-10">
                                    <ShieldCheck size={14}/> Visión Estratégica
                                </h4>
                                <p className="text-base font-medium leading-relaxed opacity-90 italic relative z-10">
                                    "{guideContent[activeGuideTab].strategy}"
                                </p>
                                <div className="mt-10 pt-10 border-t border-white/10 relative z-10">
                                    <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#00f2ff] hover:gap-5 transition-all">
                                        Explorar Tácticas Avanzadas <ArrowUpRight size={14}/>
                                    </button>
                                </div>
                            </section>

                            <section className="bg-[#00f2ff]/10 border border-[#00f2ff]/20 p-10 rounded-[3.5rem] relative overflow-hidden group">
                                <div className="absolute -left-10 -bottom-10 opacity-10 group-hover:rotate-12 transition-transform"><BotIcon /></div>
                                <div className="flex items-center gap-3 mb-6 relative z-10">
                                    <div className="h-10 w-10 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
                                        <Lightbulb className="text-[#00f2ff]" size={18}/>
                                    </div>
                                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">Consejo de Bayt AI</h4>
                                </div>
                                <p className="text-sm font-bold text-gray-800 leading-relaxed italic relative z-10">
                                    {guideContent[activeGuideTab].baytTip}
                                </p>
                            </section>
                        </div>
                    </div>
                </div>

                {/* Footer de Acción */}
                <div className="p-10 border-t border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md relative z-10">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                        Documentación técnica de Marketing v4.2 • Bayup Interactive
                    </p>
                    <button 
                        onClick={onClose}
                        className="px-12 py-5 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                    >
                        Entendido, Continuar <ArrowUpRight size={16}/>
                    </button>
                </div>
            </div>
        </motion.div>
    </div>
  );
}

function BotIcon() {
    return (
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#004d4d]">
            <path d="M12 2V4M12 20V22M4 12H2M22 12H20M18.36 5.64L16.95 7.05M7.05 16.95L5.64 18.36M18.36 18.36L16.95 16.95M7.05 7.05L5.64 5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

