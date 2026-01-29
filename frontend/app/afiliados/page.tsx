"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { 
  TrendingUp, 
  Users, 
  Zap, 
  ShieldCheck, 
  ChevronRight, 
  Mail, 
  User, 
  Globe, 
  Ghost, 
  CheckCircle2,
  ArrowUpRight,
  Loader2
} from "lucide-react";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { InteractiveUP } from "@/components/landing/InteractiveUP";
import { GlassyButton } from "@/components/landing/GlassyButton";
import { PremiumButton } from "@/components/landing/PremiumButton";
import { Footer } from "@/components/landing/Footer";

// Importación dinámica del fondo de partículas (Verde Petróleo)
const FloatingParticlesBackground = dynamic(
  () => import("@/components/landing/FloatingParticlesBackground").then((mod) => mod.FloatingParticlesBackground),
  { ssr: false }
);

// Componente Reutilizable: AuroraCard
const AuroraCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`relative group p-[2px] rounded-[3.5rem] overflow-hidden isolate ${className}`}>
    <div className="absolute inset-0 rounded-[3.5rem] overflow-hidden -z-10">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 w-[300%] aspect-square"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)`,
          x: "-50%",
          y: "-50%",
          willChange: 'transform'
        }}
      />
      <div className="absolute inset-[1px] rounded-[3.45rem] bg-white/90 backdrop-blur-3xl" />
    </div>
    <div className="relative z-10 h-full">
      {children}
    </div>
  </div>
);

