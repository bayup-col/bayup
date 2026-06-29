"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { InteractiveUP } from "@/components/landing/InteractiveUP";
import { GlassyButton } from "@/components/landing/GlassyButton";
import { Lock, Mail, Loader2, Ghost, Home, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { AuthShowcase, loginShowcaseSlides } from "@/components/landing/AuthShowcase";
import { signInWithGoogle } from "@/lib/supabaseClient";

const FloatingParticlesBackground = dynamic(
  () => import("@/components/landing/FloatingParticlesBackground").then((mod) => mod.FloatingParticlesBackground),
  {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-[#FAFAFA]" />
  }
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isResetSuccess, setIsResetSuccess] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated && !isSuccess) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isSuccess, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('confirmed') === '1') {
      setEmailConfirmed(true);
      window.history.replaceState({}, '', '/login');
    }
    if (params.get('error') === 'google_failed') {
      setError('No se pudo iniciar sesión con Google. Intenta de nuevo.');
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem('bayup_logout_reason') === 'account_removed') {
      setError('Tu cuenta o tienda fue desactivada por un administrador. Si crees que es un error, contacta a soporte Bayup.');
      sessionStorage.removeItem('bayup_logout_reason');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuccess) return;
    setError(null);
    setIsLoading(true);

    try {
      // USAMOS EL CLIENTE CENTRALIZADO (YA REPARADO) PARA EVITAR HARDCODEO
      const data = await apiRequest<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email, password: password }),
      });

      const userData = data.user;
      
      if (!userData) {
          throw new Error("Fallo en la carga del perfil. Contacta a soporte Bayup.");
      }

      const isGlobalStaff = userData.is_global_staff || false;
      const userRole = userData.role || 'admin_tienda';

      const userPermissions = userData.permissions || {};
      const userPlan = userData.plan || null;
      const shopSlug = userData.shop_slug || "";
      const userLogo = userData.logo_url || "";
      
      login(data.access_token, email, userRole, userPermissions, userPlan, isGlobalStaff, shopSlug, userData.full_name || "", userLogo, "", "", !!userData.onboarding_completed, userData.status || "Activo");

      let targetPath = '/dashboard';
      if (isGlobalStaff) targetPath = '/dashboard/super-admin';
      else if (userRole === 'afiliado') targetPath = '/afiliado/dashboard';
      // Registro recién creado, esperando que el equipo Bayup le configure
      // y apruebe su tienda (ver módulo "Registros" del super admin) — no
      // puede entrar a onboarding/dashboard todavía.
      else if (userData.status === 'Pendiente') targetPath = '/registro-pendiente';
      else if (!userData.onboarding_completed) targetPath = '/onboarding';
      
      setRedirectUrl(targetPath);
      setTimeout(() => {
        setIsSuccess(true);
        setIsLoading(false);
      }, 500);

    } catch (err: any) {
      setError(err.message || 'Correo o contraseña incorrectos');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await signInWithGoogle('/auth/callback');
    } catch (err: any) {
      setError(err.message || 'No se pudo iniciar sesión con Google.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiBase}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      setIsResetSuccess(true);
    } catch (err: any) {
      setError('Error al solicitar nueva clave');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full flex flex-col lg:flex-row bg-[#FAFAFA] overflow-hidden">
      <div className="fixed top-4 left-4 sm:top-8 sm:left-8 z-[100]"><GlassyButton href="/" variant="light"><Home size={18} /></GlassyButton></div>

      <div className="relative w-full lg:w-1/2 h-full flex items-center justify-center overflow-y-auto py-6">
        <FloatingParticlesBackground />
        <div className="relative z-10 w-full max-w-[480px] p-4 sm:p-6 perspective-[2000px]">
        <motion.div animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.8 }} style={{ transformStyle: "preserve-3d" }} className="relative w-full h-[660px] sm:h-[680px]">
          <div className="absolute inset-0 backface-hidden bg-white/80 backdrop-blur-2xl border border-white/60 p-7 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] flex flex-col justify-center shadow-[0_40px_90px_-20px_rgba(0,0,0,0.12)] overflow-hidden" style={{ backfaceVisibility: "hidden" }}>
            {/* Línea de acento superior + glow ambiental, estático (no gira) para una sensación futurista pero calma */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-cyan/60 to-transparent" />
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-72 h-72 bg-cyan/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="text-center mb-6 sm:mb-8 relative z-10">
              <div className="text-3xl font-black text-black italic tracking-tighter mb-2 flex items-center justify-center"><span>BAY</span><InteractiveUP /></div>
              <p className="text-gray-400 text-xs font-light tracking-[0.1em]">Vender inteligente es vender con Bayup</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-4">Usuario</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 transition-colors group-focus-within:text-cyan" />
                  <input type="email" placeholder="nombre@bayup.com" className="w-full pl-14 pr-6 py-4 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-2xl outline-none text-sm text-black font-medium transition-all focus:bg-white" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSuccess} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-4">Contraseña</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 transition-colors group-focus-within:text-cyan" />
                  <input type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full pl-14 pr-12 py-4 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-2xl outline-none text-sm text-black font-medium transition-all focus:bg-white" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isSuccess} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-cyan transition-colors">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                <div className="flex justify-end pr-4 pt-1"><button type="button" onClick={() => setIsFlipped(true)} className="text-xs font-medium text-gray-400 hover:text-cyan transition-colors">Olvidé mi contraseña</button></div>
              </div>
              {emailConfirmed && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-medium text-center flex items-center justify-center gap-2">
                  <CheckCircle2 size={14} className="shrink-0" />
                  ¡Email confirmado! Ya puedes iniciar sesión
                </motion.div>
              )}
              {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-medium text-center">{error}</motion.div>}
              <div className="pt-2 flex flex-col items-center gap-3">
                <button type="submit" disabled={isLoading || isSuccess} className="group relative w-full overflow-visible">
                  <motion.div animate={{ backgroundColor: isSuccess ? "#004d4d" : "#0A1A1A" }} className="relative w-full py-3.5 rounded-full overflow-hidden shadow-[0_15px_35px_-10px_rgba(0,0,0,0.3)]">
                    <div className="relative z-10 flex items-center justify-center min-h-[20px]">
                      <AnimatePresence mode="wait">
                        {isSuccess ? <motion.div key="ghost" animate={{ y: [0, -80, 0], opacity: 1, scale: [0.5, 1.5, 1] }} onAnimationComplete={() => { setTimeout(() => { if (redirectUrl) router.push(redirectUrl); }, 300); }} className="text-white"><Ghost size={32} strokeWidth={2.5} /></motion.div>
                        : isLoading ? <Loader2 className="w-5 h-5 animate-spin text-cyan" />
                        : <span className="font-medium text-sm tracking-wide text-white">Iniciar Sesión</span>}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </button>

                <div className="flex items-center gap-3 w-full">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.1em]">o continúa con</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading || isSuccess}
                  className="w-full py-3.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91A8.78 8.78 0 0 0 17.64 9.2Z" fill="#4285F4" />
                    <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.85.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.95v2.33A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
                    <path d="M3.97 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.95a8.997 8.997 0 0 0 0 8.08l3.02-2.33Z" fill="#FBBC05" />
                    <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.59 8.59 0 0 0 9 0 8.997 8.997 0 0 0 .95 4.96l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58Z" fill="#EA4335" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Continuar con Google</span>
                </button>

                <p className="text-gray-400 text-xs font-light text-center mt-3">¿No tienes cuenta aún? <Link href="/register" className="text-petroleum font-medium hover:text-cyan transition-colors">Regístrate ahora</Link></p>
              </div>
            </form>
          </div>
          {/* CARA POSTERIOR: RECUPERACIÓN */}
          <div className="absolute inset-0 backface-hidden bg-white/80 backdrop-blur-2xl border border-white/60 p-7 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] flex flex-col justify-center shadow-[0_40px_90px_-20px_rgba(0,0,0,0.12)] overflow-hidden" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-cyan/60 to-transparent" />
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-72 h-72 bg-cyan/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="text-center mb-9 sm:mb-12 relative z-10">
              <div className="text-3xl font-black text-black italic tracking-tighter mb-3 flex items-center justify-center"><span>BAY</span><InteractiveUP /></div>
              <h3 className="text-xl font-light text-black">¿Olvidaste tu acceso?</h3>
            </div>

            {isResetSuccess ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex flex-col items-center gap-5 text-center">
                <div className="h-16 w-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">¡Correo enviado!</p>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">Revisa tu bandeja de entrada en <span className="font-medium text-gray-600">{resetEmail}</span> y sigue el enlace para restablecer tu acceso.</p>
                </div>
                <button type="button" onClick={() => { setIsFlipped(false); setIsResetSuccess(false); setResetEmail(''); }} className="text-xs font-medium text-gray-400 hover:text-cyan transition-colors mt-2">Volver al inicio de sesión</button>
              </motion.div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6 relative z-10">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.15em] ml-4">Tu correo de registro</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 transition-colors group-focus-within:text-cyan" />
                    <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-gray-50/80 border border-transparent focus:border-cyan/40 rounded-2xl outline-none text-sm text-black font-medium transition-all focus:bg-white" required disabled={isLoading} />
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-4 rounded-full bg-[#0A1A1A] text-white font-medium text-sm tracking-wide shadow-[0_15px_35px_-10px_rgba(0,0,0,0.3)] disabled:opacity-60 flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {isLoading ? 'Enviando...' : 'Enviar Acceso'}
                </button>
                <button type="button" onClick={() => setIsFlipped(false)} className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-cyan transition-colors mx-auto">Regresar</button>
              </form>
            )}
          </div>
        </motion.div>
        </div>
      </div>

      <AuthShowcase slides={loginShowcaseSlides} />

      <style jsx global>{` @keyframes aurora-border { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } } .animate-aurora { animation: aurora-border 6s linear infinite; } `}</style>
    </div>
  );
}
