"use client";

import { useState, useEffect } from "react";
import { InteractiveText } from "./InteractiveText";

interface TypewriterEffectProps {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseTime?: number;
  className?: string;
  colors?: [string, string];
}

export const TypewriterEffect = ({ 
  words = ["GRATIS", "FACIL", "RAPIDO"], 
  typingSpeed = 150,
  deletingSpeed = 100,
  pauseTime = 2000,
  className = "",
  colors
}: TypewriterEffectProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Mecanismo de escritura/borrado
  useEffect(() => {
    if (!isMounted) return;
    if (subIndex === words[index].length + 1 && !reverse) {
      setReverse(true);
      return;
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? deletingSpeed : subIndex === words[index].length ? pauseTime : typingSpeed);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, words, typingSpeed, deletingSpeed, pauseTime]);

  // Cursor parpadeante
  useEffect(() => {
    const timeout2 = setTimeout(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearTimeout(timeout2);
  }, [blink]);

  return (
    <div className={`inline-block ${className}`}>
      {isMounted ? (
        <InteractiveText colors={colors}>
          {`${words[index].substring(0, subIndex)}`}
          <span className={`
            ${blink ? 'opacity-100' : 'opacity-0'} 
            inline-block w-1 h-[0.7em] bg-cyan ml-2 
            relative -top-[0.05em] align-middle
            shadow-[0_0_10px_#00f2ff]
          `}></span>
        </InteractiveText>
      ) : (
        <span className="opacity-0">{words[0]}</span>
      )}
    </div>
  );
};
