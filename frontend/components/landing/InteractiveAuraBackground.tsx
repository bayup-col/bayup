"use client";

import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { useEffect } from "react";

export const InteractiveAuraBackground = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Suavizado del movimiento
  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Obtenemos la posición relativa a la ventana
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Generamos el degradado dinámico usando useMotionTemplate para máxima fluidez
  const background = useMotionTemplate`radial-gradient(600px circle at ${springX}px ${springY}px, rgba(0, 242, 255, 0.15), transparent 80%)`;

  return (
    <div className="absolute inset-0 w-full h-full bg-[#050505] overflow-hidden pointer-events-none">
      {/* 1. MESH GRADIENTS ANIMADOS (BLOBS) */}
      <motion.div 
        animate={{ 
          x: [0, 150, 0],
          y: [0, 100, 0],
          scale: [1, 1.4, 1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#004d4d]/30 rounded-full blur-[120px]"
      />
      <motion.div 
        animate={{ 
          x: [0, -120, 0],
          y: [0, 150, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#00f2ff]/10 rounded-full blur-[100px]"
      />

      {/* 2. SPOTLIGHT INTERACTIVO (CORREGIDO) */}
      <motion.div 
        className="absolute inset-0 z-10"
        style={{ background }}
      />

      {/* 3. GRID FUTURISTA SUTIL */}
      <div 
        className="absolute inset-0 opacity-[0.05] z-20"
        style={{ 
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />

      {/* 4. TEXTURA DE GRANO (NOISE) */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay z-30 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};
