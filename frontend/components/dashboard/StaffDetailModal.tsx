"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Briefcase, 
  Award, 
  Activity, 
  MessageSquare, 
  ShieldCheck,
  Zap,
  Clock,
  History
} from "lucide-react";

interface StaffPayroll {
    id: string;
    name: string;
    role: string;
    base_salary: number;
    commissions: number;
    bonuses: number;
    deductions: number;
    status: 'paid' | 'pending' | 'processing';
    last_payment_date?: string;
}

interface StaffDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: StaffPayroll | null;
  period: string;
}

export default function StaffDetailModal({ isOpen, onClose, member, period }: StaffDetailModalProps) {
  if (!isOpen || !member) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  const netPay = member.base_salary + member.commissions + member.bonuses - member.deductions;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 100 }}
            className="relative bg-[#FAFAFA] w-full max-w-6xl h-[90vh] rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col md:flex-row"
          >
            {/* Close Button */}
            <button 
                onClick={onClose}
                className="absolute top-8 right-8 z-[1010] h-12 w-12 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all hover:rotate-90"
            >
                <X size={20}/>
            </button>

            {/* LEFT SIDEBAR: Profile & Quick Stats */}
            <div className="w-full md:w-[380px] bg-white border-r border-slate-100 p-10 flex flex-col items-center text-center space-y-8 overflow-y-auto">
                <div className="relative">
                    <div className="h-32 w-32 rounded-[2.5rem] bg-gradient-to-br from-[#004D4D] to-[#00f2ff] flex items-center justify-center text-white text-4xl font-black shadow-2xl italic">
                        {member.name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white shadow-lg">
                        <ShieldCheck size={18} />
                    </div>
                </div>
                
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{member.name}</h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{member.role}</p>
                    <div className={`mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        member.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                        Estado: {member.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-4 py-6 border-y border-slate-50">
                    <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Antigüedad</p>
                        <p className="text-lg font-black text-slate-900">1.5 Años</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Puntualidad</p>
                        <p className="text-lg font-black text-emerald-600">98%</p>
                    </div>
                </div>

                {/* Payroll Summary Card */}
                <div className="w-full bg-slate-900 rounded-[2.5rem] p-8 text-white text-left relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={80}/></div>
                    <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Neto a Recibir</p>
                    <h3 className="text-3xl font-black">{formatCurrency(netPay)}</h3>
                    <p className="text-[9px] text-slate-400 mt-4 border-t border-white/10 pt-4 font-medium italic">
                        Período: {period}
                    </p>
                </div>

                <button className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                    <MessageSquare size={16}/> Enviar Comprobante
                </button>
            </div>

            {/* RIGHT CONTENT: Detailed Analysis & History */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-12 space-y-10">
                <div className="flex justify-between items-end pr-12">
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Staff <span className="text-[#00f2ff]">Intelligence</span></h3>
                        <p className="text-slate-400 text-sm font-medium mt-1">Desglose de haberes, deducciones y proyecciones de talento.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Último Pago</p>
                        <p className="text-sm font-black text-slate-900">{member.last_payment_date || 'N/A'}</p>
                    </div>
                </div>

                {/* Financial Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-3 text-emerald-600">
                            <Zap size={18}/>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ingresos Extra</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{formatCurrency(member.commissions + member.bonuses)}</p>
                            <p className="text-[10px] font-bold text-emerald-500 mt-1">Comisiones + Bonos</p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-3 text-rose-500">
                            <Clock size={18}/>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deducciones</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{formatCurrency(member.deductions)}</p>
                            <p className="text-[10px] font-bold text-rose-400 mt-1">Salud, Pensión y Otros</p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-3 text-[#004D4D]">
                            <Activity size={18}/>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rendimiento</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">Excepcional</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 italic">Basado en KPIs de rol</p>
                        </div>
                    </div>
                </div>

                {/* Detailed Table of Concepts */}
                <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Briefcase size={14} className="text-[#004D4D]"/> Conceptos de Nómina
                    </h4>
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <tr>
                                    <th className="p-6">Descripción del Concepto</th>
                                    <th className="p-6 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                                <tr>
                                    <td className="p-6">Sueldo Base Mensual</td>
                                    <td className="p-6 text-right">{formatCurrency(member.base_salary)}</td>
                                </tr>
                                {member.commissions > 0 && (
                                    <tr>
                                        <td className="p-6 text-emerald-600">Comisiones por Ventas (+)</td>
                                        <td className="p-6 text-right text-emerald-600">+{formatCurrency(member.commissions)}</td>
                                    </tr>
                                )}
                                {member.bonuses > 0 && (
                                    <tr>
                                        <td className="p-6 text-emerald-600">Bonificaciones Extra (+)</td>
                                        <td className="p-6 text-right text-emerald-600">+{formatCurrency(member.bonuses)}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td className="p-6 text-rose-500">Deducciones de Ley (-)</td>
                                    <td className="p-6 text-right text-rose-500">-{formatCurrency(member.deductions)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Bayt Talent Insight */}
                <div className="bg-[#004D4D] p-10 rounded-[3rem] text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 transition-transform group-hover:scale-110 duration-700">
                        <Award size={150} fill="white" />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-[#00f2ff]/20 flex items-center justify-center border border-[#00f2ff]/30">
                                <Zap size={24} className="text-[#00f2ff]"/>
                            </div>
                            <h4 className="text-xl font-black uppercase italic tracking-tighter text-[#00f2ff]">Bayt Talent-Analysis</h4>
                        </div>
                        <p className="text-base font-medium leading-relaxed italic text-cyan-50/90 max-w-2xl">
                            &quot;{member.name} se mantiene en el top 5% de eficiencia operativa. Su costo de nómina está perfectamente equilibrado con su generación de valor. Sugiero considerar un plan de carrera para liderazgo de equipo en el próximo trimestre.&quot;
                        </p>
                    </div>
                </div>

                {/* Payment History Small Graph Placeholder */}
                <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <History size={14} className="text-[#004D4D]"/> Historial de Ingresos Neto
                    </h4>
                    <div className="h-32 w-full bg-white rounded-[2.5rem] border border-slate-100 p-8 flex items-end gap-2">
                        {[40, 60, 55, 80, 75, 90, 85, 100].map((h, i) => (
                            <div key={i} className="flex-1 bg-slate-50 rounded-t-lg relative group">
                                <motion.div 
                                    initial={{ height: 0 }} animate={{ height: `${h}%` }}
                                    className={`absolute bottom-0 w-full rounded-t-lg ${i === 7 ? 'bg-[#004D4D]' : 'bg-slate-200'}`}
                                />
                            </div>
                        ))}
                    </div>
                </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
