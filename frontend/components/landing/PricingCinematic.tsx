/* REBUILD_FORCE_V2 */
"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { useRef, useState } from "react";
import Link from "next/link";

// --- COMPONENTE INTERNO: TARJETA DE PLAN 3D ---
const PricingCard = ({ plan, i }: { plan: any, i: number }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 100, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 100, damping: 15 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["25deg", "-25deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-25deg", "25deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (plan.status === 'upcoming') return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="perspective-[3000px] w-full h-full p-4">
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.1 }}
        className={`relative p-8 md:p-12 rounded-[3.5rem] md:rounded-[4.5rem] overflow-visible group transition-all duration-700 isolate flex flex-col h-full min-h-[550px] ${plan.popular ? 'shadow-[0_80px_150px_-20px_rgba(0,242,255,0.5)] z-20' : 'shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] z-10'} ${plan.status === 'upcoming' ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <motion.div 
          style={{ 
            x: useTransform(mouseX, [-0.5, 0.5], ["30px", "-30px"]),
            y: useTransform(mouseY, [-0.5, 0.5], ["30px", "-30px"]),
            opacity: useTransform(mouseY, [-0.5, 0.5], [0.1, 0.3])
          }}
          className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[90%] h-12 bg-black/30 blur-[40px] rounded-full -z-20 pointer-events-none" 
        />

        <div className="absolute inset-0 rounded-[3.5rem] md:rounded-[4.5rem] overflow-hidden -z-10">
          <div 
            className={`absolute top-1/2 left-1/2 w-[250%] aspect-square animate-aurora transition-opacity duration-700 ${plan.status === 'upcoming' ? 'opacity-0' : 'opacity-60 group-hover:opacity-100'}`}
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)`,
              willChange: 'transform'
            }}
          />
          <div className={`absolute inset-[2.5px] rounded-[3.4rem] md:rounded-[4.4rem] backdrop-blur-[100px] ${plan.popular ? 'bg-petroleum' : 'bg-white/95'}`} />
        </div>

        {plan.popular && (
          <div className="absolute -top-4 right-10 px-5 py-1.5 bg-cyan text-black text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_30px_rgba(0,242,255,0.6)] z-30">
            Recomendado
          </div>
        )}
        
        <div className="space-y-8 md:space-y-10 relative z-10 flex-1 flex flex-col" style={{ transform: "translateZ(120px)" }}>
          <h3 className={`text-2xl md:text-3xl font-black italic uppercase tracking-tighter ${plan.accent}`}>{plan.name}</h3>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-baseline gap-2">
              <span className={`${plan.price.length > 8 ? 'text-3xl md:text-4xl' : 'text-5xl md:text-7xl'} font-black italic tracking-tighter ${plan.popular ? 'text-white' : 'text-black'}`}>{plan.price}</span>
              {plan.status === 'active' && plan.price !== 'Gratis' && plan.price !== '$0' && <span className={`text-[10px] font-black uppercase tracking-widest ${plan.popular ? 'text-white/40' : 'text-black/20'}`}>/Mensual</span>}
            </div>
          </div>
          
          <div className={`h-[1px] w-full ${plan.popular ? 'bg-white/10' : 'bg-petroleum/10'}`} />
          
          <ul className="space-y-4 md:space-y-5 flex-1">
            {plan.features.map((feat: string, j: number) => (
              <li key={j} className={`flex items-center gap-4 text-[10px] font-black uppercase tracking-widest ${plan.popular ? 'text-white/70' : 'text-gray-500'}`}>
                <div className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.popular ? 'bg-white/10' : 'bg-petroleum/10'}`}>
                  <Check size={12} className={plan.popular ? "text-cyan" : "text-petroleum"} />
                </div>
                {feat}
              </li>
            ))}
          </ul>

          {plan.status === 'active' ? (
            <Link href="/planes" className="w-full">
              <button className={`w-full py-5 md:py-6 rounded-[2.5rem] font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 active:scale-95 ${plan.popular ? 'bg-white text-black hover:bg-cyan shadow-2xl' : 'bg-petroleum text-white hover:bg-black shadow-xl'}`}>
                {plan.button} <ArrowRight size={14} />
              </button>
            </Link>
          ) : (
            <button 
              disabled
              className="w-full py-5 md:py-6 rounded-[2.5rem] font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] bg-gray-200 text-gray-400 cursor-not-allowed">
              {plan.button}
            </button>
          )}
        </div>

        {plan.status === 'active' && (
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-[1200ms] ease-in-out pointer-events-none" />
        )}
      </motion.div>
    </div>
  );
};

export const PricingCinematic = () => {
  const textRef = useRef<HTMLSpanElement>(null);
  const [mousePos, setMousePos] = useState({ x: 95, y: 15 });
  const [hasDragged, setHasDragged] = useState(false);

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

  const plans = [
    { name: 'Plan Básico', slug: 'básico', price: '$0', accent: 'text-gray-400', popular: false, features: ['Tienda Personalizada', 'WhatsApp CRM (1 Línea)', 'Gestión de Inventario', 'Pasarela de Pagos'], button: 'Empezar Gratis', status: 'active' },
    { name: 'Pro Elite', slug: 'pro_elite', price: '$0', accent: 'text-cyan', popular: true, features: ['Todo lo del Plan Básico', 'Respuestas con IA 24/7', 'Web Mayoristas', 'Separados con IA'], button: 'Activar Pro', status: 'active' },
    { name: 'Plan Empresa', slug: 'empresa', price: 'Próximamente', accent: 'text-gray-300', popular: false, features: ['Bayt (Agente de Acción)', 'Automatización & N8N', 'Facturación Electrónica', 'Multiventa'], button: 'Próximamente', status: 'upcoming' },
  ];

  return (
    <section id="planes" className="py-20 md:py-40 bg-surface relative overflow-hidden isolate shadow-inner">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-petroleum/5 rounded-full blur-[180px] -z-10" />
      <div className="container mx-auto px-6 md:px-12 text-center">
        <div className="max-w-4xl mx-auto mb-16 md:mb-24 space-y-6">
          <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-black italic tracking-tighter uppercase leading-none flex flex-col md:block items-center">
            <span>ESCALA TU</span>{" "}
            <span ref={textRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className="dynamic-gradient-text inline-block transition-all duration-[2500ms] ease-[0.16,1,0.3,1] cursor-default" style={{ backgroundImage: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, #00f2ff 0%, #004d4d 70%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' } as any}>
              NEGOCIO.
            </span>
          </h2>
          <h3 className="text-sm md:text-3xl font-medium text-gray-500 tracking-tight max-w-3xl mx-auto leading-relaxed px-4">
            Selecciona el plan perfecto para llevar tu marca <br className="hidden md:block" />
            <span className="text-petroleum font-black italic">al siguiente nivel.</span>
          </h3>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto items-stretch">
          {plans.map((plan, i) => (
            <PricingCard key={i} plan={plan} i={i} />
          ))}
        </div>

        {/* Mobile Swipe Carousel */}
        <div className="md:hidden w-full relative">
          
          {/* Alerta de Swipe (Solo móvil) */}
          {!hasDragged && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none animate-pulse">
              <div className="bg-white/80 backdrop-blur-md p-4 rounded-full shadow-xl border border-white/50">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-petroleum">
                  <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                  <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                  <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                  <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                </svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-petroleum bg-white/60 px-3 py-1 rounded-full backdrop-blur-sm">Desliza</span>
            </div>
          )}

          <motion.div 
            className="flex gap-4 px-4 w-full cursor-grab active:cursor-grabbing overflow-visible"
            drag="x"
            dragConstraints={{ right: 0, left: -650 }}
            onDragStart={() => setHasDragged(true)}
          >
            {plans.map((plan, i) => (
              <div key={i} className="min-w-[85vw]">
                <PricingCard plan={plan} i={i} />
              </div>
            ))}
          </motion.div>
        </div>

      </div>
    </section>
  );
};
