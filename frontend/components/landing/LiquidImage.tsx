"use client";

import React, { ReactNode, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";

interface LiquidImageProps {
  image: string;
  alt?: string;
  className?: string;
  distortionScale?: number;
  speed?: number;
  tint?: string;
  opacity?: number;
  children?: ReactNode;
}

export const LiquidImage = ({
  image,
  alt = "",
  className = "",
  distortionScale = 0.3,
  speed = 0.2,
  tint = "#000000",
  opacity = 0.85,
  children
}: LiquidImageProps) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Real cursor position for spotlight
  const absMouseX = useMotionValue(0);
  const absMouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 100 };
  const dx = useSpring(mouseX, springConfig);
  const dy = useSpring(mouseY, springConfig);
  
  const spotlightX = useSpring(absMouseX, { damping: 50, stiffness: 200 });
  const spotlightY = useSpring(absMouseY, { damping: 50, stiffness: 200 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    
    // Parallax movement
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    mouseX.set(x * 100 * distortionScale);
    mouseY.set(y * 100 * distortionScale);

    // Absolute position for spotlight
    absMouseX.set(e.clientX - left);
    absMouseY.set(e.clientY - top);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const spotlightGradient = useMotionTemplate`radial-gradient(
    350px circle at ${spotlightX}px ${spotlightY}px,
    transparent 0%,
    ${tint} 80%
  )`;

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* SVG Filter for Liquid Effect */}
      <svg className="hidden">
        <filter id="liquid-distortion">
          <feTurbulence 
            type="fractalNoise" 
            baseFrequency="0.015" 
            numOctaves="3" 
            result="noise" 
          >
            <animate 
              attributeName="baseFrequency" 
              dur={`${10 / speed}s`} 
              values="0.015;0.02;0.015" 
              repeatCount="indefinite" 
            />
          </feTurbulence>
          <feDisplacementMap 
            in="SourceGraphic" 
            in2="noise" 
            scale="40" 
            xChannelSelector="R" 
            yChannelSelector="G" 
          />
        </filter>
      </svg>

      {/* Background Image Wrapper */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          scale: 1.15,
          x: dx,
          y: dy,
          filter: "url(#liquid-distortion)",
        }}
      >
        {/* Static Tint Base */}
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundColor: tint, 
            opacity: 0.4 // Reduced to allow background visibility
          }} 
        />

        {/* Dynamic Spotlight Mask */}
        <motion.div 
          className="absolute inset-0 z-10"
          style={{
            background: spotlightGradient,
            opacity: 0.7 // Subtle masking
          }}
        />
        
        {/* Very subtle cyan cursor glow */}
        <motion.div 
          className="absolute w-[250px] h-[250px] bg-cyan/5 rounded-full blur-[80px] pointer-events-none z-20"
          style={{
            left: spotlightX,
            top: spotlightY,
            translateX: "-50%",
            translateY: "-50%",
          }}
        />
      </motion.div>

      {/* Content Wrapper */}
      <div className="relative z-30 w-full h-full flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
};
