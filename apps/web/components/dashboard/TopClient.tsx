// components/dashboard/TopbarClient.tsx
'use client';

import { useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabaseBrowser';

type Props = { email?: string | null };

export default function TopbarClient({ email }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      try {
        await supabase.auth.signOut();
      } finally {
        router.replace('/auth/login');
      }
    });
  };

  return (
    <div className="h-14 px-4 flex items-center gap-3">
      <div className="font-semibold">Dashboard</div>
      <div className="ml-auto flex items-center gap-4 text-sm">
        <span className="text-neutral-500">{email ?? ''}</span>
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg border disabled:opacity-60"
          onClick={handleSignOut}
          disabled={isPending}
          aria-busy={isPending}
          title={isPending ? 'Signing out…' : 'Sign out'}
        >
          {isPending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  );
}
