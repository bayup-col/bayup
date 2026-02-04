"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Activity, Zap, ShoppingBag, Navigation, Store } from "lucide-react";
import { useState, useEffect } from "react";

interface LiveMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Simulación de sucursales
const BRANCHES = [
  { id: 1, name: 'Tienda Principal', x: 50, y: 40, status: 'high', sales: '$ 12.5M', traffic: 'Alta' },
  { id: 2, name: 'Sucursal Norte', x: 70, y: 25, status: 'normal', sales: '$ 8.4M', traffic: 'Media' },
  { id: 3, name: 'Showroom Sur', x: 30, y: 65, status: 'low', sales: '$ 4.2M', traffic: 'Baja' },
];

export default function LiveMapModal({ isOpen, onClose }: LiveMapModalProps) {
  const [activeBranch, setActiveBranch] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white w-full max-w-6xl h-[80vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
          >
            {/* LEFT: MAP AREA */}
            <div className="flex-1 relative bg-slate-50 overflow-hidden">
                {/* Abstract Map Background (Grid & Patterns) */}
                <div className="absolute inset-0 opacity-10" 
                     style={{ backgroundImage: 'radial-gradient(#004d4d 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                </div>
                
                {/* Decorative Map Lines (Abstract Roads) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                    <path d="M0 200 Q 400 300 800 100 T 1200 400" fill="none" stroke="#004d4d" strokeWidth="2" />
                    <path d="M200 800 Q 300 400 600 200" fill="none" stroke="#004d4d" strokeWidth="2" />
                </svg>

                {/* Map Header Overlay */}
                <div className="absolute top-8 left-8 z-10">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live View</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase italic">Mapa Operativo</h2>
                </div>

                {/* Branch Markers */}
                {BRANCHES.map((branch) => (
                    <motion.div
                        key={branch.id}
                        className="absolute cursor-pointer group"
                        style={{ top: `${branch.y}%`, left: `${branch.x}%` }}
                        onClick={() => setActiveBranch(branch.id)}
                        whileHover={{ scale: 1.1 }}
                    >
                        {/* Ripple Effect */}
                        <div className={`absolute -inset-4 rounded-full opacity-30 animate-ping ${branch.status === 'high' ? 'bg-emerald-500' : branch.status === 'normal' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                        
                        {/* Pin */}
                        <div className={`relative h-12 w-12 rounded-full border-4 border-white shadow-xl flex items-center justify-center transition-colors ${activeBranch === branch.id ? 'bg-slate-900 text-white scale-110' : 'bg-white text-slate-700 hover:bg-slate-50'}`}>
                            <Store size={18} />
                        </div>

                        {/* Tooltip Label */}
                        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-lg shadow-md border border-slate-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[10px] font-black text-slate-900 uppercase">{branch.name}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* RIGHT: INFO PANEL */}
            <div className="w-full md:w-96 bg-white border-l border-slate-100 p-8 flex flex-col z-20 shadow-xl">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Detalle de Zona</h3>
                    <button onClick={onClose} className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400">
                        <X size={16}/>
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeBranch ? (
                        <motion.div 
                            key="detail"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 space-y-6"
                        >
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center">
                                <div className="h-16 w-16 mx-auto bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-[#004D4D]">
                                    <Store size={32}/>
                                </div>
                                <h2 className="text-xl font-black text-slate-900">{BRANCHES.find(b => b.id === activeBranch)?.name}</h2>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Zona Centro</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 border border-slate-100 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Ventas Hoy</p>
                                    <p className="text-lg font-black text-emerald-600 mt-1">{BRANCHES.find(b => b.id === activeBranch)?.sales}</p>
                                </div>
                                <div className="p-4 border border-slate-100 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Tráfico</p>
                                    <p className="text-lg font-black text-indigo-600 mt-1">{BRANCHES.find(b => b.id === activeBranch)?.traffic}</p>
                                </div>
                            </div>

                            <div className="bg-slate-900 text-white p-6 rounded-[2rem] space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={14} className="text-[#00f2ff]"/> Actividad Reciente
                                </h4>
                                <div className="space-y-3">
                                    {[1,2,3].map((_, i) => (
                                        <div key={i} className="flex items-center gap-3 text-xs opacity-80">
                                            <div className="h-1.5 w-1.5 rounded-full bg-[#00f2ff]"></div>
                                            <span>Nueva venta registrada en POS 0{i+1}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button className="w-full py-4 rounded-xl bg-[#004D4D] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#003333] transition-colors flex items-center justify-center gap-2">
                                <Navigation size={16}/> Ir al Dashboard Local
                            </button>

                        </motion.div>
                    ) : (
                        <motion.div 
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col items-center justify-center text-center opacity-40 space-y-4"
                        >
                            <MapPin size={64} className="text-slate-300"/>
                            <p className="text-sm font-bold text-slate-900">Selecciona una sucursal<br/>en el mapa para ver detalles.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
