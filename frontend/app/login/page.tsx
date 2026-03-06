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
  
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated && !isSuccess) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isSuccess, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuccess) return;
    setError(null);
    setIsLoading(true);

    try {
      // URL MAESTRA ÚNICA (CONFIRMADA POR RADAR)
      const apiBase = "https://exciting-optimism-production-4624.up.railway.app";
      
      console.log("🚀 Bayup Core: Accediendo a Producción en:", apiBase);
      
      const response = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email, password: password }),
      });


      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let detail = errorData.detail;
        if (detail === "Incorrect email or password") detail = "Correo o contraseña incorrectos";
        else if (!detail) detail = "Correo o contraseña incorrectos";
        throw new Error(detail);
      }

      const data = await response.json();
      const userData = data.user;
      const isGlobalStaff = userData.is_global_staff || false;
      const userRole = userData.role || 'admin_tienda';

      // BLOQUEO MAESTRO: Los Super Admin NO entran por /login
      if ((isGlobalStaff || userRole?.toUpperCase() === 'SUPER_ADMIN') && !window.location.pathname.includes('bayup-family')) {
          setError("Acceso Restringido: Esta entrada es para tiendas. Por favor usa el portal administrativo en /bayup-family.");
          setIsLoading(false);
          return;
      }
      
      const userPermissions = userData.permissions || {};
      const userPlan = userData.plan || null;
      const shopSlug = userData.shop_slug || "";
      const userLogo = userData.logo_url || "";
      
      login(data.access_token, email, userRole, userPermissions, userPlan, isGlobalStaff, shopSlug, userData.full_name || "", userLogo);
      
      let targetPath = '/dashboard';
      if (isGlobalStaff) targetPath = '/dashboard/super-admin';
      else if (userRole === 'afiliado') targetPath = '/afiliado/dashboard';
      
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
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#FAFAFA]">
      <FloatingParticlesBackground />
      <div className="fixed top-8 left-8 z-[100]"><GlassyButton href="/" variant="light"><Home size={18} /></GlassyButton></div>
      <div className="relative z-10 w-full max-w-[480px] p-6 perspective-[2000px]">
        <motion.div animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.8 }} style={{ transformStyle: "preserve-3d" }} className="relative w-full h-[650px]">
          <div className="absolute inset-0 backface-hidden bg-white p-12 rounded-[4rem] flex flex-col shadow-2xl overflow-hidden" style={{ backfaceVisibility: "hidden" }}>
            <div className="absolute inset-0 rounded-[4rem] overflow-hidden -z-10"><div className="absolute top-1/2 left-1/2 w-[250%] aspect-square animate-aurora opacity-40" style={{ background: `conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #00f2ff 320deg, #004d4d 360deg)` }} /><div className="absolute inset-[2px] rounded-[3.9rem] bg-white/90 backdrop-blur-3xl" /></div>
            <div className="text-center mb-12"><div className="text-4xl font-black text-black italic tracking-tighter mb-4 flex items-center justify-center"><span>BAY</span><InteractiveUP /></div><p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.15em]">Vender inteligente es vender con Bayup</p></div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Usuario</label><div className="relative"><Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" /><input type="email" placeholder="nombre@bayup.com" className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-[2rem] outline-none text-sm text-black font-bold shadow-inner" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSuccess} /></div></div>
              <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Contraseña</label><div className="relative"><Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" /><input type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full pl-14 pr-12 py-5 bg-gray-50 rounded-[2rem] outline-none text-sm text-black font-bold shadow-inner" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isSuccess} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div><div className="flex justify-end pr-4 mt-1"><button type="button" onClick={() => setIsFlipped(true)} className="text-[9px] font-black text-[#004d4d]/60 uppercase tracking-tighter">Olvide mi contraseña</button></div></div>
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
                <div className="flex flex-col items-center gap-2 mt-8"><p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider text-center">¿No tienes cuenta aún? <Link href="/register" className="text-[#004d4d] hover:underline">Regístrate ahora</Link></p></div>
              </div>
            </form>
          </div>
          {/* CARA POSTERIOR: RECUPERACIÓN */}
          <div className="absolute inset-0 backface-hidden bg-white p-12 rounded-[4rem] flex flex-col shadow-2xl overflow-hidden" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <div className="text-center mb-12"><div className="text-4xl font-black text-black italic mb-4 flex items-center justify-center"><span>BAY</span><InteractiveUP /></div><h3 className="text-xl font-black italic uppercase text-black">¿Olvidaste tu acceso?</h3></div>
            <form onSubmit={handleResetPassword} className="space-y-8"><div className="space-y-2"><label className="text-[9px] font-black text-gray-400 ml-4">Tu Correo de Registro</label><div className="relative"><Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" /><input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-[2rem] outline-none text-sm text-black font-bold shadow-inner" required /></div></div><button type="submit" className="w-full py-6 rounded-[2rem] bg-black text-white font-black text-[11px] uppercase tracking-[0.3em]">Enviar Acceso</button><button type="button" onClick={() => setIsFlipped(false)} className="flex items-center gap-2 text-[10px] font-black text-gray-400 mx-auto uppercase">Regresar</button></form>
          </div>
        </motion.div>
      </div>
      <style jsx global>{` @keyframes aurora-border { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } } .animate-aurora { animation: aurora-border 6s linear infinite; } `}</style>
    </div>
  );
}
