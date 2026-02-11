"use client";

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 text-center max-w-lg w-full animate-in fade-in zoom-in duration-500">
        <div className="h-24 w-24 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl">🔍</span>
        </div>
        <h1 className="text-6xl font-black text-gray-900 mb-4 tracking-tighter italic">404</h1>
        <h2 className="text-2xl font-black text-gray-800 mb-6 uppercase tracking-widest">Página no encontrada</h2>
        <p className="text-gray-500 font-medium mb-10 leading-relaxed">
          Lo sentimos, la página que buscas no existe o ha sido movida. 
          Verifica la URL o regresa al panel principal.
        </p>
        <Link 
          href="/dashboard" 
          className="inline-block w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-95"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
