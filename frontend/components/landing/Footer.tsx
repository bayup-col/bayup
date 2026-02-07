"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Facebook, Instagram, Linkedin, Globe, Music2 } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { InteractiveUP } from "./InteractiveUP";
import { TextHoverIcon } from "./TextHoverIcon";

// Componente de Icono Magnético (Inspirado en Framer)
const MagneticIcon = ({ children, href }: { children: React.ReactNode, href: string }) => {
  const ref = useRef<HTMLAnchorElement>(null);
  
  // Valores de movimiento
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Resortes para suavidad elástica
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calcular distancia y aplicar fuerza de atracción (limitada a 20px)
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    
    x.set(distanceX * 0.5);
    y.set(distanceY * 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className="text-gray-600 hover:text-cyan transition-colors duration-300 flex items-center justify-center p-2"
    >
      <motion.div whileHover={{ scale: 1.2 }}>
        {children}
      </motion.div>
    </motion.a>
  );
};

export const Footer = () => {
  return (
    <footer className="py-24 bg-[#0A0A0B] relative overflow-hidden isolate">
      {/* Efecto de Reflejo y Profundidad (Verde Petróleo) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-petroleum/20 rounded-full blur-[120px] -z-10 opacity-50" />
      
      <div className="container mx-auto px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          
          <div className="col-span-1 md:col-span-2 space-y-10">
            <TextHoverIcon />
            <p className="max-w-xs text-gray-500 text-[10px] font-black leading-relaxed uppercase tracking-[0.3em] opacity-80">
              El sistema operativo para el comercio del futuro. <br /> 
              Diseñado para impactar, construido para escalar.
            </p>
            
            {/* ICONOS SOCIALES MAGNÉTICOS */}
            <div className="flex gap-6 -ml-2">
              {[
                { Icon: Facebook, href: "#" },
                { Icon: Instagram, href: "#" },
                { Icon: Linkedin, href: "#" },
                { Icon: Music2, href: "#" }
              ].map((item, i) => (
                <MagneticIcon key={i} href={item.href}>
                  <item.Icon size={22} />
                </MagneticIcon>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em] opacity-40">Plataforma</h4>
            <ul className="space-y-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
              <li><Link href="/caracteristicas" className="hover:text-cyan transition-colors">Características</Link></li>
              <li><Link href="/tecnologia" className="hover:text-cyan transition-colors">Tecnología</Link></li>
              <li><Link href="/planes" className="hover:text-cyan transition-colors">Planes</Link></li>
              <li><Link href="/seguridad" className="hover:text-cyan transition-colors">Seguridad</Link></li>
            </ul>
          </div>

          <div className="space-y-8">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em] opacity-40">Compañía</h4>
            <ul className="space-y-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
              <li><Link href="/acerca" className="hover:text-cyan transition-colors">Acerca de</Link></li>
              <li><Link href="/soporte" className="hover:text-cyan transition-colors">Soporte</Link></li>
              <li><Link href="/terms" className="hover:text-cyan transition-colors">Términos</Link></li>
              <li><Link href="/privacidad" className="hover:text-cyan transition-colors">Privacidad</Link></li>
            </ul>
          </div>

        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-16 border-t border-white/5 gap-8">
          <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.4em]">
            © 2026 BAYUP INTEL. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-3 text-[9px] font-black text-gray-600 uppercase tracking-widest group cursor-pointer hover:text-white transition-colors">
            <Globe size={14} className="group-hover:text-cyan transition-colors" />
            <span>GLOBAL / ENGLISH (US)</span>
          </div>
        </div>
      </div>

      {/* Brillo decorativo final */}
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-petroleum/10 rounded-full blur-[150px]" />
    </footer>
  );
};