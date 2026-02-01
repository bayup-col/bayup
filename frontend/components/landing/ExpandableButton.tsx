"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ReactNode, useState } from "react";

interface ExpandableButtonProps {
  href: string;
  baseText?: string;
  expandedText: string;
  icon?: ReactNode;
  variant?: "primary" | "ghost"; // primary for Register, ghost for Login
  className?: string;
}

export const ExpandableButton = ({ href, baseText, expandedText, icon, variant = "primary", className = "" }: ExpandableButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const isPrimary = variant === "primary";

  return (
    <Link href={href} className={`relative inline-flex items-center justify-center outline-none ${className}`}>
      <motion.div
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={`
          relative flex items-center overflow-hidden rounded-full transition-all duration-500 cursor-pointer
          ${isPrimary 
            ? 'bg-black text-white shadow-lg border border-white/10' 
            : 'bg-transparent text-black hover:bg-gray-100/50'
          }
        `}
        animate={{
          paddingLeft: isPrimary ? (isHovered ? 32 : 32) : (isHovered ? 20 : 14),
          paddingRight: isPrimary ? (isHovered ? 32 : 32) : (isHovered ? 20 : 14),
          paddingTop: isPrimary ? 18 : 12,
          paddingBottom: isPrimary ? 18 : 12,
          width: "auto"
        }}
        layout
      >
        <div className="relative z-10 flex items-center gap-3 whitespace-nowrap">
          {/* Icon Section (Always visible for Ghost, Optional for Primary) */}
          {icon && (
            <motion.div
              layout
              className="flex items-center justify-center"
            >
              {icon}
            </motion.div>
          )}

          {/* Text Section */}
          <div className="flex items-center text-[11px] font-black uppercase tracking-[0.3em]">
             {/* Base Text (e.g. REGISTRATE) */}
             {baseText && (
               <motion.span layout>
                 {baseText}
               </motion.span>
             )}

             {/* Expanded Text (e.g. GRATIS or INICIAR SESION) */}
             <AnimatePresence>
                {isHovered && (
                  <motion.span
                    initial={{ opacity: 0, width: 0, x: -5 }}
                    animate={{ opacity: 1, width: "auto", x: 0 }}
                    exit={{ opacity: 0, width: 0, x: -5 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={`overflow-hidden pl-1 ${isPrimary ? 'text-[#00F2FF] drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]' : 'text-black'}`}
                  >
                    {expandedText}
                  </motion.span>
                )}
             </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
