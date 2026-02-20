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

import { SignInButton, useSession } from "@clerk/nextjs";

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
  const { login, clerkLogin } = useAuth();
  const { session } = useSession();

  // Sincronización automática si el usuario inicia sesión con Clerk
  useEffect(() => {
    const syncClerk = async () => {
      if (session) {
        setIsLoading(true);
        try {
          const token = await session.getToken();
          if (token) {
            await clerkLogin(token);
            setIsSuccess(true);
          }
        } catch (err: any) {
          setError(err.message || "Error al sincronizar con Clerk");
        } finally {
          setIsLoading(false);
        }
      }
    };
    syncClerk();
  }, [session, clerkLogin]);

  useEffect(() => {
    // Cleanup de WebGL y GSAP para evitar "Context Lost" e "Invalid scope"
    return () => {
      if (typeof window !== 'undefined') {
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(canvas => {
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (gl && (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')) {
            (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')?.loseContext();
          }
        });
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuccess) return;
    setError(null);
    setIsLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
      
      // El backend ahora devuelve el objeto user completo en el login
      const userData = data.user;
      const isGlobalStaff = userData.is_global_staff || false;

      // 1. BLOQUEO PARA LA FAMILIA (Deben ir por /bayup-family)
      if (isGlobalStaff) {
          setError("Acceso Restringido: Tu cuenta pertenece a la Familia Bayup. Por favor, usa la entrada exclusiva en /bayup-family");
          setIsLoading(false);
          return;
      }
      
      const userRole = userData.role || 'admin_tienda';
      const userPermissions = userData.permissions || {};
      const userPlan = userData.plan || null;
      const shopSlug = userData.shop_slug || "";
      
      // Guardamos TODO en el contexto de Auth
      login(data.access_token, email, userRole, userPermissions, userPlan, isGlobalStaff, shopSlug);
      
      console.log("LOGIN EXITOSO - ROL:", userRole, "ES GLOBAL:", isGlobalStaff);

      let targetPath = '/dashboard';
      
      // SI ES STAFF GLOBAL (DANI O INVITADOS DE DANI), VA AL SUPER ADMIN
      if (isGlobalStaff) {
          targetPath = '/dashboard/super-admin';
      } else if (userRole === 'afiliado') {
          targetPath = '/afiliado/dashboard';
      }
      
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiBase}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (response.ok) {
        setIsResetSuccess(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error al solicitar nueva clave');
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#FAFAFA] selection:bg-[#00F2FF] selection:text-black">
      
      <FloatingParticlesBackground />

      {/* Botón de Regreso a Home */}
      <div className="fixed top-8 left-8 z-[100]">
        <GlassyButton href="/" variant="light">
          <Home size={18} />
        </GlassyButton>
      </div>

      <div className="relative z-10 w-full max-w-[480px] p-6 perspective-[2000px]">
        <motion.div 
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative w-full h-[750px]"
        >
          {/* --- CARA FRONTAL: LOGIN --- */}
          <div 
            className="absolute inset-0 backface-hidden bg-white p-12 rounded-[4rem] flex flex-col shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] overflow-hidden"
            style={{ backfaceVisibility: "hidden" }}
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
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-14 pr-12 py-5 bg-gray-50 border border-transparent focus:border-[#004d4d]/20 rounded-[2rem] outline-none text-sm text-black font-bold transition-all focus:bg-white shadow-inner"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSuccess}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#004d4d] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="flex justify-end pr-4 mt-1">
                  <button 
                    type="button"
                    onClick={() => setIsFlipped(true)}
                    className="text-[9px] font-black text-[#004d4d]/60 hover:text-[#004d4d] uppercase tracking-tighter transition-colors"
                  >
                    Olvide mi contraseña
                  </button>
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
                  </motion.div>
                </button>

                <div className="w-full flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">O accede con</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                <SignInButton mode="modal">
                   <button 
                    type="button"
                    className="w-full py-5 rounded-[2rem] border-2 border-gray-50 flex items-center justify-center gap-3 hover:bg-gray-50 transition-all group/clerk"
                   >
                     <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4 transition-all" alt="Google" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover/clerk:text-black">Continuar con Google</span>
                   </button>
                </SignInButton>

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
          </div>

          {/* --- CARA POSTERIOR: RECUPERACIÓN --- */}
          <div 
            className="absolute inset-0 backface-hidden bg-white p-12 rounded-[4rem] flex flex-col shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] overflow-hidden"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
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
              <div className="text-4xl font-black text-black italic tracking-tighter mb-4 flex items-center justify-center">
                <span>BAY</span><InteractiveUP />
              </div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-black">¿Olvidaste tu acceso?</h3>
              <p className="text-gray-400 text-[9px] font-bold uppercase tracking-[0.15em] max-w-[200px] mx-auto leading-relaxed mt-2">
                Ingresa tu correo para enviarte una nueva contraseña
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!isResetSuccess ? (
                <motion.form 
                  key="reset-form"
                  onSubmit={handleResetPassword} 
                  className="space-y-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">
                      Tu Correo de Registro
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 transition-colors group-focus-within:text-[#004d4d]" />
                      <input
                        type="email"
                        placeholder="nombre@bayup.com"
                        className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-transparent focus:border-[#004d4d]/20 rounded-[2rem] outline-none text-sm text-black font-bold transition-all focus:bg-white shadow-inner"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-6">
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="group relative w-full overflow-visible"
                    >
                      <motion.div
                        className="relative w-full py-6 rounded-[2rem] bg-black text-white font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 overflow-hidden shadow-xl"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-[#00F2FF]" />
                        ) : (
                          <>
                            <Send size={14} className="text-[#00F2FF]" /> Enviar Acceso
                          </>
                        )}
                        <div className="absolute inset-0 bg-cyan translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-10" />
                      </motion.div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setIsFlipped(false)}
                      className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-black uppercase tracking-widest transition-colors"
                    >
                      <ArrowLeft size={14} /> Regresar al inicio
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div 
                  key="reset-success"
                  className="text-center py-10 space-y-8"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="h-20 w-20 bg-cyan/20 rounded-full flex items-center justify-center mx-auto text-cyan">
                    <CheckCircle2 size={40} />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-2xl font-black italic uppercase tracking-tighter text-black">¡Correo Enviado!</h4>
                    <p className="text-gray-500 text-xs font-medium leading-relaxed px-4">
                      Revisa tu bandeja de entrada. Te hemos enviado las instrucciones para restablecer tu acceso.
                    </p>
                  </div>
                  <button 
                    onClick={() => { setIsFlipped(false); setIsResetSuccess(false); }}
                    className="px-10 py-4 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Volver al login
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}
