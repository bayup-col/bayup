"use client";

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { HeroLight } from "@/components/landing/HeroLight";
import { ValueStatement } from "@/components/landing/ValueStatement";
import { NarrativeScroll } from "@/components/landing/NarrativeScroll";
import { MobileShoppingSection } from "@/components/landing/MobileShoppingSection";
import { TemplateShowcase } from "@/components/landing/TemplateShowcase";
import { Testimonials } from "@/components/landing/Testimonials";
import { PricingCinematic } from "@/components/landing/PricingCinematic";
import { Footer } from "@/components/landing/Footer";
import { InteractiveUP } from "@/components/landing/InteractiveUP";
import { PremiumButton } from "@/components/landing/PremiumButton";
import { ExpandableButton } from "@/components/landing/ExpandableButton";
import { User, Menu, X } from "lucide-react";
import { PageLoader } from "@/components/landing/PageLoader";
import { WhatsAppFloatingButton } from "@/components/landing/WhatsAppFloatingButton";
import { motion, useScroll, useSpring, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

// Importaciones dinámicas con fallbacks
const AntigravityBackground = dynamic(
  () => import("@/components/landing/AntigravityBackground").then((mod) => mod.AntigravityBackground),
  { 
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-white" /> 
  }
);

const GlobeSection3D = dynamic(
  () => import("@/components/landing/GlobeSection3D").then((mod) => mod.GlobeSection3D),
  { 
    ssr: false,
    loading: () => <div className="h-screen w-full bg-[#050505] flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-gray-700">Iniciando Red Global...</div> 
  }
);

export default function HomePage() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    // Verificar en el cliente si ya se cargó en esta sesión
    const isInitialized = sessionStorage.getItem("bayup_initialized");
    if (isInitialized) {
      setIsLoading(false);
    }
  }, []);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("bayup_initialized", "true");
    }
  };

  const scaleX = useSpring(useScroll().scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Lógica de Header Inteligente con Animación Asimétrica
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY.current;
    if (latest > previous && latest > 150) {
      setHidden(true); // Se esconde rápido
    } else if (latest < previous) {
      setHidden(false); // Baja lento y elegante
    }
    setIsAtTop(latest < 50);
    lastScrollY.current = latest;
  });

  const navLinks = [
    { label: 'Afiliados', href: '/afiliados' },
    { label: 'Inicio', href: '/' },
    { label: 'Planes', href: '/planes' }
  ];

  return (
    <div className="bg-background min-h-screen selection:bg-cyan selection:text-black">
      
      <AnimatePresence mode="wait">
        {isLoading ? (
          <PageLoader key="loader" onComplete={handleLoadingComplete} />
        ) : (
          <motion.div 
            key="main-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <AntigravityBackground />

            <motion.div 
              className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-petroleum to-cyan z-[110] origin-left shadow-[0_0_15px_rgba(0,242,255,0.5)]"
              style={{ scaleX }}
            />

            {/* Floating Header Inteligente */}
            <motion.nav 
              initial="visible"
              animate={hidden ? "hidden" : "visible"}
              variants={{
                visible: { 
                  y: 0, 
                  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
                },
                hidden: { 
                  y: "-100%", 
                  transition: { duration: 0.3, ease: "easeInOut" } 
                },
              }}
              className={`fixed top-0 w-full z-[100] transition-all duration-500 ${isAtTop ? 'py-10' : 'py-6'}`}
            >
              <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
                
                {/* LADO IZQUIERDO: Hamburguesa (Solo Móvil) y Logo */}
                <div className="flex items-center gap-4 pointer-events-auto">
                  <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className={`md:hidden p-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md transition-all duration-500`}
                  >
                    <Menu size={24} className="text-cyan drop-shadow-[0_0_8px_#00f2ff]" />
                  </button>

                  <Link href="/">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`text-2xl font-black italic tracking-tighter cursor-pointer w-fit transition-all duration-500 flex items-center`}
                    >
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan/80 to-white drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]">BAY</span>
                      <InteractiveUP />
                    </motion.div>
                  </Link>
                </div>

                {/* ... (centro del nav se mantiene igual) */}
                <div className="hidden md:flex items-center justify-center pointer-events-auto">
                  <div className={`flex items-center gap-12 px-10 py-4 rounded-full border border-white/40 bg-white/20 backdrop-blur-xl shadow-sm transition-all duration-500 ${isAtTop ? '' : 'border-gray-100 bg-white/40 shadow-md'}`}>
                    {navLinks.map((item) => (
                      <Link 
                        key={item.label} 
                        href={item.href} 
                        className={`text-[12px] font-black uppercase tracking-[0.5em] transition-all duration-500 relative group ${isAtTop ? 'text-white hover:text-cyan' : 'text-gray-500 hover:text-black'}`}
                      >
                        {item.label}
                        <span className={`absolute -bottom-1 left-0 h-[1.5px] bg-cyan transition-all duration-500 group-hover:w-full ${item.label === 'Inicio' ? 'w-full' : 'w-0'}`}></span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* DERECHA: CTAs Desktop */}
                <div className="hidden md:flex justify-end pointer-events-auto items-center gap-6">
                  <ExpandableButton 
                    href="/register" 
                    variant="primary" 
                    baseText="REGÍSTRATE" 
                    expandedText="GRATIS" 
                  />
                  <ExpandableButton 
                    href="/login" 
                    variant="ghost" 
                    expandedText="INICIAR SESIÓN" 
                    className={isAtTop ? "text-white" : "text-black"}
                    icon={<User size={22} className={isAtTop ? "text-white" : "text-black"} />} 
                  />
                </div>

                {/* CTA Móvil (Solo icono login para ahorrar espacio) */}
                <div className="md:hidden pointer-events-auto">
                   <Link href="/login" className={`p-2 rounded-xl transition-all duration-500`}>
                      <User size={24} className="text-cyan drop-shadow-[0_0_8px_#00f2ff]" />
                   </Link>
                </div>
              </div>
            </motion.nav>

            {/* PANEL MENÚ MÓVIL (SIDEBAR GLASS) */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
                  />
                  
                  {/* Sidebar */}
                  <motion.div 
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed top-0 left-0 bottom-0 w-[85%] max-w-xs bg-white/10 backdrop-blur-[40px] z-[160] border-r border-white/20 p-8 flex flex-col shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-12">
                      <div className="text-2xl font-black italic tracking-tighter text-white">
                        <span>BAY</span><InteractiveUP />
                      </div>
                      <button 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <div className="flex flex-col gap-8 flex-grow">
                      {[
                        { label: 'Inicio', href: '/' },
                        { label: 'Planes', href: '/planes' },
                        { label: 'Afiliados', href: '/afiliados' }
                      ].map((item) => (
                        <Link 
                          key={item.label} 
                          href={item.href} 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-2xl font-black text-white uppercase tracking-tighter border-b border-white/10 pb-4 flex justify-between items-center group"
                        >
                          {item.label}
                          <motion.div whileHover={{ x: 5 }} className="text-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                            <Menu size={20} />
                          </motion.div>
                        </Link>
                      ))}
                    </div>

                    <div className="flex flex-col gap-4 pt-8 border-t border-white/10">
                      <Link 
                        href="/login" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full py-4 text-center text-white font-black uppercase tracking-widest text-sm border border-white/20 rounded-2xl bg-white/5 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                      >
                        Iniciar Sesión
                      </Link>
                      <Link 
                        href="/register" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full py-4 text-center text-[#004D4D] font-black uppercase tracking-widest text-sm bg-cyan rounded-2xl shadow-[0_10px_20px_rgba(0,242,255,0.3)]"
                      >
                        Registrarse Gratis
                      </Link>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <main className="relative z-10">
              <HeroLight />
              <ValueStatement />
              <NarrativeScroll />
              <TemplateShowcase />
              <MobileShoppingSection />
              <GlobeSection3D />
              <Testimonials />
              <PricingCinematic />
            </main>

            <Footer />

            {/* WhatsApp Smart Floating Button */}
            <WhatsAppFloatingButton hidden={hidden} />
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
          background-color: #FAFAFA;
        }
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          background-color: #FAFAFA;
          color: #000000;
        }
        ::-webkit-scrollbar {
          display: none;
        }
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .perspective-2000 {
          perspective: 2000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }

        @keyframes aurora-border {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .animate-aurora {
          animation: aurora-border 6s linear infinite;
        }
      `}</style>
    </div>
  );
}