'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, XCircle, Store } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';

// Página de retorno para métodos de pago Wompi que requieren redirección completa
// (transferencia bancaria, PSE, Nequi) — a diferencia de tarjeta, estos métodos
// sacan al comprador del sitio para autenticarse con su banco, así que el
// callback in-page del widget nunca se ejecuta. Wompi trae de vuelta al
// comprador aquí, y confirmamos el pago consultando nuestro propio backend
// (única fuente de verdad, nunca el resultado del navegador).
export default function ConfirmandoPagoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={36} className="animate-spin text-[#004d4d]" />
      </div>
    }>
      <ConfirmandoPagoContent />
    </Suspense>
  );
}

function ConfirmandoPagoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const slug = searchParams.get('slug');

  const [state, setState] = useState<'checking' | 'failed' | 'timeout'>('checking');

  useEffect(() => {
    if (!paymentId) {
      setState('failed');
      return;
    }
    let cancelled = false;

    (async () => {
      for (let i = 0; i < 20; i++) {
        if (cancelled) return;
        try {
          const res = await fetch(`${API}/public/payment/${paymentId}${slug ? `?slug=${encodeURIComponent(slug)}` : ''}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'approved') {
              if (data.order_id) {
                router.replace(`/pedido/${data.order_id}`);
              } else {
                setState('failed');
              }
              return;
            }
            if (data.status === 'failed') {
              setState('failed');
              return;
            }
          }
        } catch {}
        await new Promise(r => setTimeout(r, 1500));
      }
      if (!cancelled) setState('timeout');
    })();

    return () => { cancelled = true; };
  }, [paymentId, slug, router]);

  const storeLink = slug ? `/shop/${slug}` : '/';

  if (state === 'checking') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <Loader2 size={36} className="animate-spin text-[#004d4d] mb-4" />
        <p className="text-lg font-black text-gray-800">Confirmando tu pago…</p>
        <p className="text-sm text-gray-400 mt-1">Esto puede tardar unos segundos. No cierres esta página.</p>
      </div>
    );
  }

  if (state === 'timeout') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <Loader2 size={36} className="text-amber-400 mb-4" />
        <p className="text-lg font-black text-gray-800">Tu pago sigue en verificación</p>
        <p className="text-sm text-gray-400 mt-1 max-w-sm">
          Te notificaremos por correo en cuanto se confirme. Si el dinero fue debitado, tu pedido quedará registrado automáticamente.
        </p>
        <a href={storeLink} className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#004d4d] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#003838] transition-colors">
          <Store size={14} /> Volver a la tienda
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <XCircle size={40} className="text-gray-300 mb-3" />
      <p className="text-lg font-black text-gray-700">No pudimos confirmar tu pago</p>
      <p className="text-sm text-gray-400 mt-1 max-w-sm">
        Si el dinero fue debitado de tu cuenta, contáctanos con el número de referencia de tu transacción.
      </p>
      <a href={storeLink} className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#004d4d] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#003838] transition-colors">
        <Store size={14} /> Volver a la tienda
      </a>
    </div>
  );
}
