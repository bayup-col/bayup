"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function AuthCallback() {
    const router = useRouter();
    const { login } = useAuth();

    useEffect(() => {
        const hash = window.location.hash;
        if (!hash) { router.push('/login'); return; }

        const params = new URLSearchParams(hash.replace(/^#/, ''));
        const access_token = params.get('access_token');

        if (!access_token) { router.push('/login'); return; }

        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        fetch(`${apiBase}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token }),
        })
            .then(r => r.json())
            .then(data => {
                if (!data.access_token || !data.user) throw new Error('invalid');
                const u = data.user;
                login(
                    data.access_token,
                    u.email,
                    u.role,
                    u.permissions,
                    u.plan,
                    u.is_global_staff,
                    u.shop_slug,
                    u.full_name,
                    u.logo_url,
                    '',
                    '',
                    u.onboarding_completed,
                );
                if (u.is_global_staff) router.push('/dashboard/super-admin');
                else if (!u.onboarding_completed) router.push('/onboarding');
                else router.push('/dashboard');
            })
            .catch(() => router.push('/login?error=google_failed'));
    }, [login, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
            <div className="text-2xl font-black text-[#004d4d] animate-pulse tracking-tighter italic">BAYUP</div>
        </div>
    );
}
