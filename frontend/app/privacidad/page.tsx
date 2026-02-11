"use client";

import { motion } from "framer-motion";
import { 
  Eye, 
  ShieldCheck, 
  FileText, 
  UserCheck, 
  Server, 
  Database, 
  Lock,
  Globe,
  Bell
} from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/Navbar";

const PrivacyPoint = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="flex gap-8 p-10 rounded-[3rem] bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-700 isolate overflow-hidden group">
    <div className="h-14 w-14 rounded-2xl bg-[#004d4d]/5 flex items-center justify-center text-petroleum group-hover:bg-petroleum group-hover:text-cyan transition-all duration-500 flex-shrink-0">
      <Icon size={28} />
    </div>
    <div className="space-y-3">
      <h3 className="text-xl font-black italic uppercase tracking-tighter text-black">{title}</h3>
      <p className="text-gray-500 text-sm font-medium leading-relaxed">{description}</p>
    </div>
  </div>
);

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-black selection:bg-cyan selection:text-black">
      
      <Navbar />

      {/* 1. HERO CINEMÁTICO */}
      <section className="relative h-[70vh] w-full flex items-center justify-center overflow-hidden bg-[#050505]">
        <motion.div 
          initial={{ scale: 1 }}
          animate={{ scale: 1.1 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
          className="absolute inset-0 z-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=2000" 
            alt="Privacidad de Datos Bayup" 
            className="w-full h-full object-cover opacity-40 filter grayscale-[20%]"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-petroleum/30 to-[#FAFAFA] z-10" />
        
        <div className="relative z-20 text-center space-y-8 px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-2xl"
          >
            TUS DATOS, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan to-white/60">TUS REGLAS.</span>
          </motion.h1>
          <p className="text-xl md:text-2xl font-black text-white italic tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(0,242,255,0.5)]">
            Transparencia Radical Bayup
          </p>
        </div>
      </section>

      {/* 2. POLÍTICAS */}
      <section className="py-40 px-6">
        <div className="container mx-auto max-w-5xl space-y-32">
          
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-petroleum">Compromiso de <span className="text-cyan">Privacidad.</span></h2>
            <p className="text-gray-500 text-lg font-medium leading-relaxed">
              Entendemos que la información de tu negocio y de tus clientes es tu activo más valioso. En Bayup, la protegemos con la misma rigurosidad con la que protegemos nuestra propia infraestructura.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <PrivacyPoint 
              icon={Eye}
              title="Transparencia en Recolección"
              description="Solo recolectamos los datos necesarios para el funcionamiento de tu tienda y la mejora de la experiencia del usuario. Nunca vendemos tu información a terceros."
            />
            <PrivacyPoint 
              icon={Lock}
              title="Control Total de Datos"
              description="Eres el único dueño de tu base de datos de clientes y productos. Puedes exportar o eliminar tu información en cualquier momento sin restricciones."
            />
            <PrivacyPoint 
              icon={Database}
              title="Almacenamiento Seguro"
              description="Utilizamos centros de datos certificados con los más altos estándares de seguridad física y digital para alojar tu ecosistema comercial."
            />
            <PrivacyPoint 
              icon={Bell}
              title="Notificaciones de Cambio"
              description="Cualquier actualización en nuestras políticas de privacidad te será notificada con antelación mediante canales oficiales."
            />
          </div>

          <div className="p-16 rounded-[4rem] bg-white border border-gray-100 shadow-inner space-y-8 text-center">
            <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-3xl mx-auto italic">
              "Nuestra política cumple con los estándares internacionales de protección de datos personales (GDPR y equivalentes locales), asegurando que tu expansión global sea legalmente segura."
            </p>
            <div className="flex justify-center gap-4">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-petroleum/40 italic">Actualizado: Febrero 2026</span>
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
