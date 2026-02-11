"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  TrendingUp, 
  Rocket, 
  DollarSign, 
  Target, 
  Zap, 
  PieChart, 
  Activity,
  ThumbsUp,
  ThumbsDown,
  Globe,
  Monitor,
  ShoppingCart,
  ShoppingBag,
  Tag,
  Users,
  Lightbulb
} from "lucide-react";

interface MarketingMetricModalProps {
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
  "Campañas Activas": {
    description: "Volumen total de estrategias comerciales corriendo simultáneamente en tus canales digitales.",
    insights: [
      { label: "Canal WhatsApp", value: "5", trend: "OK", icon: Zap },
      { label: "Canal Social", value: "3", trend: "Estable", icon: Globe },
    ],
    deepDive: [
      { label: "Alcance Total", value: "45.2k", sub: "Personas impactadas" },
      { label: "Meta Mensual", value: "12", sub: "Proyección campañas" },
    ],
    advice: "Tienes 8 campañas activas. Mantén este ritmo, pero asegúrate de que el presupuesto de las 2 campañas con ROAS bajo (< 1.5x) sea redistribuido a las de mayor éxito."
  },
  "Ventas Marketing": {
    description: "Ingresos totales atribuidos directamente a tus esfuerzos publicitarios y promocionales.",
    insights: [
      { label: "Atribución Directa", value: "85%", trend: "Alta", icon: Target },
      { label: "Venta Asistida", value: "15%", trend: "Normal", icon: Activity },
    ],
    deepDive: [
      { label: "Ventas Orgánicas", value: "$ 2.1M", sub: "Sin inversión directa" },
      { label: "Ventas Pagas", value: "$ 10.3M", sub: "ROI Atribuido" },
    ],
    advice: "Tus ventas de marketing han subido un 15%. La efectividad del canal de WhatsApp está empujando el total hacia arriba. Sigue optimizando los copies de este canal."
  },
  "ROAS Promedio": {
    description: "Return On Ad Spend. Cuántos pesos recuperas por cada peso invertido en pauta.",
    insights: [
      { label: "Mejor ROAS", value: "8.2x", trend: "Top", icon: TrendingUp },
      { label: "ROAS Crítico", value: "0.8x", trend: "Alerta", icon: ThumbsDown },
    ],
    deepDive: [
      { label: "Inversión Total", value: "$ 2.5M", sub: "Presupuesto ejecutado" },
      { label: "Profit Neto", value: "$ 9.9M", sub: "Ganancia marketing" },
    ],
    advice: "Tu ROAS de 4.8x es excelente. Estás muy cerca de la meta de 5.0x. Incrementar el presupuesto en el segmento de 'Retargeting' podría darte ese empujón final."
  },
  "CAC Promedio": {
    description: "Customer Acquisition Cost. El costo promedio para conseguir que un cliente nuevo realice su primera compra.",
    insights: [
      { label: "CAC Mobile", value: "$ 10.2k", trend: "-2%", icon: Monitor },
      { label: "CAC Desktop", value: "$ 18.5k", trend: "+5%", icon: Globe },
    ],
    deepDive: [
      { label: "Límite Rentable", value: "$ 15.0k", sub: "Basado en margen" },
      { label: "Eficiencia CAC", value: "+12%", trend: "Mejorando" },
    ],
    advice: "Tu CAC de $12.500 es muy saludable. Se mantiene un 20% por debajo de tu límite rentable. Puedes permitirte ser más agresivo en la puja de subastas de Instagram."
  },
  "Mejor Campaña": {
    description: "La estrategia comercial con el mayor retorno de inversión del período actual.",
    insights: [
      { label: "Ventas", value: "$ 8.4M", trend: "Top", icon: ShoppingBag },
      { label: "Redención", value: "145", sub: "Cupones usados", icon: Tag },
    ],
    deepDive: [
      { label: "Nombre", value: "Cyber Bayup", sub: "Campaña Cyber Monday" },
      { label: "ROAS", value: "8.2x", sub: "Retorno excepcional" },
    ],
    advice: "La campaña 'Cyber Bayup' fue un éxito total. Analiza el copy y el banner usado aquí para replicar la misma psicología de venta en tu próxima oferta relámpago."
  },
  "Peor Campaña": {
    description: "La campaña con el menor rendimiento. Requiere optimización urgente o desactivación.",
    insights: [
      { label: "Ventas", value: "$ 0.4M", trend: "Bajo", icon: ShoppingBag },
      { label: "Clicks", value: "12", sub: "Tráfico insuficiente", icon: Activity },
    ],
    deepDive: [
      { label: "Nombre", value: "Test FB Ads", sub: "Experimento inicial" },
      { label: "ROAS", value: "0.8x", sub: "Pérdida de inversión" },
    ],
    advice: "La campaña 'Test FB Ads' está drenando presupuesto. Bayt sugiere desactivarla hoy mismo y mover ese fondo a la campaña de WhatsApp que tiene un ROI 4x superior."
  }
};

export default function MarketingMetricModal({ isOpen, onClose, metric }: MarketingMetricModalProps) {
  if (!isOpen || !metric) return null;

  const details = METRIC_DETAILS[metric.label] || {
    description: "Información detallada de la métrica de marketing.",
    insights: [],
    deepDive: [],
    advice: "Analiza esta métrica para optimizar tu ROI publicitario."
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
                      Marketing Analysis
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
                
                <div className="flex items-end justify-between bg-gray-50 p-8 rounded-[2rem] border border-gray-100 shadow-inner">
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
                    {details.insights.map((insight: any, i: number) => {
                      const Icon = insight.icon;
                      return (
                        <div key={i} className="bg-white p-6 rounded-[1.8rem] border border-gray-100 shadow-sm">
                          <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-gray-50 rounded-xl text-gray-600">
                               {Icon && <Icon size={18} />}
                            </div>
                            <span className="text-[10px] font-black text-[#004d4d] bg-[#00f2ff]/10 px-2 py-0.5 rounded uppercase">{insight.trend}</span>
                          </div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{insight.label}</p>
                          <p className="text-xl font-black text-gray-900">{insight.value}</p>
                        </div>
                      );
                    })}
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
