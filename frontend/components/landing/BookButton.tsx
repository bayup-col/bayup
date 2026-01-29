"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ReactNode } from "react";

interface BookButtonProps {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary";
  icon?: ReactNode;
}

export const BookButton = ({ children, href, variant = "primary", icon }: BookButtonProps) => {
  const isPrimary = variant === "primary";

  return (
    <Link href={href} className="perspective-2000 group">
      <motion.div
        whileHover={{ rotateY: -25, rotateX: 5, scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="relative preserve-3d cursor-pointer"
      >
        {/* CARA FRONTAL (Cubierta) */}
        <div className={`
          relative z-20 px-10 py-5 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-3 border
          ${isPrimary 
            ? 'bg-black text-white border-white/10' 
            : 'bg-white text-black border-gray-100'
          }
          transition-colors duration-500 group-hover:border-cyan/30
        `}>
          {icon}
          {children}
        </div>

        {/* CARA LATERAL (El "Lomo" del libro) */}
        <div 
          className={`
            absolute top-0 right-0 h-full w-4 origin-right preserve-3d
            ${isPrimary ? 'bg-petroleum' : 'bg-gray-200'}
          `}
          style={{ transform: "rotateY(-90deg) translateX(100%)" }}
        >
          {/* Brillo en el lomo */}
          <div className="absolute inset-0 bg-gradient-to-l from-white/20 to-transparent" />
        </div>

        {/* CARA INFERIOR (Grosor) */}
        <div 
          className={`
            absolute bottom-0 left-0 w-full h-4 origin-bottom preserve-3d
            ${isPrimary ? 'bg-[#002d2d]' : 'bg-gray-300'}
          `}
          style={{ transform: "rotateX(-90deg) translateY(100%)" }}
        />

        {/* SOMBRA DINÁMICA */}
        <div className="absolute -bottom-4 left-4 right-4 h-8 bg-black/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
      </motion.div>
    </Link>
  );
};
