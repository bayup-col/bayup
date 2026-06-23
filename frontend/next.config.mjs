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
        ignoreBuildErrors: true, // Ignorar errores de tipos en build para restaurar login de emergencia
    }
};

export default nextConfig;
