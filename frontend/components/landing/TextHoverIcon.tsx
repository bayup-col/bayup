"use client";

import { motion } from "framer-motion";
import { Ghost } from "lucide-react";
import { useState } from "react";
import { InteractiveUP } from "./InteractiveUP";

export const TextHoverIcon = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex items-center cursor-pointer group w-fit"
    >
      {/* Texto de la Marca */}
      <motion.div
        animate={{ x: isHovered ? -15 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="flex items-center text-4xl font-black text-white italic tracking-tighter uppercase relative z-10"
      >
        <span>BAY</span>
        <InteractiveUP />
      </motion.div>

      {/* Icono del Fantasma (Ahora sale desde el lado de UP) */}
      <div className="absolute -right-8 overflow-hidden w-12 h-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, x: -20, scale: 0.5 }}
          animate={{ 
            opacity: isHovered ? 1 : 0, 
            x: isHovered ? 0 : -20,
            scale: isHovered ? 1.1 : 0.5,
            y: isHovered ? [0, -5, 0] : 0
          }}
          transition={{ 
            opacity: { duration: 0.2 },
            y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
            type: "spring", 
            stiffness: 200, 
            damping: 15 
          }}
          className="text-cyan drop-shadow-[0_0_12px_#00f2ff]"
        >
          <Ghost size={32} />
        </motion.div>
      </div>
    </motion.div>
  );
};
