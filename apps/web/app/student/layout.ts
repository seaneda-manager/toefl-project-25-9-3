import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabaseServer';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');
  if (user.user_metadata?.role !== 'student') redirect('/teacher/dashboard');

  return <>{children}</>;
}
