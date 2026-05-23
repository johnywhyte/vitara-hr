import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      // Allow server actions from any origin that matches the deployment host.
      // Restricting to localhost:3000 blocks all production requests.
      allowedOrigins: process.env.NEXT_PUBLIC_APP_URL
        ? [
            'localhost:3000',
            new URL(process.env.NEXT_PUBLIC_APP_URL).host,
          ]
        : ['localhost:3000'],
    },
  },
};

export default nextConfig;
