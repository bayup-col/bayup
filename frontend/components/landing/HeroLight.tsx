"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Play, ArrowRight } from "lucide-react";
import { WaterRipple } from "./WaterRipple";
import { TypewriterHeadline } from "./TypewriterHeadline";
import { TypewriterEffect } from "./TypewriterEffect";
import { InteractiveText } from "./InteractiveText";
import { BookButton } from "./BookButton";
import { GlassButton } from "./GlassButton";

const products = [
  { id: 1, name: "Premium Apparel", image: "/assets/Neon Red Animated and Bright Twitch Logo (1).png", detail: "Quality Fabrics" },
  { id: 2, name: "Computing Power", image: "/assets/Neon Red Animated and Bright Twitch Logo (2).png", detail: "Tech Engine" },
  { id: 3, name: "Beauty Luxe", image: "/assets/Neon Red Animated and Bright Twitch Logo (3).png", detail: "High-End Cosmetics" },
  { id: 4, name: "Smart Mobility", image: "/assets/Neon Red Animated and Bright Twitch Logo (4).png", detail: "Eco-Friendly Gear" },
  { id: 5, name: "Next Gen Devices", image: "/assets/Neon Red Animated and Bright Twitch Logo (5).png", detail: "Mobile Innovation" },
  { id: 6, name: "Street Style", image: "/assets/Neon Red Animated and Bright Twitch Logo (6).png", detail: "Urban Sneakers" },
];

export const HeroLight = () => {
  const [productIndex, setProductIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProductIndex((prev) => (prev + 1) % products.length);
    }, 5000); 

    return () => clearInterval(timer);
  }, []);

  return (
    <section id="inicio" className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background pt-20">
      
      <WaterRipple />
      
      <div className="container mx-auto px-12 relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
        
        {/* Left Section: Text & CTAs (Sincronizado) */}
        <div className="lg:col-span-3 space-y-10 min-h-[500px] flex flex-col justify-center">
          <div className="space-y-10">
            <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-gray-100 shadow-sm"
              >
                <span className="h-2 w-2 rounded-full bg-cyan animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-petroleum">
                  La Nueva Era del Comercio Digital
                </span>
              </motion.div>
              
              <div className="text-6xl md:text-8xl font-black text-black leading-[0.9] tracking-tighter italic uppercase">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  CREA TU TIENDA
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="flex items-center flex-wrap gap-x-4"
                >
                  <span>ONLINE</span>
                  <TypewriterEffect 
                    words={["GRATIS", "FACIL", "RAPIDO"]}
                    className="font-black tracking-tighter italic uppercase"
                    colors={["#00F2FF", "#004D4D"]} 
                  />
                </motion.div>
              </div>
            </div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-xl text-gray-500 text-xl font-medium leading-relaxed"
            >
              Deja de vender solo por chat, crea tu página profesional en minutos y dale a tu negocio la imagen que siempre quisiste.
            </motion.p>
          </div>

          {/* BOTONES 3D BOOK APILADOS */}
          <div className="flex flex-wrap gap-10 pt-4">
            <GlassButton href="/register" variant="dark">
              Empieza ahora
            </GlassButton>
          </div>
        </div>

        {/* Right Section: XL EXTREME GLASS Showcase */}
        <div className="lg:col-span-2 relative h-[700px] flex items-center justify-center isolate">
          <AnimatePresence mode="wait">
            <motion.div
              key={productIndex}
              initial={{ opacity: 0, scale: 0.8, rotateY: 30, z: -500 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0, z: 0 }}
              exit={{ opacity: 0, scale: 1.2, rotateY: -30, z: 500 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <div className="absolute w-[500px] h-[500px] bg-cyan/10 rounded-full blur-[150px] animate-pulse" />
              
              <div className="relative group perspective-2000">
                <motion.div 
                  animate={{ y: [0, -30, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-20 p-2"
                >
                  <div className="relative w-[450px] h-[550px] bg-white/[0.02] backdrop-blur-[120px] border-2 border-white/50 rounded-[5rem] shadow-[0_60px_120px_-20px_rgba(0,77,77,0.12)] overflow-hidden flex items-center justify-center group-hover:border-cyan/40 transition-all duration-700 isolate">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-white/20 via-transparent to-transparent rotate-12 pointer-events-none group-hover:rotate-45 transition-transform duration-1000" />
                    
                    <img 
                      src={products[productIndex].image} 
                      alt={products[productIndex].name}
                      className="w-[95%] h-[95%] object-contain relative z-10 drop-shadow-[0_50px_80px_rgba(0,0,0,0.3)] filter brightness-110 contrast-110 group-hover:scale-110 transition-transform duration-700"
                    />
                    
                    <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(255,255,255,0.3)] rounded-[5rem] pointer-events-none" />
                  </div>

                  <motion.div 
                    animate={{ scaleX: [1, 0.8, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-72 h-12 bg-black/5 blur-3xl rounded-full"
                  />
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="absolute -bottom-10 -right-10 bg-black p-10 rounded-[3rem] space-y-2 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.4)] z-30 border border-white/10"
                >
                  <p className="text-cyan text-[10px] font-black uppercase tracking-[0.3em]">{products[productIndex].name}</p>
                  <p className="text-white text-sm font-bold italic opacity-80 uppercase tracking-tighter">{products[productIndex].detail}</p>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/5 to-transparent pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-100 to-transparent opacity-50 z-20" />
    </section>
  );
};