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
        
        <div className="relative flex justify-center order-2 lg:order-1 h-[700px] items-center">
          {/* Contenedor relativo para agrupar todo el visual móvil */}
          <div className="relative w-full max-w-md group">
            
            {/* 1. LA TARJETA DE CRISTAL (FONDO) */}
            <PixelTransition delay={0.5} gridSize={12}>
              <div className="relative w-[320px] h-[500px] mx-auto rounded-[4rem] bg-white/[0.03] backdrop-blur-[100px] border-2 border-white/80 shadow-[0_40px_100px_-20px_rgba(0,77,77,0.2)] transition-all duration-700 group-hover:border-cyan/40">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
                <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(255,255,255,0.3)] rounded-[4rem] pointer-events-none" />
              </div>
            </PixelTransition>

            {/* 2. EL CELULAR (FLOTANDO POR FUERA) */}
            <motion.div
              initial={{ opacity: 0, scale: 1.3, y: 20, rotateY: 5 }}
              whileInView={{ opacity: 1, scale: 1.5, y: -20, rotateY: 0 }}
              whileHover={{ scale: 1.6, y: -30, rotateY: -5, rotateX: 5 }}
              transition={{ 
                duration: 1.2, 
                ease: [0.16, 1, 0.3, 1],
                scale: { type: "spring", stiffness: 100, damping: 15 }
              }}
              className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <img 
                src="/assets/Cel catalogo.png" 
                alt="Mobile Experience" 
                className="w-full h-auto drop-shadow-[0_60px_100px_rgba(0,0,0,0.5)] filter brightness-110 pointer-events-auto"
              />
            </motion.div>
            
            {/* 3. PILL FLOTANTE (Movido abajo) */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-4 bottom-10 bg-white/10 backdrop-blur-[80px] border-2 border-white/80 p-6 rounded-[2rem] shadow-2xl z-[60] space-y-3 hidden md:block"
            >
              <div className="flex gap-2">
                <div className="h-2 w-10 bg-cyan rounded-full shadow-[0_0_15px_#00f2ff]" />
                <div className="h-2 w-5 bg-petroleum/30 rounded-full" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-petroleum">Experience Active</p>
            </motion.div>

            {/* Sombra de suelo */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-10 bg-petroleum/15 blur-[50px] rounded-full" />
          </div>
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
