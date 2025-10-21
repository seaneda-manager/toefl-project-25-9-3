// apps/web/lib/authServer.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export type UserRole = 'student' | 'teacher' | 'admin';

export async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set() {}, remove() {},
      }
    }
  );
}

export async function getSessionAndRole() {
  const supabase = await getSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  const role = (session?.user?.user_metadata?.role ?? 'student') as UserRole;
  return { session, role, supabase };
}
