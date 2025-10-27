// apps/web/lib/supabaseServer.ts
'use server';

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * SSR / Route Handler / Server Component 怨듭슜 Supabase ?대씪?댁뼵??
 * - ?쇰? 踰꾩쟾/而⑦뀓?ㅽ듃?먯꽑 cookies()媛 Promise瑜?諛섑솚?섎?濡?await ?꾩슂
 */
export async function getSupabaseServer(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      'Supabase env is missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  // ???꾩옱 ????뺤쓽??留욎떠 await
  const cookieStore = await cookies();

  const supabase = createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          // Route Handler?먯꽑 mutable, RSC?먯꽑 臾댁떆
         
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




