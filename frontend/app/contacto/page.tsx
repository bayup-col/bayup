"use client";

import { motion } from "framer-motion";
import {
  MessageCircle,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Music2,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/Navbar";

const directChannels = [
  {
    icon: MessageCircle,
    title: "WhatsApp Directo",
    detail: "+57 301 448 4127",
    description: "Respuesta inmediata de nuestro equipo, sin esperas.",
    href: "https://wa.me/573014484127?text=" + encodeURIComponent("¡Hola! Quiero más información sobre Bayup."),
    cta: "Escribir por WhatsApp",
    accent: true,
  },
  {
    icon: Mail,
    title: "Correo Oficial",
    detail: "soporte@bayup.com",
    description: "Para consultas técnicas, legales o comerciales.",
    href: "mailto:soporte@bayup.com",
    cta: "Enviar correo",
    accent: false,
  },
];

const socialChannels = [
  { icon: Facebook, label: "Facebook", href: "https://www.facebook.com/bayup.com.co/?_rdc=1&_rdr#" },
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/bayup.co?igsh=NGM5M3h1MTg2bzAy&utm_source=qr" },
  { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/company/bayupco/about/?viewAsMember=true" },
  { icon: Music2, label: "TikTok", href: "https://www.tiktok.com/@bayup.co" },
];

export default function ContactoPage() {
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
            src="https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&q=80&w=2000"
            alt="Contacto Bayup"
            className="w-full h-full object-cover opacity-25 filter grayscale"
          />
        </motion.div>
        <div className="absolute inset-0 bg-[#050505]/70 z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,242,255,0.08)_0%,transparent_60%)] z-10" />

        <div className="relative z-20 text-center space-y-8 px-6 max-w-4xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] text-white/50"
          >
            <span className="h-px w-8 bg-white/30" />
            Contáctanos
            <span className="h-px w-8 bg-white/30" />
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-6xl md:text-[4.5rem] font-light text-white/90 tracking-tight leading-[1.1] md:whitespace-nowrap"
          >
            Hablemos de <span className="font-medium text-cyan">tu negocio.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-base md:text-xl font-light text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            Nuestro equipo está listo para responderte. Elige el canal que prefieras y empecemos a construir.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-4"
          >
            {["Respuesta inmediata", "Soporte humano real", "Atención en español"].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-400 font-light">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
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

      {/* 2. CANALES DIRECTOS */}
      <section className="py-24 md:py-36 px-6 bg-[#FAFAFA] relative overflow-hidden">
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-cyan/[0.06] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] bg-petroleum/[0.05] rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto max-w-5xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.25em] text-petroleum/50">
              <span className="h-px w-6 bg-petroleum/30" />
              Canales directos
              <span className="h-px w-6 bg-petroleum/30" />
            </span>
            <h2 className="text-3xl md:text-4xl font-light text-[#0A1A1A] tracking-tight">
              Así puedes <span className="font-medium text-cyan">encontrarnos.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {directChannels.map((channel, i) => (
              <motion.a
                key={i}
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -8 }}
                className={`group relative flex flex-col rounded-[2.5rem] p-10 md:p-12 overflow-hidden transition-all duration-500 ${
                  channel.accent
                    ? "bg-[#0A1A1A] text-white shadow-[0_40px_90px_-20px_rgba(0,242,255,0.3)] border border-white/10"
                    : "bg-white border border-gray-100 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06)] hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.1)]"
                }`}
              >
                {channel.accent && (
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan/10 rounded-full blur-[60px] pointer-events-none" />
                )}

                <div className={`relative z-10 h-16 w-16 rounded-2xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110 ${channel.accent ? "bg-cyan text-[#0A1A1A] shadow-[0_15px_30px_rgba(0,242,255,0.3)]" : "bg-petroleum text-cyan shadow-lg"}`}>
                  <channel.icon size={28} />
                </div>

                <h3 className={`relative z-10 text-2xl font-medium mb-2 ${channel.accent ? "text-white" : "text-[#0A1A1A]"}`}>{channel.title}</h3>
                <p className={`relative z-10 text-sm font-light mb-6 leading-relaxed ${channel.accent ? "text-gray-400" : "text-gray-500"}`}>{channel.description}</p>

                <p className={`relative z-10 text-xl md:text-2xl font-medium mb-10 ${channel.accent ? "text-cyan" : "text-petroleum"}`}>{channel.detail}</p>

                <div className={`relative z-10 mt-auto inline-flex items-center gap-2 text-sm font-medium transition-colors ${channel.accent ? "text-white group-hover:text-cyan" : "text-[#0A1A1A] group-hover:text-petroleum"}`}>
                  {channel.cta}
                  <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </motion.a>
            ))}
          </div>

          {/* UBICACIÓN */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -4 }}
            className="mt-8 flex items-center gap-5 rounded-[2.5rem] p-8 md:p-10 bg-white border border-gray-100 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06)] transition-all duration-500"
          >
            <div className="h-16 w-16 rounded-2xl bg-petroleum/10 flex items-center justify-center text-petroleum flex-shrink-0">
              <MapPin size={26} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-[#0A1A1A] mb-1">Operamos desde Colombia</h3>
              <p className="text-sm text-gray-500 font-light leading-relaxed">Atendemos negocios en toda Latinoamérica, de forma 100% remota.</p>
            </div>
          </motion.div>

          {/* REDES SOCIALES */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 text-center"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gray-400 mb-6">Síguenos en redes</p>
            <div className="flex items-center justify-center gap-4">
              {socialChannels.map((social, i) => (
                <Link
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="h-14 w-14 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-500 hover:text-cyan hover:border-cyan/30 hover:shadow-[0_10px_30px_-10px_rgba(0,242,255,0.3)] hover:-translate-y-1 transition-all duration-300"
                >
                  <social.icon size={20} />
                </Link>
              ))}
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
