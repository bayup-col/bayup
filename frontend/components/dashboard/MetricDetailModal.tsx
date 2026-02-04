"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Zap, 
  Users, 
  ShoppingCart, 
  Globe, 
  Smartphone, 
  CreditCard,
  PieChart,
  BarChart2,
  AlertCircle
} from "lucide-react";

interface MetricDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: {
    label: string;
    value: string;
    sub: string;
    trend: string;
    color: string;
  } | null;
}

// --- DATOS ESPECÍFICOS PARA CADA MÉTRICA (SIMULADOS) ---
const METRIC_DETAILS: Record<string, any> = {
  "Ventas Brutas": {
    description: "Desglose total de ingresos facturados antes de deducciones.",
    insights: [
      { label: "Canal Online", value: "65%", trend: "+12%", icon: Globe },
      { label: "Punto de Venta", value: "35%", trend: "-2%", icon: ShoppingCart },
    ],
    deepDive: [
      { label: "Hora Pico", value: "18:00 - 20:00", sub: "Mayor volumen transaccional" },
      { label: "Producto Top", value: "Sneakers Urban", sub: "15% del total de ventas" },
    ],
    advice: "El canal online está superando las proyecciones. Considera aumentar el stock del almacén central para evitar quiebres de stock web."
  },
  "Utilidad Neta": {
    description: "Ganancia real después de restar todos los costos, impuestos y gastos.",
    insights: [
      { label: "Margen Bruto", value: "42%", trend: "Stable", icon: PieChart },
      { label: "Impuestos Est.", value: "19%", trend: "Fixed", icon: CreditCard },
    ],
    deepDive: [
      { label: "EBITDA", value: "$ 18.5M", sub: "Earnings Before Interest, Taxes..." },
      { label: "Neto Accionistas", value: "$ 12.1M", sub: "Disponible para retiro/inversión" },
    ],
    advice: "Tu margen neto es saludable (22%). Es un buen momento para reinvertir un 5% en I+D o expansión de marketing sin afectar la liquidez."
  },
  "Gastos Operativos": {
    description: "Costos recurrentes necesarios para mantener el negocio funcionando.",
    insights: [
      { label: "Nómina", value: "45%", trend: "+2%", icon: Users },
      { label: "Marketing", value: "30%", trend: "+5%", icon: Zap },
    ],
    deepDive: [
      { label: "Logística", value: "$ 1.2M", sub: "Envíos y almacenamiento" },
      { label: "Alquiler/Servicios", value: "$ 0.8M", sub: "Costos fijos de instalaciones" },
    ],
    advice: "El gasto en Marketing ha subido, pero el ROAS se mantiene positivo. Vigila los costos de nómina, están acercándose al límite del 50%."
  },
  "Ticket Promedio": {
    description: "Valor medio de cada transacción realizada por los clientes.",
    insights: [
      { label: "Items/Cesta", value: "2.4", trend: "+0.1", icon: ShoppingCart },
      { label: "Upsell Rate", value: "18%", trend: "+3%", icon: TrendingUp },
    ],
    deepDive: [
      { label: "Clientes Recurrentes", value: "$ 180k", sub: "Gastan 25% más que nuevos" },
      { label: "Clientes Nuevos", value: "$ 110k", sub: "Costo de adquisición: $15" },
    ],
    advice: "Implementar 'Bundles' (paquetes de productos) en el checkout podría elevar el ticket promedio a $160k el próximo mes."
  },
  "Conversion": {
    description: "Porcentaje de visitantes que finalizan una compra.",
    insights: [
      { label: "Desktop", value: "10.2%", trend: "+1%", icon: Globe },
      { label: "Mobile", value: "6.1%", trend: "+0.5%", icon: Smartphone },
    ],
    deepDive: [
      { label: "Abandono Carrito", value: "68%", sub: "Principal fuga de ventas" },
      { label: "Bounce Rate", value: "35%", sub: "Páginas de producto" },
    ],
    advice: "La conversión móvil es baja comparada con desktop. Revisa la experiencia de usuario en el checkout desde celulares."
  },
  "Staff ROI": {
    description: "Retorno de inversión por cada peso gastado en capital humano.",
    insights: [
      { label: "Ventas/Hora", value: "$ 450k", trend: "+8%", icon: Zap },
      { label: "Eficiencia", value: "92%", trend: "High", icon: Target },
    ],
    deepDive: [
      { label: "Top Performer", value: "Elena R.", sub: "6.5x su salario en ventas" },
      { label: "Avg Performer", value: "3.2x", sub: "Promedio del equipo" },
    ],
    advice: "Elena R. está cargando con gran parte de la cuota. Considera un bono de retención o asignarle un trainee para escalar sus métodos."
  }
};

