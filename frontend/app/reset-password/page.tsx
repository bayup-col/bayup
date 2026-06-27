"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const t = new URLSearchParams(window.location.search).get('token');
        if (!t) router.push('/login');
        else setToken(t);
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
        if (password.length < 6) { setError('Mínimo 6 caracteres'); return; }
        setIsLoading(true);
        setError('');
        try {
            const isLocal = typeof window !== 'undefined' &&
                (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
            const apiBase = isLocal
                ? 'http://localhost:8000'
                : (process.env.NEXT_PUBLIC_API_URL || 'https://bayup-backend.onrender.com');
            const res = await fetch(`${apiBase}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password: password }),
            });
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => router.push('/login'), 3000);
            } else {
                let msg = 'Error al restablecer la contraseña';
                try {
                    const data = await res.json();
                    msg = data.detail || msg;
                } catch {}
                setError(msg);
            }
        } catch (err: any) {
            setError(err?.message?.includes('fetch') || err?.name === 'TypeError'
                ? 'No se pudo conectar al servidor. Verifica tu conexión.'
                : 'Error al restablecer la contraseña. Intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
                <div className="bg-white rounded-[3rem] p-12 shadow-2xl text-center max-w-md w-full mx-4">
                    <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-[#004d4d]">¡Contraseña actualizada!</h2>
                    <p className="text-gray-400 mt-2 text-sm">Redirigiendo al login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
            <div className="bg-white rounded-[3rem] p-10 shadow-2xl w-full max-w-md">
                <div className="text-center mb-8">
                    <span className="text-3xl font-black text-[#004d4d] italic tracking-tighter">BAYUP</span>
                    <h2 className="text-xl font-black text-gray-800 mt-3">Nueva contraseña</h2>
                    <p className="text-gray-400 text-sm mt-1">Elige una contraseña segura de al menos 6 caracteres.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input
                            type="password"
                            placeholder="Nueva contraseña"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full pl-12 pr-5 py-4 bg-gray-50 rounded-2xl outline-none text-sm font-semibold text-gray-800"
                            required
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input
                            type="password"
                            placeholder="Confirmar contraseña"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            className="w-full pl-12 pr-5 py-4 bg-gray-50 rounded-2xl outline-none text-sm font-semibold text-gray-800"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl py-3 px-4">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-5 bg-[#001A1A] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 mt-2"
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Cambiar contraseña'}
                    </button>

                    <div className="text-center pt-2">
                        <Link href="/login" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider hover:text-[#004d4d] transition-colors">
                            Volver al login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
