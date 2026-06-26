"use client";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState, useRef } from "react";
import Link from "next/link";
import { User, Menu } from "lucide-react";
import { InteractiveUP } from "./landing/InteractiveUP";

const navLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Planes', href: '/planes' },
  { label: 'Nosotros', href: '/acerca' },
  { label: 'Contáctanos', href: '/contacto' }
];

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
      className={`fixed top-0 w-full z-[100] transition-all duration-500 ${isAtTop ? 'py-6' : 'py-4'}`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full px-5 md:px-8 py-3 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)]">

          {/* LADO IZQUIERDO: Logo */}
          <div className="flex items-center gap-4 pointer-events-auto">
            <button className="md:hidden p-1 text-white">
              <Menu size={22} />
            </button>

            <Link href="/" className="flex items-center text-lg font-black italic tracking-tighter text-white">
              <span>BAY</span>
              <InteractiveUP />
            </Link>
          </div>

          {/* CENTRO: Menu Desktop */}
          <div className="hidden md:flex items-center justify-center pointer-events-auto">
            <div className="flex items-center gap-8">
              {navLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-300"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* DERECHA: CTAs Desktop */}
          <div className="hidden md:flex justify-end pointer-events-auto items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-300 px-3"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="bg-white text-black text-sm font-semibold rounded-full px-5 py-2 hover:bg-gray-200 transition-colors duration-300 whitespace-nowrap"
            >
              Regístrate
            </Link>
          </div>

          {/* CTA Móvil */}
          <div className="md:hidden pointer-events-auto">
             <Link href="/login" className="p-1 text-white">
                <User size={22} />
             </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
