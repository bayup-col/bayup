"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Coins, 
  Settings, 
  Gift, 
  Sparkles, 
  Zap, 
  Smartphone,
  Star,
  Trophy
} from "lucide-react";
import { useState } from "react";

interface LoyaltyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoyaltyInfoModal({ isOpen, onClose }: LoyaltyInfoModalProps) {
  const [activeGuideTab, setActiveGuideTab] = useState('puntos');

  const guideContent: any = {
    puntos: {
        title: 'Sistema de Puntos',
        icon: <Coins size={20}/>,
        color: 'text-amber-500',
        howItWorks: 'Tus clientes acumulan puntos por cada peso gastado. Es la base de la fidelización automática.',
        example: 'Si configuras $1.000 = 1 punto, un cliente que gasta $100.000 recibirá 100 puntos en su cuenta.',
        tip: 'Mantén una tasa de acumulación simple. Los sistemas complejos confunden al cliente y bajan la participación.'
    },
    niveles: {
        title: 'Niveles de Lealtad',
        icon: <Trophy size={20}/>,
        color: 'text-cyan-500',
        howItWorks: 'Gamifica la experiencia. Los clientes suben de nivel (Bronce, Plata, Oro, Diamante) según su gasto acumulado.',
        example: 'Un miembro "Diamante" podría tener beneficios exclusivos como envío gratis de por vida o acceso anticipado a ofertas.',
        tip: 'Ofrece recompensas emocionales (estatus) además de las financieras. El reconocimiento es un gran motor de compra.'
    },
    premios: {
        title: 'Catálogo de Premios',
        icon: <Gift size={20}/>,
        color: 'text-emerald-500',
        howItWorks: 'Define qué pueden hacer los clientes con sus puntos. Pueden canjearlos por productos físicos o bonos de descuento.',
        example: 'Un cliente canjea 500 puntos por una gorra oficial. El sistema descuenta el punto y tú gestionas la entrega.',
        tip: 'Incluye siempre un "Premio Aspiracional" de alto valor. Aunque pocos lleguen, motiva a todos a seguir acumulando.'
    },
    bayt: {
        title: 'Bayt Loyalty-IQ',
        icon: <Sparkles size={20}/>,
        color: 'text-[#00f2ff]',
        howItWorks: 'Análisis predictivo de clientes. Bayt detecta quiénes están a punto de abandonar el club y sugiere incentivos.',
        example: '"Detecté que Carlos Ruiz no compra hace 30 días. Sugiero enviarle un bono de 50 puntos para reactivarlo."',
        tip: 'Usa los consejos de Bayt para reducir el churn (abandono) y maximizar el LTV (Life Time Value) de tus clientes.'
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
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004D4D]">Fidelización Pro</h3>
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
