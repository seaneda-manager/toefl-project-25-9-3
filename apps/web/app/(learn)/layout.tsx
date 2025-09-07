// apps/web/app/(learn)/layout.tsx
import type { ReactNode } from 'react';
import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabaseServer';

export default async function LearnRoot({ children }: { children: ReactNode }) {
  const supabase = getSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-800 antialiased">
        <div className="border-b bg-white">
          <div className="mx-auto max-w-6xl h-14 px-4 flex items-center justify-between">
            {/* 브랜드/로고: Home 대신 Programs로 연결 */}
            <Link href="/programs" className="font-semibold">Pier Learn</Link>

            <nav className="text-sm flex gap-3">
              {/* 로그인 전: Programs, Contact만 */}
              <Link href="/programs">Programs</Link>
              <Link href="/contact">Contact</Link>

              {/* 로그인 시: 학습 탭 추가 노출 */}
              {session && (
                <>
                  <span className="text-gray-300">|</span>
                  <Link href="/learn/toefl/dashboard">Dashboard</Link>
                  <Link href="/learn/toefl/study">Study</Link>
                  <Link href="/learn/toefl/tests">Tests</Link>
                  <Link href="/learn/toefl/progress">Progress</Link>
                </>
              )}
            </nav>
          </div>
        </div>

        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
