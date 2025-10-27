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
  // ???꾩옱 ?섍꼍?먯꽑 cookies()媛 Promise?대?濡?await ?꾩슂
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // ?쒕쾭 而댄룷?뚰듃?먯꽑 荑좏궎 媛깆떊?????섎?濡?no-op ?좎?
        set() {},
        remove() {},
      },
    }
  );

  // ?몄뀡 ?뺤씤
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login?next=/home');
  }

  // 理쒖떊 ?좎? 硫뷀? 議고쉶
  const { data: userData } = await supabase.auth.getUser();

  const role = normalizeRole(
    userData?.user?.user_metadata?.role ?? session.user.user_metadata?.role
  );

  redirect(roleHome(role));
}




