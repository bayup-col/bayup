"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Warehouse, 
  DollarSign, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ChevronRight,
  X,
  Activity,
  ArrowUpRight,
  Layers,
  ShoppingBag,
  Info,
  ArrowDown,
  Trophy
} from 'lucide-react';

// --- MOCK DATA MEJORADA ---
const INVENTORY_KPIS = [
  { label: 'Valor del Inventario', value: '$ 458.200.000', icon: <DollarSign size={20} />, trend: '+12.5%', isUp: true },
  { label: 'Unidades Totales', value: '14.250', icon: <Package size={20} />, trend: 'Normal', isUp: true },
  { label: 'Bajo Stock', value: '18', icon: <AlertTriangle size={20} />, trend: 'Crítico', isUp: false, color: 'text-amber-500' },
  { label: 'Producto Estrella', value: 'Reloj Gold', icon: <Trophy size={20} />, trend: 'Top Ventas', isUp: true, color: 'text-[#00f2ff]' },
  { label: 'Bodegas Activas', value: '03', icon: <Warehouse size={20} />, trend: 'Sincro OK', isUp: true },
];

const WAREHOUSE_DISTRIBUTION = [
  { name: 'Bodega Central', units: 8500, value: '$ 280M', percentage: 65 },
  { name: 'Sede Norte', units: 3200, value: '$ 115M', percentage: 25 },
  { name: 'Showroom Sur', units: 2550, value: '$ 63.2M', percentage: 10 },
];

const MASTER_INVENTORY = [
  { id: 1, name: 'Reloj Cronógrafo Gold', sku: 'WA-GOLD-001', category: 'Accesorios', warehouse: 'Central', stock_on_hand: 450, committed: 12, available: 438, unit_price: 50000, status: 'ok' },
  { id: 2, name: 'Zapatos Oxford Cuero', sku: 'SH-OX-BR', category: 'Calzado', warehouse: 'Norte', stock_on_hand: 8, committed: 3, available: 5, unit_price: 180000, status: 'bajo' },
  { id: 3, name: 'Camisa Lino Blanca', sku: 'CL-LI-WH', category: 'Ropa', warehouse: 'Sur', stock_on_hand: 0, committed: 0, available: 0, unit_price: 95000, status: 'agotado' },
  { id: 4, name: 'Gafas Aviador Silver', sku: 'GL-AV-SL', category: 'Accesorios', warehouse: 'Central', stock_on_hand: 120, committed: 45, available: 75, unit_price: 120000, status: 'ok' },
  { id: 5, name: 'Billetera Slim Café', sku: 'WA-SL-BR', category: 'Accesorios', warehouse: 'Norte', stock_on_hand: 4, committed: 0, available: 4, unit_price: 45000, status: 'bajo' },
  { id: 6, name: 'Pantalón Chino Azul', sku: 'PA-CH-BL', category: 'Ropa', warehouse: 'Central', stock_on_hand: 88, committed: 10, available: 78, unit_price: 110000, status: 'ok' },
];

