"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Library, Palette, Zap } from "lucide-react";

const templates = [
  { id: 1, title: "Luxe Fashion", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop", category: "Moda" },
  { id: 2, title: "Tech Pulse", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop", category: "Tecnología" },
  { id: 3, title: "Organic Essence", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=1200&auto=format&fit=crop", category: "Salud" },
  { id: 4, title: "Urban Gear", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop", category: "Deportes" },
  { id: 5, title: "Audio Elite", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop", category: "Electrónica" },
];

export const TemplateShowcase = ({ compact = false }: { compact?: boolean }) => {
  const [rotation, setRotation] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const textRef = useRef<HTMLSpanElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!textRef.current) return;
    const rect = textRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 50, y: 50 });
  };

  const rotate = (dir: number) => {
    setRotation(prev => prev + (dir * 72));
    setActiveIndex(prev => (prev - dir + templates.length) % templates.length);
  };

  useEffect(() => {
    const timer = setInterval(() => rotate(-1), 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="templates" className={`${compact ? 'py-6 md:py-8' : 'py-20 md:py-40'} bg-[#FFFFFF] relative overflow-hidden isolate ${compact ? 'h-full w-full flex flex-col justify-center' : ''}`}>
      {/* Massive Aura background */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${compact ? 'w-[700px] h-[700px]' : 'w-[1200px] h-[1200px]'} bg-petroleum/5 rounded-full blur-[200px] -z-10 animate-pulse`} />

      <div className="container mx-auto px-6 text-center relative z-50">

        <div className="w-full mx-auto space-y-6 flex flex-col items-center">
          <div className="space-y-4 w-full flex flex-col items-center px-4">
            <h2 className={`${compact ? 'text-3xl md:text-5xl lg:text-6xl' : 'text-5xl md:text-7xl lg:text-8xl'} font-black text-black italic tracking-tighter uppercase leading-[1] text-center flex flex-col items-center`}>
              <span>DISEÑOS QUE</span>{" "}
              <span
                ref={textRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="transition-all duration-[2000ms] ease-[0.16,1,0.3,1] cursor-default inline-block"
                style={{
                  backgroundImage: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, #00f2ff 0%, #004d4d 70%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                } as React.CSSProperties}
              >
                INSPIRAN.
              </span>
            </h2>
            <h3 className={`${compact ? 'text-xs md:text-lg' : 'text-sm md:text-2xl'} font-medium text-gray-500 tracking-tight max-w-2xl mx-auto leading-relaxed text-center px-6`}>
              Diseños pensados para <span className="text-petroleum font-black italic">convertir visitas en ventas.</span>
            </h3>
          </div>

          <div className={`flex flex-row justify-center gap-4 md:gap-16 ${compact ? 'pt-3' : 'pt-8'} relative z-50 w-full px-2`}>
            {[
              { icon: <Library size={20} />, label: "+80 plantillas" },
              { icon: <Palette size={20} />, label: "Personalización" },
              { icon: <Zap size={20} />, label: "Cero Código" }
            ].map((f, i) => (
              <div
                key={i}
                className="relative group flex-1 max-w-[100px]"
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`${compact ? 'h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl' : 'h-12 w-12 md:h-20 md:w-20 rounded-2xl md:rounded-3xl'} flex items-center justify-center shadow-sm border border-gray-100 bg-petroleum/5 text-petroleum`}
                  >
                    {f.icon}
                  </div>
                  <p className="text-[7px] md:text-[11px] font-black uppercase tracking-wider text-gray-500 text-center leading-tight">{f.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* XL Circular 3D Carousel */}
        <div className={`relative ${compact ? 'h-[260px] md:h-[380px] -mt-4 md:-mt-2' : 'h-[450px] md:h-[650px] -mt-12 md:-mt-10'} flex items-center justify-center perspective-[4000px]`}>
          <div className="relative w-full h-full flex items-center justify-center">

            {/* Nav Controls - Solo Desktop */}
            <button onClick={() => rotate(1)} className={`hidden md:flex absolute left-0 ${compact ? 'md:left-4 h-12 w-12' : 'md:left-10 h-14 w-14 md:h-20 md:w-20'} z-[100] rounded-full border-2 border-white bg-white/40 backdrop-blur-3xl items-center justify-center text-petroleum hover:bg-petroleum hover:text-white transition-all shadow-2xl active:scale-90`}>
              <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
            </button>
            <button onClick={() => rotate(-1)} className={`hidden md:flex absolute right-0 ${compact ? 'md:right-4 h-12 w-12' : 'md:right-10 h-14 w-14 md:h-20 md:w-20'} z-[100] rounded-full border-2 border-white bg-white/40 backdrop-blur-3xl items-center justify-center text-petroleum hover:bg-petroleum hover:text-white transition-all shadow-2xl active:scale-90`}>
              <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
            </button>

            {/* The Stage */}
            <motion.div
              className="relative w-full h-full flex items-center justify-center preserve-3d transition-transform duration-1000 ease-[0.16,1,0.3,1]"
              style={{ transform: `rotateY(${rotation}deg)` }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(e, info) => {
                if (info.offset.x > 50) rotate(1);
                if (info.offset.x < -50) rotate(-1);
              }}
            >
              {templates.map((t, i) => {
                const angle = i * 72;
                return (
                  <div
                    key={t.id}
                    className={`absolute ${compact ? 'w-[70vw] max-w-[520px]' : 'w-[85vw] max-w-[800px]'} aspect-[16/11] md:aspect-[16/9] preserve-3d`}
                    style={{ transform: `rotateY(${angle}deg) translateZ(${compact ? 550 : 850}px)` }}
                  >
                    <motion.div 
                      animate={{ 
                        opacity: activeIndex === i ? 1 : 0.15, 
                        scale: activeIndex === i ? 1.1 : 0.7, 
                        filter: activeIndex === i ? "blur(0px)" : "blur(12px)"
                      }}
                      className="relative w-full h-full rounded-[4rem] overflow-hidden border-2 border-white shadow-[0_80px_150px_-30px_rgba(0,0,0,0.3)] group cursor-pointer isolate"
                    >
                      <img src={t.image} alt={t.title} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-12 text-left">
                        <div className="space-y-2">
                          <p className="text-cyan text-xs font-black uppercase tracking-[0.4em]">{t.category}</p>
                          <h4 className="text-white text-4xl font-black italic uppercase tracking-tighter leading-none">{t.title}</h4>
                          <button className="mt-6 px-8 py-3 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-cyan transition-all">Ver Plantilla</button>
                        </div>
                      </div>

                      <div className="absolute inset-0 border-[3px] border-white/20 rounded-[4rem] pointer-events-none z-20" />
                    </motion.div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  );
};