export default function MetricDetailModal({ isOpen, onClose, metric }: MetricDetailModalProps) {
  if (!isOpen || !metric) return null;

  const details = METRIC_DETAILS[metric.label] || {
    description: "Información detallada de la métrica seleccionada.",
    insights: [],
    deepDive: [],
    advice: "Analiza esta métrica periódicamente para mejorar el rendimiento."
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop con blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 m-auto w-full max-w-2xl h-fit max-h-[90vh] z-[101] p-4 pointer-events-none flex items-center justify-center"
          >
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl rounded-[2.5rem] w-full pointer-events-auto overflow-hidden flex flex-col">
              
              {/* Header con gradiente sutil */}
              <div className="relative p-8 pb-6 border-b border-gray-100">
                <div className="absolute top-0 right-0 p-6">
                  <button 
                    onClick={onClose}
                    className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="flex items-center gap-4 mb-2">
                   <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${metric.trend.startsWith('+') || metric.trend === 'High' || metric.trend === 'OK' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {metric.trend} Tendencia
                   </span>
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Análisis en Profundidad
                   </span>
                </div>
                
                <h2 className={`text-4xl font-black italic tracking-tighter ${metric.color.replace('text-', 'text-')}`}>
                  {metric.label}
                </h2>
                <p className="text-gray-500 font-medium mt-2 max-w-md">
                  {details.description}
                </p>
              </div>

              {/* Body Content */}
              <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar max-h-[60vh]">
                
                {/* Main Value & Graph Placeholder */}
                <div className="flex items-end justify-between bg-white/50 p-6 rounded-3xl border border-white">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor Actual</p>
                        <p className="text-5xl font-black text-gray-900 mt-1">{metric.value}</p>
                    </div>
                    <div className="h-12 flex items-end gap-1">
                        {[40, 60, 45, 70, 50, 80, 65].map((h, i) => (
                            <div key={i} style={{ height: `${h}%` }} className={`w-2 rounded-t-sm ${i === 6 ? 'bg-gray-900' : 'bg-gray-200'}`}></div>
                        ))}
                    </div>
                </div>

                {/* Insights Grid */}
                {details.insights.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {details.insights.map((insight: any, i: number) => (
                      <div key={i} className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-2 bg-gray-50 rounded-xl text-gray-600">
                             <insight.icon size={18} />
                          </div>
                          <span className={`text-[10px] font-bold ${insight.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{insight.trend}</span>
                        </div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{insight.label}</p>
                        <p className="text-xl font-black text-gray-900">{insight.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Deep Dive List */}
                {details.deepDive.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <BarChart2 size={12}/> Detalles Operativos
                        </h4>
                        <div className="bg-gray-50 rounded-[1.5rem] p-1">
                            {details.deepDive.map((item: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0">
                                    <span className="text-sm font-bold text-gray-700">{item.label}</span>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-gray-900">{item.value}</p>
                                        <p className="text-[9px] font-bold text-gray-400">{item.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* AI Advice */}
                <div className="bg-[#004d4d] p-6 rounded-[2rem] text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Zap size={80} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-[#00f2ff] text-[#004d4d] text-[9px] font-black uppercase px-2 py-0.5 rounded">Bayt AI Tip</span>
                        </div>
                        <p className="text-sm font-medium italic leading-relaxed text-white/90">
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
