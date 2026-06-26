"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import { Layout, PlusCircle, Rocket, Globe, Zap, Cpu } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { TextCarousel } from "./TextCarousel";

export const ValueStatement = () => {
  const [hasDragged, setHasDragged] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const pillars = [
    // ... (mismos pilares)
    { 
      step: "01",
      title: "PERSONALIZA TU TIENDA", 
      desc: "", 
      details: "Diseña cada rincón de tu web sin límites creativos.",
      highlight: "Tu marca, tu estilo, sin límites técnicos.",
      asset: "/assets/pincel.webp"
    },
    { 
      step: "02",
      title: "AGREGA TU PRIMER PRODUCTO", 
      desc: "", 
      details: "Sube tus fotos, define tus precios y organiza tu catálogo en segundos.",
      highlight: "Publicar nunca fue tan fácil.",
      asset: "/assets/pcfotos.webp"
    },
    { 
      step: "03",
      title: "COMIENZA A VENDER", 
      desc: "", 
      details: "Activa tu página web y empieza a recibir órdenes de compra inmediatas.",
      highlight: "Tus clientes te esperan",
      asset: "/assets/cohetedinero.webp"
    },
  ];

  return (
    <section className="py-12 md:py-20 bg-[#F8FAFB] relative overflow-hidden">
      {/* Patrón de micro-puntos técnico */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#004D4D 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
      />

      <div className="container mx-auto px-6 md:px-12 text-center relative z-10">
        
        <div className="max-w-6xl mx-auto space-y-8 md:space-y-16 text-center">
          <div className="flex flex-col items-center gap-6">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.25em] text-petroleum/50"
            >
              <span className="h-px w-6 bg-petroleum/30" />
              Cómo funciona
              <span className="h-px w-6 bg-petroleum/30" />
            </motion.span>

            <h2 className="text-3xl md:text-6xl font-light text-[#0A1A1A] tracking-tight leading-[1.15] flex flex-col items-center px-4">
              <span>La nueva forma</span>
              <span>
                de vender por <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-petroleum via-cyan to-petroleum drop-shadow-[0_0_10px_rgba(0,242,255,0.3)]">internet</span>
              </span>
            </h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="text-base md:text-lg font-light text-gray-500 mt-1 px-6 flex flex-col md:flex-row items-center justify-center md:gap-2"
            >
              <span className="whitespace-nowrap">Crea tu tienda profesional</span>
              <span className="whitespace-nowrap">en 3 pasos simples</span>
            </motion.p>
          </div>

          <div className="flex flex-col items-center gap-8 md:gap-12 w-full pt-20 md:pt-28">
            <div className="w-full md:overflow-visible px-4 md:px-0 relative group">
              
              {/* INDICADOR DE SWIPE (Solo móvil, desaparece al deslizar) */}
              <AnimatePresence>
                {!hasDragged && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none md:hidden"
                  >
                    <div className="flex flex-col items-center gap-4 bg-white/40 backdrop-blur-md px-8 py-6 rounded-3xl border border-white/40 shadow-xl">
                      <motion.div
                        animate={{ x: [-20, 20, -20] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="text-cyan drop-shadow-[0_0_8px_#00f2ff]"
                      >
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                          <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                          <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                        </svg>
                      </motion.div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-petroleum">Desliza para explorar</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className="flex md:grid md:grid-cols-3 gap-8 md:gap-16 perspective-2000 w-full"
                drag={isMobile ? "x" : false}
                dragConstraints={{ right: 0, left: -600 }}
                onDragStart={() => setHasDragged(true)}
                dragElastic={0.2}
                style={{ cursor: isMobile ? "grab" : "default" }}
                whileTap={{ cursor: isMobile ? "grabbing" : "default" }}
              >
                {pillars.map((p, i) => (
                  <div key={i} className="min-w-[85vw] md:min-w-0 scale-90 md:scale-100 origin-center">
                    <Card3D pillar={p} index={i} />
                  </div>
                ))}
              </motion.div>
              {/* Indicador visual de scroll en móvil */}
              <div className="flex md:hidden justify-center gap-2 mt-8">
                {pillars.map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-petroleum/20" />
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

const Card3D = ({ pillar, index }: { pillar: any, index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  // Se activa cuando la card está bien visible en pantalla durante el scroll,
  // y se desactiva al salir, para que el flip se repita cada vez que se pasa por ella.
  const isInView = useInView(cardRef, { amount: 0.6, margin: "-20% 0px -20% 0px", once: false });
  const isFlipped = isHovered || isInView;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        delay: index * 0.2,
        ease: [0.16, 1, 0.3, 1]
      }}
      viewport={{ once: true }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative h-[300px] md:h-[340px] w-full max-w-[340px] mx-auto cursor-pointer group"
      style={{ zIndex: isFlipped ? 50 : 1 }}
    >
      <motion.div
        animate={{
          rotateY: isFlipped ? 180 : 0,
          scale: isFlipped ? 1.12 : 1,
          y: isFlipped ? -15 : 0
        }}
        transition={{
          duration: 0.8,
          delay: isInView && !isHovered ? index * 0.1 : 0, // Secuencia sutil al voltearse por scroll
          ease: [0.16, 1, 0.3, 1]
        }}
        className="relative w-full h-full preserve-3d"
      >
        {/* LADO FRONTAL */}
        <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-6 md:p-8 rounded-[3rem] md:rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] isolate">
          
          {/* AURORA TRACING BEAM EFFECT - FRONTAL */}
          <div className="absolute inset-0 rounded-[3rem] md:rounded-[3.5rem] overflow-hidden -z-10">
            <div
              className="absolute top-1/2 left-1/2 w-[250%] aspect-square animate-aurora opacity-50 group-hover:opacity-100 transition-opacity duration-700"
              style={{
                background: `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)`,
                willChange: 'transform'
              }}
            />
            {/* Relleno que actúa como máscara del borde */}
            <div className="absolute inset-[3px] rounded-[2.9rem] md:rounded-[3.4rem] bg-white/95 backdrop-blur-[48px]" />
          </div>

          <div className="absolute inset-0 bg-gradient-to-br from-petroleum/[0.08] to-transparent rounded-[3rem] md:rounded-[3.5rem] -z-10" />

          <div className="space-y-5 md:space-y-6 flex flex-col items-center w-full relative z-10">
            {/* El número como Icono Principal */}
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-[1.5rem] md:rounded-[1.8rem] bg-gradient-to-br from-[#004D4D] to-black text-white flex items-center justify-center shadow-[0_20px_40px_rgba(0,77,77,0.3)] relative group-hover:shadow-[0_0_60px_rgba(0,242,255,0.4)] transition-all duration-700">
              <div className="absolute inset-0 bg-cyan/30 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <span className="relative z-10 text-3xl md:text-4xl font-black italic tracking-tighter text-cyan drop-shadow-[0_0_12px_rgba(0,242,255,0.9)]">
                {pillar.step}
              </span>
            </div>

            <div className="space-y-2 text-center w-full">
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-[-0.03em] italic text-black leading-tight w-full flex justify-center drop-shadow-sm">
                {pillar.title}
              </h3>
              <div className="text-gray-400 text-xs font-black leading-relaxed uppercase tracking-[0.25em] w-full px-4">
                {pillar.desc}
              </div>
            </div>
          </div>

          <div className="absolute inset-0 overflow-hidden rounded-[3rem] md:rounded-[3.5rem] pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out pointer-events-none" />
          </div>
        </div>

        {/* LADO TRASERO */}
        <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center pt-6 p-6 md:p-8 rounded-[3rem] md:rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,77,77,0.1)] rotate-y-180 isolate">

          {/* AURORA TRACING BEAM EFFECT - TRASERO */}
          <div className="absolute inset-0 rounded-[3rem] md:rounded-[3.5rem] overflow-hidden -z-10">
            <div
              className="absolute top-1/2 left-1/2 w-[250%] aspect-square animate-aurora opacity-40 group-hover:opacity-100 transition-opacity duration-700"
              style={{
                background: `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)`,
                willChange: 'transform'
              }}
            />
            {/* Relleno que actúa como máscara del borde */}
            <div className="absolute inset-[2px] rounded-[2.9rem] md:rounded-[3.4rem] bg-white/95 backdrop-blur-[40px]" />
          </div>

          <div className="absolute inset-0 bg-gradient-to-tr from-cyan/[0.05] to-petroleum/[0.05] rounded-[3rem] md:rounded-[3.5rem] -z-10" />

          {/* Imagen Pop-out con animación premium */}
          {pillar.asset && (
            <AnimatePresence>
              {isFlipped && (
                <motion.div
                  initial={{ y: 60, opacity: 0, scale: 0.5 }}
                  animate={{ y: -24, opacity: 1, scale: 1 }}
                  exit={{ y: 30, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute -top-20 flex justify-center w-full left-0"
                >
                  <img
                    src={pillar.asset}
                    alt={pillar.title}
                    className="w-28 h-28 md:w-32 md:h-32 object-contain drop-shadow-[0_20px_50px_rgba(0,242,255,0.6)]"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}

          <div className="space-y-4 text-center relative z-10 w-full flex flex-col items-center">
            <h3 className="text-lg md:text-xl font-black italic uppercase tracking-tighter text-black w-full flex justify-center">
              {pillar.title}
            </h3>
            <p className="text-gray-600 text-sm font-bold leading-relaxed tracking-wide italic px-6 lowercase first-letter:uppercase">
              {pillar.details}
            </p>

            {pillar.highlight && (
              <div className="pt-4 border-t border-petroleum/10 w-full px-8">
                <p className="text-petroleum font-black text-sm italic uppercase tracking-tighter leading-tight drop-shadow-sm text-center">
                  {pillar.highlight}
                </p>
              </div>
            )}
          </div>

          <div className="absolute inset-0 overflow-hidden rounded-[3rem] md:rounded-[3.5rem] pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out pointer-events-none" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
