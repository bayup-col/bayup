"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ActionButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
  className?: string;
}

export const ActionButton = ({ href, children, variant = "primary", className }: ActionButtonProps) => {
  const isPrimary = variant === "primary";

  return (
    <Link href={href} className={cn("relative group inline-block", className)}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="relative"
      >
        {/* Borde Animado (Aurora Light) */}
        <div className="absolute -inset-[1px] rounded-[1.2rem] overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 w-[250%] aspect-square -translate-x-1/2 -translate-y-1/2"
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)`,
            }}
          />
        </div>

        {/* Cuerpo del Botón */}
        <div className={`
          relative px-8 py-4 rounded-[1.1rem] flex items-center justify-center gap-3 transition-all duration-500
          ${isPrimary 
            ? 'bg-[#001A1A] text-white shadow-[0_10px_30px_-10px_rgba(0,242,255,0.2)]' 
            : 'bg-white text-[#004d4d] border border-[#004d4d]/10'
          }
        `}>
          <div className="relative z-10 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3">
            {children}
          </div>
          
          {/* Brillo Glass (Reflejo) */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Glow Exterior */}
        <div className="absolute inset-0 bg-[#00f2ff]/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
      </motion.div>
    </Link>
  );
};
