"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function AuthCallback() {
    const router = useRouter();
    const { login } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            let access_token: string | null = null;

            // Flujo PKCE (Supabase SDK v2 por defecto): ?code=xxx en query params
            const code = new URLSearchParams(window.location.search).get('code');
            if (code) {
                const supabase = getSupabaseClient();
                if (!supabase) { router.push('/login?error=google_failed'); return; }
                const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                if (error || !data.session) { router.push('/login?error=google_failed'); return; }
                access_token = data.session.access_token;
            }

            // Flujo implícito (fallback): #access_token=xxx en el hash
            if (!access_token) {
                const hash = window.location.hash;
                if (hash) {
                    const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
                    access_token = hashParams.get('access_token');
                }
            }

            if (!access_token) { router.push('/login'); return; }

            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiBase}/auth/google`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ access_token }),
                });
                const data = await res.json();
                if (!data.access_token || !data.user) throw new Error('invalid');
                const u = data.user;
                login(
                    data.access_token, u.email, u.role, u.permissions, u.plan,
                    u.is_global_staff, u.shop_slug, u.full_name, u.logo_url, '', '',
                    u.onboarding_completed,
                );
                if (u.is_global_staff) router.push('/dashboard/super-admin');
                else if (!u.onboarding_completed) router.push('/onboarding');
                else router.push('/dashboard');
            } catch {
                router.push('/login?error=google_failed');
            }
        };

        handleCallback();
    }, [login, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
            <div className="text-2xl font-black text-[#004d4d] animate-pulse tracking-tighter italic">BAYUP</div>
        </div>
    );
}
