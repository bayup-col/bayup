"use client";

import { useState, useRef } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { 
  Check, 
  ArrowRight,
  Info,
  User
} from "lucide-react";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { InteractiveUP } from "@/components/landing/InteractiveUP";
import { PremiumButton } from "@/components/landing/PremiumButton";
import { ExpandableButton } from "@/components/landing/ExpandableButton";
import { Footer } from "@/components/landing/Footer";

const FloatingParticlesBackground = dynamic(
  () => import("@/components/landing/FloatingParticlesBackground").then((mod) => mod.FloatingParticlesBackground),
  { ssr: false }
);

const AuroraCard = ({ children, className = "", popular = false }: { children: React.ReactNode, className?: string, popular?: boolean }) => (
  <motion.div 
    whileHover={{ y: -15, scale: popular ? 1.05 : 1.02 }}
    className={`relative group p-[2px] rounded-[4rem] overflow-visible isolate flex flex-col transition-all duration-500 ${popular ? 'shadow-[0_60px_120px_-20px_rgba(0,242,255,0.4)] z-20 scale-105' : 'shadow-xl z-10'} ${className}`}
  >
    {/* BADGE RECOMENDADO (Solo para Popular) */}
    {popular && (
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-[100] whitespace-nowrap">
        <div className="bg-gradient-to-r from-petroleum to-cyan px-8 py-2.5 rounded-full shadow-[0_10px_30px_rgba(0,242,255,0.4)] border border-white/20">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white italic">Motor Recomendado</span>
        </div>
      </div>
    )}

    <div className="absolute inset-0 rounded-[4rem] overflow-hidden -z-10">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: popular ? 6 : 10, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 w-[300%] aspect-square"
        style={{
          background: popular 
            ? `conic-gradient(from 0deg, transparent 0deg, transparent 200deg, #00f2ff 280deg, #004d4d 360deg)`
            : `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #004d4d 320deg, #cbd5e1 360deg)`,
          x: "-50%",
          y: "-50%",
          willChange: 'transform'
        }}
      />
      <div className={`absolute inset-[1.5px] rounded-[3.9rem] backdrop-blur-3xl ${popular ? 'bg-white/98' : 'bg-white/90'}`} />
    </div>
    <div className="relative z-10 h-full p-10 md:p-14 flex flex-col">
      {children}
    </div>
  </motion.div>
);

const planDetails = [
  {
    name: "Básico",
    price: "$0",
    desc: "Operación esencial para lanzar tu imperio digital.",
    popular: false,
    status: "active",
    specs: [
      "Tienda personalizada",
      "WhatsApp CRM (1 Línea)",
      "Gestión de inventario ilimitado",
      "Pasarela de pagos integrada",
      "Estadísticas de Venta",
      "Soporte Base"
    ]
  },
  {
    name: "Pro Elite",
    price: "$0",
    desc: "Potencia tu marca con IA y herramientas avanzadas.",
    popular: true,
    status: "active",
    specs: [
      "Todo lo del Plan Básico",
      "Respuestas con IA 24/7",
      "Marketing & Fidelización",
      "Web Exclusiva Mayoristas",
      "Separados con IA",
      "Staff (Hasta 3 miembros)"
    ]
  }
];

const SectionHeading = ({ title, highlight, subtitle }: { title: string, highlight?: string, subtitle?: string }) => (
  <div className="text-center space-y-6 mb-20">
    <motion.h2 
      initial={{ opacity: 0, y: 20 }} 
      whileInView={{ opacity: 1, y: 0 }}
      className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.9] text-black"
    >
      {!highlight ? (
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum via-cyan to-petroleum drop-shadow-[0_0_15px_rgba(0,242,255,0.3)]">
          {title}
        </span>
      ) : (
        <>
          {title} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum via-cyan to-petroleum drop-shadow-[0_0_15px_rgba(0,242,255,0.3)]">{highlight}</span>
        </>
      )}
    </motion.h2>
    {subtitle && (
      <p className="max-w-2xl mx-auto text-gray-500 text-lg font-medium leading-relaxed italic">
        {subtitle}
      </p>
    )}
  </div>
);

