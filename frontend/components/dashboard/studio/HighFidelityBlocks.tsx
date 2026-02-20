"use client";

import React from 'react';
import { 
  ShoppingBag, User, Search, Terminal, Grid, ArrowRight, PlayCircle, 
  ChevronLeft, ChevronRight, ShoppingCart, Verified, Truck, Headset,
  Facebook, Instagram, Twitter, Languages, Mail, Share2, ShieldCheck,
  LayoutGrid, Heart, Camera, Send, Ruler, MapPin, Globe
} from 'lucide-react';
import { cn } from "@/lib/utils";

/**
 * COMPONENTES DE ALTA FIDELIDAD - ESPECIALIZADOS POR MARCA
 */

// 1. NAVBAR JOYERÍA (IDÉNTICO AL HTML)
export const SmartNavbar = ({ props }: { props: any }) => {
  const isJewelry = props.style === 'minimal-luxe' || props.logoText === 'Joyas de Lujo';
  return (
    <header className="w-full border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 font-serif">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
        <div className="flex items-center gap-3 shrink-0">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase italic">
            {props.logoText || 'Joyas de Lujo'}
          </h1>
        </div>
        <nav className="hidden lg:flex items-center gap-8">
          {(props.menuItems || ["Tienda", "Colecciones", "Herencia", "Contacto"]).map((item: any, i: number) => (
            <span key={i} className="text-xs font-bold uppercase tracking-widest hover:text-amber-700 cursor-pointer transition-colors">
              {typeof item === 'string' ? item : item.label}
            </span>
          ))}
        </nav>
        <div className="flex items-center gap-6 flex-1 justify-end">
          <div className="relative max-w-xs w-full hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-xs outline-none" placeholder="Buscar..." readOnly />
          </div>
          <div className="flex items-center gap-5 text-slate-600">
            <Heart size={18} className="cursor-pointer hover:text-red-500" />
            <div className="relative p-1 cursor-pointer">
              <ShoppingBag size={18} />
              <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full">0</span>
            </div>
            <User size={18} className="cursor-pointer" />
          </div>
        </div>
      </div>
    </header>
  );
};

// 2. HERO JOYERÍA
export const SmartHero = ({ props }: { props: any }) => {
  return (
    <section className="relative w-full h-[80vh] overflow-hidden flex items-center justify-center bg-slate-900 font-serif">
      <img className="absolute inset-0 w-full h-full object-cover opacity-60" src={props.imageUrl} alt="Hero" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <span className="inline-block py-1 px-4 bg-amber-500/10 text-amber-500 text-[10px] font-bold tracking-[0.4em] uppercase rounded-full mb-8 border border-amber-500/20">
          {props.badge || 'Exclusividad'}
        </span>
        <h2 className="text-6xl md:text-8xl font-light text-white mb-8 leading-none tracking-tighter italic">
          {props.title || 'Elegancia Eterna'}
        </h2>
        <p className="text-lg md:text-xl text-slate-200 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
          {props.subtitle}
        </p>
        <button className="px-12 py-5 border border-white text-white rounded-none font-bold text-xs uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all">
          {props.primaryBtnText || 'Ver Colección'}
        </button>
      </div>
    </section>
  );
};

// 3. HERENCIA (NUESTRA HERENCIA)
export const SmartHeritageBlock = ({ props }: { props: any }) => {
  return (
    <section className="py-32 bg-white text-center px-6 font-serif">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="space-y-3">
          <h4 className="text-amber-700 font-bold uppercase tracking-[0.4em] text-[10px]">{props.title || 'NUESTRA HERENCIA'}</h4>
          <h3 className="text-4xl md:text-5xl font-light text-slate-900 italic">{props.subtitle || 'Maestros artesanos desde 1924'}</h3>
        </div>
        <p className="text-lg text-slate-500 font-light leading-relaxed max-w-3xl mx-auto">
          {props.content}
        </p>
        <div className="h-px w-24 bg-amber-200 mx-auto mt-12"></div>
      </div>
    </section>
  );
};

