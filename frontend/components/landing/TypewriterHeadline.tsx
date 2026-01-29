"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const TypewriterHeadline = ({ text, className = "", gradientClass = "" }: { text: string[], className?: string, gradientClass?: string }) => {
  const [displayText, setDisplayText] = useState("");
  const [isSecondPart, setIsSecondPart] = useState(false);
  
  const baseText = text[0];
  const highlightText = text[1];

  useEffect(() => {
    let i = 0;
    setDisplayText("");
    setIsSecondPart(false);

    const typeBase = setInterval(() => {
      if (i < baseText.length) {
        setDisplayText(baseText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typeBase);
        setIsSecondPart(true);
      }
    }, 80);

    return () => clearInterval(typeBase);
  }, [text, baseText]);

  return (
    <h1 className={className}>
      <span>{displayText}</span>
      {isSecondPart && <br />}
      {isSecondPart && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-transparent bg-clip-text bg-gradient-to-r ${gradientClass} inline-block`}
        >
          <TypewriterPart text={highlightText} />
        </motion.span>
      )}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="inline-block w-[4px] h-[0.8em] bg-cyan ml-2 align-middle shadow-[0_0_10px_#00f2ff]"
      />
    </h1>
  );
};

const TypewriterPart = ({ text }: { text: string }) => {
  const [content, setContent] = useState("");
  
  useEffect(() => {
    let i = 0;
    setContent("");
    const interval = setInterval(() => {
      if (i < text.length) {
        setContent(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{content}</span>;
};