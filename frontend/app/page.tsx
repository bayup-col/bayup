"use client";

/* FORCE_SYNC_V1 */
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { User, Menu, X } from "lucide-react";
import { motion, useScroll, useSpring, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

// Importaciones dinámicas optimizadas
const HeroLight = dynamic(() => import("@/components/landing/HeroLight").then(mod => mod.HeroLight));
const ValueStatement = dynamic(() => import("@/components/landing/ValueStatement").then(mod => mod.ValueStatement));
const NarrativeScroll = dynamic(() => import("@/components/landing/NarrativeScroll").then(mod => mod.NarrativeScroll));
const Footer = dynamic(() => import("@/components/landing/Footer").then(mod => mod.Footer));
const WhatsAppFloatingButton = dynamic(() => import("@/components/landing/WhatsAppFloatingButton").then(mod => mod.WhatsAppFloatingButton));
const InteractiveUP = dynamic(() => import("@/components/landing/InteractiveUP").then(mod => mod.InteractiveUP));

const AntigravityBackground = dynamic(
  () => import("@/components/landing/AntigravityBackground").then((mod) => mod.AntigravityBackground),
  { ssr: false }
);

const GlobeSection3D = dynamic(
  () => import("@/components/landing/GlobeSection3D").then((mod) => mod.GlobeSection3D),
  { ssr: false }
);

// Monta GlobeSection3D solo cuando está cerca del viewport (lazy-mount por scroll).
// Evita pagar el costo de 3 Canvas WebGL simultáneos antes de que el usuario llegue
// a esta sección. El placeholder reutiliza el mismo alto/color de fondo de la
// sección real (`h-screen w-full bg-[#050505]`) para no producir salto de layout.
function LazyGlobeSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldRender(true);
        }
      },
      { rootMargin: "600px" }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [shouldRender]);

  if (shouldRender) {
    return <GlobeSection3D />;
  }

  return <div ref={containerRef} className="h-screen w-full bg-[#050505]" />;
}

export default function HomePage() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const lastScrollY = useRef(0);

  const scaleX = useSpring(useScroll().scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Lógica de Header Inteligente: barra negra fija, solo se oculta/muestra con el scroll
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
    { label: 'Inicio', href: '/' },
    { label: 'Planes', href: '/planes' },
    { label: 'Nosotros', href: '/acerca' },
    { label: 'Contáctanos', href: '/contacto' }
  ];

  return (
    <div className="bg-background min-h-screen selection:bg-cyan selection:text-black">
      
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
              className={`fixed top-0 w-full z-[100] transition-all duration-500 ${isAtTop ? 'py-6' : 'py-4'}`}
            >
              <div className="container mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full px-5 md:px-8 py-3 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)]">

                  {/* LADO IZQUIERDO: Hamburguesa (Solo Móvil) y Logo */}
                  <div className="flex items-center gap-4 pointer-events-auto">
                    <button
                      onClick={() => setIsMobileMenuOpen(true)}
                      className="md:hidden p-1 text-white"
                    >
                      <Menu size={22} />
                    </button>

                    <Link href="/" className="flex items-center text-lg font-black italic tracking-tighter text-white">
                      <span>BAY</span>
                      <InteractiveUP />
                    </Link>
                  </div>

                  {/* CENTRO: Menu Desktop */}
                  <div className="hidden md:flex items-center justify-center pointer-events-auto">
                    <div className="flex items-center gap-8">
                      {navLinks.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-300"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* DERECHA: CTAs Desktop */}
                  <div className="hidden md:flex justify-end pointer-events-auto items-center gap-3">
                    <Link
                      href="/login"
                      className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-300 px-3"
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      href="/register"
                      className="bg-white text-black text-sm font-semibold rounded-full px-5 py-2 hover:bg-gray-200 transition-colors duration-300 whitespace-nowrap"
                    >
                      Regístrate
                    </Link>
                  </div>

                  {/* CTA Móvil (Solo icono login para ahorrar espacio) */}
                  <div className="md:hidden pointer-events-auto">
                     <Link href="/login" className="p-1 text-white">
                        <User size={22} />
                     </Link>
                  </div>
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
                        { label: 'Nosotros', href: '/acerca' },
                        { label: 'Contáctanos', href: '/contacto' }
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
              <LazyGlobeSection />
            </main>

            <Footer />

            {/* WhatsApp Smart Floating Button */}
            <WhatsAppFloatingButton hidden={hidden} />
      </motion.div>

      <style jsx global>{`
        html {
          /* "scroll-behavior: smooth" se quitó a propósito: choca con el
             scroll-jacking de GSAP ScrollTrigger (sección horizontal fija)
             y genera saltos/tirones en vez de scroll fluido. */
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
