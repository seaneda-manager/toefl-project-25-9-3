'use client';

import { useState } from 'react';

type Role = 'student' | 'teacher' | 'admin';

export default function LoginForm() {
  const [role, setRole] = useState<Role>('student');
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [rememberId, setRememberId] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const titleByRole: Record<Role, string> = {
    student: 'Student Login',
    teacher: 'Teacher Login',
    admin: 'Admin Login',
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      // TODO: 실제 로그인 로직 연결 (Supabase/NextAuth 등)
      console.log('LOGIN', { role, id, pw, rememberId });
      setMsg('✅ 로그인 시도 (mock). 인증 로직 연결하세요.');
    } catch (err: any) {
      setMsg(err?.message ?? '로그인 실패');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6">
      {/* 상단: 좌측 상단 큰 한글 "로그인" */}
      <div className="mb-6 flex items-end justify-between">
        <div className="text-3xl font-bold">로그인</div>

        {/* 역할 전환 스위치 (작은 버튼) */}
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`rounded border px-3 py-1 ${role === 'student' ? 'bg-white/10' : ''}`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setRole('teacher')}
            className={`rounded border px-3 py-1 ${role === 'teacher' ? 'bg-white/10' : ''}`}
          >
            Teacher
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`rounded border px-3 py-1 ${role === 'admin' ? 'bg-white/10' : ''}`}
          >
            Admin
          </button>
        </div>
      </div>

      {/* 중앙 타이틀 */}
      <h2 className="mb-4 text-center text-2xl font-semibold">{titleByRole[role]}</h2>

      {/* 폼 */}
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <label className="block text-sm opacity-80">
            아이디
            <input
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 outline-none focus:border-white/30"
              placeholder="your-id@example.com"
              autoComplete="username"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
            />
          </label>

          <label className="block text-sm opacity-80">
            비밀번호
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 outline-none focus:border-white/30"
              placeholder="••••••••"
              autoComplete="current-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="flex items-end md:items-center">
          <button
            type="submit"
            disabled={loading}
            className="h-[42px] w-full rounded-xl border border-white/20 bg-white/10 px-4 font-semibold hover:bg-white/20 disabled:opacity-50 md:h-[74px]"
          >
            {loading ? '확인 중…' : '확인'}
          </button>
        </div>

        {/* 아래 줄: Teacher/Admin 빠른 전환, 아이디 고정 + 분실 링크 */}
        <div className="col-span-full mt-2 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={rememberId}
                onChange={(e) => setRememberId(e.target.checked)}
              />
              아이디 고정
            </label>

            <a href="/help/forgot-id" className="opacity-80 hover:underline">
              아이디 분실
            </a>
            <span className="opacity-30">|</span>
            <a href="/help/forgot-password" className="opacity-80 hover:underline">
              암호 분실
            </a>
          </div>

          <div className="flex items-center gap-2">
            <span className="opacity-60">다른 역할로 로그인:</span>
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className="rounded border px-2 py-1 text-xs hover:bg-white/10"
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              className="rounded border px-2 py-1 text-xs hover:bg-white/10"
            >
              Admin
            </button>
          </div>
        </div>
      </form>

      {/* 메시지 */}
      {msg && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
          {msg}
        </div>
      )}
    </div>
  );
}
