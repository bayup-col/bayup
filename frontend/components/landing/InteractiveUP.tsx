"use client";

import { useRef, useState } from "react";

export const InteractiveUP = ({ className = "" }: { className?: string }) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const [mousePos, setMousePos] = useState({ x: 95, y: 15 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!textRef.current) return;
    const rect = textRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 95, y: 15 });
  };

  return (
    <span 
      ref={textRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`inline-block transition-all duration-[2500ms] ease-[0.16,1,0.3,1] cursor-default ${className}`}
      style={{ 
        backgroundImage: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, #00f2ff 0%, #004d4d 70%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        paddingRight: '0.2em' 
      } as React.CSSProperties}
    >
      <span>UP.</span>
    </span>
  );
};
