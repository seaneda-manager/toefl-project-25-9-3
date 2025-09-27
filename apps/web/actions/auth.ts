// apps/web/app/actions/auth.ts
'use server';

import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabaseServer';

export type ActionState = { ok: boolean; error: string | null; redirectTo?: string };

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';
}

/** Email/Password 로그인 */
export async function signInEmailPassword(formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
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
      : String(formDataOrEmail.get('email') ?? '');
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
  const supabase = getSupabaseServer();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null, redirectTo: '/auth/reset-finish' };
}

/** /auth/callback 코드로 세션 교환 */
export async function exchangeCodeForSession(authCode: string): Promise<ActionState> {
  const supabase = getSupabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(authCode);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

/** 회원가입 (공통) */
export async function signUp(
  formData: FormData | { email: string; password: string; role?: string }
): Promise<ActionState> {
  const email =
    typeof formData === 'object' && 'email' in formData
      ? formData.email
      : String((formData as FormData).get('email') ?? '');
  const password =
    typeof formData === 'object' && 'password' in formData
      ? formData.password
      : String((formData as FormData).get('password') ?? '');
  const role =
    typeof formData === 'object' && 'role' in formData
      ? ((formData as any).role as string | undefined)
      : (String((formData as FormData).get('role') ?? '') || undefined);

  const supabase = getSupabaseServer();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: role ? { role } : undefined },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

/** 로그아웃 + (선택) 클라이언트/서버 액션에서 사용 */
export async function signOut(): Promise<ActionState> {
  const supabase = getSupabaseServer();
  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null, redirectTo: '/auth/login' };
}

export async function signOutAction(_: FormData) {
  const res = await signOut();
  redirect(res.redirectTo ?? '/auth/login');
}

/** 교사 회원가입 (role=teacher 고정) */
export async function signUpTeacher(formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  // 공통 signUp 로직 재사용
  const res = await signUp({ email, password, role: 'teacher' });

  if (!res.ok) {
    // 실패 시 페이지에서 에러 메시지 활용 가능
    return res; // { ok:false, error }
  }

  // 성공 시 교사 대시보드로 이동
  redirect('/teacher/dashboard');
}
