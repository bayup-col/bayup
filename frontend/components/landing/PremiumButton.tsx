"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface PremiumButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const PremiumButton = ({ href, onClick, children, className = "" }: PremiumButtonProps) => {
  const content = (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-[1.5px] rounded-[2.2rem] overflow-hidden group cursor-pointer transition-all duration-500 shadow-2xl hover:shadow-[#4fffcb]/20 ${className}`}
    >
      {/* 1. Animación de Borde Giratorio (Shimmer Aurora) */}
      <div 
        className="absolute top-1/2 left-1/2 w-[300%] aspect-square -translate-x-1/2 -translate-y-1/2 animate-aurora opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #4fffcb 310deg, #00f2ff 340deg, #004d4d 360deg)`,
        }}
      />

      {/* 2. Cuerpo del Botón */}
      <div className="relative px-10 py-5 bg-[#001A1A] rounded-[calc(2.2rem-1.5px)] flex items-center justify-center border border-white/5 group-hover:border-transparent transition-colors duration-500 shadow-inner z-10">
        <span className="relative z-20 text-white font-black text-[10px] uppercase tracking-[0.4em] group-hover:text-[#4fffcb] transition-colors duration-300 flex items-center gap-3 whitespace-nowrap">
          {children}
        </span>
      </div>

      {/* 3. Glow Exterior de Alta Intensidad */}
      <div className="absolute inset-0 rounded-[2.2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[#4fffcb]/10 blur-xl -z-10" />
    </motion.div>
  );

  if (href) {
    return <Link href={href} className="inline-flex outline-none">{content}</Link>;
  }

  return (
    <button 
      type="button"
      onClick={(e) => {
        e.preventDefault();
        if (onClick) onClick();
      }} 
      className="inline-flex outline-none focus:outline-none border-none bg-transparent p-0 m-0 cursor-pointer"
    >
      {content}
    </button>
  );
};

