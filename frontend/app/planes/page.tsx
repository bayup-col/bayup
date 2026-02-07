"use client";

import { useState, useRef } from 'react';
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { 
  Check, 
  ArrowRight
} from "lucide-react";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { InteractiveUP } from "@/components/landing/InteractiveUP";
import { PremiumButton } from "@/components/landing/PremiumButton";
import { Footer } from "@/components/landing/Footer";

const FloatingParticlesBackground = dynamic(
  () => import("@/components/landing/FloatingParticlesBackground").then((mod) => mod.FloatingParticlesBackground),
  { ssr: false }
);

const AuroraCard = ({ children, className = "", popular = false }: { children: React.ReactNode, className?: string, popular?: boolean }) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className={`relative group p-[2px] rounded-[4rem] overflow-hidden isolate flex flex-col ${popular ? 'shadow-[0_50px_100px_-20px_rgba(0,77,77,0.3)]' : 'shadow-xl'} ${className}`}
  >
    <div className="absolute inset-0 rounded-[4rem] overflow-hidden -z-10">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 w-[300%] aspect-square"
        style={{
          background: popular 
            ? `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)`
            : `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #004d4d 320deg, #cbd5e1 360deg)`,
          x: "-50%",
          y: "-50%",
          willChange: 'transform'
        }}
      />
      <div className={`absolute inset-[1.5px] rounded-[3.9rem] backdrop-blur-3xl ${popular ? 'bg-white/95' : 'bg-white/90'}`} />
    </div>
    <div className="relative z-10 h-full p-10 md:p-14">
      {children}
    </div>
  </motion.div>
);

const planDetails = [
  {
    name: "Básico",
    price: "$0",
    desc: "Todo lo necesario para lanzar tu tienda hoy mismo.",
    popular: false,
    status: "active",
    specs: [
      "Tienda personalizada",
      "Botón de WhatsApp",
      "Gestión de inventario ilimitado",
      "Catálogo Digital Interactivo",
      "Pasarela de pagos integrada",
      "Soporte Base"
    ]
  },
  {
    name: "Pro Elite",
    price: "$0",
    desc: "Identidad propia y herramientas avanzadas para escalar.",
    popular: true,
    status: "active",
    specs: [
      "Todo lo del Plan Básico",
      "Chat Multicanal Integrado",
      "Dominio propio personalizado",
      "Analítica Avanzada de Ventas",
      "Herramientas de Marketing Pro",
      "Prioridad de Soporte 24/7"
    ]
  },
  {
    name: "Empresa",
    price: "Custom",
    desc: "Arquitectura a medida para corporaciones globales.",
    popular: false,
    status: "coming_soon",
    specs: [
      "Infraestructura Dedicada",
      "Comisión Negociable",
      "Bayt AI Nivel 3 (Entrenamiento Custom)",
      "API de Acceso Total",
      "Account Manager Dedicado",
      "SLA Garantizado 99.9%"
    ]
  }
];

const SectionHeading = ({ title, highlight, subtitle }: { title: string, highlight?: string, subtitle?: string }) => (
  <div className="text-center space-y-8 mb-20">
    <motion.p 
      initial={{ opacity: 0 }} 
      whileInView={{ opacity: 1 }}
      className="text-[#00F2FF] font-black uppercase tracking-[0.5em] text-[10px]"
    >
      Bayup Engineering
    </motion.p>
    <motion.h2 
      initial={{ opacity: 0, y: 20 }} 
      whileInView={{ opacity: 1, y: 0 }}
      className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.9] text-black"
    >
      {title} <br />
      {highlight && <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum via-cyan to-petroleum drop-shadow-[0_0_15px_rgba(0,242,255,0.3)]">{highlight}</span>}
    </motion.h2>
    {subtitle && (
      <p className="max-w-2xl mx-auto text-gray-500 text-lg font-medium leading-relaxed italic">
        {subtitle}
      </p>
    )}
  </div>
);

