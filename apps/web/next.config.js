// apps/web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 필요시 다른 설정도 여기서 함께 관리하세요.
  // reactStrictMode: true,

  async rewrites() {
    return [
      // /(protected) → /
      { source: '/(protected)', destination: '/' },
      // /(protected)/** → /**
      { source: '/(protected)/:path*', destination: '/:path*' },
    ];
  },
};

module.exports = nextConfig;
