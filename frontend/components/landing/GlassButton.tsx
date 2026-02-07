"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ReactNode } from "react";

interface GlassButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  icon?: ReactNode;
  variant?: "light" | "dark";
}

export const GlassButton = ({ children, href, onClick, className = "", icon, variant = "light" }: GlassButtonProps) => {
  const isDark = variant === "dark";

  const content = (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative px-10 py-5 rounded-2xl 
        backdrop-blur-xl 
        border 
        shadow-xl 
        flex items-center justify-center gap-3 
        cursor-pointer overflow-hidden group
        transition-all duration-300
        ${isDark 
          ? 'bg-white/25 border-white/30 shadow-black/10 text-white hover:bg-white/35' 
          : 'bg-white/30 border-white/60 shadow-gray-200/50 text-gray-900 hover:bg-white/50'
        }
        ${className}
      `}
    >
      {/* Glossy Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-white/10 to-transparent' : 'from-white/40 to-transparent'} opacity-100`} />
      
      {/* Animated Shine */}
      <div className="absolute inset-0 -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />

      {/* Content */}
      <div className="relative z-20 flex items-center gap-2">
         {icon}
         <span className={`font-black text-[10px] uppercase tracking-[0.3em] ${isDark ? 'text-white' : 'text-gray-900'} group-hover:tracking-[0.35em] transition-all duration-300`}>
          {children}
         </span>
      </div>
      
      {/* Inner Glow */}
      <div className={`absolute inset-0 rounded-2xl shadow-[inset_0_0_20px_rgba(255,255,255,0.1)] pointer-events-none`} />
    </motion.div>
  );

  if (href) {
    return <Link href={href} className="inline-block outline-none">{content}</Link>;
  }

  return (
    <button onClick={onClick} className="inline-block border-none bg-transparent p-0 outline-none">
      {content}
    </button>
  );
};
