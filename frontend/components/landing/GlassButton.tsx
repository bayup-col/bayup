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
  variant?: "light" | "dark" | "primary";
}

export const GlassButton = ({ children, href, onClick, className = "", icon, variant = "light" }: GlassButtonProps) => {
  const isDark = variant === "dark";
  const isPrimary = variant === "primary";

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
        ${isPrimary 
          ? 'bg-[#00F2FF] border-[#00F2FF]/50 shadow-[0_15px_35px_-5px_rgba(0,242,255,0.4)] text-[#004D4D] hover:bg-[#00D9E5]' 
          : isDark 
            ? 'bg-white/25 border-white/30 shadow-black/10 text-white hover:bg-white/35' 
            : 'bg-white/30 border-white/60 shadow-gray-200/50 text-gray-900 hover:bg-white/50'
        }
        ${className}
      `}
    >
      {/* Glossy Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isPrimary ? 'from-white/40 to-transparent' : isDark ? 'from-white/10 to-transparent' : 'from-white/40 to-transparent'} opacity-100`} />
      
      {/* Animated Shine & Star Pulse */}
      <div className="absolute inset-0 -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent z-10" />
      
      {/* Star Pulse Animation */}
      <motion.div 
        animate={{ 
          opacity: [0.2, 0.6, 0.2],
          scale: [1, 1.05, 1]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className={`absolute inset-0 bg-gradient-to-r ${isPrimary ? 'from-white/40 via-transparent to-white/40' : 'from-white/10 via-transparent to-white/10'} pointer-events-none`}
      />

      {/* Content */}
      <div className="relative z-20 flex items-center gap-2">
         {icon}
         <span className={`font-black text-[12px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] ${isPrimary ? 'text-[#004D4D]' : isDark ? 'text-white' : 'text-gray-900'} group-hover:tracking-[0.35em] transition-all duration-300`}>
          {children}
         </span>
      </div>
      
      {/* Inner Glow */}
      <div className={`absolute inset-0 rounded-2xl shadow-[inset_0_0_20px_rgba(255,255,255,0.2)] pointer-events-none`} />
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
