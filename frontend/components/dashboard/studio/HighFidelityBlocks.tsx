"use client";

import React from 'react';
import { 
  ShoppingBag, User, Search, Grid, ArrowRight, PlayCircle, 
  ChevronLeft, ChevronRight, ShoppingCart, Verified, Truck, Headset,
  Facebook, Instagram, Twitter, Languages, Mail, Share2, ShieldCheck,
  LayoutGrid, Heart, Camera, Send, Ruler, Terminal
} from 'lucide-react';
import { cn } from "@/lib/utils";

/**
 * COMPONENTES DE ALTA FIDELIDAD - BAYUP STUDIO
 */

// 1. NAVBAR
export const SmartNavbar = ({ props }: { props: any }) => {
  const isLuxe = props.style === 'minimal-luxe';
  return (
    <header className={cn("w-full border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50", isLuxe ? "font-serif" : "font-sans")}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
        <div className="flex items-center gap-3 shrink-0">
          <div className={cn("p-1.5 rounded-lg text-white", isLuxe ? "bg-black" : "bg-blue-600")}>
            <LayoutGrid size={24} />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
            {props.logoText || 'Store'}
          </h1>
        </div>
        <nav className="hidden lg:flex items-center gap-8">
          {(props.menuItems || []).map((item: any, i: number) => (
            <span key={i} className="text-sm font-semibold hover:text-amber-700 cursor-pointer transition-colors">
              {typeof item === 'string' ? item : item.label}
            </span>
          ))}
        </nav>
        <div className="flex items-center gap-4 flex-1 justify-end">
          <div className="relative max-w-xs w-full hidden md:block text-slate-400">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} />
            <input className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm outline-none" placeholder="Buscar..." readOnly />
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <User size={20} className="cursor-pointer hover:text-amber-700" />
            <div className="relative p-2 hover:bg-slate-100 rounded-full cursor-pointer transition-colors">
              <ShoppingBag size={20} />
              <span className={cn("absolute top-1 right-1 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full", isLuxe ? "bg-black" : "bg-blue-600")}>0</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// 2. HERO
export const SmartHero = ({ props }: { props: any }) => {
  const isLuxe = props.style === 'luxe-serif';
  return (
    <section className={cn("relative w-full h-[85vh] overflow-hidden flex items-center bg-slate-900", isLuxe ? "font-serif" : "font-sans")}>
      <img className="absolute inset-0 w-full h-full object-cover opacity-70" src={props.imageUrl} alt="Hero" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
      <div className={cn("relative z-10 max-w-7xl mx-auto px-8 w-full", isLuxe ? "text-center" : "text-left")}>
        <span className={cn("font-bold tracking-[0.3em] uppercase mb-6 block text-sm", isLuxe ? "text-amber-500" : "text-blue-400")}>
          {props.badge || 'Colección Exclusive 2024'}
        </span>
        <h2 className={cn("text-6xl md:text-8xl text-white leading-[0.9] tracking-tighter mb-8", isLuxe ? "italic max-w-4xl mx-auto" : "font-black max-w-2xl")}>
          {props.title}
        </h2>
        <p className="text-lg md:text-xl text-slate-200 mb-12 max-w-xl mx-auto font-light leading-relaxed italic">
          {props.subtitle}
        </p>
        <div className={cn("flex flex-wrap gap-6", isLuxe ? "justify-center" : "justify-start")}>
          <button className={cn("px-12 py-5 text-white rounded-xl font-bold text-sm hover:scale-105 transition-all shadow-xl", isLuxe ? "bg-amber-800 shadow-amber-900/20" : "bg-blue-600 shadow-blue-600/20")}>
            {props.primaryBtnText || 'Ver Colección'}
          </button>
        </div>
      </div>
    </section>
  );
};

// 3. BENTO GRID
export const SmartBentoGrid = ({ props }: { props: any }) => {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{props.title || 'Inspiración'}</h3>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium italic">Explora nuestros espacios curados.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[700px]">
          <div className="md:col-span-8 group relative overflow-hidden rounded-3xl cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-700">
            <img className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]" src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1200" />
            <div className="absolute inset-0 bg-black/20" />
            <h5 className="absolute bottom-10 left-10 text-4xl font-black text-white italic uppercase">Espacio Principal</h5>
          </div>
          <div className="md:col-span-4 grid grid-rows-2 gap-6">
            <div className="group relative overflow-hidden rounded-3xl cursor-pointer bg-slate-200">
              <img className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" src="https://images.unsplash.com/photo-1534349762230-e09ff0542186?q=80&w=800" />
              <div className="absolute inset-0 bg-black/20" />
            </div>
            <div className="group relative overflow-hidden rounded-3xl cursor-pointer bg-slate-200">
              <img className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" src="https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=800" />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// 4. SERVICES
export const SmartServices = () => {
  return (
    <section className="py-24 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-8 p-10 rounded-3xl bg-slate-50 group hover:bg-blue-50 transition-colors">
          <div className="bg-blue-600 text-white p-6 rounded-full shadow-xl shadow-blue-600/20"><Ruler size={32}/></div>
          <div><h4 className="text-2xl font-black italic text-slate-900 mb-2 uppercase">Servicio Experto</h4><p className="text-slate-500 text-sm font-medium">Asesoramiento profesional para tu proyecto.</p></div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-8 p-10 rounded-3xl bg-slate-50 group hover:bg-blue-50 transition-colors">
          <div className="bg-blue-600 text-white p-6 rounded-full shadow-xl shadow-blue-600/20"><Truck size={32}/></div>
          <div><h4 className="text-2xl font-black italic text-slate-900 mb-2 uppercase">Logística Premium</h4><p className="text-slate-500 text-sm font-medium">Cuidado excepcional en cada entrega.</p></div>
        </div>
      </div>
    </section>
  );
};

// 5. HERITAGE
export const SmartHeritageBlock = ({ props }: { props: any }) => {
  const isLuxe = props.style === 'heritage-luxe';
  return (
    <section className={cn("py-32 bg-white text-center px-6", isLuxe ? "font-serif" : "font-sans")}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h4 className={cn("font-bold uppercase tracking-[0.3em] text-[10px]", isLuxe ? "text-amber-700" : "text-blue-600")}>{props.title || 'HERENCIA'}</h4>
          <h3 className={cn("text-4xl md:text-5xl text-slate-900 italic tracking-tighter", isLuxe ? "font-serif" : "font-black")}>{props.subtitle}</h3>
        </div>
        <p className="text-xl text-slate-500 font-light leading-relaxed max-w-2xl mx-auto italic">"{props.content}"</p>
        <div className={cn("h-px w-24 mx-auto mt-12", isLuxe ? "bg-amber-200" : "bg-slate-200")}></div>
      </div>
    </section>
  );
};

// 6. CATEGORIES GRID
export const SmartCategoriesGrid = ({ props }: { props: any }) => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <h3 className="text-4xl font-black tracking-tight text-slate-900 mb-16">{props.title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {(props.items || []).map((item: any, i: number) => (
          <div key={i} className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer shadow-sm">
            <img className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" src={item.image} alt={item.label} />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-8 left-8 text-white">
              <p className="text-2xl font-black italic uppercase">{item.label}</p>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Ver Detalles →</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// 7. PRODUCT GRID
export const SmartProductGrid = ({ props }: { props: any }) => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase mb-16">{props.title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {(props.products || []).map((p: any, i: number) => (
            <div key={i} className="group flex flex-col">
              <div className="relative aspect-square bg-slate-50 rounded-3xl overflow-hidden mb-6 border border-slate-100 transition-all duration-500 group-hover:shadow-2xl">
                <img className="w-full h-full object-cover" src={p.image} alt={p.name} />
                <div className="absolute bottom-6 right-6 bg-black text-white p-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><ShoppingBag size={20}/></div>
              </div>
              <h4 className="font-black text-base text-slate-900 uppercase italic">{p.name}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{p.category}</p>
              <p className="text-xl font-light text-slate-900 mt-3 italic">{props.currency || '$'} {p.price}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 8. TRUST BANNER
export const SmartTrustBanner = () => {
  return (
    <section className="py-24 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
        <div className="flex flex-col items-center group">
          <div className="bg-blue-50 p-6 rounded-[2rem] text-blue-600 mb-6 group-hover:scale-110 transition-transform"><Verified size={40}/></div>
          <h5 className="text-xl font-black italic tracking-tight mb-2 uppercase">Calidad</h5>
        </div>
        <div className="flex flex-col items-center group">
          <div className="bg-blue-50 p-6 rounded-[2rem] text-blue-600 mb-6 group-hover:scale-110 transition-transform"><Truck size={40}/></div>
          <h5 className="text-xl font-black italic tracking-tight mb-2 uppercase">Envío</h5>
        </div>
        <div className="flex flex-col items-center group">
          <div className="bg-blue-50 p-6 rounded-[2rem] text-blue-600 mb-6 group-hover:scale-110 transition-transform"><Headset size={40}/></div>
          <h5 className="text-xl font-black italic tracking-tight mb-2 uppercase">Soporte</h5>
        </div>
      </div>
    </section>
  );
};

// 9. FOOTER
export const SmartFooter = ({ props }: { props: any }) => {
  const isLuxe = props.style === 'dark-luxe';
  return (
    <footer className={cn("py-24 px-10 border-t", isLuxe ? "bg-black text-slate-400 font-serif" : "bg-slate-900 text-slate-400 font-sans")}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
        <div className="space-y-8">
          <h4 className="text-white text-2xl font-black uppercase italic tracking-tighter">{props.logoText}</h4>
          <p className="text-sm leading-relaxed max-w-xs italic">{props.description}</p>
          {isLuxe && <div className="text-xs text-amber-600 font-bold uppercase tracking-widest">{props.location}</div>}
        </div>
        <div>
          <h6 className="text-white font-black text-[10px] uppercase tracking-[0.3em] mb-8">Empresa</h6>
          <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
            <li className="hover:text-amber-600 cursor-pointer">Nuestra Historia</li>
            <li className="hover:text-amber-600 cursor-pointer">Contacto</li>
          </ul>
        </div>
        <div>
          <h6 className="text-white font-black text-[10px] uppercase tracking-[0.3em] mb-8">Soporte</h6>
          <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
            <li className="hover:text-amber-600 cursor-pointer">Cuidado de Joyas</li>
            <li className="hover:text-amber-600 cursor-pointer">Envíos</li>
          </ul>
        </div>
        <div className="space-y-8">
          <h6 className="text-white font-black text-[10px] uppercase tracking-[0.3em] mb-8">Newsletter</h6>
          <div className="flex bg-white/5 p-1.5 rounded-xl border border-white/10">
            <input className="bg-transparent border-none text-xs flex-1 px-4 text-white outline-none" placeholder="Correo" />
            <button className={cn("p-3 rounded-lg text-white", isLuxe ? "bg-amber-800" : "bg-blue-600")}><Send size={16} /></button>
          </div>
        </div>
      </div>
    </footer>
  );
};
