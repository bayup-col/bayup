"use client";

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Play, ArrowRight } from "lucide-react";
import { WaterRipple } from "./WaterRipple";
import { TypewriterHeadline } from "./TypewriterHeadline";
import { TypewriterEffect } from "./TypewriterEffect";
import { InteractiveText } from "./InteractiveText";
import { BookButton } from "./BookButton";
import { GlassButton } from "./GlassButton";

const products = [
  { id: 1, name: "Diseños Diferentes", image: "/assets/gift.gif", detail: "Muestra tus productos \n de manera diferente a tu competencia." },
  { id: 2, name: "Tu Tienda Tech", image: "/assets/gatgets.png", detail: "Digitaliza tu stock tecnológico y escala \n tus ventas a un nivel profesional." },
  { id: 4, name: "Expertos en Hardware", image: "/assets/Neon Red Animated and Bright Twitch Logo (4).png", detail: "Vende laptops, PCs y componentes con \n una interfaz optimizada." },
  { id: 5, name: "Moda con Identidad", image: "/assets/Neon Red Animated and Bright Twitch Logo (5).png", detail: "Lanza tu línea de ropa con una tienda \n que resalta cada detalle de tu diseño." },
  { id: 6, name: "Alcance Global", image: "/assets/maquillaje.png", detail: "Todos tus productos a un solo click \n de distancia de tus nuevos clientes." },
];

