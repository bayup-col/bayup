"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Users, 
  TrendingUp, 
  Zap, 
  Sparkles, 
  Clock, 
  Activity, 
  LayoutGrid, 
  ShieldCheck,
  Star,
  Target,
  ArrowUpRight,
  Bot,
  PieChart,
  ShoppingBag,
  Briefcase
} from "lucide-react";
import { useState } from "react";

interface CustomersInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomersInfoModal({ isOpen, onClose }: CustomersInfoModalProps) {
  const [activeGuideTab, setActiveGuideTab] = useState('todos');

  const guideContent: any = {
    todos: {
        title: 'Gestión 360° de Cartera',
        icon: <LayoutGrid size={20}/>,
        color: 'text-[#004d4d]',
        bgColor: 'bg-[#004d4d]/5',
        description: 'Visión consolidada de tu activo más valioso: la base de datos de clientes sincronizada.',
        strategy: 'No trates a todos por igual. El 20% de tus clientes suele generar el 80% de tus ingresos (Pareto). Aquí identificas quiénes son para proteger esa relación.',
        kpis: [
            { label: 'Total Cartera', value: '1,240', sub: 'Registrados', icon: <Users size={12}/> },
            { label: 'LTV Promedio', value: '$ 420k', sub: 'Valor Vida', icon: <Activity size={12}/> }
        ],
        whyItMatters: 'Permite centralizar la data de ventas online y POS físico en un solo perfil unificado del comprador.',
        baytTip: "He sincronizado 42 nuevos clientes desde la tienda física hoy. Sugiéreles un cupón de segunda compra para aumentar la recurrencia."
    },
    vip: {
        title: 'Segmento VIP & Oro',
        icon: <Star size={20}/>,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/5',
        description: 'Tus mejores compradores. Aquellos con un ticket promedio alto y alta frecuencia.',
        strategy: 'Los VIP no buscan descuentos, buscan exclusividad. Ofréceles acceso anticipado a nuevas colecciones o soporte prioritario.',
        kpis: [
            { label: 'Clientes VIP', value: '156', sub: 'Top Tier', icon: <Star size={12}/> },
            { label: 'Ticket VIP', value: '$ 850k', sub: '+120% vs avg', icon: <ArrowUpRight size={12}/> }
        ],
        whyItMatters: 'Retener un VIP es 7 veces más económico que adquirir un cliente nuevo desde cero.',
        baytTip: "Tus VIP compran mayoritariamente los fines de semana. Evita saturarlos con mensajes los lunes o martes."
    },
    retencion: {
        title: 'Estrategias de Retención',
        icon: <Zap size={20}/>,
        color: 'text-[#00f2ff]',
        bgColor: 'bg-[#00f2ff]/5',
        description: 'Análisis de inactividad y protocolos de reactivación de clientes "en riesgo".',
        strategy: 'Un cliente inactivo es una fuga de capital. Identificamos a quienes no compran hace +90 días para lanzar campañas de retoma.',
        kpis: [
            { label: 'Tasa Retención', value: '68%', sub: 'Healthy', icon: <ShieldCheck size={12}/> },
            { label: 'En Riesgo', value: '42', sub: 'Inactivos', icon: <Clock size={12}/> }
        ],
        whyItMatters: 'La recurrencia es la clave de la rentabilidad a largo plazo. Un negocio que solo vive de clientes nuevos es frágil.',
        baytTip: "He detectado 12 clientes que solían comprar cada mes y llevan 45 días sin actividad. Sugiero una campaña de 'Te extrañamos'."
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
                            <Users className="text-[#00f2ff]" size={20}/>
                        </div>
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-900">Guía Cartera</h3>
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
                                {activeGuideTab === key && <motion.div layoutId="customerGuideIndicator" className="h-1.5 w-1.5 rounded-full bg-[#004d4d]" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-10 p-6 bg-gray-900 rounded-[2.5rem] text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform"><Sparkles size={40} className="text-[#00f2ff]"/></div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#00f2ff]/60 mb-2">CRM Status</p>
                    <p className="text-[10px] font-medium italic opacity-80 leading-relaxed">Sincronización neural de clientes activa.</p>
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
                                    <Activity size={14} className="text-gray-900"/> Indicadores de Cartera
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
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000"><Users size={150} /></div>
                                <h4 className="text-[10px] font-black text-[#00f2ff] uppercase tracking-[0.3em] mb-6 flex items-center gap-3 relative z-10">
                                    <Zap size={14}/> Visión de Valor
                                </h4>
                                <p className="text-base font-medium leading-relaxed opacity-90 italic relative z-10">
                                    "{guideContent[activeGuideTab].strategy}"
                                </p>
                                <div className="mt-10 pt-10 border-t border-white/10 relative z-10">
                                    <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#00f2ff] hover:gap-5 transition-all">
                                        Explorar Customer Analytics <ArrowUpRight size={14}/>
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
                        Documentación de Cartera v4.2 • Bayup Interactive
                    </p>
                    <button 
                        onClick={onClose}
                        className="px-12 py-5 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                    >
                        Entendido <ArrowUpRight size={16}/>
                    </button>
                </div>
            </div>
        </motion.div>
    </div>
  );
}
