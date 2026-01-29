"use client";

import { motion } from "framer-motion";

interface RollingTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export const RollingText = ({ text, className = "", delay = 0 }: RollingTextProps) => {
  const words = text.split(" ");

  return (
    <span className={`inline-flex flex-wrap justify-center gap-x-[0.3em] gap-y-1 ${className}`}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-flex overflow-hidden">
          {word.split("").map((letter, charIndex) => (
            <motion.span
              key={charIndex}
              initial={{ y: "100%" }}
              whileInView={{ y: 0 }}
              transition={{
                duration: 0.5,
                delay: delay + (wordIndex * 0.05) + (charIndex * 0.02),
                ease: [0.16, 1, 0.3, 1],
              }}
              viewport={{ once: true }}
              className="inline-block"
            >
              {letter}
            </motion.span>
          ))}
        </span>
      ))}
    </span>
  );
};