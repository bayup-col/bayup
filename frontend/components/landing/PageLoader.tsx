"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export const PageLoader = ({ onComplete }: { onComplete: () => void }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2500; // 2.5 segundos
    const interval = 20;
    const steps = duration / interval;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      setCount((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 800); // Respiro cinematográfico
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ 
        y: "-100%", 
        filter: "blur(40px)",
        opacity: 0,
        transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } 
      }}
      className="fixed inset-0 z-[200] bg-[#0B0B0B] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Fondo con rejilla técnica sutil */}
      <div className="absolute inset-0 opacity-[0.05]" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} 
      />
      
      {/* Aura central Cyan */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute w-[500px] h-[500px] bg-cyan/20 rounded-full blur-[120px]"
      />

      <div className="relative z-10 flex flex-col items-center">
        
        {/* SVG Circular Progress Bar */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Círculo de fondo (Track) */}
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              className="text-white/5"
            />
            {/* Círculo de progreso animado */}
            <motion.circle
              cx="128"
              cy="128"
              r="120"
              stroke="#00f2ff"
              strokeWidth="3"
              strokeLinecap="round"
              fill="transparent"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: count / 100 }}
              style={{
                filter: "drop-shadow(0 0 10px #00f2ff)",
              }}
              transition={{ duration: 0.2, ease: "linear" }}
            />
          </svg>

          {/* Contador Central */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              className="text-6xl font-black text-white italic tracking-tighter tabular-nums"
            >
              {Math.round(count)}
            </motion.span>
            <span className="text-xs font-black text-cyan uppercase tracking-[0.4em] mt-2">
              System Ready
            </span>
          </div>
        </div>

        {/* Info Inferior */}
        <div className="mt-20 space-y-4 text-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] font-black text-white/30 uppercase tracking-[0.8em] italic"
          >
            Bayup Intelligence
          </motion.div>
          <div className="flex gap-1 justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                className="h-1 w-1 bg-cyan rounded-full shadow-[0_0_8px_#00f2ff]"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Efecto de Scanline */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-scanline h-2 w-full animate-scanline" />
    </motion.div>
  );
};