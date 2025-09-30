/* 풀: apps/web/actions/auth.ts */
'use server';

import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabaseServer';

export type ActionState = {
  ok: boolean;
  error: string | null;
  redirectTo?: string;
};

// Supabase Session 타입 재노출(필요 시 import 없이 사용 가능)
export type Session = import('@supabase/supabase-js').Session;

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';
}

/** 현재 세션 조회 (서버 컴포넌트/서버 액션에서 사용) */
export async function getSession(): Promise<Session | null> {
  const supabase = getSupabaseServer();
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

/** Email/Password 로그인 */
export async function signInEmailPassword(formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { ok: false, error: 'Email and password are required.' };

  const supabase = getSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };

  return { ok: true, error: null };
}

/** 비밀번호 재설정 메일 전송 */
export async function sendReset(formDataOrEmail: FormData | string): Promise<ActionState> {
  const email =
    typeof formDataOrEmail === 'string'
      ? formDataOrEmail
      : String(formDataOrEmail.get('email') ?? '').trim();

  if (!email) return { ok: false, error: 'Email is required.' };

  const supabase = getSupabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth/reset-finish`,
  });
  if (error) return { ok: false, error: error.message };

  return {
    ok: true,
    error: null,
    redirectTo: `/auth/login?m=reset-sent&email=${encodeURIComponent(email)}`,
  };
}

/** 새 비밀번호 설정 */
export async function updatePassword(formData: FormData): Promise<ActionState> {
  const password = String(formData.get('password') ?? '');
  if (!password || password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters.' };
  }
  const supabase = getSupabaseServer();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null, redirectTo: '/auth/reset-finish' };
}

/** /auth/callback: 코드로 세션 교환 */
export async function exchangeCodeForSession(authCode: string): Promise<ActionState> {
  if (!authCode) return { ok: false, error: 'Missing auth code.' };
  const supabase = getSupabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(authCode);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

/** 회원가입(공통) — 페이지에서 필요 시 redirect 처리 */
export async function signUp(
  formData: FormData | { email: string; password: string; role?: string }
): Promise<ActionState> {
  const email =
    typeof formData === 'object' && 'email' in formData
      ? formData.email
      : String((formData as FormData).get('email') ?? '').trim();

  const password =
    typeof formData === 'object' && 'password' in formData
      ? formData.password
      : String((formData as FormData).get('password') ?? '');

  const role =
    typeof formData === 'object' && 'role' in formData
      ? (formData as any).role as string | undefined
      : (String((formData as FormData).get('role') ?? '') || undefined);

  if (!email || !password) return { ok: false, error: 'Email and password are required.' };

  const supabase = getSupabaseServer();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: role ? { role } : undefined },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

/** 교사 회원가입 (role=teacher 고정) — redirect는 페이지에서 */
export async function signUpTeacher(formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { ok: false, error: 'Email and password are required.' };

  return await signUp({ email, password, role: 'teacher' });
}

/** 로그아웃 */
export async function signOut(): Promise<ActionState> {
  const supabase = getSupabaseServer();
  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null, redirectTo: '/auth/login' };
}

/** 서버 액션용 즉시 리다이렉트 핸들러 (선택) */
export async function signOutAction(_: FormData) {
  const res = await signOut();
  redirect(res.redirectTo ?? '/auth/login');
}

// (호환 필요하면 아래도 가능)
// export { signOut as signOutAction };

