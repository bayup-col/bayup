"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { InteractiveUP } from "@/components/landing/InteractiveUP";
import { GlassyButton } from "@/components/landing/GlassyButton";
import { Lock, Mail, Loader2, Ghost, User, Phone, ShieldCheck, LayoutGrid, ChevronDown, Check, Home, Eye, EyeOff, MailCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AuthShowcase, registerShowcaseSlides } from "@/components/landing/AuthShowcase";
import { signInWithGoogle } from "@/lib/supabaseClient";

const FloatingParticlesBackground = dynamic(
  () => import("@/components/landing/FloatingParticlesBackground").then((mod) => mod.FloatingParticlesBackground),
  { 
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-white" /> 
  }
);

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    affiliateCode: '',
    planId: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [plans] = useState<any[]>([
    { id: '1', name: 'Básico', slug: 'básico' },
    { id: '2', name: 'Pro Elite', slug: 'pro_elite' }
  ]);
  
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Auto-selección de plan basada en URL
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam) {
      const matchedPlan = plans.find(p => p.slug === planParam || p.id === planParam);
      if (matchedPlan) {
        setFormData(prev => ({ ...prev, planId: matchedPlan.id }));
      }
    }
  }, [searchParams, plans]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectPlan = (plan: any) => {
    setFormData({ ...formData, planId: plan.id });
    setIsPlanOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuccess) return;
    if (!formData.firstName || !formData.email || !formData.planId || !formData.password || !formData.confirmPassword) {
      setError("Por favor completa todos los campos obligatorios");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!acceptedTerms) {
      setError("Debes aceptar los términos y condiciones");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // 1. LIMPIEZA ATÓMICA DE SESIONES ANTERIORES
      localStorage.clear(); 
      sessionStorage.clear();

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          password: formData.password, 
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          plan_id: formData.planId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al registrarse');
      }

      setEmailSent(true);
      setIsLoading(false);

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    try {
      await signInWithGoogle('/auth/callback');
    } catch (err: any) {
      setError(err.message || 'No se pudo continuar con Google.');
    }
  };

  const selectedPlan = plans.find(p => p.id === formData.planId);

  if (emailSent) {
    return (
      <div className="relative z-10 w-full max-w-[480px] p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-10 sm:p-14 rounded-[2.5rem] sm:rounded-[3rem] flex flex-col items-center text-center bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.12)] gap-6 overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-cyan/60 to-transparent" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-72 h-72 bg-cyan/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 h-20 w-20 rounded-[2rem] bg-emerald-50 flex items-center justify-center">
            <MailCheck size={36} className="text-emerald-500" />
          </div>

          <div className="relative z-10">
            <h2 className="text-2xl font-light text-black mb-2">¡Cuenta creada!</h2>
            <p className="text-gray-500 text-sm font-light leading-relaxed">
              Te enviamos un email de confirmación a
            </p>
            <p className="text-petroleum font-medium text-sm mt-1">{formData.email}</p>
          </div>

          <div className="relative z-10 w-full p-4 bg-amber-50 border border-amber-100 rounded-2xl">
            <p className="text-amber-700 text-xs font-medium">
              Debes confirmar tu correo antes de iniciar sesión. Revisa también tu carpeta de spam.
            </p>
          </div>

          <Link
            href="/login"
            className="relative z-10 w-full py-4 rounded-full bg-[#0A1A1A] text-white font-medium text-sm tracking-wide text-center transition-opacity hover:opacity-80 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.3)]"
          >
            Ir al inicio de sesión
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full max-w-[640px] p-4 sm:p-6 m-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-7 sm:p-10 md:p-12 rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden transition-all duration-700 isolate flex flex-col bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.12)]"
        >
          {/* Línea de acento superior + glow ambiental, estático (no gira) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-cyan/60 to-transparent" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-72 h-72 bg-cyan/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="text-center mb-8 relative z-10">
            <Link href="/" className="inline-block group/logo">
              <div className="text-3xl font-black text-black italic tracking-tighter mb-2 flex items-center justify-center transition-transform duration-500 group-hover/logo:scale-105">
                <span>BAY</span><InteractiveUP />
              </div>
            </Link>
            <p className="text-gray-400 text-xs font-light tracking-[0.1em]">
              Vender inteligente es vender con Bayup
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-4 transition-colors group-focus-within:text-cyan">Nombre *</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 transition-colors group-focus-within:text-cyan" />
                  <input type="text" name="firstName" placeholder="Ej. Juan" className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:border-cyan/40 rounded-2xl outline-none text-sm text-black font-medium transition-all focus:bg-white shadow-inner" value={formData.firstName} onChange={handleChange} required disabled={isSuccess || isLoading} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-4 transition-colors group-focus-within:text-cyan">Apellido</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 transition-colors group-focus-within:text-cyan" />
                  <input type="text" name="lastName" placeholder="Ej. Pérez" className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:border-cyan/40 rounded-2xl outline-none text-sm text-black font-medium transition-all focus:bg-white shadow-inner" value={formData.lastName} onChange={handleChange} disabled={isSuccess || isLoading} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-4 transition-colors group-focus-within:text-cyan">Correo Electrónico *</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 transition-colors group-focus-within:text-cyan" />
                  <input type="email" name="email" placeholder="juan@bayup.com" className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:border-cyan/40 rounded-2xl outline-none text-sm text-black font-medium transition-all focus:bg-white shadow-inner" value={formData.email} onChange={handleChange} required disabled={isSuccess || isLoading} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-4 transition-colors group-focus-within:text-cyan">Número Telefónico</label>
                <div className="relative group">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 transition-colors group-focus-within:text-cyan" />
                  <input type="tel" name="phone" placeholder="+57 300..." className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:border-cyan/40 rounded-2xl outline-none text-sm text-black font-medium transition-all focus:bg-white shadow-inner" value={formData.phone} onChange={handleChange} disabled={isSuccess || isLoading} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-4 transition-colors group-focus-within:text-cyan">Código de Afiliado</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 transition-colors group-focus-within:text-cyan" />
                  <input type="text" name="affiliateCode" placeholder="Opcional" className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:border-cyan/40 rounded-2xl outline-none text-sm text-black font-medium transition-all focus:bg-white shadow-inner" value={formData.affiliateCode} onChange={handleChange} disabled={isSuccess || isLoading} />
                </div>
              </div>
              <div className="space-y-1.5 relative">
                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-4">Seleccionar Plan *</label>
                <div className="relative">
                  <button type="button" onClick={() => setIsPlanOpen(!isPlanOpen)} disabled={isSuccess || isLoading} className="w-full flex items-center justify-between pl-12 pr-5 py-3 bg-gray-50 border border-transparent hover:border-cyan/40 rounded-2xl outline-none transition-all shadow-inner group" >
                    <LayoutGrid className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 group-hover:text-cyan transition-colors" />
                    <span className={`text-sm font-medium ${selectedPlan ? 'text-black' : 'text-gray-400'}`}> {selectedPlan ? selectedPlan.name : 'Selecciona un motor'} </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isPlanOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isPlanOpen && (
                      <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 5, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full left-0 right-0 z-50 p-2 mt-1 bg-white/95 backdrop-blur-2xl border border-gray-100 rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden" >
                        <div className="space-y-1">
                          {plans.map((p) => (
                            <button key={p.id} type="button" onClick={() => selectPlan(p)} className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all ${formData.planId === p.id ? 'bg-[#0A1A1A] text-white' : 'hover:bg-cyan/5 text-gray-600'}`} >
                              <span>{p.name}</span>
                              {formData.planId === p.id && <Check className="w-3.5 h-3.5 text-cyan" />}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex justify-end mt-1 pr-2">
                  <Link href="/planes" className="text-[10px] font-medium text-gray-400 hover:text-cyan uppercase tracking-[0.1em] underline underline-offset-2 transition-colors"> Ver planes </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-4 transition-colors group-focus-within:text-cyan">Contraseña *</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 transition-colors group-focus-within:text-cyan" />
                  <input type={showPassword ? "text" : "password"} name="password" placeholder="••••••••" className="w-full pl-14 pr-12 py-3 bg-gray-50 border border-transparent focus:border-cyan/40 rounded-2xl outline-none text-sm text-black font-medium transition-all focus:bg-white shadow-inner" value={formData.password} onChange={handleChange} required disabled={isSuccess || isLoading} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#004d4d] transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-4 transition-colors group-focus-within:text-cyan">Confirmar *</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 transition-colors group-focus-within:text-cyan" />
                  <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="••••••••" className="w-full pl-14 pr-12 py-3 bg-gray-50 border border-transparent focus:border-cyan/40 rounded-2xl outline-none text-sm text-black font-medium transition-all focus:bg-white shadow-inner" value={formData.confirmPassword} onChange={handleChange} required disabled={isSuccess || isLoading} />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#004d4d] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3 px-4">
              <button type="button" onClick={() => setAcceptedTerms(!acceptedTerms)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${acceptedTerms ? 'bg-cyan border-cyan' : 'bg-gray-50 border-gray-200'}`} >
                {acceptedTerms && <Check className="w-3.5 h-3.5 text-[#003333] stroke-[4]" />}
              </button>
              <p className="text-sm text-gray-500 font-light"> Acepto los <Link href="/terms" className="text-petroleum font-medium hover:text-cyan underline underline-offset-2">términos y condiciones</Link> * </p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[10px] font-black uppercase text-center">{error}</motion.div>
            )}

            <div className="pt-2 flex flex-col items-center">
              <button type="submit" disabled={isLoading || isSuccess} className="group relative w-full overflow-visible mb-3">
                <motion.div animate={{ scale: isSuccess ? [1, 1.02, 1] : 1, backgroundColor: isSuccess ? "#004d4d" : "#0A1A1A", boxShadow: isSuccess ? "0 0 40px rgba(0, 77, 77, 0.4)" : "none" }} transition={{ duration: 0.4 }} className="relative w-full py-3.5 rounded-full overflow-hidden isolate shadow-[0_15px_35px_-10px_rgba(0,0,0,0.3)]" >
                  <div className="relative z-10 flex items-center justify-center min-h-[20px]">
                    <AnimatePresence mode="wait">
                      {isSuccess ? (
                        <motion.div key="ghost-jump" initial={{ y: 20, opacity: 0, scale: 0.5 }} animate={{ y: [0, -80, 0], opacity: 1, scale: [0.5, 1.5, 1], rotate: [0, 15, -15, 0] }} transition={{ duration: 1.2, times: [0, 0.5, 1], ease: "easeInOut" }} onAnimationComplete={() => { setTimeout(() => { router.push('/onboarding'); }, 300); }} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" >
                          <Ghost size={32} strokeWidth={2.5} />
                        </motion.div>
                      ) : isLoading ? (
                        <motion.div key="loader" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                          <Loader2 className="w-5 h-5 animate-spin text-cyan" />
                        </motion.div>
                      ) : (
                        <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-medium text-sm tracking-wide text-white">Unirme ahora</motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  {!isLoading && !isSuccess && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <motion.div initial={{ x: "-150%", skewX: -45 }} animate={{ x: "150%", skewX: -45 }} transition={{ repeat: Infinity, duration: 2.5, ease: "linear", repeatDelay: 1 }} className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </div>
                  )}
                </motion.div>
              </button>

              <div className="flex items-center gap-3 w-full mb-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.1em]">o continúa con</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={isLoading || isSuccess}
                className="w-full py-3.5 mb-3 rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91A8.78 8.78 0 0 0 17.64 9.2Z" fill="#4285F4" />
                  <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.85.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.95v2.33A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
                  <path d="M3.97 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.95a8.997 8.997 0 0 0 0 8.08l3.02-2.33Z" fill="#FBBC05" />
                  <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.59 8.59 0 0 0 9 0 8.997 8.997 0 0 0 .95 4.96l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58Z" fill="#EA4335" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Registrarme con Google</span>
              </button>

              <p className="text-gray-400 text-xs font-light text-center mt-1"> ¿Ya tienes una cuenta? <Link href="/login" className="text-petroleum font-medium hover:text-cyan transition-colors">Inicia sesión</Link> </p>
            </div>
          </form>
        </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="relative h-screen w-full flex flex-col lg:flex-row bg-white selection:bg-[#00F2FF] selection:text-black overflow-hidden">

      {/* Botón de Regreso a Home (Elegante y blanco premium) */}
      <div className="fixed top-4 left-4 sm:top-8 sm:left-8 z-[100]">
        <GlassyButton href="/" variant="light">
          <Home size={18} />
        </GlassyButton>
      </div>

      <div className="relative w-full lg:w-1/2 h-full flex justify-center overflow-y-auto py-10">
        <FloatingParticlesBackground />
        <Suspense fallback={<div className="text-black font-black uppercase tracking-widest">Cargando Terminal...</div>}>
          <RegisterForm />
        </Suspense>
      </div>

      <AuthShowcase slides={registerShowcaseSlides} />

      <style jsx global>{`
        @keyframes aurora-border { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
        .animate-aurora { animation: aurora-border 6s linear infinite; }
        ::-webkit-scrollbar { display: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
