"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Package, 
  AlertTriangle, 
  Warehouse, 
  DollarSign, 
  Search, 
  Filter, 
  X,
  Plus,
  Minus,
  RefreshCcw,
  Truck,
  TrendingUp,
  Layers,
  ChevronRight,
  Edit3,
  History
} from 'lucide-react';
import { useToast } from "@/context/toast-context";

// --- MOCK DATA ---
const INVENTORY_KPIS = [
  { label: 'Unidades Totales', value: '14.250', icon: <Package size={20} />, color: 'text-emerald-500' },
  { label: 'Valor de Inversión', value: '$ 182.4M', icon: <DollarSign size={20} />, color: 'text-blue-500' },
  { label: 'Stock Crítico', value: '18 Refs', icon: <AlertTriangle size={20} />, color: 'text-rose-500' },
];

const WAREHOUSE_DISTRIBUTION = [
  { name: 'Bodega Central', units: 8500, value: '$ 280M', percentage: 65 },
  { name: 'Sede Norte', units: 3200, value: '$ 115M', percentage: 25 },
  { name: 'Showroom Sur', units: 2550, value: '$ 63.2M', percentage: 10 },
];

const MASTER_INVENTORY = [
  { id: 1, name: 'Reloj Cronógrafo Gold', sku: 'WA-GOLD-001', category: 'Accesorios', cost: 150000, price: 450000, stock: 450, min_stock: 50, warehouse: 'Central', status: 'ok' },
  { id: 2, name: 'Zapatos Oxford Cuero', sku: 'SH-OX-BR', category: 'Calzado', cost: 80000, price: 180000, stock: 8, min_stock: 15, warehouse: 'Norte', status: 'bajo' },
  { id: 3, name: 'Camisa Lino Blanca', sku: 'CL-LI-WH', category: 'Ropa', cost: 35000, price: 95000, stock: 0, min_stock: 20, warehouse: 'Sur', status: 'agotado' },
  { id: 4, name: 'Gafas Aviador Silver', sku: 'GL-AV-SL', category: 'Accesorios', cost: 45000, price: 120000, stock: 120, min_stock: 30, warehouse: 'Central', status: 'ok' },
];

