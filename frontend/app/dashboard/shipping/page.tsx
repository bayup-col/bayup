"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Shipment {
  id: string;
  orderId: string;
  customer: string;
  destination: string;
  carrier: string;
  trackingCode: string;
  status: 'pending' | 'shipped' | 'delivered' | 'returned';
  date: string;
}

const INITIAL_SHIPMENTS: Shipment[] = [
  { id: 'SH-101', orderId: '#8241', customer: 'Ana Gómez', destination: 'Bogotá, CL 45', carrier: 'Servientrega', trackingCode: '92100344', status: 'pending', date: '2024-01-25' },
  { id: 'SH-102', orderId: '#8239', customer: 'Roberto V.', destination: 'Medellín, Cra 10', carrier: 'Envía', trackingCode: 'ENV-8821', status: 'shipped', date: '2024-01-24' },
  { id: 'SH-103', orderId: '#8235', customer: 'María R.', destination: 'Cali, Av 5', carrier: 'Interrapidísimo', trackingCode: 'INT-0012', status: 'delivered', date: '2024-01-23' },
];

export default function ShippingPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>(INITIAL_SHIPMENTS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkPrint = () => {
    if (selectedIds.length === 0) return alert("Selecciona al menos un envío para imprimir.");
    setIsProcessing(true);
    // Simulación de generación de guías
    setTimeout(() => {
      alert(`Generando guías para ${selectedIds.length} pedidos... Se descargarán en breve.`);
      setIsProcessing(false);
      setSelectedIds([]);
    }, 1500);
  };

  const updateStatus = (id: string, newStatus: Shipment['status']) => {
    setShipments(shipments.map(s => s.id === id ? { ...s, status: newStatus } : s));
    alert(`Estado del envío ${id} actualizado a ${newStatus}`);
  };

  const getStatusStyle = (status: Shipment['status']) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'shipped': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'returned': return 'bg-rose-50 text-rose-600 border-rose-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Logística y Envíos</h1>
          <p className="text-gray-500 mt-2 font-medium">Controla tus despachos y haz seguimiento a las transportadoras.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleBulkPrint}
            disabled={isProcessing}
            className="px-6 py-4 bg-white border border-gray-100 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
          >
            {isProcessing ? 'Procesando...' : '📄 Imprimir Guías'}
          </button>
          <button 
            onClick={() => router.push('/dashboard/orders')} // Redirigir a pedidos para crear despacho
            className="px-8 py-4 bg-gray-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
          >
            + Crear Despacho
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-50">
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? shipments.map(s => s.id) : [])} checked={selectedIds.length === shipments.length} className="rounded" />
              </th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Guía / Transportadora</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente / Destino</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {shipments.map((s) => (
              <tr key={s.id} className={`hover:bg-gray-50/50 transition-colors ${selectedIds.includes(s.id) ? 'bg-purple-50/30' : ''}`}>
                <td className="px-8 py-6">
                  <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} className="rounded" />
                </td>
                <td className="px-8 py-6">
                  <div>
                    <p className="text-sm font-black text-gray-900">{s.trackingCode}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{s.carrier}</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div>
                    <p className="text-xs font-bold text-gray-700">{s.customer}</p>
                    <p className="text-[10px] text-gray-400">{s.destination}</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${getStatusStyle(s.status)}`}>
                    {s.status === 'pending' ? 'Pendiente' : s.status === 'shipped' ? 'En Camino' : s.status === 'delivered' ? 'Entregado' : 'Devuelto'}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <select 
                    value={s.status}
                    onChange={(e) => updateStatus(s.id, e.target.value as any)}
                    className="text-[10px] font-black uppercase text-purple-600 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-100 outline-none cursor-pointer"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="shipped">Despachar</option>
                    <option value="delivered">Entregado</option>
                    <option value="returned">Devolución</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}