"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { InteractiveUP } from "@/components/landing/InteractiveUP";
import { GlassyButton } from "@/components/landing/GlassyButton";
import { Lock, Mail, Loader2, Ghost, User, Phone, ShieldCheck, LayoutGrid, ChevronDown, Check, Home, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from 'next/dynamic';
import Link from 'next/link';

const FloatingParticlesBackground = dynamic(
  () => import("@/components/landing/FloatingParticlesBackground").then((mod) => mod.FloatingParticlesBackground),
  { 
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-[#FAFAFA]" /> 
  }
);

import { SignUpButton, useSignUp, useSession } from "@clerk/nextjs";

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

      const loginResponse = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: formData.email, password: formData.password }),
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        login(loginData.access_token, formData.email, 'admin_tienda');
      }

      setTimeout(() => {
        setIsSuccess(true);
        setIsLoading(false);
      }, 500);

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
      setIsLoading(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === formData.planId);

  return (
    <div className="relative z-10 w-full max-w-[640px] p-6 max-h-screen overflow-y-auto no-scrollbar">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-10 md:p-12 rounded-[4rem] overflow-hidden group transition-all duration-700 isolate flex flex-col shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] bg-white"
        >
          <div className="absolute inset-0 rounded-[4rem] overflow-hidden -z-10">
            <div 
              className="absolute top-1/2 left-1/2 w-[250%] aspect-square animate-aurora opacity-40 transition-opacity duration-700"
              style={{
                background: `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)`,
                willChange: 'transform'
              }}
            />
            <div className="absolute inset-[2px] rounded-[3.9rem] bg-white/90 backdrop-blur-3xl" />
          </div>

          <div className="text-center mb-8">
            <Link href="/" className="inline-block group/logo">
              <div className="text-4xl font-black text-black italic tracking-tighter mb-2 flex items-center justify-center transition-transform duration-500 group-hover/logo:scale-105">
                <span>BAY</span><InteractiveUP />
              </div>
            </Link>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.15em] leading-relaxed">
              Vender inteligente es vender con Bayup
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 transition-colors group-focus-within:text-[#004d4d]">Nombre *</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 transition-colors group-focus-within:text-[#004d4d]" />
                  <input type="text" name="firstName" placeholder="Ej. Juan" className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:border-[#004d4d]/20 rounded-2xl outline-none text-xs text-black font-bold transition-all focus:bg-white shadow-inner" value={formData.firstName} onChange={handleChange} required disabled={isSuccess || isLoading} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 transition-colors group-focus-within:text-[#004d4d]">Apellido</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 transition-colors group-focus-within:text-[#004d4d]" />
                  <input type="text" name="lastName" placeholder="Ej. Pérez" className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:border-[#004d4d]/20 rounded-2xl outline-none text-xs text-black font-bold transition-all focus:bg-white shadow-inner" value={formData.lastName} onChange={handleChange} disabled={isSuccess || isLoading} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 transition-colors group-focus-within:text-[#004d4d]">Correo Electrónico *</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 transition-colors group-focus-within:text-[#004d4d]" />
                  <input type="email" name="email" placeholder="juan@bayup.com" className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:border-[#004d4d]/20 rounded-2xl outline-none text-xs text-black font-bold transition-all focus:bg-white shadow-inner" value={formData.email} onChange={handleChange} required disabled={isSuccess || isLoading} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 transition-colors group-focus-within:text-[#004d4d]">Número Telefónico</label>
                <div className="relative group">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 transition-colors group-focus-within:text-[#004d4d]" />
                  <input type="tel" name="phone" placeholder="+57 300..." className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:border-[#004d4d]/20 rounded-2xl outline-none text-xs text-black font-bold transition-all focus:bg-white shadow-inner" value={formData.phone} onChange={handleChange} disabled={isSuccess || isLoading} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 transition-colors group-focus-within:text-[#004d4d]">Código de Afiliado</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 transition-colors group-focus-within:text-[#004d4d]" />
                  <input type="text" name="affiliateCode" placeholder="Opcional" className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:border-[#004d4d]/20 rounded-2xl outline-none text-xs text-black font-bold transition-all focus:bg-white shadow-inner" value={formData.affiliateCode} onChange={handleChange} disabled={isSuccess || isLoading} />
                </div>
              </div>
              <div className="space-y-1.5 relative">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Seleccionar Plan *</label>
                <div className="relative">
                  <button type="button" onClick={() => setIsPlanOpen(!isPlanOpen)} disabled={isSuccess || isLoading} className="w-full flex items-center justify-between pl-12 pr-5 py-3 bg-gray-50 border border-transparent hover:border-[#004d4d]/20 rounded-2xl outline-none transition-all shadow-inner group" >
                    <LayoutGrid className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 group-hover:text-[#004d4d] transition-colors" />
                    <span className={`text-xs font-bold ${selectedPlan ? 'text-black' : 'text-gray-400'}`}> {selectedPlan ? selectedPlan.name : 'Selecciona un motor'} </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isPlanOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isPlanOpen && (
                      <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 5, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full left-0 right-0 z-50 p-2 mt-1 bg-white/80 backdrop-blur-2xl border border-[#004d4d]/10 rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,77,77,0.15)] overflow-hidden" >
                        <div className="space-y-1">
                          {plans.map((p) => (
                            <button key={p.id} type="button" onClick={() => selectPlan(p)} className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${formData.planId === p.id ? 'bg-[#004d4d] text-white' : 'hover:bg-[#004d4d]/5 text-gray-600'}`} >
                              <span>{p.name}</span>
                              {formData.planId === p.id && <Check className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex justify-end mt-1 pr-2">
                  <Link href="/planes" className="text-[8px] font-black text-[#004d4d]/60 hover:text-[#004d4d] uppercase tracking-widest underline underline-offset-2 transition-colors"> Ver planes </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 transition-colors group-focus-within:text-[#004d4d]">Contraseña *</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 transition-colors group-focus-within:text-[#004d4d]" />
                  <input type={showPassword ? "text" : "password"} name="password" placeholder="••••••••" className="w-full pl-14 pr-12 py-3 bg-gray-50 border border-transparent focus:border-[#004d4d]/20 rounded-2xl outline-none text-xs text-black font-bold transition-all focus:bg-white shadow-inner" value={formData.password} onChange={handleChange} required disabled={isSuccess || isLoading} />
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
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 transition-colors group-focus-within:text-[#004d4d]">Confirmar *</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 transition-colors group-focus-within:text-[#004d4d]" />
                  <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="••••••••" className="w-full pl-14 pr-12 py-3 bg-gray-50 border border-transparent focus:border-[#004d4d]/20 rounded-2xl outline-none text-xs text-black font-bold transition-all focus:bg-white shadow-inner" value={formData.confirmPassword} onChange={handleChange} required disabled={isSuccess || isLoading} />
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
              <button type="button" onClick={() => setAcceptedTerms(!acceptedTerms)} className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${acceptedTerms ? 'bg-[#004d4d] border-[#004d4d]' : 'bg-gray-50 border-gray-200'}`} >
                {acceptedTerms && <Check className="w-3.5 h-3.5 text-white stroke-[4]" />}
              </button>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter"> Acepto <Link href="/terms" className="text-[#004d4d] hover:text-[#00F2FF] underline underline-offset-2">términos y condiciones</Link> * </p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[10px] font-black uppercase text-center">{error}</motion.div>
            )}

            <div className="pt-4 flex flex-col items-center">
              <button type="submit" disabled={isLoading || isSuccess} className="group relative w-full overflow-visible mb-6">
                <motion.div animate={{ scale: isSuccess ? [1, 1.02, 1] : 1, backgroundColor: isSuccess ? "#004d4d" : "#001A1A", boxShadow: isSuccess ? "0 0 40px rgba(0, 77, 77, 0.4)" : "none" }} transition={{ duration: 0.4 }} className="relative w-full py-5 rounded-[2rem] overflow-hidden isolate" >
                  <div className="relative z-10 flex items-center justify-center min-h-[24px]">
                    <AnimatePresence mode="wait">
                      {isSuccess ? (
                        <motion.div key="ghost-jump" initial={{ y: 20, opacity: 0, scale: 0.5 }} animate={{ y: [0, -80, 0], opacity: 1, scale: [0.5, 1.5, 1], rotate: [0, 15, -15, 0] }} transition={{ duration: 1.2, times: [0, 0.5, 1], ease: "easeInOut" }} onAnimationComplete={() => { setTimeout(() => { router.push('/dashboard'); }, 300); }} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" >
                          <Ghost size={38} strokeWidth={2.5} />
                        </motion.div>
                      ) : isLoading ? (
                        <motion.div key="loader" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                          <Loader2 className="w-6 h-6 animate-spin text-[#00F2FF]" />
                        </motion.div>
                      ) : (
                        <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-black text-[11px] uppercase tracking-[0.3em] text-white">Unirme ahora</motion.span>
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

              <div className="flex flex-col items-center gap-2">
                <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider text-center"> ¿Ya tienes una cuenta? <Link href="/login" className="text-[#004d4d] hover:text-[#00F2FF] transition-colors hover:underline underline-offset-4">Inicia sesión</Link> </p>
              </div>
            </div>
          </form>
        </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="fixed inset-0 w-full h-screen flex items-center justify-center overflow-hidden bg-[#FAFAFA] selection:bg-[#00F2FF] selection:text-black">
      
      <FloatingParticlesBackground />

      {/* Botón de Regreso a Home (Elegante y blanco premium) */}
      <div className="fixed top-8 left-8 z-[100]">
        <GlassyButton href="/" variant="light">
          <Home size={18} />
        </GlassyButton>
      </div>

      <Suspense fallback={<div className="text-black font-black uppercase tracking-widest">Cargando Terminal...</div>}>
        <RegisterForm />
      </Suspense>

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
