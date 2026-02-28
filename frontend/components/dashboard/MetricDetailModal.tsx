"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Target, 
  Package, 
  Zap, 
  Bot,
  ArrowUpRight,
  Activity,
  Sparkles
} from "lucide-react";
import { 
    AreaChart, 
    Area, 
    ResponsiveContainer
} from 'recharts';

interface MetricDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: {
    label: string;
    value: number;
    icon: any;
    color: string;
    bg: string;
    trend: string;
    isCurrency?: boolean;
    isPercentage?: boolean;
    details?: { l: string, v: string, icon: any }[];
    advice?: string;
  } | null;
}

const MOCK_CHART_DATA = [
    { name: '1', val: 0 },
    { name: '2', val: 0 },
    { name: '3', val: 0 },
    { name: '4', val: 0 },
    { name: '5', val: 0 },
    { name: '6', val: 0 },
    { name: '7', val: 0 },
];

export default function MetricDetailModal({ isOpen, onClose, metric }: MetricDetailModalProps) {
  if (!isOpen || !metric) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-10">
          {/* FONDO OSCURO TOTAL (FIJO E INMERSIVO) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#001A1A]/90 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            className="relative bg-white/95 backdrop-blur-3xl w-full max-w-[650px] rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20 flex flex-col z-10"
          >
            {/* Minimal Header */}
            <div className="p-8 pb-4 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg border border-white/20 ${metric.color} ${metric.bg}`}>
                        {metric.icon}
                    </div>
                    <div>
                        <h2 className="text-xl font-black italic tracking-tighter text-[#004d4d]">{metric.label}</h2>
                        <p className="text-[9px] font-black text-gray-400 tracking-widest">Análisis táctico live</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="h-10 w-10 rounded-full bg-gray-100 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center text-gray-400"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Content Body */}
            <div className="p-8 pt-4 space-y-8">
                
                {/* Main Metric Section */}
                <div className="flex items-end justify-between gap-10">
                    <div className="space-y-1">
                        <span className="text-5xl font-black text-gray-900 tracking-tighter italic">
                            {metric.isCurrency && "$ "}{metric.value.toLocaleString()}
                            {metric.isPercentage && "%"}
                        </span>
                        <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black tracking-tighter">
                            <ArrowUpRight size={14} /> {metric.trend} <span className="text-gray-300 ml-1">v2.0</span>
                        </div>
                    </div>
                    {/* Sparkline minimalista */}
                    <div className="flex-1 h-20 max-w-[200px] opacity-60">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={MOCK_CHART_DATA}>
                                <Area type="monotone" dataKey="val" stroke={metric.color.includes('emerald') ? '#10b981' : '#00f2ff'} strokeWidth={3} fillOpacity={0} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sub-Metrics Grid (Minimalista) */}
                <div className="grid grid-cols-3 gap-4 border-y border-gray-100 py-8">
                    {metric.details?.map((sm, i) => (
                        <div key={i} className="space-y-1 text-center border-r last:border-r-0 border-gray-100">
                            <p className="text-[8px] font-black text-gray-400 tracking-widest flex items-center justify-center gap-1">
                                {sm.icon} {sm.l}
                            </p>
                            <p className="text-lg font-black text-[#004d4d] italic">{sm.v}</p>
                        </div>
                    ))}
                </div>

                {/* Bayt Advice (Condensado y Elegante) */}
                <div className="bg-[#001A1A] p-8 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Bot size={80} />
                    </div>
                    <div className="relative z-10 flex gap-6 items-start">
                        <div className="h-10 w-10 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center shrink-0">
                            <Bot size={20} className="text-cyan animate-pulse" />
                        </div>
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-cyan tracking-[0.2em]">Bayt insight</p>
                            <p className="text-sm font-medium leading-relaxed italic text-gray-300">
                                &quot;{metric.advice || "Analizando comportamiento de mercado..."}&quot;
                            </p>
                        </div>
                    </div>
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
