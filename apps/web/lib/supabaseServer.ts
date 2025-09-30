// apps/web/lib/supabaseServer.ts
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`[supabaseServer] Missing env: ${name}. Check your .env* files.`);
  }
  return v;
}

const SUPABASE_URL = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const isProd = process.env.NODE_ENV === 'production';

/** 공통 쿠키 옵션(보안 기본값) */
function hardenCookieOptions(opts?: CookieOptions): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,                 // prod에서만 secure 필수
    sameSite: 'lax',
    path: '/',
    ...opts,
  };
}

/**
 * 서버 컴포넌트/서버 액션/라우트 핸들러에서 사용할 Supabase 클라이언트
 * - Next.js cookies()와 연동
 * - 공개키(NEXT_PUBLIC_*) 사용 (SSR + RLS 권장)
 */
export function getSupabaseServer() {
  const cookieStore = cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        // Server Component처럼 read-only 컨텍스트일 수 있으므로 가드
        try {
          cookieStore.set({ name, value, ...hardenCookieOptions(options) });
        } catch {
          // no-op (read-only 환경)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({
            name,
            value: '',
            ...hardenCookieOptions({ ...options, maxAge: 0, expires: new Date(0) }),
          });
        } catch {
          // no-op (read-only 환경)
        }
      },
    },
  });
}

/** 기존 코드 호환용 별칭 */
export { getSupabaseServer as createSupabaseServer };

/** 자주 쓰는 헬퍼: 현재 로그인 유저 가져오기 */
export async function getUserServer() {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user ?? null, error };
}
