// apps/web/app/(protected)/layout.tsx  (?덉떆 寃쎈줈 ???ㅼ젣 ?뚯씪 寃쎈줈 ?좎?)
import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabaseServer';
import TopbarClient from '@/components/dashboard/TopbarClient';
import SidebarClient from '@/components/dashboard/SidebarClient';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const supabase = await getSupabaseServer();

  // ?몄뀡 ?뺤씤 (?놁쑝硫?濡쒓렇?몄쑝濡?
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  // ?좎? ?뺣낫
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? '';

  // TODO: profiles.role ?깆뿉????븷???쎌뼱?ㅻ룄濡?媛쒖꽑. ?꾩옱??湲곕낯 student濡?怨좎젙.
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




