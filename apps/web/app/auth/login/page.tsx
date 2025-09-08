'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErr('이메일을 올바르게 입력해주세요.');
      return;
    }
    if (!password) {
      setErr('비밀번호를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // TODO: role에 따라 라우팅 분기 가능
      router.push('/');
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ✅ 화면 전체를 100vh로, 중앙 정렬
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-3xl font-semibold mb-6">로그인</h1>

        {/* 학생 / 선생님 */}
        <div className="flex items-center gap-6 mb-5">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              className="accent-blue-600"
              checked={role === 'student'}
              onChange={() => setRole('student')}
            />
            <span>학생</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              className="accent-blue-600"
              checked={role === 'teacher'}
              onChange={() => setRole('teacher')}
            />
            <span>선생님</span>
          </label>
        </div>

        {/* ✅ 그리드: 좌(이메일/비번), 우(버튼) */}
        <form
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 150px',
            gridTemplateRows: 'auto auto',
            gap: '12px',
            alignItems: 'stretch',
          }}
          onSubmit={onSubmit}
        >
          {/* 이메일 */}
          <input
            name="email"
            type="email"
            placeholder="이메일(아이디)"
            autoComplete="username"
            className="border rounded-lg px-4 py-3 w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* 로그인 버튼 (2칸 높이 유지) */}
          <button
            type="submit"
            style={{ gridRow: '1 / span 2', gridColumn: '2', height: '100%' }}
            className="bg-blue-600 text-white font-semibold rounded-lg px-6 hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          {/* 비밀번호 */}
          <input
            name="password"
            type="password"
            placeholder="비밀번호"
            autoComplete="current-password"
            className="border rounded-lg px-4 py-3 w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </form>

        {/* 에러 메시지 */}
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

        {/* 아이디 저장 (UI만) */}
        <div className="mt-4 flex items-center gap-2">
          <input id="saveId" type="checkbox" className="accent-blue-600" />
          <label htmlFor="saveId">아이디 저장</label>
        </div>

        {/* 하단 링크 */}
        <div className="mt-6 text-gray-600 flex gap-3 text-sm">
          <a href="#" className="hover:underline">아이디 찾기</a><span>|</span>
          <Link href="/auth/forgot-password" className="hover:underline">
            비밀번호 재설정
          </Link><span>|</span>
          <a href="#" className="hover:underline">회원가입</a>
        </div>
      </div>
    </div>
  );
}
