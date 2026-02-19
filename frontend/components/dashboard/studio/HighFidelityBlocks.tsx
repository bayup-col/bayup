"use client";

import React from 'react';
import { ShoppingBag, User, Search, Terminal, Grid, ArrowForward } from 'lucide-react';

/**
 * Estos componentes son una copia exacta del diseño HTML del usuario.
 * Se usan tanto en el Editor (Studio) como en la Vista Previa.
 */

// 1. NAVBAR PREMIUM (Replica de Tech Hub / Hogar & Estilo)
export const SmartNavbar = ({ props }: { props: any }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2 rounded-lg" style={{ backgroundColor: props.logoColor || '#1152d4' }}>
            <Terminal className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
            {props.logoText || 'BAYUP STORE'}
          </h1>
        </div>
        <nav className="hidden lg:flex items-center gap-8">
          {(props.menuItems || []).map((item: any, i: number) => (
            <a key={i} className="text-sm font-semibold hover:text-blue-600 transition-colors" href={item.url}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-6 flex-1 justify-end">
          <div className="relative max-w-xs w-full hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm" 
              placeholder="Buscar productos..." 
              type="text" 
              readOnly 
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-slate-100 rounded-full">
              <ShoppingBag size={20} />
              <span className="absolute top-1 right-1 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">0</span>
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-full">
              <User size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// 2. HERO BANNER CINEMATOGRÁFICO
export const SmartHero = ({ props }: { props: any }) => {
  return (
    <section className="relative w-full aspect-[21/9] min-h-[500px] overflow-hidden flex items-center justify-center bg-slate-900">
      <img 
        className="absolute inset-0 w-full h-full object-cover opacity-60" 
        src={props.imageUrl || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=2000'} 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <span className="inline-block py-1 px-3 bg-blue-600/20 text-blue-400 text-xs font-bold tracking-widest uppercase rounded-full mb-6">
          {props.badge || 'NUEVA GENERACIÓN 2024'}
        </span>
        <h2 className="text-5xl md:text-7xl font-black text-white mb-6 leading-[1.1] tracking-tighter">
          {props.title || 'Potencia Sin Límites'}
        </h2>
        <p className="text-lg md:text-xl text-slate-200 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
          {props.subtitle || 'Descubre la colección más sofisticada de equipos de alto rendimiento.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button className="px-8 py-4 rounded-lg font-bold text-base hover:opacity-90 transition-all" style={{ backgroundColor: props.primaryBtnBgColor || '#1152d4', color: '#fff' }}>
            {props.primaryBtnText || 'Explorar Colección'}
          </button>
        </div>
      </div>
    </section>
  );
};

// 3. PRODUCT GRID (Replica de Novedades)
export const SmartProductGrid = ({ props }: { props: any }) => {
  const mockProducts = [1, 2, 3, 4];
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h3 className="text-3xl font-bold tracking-tight mb-12">{props.title || 'Novedades'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {mockProducts.map((p) => (
            <div key={p} className="flex flex-col group">
              <div className="relative aspect-[4/5] bg-slate-50 rounded-2xl overflow-hidden mb-6 border border-slate-100">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://via.placeholder.com/400x500" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Categoría</p>
                <h4 className="text-lg font-bold">Producto de Ejemplo</h4>
                <p className="text-xl font-light text-slate-900 mt-2">$0.00</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
