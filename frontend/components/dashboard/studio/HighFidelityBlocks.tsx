"use client";

import React from 'react';
import { ShoppingBag, User, Search, Terminal, Grid, ArrowRight, Facebook, Instagram, Twitter, Mail, MapPin, Phone } from 'lucide-react';

/**
 * COMPONENTES DE ALTA FIDELIDAD
 * Estos componentes replican pixel por pixel el diseño de tus HTML.
 */

// 1. NAVBAR
export const SmartNavbar = ({ props }: { props: any }) => {
  return (
    <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2 rounded-lg" style={{ backgroundColor: props.logoColor || '#1152d4' }}>
            <Terminal className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
            {props.logoText || 'TECH HUB'}
          </h1>
        </div>
        <nav className="hidden lg:flex items-center gap-8">
          {(props.menuItems || ["Portátiles", "Equipos", "Monitores"]).map((item: any, i: number) => (
            <span key={i} className="text-sm font-semibold hover:text-blue-600 transition-colors cursor-pointer">
              {typeof item === 'string' ? item : item.label}
            </span>
          ))}
        </nav>
        <div className="flex items-center gap-6 flex-1 justify-end">
          <div className="relative max-w-xs w-full hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm" placeholder="Buscar..." readOnly />
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <ShoppingBag size={20} />
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

// 2. HERO BANNER
export const SmartHero = ({ props }: { props: any }) => {
  return (
    <section className="relative w-full aspect-[21/9] min-h-[500px] overflow-hidden flex items-center justify-center bg-slate-900">
      <img className="absolute inset-0 w-full h-full object-cover opacity-60" src={props.imageUrl} alt="Hero" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <span className="inline-block py-1 px-3 bg-blue-600/20 text-blue-400 text-xs font-bold tracking-widest uppercase rounded-full mb-6">
          {props.badge || 'NUEVA GENERACIÓN 2024'}
        </span>
        <h2 className="text-5xl md:text-7xl font-black text-white mb-6 leading-[1.1] tracking-tighter">
          {props.title || 'Potencia Sin Límites'}
        </h2>
        <p className="text-lg md:text-xl text-slate-200 mb-10 max-w-2xl mx-auto font-light leading-relaxed italic">
          {props.subtitle}
        </p>
        <button className="px-10 py-4 rounded-lg font-bold text-base bg-blue-600 text-white hover:scale-105 transition-all">
          {props.primaryBtnText || 'Explorar Colección'}
        </button>
      </div>
    </section>
  );
};

// 3. CATEGORIES GRID
export const SmartCategoriesGrid = ({ props }: { props: any }) => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <h3 className="text-3xl font-bold tracking-tight mb-12">{props.title || 'Categorías Principales'}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {(props.items || [1,2,3,4]).map((item: any, i: number) => (
          <div key={i} className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-slate-100">
            <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={item.image} alt={item.label} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <p className="text-xl font-bold">{item.label}</p>
              <p className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">Ver más →</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// 4. PRODUCT GRID
export const SmartProductGrid = ({ props }: { props: any }) => {
  return (
    <section className="py-24 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-6">
        <h3 className="text-3xl font-bold tracking-tight mb-12">{props.title || 'Novedades'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1,2,3,4].map((p) => (
            <div key={p} className="flex flex-col group bg-white p-4 rounded-3xl shadow-sm hover:shadow-xl transition-all">
              <div className="relative aspect-[4/5] bg-slate-50 rounded-2xl overflow-hidden mb-6">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-all" src="https://via.placeholder.com/400x500" />
              </div>
              <h4 className="font-bold text-gray-900">Producto Destacado</h4>
              <p className="text-blue-600 font-black mt-2">$0.00</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 5. FOOTER PREMIUM
export const SmartFooter = ({ props }: { props: any }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-20 px-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-6">
          <h4 className="text-white text-xl font-bold uppercase tracking-tighter">{props.logoText || 'TECH HUB'}</h4>
          <p className="text-sm leading-relaxed">{props.description || 'Elevamos tu flujo de trabajo con tecnología de vanguardia.'}</p>
          <div className="flex gap-4 text-white/50"><Facebook size={18}/><Instagram size={18}/><Twitter size={18}/></div>
        </div>
        <div>
          <h5 className="text-white font-bold mb-6 text-sm uppercase">Tienda</h5>
          <ul className="space-y-4 text-xs"><li>Laptops</li><li>Equipos</li><li>Monitores</li></ul>
        </div>
        <div>
          <h5 className="text-white font-bold mb-6 text-sm uppercase">Empresa</h5>
          <ul className="space-y-4 text-xs"><li>Sobre Nosotros</li><li>Soporte</li><li>Contacto</li></ul>
        </div>
        <div className="space-y-6">
          <h5 className="text-white font-bold text-sm uppercase">Newsletter</h5>
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <input className="bg-transparent border-none text-xs flex-1 px-3" placeholder="Email" />
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-[10px] font-bold uppercase">Unirse</button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-800 text-[10px] flex justify-between">
        <p>© 2026 {props.logoText}. Todos los derechos reservados.</p>
        <div className="flex gap-6"><span>Privacidad</span><span>Términos</span></div>
      </div>
    </footer>
  );
};
