"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export const WorldMap = () => {
  // Coordenadas geográficas reales escaladas a un SVG de 1000x500
  const connections = useMemo(() => [
    { start: { x: 230, y: 160 }, end: { x: 485, y: 140 } }, // NY -> Londres
    { start: { x: 485, y: 140 }, end: { x: 590, y: 250 } }, // Londres -> Dubai
    { start: { x: 285, y: 360 }, end: { x: 230, y: 160 } }, // Sao Paulo -> NY
    { start: { x: 590, y: 260 }, end: { x: 790, y: 200 } }, // Dubai -> Tokio
    { start: { x: 790, y: 200 }, end: { x: 860, y: 390 } }, // Tokio -> Sídney
  ], []);

  return (
    <div className="absolute inset-0 w-full h-full bg-[#050505] overflow-hidden flex items-center justify-center">
      {/* 1. Resplandor Atmosférico de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.05)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative w-full max-w-[1400px] aspect-[2/1] scale-110 lg:scale-100 px-10">
        <svg viewBox="0 0 1000 500" className="w-full h-full relative z-10 pointer-events-none">
          <defs>
            {/* Máscara de Continentes de ALTA RESOLUCIÓN */}
            <mask id="world-high-res">
              <g fill="white">
                {/* Geometría de continentes refinada */}
                <path d="M100,100 C150,50 300,50 350,150 C380,250 250,280 150,250 C100,220 80,150 100,100 Z" /> {/* Norteamérica */}
                <path d="M380,20 L450,20 L430,70 L390,70 Z" /> {/* Groenlandia */}
                <path d="M240,280 C350,280 400,350 350,480 C300,490 250,450 230,350 C210,300 220,280 240,280 Z" /> {/* Sudamérica */}
                <path d="M460,220 C600,180 680,250 680,350 C680,450 600,480 500,450 C460,420 450,300 460,220 Z" /> {/* África */}
                <path d="M450,150 C500,50 900,50 950,150 C980,250 900,350 750,350 C650,350 500,250 450,150 Z" /> {/* Eurasia */}
                <path d="M820,380 C950,380 980,450 850,500 C800,500 780,450 820,380 Z" /> {/* Australia */}
                <circle cx="790" cy="200" r="10" /> {/* Japón */}
                <circle cx="750" cy="320" r="8" /> {/* Sudeste Asiático */}
              </g>
            </mask>

            {/* Patrón de puntos "Framer Style" */}
            <pattern id="framer-dots" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#00f2ff" fillOpacity="0.4" />
            </pattern>

            {/* Gradiente de Arcos */}
            <linearGradient id="glow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f2ff" stopOpacity="0" />
              <stop offset="50%" stopColor="#00f2ff" stopOpacity="1" />
              <stop offset="100%" stopColor="#00f2ff" stopOpacity="0" />
            </linearGradient>

            <filter id="world-blur">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          {/* Sombra de contorno (Aporta profundidad) */}
          <rect width="1000" height="500" fill="#00f2ff" fillOpacity="0.05" mask="url(#world-high-res)" filter="url(#world-blur)" />

          {/* Malla de Puntos Geográfica */}
          <rect width="1000" height="500" fill="url(#framer-dots)" mask="url(#world-high-res)" />

          {/* Conexiones Globales Animadas */}
          {connections.map((conn, i) => (
            <g key={i}>
              {/* Arco base sutil */}
              <path
                d={`M${conn.start.x},${conn.start.y} Q${(conn.start.x + conn.end.x)/2},${(conn.start.y + conn.end.y)/2 - 60} ${conn.end.x},${conn.end.y}`}
                fill="none"
                stroke="rgba(0, 242, 255, 0.1)"
                strokeWidth="1"
              />
              
              {/* Partícula de luz viajera */}
              <motion.path
                d={`M${conn.start.x},${conn.start.y} Q${(conn.start.x + conn.end.x)/2},${(conn.start.y + conn.end.y)/2 - 60} ${conn.end.x},${conn.end.y}`}
                fill="none"
                stroke="url(#glow-gradient)"
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: [0, 1, 0] }}
                transition={{ 
                  duration: 4 + Math.random() * 2, 
                  repeat: Infinity, 
                  delay: i * 0.5,
                  ease: "easeInOut" 
                }}
              />
              
              <circle cx={conn.start.x} cy={conn.start.y} r="2.5" fill="#00f2ff" className="drop-shadow-[0_0_10px_#00f2ff]" />
              <motion.circle
                cx={conn.start.x}
                cy={conn.start.y}
                r="8"
                stroke="#00f2ff"
                strokeWidth="1"
                fill="none"
                animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              />
            </g>
          ))}
        </svg>
      </div>

      {/* 4. Gradientes de Integración Cinematográfica */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505] z-20" />
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-20" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-20" />
    </div>
  );
};