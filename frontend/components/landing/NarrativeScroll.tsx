"use client";

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useGSAP } from "@gsap/react";
import { Layout, Target, LineChart, Zap } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, useScroll } from 'framer-motion';
import { NumberTicker } from './NumberTicker';
import { RollingText } from './RollingText';
import { LiquidImage } from './LiquidImage';

export const NarrativeScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lógica de Framer Motion (Solo se activa cuando está montado)
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
        
        {/* Intro Section - Liquid Background */}
        <LiquidImage
          image="/assets/mundobayup.png"
          alt="Fondo de red global Bayup"
          className="horizontal-section h-screen w-screen"
          distortionScale={0.4}
          speed={0.3}
          tint="#000000"
          opacity={0.8}
        >
          <div className="max-w-5xl text-center flex flex-col items-center relative z-10 px-6">
            <div className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.9] flex flex-col items-center">
              <div className="text-white filter drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
                <RollingText text="EL MUNDO ESTA LISTO" className="flex-nowrap" />
              </div>
              <div className="text-transparent bg-clip-text bg-gradient-to-r from-cyan via-white to-cyan">
                <RollingText text="PARA COMPRARTE." className="flex-nowrap" />
              </div>
            </div>
            <motion.div 
              style={{ width: lineWidth, opacity: lineOpacity }}
              className="h-[2px] bg-cyan mt-12 mx-auto shadow-[0_0_20px_#00f2ff] relative"
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 bg-cyan blur-md rounded-full" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 bg-cyan blur-md rounded-full" />
            </motion.div>
          </div>
        </LiquidImage>

        {/* 1. Web Strategy */}
        <section className="horizontal-section flex h-screen w-screen items-center justify-center p-20 bg-background">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <NarrativeCard className="space-y-10 group relative">
              <div className="absolute -inset-10 bg-petroleum/5 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              {/* Sombra proyectada para el card de texto */}
              <motion.div 
                className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-black/20 blur-3xl rounded-[100%] z-0"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.2, 0.1, 0.2],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              <div className="relative p-12 rounded-[4.5rem] bg-white/10 backdrop-blur-[100px] border-2 border-white/60 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] space-y-10 overflow-hidden isolate group-hover:border-cyan/40 transition-all duration-700">
                {/* Reflejo de luz interna */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                
                <div style={{ transform: "translateZ(40px)" }} className="h-20 w-20 rounded-3xl bg-petroleum flex items-center justify-center text-cyan shadow-2xl relative overflow-hidden group-hover:scale-110 group-hover:shadow-cyan/20 transition-all duration-500">
                  <Layout size={32} />
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                                <div style={{ transform: "translateZ(30px)" }} className="space-y-6">
                                  <h3 className="text-6xl font-black text-black italic uppercase tracking-tighter leading-none">Pagas solo <br /> <span className="text-petroleum uppercase tracking-widest">si vendes</span></h3>
                                  <p className="text-petroleum font-black uppercase tracking-[0.2em] text-[10px]">Sin mensualidades ni pagos fijos</p>
                                  <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-sm uppercase tracking-[0.2em] text-[10px]">Solo cobras comisión cuando haces una venta. Sin sorpresas, sin costos mensuales escondidos. ¡Transparencia total!</p>
                                </div>
                              </div>
                            </NarrativeCard>
                            <NarrativeCard className="relative group">
                              <div className="absolute -inset-20 bg-petroleum/10 rounded-full blur-[120px] animate-pulse" />
                              <div className="relative w-[450px] h-[550px] rounded-[5rem] bg-white/5 backdrop-blur-[120px] border-2 border-white/60 shadow-[0_50px_100px_-20px_rgba(0,77,77,0.15)] p-12 flex flex-col gap-8 overflow-hidden isolate text-center group-hover:border-cyan/30 transition-all duration-700">
                                <div style={{ transform: "translateZ(30px)" }} className="h-6 w-32 bg-petroleum/20 rounded-full border border-petroleum/10 shadow-inner mx-auto" />
                                <div style={{ transform: "translateZ(50px)" }} className="flex-1 bg-background rounded-[3.5rem] border border-white/40 shadow-2xl flex items-center justify-center group/screen overflow-hidden relative p-8">
                                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                                  {/* Sombra proyectada en el "suelo" del card que reacciona a la flotación */}
                                  <motion.div 
                                    className="absolute bottom-12 left-1/2 -translate-x-1/2 w-1/2 h-6 bg-black/30 blur-2xl rounded-[100%] z-0"
                                    animate={{
                                      scale: [0.8, 1.1, 0.8],
                                      opacity: [0.3, 0.15, 0.3],
                                    }}
                                    transition={{
                                      duration: 4,
                                      repeat: Infinity,
                                      ease: "easeInOut"
                                    }}
                                  />
                
                                  <motion.img 
                                    src="/assets/ahorro.png" 
                                    alt="Ahorra con Bayup" 
                                    className="w-full h-full object-contain rounded-[2rem] relative z-10"
                                    style={{ filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.4))" }}
                                    animate={{
                                      y: [0, -20, 0],
                                    }}
                                    transition={{
                                      duration: 4,
                                      repeat: Infinity,
                                      ease: "easeInOut"
                                    }}
                                    whileHover={{ 
                                      scale: 1.05,
                                      filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.5))"
                                    }}
                                  />
                
                                  {/* Destello de luz superior */}
                                  <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-20 pointer-events-none" />   
                                </div>
                                <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(255,255,255,0.2)] rounded-[5rem] pointer-events-none" />        
                              </div>
                            </NarrativeCard>
                          </div>
                        </section>
                
                        {/* 2. Marketing ROI */}
                        <section className="horizontal-section flex h-screen w-screen items-center justify-center p-20 bg-[#FFFFFF]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                            {/* Card Izquierda: Imagen Marketing */}
                            <div className="order-2 md:order-1 relative group">       
                              <div className="absolute -inset-20 bg-cyan/5 rounded-full blur-[120px] animate-pulse" />
                
                              {/* Sombra proyectada */}
                              <motion.div 
                                className="absolute bottom-12 left-1/2 -translate-x-1/2 w-1/2 h-6 bg-black/20 blur-2xl rounded-[100%] z-0"
                                animate={{
                                  scale: [0.8, 1.1, 0.8],
                                  opacity: [0.2, 0.1, 0.2],
                                }}
                                transition={{
                                  duration: 4,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              />
                
                              <div className="relative w-[450px] h-[550px] rounded-[5rem] bg-white/5 backdrop-blur-[120px] border-2 border-white/60 shadow-[0_50px_100px_-20px_rgba(0,77,77,0.15)] p-12 flex flex-col items-center justify-center text-center gap-10 overflow-hidden isolate group-hover:border-cyan/30 transition-all duration-700">
                                <motion.img 
                                  src="/assets/marketing.png" 
                                  alt="Marketing Inteligente Bayup" 
                                  className="w-full h-full object-contain rounded-[2rem] relative z-10"
                                  style={{ filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.3))" }}
                                  animate={{
                                    y: [0, -20, 0],
                                  }}
                                  transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: 0.5
                                  }}
                                  whileHover={{ 
                                    scale: 1.05,
                                    filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.4))"
                                  }}
                                />
                                <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(255,255,255,0.3)] rounded-[5rem] pointer-events-none" />        
                              </div>
                            </div>
                
                            {/* Card Derecha: Texto Marketing */}
                            <NarrativeCard className="order-1 md:order-2 relative group">
                              <div className="absolute -inset-10 bg-cyan/5 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                              {/* Sombra proyectada para el card de texto */}
                              <motion.div 
                                className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-black/10 blur-3xl rounded-[100%] z-0"
                                animate={{
                                  scale: [1, 1.05, 1],
                                  opacity: [0.15, 0.05, 0.15],
                                }}
                                transition={{
                                  duration: 4,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                  delay: 0.5
                                }}
                              />
                
                              <div className="relative p-12 rounded-[4.5rem] bg-white/10 backdrop-blur-[80px] border-2 border-white/40 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.05)] space-y-10 overflow-hidden isolate group-hover:border-cyan/30 transition-all duration-700">
                                <div style={{ transform: "translateZ(40px)" }} className="h-20 w-20 rounded-3xl bg-petroleum flex items-center justify-center text-cyan shadow-xl relative overflow-hidden group-hover:scale-110 transition-all duration-500">
                                  <Zap size={32} />
                                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                
                                <div style={{ transform: "translateZ(30px)" }} className="space-y-6">
                                  <h3 className="text-6xl font-black text-black italic uppercase tracking-tighter leading-none">MARKETING <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum to-cyan uppercase tracking-widest">ROI</span></h3>                  <p className="text-cyan font-black uppercase tracking-[0.2em] text-[10px]">Campañas inteligentes · Conoce tus datos reales</p>
                  <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-sm uppercase tracking-[0.2em] text-[10px]">
                    Crea campañas basándote en datos reales de tus plataformas de venta. Utiliza nuestras herramientas de IA que te recomendarán las mejores acciones para lograr campañas realmente efectivas.
                  </p>
                </div>
              </div>
            </NarrativeCard>
          </div>
        </section>

        {/* 3. Global Analytics */}
        <section className="horizontal-section flex h-screen w-screen items-center justify-center p-20 bg-background">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <NarrativeCard className="space-y-10 group relative">
              <div className="absolute -inset-10 bg-petroleum/5 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative p-12 rounded-[4.5rem] bg-white/5 backdrop-blur-[80px] border-2 border-white/40 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.05)] space-y-10 overflow-hidden isolate group-hover:border-cyan/30 transition-all duration-700">
                <div style={{ transform: "translateZ(40px)" }} className="h-20 w-20 rounded-full bg-white border border-gray-100 flex items-center justify-center text-petroleum shadow-2xl relative overflow-hidden group-hover:scale-110 transition-all duration-500"><LineChart size={32} /></div>
                <div style={{ transform: "translateZ(30px)" }} className="space-y-6"><h3 className="text-6xl font-black text-black italic uppercase tracking-tighter leading-none">03. ANALYTICS <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum to-cyan uppercase tracking-widest">GLOBAL</span></h3></div>
              </div>
            </NarrativeCard>
            <div className="grid grid-cols-1 gap-8 pt-10">
              {[ { val: '98%', label: 'Precision' }, { val: '4.2x', label: 'Conversion' }, { val: 'Realtime', label: 'Feedback' } ].map((stat, i) => (
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
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);
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
  return (
    <div className="group relative p-12 rounded-[4rem] overflow-hidden isolate flex items-center justify-between w-[400px] mx-auto transition-all duration-700 bg-white/10 backdrop-blur-xl border border-white/20">
      <div className="relative z-10">
        <div className="text-5xl font-black text-black italic tracking-tighter flex items-baseline">
          {stat.val === 'Realtime' ? (<span>Realtime</span>) : (
            <><NumberTicker value={parseFloat(stat.val)} className="text-5xl font-black" /><span className="text-3xl ml-1">{stat.val.includes('%') ? '%' : 'x'}</span></>
          )}
        </div>
        <p className="text-[11px] font-black text-petroleum uppercase mt-3 tracking-[0.4em]">{stat.label}</p>
      </div>
      <div className="relative flex items-center justify-center">
        <div className="absolute h-12 w-12 bg-cyan/10 rounded-full blur-xl animate-pulse" />
        <div className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_15px_#00f2ff] relative z-10" />
      </div>
    </div>
  );
};