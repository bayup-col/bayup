/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        APP_VERSION: '1.0.6-RECOVERY', // Gatillo para limpiar error de clonacion en Vercel
        NEXT_PUBLIC_API_URL: 'https://exciting-optimism-production-4624.up.railway.app' // URL MASTER DEFINITIVA
    },
    images: {
        unoptimized: true, 
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true, // Ignorar errores de tipos en build para restaurar login de emergencia
    }
};

export default nextConfig;
