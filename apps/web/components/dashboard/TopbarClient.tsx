// components/dashboard/TopbarClient.tsx
'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabaseBrowser';

type Props = {
  /** ?쒕쾭?먯꽌 ?대찓?쇱쓣 ?섍꺼二쇨퀬, ?놁쑝硫??대씪?먯꽌 議고쉶 */
  email?: string;
};

export default function TopbarClient({ email: initialEmail }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState<string>(initialEmail ?? '');

  // ?쒕쾭媛 ?대찓?쇱쓣 ???섍꺼以щ떎硫??대씪?먯꽌 議고쉶
  useEffect(() => {
    if (initialEmail) return;
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) setEmail(data.user?.email ?? '');
    })();
    return () => {
      mounted = false;
    };
  }, [initialEmail, supabase]);

  const handleSignOut = () => {
    startTransition(async () => {
      await supabase.auth.signOut();
      router.replace('/auth/login');
    });
  };

  return (
    <div className="flex h-14 items-center gap-3 border-b px-4">
      <div className="font-semibold">Dashboard</div>
      <div className="ml-auto flex items-center gap-4 text-sm">
        <span className="text-neutral-500">{email || '??}</span>
        <button
          type="button"
          className="rounded-lg border px-3 py-1.5 disabled:opacity-60"
          onClick={handleSignOut}
          disabled={isPending}
          aria-busy={isPending || undefined}
        >
          {isPending ? 'Signing out?? : 'Sign out'}
        </button>
      </div>
    </div>
  );
}


