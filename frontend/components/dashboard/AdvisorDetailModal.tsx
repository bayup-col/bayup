"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  TrendingUp, 
  Zap, 
  Target, 
  ShoppingBag, 
  MessageSquare, 
  Star,
  Award,
  BarChart3,
  Calendar
} from "lucide-react";

interface Advisor {
  name: string;
  ventas: number;
  conversion: string;
  growth: string;
  status: string;
}

interface AdvisorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  advisor: Advisor | null;
}

export default function AdvisorDetailModal({ isOpen, onClose, advisor }: AdvisorDetailModalProps) {
  if (!isOpen || !advisor) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 50 }}
            className="relative bg-[#FAFAFA] w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col md:flex-row"
          >
            {/* Botón Cerrar */}
            <button 
                onClick={onClose}
                className="absolute top-6 right-6 z-50 h-10 w-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all hover:rotate-90"
            >
                <X size={20}/>
            </button>

            {/* Sidebar Izquierdo: Perfil y Meta */}
            <div className="w-full md:w-[350px] bg-white border-r border-slate-100 p-10 flex flex-col items-center text-center space-y-8 overflow-y-auto">
                <div className="relative">
                    <div className="h-32 w-32 rounded-[2.5rem] bg-[#004D4D] flex items-center justify-center text-white text-4xl font-black shadow-2xl italic">
                        {advisor.name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-[#00f2ff] rounded-full border-4 border-white flex items-center justify-center text-[#004D4D] shadow-lg">
                        <Award size={18} fill="currentColor"/>
                    </div>
                </div>
                
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{advisor.name}</h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Asesor de Ventas Senior</p>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Status: {advisor.status.toUpperCase()}
                    </div>
                </div>

                <div className="w-full space-y-6 pt-6 border-t border-slate-50">
                    <div className="text-left space-y-2">
                        <div className="flex justify-between items-end">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta de Ventas</p>
                            <p className="text-xs font-bold text-emerald-600">92% Logrado</p>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: '92%' }} 
                                className="h-full bg-[#004D4D] rounded-full"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl text-center border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase">Ticket Avg</p>
                            <p className="text-sm font-black text-slate-900 mt-1">$ 185k</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl text-center border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase">Ventas/Mes</p>
                            <p className="text-sm font-black text-slate-900 mt-1">42</p>
                        </div>
                    </div>
                </div>

                <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10">
                    <MessageSquare size={16}/> Enviar Feedback
                </button>
            </div>

            {/* Contenido Derecho: Gráficas e Inteligencia */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
                <div className="flex justify-between items-end pr-12">
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Advisor <span className="text-[#00f2ff]">Intelligence</span></h3>
                        <p className="text-slate-400 text-sm font-medium mt-1">Análisis de rendimiento individual y proyección de crecimiento.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Último Cierre</p>
                        <p className="text-sm font-black text-slate-900">Hoy, 10:45 AM</p>
                    </div>
                </div>

                {/* Grid de Métricas Secundarias */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4 text-[#004D4D]">
                            <BarChart3 size={18}/>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Facturación</span>
                        </div>
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(advisor.ventas)}</p>
                        <p className="text-[10px] font-bold text-emerald-500 mt-1 flex items-center gap-1">
                            <TrendingUp size={12}/> {advisor.growth} vs mes anterior
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4 text-[#004D4D]">
                            <Zap size={18}/>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Eficiencia</span>
                        </div>
                        <p className="text-2xl font-black text-slate-900">{advisor.conversion}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 italic">Tasa de conversión de leads</p>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4 text-[#004D4D]">
                            <Target size={18}/>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Retención</span>
                        </div>
                        <p className="text-2xl font-black text-slate-900">12.5%</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 italic">Clientes que vuelven a comprar</p>
                    </div>
                </div>

                {/* Sección de Productos Estrella */}
                <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ShoppingBag size={14} className="text-[#004D4D]"/> Top 3 Productos Vendidos
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { name: 'Oversize Tee Black', qty: 45, rev: '$ 3.2M' },
                            { name: 'Urban Cargo Pants', qty: 28, rev: '$ 2.8M' },
                            { name: 'Tech Hoodie v2', qty: 12, rev: '$ 1.5M' },
                        ].map((prod, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100">
                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-xs text-slate-400">#0{i+1}</div>
                                <div>
                                    <p className="text-xs font-black text-slate-900">{prod.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{prod.qty} Unidades · {prod.rev}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Bayt Advice para el Asesor */}
                <div className="bg-[#004D4D] p-8 rounded-[2.5rem] text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12">
                        <Star size={120} fill="white" />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-[#00f2ff]/20 flex items-center justify-center border border-[#00f2ff]/30">
                                <Award size={20} className="text-[#00f2ff]"/>
                            </div>
                            <h4 className="text-lg font-black uppercase italic tracking-tighter">Análisis Estratégico Bayt</h4>
                        </div>
                        <p className="text-sm font-medium leading-relaxed italic text-cyan-50/80">
                            &quot;{advisor.name} ha demostrado una habilidad excepcional para el upsell en productos de calzado. Recomiendo que lidere la capacitación del próximo lunes sobre 'Técnicas de cierre cruzado' para el resto del equipo.&quot;
                        </p>
                    </div>
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
