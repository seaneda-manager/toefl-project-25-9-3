// apps/web/components/auth/LoginForm.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LoginForm() {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [rememberId, setRememberId] = useState(false);
  const [loading, setLoading] = useState(false);

  // 저장된 아이디 자동 채우기
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kp.rememberId');
      const savedId = localStorage.getItem('kp.savedId');
      if (saved === '1' && savedId) {
        setRememberId(true);
        setId(savedId);
      }
    } catch {
      // localStorage 접근 불가 시 무시
    }
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      // 아이디 저장/삭제
      if (rememberId) {
        localStorage.setItem('kp.rememberId', '1');
        localStorage.setItem('kp.savedId', id);
      } else {
        localStorage.removeItem('kp.rememberId');
        localStorage.removeItem('kp.savedId');
      }

      // TODO: 실제 로그인 처리 (예: supabase.auth.signInWithPassword)
      await new Promise((r) => setTimeout(r, 600));
      alert(`로그인 시도\nID: ${id}\nPW: ${'*'.repeat(pw.length)}`);
    } catch (err) {
      console.error(err);
      alert('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="inline-block">
      {/* 
        레이아웃 2열
        - 1열: 입력영역(고정 320px)
        - 2열: 버튼(세로로 길게)
      */}
      <div className="grid grid-cols-[320px_minmax(140px,1fr)] items-stretch gap-3">
        {/* 아이디 */}
        <div className="col-start-1">
          <label className="sr-only" htmlFor="login-id">
            아이디
          </label>
          <input
            id="login-id"
            type="text"
            inputMode="email"
            autoComplete="username"
            placeholder="아이디 또는 이메일"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="h-12 w-[320px] rounded-xl border px-4 text-[15px]
                       placeholder:text-neutral-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* 로그인 버튼 (오른쪽 열 전체 높이) */}
        <div className="col-start-2 row-span-2">
          <button
            type="submit"
            disabled={loading}
            className="h-full min-h-[102px] w-full rounded-xl border
                       bg-blue-600 text-white font-semibold
                       hover:bg-blue-600/90 active:scale-[0.99]
                       disabled:opacity-60 disabled:cursor-not-allowed
                       transition"
            aria-busy={loading}
            title={loading ? '로그인 중…' : '로그인'}
          >
            {loading ? '로그인 중…' : '로그인'}
          </button>
        </div>

        {/* 비밀번호 */}
        <div className="col-start-1">
          <label className="sr-only" htmlFor="login-pw">
            비밀번호
          </label>
          <input
            id="login-pw"
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="h-12 w-[320px] rounded-xl border px-4 text-[15px]
                       placeholder:text-neutral-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* 옵션/링크 줄 */}
        <div
          className="col-start-1 col-span-2 row-start-3 mt-1
                     flex flex-nowrap items-center gap-4
                     text-sm text-neutral-600 whitespace-nowrap"
        >
          <label className="inline-flex items-center gap-2 shrink-0 select-none">
            <input
              type="checkbox"
              checked={rememberId}
              onChange={(e) => setRememberId(e.target.checked)}
              className="accent-blue-600"
            />
            아이디 저장
          </label>

          <div className="flex flex-nowrap items-center gap-4 shrink-0">
            <Link
              href="#"
              className="underline-offset-2 hover:underline whitespace-nowrap"
              onClick={(e) => {
                e.preventDefault();
                alert('아이디 찾기 페이지 연결 예정');
              }}
            >
              아이디 찾기
            </Link>
            <Link
              href="#"
              className="underline-offset-2 hover:underline whitespace-nowrap"
              onClick={(e) => {
                e.preventDefault();
                alert('비밀번호 찾기 페이지 연결 예정');
              }}
            >
              비밀번호 찾기
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
