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
import { PageLoader } from "@/components/landing/PageLoader";
import { WhatsAppFloatingButton } from "@/components/landing/WhatsAppFloatingButton";
import { motion, useScroll, useSpring, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";

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
  const [isLoading, setIsLoading] = useState(() => {
    // Verificar en el cliente si ya se cargó en esta sesión
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem("bayup_initialized");
    }
    return true;
  });
  const lastScrollY = useRef(0);

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
              className={`fixed top-0 w-full z-[100] pointer-events-none transition-all duration-500 ${isAtTop ? 'py-10' : 'py-6'}`}
            >
              <div className="container mx-auto px-12 grid grid-cols-3 items-center">
                
                {/* Columna 1: Logo */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-2xl font-black text-black italic tracking-tighter cursor-pointer w-fit pointer-events-auto"
                >
                  <span>BAY</span><InteractiveUP />
                </motion.div>
                
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
                        <span className={`absolute -bottom-1 left-0 h-[1.5px] bg-cyan transition-all duration-500 group-hover:w-full ${item.label === 'Inicio' ? 'w-full' : 'w-0'}`}></span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Columna 3: CTA Derecha */}
                <div className="flex justify-end pointer-events-auto">
                  <PremiumButton href="/login">
                    Iniciar
                  </PremiumButton>
                </div>
              </div>
            </motion.nav>

            <main className="relative z-10">
              <HeroLight />
              <ValueStatement />
                      <NarrativeScroll />
                      <TemplateShowcase />
                      <MobileShoppingSection />
                      <GlobeSection3D />              <Testimonials />
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