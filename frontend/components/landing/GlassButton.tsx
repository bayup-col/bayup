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
      whileHover={{ scale: 1.015, y: -1 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`
        relative px-9 py-4 rounded-full
        border
        flex items-center justify-center gap-2.5
        cursor-pointer overflow-hidden group
        transition-all duration-300
        ${isPrimary
          ? 'bg-[#00F2FF] border-white/30 shadow-[0_8px_24px_-6px_rgba(0,242,255,0.35)] text-[#003333] hover:shadow-[0_12px_32px_-6px_rgba(0,242,255,0.5)] hover:bg-[#1AF5FF]'
          : isDark
            ? 'bg-white/10 backdrop-blur-xl border-white/15 text-white hover:bg-white/[0.15] hover:border-white/25'
            : 'bg-white/40 backdrop-blur-xl border-gray-200/60 text-gray-900 hover:bg-white/60'
        }
        ${className}
      `}
    >
      {/* Content */}
      <div className="relative z-20 flex items-center gap-2">
         {icon}
         <span className={`font-semibold text-[13px] tracking-wide ${isPrimary ? 'text-[#003333]' : isDark ? 'text-white' : 'text-gray-900'}`}>
          {children}
         </span>
      </div>
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
