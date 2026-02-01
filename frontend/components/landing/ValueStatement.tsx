"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Palette, ShoppingBag, Banknote, Globe, Zap, Cpu } from "lucide-react";
import { useState } from "react";
import { RollingText } from "./RollingText";

export const ValueStatement = () => {
  const pillars = [
    { 
      title: "PERSONALIZA TU TIENDA", 
      desc: "", 
      details: "Diseña cada rincón de tu web con herramientas intuitivas.",
      highlight: "Tu marca, tu estilo, sin límites técnicos.",
      icon: <Palette size={28} /> 
    },
    { 
      title: "AGREGA TU PRIMER PRODUCTO", 
      desc: "", 
      details: "Sube tus fotos, define tus precios y organiza tu catálogo en segundos.",
      highlight: "Publicar nunca fue tan fácil.",
      icon: <ShoppingBag size={28} /> 
    },
    { 
      title: "COMIENZA A VENDER", 
      desc: "", 
      details: "Activa tu pasarela de pagos y empieza a recibir órdenes de inmediato.",
      highlight: "El mundo está listo para comprarte.",
      icon: <Banknote size={28} /> 
    },
  ];

  return (
    <section className="py-40 bg-surface relative overflow-hidden shadow-inner">
      <div className="container mx-auto px-12 text-center">
        
        <div className="max-w-6xl mx-auto space-y-20">
          <div className="text-4xl md:text-6xl font-black text-black tracking-tighter leading-[1.1] italic uppercase flex flex-col items-center">
            <RollingText text="LA FORMA MAS FACIL" />
            <div className="flex gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum via-cyan to-petroleum">
                <RollingText text="DE VENDER POR INTERNET." />
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 perspective-2000">
            {pillars.map((p, i) => (
              <Card3D key={i} pillar={p} index={i} />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

const Card3D = ({ pillar, index }: { pillar: any, index: number }) => {
  const [isHovered, setIsHovered] = useState(false);

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
      style={{ zIndex: isHovered ? 50 : 1 }}
    >
      <motion.div
        animate={{ 
          rotateY: isHovered ? 180 : 0,
          scale: isHovered ? 1.12 : 1,
          y: isHovered ? -15 : 0
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full h-full preserve-3d"
      >
        {/* LADO FRONTAL */}
        <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-10 rounded-[4.5rem] bg-white/10 backdrop-blur-[100px] border-2 border-white/60 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] isolate">
          <div className="absolute inset-0 bg-gradient-to-br from-petroleum/[0.05] to-cyan/[0.05] rounded-[4.5rem] -z-10" />
          
          <div className="space-y-10 flex flex-col items-center w-full">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-[#004D4D] to-black text-white flex items-center justify-center shadow-[0_0_30px_rgba(0,77,77,0.3)] relative group-hover:shadow-[0_0_50px_rgba(0,242,255,0.4)] transition-all duration-700">
              <div className="absolute inset-0 bg-cyan/10 blur-2xl rounded-full scale-150 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
                {pillar.icon}
              </div>
            </div>
            <div className="space-y-4 text-center w-full">
              <h3 className="text-2xl font-black uppercase tracking-tight italic text-black leading-tight w-full flex justify-center">
                <RollingText text={pillar.title} delay={0.5 + index * 0.1} />
              </h3>
              <div className="text-gray-500 text-[10px] font-black leading-relaxed uppercase tracking-[0.2em] w-full px-4">
                <RollingText text={pillar.desc} delay={0.7 + index * 0.1} />
              </div>
            </div>
          </div>
          
          <div className="absolute inset-0 overflow-hidden rounded-[4.5rem] pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out pointer-events-none" />
          </div>
        </div>

        {/* LADO TRASERO */}
        <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-10 rounded-[4.5rem] bg-white/20 backdrop-blur-[100px] border-2 border-white/80 shadow-[0_40px_100px_-20px_rgba(0,77,77,0.1)] rotate-y-180 overflow-hidden isolate">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan/[0.05] to-petroleum/[0.05] rounded-[4.5rem] -z-10" />
          
          <div className="space-y-6 text-center relative z-10 w-full flex flex-col items-center">
            {/* Texto ENGINE DETAILS eliminado */}
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-black w-full flex justify-center mt-8">
              <RollingText text={pillar.title} />
            </h3>
            <p className="text-gray-600 text-[10px] font-bold leading-relaxed uppercase tracking-widest italic px-6 mt-2">
              {pillar.details}
            </p>
            
            {pillar.highlight && (
              <div className="pt-4 mt-2 border-t border-petroleum/10 w-full px-8">
                <p className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum via-cyan to-petroleum font-black text-sm italic uppercase tracking-tighter leading-tight drop-shadow-sm">
                  {pillar.highlight}
                </p>
              </div>
            )}

            <div className="pt-6">
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-br from-[#004D4D] to-black text-white text-[9px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,77,77,0.4)] hover:shadow-[0_0_30px_rgba(0,242,255,0.5)] transition-all duration-500 hover:scale-105 active:scale-95">
                <span className="drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">Empieza ya!</span>
              </button>
            </div>
          </div>

          <div className="absolute inset-0 overflow-hidden rounded-[4.5rem] pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out pointer-events-none" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};