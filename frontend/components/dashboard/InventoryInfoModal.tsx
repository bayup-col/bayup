"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Package, 
  Warehouse, 
  Bot, 
  Zap, 
  AlertTriangle, 
  TrendingUp,
  RotateCcw,
  ShieldCheck,
  Target
} from 'lucide-react';
import { useState } from 'react';

interface InventoryInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InventoryInfoModal = ({ isOpen, onClose }: InventoryInfoModalProps) => {
  const [activeTab, setActiveTab] = useState('existencias');

  const sections = {
    existencias: {
      title: "Control Maestro",
      icon: <Package size={20} />,
      color: "text-blue-500",
      content: "Gestiona el pulso real de tu mercancía. Bayup sincroniza cada venta, devolución y orden de compra para mantener un conteo exacto por referencia.",
      tip: "Usa los ajustes de inventario solo para mermas o daños físicos verificados."
    },
    bodegas: {
      title: "Red Logística",
      icon: <Warehouse size={20} />,
      color: "text-purple-500",
      content: "Visualiza la carga operativa de cada una de tus sedes. El sistema te permite balancear stock entre bodegas para evitar el lucro cesante por agotados.",
      tip: "Mantén un 'Stock de Seguridad' de al menos el 15% en tu bodega principal."
    },
    critico: {
      title: "Alertas Bayt",
      icon: <AlertTriangle size={20} />,
      color: "text-rose-500",
      content: "La IA identifica automáticamente los productos con alto riesgo de quiebre de stock basado en tu velocidad de venta actual.",
      tip: "Revisa diariamente la pestaña 'Stock Bajo' para emitir órdenes de compra preventivas."
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            className="relative bg-white w-full max-w-4xl h-[70vh] rounded-[3rem] shadow-2xl overflow-hidden border border-white flex flex-col md:flex-row"
          >
            {/* Sidebar Táctico */}
            <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-2">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#004D4D] mb-6">Guía de Inventario</h3>
              {Object.entries(sections).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${activeTab === key ? 'bg-[#004D4D] text-white shadow-lg shadow-[#004D4D]/20' : 'text-slate-500 hover:bg-white'}`}
                >
                  <div className={`${activeTab === key ? 'text-white' : item.color}`}>{item.icon}</div>
                  <span className="text-[10px] font-black uppercase tracking-wide">{item.title}</span>
                </button>
              ))}
            </div>

            {/* Contenido Principal */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center ${sections[activeTab as keyof typeof sections].color}`}>
                    {sections[activeTab as keyof typeof sections].icon}
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase italic">
                    {sections[activeTab as keyof typeof sections].title}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                <section>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="h-1 w-4 bg-[#004D4D] rounded-full"></div> ¿Cómo optimizar?
                  </h4>
                  <p className="text-sm font-medium text-slate-600 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 leading-relaxed">
                    {sections[activeTab as keyof typeof sections].content}
                  </p>
                </section>

                <div className="grid md:grid-cols-2 gap-8">
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck size={14} className="text-emerald-500" /> Seguridad
                    </h4>
                    <div className="p-6 bg-emerald-50/30 border border-emerald-100 rounded-[2rem]">
                      <p className="text-xs font-medium text-emerald-900 italic">
                        &quot;Cada movimiento de inventario queda registrado con responsable y hora para auditorías rápidas.&quot;
                      </p>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Zap size={14} className="text-amber-500" /> Estrategia Bayup
                    </h4>
                    <div className="p-6 bg-amber-50/30 border border-amber-100 rounded-[2rem]">
                      <p className="text-xs font-bold text-amber-900 leading-relaxed">
                        {sections[activeTab as keyof typeof sections].tip}
                      </p>
                    </div>
                  </section>
                </div>
              </div>

              <div className="p-8 border-t border-slate-50 flex justify-end bg-slate-50/30">
                <button
                  onClick={onClose}
                  className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-black transition-all active:scale-95"
                >
                  Entendido, Continuar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InventoryInfoModal;
