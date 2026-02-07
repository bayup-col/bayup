"use client";

import { motion } from "framer-motion";
import { 
  Cpu, 
  Database, 
  Cloud, 
  Zap, 
  Bot, 
  Code2, 
  Globe2, 
  Terminal,
  Activity,
  Workflow,
  Sparkles,
  Server
} from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { GlassButton } from "@/components/landing/GlassButton";

const TechBlock = ({ icon: Icon, title, highlight, description, tags }: { icon: any, title: string, highlight: string, description: string, tags: string[] }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center"
  >
    <div className="lg:col-span-2 space-y-6">
      <div className="h-16 w-16 rounded-[2rem] bg-gradient-to-br from-petroleum to-[#001A1A] flex items-center justify-center text-cyan shadow-xl border border-white/10">
        <Icon size={32} />
      </div>
      <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-black">
        {title} <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-petroleum to-cyan">{highlight}</span>
      </h3>
      <div className="flex flex-wrap gap-3">
        {tags.map((tag, i) => (
          <span key={i} className="px-4 py-1.5 rounded-full bg-cyan/10 text-petroleum text-[9px] font-black uppercase tracking-widest border border-cyan/20">
            {tag}
          </span>
        ))}
      </div>
    </div>
    <div className="lg:col-span-3 p-10 md:p-14 rounded-[4rem] bg-white border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-700">
      <p className="text-gray-500 text-lg font-medium leading-relaxed italic italic">
        "{description}"
      </p>
    </div>
  </motion.div>
);

export default function TecnologiaPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-black selection:bg-cyan selection:text-black">
      
      {/* 1. HERO CINEMÁTICO */}
      <section className="relative h-[70vh] w-full flex items-center justify-center overflow-hidden bg-[#050505]">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-40">
          <source src="/assets/video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#FAFAFA] z-10" />
        
        <div className="relative z-20 text-center space-y-8 px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-2xl"
          >
            ARQUITECTURA <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan to-white/60">DEL MAÑANA.</span>
          </motion.h1>
          <p className="text-xl md:text-2xl font-black text-white italic tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(0,242,255,0.5)]">
            El motor que impulsa tu éxito
          </p>
        </div>
      </section>

      {/* 2. STACK TECNOLÓGICO */}
      <section className="py-40 px-6">
        <div className="container mx-auto max-w-6xl space-y-40">
          
          <TechBlock 
            icon={Bot}
            title="Inteligencia"
            highlight="Generativa"
            description="Utilizamos modelos de lenguaje de última generación (OpenAI) entrenados específicamente para el comercio minorista. Nuestro motor Bayt AI procesa lenguaje natural para ejecutar acciones complejas dentro de tu tienda."
            tags={["OpenAI GPT-4", "NLP", "Machine Learning", "Bayt Engine"]}
          />

          <TechBlock 
            icon={Workflow}
            title="Automatización"
            highlight="Sin Límites"
            description="Integramos N8N directamente en nuestra infraestructura para permitir flujos de trabajo autónomos. Sincroniza miles de apps, automatiza correos y gestiona bases de datos sin escribir una sola línea de código."
            tags={["N8N Integration", "Workflows", "Webhooks", "API Rest"]}
          />

          <TechBlock 
            icon={Code2}
            title="Frontend"
            highlight="High-Performance"
            description="Construido sobre Next.js 14 y React. Nuestra interfaz utiliza Server Components para una carga instantánea y Framer Motion para lograr una experiencia de usuario fluida y cinemática en cualquier dispositivo."
            tags={["Next.js 14", "React", "TypeScript", "Tailwind CSS"]}
          />

          <TechBlock 
            icon={Database}
            title="Infraestructura"
            highlight="Multi-Tenant"
            description="Cada tienda en Bayup opera de manera aislada y segura. Usamos PostgreSQL con Supabase para garantizar integridad de datos y Vercel Edge Network para latencia mínima en todo el mundo."
            tags={["PostgreSQL", "Supabase", "Docker", "Vercel Edge"]}
          />

          {/* MÓDULO DE VELOCIDAD */}
          <div className="p-20 rounded-[5rem] bg-white border border-gray-100 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 text-cyan opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <Zap size={200} />
            </div>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
              <div className="space-y-4">
                <span className="text-6xl font-black italic tracking-tighter text-petroleum">99.9%</span>
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan">Uptime Garantizado</p>
              </div>
              <div className="space-y-4">
                <span className="text-6xl font-black italic tracking-tighter text-petroleum">&lt;100ms</span>
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan">Tiempo de Respuesta</p>
              </div>
              <div className="space-y-4">
                <span className="text-6xl font-black italic tracking-tighter text-petroleum">256-bit</span>
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan">Cifrado de Datos</p>
              </div>
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