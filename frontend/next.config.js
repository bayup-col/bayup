/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow Framer component imports from external CDN
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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://framer.com https://*.framer.com https://*.framerusercontent.com",
              "connect-src 'self' https://framer.com https://*.framer.com https://*.framerusercontent.com http://localhost:8000 http://localhost:8001",
              "img-src 'self' data: blob: https://*.framerusercontent.com https://framer.com https://images.unsplash.com https://*.unsplash.com http://localhost:8001",
              "media-src 'self' blob: http://localhost:8001",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "frame-src 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
