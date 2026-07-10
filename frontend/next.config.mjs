import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        APP_VERSION: '1.0.7-FIX-NET',
    },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '**' },
            { protocol: 'http', hostname: '**' },
        ],
    },
    eslint: {
        ignoreDuringBuilds: false,
    },
    typescript: {
        ignoreBuildErrors: false,
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.experiments = {
                ...config.experiments,
                layers: true,
            };
        }
        return config;
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://framer.com https://*.framer.com https://*.framerusercontent.com https://checkout.wompi.co https://*.wompi.co",
                            "connect-src 'self' https://api.bayup.com.co https://*.bayup.com.co https://framer.com https://*.framer.com https://*.framerusercontent.com https://*.sentry.io https://*.supabase.co wss://*.supabase.co http://localhost:8000 http://localhost:8001 https://*.onrender.com https://*.wompi.co",
                            "img-src 'self' data: blob: https: http://localhost:8001",
                            "style-src 'self' 'unsafe-inline'",
                            "font-src 'self' data: https://fonts.gstatic.com",
                            "frame-src 'self' https://checkout.wompi.co https://*.wompi.co",
                        ].join('; '),
                    },
                ],
            },
        ];
    },
};

const sentryConfig = withSentryConfig(nextConfig, {
    silent: true,
    hideSourceMaps: true,
    disableLogger: true,
    tunnelRoute: undefined,
});

// TypeScript y ESLint activos en CI — 0 errores verificados al activar

export default sentryConfig;
