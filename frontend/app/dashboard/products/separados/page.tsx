"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  MessageSquare, 
  Smartphone, 
  ChevronRight, 
  Search, 
  Filter, 
  Layers, 
  Package, 
  User, 
  ArrowRight,
  RefreshCcw,
  Zap,
  MoreHorizontal
} from 'lucide-react';

// --- MOCK DATA ---
interface ReservedOrder {
    id: string;
    customer: {
        name: string;
        phone: string;
    };
    products: {
        name: string;
        variant: string;
        image: string;
    }[];
    requested_at: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
    confirmed_at?: string;
}

const MOCK_RESERVATIONS: ReservedOrder[] = [
    {
        id: "SEP-1001",
        customer: { name: "Mariana López", phone: "+57 300 123 4567" },
        products: [{ name: "Vestido Floral", variant: "Talla S / Azul", image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=200" }],
        requested_at: new Date(Date.now() - 3600000).toISOString(), // Hace 1 hora
        status: 'pending'
    },
    {
        id: "SEP-998",
        customer: { name: "Juan Carlos Pérez", phone: "+57 311 987 6543" },
        products: [{ name: "Camisa Oxford", variant: "Talla L / Blanco", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200" }],
        requested_at: new Date(Date.now() - 172800000).toISOString(), // Hace 2 días
        status: 'confirmed',
        confirmed_at: new Date(Date.now() - 160000000).toISOString()
    },
    {
        id: "SEP-950",
        customer: { name: "Elena Gómez", phone: "+57 320 444 5566" },
        products: [{ name: "Jeans High Rise", variant: "Talla 10 / Clásico", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200" }],
        requested_at: new Date(Date.now() - 518400000).toISOString(), // Hace 6 días
        status: 'confirmed',
        confirmed_at: new Date(Date.now() - 500000000).toISOString()
    }
];

export default function SeparadosPage() {
    const [orders, setOrders] = useState<ReservedOrder[]>(MOCK_RESERVATIONS);
    const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'cancelled' | 'expired'>('pending');
    const [selectedLine, setSelectedLine] = useState("Línea Principal");

    // Lógica de expiración automática (5+ días)
    const processedOrders = useMemo(() => {
        const now = new Date();
        const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000;
        return orders.map(order => {
            if (order.status === 'confirmed' && order.confirmed_at) {
                const diff = now.getTime() - new Date(order.confirmed_at).getTime();
                if (diff > fiveDaysInMs) return { ...order, status: 'expired' as const };
            }
            return order;
        });
    }, [orders]);

    const filteredOrders = processedOrders.filter(o => o.status === activeTab);

    const counts = {
        pending: processedOrders.filter(o => o.status === 'pending').length,
        confirmed: processedOrders.filter(o => o.status === 'confirmed').length,
        cancelled: processedOrders.filter(o => o.status === 'cancelled').length,
        expired: processedOrders.filter(o => o.status === 'expired').length,
    };

    const handleConfirm = (id: string) => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'confirmed', confirmed_at: new Date().toISOString() } : o));
        alert("WhatsApp Enviado: ¡Producto separado exitosamente! El stock ha sido bloqueado en inventario.");
    };

    const handleCancel = (id: string) => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' } : o));
        alert("WhatsApp Enviado: Tu separación ha sido cancelada. Stock liberado automáticamente.");
    };

    const handleRemind = (id: string) => {
        alert("WhatsApp Enviado: Hola, te recordamos que tienes un producto separado con nosotros. ¿Deseas finalizar tu pedido?");
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-20 space-y-10 animate-in fade-in duration-700">
            {/* --- HEADER --- */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_10px_#10B981]"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#004d4d]/60">Gestión de Reservas</span>
                    </div>
                    <h1 className="text-5xl font-black italic text-[#001A1A] tracking-tighter uppercase leading-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF] pr-2 py-1">Separados AI</span>
                    </h1>
                    <p className="text-[#004d4d]/60 mt-2 font-medium max-w-lg leading-relaxed italic">
                        Control automatizado de stock temporal y comunicación directa con el mayorista.
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 min-w-[240px]">
                        <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                            <Smartphone size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">WhatsApp</p>
                            <p className="text-xs font-black text-emerald-600 mt-1">Conectado</p>
                            <p className="text-[9px] font-bold text-gray-400 mt-0.5">{selectedLine}</p>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse"></div>
                    </div>
                </div>
            </div>

            {/* --- TABS NAVIGATION --- */}
            <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-gray-100">
                <div className="flex p-1.5 bg-gray-50/50 rounded-2xl border border-gray-100 shadow-sm w-fit">
                    {[
                        { id: 'pending', label: 'Pendientes', icon: <Clock size={14} />, count: counts.pending },
                        { id: 'confirmed', label: 'Confirmados', icon: <CheckCircle2 size={14} />, count: counts.confirmed },
                        { id: 'cancelled', label: 'Cancelados', icon: <XCircle size={14} />, count: counts.cancelled },
                        { id: 'expired', label: 'Vencidos / Alertas', icon: <AlertCircle size={14} />, count: counts.expired },
                    ].map((tab) => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                                activeTab === tab.id 
                                ? (tab.id === 'expired' ? 'bg-rose-600 text-white shadow-lg shadow-rose-100' : 'bg-[#004d4d] text-white shadow-lg shadow-[#004d4d]/20') 
                                : 'text-gray-400 hover:text-[#004d4d]'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {tab.count > 0 && <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-md text-[8px]">{tab.count}</span>}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" placeholder="Buscar por cliente o ID..." className="pl-11 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#00f2ff]/30 w-64 lg:w-80 shadow-sm transition-all" />
                    </div>
                </div>
            </div>

            {/* --- ORDERS LIST --- */}
            <div className="grid grid-cols-1 gap-6">
                <AnimatePresence mode="wait">
                    {filteredOrders.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="bg-white/60 backdrop-blur-md rounded-[3rem] p-24 text-center border border-dashed border-gray-200"
                        >
                            <Package size={48} className="mx-auto text-gray-200 mb-4" />
                            <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest italic">No hay pedidos en este estado</h3>
                        </motion.div>
                    ) : (
                        filteredOrders.map((order) => (
                            <motion.div 
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className={`group relative bg-white rounded-[3rem] p-8 border transition-all hover:shadow-xl hover:shadow-gray-200/20 flex flex-col lg:flex-row lg:items-center gap-10 ${
                                    activeTab === 'expired' ? 'border-rose-100 bg-rose-50/10 shadow-lg shadow-rose-50' : 'border-gray-50'
                                }`}
                            >
                                {/* Left: Customer Info */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-xl shadow-inner ${activeTab === 'expired' ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-400'}`}>
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-black text-gray-900 tracking-tight">{order.customer.name}</h3>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">#{order.id}</span>
                                            </div>
                                            <p className="text-sm font-bold text-[#004d4d] flex items-center gap-2 mt-1">
                                                <MessageSquare size={14} className="text-[#00f2ff]" /> {order.customer.phone}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Solicitado</p>
                                            <p className="text-xs font-bold text-gray-600 mt-1">{new Date(order.requested_at).toLocaleDateString()} • {new Date(order.requested_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                        {order.confirmed_at && (
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Confirmado</p>
                                                <p className="text-xs font-bold text-emerald-600 mt-1">{new Date(order.confirmed_at).toLocaleDateString()}</p>
                                            </div>
                                        )}
                                        <div className="px-4 py-1.5 bg-gray-50 rounded-xl">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Vía</p>
                                            <p className="text-[10px] font-black text-[#004d4d] uppercase mt-0.5">Web Mayorista</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Center: Product Preview */}
                                <div className="flex-[1.5] flex items-center gap-6 p-6 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 group-hover:bg-white group-hover:border-[#00f2ff]/20 transition-all">
                                    <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                                        <img src={order.products[0].image} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-lg font-black text-gray-900 leading-tight">{order.products[0].name}</h4>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1.5">{order.products[0].variant}</p>
                                        <div className="mt-4 flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${
                                                activeTab === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                            }`}>
                                                {activeTab === 'pending' ? 'Stock Reservado' : 'Stock Bloqueado'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="min-w-[240px] flex flex-col gap-3">
                                    {order.status === 'pending' && (
                                        <>
                                            <button 
                                                onClick={() => handleConfirm(order.id)}
                                                className="w-full py-5 bg-[#004d4d] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-[#004d4d]/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                            >
                                                <Zap size={14} className="text-[#00f2ff]" /> Confirmar Separado
                                            </button>
                                            <button 
                                                onClick={() => handleCancel(order.id)}
                                                className="w-full py-4 bg-white border border-gray-100 text-gray-400 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-rose-50 hover:text-rose-600 transition-all"
                                            >
                                                Cancelar Solicitud
                                            </button>
                                        </>
                                    )}

                                    {order.status === 'confirmed' && (
                                        <>
                                            <button 
                                                onClick={() => handleRemind(order.id)}
                                                className="w-full py-5 bg-white border border-[#004d4d]/20 text-[#004d4d] rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-emerald-50 transition-all flex items-center justify-center gap-3 shadow-sm"
                                            >
                                                <RefreshCcw size={14} className="text-[#00f2ff]" /> Recordar al cliente
                                            </button>
                                            <button 
                                                onClick={() => handleCancel(order.id)}
                                                className="w-full py-2 text-rose-600 text-[9px] font-black uppercase tracking-widest hover:underline"
                                            >
                                                Cancelar Separado
                                            </button>
                                        </>
                                    )}

                                    {order.status === 'expired' && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600">
                                                <AlertCircle size={16} />
                                                <p className="text-[10px] font-black uppercase tracking-tighter italic">Vencido (5+ días)</p>
                                            </div>
                                            <button 
                                                onClick={() => handleRemind(order.id)}
                                                className="w-full py-4 bg-[#004d4d] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#004d4d]/10"
                                            >
                                                Último Aviso (WA)
                                            </button>
                                            <button 
                                                onClick={() => handleCancel(order.id)}
                                                className="w-full py-3 bg-white border border-gray-100 text-gray-400 rounded-2xl text-[9px] font-black uppercase tracking-widest"
                                            >
                                                Liberar Stock
                                            </button>
                                        </div>
                                    )}

                                    {order.status === 'cancelled' && (
                                        <div className="text-center p-6 bg-gray-50/50 border border-dashed border-gray-200 rounded-[2rem]">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Separación Finalizada</p>
                                            <p className="text-[10px] font-bold text-gray-300 mt-1 italic italic">Stock Disponible</p>
                                        </div>
                                    )}
                                </div>

                                {/* Context Menu */}
                                <button className="absolute top-8 right-8 h-10 w-10 bg-gray-50/50 rounded-xl flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-[#004d4d] border border-transparent hover:border-gray-100">
                                    <MoreHorizontal size={18} />
                                </button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* --- FOOTER AUTO-PILOT --- */}
            <div className="relative p-12 bg-[#004d4d] rounded-[4rem] overflow-hidden shadow-2xl shadow-[#004d4d]/20 mt-16">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-black/20 to-transparent pointer-events-none"></div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 text-center lg:text-left">
                    <div className="h-28 w-28 bg-[#00f2ff] rounded-[2.5rem] flex items-center justify-center text-5xl shadow-[0_0_50px_rgba(0,242,255,0.3)]">
                        <RefreshCcw size={48} className="text-[#004d4d] animate-spin-slow" />
                    </div>
                    
                    <div className="flex-1">
                        <h3 className="text-3xl font-black text-white tracking-tight leading-tight uppercase italic">Gestión de Stock Infalible</h3>
                        <p className="text-white/60 text-lg mt-4 max-w-3xl leading-relaxed font-medium">
                            El sistema **Separados AI** garantiza la consistencia del inventario. Cuando un pedido es <span className="text-[#00f2ff]">Confirmado</span>, el stock se bloquea instantáneamente para evitar sobreventas. Al <span className="text-rose-400">Cancelar</span>, la mercancía vuelve a estar disponible para todos tus canales en milisegundos.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 min-w-[220px]">
                        <div className="px-6 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Precisión Reservas</p>
                            <p className="text-2xl font-black text-[#00f2ff]">100%</p>
                        </div>
                        <button className="px-8 py-4 bg-white text-[#004d4d] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#00f2ff] transition-all">
                            Logs de Automatización
                        </button>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </div>
    );
}