// app/actions/auth.ts
'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabaseServer';

export async function signUpStudent(formData: FormData) {
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));

  const supabase = createSupabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: 'student' } }, // user_metadata.role
  });
  if (error) throw new Error(error.message);

  // 이메일 확인을 켜놨다면 세션이 안 생길 수 있으니 안내 페이지로 보냄
  if (!data.session) redirect('/auth/check-email');

  // 세션이 있으면 역할 기반으로 분기
  const role = data.user?.user_metadata?.role;
  if (role === 'teacher') redirect('/teacher/dashboard');
  redirect('/student/home');
}

export async function signUpTeacher(formData: FormData) {
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));

  const supabase = createSupabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: 'teacher' } }, // user_metadata.role
  });
  if (error) throw new Error(error.message);

  if (!data.session) redirect('/auth/check-email');

  const role = data.user?.user_metadata?.role;
  if (role === 'teacher') redirect('/teacher/dashboard');
  redirect('/student/home');
}
