"use client";

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useGSAP } from "@gsap/react";
import { PiggyBank, Target, LineChart, Zap, TrendingUp, Activity } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, useScroll, useMotionTemplate, AnimatePresence } from 'framer-motion';
import { NumberTicker } from './NumberTicker';
import { RollingText } from './RollingText';
import { WorldMap } from './WorldMap';
import { InteractiveDistortion } from './InteractiveDistortion';
import { FloatingParticlesBackground } from './FloatingParticlesBackground';
import { InteractiveAuraBackground } from './InteractiveAuraBackground';

const AuroraBorder = () => {
  return (
    <div 
      className="absolute inset-0 rounded-[inherit] z-50 pointer-events-none"
      style={{
        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        maskComposite: 'exclude',
        WebkitMaskComposite: 'xor',
        padding: '2px', // Grosor del borde aurora
      }}
    >
      <motion.div
        className="absolute inset-[-50%]"
        style={{ 
          width: '200%', 
          height: '200%', 
          left: '-50%', 
          top: '-50%',
          background: 'conic-gradient(from 0deg, transparent 0deg, transparent 60deg, #00f2ff 100deg, transparent 140deg, transparent 200deg, #004d4d 240deg, transparent 280deg)'
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

const NarrativeFlipCard = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  
  return (
    <div 
      className="relative w-full max-w-[900px] h-[450px] cursor-pointer perspective-[2000px] group mx-auto"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative w-full h-full"
      >
        {/* LADO FRONTAL */}
        <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-10 rounded-[4.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] isolate bg-white">
          <div className="absolute inset-0 rounded-[4.5rem] overflow-hidden -z-10">
            <div className="absolute top-1/2 left-1/2 w-[250%] aspect-square animate-aurora opacity-50 group-hover:opacity-100 transition-opacity duration-700"
              style={{ background: `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)`, willChange: 'transform' }}
            />
            <div className="absolute inset-[3px] rounded-[4.4rem] bg-white/95 backdrop-blur-[120px]" />
          </div>
          <div className="space-y-10 flex flex-col items-center w-full relative z-10">
            <div className="h-20 w-20 rounded-[1.5rem] bg-gradient-to-br from-[#004D4D] to-black text-white flex items-center justify-center shadow-[0_20px_40px_rgba(0,77,77,0.3)] relative">
              <div className="absolute inset-0 bg-cyan/30 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <PiggyBank size={32} className="text-cyan drop-shadow-[0_0_12px_#00f2ff]" />
            </div>
            <h3 className="text-4xl md:text-6xl font-black text-black italic uppercase tracking-tighter text-center">
              Pagas solo <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum via-cyan to-petroleum">si vendes</span>
            </h3>
          </div>
          <div className="absolute bottom-10 flex flex-col items-center gap-2 w-full left-0">
             <span className="text-petroleum/40 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Click para ver detalles</span>
             <div className="w-16 h-1 bg-gradient-to-r from-transparent via-cyan to-transparent rounded-full opacity-40" />
          </div>
        </div>
        {/* LADO TRASERO */}
        <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-10 rounded-[4.5rem] rotate-y-180 isolate bg-white">
          <div className="absolute inset-0 rounded-[4.5rem] overflow-hidden -z-10">
            <div className="absolute top-1/2 left-1/2 w-[250%] aspect-square animate-aurora opacity-40 group-hover:opacity-100 transition-opacity duration-700"
              style={{ background: `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)`, willChange: 'transform' }}
            />
            <div className="absolute inset-[2px] rounded-[4.4rem] bg-white/95" />
          </div>
          <div className="absolute -top-16 flex justify-center w-full"><img src="/assets/ahorro.png" className="w-40 h-40 object-contain drop-shadow-2xl" /></div>
          <h3 className="text-3xl md:text-5xl font-black italic uppercase text-black mt-12 flex flex-col items-center leading-none">
            <span>Sin</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum via-cyan to-petroleum">mensualidades</span>
          </h3>
          <p className="text-gray-600 text-base font-bold italic px-12 text-center mt-6">Solo cobras comisión cuando haces una venta. Sin sorpresas, sin costos fijos.</p>
        </div>
      </motion.div>
    </div>
  );
};

const MarketingFlipCard = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  return (
    <div className="relative w-full max-w-[900px] h-[450px] cursor-pointer perspective-[2000px] group mx-auto" onClick={() => setIsFlipped(!isFlipped)}>
      <motion.div animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} style={{ transformStyle: "preserve-3d" }} className="relative w-full h-full">
        {/* FRONTAL */}
        <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-10 rounded-[4.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] isolate bg-white">
          <div className="absolute inset-0 rounded-[4.5rem] overflow-hidden -z-10">
            <div className="absolute top-1/2 left-1/2 w-[250%] aspect-square animate-aurora opacity-50 group-hover:opacity-100 transition-opacity duration-700"
              style={{ background: `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)` }}
            />
            <div className="absolute inset-[3px] rounded-[4.4rem] bg-white/95" />
          </div>
          <div className="h-20 w-20 rounded-[1.5rem] bg-gradient-to-br from-[#004D4D] to-black text-white flex items-center justify-center shadow-xl mb-8 relative">
            <div className="absolute inset-0 bg-cyan/30 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <Zap size={32} className="text-cyan drop-shadow-[0_0_12px_#00f2ff]" />
          </div>
          <h3 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-black leading-[0.85] flex flex-col items-center justify-center gap-2">
            <span>Campañas</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum via-cyan to-petroleum">Inteligentes</span>
          </h3>
          <div className="absolute bottom-10 flex flex-col items-center gap-2 w-full left-0">
             <span className="text-petroleum/40 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Click para ver detalles</span>
             <div className="w-16 h-1 bg-gradient-to-r from-transparent via-cyan to-transparent rounded-full opacity-40" />
          </div>
        </div>
        {/* REVERSO */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-10 rounded-[4.5rem] isolate bg-white">
          <div className="absolute inset-0 rounded-[4.5rem] overflow-hidden -z-10">
            <div className="absolute top-1/2 left-1/2 w-[250%] aspect-square animate-aurora opacity-40 group-hover:opacity-100 transition-opacity duration-700"
              style={{ background: `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)` }}
            />
            <div className="absolute inset-[2px] rounded-[4.4rem] bg-white/95" />
          </div>
          <div className="absolute -top-16 flex justify-center w-full"><img src="/assets/marketing.png" className="w-40 h-40 object-contain" /></div>
          <h3 className="text-3xl md:text-5xl font-black italic uppercase text-black mt-12 text-center leading-none flex flex-col items-center">
            <span>Data</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum via-cyan to-petroleum">Real</span>
          </h3>
          <p className="text-gray-600 text-base font-bold italic px-12 text-center mt-6">Crea campañas basadas en datos reales. Nuestra IA te recomendará las mejores acciones.</p>
        </div>
      </motion.div>
    </div>
  );
};

const AnalyticsFlipCard = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  return (
    <div className="relative w-full max-w-[900px] h-[450px] cursor-pointer perspective-[2000px] group mx-auto" onClick={() => setIsFlipped(!isFlipped)}>
      <motion.div animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} style={{ transformStyle: "preserve-3d" }} className="relative w-full h-full">
        {/* FRONTAL */}
        <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-10 rounded-[4.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] isolate bg-white">
          <div className="absolute inset-0 rounded-[4.5rem] overflow-hidden -z-10">
            <div className="absolute top-1/2 left-1/2 w-[250%] aspect-square animate-aurora opacity-50 group-hover:opacity-100 transition-opacity duration-700"
              style={{ background: `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)` }}
            />
            <div className="absolute inset-[3px] rounded-[4.4rem] bg-white/95" />
          </div>
          <div className="h-20 w-20 rounded-[1.5rem] bg-gradient-to-br from-[#004D4D] to-black text-white flex items-center justify-center shadow-xl mb-8 relative">
            <div className="absolute inset-0 bg-cyan/30 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <LineChart size={32} className="text-cyan drop-shadow-[0_0_12px_#00f2ff]" />
          </div>
          <h3 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-black leading-[0.85] flex flex-col items-center justify-center gap-2">
            <span>Estadísticas</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum via-cyan to-petroleum">Claras</span>
          </h3>
          <div className="absolute bottom-10 flex flex-col items-center gap-2 w-full left-0">
             <span className="text-petroleum/40 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Click para ver detalles</span>
             <div className="w-16 h-1 bg-gradient-to-r from-transparent via-cyan to-transparent rounded-full opacity-40" />
          </div>
        </div>
        {/* REVERSO */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-10 rounded-[4.5rem] isolate bg-white">
          <div className="absolute inset-0 rounded-[4.5rem] overflow-hidden -z-10">
            <div className="absolute top-1/2 left-1/2 w-[250%] aspect-square animate-aurora opacity-40 group-hover:opacity-100 transition-opacity duration-700"
              style={{ background: `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)` }}
            />
            <div className="absolute inset-[2px] rounded-[4.4rem] bg-white/95" />
          </div>
          <div className="absolute -top-16 flex justify-center w-full"><img src="/assets/grafica.png" className="w-40 h-40 object-contain" /></div>
          <h3 className="text-3xl md:text-5xl font-black italic uppercase text-black mt-12 text-center leading-none flex flex-col items-center">
            <span>Todo en</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum via-cyan to-petroleum">un lugar</span>
          </h3>
          <p className="text-gray-600 text-base font-bold italic px-12 text-center mt-6">Ve de donde vienen tus visitas, qué productos se venden más y qué está funcionando.</p>
        </div>
      </motion.div>
    </div>
  );
};

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

    const tween = gsap.to(horizontalRef.current, {
      x: () => {
        if (!horizontalRef.current) return 0;
        return -(horizontalRef.current.scrollWidth - window.innerWidth);
      },
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        pin: true,
        scrub: 1,
        end: () => `+=${horizontalRef.current?.scrollWidth || 1000}`,
        invalidateOnRefresh: true,
      }
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
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
            <source src="/assets/video.mp4" type="video/mp4" />
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

        {/* 1. Web Strategy */}
        <section className="horizontal-section flex h-screen w-screen items-center justify-center p-6 md:p-20 bg-background relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <FloatingParticlesBackground />
            
            {/* Imagen de fondo sutil: Responsiva */}
            <motion.img 
              src="/assets/alcancia.png"
              alt="Ahorro"
              initial={{ opacity: 0, x: -100, rotate: -15, scale: 1 }}
              whileInView={{ 
                opacity: 0.22, 
                x: 0, 
                scale: 1.4,
                rotate: [-10, -12, -10],
                y: [0, -20, 0]
              }}
              transition={{ 
                opacity: { duration: 2 },
                x: { duration: 2 },
                scale: { duration: 2 },
                rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 5, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute top-1/2 left-[40%] md:left-[5%] -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 md:bottom-[-15%] md:top-auto w-[800px] h-auto pointer-events-none filter blur-[1px]"
            />
          </div>

          {/* VERSIÓN MÓVIL */}
          <div className="relative z-10 w-full max-w-5xl mx-auto flex justify-center px-4 md:hidden">
            <NarrativeFlipCard />
          </div>

          {/* VERSIÓN ESCRITORIO (RESTAURADA) */}
          <div className="hidden md:grid md:grid-cols-2 gap-20 items-center relative z-10 max-w-7xl mx-auto">
            <NarrativeCard className="space-y-10 group relative z-20 perspective-[1000px]">
              <div className="absolute -inset-10 bg-petroleum/5 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div style={{ transformStyle: "preserve-3d" }} className="relative p-12 rounded-[4.5rem] bg-white/10 backdrop-blur-[100px] border border-white/10 shadow-[0_60px_100px_-20px_rgba(0,0,0,0.4)] space-y-10 isolate">
                <AuroraBorder />
                <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-petroleum to-[#001A1A] flex items-center justify-center text-cyan mx-auto"><PiggyBank size={36} /></div>
                <div className="space-y-6">
                  <h3 className="text-6xl font-black text-black italic uppercase tracking-tighter leading-none">Pagas solo <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum to-cyan">si vendes</span></h3>
                  <p className="text-petroleum font-black uppercase tracking-[0.2em] text-[10px]">Sin mensualidades ni pagos fijos</p>
                  <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-sm uppercase tracking-[0.2em] text-[10px]">Solo cobras comisión cuando haces una venta. Sin sorpresas, sin costos mensuales escondidos.</p>
                </div>
              </div>
            </NarrativeCard>
            <NarrativeCard className="relative group z-20 perspective-[1000px]">
              <div style={{ transformStyle: "preserve-3d" }} className="relative w-[450px] h-[550px] rounded-[5rem] bg-white/10 backdrop-blur-[120px] border border-white/10 shadow-[0_60px_100px_-20px_rgba(0,0,0,0.4)] p-12 flex flex-col gap-8 isolate text-center">
                <AuroraBorder />
                <div className="flex-1 bg-background rounded-[3.5rem] border border-white/40 shadow-2xl flex items-center justify-center overflow-hidden relative p-8">
                  <InteractiveDistortion src="/assets/ahorro.png" alt="Ahorra con Bayup" className="w-full h-full relative z-10" strength={0.2} />
                </div>
              </div>
            </NarrativeCard>
          </div>
        </section>
                
                        {/* 2. Marketing ROI */}
                        <section className="horizontal-section flex h-screen w-screen items-center justify-center p-6 md:p-20 bg-[#FFFFFF] relative overflow-hidden">
                          <div className="absolute inset-0 z-0">
                            {/* Imagen de fondo sutil: Megáfono Centrado - Offset Izquierda ++ */}
                            <motion.img 
                              src="/assets/marketing.png" 
                              alt="Marketing Outreach"
                              initial={{ opacity: 0, x: 0, rotate: 15, scale: 1 }}
                              whileInView={{ 
                                opacity: 0.2, 
                                scale: 1.3,
                                rotate: [15, 12, 15],
                                y: [0, 25, 0]
                              }}
                              transition={{ 
                                opacity: { duration: 2 },
                                scale: { duration: 2 },
                                rotate: { duration: 7, repeat: Infinity, ease: "easeInOut" },
                                y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
                              }}
                              className="absolute top-1/2 left-[40%] md:right-[15%] md:left-auto -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 md:bottom-[-10%] md:top-auto w-[700px] h-auto pointer-events-none filter blur-[1px]"
                            />
                          </div>

                          {/* VERSIÓN MÓVIL */}
                          <div className="relative z-10 w-full max-w-5xl mx-auto flex justify-center px-4 md:hidden">
                            <MarketingFlipCard />
                          </div>

                          {/* VERSIÓN ESCRITORIO (RESTAURADA) */}
                          <div className="hidden md:grid grid-cols-2 gap-20 items-center relative z-10 max-w-7xl mx-auto">
                            <NarrativeCard className="order-2 md:order-1 relative group z-20 perspective-[1000px]">       
                              <div style={{ transformStyle: "preserve-3d" }} className="relative w-[450px] h-[550px] rounded-[5rem] bg-white/10 backdrop-blur-[120px] border border-white/10 shadow-[0_60px_100px_-20px_rgba(0,0,0,0.4)] p-12 flex flex-col items-center justify-center isolate">
                                <AuroraBorder />
                                <motion.img src="/assets/marketing.png" className="w-full h-full object-contain rounded-[2rem] relative z-10" />
                              </div>
                            </NarrativeCard>
                            <NarrativeCard className="order-1 md:order-2 relative group z-20 perspective-[1000px]">
                              <div style={{ transformStyle: "preserve-3d" }} className="relative p-12 rounded-[4.5rem] bg-white/10 backdrop-blur-[80px] border border-white/10 shadow-[0_60px_100px_-20px_rgba(0,0,0,0.4)] space-y-10 isolate">
                                <AuroraBorder />
                                <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-petroleum to-[#001A1A] flex items-center justify-center text-cyan mx-auto"><Zap size={36} /></div>
                                <div className="space-y-6">
                                  <h3 className="text-6xl font-black text-black italic uppercase tracking-tighter leading-none">Campañas <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum to-cyan">Inteligentes</span></h3>
                                  <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-sm">Crea campañas basándote en datos reales. Utiliza nuestras herramientas de IA.</p>
                                </div>
                              </div>
                            </NarrativeCard>
                          </div>
                        </section>

        {/* 3. Global Analytics */}
        <section className="horizontal-section flex h-screen w-screen items-center justify-center p-6 md:p-20 bg-background relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            {/* Imagen de fondo sutil: Responsiva */}
            <motion.img 
              src="/assets/grafica.png" 
              alt="Analytics Data"
              initial={{ opacity: 0, x: 100, rotate: 10, scale: 1 }}
              whileInView={{ 
                opacity: 0.2, 
                scale: 1.2,
                rotate: [10, 8, 10],
                y: [0, -20, 0]
              }}
              transition={{ 
                opacity: { duration: 2 },
                scale: { duration: 2 },
                rotate: { duration: 8, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute top-1/2 left-[40%] md:right-[-5%] md:left-auto -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 md:bottom-[-5%] md:top-auto w-[700px] h-auto pointer-events-none filter blur-[1px]"
            />
          </div>

          {/* VERSIÓN MÓVIL */}
          <div className="relative z-10 w-full max-w-5xl mx-auto flex justify-center px-4 md:hidden">
            <AnalyticsFlipCard />
          </div>

          {/* VERSIÓN ESCRITORIO (RESTAURADA) */}
          <div className="hidden md:grid md:grid-cols-2 gap-20 items-center relative z-10 max-w-7xl mx-auto">
            <NarrativeCard className="space-y-10 group relative z-20 perspective-[1000px]">
              <div style={{ transformStyle: "preserve-3d" }} className="relative p-12 rounded-[4.5rem] bg-white/5 backdrop-blur-[100px] border border-white/10 shadow-[0_60px_100px_-20px_rgba(0,0,0,0.4)] space-y-10 isolate">
                <AuroraBorder />
                <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-petroleum to-[#001A1A] flex items-center justify-center text-cyan mx-auto"><LineChart size={36} /></div>
                <div className="space-y-6">
                  <h3 className="text-6xl font-black text-black italic uppercase tracking-tighter leading-none">Estadísticas <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum to-cyan">claras</span></h3>
                  <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-sm">Ve de donde vienen tus visitas, qué productos se venden más y qué está funcionando.</p>
                </div>
              </div>
            </NarrativeCard>
            <div className="grid grid-cols-1 gap-8 pt-10">
              {[ { val: '98%', label: 'Precisión' }, { val: '4.2x', label: 'Más Ventas' }, { val: 'En tiempo real', label: '' } ].map((stat, i) => (
                <AnalyticsCard key={i} stat={stat} />
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

const NarrativeCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set( (e.clientX - rect.left) / rect.width - 0.5 );
    y.set( (e.clientY - rect.top) / rect.height - 0.5 );
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };
  return (
    <motion.div onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className={className}>
      {children}
    </motion.div>
  );
};

const AnalyticsCard = ({ stat }: { stat: any }) => {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Valores para el efecto 3D
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Gradiente interactivo (estilo UP)
    const gradientX = ((e.clientX - rect.left) / rect.width) * 100;
    const gradientY = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x: gradientX, y: gradientY });
    
    // Rotación 3D
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 50, y: 50 });
    x.set(0);
    y.set(0);
  };

  const getIcon = () => {
    if (stat.label === 'Precisión') {
      return (
        <img 
          src="/assets/grafica.png" 
          alt="Precisión" 
          className="w-20 h-20 object-contain relative z-10"
          style={{ filter: "drop-shadow(0 15px 20px rgba(0,242,255,0.4))" }}
        />
      );
    }
    if (stat.label === 'Más Ventas') {
      return (
        <img 
          src="/assets/dinero.png" 
          alt="Ventas" 
          className="w-20 h-20 object-contain relative z-10"
          style={{ filter: "drop-shadow(0 15px 20px rgba(0,242,255,0.4))" }}
        />
      );
    }
    return <Activity size={32} />;
  };

  return (
        <motion.div 
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ 
            rotateX, 
            rotateY, 
            transformStyle: "preserve-3d",
            perspective: "1000px"
          }}
          className={`group relative p-8 rounded-full overflow-visible isolate flex items-center transition-all duration-700 bg-white/10 backdrop-blur-xl border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] hover:border-cyan/20 hover:shadow-[0_40px_80px_-20px_rgba(0,242,255,0.15)] ${stat.val === 'En tiempo real' ? 'justify-center w-[340px]' : 'justify-center gap-10 w-[420px]'} mx-auto`}
        >
          <AuroraBorder />
          {/* Lado Izquierdo: Texto con Profundidad Z */}
          <div className="relative z-10 flex flex-col" style={{ transform: "translateZ(60px)" }}>
            <div 
              className="font-black italic tracking-tighter flex items-center transition-all duration-700 ease-out"
              style={{ 
                backgroundImage: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, #00f2ff 0%, #004d4d 70%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {stat.val === 'En tiempo real' ? (
                <div className="flex flex-col items-center leading-[0.9] uppercase">
                  <span className="text-4xl">En tiempo</span>
                  <span className="text-3xl">real</span>
                </div>
              ) : (
                <div className="flex items-baseline text-5xl">
                  <NumberTicker value={parseFloat(stat.val)} className="font-black" />
                  <span className="text-3xl ml-1">{stat.val.includes('%') ? '%' : 'x'}</span>
                </div>
              )}
            </div>
            {stat.label && <p className="text-[11px] font-black text-petroleum uppercase mt-3 tracking-[0.4em] text-center">{stat.label}</p>}
          </div>
    
          {/* Lado Derecho: Icono 3D Estilo "Pantalla" (Solo si NO es 'En tiempo real') */}
          {stat.val !== 'En tiempo real' && (
            <div className="relative group/icon" style={{ transform: "translateZ(100px)" }}>
              <motion.div 
                className="relative h-24 w-24 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/40 shadow-2xl flex items-center justify-center text-cyan overflow-hidden group-hover:scale-110 transition-transform duration-500"
                animate={{
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {/* Reflejo de luz interna superior */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
    
                <div className="relative z-10 w-full h-full p-2 flex items-center justify-center">
                  {getIcon()}
                </div>
    
                {/* Sombra interna para profundidad */}
                <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(255,255,255,0.1)] rounded-2xl pointer-events-none" />
              </motion.div>
    
              {/* Sombra proyectada en el fondo del card que reacciona a la flotación */}
              <motion.div 
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-black/20 blur-md rounded-full z-0"
                animate={{
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.2, 0.1, 0.2],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          )}
    
          {/* Reflejo de cristal global dinámico */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
    </motion.div>
  );
};