"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface GlassyButtonProps {
  href: string;
  children: React.ReactNode;
}

export const GlassyButton = ({ href, children }: GlassyButtonProps) => {
  return (
    <Link href={href} className="relative group">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative px-6 py-2.5 rounded-xl overflow-hidden isolate"
      >
        {/* 1. Fondo de Cristal (Base) */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl border border-white/20 transition-all duration-500 group-hover:bg-black group-hover:border-cyan/50" />
        
        {/* 2. Brillo de Cristal Superior (Reflejo) */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none" />

        {/* 3. Animación de Rayo de Luz (Scan) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            initial={{ x: "-150%", skewX: -45 }}
            animate={{ x: "150%", skewX: -45 }}
            transition={{ 
              repeat: Infinity, 
              duration: 2.5, 
              ease: "linear",
              repeatDelay: 1
            }}
            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
        </div>

        {/* 4. Texto con brillo */}
        <span className="relative z-10 text-white font-black text-[9px] uppercase tracking-[0.3em] group-hover:text-cyan transition-colors duration-300">
          {children}
        </span>

        {/* 5. Glow exterior al hacer hover */}
        <div className="absolute inset-0 shadow-[0_0_20px_rgba(0,242,255,0)] group-hover:shadow-[0_0_30px_rgba(0,242,255,0.2)] transition-all duration-500 rounded-2xl" />
      </motion.div>
    </Link>
  );
};
