import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    // 모노?�포�??�키지 경로??추�?
    '../../packages/**/*.{ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
