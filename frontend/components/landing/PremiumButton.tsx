"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface PremiumButtonProps {
  href: string;
  children: React.ReactNode;
}

export const PremiumButton = ({ href, children }: PremiumButtonProps) => {
  return (
    <Link href={href} className="relative group inline-block">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        className="relative p-[1px] rounded-xl overflow-hidden"
      >
        {/* 1. Animación de Borde Giratorio (Shimmer) */}
        <div 
          className="absolute top-1/2 left-1/2 w-[300%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-aurora opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, transparent 300deg, #00f2ff 330deg, #004d4d 360deg)`,
          }}
        />

        {/* 2. Cuerpo del Botón */}
        <div className="relative px-6 py-2.5 bg-black rounded-[calc(0.75rem-1px)] flex items-center justify-center border border-white/10 group-hover:border-transparent transition-colors duration-500">
          <span className="relative z-10 text-white font-black text-[9px] uppercase tracking-[0.3em] group-hover:text-cyan transition-colors duration-300">
            {children}
          </span>
        </div>

        {/* 3. Glow Exterior sutil */}
        <div className="absolute inset-0 shadow-[0_0_20px_rgba(0,242,255,0)] group-hover:shadow-[0_0_25px_rgba(0,242,255,0.15)] transition-all duration-500 rounded-xl" />
      </motion.div>
    </Link>
  );
};
