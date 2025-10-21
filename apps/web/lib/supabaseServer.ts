// apps/web/lib/supabaseServer.ts
'use server';

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * SSR / Route Handler / Server Component 공용 Supabase 클라이언트
 * - 일부 버전/컨텍스트에선 cookies()가 Promise를 반환하므로 await 필요
 */
export async function getSupabaseServer(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      'Supabase env is missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  // ✅ 현재 타입 정의에 맞춰 await
  const cookieStore = await cookies();

  const supabase = createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          // Route Handler에선 mutable, RSC에선 무시
         
          cookieStore.set({ name, value, ...options });
        } catch {
          /* noop */
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
         
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        } catch {
          /* noop */
        }
      },
    },
  });

  return supabase;
}
