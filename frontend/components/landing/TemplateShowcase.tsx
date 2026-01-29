"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, LayoutTemplate, Palette, Zap } from "lucide-react";

const templates = [
  { id: 1, title: "Luxe Fashion", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop", category: "Moda" },
  { id: 2, title: "Tech Pulse", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop", category: "Tecnología" },
  { id: 3, title: "Organic Essence", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=1200&auto=format&fit=crop", category: "Salud" },
  { id: 4, title: "Urban Gear", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop", category: "Deportes" },
  { id: 5, title: "Gourmet Studio", image: "https://images.unsplash.com/photo-1556910103-1c02745a309e?q=80&w=1200&auto=format&fit=crop", category: "Alimentos" },
];

export const TemplateShowcase = () => {
  const [rotation, setRotation] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const rotate = (dir: number) => {
    setRotation(prev => prev + (dir * 72));
    setActiveIndex(prev => (prev - dir + templates.length) % templates.length);
  };

  useEffect(() => {
    const timer = setInterval(() => rotate(-1), 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="templates" className="py-40 bg-[#FFFFFF] relative overflow-hidden isolate">
      {/* Massive Aura background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-petroleum/5 rounded-full blur-[200px] -z-10 animate-pulse" />

      <div className="container mx-auto px-6 text-center space-y-8 relative z-50">
        
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-4">
            <p className="text-cyan font-black uppercase tracking-[0.5em] text-[10px]">Unlimited Creativity</p>
            <h2 className="text-6xl md:text-8xl font-black text-black italic tracking-tighter uppercase leading-[0.9]">
              DISEÑO QUE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum via-cyan to-petroleum">INSPIRA.</span>
            </h2>
            <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] max-w-xl mx-auto">
              Elige entre más de 200 plantillas totalmente personalizables. <br />
              Tu marca merece una vitrina de clase mundial.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-12 pt-4">
            {[
              { icon: <LayoutTemplate size={24} />, label: "200+ Layouts" },
              { icon: <Palette size={24} />, label: "Full Custom" },
              { icon: <Zap size={24} />, label: "Zero Code" }
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-petroleum/5 text-petroleum flex items-center justify-center shadow-sm border border-gray-100">{f.icon}</div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{f.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* XL Circular 3D Carousel */}
        <div className="relative h-[650px] flex items-center justify-center perspective-[4000px] -mt-10">
          <div className="relative w-full h-full flex items-center justify-center">
            
            {/* Nav Controls - Now further to edges */}
            <button onClick={() => rotate(1)} className="absolute left-0 md:left-10 z-[100] h-20 w-20 rounded-full border-2 border-white bg-white/40 backdrop-blur-3xl flex items-center justify-center text-petroleum hover:bg-petroleum hover:text-white transition-all shadow-2xl active:scale-90"><ChevronLeft size={32} /></button>
            <button onClick={() => rotate(-1)} className="absolute right-0 md:right-10 z-[100] h-20 w-20 rounded-full border-2 border-white bg-white/40 backdrop-blur-3xl flex items-center justify-center text-petroleum hover:bg-petroleum hover:text-white transition-all shadow-2xl active:scale-90"><ChevronRight size={32} /></button>

            {/* The Stage */}
            <div 
              className="relative w-full h-full flex items-center justify-center preserve-3d transition-transform duration-1000 ease-[0.16,1,0.3,1]" 
              style={{ transform: `rotateY(${rotation}deg)` }}
            >
              {templates.map((t, i) => {
                const angle = i * 72;
                return (
                  <div 
                    key={t.id} 
                    className="absolute w-[90vw] max-w-[800px] aspect-[16/9] preserve-3d" 
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
                      
                      {/* Glass Info Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-12 text-left">
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          whileHover={{ y: 0, opacity: 1 }}
                          className="space-y-2"
                        >
                          <p className="text-cyan text-xs font-black uppercase tracking-[0.4em]">{t.category}</p>
                          <h4 className="text-white text-4xl font-black italic uppercase tracking-tighter leading-none">{t.title}</h4>
                          <button className="mt-6 px-8 py-3 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-cyan transition-all">Ver Plantilla</button>
                        </motion.div>
                      </div>

                      {/* Diamond edge reflection */}
                      <div className="absolute inset-0 border-[3px] border-white/20 rounded-[4rem] pointer-events-none z-20" />
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
