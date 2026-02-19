"use client";

import React from 'react';
import { 
  ShoppingBag, User, Search, Grid, ArrowRight, PlayCircle, 
  ChevronLeft, ChevronRight, ShoppingCart, Verified, Truck, Headset,
  Facebook, Instagram, Twitter, Languages, Mail, Share2, ShieldCheck,
  LayoutGrid, Heart, Camera, Send, Ruler
} from 'lucide-react';

/**
 * COMPONENTES DE ALTA FIDELIDAD - BAYUP STUDIO
 */

// 1. NAVBAR
export const SmartNavbar = ({ props }: { props: any }) => {
  return (
    <header className="w-full border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <LayoutGrid size={24} />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
            {props.logoText || 'Hogar & Estilo'}
          </h1>
        </div>
        <nav className="hidden lg:flex items-center gap-8">
          {(props.menuItems || ["Muebles", "Camas", "Alfombras", "Decoración"]).map((item: any, i: number) => (
            <span key={i} className="text-sm font-semibold hover:text-blue-600 cursor-pointer transition-colors">
              {typeof item === 'string' ? item : item.label}
            </span>
          ))}
        </nav>
        <div className="flex items-center gap-4 flex-1 justify-end">
          <div className="relative max-w-xs w-full hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm outline-none" placeholder="Buscar productos..." readOnly />
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <User size={20} className="cursor-pointer hover:text-blue-600" />
            <div className="relative p-2 hover:bg-slate-100 rounded-full cursor-pointer transition-colors">
              <ShoppingBag size={20} />
              <span className="absolute top-1 right-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">2</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// 2. HERO
export const SmartHero = ({ props }: { props: any }) => {
  return (
    <section className="relative w-full h-[85vh] overflow-hidden flex items-center bg-slate-900">
      <img className="absolute inset-0 w-full h-full object-cover opacity-70" src={props.imageUrl} alt="Hero" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
      <div className="relative z-10 max-w-7xl mx-auto px-8 w-full text-left">
        <span className="text-blue-400 font-bold tracking-[0.3em] uppercase mb-6 block text-sm">
          {props.badge || 'Colección Exclusive 2024'}
        </span>
        <h2 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-8 max-w-2xl">
          {props.title || 'Transforma tu Hogar'}
        </h2>
        <p className="text-lg md:text-xl text-slate-200 mb-12 max-w-xl font-light leading-relaxed">
          {props.subtitle}
        </p>
        <div className="flex flex-wrap gap-6">
          <button className="px-12 py-5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-blue-600/20">
            Ver Colección
          </button>
          <button className="px-12 py-5 bg-white/10 backdrop-blur-md text-white border border-white/30 rounded-xl font-bold text-sm hover:bg-white/20 transition-all">
            Agendar Asesoría
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
          <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Inspiración por Espacios</h3>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium italic">Creamos ambientes que cuentan historias. Encuentra el look perfecto para cada rincón de tu vida.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[700px]">
          <div className="md:col-span-8 group relative overflow-hidden rounded-3xl cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-700">
            <img className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]" src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1200" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
            <div className="absolute bottom-10 left-10 text-white">
              <h5 className="text-4xl font-black italic tracking-tighter uppercase mb-4">La Sala</h5>
              <button className="bg-white text-slate-900 font-bold px-8 py-3 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">Explorar Sala</button>
            </div>
          </div>
          <div className="md:col-span-4 grid grid-rows-2 gap-6">
            <div className="group relative overflow-hidden rounded-3xl cursor-pointer">
              <img className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" src="https://images.unsplash.com/photo-1534349762230-e09ff0542186?q=80&w=800" />
              <div className="absolute inset-0 bg-black/20" />
              <h5 className="absolute bottom-6 left-6 text-xl font-black text-white italic uppercase tracking-tighter">Comedor</h5>
            </div>
            <div className="group relative overflow-hidden rounded-3xl cursor-pointer">
              <img className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" src="https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=800" />
              <div className="absolute inset-0 bg-black/20" />
              <h5 className="absolute bottom-6 left-6 text-xl font-black text-white italic uppercase tracking-tighter">Habitación</h5>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// 4. SERVICIOS
export const SmartServices = () => {
  return (
    <section className="py-24 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="flex items-center gap-8 p-10 rounded-3xl bg-slate-50 group hover:bg-blue-50 transition-colors cursor-pointer">
          <div className="bg-blue-600 text-white p-6 rounded-full group-hover:rotate-12 transition-transform shadow-xl shadow-blue-600/20"><Ruler size={32}/></div>
          <div>
            <h4 className="text-2xl font-black italic tracking-tighter text-slate-900 mb-2 uppercase">Asesoría en Diseño</h4>
            <p className="text-slate-500 text-sm font-medium mb-4">Expertos te ayudan a crear el espacio de tus sueños.</p>
            <span className="text-blue-600 font-bold text-xs flex items-center gap-2 uppercase tracking-widest">Más información <ArrowRight size={14}/></span>
          </div>
        </div>
        <div className="flex items-center gap-8 p-10 rounded-3xl bg-slate-50 group hover:bg-blue-50 transition-colors cursor-pointer">
          <div className="bg-blue-600 text-white p-6 rounded-full group-hover:rotate-12 transition-transform shadow-xl shadow-blue-600/20"><Truck size={32}/></div>
          <div>
            <h4 className="text-2xl font-black italic tracking-tighter text-slate-900 mb-2 uppercase">Envío Garantizado</h4>
            <p className="text-slate-500 text-sm font-medium mb-4">Cuidado excepcional en la entrega y montaje gratuito.</p>
            <span className="text-blue-600 font-bold text-xs flex items-center gap-2 uppercase tracking-widest">Ver cobertura <ArrowRight size={14}/></span>
          </div>
        </div>
      </div>
    </section>
  );
};

// 5. TRUST BANNER
export const SmartTrustBanner = () => {
  return (
    <section className="py-24 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
        <div className="flex flex-col items-center group">
          <div className="bg-blue-50 p-6 rounded-[2rem] text-blue-600 mb-6 group-hover:scale-110 transition-transform"><Verified size={40}/></div>
          <h5 className="text-xl font-black italic tracking-tight mb-2 uppercase">Calidad Garantizada</h5>
          <p className="text-slate-500 text-sm leading-relaxed">Componentes probados bajo los estándares más exigentes.</p>
        </div>
        <div className="flex flex-col items-center group">
          <div className="bg-blue-50 p-6 rounded-[2rem] text-blue-600 mb-6 group-hover:scale-110 transition-transform"><Truck size={40}/></div>
          <h5 className="text-xl font-black italic tracking-tight mb-2 uppercase">Envío Premium</h5>
          <p className="text-slate-500 text-sm leading-relaxed">Entrega asegurada en 24-48 horas con embalaje reforzado.</p>
        </div>
        <div className="flex flex-col items-center group">
          <div className="bg-blue-50 p-6 rounded-[2rem] text-blue-600 mb-6 group-hover:scale-110 transition-transform"><Headset size={40}/></div>
          <h5 className="text-xl font-black italic tracking-tight mb-2 uppercase">Soporte Experto</h5>
          <p className="text-slate-500 text-sm leading-relaxed">Asesoramiento técnico personalizado por especialistas.</p>
        </div>
      </div>
    </section>
  );
};

// 6. CATEGORIES GRID
export const SmartCategoriesGrid = ({ props }: { props: any }) => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <div className="flex items-end justify-between mb-16">
        <div>
          <h3 className="text-4xl font-black tracking-tight text-slate-900">{props.title || 'Categorías Principales'}</h3>
          <p className="text-slate-500 mt-2 font-medium italic">Explora nuestra selección por tipo de producto</p>
        </div>
        <span className="text-blue-600 font-bold text-sm flex items-center gap-2 cursor-pointer hover:underline uppercase tracking-widest">
          Ver todo <ArrowRight size={16} />
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {(props.items || []).map((item: any, i: number) => (
          <div key={i} className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer bg-slate-100 shadow-sm">
            <img className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" src={item.image} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8">
              <p className="text-white text-2xl font-black italic uppercase tracking-tighter leading-tight">{item.label}</p>
              <p className="text-slate-300 text-[10px] mt-1 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">{item.sub || 'Explorar ahora'}</p>
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
        <div className="flex items-center justify-between mb-16">
          <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">{props.title || 'Productos Destacados'}</h3>
          <div className="flex gap-3">
            <button className="w-12 h-12 flex items-center justify-center border border-slate-200 rounded-full hover:bg-slate-50 transition-all"><ChevronLeft size={20}/></button>
            <button className="w-12 h-12 flex items-center justify-center border border-slate-200 rounded-full hover:bg-slate-50 transition-all"><ChevronRight size={20}/></button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {(props.products || [1,2,3,4]).map((p: any, i: number) => (
            <div key={i} className="group flex flex-col">
              <div className="relative aspect-square bg-slate-50 rounded-3xl overflow-hidden mb-6 border border-slate-100 transition-all duration-500 group-hover:shadow-2xl">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={p.image || "https://via.placeholder.com/400x400"} />
                {p.isNew && <span className="absolute top-6 left-6 bg-blue-600 text-white text-[8px] font-black px-3 py-1 rounded-md tracking-widest">NUEVO</span>}
                <button className="absolute top-6 right-6 p-2 bg-white/80 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Heart size={16}/></button>
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform">
                  <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl">Añadir al Carrito</button>
                </div>
              </div>
              <h4 className="font-black text-base text-slate-900 group-hover:text-blue-600 transition-colors uppercase italic tracking-tight">{p.name || 'Producto Premium'}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{p.category || 'Muebles'}</p>
              <p className="text-xl font-light text-slate-900 mt-3 italic">${p.price || '0.00'}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 8. FOOTER
export const SmartFooter = ({ props }: { props: any }) => {
  return (
    <footer className="bg-[#0f172a] text-slate-400 py-24 px-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
        <div className="space-y-8">
          <div className="flex items-center gap-3 text-white">
            <LayoutGrid size={24} className="text-blue-500" />
            <span className="text-2xl font-black uppercase italic tracking-tighter">{props.logoText || 'Hogar & Estilo'}</span>
          </div>
          <p className="text-sm leading-relaxed max-w-xs italic font-medium">"Líderes en diseño de interiores y mobiliario premium."</p>
          <div className="flex gap-6 text-white/30"><Share2 size={20}/><Camera size={20}/></div>
        </div>
        <div>
          <h6 className="text-white font-black text-[10px] uppercase tracking-[0.3em] mb-8">Categorías</h6>
          <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
            <li>Muebles de Sala</li><li>Comedores</li><li>Dormitorios</li>
          </ul>
        </div>
        <div>
          <h6 className="text-white font-black text-[10px] uppercase tracking-[0.3em] mb-8">Compañía</h6>
          <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
            <li>Sobre Nosotros</li><li>Showrooms</li><li>Sostenibilidad</li>
          </ul>
        </div>
        <div className="space-y-8">
          <h6 className="text-white font-black text-[10px] uppercase tracking-[0.3em] mb-8">Suscríbete</h6>
          <div className="flex bg-white/5 p-1.5 rounded-xl border border-white/10">
            <input className="bg-transparent border-none text-xs flex-1 px-4 text-white outline-none" placeholder="Tu email" />
            <button className="bg-blue-600 text-white p-3 rounded-lg"><Send size={16} /></button>
          </div>
        </div>
      </div>
    </footer>
  );
};
