"use client";

import React, { useRef } from "react";
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";

interface InteractiveDistortionProps {
  src: string;
  alt?: string;
  className?: string;
  strength?: number;
}

export const InteractiveDistortion = ({
  src,
  alt = "",
  className = "",
  strength = 0.2
}: InteractiveDistortionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  const rotateX = useTransform(smoothY, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], ["-10deg", "10deg"]);
  const scale = useTransform(smoothX, [-0.5, 0.5], [1.02, 1.05]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
    const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-full flex items-center justify-center ${className}`}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        className="relative w-full h-full flex items-center justify-center"
        style={{
          rotateX,
          rotateY,
          scale,
          transformStyle: "preserve-3d",
        }}
      >
        <motion.img
          src={src}
          alt={alt}
          className="w-full h-full object-contain pointer-events-none select-none z-10"
          style={{
            filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.2))",
          }}
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <motion.div
          className="absolute inset-0 z-20 pointer-events-none rounded-[2rem]"
          style={{
            background: useTransform(
              [smoothX, smoothY],
              ([cx, cy]) => `radial-gradient(circle at ${((cx as number) + 0.5) * 100}% ${((cy as number) + 0.5) * 100}%, rgba(0, 242, 255, 0.1) 0%, transparent 60%)`
            ),
          }}
        />
      </motion.div>
    </div>
  );
};