// 4. NOVEDADES JOYERÍA
export const SmartProductGrid = ({ props }: { props: any }) => {
  return (
    <section className="py-32 bg-slate-50 font-serif">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
          <div>
            <h3 className="text-4xl font-light text-slate-900 italic tracking-tighter uppercase">{props.title || 'Novedades'}</h3>
            <div className="h-1 w-12 bg-amber-600 mt-4"></div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-black cursor-pointer transition-colors border-b border-slate-200 pb-1">Ver todos los productos</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {(props.products || []).map((p: any, i: number) => (
            <div key={i} className="group flex flex-col items-center text-center">
              <div className="relative w-full aspect-[4/5] bg-white overflow-hidden mb-8 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]" src={p.image} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                <button className="absolute bottom-6 right-6 bg-white text-black p-4 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all">
                  <ShoppingBag size={20} />
                </button>
              </div>
              <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tighter leading-tight">{p.name}</h4>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2">{p.category}</p>
              <p className="text-xl font-light text-amber-800 mt-4 italic">€ {p.price}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 5. COLECCIONES JOYERÍA
export const SmartCategoriesGrid = ({ props }: { props: any }) => {
  return (
    <section className="py-32 bg-white font-serif">
      <div className="max-w-7xl mx-auto px-6">
        <h3 className="text-center text-[10px] font-bold uppercase tracking-[0.5em] text-amber-700 mb-4">Descubra</h3>
        <h2 className="text-center text-4xl font-light italic mb-20">{props.title || 'Nuestras Colecciones'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {(props.items || []).map((item: any, i: number) => (
            <div key={i} className="group relative aspect-[3/4] overflow-hidden bg-slate-900 shadow-xl">
              <img className="w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-110 transition-all duration-[3000ms]" src={item.image} />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center space-y-6">
                <h5 className="text-white text-3xl font-light italic tracking-tight">{item.label}</h5>
                <button className="px-6 py-3 border border-white/40 text-white text-[9px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">Ver Detalles</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 6. NEWSLETTER JOYERÍA
export const SmartNewsletter = () => {
  return (
    <section className="py-32 bg-slate-900 text-white text-center px-6 font-serif">
      <div className="max-w-2xl mx-auto space-y-8">
        <h3 className="text-3xl font-light italic tracking-tight">Reciba nuestras novedades</h3>
        <p className="text-slate-400 text-sm leading-relaxed font-light">Únase a nuestro círculo exclusivo para recibir invitaciones a eventos y colecciones privadas.</p>
        <div className="flex flex-col md:flex-row gap-4 mt-10">
          <input className="flex-1 bg-white/5 border border-white/10 px-6 py-4 outline-none focus:border-amber-500 transition-colors text-sm" placeholder="Correo electrónico" />
          <button className="bg-amber-700 hover:bg-amber-600 px-10 py-4 font-bold text-xs uppercase tracking-widest transition-all">Suscribirse</button>
        </div>
      </div>
    </section>
  );
};

// 7. FOOTER JOYERÍA
export const SmartFooter = ({ props }: { props: any }) => {
  return (
    <footer className="bg-white text-slate-900 py-32 px-10 border-t border-slate-100 font-serif">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-20">
        <div className="space-y-8">
          <h4 className="text-2xl font-extrabold uppercase italic tracking-tighter">{props.logoText || 'Joyas de Lujo'}</h4>
          <p className="text-sm leading-relaxed text-slate-500 italic font-medium">{props.description}</p>
          <div className="flex gap-6 text-slate-400">
            <Globe size={20} className="hover:text-black cursor-pointer"/>
            <Camera size={20} className="hover:text-black cursor-pointer"/>
            <Mail size={20} className="hover:text-black cursor-pointer"/>
          </div>
        </div>
        <div>
          <h6 className="font-bold text-[10px] uppercase tracking-[0.3em] mb-10 text-amber-800">Empresa</h6>
          <ul className="space-y-5 text-xs font-medium text-slate-500">
            {["Nuestra Historia", "Responsabilidad", "Carreras", "Prensa"].map(l => <li key={l} className="hover:text-black cursor-pointer transition-colors">{l}</li>)}
          </ul>
        </div>
        <div>
          <h6 className="font-bold text-[10px] uppercase tracking-[0.3em] mb-10 text-amber-800">Servicio al Cliente</h6>
          <ul className="space-y-5 text-xs font-medium text-slate-500">
            {["Contacto", "Envíos y Devoluciones", "Cuidado de Joyas", "FAQ"].map(l => <li key={l} className="hover:text-black cursor-pointer transition-colors">{l}</li>)}
          </ul>
        </div>
        <div className="space-y-8">
          <h6 className="font-bold text-[10px] uppercase tracking-[0.3em] mb-10 text-amber-800">Ubicación</h6>
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-slate-500">
              <MapPin size={18} className="text-amber-700 shrink-0" />
              <p className="text-sm leading-snug">{props.location || 'Calle Serrano 145, Madrid'}</p>
            </div>
            <button className="text-[10px] font-bold uppercase tracking-widest text-amber-700 hover:text-amber-900 underline decoration-amber-200 underline-offset-8 transition-all">Ver en el mapa</button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-32 pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-6 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
        <p>© 2024 {props.logoText}. Todos los derechos reservados.</p>
        <div className="flex gap-8"><span>Privacidad</span><span>Términos</span><span>Cookies</span></div>
      </div>
    </footer>
  );
};

// 8. TRUST BANNER (JOYERÍA NO LO USA SEGÚN TU HTML, PERO LO DEJAMOS POR COMPATIBILIDAD)
export const SmartTrustBanner = () => null;
export const SmartBentoGrid = () => null;
export const SmartServices = () => null;
