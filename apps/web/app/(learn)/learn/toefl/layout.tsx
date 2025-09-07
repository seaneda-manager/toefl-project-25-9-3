// apps/web/app/(learn)/learn/toefl/layout.tsx
import type { ReactNode } from 'react';
import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabaseServer';

export default async function TOEFLLayout({ children }: { children: ReactNode }) {
  const supabase = getSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">TOEFL</h1>
        <Link href="/programs/toefl" className="text-sm underline">프로그램 소개</Link>
      </header>

      {/* 로그인 상태에서만 학습 탭 노출 */}
      {session && (
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link href="/learn/toefl/dashboard" className="rounded-lg border px-3 py-1.5 hover:bg-gray-100">Dashboard</Link>
          <Link href="/learn/toefl/study"     className="rounded-lg border px-3 py-1.5 hover:bg-gray-100">Study</Link>
          <Link href="/learn/toefl/tests"     className="rounded-lg border px-3 py-1.5 hover:bg-gray-100">Tests</Link>
          <Link href="/learn/toefl/progress"  className="rounded-lg border px-3 py-1.5 hover:bg-gray-100">Progress</Link>
        </nav>
      )}

      <section>{children}</section>
    </div>
  );
}
