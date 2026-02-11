"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Play, Laptop, Smartphone, ShoppingBag, Watch, Bike } from "lucide-react";

const products = [
  { 
    id: 1, 
    name: "Computing Power", 
    icon: <Laptop size={120} strokeWidth={1} />, 
    color: "from-[#00f2ff] to-[#004d4d]",
    detail: "High-Performance Workstations"
  },
  { 
    id: 2, 
    name: "Digital Gear", 
    icon: <Smartphone size={120} strokeWidth={1} />, 
    color: "from-blue-500 to-indigo-600",
    detail: "Next-Gen Mobile Systems"
  },
  { 
    id: 3, 
    name: "Luxury Goods", 
    icon: <ShoppingBag size={120} strokeWidth={1} />, 
    color: "from-amber-400 to-orange-600",
    detail: "Premium Fashion Experience"
  },
  { 
    id: 4, 
    name: "Smart Precision", 
    icon: <Watch size={120} strokeWidth={1} />, 
    color: "from-rose-500 to-purple-600",
    detail: "Wearable Intelligence"
  },
];

export const Hero = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % products.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0B0B0B]">
      
      {/* 1. Capa de Fondo Cinematográfica */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,77,77,0.15),transparent_70%)]" />
        {/* Efecto de rejilla futurista sutil */}
        <div className="absolute inset-0 opacity-[0.05]" 
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '100px 100px' }} 
        />
      </div>

      <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pt-20">
        
        {/* Texto Izquierda: Elegancia y Poder */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-10"
        >
          <div className="space-y-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "80px" }}
              className="h-1 bg-[#00f2ff]"
            />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#00f2ff]">The Future of Commerce</p>
          </div>
          
          <h1 className="text-7xl md:text-9xl font-black text-white leading-[0.85] tracking-tighter italic">
            LIMITLESS <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#00f2ff] to-[#004d4d]">
              RETAIL.
            </span>
          </h1>
          
          <p className="max-w-md text-gray-400 text-lg font-medium leading-relaxed border-l-2 border-white/10 pl-6">
            Construye un imperio digital con Bayup. Una arquitectura 3D-Native diseñada para marcas que dictan las reglas del mañana.
          </p>

          <div className="flex flex-wrap gap-6 pt-4">
            <button className="relative group overflow-hidden px-10 py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              <span className="relative z-10">Empieza ahora</span>
              <div className="absolute inset-0 bg-[#00f2ff] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </button>
            <button className="px-10 py-5 bg-white/5 text-white border border-white/10 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center gap-3 group">
              <Play size={14} className="fill-[#00f2ff] text-[#00f2ff]" /> Ver Demo
            </button>
          </div>
        </motion.div>

        {/* Showcase de Ilustraciones 3D Derecha */}
        <div className="relative h-[600px] flex items-center justify-center perspective-2000">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8, rotateX: 45, rotateY: -45, z: -500 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0, rotateY: 0, z: 0 }}
              exit={{ opacity: 0, scale: 1.2, rotateX: -45, rotateY: 45, z: 500 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full h-full flex items-center justify-center"
            >
              {/* Aura de iluminación dinámica */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className={`absolute w-96 h-96 bg-gradient-to-r ${products[index].color} opacity-30 blur-[120px] rounded-full`} 
              />
              
              {/* Contenedor del Objeto 3D Minimalista */}
              <div className="relative group">
                <motion.div 
                  animate={{ 
                    y: [0, -30, 0],
                    rotateZ: [0, 5, 0]
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-20 flex items-center justify-center"
                >
                  {/* El "Objeto" 3D (Icono estilizado con Glassmorphism) */}
                  <div className="relative p-20 rounded-[4rem] bg-white/5 border border-white/20 backdrop-blur-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden group-hover:border-[#00f2ff]/50 transition-colors duration-700">
                    {/* Reflejos de cristal */}
                    <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/20 to-transparent rotate-45 pointer-events-none" />
                    
                    <div className="relative z-10 text-white drop-shadow-[0_0_30px_rgba(0,242,255,0.5)]">
                      {products[index].icon}
                    </div>

                    {/* Sombras internas para profundidad */}
                    <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(255,255,255,0.05)] rounded-[4rem]" />
                  </div>

                  {/* Sombra proyectada en el "suelo" virtual */}
                  <motion.div 
                    animate={{ scaleX: [1, 0.8, 1], opacity: [0.2, 0.1, 0.2] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-48 h-8 bg-black blur-2xl rounded-full"
                  />
                </motion.div>
                
                {/* Info Flotante del Producto */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -right-12 top-1/2 bg-black/40 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl space-y-1 hidden md:block"
                >
                  <p className="text-[#00f2ff] text-[10px] font-black uppercase tracking-widest">{products[index].name}</p>
                  <p className="text-white text-xs font-bold italic opacity-80">{products[index].detail}</p>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Selector de Producto Estilizado */}
          <div className="absolute bottom-0 flex gap-4">
            {products.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-700 ${i === index ? 'w-12 bg-[#00f2ff]' : 'w-4 bg-white/10 hover:bg-white/20'}`} 
              />
            ))}
          </div>
        </div>

      </div>

      {/* Capa de Grano Cinematográfico */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </section>
  );
};
