"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  LayoutGrid, 
  Store, 
  Users, 
  Sparkles, 
  Zap, 
  Globe,
  Smartphone
} from "lucide-react";
import { useState } from "react";

interface ReportsInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportsInfoModal({ isOpen, onClose }: ReportsInfoModalProps) {
  const [activeGuideTab, setActiveGuideTab] = useState('general');

  // Contenido adaptado al Módulo de Reportes, usando la misma estructura de datos que Pedidos
  const guideContent: any = {
    general: {
        title: 'Visión General',
        icon: <LayoutGrid size={20}/>,
        color: 'text-emerald-500',
        howItWorks: 'Tu centro de mando financiero. Aquí visualizas los 6 KPIs críticos de tu negocio en tiempo real, desde Ventas Brutas hasta el ROI del personal.',
        example: '¿Quieres saber cuánto vendiste hoy comparado con ayer? Mira la tarjeta de "Ventas Brutas". Si necesitas ver el margen real, revisa "Utilidad Neta".',
        tip: 'Interactúa con las tarjetas 3D: Pasa el mouse sobre ellas para ver el efecto de profundidad y haz clic para abrir un desglose detallado de cada métrica.'
    },
    sucursales: {
        title: 'Sucursales',
        icon: <Store size={20}/>,
        color: 'text-indigo-500',
        howItWorks: 'Comparativa de rendimiento entre tus diferentes puntos de venta (Físicos y Online). Identifica rápidamente qué ubicación es más rentable.',
        example: 'La "Tienda Principal" puede vender más, pero quizás la "Sucursal Norte" tiene menos gastos y mayor margen de ganancia. Aquí lo ves claro.',
        tip: 'Usa esta pestaña para decidir dónde replicar estrategias exitosas. Si la Sucursal Norte es muy eficiente, estudia sus procesos.'
    },
    asesores: {
        title: 'Asesores',
        icon: <Users size={20}/>,
        color: 'text-rose-500',
        howItWorks: 'Ranking de productividad de tu equipo. Mide quién factura más, quién tiene mejor tasa de cierre y quién está creciendo mes a mes.',
        example: 'Elena puede tener muchas ventas, pero Carlos tiene una tasa de conversión del 20%. Tal vez Carlos deba enseñar sus técnicas de cierre al resto.',
        tip: 'Configura metas mensuales desde el botón superior para que el sistema marque automáticamente quién está cumpliendo objetivos (Verde) y quién no (Rojo).'
    },
    bayt: {
        title: 'Bayt Insight',
        icon: <Sparkles size={20}/>,
        color: 'text-[#00f2ff]', // Cyan corporativo
        howItWorks: 'Inteligencia Artificial aplicada a tu negocio. Bayt analiza millones de datos para encontrar patrones ocultos y darte consejos en lenguaje natural.',
        example: '"Detecté que tus ventas en Instagram caen los martes. Sugiero lanzar una promo flash ese día." - Bayt te habla así, directo y al grano.',
        tip: 'Revisa este módulo cada mañana. A veces un solo consejo de la IA puede ahorrarte millones en publicidad mal gastada.'
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        />

        {/* Modal Container (Estilo idéntico a Pedidos) */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative bg-white w-full max-w-4xl h-[70vh] rounded-[3rem] shadow-2xl overflow-hidden border border-white flex flex-col md:flex-row"
        >
            {/* Navigation Sidebar */}
            <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-2 overflow-y-auto">
                <div className="mb-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004D4D]">Análisis 360°</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">Guía de Maestría</p>
                </div>
                {Object.entries(guideContent).map(([key, item]: any) => (
                    <button
                        key={key}
                        onClick={() => setActiveGuideTab(key)}
                        className={`flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${activeGuideTab === key ? 'bg-[#004D4D] text-white shadow-lg' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
                    >
                        <div className={`${activeGuideTab === key ? 'text-white' : item.color}`}>
                            {item.icon}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wide">{item.title}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0">
                    <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center ${guideContent[activeGuideTab].color}`}>
                            {guideContent[activeGuideTab].icon}
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                            {guideContent[activeGuideTab].title}
                        </h2>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                    <section>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <div className="h-1 w-4 bg-[#004D4D] rounded-full"></div> ¿Cómo funciona?
                        </h4>
                        <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                            {guideContent[activeGuideTab].howItWorks}
                        </p>
                    </section>

                    <div className="grid md:grid-cols-2 gap-8">
                        <section className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Smartphone size={14} className="text-cyan-500"/> Ejemplo Real
                            </h4>
                            <div className="p-6 bg-cyan-50/30 border border-cyan-100 rounded-[2rem]">
                                <p className="text-xs font-medium text-cyan-900 leading-relaxed italic">
                                    "{guideContent[activeGuideTab].example}"
                                </p>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Zap size={14} className="text-amber-500"/> Bayup Pro-Tip
                            </h4>
                            <div className="p-6 bg-amber-50/30 border border-amber-100 rounded-[2rem]">
                                <p className="text-xs font-bold text-amber-900 leading-relaxed">
                                    {guideContent[activeGuideTab].tip}
                                </p>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-50 flex justify-end bg-slate-50/30">
                    <button 
                        onClick={onClose}
                        className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all"
                    >
                        Cerrar Guía
                    </button>
                </div>
            </div>
        </motion.div>
    </div>
  );
}
