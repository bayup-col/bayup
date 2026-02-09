/** @type {import('next').NextConfig} */
const nextConfig = {
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