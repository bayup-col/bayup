"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  MapPin, 
  ArrowRightLeft, 
  History, 
  TrendingUp, 
  AlertCircle, 
  ChevronRight, 
  Plus, 
  Search, 
  Filter,
  Package,
  ArrowRight,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Warehouse as WarehouseIcon,
  LayoutGrid,
  Info
} from 'lucide-react';

interface Warehouse {
    id: string;
    name: string;
    type: 'Bodega Central' | 'Tienda Física' | 'Almacén' | 'Showroom';
    location: string;
    total_items: number;
    capacity_used: number; // Porcentaje
    is_main: boolean;
    alerts: number;
}

interface Transfer {
    id: string;
    origin: string;
    destination: string;
    items_count: number;
    status: 'pending' | 'in_transit' | 'completed' | 'rejected';
    date: string;
    priority: 'alta' | 'media' | 'baja';
}

const MOCK_WAREHOUSES: Warehouse[] = [
    { id: 'w1', name: 'Bodega Central - Occidente', type: 'Bodega Central', location: 'Bogotá, DC', total_items: 1250, capacity_used: 78, is_main: true, alerts: 0 },
    { id: 'w2', name: 'Tienda Flagship Norte', type: 'Tienda Física', location: 'C.C. Andino', total_items: 340, capacity_used: 45, is_main: false, alerts: 2 },
    { id: 'w3', name: 'Almacén Logístico Sur', type: 'Almacén', location: 'Cali, Valle', total_items: 890, capacity_used: 92, is_main: false, alerts: 5 },
    { id: 'w4', name: 'Showroom Innovación', type: 'Showroom', location: 'Medellín, ANT', total_items: 120, capacity_used: 15, is_main: false, alerts: 0 },
];

const MOCK_TRANSFERS: Transfer[] = [
    { id: 'TR-1001', origin: 'Bodega Central', destination: 'Tienda Norte', items_count: 50, status: 'in_transit', date: '01 Feb 2026', priority: 'alta' },
    { id: 'TR-998', origin: 'Almacén Sur', destination: 'Bodega Central', items_count: 125, status: 'completed', date: '30 Ene 2026', priority: 'media' },
    { id: 'TR-1005', origin: 'Bodega Central', destination: 'Showroom', items_count: 12, status: 'pending', date: 'Hace 2 horas', priority: 'baja' },
];

