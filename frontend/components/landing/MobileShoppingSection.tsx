"use client";

import { motion } from "framer-motion";
import { Smartphone, ShoppingCart, Zap } from "lucide-react";
import { useRef, useState } from "react";
import { PixelTransition } from "./PixelTransition";

export const MobileShoppingSection = () => {
  const textRef = useRef<HTMLSpanElement>(null);
  const [mousePos, setMousePos] = useState({ x: 95, y: 15 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!textRef.current) return;
    const rect = textRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 95, y: 15 });
  };

  return (
    <section className="py-40 bg-surface relative overflow-hidden isolate shadow-inner">
      <div className="absolute top-1/2 left-1/4 w-[700px] h-[700px] bg-petroleum/10 rounded-full blur-[180px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan/5 rounded-full blur-[150px] -z-10" />

      <div className="container mx-auto px-12 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        
        <div className="relative flex justify-center order-2 lg:order-1">
          {/* Contenedor relativo para agrupar todo el visual móvil */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
            whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg group isolate"
          >
            {/* 1. VITRINA PRINCIPAL CON PIXEL TRANSITION (Solo envuelve el vidrio) */}
            <PixelTransition delay={0.5} gridSize={12}>
              <div className="relative p-12 rounded-[5.5rem] bg-white/[0.02] backdrop-blur-[120px] border-2 border-white/80 shadow-[0_60px_120px_-20px_rgba(0,77,77,0.3)] overflow-hidden transition-all duration-700 group-hover:border-cyan/40">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
                <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-white/20 via-transparent to-transparent rotate-12 pointer-events-none group-hover:rotate-45 transition-transform duration-1000" />
                
                <img 
                  src="/assets/Cel catalogo.png" 
                  alt="Mobile Experience" 
                  className="w-full h-auto rounded-[3.5rem] relative z-10 drop-shadow-[0_40px_60px_rgba(0,0,0,0.3)] group-hover:scale-[1.03] transition-transform duration-700 filter brightness-105"
                />

                <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(255,255,255,0.4)] rounded-[5.5rem] pointer-events-none" />
              </div>
            </PixelTransition>
            
            {/* 2. PILL FLOTANTE (Fuera de PixelTransition para evitar recortes) */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-12 top-1/4 bg-white/10 backdrop-blur-[80px] border-2 border-white/80 p-8 rounded-[2.5rem] shadow-2xl z-20 space-y-3 hidden md:block"
            >
              <div className="flex gap-2">
                <div className="h-2 w-10 bg-cyan rounded-full shadow-[0_0_15px_#00f2ff]" />
                <div className="h-2 w-5 bg-petroleum/30 rounded-full" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-petroleum">Experience Active</p>
            </motion.div>

            {/* Sombra de suelo */}
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[85%] h-14 bg-petroleum/20 blur-[60px] rounded-full" />
          </motion.div>
        </div>

        <div className="space-y-12 order-1 lg:order-2">
          <div className="space-y-4">
            <p className="text-cyan font-black uppercase tracking-[0.5em] text-[10px]">Mobile-First DNA</p>
            <h2 className="text-6xl md:text-8xl font-black text-black tracking-tighter italic leading-[0.85] uppercase">
              TUS CLIENTES, <br />
              <span 
                ref={textRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="dynamic-gradient-text inline-block transition-all duration-[2500ms] ease-[0.16,1,0.3,1] cursor-default"
                style={{ 
                  backgroundImage: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, #00f2ff 0%, #004d4d 70%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                } as React.CSSProperties}
              >
                DONDE SEA.
              </span>
            </h2>
          </div>
          <p className="max-w-xl text-gray-500 text-lg font-medium leading-relaxed">
            La experiencia de compra más fluida del planeta. Nuestras interfaces móviles están diseñadas para convertir usuarios en fans, con tiempos de carga instantáneos y navegación gestual intuitiva.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <div className="group space-y-4">
              <div className="h-16 w-16 rounded-[1.5rem] bg-white border-2 border-gray-100 text-petroleum flex items-center justify-center shadow-xl group-hover:bg-petroleum group-hover:text-cyan transition-all duration-500 border-b-cyan/30">
                <Smartphone size={28} />
              </div>
              <div>
                <h4 className="text-xl font-black uppercase italic text-black">PWA Ready</h4>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">Instalable sin App Store</p>
              </div>
            </div>
            <div className="group space-y-4">
              <div className="h-16 w-16 rounded-[1.5rem] bg-white border-2 border-gray-100 text-petroleum flex items-center justify-center shadow-xl group-hover:bg-petroleum group-hover:text-cyan transition-all duration-500 border-b-cyan/30">
                <Zap size={28} />
              </div>
              <div>
                <h4 className="text-xl font-black uppercase italic text-black">Ultra Fast</h4>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">Carga en 0.4 segundos</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
