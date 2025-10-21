// apps/web/app/student/layout.tsx
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServer(); // ??await

  const { data: { user }, error: uerr } = await supabase.auth.getUser();
  if (uerr) redirect('/auth/login');
  if (!user) redirect('/auth/login');

  // ?„ë¡œ?„ì—??role ?°ì„ , ?†ìœ¼ë©?user_metadata.role ?¬ìš©
  const { data: prof } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle<{ role: 'student' | 'teacher' | 'admin' }>();

  const role = (prof?.role ?? (user.user_metadata?.role as string | undefined)) || 'student';

  // ?™ìƒ ?„ìš© ?ˆì´?„ì›ƒ: êµì‚¬/ê´€ë¦¬ì???¤ë¥¸ ?€?œë³´?œë¡œ ë³´ëƒ„
  if (role === 'teacher' || role === 'admin') {
    redirect('/teacher/dashboard'); // ?„ìš”?˜ë©´ admin?€ '/admin'?¼ë¡œ ë¶„ê¸°
  }

  return <>{children}</>;
}
