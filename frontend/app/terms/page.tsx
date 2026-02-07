"use client";

import { motion } from "framer-motion";
import { 
  FileText, 
  Gavel, 
  Scale, 
  Handshake, 
  AlertCircle, 
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/Navbar";

export default function TerminosPage() {
  const sections = [
    { title: "Uso de la Plataforma", desc: "El acceso a Bayup implica la aceptación de estos términos. La plataforma debe ser usada para fines legales y comerciales lícitos." },
    { title: "Comisiones y Pagos", desc: "Bayup cobra una comisión por venta exitosa según el plan seleccionado. No hay cargos ocultos ni mensualidades fijas en planes básicos." },
    { title: "Propiedad Intelectual", desc: "Tu marca es tuya. Bayup no reclama derechos sobre tus productos, diseños o base de datos de clientes." },
    { title: "Cancelación del Servicio", desc: "Puedes darte de baja en cualquier momento. Al hacerlo, te garantizamos el acceso a tus datos para exportarlos de forma segura." }
  ];

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
            src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=2000" 
            alt="Integridad Legal Bayup" 
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
            MARCO <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan to-white/60">DE INTEGRIDAD.</span>
          </motion.h1>
          <p className="text-xl md:text-2xl font-black text-white italic tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(0,242,255,0.5)]">
            Transparencia en cada Acuerdo
          </p>
        </div>
      </section>

      {/* 2. CONTENIDO LEGAL */}
      <section className="py-40 px-6">
        <div className="container mx-auto max-w-4xl space-y-24">
          
          <div className="text-center space-y-6">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-petroleum leading-none">Condiciones de <span className="text-cyan">Uso.</span></h2>
            <p className="text-gray-500 text-lg font-medium leading-relaxed">
              Nuestro acuerdo legal está diseñado para proteger tanto tu crecimiento como la estabilidad de nuestro ecosistema. Sin letras pequeñas, solo reglas claras.
            </p>
          </div>

          <div className="space-y-12">
            {sections.map((section, i) => (
              <div key={i} className="p-12 rounded-[3.5rem] bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-700">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-black mb-6 flex items-center gap-4">
                  <CheckCircle2 size={24} className="text-cyan" /> {section.title}
                </h3>
                <p className="text-gray-500 font-medium leading-relaxed italic">{section.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-12 rounded-[4rem] bg-petroleum text-white text-center space-y-8 shadow-2xl relative overflow-hidden isolate">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.1)_0%,transparent_70%)]" />
            <div className="relative z-10 space-y-6">
              <Scale size={48} className="mx-auto text-cyan" />
              <h3 className="text-3xl font-black italic uppercase tracking-tighter">¿Necesitas mayor claridad?</h3>
              <p className="text-white/60 text-sm max-w-md mx-auto italic">Si tienes alguna duda sobre nuestros términos legales, nuestro equipo de soporte está listo para asistirte.</p>
              <div className="pt-4">
                <Link href="/soporte" className="inline-flex items-center gap-2 text-cyan font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors">
                  Contactar Soporte Legal <ExternalLink size={14} />
                </Link>
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