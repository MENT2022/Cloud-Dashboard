
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  typescript: {
    // ignoreBuildErrors: true, // Removed to enforce stricter type checking
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/page',
        destination: '/',
        permanent: false, 
      },
      { 
        source: '/login',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
