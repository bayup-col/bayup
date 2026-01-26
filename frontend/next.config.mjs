/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Eliminamos el polling de webpack que ralentiza el modo local en Windows
};

export default nextConfig;