/* apps/web/app/home/page.tsx */
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

type Role = 'student' | 'teacher' | 'admin';

function normalizeRole(raw: unknown): Role {
  const v = String(raw ?? '').trim().toLowerCase();
  if (v === 'teacher' || v === 'admin' || v === 'student') return v;
  return 'student';
}

function roleHome(role: Role) {
  switch (role) {
    case 'teacher': return '/home/teacher';
    case 'admin':   return '/home/admin';
    case 'student':
    default:        return '/home/student';
  }
}

export default async function HomeEntry() {
  // ✅ 현재 환경에선 cookies()가 Promise이므로 await 필요
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // 서버 컴포넌트에선 쿠키 갱신이 안 되므로 no-op 유지
        set() {},
        remove() {},
      },
    }
  );

  // 세션 확인
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login?next=/home');
  }

  // 최신 유저 메타 조회
  const { data: userData } = await supabase.auth.getUser();

  const role = normalizeRole(
    userData?.user?.user_metadata?.role ?? session.user.user_metadata?.role
  );

  redirect(roleHome(role));
}
