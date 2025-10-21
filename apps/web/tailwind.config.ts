/* apps/web/tailwind.config.ts */
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f7ff',
          100: '#e6efff',
          200: '#cfe1ff',
          300: '#a9c8ff',
          400: '#7aa8ff',
          500: '#4a87ff',
          600: '#2f6df2',
          700: '#2357c6',
          800: '#1d479f',
          900: '#1a3d83',
        },
      },
      fontFamily: {
        ui: ['Inter', 'Pretendard', 'system-ui', 'Apple SD Gothic Neo', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        soft: '0 6px 20px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;

