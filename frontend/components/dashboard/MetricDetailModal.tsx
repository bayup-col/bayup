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
  } | null;
}

const MOCK_CHART_DATA = [
    { name: '1', val: 400 },
    { name: '2', val: 700 },
    { name: '3', val: 1200 },
    { name: '4', val: 900 },
    { name: '5', val: 1500 },
    { name: '6', val: 1800 },
    { name: '7', val: 1400 },
];

export default function MetricDetailModal({ isOpen, onClose, metric }: MetricDetailModalProps) {
  if (!isOpen || !metric) return null;

  const getSubMetrics = () => {
    switch (metric.label) {
        case "Ventas de Hoy": return [
            { l: "Ticket Prom.", v: "$ 85k", icon: <DollarSign size={14}/> },
            { l: "Margen Bruto", v: "24%", icon: <Zap size={14}/> },
            { l: "Ventas/Hora", v: "4.2", icon: <Activity size={14}/> }
        ];
        case "Órdenes Activas": return [
            { l: "Por Despachar", v: "12", icon: <Package size={14}/> },
            { l: "En Tránsito", v: "45", icon: <TrendingUp size={14}/> },
            { l: "Demora Prom.", v: "2h", icon: <Activity size={14}/> }
        ];
        case "Tasa de Conversión": return [
            { l: "Visitas", v: "1.2k", icon: <Target size={14}/> },
            { l: "Carritos", v: "85", icon: <ShoppingBag size={14}/> },
            { l: "ROI Proy.", v: "4.5x", icon: <Sparkles size={14}/> }
        ];
        case "Stock Crítico": return [
            { l: "Items Agotados", v: "3", icon: <Package size={14}/> },
            { l: "Reposición", v: "En camino", icon: <Activity size={14}/> },
            { l: "Valor Inmov.", v: "$ 4.2M", icon: <DollarSign size={14}/> }
        ];
        default: return [];
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#001A1A]/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white/90 backdrop-blur-2xl w-full max-w-[600px] rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] overflow-hidden border border-white/40 flex flex-col"
          >
            {/* Minimal Header */}
            <div className="p-8 pb-4 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg border border-white/20 ${metric.color} ${metric.bg}`}>
                        {metric.icon}
                    </div>
                    <div>
                        <h2 className="text-xl font-black italic uppercase tracking-tighter text-[#004d4d]">{metric.label}</h2>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Análisis Táctico Live</p>
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
                        <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-tighter">
                            <ArrowUpRight size={14} /> {metric.trend} <span className="text-gray-300 ml-1">vs ayer</span>
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
                    {getSubMetrics().map((sm, i) => (
                        <div key={i} className="space-y-1 text-center border-r last:border-r-0 border-gray-100">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1">
                                {sm.icon} {sm.l}
                            </p>
                            <p className="text-lg font-black text-[#004d4d] italic uppercase">{sm.v}</p>
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
                            <p className="text-[10px] font-black text-cyan uppercase tracking-[0.2em]">Bayt Insight</p>
                            <p className="text-sm font-medium leading-relaxed italic text-gray-300">
                                &quot;{getAdvice(metric.label)}&quot;
                            </p>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={onClose}
                    className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-gray-200"
                >
                    Continuar Operación
                </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Función auxiliar para el consejo
function getAdvice(label: string) {
    switch (label) {
        case "Ventas de Hoy": return "Pico de ventas detectado. El ticket promedio ha subido un 12%.";
        case "Órdenes Activas": return "Flujo logístico saludable. Prioriza las entregas locales.";
        case "Tasa de Conversión": return "Conversión optimizada. Tu campaña actual está performando.";
        case "Stock Crítico": return "3 SKUs requieren reposición inmediata para evitar quiebre.";
        default: return "Datos actualizados en tiempo real.";
    }
}
