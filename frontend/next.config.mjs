/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    APP_VERSION: '2.0.1-clean-db', // Incremento de versión para forzar rebuild limpio
  },
  compress: true, // Activa la compresión Gzip/Brotli
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jtctgahddafohgskgxha.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;