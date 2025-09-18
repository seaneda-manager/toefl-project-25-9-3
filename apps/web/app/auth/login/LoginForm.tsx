'use client';

import { useState, useTransition } from 'react';
import { signInEmailPassword } from '@/app/actions/auth';

export default function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4 w-full max-w-sm bg-white p-6 rounded shadow"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        startTransition(() => {
          signInEmailPassword(formData)
            .then((err) => setError(err ?? null))
            .catch((e) => setError(e?.message ?? '濡쒓렇??以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.'));
        });
      }}
    >
      <h1 className="text-2xl font-bold text-center">濡쒓렇??/h1>

      <input
        type="email"
        name="email"
        placeholder="?대찓??
        required
        className="w-full border p-2 rounded"
      />

      <input
        type="password"
        name="password"
        placeholder="鍮꾨?踰덊샇"
        required
        className="w-full border p-2 rounded"
      />

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
      >
        {isPending ? '濡쒓렇??以묅? : '濡쒓렇??}
      </button>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  );
}
