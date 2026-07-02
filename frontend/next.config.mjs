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
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    }
};

const sentryConfig = withSentryConfig(nextConfig, {
    silent: true,
    hideSourceMaps: true,
    disableLogger: true,
    tunnelRoute: undefined,
});

// Re-aplicar explícitamente después del wrap de Sentry para que no los sobreescriba
sentryConfig.eslint = { ignoreDuringBuilds: true };
sentryConfig.typescript = { ignoreBuildErrors: true };

export default sentryConfig;
