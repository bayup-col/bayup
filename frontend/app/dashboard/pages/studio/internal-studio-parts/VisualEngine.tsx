"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Zap, Star, Heart, Bell, Info, Wind, Sparkles } from "lucide-react";

export const renderButton = (btnProps: any, prefix: string = "", extraId: string = "") => {
  const get = (key: string, fallback: any) => {
    if (prefix === "extra" && btnProps[key] !== undefined) return btnProps[key];
    const fullKey = prefix ? `${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}` : key;
    return btnProps[fullKey] !== undefined ? btnProps[fullKey] : btnProps[key] !== undefined ? btnProps[key] : fallback;
  };
  
  const variant = get("variant", prefix === "secondaryBtn" ? "glass" : "solid");
  const posX = get("posX", 0);
  const posY = get("posY", 0);
  const bgColor = get("bgColor", "#2563eb");
  const textColor = get("textColor", "#ffffff");
  const size = get("size", 14);
  const text = prefix === "primaryBtn" ? get("text", "Comprar") : prefix === "secondaryBtn" ? get("text", "Ver más") : btnProps.text || "Botón";
  const radius = get("borderRadius", 12);

  let themeStyles: any = { backgroundColor: bgColor, color: textColor, fontSize: `${size}px`, borderRadius: `${radius}px` };
  let themeClasses = "relative overflow-hidden transition-all duration-200 font-black uppercase tracking-widest text-[10px] px-8 py-3 select-none";

  if (variant === "aurora") {
    themeStyles.backgroundImage = `linear-gradient(135deg, ${get("aurora1", "#00f2ff")}, ${get("aurora2", "#7000ff")}, ${get("aurora1", "#00f2ff")}, ${get("aurora2", "#7000ff")})`;
    themeStyles.backgroundSize = "400% 400%";
    themeStyles.backgroundColor = undefined;
    themeStyles.color = "#ffffff";
  }

  switch(variant) {
    case "glass": themeClasses += " backdrop-blur-md bg-white/10 border border-white/20 shadow-xl"; themeStyles.backgroundColor = undefined; break;
    case "outline": themeClasses += " border-2 bg-transparent"; themeStyles.borderColor = bgColor; themeStyles.color = bgColor; themeStyles.backgroundColor = undefined; break;
    case "3d": themeClasses += " shadow-[0_6px_0_0_rgba(0,0,0,0.3)] active:translate-y-1 active:shadow-none"; break;
    case "aurora": themeClasses += " border-none shadow-lg"; break;
    case "neon": themeClasses += " border-2"; themeStyles.borderColor = bgColor; themeStyles.boxShadow = `0 0 15px ${bgColor}`; break;
    case "brutalist": themeClasses += " border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"; break;
    default: themeClasses += " shadow-md";
  }

  return (
    <motion.button 
      key={`btn-${prefix}-${extraId}-${variant}`} 
      animate={{ 
        x: posX, 
        y: posY,
        backgroundPosition: variant === "aurora" ? ["0% 0%", "100% 100%", "0% 0%"] : "0% 0%"
      }} 
      transition={{ 
        x: { type: "spring", stiffness: 450, damping: 30 },
        y: { type: "spring", stiffness: 450, damping: 30 },
        backgroundPosition: variant === "aurora" ? { duration: 6, repeat: Infinity, ease: "linear" } : { duration: 0 }
      }}
      className={themeClasses} 
      style={themeStyles}
    >
      <span className="relative z-10">{text}</span>
    </motion.button>
  );
};

