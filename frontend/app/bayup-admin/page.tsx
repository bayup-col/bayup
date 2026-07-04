"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api';
import { Lock, Mail, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { login, isAuthenticated, isGlobalStaff } = useAuth();

  useEffect(() => {
    if (isAuthenticated && isGlobalStaff) router.replace('/dashboard/super-admin');
    else if (isAuthenticated && !isGlobalStaff) router.replace('/dashboard');
  }, [isAuthenticated, isGlobalStaff, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const data = await apiRequest<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const userData = data.user;
      if (!userData) throw new Error('Error al cargar el perfil.');
      if (!userData.is_global_staff) {
        setError('Acceso denegado. Esta área es solo para el equipo Bayup.');
        setIsLoading(false);
        return;
      }
      login(
        data.access_token,
        userData.email,
        userData.role || 'SUPER_ADMIN',
        userData.permissions || {},
        userData.plan || null,
        true,
        userData.shop_slug || '',
        userData.full_name || '',
        userData.logo_url || '',
        '',
        '',
        !!userData.onboarding_completed,
        userData.status || 'Activo',
      );
      router.replace('/dashboard/super-admin');
    } catch (err: any) {
      setError(err?.message || 'Credenciales incorrectas.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040a0a] flex items-center justify-center px-4">
      {/* Grid pattern background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#00f2ff 1px, transparent 1px), linear-gradient(90deg, #00f2ff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#00f2ff]/10 border border-[#00f2ff]/20 mb-5">
            <ShieldCheck size={26} className="text-[#00f2ff]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            BAY<span className="text-[#00f2ff]">UP</span>
            <span className="text-white">.</span>
          </h1>
          <p className="text-[11px] text-white/30 mt-1 uppercase tracking-widest font-bold">Panel de control global</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="admin@bayup.com"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-[#00f2ff]/40 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••"
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-[#00f2ff]/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-[11px] text-red-400/80 bg-red-500/8 border border-red-500/15 rounded-xl px-3.5 py-2.5"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 border border-[#00f2ff]/25 hover:border-[#00f2ff]/50 text-[#00f2ff] font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Acceder al panel'}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-white/10 mt-6">
          Acceso restringido · Solo equipo Bayup
        </p>
      </motion.div>
    </div>
  );
}
