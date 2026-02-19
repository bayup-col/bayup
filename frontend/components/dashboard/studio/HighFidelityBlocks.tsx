"use client";

import React from 'react';
import { 
  ShoppingBag, User, Search, Terminal, Grid, ArrowRight, PlayCircle, 
  ChevronLeft, ChevronRight, ShoppingCart, Verified, Truck, Headset,
  Facebook, Instagram, Twitter, Languages, Mail, Share2, ShieldCheck
} from 'lucide-react';

// 1. NAVBAR COMPLETO
export const SmartNavbar = ({ props }: { props: any }) => {
  return (
    <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Terminal size={20} />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
            {props.logoText || 'Tech Hub'}
          </h1>
        </div>
        <nav className="hidden lg:flex items-center gap-8">
          {["Portátiles", "Equipos de Mesa", "Monitores", "Periféricos"].map((item, i) => (
            <span key={i} className="text-sm font-semibold hover:text-blue-600 cursor-pointer">{item}</span>
          ))}
        </nav>
        <div className="flex items-center gap-6 flex-1 justify-end">
          <div className="relative max-w-xs w-full hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm" placeholder="Buscar productos..." readOnly />
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <div className="relative p-2 hover:bg-slate-100 rounded-full cursor-pointer">
              <ShoppingBag size={20} />
              <span className="absolute top-1 right-1 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">3</span>
            </div>
            <User size={20} className="cursor-pointer" />
          </div>
        </div>
      </div>
    </header>
  );
};

// 2. HERO CON DOBLE BOTÓN Y VIDEO
export const SmartHero = ({ props }: { props: any }) => {
  return (
    <section className="relative w-full aspect-[21/9] min-h-[550px] overflow-hidden flex items-center justify-center bg-slate-900">
      <img className="absolute inset-0 w-full h-full object-cover opacity-60" src={props.imageUrl} />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <span className="inline-block py-1.5 px-4 bg-blue-600/20 text-blue-400 text-[10px] font-black tracking-[0.2em] uppercase rounded-full mb-8 border border-blue-600/30">
          {props.badge || 'NUEVA GENERACIÓN 2024'}
        </span>
        <h2 className="text-6xl md:text-8xl font-black text-white mb-6 leading-none tracking-tighter">
          {props.title || 'Potencia Sin Límites'}
        </h2>
        <p className="text-lg md:text-xl text-slate-200 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
          {props.subtitle}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <button className="px-10 py-5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-3">
            Explorar Colección <ArrowRight size={18} />
          </button>
          <button className="px-10 py-5 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl font-bold text-sm hover:bg-white/20 transition-all flex items-center gap-3">
            <PlayCircle size={18} /> Ver Tráiler
          </button>
        </div>
      </div>
    </section>
  );
};

