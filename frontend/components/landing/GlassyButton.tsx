"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface GlassyButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "dark" | "light";
}

export const GlassyButton = ({ href, children, variant = "dark" }: GlassyButtonProps) => {
  const isLight = variant === "light";

  return (
    <Link href={href} className="relative group">
      <motion.div
        whileHover={{ scale: 1.1, y: -4 }}
        whileTap={{ scale: 0.95 }}
        className="relative px-5 py-5 rounded-[1.5rem] overflow-hidden isolate flex items-center justify-center transition-all duration-500"
      >
        {/* 1. AURORA EFFECT CONTAINER */}
        <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden -z-10">
          {/* Rayo de luz rotativo (Aurora) */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 w-[300%] aspect-square"
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)`,
              x: "-50%",
              y: "-50%",
              willChange: 'transform'
            }}
          />
          
          {/* Relleno Glass (Máscara del borde) */}
          <div className={`
            absolute inset-[2px] rounded-[1.4rem] backdrop-blur-3xl transition-all duration-500
            ${isLight 
              ? 'bg-white/95 shadow-[0_20px_40px_-10px_rgba(0,77,77,0.2)] group-hover:bg-white' 
              : 'bg-black/80'
            }
          `} />
        </div>
        
        {/* 2. Brillo de Borde Superior (Relieve Físico) */}
        {isLight && (
          <div className="absolute inset-0 border border-t-white/80 border-l-white/80 border-transparent rounded-[1.5rem] pointer-events-none" />
        )}

        {/* 3. Contenido (Icono/Texto) */}
        <span className={`
          relative z-10 font-black transition-colors duration-300
          ${isLight ? 'text-[#004d4d] group-hover:text-black' : 'text-white'}
        `}>
          {children}
        </span>

        {/* 4. Glow exterior reactivo */}
        {isLight && (
          <div className="absolute inset-0 bg-[#00f2ff]/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-20" />
        )}
      </motion.div>
    </Link>
  );
};
