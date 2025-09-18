// apps/web/lib/supabaseServer.ts
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * 서버 컴포넌트/서버 액션에서 사용할 Supabase 클라이언트
 * - 쿠키를 Next.js 서버 cookies()로 연동
 * - 공개키(NEXT_PUBLIC_*) 사용 (SSR 권장 패턴)
 */
export function getSupabaseServer() {
  const cookieStore = cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        // 확실한 제거를 위해 maxAge: 0
        cookieStore.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  });
}

/**
 * 기존 코드 호환용 별칭
 * - layout.tsx 등에서 createSupabaseServer()를 호출해도 동작하도록
 */
export { getSupabaseServer as createSupabaseServer };
