"use client";

import { useState, useEffect } from "react";
import { InteractiveText } from "./InteractiveText";

interface TypewriterCyclerProps {
  words: string[];
  period?: number;
  className?: string;
  colors?: [string, string];
}

export const TypewriterCycler = ({ 
  words = ["GRATIS", "FACIL", "RAPIDO"], 
  period = 2000, 
  className = "",
  colors
}: TypewriterCyclerProps) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    let ticker: NodeJS.Timeout;
    const currentFullWord = words[currentWordIndex];
    
    // Velocidad de escritura/borrado
    const typeSpeed = isDeleting ? 100 : 150;
    
    const tick = () => {
      // Si está borrando, quita caracteres
      if (isDeleting) {
        setText(prev => prev.substring(0, prev.length - 1));
      } else {
        // Si está escribiendo, añade caracteres
        setText(prev => currentFullWord.substring(0, prev.length + 1));
      }

      // Lógica de cambio de estado
      if (!isDeleting && text === currentFullWord) {
        // Terminó de escribir, espera 'period' ms antes de borrar
        ticker = setTimeout(() => setIsDeleting(true), period);
      } else if (isDeleting && text === "") {
        // Terminó de borrar, pasa a la siguiente palabra
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
        ticker = setTimeout(tick, 500); // Pequeña pausa antes de escribir la nueva
      } else {
        // Sigue escribiendo o borrando
        ticker = setTimeout(tick, typeSpeed);
      }
    };

    ticker = setTimeout(tick, typeSpeed);

    return () => clearTimeout(ticker);
  }, [text, isDeleting, currentWordIndex, words, period]);

  return (
    <InteractiveText className={className} colors={colors}>
      {text}
      <span className="animate-pulse ml-1 text-cyan">|</span>
    </InteractiveText>
  );
};
