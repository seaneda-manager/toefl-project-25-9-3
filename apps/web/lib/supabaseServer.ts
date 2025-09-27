// apps/web/lib/supabaseServer.ts
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * 서버 컴포넌트/서버 액션/라우트 핸들러에서 사용할 Supabase 클라이언트
 * - 쿠키를 Next.js cookies()와 연동
 * - 공개키(NEXT_PUBLIC_*) 사용 (SSR 권장 패턴)
 */
export function getSupabaseServer() {
  const cookieStore = cookies();

  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        // Server Component처럼 read-only 컨텍스트일 수 있으므로 가드
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // no-op (read-only 환경)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        } catch {
          // no-op (read-only 환경)
        }
      },
    },
  });
}

/** 기존 코드 호환용 별칭 */
export { getSupabaseServer as createSupabaseServer };
