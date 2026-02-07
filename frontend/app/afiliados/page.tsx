"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { 
  TrendingUp, 
  Users, 
  Zap, 
  ShieldCheck, 
  Mail, 
  User, 
  Phone,
  CheckCircle2,
  Loader2,
  Lock
} from "lucide-react";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { InteractiveUP } from "@/components/landing/InteractiveUP";
import { GlassButton } from "@/components/landing/GlassButton";
import { ExpandableButton } from "@/components/landing/ExpandableButton";
import { Footer } from "@/components/landing/Footer";

// --- SECCIONES REUTILIZABLES ---

const SectionHeading = ({ title, highlight, subtitle }: { title: string, highlight?: string, subtitle?: string }) => (
  <div className="text-center space-y-6 mb-20">
    <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.9] text-black">
      {title} <br />
      {highlight && <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum via-cyan to-petroleum drop-shadow-[0_0_15px_rgba(0,242,255,0.3)]">{highlight}</span>}
    </h2>
    {subtitle && (
      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-petroleum/60 max-w-2xl mx-auto italic">
        {subtitle}
      </p>
    )}
  </div>
);

export default function AffiliatesPage() {
  const [isSubmitted, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Lógica de Header Inteligente
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY.current;
    if (latest > previous && latest > 150) setHidden(true);
    else if (latest < previous) setHidden(false);
    setIsAtTop(latest < 50);
    lastScrollY.current = latest;
  });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 2000);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#FAFAFA] text-black selection:bg-cyan selection:text-black overflow-x-hidden font-sans">
      
      {/* 1. HEADER (DINÁMICO) */}
      <motion.nav 
        initial="visible"
        animate={hidden ? "hidden" : "visible"}
        variants={{
          visible: { y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
          hidden: { y: "-100%", transition: { duration: 0.3, ease: "easeInOut" } },
        }}
        className={`fixed top-0 w-full z-[100] pointer-events-none transition-all duration-500 ${isAtTop ? 'py-10' : 'py-6'}`}
      >
        <div className="container mx-auto px-12 grid grid-cols-3 items-center">
          <Link href="/" className="pointer-events-auto">
            <motion.div className={`text-2xl font-black italic tracking-tighter cursor-pointer w-fit transition-colors duration-500 ${isAtTop ? 'text-white' : 'text-black'}`}>
              <span>BAY</span><InteractiveUP />
            </motion.div>
          </Link>
          <div className="hidden md:flex items-center justify-center">
            <div className={`flex items-center gap-12 px-10 py-4 rounded-full border border-white/40 bg-white/20 backdrop-blur-xl shadow-sm transition-all duration-500 pointer-events-auto ${isAtTop ? '' : 'border-gray-100 bg-white/40 shadow-md'}`}>
              {[
                { label: 'Afiliados', href: '/afiliados' },
                { label: 'Inicio', href: '/' },
                { label: 'Planes', href: '/planes' }
              ].map((item) => (
                <Link key={item.label} href={item.href} className={`text-[12px] font-black uppercase tracking-[0.5em] transition-all duration-500 relative group ${isAtTop ? 'text-white hover:text-cyan' : 'text-gray-500 hover:text-black'}`}>
                  {item.label}
                  <span className={`absolute -bottom-1 left-0 h-[1.5px] bg-cyan transition-all duration-500 group-hover:w-full ${item.label === 'Afiliados' ? 'w-full' : 'w-0'}`}></span>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex justify-end pointer-events-auto items-center gap-6">
            {/* Botón Registrarse (Texto -> Gratis) */}
            <ExpandableButton 
              href="/register" 
              variant="primary" 
              baseText="REGÍSTRATE" 
              expandedText="GRATIS" 
            />

            {/* Botón Iniciar Sesión (Icono -> Texto) */}
            <ExpandableButton 
              href="/login" 
              variant="ghost" 
              expandedText="INICIAR SESIÓN" 
              className={isAtTop ? "text-white" : "text-black"}
              icon={<User size={22} className={isAtTop ? "text-white" : "text-black"} />} 
            />
          </div>
        </div>
      </motion.nav>

      {/* 2. MÓDULO 1: BANNER CINEMÁTICO */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-black">
        {/* Imagen de Impacto con Efecto Ken Burns */}
        <motion.div 
          initial={{ scale: 1 }}
          animate={{ scale: 1.1 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
          className="absolute inset-0 z-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=2000" 
            alt="Comunidad Bayup" 
            className="w-full h-full object-cover opacity-50 filter grayscale-[20%] brightness-75"
          />
        </motion.div>

        {/* Capa de Fundido y Estilo Bayup */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-petroleum/40 to-black/90 z-10" />
        
        <div className="relative z-20 text-center space-y-10 px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h1 className="text-6xl md:text-9xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-2xl">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan to-white/60">AFÍLIATE AHORA.</span>
            </h1>
            <p className="text-xl md:text-2xl font-black text-white italic tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(0,242,255,0.5)]">
              Únete a la elite de Bayup
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <GlassButton href="#register" variant="light">Comenzar registro</GlassButton>
          </motion.div>
        </div>
      </section>

      {/* 3. MÓDULO 2: EXPLICACIÓN Y VALOR */}
      <section className="py-40 px-12 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(black 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <SectionHeading 
            title="GANA POR AYUDAR" 
            highlight="A OTROS A CRECER." 
            subtitle="¿Qué significa ser un afiliado Bayup?"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="p-10 rounded-[3rem] bg-[#F8FAFB] border border-gray-100 space-y-6 shadow-sm hover:shadow-xl transition-all duration-700">
                <div className="h-16 w-16 rounded-2xl bg-petroleum flex items-center justify-center text-cyan shadow-lg">
                  <TrendingUp size={32} />
                </div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter">Comisiones de por vida</h3>
                <p className="text-gray-500 font-medium leading-relaxed text-sm">
                  No es un pago único. Por cada empresa que se registre con tu código, recibirás un **porcentaje de por vida** de cada una de sus ventas exitosas.
                </p>
              </div>
              <div className="p-10 rounded-[3rem] bg-white border border-gray-100 space-y-6 shadow-sm hover:shadow-xl transition-all duration-700">
                <div className="h-16 w-16 rounded-2xl bg-cyan flex items-center justify-center text-petroleum shadow-lg">
                  <Zap size={32} />
                </div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter">Crecimiento sin límites</h3>
                <p className="text-gray-500 font-medium leading-relaxed text-sm">
                  Tú decides cuánto ganar. Entre más empresas ayudes a digitalizarse con Bayup, mayor será tu flujo de ingresos recurrentes.
                </p>
              </div>
              <div className="p-10 rounded-[3rem] bg-[#004d4d]/5 border border-gray-100 space-y-6 shadow-sm hover:shadow-xl transition-all duration-700">
                <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center text-[#00F2FF] shadow-lg border border-cyan/20">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter">Inversión $0</h3>
                <p className="text-gray-500 font-medium leading-relaxed text-sm">
                  Unirse a la elite de Bayup no tiene ningún costo. Empezar a construir tu red de referidos es **totalmente gratis** y para siempre.
                </p>
              </div>
            </div>
            
            <div className="relative group perspective-[2000px]">
              <div className="absolute -inset-10 bg-cyan/5 rounded-full blur-[100px] group-hover:bg-cyan/10 transition-all duration-1000" />
              <motion.div 
                whileHover={{ rotateY: -10, rotateX: 5, scale: 1.02 }}
                className="relative z-10 w-full aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl border border-white/40"
              >
                <img 
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1500" 
                  alt="Colaboración y Éxito" 
                  className="w-full h-full object-cover filter brightness-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-petroleum/80 via-transparent to-transparent" />
                <div className="absolute bottom-10 left-10 right-10 text-white space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan">Éxito Compartido</p>
                  <h4 className="text-2xl font-black italic uppercase tracking-tighter">Crecemos junto a ti</h4>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MÓDULO 3: ACCIÓN / REGISTRO */}
      <section id="register" className="py-40 px-6 bg-[#050505] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.05)_0%,transparent_70%)]" />
        
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center space-y-6 mb-20">
            <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase text-white">
              SÉ UN <span className="text-cyan">SOCIO ELITE.</span>
            </h2>
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 italic">Inicia tu proceso de sincronización</p>
          </div>

          <div className="relative p-12 md:p-20 rounded-[4.5rem] bg-white/10 backdrop-blur-[120px] border border-white/20 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden isolate">
            {/* Brillo Interior de Cristal */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
            
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.form key="form" onSubmit={handleApply} className="space-y-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] ml-6">Nombre Completo</label>
                      <div className="relative group">
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-cyan transition-colors" />
                        <input type="text" placeholder="Ej. Alexander Bayup" className="w-full pl-16 pr-8 py-6 bg-white/[0.02] border border-white/5 focus:border-cyan/30 rounded-[2.5rem] outline-none text-sm text-white font-bold transition-all focus:bg-white/[0.05]" required />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] ml-6">Teléfono de Contacto</label>
                        <div className="relative group">
                          <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-cyan transition-colors" />
                          <input type="tel" placeholder="+57 ..." className="w-full pl-16 pr-8 py-6 bg-white/[0.02] border border-white/5 focus:border-cyan/30 rounded-[2.5rem] outline-none text-sm text-white font-bold transition-all focus:bg-white/[0.05]" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] ml-6">Correo Electrónico</label>
                        <div className="relative group">
                          <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-cyan transition-colors" />
                          <input type="email" placeholder="partner@domain.com" className="w-full pl-16 pr-8 py-6 bg-white/[0.02] border border-white/5 focus:border-cyan/30 rounded-[2.5rem] outline-none text-sm text-white font-bold transition-all focus:bg-white/[0.05]" required />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-10 space-y-8 flex flex-col items-center">
                    <button type="submit" disabled={isSubmitting} className="group relative w-full max-w-md">
                      <div className="relative py-6 rounded-[2.5rem] bg-white text-black font-black text-[11px] uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 overflow-hidden">
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar Aplicación"}
                        <div className="absolute inset-0 bg-cyan translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-10" />
                      </div>
                    </button>
                    <div className="flex items-center gap-3 text-white/30 text-[9px] font-bold uppercase tracking-widest">
                      <Lock size={12} /> Tus datos están cifrados y seguros
                    </div>
                  </div>
                </motion.form>
              ) : (
                <motion.div key="success" className="text-center py-10 space-y-10" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="h-24 w-24 bg-cyan/20 rounded-full flex items-center justify-center mx-auto text-cyan shadow-[0_0_50px_rgba(0,242,255,0.2)] animate-pulse">
                    <CheckCircle2 size={48} />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-4xl font-black italic tracking-tighter uppercase text-white">¡Aplicación Recibida!</h3>
                    <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed font-medium">
                      Hemos recibido tus datos correctamente. En las próximas horas revisaremos tu perfil y te enviaremos tu **usuario y contraseña** por correo y WhatsApp para que comiences a operar.
                    </p>
                  </div>
                  <div className="pt-6">
                    <GlassButton href="/" variant="dark">Volver al inicio</GlassButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx global>{`
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}