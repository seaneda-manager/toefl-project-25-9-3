// apps/web/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css'; // 있으면 유지
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'TOEFL App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50">
        <SiteHeader />
        <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
