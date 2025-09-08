// apps/web/lib/supabaseServer.ts
import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export function getSupabaseServer() {
  const cookieStore = cookies();

  // ⚠️ RSC에서는 cookies().set 호출이 금지 → set/remove는 no-op 처리
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(_name: string, _value: string, _options: CookieOptions) {
          // no-op in RSC to avoid "Cookies can only be modified..." error
        },
        remove(_name: string, _options: CookieOptions) {
          // no-op in RSC
        },
      },
    }
  );
}

/**
 * 추후 Server Action / Route Handler에서만 쓰는 변형 (필요해질 때 도입)
 * 거기서는 cookies().set 허용되므로 set/remove 구현 가능
 */
