"use client";

import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { InteractiveUP } from "./landing/InteractiveUP";
import { ExpandableButton } from "./landing/ExpandableButton";

export const Navbar = () => {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY.current;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else if (latest < previous) {
      setHidden(false);
    }
    setIsAtTop(latest < 50);
    lastScrollY.current = latest;
  });

  return (
    <motion.nav 
      initial="visible"
      animate={hidden ? "hidden" : "visible"}
      variants={{
        visible: { y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
        hidden: { y: "-100%", transition: { duration: 0.3, ease: "easeInOut" } },
      }}
      className={`fixed top-0 w-full z-[100] pointer-events-none transition-all duration-500 ${isAtTop ? 'py-10' : 'py-6'}`}
    >
      <div className="container mx-auto px-12 grid grid-cols-3 items-center">
        
        {/* Columna 1: Logo */}
        <Link href="/" className="pointer-events-auto">
          <motion.div 
            className={`text-2xl font-black italic tracking-tighter cursor-pointer w-fit transition-colors duration-500 ${isAtTop ? 'text-white' : 'text-black'}`}
          >
            <span>BAY</span><InteractiveUP />
          </motion.div>
        </Link>
        
        {/* Columna 2: Links */}
        <div className="hidden md:flex items-center justify-center">
          <div className={`flex items-center gap-12 px-10 py-4 rounded-full border border-white/40 bg-white/20 backdrop-blur-xl shadow-sm transition-all duration-500 pointer-events-auto ${isAtTop ? '' : 'border-gray-100 bg-white/40 shadow-md'}`}>
            {[
              { label: 'Afiliados', href: '/afiliados' },
              { label: 'Inicio', href: '/' },
              { label: 'Planes', href: '/planes' }
            ].map((item) => (
              <Link 
                key={item.label} 
                href={item.href} 
                className={`text-[12px] font-black uppercase tracking-[0.5em] transition-all duration-500 relative group ${isAtTop ? 'text-white hover:text-cyan' : 'text-gray-500 hover:text-black'}`}
              >
                {item.label}
                <span className={`absolute -bottom-1 left-0 h-[1.5px] bg-cyan transition-all duration-500 group-hover:w-full ${item.label === 'Inicio' ? 'w-full' : 'w-0'}`}></span>
              </Link>
            ))}
          </div>
        </div>

        {/* Columna 3: CTA Derecha */}
        <div className="flex justify-end pointer-events-auto items-center gap-6">
          <ExpandableButton 
            href="/register" 
            variant="primary" 
            baseText="REGÍSTRATE" 
            expandedText="GRATIS" 
          />

          <ExpandableButton 
            href="/login" 
            variant="ghost" 
            expandedText="INICIAR SESIÓN" 
            className={isAtTop ? "text-white" : "text-black"}
            icon={<User size={22} className={isAtTop ? "text-white" : "text-black"} />} 
          />
        </div>
      </div>
    </motion.nav>
  );
};