export default function InventoryPage() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ok' | 'bajo' | 'agotado'>('all');

  const filteredProducts = MASTER_INVENTORY.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok': return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-lg border border-emerald-100">Óptimo</span>;
      case 'bajo': return <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[8px] font-black uppercase rounded-lg border border-amber-100 animate-pulse">Bajo Stock</span>;
      case 'agotado': return <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[8px] font-black uppercase rounded-lg border border-rose-100">Agotado</span>;
      default: return null;
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-10 animate-in fade-in duration-700">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-[#004d4d] tracking-tight">Inventario Maestro</h1>
          <p className="text-gray-500 mt-2 font-medium text-lg italic">Gestión táctica de existencias y valorización global.</p>
        </div>
        <button 
          onClick={() => setShowAdvanced(true)}
          className="group flex items-center gap-3 px-8 py-4 bg-[#004d4d] text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-[#004d4d]/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <BarChart3 size={16} className="text-[#00f2ff]" />
          Ver Inteligencia de Datos
        </button>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {INVENTORY_KPIS.map((kpi, i) => (
          <div key={i} className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/80 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start">
              <div className={`h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center ${kpi.color || 'text-[#004d4d]'} group-hover:bg-[#00f2ff]/10 group-hover:text-[#004d4d] transition-all`}>
                {kpi.icon}
              </div>
              <span className={`text-[9px] font-black px-2 py-1 rounded-md ${kpi.isUp ? 'bg-[#00f2ff]/10 text-[#008080]' : 'bg-rose-50 text-rose-600'}`}>
                {kpi.trend}
              </span>
            </div>
            <div className="mt-6">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
              <p className={`text-xl font-black mt-1 ${kpi.label === 'Producto Estrella' ? 'text-[#008080]' : 'text-[#004d4d]'}`}>
                {kpi.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* --- CARGA POR BODEGA (FULL WIDTH) --- */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-12 border border-white/60 shadow-sm space-y-10">
        <div className="flex justify-between items-center border-b border-gray-50 pb-6">
          <div>
            <h2 className="text-2xl font-black text-[#004d4d] tracking-tight">Distribución por Bodega</h2>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Ocupación y carga de inventario por sede</p>
          </div>
          <Warehouse size={24} className="text-[#00f2ff]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {WAREHOUSE_DISTRIBUTION.map((w, i) => (
            <div key={i} className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-base font-black text-gray-900">{w.name}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{w.units} Unidades Totales</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#004d4d]">{w.value}</p>
                  <p className="text-[9px] text-gray-400 font-black uppercase">Valorización</p>
                </div>
              </div>
              <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden flex border border-gray-100 p-[1.5px]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${w.percentage}%` }}
                  className="h-full bg-gradient-to-r from-[#004d4d] via-[#008080] to-[#00f2ff] rounded-full shadow-[0_0_10px_rgba(0,242,255,0.2)]"
                />
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase text-gray-300">
                <span>0%</span>
                <span>{w.percentage}% Ocupado</span>
                <span>100%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- LISTADO MAESTRO DE PRODUCTOS (EXPANDIDO) --- */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[4rem] border border-white/60 shadow-xl shadow-gray-200/20 overflow-hidden">
        <div className="p-12 border-b border-gray-50 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-black text-[#004d4d] tracking-tight">Stock General & Operaciones</h2>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                <Layers size={14} className="text-[#00f2ff]" /> Detalle exhaustivo de existencias por referencia
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Quick Filters */}
            <div className="flex p-1 bg-gray-50 rounded-2xl border border-gray-100">
                {[
                    { id: 'all', label: 'Todos' },
                    { id: 'bajo', label: 'Bajo Stock' },
                    { id: 'agotado', label: 'Agotados' }
                ].map(f => (
                    <button 
                        key={f.id}
                        onClick={() => setFilterStatus(f.id as any)}
                        className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterStatus === f.id ? 'bg-[#004d4d] text-white shadow-md' : 'text-gray-400 hover:text-[#004d4d]'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004d4d] transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Buscar por SKU o Nombre..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-[#00f2ff]/30 transition-all w-72 shadow-inner"
              />
            </div>
            
            <button className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-500 hover:text-[#004d4d] shadow-sm">
                <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-50">
            <thead className="bg-gray-50/30">
              <tr>
                <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Producto / SKU</th>
                <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ubicación</th>
                <th className="px-10 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">En Mano</th>
                <th className="px-10 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Comprometido</th>
                <th className="px-10 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Disponible</th>
                <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Valorización</th>
                <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado</th>
                <th className="px-10 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg">{p.id === 1 ? '⌚' : p.id === 2 ? '👞' : '👕'}</div>
                        <div>
                            <p className="text-sm font-black text-gray-900 group-hover:text-[#004d4d] transition-colors">{p.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{p.sku}</p>
                        </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-2">
                        <Warehouse size={12} className="text-[#00f2ff]" />
                        <span className="text-xs font-bold text-gray-600">{p.warehouse}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center text-sm font-black text-gray-400">{p.stock_on_hand}</td>
                  <td className="px-10 py-8 text-center text-sm font-bold text-rose-400">{p.committed > 0 ? `-${p.committed}` : '0'}</td>
                  <td className="px-10 py-8 text-center">
                    <span className={`text-base font-black ${p.available <= 5 ? 'text-amber-600' : 'text-[#004d4d]'}`}>
                        {p.available}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <p className="text-sm font-black text-gray-900">$ {(p.available * p.unit_price / 1000000).toFixed(1)}M</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Total Fila</p>
                  </td>
                  <td className="px-10 py-8 text-right">
                    {getStatusBadge(p.status)}
                  </td>
                  <td className="px-10 py-8 text-center">
                    <button className="h-10 w-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-300 hover:text-[#004d4d] hover:border-[#004d4d] transition-all shadow-sm">
                        <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Empty State */}
        {filteredProducts.length === 0 && (
            <div className="p-20 text-center">
                <Package size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-lg font-black text-gray-400 uppercase tracking-widest italic">No se encontraron productos en este criterio</p>
            </div>
        )}

        <div className="p-10 bg-gray-50/50 border-t border-gray-50 flex justify-between items-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Mostrando {filteredProducts.length} de {MASTER_INVENTORY.length} referencias</p>
          <div className="flex gap-2">
            <button className="px-6 py-3 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-[#004d4d] transition-all shadow-sm">Anterior</button>
            <button className="px-6 py-3 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-[#004d4d] transition-all shadow-sm">Siguiente</button>
          </div>
        </div>
      </div>

      {/* --- MODAL ANÁLISIS AVANZADO --- */}
      <AnimatePresence>
        {showAdvanced && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#004d4d]/20 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[4rem] shadow-[0_50px_100px_rgba(0,77,77,0.15)] flex flex-col overflow-hidden"
            >
              <div className="p-12 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-[#004d4d] tracking-tight">Inteligencia de Inventario</h2>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">Métricas predictivas y salud de stock</p>
                </div>
                <button 
                  onClick={() => setShowAdvanced(false)} 
                  className="h-14 w-14 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-rose-600 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-gray-50/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-black text-[#004d4d] uppercase tracking-widest">Rotación Mensual</h3>
                      <Activity size={16} className="text-[#00f2ff]" />
                    </div>
                    <div className="h-48 bg-gray-50 rounded-2xl flex items-end justify-between p-6 gap-2 border border-dashed border-gray-200">
                      {[40, 65, 45, 90, 55, 75, 85].map((h, i) => (
                        <motion.div 
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          className={`w-full rounded-t-lg ${i === 3 ? 'bg-[#00f2ff]' : 'bg-[#004d4d]/20'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-black text-[#004d4d] uppercase tracking-widest">Velocidad de Venta</h3>
                      <Zap className="text-[#00f2ff]" size={16} />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500">Categoría Calzado</span>
                        <span className="text-xs font-black text-[#004d4d]">4.2x / mes</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500">Categoría Accesorios</span>
                        <span className="text-xs font-black text-[#004d4d]">2.8x / mes</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { title: 'Días promedio en stock', value: '42 Días', desc: 'Tiempo medio de permanencia', icon: <Clock size={16} /> },
                    { title: 'Productos "Pegados"', value: '12 Items', desc: 'Más de 90 días sin venta', icon: <Ghost size={16} /> },
                    { title: 'Productos Estrella', value: '08 Items', desc: 'Rotación superior al 80%', icon: <Star size={16} /> },
                  ].map((smart, i) => (
                    <div key={i} className="bg-[#004d4d] p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl shadow-[#004d4d]/10">
                      <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-[#00f2ff]">
                        {smart.icon}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{smart.title}</p>
                        <p className="text-2xl font-black">{smart.value}</p>
                        <p className="text-[10px] text-white/60 font-medium italic mt-1">{smart.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// --- ICONOS ADICIONALES (SVG PERSONALIZADOS) ---
function Clock({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}

function Ghost({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>;
}

function Star({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}

function Zap({ size, className }: { size: number, className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}