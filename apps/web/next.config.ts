import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@gympro/shared', '@gympro/database'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
