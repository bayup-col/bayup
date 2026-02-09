"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  DollarSign, 
  Warehouse,
  Activity,
  BarChart3,
  Target
} from 'lucide-react';

interface InventoryMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: any;
}

const InventoryMetricModal = ({ isOpen, onClose, metric }: InventoryMetricModalProps) => {
  if (!metric) return null;

  const renderMetricDetail = () => {
    switch (metric.id) {
      case 'total_units':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[8px] font-black text-emerald-400 uppercase">En Bodega</p>
                <p className="text-lg font-black text-emerald-700">12,450</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-[8px] font-black text-blue-400 uppercase">En Tránsito</p>
                <p className="text-lg font-black text-blue-700">1,800</p>
              </div>
            </div>
            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-4">Composición por Categoría</p>
              <div className="space-y-3">
                <div className="flex justify-between items-end"><p className="text-[10px] font-black text-slate-600">CALZADO</p><p className="text-xs font-black text-[#004D4D]">45%</p></div>
                <div className="h-1.5 w-full bg-white rounded-full overflow-hidden shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: '45%' }} className="h-full bg-emerald-500 rounded-full" /></div>
                <div className="flex justify-between items-end pt-2"><p className="text-[10px] font-black text-slate-600">ROPA</p><p className="text-xs font-black text-[#004D4D]">35%</p></div>
                <div className="h-1.5 w-full bg-white rounded-full overflow-hidden shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: '35%' }} className="h-full bg-[#00F2FF] rounded-full" /></div>
              </div>
            </div>
          </div>
        );
      case 'investment_value':
        return (
          <div className="space-y-6">
            <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
              <p className="text-[9px] font-black text-emerald-400 uppercase mb-4">Valoración de Activos (7d)</p>
              <div className="flex items-end justify-between h-20 gap-2">
                {[60, 80, 75, 90, 85, 95, 100].map((h, i) => (
                  <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} className="w-full bg-emerald-500 rounded-t-lg opacity-80" />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[8px] font-bold text-emerald-300"><span>LUN</span><span>DOM</span></div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white border border-emerald-100 rounded-2xl shadow-sm">
              <TrendingUp className="text-emerald-600" size={16} />
              <p className="text-[10px] font-black text-emerald-900 uppercase italic">Rentabilidad Proyectada: +22%</p>
            </div>
          </div>
        );
      case 'critical_stock':
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">⚠️ Alertas Inmediatas</p>
              {['Zapatos Oxford - Talla 40', 'Camisa Lino - Blanca XL', 'Gafas Aviador - Silver'].map((item, i) => (
                <div key={i} className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between animate-pulse">
                  <span className="text-[10px] font-bold text-rose-700">{item}</span>
                  <span className="text-[8px] font-black bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full uppercase">AGOTADO</span>
                </div>
              ))}
            </div>
            <button className="w-full py-3 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-rose-900/20 active:scale-95 transition-all">Emitir Órdenes de Compra</button>
          </div>
        );
      case 'rotation_rate':
        return (
          <div className="space-y-6">
            <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
              <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-4">Eficiencia de Giro</p>
              <div className="flex items-center justify-center py-10 relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                  <motion.circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="364.4" initial={{ strokeDashoffset: 364.4 }} animate={{ strokeDashoffset: 364.4 * (1 - 0.74) }} className="text-[#00F2FF]" />
                </svg>
                <span className="absolute text-2xl font-black italic">74%</span>
              </div>
            </div>
            <p className="text-[10px] font-medium text-slate-500 italic text-center">"Tu inventario rota cada 12 días en promedio. Estás por encima del 15% del sector."</p>
          </div>
        );
      case 'incoming_stock':
        return (
          <div className="space-y-6">
            <div className="p-6 bg-purple-50 rounded-[2rem] border border-purple-100">
              <p className="text-[9px] font-black text-purple-400 uppercase mb-4">Cronograma de Arribo</p>
              <div className="space-y-4">
                {[ { label: 'Mañana', qty: 450 }, { id: 'prox_semana', label: 'Próx. Semana', qty: 1400 } ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm">
                    <span className="text-xs font-bold text-slate-600">{item.label}</span>
                    <span className="text-xs font-black text-purple-600">{item.qty} Unidades</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[10px] font-medium text-slate-500 italic text-center">"Stock valorado en $ 42.5M en proceso de tránsito."</p>
          </div>
        );
      case 'dead_stock':
        return (
          <div className="space-y-6">
            <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100">
              <p className="text-[9px] font-black text-rose-400 uppercase mb-4">Referencias Sin Movimiento</p>
              <div className="space-y-3">
                {['Reloj Vintage - Silver', 'Correa Cuero XL', 'Set Medias X3'].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-white rounded-xl">
                    <span className="text-[10px] font-bold text-slate-600">{item}</span>
                    <span className="text-[8px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full uppercase">65 DÍAS</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="w-full py-3 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-rose-900/20">Activar Descuento de Liquidación</button>
          </div>
        );
      case 'retail_valuation':
        return (
          <div className="space-y-6">
            <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
              <p className="text-[9px] font-black text-emerald-400 uppercase mb-4">Potencial de Venta</p>
              <div className="flex items-end justify-between h-20 gap-2">
                {[40, 60, 55, 80, 75, 90, 100].map((h, i) => (
                  <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} className="w-full bg-emerald-500 rounded-t-lg opacity-80" />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[8px] font-bold text-emerald-300"><span>LUN</span><span>DOM</span></div>
            </div>
            <div className="p-4 bg-white border border-emerald-100 rounded-2xl shadow-sm text-center">
              <p className="text-[10px] font-black text-emerald-900 uppercase">Utilidad Bruta Proyectada</p>
              <p className="text-xl font-black text-emerald-600 mt-1">$ 116.7M</p>
            </div>
          </div>
        );
      case 'audit_accuracy':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-6 p-8 bg-indigo-50 rounded-[3rem] border border-indigo-100 relative overflow-hidden">
              <ShieldCheck className="text-indigo-200 absolute -right-4 -bottom-4" size={120} />
              <div className="relative z-10">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Estado de Confianza</p>
                <h4 className="text-2xl font-black text-indigo-900 italic mt-1">Audit Score A+</h4>
                <p className="text-xs font-medium text-indigo-700 mt-4 leading-relaxed">"Solo se detectó un descuadre de 12 unidades sobre un universo de 14,250 en la última auditoría."</p>
              </div>
            </div>
            <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Solicitar Nueva Auditoría</button>
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
            <div className={`p-10 text-white relative overflow-hidden ${metric.bg.replace('from-', 'bg-').split(' ')[0]}`}>
              <div className="absolute top-0 right-0 p-6 opacity-10">{metric.icon}</div>
              <h2 className="text-3xl font-black uppercase tracking-tight relative z-10">{metric.title}</h2>
              <p className="text-[10px] font-black uppercase mt-2 relative z-10 opacity-80">{metric.trend}</p>
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
                <p className="text-[10px] font-black text-gray-400 uppercase mt-4 tracking-widest">Inventory Strategist Bayup</p>
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

export default InventoryMetricModal;
