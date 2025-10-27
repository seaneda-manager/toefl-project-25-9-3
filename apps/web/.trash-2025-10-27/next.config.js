// apps/web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // reactStrictMode: true,

  async redirects() {
    // 1) 인벤토리 기반 자동 생성 결과를 여기에 붙여넣기
    //    (예시: runner 중복 경로를 /reading/test로 통일)
    const redirects = [
      // 예시들 — 스캔 결과로 교체
      { source: '/reading/test-v2', destination: '/reading/test', permanent: false },
      { source: '/dev/reading-test', destination: '/reading/test', permanent: false },
      { source: '/reading/session/:sid/p/:pid', destination: '/reading/test', permanent: false },
      // 더 있으면 계속 추가
    ];

    return redirects;
  },

  // rewrites는 이번 목적에선 불필요 — URL을 바꾸지 않으니 중복 정리에 도움 X
  // async rewrites() { return []; },
};

module.exports = nextConfig;
