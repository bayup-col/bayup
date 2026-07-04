"use client";

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 text-center max-w-lg w-full">
        <div className="h-24 w-24 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
          <span className="text-4xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Algo salió mal</h1>
        <p className="text-gray-500 font-medium mb-8 leading-relaxed">
          Ocurrió un error inesperado. Puedes intentar de nuevo o volver al inicio.
        </p>
        <button
          onClick={reset}
          className="w-full bg-[#004d4d] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#003838] transition-all mb-3"
        >
          Intentar de nuevo
        </button>
        <a
          href="/dashboard"
          className="block w-full border border-gray-200 text-gray-600 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:border-gray-400 transition-all"
        >
          Ir al Panel
        </a>
      </div>
    </div>
  );
}