export default function PlanesPage() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY.current;
    if (latest > previous && latest > 150) setHidden(true);
    else if (latest < previous) setHidden(false);
    setIsAtTop(latest < 50);
    lastScrollY.current = latest;
  });

  return (
    <div className="relative min-h-screen w-full bg-[#FAFAFA] text-[#004d4d] overflow-x-hidden">
      <FloatingParticlesBackground />

      {/* HEADER INTEGRADO */}
      <motion.nav 
        animate={hidden ? "hidden" : "visible"}
        variants={{ visible: { y: 0 }, hidden: { y: "-100%" } }}
        className={`fixed top-0 w-full z-[100] transition-all duration-500 ${isAtTop ? 'py-10' : 'py-6'}`}
      >
        <div className="container mx-auto px-12 grid grid-cols-3 items-center">
          <Link href="/" className="pointer-events-auto">
            <div className="text-2xl font-black italic tracking-tighter cursor-pointer w-fit">
              <span>BAY</span><InteractiveUP />
            </div>
          </Link>
          <div className="hidden md:flex items-center justify-center">
            <div className={`flex items-center gap-12 px-10 py-4 rounded-full border border-white/40 bg-white/20 backdrop-blur-xl shadow-sm transition-all duration-500 pointer-events-auto ${isAtTop ? '' : 'bg-white/40 shadow-md'}`}>
              {[
                { label: 'Inicio', href: '/' },
                { label: 'Planes', href: '/planes' },
                { label: 'Afiliados', href: '/afiliados' }
              ].map((item) => (
                <Link 
                  key={item.label} 
                  href={item.href} 
                  className="text-[12px] font-black text-gray-500 hover:text-black uppercase tracking-[0.5em] transition-all duration-500 relative group"
                >
                  {item.label}
                  <span className={`absolute -bottom-1 left-0 h-[1.5px] bg-cyan transition-all duration-500 group-hover:w-full ${item.label === 'Planes' ? 'w-full' : 'w-0'}`}></span>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex justify-end pointer-events-auto">
            <PremiumButton href="/login">Iniciar</PremiumButton>
          </div>
        </div>
      </motion.nav>

      <section className="relative pt-56 pb-24 px-6">
        <div className="container mx-auto max-w-7xl">
          <SectionHeading 
            title="INGENIERÍA DE" 
            highlight="CRECIMIENTO." 
            subtitle="Nuestra infraestructura multi-tenant está diseñada para escalar con tu ambición. Elige el motor que mejor se adapte a tu volumen operativo."
          />
        </div>
      </section>

      {/* GRID DE PLANES DETALLADOS */}
      <section className="pb-40 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {planDetails.map((plan, i) => (
              <AuroraCard key={i} popular={plan.popular}>
                <div className="space-y-10">
                  <div className="space-y-4 text-center lg:text-left">
                    <h3 className={`text-3xl font-black italic uppercase tracking-tighter ${plan.popular ? 'text-[#004d4d]' : 'text-gray-400'}`}>{plan.name}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">{plan.desc}</p>
                  </div>

                  <div className="flex flex-col items-center lg:items-start gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-7xl font-black italic tracking-tighter">{plan.price}</span>
                      {plan.price !== "Custom" && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">/Mes</span>
                      )}
                    </div>
                  </div>

                  <div className="h-px w-full bg-[#004d4d]/5" />

                  <ul className="space-y-6">
                    {plan.specs.map((spec, j) => (
                      <li key={j} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.popular ? 'bg-[#00F2FF]/20' : 'bg-gray-100'}`}>
                          <Check size={12} className={plan.popular ? "text-[#004d4d]" : "text-gray-400"} />
                        </div>
                        {spec}
                      </li>
                    ))}
                  </ul>

                  <div className="flex-1" />

                  <Link href={plan.status === "coming_soon" ? "#" : "/register"} className="pt-20 mt-auto">
                    <button 
                      disabled={plan.status === "coming_soon"}
                      className={`w-full py-6 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 active:scale-95 
                        ${plan.status === "coming_soon" 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60' 
                          : plan.popular 
                            ? 'bg-[#001A1A] text-white hover:bg-black shadow-2xl' 
                            : 'bg-white text-[#004d4d] border border-[#004d4d]/10 hover:bg-gray-50'
                        }`}
                    >
                      {plan.status === "coming_soon" ? "Próximamente" : "Seleccionar Plan"}
                      {plan.status !== "coming_soon" && <ArrowRight size={14} />}
                    </button>
                  </Link>
                </div>
              </AuroraCard>
            ))}
          </div>
        </div>
      </section>

      {/* CUADRO COMPARATIVO DETALLADO - BOXED LARGER */}
      <section className="pb-40 px-6">
        <div className="container mx-auto max-w-7xl">
          <SectionHeading 
            title="COMPARATIVA" 
            highlight="DE POTENCIA." 
            subtitle="Analiza a fondo cada característica técnica de nuestros motores de crecimiento."
          />

          <div className="relative overflow-hidden rounded-[3.5rem] border border-[#004d4d]/10 bg-white/40 backdrop-blur-3xl shadow-2xl isolate">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-petroleum text-white">
                    <th className="py-8 px-10 text-[11px] font-black uppercase tracking-[0.4em] italic">Característica</th>
                    <th className="py-8 px-6 text-center text-[11px] font-black uppercase tracking-[0.4em] italic border-l border-white/10">Básico</th>
                    <th className="py-8 px-6 text-center text-[11px] font-black uppercase tracking-[0.4em] italic border-l border-white/10 bg-cyan text-petroleum">Pro Elite</th>
                    <th className="py-8 px-6 text-center text-[11px] font-black uppercase tracking-[0.4em] italic border-l border-white/10">Empresa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#004d4d]/5">
                  {[
                    { feature: "Inicio & Estadísticas", basic: true, pro: true, enterprise: true },
                    { feature: "Facturación POS", basic: "Estándar", pro: "Estándar", enterprise: "+ Electrónica" },
                    { feature: "Pedidos & Envíos", basic: true, pro: true, enterprise: true },
                    { feature: "Gestión de Inventario", basic: "Ilimitado", pro: "Ilimitado", enterprise: "Ilimitado" },
                    { feature: "Mensajes (Web/RRSS)", basic: true, pro: true, enterprise: true },
                    { feature: "WhatsApp CRM", basic: "1 Línea", pro: "Catálogo IA", enterprise: "Full IA" },
                    { feature: "Clientes & Descuentos", basic: true, pro: true, enterprise: true },
                    { feature: "Informes de Ventas", basic: "General", pro: "Pro (+Gastos)", enterprise: "Full Business" },
                    { feature: "Marketing & Fidelización", basic: false, pro: true, enterprise: true },
                    { feature: "Web Mayoristas", basic: false, pro: true, enterprise: true },
                    { feature: "Separados con IA", basic: false, pro: true, enterprise: true },
                    { feature: "Staff (Miembros)", basic: false, pro: "Hasta 3", enterprise: "Ilimitado" },
                    { feature: "Config. Tienda Full", basic: true, pro: true, enterprise: true },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#00F2FF]/5 transition-colors group">
                      <td className="py-6 px-10 text-[10px] font-black uppercase tracking-widest text-[#004d4d]/80 italic group-hover:text-black transition-colors">{row.feature}</td>
                      <td className="py-6 px-6 text-center border-l border-[#004d4d]/5">
                        {typeof row.basic === "boolean" ? (row.basic ? <Check className="mx-auto text-cyan" size={18} /> : <span className="text-gray-200">—</span>) : <span className="text-[10px] font-bold">{row.basic}</span>}
                      </td>
                      <td className="py-6 px-6 text-center border-l border-[#004d4d]/5 bg-cyan/5">
                        {typeof row.pro === "boolean" ? (row.pro ? <Check className="mx-auto text-petroleum" size={18} /> : <span className="text-gray-200">—</span>) : <span className="text-[10px] font-black">{row.pro}</span>}
                      </td>
                      <td className="py-6 px-6 text-center border-l border-[#004d4d]/5">
                        {typeof row.enterprise === "boolean" ? (row.enterprise ? <Check className="mx-auto text-cyan" size={18} /> : <span className="text-gray-200">—</span>) : <span className="text-[10px] font-bold">{row.enterprise}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx global>{`
        @keyframes aurora-border { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
        .animate-aurora { animation: aurora-border 10s linear infinite; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}