// 3. CATEGORÍAS CON SUBTEXTO
export const SmartCategoriesGrid = ({ props }: { props: any }) => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <div className="flex items-end justify-between mb-16">
        <div>
          <h3 className="text-4xl font-black tracking-tight text-slate-900">{props.title || 'Categorías Principales'}</h3>
          <div className="h-1.5 w-20 bg-blue-600 mt-4 rounded-full"></div>
        </div>
        <span className="text-blue-600 font-bold text-sm flex items-center gap-2 cursor-pointer hover:underline">
          Ver todas <ChevronRight size={16} />
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {(props.items || []).map((item: any, i: number) => (
          <div key={i} className="group relative aspect-square rounded-[2rem] overflow-hidden cursor-pointer bg-slate-100 shadow-sm">
            <img className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" src={item.image} />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8">
              <p className="text-white text-2xl font-black italic uppercase tracking-tighter">{item.label}</p>
              <p className="text-slate-300 text-xs mt-1 font-medium opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">{item.sub || 'Explorar ahora'}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// 4. NOVEDADES CON CARROUSEL Y PRECIOS REALES
export const SmartProductGrid = ({ props }: { props: any }) => {
  const products = [
    { cat: 'Zenith Series', name: 'Zenith Pro 16" Platinum', price: '2,499.00', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800' },
    { cat: 'Displays', name: 'UltraWide 5K Curve Horizon', price: '1,299.00', img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3490?q=80&w=800' },
    { cat: 'Accessories', name: 'Tactile Mechanical K9 Elite', price: '189.00', img: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=800' },
    { cat: 'Control', name: 'Precision Wireless Mouse M2', price: '89.00', img: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=800' }
  ];

  return (
    <section className="bg-slate-50/50 py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-16">
          <div>
            <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter">{props.title || 'Novedades'}</h3>
            <p className="text-slate-500 mt-2 font-medium">Los lanzamientos más recientes del ecosistema Tech Hub.</p>
          </div>
          <div className="flex gap-3">
            <button className="w-12 h-12 flex items-center justify-center border border-slate-200 rounded-full hover:bg-white transition-all shadow-sm"><ChevronLeft size={20}/></button>
            <button className="w-12 h-12 flex items-center justify-center border border-slate-200 rounded-full hover:bg-white transition-all shadow-sm"><ChevronRight size={20}/></button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((p, i) => (
            <div key={i} className="group flex flex-col">
              <div className="relative aspect-[4/5] bg-white rounded-[2.5rem] overflow-hidden mb-8 border border-slate-100 shadow-sm group-hover:shadow-2xl transition-all duration-500">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={p.img} />
                <button className="absolute bottom-6 right-6 bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all shadow-xl">
                  <ShoppingCart size={20} />
                </button>
              </div>
              <p className="text-[10px] text-blue-600 uppercase tracking-[0.2em] font-black mb-2">{p.cat}</p>
              <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{p.name}</h4>
              <p className="text-2xl font-light text-slate-900 mt-3 italic">${p.price}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 5. BANNER DE CONFIANZA (NUEVO)
export const SmartTrustBanner = () => {
  return (
    <section className="py-24 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
        <div className="flex flex-col items-center group">
          <div className="bg-blue-50 p-6 rounded-[2rem] text-blue-600 mb-6 group-hover:scale-110 transition-transform"><Verified size={40}/></div>
          <h5 className="text-xl font-black italic tracking-tight mb-2 uppercase">Calidad Garantizada</h5>
          <p className="text-slate-500 text-sm leading-relaxed">Componentes de grado militar probados bajo los estándares más exigentes.</p>
        </div>
        <div className="flex flex-col items-center group">
          <div className="bg-blue-50 p-6 rounded-[2rem] text-blue-600 mb-6 group-hover:scale-110 transition-transform"><Truck size={40}/></div>
          <h5 className="text-xl font-black italic tracking-tight mb-2 uppercase">Envío Premium</h5>
          <p className="text-slate-500 text-sm leading-relaxed">Entrega asegurada en 24-48 horas con embalaje reforzado.</p>
        </div>
        <div className="flex flex-col items-center group">
          <div className="bg-blue-50 p-6 rounded-[2rem] text-blue-600 mb-6 group-hover:scale-110 transition-transform"><Headset size={40}/></div>
          <h5 className="text-xl font-black italic tracking-tight mb-2 uppercase">Soporte Experto</h5>
          <p className="text-slate-500 text-sm leading-relaxed">Asesoramiento técnico personalizado por especialistas en hardware.</p>
        </div>
      </div>
    </section>
  );
};

// 6. FOOTER COMPLETO
export const SmartFooter = ({ props }: { props: any }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-24 px-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
        <div className="space-y-8">
          <div className="flex items-center gap-3 text-white">
            <Terminal size={24} className="text-blue-500" />
            <span className="text-2xl font-black uppercase italic tracking-tighter">Tech Hub</span>
          </div>
          <p className="text-sm leading-relaxed max-w-xs italic font-medium">"Elevamos tu flujo de trabajo con tecnología de vanguardia y un diseño minimalista excepcional."</p>
          <div className="flex gap-6 text-white/30">
            <Languages size={20} className="hover:text-white cursor-pointer transition-colors"/>
            <Mail size={20} className="hover:text-white cursor-pointer transition-colors"/>
            <Share2 size={20} className="hover:text-white cursor-pointer transition-colors"/>
          </div>
        </div>
        <div>
          <h6 className="text-white font-black text-[10px] uppercase tracking-[0.3em] mb-8">Tienda</h6>
          <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
            <li className="hover:text-white cursor-pointer">Laptops Pro</li>
            <li className="hover:text-white cursor-pointer">Sistemas Custom</li>
            <li className="hover:text-white cursor-pointer">Workstations</li>
            <li className="hover:text-white cursor-pointer">Componentes</li>
          </ul>
        </div>
        <div>
          <h6 className="text-white font-black text-[10px] uppercase tracking-[0.3em] mb-8">Empresa</h6>
          <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
            <li className="hover:text-white cursor-pointer">Sobre Nosotros</li>
            <li className="hover:text-white cursor-pointer">Sostenibilidad</li>
            <li className="hover:text-white cursor-pointer">Soporte Técnico</li>
            <li className="hover:text-white cursor-pointer">Contacto</li>
          </ul>
        </div>
        <div className="space-y-8">
          <h6 className="text-white font-black text-[10px] uppercase tracking-[0.3em] mb-8">Newsletter</h6>
          <p className="text-xs font-medium italic">Suscríbete para recibir lanzamientos exclusivos.</p>
          <div className="flex bg-white/5 p-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
            <input className="bg-transparent border-none text-xs flex-1 px-4 text-white outline-none" placeholder="Tu email" />
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-colors">Unirse</button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between gap-6 text-[9px] font-black uppercase tracking-[0.2em] opacity-40">
        <p>© 2024 Tech Hub. Todos los derechos reservados.</p>
        <div className="flex gap-8"><span>Privacidad</span><span>Términos</span><span>Cookies</span></div>
      </div>
    </footer>
  );
};
