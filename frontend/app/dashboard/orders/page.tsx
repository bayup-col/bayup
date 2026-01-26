"use client";

import { useState, useMemo } from 'react';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Search, 
  MessageSquare, 
  Printer, 
  ChevronRight,
  User,
  MapPin,
  X,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Archive,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
}

interface Order {
  id: string;
  customer: string;
  email: string;
  phone: string;
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'return_requested';
  date: string;
  items: OrderItem[];
  paymentMethod: string;
  address: string;
  returnReason?: string;
}

const INITIAL_ORDERS: Order[] = [
  { 
    id: '#8241', 
    customer: 'Ana Gómez', 
    email: 'ana@gmail.com',
    phone: '573001234567',
    total: 125000, 
    status: 'pending', 
    date: '2024-01-25 14:30', 
    paymentMethod: 'Transferencia',
    address: 'Calle 100 #15-20, Bogotá',
    items: [{ id: '1', name: 'Camiseta Minimalist White', quantity: 2, price: 62500, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100' }]
  },
  { 
    id: '#8239', 
    customer: 'Roberto Vallejo', 
    email: 'roberto.v@yahoo.com',
    phone: '573159876543',
    total: 85000, 
    status: 'paid', 
    date: '2024-01-24 09:15', 
    paymentMethod: 'Tarjeta',
    address: 'Av. Siempre Viva 742, Medellín',
    items: [{ id: '2', name: 'Gorra Urban Black', quantity: 1, price: 85000, image: 'https://images.unsplash.com/photo-1588850567047-dc4b75d3d24c?w=100' }]
  },
  { 
    id: '#8235', 
    customer: 'María Rodríguez', 
    email: 'maria.r@outlook.com',
    phone: '573204561234',
    total: 210000, 
    status: 'shipped', 
    date: '2024-01-23 18:45', 
    paymentMethod: 'Efectivo (Contra entrega)',
    address: 'Carrera 7 #45-10, Cali',
    items: [{ id: '3', name: 'Zapatillas Running Pro', quantity: 1, price: 210000, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100' }]
  },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<'all' | 'operativos' | 'entregados' | 'devoluciones'>('all');

  const stats = useMemo(() => {
    return {
        pending: orders.filter(o => o.status === 'pending').length,
        ready: orders.filter(o => o.status === 'paid').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
    };
  }, [orders]);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customer.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.includes(searchTerm);
    if (o.status === 'completed') return false; // Las archivadas no se ven en la tabla principal
    return matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
  };

  const updateStatus = (id: string, newStatus: Order['status'], reason?: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus, returnReason: reason || o.returnReason } : o));
    if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, status: newStatus, returnReason: reason || selectedOrder.returnReason });
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-black uppercase"><Clock size={12}/> Pendiente Pago</span>;
      case 'paid': return <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-black uppercase"><CheckCircle2 size={12}/> Pagado / Preparar</span>;
      case 'shipped': return <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-black uppercase"><Truck size={12}/> Despachado</span>;
      case 'delivered': return <span className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-600 border border-purple-100 rounded-lg text-[10px] font-black uppercase"><Package size={12}/> Entregado</span>;
      case 'return_requested': return <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[10px] font-black uppercase"><AlertTriangle size={12}/> Devolución</span>;
      default: return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      {/* 1. Header & Stats (Restaurado Diseño Original) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Centro de Pedidos</h1>
          <p className="text-gray-500 mt-2 font-medium italic">Gestiona el ciclo de vida de tus ventas en tiempo real.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center gap-6 group hover:scale-[1.02] transition-all cursor-pointer">
            <div className="h-14 w-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform"><Clock /></div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Por Confirmar Pago</p>
                <h3 className="text-3xl font-black text-gray-900">{stats.pending}</h3>
            </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center gap-6 group hover:scale-[1.02] transition-all cursor-pointer">
            <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform"><Package /></div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Listos para Enviar</p>
                <h3 className="text-3xl font-black text-gray-900">{stats.ready}</h3>
            </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center gap-6 group hover:scale-[1.02] transition-all cursor-pointer">
            <div className="h-14 w-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform"><Truck /></div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">En Camino</p>
                <h3 className="text-3xl font-black text-gray-900">{stats.shipped}</h3>
            </div>
        </div>
      </div>

      {/* 2. Buscador */}
      <div className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-gray-50 flex items-center px-8 group focus-within:border-purple-200 transition-all">
        <Search className="text-gray-300 group-focus-within:text-purple-500 transition-colors mr-4" />
        <input 
          type="text" 
          placeholder="Busca por número de pedido o nombre de cliente..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 py-4 bg-transparent outline-none text-sm font-bold text-gray-700"
        />
      </div>

      {/* 3. Tabla (Restaurado Diseño Original) */}
      <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identificación</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado Actual</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {filteredOrders.map((order) => (
                <tr key={order.id} onClick={() => setSelectedOrder(order)} className="hover:bg-gray-50/50 transition-all group cursor-pointer">
                  <td className="px-10 py-8"><p className="text-sm font-black text-gray-900 group-hover:text-purple-600 transition-colors">{order.id}</p><p className="text-[10px] text-gray-400 mt-1 font-bold">{order.date}</p></td>
                  <td className="px-10 py-8"><p className="text-sm font-bold text-gray-900">{order.customer}</p><p className="text-[10px] text-purple-500 font-black uppercase tracking-tighter mt-1 flex items-center gap-1"><CreditCard size={10}/> {order.paymentMethod}</p></td>
                  <td className="px-10 py-8">{getStatusBadge(order.status)}</td>
                  <td className="px-10 py-8"><p className="text-sm font-black text-gray-900">{formatCurrency(order.total)}</p></td>
                  <td className="px-10 py-8 text-right"><ChevronRight size={20} className="ml-auto text-gray-300 group-hover:text-purple-600 transition-all" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL DETALLE (Integrando Nuevas Funciones en Diseño Original) */}
      <AnimatePresence>
        {selectedOrder && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white w-full max-w-6xl h-[85vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden">
                    <div className="p-8 md:px-12 border-b border-gray-50 flex items-center justify-between bg-gray-900 text-white">
                        <div className="flex items-center gap-6">
                            <div className="h-14 w-14 bg-purple-600 rounded-2xl flex items-center justify-center text-2xl">📦</div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tighter">Detalle de Operación {selectedOrder.id}</h2>
                                <p className="text-[10px] font-black uppercase text-purple-400 tracking-widest">{selectedOrder.date}</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedOrder(null)} className="h-12 w-12 bg-white/10 hover:bg-rose-500 rounded-2xl transition-all flex items-center justify-center"><X size={24}/></button>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                            <section className="bg-gray-50 p-8 rounded-[2.5rem] grid grid-cols-2 gap-8 border border-gray-100">
                                <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Comprador</p><p className="text-sm font-black text-gray-900">{selectedOrder.customer}</p><p className="text-xs font-medium text-purple-600">{selectedOrder.email}</p></div>
                                <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Dirección de Envío</p><p className="text-sm font-bold text-gray-700 flex items-center gap-1"><MapPin size={14} className="text-rose-500"/> {selectedOrder.address}</p></div>
                            </section>

                            <section className="space-y-6">
                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Artículos en la Orden</h3>
                                <div className="space-y-3">
                                    {selectedOrder.items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-6 p-4 border border-gray-50 rounded-3xl">
                                            <div className="h-16 w-16 rounded-xl overflow-hidden bg-gray-100"><img src={item.image} className="w-full h-full object-cover"/></div>
                                            <div className="flex-1"><p className="text-sm font-black text-gray-900">{item.name}</p><p className="text-[10px] text-gray-400 font-bold">Cantidad: {item.quantity}</p></div>
                                            <p className="text-sm font-black text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Panel de Devoluciones Integrado */}
                            {['shipped', 'delivered', 'return_requested'].includes(selectedOrder.status) && (
                                <section className="p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-rose-700 uppercase tracking-widest flex items-center gap-2"><RotateCcw size={14}/> Panel de Garantía</h3>
                                        {selectedOrder.status !== 'return_requested' && <button onClick={() => updateStatus(selectedOrder.id, 'return_requested', 'Solicitud de cliente')} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase">Marcar Devolución</button>}
                                    </div>
                                    {selectedOrder.status === 'return_requested' && <p className="text-xs font-bold text-rose-600">Estado: Proceso de retorno activo</p>}
                                </section>
                            )}
                        </div>

                        <div className="w-full lg:w-[400px] bg-gray-50 border-l border-gray-100 flex flex-col">
                            <div className="p-10 flex-1 space-y-10 overflow-y-auto">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest text-center">Línea de Tiempo</h3>
                                <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                                    {[
                                        { s: 'paid', label: 'Pago Verificado', icon: <DollarSign size={12}/> },
                                        { s: 'shipped', label: 'Despachado', icon: <Truck size={12}/> },
                                        { s: 'delivered', label: 'Entregado', icon: <Package size={12}/> },
                                        { s: 'completed', label: 'Archivado', icon: <Archive size={12}/> }
                                    ].map((step, i) => {
                                        const isDone = (selectedOrder.status === 'completed') || 
                                                       (selectedOrder.status === 'delivered' && step.s !== 'completed') ||
                                                       (selectedOrder.status === 'shipped' && (step.s === 'paid' || step.s === 'shipped')) ||
                                                       (selectedOrder.status === 'paid' && step.s === 'paid');
                                        return (
                                            <div key={i} className="flex items-start gap-6 relative">
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center z-10 ${isDone ? 'bg-purple-600 text-white shadow-lg' : 'bg-white border-2 border-gray-200 text-gray-300'}`}>{step.icon}</div>
                                                <p className={`text-xs font-black uppercase tracking-widest ${isDone ? 'text-gray-900' : 'text-gray-300'}`}>{step.label}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-10 bg-white border-t border-gray-100 space-y-4 shadow-[0_-20px_60px_rgba(0,0,0,0.03)]">
                                {selectedOrder.status === 'pending' && <button onClick={() => updateStatus(selectedOrder.id, 'paid')} className="w-full bg-emerald-500 text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"><CheckCircle2 size={18}/> Confirmar Pago</button>}
                                {selectedOrder.status === 'paid' && <button onClick={() => updateStatus(selectedOrder.id, 'shipped')} className="w-full bg-blue-500 text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"><Truck size={18}/> Despachar</button>}
                                {selectedOrder.status === 'shipped' && <button onClick={() => updateStatus(selectedOrder.id, 'delivered')} className="w-full bg-purple-600 text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"><Package size={18}/> Confirmar Entrega</button>}
                                {selectedOrder.status === 'delivered' && (
                                    <button onClick={() => { updateStatus(selectedOrder.id, 'completed'); setSelectedOrder(null); alert("¡Venta Archivada!"); }} className="w-full bg-gray-900 text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"><Archive size={18}/> Aceptar y Archivar</button>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2"><Printer size={14}/> Factura</button>
                                    <button className="py-4 bg-purple-50 text-purple-600 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-purple-100 transition-all flex items-center justify-center gap-2"><MessageSquare size={14}/> WhatsApp</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
