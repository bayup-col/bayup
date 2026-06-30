"use client";

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';

function getApiBase() {
    const isLocal = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    return isLocal ? 'http://localhost:8000' : (process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co');
}

export default function ConfirmEmailPage() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [resendEmail, setResendEmail] = useState('');
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

    useEffect(() => {
        const token = new URLSearchParams(window.location.search).get('token');
        if (!token) {
            setStatus('error');
            setMessage('Enlace de confirmación inválido o no encontrado.');
            return;
        }

        fetch(`${getApiBase()}/auth/confirm-email?token=${encodeURIComponent(token)}`)
            .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (res.ok) {
                    setStatus('success');
                    setMessage(data.message || '¡Correo confirmado! Ya puedes iniciar sesión.');
                } else {
                    setStatus('error');
                    setMessage(data.detail || 'El enlace es inválido o ya expiró.');
                }
            })
            .catch(() => {
                setStatus('error');
                setMessage('No se pudo conectar al servidor. Intenta de nuevo.');
            });
    }, []);

    const handleResend = async () => {
        if (!resendEmail) return;
        setResendStatus('sending');
        try {
            const res = await fetch(`${getApiBase()}/auth/resend-confirmation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resendEmail }),
            });
            setResendStatus(res.ok ? 'sent' : 'error');
        } catch {
            setResendStatus('error');
        }
    };

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
                        <p className="text-gray-400 mt-2 text-sm">Correo confirmado. Ya puedes iniciar sesión.</p>
                        <Link
                            href="/login"
                            className="inline-block mt-6 px-8 py-3 bg-[#001A1A] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-80 transition-opacity"
                        >
                            Ir a mi tienda
                        </Link>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle size={48} className="text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-black text-gray-800">Enlace inválido</h2>
                        <p className="text-gray-400 mt-2 text-sm">{message}</p>

                        <div className="mt-8 text-left">
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">
                                ¿Necesitas un nuevo enlace?
                            </p>
                            {resendStatus === 'sent' ? (
                                <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold justify-center">
                                    <Mail size={16} />
                                    Enlace enviado — revisa tu bandeja de entrada
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        placeholder="tu@correo.com"
                                        value={resendEmail}
                                        onChange={(e) => setResendEmail(e.target.value)}
                                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#004d4d]"
                                    />
                                    <button
                                        onClick={handleResend}
                                        disabled={resendStatus === 'sending' || !resendEmail}
                                        className="px-4 py-2 bg-[#004d4d] text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
                                    >
                                        {resendStatus === 'sending' ? '...' : 'Reenviar'}
                                    </button>
                                </div>
                            )}
                            {resendStatus === 'error' && (
                                <p className="text-red-400 text-xs mt-2">No se pudo enviar. Intenta de nuevo.</p>
                            )}
                        </div>

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