export default function InventoryPage() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  const filteredInventory = useMemo(() => 
    MASTER_INVENTORY.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );

  return (
    <div className="max-w-[1600px] mx-auto pb-32 space-y-10 animate-in fade-in duration-700">
      
      {/* --- HEADER LIMPIO --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-4">
        <div>
          <h1 className="text-5xl font-black text-[#004d4d] tracking-tight">Inventario</h1>
          <p className="text-gray-500 mt-2 font-medium text-lg italic">Control de existencias y distribución por bodegas.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="h-14 px-8 bg-white border border-gray-100 text-gray-900 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-gray-50 transition-all flex items-center gap-3">
            <History size={16} className="text-[#00f2ff]" /> Ver Historial
          </button>
          <button className="h-14 px-10 bg-[#004d4d] text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-3">
            <Plus size={18} className="text-[#00f2ff]" /> Entrada Mercancía
          </button>
        </div>
      </div>

      {/* --- KPIS SIMPLIFICADOS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        {INVENTORY_KPIS.map((kpi, i) => (
          <div key={i} className="bg-white/60 backdrop-blur-md p-8 rounded-[3rem] border border-white/80 shadow-sm flex items-center gap-6 group hover:shadow-lg transition-all">
            <div className={`h-14 w-14 rounded-2xl bg-white shadow-inner flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
              {kpi.icon}
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
              <p className="text-2xl font-black text-gray-900">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* --- DISTRIBUCIÓN VISUAL (LO QUE GUSTABA) --- */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[3.5rem] p-12 border border-white/60 shadow-sm space-y-10 mx-4">
        <div className="flex justify-between items-center border-b border-gray-50 pb-6">
          <div>
            <h2 className="text-2xl font-black text-[#004d4d] tracking-tight uppercase italic">Distribución por Bodega</h2>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Carga de inventario por sede operativa</p>
          </div>
          <Warehouse size={24} className="text-[#00f2ff]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {WAREHOUSE_DISTRIBUTION.map((w, i) => (
            <div key={i} className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-base font-black text-gray-900">{w.name}</p>
                <p className="text-sm font-black text-[#004d4d]">{w.units} Uds</p>
              </div>
              <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-[1.5px]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${w.percentage}%` }}
                  className="h-full bg-gradient-to-r from-[#004d4d] to-[#00f2ff] rounded-full shadow-[0_0_10px_rgba(0,242,255,0.2)]"
                />
              </div>
              <div className="flex justify-between text-[9px] font-black uppercase text-gray-300 tracking-widest">
                <span>{w.percentage}% Ocupado</span>
                <span>{w.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- LISTADO MAESTRO (ANCHO COMPLETO) --- */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[4rem] border border-white/60 shadow-xl overflow-hidden mx-4">
        <div className="p-12 border-b border-gray-50 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-black text-[#004d4d] tracking-tight uppercase italic">Existencias Actuales</h2>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                <Layers size={14} className="text-[#00f2ff]" /> Detalle por referencia y SKU
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar producto..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-[#00f2ff]/30 transition-all w-80 shadow-inner"
              />
            </div>
            <button className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-500 hover:text-[#004d4d] shadow-sm transition-all"><Filter size={20}/></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-10 py-6 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Producto</th>
                <th className="px-10 py-6 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Ubicación</th>
                <th className="px-10 py-6 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Stock</th>
                <th className="px-10 py-6 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Precio</th>
                <th className="px-10 py-6 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                <th className="px-10 py-6 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Ajustar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredInventory.map((p) => (
                <tr key={p.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-10 py-8">
                    <p className="text-sm font-black text-gray-900 uppercase italic">{p.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{p.sku}</p>
                  </td>
                  <td className="px-10 py-8 text-xs font-bold text-gray-500 uppercase tracking-widest">{p.warehouse}</td>
                  <td className="px-10 py-8 text-center">
                    <span className={`text-base font-black ${p.stock <= p.min_stock ? 'text-rose-500 animate-pulse' : 'text-gray-900'}`}>{p.stock}</span>
                  </td>
                  <td className="px-10 py-8 text-right text-sm font-black text-gray-900 italic">$ {(p.price / 1000).toFixed(0)}.000</td>
                  <td className="px-10 py-8 text-center">
                    <span className={`px-3 py-1 text-[8px] font-black uppercase rounded-lg ${
                      p.status === 'ok' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>{p.status === 'ok' ? 'Suficiente' : 'Bajo Stock'}</span>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <button onClick={() => { setSelectedProduct(p); setIsAdjustModalOpen(true); }} className="h-10 w-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#00f2ff] hover:border-[#00f2ff] transition-all shadow-sm">
                      <RefreshCcw size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL AJUSTE DE STOCK (MANTENEMOS ESTA MEJORA) --- */}
      <AnimatePresence>
        {isAdjustModalOpen && selectedProduct && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdjustModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[4rem] shadow-2xl p-12 relative z-10 border border-white/20"
            >
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-xl"><RefreshCcw size={24} className="text-[#00f2ff]" /></div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase italic">Ajuste de Stock</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{selectedProduct.name}</p>
                  </div>
                </div>
                <button onClick={() => setIsAdjustModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:text-rose-500 transition-all"><X size={20}/></button>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-8 bg-gray-50 rounded-[2.5rem] text-center border border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Stock Actual</p>
                    <p className="text-4xl font-black text-gray-900">{selectedProduct.stock}</p>
                  </div>
                  <div className="p-8 bg-[#00f2ff]/5 rounded-[2.5rem] text-center border border-[#00f2ff]/10">
                    <p className="text-[9px] font-black text-[#008080] uppercase tracking-widest mb-2">Nuevo Stock</p>
                    <p className="text-4xl font-black text-[#004d4d]">{selectedProduct.stock + 1}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Motivo del Movimiento</label>
                  <select className="w-full p-6 bg-gray-50 border-2 border-transparent rounded-[2rem] font-bold text-sm outline-none focus:border-[#004d4d] transition-all appearance-none cursor-pointer">
                    <option>Entrada por Compra</option>
                    <option>Entrada por Devolución</option>
                    <option>Ajuste de Inventario (+)</option>
                    <option>Salida por Merma / Daño</option>
                    <option>Ajuste de Inventario (-)</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Cantidad a Ajustar</label>
                  <div className="flex items-center gap-4">
                    <button className="h-16 w-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center active:scale-90 transition-all"><Minus size={20}/></button>
                    <input type="number" className="flex-1 h-16 bg-gray-50 border-2 border-transparent rounded-2xl text-center font-black text-xl outline-none focus:border-[#004d4d] transition-all" defaultValue="1" />
                    <button className="h-16 w-16 bg-[#00f2ff] text-[#001a1a] rounded-2xl flex items-center justify-center active:scale-90 transition-all"><Plus size={20}/></button>
                  </div>
                </div>

                <button onClick={() => { setIsAdjustModalOpen(false); showToast("Movimiento registrado", "success"); }} className="w-full py-6 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all">Confirmar Cambio</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 30px; }
      `}</style>
    </div>
  );
}
