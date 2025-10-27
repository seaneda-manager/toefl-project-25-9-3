// normalized utf8
import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    // 紐⑤끂?占쏀룷占??占쏀궎吏 寃쎈줈??異뷂옙?
    '../../packages/**/*.{ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;