export default function BodegasPage() {
    const [activeView, setActiveView] = useState<'overview' | 'transfers' | 'detail'>('overview');
    const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

    const getStatusStyle = (status: Transfer['status']) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'in_transit': return 'bg-[#00f2ff]/10 text-[#008080] border-[#00f2ff]/20';
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-10 animate-in fade-in duration-700">
            {/* --- HEADER SECTOR --- */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-black text-[#004d4d] tracking-tight flex items-center gap-4">
                        Bodegas & Stock
                        <span className="text-xs font-black uppercase tracking-[0.3em] bg-[#00f2ff] text-[#004d4d] px-3 py-1 rounded-full shadow-sm">Logística Pro</span>
                    </h1>
                    <p className="text-gray-500 mt-3 font-medium text-lg max-w-2xl leading-relaxed">
                        Centro de control táctico para la gestión multi-bodega y optimización de flujos de inventario.
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-8 px-8 py-4 bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-sm mr-4">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Bodegas</p>
                            <p className="text-2xl font-black text-[#004d4d]">{MOCK_WAREHOUSES.length}</p>
                        </div>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Global</p>
                            <p className="text-2xl font-black text-[#004d4d]">2.600 <span className="text-xs text-gray-400">Unds</span></p>
                        </div>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">En Tránsito</p>
                            <p className="text-2xl font-black text-[#00f2ff]">187</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setIsTransferModalOpen(true)}
                        className="group relative px-8 py-5 bg-[#004d4d] text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-[#004d4d]/20 hover:scale-[1.02] active:scale-95 transition-all overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <span className="flex items-center gap-3 relative z-10">
                            <ArrowRightLeft size={16} className="text-[#00f2ff]" />
                            Nueva Transferencia
                        </span>
                    </button>
                </div>
            </div>

            {/* --- NAVIGATION TABS --- */}
            <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-gray-100">
                <div className="flex p-1.5 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/80 shadow-sm w-fit">
                    {[
                        { id: 'overview', label: 'Vista General', icon: <LayoutGrid size={14} /> },
                        { id: 'transfers', label: 'Gestión de Traslados', icon: <ArrowRightLeft size={14} /> },
                    ].map((tab) => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveView(tab.id as any)}
                            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeView === tab.id ? 'bg-[#004d4d] text-white shadow-lg' : 'text-gray-400 hover:text-[#004d4d] hover:bg-white'}`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004d4d] transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar bodega o SKU..." 
                            className="pl-11 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#00f2ff]/30 focus:border-[#004d4d] transition-all w-64 lg:w-80 shadow-sm"
                        />
                    </div>
                    <button className="p-3.5 bg-white border border-gray-100 rounded-2xl text-gray-500 hover:text-[#004d4d] hover:border-[#004d4d] transition-all shadow-sm">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* --- CONTENT VIEWS --- */}
            <AnimatePresence mode="wait">
                {activeView === 'overview' ? (
                    <motion.div 
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                    >
                        {MOCK_WAREHOUSES.map((w) => (
                            <div 
                                key={w.id} 
                                onClick={() => { setSelectedWarehouse(w); setActiveView('detail'); }}
                                className="group relative bg-white/70 backdrop-blur-xl p-8 rounded-[3rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,77,77,0.08)] hover:border-[#004d4d]/10 transition-all cursor-pointer overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
                                    <WarehouseIcon size={80} className="text-[#004d4d]" />
                                </div>

                                <div className="relative z-10 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${w.is_main ? 'bg-[#004d4d] text-[#00f2ff]' : 'bg-gray-50 text-gray-400'}`}>
                                            <WarehouseIcon size={24} />
                                        </div>
                                        {w.alerts > 0 && (
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 text-[9px] font-black uppercase rounded-full border border-rose-100 animate-pulse">
                                                <AlertCircle size={10} /> {w.alerts} Alertas
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight group-hover:text-[#004d4d] transition-colors">{w.name}</h3>
                                        <p className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
                                            <MapPin size={10} className="text-[#00f2ff]" /> {w.location}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capacidad Usada</p>
                                            <p className="text-xs font-black text-gray-900">{w.capacity_used}%</p>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-50">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${w.capacity_used}%` }}
                                                className={`h-full rounded-full ${w.capacity_used > 90 ? 'bg-rose-500' : w.capacity_used > 70 ? 'bg-amber-500' : 'bg-[#00f2ff]'}`}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Disponibilidad</p>
                                            <p className="text-xl font-black text-[#004d4d]">{w.total_items} <span className="text-[10px] text-gray-400">Items</span></p>
                                        </div>
                                        <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-[#004d4d]/5 group-hover:text-[#004d4d] transition-all">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* ADD NEW WAREHOUSE CARD */}
                        <div className="group border-2 border-dashed border-gray-200 rounded-[3rem] p-8 flex flex-col items-center justify-center text-center gap-4 hover:border-[#004d4d] hover:bg-[#004d4d]/5 transition-all cursor-pointer min-h-[340px]">
                            <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-[#004d4d] group-hover:text-white transition-all shadow-inner">
                                <Plus size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-400 group-hover:text-[#004d4d]">Nueva Bodega</h3>
                                <p className="text-xs font-bold text-gray-300 mt-1 uppercase tracking-widest">Registrar nueva ubicación</p>
                            </div>
                        </div>
                    </motion.div>
                ) : activeView === 'transfers' ? (
                    <motion.div 
                        key="transfers"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] border border-white/60 shadow-xl shadow-gray-200/20 overflow-hidden">
                            <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-2xl font-black text-[#004d4d] tracking-tight">Registro de Movimientos</h2>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                        <Clock size={12} className="text-[#00f2ff]" /> Trazabilidad en tiempo real de carga
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="px-6 py-3 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">Historial Completo</button>
                                    <button className="px-6 py-3 bg-[#00f2ff] text-[#004d4d] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#00f2ff]/20 hover:scale-105 transition-all">Exportar Reporte</button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-50">
                                    <thead className="bg-gray-50/30">
                                        <tr>
                                            <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Referencia</th>
                                            <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ruta Logística</th>
                                            <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Carga</th>
                                            <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Prioridad</th>
                                            <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado</th>
                                            <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Gestión</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {MOCK_TRANSFERS.map((tr) => (
                                            <tr key={tr.id} className="hover:bg-[#004d4d]/[0.02] transition-colors group">
                                                <td className="px-10 py-8">
                                                    <p className="font-black text-sm text-[#004d4d]">#{tr.id}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{tr.date}</p>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-left">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Origen</p>
                                                            <p className="text-xs font-bold text-gray-700">{tr.origin}</p>
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <ArrowRight size={14} className="text-[#00f2ff]" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Destino</p>
                                                            <p className="text-xs font-bold text-[#004d4d]">{tr.destination}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-[#004d4d]">
                                                            <Package size={16} />
                                                        </div>
                                                        <span className="text-sm font-black text-gray-900">{tr.items_count} <span className="text-[10px] text-gray-400">Unds</span></span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                                                        tr.priority === 'alta' ? 'text-rose-600' : tr.priority === 'media' ? 'text-amber-600' : 'text-emerald-600'
                                                    }`}>
                                                        <div className={`h-1.5 w-1.5 rounded-full ${
                                                            tr.priority === 'alta' ? 'bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.4)]' : tr.priority === 'media' ? 'bg-amber-600' : 'bg-emerald-600'
                                                        }`} />
                                                        {tr.priority}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(tr.status)}`}>
                                                        {tr.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <button className="h-12 w-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-[#004d4d] hover:border-[#004d4d] hover:bg-[#004d4d]/5 transition-all shadow-sm">
                                                        <ArrowUpRight size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="detail"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <button 
                                onClick={() => setActiveView('overview')}
                                className="px-6 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#004d4d] transition-all"
                            >
                                ← Volver a General
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 space-y-8">
                                <div className="bg-[#004d4d] p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl shadow-[#004d4d]/20">
                                    <div className="absolute top-0 right-0 p-10 opacity-10">
                                        <WarehouseIcon size={120} />
                                    </div>
                                    <div className="relative z-10 space-y-8">
                                        <div>
                                            <span className="bg-[#00f2ff] text-[#004d4d] text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                                {selectedWarehouse?.type}
                                            </span>
                                            <h2 className="text-3xl font-black tracking-tight mt-4">{selectedWarehouse?.name}</h2>
                                            <p className="flex items-center gap-2 text-xs font-bold text-white/60 uppercase tracking-widest mt-2">
                                                <MapPin size={12} className="text-[#00f2ff]" /> {selectedWarehouse?.location}
                                            </p>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/10">
                                            <div>
                                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Stock Total</p>
                                                <p className="text-2xl font-black">{selectedWarehouse?.total_items}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Capacidad</p>
                                                <p className="text-2xl font-black">{selectedWarehouse?.capacity_used}%</p>
                                            </div>
                                        </div>

                                        <button className="w-full py-5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                                            Ajustar Configuración
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                                    <h3 className="text-sm font-black text-[#004d4d] uppercase tracking-[0.15em] flex items-center gap-2">
                                        <History size={16} className="text-[#00f2ff]" /> Actividad Reciente
                                    </h3>
                                    <div className="space-y-6">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex gap-4 items-start">
                                                <div className="h-2 w-2 rounded-full bg-[#00f2ff] mt-1.5 shrink-0"></div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900 leading-tight">Recepción de 45 unds de "Camisa Oxford"</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Hace {i*2} horas • Juan M.</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden h-fit">
                                    <div className="p-10 border-b border-gray-50 flex justify-between items-center">
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Inventario Disponible</h3>
                                        <div className="flex gap-2">
                                            <div className="relative">
                                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input type="text" placeholder="SKU..." className="pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-[#00f2ff]/30 w-32" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-50">
                                            <thead className="bg-gray-50/50">
                                                <tr>
                                                    <th className="px-10 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Producto</th>
                                                    <th className="px-10 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Stock</th>
                                                    <th className="px-10 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Reservado</th>
                                                    <th className="px-10 py-5 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {[
                                                    { name: 'Zapato Oxford Cuero', sku: 'ZAP-001', stock: 45, reserved: 2, status: 'normal' },
                                                    { name: 'Camisa Lino Blanca', sku: 'CAM-442', stock: 12, reserved: 0, status: 'bajo' },
                                                    { name: 'Pantalón Chino Azul', sku: 'PAN-991', stock: 88, reserved: 15, status: 'normal' },
                                                    { name: 'Reloj Cronógrafo Gold', sku: 'REL-220', stock: 2, reserved: 1, status: 'crítico' },
                                                ].map((prod, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-10 py-6">
                                                            <p className="text-sm font-black text-gray-900">{prod.name}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{prod.sku}</p>
                                                        </td>
                                                        <td className="px-10 py-6 text-sm font-black text-[#004d4d]">{prod.stock}</td>
                                                        <td className="px-10 py-6 text-sm font-bold text-gray-400">{prod.reserved}</td>
                                                        <td className="px-10 py-6 text-right">
                                                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                                                                prod.status === 'normal' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                                prod.status === 'bajo' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                                                'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
                                                            }`}>
                                                                {prod.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-8 bg-gray-50/50 text-center">
                                        <button className="text-[10px] font-black uppercase text-[#004d4d] tracking-widest hover:underline transition-all">Ver catálogo completo</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- TRANSFER MODAL --- */}
            <AnimatePresence>
                {isTransferModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#004d4d]/20 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[4rem] shadow-[0_50px_100px_rgba(0,77,77,0.15)] flex flex-col overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#00f2ff]/5 to-transparent rounded-full -mr-48 -mt-48 pointer-events-none"></div>
                            
                            <div className="p-12 border-b border-gray-50 flex items-center justify-between relative z-10">
                                <div>
                                    <h2 className="text-3xl font-black text-[#004d4d] tracking-tight">Nueva Transferencia de Mercancía</h2>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                        <Info size={14} className="text-[#00f2ff]" /> Traslada productos entre ubicaciones con trazabilidad total
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setIsTransferModalOpen(false)} 
                                    className="h-14 w-14 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all text-xl"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row relative z-10">
                                <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar border-r border-gray-50">
                                    <section className="space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-[#004d4d] text-[#00f2ff] rounded-xl flex items-center justify-center shadow-lg">
                                                <MapPin size={20} />
                                            </div>
                                            <h3 className="text-sm font-black text-[#004d4d] uppercase tracking-[0.2em]">Ruta del Traslado</h3>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end relative">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bodega Origen</label>
                                                <select className="w-full p-5 bg-gray-50 rounded-[1.5rem] border border-transparent focus:bg-white focus:border-[#00f2ff]/40 outline-none text-sm font-bold text-gray-700 shadow-inner appearance-none transition-all cursor-pointer">
                                                    <option>Bodega Central - Occidente</option>
                                                    <option>Almacén Logístico Sur</option>
                                                </select>
                                            </div>
                                            
                                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex h-10 w-10 bg-white border border-gray-100 rounded-full items-center justify-center text-[#00f2ff] z-10 shadow-sm mt-3">
                                                <ArrowRight size={16} />
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bodega Destino</label>
                                                <select className="w-full p-5 bg-gray-50 rounded-[1.5rem] border border-transparent focus:bg-white focus:border-[#00f2ff]/40 outline-none text-sm font-bold text-gray-700 shadow-inner appearance-none transition-all cursor-pointer">
                                                    <option>Tienda Flagship Norte</option>
                                                    <option>Showroom Innovación</option>
                                                </select>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-[#004d4d] text-[#00f2ff] rounded-xl flex items-center justify-center shadow-lg">
                                                <Box size={20} />
                                            </div>
                                            <h3 className="text-sm font-black text-[#004d4d] uppercase tracking-[0.2em]">Productos a Transferir</h3>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input 
                                                    type="text" 
                                                    placeholder="Escribe SKU o nombre del producto..." 
                                                    className="w-full pl-12 pr-6 py-5 bg-gray-50 rounded-[1.5rem] outline-none focus:bg-white border border-transparent focus:border-[#00f2ff]/40 transition-all text-sm font-bold shadow-inner" 
                                                />
                                            </div>
                                            <button className="px-10 bg-[#004d4d] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#004d4d]/10 hover:bg-black transition-all active:scale-95">
                                                Buscar
                                            </button>
                                        </div>

                                        <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[3rem] bg-gray-50/30">
                                            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center text-gray-200 mx-auto mb-4 shadow-sm">
                                                <Package size={32} />
                                            </div>
                                            <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.2em] italic">No hay productos seleccionados</p>
                                        </div>
                                    </section>
                                </div>

                                <div className="w-full lg:w-96 bg-gray-50/50 p-12 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-100">
                                    <div className="space-y-10">
                                        <h3 className="text-sm font-black text-[#004d4d] uppercase tracking-[0.2em]">Resumen del Movimiento</h3>
                                        
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Items Totales</span>
                                                <span className="text-sm font-black text-gray-900">0</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Peso Estimado</span>
                                                <span className="text-sm font-black text-gray-900">0.0 kg</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prioridad sugerida</span>
                                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">Normal</span>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-white rounded-3xl border border-gray-100 space-y-4 shadow-sm">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                                <TrendingUp size={14} /> Nota Logística
                                            </div>
                                            <p className="text-[11px] text-gray-500 leading-relaxed font-medium italic">
                                                "El stock se bloqueará en origen inmediatamente al generar la remisión."
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-10 space-y-4">
                                        <button 
                                            onClick={() => { setIsTransferModalOpen(false); alert("Transferencia enviada satisfactoriamente."); }}
                                            className="w-full py-6 bg-[#004d4d] text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-[#004d4d]/20 hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            Generar Remisión y Enviar
                                        </button>
                                        <button 
                                            onClick={() => setIsTransferModalOpen(false)}
                                            className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-gray-900 transition-colors"
                                        >
                                            Cancelar proceso
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- AUDIT FOOTER --- */}
            <div className="relative p-12 bg-[#004d4d] rounded-[4rem] overflow-hidden shadow-2xl shadow-[#004d4d]/20">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-black/20 to-transparent pointer-events-none"></div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                    <div className="h-28 w-28 bg-[#00f2ff] rounded-[2.5rem] flex items-center justify-center text-5xl shadow-[0_0_50px_rgba(0,242,255,0.3)] animate-pulse">
                        <CheckCircle2 size={48} className="text-[#004d4d]" />
                    </div>
                    
                    <div className="flex-1 text-center lg:text-left">
                        <h3 className="text-3xl font-black text-white tracking-tight">Trazabilidad Total Garantizada</h3>
                        <p className="text-white/60 text-lg mt-4 max-w-3xl leading-relaxed font-medium">
                            Cada movimiento de mercancía genera un registro inmutable. El sistema de **Bodegas & Stock** utiliza el protocolo de "Confirmación Doble" para asegurar que la mercancía que sale es exactamente la que ingresa, eliminando fugas de inventario.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 min-w-[200px]">
                        <div className="px-6 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Precisión Stock</p>
                            <p className="text-2xl font-black text-[#00f2ff]">99.9%</p>
                        </div>
                        <button className="px-8 py-4 bg-white text-[#004d4d] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#00f2ff] transition-all">
                            Ver Reporte de Auditoría
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}