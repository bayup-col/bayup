"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Cpu, Maximize, BarChart3, Gem } from "lucide-react";

const features = [
  {
    title: "Multi-tenant Real",
    desc: "Aislamiento total de datos y personalización extrema para cada una de tus tiendas bajo un mismo motor.",
    icon: <Shield className="text-[#00f2ff]" size={24} />,
  },
  {
    title: "Automatización Total",
    desc: "Flujos de trabajo impulsados por eventos que manejan inventario, pedidos y marketing sin intervención humana.",
    icon: <Zap className="text-[#00f2ff]" size={24} />,
  },
  {
    title: "Bayt AI Integrada",
    desc: "Tu propio asistente inteligente que optimiza ventas y gestiona soporte mediante modelos avanzados de IA.",
    icon: <Cpu className="text-[#00f2ff]" size={24} />,
  },
  {
    title: "Escalabilidad Infinita",
    desc: "Infraestructura basada en contenedores lista para manejar desde 1 hasta millones de transacciones por segundo.",
    icon: <Maximize className="text-[#00f2ff]" size={24} />,
  },
  {
    title: "Analítica Profunda",
    desc: "Dashboard de Estadísticas Web Globales coordinado con marketing para un ROI sin precedentes.",
    icon: <BarChart3 className="text-[#00f2ff]" size={24} />,
  },
  {
    title: "Diseño Cinematic",
    desc: "Tiendas que no parecen plantillas. Experiencias visuales que elevan el valor percibido de tu marca.",
    icon: <Gem className="text-[#00f2ff]" size={24} />,
  },
];

export const Features = () => {
  return (
    <section className="py-32 bg-[#0B0B0B] relative overflow-hidden">
      <div className="container mx-auto px-6">
        
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00f2ff]"
          >
            Capacidades del Sistema
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white tracking-tighter italic"
          >
            ¿POR QUÉ <span className="text-[#004d4d]">BAYUP</span>?
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-[#00f2ff]/30 transition-all duration-500 relative overflow-hidden"
            >
              {/* Glow effect on hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#00f2ff]/20 to-transparent opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500" />
              
              <div className="relative z-10 space-y-6">
                <div className="h-14 w-14 rounded-2xl bg-[#004d4d]/30 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-xl shadow-[#004d4d]/10">
                  {f.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight italic">{f.title}</h3>
                  <p className="text-gray-400 text-sm font-medium leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
