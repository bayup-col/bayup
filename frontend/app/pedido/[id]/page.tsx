'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Clock, Package, Truck, XCircle, Loader2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://bayup-backend.onrender.com';

const STEPS = [
  { key: 'pending',    label: 'Confirmado',  icon: CheckCircle2, desc: 'Tu pedido fue recibido'           },
  { key: 'processing', label: 'Preparando',  icon: Package,      desc: 'Estamos alistando tu pedido'      },
  { key: 'shipped',    label: 'En camino',   icon: Truck,        desc: 'Tu pedido está siendo entregado'  },
  { key: 'completed',  label: 'Entregado',   icon: CheckCircle2, desc: '¡Tu pedido llegó!'                },
];

const STEP_INDEX: Record<string, number> = {
  pending: 0, processing: 1, shipped: 2, completed: 3,
};

function fmtCOP(v: number) {
  return '$' + Math.round(v).toLocaleString('es-CO');
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`${API}/public/orders/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setOrder)
      .catch(() => setError('No encontramos este pedido.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 size={32} className="animate-spin text-[#004d4d]"/>
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <XCircle size={40} className="text-gray-300 mb-3"/>
      <p className="text-lg font-black text-gray-700">Pedido no encontrado</p>
      <p className="text-sm text-gray-400 mt-1">{error || 'El enlace puede ser incorrecto o el pedido no existe.'}</p>
    </div>
  );

  const isCancelled = order.status === 'cancelled';
  const activeStep  = isCancelled ? -1 : (STEP_INDEX[order.status] ?? 0);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Header */}
        <div className="bg-[#0f0f0f] rounded-2xl px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-black italic text-white tracking-tight">
            Bay<span className="text-[#00f2ff]">UP.</span>
          </span>
          <span className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">{order.shop_name}</span>
        </div>

        {/* Estado principal */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${isCancelled ? 'bg-red-50' : 'bg-[#004d4d]/10'}`}>
              {isCancelled
                ? <XCircle size={22} className="text-red-500"/>
                : <CheckCircle2 size={22} className="text-[#004d4d]"/>
              }
            </div>
            <div>
              <p className="text-lg font-black text-gray-900">
                {isCancelled ? 'Pedido cancelado' : `Pedido #${order.short_id}`}
              </p>
              <p className="text-sm text-gray-400 mt-0.5">
                {isCancelled
                  ? 'Este pedido fue cancelado. Contáctanos si tienes dudas.'
                  : `Realizado el ${order.created_at ? fmtDate(order.created_at) : '—'}`}
              </p>
            </div>
          </div>

          {/* Barra de progreso */}
          {!isCancelled && (
            <div className="relative mb-2">
              {/* Línea conectora */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100 mx-10"/>
              <div
                className="absolute top-4 left-0 h-0.5 bg-[#004d4d] mx-10 transition-all duration-700"
                style={{ width: `${(activeStep / (STEPS.length - 1)) * (100 - 0)}%` }}
              />
              <div className="relative flex justify-between">
                {STEPS.map((step, i) => {
                  const done    = i <= activeStep;
                  const current = i === activeStep;
                  const Icon    = step.icon;
                  return (
                    <div key={step.key} className="flex flex-col items-center w-1/4">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 z-10 transition-all ${
                        done
                          ? 'bg-[#004d4d] border-[#004d4d]'
                          : 'bg-white border-gray-200'
                      } ${current ? 'ring-4 ring-[#004d4d]/20' : ''}`}>
                        <Icon size={14} className={done ? 'text-white' : 'text-gray-300'}/>
                      </div>
                      <p className={`text-[9px] font-bold uppercase tracking-widest mt-2 text-center ${
                        done ? 'text-[#004d4d]' : 'text-gray-300'
                      }`}>{step.label}</p>
                      {current && (
                        <p className="text-[8px] text-gray-400 text-center mt-0.5 leading-tight max-w-[60px]">{step.desc}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Resumen del pedido */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resumen del pedido</p>
          </div>
          <div className="divide-y divide-gray-50">
            {order.items.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-[12px] font-semibold text-gray-800">{item.name}</p>
                  <p className="text-[10px] text-gray-400">x{item.qty}</p>
                </div>
                <p className="text-[12px] font-bold text-gray-700">{fmtCOP(item.qty * item.price)}</p>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-[#0f0f0f] flex justify-between items-center">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Total pagado</p>
            <p className="text-lg font-black text-[#00f2ff]">{fmtCOP(order.total)}</p>
          </div>
        </div>

        {/* Info del cliente */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cliente</p>
            <p className="text-[12px] font-semibold text-gray-700">{order.customer_name || '—'}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ciudad</p>
            <p className="text-[12px] font-semibold text-gray-700">{order.customer_city || '—'}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Método de pago</p>
            <p className="text-[12px] font-semibold text-gray-700">{order.payment_method || '—'}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Fecha</p>
            <p className="text-[12px] font-semibold text-gray-700">{order.created_at ? fmtDate(order.created_at) : '—'}</p>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-300">
          ¿Tienes dudas? Responde el correo de confirmación y te ayudamos.
        </p>
      </div>
    </div>
  );
}
