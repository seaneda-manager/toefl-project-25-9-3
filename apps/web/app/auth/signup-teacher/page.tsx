// apps/web/app/auth/signup-teacher/page.tsx
'use client';

import { useState } from 'react';
import { signUpTeacher } from '@/actions/auth';

export default function SignupTeacherPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Teacher Sign Up</h1>

      {/* Use server action; manage pending state locally */}
      <form
        action={async (formData) => {
          setSubmitting(true);
          try {
            await signUpTeacher(formData); // server action handles redirect if any
          } finally {
            setSubmitting(false);
          }
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm mb-1">Email</label>
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
          <label className="block text-sm mb-1">Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="At least 6 characters"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-60"
          aria-busy={submitting}
        >
          {submitting ? 'Creating…' : 'Create teacher account'}
        </button>
      </form>

      <p className="text-sm">
        Already have an account?{' '}
        <a className="underline" href={`/auth/login?email=${encodeURIComponent(email)}`}>
          Log in
        </a>
      </p>
    </div>
  );
}
