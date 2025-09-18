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
            {/* 釉뚮옖??濡쒓퀬: Home ???Programs濡??곌껐 */}
            <Link href="/programs" className="font-semibold">Pier Learn</Link>

            <nav className="text-sm flex gap-3">
              {/* 濡쒓렇???? Programs, Contact留?*/}
              <Link href="/programs">Programs</Link>
              <Link href="/contact">Contact</Link>

              {/* 濡쒓렇???? ?숈뒿 ??異붽? ?몄텧 */}
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
