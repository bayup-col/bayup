"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$0",
    desc: "Para emprendedores que inician su viaje digital.",
    features: ["1 Tienda", "Productos ilimitados", "IA Básica", "Comisión 10%"],
    color: "bg-white/5",
    accent: "text-gray-400"
  },
  {
    name: "Pro",
    price: "$99",
    desc: "El equilibrio perfecto entre potencia y costo.",
    features: ["5 Tiendas", "IA Avanzada (Bayt)", "Automatizaciones n8n", "Comisión 5%", "Soporte Prioritario"],
    color: "bg-gradient-to-br from-[#004d4d] to-[#0B0B0B]",
    accent: "text-[#00f2ff]",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "Infraestructura dedicada para líderes del mercado.",
    features: ["Tiendas ilimitadas", "SLA 99.99%", "IA Customizada", "Comisión 0%", "Account Manager"],
    color: "bg-white/5",
    accent: "text-gray-400"
  }
];

export const Pricing = () => {
  return (
    <section className="py-32 bg-[#0B0B0B] relative overflow-hidden">
      <div className="container mx-auto px-6">
        
        <div className="text-center mb-24 space-y-4">
          <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase">
            Planes <span className="text-[#004d4d]">Estratégicos.</span>
          </h2>
          <p className="text-gray-500 font-medium max-w-xl mx-auto">Selecciona el motor que impulsará tu próximo nivel de crecimiento.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-10 rounded-[3rem] border border-white/10 flex flex-col ${p.color} group hover:scale-[1.02] transition-all duration-500`}
            >
              {p.popular && (
                <div className="absolute top-6 right-10 px-4 py-1 bg-[#00f2ff] text-black text-[8px] font-black uppercase tracking-[0.2em] rounded-full">
                  Más Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className={`text-2xl font-black italic uppercase tracking-tighter mb-2 ${p.accent}`}>{p.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white tracking-tighter">{p.price}</span>
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">/mes</span>
                </div>
                <p className="text-gray-400 text-sm mt-4 font-medium">{p.desc}</p>
              </div>

              <div className="flex-1 space-y-4 mb-10 text-sm">
                {p.features.map((f, j) => (
                  <div key={j} className="flex items-center gap-3 text-gray-300">
                    <div className="h-5 w-5 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className={p.popular ? "text-[#00f2ff]" : "text-gray-500"} />
                    </div>
                    <span className="font-medium">{f}</span>
                  </div>
                ))}
              </div>

              <button className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group/btn ${p.popular ? 'bg-[#00f2ff] text-black shadow-xl shadow-[#00f2ff]/20' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'}`}>
                Seleccionar Plan <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
