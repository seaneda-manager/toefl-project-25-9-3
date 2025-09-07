'use client';

import { useState, useTransition } from 'react';
import { signUp } from '@/app/actions/auth';

export default function SignUpPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        className="space-y-4 w-full max-w-sm bg-white p-6 rounded shadow"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);

          startTransition(() => {
            signUp(formData)
              .then((err) => setError(err ?? null))
              .catch((e) => setError(e?.message ?? '회원가입 중 오류가 발생했습니다.'));
          });
        }}
      >
        <h1 className="text-2xl font-bold text-center">회원가입</h1>

        <input
          type="email"
          name="email"
          placeholder="이메일"
          required
          className="w-full border p-2 rounded"
        />

        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          required
          className="w-full border p-2 rounded"
        />

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
        >
          {isPending ? '가입 중…' : '가입하기'}
        </button>

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>
    </div>
  );
}
