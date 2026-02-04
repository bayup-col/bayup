"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  TrendingUp, 
  Coins, 
  Users, 
  Clock, 
  Gift, 
  PieChart, 
  Activity,
  Zap,
  Target,
  ShoppingCart
} from "lucide-react";

interface LoyaltyMetricModalProps {
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
  "Puntos Emitidos": {
    description: "Total de puntos cargados a las cuentas de los clientes por sus compras.",
    insights: [
      { label: "Canal Web", value: "650k", trend: "+8%", icon: Activity },
      { label: "Puntos / Compra", value: "120", trend: "Estable", icon: Coins },
    ],
    deepDive: [
      { label: "Pasivo Financiero", value: "$ 1.2M", sub: "Valor real en bonos" },
      { label: "Meta Mensual", value: "2.0M", sub: "Proyección emisión" },
    ],
    advice: "La emisión de puntos ha crecido un 8%. Asegúrate de que el catálogo de premios sea lo suficientemente atractivo para incentivar la redención y no acumular pasivos."
  },
  "Miembros Activos": {
    description: "Clientes que han realizado al menos una compra o interacción en el club en los últimos 90 días.",
    insights: [
      { label: "Nuevos Hoy", value: "12", trend: "+2", icon: Users },
      { label: "Tasa Actividad", value: "78%", trend: "Alta", icon: TrendingUp },
    ],
    deepDive: [
      { label: "Top Nivel", value: "Oro", sub: "Nivel con más miembros" },
      { label: "Churn Rate", value: "4.2%", sub: "Abandono del club" },
    ],
    advice: "El nivel Oro es tu motor principal. Considera un beneficio exclusivo de 'Acceso VIP' para evitar que se sientan estancados antes de llegar a Diamante."
  },
  "Puntos por Vencer": {
    description: "Puntos que caducarán al final del período si no son utilizados por los clientes.",
    insights: [
      { label: "Impacto Proyectado", value: "$ 450k", trend: "Alerta", icon: Clock },
      { label: "Notificados", value: "85%", trend: "OK", icon: Zap },
    ],
    deepDive: [
      { label: "Vence en 7 días", value: "12.400 pts", sub: "Urgencia máxima" },
      { label: "Segmento Crítico", value: "Nivel Plata", sub: "Mayor riesgo pérdida" },
    ],
    advice: "Tienes 45.200 puntos por vencer. Dispara una campaña de email marketing hoy mismo con el asunto '¡Tus puntos expiran!' para forzar ventas de último minuto."
  },
  "Tasa Redención": {
    description: "Efectividad del programa. Porcentaje de puntos emitidos que regresan como compras mediante canje.",
    insights: [
      { label: "Redenciones Hoy", value: "8", trend: "OK", icon: Gift },
      { label: "Valor Canje", value: "$ 12k", trend: "Bajo", icon: ShoppingCart },
    ],
    deepDive: [
      { label: "Premio Favorito", value: "Bono Regalo", sub: "45% de canjes" },
      { label: "ROI Lealtad", value: "3.2x", sub: "Venta extra por punto" },
    ],
    advice: "Tu tasa del 62% es muy saludable. Indica que los clientes confían en el sistema. Puedes intentar subir ligeramente el costo en puntos de los premios top."
  }
};

export default function LoyaltyMetricModal({ isOpen, onClose, metric }: LoyaltyMetricModalProps) {
  if (!isOpen || !metric) return null;

  const details = METRIC_DETAILS[metric.label] || {
    description: "Información detallada de la métrica de lealtad.",
    insights: [],
    deepDive: [],
    advice: "Analiza esta métrica para optimizar tu estrategia de fidelización."
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
                   <span className="px-3 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                      Loyalty Intelligence
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
                            <div key={i} style={{ height: `${h}%` }} className={`w-2.5 rounded-t-sm ${i === 6 ? 'bg-amber-500' : 'bg-gray-200'}`}></div>
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
                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">{insight.trend}</span>
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
                            <span className="bg-[#00f2ff] text-[#004d4d] text-[9px] font-black uppercase px-3 py-1 rounded-full">Bayt AI Growth-Tip</span>
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
