"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ShieldCheck, 
  Search, 
  History, 
  Zap, 
  Sparkles, 
  Clock, 
  Activity, 
  TrendingUp, 
  LayoutGrid, 
  AlertCircle,
  FileText,
  Truck,
  CheckCircle2,
  Bot,
  ArrowUpRight,
  ShieldAlert,
  Users
} from "lucide-react";
import { useState } from "react";

interface ReturnsInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReturnsInfoModal({ isOpen, onClose }: ReturnsInfoModalProps) {
  const [activeGuideTab, setActiveGuideTab] = useState('todos');

  const guideContent: any = {
    todos: {
        title: 'Gestión 360° Garantías',
        icon: <LayoutGrid size={20}/>,
        color: 'text-[#004d4d]',
        bgColor: 'bg-[#004d4d]/5',
        description: 'Visión consolidada de todas las solicitudes de postventa y devoluciones activas.',
        strategy: 'La garantía no es un gasto, es la oportunidad final de salvar el LTV (Life Time Value) del cliente. Un caso bien resuelto convierte a un detractor en un promotor de marca.',
        kpis: [
            { label: 'Casos Totales', value: '142', sub: 'Histórico', icon: <FileText size={12}/> },
            { label: 'Resolución', value: '92%', sub: 'Éxito', icon: <CheckCircle2 size={12}/> }
        ],
        whyItMatters: 'Permite identificar fallos sistémicos en productos específicos antes de que afecten masivamente la rentabilidad.',
        baytTip: "He detectado que el Reloj Gold tiene un 15% más de reportes que el promedio. Sugiero revisar el lote de bodega central."
    },
    casos: {
        title: 'Trazabilidad Táctica',
        icon: <ShieldCheck size={20}/>,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/5',
        description: 'Seguimiento detallado de cada incidencia desde la recepción hasta el cierre definitivo.',
        strategy: 'La transparencia calma la ansiedad del cliente. Mantener el historial actualizado con evidencias visuales reduce el volumen de consultas en soporte.',
        kpis: [
            { label: 'Tiempo Prom.', value: '18h', sub: 'Respuesta', icon: <Clock size={12}/> },
            { label: 'Alertas', value: '03', sub: 'Críticas', icon: <AlertCircle size={12}/> }
        ],
        whyItMatters: 'Protege legalmente a la empresa y asegura que cada paso del proceso cumpla con la política de calidad.',
        baytTip: "Prioriza los casos con más de 5 días abiertos. La probabilidad de devolución definitiva aumenta un 40% después del día 6."
    },
    estadisticas: {
        title: 'Data & Quality ROI',
        icon: <Activity size={20}/>,
        color: 'text-rose-500',
        bgColor: 'bg-rose-500/5',
        description: 'Análisis de causas raíz, tasas de retorno y su impacto directo en el flujo de caja.',
        strategy: 'Analizar por qué vuelven los productos permite optimizar la cadena de suministro y la descripción de venta para evitar falsas expectativas.',
        kpis: [
            { label: 'Tasa Retorno', value: '1.4%', sub: 'Mensual', icon: <TrendingUp size={12}/> },
            { label: 'Costo Ops', value: '$ 1.2M', sub: 'Logística', icon: <Truck size={12}/> }
        ],
        whyItMatters: 'Un punto porcentual de reducción en la tasa de retorno puede equivaler a millones en ahorro operativo anual.',
        baytTip: "Si reducimos la tasa de retorno al 1.0%, liberaríamos $4.5M de flujo de caja que hoy se pierde en fletes de devolución."
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
                            <ShieldAlert className="text-[#00f2ff]" size={20}/>
                        </div>
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-900">Guía Garantías</h3>
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
                                {activeGuideTab === key && <motion.div layoutId="returnsGuideIndicator" className="h-1.5 w-1.5 rounded-full bg-[#004d4d]" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-10 p-6 bg-gray-900 rounded-[2.5rem] text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform"><ShieldCheck size={40} className="text-[#00f2ff]"/></div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#00f2ff]/60 mb-2">Quality Check</p>
                    <p className="text-[10px] font-medium italic opacity-80 leading-relaxed">Monitoreando integridad de producto y satisfacción postventa.</p>
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
                                    <div className="h-2 w-2 rounded-full bg-gray-900"></div> Definición del Módulo
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
                                    <Activity size={14} className="text-gray-900"/> KPIs Estratégicos
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
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000"><ShieldCheck size={150} /></div>
                                <h4 className="text-[10px] font-black text-[#00f2ff] uppercase tracking-[0.3em] mb-6 flex items-center gap-3 relative z-10">
                                    <Zap size={14}/> Visión de Rentabilidad
                                </h4>
                                <p className="text-base font-medium leading-relaxed opacity-90 italic relative z-10">
                                    "{guideContent[activeGuideTab].strategy}"
                                </p>
                                <div className="mt-10 pt-10 border-t border-white/10 relative z-10">
                                    <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#00f2ff] hover:gap-5 transition-all">
                                        Manual de Fidelización Extrema <ArrowUpRight size={14}/>
                                    </button>
                                </div>
                            </section>

                            <section className="bg-[#00f2ff]/10 border border-[#00f2ff]/20 p-10 rounded-[3.5rem] relative overflow-hidden group">
                                <div className="flex items-center gap-3 mb-6 relative z-10">
                                    <div className="h-10 w-10 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
                                        <Bot className="text-[#00f2ff]" size={18}/>
                                    </div>
                                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">Sugerencia de Bayt AI</h4>
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
                        Protocolo de Calidad v4.2 • Bayup Interactive
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
