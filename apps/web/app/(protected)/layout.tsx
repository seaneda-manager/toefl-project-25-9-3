// apps/web/app/(protected)/layout.tsx
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const supabase = getSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  return <>{children}</>;
}
