"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const logos = [
  { id: 1, name: "Tech Nova", symbol: "TN" },
  { id: 2, name: "Luxe & Co", symbol: "LX" },
  { id: 3, name: "Horizon", symbol: "HG" },
  { id: 4, name: "Vogue", symbol: "VG" },
  { id: 5, name: "Gamer Zone", symbol: "GZ" },
  { id: 6, name: "Smart Life", symbol: "SL" },
  { id: 7, name: "Eco Wear", symbol: "EW" },
  { id: 8, name: "Apex Tech", symbol: "AX" },
];

function DockIcon({ logo, mouseX }: { logo: any, mouseX: any }) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // TAMAÑO DUPLICADO: Base 120px -> Magnificado 240px
  const widthSync = useTransform(distance, [-250, 0, 250], [120, 240, 120]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      className="aspect-square rounded-[3rem] bg-white/10 backdrop-blur-2xl border border-white/40 shadow-2xl flex items-center justify-center relative group isolate overflow-hidden transition-colors hover:border-cyan/50"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-petroleum/5 to-transparent -z-10" />
      
      <span className="text-5xl font-black text-black italic tracking-tighter group-hover:text-petroleum transition-colors select-none">
        {logo.symbol}
      </span>

      <div className="absolute -top-16 left-1/2 -translate-x-1/2 px-6 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl">
        {logo.name}
      </div>

      <div className="absolute inset-0 border-[2px] border-white/20 rounded-[3rem] pointer-events-none" />
    </motion.div>
  );
}

export const Testimonials = () => {
  const mouseX = useMotionValue(Infinity);

  return (
    <section className="pt-40 pb-32 bg-[#FFFFFF] relative overflow-hidden">
      <div className="container mx-auto px-12 text-center space-y-24">
        
        <div className="space-y-4">
          <p className="text-cyan font-black uppercase tracking-[0.5em] text-[10px]">Strategic Partners</p>
          <h2 className="text-5xl md:text-7xl font-black text-black italic tracking-tighter uppercase leading-tight">
            NUESTROS <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum to-cyan">ALIADOS.</span>
          </h2>
        </div>

        {/* APPLE DOCK CONTAINER XL */}
        <div className="flex justify-center items-end h-[350px]">
          <motion.div
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className="flex items-end gap-10 px-12 py-8 rounded-[5rem] bg-white/5 backdrop-blur-3xl border-2 border-white/60 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.08)] isolate"
          >
            {logos.map((logo) => (
              <DockIcon key={logo.id} logo={logo} mouseX={mouseX} />
            ))}
          </motion.div>
        </div>

        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] pt-10">
          Interactúa con la red global de Bayup
        </p>

      </div>
    </section>
  );
};
