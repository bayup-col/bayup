"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  TrendingUp, 
  Activity, 
  Users, 
  ShieldCheck, 
  Star,
  Target,
  ArrowUpRight,
  Bot,
  PieChart,
  ShoppingBag
} from "lucide-react";

interface CustomersMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: {
    label: string;
    value: string | number;
    sub: string;
    icon: any;
    color: string;
  } | null;
}

export default function CustomersMetricModal({ isOpen, onClose, metric }: CustomersMetricModalProps) {
  if (!metric) return null;

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4">
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
        />

        <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden border border-white"
        >
            <div className={`p-10 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-gray-100/50 rounded-full blur-3xl -mr-16 -mt-16"></div>
                
                <div className="relative z-10 flex items-center justify-between">
                    <div className={`h-14 w-14 rounded-2xl bg-white shadow-xl flex items-center justify-center ${metric.color} border border-gray-50`}>
                        {metric.icon}
                    </div>
                    <button onClick={onClose} className="h-10 w-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-slate-900 transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                <div className="relative z-10 mt-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-1 w-4 bg-[#004d4d] rounded-full"></div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{metric.label}</span>
                    </div>
                    <h3 className="text-5xl font-black text-gray-900 tracking-tighter italic">
                        {metric.value}
                    </h3>
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mt-2">
                        {metric.sub}
                    </p>
                </div>
            </div>

            <div className="p-10 space-y-8">
                <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={14} className="text-[#004d4d]"/> Análisis de Cartera
                    </h4>
                    <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-inner">
                        <p className="text-sm font-medium text-gray-600 leading-relaxed italic">
                            "Este indicador refleja la fidelidad de tu audiencia. Un valor de {metric.value} posiciona a Bayup un 15% por encima de la media del sector retail este mes."
                        </p>
                    </div>
                </section>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-3xl text-center">
                        <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Impacto LTV</p>
                        <p className="text-xl font-black text-emerald-700">+8.4%</p>
                    </div>
                    <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-3xl text-center">
                        <p className="text-[8px] font-black text-blue-600 uppercase mb-1">Confianza IA</p>
                        <p className="text-xl font-black text-blue-700">94.2%</p>
                    </div>
                </div>

                <button 
                    onClick={onClose}
                    className="w-full py-5 rounded-2xl bg-[#004d4d] text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-gray-200"
                >
                    Cerrar Análisis
                </button>
            </div>
        </motion.div>
    </div>
  );
}
