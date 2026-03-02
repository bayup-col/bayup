"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  Users, 
  ArrowUpRight, 
  Calendar,
  ShieldCheck,
  Zap,
  Globe,
  Activity,
  ChevronRight
} from "lucide-react";

interface SuperAdminMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'revenue' | 'commission' | 'companies' | 'affiliates';
  data: any;
}

export default function SuperAdminMetricModal({ isOpen, onClose, type, data }: SuperAdminMetricModalProps) {
  if (!isOpen) return null;

  const config = {
    revenue: {
      title: "Flujo Bruto de Red",
      subtitle: "Volumen total procesado por Bayup",
      icon: <Globe className="text-blue-500" size={32} />,
      color: "#3B82F6",
      stats: [
        { label: "Ventas Web", value: data.total_revenue * 0.7, trend: "+12%" },
        { label: "Ventas POS", value: data.total_revenue * 0.3, trend: "+5%" },
        { label: "Ticket Promedio", value: 185000, trend: "Estable" }
      ]
    },
    commission: {
      title: "Utilidad Real Bayup",
      subtitle: "Recaudo neto por comisiones de red",
      icon: <DollarSign className="text-emerald-500" size={32} />,
      color: "#10B981",
      stats: [
        { label: "Comisiones Web", value: data.total_commission * 0.9, trend: "3.5% avg" },
        { label: "Suscripciones", value: data.active_companies * 49000, trend: "Mensual" },
        { label: "Retenciones", value: 0, trend: "0%" }
      ]
    },
    companies: {
      title: "Ecosistema de Tenants",
      subtitle: "Empresas operando en la plataforma",
      icon: <Building2 className="text-purple-500" size={32} />,
      color: "#A855F7",
      stats: [
        { label: "Plan Básico", value: data.active_companies, trend: "Activos" },
        { label: "Plan Pro Elite", value: 0, trend: "Próximamente" },
        { label: "Tasa de Abandono", value: "0.5%", trend: "Baja" }
      ]
    },
    affiliates: {
      title: "Fuerza de Venta Global",
      subtitle: "Red de aliados y captación",
      icon: <Users className="text-amber-500" size={32} />,
      color: "#F59E0B",
      stats: [
        { label: "Afiliados Activos", value: data.active_affiliates, trend: "Verificados" },
        { label: "Comisiones Pendientes", value: data.total_commission * 0.1, trend: "0.5% red" },
        { label: "Nuevos Hoy", value: 0, trend: "Meta: 5" }
      ]
    }
  };

  const current = config[type];

  const formatCurrency = (amount: any) => {
    if (typeof amount === 'string') return amount;
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white/90 backdrop-blur-2xl w-full max-w-4xl rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.2)] overflow-hidden border border-white/50 flex flex-col md:flex-row h-[70vh]"
      >
        {/* Sidebar Informativo */}
        <div className="w-full md:w-80 bg-gray-50/50 border-r border-gray-100 p-10 flex flex-col justify-between">
          <div>
            <div className="h-16 w-16 rounded-3xl bg-white shadow-xl flex items-center justify-center mb-8 border border-gray-50">
              {current.icon}
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic leading-none mb-2">{current.title}</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">{current.subtitle}</p>
          </div>

          <div className="space-y-4">
            <div className="p-6 bg-gray-900 rounded-[2rem] text-white relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-[8px] font-black text-cyan uppercase tracking-[0.2em] mb-2">Estado de Red</p>
                <p className="text-sm font-bold italic opacity-90">"Operación estable. El flujo de datos es óptimo."</p>
              </div>
              <Activity size={80} className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform duration-700" />
            </div>
          </div>
        </div>

        {/* Contenido Detallado */}
        <div className="flex-1 flex flex-col bg-white/40">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Datos en tiempo real</span>
            </div>
            <button onClick={onClose} className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:rotate-90 transition-all shadow-sm">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-8">
            <div className="grid grid-cols-1 gap-4">
              {current.stats.map((stat, i) => (
                <div key={i} className="p-8 bg-white border border-gray-100 rounded-[2.5rem] flex items-center justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                  <div className="flex items-center gap-6">
                    <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-gray-900 group-hover:text-white transition-all">
                      <Zap size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="text-2xl font-black text-gray-900 tracking-tight italic">{formatCurrency(stat.value)}</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-tighter">
                    {stat.trend}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-10 bg-gradient-to-br from-[#004d4d] to-[#001a1a] rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 flex items-center justify-between">
                <div className="space-y-2">
                  <h4 className="text-lg font-black italic uppercase tracking-tighter">Reporte Maestro Bayt</h4>
                  <p className="text-xs opacity-70 max-w-xs font-medium">Visualiza el historial detallado de este módulo para una auditoría profunda.</p>
                </div>
                <button className="h-14 w-14 rounded-[1.5rem] bg-cyan text-[#001a1a] flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all">
                  <ArrowUpRight size={24} />
                </button>
              </div>
              <Globe size={150} className="absolute -bottom-10 -right-10 opacity-10" />
            </div>
          </div>

          <div className="p-8 border-t border-gray-50 bg-gray-50/30 flex justify-center">
            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.3em]">Bayup Intel Engine • 2026</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