export const renderTextWithTheme = (text: any, props: any, prefix: string = "", extraId: string = "", isDark: boolean = true) => {
  const get = (key: string, fallback: any) => {
    if (prefix === "extra" && props[key] !== undefined) return props[key];
    const fullKey = prefix ? `${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}` : key;
    return props[fullKey] !== undefined ? props[fullKey] : props[key] !== undefined ? props[key] : fallback;
  };

  const variant = get("variant", "solid");
  const intensity = get("intensity", 100);
  const posX = get("posX", 0);
  const posY = get("posY", 0);
  const effect = get("effect", "none");
  const color = get("color", isDark ? "#ffffff" : "#1f2937");
  const size = get("size", 24);
  const font = get("font", "font-sans");
  const isIcon = typeof text !== 'string';

  // POTENCIADOR DE INTENSIDAD (Afecta brillo, escala y opacidad de forma equilibrada)
  const intensityFactor = intensity / 100;
  const brightness = 100 + (intensity > 100 ? (intensity - 100) * 1.5 : 0); // Ajustado de 0.8 a 1.5 para mayor brillo
  const scale = 1 + (intensity > 100 ? (intensity - 100) * 0.0025 : 0); // Ajustado de 0.0015 a 0.0025 para una escala más notable

  let themeStyles: any = { 
    color, 
    fontSize: isIcon ? "inherit" : `${size}px`, 
    opacity: Math.min(intensityFactor, 1.1),
    filter: `brightness(${brightness}%)`,
    transform: `scale(${scale})`,
    fill: "currentColor",
    stroke: "none"
  };
  
  let themeClasses = cn(font, "relative transition-all duration-300 inline-flex items-center justify-center select-none");

  if (font === "font-black") themeClasses += " font-black uppercase tracking-tighter leading-none";

  // --- DISEÑOS (VARIANTS) ---
  switch(variant) {
    case "outline": 
      themeStyles.color = "transparent"; 
      themeStyles.WebkitTextStroke = `${Math.max(1, size/22)}px ${color}`;
      themeStyles.stroke = color;
      themeStyles.strokeWidth = `${Math.max(0.5, size/24)}px`;
      themeStyles.fill = "none";
      themeStyles.paintOrder = "stroke fill";
      break;
    case "3d": 
      themeClasses += " drop-shadow-[0_8px_15px_rgba(0,0,0,0.6)]"; 
      themeStyles.textShadow = `0 1px 0 #ccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb, 0 4px 0 #b9b9b9, 0 5px 0 #aaa, 0 6px 1px rgba(0,0,0,.1), 0 0 5px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.3), 0 3px 5px rgba(0,0,0,.2), 0 5px 10px rgba(0,0,0,.25), 0 10px 10px rgba(0,0,0,.2), 0 20px 20px rgba(0,0,0,.15)`;
      themeStyles.filter += ` drop-shadow(0 4px 4px rgba(0,0,0,0.5))`;
      break;
    case "brutalist": 
      themeStyles.color = color;
      themeStyles.WebkitTextStroke = `1.5px #000`;
      themeStyles.stroke = "#000";
      themeStyles.strokeWidth = "1.5px";
      themeStyles.textShadow = `4px 4px 0px #000`;
      themeStyles.filter += ` drop-shadow(4px 4px 0px #000)`;
      themeStyles.paintOrder = "stroke fill";
      break;
    case "aurora": 
      themeStyles.color = color; // Los iconos usan el color base para simular aurora si no hay soporte de máscara
      themeStyles.backgroundImage = `linear-gradient(135deg, ${get("aurora1", "#00f2ff")}, ${get("aurora2", "#7000ff")}, ${get("aurora1", "#00f2ff")}, ${get("aurora2", "#7000ff")})`; 
      themeStyles.backgroundSize = '400% 400%';
      themeStyles.WebkitBackgroundClip = 'text';
      themeStyles.WebkitTextFillColor = 'transparent';
      themeStyles.filter += ` drop-shadow(0 0 8px ${get("aurora1", "#00f2ff")})`;
      break;
  }

  // --- EFECTOS VISUALES (EFFECTS) ---
  switch(effect) {
    case "glow": 
      themeStyles.filter += ` drop-shadow(0 0 ${15 * intensityFactor}px ${color}) saturate(${100 + intensityFactor * 50}%)`; 
      break;
    case "neon": 
      themeStyles.filter += ` drop-shadow(0 0 5px ${color}) drop-shadow(0 0 ${25 * intensityFactor}px ${color})`; 
      themeClasses += " animate-pulse";
      break;
    case "fire": 
      themeClasses += " bg-clip-text text-transparent bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 animate-pulse"; 
      themeStyles.backgroundImage = `linear-gradient(to top, #ff0000, #ff8000, #ffff00)`;
      themeStyles.filter += ` drop-shadow(0 0 ${20 * intensityFactor}px #ff4d00) contrast(${100 + intensityFactor * 20}%)`;
      break;
    case "float":
      themeClasses += " animate-float";
      break;
    case "glass": 
      themeClasses += " backdrop-blur-md bg-white/10 px-6 py-2 rounded-2xl border border-white/20 shadow-xl"; 
      break;
  }

  const isAurora = variant === "aurora";

  return (
    <motion.div 
      key={`text-${prefix}-${extraId}-${variant}-${effect}`} 
      animate={{ 
        x: posX, 
        y: posY,
        backgroundPosition: isAurora ? ["0% 0%", "100% 100%", "0% 0%"] : "0% 0%"
      }} 
      transition={{ 
        x: { type: "spring", stiffness: 450, damping: 30 },
        y: { type: "spring", stiffness: 450, damping: 30 },
        backgroundPosition: isAurora ? { duration: 8, repeat: Infinity, ease: "linear" } : { duration: 0 }
      }}
      className={themeClasses} 
      style={themeStyles}
    >
      {text}
    </motion.div>
  );
};
