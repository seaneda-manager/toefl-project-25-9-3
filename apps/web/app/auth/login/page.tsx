/* apps/web/app/auth/login/page.tsx */
'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabaseBrowser';
import PlasmicLoginForm from '@/components/plasmic/PlasmicLoginForm';

type Role = 'student' | 'teacher' | 'admin';

/** 라우트 그룹 제거 + 외부 URL 차단 + /auth 가드 */
function normalizeClientPath(raw?: string | null) {
  let s = (typeof raw === 'string' ? raw : '') || '';
  try { s = decodeURIComponent(s); } catch {}
  s = s.trim();
  if (!s || s.includes('://')) return '/home';
  if (!s.startsWith('/')) s = `/${s}`;
  const groupHead = /^\/\([^/]+\)(?=\/|$)/;
  while (groupHead.test(s)) {
    s = s.replace(groupHead, '');
    if (!s) break;
  }
  if (s === '' || s === '/' || s.startsWith('/auth')) return '/home';
  return s;
}

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const supabase = useMemo(() => createSupabaseBrowser(), []);

  // URL params
  const presetEmail = sp.get('email') ?? '';
  const nextFromQuery = sp.get('next'); // 있으면 우선

  // UI state
  const [email, setEmail] = useState(presetEmail);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('student'); // 현재는 리다이렉트에 사용 안 함(요청: 일단 /home)
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 이메일 프리셋/기억하기
  useEffect(() => {
    if (presetEmail) {
      setEmail(presetEmail);
      setRemember(true);
      return;
    }
    try {
      const saved = localStorage.getItem('rememberId');
      if (saved) {
        setEmail(saved);
        setRemember(true);
      }
    } catch {}
  }, [presetEmail]);

  const onSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault?.();
      if (isPending) return;

      setError(null);

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message || 'Login failed');
        return;
      }

      try {
        if (remember) localStorage.setItem('rememberId', email);
        else localStorage.removeItem('rememberId');
      } catch {}

      // ? 요청사항: 일단 /home으로. 단, ?next가 있으면 우선 적용.
      const target = normalizeClientPath(nextFromQuery ?? '/home');

      startTransition(() => {
        router.replace(target);
      });
    },
    [email, password, remember, router, supabase, isPending, nextFromQuery]
  );

  return (
    <div className="pb-10">
      {/* 프리젠테이션은 Plasmic 컴포넌트에서 처리 */}
      <PlasmicLoginForm
        email={email}
        password={password}
        remember={remember}
        loading={isPending}
        error={error}
        onChangeEmail={setEmail}
        onChangePassword={setPassword}
        onToggleRemember={setRemember}
        onSubmit={onSubmit}
        onFindId={() => router.push('/auth/find-id')}
        onForgotPw={() => router.push('/auth/forgot-password')}
      />

      {/* Role selector & extra links */}
      <div className="mx-auto max-w-[960px] px-4 mt-4">
        <div className="rounded-2xl border border-neutral-200/20 bg-white/5 p-4 text-sm flex flex-wrap items-center gap-4">
          <span className="opacity-80">Role</span>

          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="role"
              value="student"
              checked={role === 'student'}
              onChange={() => setRole('student')}
            />
            <span>Student</span>
          </label>

          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="role"
              value="teacher"
              checked={role === 'teacher'}
              onChange={() => setRole('teacher')}
            />
            <span>Teacher</span>
          </label>

          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="role"
              value="admin"
              checked={role === 'admin'}
              onChange={() => setRole('admin')}
            />
            <span>Admin</span>
          </label>

          <div className="ml-auto flex items-center gap-4">
            <Link className="underline underline-offset-4" href="/auth/forgot-password">
              Forgot password?
            </Link>
            <Link className="underline underline-offset-4" href="/auth/signup">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
