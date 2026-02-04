"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Zap, 
  PieChart, 
  AlertCircle,
  Briefcase,
  CheckCircle2
} from "lucide-react";

interface PayrollMetricModalProps {
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

const PAYROLL_DETAILS: Record<string, any> = {
  "Total Nómina Período": {
    description: "Suma total de salarios, comisiones y bonos proyectados para el período actual.",
    insights: [
      { label: "Sueldos Base", value: "72%", trend: "Fijo", icon: Briefcase },
      { label: "Carga Variable", value: "28%", trend: "+5%", icon: Zap },
    ],
    deepDive: [
      { label: "Provisiones Sociales", value: "$ 4.2M", sub: "Salud, Pensión, ARL" },
      { label: "Parafiscales", value: "$ 1.8M", sub: "Sena, ICBF, Cajas" },
    ],
    advice: "La carga variable ha subido un 5% este mes debido al éxito en ventas. Asegúrate de tener la liquidez lista para el día 30."
  },
  "Pendiente por Pagar": {
    description: "Fondos que aún no han sido liquidados o transferidos a los colaboradores.",
    insights: [
      { label: "En Trámite", value: "3 Pers.", trend: "Procesando", icon: Users },
      { label: "Sin Liquidar", value: "1 Pers.", trend: "Pendiente", icon: AlertCircle },
    ],
    deepDive: [
      { label: "Próximo Vencimiento", value: "En 2 días", sub: "Fecha límite de pago" },
      { label: "Banco Destino", value: "Bancolombia", sub: "Convenio empresarial" },
    ],
    advice: "Tienes 3 pagos en trámite. Verifica con tesorería si el archivo de dispersión masiva ya fue cargado satisfactoriamente."
  },
  "Bonos & Comisiones": {
    description: "Incentivos adicionales generados por cumplimiento de metas y métricas de desempeño.",
    insights: [
      { label: "Top Ventas", value: "$ 850k", trend: "+12%", icon: TrendingUp },
      { label: "Bonos Extra", value: "5 Unid.", trend: "OK", icon: Zap },
    ],
    deepDive: [
      { label: "Elena Rodriguez", value: "$ 450k", sub: "Líder en comisiones" },
      { label: "Carlos Ruiz", value: "$ 320k", sub: "Bono por puntualidad" },
    ],
    advice: "El 80% de los bonos se concentran en el área comercial. Considera un esquema de incentivos para el área de Logística por eficiencia de despacho."
  },
  "Costo de Personal": {
    description: "Relación porcentual entre el gasto total de nómina y los ingresos brutos de la empresa.",
    insights: [
      { label: "Margen Operativo", value: "18.4%", trend: "Ideal", icon: PieChart },
      { label: "Límite Sugerido", value: "22.0%", trend: "Seguro", icon: CheckCircle2 },
    ],
    deepDive: [
      { label: "Inversión/Empleado", value: "$ 2.1M", sub: "Costo promedio por cabeza" },
      { label: "ROI Proyectado", value: "4.5x", sub: "Retorno por cada $1 invertido" },
    ],
    advice: "Tu costo de personal está por debajo del límite sugerido (18.4%). Tienes margen para contratar un nuevo asistente o subir incentivos."
  }
};

export default function PayrollMetricModal({ isOpen, onClose, metric }: PayrollMetricModalProps) {
  if (!isOpen || !metric) return null;

  const details = PAYROLL_DETAILS[metric.label] || {
    description: "Información detallada de la métrica de nómina.",
    insights: [],
    deepDive: [],
    advice: "Analiza esta métrica para optimizar tu gestión de recursos humanos."
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
              
              {/* Header */}
              <div className="relative p-10 pb-6 border-b border-gray-100">
                <button 
                    onClick={onClose}
                    className="absolute top-8 right-8 h-10 w-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-all text-gray-400"
                >
                    <X size={20} />
                </button>
                
                <div className="flex items-center gap-4 mb-2">
                   <span className="px-3 py-1 bg-[#004d4d] text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                      Detalle de Nómina
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

              {/* Body */}
              <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar max-h-[60vh]">
                
                <div className="flex items-end justify-between bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor Actual</p>
                        <p className="text-5xl font-black text-gray-900 mt-1">{metric.value}</p>
                    </div>
                    <div className="h-16 flex items-end gap-1.5">
                        {[30, 50, 40, 70, 60, 90, 80].map((h, i) => (
                            <div key={i} style={{ height: `${h}%` }} className={`w-2.5 rounded-t-sm ${i === 6 ? 'bg-[#004d4d]' : 'bg-gray-200'}`}></div>
                        ))}
                    </div>
                </div>

                {/* Insights */}
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

                {/* AI Advice */}
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
