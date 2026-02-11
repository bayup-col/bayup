"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, User, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { InteractiveUP } from '@/components/landing/InteractiveUP';

export default function BayupFamilyLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const handleFamilyLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const response = await fetch(`${apiBase}/auth/login`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                const user = data.user;

                // BLOQUEO DE SEGURIDAD: Solo entra personal global
                if (!user.is_global_staff) {
                    showToast("Acceso Denegado: Este portal es solo para la Familia Bayup.", "error");
                    setIsLoading(false);
                    return;
                }

                login(data.access_token, user.email, user.role, user.permissions, user.plan, user.is_global_staff);
                showToast("Bienvenido a la Torre de Control, Comandante.", "success");
                router.push('/dashboard/super-admin');
            } else {
                showToast("Credenciales de acceso global incorrectas.", "error");
            }
        } catch (err) {
            showToast("Error de conexión con la red global.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#001A1A] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00f2ff] rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#004d4d] rounded-full blur-[120px]" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/10 shadow-2xl space-y-10"
            >
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="h-20 w-20 bg-white/10 rounded-3xl flex items-center justify-center text-[#00f2ff] border border-white/10 shadow-xl">
                            <ShieldCheck size={40} />
                        </div>
                    </div>
                    <div className="text-3xl font-black italic text-white tracking-tighter uppercase">
                        <span>BAY</span><InteractiveUP />
                        <span className="block text-[10px] font-black tracking-[0.5em] text-[#00f2ff] mt-2">FAMILY ACCESS</span>
                    </div>
                </div>

                <form onSubmit={handleFamilyLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div className="relative group">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#00f2ff] transition-colors" size={18} />
                            <input 
                                type="email" 
                                placeholder="ID Global"
                                className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 focus:border-[#00f2ff]/30 rounded-2xl outline-none text-white font-bold transition-all text-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#00f2ff] transition-colors" size={18} />
                            <input 
                                type="password" 
                                placeholder="Clave de Seguridad"
                                className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 focus:border-[#00f2ff]/30 rounded-2xl outline-none text-white font-bold transition-all text-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-6 bg-white text-[#001A1A] rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-[#00f2ff] hover:scale-105 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <>Acceder a la Red <ArrowRight size={18} /></>}
                    </button>
                </form>

                <p className="text-center text-[8px] font-black uppercase text-white/20 tracking-widest">
                    Protocolo de Seguridad Bayup v2.0 - Acceso Restringido
                </p>
            </motion.div>
        </div>
    );
}
