"use client";

import { useRef, useState, ReactNode } from "react";

interface InteractiveTextProps {
  children: ReactNode;
  className?: string;
  colors?: [string, string]; // [Highlight Color, Base Color]
}

export const InteractiveText = ({ 
  children, 
  className = "", 
  colors = ["#00F2FF", "#004D4D"] // Default: Cyan Highlight, Petroleum Base
}: InteractiveTextProps) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const [mousePos, setMousePos] = useState({ x: 100, y: 0 }); // Start at Top-Right (Edge of S)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!textRef.current) return;
    const rect = textRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 100, y: 0 }); // Reset to Top-Right
  };

  return (
    <span 
      ref={textRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`inline-block transition-all duration-[2500ms] ease-[0.16,1,0.3,1] cursor-default ${className}`}
      style={{ 
        backgroundImage: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, ${colors[0]} 0%, ${colors[1]} 80%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      } as React.CSSProperties}
    >
      {children}
    </span>
  );
};
