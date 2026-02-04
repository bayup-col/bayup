"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Tag, 
  Zap, 
  Sparkles, 
  Target, 
  Smartphone,
  CheckCircle2,
  TrendingUp,
  Percent
} from "lucide-react";
import { useState } from "react";

interface DiscountsInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DiscountsInfoModal({ isOpen, onClose }: DiscountsInfoModalProps) {
  const [activeGuideTab, setActiveGuideTab] = useState('cupones');

  const guideContent: any = {
    cupones: {
        title: 'Cupones de Descuento',
        icon: <Tag size={20}/>,
        color: 'text-emerald-500',
        howItWorks: 'Códigos alfanuméricos manuales que el cliente ingresa en el checkout. Ideales para pauta con influencers o campañas de email marketing.',
        example: 'Crea el cupón "PROMO10" para dar un 10% de descuento. Puedes limitar cuántas veces se usa o poner un monto mínimo de compra.',
        tip: 'Usa códigos cortos y fáciles de recordar. Los cupones con nombres de eventos (ej: BLACKFRIDAY) tienen un 30% más de redención.'
    },
    automaticos: {
        title: 'Descuentos Automáticos',
        icon: <Zap size={20}/>,
        color: 'text-amber-500',
        howItWorks: 'Reglas que se aplican solas sin que el cliente haga nada. Se activan cuando el carrito cumple ciertas condiciones definidas por ti.',
        example: 'Configura "Envío Gratis" automático para compras superiores a $150.000. El sistema detecta el valor y resta el costo del flete.',
        tip: 'Los descuentos automáticos reducen la fricción en el checkout y aumentan el Ticket Promedio (AOV) significativamente.'
    },
    bayt: {
        title: 'Bayt Strategist',
        icon: <Sparkles size={20}/>,
        color: 'text-[#00f2ff]',
        howItWorks: 'Inteligencia Artificial que analiza tus ventas para sugerirte qué ofertas crear. Detecta productos "fríos" que necesitan un empujón.',
        example: '"Detecté stock estancado en la categoría Camisetas. Sugiero un cupón flash del 15% solo por 24 horas para liberar bodega."',
        tip: 'Sigue las sugerencias de Bayt en la pestaña "Bayt Insight" para mantener un inventario saludable y un flujo de caja constante.'
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        />

        <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative bg-white w-full max-w-4xl h-[70vh] rounded-[3rem] shadow-2xl overflow-hidden border border-white flex flex-col md:flex-row"
        >
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-2 overflow-y-auto">
                <div className="mb-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004D4D]">Marketing Elite</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">Guía de Conversión</p>
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

            {/* Content */}
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
                                <Zap size={14} className="text-amber-500"/> Tip Estratégico
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
