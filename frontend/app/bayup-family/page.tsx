"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, User, ShieldCheck, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { InteractiveUP } from '@/components/landing/InteractiveUP';

export default function BayupFamilyLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const handleFamilyLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Sincronización dinámica de la Red Global
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://bayup-interactive-production.up.railway.app";
            
            const formData = new FormData();
            formData.append('username', email.trim().toLowerCase());
            formData.append('password', password);

            const response = await fetch(`${apiBase}/auth/login`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                const user = data.user;

                // REGLA DE ORO: Acceso restringido a la Familia Bayup
                const isOwner = user.email === 'bayupcol@gmail.com';
                const isGlobal = user.role?.toUpperCase() === 'SUPER_ADMIN' || user.is_global_staff;

                if (!isOwner && !isGlobal) {
                    showToast("Acceso Denegado: Protocolo de seguridad nivel 5 activo.", "error");
                    setIsLoading(false);
                    return;
                }

                login(data.access_token, user.email, user.role, user.permissions, user.plan, true, user.shop_slug, user.name, user.logo_url || "");
                showToast("Acceso concedido. Iniciando sistemas...", "success");
                router.push('/dashboard/super-admin');
            } else {
                const errorData = await response.json().catch(() => ({}));
                showToast(errorData.detail || "Credenciales globales no reconocidas.", "error");
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
                className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/10 shadow-[0_0_100px_rgba(0,242,255,0.1)] space-y-10"
            >
                <div className="text-center space-y-6">
                    <div className="flex justify-center">
                        <motion.div 
                            animate={{ rotateY: [0, 180, 360] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="h-24 w-24 bg-gradient-to-br from-[#004d4d] to-[#00f2ff]/20 rounded-[2.5rem] flex items-center justify-center text-[#00f2ff] border border-white/10 shadow-[0_0_30px_rgba(0,242,255,0.2)]"
                        >
                            <ShieldCheck size={48} />
                        </motion.div>
                    </div>
                    <div className="text-4xl font-black italic text-white tracking-tighter capitalize">
                        <span>Bay</span><InteractiveUP />
                        <span className="block text-[10px] font-black tracking-[0.6em] text-cyan mt-4 uppercase opacity-60">Family access</span>
                    </div>
                </div>

                <form onSubmit={handleFamilyLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div className="relative group">
                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-cyan transition-colors" size={20} />
                            <input 
                                type="email" 
                                placeholder="Id Global de Acceso"
                                className="w-full pl-16 pr-6 py-6 bg-white/5 border border-white/5 focus:border-cyan/30 rounded-[2rem] outline-none text-white font-bold transition-all text-sm placeholder:text-white/10"
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
                                className="w-full pl-16 pr-14 py-6 bg-white/5 border border-white/5 focus:border-cyan/30 rounded-[2rem] outline-none text-white font-bold transition-all text-sm placeholder:text-white/10"
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
                        className="w-full py-7 bg-white text-[#001A1A] rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] hover:bg-[#00f2ff] transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <>Autenticar Identidad <ArrowRight size={18} /></>}
                    </motion.button>
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
