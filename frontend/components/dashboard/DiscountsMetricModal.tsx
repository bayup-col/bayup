"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  TrendingUp, 
  Tag, 
  DollarSign, 
  Target, 
  Zap, 
  PieChart, 
  CheckCircle2,
  Users,
  ShoppingCart
} from "lucide-react";

interface DiscountsMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: {
    label: string;
    value: string;
    sub: string;
    icon: any;
    color: string;
  } | null;
}

const METRIC_DETAILS: Record<string, any> = {
  "Cupones Emitidos": {
    description: "Volumen total de códigos promocionales creados y activos en el sistema.",
    insights: [
      { label: "Canal Web", value: "28", trend: "+2", icon: Tag },
      { label: "Canal Social", value: "14", trend: "Estable", icon: Users },
    ],
    deepDive: [
      { label: "Código más usado", value: "VERANO20", sub: "145 redenciones" },
      { label: "Promedio valor", value: "15%", sub: "Descuento medio otorgado" },
    ],
    advice: "Tienes un volumen alto de cupones. Considera limpiar los que tienen 0 redenciones en los últimos 30 días para mantener tu base de datos optimizada."
  },
  "Campañas Activas": {
    description: "Número de ofertas vigentes que pueden ser redimidas por los clientes en este momento.",
    insights: [
      { label: "Cupones", value: "5", trend: "OK", icon: Tag },
      { label: "Automáticos", value: "3", trend: "Fijo", icon: Zap },
    ],
    deepDive: [
      { label: "Próximo a expirar", value: "BIENVENIDA", sub: "En 3 días" },
      { label: "Campaña Top", value: "Envío Gratis", sub: "Mayor impacto en checkout" },
    ],
    advice: "Las campañas automáticas tienen un 40% más de efectividad que los cupones manuales. Intenta convertir una de tus promos activas a formato automático."
  },
  "Tasa Redención": {
    description: "Porcentaje de carritos que finalizan compra utilizando un beneficio de descuento.",
    insights: [
      { label: "Conversión c/desc", value: "32%", trend: "+5%", icon: TrendingUp },
      { label: "Abandono c/desc", value: "12%", trend: "Bajo", icon: ShoppingCart },
    ],
    deepDive: [
      { label: "Valor promedio", value: "$ 185k", sub: "Carrito con cupón" },
      { label: "ROI Promocional", value: "4.2x", sub: "Retorno por cada peso descontado" },
    ],
    advice: "Tu tasa de redención es excelente (24.5%). Esto indica que tus descuentos son atractivos. No subas el mínimo de compra por ahora."
  },
  "Ahorro Generado": {
    description: "Monto total de dinero que los clientes han dejado de pagar gracias a tus promociones.",
    insights: [
      { label: "Ventas Totales", value: "$ 25.1M", trend: "+12%", icon: DollarSign },
      { label: "Costo Marketing", value: "$ 4.2M", trend: "Dentro de meta", icon: PieChart },
    ],
    deepDive: [
      { label: "Margen sacrificado", value: "8.5%", sub: "Sobre ventas totales" },
      { label: "Utilidad neta adj.", value: "16.2M", sub: "Después de descuentos" },
    ],
    advice: "El ahorro generado está impulsando el volumen de ventas. Asegúrate de que el margen de utilidad neta se mantenga por encima del 15%."
  }
};

export default function DiscountsMetricModal({ isOpen, onClose, metric }: DiscountsMetricModalProps) {
  if (!isOpen || !metric) return null;

  const details = METRIC_DETAILS[metric.label] || {
    description: "Información detallada de la métrica seleccionada.",
    insights: [],
    deepDive: [],
    advice: "Analiza esta métrica para optimizar tu rentabilidad comercial."
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[600]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 m-auto w-full max-w-2xl h-fit max-h-[90vh] z-[601] p-4 pointer-events-none flex items-center justify-center"
          >
            <div className="bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl rounded-[3rem] w-full pointer-events-auto overflow-hidden flex flex-col">
              
              <div className="relative p-10 pb-6 border-b border-gray-100">
                <button 
                    onClick={onClose}
                    className="absolute top-8 right-8 h-10 w-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-all text-gray-400"
                >
                    <X size={20} />
                </button>
                
                <div className="flex items-center gap-4 mb-2">
                   <span className="px-3 py-1 bg-[#004d4d] text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                      Marketing Intelligence
                   </span>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl bg-white shadow-lg flex items-center justify-center ${metric.color}`}>
                        {metric.icon}
                    </div>
                    <h2 className="text-4xl font-black italic tracking-tighter text-[#004d4d] uppercase">
                        {metric.label}
                    </h2>
                </div>
                <p className="text-gray-500 font-medium mt-4 max-w-md">
                  {details.description}
                </p>
              </div>

              <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar max-h-[60vh]">
                
                <div className="flex items-end justify-between bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor Actual</p>
                        <p className="text-5xl font-black text-gray-900 mt-1">{metric.value}</p>
                    </div>
                    <div className="h-16 flex items-end gap-1.5">
                        {[40, 60, 45, 80, 50, 100, 85].map((h, i) => (
                            <div key={i} style={{ height: `${h}%` }} className={`w-2.5 rounded-t-sm ${i === 6 ? 'bg-[#00f2ff]' : 'bg-gray-200'}`}></div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {details.insights.map((insight: any, i: number) => (
                      <div key={i} className="bg-white p-6 rounded-[1.8rem] border border-gray-100 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-2 bg-gray-50 rounded-xl text-gray-600">
                             <insight.icon size={18} />
                          </div>
                          <span className="text-[10px] font-black text-[#004d4d] bg-[#00f2ff]/10 px-2 py-0.5 rounded uppercase">{insight.trend}</span>
                        </div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{insight.label}</p>
                        <p className="text-xl font-black text-gray-900">{insight.value}</p>
                      </div>
                    ))}
                </div>

                <div className="bg-[#004d4d] p-8 rounded-[2rem] text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
                        <Zap size={100} fill="white" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-[#00f2ff] text-[#004d4d] text-[9px] font-black uppercase px-3 py-1 rounded-full">Bayt AI Strategic-Tip</span>
                        </div>
                        <p className="text-sm font-medium italic leading-relaxed text-cyan-50">
                            &quot;{details.advice}&quot;
                        </p>
                    </div>
                </div>

              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
