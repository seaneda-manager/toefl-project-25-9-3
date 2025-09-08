// apps/web/lib/supabaseServer.ts
import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * 서버 컴포넌트/SSR에서 사용하는 Supabase 클라이언트.
 * Next.js 14 RSC 정책상 cookies().set/remove 는 Server Action/Route Handler 밖에서 금지이므로
 * 여기서는 set/remove 를 no-op 으로 둡니다(읽기 전용).
 */
export function getSupabaseServer() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // RSC에서는 금지 → no-op
        set(_name: string, _value: string, _options: CookieOptions) {},
        remove(_name: string, _options: CookieOptions) {},
      },
    }
  );
}

/**
 * (선택) Server Action 또는 Route Handler 안에서만 쓸 버전이 필요하면
 * 아래 유틸을 사용하세요. 그 컨텍스트에선 set/remove 허용됨.
 *
 * 예)
 * export function getSupabaseForAction(c: {
 *   get(name: string): string | undefined;
 *   set(name: string, value: string, options: CookieOptions): void;
 *   remove(name: string, options: CookieOptions): void;
 * }) {
 *   return createServerClient(
 *     process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 *     { cookies: c }
 *   );
 * }
 */
