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
        
        {/* 0. Intro Section - PREMIUM INTERACTIVE BACKGROUND */}
        <div className="horizontal-section h-screen w-screen relative flex items-center justify-center bg-[#050505] overflow-hidden">
          <InteractiveAuraBackground />
          <div className="max-w-7xl text-center flex flex-col items-center relative z-10 px-6 gap-8">
            <h2 className="text-6xl md:text-8xl lg:text-[7rem] font-black tracking-tighter uppercase leading-[1] italic flex flex-col items-center">
              <span className="text-white whitespace-nowrap">EL MUNDO ESTÁ LISTO</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan via-white to-cyan whitespace-nowrap">PARA COMPRARTE.</span>
            </h2>
            <p className="text-xl md:text-2xl font-black text-white italic tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(0,242,255,0.8)]">
              Bayup te da las herramientas <span className="text-cyan">para lograrlo</span>
            </p>
          </div>
        </div>

        {/* 1. Web Strategy */}
        <section className="horizontal-section flex h-screen w-screen items-center justify-center p-20 bg-background relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <FloatingParticlesBackground />
            
            {/* Imagen de fondo sutil: Alcancía */}
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
              className="absolute bottom-[-15%] left-[5%] w-[800px] h-auto pointer-events-none filter blur-[1px]"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center relative z-10">
            <NarrativeCard className="space-y-10 group relative z-20 perspective-[1000px]">
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

              <div 
                style={{ transformStyle: "preserve-3d" }}
                className="relative p-12 rounded-[4.5rem] bg-white/10 backdrop-blur-[100px] border border-white/10 shadow-[0_60px_100px_-20px_rgba(0,0,0,0.4)] space-y-10 isolate group-hover:border-cyan/20 transition-all duration-700 group-hover:shadow-[0_80px_150px_-30px_rgba(0,242,255,0.2)]"
              >
                <AuroraBorder />
                {/* Reflejo de luz interna (Volumen superior) */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                
                <div 
                  style={{ 
                    transform: "translateZ(120px)",
                    transformStyle: "preserve-3d"
                  }} 
                  className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-petroleum to-[#001A1A] flex items-center justify-center text-cyan shadow-[0_40px_70px_-10px_rgba(0,0,0,0.6)] relative overflow-visible group-hover:scale-110 group-hover:shadow-[0_50px_90px_-20px_rgba(0,242,255,0.5)] transition-all duration-500 mx-auto"
                >
                  {/* Sombra de contacto bajo el icono */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-black/40 blur-xl rounded-full" />
                  
                  <motion.div
                    animate={{ rotateY: [0, 10, 0], rotateX: [0, 5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10"
                    style={{ transform: "translateZ(30px)" }}
                  >
                    <PiggyBank size={36} />
                  </motion.div>
                  
                  {/* Brillo en el borde del icono */}
                  <div className="absolute inset-0 border border-white/20 rounded-[2rem] pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]" />
                </div>
                
                <div style={{ transform: "translateZ(80px)" }} className="space-y-6">
                  <h3 className="text-6xl font-black text-black italic uppercase tracking-tighter leading-none drop-shadow-[0_20px_30px_rgba(0,0,0,0.2)]">Pagas solo <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum to-cyan uppercase tracking-widest">si vendes</span></h3>
                  <p className="text-petroleum font-black uppercase tracking-[0.2em] text-[10px] drop-shadow-sm">Sin mensualidades ni pagos fijos</p>
                  <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-sm uppercase tracking-[0.2em] text-[10px] drop-shadow-sm">Solo cobras comisión cuando haces una venta. Sin sorpresas, sin costos mensuales escondidos. ¡Transparencia total!</p>
                </div>

                {/* Brillo en el borde inferior para simular grosor de cristal */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan/40 to-transparent blur-[2px]" />
              </div>
            </NarrativeCard>

            <NarrativeCard className="relative group z-20 perspective-[1000px]">
              <div className="absolute -inset-20 bg-petroleum/10 rounded-full blur-[120px] animate-pulse" />
              
              <div 
                style={{ transformStyle: "preserve-3d" }}
                className="relative w-[450px] h-[550px] rounded-[5rem] bg-white/10 backdrop-blur-[120px] border border-white/10 shadow-[0_60px_100px_-20px_rgba(0,0,0,0.4)] p-12 flex flex-col gap-8 isolate text-center group-hover:border-cyan/20 transition-all duration-700 group-hover:shadow-[0_80px_150px_-30px_rgba(0,242,255,0.25)]"
              >
                <AuroraBorder />
                {/* Reflejo de luz interna (Volumen superior) */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                
                <div style={{ transform: "translateZ(60px)" }} className="h-6 w-32 bg-petroleum/20 rounded-full border border-petroleum/10 shadow-inner mx-auto" />
                
                <div style={{ transform: "translateZ(100px)" }} className="flex-1 bg-background rounded-[3.5rem] border border-white/40 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex items-center justify-center group/screen overflow-hidden relative p-8">
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

                  {/* Imagen con Distorsión Interactiva Premium */}
                  <InteractiveDistortion 
                    src="/assets/ahorro.png" 
                    alt="Ahorra con Bayup" 
                    className="w-full h-full relative z-10"
                    strength={0.2}
                  />

                  {/* Destello de luz superior */}
                  <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-20 pointer-events-none" />   
                </div>
                
                {/* Brillo en el borde inferior para simular grosor de cristal */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan/40 to-transparent blur-[2px]" />
                
                <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(255,255,255,0.2)] rounded-[5rem] pointer-events-none" />        
              </div>
            </NarrativeCard>
          </div>
        </section>
                
                        {/* 2. Marketing ROI */}
                        <section className="horizontal-section flex h-screen w-screen items-center justify-center p-20 bg-[#FFFFFF] relative overflow-hidden">
                          <div className="absolute inset-0 z-0">
                            {/* Imagen de fondo sutil: Megáfono de Marketing */}
                            <motion.img 
                              src="https://framerusercontent.com/images/4vXvOnZ6ZpZ6z6ZpZ6z6ZpZ6z6.png" 
                              alt="Marketing Outreach"
                              initial={{ opacity: 0, x: 100, rotate: 15, scale: 1 }}
                              whileInView={{ 
                                opacity: 0.2, 
                                x: -100, 
                                scale: 1.3,
                                rotate: [15, 12, 15],
                                y: [0, 25, 0]
                              }}
                              transition={{ 
                                opacity: { duration: 2 },
                                x: { duration: 2 },
                                scale: { duration: 2 },
                                rotate: { duration: 7, repeat: Infinity, ease: "easeInOut" },
                                y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
                              }}
                              className="absolute bottom-[-10%] right-[15%] w-[700px] h-auto pointer-events-none filter blur-[1px]"
                              onError={(e) => {
                                e.currentTarget.src = "/assets/marketing.png";
                              }}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center relative z-10">
                            {/* Card Izquierda: Imagen Marketing */}
                            <NarrativeCard className="order-2 md:order-1 relative group z-20 perspective-[1000px]">       
                              <div className="absolute -inset-20 bg-cyan/5 rounded-full blur-[120px] animate-pulse" />
                
                              <div 
                                style={{ transformStyle: "preserve-3d" }}
                                className="relative w-[450px] h-[550px] rounded-[5rem] bg-white/10 backdrop-blur-[120px] border border-white/10 shadow-[0_60px_100px_-20px_rgba(0,0,0,0.4)] p-12 flex flex-col items-center justify-center text-center gap-10 isolate group-hover:border-cyan/20 transition-all duration-700 group-hover:shadow-[0_80px_150px_-30px_rgba(0,242,255,0.2)]"
                              >
                                <AuroraBorder />
                                {/* Reflejo de luz interna (Volumen superior) */}
                                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

                                <motion.img 
                                  src="/assets/marketing.png" 
                                  alt="Marketing Inteligente Bayup" 
                                  className="w-full h-full object-contain rounded-[2rem] relative z-10"
                                  style={{ 
                                    filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.3))",
                                    transform: "translateZ(100px)"
                                  }}
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

                                {/* Brillo en el borde inferior para simular grosor de cristal */}
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan/40 to-transparent blur-[2px]" />
                                <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(255,255,255,0.3)] rounded-[5rem] pointer-events-none" />        
                              </div>
                            </NarrativeCard>
                
                            {/* Card Derecha: Texto Marketing */}
                            <NarrativeCard className="order-1 md:order-2 relative group z-20 perspective-[1000px]">
                              <div className="absolute -inset-10 bg-cyan/5 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                              <div 
                                style={{ transformStyle: "preserve-3d" }}
                                className="relative p-12 rounded-[4.5rem] bg-white/10 backdrop-blur-[80px] border border-white/10 shadow-[0_60px_100px_-20px_rgba(0,0,0,0.4)] space-y-10 isolate group-hover:border-cyan/20 transition-all duration-700 group-hover:shadow-[0_80px_150px_-30px_rgba(0,242,255,0.2)]"
                              >
                                <AuroraBorder />
                                {/* Reflejo de luz interna (Volumen superior) */}
                                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

                                <div 
                                  style={{ 
                                    transform: "translateZ(120px)",
                                    transformStyle: "preserve-3d"
                                  }} 
                                  className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-petroleum to-[#001A1A] flex items-center justify-center text-cyan shadow-[0_40px_70px_-10px_rgba(0,0,0,0.6)] relative overflow-visible group-hover:scale-110 group-hover:shadow-[0_50px_90px_-20px_rgba(0,242,255,0.5)] transition-all duration-500 mx-auto"
                                >
                                  {/* Sombra de contacto bajo el icono */}
                                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-black/40 blur-xl rounded-full" />
                                  
                                  <motion.div
                                    animate={{ rotateY: [0, 10, 0], rotateX: [0, 5, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="relative z-10"
                                    style={{ transform: "translateZ(30px)" }}
                                  >
                                    <Zap size={36} />
                                  </motion.div>
                                  
                                  {/* Brillo en el borde del icono */}
                                  <div className="absolute inset-0 border border-white/20 rounded-[2rem] pointer-events-none" />
                                </div>
                
                                <div style={{ transform: "translateZ(80px)" }} className="space-y-6">
                                  <h3 className="text-6xl font-black text-black italic uppercase tracking-tighter leading-none drop-shadow-[0_20px_30px_rgba(0,0,0,0.2)]">Campañas <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum to-cyan uppercase tracking-widest">Inteligentes</span></h3>
                                  <p className="text-cyan font-black uppercase tracking-[0.2em] text-[10px] drop-shadow-sm">Conoce tus datos reales</p>
                                  <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-sm uppercase tracking-[0.2em] text-[10px] drop-shadow-sm">
                                    Crea campañas basándote en datos reales de tus plataformas de venta. Utiliza nuestras herramientas de IA que te recomendarán las mejores acciones para lograr campañas realmente efectivas.
                                  </p>
                                </div>

                                {/* Brillo en el borde inferior para simular grosor de cristal */}
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan/40 to-transparent blur-[2px]" />
                              </div>
                            </NarrativeCard>
                          </div>
                        </section>

        {/* 3. Global Analytics */}
        <section className="horizontal-section flex h-screen w-screen items-center justify-center p-20 bg-background relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            {/* Imagen de fondo sutil: Gráfica de Estadísticas */}
            <motion.img 
              src="https://framerusercontent.com/images/5zYvOnZ6ZpZ6z6ZpZ6z6ZpZ6z6.png" 
              alt="Analytics Data"
              initial={{ opacity: 0, x: 100, rotate: 10, scale: 1 }}
              whileInView={{ 
                opacity: 0.2, 
                x: 0, 
                scale: 1.2,
                rotate: [10, 8, 10],
                y: [0, -20, 0]
              }}
              transition={{ 
                opacity: { duration: 2 },
                x: { duration: 2 },
                scale: { duration: 2 },
                rotate: { duration: 8, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute bottom-[-5%] right-[-5%] w-[700px] h-auto pointer-events-none filter blur-[1px]"
              onError={(e) => {
                e.currentTarget.src = "/assets/grafica.png";
              }}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center relative z-10">
            <NarrativeCard className="space-y-10 group relative z-20 perspective-[1000px]">
              <div className="absolute -inset-10 bg-petroleum/5 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div 
                style={{ transformStyle: "preserve-3d" }}
                className="relative p-12 rounded-[4.5rem] bg-white/5 backdrop-blur-[100px] border border-white/10 shadow-[0_60px_100px_-20px_rgba(0,0,0,0.4)] space-y-10 isolate group-hover:border-cyan/20 transition-all duration-700 group-hover:shadow-[0_80px_150px_-30px_rgba(0,242,255,0.2)]"
              >
                <AuroraBorder />
                {/* Reflejo de luz interna (Volumen superior) */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                
                <div 
                  style={{ 
                    transform: "translateZ(120px)",
                    transformStyle: "preserve-3d"
                  }} 
                  className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-petroleum to-[#001A1A] flex items-center justify-center text-cyan shadow-[0_40px_70px_-10px_rgba(0,0,0,0.6)] relative overflow-visible group-hover:scale-110 group-hover:shadow-[0_50px_90px_-20px_rgba(0,242,255,0.5)] transition-all duration-500 mx-auto"
                >
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-black/40 blur-xl rounded-full" />
                  <motion.div
                    animate={{ rotateY: [0, 10, 0], rotateX: [0, 5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10"
                    style={{ transform: "translateZ(30px)" }}
                  >
                    <LineChart size={36} />
                  </motion.div>
                </div>

                <div style={{ transform: "translateZ(80px)" }} className="space-y-6 relative z-10">
                  <h3 className="text-6xl font-black text-black italic uppercase tracking-tighter leading-none drop-shadow-[0_20px_30px_rgba(0,0,0,0.2)]">Estadísticas <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum to-cyan uppercase tracking-widest">claras</span></h3>
                  <p className="text-cyan font-black uppercase tracking-[0.2em] text-[10px] drop-shadow-sm">Entiende a tus clientes</p>
                  <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-sm uppercase tracking-[0.2em] text-[10px] drop-shadow-sm">Ve de donde vienen tus visitas, qué productos se venden más y qué está funcionando en tu tienda</p>
                </div>

                {/* Brillo en el borde inferior para simular grosor de cristal */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan/40 to-transparent blur-[2px]" />
              </div>
            </NarrativeCard>
            <div className="grid grid-cols-1 gap-8 pt-10">
              {[ 
                { val: '98%', label: 'Precisión' }, 
                { val: '4.2x', label: 'Más Ventas' }, 
                { val: 'En tiempo real', label: '' } 
              ].map((stat, i) => (
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