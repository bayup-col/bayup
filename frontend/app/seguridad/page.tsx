"use client";

import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  Key, 
  Database, 
  ShieldAlert, 
  CheckCircle2,
  Fingerprint,
  Cloud,
  ShieldHalf,
  FileSearch,
  RotateCw
} from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { GlassButton } from "@/components/landing/GlassButton";
import { Navbar } from "@/components/Navbar";

const SecurityCard = ({ icon: Icon, title, description, points }: { icon: any, title: string, description: string, points: string[] }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="p-12 rounded-[4rem] bg-white border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-700 space-y-8"
  >
    <div className="h-16 w-16 rounded-2xl bg-petroleum flex items-center justify-center text-cyan shadow-lg">
      <Icon size={32} />
    </div>
    <div className="space-y-4">
      <h3 className="text-3xl font-black italic uppercase tracking-tighter text-black">{title}</h3>
      <p className="text-gray-500 font-medium leading-relaxed">
        {description}
      </p>
    </div>
    <ul className="space-y-4 pt-4 border-t border-gray-50">
      {points.map((p, i) => (
        <li key={i} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-petroleum/60">
          <CheckCircle2 size={14} className="text-cyan" />
          {p}
        </li>
      ))}
    </ul>
  </motion.div>
);

export default function SeguridadPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-black selection:bg-cyan selection:text-black">
      
      <Navbar />

      {/* 1. HERO CINEMÁTICO */}
      <section className="relative h-[70vh] w-full flex items-center justify-center overflow-hidden bg-[#050505]">
        {/* Imagen de Impacto: Seguridad Digital */}
        <motion.div 
          initial={{ scale: 1 }}
          animate={{ scale: 1.1 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
          className="absolute inset-0 z-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=2000" 
            alt="Blindaje Digital Bayup" 
            className="w-full h-full object-cover opacity-40 filter brightness-75 grayscale-[30%]"
          />
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-petroleum/40 to-[#FAFAFA] z-10" />
        
        <div className="relative z-20 text-center space-y-8 px-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
            className="h-24 w-24 rounded-[2.5rem] bg-cyan/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-cyan mx-auto shadow-[0_0_50px_rgba(0,242,255,0.3)] mb-10"
          >
            <Lock size={48} strokeWidth={1.5} />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-2xl"
          >
            BLINDAJE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan to-white/60">BANCARIO.</span>
          </motion.h1>
          <p className="text-xl md:text-2xl font-black text-white italic tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(0,242,255,0.5)]">
            Tus datos son nuestra prioridad absoluta
          </p>
        </div>
      </section>

      {/* 2. PILARES DE SEGURIDAD */}
      <section className="py-40 px-6">
        <div className="container mx-auto max-w-6xl space-y-32">
          
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-petroleum">Tranquilidad para tu <span className="text-cyan">negocio.</span></h2>
            <p className="text-gray-500 text-lg font-medium leading-relaxed">
              En Bayup, aplicamos protocolos de seguridad de nivel empresarial para garantizar que tu información, la de tus clientes y tus transacciones estén protegidas bajo los estándares más estrictos de la industria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <SecurityCard 
              icon={ShieldCheck}
              title="Cifrado AES-256"
              description="Toda la información sensible, desde contraseñas hasta datos de transacciones, es encriptada antes de ser almacenada en nuestras bases de datos."
              points={["Encriptación en reposo", "SSL de 256 bits", "Protocolos HTTPS", "Privacidad de Usuario"]}
            />
            <SecurityCard 
              icon={ShieldHalf}
              title="Aislamiento Tenant"
              description="Nuestra arquitectura multi-tenant asegura que los datos de cada tienda estén completamente aislados de las demás mediante políticas de RLS."
              points={["Postgres RLS", "Sandbox de datos", "Cero fugas", "Bases de datos seguras"]}
            />
            <SecurityCard 
              icon={Fingerprint}
              title="Autenticación Pro"
              description="Controlamos el acceso a tu dashboard mediante sistemas de identidad modernos, evitando ingresos no autorizados y ataques de fuerza bruta."
              points={["Login Encriptado", "Gestión de Roles", "Tokens JWT", "Sesiones Seguras"]}
            />
            <SecurityCard 
              icon={RotateCw}
              title="Backups Diarios"
              description="Tu negocio nunca se detiene. Realizamos copias de seguridad automáticas cada 24 horas para garantizar la recuperación inmediata ante cualquier evento."
              points={["Recuperación 24/7", "Cloud Backups", "Integridad de datos", "Alta disponibilidad"]}
            />
          </div>

          {/* MÓDULO DE CUMPLIMIENTO */}
          <div className="p-20 rounded-[5rem] bg-petroleum text-white relative overflow-hidden shadow-2xl group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.1)_0%,transparent_70%)]" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 space-y-6">
                <h3 className="text-4xl font-black italic uppercase tracking-tighter">Monitoreo en tiempo real</h3>
                <p className="text-white/60 text-lg font-medium leading-relaxed italic">
                  "Nuestro centro de operaciones monitorea la salud del sistema 24/7, detectando y mitigando anomalías antes de que afecten tu tienda."
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col items-center gap-3">
                  <Cloud className="text-cyan" size={40} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Detección de Amenazas</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <FileSearch className="text-cyan" size={40} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Auditoría Constante</span>
                </div>
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
