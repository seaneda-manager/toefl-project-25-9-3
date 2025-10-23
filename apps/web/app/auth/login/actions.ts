// normalized utf8
// apps/web/app/auth/login/actions.ts
'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type SignInArgs = { email: string; password: string };

function getSupabaseForAction() {
  // ?�버 ?�션?�서??cookies()가 ?�기 가?�해????
  return cookies().then((cookieStore) =>
    createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try { cookieStore.set({ name, value, ...options }); } catch {}
          },
          remove(name: string, options: any) {
            try { cookieStore.set({ name, value: '', ...options, maxAge: 0 }); } catch {}
          },
        },
      }
    )
  );
}

export async function signInWithPasswordAction({ email, password }: SignInArgs) {
  const supabase = await getSupabaseForAction(); // ??await
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function signOutAction() {
  const supabase = await getSupabaseForAction(); // ??await
  await supabase.auth.signOut();
  return { ok: true as const };
}
