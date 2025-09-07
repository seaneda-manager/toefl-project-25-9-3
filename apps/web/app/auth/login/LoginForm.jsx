'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { signIn } from './actions';

const initialState = { ok: true, message: '' };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
    >
      {pending ? '로그인 중…' : '로그인'}
    </button>
  );
}

export default function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useFormState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next || '/learn/toefl/dashboard'} />

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">이메일</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border px-3 py-2"
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">비밀번호</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded-lg border px-3 py-2"
          placeholder="********"
          autoComplete="current-password"
        />
      </div>

      {!state.ok && state.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <SubmitButton />

      <div className="flex items-center justify-between text-sm text-gray-600">
        <a href="/auth/forgot-password" className="underline">비밀번호 재설정</a>
        <a href="/auth/signup" className="underline">회원가입</a>
      </div>
    </form>
  );
}
