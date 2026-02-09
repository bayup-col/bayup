"use client";

import { motion } from "framer-motion";
import React from "react";

interface WhatsAppFloatingButtonProps {
  hidden: boolean;
}

export const WhatsAppFloatingButton = ({ hidden }: WhatsAppFloatingButtonProps) => {
  // Número de WhatsApp oficial de Bayup
  const phoneNumber = "573014484127";
  const message = encodeURIComponent("¡quiero tener mi pagina web hoy!, ¿me puedes ayudar?");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`; 

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: hidden ? 0 : 1, 
        opacity: hidden ? 0 : 1,
        y: hidden ? 100 : 0 
      }}
      transition={{ 
        duration: 0.5, 
        ease: [0.16, 1, 0.3, 1],
        delay: hidden ? 0 : 0.2 // Aparece con un pequeño delay para elegancia
      }}
      className="fixed bottom-8 right-8 z-[100] pointer-events-auto"
    >
      <a 
        href={whatsappUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block group relative"
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          className="relative h-16 w-16 md:h-20 md:w-20 rounded-full overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-white/10"
        >
          <img 
            src="/assets/Neon-Red-Animated-and-Bright-Twitch-Logo-_8_.webp" 
            alt="WhatsApp Support" 
            className="h-full w-full object-cover"
          />
          
          {/* Overlay sutil para dar sensación de botón */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
        </motion.div>

        {/* Badge de "Online" sutil */}
        <span className="absolute top-1 right-1 h-4 w-4 bg-[#10B981] rounded-full border-2 border-white animate-pulse shadow-lg" />
      </a>
    </motion.div>
  );
};
