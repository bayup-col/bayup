"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { InteractiveUP } from "@/components/landing/InteractiveUP";
import { GlassyButton } from "@/components/landing/GlassyButton";
import { Lock, Mail, Loader2, Ghost, Home } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuccess) return;
    setError(null);
    setIsLoading(true);

    try {
      const apiBase = "http://localhost:8000";
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
      const userResponse = await fetch(`${apiBase}/auth/me`, {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      });

      let userRole = 'admin_tienda';
      if (userResponse.ok) {
        const userData = await userResponse.json();
        userRole = userData.role || 'admin_tienda';
      }
      
      login(data.access_token, email, userRole);
      let targetPath = '/dashboard';
      if (userRole === 'super_admin') targetPath = '/dashboard/super-admin';
      else if (userRole === 'afiliado') targetPath = '/afiliado/dashboard';
      
      setRedirectUrl(targetPath);
      setTimeout(() => {
        setIsSuccess(true);
        setIsLoading(false);
      }, 500);

    } catch (err: any) {
      let finalMessage = err.message;
      if (finalMessage === "Failed to fetch") finalMessage = "No se pudo conectar con el servidor central.";
      setError(finalMessage || 'Correo o contraseña incorrectos');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#FAFAFA] selection:bg-[#00F2FF] selection:text-black">
      
      <FloatingParticlesBackground />

      {/* Botón de Regreso a Home (Elegante y blanco premium) */}
      <div className="fixed top-8 left-8 z-[100]">
        <GlassyButton href="/" variant="light">
          <Home size={18} />
        </GlassyButton>
      </div>

      <div className="relative z-10 w-full max-w-[480px] p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-12 rounded-[4rem] overflow-hidden group transition-all duration-700 isolate flex flex-col shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] bg-white"
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

          <div className="text-center mb-12">
            <Link href="/" className="inline-block group/logo">
              <div className="text-4xl font-black text-black italic tracking-tighter mb-4 flex items-center justify-center transition-transform duration-500 group-hover/logo:scale-105">
                <span>BAY</span><InteractiveUP />
              </div>
            </Link>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.15em] max-w-[200px] mx-auto leading-relaxed">
              Vender inteligente es vender con Bayup
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 transition-colors group-focus-within:text-[#004d4d]">
                Usuario
              </label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 transition-colors group-focus-within:text-[#004d4d]" />
                <input
                  type="email"
                  placeholder="nombre@bayup.com"
                  className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-transparent focus:border-[#004d4d]/20 rounded-[2rem] outline-none text-sm text-black font-bold transition-all focus:bg-white shadow-inner"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSuccess}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 transition-colors group-focus-within:text-[#004d4d]">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 transition-colors group-focus-within:text-[#004d4d]" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-transparent focus:border-[#004d4d]/20 rounded-[2rem] outline-none text-sm text-black font-bold transition-all focus:bg-white shadow-inner"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSuccess}
                />
              </div>
              <div className="flex justify-end pr-4 mt-1">
                <Link href="#" className="text-[9px] font-black text-[#004d4d]/60 hover:text-[#004d4d] uppercase tracking-tighter transition-colors">
                  Olvide mi contraseña
                </Link>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[10px] font-black uppercase text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="pt-4 flex flex-col items-center gap-4">
              <button 
                type="submit" 
                disabled={isLoading || isSuccess}
                className="group relative w-full overflow-visible"
              >
                <motion.div
                  animate={{ 
                    scale: isSuccess ? [1, 1.02, 1] : 1,
                    backgroundColor: isSuccess ? "#004d4d" : "#001A1A",
                    boxShadow: isSuccess ? "0 0 40px rgba(0, 77, 77, 0.4)" : "none"
                  }}
                  transition={{ duration: 0.4 }}
                  className="relative w-full py-6 rounded-[2rem] overflow-hidden isolate"
                >
                  {!isSuccess && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <motion.div 
                        initial={{ x: "-150%", skewX: -45 }}
                        animate={{ x: "150%", skewX: -45 }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "linear", repeatDelay: 1 }}
                        className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      />
                    </div>
                  )}

                  <div className="relative z-10 flex items-center justify-center min-h-[24px]">
                    <AnimatePresence mode="wait">
                      {isSuccess ? (
                        <motion.div
                          key="ghost-jump"
                          initial={{ y: 20, opacity: 0, scale: 0.5 }}
                          animate={{ 
                            y: [0, -80, 0], 
                            opacity: 1,
                            scale: [0.5, 1.5, 1],
                            rotate: [0, 15, -15, 0]
                          }}
                          transition={{ 
                            duration: 1.2,
                            times: [0, 0.5, 1],
                            ease: "easeInOut"
                          }}
                          onAnimationComplete={() => {
                            setTimeout(() => { if (redirectUrl) router.push(redirectUrl); }, 300);
                          }}
                          className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                        >
                          <Ghost size={38} strokeWidth={2.5} />
                        </motion.div>
                      ) : isLoading ? (
                        <motion.div
                          key="loader"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <Loader2 className="w-6 h-6 animate-spin text-[#00F2FF]" />
                        </motion.div>
                      ) : (
                        <motion.span 
                          key="text"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="font-black text-[11px] uppercase tracking-[0.3em] text-white"
                        >
                          Iniciar
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className={`absolute inset-0 transition-all duration-500 rounded-[2rem] ${isSuccess ? 'shadow-[0_0_50px_rgba(0,242,255,0.6)]' : 'shadow-none'}`} />
                </motion.div>
              </button>

              <div className="flex flex-col items-center gap-2 mt-4">
                <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider text-center">
                  ¿No tienes cuenta aún? <Link href="/register" className="text-[#004d4d] hover:text-[#00F2FF] transition-colors hover:underline underline-offset-4">Regístrate ahora</Link>
                </p>
                <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider text-center">
                  ¿Tienes dudas? Revisa nuestros <Link href="#" className="text-[#004d4d] hover:text-[#00F2FF] transition-colors hover:underline underline-offset-4">términos y condiciones</Link>
                </p>
              </div>
            </div>
          </form>
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes aurora-border {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .animate-aurora {
          animation: aurora-border 6s linear infinite;
        }
        ::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}