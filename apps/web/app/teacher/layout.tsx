// apps/web/app/teacher/layout.tsx
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabaseServer';

// 레이아웃은 항상 사용자 쿠키를 보고 동적으로 렌더링되어야 함
export const dynamic = 'force-dynamic';

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  // ✅ 개발 중 레거시 테스트 우회 (env로 on/off)
  if (process.env.NEXT_PUBLIC_LEGACY_ALLOW === '1') {
    return <>{children}</>;
  }

  const supabase = createSupabaseServer();

  // 1) 로그인 여부 확인
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  // 2) 권한(역할) 확인
  // app_metadata 우선, 없으면 user_metadata 백업
  const role =
    (user.app_metadata as any)?.role ??
    (user.user_metadata as any)?.role;

  // 관리자도 허용하고 싶으면 ['teacher','admin']로
  if (!role || !['teacher', 'admin'].includes(role)) {
    redirect('/student/home');
  }

  return <>{children}</>;
}
