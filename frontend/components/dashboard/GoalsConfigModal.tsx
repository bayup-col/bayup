"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Save, DollarSign, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

interface Advisor {
  name: string;
  ventas: number;
  conversion: string;
  growth: string;
  status: string;
}

interface GoalsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  advisors: Advisor[];
}

export default function GoalsConfigModal({ isOpen, onClose, advisors }: GoalsConfigModalProps) {
  // Estado local para las metas (simulado)
  const [goals, setGoals] = useState<Record<string, number>>({});
  const [bonusEnabled, setBonusEnabled] = useState(true);

  // Inicializar metas con valores mock al abrir
  useEffect(() => {
    if (isOpen) {
      const initialGoals: Record<string, number> = {};
      advisors.forEach(adv => {
        // Meta por defecto: Ventas actuales + 20%
        initialGoals[adv.name] = Math.ceil((adv.ventas * 1.2) / 100000) * 100000; 
      });
      setGoals(initialGoals);
    }
  }, [isOpen, advisors]);

  const handleGoalChange = (name: string, value: string) => {
    const numericValue = parseInt(value.replace(/\D/g, '')) || 0;
    setGoals(prev => ({ ...prev, [name]: numericValue }));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  const calculateProgress = (current: number, goal: number) => {
    if (goal === 0) return 100;
    return Math.min(100, (current / goal) * 100);
  };

  if (!isOpen) return null;

  const totalGoal = Object.values(goals).reduce((a, b) => a + b, 0);
  const totalCurrent = advisors.reduce((a, b) => a + b.ventas, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-[#004D4D] p-8 pb-12 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                    <Target size={120} className="text-white"/>
                </div>
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-[#00f2ff] text-[#004D4D] rounded-full text-[10px] font-black uppercase tracking-widest">Administración</span>
                        </div>
                        <h2 className="text-3xl font-black text-white italic tracking-tighter">Metas Comerciales</h2>
                        <p className="text-cyan-100 text-sm mt-1 font-medium">Define los objetivos mensuales para tu equipo de ventas.</p>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
                        <X size={20}/>
                    </button>
                </div>
            </div>

            {/* Summary Card (Floating overlap) */}
            <div className="px-8 -mt-8 relative z-20 shrink-0">
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta Global (Mes)</p>
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(totalGoal)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progreso Actual</p>
                        <div className="flex items-center gap-2 justify-end">
                            <p className="text-2xl font-black text-emerald-600">
                                {((totalCurrent / totalGoal) * 100).toFixed(1)}%
                            </p>
                            <TrendingUp size={20} className="text-emerald-500"/>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                
                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-3">
                        <div className={`h-5 w-10 rounded-full p-1 cursor-pointer transition-colors ${bonusEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`} onClick={() => setBonusEnabled(!bonusEnabled)}>
                            <div className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${bonusEnabled ? 'translate-x-5' : ''}`}></div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-700 uppercase">Activar Bonos de Rendimiento</p>
                            <p className="text-[10px] text-slate-500">Se notificará a los asesores sobre el incentivo.</p>
                        </div>
                    </div>
                    <DollarSign size={20} className="text-amber-500"/>
                </div>

                <div className="space-y-4">
                    {advisors.map((advisor, index) => {
                        const goal = goals[advisor.name] || 0;
                        const progress = calculateProgress(advisor.ventas, goal);
                        
                        return (
                            <div key={index} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-cyan-200 hover:bg-cyan-50/20 transition-all group">
                                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-600 text-lg">
                                    {advisor.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-900 truncate">{advisor.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#004D4D] rounded-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400">{progress.toFixed(0)}%</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Objetivo</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                        <input 
                                            type="text" 
                                            value={goal.toLocaleString()}
                                            onChange={(e) => handleGoalChange(advisor.name, e.target.value)}
                                            className="w-32 bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-6 pr-3 text-right text-sm font-bold text-slate-900 focus:outline-none focus:border-[#00f2ff] focus:ring-2 focus:ring-[#00f2ff]/20 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-4 justify-end">
                <button onClick={onClose} className="px-6 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors uppercase tracking-wider">
                    Cancelar
                </button>
                <button onClick={onClose} className="px-8 py-3 rounded-xl bg-[#004D4D] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#004d4d]/20 hover:bg-[#003333] hover:scale-105 transition-all flex items-center gap-2">
                    <Save size={16}/> Guardar Cambios
                </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
