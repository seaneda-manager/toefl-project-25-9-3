// apps/web/app/(protected)/layout.tsx  (예시 경로 — 실제 파일 경로 유지)
import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabaseServer';
import TopbarClient from '@/components/dashboard/TopbarClient';
import SidebarClient from '@/components/dashboard/SidebarClient';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const supabase = await getSupabaseServer();

  // 세션 확인 (없으면 로그인으로)
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  // 유저 정보
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? '';

  // TODO: profiles.role 등에서 역할을 읽어오도록 개선. 현재는 기본 student로 고정.
  const role: 'student' | 'teacher' = 'student';

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr] bg-neutral-50 text-neutral-900">
      <div className="border-b bg-white">
        <TopbarClient email={email} />
      </div>
      <div className="grid grid-cols-[240px_1fr]">
        <aside className="border-r bg-white">
          <SidebarClient role={role} />
        </aside>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
