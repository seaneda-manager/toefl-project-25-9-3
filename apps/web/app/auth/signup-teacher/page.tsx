// apps/web/app/auth/signup-teacher/page.tsx
'use client';

import { useState } from 'react';
// 경로 alias 문제 회피: 상대경로로 변경
import { signUpTeacher } from '../../actions/auth';

export default function SignupTeacherPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">교사 회원가입</h1>

      {/* onSubmit으로 로컬 pending 처리 */}
      <form
        action={async (formData) => {
          setSubmitting(true);
          try {
            await signUpTeacher(formData); // 서버 액션 호출 후 내부에서 redirect
          } finally {
            setSubmitting(false);
          }
        }}
        onSubmit={() => setSubmitting(true)}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm mb-1">이메일</label>
          <input
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">비밀번호</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="6자 이상"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-60"
        >
          {submitting ? '계정 생성 중…' : '교사 계정 만들기'}
        </button>
      </form>

      <p className="text-sm">
        이미 계정이 있나요?{' '}
        <a className="underline" href={`/auth/login?email=${encodeURIComponent(email)}`}>
          로그인하기
        </a>
      </p>
    </div>
  );
}
