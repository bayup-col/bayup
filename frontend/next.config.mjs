/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! ADVERTENCIA !!
    // Esto permite que el despliegue continúe a pesar de errores de tipos.
    // Es útil para desarrollo rápido, pero se deben corregir los errores luego.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;