"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface RollingTextProps {
  text: string;
  className?: string; // Aquí pasaremos el degradado
  delay?: number;
}

export const RollingText = ({ text, className = "", delay = 0 }: RollingTextProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Dividimos por caracteres para un control total, manteniendo los espacios
  const chars = text.split("");

  return (
    <span 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="inline-flex flex-wrap justify-center cursor-default"
    >
      {chars.map((char, i) => (
        <span key={i} className="relative inline-block overflow-hidden h-[1.2em]">
          {/* Caracter Base (Estatico o primera posición) */}
          <motion.span
            animate={{ y: isHovered ? "-100%" : 0 }}
            initial={{ y: 0 }}
            transition={{
              duration: 0.6,
              delay: isHovered ? (i * 0.02) : (delay + (i * 0.03)),
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`inline-block ${className}`}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
          
          {/* Caracter que entra rodando (Segunda posición) */}
          <motion.span
            animate={{ y: isHovered ? 0 : "100%" }}
            initial={{ y: "100%" }}
            transition={{
              duration: 0.6,
              delay: isHovered ? (i * 0.02) : 0,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`absolute left-0 top-0 inline-block ${className}`}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        </span>
      ))}
    </span>
  );
};
