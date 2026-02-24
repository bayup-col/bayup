"use client";

import React from 'react';
import { 
  ShoppingBag, User, Search, Terminal, Grid, ArrowRight, PlayCircle, 
  ChevronLeft, ChevronRight, ShoppingCart, Verified, Truck, Headset,
  Facebook, Instagram, Twitter, Languages, Mail, Share2, ShieldCheck,
  LayoutGrid, Heart, Camera, Send, Ruler, MapPin, Globe, CheckCheck, Loader2, X, Plus, Minus
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/cart-context';

/**
 * COMPONENTES DE ALTA FIDELIDAD - ESPECIALIZADOS POR MARCA
 */

// 1. NAVBAR PREMIUM (FUNCIONAL CON CARRITO)
export const SmartNavbar = ({ props }: { props: any }) => {
  const { items: cart, setIsCartOpen: setIsOpen } = useCart();
  
  return (
    <>
      <header className="w-full border-b border-white/10 bg-white/70 backdrop-blur-xl sticky top-0 z-[200] font-sans transition-all duration-500">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 shrink-0">
            <h1 className="text-2xl font-black tracking-tighter text-gray-900 uppercase italic">
              {props.logoText || 'BAYUP STORE'}
            </h1>
          </div>
          <nav className="hidden lg:flex items-center gap-10">
            {(props.menuItems || ["Novedades", "Colecciones", "Nosotros", "Contacto"]).map((item: any, i: number) => (
              <span key={i} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-cyan cursor-pointer transition-all">
                {typeof item === 'string' ? item : item.label}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-6 flex-1 justify-end">
            <div className="flex items-center gap-6 text-gray-900">
              <div className="relative p-3 cursor-pointer hover:scale-110 transition-transform bg-gray-100 rounded-2xl" onClick={() => setIsOpen(true)}>
                <ShoppingBag size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-cyan text-[#001A1A] text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg border-2 border-white animate-in zoom-in">
                    {cart.reduce((a, b) => a + b.quantity, 0)}
                  </span>
                )}
              </div>
              <User size={20} className="cursor-pointer hover:text-cyan transition-colors" />
            </div>
          </div>
        </div>
      </header>
    </>
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

// 4. GRID DE PRODUCTOS PREMIUM (FUNCIONAL)
export const SmartProductGrid = ({ props }: { props: any }) => {
  const { addItem: addToCart } = useCart();
  
  return (
    <section className="py-32 bg-white font-sans">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan mb-4 block">Tendencias</span>
            <h3 className="text-5xl font-black text-gray-900 italic tracking-tighter uppercase">{props.title || 'Novedades'}</h3>
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-cyan cursor-pointer transition-all border-b border-gray-100 pb-2">Explorar todo el catálogo</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
          {(props.products || []).map((p: any, i: number) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.1 }}
              className="group flex flex-col"
            >
              <div className="relative w-full aspect-[3/4] rounded-[2.5rem] overflow-hidden mb-8 shadow-sm group-hover:shadow-2xl transition-all duration-700 bg-gray-50">
                <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" src={p.image} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                
                {/* BOTÓN RÁPIDO DE COMPRA */}
                <button 
                  onClick={() => addToCart({
                      id: p.id,
                      title: p.name,
                      price: p.price,
                      image: p.image,
                      quantity: 1
                  })}
                  className="absolute bottom-8 right-8 bg-white text-gray-900 h-16 w-16 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all flex items-center justify-center hover:bg-cyan hover:scale-110 active:scale-95"
                >
                  <Plus size={24} />
                </button>

                {/* ETIQUETA DE NUEVO / PLAN */}
                <div className="absolute top-8 left-8 px-4 py-1.5 bg-white/80 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-widest text-gray-900">
                  Premium Item
                </div>
              </div>
              <div className="px-2 space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="text-lg font-black text-gray-900 uppercase tracking-tighter leading-tight max-w-[70%]">{p.name}</h4>
                  <p className="text-xl font-black text-[#004d4d] italic tracking-tighter">$ {p.price.toLocaleString()}</p>
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em]">{p.category || 'Colección 2026'}</p>
              </div>
            </motion.div>
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

// 9. FORMULARIO DE CONTACTO PREMIUM
export const SmartContactForm = ({ props, tenantId }: { props: any, tenantId?: string }) => {
  const [formData, setFormData] = React.useState({ name: '', email: '', phone: '', message: '' });
  const [isSending, setIsSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setIsSending(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiBase}/public/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          message: formData.message
        })
      });
      if (res.ok) {
        setSent(true);
        setFormData({ name: '', email: '', phone: '', message: '' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="py-32 bg-white font-serif px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-amber-700">{props.badge || 'CONTACTO'}</h3>
          <h2 className="text-4xl md:text-5xl font-light italic text-slate-900">{props.title || 'Hablemos de su próxima joya'}</h2>
        </div>

        {sent ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 border border-emerald-100 p-12 rounded-[2rem] text-center space-y-6">
            <div className="h-20 w-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg"><CheckCheck size={40}/></div>
            <h4 className="text-2xl font-bold text-emerald-900">¡Mensaje recibido!</h4>
            <p className="text-emerald-700/70 font-medium italic">Gracias por escribirnos. Un asesor se pondrá en contacto con usted en breve.</p>
            <button onClick={() => setSent(false)} className="text-xs font-black uppercase tracking-widest text-emerald-600 hover:underline">Enviar otro mensaje</button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100 shadow-sm">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Nombre completo</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-white border border-transparent focus:border-amber-500 outline-none transition-all text-sm font-medium rounded-2xl shadow-inner" placeholder="Ej: Julian Garcia" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Correo electrónico</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-6 py-4 bg-white border border-transparent focus:border-amber-500 outline-none transition-all text-sm font-medium rounded-2xl shadow-inner" placeholder="email@ejemplo.com" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">WhatsApp (Opcional)</label>
              <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-6 py-4 bg-white border border-transparent focus:border-amber-500 outline-none transition-all text-sm font-medium rounded-2xl shadow-inner" placeholder="+57 300 000 0000" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Su mensaje</label>
              <textarea required rows={5} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full px-6 py-4 bg-white border border-transparent focus:border-amber-500 outline-none transition-all text-sm font-medium rounded-2xl shadow-inner resize-none" placeholder="¿En qué podemos ayudarle?" />
            </div>
            <button disabled={isSending} type="submit" className="md:col-span-2 w-full py-5 bg-slate-900 text-white font-bold text-xs uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl flex items-center justify-center gap-4">
              {isSending ? <Loader2 className="animate-spin" size={18}/> : <><Send size={18}/> Enviar mensaje</>}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

// 10. TRUST BANNER (JOYERÍA NO LO USA SEGÚN TU HTML, PERO LO DEJAMOS POR COMPATIBILIDAD)
export const SmartTrustBanner = ({ props }: { props?: any }) => null;
export const SmartBentoGrid = ({ props }: { props?: any }) => null;
export const SmartServices = ({ props }: { props?: any }) => null;
