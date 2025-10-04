import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['xlsx', 'sharp', 'puppeteer-core', '@prisma/client', 'prisma'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // تقليل حجم الـbundle للـserver
      config.externals = [...(config.externals || []), 
        'puppeteer', 
        'puppeteer-core', 
        'chrome-aws-lambda',
        '@prisma/client',
        'prisma'
      ];
    }
    
    // إضافة fallbacks للـNode.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'docs.google.com',
      },
      {
        protocol: 'https',
        hostname: 'images.weserv.nl',
      },
      {
        protocol: 'https',
        hostname: 'wsrv.nl',
      },
    ],
    unoptimized: true,
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production-2024",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "your-nextauth-secret-key-2024",
  },
};

export default nextConfig;
