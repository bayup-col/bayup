"use client";

import { motion } from "framer-motion";
import { 
  MessageCircle, 
  Mail, 
  HelpCircle, 
  Clock, 
  Headphones, 
  ArrowRight,
  LifeBuoy,
  ShieldQuestion
} from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/Navbar";
import { GlassButton } from "@/components/landing/GlassButton";

export default function SoportePage() {
  const faqs = [
    { q: "¿Cómo integro mi dominio?", a: "Puedes hacerlo desde Configuración > Dominio. Nuestro equipo te ayuda en el proceso." },
    { q: "¿Tienen soporte 24/7?", a: "Sí, el Plan Pro Elite y Empresa cuentan con soporte prioritario las 24 horas." },
    { q: "¿Es seguro mi dinero?", a: "Totalmente. Usamos pasarelas cifradas y no retenemos tus fondos." }
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
            src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=2000" 
            alt="Centro de Ayuda Bayup" 
            className="w-full h-full object-cover opacity-40 filter brightness-75"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-petroleum/30 to-[#FAFAFA] z-10" />
        
        <div className="relative z-20 text-center space-y-8 px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-2xl"
          >
            ESTAMOS <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan to-white/60">CONTIGO.</span>
          </motion.h1>
          <p className="text-xl md:text-2xl font-black text-white italic tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(0,242,255,0.5)]">
            Soporte Humano y Tecnología IA
          </p>
        </div>
      </section>

      {/* 2. CANALES DE CONTACTO */}
      <section className="py-40 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            <motion.div 
              whileHover={{ y: -10 }}
              className="p-12 rounded-[4rem] bg-white border border-gray-100 shadow-xl space-y-8 text-center md:text-left isolate overflow-hidden relative"
            >
              <div className="h-16 w-16 rounded-2xl bg-petroleum flex items-center justify-center text-cyan shadow-lg mx-auto md:mx-0">
                <MessageCircle size={32} />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black italic uppercase tracking-tighter">WhatsApp Directo</h3>
                <p className="text-gray-500 font-medium leading-relaxed italic">Atención inmediata por parte de nuestros especialistas en e-commerce.</p>
              </div>
              <GlassButton href="https://wa.me/573014484127" variant="light">Hablar con un Humano</GlassButton>
            </motion.div>

            <motion.div 
              whileHover={{ y: -10 }}
              className="p-12 rounded-[4rem] bg-petroleum text-white space-y-8 text-center md:text-left shadow-2xl relative overflow-hidden isolate"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.1)_0%,transparent_70%)]" />
              <div className="h-16 w-16 rounded-2xl bg-cyan flex items-center justify-center text-petroleum shadow-lg mx-auto md:mx-0 relative z-10">
                <Mail size={32} />
              </div>
              <div className="space-y-4 relative z-10">
                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">Correo Oficial</h3>
                <p className="text-white/60 font-medium leading-relaxed italic">Para consultas técnicas, legales o comerciales de mayor profundidad.</p>
              </div>
              <div className="relative z-10">
                <Link href="mailto:soporte@bayup.com" className="text-cyan font-black uppercase tracking-widest text-xs hover:text-white transition-colors">soporte@bayup.com</Link>
              </div>
            </motion.div>

          </div>

          {/* FAQ PREGUNTAS FRECUENTES */}
          <div className="mt-40 space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-petroleum">Preguntas <span className="text-cyan">Frecuentes</span></h2>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] italic">Respuestas Rápidas Terminal Bayup</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              {faqs.map((faq, i) => (
                <div key={i} className="p-10 rounded-[3rem] bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <h4 className="text-lg font-black italic uppercase tracking-tight text-black mb-4 flex items-center gap-4">
                    <ShieldQuestion size={20} className="text-cyan" /> {faq.q}
                  </h4>
                  <p className="text-gray-500 font-medium leading-relaxed pl-9">{faq.a}</p>
                </div>
              ))}
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
