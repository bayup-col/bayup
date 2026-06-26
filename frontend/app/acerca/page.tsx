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
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-[#050505]">
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: 1.08 }}
          transition={{ duration: 24, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
          className="absolute inset-0 z-0"
        >
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000"
            alt="Equipo Bayup"
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
            Sobre nosotros
            <span className="h-px w-6 bg-white/30" />
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-5xl md:text-[3.75rem] font-light text-white/90 tracking-tight leading-[1.15] md:whitespace-nowrap"
          >
            Nuestra misión es <span className="font-medium text-cyan">tu éxito</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-base md:text-lg font-light text-gray-400 max-w-xl mx-auto leading-relaxed tracking-wide"
          >
            Democratizando el éxito digital, un negocio a la vez.
          </motion.p>
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

      {/* 2. MANIFIESTO */}
      <section className="py-32 md:py-40 px-6 bg-[#FAFAFA] relative overflow-hidden">
        {/* Aura decorativa de fondo */}
        <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] bg-cyan/[0.06] rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto max-w-5xl space-y-32 relative z-10">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.25em] text-petroleum/50">
                <span className="h-px w-6 bg-petroleum/30" />
                Nuestra razón de ser
              </span>

              <h2 className="text-3xl md:text-5xl font-light text-[#0A1A1A] tracking-tight leading-[1.15]">
                ¿Por qué <span className="font-medium text-cyan">existimos?</span>
              </h2>

              <p className="text-gray-500 text-base md:text-lg font-light leading-relaxed">
                En Bayup creemos que el acceso a la tecnología de alto nivel no debería estar restringido solo a las grandes corporaciones. Nacimos para equilibrar la balanza, entregando a cada emprendedor las mismas armas digitales que usan los gigantes del retail.
              </p>

              <div className="space-y-5 pt-2">
                {[
                  "Eliminamos barreras de entrada con modelos sin costo fijo.",
                  "Automatizamos la complejidad técnica para que tú vendas.",
                  "Diseñamos experiencias Platinum que inspiran confianza.",
                  "Construimos tecnología con corazón humano."
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-4 group"
                  >
                    <div className="mt-0.5 h-6 w-6 rounded-full bg-cyan/10 border border-cyan/30 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan/20 transition-colors duration-300">
                      <CheckCircle2 size={13} className="text-cyan" />
                    </div>
                    <p className="text-sm md:text-[15px] font-normal text-gray-600 leading-relaxed pt-0.5">{item}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-cyan/10 to-transparent rounded-[4.5rem] blur-2xl -z-10" />
              <div className="relative rounded-[3.5rem] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] border border-white/60">
                <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=1000" alt="Cultura Bayup" className="w-full h-[420px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>

              {/* Tarjeta flotante de credibilidad */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-3xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] border border-gray-100 px-6 py-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-petroleum flex items-center justify-center text-cyan flex-shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0A1A1A] leading-none">Equipo Bayup</p>
                  <p className="text-xs text-gray-400 mt-0.5">Construyendo con propósito</p>
                </div>
              </div>
            </motion.div>
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
