"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function TiltCard({ children, className = "", onClick }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Motion values for mouse position relative to the card center
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring physics for smooth movement (Adjusted for snappier 3D feel)
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  // Transform mouse position to rotation values
  // INCREASED ROTATION for dramatic 3D effect (20deg instead of 7deg)
  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["20deg", "-20deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-20deg", "20deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const mouseXFromCenter = e.clientX - rect.left - width / 2;
    const mouseYFromCenter = e.clientY - rect.top - height / 2;

    // Normalize values to -0.5 to 0.5 range
    const xPct = mouseXFromCenter / width;
    const yPct = mouseYFromCenter / height;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative transform-gpu perspective-[1200px] cursor-pointer ${className}`}
      whileHover={{ scale: 1.05, zIndex: 50 }}
      whileTap={{ scale: 0.95 }}
    >
      <div
        style={{
          transform: "translateZ(50px)", // INCREASED DEPTH
          transformStyle: "preserve-3d",
        }}
        className="h-full w-full relative"
      >
        {/* Shadow element designed to stay 'behind' and cast deep shadow */}
        <div 
            className="absolute inset-4 bg-black/20 blur-xl rounded-[2.5rem] -z-10 transition-all duration-300 group-hover:bg-black/40 group-hover:translate-y-4 group-hover:scale-95"
            style={{ transform: "translateZ(-40px)" }} 
        />
        
        {children}
      </div>
      
      {/* Subtle Glossy reflection effect */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 pointer-events-none rounded-[2.2rem] z-50"
        style={{
          opacity: useTransform(mouseX, [-0.5, 0.5], [0, 0.4]), // Subtler shine
          transform: "translateZ(60px)", // Shine floats above content
        }}
      />
    </motion.div>
  );
}