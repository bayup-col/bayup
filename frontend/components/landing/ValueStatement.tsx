"use client";

import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { Layout, PlusCircle, Rocket, Globe, Zap, Cpu } from "lucide-react";
import { useState } from "react";
import { TextCarousel } from "./TextCarousel";
import { GlassButton } from "./GlassButton";

export const ValueStatement = () => {
  const [hasDragged, setHasDragged] = useState(false);
  const pillars = [
    // ... (mismos pilares)
    { 
      step: "01",
      title: "PERSONALIZA TU TIENDA", 
      desc: "", 
      details: "Diseña cada rincón de tu web con herramientas intuitivas.",
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
      details: "Activa tu página web y empieza a recibir órdenes de inmediato.",
      highlight: "Tus clientes te esperan",
      asset: "/assets/cohetedinero.webp"
    },
  ];

  return (
    <section className="py-20 md:py-40 bg-[#F8FAFB] relative overflow-hidden">
      {/* Patrón de micro-puntos técnico */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#004D4D 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
      />

      <div className="container mx-auto px-6 md:px-12 text-center relative z-10">
        
        <div className="max-w-6xl mx-auto space-y-12 md:space-y-32 text-center">
          <div className="flex flex-col items-center gap-6">
            <h2 className="text-3xl md:text-7xl font-black text-black tracking-tighter leading-[0.9] italic uppercase drop-shadow-xl flex flex-col items-center px-4">
              <span>La nueva forma</span>
              <span>
                de vender por <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum via-cyan to-petroleum drop-shadow-[0_0_10px_rgba(0,242,255,0.3)]">internet</span>
              </span>
            </h2>
            <motion.p 
              initial={{ opacity: 0, x: 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 100, 
                damping: 15,
                delay: 0.2
              }}
              viewport={{ once: true }}
              className="text-lg md:text-2xl font-bold text-black drop-shadow-[0_0_12px_rgba(0,0,0,0.3)] mt-4 md:mt-8 px-6 flex flex-col md:flex-row items-center justify-center md:gap-2"
            >
              <span className="whitespace-nowrap">Crea tu tienda profesional</span>
              <span className="whitespace-nowrap">en 3 pasos simples</span>
            </motion.p>
          </div>
          
          <div className="flex flex-col items-center gap-16 md:gap-32 w-full pt-8 md:pt-20">
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
                className="flex md:grid md:grid-cols-3 gap-8 md:gap-20 perspective-2000 w-full"
                drag="x"
                dragConstraints={{ right: 0, left: -600 }}
                onDragStart={() => setHasDragged(true)}
                dragElastic={0.2}
                style={{ cursor: "grab" }}
                whileTap={{ cursor: "grabbing" }}
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

            {/* Botón de acción debajo de las cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-cyan/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
              <div className="relative shadow-[0_30px_60px_-10px_rgba(0,0,0,0.5)] rounded-2xl group-hover:shadow-[0_40px_80px_-15px_rgba(0,242,255,0.4)] transition-all duration-500">
                <GlassButton href="/register" variant="primary">
                  Crear mi tienda gratis
                </GlassButton>
              </div>
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  );
};

const Card3D = ({ pillar, index }: { pillar: any, index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [autoFlipped, setAutoFlipped] = useState(false);
  const { scrollY } = useScroll();

  // Lógica de Auto-flip secuencial para todas las tarjetas
  useMotionValueEvent(scrollY, "change", (latest) => {
    // Definimos rangos de scroll específicos para cada tarjeta (ajustados para PC y móvil)
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    
    const ranges = isMobile ? [
      { min: 1100, max: 1900 }, // Card 01 Móvil
      { min: 1400, max: 2200 }, // Card 02 Móvil
      { min: 1700, max: 2500 }, // Card 03 Móvil
    ] : [
      { min: 1500, max: 2300 }, // Card 01 Desktop (Punto equilibrado)
      { min: 1500, max: 2300 }, // Card 02 Desktop
      { min: 1500, max: 2300 }, // Card 03 Desktop
    ];

    const currentRange = ranges[index];
    if (currentRange && latest > currentRange.min && latest < currentRange.max) {
      setAutoFlipped(true);
    } else {
      setAutoFlipped(false);
    }
  });

  return (
    <motion.div
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
      className="relative h-[450px] w-full cursor-pointer group"
      style={{ zIndex: isHovered || autoFlipped ? 50 : 1 }}
    >
      <motion.div
        animate={{ 
          rotateY: (isHovered || autoFlipped) ? 180 : 0,
          scale: (isHovered || autoFlipped) ? 1.12 : 1,
          y: (isHovered || autoFlipped) ? -15 : 0
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full h-full preserve-3d"
      >
        {/* LADO FRONTAL */}
        <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-10 rounded-[4.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] isolate">
          
          {/* AURORA TRACING BEAM EFFECT - FRONTAL */}
          <div className="absolute inset-0 rounded-[4.5rem] overflow-hidden -z-10">
            <div 
              className="absolute top-1/2 left-1/2 w-[250%] aspect-square animate-aurora opacity-50 group-hover:opacity-100 transition-opacity duration-700"
              style={{
                background: `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)`,
                willChange: 'transform'
              }}
            />
            {/* Relleno que actúa como máscara del borde */}
            <div className="absolute inset-[3px] rounded-[4.4rem] bg-white/95 backdrop-blur-[120px]" />
          </div>

          <div className="absolute inset-0 bg-gradient-to-br from-petroleum/[0.08] to-transparent rounded-[4.5rem] -z-10" />
          
          <div className="space-y-10 flex flex-col items-center w-full relative z-10">
            {/* El número como Icono Principal */}
            <div className="h-28 w-28 rounded-[2.5rem] bg-gradient-to-br from-[#004D4D] to-black text-white flex items-center justify-center shadow-[0_20px_40px_rgba(0,77,77,0.3)] relative group-hover:shadow-[0_0_60px_rgba(0,242,255,0.4)] transition-all duration-700">
              <div className="absolute inset-0 bg-cyan/30 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <span className="relative z-10 text-5xl font-black italic tracking-tighter text-cyan drop-shadow-[0_0_12px_rgba(0,242,255,0.9)]">
                {pillar.step}
              </span>
            </div>

            <div className="space-y-4 text-center w-full">
              <h3 className="text-3xl font-black uppercase tracking-[-0.03em] italic text-black leading-tight w-full flex justify-center drop-shadow-sm">
                {pillar.title}
              </h3>
              <div className="text-gray-400 text-[11px] font-black leading-relaxed uppercase tracking-[0.3em] w-full px-4">
                {pillar.desc}
              </div>
            </div>
          </div>
          
          <div className="absolute inset-0 overflow-hidden rounded-[4.5rem] pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out pointer-events-none" />
          </div>
        </div>

        {/* LADO TRASERO */}
        <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-10 rounded-[4.5rem] shadow-[0_40px_100px_-20px_rgba(0,77,77,0.1)] rotate-y-180 isolate">
          
          {/* AURORA TRACING BEAM EFFECT - TRASERO */}
          <div className="absolute inset-0 rounded-[4.5rem] overflow-hidden -z-10">
            <div 
              className="absolute top-1/2 left-1/2 w-[250%] aspect-square animate-aurora opacity-40 group-hover:opacity-100 transition-opacity duration-700"
              style={{
                background: `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)`,
                willChange: 'transform'
              }}
            />
            {/* Relleno que actúa como máscara del borde */}
            <div className="absolute inset-[2px] rounded-[4.4rem] bg-white/95 backdrop-blur-[100px]" />
          </div>

          <div className="absolute inset-0 bg-gradient-to-tr from-cyan/[0.05] to-petroleum/[0.05] rounded-[4.5rem] -z-10" />
          
          <div className="space-y-6 text-center relative z-10 w-full flex flex-col items-center">
            
            {/* Imagen Pop-out con animación premium */}
            {pillar.asset && (
              <AnimatePresence>
                {(isHovered || autoFlipped) && (
                  <motion.div
                    initial={{ y: 80, opacity: 0, scale: 0.5 }}
                    animate={{ y: -40, opacity: 1, scale: 1 }}
                    exit={{ y: 40, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute -top-36 flex justify-center w-full left-0"
                  >
                    <img 
                      src={pillar.asset} 
                      alt={pillar.title} 
                      className="w-48 h-48 object-contain drop-shadow-[0_20px_50px_rgba(0,242,255,0.6)]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            <h3 className="text-xl font-black italic uppercase tracking-tighter text-black w-full flex justify-center mt-16">
              {pillar.title}
            </h3>
            <p className="text-gray-600 text-xs font-bold leading-relaxed tracking-wide italic px-6 mt-2 lowercase first-letter:uppercase">
              {pillar.details}
            </p>
            
            {pillar.highlight && (
              <div className="pt-6 mt-4 border-t border-petroleum/10 w-full px-8">
                <p className="text-petroleum font-black text-sm italic uppercase tracking-tighter leading-tight drop-shadow-sm">
                  {pillar.highlight}
                </p>
              </div>
            )}
          </div>

          <div className="absolute inset-0 overflow-hidden rounded-[4.5rem] pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out pointer-events-none" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};