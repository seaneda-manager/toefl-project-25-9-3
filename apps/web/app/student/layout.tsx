// apps/web/app/student/layout.tsx
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabaseServer';

// 쿠키/세션 의존이라 동적 처리 표시(권장)
export const dynamic = 'force-dynamic';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // role이 설정된 경우에만 교차-리다이렉트
  const role = user.user_metadata?.role as string | undefined;
  if (role && role !== 'student') {
    redirect('/teacher/dashboard');
  }

  return <>{children}</>;
}
