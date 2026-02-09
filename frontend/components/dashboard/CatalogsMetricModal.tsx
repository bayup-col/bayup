"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  TrendingUp, 
  ShoppingBag, 
  MessageSquare, 
  Users, 
  Zap,
  BarChart3,
  Activity
} from 'lucide-react';

interface CatalogsMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: any;
}

const CatalogsMetricModal = ({ isOpen, onClose, metric }: CatalogsMetricModalProps) => {
  if (!metric) return null;

  const renderMetricDetail = () => {
    switch (metric.id) {
      case 'active_catalogs':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[8px] font-black text-emerald-400 uppercase">Enviados</p>
                <p className="text-lg font-black text-emerald-700">12</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-[8px] font-black text-amber-400 uppercase">En Borrador</p>
                <p className="text-lg font-black text-amber-700">2</p>
              </div>
            </div>
            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-4">Canales de Difusión</p>
              <div className="space-y-3">
                <div className="flex justify-between items-end"><p className="text-[10px] font-black text-slate-600">WHATSAPP</p><p className="text-xs font-black text-[#004D4D]">85%</p></div>
                <div className="h-1.5 w-full bg-white rounded-full overflow-hidden shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-emerald-500 rounded-full" /></div>
                <div className="flex justify-between items-end pt-2"><p className="text-[10px] font-black text-slate-600">WEB MAYORISTA</p><p className="text-xs font-black text-[#004D4D]">15%</p></div>
                <div className="h-1.5 w-full bg-white rounded-full overflow-hidden shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: '15%' }} className="h-full bg-[#00F2FF] rounded-full" /></div>
              </div>
            </div>
          </div>
        );
      case 'orders_received':
        return (
          <div className="space-y-6">
            <div className="p-6 bg-purple-50 rounded-[2rem] border border-purple-100">
              <p className="text-[9px] font-black text-purple-400 uppercase mb-4">Tendencia de Pedidos (7d)</p>
              <div className="flex items-end justify-between h-20 gap-2">
                {[30, 50, 45, 80, 65, 90, 100].map((h, i) => (
                  <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} className="w-full bg-purple-500 rounded-t-lg opacity-80" />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[8px] font-bold text-purple-300"><span>LUN</span><span>DOM</span></div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white border border-purple-100 rounded-2xl shadow-sm">
              <Zap className="text-amber-500" size={16} />
              <p className="text-[10px] font-black text-purple-900 uppercase italic">Ticket Promedio: $ 450.000</p>
            </div>
          </div>
        );
      case 'revenue_generated':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-3"><Activity size={16} className="text-emerald-600"/><span className="text-[10px] font-black uppercase text-emerald-700">Tasa Conversión</span></div>
                <span className="text-sm font-black text-emerald-700">4.2%</span>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3"><TrendingUp size={16} className="text-[#004D4D]"/><span className="text-[10px] font-black uppercase text-slate-600">Crecimiento Mensual</span></div>
                <span className="text-sm font-black text-[#004D4D]">+12.5%</span>
              </div>
            </div>
            <p className="text-[10px] font-medium text-slate-500 italic text-center">"Tu canal de WhatsApp aporta el 68% de la facturación histórica de este módulo."</p>
          </div>
        );
      case 'wholesale_clients':
        return (
          <div className="space-y-6">
            <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
              <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-4">Top 3 Mayoristas</p>
              <div className="space-y-4">
                {['Roberto Gomez', 'Distribuidora Elite', 'Tienda Central'].map((name, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-xs font-bold text-white/80">{name}</span>
                    <span className="text-[10px] font-black text-[#00F2FF] italic">Gold Class</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="w-full py-3 bg-[#004D4D] text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-cyan-900/20 active:scale-95 transition-all">Ver Cartera Completa</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            className="bg-white w-full max-w-lg rounded-[4rem] shadow-3xl overflow-hidden relative border border-white/20 z-10"
          >
            <div className={`p-10 text-white relative overflow-hidden ${metric.color.replace('text-', 'bg-')}`}>
              <div className="absolute top-0 right-0 p-6 opacity-10">{metric.icon}</div>
              <h2 className="text-3xl font-black uppercase tracking-tight relative z-10">{metric.label}</h2>
              <p className="text-[10px] font-black uppercase mt-2 relative z-10 opacity-80">{metric.sub}</p>
              <button
                onClick={onClose}
                className="absolute top-8 right-8 bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-10 space-y-8 bg-white">
              <div className="text-center py-4">
                <span className="text-5xl font-black text-gray-900 italic tracking-tighter">{metric.value}</span>
                <p className="text-[10px] font-black text-gray-400 uppercase mt-4 tracking-widest">Inteligencia Comercial Bayup</p>
              </div>
              
              <div className="border-t border-gray-100 pt-8">
                {renderMetricDetail()}
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-black transition-all active:scale-95"
              >
                Cerrar Análisis
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CatalogsMetricModal;
