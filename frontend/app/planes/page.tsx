"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowRight } from "lucide-react";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/landing/Footer";

const FloatingParticlesBackground = dynamic(
  () => import("@/components/landing/FloatingParticlesBackground").then((mod) => mod.FloatingParticlesBackground),
  { ssr: false }
);

const planDetails = [
  {
    name: "Básico",
    price: "$0",
    desc: "Operación esencial para lanzar tu negocio digital.",
    popular: false,
    status: "active",
    specs: [
      "Tienda personalizada",
      "WhatsApp CRM (1 línea)",
      "Gestión de inventario ilimitado",
      "Pasarela de pagos integrada",
      "Estadísticas de venta",
      "Soporte base"
    ]
  },
  {
    name: "Pro Elite",
    price: "$0",
    desc: "Potencia tu marca con IA y herramientas avanzadas.",
    popular: true,
    status: "active",
    specs: [
      "Todo lo del plan Básico",
      "Respuestas con IA 24/7",
      "Marketing y fidelización",
      "Web exclusiva mayoristas",
      "Separados con IA",
      "Staff (hasta 3 miembros)"
    ]
  },
  {
    name: "Empresa",
    price: "Próximamente",
    desc: "Arquitectura ilimitada para el control total.",
    popular: false,
    status: "coming_soon",
    specs: [
      "Bayt (agente de acción)",
      "Automatizaciones",
      "Facturación electrónica",
      "Nómina y sucursales",
      "Multiventa (Amazon/ML)",
      "Staff ilimitado"
    ]
  }
];

const SectionHeading = ({ eyebrow, title, highlight, subtitle }: { eyebrow: string, title: string, highlight?: string, subtitle?: string }) => (
  <div className="text-center space-y-6 mb-20 max-w-3xl mx-auto">
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.25em] text-petroleum/50"
    >
      <span className="h-px w-6 bg-petroleum/30" />
      {eyebrow}
      <span className="h-px w-6 bg-petroleum/30" />
    </motion.span>
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className="text-3xl md:text-5xl font-light tracking-tight leading-[1.15] text-[#0A1A1A]"
    >
      {title} {highlight && <span className="font-medium text-cyan">{highlight}</span>}
    </motion.h2>
    {subtitle && (
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="text-gray-500 text-base md:text-lg font-light leading-relaxed"
      >
        {subtitle}
      </motion.p>
    )}
  </div>
);

const PlanCard = ({ plan, index }: { plan: typeof planDetails[number], index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
    className={`relative flex flex-col rounded-[2.5rem] p-10 transition-all duration-500 ${
      plan.popular
        ? 'bg-white border border-cyan/30 shadow-[0_30px_70px_-20px_rgba(0,242,255,0.25)] lg:-translate-y-3'
        : 'bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1'
    }`}
  >
    {plan.popular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <span className="bg-[#0A1A1A] text-cyan text-[10px] font-medium uppercase tracking-[0.2em] px-4 py-1.5 rounded-full whitespace-nowrap">
          Recomendado
        </span>
      </div>
    )}

    <div className="space-y-1 mb-8">
      <h3 className="text-xl font-medium text-[#0A1A1A]">{plan.name}</h3>
      <p className="text-sm text-gray-400 font-light leading-relaxed">{plan.desc}</p>
    </div>

    <div className="flex items-baseline gap-1.5 mb-8">
      <span className={`font-light tracking-tight text-[#0A1A1A] ${plan.price.length > 8 ? 'text-3xl' : 'text-5xl'}`}>
        {plan.price}
      </span>
      {plan.price !== "Próximamente" && (
        <span className="text-sm text-gray-400 font-light">/mes</span>
      )}
    </div>

    <div className="h-px w-full bg-gray-100 mb-8" />

    <ul className="space-y-4 mb-10 flex-1">
      {plan.specs.map((spec, j) => (
        <li key={j} className="flex items-start gap-3 text-sm text-gray-600 font-light">
          <Check size={16} className={`mt-0.5 flex-shrink-0 ${plan.popular ? 'text-cyan' : 'text-gray-400'}`} />
          {spec}
        </li>
      ))}
    </ul>

    <Link href={plan.status === "coming_soon" ? "#" : `/register?plan=${plan.name.toLowerCase().replace(" ", "_")}`}>
      <button
        disabled={plan.status === "coming_soon"}
        className={`w-full py-3.5 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2 active:scale-[0.98]
          ${plan.status === "coming_soon"
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : plan.popular
              ? 'bg-cyan text-[#003333] hover:bg-[#1AF5FF]'
              : 'bg-[#0A1A1A] text-white hover:bg-black'
          }`}
      >
        {plan.status === "coming_soon" ? "Próximamente" : "Seleccionar plan"}
        {plan.status !== "coming_soon" && <ArrowRight size={15} />}
      </button>
    </Link>
  </motion.div>
);

