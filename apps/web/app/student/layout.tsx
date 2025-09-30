// apps/web/app/student/layout.tsx
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabaseServer';

// 荑좏궎/?몄뀡 ?섏〈?대씪 ?숈쟻 泥섎━ ?쒖떆(沅뚯옣)
export const dynamic = 'force-dynamic';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // role???ㅼ젙??寃쎌슦?먮쭔 援먯감-由щ떎?대젆??
  const role = user.user_metadata?.role as string | undefined;
  if (role && role !== 'student') {
    redirect('/teacher/dashboard');
  }

  return <>{children}</>;
}

