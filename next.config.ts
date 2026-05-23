import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // 生产环境优化
  compress: true,
  poweredByHeader: false,

  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 实验性功能
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Turbopack 配置（Next.js 16+）
  turbopack: {},

  // 环境变量
  env: {
    NEXT_PUBLIC_APP_NAME: 'AI Company Builder',
    NEXT_PUBLIC_APP_VERSION: '0.3.0',
  },
};

export default nextConfig;