const FeatureRow = ({ row }: { row: any }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <tr
      className="hover:bg-cyan/[0.03] transition-colors duration-300 border-b border-gray-100 last:border-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td className="py-6 px-8 md:px-10 min-w-[280px]">
        <div className="relative h-10 flex items-center">
          <AnimatePresence mode="wait">
            {!isHovered ? (
              <motion.div
                key="title"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 flex items-center"
              >
                <span className="text-sm font-medium text-[#0A1A1A]">{row.feature}</span>
              </motion.div>
            ) : (
              <motion.div
                key="description"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 flex items-center"
              >
                <p className="text-xs text-gray-400 font-light leading-relaxed">{row.description}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </td>
      <td className="py-6 px-6 text-center border-l border-gray-100">
        {typeof row.basic === "boolean"
          ? (row.basic ? <Check className="mx-auto text-gray-400" size={18} /> : <X className="mx-auto text-gray-300" size={16} />)
          : <span className="text-sm font-medium text-gray-600">{row.basic}</span>}
      </td>
      <td className="py-6 px-6 text-center border-l border-gray-100 bg-cyan/[0.04]">
        {typeof row.pro === "boolean"
          ? (row.pro ? <Check className="mx-auto text-cyan" size={18} /> : <X className="mx-auto text-gray-300" size={16} />)
          : <span className="text-sm font-medium text-petroleum">{row.pro}</span>}
      </td>
      <td className="py-6 px-6 text-center border-l border-gray-100">
        {typeof row.enterprise === "boolean"
          ? (row.enterprise ? <Check className="mx-auto text-gray-400" size={18} /> : <X className="mx-auto text-gray-300" size={16} />)
          : <span className="text-sm font-medium text-gray-600">{row.enterprise}</span>}
      </td>
    </tr>
  );
};

export default function PlanesPage() {
  const comparisonData = [
    {
      feature: "Mensualidad",
      basic: "Gratis", pro: "Gratis", enterprise: "Próximamente",
      description: "Inversión fija mensual para el mantenimiento y uso de la infraestructura tecnológica de Bayup."
    },
    {
      feature: "Comisiones",
      basic: "2%", pro: "3%", enterprise: "Próximamente",
      description: "Porcentaje cobrado únicamente por cada venta exitosa. Si no vendes, no pagas nada."
    },
    {
      feature: "Inicio y estadísticas",
      basic: true, pro: true, enterprise: true,
      description: "Panel de control central con métricas clave de ventas, visitas y rendimiento de tu tienda en tiempo real."
    },
    {
      feature: "Facturación POS",
      basic: "Estándar", pro: "Estándar", enterprise: "+ Electrónica",
      description: "Punto de venta físico y digital. El plan Empresa incluye integración legal con facturación electrónica automatizada."
    },
    {
      feature: "Pedidos y envíos",
      basic: true, pro: true, enterprise: true,
      description: "Gestión completa del ciclo de vida del pedido, desde la compra hasta la entrega logística final."
    },
    {
      feature: "Gestión de inventario",
      basic: "Limitado", pro: "Ilimitado", enterprise: "Ilimitado",
      description: "Control total de stock, variantes de producto y alertas de inventario bajo sin límites de cantidad."
    },
    {
      feature: "Clientes y descuentos",
      basic: true, pro: true, enterprise: true,
      description: "Base de datos centralizada de tus compradores y potente motor para crear cupones, ofertas y promociones relámpago."
    },
    {
      feature: "Mensajes (omnicanal)",
      basic: false, pro: "Respuestas IA 24/7", enterprise: "Respuestas IA 24/7",
      description: "Centraliza chats de Web, WhatsApp y redes sociales. El plan Pro incluye agentes de IA que responden y venden por ti de forma autónoma."
    },
    {
      feature: "Configuración tienda full",
      basic: true, pro: true, enterprise: true,
      description: "Personalización total de la apariencia, métodos de pago, moneda y ajustes generales de tu ecosistema."
    },
    {
      feature: "Marketing y fidelización",
      basic: false, pro: true, enterprise: true,
      description: "Club de puntos por compras y herramientas avanzadas para crear campañas que aumenten el ROI."
    },
    {
      feature: "Asistente Bayt AI",
      basic: false, pro: "Chat y soporte", enterprise: "Agente de acción",
      description: "Bayt no solo responde dudas; en el plan Empresa puede realizar acciones como crear productos o registrar gastos por voz."
    },
    {
      feature: "Analítica web precisa",
      basic: false, pro: "Estándar", enterprise: "Pixel tracking avanzado",
      description: "Seguimiento ultra-detallado del comportamiento del usuario usando píxeles de rastreo y mapas de calor."
    },
    {
      feature: "Automatizaciones",
      basic: false, pro: false, enterprise: "Conexión nativa",
      description: "Conecta Bayup con miles de aplicaciones externas y crea flujos de trabajo automáticos complejos."
    },
    {
      feature: "Nómina y sucursales",
      basic: false, pro: false, enterprise: true,
      description: "Gestión administrativa de empleados, pagos de nómina y control multi-tienda para diferentes sedes físicas."
    },
    {
      feature: "Cotizaciones automáticas",
      basic: false, pro: false, enterprise: true,
      description: "Generación instantánea de presupuestos y cotizaciones profesionales para clientes mayoristas o corporativos."
    },
    {
      feature: "Multiventa (omnicanal)",
      basic: false, pro: false, enterprise: true,
      description: "Vende en Amazon, Mercado Libre y redes sociales sincronizando todo el inventario desde un solo lugar: Bayup."
    },
    {
      feature: "CRM avanzado integrado",
      basic: false, pro: false, enterprise: true,
      description: "Gestión profunda de relaciones con clientes, segmentación inteligente y seguimiento de leads para maximizar conversiones."
    },
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#FAFAFA] text-[#0A1A1A] overflow-x-hidden">
      <FloatingParticlesBackground />

      <Navbar />

      {/* HERO CINEMÁTICO */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-[#050505]">
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: 1.08 }}
          transition={{ duration: 24, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
          className="absolute inset-0 z-0"
        >
          <img
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=2000"
            alt="Crecimiento de negocio"
            className="w-full h-full object-cover opacity-25 filter grayscale"
          />
        </motion.div>
        <div className="absolute inset-0 bg-[#050505]/70 z-10" />

        <div className="relative z-20 text-center space-y-8 px-6 max-w-4xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.25em] text-white/50"
          >
            <span className="h-px w-6 bg-white/30" />
            Planes y precios
            <span className="h-px w-6 bg-white/30" />
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-5xl md:text-[3.75rem] font-light text-white/90 tracking-tight leading-[1.15]"
          >
            Escoge tu <span className="font-medium text-cyan">motor de crecimiento.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-base md:text-lg font-light text-gray-400 max-w-xl mx-auto leading-relaxed"
          >
            Nuestra infraestructura está diseñada para escalar con tu ambición. Elige el plan que mejor se adapte a tu volumen operativo.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-4"
          >
            {["Sin tarjetas de crédito", "Cancela cuando quieras", "Activación inmediata"].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-400 font-light">
                <Check size={14} className="text-cyan" />
                {item}
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/40">Descubre más</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-8 bg-gradient-to-b from-white/50 to-transparent"
          />
        </motion.div>
      </section>

      {/* GRID DE PLANES */}
      <section className="pt-28 md:pt-32 pb-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {planDetails.map((plan, i) => (
              <PlanCard key={i} plan={plan} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CUADRO COMPARATIVO */}
      <section className="pb-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Comparativa detallada"
            title="Cada"
            highlight="característica, a fondo."
            subtitle="Analiza en detalle qué incluye cada plan para tomar la mejor decisión."
          />

          <div className="relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0A1A1A] text-white">
                    <th className="py-5 px-8 md:px-10 text-xs font-medium uppercase tracking-[0.15em]">Característica</th>
                    <th className="py-5 px-6 text-center text-xs font-medium uppercase tracking-[0.15em] border-l border-white/10">Básico</th>
                    <th className="py-5 px-6 text-center text-xs font-medium uppercase tracking-[0.15em] border-l border-white/10 bg-cyan text-[#003333]">Pro Elite</th>
                    <th className="py-5 px-6 text-center text-xs font-medium uppercase tracking-[0.15em] border-l border-white/10">Empresa</th>
                  </tr>
                </thead>
                <tbody>
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
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
