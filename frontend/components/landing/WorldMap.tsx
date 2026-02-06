"use client";

import React from 'react';
import { motion } from 'framer-motion';

export const WorldMap = () => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center pointer-events-none opacity-50">
      <div className="relative w-full max-w-[1200px] aspect-[2/1] px-10">
        
        {/* Imagen del Mapa Realista */}
        <motion.img 
          src="/assets/mundobayup.png"
          alt="World Map"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(0,242,255,0.2)]"
        />

        {/* Capa de Puntos de Pulso (Superpuesta) */}
        <div className="absolute inset-0">
          {[
            { top: '35%', left: '25%' }, // North America
            { top: '65%', left: '32%' }, // South America
            { top: '30%', left: '50%' }, // Europe
            { top: '55%', left: '55%' }, // Africa
            { top: '35%', left: '75%' }, // Asia
            { top: '75%', left: '85%' }, // Australia
          ].map((point, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-cyan rounded-full shadow-[0_0_10px_#00f2ff]"
              style={{ top: point.top, left: point.left }}
            >
              <motion.div
                className="absolute inset-0 rounded-full border border-cyan"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 4, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              />
            </motion.div>
          ))}
        </div>
        
      </div>
    </div>
  );
};