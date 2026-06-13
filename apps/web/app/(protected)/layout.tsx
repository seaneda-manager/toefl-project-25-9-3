// apps/web/app/(protected)/layout.tsx
import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabaseServer';
import TopbarClient from '@/components/dashboard/TopbarClient';
import SidebarClient from '@/components/dashboard/SidebarClient';
import SidebarProfile from '@/components/dashboard/SidebarProfile';
import MobileLexioxTabBar from '@/components/dashboard/MobileLexioxTabBar';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import { LangProvider } from '@/contexts/LangContext';

type Role = 'student' | 'teacher' | 'admin';
type Program = 'gap' | 'toefl' | 'lexiox' | null;

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
  let avatarUrl: string | null = null;
  let fullName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, program, full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role === 'admin' || profile?.role === 'teacher' || profile?.role === 'student') {
      role = profile.role;
    }
    if (profile?.program === 'gap' || profile?.program === 'toefl' || profile?.program === 'lexiox') {
      program = profile.program;
    }
    avatarUrl  = profile?.avatar_url  ?? null;
    fullName   = profile?.full_name   ?? null;
  }

  const showMobileTabBar = role === 'student' && program === 'lexiox';

  return (
    <LangProvider>
      <div className="h-screen overflow-hidden grid grid-rows-[auto_1fr] bg-neutral-50 text-neutral-900">
        <div>
          <TopbarClient email={email} role={role} />
        </div>
        <div className="grid grid-cols-[auto_1fr] min-h-0">
          <aside className="hidden md:flex md:flex-col h-full min-h-0 border-r border-neutral-100">
            <div className="flex-1 min-h-0 overflow-hidden">
              <SidebarClient role={role} program={program} />
            </div>
            <div className="shrink-0">
              <SidebarProfile name={fullName ?? email} avatarUrl={avatarUrl} />
            </div>
          </aside>
          <main className={[
            'min-h-0 overflow-y-auto p-4 md:p-6',
            showMobileTabBar ? 'pb-20 md:pb-6' : '',
          ].join(' ')}>
            {children}
          </main>
        </div>
        {showMobileTabBar && <MobileLexioxTabBar />}
        <PWAInstallBanner />
      </div>
    </LangProvider>
  );
}
