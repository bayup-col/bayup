"use client";

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useGSAP } from "@gsap/react";
import { motion, useTransform, useScroll } from 'framer-motion';
import { TemplateShowcase } from './TemplateShowcase';
import { Testimonials } from './Testimonials';
import { MobileShoppingSection } from './MobileShoppingSection';

export const NarrativeScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lógica de Framer Motion
  const { scrollYProgress } = useScroll({
    target: mounted ? containerRef : undefined,
    offset: ["start end", "end start"]
  });

  const lineWidth = useTransform(scrollYProgress, [0.1, 0.3, 0.5], ["3rem", "100%", "3rem"]);
  const lineOpacity = useTransform(scrollYProgress, [0.1, 0.2, 0.6, 0.7], [0, 1, 1, 0]);

  // Lógica de GSAP
  useGSAP(() => {
    if (!mounted || !horizontalRef.current || !containerRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const horizontal = horizontalRef.current;

    const tween = gsap.to(horizontal, {
      x: () => -(horizontal.scrollWidth - window.innerWidth),
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        pin: true,
        // scrub bajo: el carril horizontal sigue el scroll casi 1:1 en vez
        // de "amortiguarlo" 1s, que es lo que se sentía pesado/tosco.
        scrub: 0.3,
        end: () => `+=${horizontal.scrollWidth}`,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      }
    });

    // Las imágenes (carrusel de plantillas, fotos, etc.) cargan después del
    // montaje inicial y cambian el ancho real del scroll horizontal. Sin
    // recalcular, el ScrollTrigger se despinea en el punto equivocado y se
    // ve el salto/corte hacia la siguiente sección a mitad de transición.
    const refresh = () => ScrollTrigger.refresh();
    const images = Array.from(horizontal.querySelectorAll('img'));
    const pendingImages = images.filter((img) => !img.complete);
    pendingImages.forEach((img) => img.addEventListener('load', refresh));
    window.addEventListener('load', refresh);
    const settleTimer = setTimeout(refresh, 1200);

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
      pendingImages.forEach((img) => img.removeEventListener('load', refresh));
      window.removeEventListener('load', refresh);
      clearTimeout(settleTimer);
    };
  }, { scope: containerRef, dependencies: [mounted] });

  if (!mounted) return <div className="h-screen w-full bg-background" />;

  return (
    <div id="ecosystem" ref={containerRef} className="overflow-hidden bg-background">
      <div ref={horizontalRef} className="flex h-screen w-fit">
        
        {/* 0. Intro Section - CINEMATIC VIDEO BACKGROUND */}
        <div className="horizontal-section h-screen w-screen relative flex items-center justify-center overflow-hidden bg-black">
          {/* Video de Fondo en Bucle */}
          <video 
            autoPlay 
            muted 
            loop 
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-50 z-0"
          >
            <source src="/assets/video.webm" type="video/webm" />
          </video>

          {/* Overlay para asegurar legibilidad del texto */}
          <div className="absolute inset-0 bg-black/40 z-10" />

          <div className="max-w-7xl text-center flex flex-col items-center relative z-20 px-6 gap-8">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase leading-[1.1] italic flex flex-col items-center">
              <span className="text-white whitespace-nowrap drop-shadow-[0_0_25px_rgba(255,255,255,0.8)]">EL MUNDO ESTÁ LISTO</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan via-white to-cyan whitespace-nowrap drop-shadow-[0_0_35px_rgba(0,242,255,0.9)]">PARA COMPRARTE.</span>
            </h2>
            <motion.p 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              viewport={{ once: true }}
              className="text-[10px] md:text-2xl font-extrabold text-white italic tracking-[0.2em] md:tracking-[0.3em] uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]"
            >
              Bayup te da las herramientas <span className="text-cyan font-black drop-shadow-[0_0_15px_rgba(0,242,255,0.8)]">para lograrlo</span>
            </motion.p>
          </div>
        </div>

        {/* 1. Diseños que inspiran */}
        <section className="horizontal-section flex h-screen w-screen items-center justify-center bg-background relative overflow-hidden">
          <TemplateShowcase compact />
        </section>
                
        {/* 2. Soporte humano personalizado */}
        <section className="horizontal-section flex h-screen w-screen items-center justify-center bg-white relative overflow-hidden">
          <Testimonials compact />
        </section>

        {/* 3. ¿Por qué Bayup? */}
        <section className="horizontal-section flex h-screen w-screen items-center justify-center bg-surface relative overflow-hidden">
          <MobileShoppingSection compact />
        </section>

      </div>
    </div>
  );
};

