"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ConfirmEmailPage() {
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = new URLSearchParams(window.location.search).get('token');
        if (!token) {
            setStatus('error');
            setMessage('Enlace de confirmación inválido.');
            return;
        }

        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiBase = isLocal ? 'http://localhost:8000' : (process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co');

        fetch(`${apiBase}/auth/confirm-email?token=${encodeURIComponent(token)}`)
            .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (res.ok) {
                    setStatus('success');
                    setMessage(data.message || '¡Correo confirmado! Ya puedes iniciar sesión.');
                    setTimeout(() => router.push('/login'), 3000);
                } else {
                    setStatus('error');
                    setMessage(data.detail || 'El enlace es inválido o ya expiró.');
                }
            })
            .catch(() => {
                setStatus('error');
                setMessage('No se pudo conectar al servidor. Intenta de nuevo.');
            });
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
            <div className="bg-white rounded-[3rem] p-12 shadow-2xl text-center max-w-md w-full">
                {status === 'loading' && (
                    <>
                        <Loader2 size={48} className="text-[#004d4d] mx-auto mb-4 animate-spin" />
                        <h2 className="text-xl font-black text-gray-800">Confirmando tu correo...</h2>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-black text-[#004d4d]">¡Cuenta activada!</h2>
                        <p className="text-gray-400 mt-2 text-sm">{message}</p>
                        <p className="text-gray-300 mt-1 text-xs">Redirigiendo al login...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle size={48} className="text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-black text-gray-800">Enlace inválido</h2>
                        <p className="text-gray-400 mt-2 text-sm">{message}</p>
                        <Link
                            href="/register"
                            className="inline-block mt-6 px-8 py-3 bg-[#001A1A] text-white rounded-2xl font-black text-xs uppercase tracking-widest"
                        >
                            Volver al registro
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
