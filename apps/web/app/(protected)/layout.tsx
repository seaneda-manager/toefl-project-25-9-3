// apps/web/app/(protected)/layout.tsx
import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabaseServer';
import TopbarClient from '@/components/dashboard/TopbarClient';
import SidebarClient from '@/components/dashboard/SidebarClient';

type Role = 'student' | 'teacher' | 'admin';

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

  // 🔹 profiles.role에서 역할 가져오기 (없으면 student)
  let role: Role = 'student';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role === 'admin' || profile?.role === 'teacher' || profile?.role === 'student') {
      role = profile.role;
    }
  }

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr] bg-neutral-50 text-neutral-900">
      <TopbarClient email={email} />
      <div className="grid grid-cols-[auto_1fr]">
        <aside>
          <SidebarClient role={role} />
        </aside>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
