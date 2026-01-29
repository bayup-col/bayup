"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export const VisualExperience = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);

  return (
    <section ref={containerRef} className="py-32 bg-[#0B0B0B] relative overflow-hidden">
      <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        
        <div className="space-y-8 relative z-10">
          <motion.div style={{ scale }}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00f2ff] mb-4">Interfaz Futurista</p>
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter italic leading-tight">
              TIENDAS QUE <br />
              RESPIREN <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f2ff] to-[#004d4d]">VIDA.</span>
            </h2>
            <p className="max-w-md text-gray-400 text-lg font-medium leading-relaxed mt-6">
              Olvídate de las plantillas estáticas. Bayup renderiza experiencias visuales fluidas, optimizadas para la conversión y diseñadas para impactar.
            </p>
          </motion.div>

          <div className="flex gap-12 pt-8 border-t border-white/10">
            <div>
              <p className="text-3xl font-black text-white italic">60fps</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Navegación fluida</p>
            </div>
            <div>
              <p className="text-3xl font-black text-white italic">0.4s</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Carga promedio</p>
            </div>
          </div>
        </div>

        <div className="relative h-[600px] flex items-center justify-center">
          {/* Simulación de Tienda Parallax */}
          <motion.div 
            style={{ y: y1 }}
            className="absolute left-0 w-64 h-[400px] rounded-[2.5rem] bg-gradient-to-br from-[#004d4d] to-black border border-white/10 shadow-2xl p-6 overflow-hidden hidden md:block"
          >
            <div className="h-4 w-20 bg-white/10 rounded-full mb-8" />
            <div className="aspect-square bg-white/5 rounded-2xl mb-4" />
            <div className="h-4 w-full bg-white/10 rounded-full mb-2" />
            <div className="h-4 w-2/3 bg-white/10 rounded-full" />
          </motion.div>

          <motion.div 
            className="relative z-20 w-72 h-[500px] rounded-[3rem] bg-[#0B0B0B] border-4 border-white/10 shadow-[0_0_50px_rgba(0,242,255,0.1)] p-8 overflow-hidden flex flex-col"
          >
            <div className="flex justify-between mb-10">
              <div className="h-6 w-6 rounded-full bg-[#00f2ff]" />
              <div className="flex gap-1">
                <div className="h-1 w-4 bg-white/20 rounded-full" />
                <div className="h-1 w-4 bg-white/20 rounded-full" />
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div className="text-6xl animate-bounce">👟</div>
              <h3 className="text-xl font-black text-white italic">Cyber Runner X</h3>
              <p className="text-[10px] font-bold text-[#00f2ff] uppercase tracking-widest">$299.00</p>
              <button className="w-full py-4 bg-[#00f2ff] text-black rounded-2xl font-black text-[10px] uppercase tracking-widest">Add to cart</button>
            </div>
          </motion.div>

          <motion.div 
            style={{ y: y2 }}
            className="absolute right-0 w-64 h-[400px] rounded-[2.5rem] bg-gradient-to-tr from-black to-[#004d4d] border border-white/10 shadow-2xl p-6 overflow-hidden hidden md:block"
          >
            <div className="flex gap-2 mb-8">
              <div className="h-2 w-2 rounded-full bg-white/20" />
              <div className="h-2 w-2 rounded-full bg-white/20" />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="aspect-square bg-white/5 rounded-xl" />
              <div className="aspect-square bg-white/5 rounded-xl" />
            </div>
            <div className="h-20 w-full bg-white/5 rounded-2xl" />
          </motion.div>
        </div>

      </div>
    </section>
  );
};
