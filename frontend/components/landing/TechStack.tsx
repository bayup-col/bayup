"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Server, Database, BrainCircuit, Box, LayoutGrid } from "lucide-react";
import { useRef } from "react";

export const TechStack = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const techs = [
    { name: "Next.js", icon: <LayoutGrid size={24} />, desc: "Frontend React" },
    { name: "FastAPI", icon: <Server size={24} />, desc: "Backend Python" },
    { name: "PostgreSQL", icon: <Database size={24} />, desc: "Base de datos" },
    { name: "Docker", icon: <Box size={24} />, desc: "Contenerización" },
    { name: "OpenAI", icon: <BrainCircuit size={24} />, desc: "Motor de IA" },
  ];

  return (
    <section ref={containerRef} className="py-40 bg-[#FFFFFF] relative overflow-hidden isolate">
      {/* Fondo decorativo con profundidad */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(0,242,255,0.03),transparent_50%)] -z-10" />

      <div className="container mx-auto px-12 text-center">
        
        <div className="max-w-4xl mx-auto mb-24 space-y-6">
          <p className="text-cyan font-black uppercase tracking-[0.5em] text-[10px]">The Core Engine</p>
          <h2 className="text-5xl md:text-7xl font-black text-black italic tracking-tighter uppercase leading-tight">
            TECNOLOGÍA DE <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum via-cyan to-petroleum">VANGUARDIA.</span>
          </h2>
          <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Arquitectura moderna, escalable y segura.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-10 relative">
          {techs.map((t, i) => (
            <TechNode key={i} t={t} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
};

const TechNode = ({ t, index }: { t: any, index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Efecto de inclinación magnética al mouse
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.8 }}
      viewport={{ once: true }}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative w-48 h-48 rounded-[3.5rem] overflow-hidden isolate flex flex-col items-center justify-center text-center transition-all duration-500 ease-out cursor-default"
      style={{ willChange: 'transform' }}
    >
      {/* Vidrio Extremo del nodo */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-[100px] border-2 border-white/60 shadow-[0_20px_50px_-10px_rgba(0,77,77,0.05)] group-hover:border-cyan/30 group-hover:shadow-[0_30px_60px_-10px_rgba(0,77,77,0.15)] transition-all duration-700 -z-10" />
      
      {/* Sombreado interno petróleo */}
      <div className="absolute inset-0 bg-gradient-to-br from-petroleum/[0.03] to-transparent -z-20" />

      <div className="text-petroleum mb-5 group-hover:scale-110 group-hover:text-cyan transition-all duration-500 relative z-10">
        {t.icon}
      </div>
      <h4 className="text-[11px] font-black text-black uppercase tracking-[0.2em] relative z-10 italic">{t.name}</h4>
      <p className="text-[8px] font-bold text-gray-400 uppercase mt-2 tracking-tighter relative z-10 opacity-60">{t.desc}</p>
      
      {/* Reflejo de barrido */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out pointer-events-none" />
    </motion.div>
  );
};
