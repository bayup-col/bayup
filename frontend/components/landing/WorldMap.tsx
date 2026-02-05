"use client";

import React from 'react';
import { motion } from 'framer-motion';

export const WorldMap = () => {
  const points = [
    { x: 210, y: 140, delay: 0 }, { x: 505, y: 115, delay: 0.5 },
    { x: 790, y: 180, delay: 1 }, { x: 285, y: 360, delay: 0.5 },
    { x: 560, y: 310, delay: 1.5 }, { x: 860, y: 410, delay: 2 },
    { x: 130, y: 180, delay: 0.8 }, { x: 650, y: 160, delay: 1.2 },
  ];

  return (
    <div className="absolute inset-0 w-full h-full bg-[#050505] overflow-hidden flex items-center justify-center pointer-events-none">
      <div className="relative w-full max-w-[1400px] aspect-[2/1] opacity-70">
        
        {/* Usamos una imagen SVG real de un mapa de puntos para máxima fidelidad */}
        <div 
          className="absolute inset-0 w-full h-full opacity-30"
          style={{
            backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAwIDUwMCI+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMTUwIiByPSIxLjUiIGZpbGw9IiMwMGYyZmYiLz48Y2lyY2xlIGN4PSIyMTAiIGN5PSIxNTAiIHI9IjEuNSIgZmlsbD0iIzAwZjJmZiIvPjxjaXJjbGUgY3g9IjIyMCIgY3k9IjE1MCIgcj0iMS41IiBmaWxsPSIjMDBmMmZmIi8+PC9zdmc+')`,
            backgroundSize: '100% 100%',
            maskImage: 'radial-gradient(circle at center, black 60%, transparent 100%)'
          }}
        />

        <svg viewBox="0 0 1000 500" className="w-full h-full relative z-10">
          {/* Geometría de Continentes Realista (Simplificada pero reconocible) */}
          <g fill="#00f2ff" fillOpacity="0.15">
            {/* Norteamérica */}
            <path d="M100,100 L250,100 L280,180 L220,250 L150,230 L80,150 Z" />
            {/* Sudamérica */}
            <path d="M230,260 L320,260 L350,350 L300,450 L250,450 L220,350 Z" />
            {/* Eurasia */}
            <path d="M450,50 L850,50 L900,150 L850,300 L600,320 L500,250 L450,150 Z" />
            {/* África */}
            <path d="M480,220 L620,220 L650,350 L580,450 L500,400 Z" />
            {/* Australia */}
            <path d="M800,350 L920,350 L950,450 L850,480 Z" />
          </g>

          {/* Arcos de Conexión */}
          {points.map((p, i) => {
            const next = points[(i + 1) % points.length];
            return (
              <motion.path
                key={i}
                d={`M${p.x},${p.y} Q${(p.x + next.x)/2},${(p.y + next.y)/2 - 60} ${next.x},${next.y}`}
                fill="none"
                stroke="rgba(0, 242, 255, 0.4)"
                strokeWidth="0.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
              />
            );
          })}

          {/* Nodos Brillantes */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="2" fill="#00f2ff" />
              <motion.circle
                cx={p.x}
                cy={p.y}
                r="8"
                stroke="#00f2ff"
                strokeWidth="1"
                fill="none"
                animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]" />
      <div 
        className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(#00f2ff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
    </div>
  );
};