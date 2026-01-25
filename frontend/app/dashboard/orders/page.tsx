"use client";

import { useState } from 'react';

interface Order {
  id: string;
  customer: string;
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'cancelled';
  date: string;
  items: number;
  paymentMethod: string;
}

const INITIAL_ORDERS: Order[] = [
  { id: '#8241', customer: 'Ana Gómez', total: 125000, status: 'pending', date: '2024-01-25', items: 2, paymentMethod: 'Transferencia' },
  { id: '#8239', customer: 'Roberto V.', total: 85000, status: 'paid', date: '2024-01-24', items: 1, paymentMethod: 'Tarjeta' },
  { id: '#8235', customer: 'María R.', total: 210000, status: 'paid', date: '2024-01-23', items: 4, paymentMethod: 'Efectivo' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
  };

  const handleConfirmPayment = (id: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: 'paid' } : o));
    alert(`Pago del pedido ${id} confirmado exitosamente. ✨`);
  };

  const handleSendWhatsApp = (order: Order) => {
    const message = `Hola ${order.customer}, confirmamos que recibimos tu pedido ${order.id} por un total de ${formatCurrency(order.total)}. ¡Gracias por tu compra!`;
    alert(`Enviando a WhatsApp: 

${message}`);
    // En un entorno real aquí se usaría window.open(`https://wa.me/number?text=...`)
  };

  const handlePrintInvoice = (id: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      alert(`Generando factura del pedido ${id}...`);
      setIsProcessing(false);
    }, 1000);
  };

  const getStatusStyle = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'shipped': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Pedidos y Ventas</h1>
          <p className="text-gray-500 mt-2 font-medium">Gestiona las transacciones y estados de facturación de tu tienda.</p>
        </div>
        <div className="flex gap-4">
          <button 
            disabled={selectedIds.length === 0}
            className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${selectedIds.length > 0 ? 'bg-purple-600 text-white shadow-xl shadow-purple-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            Acciones Masivas ({selectedIds.length})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-50">
              <th className="px-8 py-6">
                <input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? orders.map(o => o.id) : [])} checked={selectedIds.length === orders.length} className="rounded" />
              </th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pedido / Fecha</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente / Medio</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <input type="checkbox" checked={selectedIds.includes(order.id)} onChange={(e) => {
                    if (e.target.checked) setSelectedIds([...selectedIds, order.id]);
                    else setSelectedIds(selectedIds.filter(id => id !== order.id));
                  }} className="rounded" />
                </td>
                <td className="px-8 py-6">
                  <div>
                    <p className="text-sm font-black text-gray-900">{order.id}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{order.date}</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div>
                    <p className="text-xs font-bold text-gray-700">{order.customer}</p>
                    <p className="text-[10px] text-purple-500 font-bold uppercase tracking-tight">{order.paymentMethod}</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <p className="text-sm font-black text-gray-900">{formatCurrency(order.total)}</p>
                  <p className="text-[9px] text-gray-400 font-bold">{order.items} artículos</p>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${getStatusStyle(order.status)}`}>
                    {order.status === 'pending' ? 'Pendiente' : order.status === 'paid' ? 'Pagado' : order.status === 'shipped' ? 'Enviado' : 'Cancelado'}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    {order.status === 'pending' && (
                      <button onClick={() => handleConfirmPayment(order.id)} title="Confirmar Pago" className="h-9 w-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-100 transition-colors">✔</button>
                    )}
                    <button onClick={() => handleSendWhatsApp(order)} title="Notificar por WhatsApp" className="h-9 w-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center hover:bg-purple-100 transition-colors">📱</button>
                    <button onClick={() => handlePrintInvoice(order.id)} title="Imprimir Factura" className="h-9 w-9 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">📄</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}