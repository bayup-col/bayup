"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const loginShowcaseSlides = [
  {
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1600",
    stat: "8 billones USD",
    label: "Ventas globales de ecommerce proyectadas para 2027."
  },
  {
    image: "https://images.unsplash.com/photo-1556741533-411cf82e4e2d?auto=format&fit=crop&q=80&w=1600",
    stat: "+70%",
    label: "De los compradores prefieren marcas con checkout rápido y simple."
  },
  {
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80&w=1600",
    stat: "24/7",
    label: "Tu tienda nunca cierra: vende mientras duermes."
  },
  {
    image: "https://images.unsplash.com/photo-1556742111-a301076d9d18?auto=format&fit=crop&q=80&w=1600",
    stat: "4.2x",
    label: "Más conversiones con experiencias de compra personalizadas."
  },
];

export const registerShowcaseSlides = [
  {
    image: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=1600",
    stat: "5 minutos",
    label: "Es todo lo que toma lanzar tu tienda profesional con Bayup."
  },
  {
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1600",
    stat: "+30M",
    label: "De negocios en el mundo ya venden en línea. El tuyo puede ser el siguiente."
  },
  {
    image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=1600",
    stat: "0% inicial",
    label: "Empieza a vender sin inversión inicial ni costos ocultos."
  },
  {
    image: "https://images.unsplash.com/photo-1556742111-a301076d9d18?auto=format&fit=crop&q=80&w=1600",
    stat: "+3x",
    label: "Crecimiento promedio de marcas que se digitalizan a tiempo."
  },
];

export const AuthShowcase = ({ slides }: { slides: typeof loginShowcaseSlides }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative hidden lg:flex lg:w-1/2 h-screen overflow-hidden bg-[#050505]">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <img
            src={slides[index].image}
            alt="Ecommerce"
            className="w-full h-full object-cover filter grayscale-[20%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex flex-col justify-end h-full w-full p-12 lg:p-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-3"
          >
            <p className="text-4xl md:text-5xl font-light text-white tracking-tight">
              <span className="font-medium text-cyan">{slides[index].stat}</span>
            </p>
            <p className="text-base text-gray-300 font-light leading-relaxed max-w-md">
              {slides[index].label}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-2 mt-10">
          {slides.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === index ? 'w-8 bg-cyan' : 'w-4 bg-white/20'}`} />
          ))}
        </div>
      </div>
    </div>
  );
};