export default function AffiliatesPage() {
  const [referrals, setReferrals] = useState(10);
  const [isSubmitted, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Lógica de Header Inteligente
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY.current;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else if (latest < previous) {
      setHidden(false);
    }
    setIsAtTop(latest < 50);
    lastScrollY.current = latest;
  });

  const estimatedEarnings = referrals * 45;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#FAFAFA] text-[#004d4d] selection:bg-[#00F2FF] selection:text-black overflow-x-hidden font-sans">
      
      <FloatingParticlesBackground />

      {/* 1. HEADER INTELIGENTE (Consistente con Home) */}
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
          
          {/* Logo */}
          <Link href="/" className="pointer-events-auto">
            <motion.div className="text-2xl font-black text-black italic tracking-tighter cursor-pointer w-fit">
              <span>BAY</span><InteractiveUP />
            </motion.div>
          </Link>
          
          {/* Mini Barra Glass Centrada */}
          <div className="hidden md:flex items-center justify-center">
            <div className={`flex items-center gap-12 px-10 py-4 rounded-full border border-white/40 bg-white/20 backdrop-blur-xl shadow-sm transition-all duration-500 pointer-events-auto ${isAtTop ? '' : 'border-gray-100 bg-white/40 shadow-md'}`}>
              {[
                { label: 'Afiliados', href: '/afiliados' },
                { label: 'Inicio', href: '/' },
                { label: 'Planes', href: '/planes' }
              ].map((item) => (
                <Link 
                  key={item.label} 
                  href={item.href} 
                  className="text-[12px] font-black text-gray-500 hover:text-black uppercase tracking-[0.5em] transition-all duration-500 relative group"
                >
                  {item.label}
                  <span className={`absolute -bottom-1 left-0 h-[1.5px] bg-cyan transition-all duration-500 group-hover:w-full ${item.label === 'Afiliados' ? 'w-full' : 'w-0'}`}></span>
                </Link>
              ))}
            </div>
          </div>

          {/* CTA Derecha */}
          <div className="flex justify-end pointer-events-auto">
            <PremiumButton href="/login">
              Iniciar
            </PremiumButton>
          </div>
        </div>
      </motion.nav>

      {/* 2. SECCIÓN HERO: Propuesta de Valor */}
      <section className="relative pt-56 pb-20 px-6 overflow-hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#004d4d]/5 rounded-full border border-[#004d4d]/10">
                <div className="w-2 h-2 rounded-full bg-[#00F2FF] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Programa de Partners Elite</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-[0.85] uppercase">
                Escala tu <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004d4d] to-[#00F2FF]">Influencia.</span>
              </h1>
              
              <p className="max-w-md text-[#004d4d]/70 text-lg font-medium leading-relaxed border-l-2 border-[#004d4d]/10 pl-6">
                Únete a la red de afiliados más sofisticada del retail digital. Genera ingresos recurrentes promocionando la tecnología que está definiendo el mañana.
              </p>

              <div className="flex flex-wrap gap-6 pt-4">
                <GlassyButton href="#apply" variant="light">
                  <span className="flex items-center gap-2">
                    Aplicar Ahora <ArrowUpRight size={16} />
                  </span>
                </GlassyButton>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative aspect-square flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#00F2FF]/10 to-transparent rounded-full blur-[100px] animate-pulse" />
              <AuroraCard className="w-full max-w-[450px] aspect-square flex items-center justify-center">
                <div className="text-center space-y-6">
                  <div className="text-6xl font-black italic tracking-tighter mb-4 flex items-center justify-center">
                    <span>BAY</span><InteractiveUP />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#004d4d]/40">Partner Engine</p>
                </div>
              </AuroraCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. SECCIÓN DASHBOARD: Simulación */}
      <section className="py-32 px-6 relative bg-white/30 backdrop-blur-sm border-y border-[#004d4d]/5">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <p className="text-[#00F2FF] font-black uppercase tracking-[0.5em] text-[10px]">Real-Time Simulation</p>
            <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase">Visualiza tu <span className="text-[#004d4d]/30">Crecimiento</span></h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <AuroraCard className="lg:col-span-1 p-10 flex flex-col justify-center space-y-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#004d4d]/60">Configurar Red</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#004d4d]/40">Referidos Activos</span>
                  <span className="text-4xl font-black italic tracking-tighter">{referrals}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  value={referrals} 
                  onChange={(e) => setReferrals(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#004d4d]/10 rounded-lg appearance-none cursor-pointer accent-[#00F2FF]"
                />
              </div>
            </AuroraCard>

            <AuroraCard className="lg:col-span-2 p-10 relative overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 h-full items-center">
                <div className="space-y-6">
                  <div className="h-12 w-12 rounded-2xl bg-[#00F2FF]/10 flex items-center justify-center">
                    <TrendingUp className="text-[#00F2FF]" size={24} />
                  </div>
                  <h3 className="text-3xl font-black italic tracking-tighter uppercase">Ingresos Estimados</h3>
                  <div className="text-7xl md:text-8xl font-black italic tracking-tighter text-[#004d4d]">
                    <span className="text-3xl text-[#00F2FF] not-italic mr-2">$</span>
                    {estimatedEarnings.toLocaleString()}
                  </div>
                </div>
                <div className="bg-[#004d4d]/5 rounded-[2.5rem] p-8 space-y-6 border border-[#004d4d]/5 shadow-inner">
                  {[
                    { label: 'Tasa de Conversión', val: '4.8%', icon: <Zap size={14}/> },
                    { label: 'Clicks Totales', val: (referrals * 124).toLocaleString(), icon: <Users size={14}/> },
                    { label: 'Bonus de Nivel', val: '+$250', icon: <ShieldCheck size={14}/> }
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-[#004d4d]/5 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="text-[#00F2FF]">{item.icon}</div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#004d4d]/60">{item.label}</span>
                      </div>
                      <span className="text-xs font-black">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AuroraCard>
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN FORMULARIO: Aplicación */}
      <section id="apply" className="py-40 px-6">
        <div className="container mx-auto max-w-4xl">
          <AuroraCard className="p-12 md:p-20">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase">Forma parte de la <span className="text-[#00F2FF]">Elite</span></h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#004d4d]/40 italic">Sincronización de nuevo Partner</p>
            </div>

            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.form 
                  key="form"
                  onSubmit={handleApply} 
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-[#004d4d]/60 uppercase tracking-widest ml-4">Nombre Completo</label>
                      <div className="relative group">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 transition-colors group-focus-within:text-[#004d4d]" />
                        <input type="text" placeholder="Ej. Alexander Bayup" className="w-full pl-14 pr-6 py-5 bg-gray-50/50 border border-transparent focus:border-[#004d4d]/20 rounded-[2rem] outline-none text-sm text-black font-bold transition-all focus:bg-white shadow-inner" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-[#004d4d]/60 uppercase tracking-widest ml-4">Email de Contacto</label>
                      <div className="relative group">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 transition-colors group-focus-within:text-[#004d4d]" />
                        <input type="email" placeholder="partner@domain.com" className="w-full pl-14 pr-6 py-5 bg-gray-50/50 border border-transparent focus:border-[#004d4d]/20 rounded-[2rem] outline-none text-sm text-black font-bold transition-all focus:bg-white shadow-inner" required />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex justify-center">
                    <button type="submit" disabled={isSubmitting} className="group relative w-full max-w-sm overflow-visible">
                      <motion.div animate={{ backgroundColor: isSubmitting ? "#004d4d" : "#001A1A" }} className="relative w-full py-6 rounded-[2rem] overflow-hidden isolate flex items-center justify-center gap-3 text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl">
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar Aplicación"}
                        <div className="absolute inset-0 bg-[#00F2FF] translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-10" />
                      </motion.div>
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div 
                  key="success"
                  className="text-center py-10 space-y-8"
                >
                  <motion.div animate={{ y: [0, -100, 0], scale: [0.5, 1.5, 1] }} transition={{ duration: 1.5 }} className="text-[#004d4d]">
                    <Ghost size={80} strokeWidth={1.5} />
                  </motion.div>
                  <h3 className="text-3xl font-black italic tracking-tighter uppercase text-[#004d4d]">¡Aplicación Recibida!</h3>
                  <div className="flex justify-center pt-4">
                    <CheckCircle2 className="text-[#00F2FF] w-12 h-12" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </AuroraCard>
        </div>
      </section>

      {/* FOOTER PREMIUM (Consistente con Home) */}
      <Footer />

      <style jsx global>{`
        @keyframes aurora-border { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
        .animate-aurora { animation: aurora-border 6s linear infinite; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}