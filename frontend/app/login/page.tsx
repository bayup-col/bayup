"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { InteractiveUP } from "@/components/landing/InteractiveUP";
import { GlassyButton } from "@/components/landing/GlassyButton";
import { Lock, Mail, Loader2, Ghost, Home, ArrowLeft, Send, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { AuthShowcase, loginShowcaseSlides } from "@/components/landing/AuthShowcase";

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
      
      login(data.access_token, email, userRole, userPermissions, userPlan, isGlobalStaff, shopSlug, userData.full_name || "", userLogo, "", "", !!userData.onboarding_completed);

      let targetPath = '/dashboard';
      if (isGlobalStaff) targetPath = '/dashboard/super-admin';
      else if (userRole === 'afiliado') targetPath = '/afiliado/dashboard';
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

  const handleGoogleLogin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) { setError('Login con Google no está configurado aún'); return; }
    const redirectTo = `${window.location.origin}/auth/callback`;
    window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
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
    <div className="relative min-h-screen w-full flex flex-col lg:flex-row bg-[#FAFAFA]">
      <div className="fixed top-4 left-4 sm:top-8 sm:left-8 z-[100]"><GlassyButton href="/" variant="light"><Home size={18} /></GlassyButton></div>

      <div className="relative w-full lg:w-1/2 min-h-screen flex items-center justify-center overflow-y-auto py-10">
        <FloatingParticlesBackground />
        <div className="relative z-10 w-full max-w-[480px] p-4 sm:p-6 perspective-[2000px]">
        <motion.div animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.8 }} style={{ transformStyle: "preserve-3d" }} className="relative w-full h-[620px] sm:h-[650px]">
          <div className="absolute inset-0 backface-hidden bg-white p-7 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] flex flex-col shadow-2xl overflow-hidden" style={{ backfaceVisibility: "hidden" }}>
            <div className="absolute inset-0 rounded-[4rem] overflow-hidden -z-10"><div className="absolute top-1/2 left-1/2 w-[250%] aspect-square animate-aurora opacity-40" style={{ background: `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)` }} /><div className="absolute inset-[2px] rounded-[3.9rem] bg-white/90 backdrop-blur-3xl" /></div>
            <div className="text-center mb-7 sm:mb-12"><div className="text-4xl font-black text-black italic tracking-tighter mb-4 flex items-center justify-center"><span>BAY</span><InteractiveUP /></div><p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.15em]">Vender inteligente es vender con Bayup</p></div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Usuario</label><div className="relative"><Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" /><input type="email" placeholder="nombre@bayup.com" className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-[2rem] outline-none text-sm text-black font-bold shadow-inner" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSuccess} /></div></div>
              <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Contraseña</label><div className="relative"><Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" /><input type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full pl-14 pr-12 py-5 bg-gray-50 rounded-[2rem] outline-none text-sm text-black font-bold shadow-inner" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isSuccess} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div><div className="flex justify-end pr-4 mt-1"><button type="button" onClick={() => setIsFlipped(true)} className="text-[9px] font-black text-[#004d4d]/60 uppercase tracking-tighter">Olvide mi contraseña</button></div></div>
              {emailConfirmed && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-[10px] font-black uppercase text-center flex items-center justify-center gap-2">
                  <CheckCircle2 size={14} className="shrink-0" />
                  ¡Email confirmado! Ya puedes iniciar sesión
                </motion.div>
              )}
              {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[10px] font-black uppercase text-center">{error}</motion.div>}
              <div className="pt-4 flex flex-col items-center gap-4">
                <button type="submit" disabled={isLoading || isSuccess} className="group relative w-full overflow-visible">
                  <motion.div animate={{ backgroundColor: isSuccess ? "#004d4d" : "#001A1A" }} className="relative w-full py-6 rounded-[2rem] overflow-hidden">
                    <div className="relative z-10 flex items-center justify-center min-h-[24px]">
                      <AnimatePresence mode="wait">
                        {isSuccess ? <motion.div key="ghost" animate={{ y: [0, -80, 0], opacity: 1, scale: [0.5, 1.5, 1] }} onAnimationComplete={() => { setTimeout(() => { if (redirectUrl) router.push(redirectUrl); }, 300); }} className="text-white"><Ghost size={38} strokeWidth={2.5} /></motion.div> 
                        : isLoading ? <Loader2 className="w-6 h-6 animate-spin text-[#00F2FF]" /> 
                        : <span className="font-black text-[11px] uppercase tracking-[0.3em] text-white">Acceder al Sistema</span>}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </button>
                <div className="w-full flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">o</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <button type="button" onClick={handleGoogleLogin} className="w-full py-4 rounded-[2rem] border border-gray-200 bg-white text-gray-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-50 transition-all">
                  <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                  Continuar con Google
                </button>
                <div className="flex flex-col items-center gap-2 mt-4"><p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider text-center">¿No tienes cuenta aún? <Link href="/register" className="text-[#004d4d] hover:underline">Regístrate ahora</Link></p></div>
              </div>
            </form>
          </div>
          {/* CARA POSTERIOR: RECUPERACIÓN */}
          <div className="absolute inset-0 backface-hidden bg-white p-7 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] flex flex-col shadow-2xl overflow-hidden" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <div className="text-center mb-7 sm:mb-12"><div className="text-4xl font-black text-black italic mb-4 flex items-center justify-center"><span>BAY</span><InteractiveUP /></div><h3 className="text-xl font-black italic uppercase text-black">¿Olvidaste tu acceso?</h3></div>
            <form onSubmit={handleResetPassword} className="space-y-8"><div className="space-y-2"><label className="text-[9px] font-black text-gray-400 ml-4">Tu Correo de Registro</label><div className="relative"><Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" /><input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-[2rem] outline-none text-sm text-black font-bold shadow-inner" required /></div></div><button type="submit" className="w-full py-6 rounded-[2rem] bg-black text-white font-black text-[11px] uppercase tracking-[0.3em]">Enviar Acceso</button><button type="button" onClick={() => setIsFlipped(false)} className="flex items-center gap-2 text-[10px] font-black text-gray-400 mx-auto uppercase">Regresar</button></form>
          </div>
        </motion.div>
        </div>
      </div>

      <AuthShowcase slides={loginShowcaseSlides} />

      <style jsx global>{` @keyframes aurora-border { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } } .animate-aurora { animation: aurora-border 6s linear infinite; } `}</style>
    </div>
  );
}
