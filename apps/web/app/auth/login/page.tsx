'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saveId, setSaveId] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const sp = useSearchParams();
  const resetOk = sp.get('reset') === '1';
  const router = useRouter();

  // saved email 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('savedEmail');
    if (saved) {
      setEmail(saved);
      setSaveId(true);
    }
  }, []);

  // 이메일/체크박스 변화 저장
  useEffect(() => {
    if (saveId) localStorage.setItem('savedEmail', email || '');
  }, [email, saveId]);

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
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-3xl font-semibold mb-4">로그인</h1>

        {resetOk && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            비밀번호 변경 완료! 새 비밀번호로 로그인하세요.
          </div>
        )}

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

        {/* 그리드: 좌(이메일/비번), 우(버튼) */}
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
          <input
            name="email"
            type="email"
            placeholder="이메일(아이디)"
            autoComplete="username"
            className="border rounded-lg px-4 py-3 w-full"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (saveId) localStorage.setItem('savedEmail', e.target.value || '');
            }}
          />

          <button
            type="submit"
            style={{ gridRow: '1 / span 2', gridColumn: '2', height: '100%' }}
            className="bg-blue-600 text-white font-semibold rounded-lg px-6 hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

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

        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

        <div className="mt-4 flex items-center gap-2">
          <input
            id="saveId"
            type="checkbox"
            className="accent-blue-600"
            checked={saveId}
            onChange={(e) => {
              const on = e.target.checked;
              setSaveId(on);
              if (!on) localStorage.removeItem('savedEmail');
              else localStorage.setItem('savedEmail', email || '');
            }}
          />
          <label htmlFor="saveId">아이디 저장</label>
        </div>

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
