"use client";

import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { MessageCircle, Clock, UserCheck, Zap } from "lucide-react";
import { useRef, useState, useEffect } from "react";

const MobileSupportSlider = () => {
  const [index, setIndex] = useState(0);
  const items = [
    { icon: <UserCheck size={24} />, title: "Asesor Dedicado", desc: "Alguien que entiende tu marca." },
    { icon: <Clock size={24} />, title: "Disponibilidad 24/7", desc: "Siempre listos, sin horarios." },
    { icon: <MessageCircle size={24} />, title: "Cero Bots", desc: "Respuestas 100% humanas." },
    { icon: <Zap size={24} />, title: "Velocidad Real", desc: "Soluciones en minutos." }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [items.length]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={index}
          initial={{ x: 100, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: -100, opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 20 }}
          className="absolute w-full flex flex-row items-center gap-4 p-5 rounded-[2rem] bg-gray-50 border border-gray-100 shadow-sm"
        >
          <div className="h-12 w-12 rounded-xl bg-white text-petroleum flex items-center justify-center shadow-sm flex-shrink-0">
            {items[index].icon}
          </div>
          <div className="text-left">
            <h4 className="text-sm font-black uppercase italic text-black leading-tight">{items[index].title}</h4>
            <p className="text-[10px] font-medium text-gray-400 mt-1">{items[index].desc}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const AuroraBorder = () => {
  return (
    <div 
      className="absolute inset-0 rounded-[inherit] z-50 pointer-events-none"
      style={{
        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        maskComposite: 'exclude',
        WebkitMaskComposite: 'xor',
        padding: '3px',
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

export const Testimonials = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <section className="py-20 md:py-40 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-16 md:gap-20 items-center">
          
          {/* Columna Texto: ARRIBA EN MÓVIL */}
          <div className="space-y-8 md:space-y-12 order-1 lg:order-2">
            <div className="space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">
              <h2 className="text-4xl md:text-6xl font-black text-black italic tracking-tighter uppercase leading-[0.9] text-center lg:text-left">
                <span className="whitespace-nowrap">SOPORTE HUMANO</span> <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum via-cyan to-petroleum">PERSONALIZADO.</span>
              </h2>
              <p className="text-gray-500 text-sm md:text-lg font-medium leading-relaxed max-w-lg">
                Olvídate de los bots frustrantes. En Bayup, te asignamos un experto real que conoce tu negocio por su nombre y está listo para ayudarte a crecer.
              </p>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { icon: <UserCheck size={24} />, title: "Asesor Dedicado", desc: "Alguien que entiende tu marca." },
                { icon: <Clock size={24} />, title: "Disponibilidad 24/7", desc: "Siempre listos, sin horarios." },
                { icon: <MessageCircle size={24} />, title: "Cero Bots", desc: "Respuestas 100% humanas." },
                { icon: <Zap size={24} />, title: "Velocidad Real", desc: "Soluciones en minutos." }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col gap-4 p-6 rounded-[2rem] bg-gray-50 hover:bg-white hover:shadow-xl hover:shadow-cyan/5 transition-all duration-500 border border-transparent hover:border-cyan/20 group"
                >
                  <div className="h-12 w-12 rounded-xl bg-white text-petroleum flex items-center justify-center shadow-sm group-hover:bg-petroleum group-hover:text-cyan transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-black uppercase italic text-black">{item.title}</h4>
                    <p className="text-xs font-medium text-gray-400 mt-1">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Mobile Auto-Slider (One Card View) */}
            <div className="md:hidden relative h-[140px] w-full overflow-hidden">
               <MobileSupportSlider />
            </div>
          </div>

          {/* Columna Imagen: ABAJO EN MÓVIL */}
          <div className="perspective-[1000px] order-2 lg:order-1 w-full">
            <motion.div 
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              className="relative h-[400px] md:h-[600px] rounded-[3rem] md:rounded-[4rem] group cursor-pointer"
            >
              <div 
                style={{ transform: "translateZ(50px)" }}
                className="relative h-full w-full rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] border border-white/10"
              >
                <AuroraBorder />
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1200&auto=format&fit=crop" 
                  alt="Asesora Bayup" 
                  className="w-full h-full object-cover filter grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100"
                />
                
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 md:p-6 rounded-2xl md:rounded-3xl inline-flex items-center gap-3 md:gap-4">
                    <div className="h-2 w-2 md:h-3 md:w-3 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_#4ade80]" />
                    <p className="text-white text-[10px] md:text-xs font-black uppercase tracking-widest">Asesora en Línea</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};