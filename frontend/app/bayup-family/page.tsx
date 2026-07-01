"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, User, ShieldCheck, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { InteractiveUP } from '@/components/landing/InteractiveUP';
import { signInWithGoogle } from '@/lib/supabaseClient';

export default function BayupFamilyLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const { login } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        try {
            await signInWithGoogle('/auth/callback');
        } catch (err: any) {
            showToast(err.message || "Error al iniciar con Google.", "error");
            setIsGoogleLoading(false);
        }
    };

    const handleFamilyLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const isLocal = typeof window !== 'undefined' &&
                (window.location.hostname === 'localhost' ||
                 window.location.hostname === '127.0.0.1' ||
                 window.location.hostname.includes('192.168.'));
            const apiBase = isLocal
                ? 'http://localhost:8000'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co');
            
            const response = await fetch(`${apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase(), password: password }),
            });

            if (response.ok) {
                const data = await response.json();
                const user = data.user;

                // REGLA DE ORO: Acceso restringido a la Familia Bayup
                const ALLOWED_EMAILS = ['bayupcol@gmail.com', 'admin@bayup.com'];
                const isOwner  = ALLOWED_EMAILS.includes(user.email?.toLowerCase());
                const roleUp   = user.role?.toUpperCase();
                const isGlobal = roleUp === 'SUPER_ADMIN' || roleUp === 'ADMIN' || user.is_global_staff;

                if (!isOwner && !isGlobal) {
                    showToast("Acceso Denegado: Protocolo de seguridad nivel 5 activo.", "error");
                    setIsLoading(false);
                    return;
                }

                login(data.access_token, user.email, user.role, user.permissions, user.plan, true, user.shop_slug, user.full_name || user.name, user.logo_url || "", "", "", true);
                showToast("Acceso concedido. Iniciando sistemas...", "success");
                router.push('/dashboard/super-admin');
            } else {
                const errorData = await response.json().catch(() => ({}));
                let detail = errorData.detail;
                if (Array.isArray(detail)) detail = detail.map((d: any) => d.msg).join(", ");
                showToast(detail || "Credenciales globales no reconocidas.", "error");
            }
        } catch (err) {
            console.error("Error de enlace:", err);
            showToast("Fallo crítico: No hay respuesta del núcleo global.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#001A1A] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ecosistema Visual Super Admin */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00f2ff] rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#004d4d] rounded-full blur-[150px]" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-3xl p-7 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border border-white/10 shadow-[0_0_100px_rgba(0,242,255,0.1)] space-y-7 sm:space-y-10"
            >
                <div className="text-center space-y-6">
                    <div className="flex justify-center">
                        <motion.div
                            animate={{ rotateY: [0, 180, 360] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="h-16 w-16 sm:h-24 sm:w-24 bg-gradient-to-br from-[#004d4d] to-[#00f2ff]/20 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center text-[#00f2ff] border border-white/10 shadow-[0_0_30px_rgba(0,242,255,0.2)]"
                        >
                            <ShieldCheck size={32} className="sm:hidden" />
                            <ShieldCheck size={48} className="hidden sm:block" />
                        </motion.div>
                    </div>
                    <div className="text-4xl font-black italic text-white tracking-tighter capitalize">
                        <span>Bay</span><InteractiveUP />
                        <span className="block text-[10px] font-black tracking-[0.6em] text-cyan mt-4 uppercase opacity-60">Family access</span>
                    </div>
                </div>

                {/* Botón Google — método principal para cuentas OAuth */}
                <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading || isLoading}
                    className="w-full py-4 sm:py-5 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-cyan/30 text-white rounded-[2rem] font-bold text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {isGoogleLoading ? (
                        <Loader2 className="animate-spin" size={18} />
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Ingresar con Google
                        </>
                    )}
                </motion.button>

                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-[9px] font-black tracking-[0.3em] text-white/20 uppercase">o con contraseña</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>

                <form onSubmit={handleFamilyLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div className="relative group">
                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-cyan transition-colors" size={20} />
                            <input
                                type="email"
                                placeholder="Id Global de Acceso"
                                className="w-full pl-16 pr-6 py-4 sm:py-6 bg-white/5 border border-white/5 focus:border-cyan/30 rounded-[2rem] outline-none text-white font-bold transition-all text-sm placeholder:text-white/10"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-cyan transition-colors" size={20} />
                            <input 
                                type={showPassword ? "text" : "password"}
                                placeholder="Clave de Seguridad"
                                className="w-full pl-16 pr-14 py-4 sm:py-6 bg-white/5 border border-white/5 focus:border-cyan/30 rounded-[2rem] outline-none text-white font-bold transition-all text-sm placeholder:text-white/10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-cyan transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-5 sm:py-7 bg-white text-[#001A1A] rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] hover:bg-[#00f2ff] transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <>Autenticar Identidad <ArrowRight size={18} /></>}
                    </motion.button>

                    <div className="text-center">
                        <a href="/login" className="text-[9px] font-semibold tracking-[0.2em] text-white/20 hover:text-cyan/60 transition-colors uppercase">
                            Olvidé mi contraseña → ir a login
                        </a>
                    </div>
                </form>

                <div className="space-y-4">
                    <p className="text-center text-[8px] font-black capitalize text-white/20 tracking-[0.4em]">
                        Protocolo de seguridad bayup v2.5 - Acceso restringido
                    </p>
                    <div className="flex justify-center gap-1">
                        <div className="h-1 w-8 bg-cyan/20 rounded-full" />
                        <div className="h-1 w-2 bg-cyan/20 rounded-full" />
                        <div className="h-1 w-2 bg-cyan/20 rounded-full" />
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
