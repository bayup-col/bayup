"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Search, 
  MapPin, 
  ChevronRight, 
  X, 
  AlertCircle, 
  Printer, 
  Box, 
  ExternalLink, 
  Tag 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api';

// Definición de estados del flujo de envío
type ShippingStatus = 'pending_packing' | 'ready_to_ship' | 'in_transit' | 'delivered' | 'exception';

interface ShippingItem {
    id: string;
    order_id: string;
    recipient_name: string;
    destination_address: string;
    carrier: string | null;
    tracking_number?: string | null;
    status: ShippingStatus;
    updated_at: string;
}

export default function ShippingPage() {
  const { token } = useAuth();
  const [shipments, setShipments] = useState<ShippingItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<ShippingStatus>('pending_packing');
  const [selectedShipment, setSelectedShipment] = useState<ShippingItem | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchShipments = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<ShippingItem[]>('/shipments', { token });
      setShipments(data);
    } catch (err) {
      console.error("Error al cargar envíos", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const counts = useMemo(() => ({
    pending_packing: shipments.filter(s => s.status === 'pending_packing').length,
    ready_to_ship: shipments.filter(s => s.status === 'ready_to_ship').length,
    in_transit: shipments.filter(s => s.status === 'in_transit').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    exception: shipments.filter(s => s.status === 'exception').length,
  }), [shipments]);

  const filteredShipments = useMemo(() => {
    return shipments.filter(s => s.status === activeFilter);
  }, [activeFilter, shipments]);

  const updateShippingStatus = async (id: string, newStatus: ShippingStatus) => {
    if (!token) return;
    try {
      await apiRequest(`/shipments/${id}/status?status=${newStatus}`, { 
        method: 'PUT',
        token 
      });
      fetchShipments();
      setSelectedShipment(null);
    } catch (err) {
      alert("Error al actualizar el estado del envío");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Gestión de Envíos</h1>
        <p className="text-gray-500 mt-2 font-medium">Controla la logística, despachos y entregas de tus pedidos.</p>
      </header>

      {/* Tarjetas de Navegación de Flujo */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { id: 'pending_packing', label: 'Por Empacar', icon: <Box className="w-6 h-6" />, color: 'bg-orange-500', textColor: 'text-orange-500', count: counts.pending_packing },
          { id: 'ready_to_ship', label: 'Listos Despacho', icon: <Tag className="w-6 h-6" />, color: 'bg-blue-500', textColor: 'text-blue-500', count: counts.ready_to_ship },
          { id: 'in_transit', label: 'En Tránsito', icon: <Truck className="w-6 h-6" />, color: 'bg-indigo-500', textColor: 'text-indigo-500', count: counts.in_transit },
          { id: 'delivered', label: 'Entregados', icon: <CheckCircle2 className="w-6 h-6" />, color: 'bg-emerald-500', textColor: 'text-emerald-500', count: counts.delivered },
          { id: 'exception', label: 'Incidencias', icon: <AlertCircle className="w-6 h-6" />, color: 'bg-rose-500', textColor: 'text-rose-500', count: counts.exception },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as ShippingStatus)}
            className={`p-6 rounded-[2rem] border transition-all text-left relative overflow-hidden ${
              activeFilter === tab.id 
              ? `${tab.color} border-transparent text-white shadow-lg scale-105 z-10` 
              : `bg-white border-gray-100 text-gray-600 hover:border-gray-300`
            }`}
          >
            <div className={`mb-3 ${activeFilter === tab.id ? 'text-white' : tab.textColor}`}>
              {tab.icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{tab.label}</p>
            <p className="text-2xl font-black">{tab.count}</p>
          </button>
        ))}
      </div>

      {/* Tabla de Envíos */}
      <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-8 border-b border-gray-50">
            <h2 className="text-xl font-black text-gray-900 capitalize">
                {activeFilter.replace('_', ' ').replace('pending packing', 'Por Empacar').replace('ready to ship', 'Listos para Despacho')}
            </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID Envío</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Destinatario</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Transportadora</th>
                <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={4} className="py-20 text-center text-gray-400 font-bold italic">Cargando...</td></tr>
              ) : filteredShipments.length === 0 ? (
                <tr>
                    <td colSpan={4} className="py-20 text-center text-gray-400 font-bold italic">
                        No hay envíos en esta etapa
                    </td>
                </tr>
              ) : filteredShipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-gray-900">{shipment.id.substring(0,8)}</p>
                    <p className="text-[10px] text-gray-400">Pedido: #{shipment.order_id.substring(0,8)}</p>
                  </td>
                  <td className="px-8 py-6 font-bold text-gray-700">
                    {shipment.recipient_name}
                    <p className="text-[10px] font-normal text-gray-400 flex items-center gap-1">
                        <MapPin size={10}/> {shipment.destination_address}
                    </p>
                  </td>
                  <td className="px-8 py-6 font-black text-sm text-gray-900">
                    {shipment.carrier || 'No asignada'}
                    {shipment.tracking_number && (
                        <p className="text-[10px] font-normal text-purple-600 underline cursor-pointer">#{shipment.tracking_number}</p>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                        {activeFilter === 'pending_packing' && (
                            <button onClick={() => updateShippingStatus(shipment.id, 'ready_to_ship')} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-md hover:bg-orange-600 transition-colors">Empacado</button>
                        )}
                        {activeFilter === 'ready_to_ship' && (
                            <button onClick={() => updateShippingStatus(shipment.id, 'in_transit')} className="bg-blue-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-md hover:bg-blue-600 transition-colors">Despachar</button>
                        )}
                        {activeFilter === 'in_transit' && (
                            <button onClick={() => updateShippingStatus(shipment.id, 'delivered')} className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-md hover:bg-indigo-600 transition-colors">Entregado</button>
                        )}
                        <button onClick={() => setSelectedShipment(shipment)} className="p-2 text-gray-400 hover:text-purple-600 transition-colors"><ChevronRight size={24} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle de Envío */}
      <AnimatePresence>
        {selectedShipment && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white w-full max-w-2xl max-h-[80vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-900 text-white">
                        <h2 className="text-xl font-black">Envío {selectedShipment.id.substring(0,8)}</h2>
                        <button onClick={() => setSelectedShipment(null)} className="text-white/50 hover:text-white transition-colors"><X size={24} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-10 bg-gray-50/50 space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Información de Entrega</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase">Destinatario</p>
                                    <p className="font-bold text-gray-900">{selectedShipment.recipient_name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase">Dirección</p>
                                    <p className="text-sm font-medium text-gray-700">{selectedShipment.destination_address}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase">Transportadora</p>
                                    <p className="text-sm font-bold text-gray-700">{selectedShipment.carrier || 'Pendiente'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="flex-1 bg-white border border-gray-200 text-gray-900 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
                                <Printer size={16} /> Imprimir Guía
                            </button>
                            <button className="flex-1 bg-purple-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-700 shadow-lg shadow-purple-100 transition-all">
                                <ExternalLink size={16} /> Rastrear Paquete
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}