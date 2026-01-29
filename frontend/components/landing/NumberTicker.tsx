"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

export const NumberTicker = ({
  value,
  direction = "up",
  delay = 0,
  className = "",
}: {
  value: number;
  direction?: "up" | "down";
  delay?: number;
  className?: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const motionValue = useMotionValue(direction === "down" ? value : 0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });

  useEffect(() => {
    if (isInView) {
      setTimeout(() => {
        motionValue.set(direction === "down" ? 0 : value);
      }, delay * 1000);
    }
  }, [motionValue, isInView, delay, value, direction]);

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent = Intl.NumberFormat("en-US", {
            minimumFractionDigits: value % 1 === 0 ? 0 : 1,
            maximumFractionDigits: value % 1 === 0 ? 0 : 1,
          }).format(Number(latest.toFixed(1)));
        }
      }),
    [springValue, value]
  );

  return (
    <span
      className={`inline-block tabular-nums ${className}`}
      ref={ref}
      style={{ color: 'inherit' }}
    />
  );
};
