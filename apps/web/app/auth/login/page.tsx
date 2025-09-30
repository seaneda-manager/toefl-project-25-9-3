'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Role = 'student' | 'teacher';

export default function LoginPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const sp = useSearchParams();

  const presetEmail = sp.get('email') ?? '';
  const [email, setEmail] = useState(presetEmail);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (presetEmail) setEmail(presetEmail);
  }, [presetEmail]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      return;
    }

    startTransition(() => {
      const redirect = role === 'teacher' ? '/(protected)/(teacher)' : '/(protected)/home';
      router.replace(redirect);
    });
  };

  return (
    <div className="mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Login</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        <div className="flex gap-3 items-center">
          <span className="text-sm">Role</span>
          <label className="flex items-center gap-1 text-sm">
            <input type="radio" name="role" value="student"
              checked={role === 'student'} onChange={() => setRole('student')} />
            Student
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input type="radio" name="role" value="teacher"
              checked={role === 'teacher'} onChange={() => setRole('teacher')} />
            Teacher
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={isPending} className="w-full rounded-xl border px-4 py-2">
          {isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="text-sm flex justify-between">
        <Link href="/auth/forgot-password">Forgot password?</Link>
        <Link href="/auth/signup">Create account</Link>
      </div>
    </div>
  );
}