// --- COMPONENTE INTERNO: TARJETA 3D INTERACTIVA ---
const ProductCard3D = ({ product, onHover }: { product: typeof products[0], onHover: (hovering: boolean) => void }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Suavizado del movimiento del mouse
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  // Transformaciones 3D (Tilt)
  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-15deg", "15deg"]);
  
  // Parallax de la imagen (Se mueve opuesto y más fuerte para salir del marco)
  const imgX = useTransform(mouseX, [-0.5, 0.5], ["-25px", "25px"]);
  const imgY = useTransform(mouseY, [-0.5, 0.5], ["-25px", "25px"]);

  // Brillo dinámico sobre el cristal
  const shineOpacity = useTransform(mouseX, [-0.5, 0.5], [0, 0.4]);
  const shineX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    onHover(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Calcular posición normalizada (-0.5 a 0.5)
    const mouseXPos = (e.clientX - rect.left) / width - 0.5;
    const mouseYPos = (e.clientY - rect.top) / height - 0.5;
    
    x.set(mouseXPos);
    y.set(mouseYPos);
  };

  const handleMouseLeave = () => {
    onHover(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8, rotateY: 30, z: -500 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0, z: 0 }}
      exit={{ opacity: 0, scale: 1.2, rotateY: -30, z: 500 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full h-full flex items-center justify-center perspective-2000"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute w-[500px] h-[500px] bg-cyan/10 rounded-full blur-[150px] animate-pulse" />
      
      {/* Contenedor Giratorio 3D */}
      <motion.div 
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative z-20 p-2 cursor-pointer group"
      >
        {/* Marco de Cristal */}
        <div className="relative w-[450px] h-[550px] rounded-[5rem] shadow-[0_60px_120px_-20px_rgba(0,77,77,0.25)] flex items-center justify-center transition-all duration-700 isolate transform-gpu bg-black/5">
          
          {/* 1. AURORA BORDER (Fondo Animado) */}
          <div className="absolute inset-0 rounded-[5rem] overflow-hidden -z-20">
            <div 
              className="absolute top-1/2 left-1/2 w-[250%] aspect-square animate-aurora opacity-60 group-hover:opacity-100 transition-opacity duration-700"
              style={{
                background: `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)`,
                willChange: 'transform'
              }}
            />
          </div>

          {/* 2. Glass Panel Body */}
          <div className="absolute inset-[3px] rounded-[4.8rem] bg-white/10 backdrop-blur-[40px] border border-white/30 z-0 overflow-hidden">
             {/* Reflejo Dinámico (Glare) */}
             <motion.div 
                style={{ opacity: shineOpacity, left: shineX }}
                className="absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 blur-2xl pointer-events-none"
             />
          </div>

          {/* 3. Imagen con Parallax (Pop-out effect) */}
          <div className="relative z-10 w-[110%] h-[110%] flex items-center justify-center" style={{ transformStyle: "preserve-3d" }}>
            <motion.img 
              style={{ x: imgX, y: imgY, z: 100 }}
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-contain drop-shadow-[0_50px_80px_rgba(0,0,0,0.5)] filter brightness-110 contrast-110 transition-transform duration-100"
            />
          </div>
          
          {/* Brillo interior estático */}
          <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(255,255,255,0.2)] rounded-[5rem] pointer-events-none z-20" />
        </div>

        {/* Sombra de suelo flotante */}
        <motion.div 
          animate={{ scaleX: [1, 0.8, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-72 h-12 bg-black/20 blur-3xl rounded-full"
        />
        
        {/* Info Tag Flotante */}
        <motion.div 
          style={{ z: 100, x: imgX, y: imgY }}
          className="absolute bottom-12 -right-6 bg-white/90 backdrop-blur-md p-6 rounded-[2rem] space-y-1 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.2)] border border-white/40"
        >
          <p className="text-petroleum text-[10px] font-black uppercase tracking-[0.3em]">{product.name.toUpperCase()}</p>
          <p className="text-black/60 text-xs font-bold italic tracking-tighter whitespace-pre-line lowercase first-letter:uppercase">{product.detail}</p>
        </motion.div>

      </motion.div>
    </motion.div>
  );
};

export const HeroLight = () => {
  const [productIndex, setProductIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setProductIndex((prev) => (prev + 1) % products.length);
    }, 5000); 

    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <section id="inicio" className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050505] pt-20">
      
      {/* Dynamic Background: Cinematic Video OM (Increased Luminosity) */}
      <div className="absolute inset-0 z-0">
        <video 
          key="om-video-luminous"
          autoPlay 
          muted 
          loop 
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-55 filter brightness-130 contrast-110 pointer-events-none"
        >
          <source src="/assets/om.mp4" type="video/mp4" />
        </video>
        {/* Overlay Capa de Contraste Suavizada */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-transparent to-[#050505]/70 z-10" />
      </div>
      
      <div className="container mx-auto px-12 relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
        
        {/* Left Section: Text & CTAs (Sincronizado) */}
        <div className="lg:col-span-3 space-y-10 min-h-[500px] flex flex-col justify-center">
          <div className="space-y-10">
            <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white border border-gray-100 shadow-[0_10px_30px_-5px_rgba(0,77,77,0.15)] relative group/tag overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan/5 to-transparent opacity-0 group-hover/tag:opacity-100 transition-opacity" />
                <span className="h-2 w-2 rounded-full bg-cyan animate-pulse shadow-[0_0_10px_#00f2ff]" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-petroleum relative z-10">
                  La Nueva Era del Comercio Digital
                </span>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan/20 to-transparent" />
              </motion.div>
              
              <div className="font-black text-black leading-[0.85] tracking-tighter italic uppercase drop-shadow-2xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/60 whitespace-nowrap"
                  style={{ fontSize: "clamp(3rem, 8vw, 6rem)" }}
                >
                  CREA TU TIENDA
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="flex items-center flex-wrap lg:flex-nowrap gap-x-4 whitespace-nowrap"
                  style={{ fontSize: "clamp(3rem, 8vw, 6rem)" }}
                >
                  <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">ONLINE</span>
                  <TypewriterEffect 
                    words={["GRATIS", "FÁCIL", "RÁPIDO"]}
                    className="font-black tracking-tighter italic uppercase"
                    colors={["#00F2FF", "#004D4D"]} 
                  />
                </motion.div>
              </div>
            </div>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-xl text-white text-xl font-bold leading-relaxed drop-shadow-[0_0_25px_rgba(255,255,255,0.7)]"
            >
              Deja de vender solo por chat, crea tu página profesional en minutos y dale a tu negocio la imagen que siempre quisiste.
            </motion.p>
          </div>

          {/* BOTONES 3D BOOK APILADOS */}
          <div className="flex flex-col gap-4 pt-4 items-center lg:items-start">
            <div className="flex flex-col items-center lg:items-start">
              <div className="relative group">
                {/* Sombra masiva para efecto 3D real */}
                <div className="absolute -inset-1 bg-cyan/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
                <div className="relative shadow-[0_30px_60px_-10px_rgba(0,0,0,0.5)] rounded-2xl group-hover:shadow-[0_40px_80px_-15px_rgba(0,242,255,0.4)] transition-all duration-500">
                  <GlassButton href="/register" variant="primary">
                    Empieza ahora
                  </GlassButton>
                </div>
              </div>
              
              {/* Texto de confianza debajo del botón */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-2 pt-4 px-2 justify-center lg:justify-start"
              >
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20 border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                  <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white text-sm font-medium drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                  Sin tarjetas de crédito
                </span>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Right Section: XL EXTREME GLASS Showcase (Interactive 3D) */}
        <div className="lg:col-span-2 relative h-[700px] flex items-center justify-center isolate">
          <AnimatePresence mode="wait">
            <ProductCard3D 
              key={products[productIndex].id} 
              product={products[productIndex]} 
              onHover={setIsPaused}
            />
          </AnimatePresence>
        </div>

      </div>

      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/5 to-transparent pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-100 to-transparent opacity-50 z-20" />
    </section>
  );
};