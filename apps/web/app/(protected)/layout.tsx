// apps/web/app/(protected)/layout.tsx
import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabaseServer';
import TopbarClient from '@/components/dashboard/TopbarClient';
import SidebarClient from '@/components/dashboard/SidebarClient';
import { LangProvider } from '@/contexts/LangContext';

type Role = 'student' | 'teacher' | 'admin';
type Program = 'gap' | 'toefl' | 'lingx' | null;

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const supabase = await getSupabaseServer();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? '';

  // 🔹 profiles.role + program에서 역할/프로그램 가져오기
  let role: Role = 'student';
  let program: Program = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, program')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role === 'admin' || profile?.role === 'teacher' || profile?.role === 'student') {
      role = profile.role;
    }
    if (profile?.program === 'gap' || profile?.program === 'toefl' || profile?.program === 'lingx') {
      program = profile.program;
    }
  }

  return (
    <LangProvider>
      <div className="h-screen overflow-hidden grid grid-rows-[auto_1fr] bg-neutral-50 text-neutral-900">
        <TopbarClient email={email} role={role} />
        <div className="grid grid-cols-[auto_1fr] min-h-0">
          <aside className="h-full overflow-y-auto">
            <SidebarClient role={role} program={program} />
          </aside>
          <main className="min-h-0 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </LangProvider>
  );
}
