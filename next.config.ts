import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimización de imágenes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'docs.google.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },

  // Optimizaciones experimentales
  experimental: {
    // Optimizar paquetes grandes
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },

  // Headers de seguridad y cache
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
        ],
      },
    ];
  },

  // Desactivar powered by header
  poweredByHeader: false,

  // Comprimir respuestas
  compress: true,
};

export default nextConfig;
