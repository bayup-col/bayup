/* LOADER_VERSION_3.0_STABLE */
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const PageLoader = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    // PASO 1: El logo aparece solo durante 1 segundo
    const barTimer = setTimeout(() => {
      setShowBar(true);
    }, 1000);

    return () => clearTimeout(barTimer);
  }, []);

  useEffect(() => {
    if (!showBar) return;

    // PASO 2: Carga de la barra fluida (2 segundos)
    const duration = 2000; 
    const startTime = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      
      setProgress(newProgress);

      if (newProgress < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        setTimeout(onComplete, 500); // Respiro final rápido
      }
    };

    requestAnimationFrame(updateProgress);
  }, [showBar, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1 } }}
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center"
    >
      <div className="flex flex-col items-center gap-16 w-full max-w-md px-8">
        
        {/* Logo BAYUP Blanco Puro - Tamaño Aumentado para PC/Móvil */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="text-6xl md:text-9xl font-black italic tracking-tighter text-white select-none"
        >
          BAYUP.
        </motion.div>

        {/* Barra de Carga Blanca - Diseño Ultra Fino y Elegante */}
        <div className="w-full max-w-[300px] h-[1.5px] bg-white/10 overflow-hidden relative">
          {showBar && (
            <motion.div 
              className="h-full bg-white"
              style={{ width: `${progress}%` }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};
