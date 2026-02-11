"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import { useEffect, useState, useRef } from "react";

interface PixelTransitionProps {
  children: React.ReactNode;
  gridSize?: number;
  delay?: number;
}

export const PixelTransition = ({ children, gridSize = 10, delay = 0 }: PixelTransitionProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);
  
  // Detectar cuando el contenedor entra en el viewport (al 30% de visibilidad)
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => setIsVisible(true), delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [isInView, delay]);

  const pixels = Array.from({ length: gridSize * gridSize });

  return (
    <div ref={containerRef} className="relative isolate overflow-hidden rounded-[4rem]">
      {children}
      
      <div 
        className="absolute inset-0 grid pointer-events-none z-20"
        style={{ 
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)` 
        }}
      >
        <AnimatePresence>
          {!isVisible && pixels.map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 1 }}
              exit={{ 
                opacity: 0,
                scale: 0,
                transition: { 
                  duration: 0.4, 
                  delay: Math.random() * 0.8,
                  ease: "easeInOut"
                } 
              }}
              className="bg-[#F5F5F7]" // Color exacto del fondo Surface
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
