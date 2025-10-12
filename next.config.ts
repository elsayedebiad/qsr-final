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
              script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:
                https://www.googletagmanager.com 
                https://tagmanager.google.com 
                https://www.google-analytics.com 
                https://ssl.google-analytics.com 
                https://analytics.google.com 
                https://www.google.com
                https://google.com
                https://*.google.com
                https://www.clarity.ms
                https://*.clarity.ms
                https://www.googleadservices.com
                https://*.googleadservices.com
                https://googleads.g.doubleclick.net
                https://*.doubleclick.net
                https://connect.facebook.net 
                https://www.facebook.com;
              script-src-elem 'self' 'unsafe-inline' blob:
                https://www.googletagmanager.com 
                https://tagmanager.google.com 
                https://www.google-analytics.com 
                https://ssl.google-analytics.com 
                https://analytics.google.com
                https://www.google.com
                https://google.com
                https://*.google.com
                https://www.clarity.ms
                https://*.clarity.ms
                https://www.googleadservices.com
                https://*.googleadservices.com
                https://googleads.g.doubleclick.net
                https://*.doubleclick.net;
              connect-src 'self' 
                https://www.google-analytics.com 
                https://analytics.google.com 
                https://stats.g.doubleclick.net 
                https://www.googletagmanager.com 
                https://tagmanager.google.com 
                https://region1.google-analytics.com 
                https://region1.analytics.google.com 
                https://*.analytics.google.com 
                https://*.googletagmanager.com
                https://www.google.com
                https://google.com
                https://*.google.com
                https://www.clarity.ms
                https://*.clarity.ms
                https://www.googleadservices.com
                https://*.googleadservices.com
                https://googleads.g.doubleclick.net
                https://*.doubleclick.net
                https://www.youtube.com 
                https://youtube.com 
                https://*.youtube.com 
                https://player.vimeo.com 
                https://vimeo.com 
                https://*.vimeo.com 
                https://drive.google.com 
                https://docs.google.com 
                https://*.googleapis.com 
                https://*.googleusercontent.com 
                https://onedrive.live.com 
                https://*.onedrive.live.com 
                https://1drv.ms 
                https://*.sharepoint.com 
                https://view.officeapps.live.com 
                https://office.live.com 
                https://*.office.com;
              img-src 'self' data: blob: https: http: 
                https://www.google-analytics.com 
                https://ssl.google-analytics.com 
                https://www.googletagmanager.com 
                https://analytics.google.com 
                https://stats.g.doubleclick.net 
                https://www.google.com 
                https://google.com 
                https://*.google-analytics.com 
                https://*.googletagmanager.com 
                https://www.clarity.ms
                https://*.clarity.ms
                https://www.googleadservices.com
                https://*.googleadservices.com
                https://googleads.g.doubleclick.net
                https://*.doubleclick.net
                https://drive.google.com 
                https://lh3.googleusercontent.com 
                https://*.googleusercontent.com 
                https://docs.google.com 
                https://images.weserv.nl 
                https://wsrv.nl;
              style-src 'self' 'unsafe-inline' 
                https://fonts.googleapis.com 
                https://www.googletagmanager.com 
                https://tagmanager.google.com;
              font-src 'self' 
                https://fonts.gstatic.com 
                https://fonts.googleapis.com;
              media-src 'self' data: blob: https: http: 
                https://www.youtube.com 
                https://youtube.com 
                https://*.youtube.com 
                https://player.vimeo.com 
                https://vimeo.com 
                https://*.vimeo.com 
                https://drive.google.com 
                https://docs.google.com 
                https://*.google.com 
                https://*.googleapis.com 
                https://*.googleusercontent.com 
                https://onedrive.live.com 
                https://*.onedrive.live.com 
                https://1drv.ms 
                https://*.sharepoint.com 
                https://view.officeapps.live.com 
                https://office.live.com 
                https://*.office.com;
              frame-src 'self' 
                https://www.googletagmanager.com 
                https://tagmanager.google.com 
                https://analytics.google.com 
                https://www.google-analytics.com
                https://www.googleadservices.com
                https://*.googleadservices.com
                https://googleads.g.doubleclick.net
                https://*.doubleclick.net
                https://www.youtube.com 
                https://youtube.com 
                https://player.vimeo.com 
                https://vimeo.com 
                https://drive.google.com 
                https://docs.google.com 
                https://*.google.com 
                https://*.googleapis.com 
                https://*.googleusercontent.com 
                https://onedrive.live.com 
                https://*.onedrive.live.com 
                https://1drv.ms 
                https://*.sharepoint.com 
                https://view.officeapps.live.com 
                https://office.live.com 
                https://*.office.com 
                data: blob:;
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'self' https://*.google.com https://*.office.com https://onedrive.live.com;
              upgrade-insecure-requests;
            `.replace(/\s{2,}/g, ' ').trim()
          }
        ]
      }
    ]
  },
  experimental: {},
  serverExternalPackages: ['xlsx', 'sharp', 'puppeteer-core', '@prisma/client', 'prisma'],
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
