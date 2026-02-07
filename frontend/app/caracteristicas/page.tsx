"use client";

import { motion } from "framer-motion";
import { 
  Package, 
  MessageSquare, 
  Truck, 
  BarChart3, 
  Bot, 
  Zap, 
  Users, 
  Globe, 
  ShieldCheck, 
  Layers,
  CheckCircle2,
  Lock,
  Smartphone
} from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { InteractiveUP } from "@/components/landing/InteractiveUP";
import { GlassButton } from "@/components/landing/GlassButton";
import { Navbar } from "@/components/Navbar";

const FeatureCard = ({ icon: Icon, title, description, plan, items }: { icon: any, title: string, description: string, plan: string, items: string[] }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="relative p-10 md:p-14 rounded-[4rem] bg-white border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-700 overflow-hidden group"
  >
    <div className={`absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 text-petroleum`}>
      <Icon size={180} />
    </div>
    
    <div className="relative z-10 space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-petroleum flex items-center justify-center text-cyan shadow-lg">
          <Icon size={28} />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan">{plan}</span>
          <h3 className="text-3xl font-black italic uppercase tracking-tighter">{title}</h3>
        </div>
      </div>
      
      <p className="text-gray-500 font-medium leading-relaxed max-w-lg">
        {description}
      </p>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-petroleum/70">
            <CheckCircle2 size={14} className="text-cyan" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  </motion.div>
);

export default function CaracteristicasPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-black selection:bg-cyan selection:text-black">
      
      <Navbar />

      {/* 1. HERO CINEMÁTICO */}
      <section className="relative h-[70vh] w-full flex items-center justify-center overflow-hidden bg-[#050505]">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-40">
          <source src="/assets/om.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#FAFAFA] z-10" />
        
        <div className="relative z-20 text-center space-y-8 px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-2xl"
          >
            POTENCIA <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan to-white/60">SIN LÍMITES.</span>
          </motion.h1>
          <p className="text-xl md:text-2xl font-black text-white italic tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(0,242,255,0.5)]">
            Descubre cada módulo de Bayup
          </p>
        </div>
      </section>

      {/* 2. CONTENIDO TIPO BLOG / INFO */}
      <section className="py-32 px-6">
        <div className="container mx-auto max-w-6xl space-y-32">
          
          {/* INTRODUCCIÓN */}
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">Un ecosistema diseñado para <span className="text-cyan">vender más.</span></h2>
            <p className="text-gray-500 text-lg font-medium leading-relaxed">
              Bayup no es solo una página web. Es una central de inteligencia comercial que automatiza tus procesos, gestiona tus clientes y escala tus ventas usando la tecnología más avanzada del mercado.
            </p>
          </div>

          {/* PLAN BÁSICO SECCIÓN */}
          <div className="space-y-16">
            <div className="flex items-center gap-6 border-b border-gray-100 pb-8">
              <span className="text-6xl font-black text-gray-100 italic">01</span>
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-petroleum">Módulos Plan Básico</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-10">
              <FeatureCard 
                icon={Package}
                title="Gestión de Inventario"
                plan="Básico • Incluido"
                description="Controla cada unidad de tu negocio. Sube productos ilimitados, gestiona variantes (talla/color) y recibe alertas automáticas cuando el stock sea bajo."
                items={["Variantes Ilimitadas", "Alertas de Stock", "Carga Masiva", "Categorización Inteligente"]}
              />
              <FeatureCard 
                icon={MessageSquare}
                title="Mensajería Omnicanal"
                plan="Básico • Incluido"
                description="No pierdas ninguna venta por falta de respuesta. Centraliza los mensajes de tu web y redes sociales en un solo panel administrativo."
                items={["Chat Web Integrado", "Redes Sociales", "1 Línea WhatsApp", "Historial de Clientes"]}
              />
              <FeatureCard 
                icon={BarChart3}
                title="Estadísticas de Venta"
                plan="Básico • Incluido"
                description="Toma decisiones basadas en datos reales. Visualiza tus ingresos, visitas y productos más vendidos desde un dashboard intuitivo."
                items={["Dashboard en Vivo", "Top Productos", "Reporte Mensual", "Métricas de Conversión"]}
              />
            </div>
          </div>

          {/* PLAN PRO SECCIÓN */}
          <div className="space-y-16">
            <div className="flex items-center gap-6 border-b border-gray-100 pb-8">
              <span className="text-6xl font-black text-gray-100 italic">02</span>
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-petroleum">Potencia Pro Elite</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-10">
              <FeatureCard 
                icon={Bot}
                title="Respuestas IA 24/7"
                plan="Pro Elite • Premium"
                description="Deja que la inteligencia artificial atienda a tus clientes mientras duermes. Bayt AI responde dudas, muestra catálogos y pre-vende por ti."
                items={["IA Auto-aprendizaje", "Ventas en Automático", "Soporte 24/7", "Personalidad de Marca"]}
              />
              <FeatureCard 
                icon={Globe}
                title="Web para Mayoristas"
                plan="Pro Elite • Premium"
                description="Crea un portal exclusivo para tus clientes B2B. Precios especiales, pedidos por volumen y acceso restringido con contraseña."
                items={["Acceso VIP", "Precios Especiales", "Pedidos Mayoristas", "Catálogo Privado"]}
              />
              <FeatureCard 
                icon={Zap}
                title="Marketing & Loyalty"
                plan="Pro Elite • Premium"
                description="Fideliza a tus clientes con un club de puntos. Crea campañas de marketing dirigidas y cupones de descuento avanzados."
                items={["Club de Puntos", "Retargeting", "Campañas IA", "Cupones Dinámicos"]}
              />
            </div>
          </div>

          {/* PLAN EMPRESA SECCIÓN */}
          <div className="space-y-16">
            <div className="flex items-center gap-6 border-b border-gray-100 pb-8">
              <span className="text-6xl font-black text-gray-100 italic">03</span>
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-petroleum">Escalabilidad Empresa</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-10">
              <FeatureCard 
                icon={Layers}
                title="Bayt: Agente de Acción"
                plan="Empresa • Total"
                description="El máximo nivel de IA. No solo responde, ejecuta. Pide a Bayt por voz que registre un gasto, cree un descuento o genere un informe."
                items={["Comandos de Voz", "Ejecución de Procesos", "Integración Total", "Automatización Real"]}
              />
              <FeatureCard 
                icon={Smartphone}
                title="Automatización N8N"
                plan="Empresa • Total"
                description="Conecta Bayup con cualquier otra aplicación. Sincroniza correos, CRMs externos, hojas de cálculo y flujos complejos sin programar."
                items={["Workflows Ilimitados", "API Access", "Webhooks", "Integraciones Pro"]}
              />
              <FeatureCard 
                icon={ShieldCheck}
                title="Nómina & Sucursales"
                plan="Empresa • Total"
                description="Controla múltiples sedes físicas y gestiona el pago de tus colaboradores desde el mismo sistema operativo."
                items={["Multi-sede", "Gestión de Nómina", "Roles Ilimitados", "Control de Vendedores"]}
              />
            </div>
          </div>

          {/* CTA FINAL */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="p-20 rounded-[5rem] bg-petroleum text-center space-y-10 shadow-2xl relative overflow-hidden isolate"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.15)_0%,transparent_70%)]" />
            <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter relative z-10">¿Listo para activar tu motor?</h2>
            <div className="flex justify-center gap-8 relative z-10">
              <GlassButton href="/planes" variant="light">Ver Planes</GlassButton>
              <GlassButton href="/register" variant="dark">Empezar ahora</GlassButton>
            </div>
          </motion.div>

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