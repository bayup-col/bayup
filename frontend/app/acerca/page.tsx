"use client";

import { motion } from "framer-motion";
import { Users, Target, Rocket, Heart, CheckCircle2, Globe } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/Navbar";
import { GlassButton } from "@/components/landing/GlassButton";

export default function AcercaPage() {
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
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000" 
            alt="Equipo Bayup" 
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
            NUESTRA <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan to-white/60">MISIÓN.</span>
          </motion.h1>
          <p className="text-xl md:text-2xl font-black text-white italic tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(0,242,255,0.5)]">
            Democratizando el éxito digital
          </p>
        </div>
      </section>

      {/* 2. MANIFIESTO */}
      <section className="py-40 px-6">
        <div className="container mx-auto max-w-5xl space-y-32">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-petroleum leading-none">¿Por qué <br /><span className="text-cyan">existimos?</span></h2>
              <p className="text-gray-500 text-lg font-medium leading-relaxed">
                En Bayup creemos que el acceso a la tecnología de alto nivel no debería estar restringido solo a las grandes corporaciones. Nacimos para equilibrar la balanza, entregando a cada emprendedor las mismas armas digitales que usan los gigantes del retail.
              </p>
              <div className="space-y-6">
                {[
                  "Eliminamos barreras de entrada con modelos sin costo fijo.",
                  "Automatizamos la complejidad técnica para que tú vendas.",
                  "Diseñamos experiencias Platinum que inspiran confianza.",
                  "Construimos tecnología con corazón humano."
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-petroleum/70">
                    <CheckCircle2 size={16} className="text-cyan" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative rounded-[4rem] overflow-hidden shadow-2xl">
              <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=1000" alt="Cultura Bayup" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* VALORES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="p-12 rounded-[3.5rem] bg-white border border-gray-100 shadow-xl space-y-6">
              <div className="h-14 w-14 rounded-2xl bg-petroleum flex items-center justify-center text-cyan shadow-lg"><Target size={28} /></div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter">Impacto Real</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed italic">No medimos nuestro éxito en líneas de código, sino en el crecimiento real de los negocios que confían en nosotros.</p>
            </div>
            <div className="p-12 rounded-[3.5rem] bg-white border border-gray-100 shadow-xl space-y-6">
              <div className="h-14 w-14 rounded-2xl bg-cyan flex items-center justify-center text-petroleum shadow-lg"><Rocket size={28} /></div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter">Innovación</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed italic">Nos obsesiona el futuro. Siempre estamos un paso adelante integrando IA y automatización para tu beneficio.</p>
            </div>
            <div className="p-12 rounded-[3.5rem] bg-white border border-gray-100 shadow-xl space-y-6">
              <div className="h-14 w-14 rounded-2xl bg-petroleum flex items-center justify-center text-cyan shadow-lg"><Heart size={28} /></div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter">Empatía</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed italic">Entendemos los retos de emprender. Por eso diseñamos herramientas simples que resuelven problemas complejos.</p>
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