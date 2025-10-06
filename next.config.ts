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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com https://tagmanager.google.com;
              connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://www.googletagmanager.com;
              img-src 'self' data: blob: https: http: https://www.google-analytics.com https://ssl.google-analytics.com https://www.googletagmanager.com https://drive.google.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://docs.google.com https://images.weserv.nl https://wsrv.nl;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.googletagmanager.com;
              font-src 'self' https://fonts.gstatic.com;
              frame-src 'self' https://www.googletagmanager.com;
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'none';
            `.replace(/\s{2,}/g, ' ').trim()
          }
        ]
      }
    ]
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
