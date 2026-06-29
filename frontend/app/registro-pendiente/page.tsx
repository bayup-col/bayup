"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, ShieldCheck, Mail, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { InteractiveUP } from '@/components/landing/InteractiveUP';

const WHATSAPP_URL = "https://wa.me/573014484127?text=" + encodeURIComponent("¡Hola! Tengo una pregunta sobre mi registro en Bayup.");
const SUPPORT_EMAIL = "soporte@bayup.com";

export default function RegistroPendientePage() {
  const { isAuthenticated, isLoading, userStatus, userName, reviewerNotes, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isLoading, isAuthenticated, router]);

  // Si ya fue aprobado (status dejó de ser "Pendiente"), no tiene sentido
  // seguir viendo esta pantalla — lo mandamos a iniciar sesión de nuevo
  // para que el login normal lo lleve a donde corresponda.
  useEffect(() => {
    if (!isLoading && isAuthenticated && userStatus && userStatus !== 'Pendiente') {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, userStatus, router]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-[2rem] border border-gray-100 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.1)] p-8 sm:p-10 space-y-8"
      >
        <div className="text-center space-y-3">
          <div className="text-2xl font-black text-black italic tracking-tighter flex items-center justify-center"><span>BAY</span><InteractiveUP /></div>
          <div className="h-14 w-14 mx-auto rounded-2xl bg-cyan/10 flex items-center justify-center text-petroleum">
            <Clock size={26} />
          </div>
          <h1 className="text-xl font-medium text-[#0A1A1A]">
            {userName ? `¡Gracias, ${userName.split(' ')[0]}!` : '¡Gracias por registrarte!'}
          </h1>
          <p className="text-sm text-gray-500 font-light leading-relaxed">
            Tu cuenta está creada. El equipo Bayup está configurando tu tienda — vas a poder operar en cuanto la aprobemos.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { icon: CheckCircle2, label: 'Información recibida', desc: 'Ya tenemos tus datos', done: true },
            { icon: Clock, label: 'Configurando tu tienda', desc: 'Tu plantilla está en proceso', done: false, active: true },
            { icon: ShieldCheck, label: 'Aprobación', desc: 'Pendiente', done: false },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-emerald-500 text-white' : step.active ? 'bg-cyan/15 text-petroleum' : 'bg-gray-100 text-gray-300'}`}>
                <step.icon size={16} />
              </div>
              <div>
                <p className={`text-sm font-medium ${step.done || step.active ? 'text-[#0A1A1A]' : 'text-gray-400'}`}>{step.label}</p>
                <p className="text-xs text-gray-400 font-light">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {reviewerNotes && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
            <p className="text-[11px] font-medium text-amber-700 uppercase tracking-wide mb-1">Notas del equipo Bayup</p>
            <p className="text-sm text-amber-800/80">{reviewerNotes}</p>
          </div>
        )}

        <div className="p-5 rounded-2xl bg-gray-50/80 space-y-3">
          <p className="text-sm font-medium text-gray-700">¿Tienes dudas? Contáctanos para ayudarte.</p>
          <div className="flex items-center gap-3">
            <a href={`mailto:${SUPPORT_EMAIL}`} aria-label="Escribir por correo" className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-petroleum hover:border-cyan/40 transition-all">
              <Mail size={16} />
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="Escribir por WhatsApp" className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-petroleum hover:border-cyan/40 transition-all">
              <MessageCircle size={16} />
            </a>
          </div>
        </div>

        <button onClick={logout} className="w-full py-3.5 rounded-full bg-[#0A1A1A] text-white text-sm font-medium tracking-wide hover:bg-black transition-all">
          Volver al inicio
        </button>
      </motion.div>
    </div>
  );
}
