'use server';

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Supabase 서버 클라이언트
function getSupabaseServer() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // @ts-ignore
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // @ts-ignore
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

// 회원가입
export async function signUp(formData: FormData): Promise<string | null> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '').trim();

  if (!email || !password) return '이메일/비밀번호를 입력해주세요.';

  const supabase = getSupabaseServer();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    // 필요시 이메일 확인 후 이동 경로 설정
    // options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  });

  if (error) return error.message;
  return null;
}

// 이메일/비번 로그인
export async function signInEmailPassword(formData: FormData): Promise<string | null> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '').trim();

  if (!email || !password) return '이메일/비밀번호를 입력해주세요.';

  const supabase = getSupabaseServer();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return error.message;
  return null;
}

// 필요시 로그아웃도 제공
export async function signOut(): Promise<string | null> {
  const supabase = getSupabaseServer();
  const { error } = await supabase.auth.signOut();
  if (error) return error.message;
  return null;
}
