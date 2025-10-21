// apps/web/app/auth/login/LoginForm.tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { signInWithPassword } from '@/actions/auth';
import Button from '@/components/ui/Button';

// useFormState가 기대하는 상태: error는 optional string
type FormState = { ok: boolean; error?: string };

const initialState: FormState = { ok: false };

// 서버 액션 래핑: null/undefined에 대해 규격화
async function signInAdapter(_: FormState, formData: FormData): Promise<FormState> {
  const r = await signInWithPassword(formData);
  return r.ok ? { ok: true } : { ok: false, error: r.error ?? 'Unknown error' };
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      title={pending ? 'Signing in…' : 'Sign in'}
    >
      {pending ? 'Signing in…' : 'Sign in'}
    </Button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useFormState<FormState, FormData>(signInAdapter, initialState);

  return (
    <form action={formAction} className="space-y-4 max-w-sm">
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm text-gray-700">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500"
          autoComplete="email"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm text-gray-700">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500"
          autoComplete="current-password"
        />
      </div>

      {state.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}
