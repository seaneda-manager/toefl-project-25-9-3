// apps/web/app/auth/login/actions.ts
'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';

export type ActionState = { ok: boolean; message?: string };

export async function signIn(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {  // ✅ void 제거
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/learn/toefl/dashboard');

  if (!email || !password) {
    return { ok: false, message: '이메일과 비밀번호를 입력하세요.' };
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n: string) => cookieStore.get(n)?.value } }
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, message: error.message ?? '로그인에 실패했습니다.' };
  }

  // ✅ 성공 시 서버 사이드 즉시 이동 (redirect는 never 반환 → 타입 OK)
  redirect(next);
}
