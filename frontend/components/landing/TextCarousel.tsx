"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface TextCarouselProps {
  items: string[];
  className?: string;
  interval?: number;
}

export const TextCarousel = ({ items, className = "", interval = 3000 }: TextCarouselProps) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, interval);
    return () => clearInterval(timer);
  }, [items.length, interval]);

  return (
    <div className="relative inline-flex flex-col items-center justify-center overflow-hidden h-[1.2em] w-full align-middle">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: "100%", opacity: 0, filter: "blur(5px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-100%", opacity: 0, filter: "blur(5px)" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute flex items-center justify-center text-center whitespace-nowrap ${className}`}
        >
          {items[index]}
        </motion.span>
      </AnimatePresence>
      {/* Elemento invisible para mantener el ancho basado en la palabra más larga */}
      <span className="invisible pointer-events-none opacity-0 select-none whitespace-nowrap px-4">
        {items.reduce((a, b) => a.length > b.length ? a : b)}
      </span>
    </div>
  );
};
