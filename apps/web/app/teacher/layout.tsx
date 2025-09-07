import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabaseServer';

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');
  if (user.user_metadata?.role !== 'teacher') redirect('/student/home');

  return <>{children}</>;
}
