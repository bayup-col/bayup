"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  MessageSquare, 
  Globe, 
  Zap, 
  Sparkles, 
  Clock, 
  Activity, 
  LayoutGrid, 
  ShieldCheck,
  Target,
  ArrowUpRight,
  Bot,
  PieChart,
  DollarSign,
  Share2
} from "lucide-react";
import { useState } from "react";

interface ChatsInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatsInfoModal({ isOpen, onClose }: ChatsInfoModalProps) {
  const [activeGuideTab, setActiveGuideTab] = useState('inbox');

  const guideContent: any = {
    inbox: {
        title: 'Inbox Omnicanal',
        icon: <MessageSquare size={20}/>,
        color: 'text-[#004d4d]',
        bgColor: 'bg-[#004d4d]/5',
        description: 'Centro de mando unificado donde convergen WhatsApp, Instagram, Mercado Libre y Shopify.',
        strategy: 'La velocidad de respuesta es el factor #1 de conversión. Responder en menos de 5 minutos aumenta las probabilidades de cierre en un 400%.',
        kpis: [
            { label: 'Chats Pendientes', value: '12', sub: 'Action needed', icon: <MessageSquare size={12}/> },
            { label: 'Tiempo Resp.', value: '4m', sub: 'SLA Ideal', icon: <Clock size={12}/> }
        ],
        whyItMatters: 'Permite gestionar toda la comunicación comercial sin saltar entre pestañas, manteniendo el contexto del cliente siempre visible.',
        baytTip: "He detectado 3 chats de Instagram que llevan 2 horas sin respuesta. Prioriza estos para evitar que el lead se enfríe."
    },
    canales: {
        title: 'Gestión de Canales',
        icon: <Globe size={20}/>,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/5',
        description: 'Monitoreo de salud y rendimiento de cada punto de contacto digital.',
        strategy: 'Cada canal tiene un "tono" diferente. WhatsApp es personal y de cierre; Instagram es visual y de aspiración. Ajusta tu copy según el logo que veas.',
        kpis: [
            { label: 'WhatsApp', value: '42%', sub: 'Conversión', icon: <PieChart size={12}/> },
            { label: 'Instagram', value: '28%', sub: 'Reach', icon: <Target size={12}/> }
        ],
        whyItMatters: 'Ayuda a decidir en qué canal invertir más pauta publicitaria basándose en la rentabilidad real de los chats.',
        baytTip: "WhatsApp Business está generando el 60% de tus ventas este mes. Considera automatizar las respuestas iniciales aquí."
    },
    crm: {
        title: 'CRM & Pipeline',
        icon: <LayoutGrid size={20}/>,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/5',
        description: 'Visualización del embudo comercial basado en el estado de las conversaciones.',
        strategy: 'Mueve los chats a través de las etapas: Prospecto, Negociación y Ganado. No dejes ningún chat en el limbo sin una etiqueta de estado.',
        kpis: [
            { label: 'En Negociación', value: '24', sub: 'Pipeline', icon: <Activity size={12}/> },
            { label: 'Cierres Hoy', value: '$ 1.2M', sub: 'Revenue', icon: <DollarSign size={12}/> }
        ],
        whyItMatters: 'Transforma una simple conversación en una oportunidad de negocio cuantificable y rastreable.',
        baytTip: "Hay 8 clientes en etapa de 'Negociación' que no han comprado. Sugiero enviarles un cupón de 'Cierre Inmediato'."
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
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
                            <MessageSquare className="text-[#00f2ff]" size={20}/>
                        </div>
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-900">Guía Mensajes</h3>
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
                                {activeGuideTab === key && <motion.div layoutId="chatsGuideIndicator" className="h-1.5 w-1.5 rounded-full bg-[#004d4d]" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-10 p-6 bg-gray-900 rounded-[2.5rem] text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform"><Sparkles size={40} className="text-[#00f2ff]"/></div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#00f2ff]/60 mb-2">Comms Status</p>
                    <p className="text-[10px] font-medium italic opacity-80 leading-relaxed">Terminal omnicanal operando en modo de alta conversión.</p>
                </div>
            </div>

            {/* Area de Contenido Elite */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white/40">
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
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Auditoría de {activeGuideTab}</span>
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

                <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Columna 1: Operativa */}
                        <div className="space-y-10">
                            <section>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-gray-900"></div> Definición Estratégica
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
                                    <Activity size={14} className="text-gray-900"/> Indicadores de Comunicación
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
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000"><Zap size={150} className="text-[#00f2ff]"/></div>
                                <h4 className="text-[10px] font-black text-[#00f2ff] uppercase tracking-[0.3em] mb-6 flex items-center gap-3 relative z-10">
                                    <ShieldCheck size={14}/> Visión de Conversión
                                </h4>
                                <p className="text-base font-medium leading-relaxed opacity-90 italic relative z-10">
                                    "{guideContent[activeGuideTab].strategy}"
                                </p>
                                <div className="mt-10 pt-10 border-t border-white/10 relative z-10">
                                    <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#00f2ff] hover:gap-5 transition-all">
                                        Manual de Cierre Omnicanal <ArrowUpRight size={14}/>
                                    </button>
                                </div>
                            </section>

                            <section className="bg-[#00f2ff]/10 border border-[#00f2ff]/20 p-10 rounded-[3.5rem] relative overflow-hidden group">
                                <div className="flex items-center gap-3 mb-6 relative z-10">
                                    <div className="h-10 w-10 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
                                        <Bot className="text-[#00f2ff]" size={18}/>
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

                <div className="p-10 border-t border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md relative z-10">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                        Protocolo de Comunicación v4.2 • Bayup Interactive
                    </p>
                    <button 
                        onClick={onClose}
                        className="px-12 py-5 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                    >
                        Confirmar Lectura <ArrowUpRight size={16}/>
                    </button>
                </div>
            </div>
        </motion.div>
    </div>
  );
}
