"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MessageSquare, 
  Globe, 
  Zap, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Users,
  Target,
  Bot
} from 'lucide-react';

interface ChatsMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: {
    label: string;
    value: string | number;
    sub: string;
    icon: React.ReactNode;
    color: string;
  } | null;
}

export default function ChatsMetricModal({ isOpen, onClose, metric }: ChatsMetricModalProps) {
  if (!isOpen || !metric) return null;

  const getMetricInsight = (label: string) => {
    switch (label) {
      case 'Todos los Chats':
        return "El volumen de conversaciones ha crecido un 15% respecto a la semana pasada. Instagram es el canal con mayor tracción hoy.";
      case 'Canales Activos':
        return "Todos los puentes de comunicación (WhatsApp, IG, ML, Shopify) operan con latencia < 200ms. Sincronización óptima.";
      case 'Eficiencia IA':
        return "Bayt AI ha resuelto 8 de cada 10 dudas básicas hoy. El ahorro operativo estimado es de 4.5 horas hombre.";
      case 'Ventas Chat':
        return "La tasa de conversión en chat es de 4.2%. El producto más solicitado por este medio es 'Reloj Gold'.";
      default:
        return "Análisis de inteligencia en tiempo real procesado por Bayt AI.";
    }
  };

  return (
    <div className="fixed inset-0 z-[1600] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 100 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 100 }}
        className="bg-white w-full max-w-4xl rounded-[4rem] shadow-3xl overflow-hidden flex flex-col relative z-10 border border-white/20"
      >
        <div className="bg-gray-900 p-12 text-white relative">
          <button onClick={onClose} className="absolute top-10 right-10 text-white/30 hover:text-white transition-colors"><X size={28} /></button>
          <div className="flex items-center gap-8 relative z-10">
            <div className={`h-24 w-24 rounded-[2rem] bg-white flex items-center justify-center ${metric.color} shadow-2xl`}>
              {metric.icon}
            </div>
            <div>
              <p className="text-[10px] font-black text-[#00f2ff] uppercase tracking-[0.4em] mb-2">Métrica de Inteligencia</p>
              <h2 className="text-5xl font-black italic tracking-tighter uppercase">{metric.label}</h2>
            </div>
          </div>
        </div>

        <div className="p-12 space-y-10 bg-[#FAFAFA]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Valor Actual</p>
              <h3 className="text-6xl font-black text-gray-900 tracking-tighter">{metric.value}</h3>
              <p className="text-sm font-bold text-emerald-500 mt-2 flex items-center gap-2">
                <TrendingUp size={16} /> +12.5% vs periodo anterior
              </p>
            </div>
            <div className="bg-gray-900 p-10 rounded-[3rem] text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10"><Bot size={100} /></div>
              <h4 className="text-[#00f2ff] text-[10px] font-black uppercase tracking-widest mb-4">Análisis de Bayt AI</h4>
              <p className="text-lg font-medium italic opacity-90 leading-relaxed">
                "{getMetricInsight(metric.label)}"
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Desglose por Canal</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'WhatsApp', val: '45%', color: 'bg-emerald-500' },
                { label: 'Instagram', val: '25%', color: 'bg-rose-500' },
                { label: 'ML', val: '20%', color: 'bg-amber-500' },
                { label: 'Shopify', val: '10%', color: 'bg-blue-500' }
              ].map((c, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black uppercase text-gray-400">{c.label}</span>
                    <span className="text-xs font-black text-gray-900">{c.val}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: c.val }} className={`h-full ${c.color}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-center">
            <button onClick={onClose} className="px-16 py-5 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:scale-105 transition-all">Cerrar Protocolo</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
