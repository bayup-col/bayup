/* FINAL_SYNC_3SEC_DEPLOY */
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const PageLoader = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    // PASO 1: El logo aparece solo durante 1 segundo para agilizar la entrada
    const barTimer = setTimeout(() => {
      setShowBar(true);
    }, 1000);

    // SEGURIDAD: Timeout de emergencia para no quedar colgado (5 segundos)
    const safetyTimer = setTimeout(() => {
        onComplete();
    }, 5000);

    return () => {
        clearTimeout(barTimer);
        clearTimeout(safetyTimer);
    };
  }, [onComplete]);

  useEffect(() => {
    if (!showBar) return;

    // PASO 2: Carga de la barra en 2 segundos (Total 3s)
    const duration = 2000; 
    const startTime = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      
      setProgress(newProgress);

      if (newProgress < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        setTimeout(onComplete, 400); // Salida inmediata al terminar
      }
    };

    requestAnimationFrame(updateProgress);
  }, [showBar, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center"
    >
      <div className="flex flex-col items-center gap-12 w-full max-w-sm px-8">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-8xl font-black italic tracking-tighter text-white select-none"
        >
          BAYUP.
        </motion.div>

        <div className="w-full max-w-[240px] h-[1.5px] bg-white/10 overflow-hidden relative">
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
