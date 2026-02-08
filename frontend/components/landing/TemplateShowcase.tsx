"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Library, Palette, Zap } from "lucide-react";

const templates = [
  { id: 1, title: "Luxe Fashion", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop", category: "Moda" },
  { id: 2, title: "Tech Pulse", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop", category: "Tecnología" },
  { id: 3, title: "Organic Essence", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=1200&auto=format&fit=crop", category: "Salud" },
  { id: 4, title: "Urban Gear", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop", category: "Deportes" },
  { id: 5, title: "Audio Elite", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop", category: "Electrónica" },
];

export const TemplateShowcase = () => {
  const [rotation, setRotation] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedFeature, setSelectedFeature] = useState<number | null>(null);
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
    <section id="templates" className="py-20 md:py-40 bg-[#FFFFFF] relative overflow-hidden isolate">
      {/* Massive Aura background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-petroleum/5 rounded-full blur-[200px] -z-10 animate-pulse" />

      <div className="container mx-auto px-6 text-center relative z-50">
        
        <div className="w-full mx-auto space-y-6 flex flex-col items-center">
          <div className="space-y-4 w-full flex flex-col items-center px-4">
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-black italic tracking-tighter uppercase leading-[1] text-center flex flex-col items-center">
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
            <h3 className="text-sm md:text-2xl font-medium text-gray-500 tracking-tight max-w-2xl mx-auto leading-relaxed text-center px-6">
              Diseños pensados para <span className="text-petroleum font-black italic">convertir visitas en ventas.</span>
            </h3>
          </div>

          <div className="flex flex-row justify-center gap-4 md:gap-16 pt-8 relative z-50 w-full px-2">
            {[
              { icon: <Library size={20} />, label: "+80 plantillas" },
              { icon: <Palette size={20} />, label: "Personalización" },
              { icon: <Zap size={20} />, label: "Cero Código" }
            ].map((f, i) => (
              <div 
                key={i} 
                className="relative group flex-1 max-w-[100px]"
                onClick={() => setSelectedFeature(i)}
              >
                <motion.div 
                  className="flex flex-col items-center gap-2 cursor-pointer"
                >
                  <div 
                    className={`h-12 w-12 md:h-20 md:w-20 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-sm border border-gray-100 transition-all duration-700 
                      ${selectedFeature === i ? 'bg-cyan text-white shadow-[0_0_20px_rgba(0,242,255,0.6)]' : 'bg-petroleum/5 text-petroleum'}
                    `}
                  >
                    {f.icon}
                  </div>
                  <p className="text-[7px] md:text-[11px] font-black uppercase tracking-wider text-gray-500 text-center leading-tight">{f.label}</p>
                </motion.div>
              </div>
            ))}
          </div>
          
          {/* Central Modal Overlay */}
          <AnimatePresence>
            {selectedFeature !== null && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  onClick={() => setSelectedFeature(null)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998] cursor-pointer"
                />
                
                <div className="fixed inset-0 flex items-center justify-center z-[10000] pointer-events-none">
                  {[
                    { 
                      icon: <Library size={48} />, 
                      title: "Catálogo de Conversión",
                      desc: "Nuestras plantillas no solo son estéticas, están diseñadas con psicología de ventas para convertir visitantes en compradores desde el primer clic. Cada diseño ha sido probado para maximizar el ROI."
                    },
                    { 
                      icon: <Palette size={48} />, 
                      title: "Libertad Creativa",
                      desc: "Rompe los límites. Nuestro sistema de diseño flexible te permite crear una tienda virtual que sea un reflejo exacto de tu imaginación, sin restricciones de rejillas ni códigos complejos."
                    },
                    { 
                      icon: <Zap size={48} />, 
                      title: "Visual Drag & Drop",
                      desc: "Construye interfaces complejas con la simplicidad de un juego. Arrastra, suelta y publica. Elimina las barreras técnicas y enfócate 100% en hacer crecer tu negocio."
                    }
                  ].map((f, i) => (
                    selectedFeature === i && (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.2, rotateY: -180 }}
                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                        exit={{ opacity: 0, scale: 0.2, rotateY: -180 }}
                        transition={{ 
                          type: "spring", 
                          damping: 25, 
                          stiffness: 150,
                          duration: 0.5
                        }}
                        className="bg-white/95 backdrop-blur-2xl border border-white/40 p-12 rounded-[4rem] shadow-2xl max-w-xl w-[90%] text-center pointer-events-auto relative overflow-hidden"
                      >
                         <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan/20 to-transparent -z-10" />
                         
                         <button 
                          onClick={() => setSelectedFeature(null)}
                          className="absolute top-8 right-8 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500"
                         >
                           <X size={24} />
                         </button>

                         <div className="flex flex-col items-center gap-8">
                            <motion.div 
                              initial={{ rotate: -10 }}
                              animate={{ rotate: 0 }}
                              className="h-28 w-28 rounded-[2rem] bg-gradient-to-br from-petroleum to-cyan text-white flex items-center justify-center shadow-2xl shadow-cyan/40"
                            >
                              {f.icon}
                            </motion.div>
                            <div className="space-y-6">
                              <h4 className="text-4xl font-black italic uppercase tracking-tighter text-petroleum leading-none">{f.title}</h4>
                              <p className="text-gray-600 text-base leading-relaxed font-medium px-4">{f.desc}</p>
                            </div>
                            <button 
                              onClick={() => setSelectedFeature(null)}
                              className="mt-6 px-10 py-4 bg-petroleum text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-cyan transition-all hover:scale-105 shadow-xl active:scale-95"
                            >
                              Entendido
                            </button>
                         </div>
                      </motion.div>
                    )
                  ))}
                </div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* XL Circular 3D Carousel */}
        <div className="relative h-[450px] md:h-[650px] flex items-center justify-center perspective-[4000px] -mt-12 md:-mt-10">
          <div className="relative w-full h-full flex items-center justify-center">
            
            {/* Nav Controls - Solo Desktop */}
            <button onClick={() => rotate(1)} className="hidden md:flex absolute left-0 md:left-10 z-[100] h-14 w-14 md:h-20 md:w-20 rounded-full border-2 border-white bg-white/40 backdrop-blur-3xl items-center justify-center text-petroleum hover:bg-petroleum hover:text-white transition-all shadow-2xl active:scale-90">
              <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
            </button>
            <button onClick={() => rotate(-1)} className="hidden md:flex absolute right-0 md:right-10 z-[100] h-14 w-14 md:h-20 md:w-20 rounded-full border-2 border-white bg-white/40 backdrop-blur-3xl items-center justify-center text-petroleum hover:bg-petroleum hover:text-white transition-all shadow-2xl active:scale-90">
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
                    className="absolute w-[85vw] max-w-[800px] aspect-[16/11] md:aspect-[16/9] preserve-3d" 
                    style={{ transform: `rotateY(${angle}deg) translateZ(850px)` }}
                  >
                    <motion.div 
                      animate={{ 
                        opacity: activeIndex === i ? 1 : 0.15, 
                        scale: activeIndex === i ? 1.1 : 0.7, 
                        filter: activeIndex === i ? "blur(0px)" : "blur(12px)"
                      }}
                      className="relative w-full h-full rounded-[4rem] overflow-hidden border-2 border-white shadow-[0_80px_150px_-30px_rgba(0,0,0,0.3)] group cursor-pointer isolate"
                    >
                      <img src={t.image} alt={t.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                      
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

const X = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
);