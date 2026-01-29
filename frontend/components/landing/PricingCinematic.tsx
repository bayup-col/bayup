"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { useRef, useState } from "react";

export const PricingCinematic = () => {
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
    setMousePos({ x: 95, y: 15 }); // Reset to top of R
  };

  return (
    <section id="planes" className="py-40 bg-surface relative overflow-hidden isolate shadow-inner">
      {/* Auras de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-petroleum/5 rounded-full blur-[180px] -z-10" />

      <div className="container mx-auto px-12 text-center">
        
        <div className="max-w-4xl mx-auto mb-24 space-y-6">
          <p className="text-cyan font-black uppercase tracking-[0.5em] text-[10px]">Investment Models</p>
          <h2 className="text-6xl md:text-8xl font-black text-black italic tracking-tighter uppercase leading-[0.85]">
            PLANES DE <span 
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
              PODER.
            </span>
          </h2>
          <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Selecciona el motor que impulsará tu próximo nivel de crecimiento.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto">
          {[
            { name: 'Starter', price: '$0', color: 'bg-white/10', accent: 'text-gray-400', popular: false },
            { name: 'Pro Elite', price: '$99', color: 'bg-petroleum text-white', accent: 'text-cyan', popular: true },
            { name: 'Quantum', price: 'Custom', color: 'bg-white/10', accent: 'text-gray-400', popular: false },
          ].map((plan, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -15, scale: 1.02 }}
              className={`relative p-12 rounded-[4.5rem] overflow-hidden group transition-all duration-700 isolate flex flex-col ${plan.popular ? 'shadow-[0_50px_100px_-20px_rgba(0,77,77,0.4)]' : 'shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)]'}`}
            >
              {/* AURORA TRACING BEAM EFFECT - RE-ENGINEERED */}
              <div className="absolute inset-0 rounded-[4.5rem] overflow-hidden -z-10">
                {/* Rayo de luz rotativo con animación forzada */}
                <div 
                  className="absolute top-1/2 left-1/2 w-[250%] aspect-square animate-aurora opacity-60 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background: `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)`,
                    willChange: 'transform'
                  }}
                />
                
                {/* Relleno Glass/Sólido que actúa como máscara del borde */}
                <div className={`absolute inset-[2px] rounded-[4.4rem] backdrop-blur-[100px] ${plan.popular ? 'bg-petroleum' : 'bg-white/90'}`} />
              </div>

              {plan.popular && (
                <div className="absolute top-10 right-10 px-5 py-1.5 bg-cyan text-black text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_30px_rgba(0,242,255,0.6)] z-20">
                  Recommended
                </div>
              )}
              
              <div className="space-y-10 relative z-10 flex-1 flex flex-col">
                <h3 className={`text-3xl font-black italic uppercase tracking-tighter ${plan.accent}`}>{plan.name}</h3>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-7xl font-black italic tracking-tighter ${plan.popular ? 'text-white' : 'text-black'}`}>{plan.price}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${plan.popular ? 'text-white/40' : 'text-black/20'}`}>/Monthly</span>
                  </div>
                </div>
                
                <div className={`h-[1px] w-full ${plan.popular ? 'bg-white/10' : 'bg-petroleum/10'}`} />
                
                <ul className="space-y-5 flex-1">
                  {['Unlimited Scale', 'Advanced Bayt AI', 'Global Edge Nodes', 'Quantum Security'].map((feat, j) => (
                    <li key={j} className={`flex items-center gap-4 text-[10px] font-black uppercase tracking-widest ${plan.popular ? 'text-white/70' : 'text-gray-500'}`}>
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.popular ? 'bg-white/10' : 'bg-petroleum/10'}`}>
                        <Check size={12} className={plan.popular ? "text-cyan" : "text-petroleum"} />
                      </div>
                      {feat}
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-6 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 active:scale-95 ${plan.popular ? 'bg-white text-black hover:bg-cyan shadow-2xl' : 'bg-petroleum text-white hover:bg-black shadow-xl'}`}>
                  Activate Engine <ArrowRight size={14} />
                </button>
              </div>

              {/* Brillo de barrido cinemático */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-[1200ms] ease-in-out pointer-events-none" />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};