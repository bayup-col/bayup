"use client";

import { motion } from "framer-motion";
import { Globe as GlobeIcon, Zap, Users, ShieldCheck } from "lucide-react";

export const GlobeSection = () => {
  return (
    <section className="py-32 bg-[#0B0B0B] relative overflow-hidden flex items-center justify-center">
      
      {/* Glow de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00f2ff]/10 rounded-full blur-[150px]" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          
          {/* Globo Pseudo-3D con CSS */}
          <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="relative w-80 h-80 md:w-96 md:h-96 rounded-full border border-white/10 flex items-center justify-center"
            >
              {/* Círculos concéntricos para profundidad */}
              <div className="absolute inset-0 rounded-full border border-[#00f2ff]/20 scale-110 opacity-20" />
              <div className="absolute inset-0 rounded-full border border-[#00f2ff]/10 scale-125 opacity-10" />
              
              {/* Icono Central */}
              <GlobeIcon size={120} className="text-[#00f2ff] opacity-40 animate-pulse" strokeWidth={0.5} />
              
              {/* Puntos de conexión (Hotspots) */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                <div 
                  key={i}
                  className="absolute"
                  style={{ transform: `rotate(${deg}deg) translateY(-180px)` }}
                >
                  <div className="h-2 w-2 bg-[#00f2ff] rounded-full shadow-[0_0_15px_#00f2ff]" />
                </div>
              ))}
            </motion.div>

            {/* Overlay de texto sobre el globo */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="text-white font-black text-4xl italic tracking-tighter"
              >
                100% <br />
                <span className="text-[#00f2ff]">GLOBAL.</span>
              </motion.p>
            </div>
          </div>

          <div className="flex-1 space-y-12">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase">
                Escala sin <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f2ff] to-[#004d4d]">Límites.</span>
              </h2>
              <p className="text-gray-400 text-lg font-medium leading-relaxed max-w-xl">
                Nuestra arquitectura distribuida geográficamente garantiza que tu tienda esté siempre en línea, sin importar el volumen de tráfico o la ubicación de tus clientes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { title: "Baja Latencia", desc: "Nodos perimetrales en cada continente.", icon: <Zap size={18} /> },
                { title: "Multi-región", desc: "Reglas fiscales y envíos automáticos.", icon: <Users size={18} /> },
                { title: "Seguridad Edge", desc: "Protección DDoS nivel bancario.", icon: <ShieldCheck size={18} /> },
                { title: "Uptime 99.99%", desc: "Infraestructura redundante.", icon: <GlobeIcon size={18} /> },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-default group">
                  <div className="h-10 w-10 rounded-xl bg-[#004d4d]/30 flex items-center justify-center text-[#00f2ff] group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase italic">{item.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
