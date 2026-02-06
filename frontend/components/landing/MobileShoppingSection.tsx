"use client";

import { motion } from "framer-motion";
import { Smartphone, ShoppingCart, Zap, Palette, Activity } from "lucide-react";
import { useRef, useState } from "react";
import { PixelTransition } from "./PixelTransition";

export const MobileShoppingSection = () => {
  const textRef = useRef<HTMLSpanElement>(null);
  const [mousePos, setMousePos] = useState({ x: 95, y: 15 });
  const [activeColumn, setActiveColumn] = useState<'bayup' | 'others'>('bayup');

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!textRef.current) return;
    const rect = textRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 95, y: 15 });
  };

  return (
    <section className="py-40 bg-surface relative overflow-hidden isolate shadow-inner">
      <div className="absolute top-1/2 left-1/4 w-[700px] h-[700px] bg-petroleum/10 rounded-full blur-[180px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan/5 rounded-full blur-[150px] -z-10" />

      <div className="container mx-auto px-6 max-w-5xl text-center flex flex-col items-center">
        
        <div className="space-y-12 w-full">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-black tracking-tighter italic leading-none uppercase whitespace-nowrap">
              ¿POR QUÉ{" "}
              <span 
                ref={textRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="dynamic-gradient-text inline-block transition-all duration-[2500ms] ease-[0.16,1,0.3,1] cursor-default"
                style={{ 
                  backgroundImage: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, #00f2ff 0%, #004d4d 70%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                } as React.CSSProperties}
              >
                BAYUP?
              </span>
            </h2>
          </div>
          <p className="max-w-2xl mx-auto text-gray-500 text-lg md:text-xl font-medium leading-relaxed">
            Hemos reinventado las reglas del juego. Mientras otros te cobran por intentar vender, nosotros nos convertimos en tus socios estratégicos para asegurar que lo logres.
          </p>
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="w-full max-w-5xl mx-auto mt-16 p-6 md:p-16 rounded-[3rem] md:rounded-[4rem] bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_80px_150px_-30px_rgba(0,0,0,0.3)] relative overflow-hidden group/table"
          >
            {/* Background Aura Glow */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-petroleum/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full">
              {/* Header de la Tabla */}
              <div className="grid grid-cols-12 gap-2 md:gap-4 pb-12 items-end border-b border-gray-200/20">
                <div className="col-span-6 text-left">
                  <h4 className="text-xl md:text-3xl font-black italic uppercase text-black leading-none">Comparativa <br /><span className="text-cyan">Estratégica</span></h4>
                </div>
                <div 
                  className={`col-span-3 text-center cursor-pointer transition-all duration-500 ${activeColumn === 'others' ? 'opacity-100 scale-105' : 'opacity-60 grayscale hover:opacity-80'}`}
                  onClick={() => setActiveColumn('others')}
                >
                  <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.3em] mb-2 md:mb-4 transition-colors ${activeColumn === 'others' ? 'text-gray-600' : 'text-gray-400'}`}>Otras Plataformas</p>
                  <div className={`h-12 md:h-16 w-full rounded-2xl md:rounded-3xl flex items-center justify-center font-black italic text-[10px] md:text-base transition-all ${activeColumn === 'others' ? 'bg-gray-700 text-white shadow-xl' : 'bg-gray-200 text-gray-500'}`}>OTRAS</div>
                </div>
                <div 
                  className={`col-span-3 text-center cursor-pointer transition-all duration-500 ${activeColumn === 'bayup' ? 'opacity-100 scale-105' : 'opacity-60 grayscale hover:opacity-80'}`}
                  onClick={() => setActiveColumn('bayup')}
                >
                  <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.3em] text-cyan mb-2 md:mb-4">Experiencia Premium</p>
                  <div className={`h-12 md:h-16 w-full rounded-2xl md:rounded-3xl flex items-center justify-center font-black italic border-2 text-[10px] md:text-base transition-all ${activeColumn === 'bayup' ? 'bg-petroleum text-cyan shadow-[0_20px_40px_rgba(0,242,255,0.25)] border-cyan/30' : 'bg-gray-100/50 border-transparent text-gray-400'}`}>BAYUP</div>
                </div>
              </div>

              {/* Filas de la Tabla */}
              {[
                { label: "Planes Mensuales", bayup: "Gratis por siempre", others: "Desde $30 USD/mes", detail: "Bayup devuelve la barrera de los costos fijos mensuales." },
                { label: "Venta Omnicanal", bayup: "Sincronización Nativa", others: "Venta Fragmentada", detail: "Controla tu stock y pedidos de Web, WhatsApp y Redes en un solo lugar." },
                { label: "Canal de WhatsApp", bayup: "Integración Nativa", others: "Costo Adicional", detail: "Vende y recibe pedidos directamente en tu chat de forma fluida." },
                { label: "Marketing y Fidelización", bayup: "Sistema Pro Incluido", others: "Pago por Aplicaciones", detail: "Cupones, programas de puntos y analítica real sin pagar ni un peso extra." },
                { label: "Configuración", bayup: "Lista en minutos", others: "Setup prolongado", detail: "Sube tus productos y lanza tu tienda el mismo día." },
                { label: "Soporte y Ayuda", bayup: "Atención VIP en Español", others: "Soporte Lento", detail: "Te acompañamos personalmente en el crecimiento de tu marca." },
                { label: "Escalabilidad", bayup: "Crecimiento Sin Límites", others: "Topes y Restricciones", detail: "Sin límites de productos o visitas. Nuestra tecnología escala contigo." }
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 md:gap-4 py-6 md:py-8 border-b border-white/5 group transition-all">
                  <div className="col-span-6 text-left flex flex-col justify-center gap-1">
                    <p className="text-sm md:text-lg font-black uppercase italic text-black leading-none transition-opacity">{row.label}</p>
                    <p className="text-[8px] md:text-[10px] text-gray-500/60 font-medium">{row.detail}</p>
                  </div>
                  
                  {/* Columna Otras */}
                  <div className={`col-span-3 flex items-center justify-center transition-all duration-500 rounded-xl md:rounded-2xl ${activeColumn === 'others' ? 'bg-black/5 scale-[1.02] z-10 shadow-sm' : 'opacity-60'}`}>
                    <span className={`text-[9px] md:text-sm font-bold uppercase italic transition-colors ${activeColumn === 'others' ? 'text-gray-800' : 'text-gray-500'}`}>{row.others}</span>
                  </div>

                  {/* Columna Bayup */}
                  <div className={`col-span-3 flex items-center justify-center transition-all duration-500 rounded-xl md:rounded-2xl relative ${activeColumn === 'bayup' ? 'bg-cyan/5 scale-[1.02] z-10 shadow-sm' : 'opacity-60'}`}>
                    <div className={`absolute inset-y-0 left-0 w-1 bg-cyan transition-opacity duration-500 ${activeColumn === 'bayup' ? 'opacity-100' : 'opacity-0'}`} />
                    <span className={`text-[9px] md:text-sm font-black uppercase italic tracking-tight transition-colors ${activeColumn === 'bayup' ? 'text-petroleum' : 'text-gray-400'}`}>{row.bayup}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
};