const FeatureRow = ({ row }: { row: any }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <tr 
      className="hover:bg-[#00F2FF]/5 transition-all duration-500 group border-b border-[#004d4d]/5 last:border-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td className="py-10 px-14 border-l border-[#004d4d]/5 relative overflow-hidden min-w-[380px]">
        <div className="relative h-14 flex items-center">
          <AnimatePresence mode="wait">
            {!isHovered ? (
              <motion.div
                key="title"
                initial={{ x: 0, opacity: 1 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0, filter: "blur(8px)" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex items-center gap-4"
              >
                <span className="text-[12px] font-black uppercase tracking-[0.4em] text-petroleum italic leading-none">
                  {row.feature}
                </span>
                <div className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse shadow-[0_0_8px_#00f2ff]" />
              </motion.div>
            ) : (
              <motion.div
                key="description"
                initial={{ x: 30, opacity: 0, filter: "blur(8px)" }}
                animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ x: 30, opacity: 0, filter: "blur(8px)" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex items-center"
              >
                <p className="text-[11px] font-bold text-[#004d4d]/60 leading-relaxed italic uppercase tracking-[0.15em]">
                  {row.description}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </td>
      <td className="py-10 px-10 text-center border-l border-[#004d4d]/5">
        {typeof row.basic === "boolean" ? (row.basic ? <Check className="mx-auto text-cyan drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]" size={24} /> : <span className="text-gray-200 text-lg font-light opacity-30">—</span>) : <span className="text-[12px] font-black tracking-tighter text-[#004d4d]">{row.basic}</span>}
      </td>
      <td className="py-10 px-10 text-center border-l border-[#004d4d]/5 bg-cyan/5 relative group/pro">
        <div className="absolute inset-0 bg-cyan opacity-0 group-hover/pro:opacity-[0.03] transition-opacity duration-500" />
        {typeof row.pro === "boolean" ? (row.pro ? <Check className="mx-auto text-petroleum drop-shadow-[0_0_5px_rgba(0,77,77,0.3)]" size={24} /> : <span className="text-gray-200 text-lg font-light opacity-30">—</span>) : <span className="text-[13px] font-black tracking-tighter text-petroleum">{row.pro}</span>}
      </td>
      <td className="py-10 px-10 text-center border-l border-[#004d4d]/5">
        {typeof row.enterprise === "boolean" ? (row.enterprise ? <Check className="mx-auto text-cyan drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]" size={24} /> : <span className="text-gray-200 text-lg font-light opacity-30">—</span>) : <span className="text-[12px] font-black tracking-tighter text-[#004d4d]">{row.enterprise}</span>}
      </td>
    </tr>
  );
};

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

  const comparisonData = [
    { 
      feature: "Mensualidad", 
      basic: "Gratis", pro: "Gratis", enterprise: "Próximamente",
      description: "Inversión fija mensual para el mantenimiento y uso de la infraestructura tecnológica de Bayup." 
    },
    { 
      feature: "Comisiones", 
      basic: "2.5%", pro: "3.0%", enterprise: "Próximamente",
      description: "Porcentaje cobrado únicamente por cada venta exitosa. Si no vendes, no pagas nada." 
    },
    { 
      feature: "Inicio & Estadísticas", 
      basic: true, pro: true, enterprise: true,
      description: "Panel de control central con métricas clave de ventas, visitas y rendimiento de tu tienda en tiempo real." 
    },
    { 
      feature: "Facturación POS", 
      basic: "Estándar", pro: "Estándar", enterprise: "+ Electrónica",
      description: "Punto de venta físico y digital. El plan Empresa incluye integración legal con facturación electrónica automatizada." 
    },
    { 
      feature: "Pedidos & Envíos", 
      basic: true, pro: true, enterprise: true,
      description: "Gestión completa del ciclo de vida del pedido, desde la compra hasta la entrega logística final." 
    },
    { 
      feature: "Gestión de Inventario", 
      basic: "Ilimitado", pro: "Ilimitado", enterprise: "Ilimitado",
      description: "Control total de stock, variantes de producto y alertas de inventario bajo sin límites de cantidad." 
    },
    { 
      feature: "Clientes & Descuentos", 
      basic: true, pro: true, enterprise: true,
      description: "Base de datos centralizada de tus compradores y potente motor para crear cupones, ofertas y promociones relámpago." 
    },
    { 
      feature: "Mensajes (Omnicanal)", 
      basic: true, pro: "Respuestas IA 24/7", enterprise: "Respuestas IA 24/7",
      description: "Centraliza chats de Web, WhatsApp y Redes Sociales. El plan Pro incluye agentes de IA que responden y venden por ti de forma autónoma." 
    },
    { 
      feature: "Config. Tienda Full", 
      basic: true, pro: true, enterprise: true,
      description: "Personalización total de la apariencia, métodos de pago, moneda y ajustes generales de tu ecosistema." 
    },
    { 
      feature: "Marketing & Fidelización", 
      basic: false, pro: true, enterprise: true,
      description: "Club de puntos por compras y herramientas avanzadas para crear campañas que aumenten el ROI." 
    },
    { 
      feature: "Asistente Bayt AI", 
      basic: false, pro: "Chat & Soporte", enterprise: "Agente de Acción (Ejecuta)",
      description: "Bayt no solo responde dudas; en el Plan Empresa puede realizar acciones como crear productos o registrar gastos por voz." 
    },
    { 
      feature: "Analítica Web Precisa", 
      basic: false, pro: "Estándar", enterprise: "Pixel Tracking Avanzado",
      description: "Seguimiento ultra-detallado del comportamiento del usuario usando píxeles de rastreo y mapas de calor." 
    },
    { 
      feature: "Automatización & N8N", 
      basic: false, pro: false, enterprise: "Conexión Nativa",
      description: "Conecta Bayup con miles de aplicaciones externas y crea flujos de trabajo automáticos complejos mediante N8N." 
    },
    { 
      feature: "Nómina & Sucursales", 
      basic: false, pro: false, enterprise: true,
      description: "Gestión administrativa de empleados, pagos de nómina y control multi-tienda para diferentes sedes físicas." 
    },
    { 
      feature: "Cotizaciones Automáticas", 
      basic: false, pro: false, enterprise: true,
      description: "Generación instantánea de presupuestos y cotizaciones profesionales para clientes mayoristas o corporativos." 
    },
    { 
      feature: "Multiventa (Omnicanal)", 
      basic: false, pro: false, enterprise: true,
      description: "Vende en Amazon, Mercado Libre y Redes Sociales sincronizando todo el inventario desde un solo lugar: Bayup." 
    },
    { 
      feature: "CRM Avanzado Integrado", 
      basic: false, pro: false, enterprise: true,
      description: "Gestión profunda de relaciones con clientes, segmentación inteligente y seguimiento de leads para maximizar conversiones." 
    },
  ];

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
            <div className="text-2xl font-black italic tracking-tighter cursor-pointer w-fit text-black">
              <span>BAY</span><InteractiveUP />
            </div>
          </Link>
          <div className="hidden md:flex items-center justify-center">
            <div className={`flex items-center gap-12 px-10 py-4 rounded-full border border-white/40 bg-white/20 backdrop-blur-xl shadow-sm transition-all duration-500 pointer-events-auto ${isAtTop ? '' : 'bg-white/40 shadow-md'}`}>
              {[
                { label: 'Afiliados', href: '/afiliados' },
                { label: 'Inicio', href: '/' },
                { label: 'Planes', href: '/planes' }
              ].map((item) => (
                <Link 
                  key={item.label} 
                  href={item.href} 
                  className={`text-[12px] font-black uppercase tracking-[0.5em] transition-all duration-500 relative group text-gray-500 hover:text-black`}
                >
                  {item.label}
                  <span className={`absolute -bottom-1 left-0 h-[1.5px] bg-cyan transition-all duration-500 group-hover:w-full ${item.label === 'Planes' ? 'w-full' : 'w-0'}`}></span>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex justify-end pointer-events-auto items-center gap-6">
            {/* Botón Registrarse (Texto -> Gratis) */}
            <ExpandableButton 
              href="/register" 
              variant="primary" 
              baseText="REGÍSTRATE" 
              expandedText="GRATIS" 
            />

            {/* Botón Iniciar Sesión (Icono -> Texto) */}
            <ExpandableButton 
              href="/login" 
              variant="ghost" 
              expandedText="INICIAR SESIÓN" 
              className="text-black"
              icon={<User size={22} className="text-black" />} 
            />
          </div>
        </div>
      </motion.nav>

      <section className="relative pt-56 pb-24 px-6">
        <div className="container mx-auto max-w-7xl">
          <SectionHeading 
            title="ESCOGE TU MOTOR DE CRECIMIENTO." 
            highlight="" 
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
                <div className="space-y-10 flex-1 flex flex-col">
                  <div className="space-y-4 text-center lg:text-left">
                    <h3 className={`text-3xl font-black italic uppercase tracking-tighter ${plan.popular ? 'text-[#004d4d]' : 'text-gray-400'}`}>{plan.name}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">{plan.desc}</p>
                  </div>

                  <div className="flex flex-col items-center lg:items-start gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className={`${plan.price.length > 8 ? 'text-4xl' : 'text-7xl'} font-black italic tracking-tighter transition-all duration-500`}>
                        {plan.price}
                      </span>
                      {plan.price !== "Custom" && plan.price !== "Próximamente" && (
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

                  <Link 
                    href={plan.status === "coming_soon" ? "#" : `/register?plan=${plan.name.toLowerCase().replace(" ", "_")}`} 
                    className="pt-12 mt-auto"
                  >
                    <button 
                      disabled={plan.status === "coming_soon"}
                      className={`w-full py-6 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 active:scale-95 
                        ${plan.status === "coming_soon" 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60' 
                          : plan.popular 
                            ? 'bg-gradient-to-r from-petroleum to-black text-white hover:shadow-[0_0_40px_rgba(0,242,255,0.4)] shadow-2xl relative overflow-hidden group/btn' 
                            : 'bg-white text-[#004d4d] border border-[#004d4d]/10 hover:bg-gray-50'
                        }`}
                    >
                      {plan.popular && (
                        <div className="absolute inset-0 bg-cyan opacity-0 group-hover/btn:opacity-10 transition-opacity" />
                      )}
                      {plan.status === "coming_soon" ? "Próximamente" : "Seleccionar Plan"}
                      {plan.status !== "coming_soon" && <ArrowRight size={14} className={plan.popular ? "text-cyan" : ""} />}
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
            title="COMPARATIVA DE POTENCIA." 
            highlight="" 
            subtitle="Analiza a fondo cada característica técnica de nuestros motores de crecimiento."
          />

          <div className="relative overflow-hidden rounded-[3.5rem] border border-[#004d4d]/10 bg-white/40 backdrop-blur-3xl shadow-2xl isolate">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-petroleum text-white">
                    <th className="py-8 px-12 text-[11px] font-black uppercase tracking-[0.4em] italic">Característica</th>
                    <th className="py-8 px-6 text-center text-[11px] font-black uppercase tracking-[0.4em] italic border-l border-white/10">Básico</th>
                    <th className="py-8 px-6 text-center text-[11px] font-black uppercase tracking-[0.4em] italic border-l border-white/10 bg-cyan text-petroleum">Pro Elite</th>
                    <th className="py-8 px-6 text-center text-[11px] font-black uppercase tracking-[0.4em] italic border-l border-white/10">Empresa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#004d4d]/5">
                  {comparisonData.map((row, idx) => (
                    <FeatureRow key={idx} row={row} />
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